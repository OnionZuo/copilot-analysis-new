var FileStatusSchema = Type.Union([Type.Literal("included"), Type.Literal("blocked"), Type.Literal("notfound"), Type.Literal("empty")]),
  DocumentSchema = Type.Object({
    uri: Type.String(),
    position: Type.Optional(Type.Object({
      line: Type.Number({
        minimum: 0
      }),
      character: Type.Number({
        minimum: 0
      })
    })),
    visibleRange: Type.Optional(RangeSchema),
    selection: Type.Optional(RangeSchema),
    openedAt: Type.Optional(Type.String()),
    activeAt: Type.Optional(Type.String())
  }),
  FileReferenceSchema = Type.Intersect([Type.Object({
    type: Type.Literal("file"),
    status: Type.Optional(FileStatusSchema),
    range: Type.Optional(RangeSchema)
  }), DocumentSchema]),
  ReferenceSchema = Type.Union([FileReferenceSchema, WebSearchReferenceSchema]),
  ConversationSourceSchema = Type.Union([Type.Literal("panel"), Type.Literal("inline")]);