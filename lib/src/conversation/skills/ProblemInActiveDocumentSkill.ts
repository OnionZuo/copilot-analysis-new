var ProblemsInActiveDocumentSchema = Type.Object({
  uri: Type.String(),
  problems: Type.Array(Type.Object({
    message: Type.String(),
    range: RangeSchema
  }))
});

,var ProblemsInActiveDocumentSkillId = "problems-in-active-document";