var import_vscode = require("vscode"),
  import_vscode_languageclient = fn(m8());

,var _VSCodeCopilotExtensionApi = class _VSCodeCopilotExtensionApi {
  constructor(ctx) {
    this.ctx = ctx;
  }
  registerRelatedFilesProvider(providerId, callback) {
    let cb = __name(async (uri, context, cancellationToken) => {
      let response = await callback(ewe.Uri.parse(uri), context, cancellationToken);
      return {
        entries: [{
          type: getNeighboringFileType(providerId.languageId),
          uris: response.entries.map(uri => uri.toString())
        }],
        traits: response.traits
      };
    }, "cb");
    return this.ctx.get(RelatedFilesProvider).registerRelatedFilesProvider(providerId.extensionId, providerId.languageId, cb), {
      dispose: __name(() => this.ctx.get(RelatedFilesProvider).unregisterRelatedFilesProvider(providerId.extensionId, providerId.languageId, cb), "dispose")
    };
  }
  getContextProviderAPI(version) {
    if (version === "v1") return new ContextProviderExtensionApiV1(this.ctx);
    throw new Error(`Unknown context provider API version: ${String(version)}`);
  }
  captureExtensionTelemetry(work) {
    return withTelemetryCapture(this.ctx, work);
  }
  setupNextCompletion(completions) {
    this.clearCompletionsCache(), this.ctx.forceSet(OpenAIFetcher, new SyntheticCompletions(completions)), this.ctx.forceSet(BlockModeConfig, new FixedBlockModeConfig("parsing"));
  }
  clearCompletionsCache() {
    this.ctx.get(CompletionsCache).clear(), this.ctx.get(AsyncCompletionManager).clear(), this.ctx.forceSet(CurrentGhostText, new CurrentGhostText());
  }
  get languageClient() {
    return this.ctx.get(vet.BaseLanguageClient);
  }
};

,__name(_VSCodeCopilotExtensionApi, "VSCodeCopilotExtensionApi");

,var VSCodeCopilotExtensionApi = _VSCodeCopilotExtensionApi,
  _ContextProviderExtensionApiV1 = class _ContextProviderExtensionApiV1 {
    constructor(ctx) {
      this.ctx = ctx;
    }
    registerContextProvider(provider) {
      return this.ctx.get(ContextProviderRegistry).registerContextProvider(provider), {
        dispose: __name(() => this.ctx.get(ContextProviderRegistry).unregisterContextProvider(provider.id), "dispose")
      };
    }
  };

,__name(_ContextProviderExtensionApiV1, "ContextProviderExtensionApiV1");

,var ContextProviderExtensionApiV1 = _ContextProviderExtensionApiV1;