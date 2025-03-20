var CopilotInlineEditsSchema = Type.Object({
  textDocument: OptionalVersionedTextDocumentIdentifierSchema,
  position: PositionSchema
});