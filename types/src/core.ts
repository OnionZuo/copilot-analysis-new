var import_vscode_languageserver_protocol = fn(Un()),
  DocumentUriSchema = Type.String(),
  TextDocumentIdentifierSchema = Type.Object({
    uri: DocumentUriSchema
  }),
  OptionalVersionedTextDocumentIdentifierSchema = Type.Intersect([TextDocumentIdentifierSchema, Type.Object({
    version: Type.Optional(Type.Integer())
  })]),
  VersionedTextDocumentIdentifierSchema = Type.Required(OptionalVersionedTextDocumentIdentifierSchema),
  PositionSchema = Type.Object({
    line: Type.Integer({
      minimum: 0
    }),
    character: Type.Integer({
      minimum: 0
    })
  }),
  RangeSchema = Type.Object({
    start: PositionSchema,
    end: PositionSchema
  }),
  ProgressTokenSchema = Type.Union([Type.Integer(), Type.String()]),
  CancellationTokenSchema = Type.Object({
    isCancellationRequested: Type.Boolean(),
    onCancellationRequested: Type.Any()
  });