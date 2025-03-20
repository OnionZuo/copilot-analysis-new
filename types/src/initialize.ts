var CopilotCapabilities = Type.Object({
    fetch: Type.Optional(Type.Boolean()),
    redirectedTelemetry: Type.Optional(Type.Boolean()),
    token: Type.Optional(Type.Boolean()),
    related: Type.Optional(Type.Boolean()),
    watchedFiles: Type.Optional(Type.Boolean()),
    ipCodeCitation: Type.Optional(Type.Boolean())
  }),
  NameAndVersion = Type.Object({
    name: Type.String(),
    version: Type.String(),
    readableName: Type.Optional(Type.String())
  }),
  CopilotInitializationOptions = Type.Object({
    editorInfo: Type.Optional(NameAndVersion),
    editorPluginInfo: Type.Optional(NameAndVersion),
    relatedPluginInfo: Type.Optional(Type.Array(NameAndVersion)),
    copilotIntegrationId: Type.Optional(Type.String()),
    copilotCapabilities: Type.Optional(CopilotCapabilities),
    githubAppId: Type.Optional(Type.String())
  });