var import_vscode = require("vscode"),
  import_vscode_languageclient = fn(m8()),
  import_vscode_languageserver_protocol = fn(Un());

,var CopilotPanelCompletionRequestType = new Aj.ProtocolRequestType("textDocument/copilotPanelCompletion"),
  _request,
  _LanguageClientPanel = class _LanguageClientPanel {
    constructor(ctx, document, completionContext, panel) {
      __privateAdd(this, _request);
      let client = ctx.get(uGe.BaseLanguageClient),
        params = client.code2ProtocolConverter.asTextDocumentPositionParams(document, new lj.Position(completionContext.position.line, completionContext.position.character)),
        onPartialResult = __name(async params => {
          let items = await client.protocol2CodeConverter.asInlineCompletionResult(params.items);
          for (let item of items) !item.range || typeof item.insertText != "string" || panel.onItem({
            range: item.range,
            insertText: item.insertText,
            postInsertionCallback: __name(() => {
              if (item.command) return lj.commands.executeCommand(item.command.command, ...(item.command.arguments || []));
            }, "postInsertionCallback")
          });
        }, "onPartialResult");
      params.partialResultToken = v4_default();
      let partialResult = client.onProgress(CopilotPanelCompletionRequestType, params.partialResultToken, telemetryCatch(ctx, onPartialResult, "textDocument/copilotPanelCompletion partialResult handler"));
      params.workDoneToken = v4_default();
      let workDone = client.onProgress(Aj.WorkDoneProgress.type, params.workDoneToken, params => {
          params.kind === "end" ? panel.onWorkDone({
            percentage: 100
          }) : params.percentage !== void 0 && panel.onWorkDone({
            percentage: params.percentage
          });
        }),
        request = client.sendRequest(CopilotPanelCompletionRequestType, params, panel.cancellationToken);
      __privateSet(this, _request, request.finally(() => {
        panel.onFinished(), partialResult.dispose(), workDone.dispose();
      }));
    }
    async runQuery() {
      await __privateGet(this, _request);
    }
  };

,_request = new WeakMap(), __name(_LanguageClientPanel, "LanguageClientPanel");

,var LanguageClientPanel = _LanguageClientPanel;