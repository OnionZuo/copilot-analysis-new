var import_ts_dedent = fn(Wu());

,var TestFailuresSchema = Type.Object({
  failures: Type.Array(Type.Object({
    testName: Type.String(),
    testSuite: Type.Optional(Type.String()),
    testFileUri: Type.String(),
    failureReason: Type.Optional(Type.String()),
    testLocation: RangeSchema
  }))
});

,var TestFailuresSkillId = "test-failures";