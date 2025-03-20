var _CapiVersionHeaderContributor = class _CapiVersionHeaderContributor {
  constructor(ctx) {
    this.ctx = ctx;
  }
  contributeHeaderValues(url, headers) {
    let capiUrl = this.ctx.get(NetworkConfiguration).getCAPIUrl(this.ctx);
    if (this.isBlackbirdEndpoint(url)) headers["Copilot-Integration-Id"] = this.ctx.get(EditorAndPluginInfo).getEditorInfo().name, headers["X-GitHub-Api-Version"] = "2023-12-12-preview";else if (url.startsWith(capiUrl)) {
      headers["X-GitHub-Api-Version"] = "2025-01-21";
      let integrationId = this.getIntegrationId();
      integrationId && (headers["Copilot-Integration-Id"] = integrationId);
    }
  }
  isBlackbirdEndpoint(endpoint) {
    let codeSearchEndpoint = this.ctx.get(NetworkConfiguration).getBlackbirdCodeSearchUrl(this.ctx),
      docsSearchEndpoint = this.ctx.get(NetworkConfiguration).getBlackbirdDocsSearchUrl(this.ctx);
    return endpoint === codeSearchEndpoint || endpoint === docsSearchEndpoint;
  }
  getIntegrationId() {
    return getIntegrationId(this.ctx.get(EditorAndPluginInfo));
  }
};

,__name(_CapiVersionHeaderContributor, "CapiVersionHeaderContributor");

,var CapiVersionHeaderContributor = _CapiVersionHeaderContributor;

,function getIntegrationId(editorAndPluginInfo) {
  let copilotIntegrationId = editorAndPluginInfo.getCopilotIntegrationId();
  if (copilotIntegrationId) return copilotIntegrationId;
  switch (editorAndPluginInfo.getEditorPluginInfo().name) {
    case "copilot-intellij":
      return "jetbrains-chat";
    case "copilot-xcode":
      return "xcode-chat";
    case "copilot-eclipse":
      return "copilot-eclipse";
    case "copilot":
    case "copilot-vs":
      return;
    default:
      return "copilot-language-server";
  }
},__name(getIntegrationId, "getIntegrationId");