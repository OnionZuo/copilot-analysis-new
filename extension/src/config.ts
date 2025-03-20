var vscode = fn(require("vscode"));

,var _VSCodeConfigProvider = class _VSCodeConfigProvider extends ConfigProvider {
  constructor() {
    super(), this.config = tr.workspace.getConfiguration(CopilotConfigPrefix), tr.workspace.onDidChangeConfiguration(changeEvent => {
      changeEvent.affectsConfiguration(CopilotConfigPrefix) && (this.config = tr.workspace.getConfiguration(CopilotConfigPrefix));
    });
  }
  getConfig(key) {
    var _a;
    return (_a = getConfigKeyRecursively(this.config, key)) != null ? _a : getConfigDefaultForKey(key);
  }
  getOptionalConfig(key) {
    var _a;
    return (_a = getConfigKeyRecursively(this.config, key)) != null ? _a : getOptionalConfigDefaultForKey(key);
  }
  dumpForTelemetry() {
    return {};
  }
};

,__name(_VSCodeConfigProvider, "VSCodeConfigProvider");

,var VSCodeConfigProvider = _VSCodeConfigProvider,
  telemetryAllowedAuthorities = new Set(["ssh-remote", "dev-container", "attached-container", "wsl", "tunnel", "codespaces", "amlext"]),
  _VSCodeEditorInfo = class _VSCodeEditorInfo extends EditorAndPluginInfo {
    getEditorInfo() {
      let devName = tr.env.uriScheme;
      tr.version.endsWith("-insider") && (devName = devName.replace(/-insiders$/, ""));
      let remoteName = tr.env.remoteName;
      return remoteName && (devName += `@${telemetryAllowedAuthorities.has(remoteName) ? remoteName : "other"}`), {
        name: "vscode",
        devName: devName,
        version: tr.version,
        root: tr.env.appRoot
      };
    }
    getEditorPluginInfo() {
      return {
        name: "copilot",
        version: package_exports.version
      };
    }
    getRelatedPluginInfo() {
      return ["ms-vscode.cpptools", "ms-vscode.cmake-tools", "ms-vscode.makefile-tools", "ms-dotnettools.csdevkit", "ms-python.python", "ms-python.vscode-pylance", "vscjava.vscode-java-pack", "vscode.typescript-language-features", "ms-vscode.vscode-typescript-next", "ms-dotnettools.csharp"].map(name => {
        var _a;
        let extpj = (_a = tr.extensions.getExtension(name)) == null ? void 0 : _a.packageJSON;
        if (extpj && typeof extpj == "object" && "version" in extpj && typeof extpj.version == "string") return {
          name: name,
          version: extpj.version
        };
      }).filter(plugin => plugin !== void 0);
    }
  };

,__name(_VSCodeEditorInfo, "VSCodeEditorInfo");

,var VSCodeEditorInfo = _VSCodeEditorInfo;

,function getEnabledConfigObject(ctx) {
  var _a;
  return {
    "*": !0,
    ...((_a = ctx.get(ConfigProvider).getConfig(ConfigKey.Enable)) != null ? _a : {})
  };
},__name(getEnabledConfigObject, "getEnabledConfigObject");

,function getEnabledConfig(ctx, languageId) {
  var _a, _b;
  let obj = getEnabledConfigObject(ctx);
  return (_b = (_a = obj[languageId]) != null ? _a : obj["*"]) != null ? _b : !0;
},__name(getEnabledConfig, "getEnabledConfig");

,function isCompletionEnabled(ctx) {
  let editor = tr.window.activeTextEditor;
  if (editor) return isCompletionEnabledForDocument(ctx, editor.document);
},__name(isCompletionEnabled, "isCompletionEnabled");

,function isCompletionEnabledForDocument(ctx, document) {
  let config = tr.workspace.getConfiguration(CopilotConfigPrefix, document);
  return getEnabledConfig(ctx, document.languageId) && config.get(ConfigKey.EnableAutoCompletions) !== !1;
},__name(isCompletionEnabledForDocument, "isCompletionEnabledForDocument");

,function isInlineSuggestEnabled() {
  return tr.workspace.getConfiguration("editor.inlineSuggest").get("enabled");
},__name(isInlineSuggestEnabled, "isInlineSuggestEnabled");

,var inspectKinds = [["workspaceFolderLanguageValue", tr.ConfigurationTarget.WorkspaceFolder, !0], ["workspaceFolderValue", tr.ConfigurationTarget.WorkspaceFolder, !1], ["workspaceLanguageValue", tr.ConfigurationTarget.Workspace, !0], ["workspaceValue", tr.ConfigurationTarget.Workspace, !1], ["globalLanguageValue", tr.ConfigurationTarget.Global, !0], ["globalValue", tr.ConfigurationTarget.Global, !1]];

,async function enableCompletions(ctx) {
  var _a;
  for (let [section, option] of [["", "editor.inlineSuggest.enabled"], [CopilotConfigPrefix, ConfigKey.EnableAutoCompletions]]) {
    let config = tr.workspace.getConfiguration(section),
      inspect = config.inspect(option);
    for (let [key, target, overrideInLanguage] of inspectKinds) {
      if (tr.workspace.getConfiguration(section).get(option)) break;
      (inspect == null ? void 0 : inspect[key]) === !1 && (await config.update(option, !0, target, overrideInLanguage));
    }
  }
  let languageId = (_a = tr.window.activeTextEditor) == null ? void 0 : _a.document.languageId;
  if (!languageId) return;
  let config = tr.workspace.getConfiguration(CopilotConfigPrefix),
    enabledConfig = {
      ...getEnabledConfigObject(ctx)
    };
  languageId in enabledConfig ? enabledConfig[languageId] = !0 : enabledConfig["*"] = !0, await config.update(ConfigKey.Enable, enabledConfig, tr.ConfigurationTarget.Global);
},__name(enableCompletions, "enableCompletions");

,async function disableCompletions(ctx) {
  var _a;
  let languageId = (_a = tr.window.activeTextEditor) == null ? void 0 : _a.document.languageId;
  if (!languageId) return;
  let config = tr.workspace.getConfiguration(CopilotConfigPrefix),
    enabledConfig = {
      ...getEnabledConfigObject(ctx)
    };
  languageId in enabledConfig ? enabledConfig["*"] === !1 && (enabledConfig[languageId] = !1) : enabledConfig["*"] = !1, await config.update(ConfigKey.Enable, enabledConfig, tr.ConfigurationTarget.Global);
},__name(disableCompletions, "disableCompletions");

,async function toggleCompletions(ctx) {
  isCompletionEnabled(ctx) && isInlineSuggestEnabled() ? await disableCompletions(ctx) : await enableCompletions(ctx);
},__name(toggleCompletions, "toggleCompletions");