var lsp = fn(Un()),
  DidChangeAuthParams = Type.Object({
    accessToken: Type.Optional(Type.String({
      minLength: 1
    })),
    handle: Type.Optional(Type.String({
      minLength: 1
    })),
    githubAppId: Type.Optional(Type.String({
      minLength: 1
    }))
  }),
  DidChangeAuthNotification;

,(n => (DidChangeAuthNotification.method = "github/didChangeAuth", DidChangeAuthNotification.type = new G3e.ProtocolNotificationType(DidChangeAuthNotification.method)))(DidChangeAuthNotification || (i6 = {}));