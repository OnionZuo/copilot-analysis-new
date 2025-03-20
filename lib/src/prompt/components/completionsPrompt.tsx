var _CompletionsPromptFactory = class _CompletionsPromptFactory {};

,__name(_CompletionsPromptFactory, "CompletionsPromptFactory");

,var CompletionsPromptFactory = _CompletionsPromptFactory;

,function createCompletionsPromptFactory(ctx, virtualPrompt, poolSize = 5) {
  return new PoolingCompletionsPromptFactory(() => new ComponentsCompletionsPromptFactory(ctx, virtualPrompt), poolSize);
},__name(createCompletionsPromptFactory, "createCompletionsPromptFactory");

,var _PoolingCompletionsPromptFactory = class _PoolingCompletionsPromptFactory extends CompletionsPromptFactory {
  constructor(delegateFactory, poolSize) {
    super();
    this.delegates = [];
    for (let i = 0; i < poolSize; i++) this.delegates.push({
      delegate: new TimeoutHandlingCompletionsPromptFactory(delegateFactory()),
      busy: !1,
      currentOperation: null
    });
  }
  async prompt(textDocument, position, telemetryData, cancellationToken, opts) {
    let delegateInfo = this.delegates.find(d => !d.busy);
    for (; !delegateInfo;) if (delegateInfo = this.delegates.find(d => !d.busy), !delegateInfo) {
      await Promise.race(this.delegates.map(d => d.currentOperation).filter(op => op !== null));
      continue;
    }
    delegateInfo.busy = !0;
    let operation = delegateInfo.delegate.prompt(textDocument, position, telemetryData, cancellationToken, opts);
    delegateInfo.currentOperation = operation;
    try {
      return await operation;
    } finally {
      delegateInfo.currentOperation === operation && (delegateInfo.busy = !1, delegateInfo.currentOperation = null);
    }
  }
};

,__name(_PoolingCompletionsPromptFactory, "PoolingCompletionsPromptFactory");

,var PoolingCompletionsPromptFactory = _PoolingCompletionsPromptFactory,
  DEFAULT_PROMPT_TIMEOUT = 1200,
  _TimeoutHandlingCompletionsPromptFactory = class _TimeoutHandlingCompletionsPromptFactory extends CompletionsPromptFactory {
    constructor(delegate) {
      super();
      this.delegate = delegate;
      this.timeoutHandlingCreatePrompt = shortCircuit(this.delegate.prompt.bind(this.delegate), DEFAULT_PROMPT_TIMEOUT, _promptTimeout);
    }
    async prompt(textDocument, position, telemetryData, cancellationToken, opts = {}) {
      return await this.timeoutHandlingCreatePrompt(textDocument, position, telemetryData, cancellationToken, opts);
    }
  };

,__name(_TimeoutHandlingCompletionsPromptFactory, "TimeoutHandlingCompletionsPromptFactory");

,var TimeoutHandlingCompletionsPromptFactory = _TimeoutHandlingCompletionsPromptFactory;

,function isCompletionRequestData(data) {
  if (!data || typeof data != "object") return !1;
  let req = data;
  return !(!req.document || !req.position || req.position.line === void 0 || req.position.character === void 0 || !req.telemetryData);
},__name(isCompletionRequestData, "isCompletionRequestData");

,var _ComponentsCompletionsPromptFactory = class _ComponentsCompletionsPromptFactory extends CompletionsPromptFactory {
  constructor(ctx, virtualPrompt) {
    super();
    this.ctx = ctx;
    this.renderer = new CompletionsPromptRenderer();
    this.virtualPrompt = virtualPrompt;
  }
  async prompt(textDocument, position, telemetryData, cancellationToken, opts = {}) {
    try {
      return await this.createPromptUnsafe(textDocument, position, telemetryData, cancellationToken, opts);
    } catch (e) {
      return this.errorPrompt(e);
    }
  }
  async createPromptUnsafe(textDocument, position, telemetryData, cancellationToken, opts = {}) {
    let {
        maxPromptLength: maxPromptLength,
        suffixPercent: suffixPercent,
        suffixMatchThreshold: suffixMatchThreshold
      } = getPromptOptions(this.ctx, telemetryData, textDocument.detectedLanguageId),
      failFastPrompt = await this.failFastPrompt(textDocument, position, suffixPercent != null ? suffixPercent : 0, cancellationToken);
    if (failFastPrompt) return failFastPrompt;
    let {
        virtualPrompt: virtualPrompt,
        pipe: pipe
      } = await this.getOrCreateVirtualPrompt(this.ctx),
      start = performance.now(),
      {
        traits: traits,
        codeSnippets: codeSnippets,
        turnOffSimilarFiles: turnOffSimilarFiles,
        resolvedContextItems: resolvedContextItems
      } = await this.resolveContext(textDocument, position, telemetryData, cancellationToken, opts);
    await this.updateComponentData(pipe, textDocument, position, traits, codeSnippets, telemetryData, turnOffSimilarFiles, cancellationToken, opts, suffixMatchThreshold);
    let snapshot = await virtualPrompt.snapshot(cancellationToken),
      snapshotStatus = snapshot.status;
    if (snapshotStatus === "cancelled") return _promptCancelled;
    if (snapshotStatus === "error") return this.errorPrompt(snapshot.error);
    let rendered = await this.renderer.render(snapshot.snapshot, {
      delimiter: `
`,
      tokenizer: getTokenizer(),
      promptTokenLimit: maxPromptLength,
      suffixPercent: suffixPercent
    }, cancellationToken);
    if (rendered.status === "cancelled") return _promptCancelled;
    if (rendered.status === "error") return this.errorPrompt(rendered.error);
    let [trimmedPrefix, trailingWs] = trimLastLine(rendered.prefix),
      contextProvidersTelemetry;
    if (useContextProviderAPI(this.ctx, telemetryData)) {
      let promptMatcher = componentStatisticsToPromptMatcher(rendered.metadata.componentStatistics);
      this.ctx.get(ContextProviderStatistics).computeMatch(promptMatcher), contextProvidersTelemetry = telemetrizeContextItems(this.ctx, resolvedContextItems);
    }
    let end = performance.now();
    return this.resetIfEmpty(rendered), this.successPrompt(trimmedPrefix, rendered, end, start, trailingWs, contextProvidersTelemetry);
  }
  async updateComponentData(pipe, textDocument, position, traits, codeSnippets, telemetryData, turnOffSimilarFiles, cancellationToken, opts = {}, suffixMatchThreshold) {
    let completionRequestData = this.createRequestData(textDocument, position, telemetryData, cancellationToken, opts, traits, codeSnippets, turnOffSimilarFiles, suffixMatchThreshold);
    await pipe.pump(completionRequestData);
  }
  async resolveContext(textDocument, position, telemetryData, cancellationToken, opts = {}) {
    var _a;
    let resolvedContextItems = [],
      traits,
      codeSnippets,
      turnOffSimilarFiles = !1;
    if (useContextProviderAPI(this.ctx, telemetryData)) {
      resolvedContextItems = await this.ctx.get(ContextProviderRegistry).resolveAllProviders({
        uri: textDocument.uri,
        languageId: textDocument.clientLanguageId,
        version: textDocument.version,
        offset: textDocument.offsetAt(position),
        position: (_a = opts.positionBeforeApplyingEdits) != null ? _a : position,
        proposedEdits: textDocument.appliedEdits.length > 0 ? textDocument.appliedEdits : void 0
      }, telemetryData, cancellationToken, opts.data);
      let matchedContextItems = resolvedContextItems.filter(matchContextItems);
      !this.ctx.get(Features).includeNeighboringFiles(telemetryData) && matchedContextItems.length > 0 && (turnOffSimilarFiles = !0), traits = await getTraitsFromContextItems(this.ctx, matchedContextItems), codeSnippets = await getCodeSnippetsFromContextItems(this.ctx, matchedContextItems, textDocument.detectedLanguageId);
    }
    return {
      traits: traits,
      codeSnippets: codeSnippets,
      turnOffSimilarFiles: turnOffSimilarFiles,
      resolvedContextItems: resolvedContextItems
    };
  }
  async failFastPrompt(textDocument, position, suffixPercent, cancellationToken) {
    if (cancellationToken != null && cancellationToken.isCancellationRequested) return _promptCancelled;
    if ((await this.ctx.get(CopilotContentExclusionManager).evaluate(textDocument.uri, textDocument.getText(), "UPDATE")).isBlocked) return _copilotContentExclusion;
    if ((suffixPercent > 0 ? textDocument.getText().length : textDocument.offsetAt(position)) < MIN_PROMPT_CHARS) return _contextTooShort;
  }
  async getOrCreateVirtualPrompt(ctx) {
    return this.virtualPrompt || (this.virtualPrompt = await VirtualPrompt.create(this.completionsPrompt())), this.pipe || (this.pipe = this.virtualPrompt.createPipe()), {
      virtualPrompt: this.virtualPrompt,
      pipe: this.pipe
    };
  }
  completionsPrompt() {
    return functionComponentFunction(fragmentFunction, {
      children: [functionComponentFunction(DocumentMarker, {
        ctx: this.ctx,
        weight: .7
      }), functionComponentFunction(Traits, {
        weight: .6
      }), functionComponentFunction(CodeSnippets, {
        ctx: this.ctx,
        weight: .9
      }), functionComponentFunction(SimilarFiles, {
        ctx: this.ctx,
        weight: .8
      }), functionComponentFunction(CurrentFile, {
        weight: 1
      })]
    });
  }
  createRequestData(textDocument, position, telemetryData, cancellationToken, opts, traits, codeSnippets, turnOffSimilarFiles, suffixMatchThreshold) {
    return {
      document: textDocument,
      position: position,
      telemetryData: telemetryData,
      cancellationToken: cancellationToken,
      data: opts.data,
      traits: traits,
      codeSnippets: codeSnippets,
      turnOffSimilarFiles: turnOffSimilarFiles,
      suffixMatchThreshold: suffixMatchThreshold
    };
  }
  resetIfEmpty(rendered) {
    rendered.prefix.length === 0 && rendered.suffix.length === 0 && this.reset();
  }
  successPrompt(trimmedPrefix, rendered, end, start, trailingWs, contextProvidersTelemetry) {
    return {
      type: "prompt",
      prompt: {
        prefix: trimmedPrefix,
        suffix: rendered.suffix,
        isFimEnabled: rendered.suffix.length > 0,
        promptElementRanges: []
      },
      computeTimeMs: end - start,
      trailingWs: trailingWs,
      promptChoices: new PromptChoices(),
      promptBackground: new PromptBackground(),
      neighborSource: new Map(),
      metadata: rendered.metadata,
      contextProvidersTelemetry: contextProvidersTelemetry
    };
  }
  errorPrompt(error) {
    return telemetryException(this.ctx, error, "PromptComponents.CompletionsPromptFactory"), this.reset(), _promptError;
  }
  reset() {
    this.virtualPrompt = void 0, this.pipe = void 0;
  }
};

,__name(_ComponentsCompletionsPromptFactory, "ComponentsCompletionsPromptFactory");

,var ComponentsCompletionsPromptFactory = _ComponentsCompletionsPromptFactory;

,function getPromptStrategy(ctx, telemetryData) {
  return ctx.get(Features).promptComponentsEnabled(telemetryData) || getConfig(ctx, ConfigKey.EnablePromptComponents) ? "components" : "wishlist";
},__name(getPromptStrategy, "getPromptStrategy");

,function tryHeatingUpTokenizer(ctx) {
  try {
    getTokenizer();
  } catch (e) {
    handleException(ctx, e, "heatUpTokenizer");
  }
},__name(tryHeatingUpTokenizer, "tryHeatingUpTokenizer");