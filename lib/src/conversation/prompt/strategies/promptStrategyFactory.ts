var _PromptStrategyDescriptor = class _PromptStrategyDescriptor {
  constructor(promptType, modelFamilies, strategy) {
    this.promptType = promptType;
    this.strategy = strategy;
    this.modelFamilies = Array.isArray(modelFamilies) ? modelFamilies : [modelFamilies];
  }
};

,__name(_PromptStrategyDescriptor, "PromptStrategyDescriptor");

,var PromptStrategyDescriptor = _PromptStrategyDescriptor;

,function descriptor(promptType, modelFamilies, strategy) {
  return new PromptStrategyDescriptor(promptType, modelFamilies, strategy);
},__name(descriptor, "descriptor");

,var descriptors = [descriptor("user", getSupportedModelFamiliesForPrompt("user"), async () => new PanelUserPromptStrategy()), descriptor("inline", getSupportedModelFamiliesForPrompt("inline"), async () => new InlineUserPromptStrategy()), descriptor("meta", getSupportedModelFamiliesForPrompt("meta"), async () => new MetaPromptStrategy()), descriptor("suggestions", getSupportedModelFamiliesForPrompt("suggestions"), async () => new SuggestionsPromptStrategy()), descriptor("synonyms", getSupportedModelFamiliesForPrompt("synonyms"), async () => new UserQuerySynonymsPromptStrategy())],
  _DefaultPromptStrategyFactory = class _DefaultPromptStrategyFactory {
    async createPromptStrategy(ctx, promptType, modelFamily) {
      let descriptor = descriptors.find(d => d.promptType === promptType && d.modelFamilies.includes(modelFamily));
      if (!descriptor) throw new Error(`No prompt strategy found for promptType: ${promptType} and modelFamily: ${modelFamily}`);
      return descriptor.strategy(ctx);
    }
    get descriptors() {
      return descriptors;
    }
  };

,__name(_DefaultPromptStrategyFactory, "DefaultPromptStrategyFactory");

,var DefaultPromptStrategyFactory = _DefaultPromptStrategyFactory;