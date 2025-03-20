var import_vscode = require("vscode");

,var postInsertCmdName = "_github.copilot.ghostTextPostInsert",
  ghostTextLogger = new Logger("ghostText");

,function getTextEditorOptions(document) {
  let editor = au.window.visibleTextEditors.find(editor => editor.document.uri === document.uri);
  return editor == null ? void 0 : editor.options;
},__name(getTextEditorOptions, "getTextEditorOptions");

,async function calculateInlineCompletions(ctx, document, position, textEditorOptions, context, token, telemetryData) {
  ghostTextLogger.debug(ctx, `Ghost text called at [${position.line}, ${position.character}], with triggerKind ${context.triggerKind}`);
  let result = await getInlineCompletions(ctx, telemetryData, document, position, textEditorOptions, {
    isCycling: context.triggerKind === au.InlineCompletionTriggerKind.Invoke,
    selectedCompletionInfo: context.selectedCompletionInfo
  }, token);
  if (result.type !== "success") return ghostTextLogger.debug(ctx, "Breaking, no results from getGhostText -- " + result.type + ": " + result.reason), result;
  let inlineCompletions = result.value.map(completion => {
    let {
        insertText: insertText,
        range: range
      } = completion,
      newRange = new au.Range(new au.Position(range.start.line, range.start.character), new au.Position(range.end.line, range.end.character));
    return new au.InlineCompletionItem(insertText, newRange, {
      title: "PostInsertTask",
      command: postInsertCmdName,
      arguments: [completion]
    });
  });
  return {
    ...result,
    value: inlineCompletions
  };
},__name(calculateInlineCompletions, "calculateInlineCompletions");

,async function provideInlineCompletions(ctx, document, position, context, token) {
  let wrapped = wrapDoc(ctx, document);
  if (!wrapped) return;
  let telemetryData = TelemetryData.createAndMarkAsIssued(),
    opportunityId = context.requestUuid;
  opportunityId && (telemetryData = telemetryData.extendedBy({
    opportunityId: opportunityId
  }));
  let options = getTextEditorOptions(document),
    result = await calculateInlineCompletions(ctx, wrapped, position, options, context, token, telemetryData);
  return handleGhostTextResultTelemetry(ctx, result);
},__name(provideInlineCompletions, "provideInlineCompletions");

,var _GhostTextProvider = class _GhostTextProvider {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async provideInlineCompletionItems(doc, position, context, token) {
    try {
      let items = await provideInlineCompletions(this.ctx, doc, position, context, token);
      return items ? {
        items: items
      } : void 0;
    } catch (e) {
      exception(this.ctx, e, ".provideInlineCompletionItems", ghostTextLogger);
    }
  }
  handleDidShowCompletionItem(item) {
    try {
      let cmp = item.command.arguments[0];
      handleGhostTextShown(this.ctx, cmp);
    } catch (e) {
      exception(this.ctx, e, ".handleGhostTextShown", ghostTextLogger);
    }
  }
  handleDidPartiallyAcceptCompletionItem(item, info) {
    if (typeof info == "number") return;
    let cmp = item.command.arguments[0];
    try {
      handlePartialGhostTextPostInsert(this.ctx, cmp, info.acceptedLength, info.kind);
    } catch (e) {
      exception(this.ctx, e, ".handleDidPartiallyAcceptCompletionItem", ghostTextLogger);
    }
  }
};

,__name(_GhostTextProvider, "GhostTextProvider");

,var GhostTextProvider = _GhostTextProvider;

,function registerGhostTextDependencies(ctx) {
  return au.commands.registerCommand(postInsertCmdName, async e => {
    handleGhostTextPostInsert(ctx, e);
    try {
      await au.commands.executeCommand("github.copilot.survey.signalUsage", "completions");
    } catch {}
  });
},__name(registerGhostTextDependencies, "registerGhostTextDependencies");