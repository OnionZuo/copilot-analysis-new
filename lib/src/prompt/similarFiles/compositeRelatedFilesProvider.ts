var cppLanguageIds = ["cpp", "c", "cuda-cpp"],
  typescriptLanguageIds = ["typescript", "javascript", "typescriptreact", "javascriptreact"],
  csharpLanguageIds = ["csharp"],
  neighborFileTypeMap = new Map([...cppLanguageIds.map(id => [id, "related/cpp"]), ...typescriptLanguageIds.map(id => [id, "related/typescript"]), ...csharpLanguageIds.map(id => [id, "related/csharproslyn"])]);

,function getNeighboringFileType(languageId) {
  var _a;
  return (_a = neighborFileTypeMap.get(languageId)) != null ? _a : "related/other";
},__name(getNeighboringFileType, "getNeighboringFileType");

,var _CompositeRelatedFilesProvider = class _CompositeRelatedFilesProvider extends RelatedFilesProvider {
  constructor(context) {
    super(context);
    this.providers = new Map();
    this.telemetrySent = !1;
    this.reportedUnknownProviders = new Set();
  }
  async getRelatedFilesResponse(docInfo, telemetryData, cancellationToken) {
    let startTime = Date.now(),
      languageId = docInfo.clientLanguageId.toLowerCase();
    if (getNeighboringFileType(languageId) === "related/other" && !this.reportedUnknownProviders.has(languageId) && (this.reportedUnknownProviders.add(languageId), relatedFilesLogger.warn(this.context, `unknown language ${languageId}`)), this.relatedFilesTelemetry(telemetryData), relatedFilesLogger.debug(this.context, `Fetching related files for ${docInfo.uri}`), !this.isActive(languageId, telemetryData)) return relatedFilesLogger.debug(this.context, "language-server related-files experiment is not active."), EmptyRelatedFilesResponse;
    let languageProviders = this.providers.get(languageId);
    if (!languageProviders) return EmptyRelatedFilesResponse;
    try {
      return this.convert(docInfo.uri, languageProviders, startTime, telemetryData, cancellationToken);
    } catch {
      return this.relatedFileNonresponseTelemetry(languageId, telemetryData), null;
    }
  }
  async convert(uri, providers, startTime, telemetryData, token) {
    token || (token = {
      isCancellationRequested: !1,
      onCancellationRequested: __name(() => ({
        dispose() {}
      }), "onCancellationRequested")
    });
    let combined = {
      entries: [],
      traits: []
    };
    for (let provider of providers.values()) {
      let flags = ["c", "cpp", "cuda-cpp"].includes(provider.languageId) ? {
          copilotcppIncludeTraits: this.context.get(Features).cppIncludeTraits(telemetryData),
          copilotcppMsvcCompilerArgumentFilter: this.context.get(Features).cppMsvcCompilerArgumentFilter(telemetryData),
          copilotcppClangCompilerArgumentFilter: this.context.get(Features).cppClangCompilerArgumentFilter(telemetryData),
          copilotcppGccCompilerArgumentFilter: this.context.get(Features).cppGccCompilerArgumentFilter(telemetryData),
          copilotcppCompilerArgumentDirectAskMap: this.context.get(Features).cppCompilerArgumentDirectAskMap(telemetryData)
        } : {},
        response = await provider.callback(uri, {
          flags: flags
        }, token);
      combined.entries.push(...response.entries), response.traits && combined.traits.push(...response.traits);
      for (let entry of response.entries) for (let uri of entry.uris) relatedFilesLogger.debug(this.context, uri.toString());
    }
    return this.performanceTelemetry(Date.now() - startTime, telemetryData), combined;
  }
  registerRelatedFilesProvider(extensionId, languageId, provider) {
    let languageProvider = this.providers.get(languageId);
    languageProvider ? languageProvider.set(extensionId, {
      extensionId: extensionId,
      languageId: languageId,
      callback: provider
    }) : this.providers.set(languageId, new Map([[extensionId, {
      extensionId: extensionId,
      languageId: languageId,
      callback: provider
    }]]));
  }
  unregisterRelatedFilesProvider(extensionId, languageId, callback) {
    let languageProvider = this.providers.get(languageId);
    if (languageProvider) {
      let currentProvider = languageProvider.get(extensionId);
      currentProvider && currentProvider.callback === callback && languageProvider.delete(extensionId);
    }
  }
  isActive(languageId, telemetryData) {
    return csharpLanguageIds.includes(languageId) ? this.context.get(Features).relatedFilesVSCodeCSharp(telemetryData) || getConfig(this.context, ConfigKey.RelatedFilesVSCodeCSharp) : typescriptLanguageIds.includes(languageId) ? this.context.get(Features).relatedFilesVSCodeTypeScript(telemetryData) || getConfig(this.context, ConfigKey.RelatedFilesVSCodeTypeScript) : cppLanguageIds.includes(languageId) ? !0 : this.context.get(Features).relatedFilesVSCode(telemetryData) || getConfig(this.context, ConfigKey.RelatedFilesVSCode);
  }
  relatedFilesTelemetry(telemetryData) {}
  relatedFileNonresponseTelemetry(language, telemetryData) {}
  performanceTelemetry(duration, telemetryData) {}
};

,__name(_CompositeRelatedFilesProvider, "CompositeRelatedFilesProvider");

,var CompositeRelatedFilesProvider = _CompositeRelatedFilesProvider;