function fakeChatModelConfiguration(family) {
  return {
    modelId: "gpt-3.5-turbo",
    modelFamily: family,
    uiName: "Test GPT",
    maxRequestTokens: 6144,
    maxResponseTokens: 2048,
    baseTokensPerMessage: 3,
    baseTokensPerName: 1,
    baseTokensPerCompletion: 3,
    tokenizer: "cl100k_base",
    isExperimental: !1,
    stream: !0,
    toolCalls: !0
  };
},__name(fakeChatModelConfiguration, "fakeChatModelConfiguration");

,function fakeEmbeddingModelConfiguration(family) {
  return {
    modelId: "embedding-test",
    modelFamily: family,
    maxBatchSize: 1,
    maxTokens: 50,
    tokenizer: "cl100k_base"
  };
},__name(fakeEmbeddingModelConfiguration, "fakeEmbeddingModelConfiguration");

,var _TestModelConfigurationProvider = class _TestModelConfigurationProvider extends ModelConfigurationProvider {
  async getBestChatModelConfig(modelFamilies) {
    let firstFamily = modelFamilies[0];
    return fakeChatModelConfiguration(firstFamily);
  }
  async getFirstMatchingEmbeddingModelConfiguration(modelFamily) {
    return fakeEmbeddingModelConfiguration(modelFamily);
  }
};

,__name(_TestModelConfigurationProvider, "TestModelConfigurationProvider");

,var TestModelConfigurationProvider = _TestModelConfigurationProvider;