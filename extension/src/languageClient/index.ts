var path = fn(require("path")),
  vscode = fn(require("vscode")),
  import_node = fn(sGe());

,var import_vscode_languageclient = fn(m8());

,function useLanguageClient() {
  return p8.workspace.getConfiguration(CopilotConfigPrefix).get("advanced.useLanguageServer", !1);
},__name(useLanguageClient, "useLanguageClient");

,async function sendToken(ctx, languageClient) {
  let accessToken = await ctx.get(CopilotTokenManager).getGitHubToken();
  return languageClient.sendNotification(DidChangeAuthNotification.type, {
    accessToken: accessToken,
    handle: "unknown"
  });
},__name(sendToken, "sendToken");

,function createLanguageClient(ctx, outputChannel) {
  let serverOptions = {
      module: cGe.resolve(__dirname, "language-server.js"),
      options: {
        env: {
          GITHUB_COPILOT_VERBOSE: "true"
        }
      },
      transport: _k.TransportKind.ipc
    },
    vscodeEditorInfo = new VSCodeEditorInfo(),
    clientOptions = {
      documentSelector: [{
        pattern: "**"
      }],
      initializationOptions: {
        editorInfo: vscodeEditorInfo.getEditorInfo(),
        editorPluginInfo: vscodeEditorInfo.getEditorPluginInfo(),
        relatedPluginInfo: vscodeEditorInfo.getRelatedPluginInfo(),
        copilotCapabilities: {
          related: !0
        }
      },
      outputChannel: outputChannel
    },
    client = new _k.NodeLanguageClient("github.copilot", "GitHub Copilot Language Server", serverOptions, clientOptions);
  return client.onDidChangeState(change => {
    if (change.newState === _k.State.Running) return sendToken(ctx, client);
  }), client.onNotification(StatusNotificationNotification.type, params => {
    ctx.get(StatusReporter).didChange(params);
  }), p8.window.onDidChangeActiveTextEditor(editor => {
    if (client.state === _k.State.Running) return client.sendNotification(DidFocusTextDocumentNotification.type, {
      textDocument: editor && client.code2ProtocolConverter.asTextDocumentIdentifier(editor.document)
    });
  }), client.onRequest(CopilotRelatedRequest.type, async (params, token) => {
    var _a, _b;
    let empty = {
        entries: []
      },
      doc = p8.workspace.textDocuments.find(d => d.uri.toString() === params.textDocument.uri);
    if (!doc) return empty;
    let docInfo = {
        uri: doc.uri.toString(),
        clientLanguageId: doc.languageId,
        data: params.data
      },
      rfp = ctx.get(RelatedFilesProvider),
      telemetry = await ctx.get(Features).updateExPValuesAndAssignments({
        uri: doc.uri.toString(),
        languageId: doc.languageId
      }, TelemetryData.createAndMarkAsIssued((_a = params.telemetry) == null ? void 0 : _a.properties, (_b = params.telemetry) == null ? void 0 : _b.measurements)),
      r = await rfp.getRelatedFilesResponse(docInfo, telemetry, token);
    return r ? {
      entries: r.entries.map(e => ({
        providerName: e.type,
        uris: e.uris
      }))
    } : empty;
  }), client;
},__name(createLanguageClient, "createLanguageClient");