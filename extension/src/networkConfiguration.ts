var import_vscode = require("vscode");

,var EnterpriseConfigPrefix = "github-enterprise",
  DotComUrl = "https://github.com";

,function configuredBaseUrl() {
  var _a, _b;
  return ((_a = Wwe.workspace.getConfiguration(CopilotConfigPrefix).get("advanced")) == null ? void 0 : _a.authProvider) === "github-enterprise" && (_b = Wwe.workspace.getConfiguration(EnterpriseConfigPrefix).get("uri")) != null ? _b : DotComUrl;
},__name(configuredBaseUrl, "configuredBaseUrl");

,var _VSCodeNetworkConfiguration = class _VSCodeNetworkConfiguration extends DefaultNetworkConfiguration {
  constructor(ctx) {
    super(ctx, configuredBaseUrl(), {});
  }
  updateBaseUrl(ctx, newUrl) {
    super.updateBaseUrl(ctx, configuredBaseUrl());
  }
};

,__name(_VSCodeNetworkConfiguration, "VSCodeNetworkConfiguration");

,var VSCodeNetworkConfiguration = _VSCodeNetworkConfiguration;

,function onDidChangeConfigurationHandler(event, ctx) {
  (event.affectsConfiguration(`${CopilotConfigPrefix}.advanced`) || event.affectsConfiguration(`${EnterpriseConfigPrefix}.uri`)) && ctx.get(NetworkConfiguration).updateBaseUrl(ctx);
},__name(onDidChangeConfigurationHandler, "onDidChangeConfigurationHandler");