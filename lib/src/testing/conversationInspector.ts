var _TestConversationInspector = class _TestConversationInspector extends ConversationInspector {
  constructor() {
    super(...arguments);
    this.prompts = [];
    this.fetchResults = [];
    this.diffs = [];
  }
  shouldInspect() {
    return !0;
  }
  async inspectPrompt(promptInspection) {
    this.shouldInspect() && this.prompts.push(promptInspection);
  }
  async inspectFetchResult(fetchResult) {
    this.shouldInspect() && this.fetchResults.push(fetchResult);
  }
  async documentDiff(documentDiff) {
    this.shouldInspect() && this.diffs.push(documentDiff);
  }
};

,__name(_TestConversationInspector, "TestConversationInspector");

,var TestConversationInspector = _TestConversationInspector;