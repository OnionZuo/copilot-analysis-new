var EmptyRelatedFilesResponse = {
    entries: [],
    traits: []
  },
  EmptyRelatedFiles = {
    entries: new Map(),
    traits: []
  },
  _LRUExpirationCacheMap = class _LRUExpirationCacheMap extends LRUCacheMap {
    constructor(size, defaultEvictionTimeMs = 2 * 60 * 1e3) {
      super(size);
      this.defaultEvictionTimeMs = defaultEvictionTimeMs;
      this._cacheTimestamps = new Map();
    }
    bumpRetryCount(key) {
      let ts = this._cacheTimestamps.get(key);
      return ts ? ++ts.retryCount : (this._cacheTimestamps.set(key, {
        timestamp: Date.now(),
        retryCount: 0
      }), 0);
    }
    has(key) {
      return this.isValid(key) ? super.has(key) : (this.deleteExpiredEntry(key), !1);
    }
    get(key) {
      let entry = super.get(key);
      if (this.isValid(key)) return entry;
      this.deleteExpiredEntry(key);
    }
    set(key, value) {
      let ret = super.set(key, value);
      return this.isValid(key) || this._cacheTimestamps.set(key, {
        timestamp: Date.now(),
        retryCount: 0
      }), ret;
    }
    clear() {
      super.clear(), this._cacheTimestamps.clear();
    }
    isValid(key) {
      let ts = this._cacheTimestamps.get(key);
      return ts !== void 0 && Date.now() - ts.timestamp < this.defaultEvictionTimeMs;
    }
    deleteExpiredEntry(key) {
      this._cacheTimestamps.has(key) && this._cacheTimestamps.delete(key), super.deleteKey(key);
    }
  };

,__name(_LRUExpirationCacheMap, "LRUExpirationCacheMap");

,var LRUExpirationCacheMap = _LRUExpirationCacheMap,
  relatedFilesLogger = new Logger("relatedFiles"),
  lruCacheSize = 1e3,
  _RelatedFilesProviderFailure = class _RelatedFilesProviderFailure extends Error {
    constructor() {
      super("The provider failed providing the list of relatedFiles");
    }
  };

,__name(_RelatedFilesProviderFailure, "RelatedFilesProviderFailure");

,var RelatedFilesProviderFailure = _RelatedFilesProviderFailure,
  _RelatedFilesProvider = class _RelatedFilesProvider {
    constructor(context) {
      this.context = context;
    }
    async getRelatedFiles(docInfo, telemetryData, cancellationToken) {
      var _a;
      let response = await this.getRelatedFilesResponse(docInfo, telemetryData, cancellationToken);
      if (response === null) return null;
      let result = {
        entries: new Map(),
        traits: (_a = response.traits) != null ? _a : []
      };
      for (let entry of response.entries) {
        let uriToContentMap = result.entries.get(entry.type);
        uriToContentMap || (uriToContentMap = new Map(), result.entries.set(entry.type, uriToContentMap));
        for (let uri of entry.uris) try {
          relatedFilesLogger.debug(this.context, `Processing ${uri}`);
          let content = await this.getFileContent(uri);
          if (!content || content.length == 0) {
            relatedFilesLogger.debug(this.context, `Skip ${uri} due to empty content or loading issue.`);
            continue;
          }
          if (await this.isContentExcluded(uri, content)) {
            relatedFilesLogger.debug(this.context, `Skip ${uri} due content exclusion.`);
            continue;
          }
          content = _RelatedFilesProvider.dropBOM(content), uriToContentMap.set(uri, content);
        } catch (e) {
          relatedFilesLogger.warn(this.context, e);
        }
      }
      return result;
    }
    async getFileContent(uri) {
      try {
        return this.context.get(FileSystem).readFileString(factory_exports.parse(uri));
      } catch (e) {
        relatedFilesLogger.debug(this.context, e);
      }
    }
    async isContentExcluded(uri, content) {
      try {
        return (await this.context.get(CopilotContentExclusionManager).evaluate(uri, content)).isBlocked;
      } catch (e) {
        relatedFilesLogger.exception(this.context, e, "isContentExcluded");
      }
      return !0;
    }
    static dropBOM(content) {
      return content.charCodeAt(0) === 65279 ? content.slice(1) : content;
    }
  };

,__name(_RelatedFilesProvider, "RelatedFilesProvider");

,var RelatedFilesProvider = _RelatedFilesProvider,
  defaultMaxRetryCount = 3,
  lruCache = new LRUExpirationCacheMap(lruCacheSize);

,async function getRelatedFiles(ctx, docInfo, telemetryData, cancellationToken, relatedFilesProvider) {
  let startTime = Date.now(),
    result;
  try {
    result = await relatedFilesProvider.getRelatedFiles(docInfo, telemetryData, cancellationToken);
  } catch (error) {
    relatedFilesLogger.exception(ctx, error, ".getRelatedFiles"), result = null;
  }
  result === null && (lruCache.bumpRetryCount(docInfo.uri) >= defaultMaxRetryCount ? result = EmptyRelatedFiles : result = null);
  let elapsedTime = Date.now() - startTime;
  if (relatedFilesLogger.debug(ctx, result !== null ? `Fetched ${[...result.entries.values()].map(value => value.size).reduce((total, current) => total + current, 0)} related files for '${docInfo.uri}' in ${elapsedTime}ms.` : `Failing fetching files for '${docInfo.uri}' in ${elapsedTime}ms.`), result === null) throw new RelatedFilesProviderFailure();
  return result;
},__name(getRelatedFiles, "getRelatedFiles");

,var getRelatedFilesWithCacheAndTimeout = memoize(getRelatedFiles, {
  cache: lruCache,
  hash: __name((ctx, docInfo, telemetryData, cancellationToken, symbolDefinitionProvider) => `${docInfo.uri}`, "hash")
});

,getRelatedFilesWithCacheAndTimeout = shortCircuit(getRelatedFilesWithCacheAndTimeout, 200, EmptyRelatedFiles);

,async function getRelatedFilesAndTraits(ctx, doc, telemetryData, cancellationToken, data, forceComputation = !1) {
  let relatedFilesProvider = ctx.get(RelatedFilesProvider),
    relatedFiles = EmptyRelatedFiles;
  try {
    let docInfo = {
      uri: doc.uri,
      clientLanguageId: doc.clientLanguageId,
      data: data
    };
    relatedFiles = forceComputation ? await getRelatedFiles(ctx, docInfo, telemetryData, cancellationToken, relatedFilesProvider) : await getRelatedFilesWithCacheAndTimeout(ctx, docInfo, telemetryData, cancellationToken, relatedFilesProvider);
  } catch (error) {
    relatedFiles = EmptyRelatedFiles, error instanceof RelatedFilesProviderFailure && telemetry(ctx, "getRelatedFilesList", telemetryData);
  }
  return ReportTraitsTelemetry(ctx, relatedFiles.traits, doc, telemetryData), relatedFilesLogger.debug(ctx, relatedFiles != null ? `Fetched following traits ${relatedFiles.traits.map(trait => `{${trait.name} : ${trait.value}}`).join("")} for '${doc.uri}'` : `Failing fecthing traits for '${doc.uri}'.`), relatedFiles;
},__name(getRelatedFilesAndTraits, "getRelatedFilesAndTraits");

,var traitNamesForTelemetry = new Map([["TargetFrameworks", "targetFrameworks"], ["LanguageVersion", "languageVersion"]]);

,function ReportTraitsTelemetry(ctx, traits, docInfo, telemetryData) {
  if (traits.length > 0) {
    let properties = {};
    properties.detectedLanguageId = docInfo.detectedLanguageId, properties.languageId = docInfo.clientLanguageId;
    for (let trait of traits) {
      let mappedTraitName = traitNamesForTelemetry.get(trait.name);
      mappedTraitName && (properties[mappedTraitName] = trait.value);
    }
    let telemetryDataExt = telemetryData.extendedBy(properties, {});
    return telemetry(ctx, "related.traits", telemetryDataExt);
  }
},__name(ReportTraitsTelemetry, "ReportTraitsTelemetry");