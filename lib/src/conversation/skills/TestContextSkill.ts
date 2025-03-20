var TestContextSchema = Type.Object({
  currentFileUri: Type.String(),
  sourceFileUri: Type.Optional(Type.String()),
  testFileUri: Type.Optional(Type.String())
});

,var TestContextSkillId = "test-context";