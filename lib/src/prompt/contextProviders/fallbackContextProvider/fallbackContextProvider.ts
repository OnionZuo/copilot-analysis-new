var _FallbackContextProvider = class _FallbackContextProvider {
  constructor(ctx) {
    this.id = FALLBACK_CONTEXT_PROVIDER_ID;
    this.selector = PredefinedSymbolExtractors.map(extractor => ({
      language: extractor.languageId
    }));
    try {
      this.documentManager = ctx.get(TextDocumentManager), this.resolver = new FallbackContextResolver(this.documentManager, ctx);
    } catch (err) {
      throw fallbackContextProviderLogger.error(ctx, "Failed to create fallback context provider", err), err;
    }
  }
};

,__name(_FallbackContextProvider, "FallbackContextProvider");

,var FallbackContextProvider = _FallbackContextProvider,
  _FallbackContextResolver = class _FallbackContextResolver {
    constructor(documentManager, ctx) {
      this.ctx = ctx;
      this.documentManager = documentManager;
    }
    resolve(request, token) {
      return this.resolveImpl(request, token);
    }
    async resolveImpl(context, token) {
      var _a;
      let indexClient = this.ctx.get(FallbackContextIndexWatcher).indexClient;
      try {
        let textDocument = await this.documentManager.getTextDocument({
          uri: context.documentContext.uri
        });
        if ((textDocument == null ? void 0 : textDocument.version) !== context.documentContext.version) return [];
        let position = context.documentContext.position,
          edits = (_a = context.documentContext.proposedEdits) != null ? _a : [];
        ({
          textDocument: textDocument,
          position: position
        } = applyEditsWithPosition(textDocument, position, edits));
        let text = textDocument.getText();
        return await indexClient.getContext(context.documentContext.uri, text, textDocument.offsetAt(position), context.documentContext.languageId, token);
      } catch (err) {
        if (isCancellationError(err)) return [];
        throw fallbackContextProviderLogger.error(this.ctx, "Failed to get context", err), err;
      }
    }
  };

,__name(_FallbackContextResolver, "FallbackContextResolver");

,var FallbackContextResolver = _FallbackContextResolver;