var lsp = fn(Un());

,var CopilotPanelCompletionParams = Type.Object({
    textDocument: OptionalVersionedTextDocumentIdentifierSchema,
    position: PositionSchema,
    partialResultToken: Type.Optional(ProgressTokenSchema),
    workDoneToken: Type.Optional(ProgressTokenSchema)
  }),
  CopilotPanelCompletionRequest;

,(a => (CopilotPanelCompletionRequest.method = "textDocument/copilotPanelCompletion", CopilotPanelCompletionRequest.type = new l6.ProtocolRequestType(CopilotPanelCompletionRequest.method), CopilotPanelCompletionRequest.partialResult = new l6.ProgressType()))(CopilotPanelCompletionRequest || (t4e = {}));