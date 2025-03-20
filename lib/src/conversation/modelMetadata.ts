var tenMinutesMs = 10 * 60 * 1e3;

,function getSupportedModelFamiliesForPrompt(promptType) {
  switch (promptType) {
    case "edits":
    case "user":
    case "inline":
      return ["gpt-4o", "gpt-4-turbo", "gpt-4", "o1-mini", "o1-ga", "claude-3.5-sonnet", "o3-mini", "gemini-2.0-flash", "claude-3.7-sonnet", "claude-3.7-sonnet-thought", "gpt-4.5"];
    case "meta":
    case "suggestions":
    case "synonyms":
      return ["gpt-4o-mini", "gpt-3.5-turbo"];
  }
},__name(getSupportedModelFamiliesForPrompt, "getSupportedModelFamiliesForPrompt");

,var ModelCapabilitiesSchema = Type.Object({
    type: Type.Union([Type.Literal("chat"), Type.Literal("embeddings"), Type.Literal("completion")]),
    tokenizer: Type.String(),
    family: Type.String(),
    object: Type.String(),
    supports: Type.Optional(Type.Object({
      tool_calls: Type.Optional(Type.Boolean()),
      parallel_tool_calls: Type.Optional(Type.Boolean()),
      streaming: Type.Optional(Type.Boolean())
    })),
    limits: Type.Optional(Type.Object({
      max_inputs: Type.Optional(Type.Number()),
      max_prompt_tokens: Type.Optional(Type.Number()),
      max_output_tokens: Type.Optional(Type.Number()),
      max_context_window_tokens: Type.Optional(Type.Number())
    }))
  }),
  ModelMetadataSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    version: Type.String(),
    model_picker_enabled: Type.Boolean(),
    capabilities: ModelCapabilitiesSchema,
    object: Type.String(),
    preview: Type.Optional(Type.Boolean()),
    isExperimental: Type.Optional(Type.Boolean()),
    policy: Type.Optional(Type.Object({
      state: Type.String(),
      terms: Type.String()
    }))
  }),
  ModelsMetadataSchema = Type.Object({
    data: Type.Array(ModelMetadataSchema)
  });