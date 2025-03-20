function considerNeighborFile(languageId, neighborLanguageId) {
  return normalizeLanguageId(languageId) === normalizeLanguageId(neighborLanguageId);
},__name(considerNeighborFile, "considerNeighborFile");

,var _NeighborSource = class _NeighborSource {
  static defaultEmptyResult() {
    return {
      docs: new Map(),
      neighborSource: new Map(),
      traits: []
    };
  }
  static reset() {
    _NeighborSource.instance = void 0;
  }
  static async getNeighborFilesAndTraits(ctx, uri, fileType, telemetryData, cancellationToken, data, forceRelatedFilesComputation) {
    let docManager = ctx.get(TextDocumentManager);
    _NeighborSource.instance === void 0 && (_NeighborSource.instance = new OpenTabFiles(docManager));
    let excludeOpenTabFiles = isExcludeOpenTabFilesActive(ctx, fileType, telemetryData),
      fallbackToOpenTabFiles = isFallbackToOpenTabFilesActive(ctx, telemetryData),
      resultWhenNoRelatedFiles = !excludeOpenTabFiles || fallbackToOpenTabFiles ? {
        ...(await _NeighborSource.instance.getNeighborFiles(uri, fileType, _NeighborSource.MAX_NEIGHBOR_FILES)),
        traits: []
      } : _NeighborSource.defaultEmptyResult(),
      doc = await docManager.getTextDocument({
        uri: uri
      });
    if (!doc) return relatedFilesLogger.debug(ctx, "neighborFiles.getNeighborFilesAndTraits", `Failed to get the related files: failed to get the document ${uri}`), resultWhenNoRelatedFiles;
    let wksFolder = await docManager.getWorkspaceFolder(doc);
    if (!wksFolder) return relatedFilesLogger.debug(ctx, "neighborFiles.getNeighborFilesAndTraits", `Failed to get the related files: ${uri} is not under the workspace folder`), resultWhenNoRelatedFiles;
    let relatedFiles = await getRelatedFilesAndTraits(ctx, doc, telemetryData, cancellationToken, data, forceRelatedFilesComputation);
    if (relatedFiles.entries.size === 0) return relatedFilesLogger.debug(ctx, "neighborFiles.getNeighborFilesAndTraits", `0 related files found for ${uri}`), resultWhenNoRelatedFiles.traits.push(...relatedFiles.traits), resultWhenNoRelatedFiles;
    let finalResult = excludeOpenTabFiles ? _NeighborSource.defaultEmptyResult() : resultWhenNoRelatedFiles;
    return relatedFiles.entries.forEach((uriToContentMap, type) => {
      let addedDocs = [];
      uriToContentMap.forEach((source, uri) => {
        let relativePath = _NeighborSource.getRelativePath(uri, wksFolder.uri);
        if (!relativePath || finalResult.docs.has(uri)) return;
        let relatedFileDocInfo = {
          relativePath: relativePath,
          uri: uri,
          source: source
        };
        addedDocs.unshift(relatedFileDocInfo), finalResult.docs.set(uri, relatedFileDocInfo);
      }), addedDocs.length > 0 && finalResult.neighborSource.set(type, addedDocs.map(doc => doc.uri.toString()));
    }), finalResult.traits.push(...relatedFiles.traits), finalResult;
  }
  static basename(uri) {
    return decodeURIComponent(uri.replace(/[#?].*$/, "").replace(/^.*[/:]/, ""));
  }
  static getRelativePath(fileUri, baseUri) {
    let parentURI = baseUri.toString().replace(/[#?].*/, "").replace(/\/?$/, "/");
    return fileUri.toString().startsWith(parentURI) ? fileUri.toString().slice(parentURI.length) : _NeighborSource.basename(fileUri);
  }
};

,__name(_NeighborSource, "NeighborSource"), _NeighborSource.MAX_NEIGHBOR_AGGREGATE_LENGTH = 2e5, _NeighborSource.MAX_NEIGHBOR_FILES = 20, _NeighborSource.EXCLUDED_NEIGHBORS = ["node_modules", "dist", "site-packages"];

,var NeighborSource = _NeighborSource,
  cppLanguageIds = ["cpp", "c"],
  typescriptLanguageIds = ["typescript", "javascript", "typescriptreact", "javascriptreact"],
  csharpLanguageIds = ["csharp"];

,function isExcludeOpenTabFilesCSharpActive(ctx, telemetryData) {
  return ctx.get(Features).excludeOpenTabFilesCSharp(telemetryData) || getConfig(ctx, ConfigKey.ExcludeOpenTabFilesCSharp);
},__name(isExcludeOpenTabFilesCSharpActive, "isExcludeOpenTabFilesCSharpActive");

,function isExcludeOpenTabFilesCppActive(ctx, telemetryData) {
  return ctx.get(Features).excludeOpenTabFilesCpp(telemetryData) || getConfig(ctx, ConfigKey.ExcludeOpenTabFilesCpp);
},__name(isExcludeOpenTabFilesCppActive, "isExcludeOpenTabFilesCppActive");

,function isExcludeOpenTabFilesTypeScriptActive(ctx, telemetryData) {
  return ctx.get(Features).excludeOpenTabFilesTypeScript(telemetryData) || getConfig(ctx, ConfigKey.ExcludeOpenTabFilesTypeScript);
},__name(isExcludeOpenTabFilesTypeScriptActive, "isExcludeOpenTabFilesTypeScriptActive");

,function isFallbackToOpenTabFilesActive(ctx, telemetryData) {
  return ctx.get(Features).fallbackToOpenTabFilesWithNoRelatedFiles(telemetryData) || getConfig(ctx, ConfigKey.FallbackToOpenTabFilesWithNoRelatedFiles);
},__name(isFallbackToOpenTabFilesActive, "isFallbackToOpenTabFilesActive");

,var excludeOpenTabsFilesLanguageIdMap = new Map([...cppLanguageIds.map(id => [id, isExcludeOpenTabFilesCppActive]), ...typescriptLanguageIds.map(id => [id, isExcludeOpenTabFilesTypeScriptActive]), ...csharpLanguageIds.map(id => [id, isExcludeOpenTabFilesCSharpActive])]);

,function isExcludeOpenTabFilesActive(ctx, languageId, telemetryData) {
  let check = excludeOpenTabsFilesLanguageIdMap.get(languageId);
  return check ? check(ctx, telemetryData) : !1;
},__name(isExcludeOpenTabFilesActive, "isExcludeOpenTabFilesActive");