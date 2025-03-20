var ConfigKey = {
  Enable: "enable",
  UserSelectedCompletionModel: "selectedCompletionModel",
  ShowEditorCompletions: "editor.showEditorCompletions",
  EnableAutoCompletions: "editor.enableAutoCompletions",
  DelayCompletions: "editor.delayCompletions",
  FilterCompletions: "editor.filterCompletions",
  FetchStrategy: "fetchStrategy",
  DebugOverrideCppHeaders: "advanced.debug.overrideCppHeaders",
  RelatedFilesVSCodeCSharp: "advanced.relatedFilesVSCodeCSharp",
  RelatedFilesVSCodeTypeScript: "advanced.relatedFilesVSCodeTypeScript",
  RelatedFilesVSCode: "advanced.relatedFilesVSCode",
  ExcludeOpenTabFilesCSharp: "advanced.excludeOpenTabFilesCSharp",
  ExcludeOpenTabFilesCpp: "advanced.excludeOpenTabFilesCpp",
  ExcludeOpenTabFilesTypeScript: "advanced.excludeOpenTabFilesTypeScript",
  FallbackToOpenTabFilesWithNoRelatedFiles: "advanced.fallbackToOpenTabFilesWithNoRelatedFiles",
  ContextProviders: "advanced.contextProviders",
  DebugOverrideLogLevels: "advanced.debug.overrideLogLevels",
  DebugFilterLogCategories: "advanced.debug.filterLogCategories",
  DebugSnippyOverrideUrl: "advanced.debug.codeRefOverrideUrl",
  DebugUseElectronFetcher: "advanced.debug.useElectronFetcher",
  DebugUseEditorFetcher: "advanced.debug.useEditorFetcher",
  UseSubsetMatching: "advanced.useSubsetMatching",
  EnablePromptComponents: "advanced.enablePromptComponents",
  ContextProviderTimeBudget: "advanced.contextProviderTimeBudget",
  DebugOverrideCapiUrl: "internal.capiUrl",
  DebugOverrideCapiUrlLegacy: "advanced.debug.overrideCapiUrl",
  DebugTestOverrideCapiUrl: "internal.capiTestUrl",
  DebugTestOverrideCapiUrlLegacy: "advanced.debug.testOverrideCapiUrl",
  DebugOverrideProxyUrl: "internal.completionsUrl",
  DebugOverrideProxyUrlLegacy: "advanced.debug.overrideProxyUrl",
  DebugTestOverrideProxyUrl: "internal.completionsTestUrl",
  DebugTestOverrideProxyUrlLegacy: "advanced.debug.testOverrideProxyUrl",
  DebugOverrideEngine: "internal.completionModel",
  DebugOverrideEngineLegacy: "advanced.debug.overrideEngine",
  UseAsyncCompletions: "internal.useAsyncCompletions",
  EnableProgressiveReveal: "internal.enableProgressiveReveal",
  EnableSpeculativeRequests: "internal.enableSpeculativeRequests",
  AlwaysRequestMultiline: "internal.alwaysRequestMultiline",
  VSCodeDebounceThreshold: "internal.vscodeDebounceThreshold"
};

,function shouldDoParsingTrimming(blockMode) {
  return ["parsing", "parsingandserver", "moremultiline"].includes(blockMode);
},__name(shouldDoParsingTrimming, "shouldDoParsingTrimming");

,function shouldDoServerTrimming(blockMode) {
  return ["server", "parsingandserver"].includes(blockMode);
},__name(shouldDoServerTrimming, "shouldDoServerTrimming");

,var _BlockModeConfig = class _BlockModeConfig {};

,__name(_BlockModeConfig, "BlockModeConfig");

,var BlockModeConfig = _BlockModeConfig,
  _ConfigBlockModeConfig = class _ConfigBlockModeConfig extends BlockModeConfig {
    async forLanguage(ctx, languageId, telemetryData) {
      let overrideBlockMode = ctx.get(Features).overrideBlockMode(telemetryData);
      if (overrideBlockMode) return toApplicableBlockMode(overrideBlockMode, languageId);
      let config = getConfig(ctx, ConfigKey.AlwaysRequestMultiline);
      return typeof config == "boolean" && config ? toApplicableBlockMode("moremultiline", languageId) : languageId == "ruby" ? "parsing" : isSupportedLanguageId(languageId) ? "parsingandserver" : "server";
    }
  };

,__name(_ConfigBlockModeConfig, "ConfigBlockModeConfig");

,var ConfigBlockModeConfig = _ConfigBlockModeConfig;

,function blockModeRequiresTreeSitter(blockMode) {
  return ["parsing", "parsingandserver", "moremultiline"].includes(blockMode);
},__name(blockModeRequiresTreeSitter, "blockModeRequiresTreeSitter");

,function toApplicableBlockMode(blockMode, languageId) {
  return blockModeRequiresTreeSitter(blockMode) && !isSupportedLanguageId(languageId) ? "server" : blockMode;
},__name(toApplicableBlockMode, "toApplicableBlockMode");

,var _ConfigProvider = class _ConfigProvider {};

,__name(_ConfigProvider, "ConfigProvider");

,var ConfigProvider = _ConfigProvider,
  _DefaultsOnlyConfigProvider = class _DefaultsOnlyConfigProvider extends ConfigProvider {
    getConfig(key) {
      return getConfigDefaultForKey(key);
    }
    getOptionalConfig(key) {
      return getOptionalConfigDefaultForKey(key);
    }
    dumpForTelemetry() {
      return {};
    }
  };

,__name(_DefaultsOnlyConfigProvider, "DefaultsOnlyConfigProvider");

,var DefaultsOnlyConfigProvider = _DefaultsOnlyConfigProvider;

,function isContributesObject(obj) {
  return (obj == null ? void 0 : obj.type) === "object" && "properties" in obj;
},__name(isContributesObject, "isContributesObject");

,function getConfigKeyRecursively(config, key) {
  let value = config,
    prefix = [];
  for (let segment of key.split(".")) {
    let child = [...prefix, segment].join(".");
    value && typeof value == "object" && child in value ? (value = value[child], prefix.length = 0) : prefix.push(segment);
  }
  if (!(value === void 0 || prefix.length > 0)) return value;
},__name(getConfigKeyRecursively, "getConfigKeyRecursively");

,function getConfigDefaultForKey(key) {
  if (configDefaults.has(key)) return configDefaults.get(key);
  throw new Error(`Missing config default value: ${CopilotConfigPrefix}.${key}`);
},__name(getConfigDefaultForKey, "getConfigDefaultForKey");

,function getOptionalConfigDefaultForKey(key) {
  return configDefaults.get(key);
},__name(getOptionalConfigDefaultForKey, "getOptionalConfigDefaultForKey");

,var configDefaults = new Map([[ConfigKey.DebugOverrideCppHeaders, !1], [ConfigKey.RelatedFilesVSCodeCSharp, !1], [ConfigKey.RelatedFilesVSCodeTypeScript, !1], [ConfigKey.RelatedFilesVSCode, !1], [ConfigKey.ExcludeOpenTabFilesCSharp, !1], [ConfigKey.ExcludeOpenTabFilesCpp, !1], [ConfigKey.ExcludeOpenTabFilesTypeScript, !1], [ConfigKey.FallbackToOpenTabFilesWithNoRelatedFiles, !1], [ConfigKey.ContextProviders, []], [ConfigKey.DebugUseEditorFetcher, null], [ConfigKey.DebugUseElectronFetcher, null], [ConfigKey.DebugOverrideLogLevels, {}], [ConfigKey.DebugSnippyOverrideUrl, ""], [ConfigKey.FetchStrategy, "auto"], [ConfigKey.UseSubsetMatching, null], [ConfigKey.EnablePromptComponents, !1], [ConfigKey.ContextProviderTimeBudget, 150], [ConfigKey.DebugOverrideCapiUrl, ""], [ConfigKey.DebugTestOverrideCapiUrl, ""], [ConfigKey.DebugOverrideProxyUrl, ""], [ConfigKey.DebugTestOverrideProxyUrl, ""], [ConfigKey.DebugOverrideEngine, ""], [ConfigKey.UseAsyncCompletions, void 0], [ConfigKey.EnableProgressiveReveal, void 0], [ConfigKey.EnableSpeculativeRequests, void 0], [ConfigKey.AlwaysRequestMultiline, void 0], [ConfigKey.VSCodeDebounceThreshold, void 0], [ConfigKey.ShowEditorCompletions, void 0], [ConfigKey.DelayCompletions, void 0], [ConfigKey.FilterCompletions, void 0]]);

,for (let key of Object.values(ConfigKey)) {
  let conf = contributes.configuration[0],
    parents = [],
    segments = `${CopilotConfigPrefix}.${key}`.split(".");
  for (; segments.length > 0;) {
    parents.push(segments.shift());
    let maybeChild = conf.properties[parents.join(".")];
    if (isContributesObject(maybeChild)) parents.length = 0, conf = maybeChild;else if (segments.length == 0 && (maybeChild == null ? void 0 : maybeChild.default) !== void 0) {
      if (configDefaults.has(key)) throw new Error(`Duplicate config default value ${CopilotConfigPrefix}.${key}`);
      configDefaults.set(key, maybeChild.default);
    }
  }
  if (!configDefaults.has(key)) throw new Error(`Missing config default value ${CopilotConfigPrefix}.${key}`);
},function getConfig(ctx, key) {
  return ctx.get(ConfigProvider).getConfig(key);
},__name(getConfig, "getConfig");

,function dumpForTelemetry(ctx) {
  return ctx.get(ConfigProvider).dumpForTelemetry();
},__name(dumpForTelemetry, "dumpForTelemetry");

,var _BuildInfo = class _BuildInfo {
  constructor() {
    this.packageJson = package_exports;
  }
  isPreRelease() {
    return this.getBuildType() === "nightly";
  }
  isProduction() {
    return this.getBuildType() !== "dev";
  }
  getBuildType() {
    return this.packageJson.buildType;
  }
  getVersion() {
    return this.packageJson.version;
  }
  getDisplayVersion() {
    return this.getBuildType() === "dev" ? `${this.getVersion()}-dev` : this.getVersion();
  }
  getBuild() {
    return this.packageJson.build;
  }
  getName() {
    return this.packageJson.name;
  }
};

,__name(_BuildInfo, "BuildInfo");

,var BuildInfo = _BuildInfo;

,function isPreRelease(ctx) {
  return ctx.get(BuildInfo).isPreRelease();
},__name(isPreRelease, "isPreRelease");

,function isProduction(ctx) {
  return ctx.get(BuildInfo).isProduction();
},__name(isProduction, "isProduction");

,function getBuildType(ctx) {
  return ctx.get(BuildInfo).getBuildType();
},__name(getBuildType, "getBuildType");

,function getBuild(ctx) {
  return ctx.get(BuildInfo).getBuild();
},__name(getBuild, "getBuild");

,function getVersion(ctx) {
  return ctx.get(BuildInfo).getVersion();
},__name(getVersion, "getVersion");

,var _EditorSession = class _EditorSession {
  constructor(sessionId, machineId, remoteName = "none", uiKind = "desktop") {
    this.sessionId = sessionId;
    this.machineId = machineId;
    this.remoteName = remoteName;
    this.uiKind = uiKind;
  }
};

,__name(_EditorSession, "EditorSession");

,var EditorSession = _EditorSession;

,function formatNameAndVersion({
  name: name,
  version: version
}) {
  return `${name}/${version}`;
},__name(formatNameAndVersion, "formatNameAndVersion");

,var _EditorAndPluginInfo = class _EditorAndPluginInfo {
  getCopilotIntegrationId() {}
};

,__name(_EditorAndPluginInfo, "EditorAndPluginInfo");

,var EditorAndPluginInfo = _EditorAndPluginInfo,
  apiVersion = "2024-12-15";

,function editorVersionHeaders(ctx) {
  let info = ctx.get(EditorAndPluginInfo);
  return {
    "X-GitHub-Api-Version": apiVersion,
    "Editor-Version": formatNameAndVersion(info.getEditorInfo()),
    "Editor-Plugin-Version": formatNameAndVersion(info.getEditorPluginInfo()),
    "Copilot-Language-Server-Version": getVersion(ctx)
  };
},__name(editorVersionHeaders, "editorVersionHeaders");

,var FALLBACK_GITHUB_APP_CLIENT_ID = "Iv1.b507a08c87ecfe98",
  _GitHubAppInfo = class _GitHubAppInfo {
    findAppIdToAuthenticate() {
      var _a;
      return (_a = this.githubAppId) != null ? _a : FALLBACK_GITHUB_APP_CLIENT_ID;
    }
    fallbackAppId() {
      return FALLBACK_GITHUB_APP_CLIENT_ID;
    }
  };

,__name(_GitHubAppInfo, "GitHubAppInfo");

,var GitHubAppInfo = _GitHubAppInfo;