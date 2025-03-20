var import_vscode = require("vscode");

,function assertHasGoodCommand(item) {
  var _a, _b, _c;
  if (typeof ((_a = item.command) == null ? void 0 : _a.command) != "string" || typeof ((_c = (_b = item.command) == null ? void 0 : _b.arguments) == null ? void 0 : _c[0]) != "string") throw new Error("InlineCompletionItem must have a command with arguments");
},__name(assertHasGoodCommand, "assertHasGoodCommand");

,var _LanguageClientInlineCompletionItemProvider = class _LanguageClientInlineCompletionItemProvider {
  constructor(client) {
    this.client = client;
  }
  async provideInlineCompletionItems(doc, position, context, token) {
    let params = this.client.code2ProtocolConverter.asInlineCompletionParams(doc, position, context);
    return params.context.triggerKind = context.triggerKind === Vet.VSCodeTriggerKind.Invoke ? 1 : 2, await this.client.sendRequest(CopilotInlineCompletionRequest.type, params, token).then(result => this.client.protocol2CodeConverter.asInlineCompletionResult(result, token)).then(result => Array.isArray(result) ? {
      items: result
    } : result);
  }
  handleDidShowCompletionItem(item) {
    assertHasGoodCommand(item), this.client.sendNotification(DidShowCompletionNotification.type, {
      item: item
    });
  }
  handleDidPartiallyAcceptCompletionItem(item, info) {
    typeof info != "number" && (assertHasGoodCommand(item), this.client.sendNotification(DidPartiallyAcceptCompletionNotification.type, {
      item: item,
      acceptedLength: info.acceptedLength
    }));
  }
};

,__name(_LanguageClientInlineCompletionItemProvider, "LanguageClientInlineCompletionItemProvider");

,var LanguageClientInlineCompletionItemProvider = _LanguageClientInlineCompletionItemProvider;

,function quickSuggestionsDisabled() {
  let qs = Vk.workspace.getConfiguration("editor.quickSuggestions");
  return qs.get("other") !== "on" && qs.get("comments") !== "on" && qs.get("strings") !== "on";
},__name(quickSuggestionsDisabled, "quickSuggestionsDisabled");

,var _CopilotInlineCompletionItemProvider = class _CopilotInlineCompletionItemProvider {
  constructor(ctx) {
    this.ctx = ctx;
    this.ghostTextProvider = new GhostTextProvider(ctx);
  }
  get delegate() {
    var _a;
    let languageClient = this.ctx.get(xk.BaseLanguageClient);
    return useLanguageClient() ? ((_a = this.languageClientProvider) != null || (this.languageClientProvider = new LanguageClientInlineCompletionItemProvider(languageClient)), this.languageClientProvider) : this.ghostTextProvider;
  }
  async provideInlineCompletionItems(doc, position, context, token) {
    return !this.initFallbackContext && (await shouldActivateFallbackContextProvider(this.ctx, {
      uri: doc.uri,
      languageId: doc.languageId
    })) && (this.initFallbackContext = activateFallbackContextProviderFeature(this.ctx)), context.triggerKind === Vk.InlineCompletionTriggerKind.Automatic && (!isCompletionEnabledForDocument(this.ctx, doc) || this.ctx.get(CopilotExtensionStatus).kind === "Error") ? void 0 : (Vk.workspace.getConfiguration(CopilotConfigPrefix).get("respectSelectedCompletionInfo", quickSuggestionsDisabled()) || (context = {
      ...context,
      selectedCompletionInfo: void 0
    }), this.delegate.provideInlineCompletionItems(doc, position, context, token));
  }
  handleDidShowCompletionItem(item, updatedInsertText) {
    var _a, _b;
    return (_b = (_a = this.delegate).handleDidShowCompletionItem) == null ? void 0 : _b.call(_a, item, updatedInsertText);
  }
  handleDidPartiallyAcceptCompletionItem(item, acceptedLengthOrInfo) {
    var _a, _b;
    return (_b = (_a = this.delegate).handleDidPartiallyAcceptCompletionItem) == null ? void 0 : _b.call(_a, item, acceptedLengthOrInfo);
  }
};

,__name(_CopilotInlineCompletionItemProvider, "CopilotInlineCompletionItemProvider");

,var CopilotInlineCompletionItemProvider = _CopilotInlineCompletionItemProvider;

,async function registerInlineCompletion(ctx, debounceExperimentEnabled) {
  let provider = new CopilotInlineCompletionItemProvider(ctx),
    debounceDelayMs,
    configDebounceThreshold = getConfig(ctx, ConfigKey.VSCodeDebounceThreshold);
  if (configDebounceThreshold !== void 0) debounceDelayMs = configDebounceThreshold;else if (debounceExperimentEnabled) {
    let telemetryData = await ctx.get(Features).updateExPValuesAndAssignments();
    debounceDelayMs = ctx.get(Features).vscodeDebounceThreshold(telemetryData);
  }
  let metadata = debounceDelayMs !== void 0 ? {
    debounceDelayMs: debounceDelayMs
  } : {};
  return Vk.languages.registerInlineCompletionItemProvider({
    pattern: "**"
  }, provider, metadata);
},__name(registerInlineCompletion, "registerInlineCompletion");