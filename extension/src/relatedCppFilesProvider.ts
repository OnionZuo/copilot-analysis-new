var vscode = fn(require("vscode"));

,var _RelatedCppFilesProvider = class _RelatedCppFilesProvider extends CompositeRelatedFilesProvider {
  constructor(context) {
    super(context);
    for (let languageId of cppLanguageIds) this.registerRelatedFilesProvider(_RelatedCppFilesProvider.extensionId, languageId, async () => {
      let headers;
      try {
        headers = await XU.commands.executeCommand(_RelatedCppFilesProvider.getIncludesCommand, 1);
      } catch {}
      if (!headers) return {
        entries: []
      };
      let uris = headers.includedFiles.map(f => factory_exports.file(f).toString());
      return {
        entries: [{
          type: "related/cpp",
          uris: uris
        }]
      };
    });
  }
  isActive(languageId, telemetryData) {
    return cppLanguageIds.includes(languageId) ? this.context.get(Features).cppHeaders(telemetryData) || getConfig(this.context, ConfigKey.DebugOverrideCppHeaders) : super.isActive(languageId, telemetryData);
  }
  relatedFilesTelemetry(telemetryData) {
    var _a;
    try {
      if (this.telemetrySent) return;
      this.telemetrySent = !0;
      let packageJSON = (_a = XU.extensions.getExtension(_RelatedCppFilesProvider.extensionId)) == null ? void 0 : _a.packageJSON;
      if (!packageJSON || typeof packageJSON != "object" || !("version" in packageJSON) || typeof packageJSON.version != "string") return;
      let [major, minor] = packageJSON.version.split(".").map(Number);
      (major == 1 && minor >= 20 || major >= 2) && telemetry(this.context, "relatedCppFiles.cppTools_v1_20_plus", telemetryData);
    } catch (e) {
      exception(this.context, e, "relatedCppFiles", relatedFilesLogger);
    }
  }
  relatedFileNonresponseTelemetry(language, telemetryData) {
    telemetry(this.context, `getRelatedFileResponse.${_RelatedCppFilesProvider.getIncludesCommand}.notFound`, telemetryData);
  }
  performanceTelemetry(duration, telemetryData) {
    let telemetryDataExt = telemetryData.extendedBy({}, {
      time_taken: duration
    });
    telemetry(this.context, "relatedCppFiles.performance", telemetryDataExt);
  }
};

,__name(_RelatedCppFilesProvider, "RelatedCppFilesProvider"), _RelatedCppFilesProvider.extensionId = "ms-vscode.cpptools", _RelatedCppFilesProvider.getIncludesCommand = "C_Cpp.getIncludes";

,var RelatedCppFilesProvider = _RelatedCppFilesProvider;