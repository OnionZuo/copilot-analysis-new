function filterUnsupportedReferences(references) {
  return references ? references.filter(r => r.type === "github.web-search").map(r => r) : [];
},__name(filterUnsupportedReferences, "filterUnsupportedReferences");

,function convertToCopilotReferences(references) {
  return references ? references.filter(r => r.type === "github.web-search") : [];
},__name(convertToCopilotReferences, "convertToCopilotReferences");

,var WebSearchReferenceSchema = Type.Object({
  type: Type.Literal("github.web-search"),
  id: Type.String(),
  data: Type.Object({
    query: Type.String(),
    type: Type.String(),
    results: Type.Optional(Type.Array(Type.Object({
      title: Type.String(),
      excerpt: Type.String(),
      url: Type.String()
    })))
  }),
  metadata: Type.Optional(Type.Object({
    display_name: Type.Optional(Type.String()),
    display_icon: Type.Optional(Type.String())
  }))
});