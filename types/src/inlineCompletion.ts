var lsp = fn(Un());

,var InlineCompletionTriggerKind = (n => (InlineCompletionTriggerKind[n.Invoked = 1] = "Invoked", InlineCompletionTriggerKind[n.Automatic = 2] = "Automatic", InlineCompletionTriggerKind))(MX || {}),
  InlineCompletionTriggerKindSchema = Type.Enum(InlineCompletionTriggerKind),
  CopilotInlineCompletionContextSchema = Type.Object({
    triggerKind: InlineCompletionTriggerKindSchema,
    selectedCompletionInfo: Type.Optional(Type.Object({
      text: Type.String(),
      range: RangeSchema,
      tooltipSignature: Type.Optional(Type.String())
    }))
  }),
  CopilotInlineCompletionSchema = Type.Object({
    textDocument: OptionalVersionedTextDocumentIdentifierSchema,
    position: PositionSchema,
    formattingOptions: Type.Optional(Type.Object({
      tabSize: Type.Integer({
        minimum: 1
      }),
      insertSpaces: Type.Boolean()
    })),
    context: CopilotInlineCompletionContextSchema,
    data: Type.Optional(Type.Unknown())
  }),
  CopilotInlineCompletionRequest;

,(n => (CopilotInlineCompletionRequest.method = "textDocument/inlineCompletion", CopilotInlineCompletionRequest.type = new s4.ProtocolRequestType(CopilotInlineCompletionRequest.method)))(CopilotInlineCompletionRequest || (o6 = {}));

,var NotificationCommandSchema = Type.Object({
    command: Type.Object({
      arguments: Type.Tuple([Type.String({
        minLength: 1
      })])
    })
  }),
  DidShowCompletionParams = Type.Object({
    item: NotificationCommandSchema
  }),
  DidShowCompletionNotification;

,(n => (DidShowCompletionNotification.method = "textDocument/didShowCompletion", DidShowCompletionNotification.type = new s4.ProtocolNotificationType(DidShowCompletionNotification.method)))(DidShowCompletionNotification || (s6 = {}));

,var DidPartiallyAcceptCompletionParams = Type.Object({
    item: NotificationCommandSchema,
    acceptedLength: Type.Integer({
      minimum: 1
    })
  }),
  DidPartiallyAcceptCompletionNotification;

,(n => (DidPartiallyAcceptCompletionNotification.method = "textDocument/didPartiallyAcceptCompletion", DidPartiallyAcceptCompletionNotification.type = new s4.ProtocolNotificationType(DidPartiallyAcceptCompletionNotification.method)))(DidPartiallyAcceptCompletionNotification || (c6 = {}));