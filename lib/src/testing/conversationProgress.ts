var _TestConversationProgress = class _TestConversationProgress extends ConversationProgress {
  constructor() {
    super(...arguments);
    this.openConversations = new Map();
    this.steps = [];
  }
  async begin(conversation, turn, workDoneToken) {
    var _a;
    this.openConversations.set(conversation.id, workDoneToken), this.steps.push({
      workDoneToken: workDoneToken,
      conversationId: conversation.id,
      turnId: turn.id,
      type: "BEGIN",
      agentSlug: (_a = turn.agent) == null ? void 0 : _a.agentSlug
    });
  }
  async cancel(conversation, turn, error) {
    let workDoneToken = this.getWorkDoneToken(conversation);
    this.steps.push({
      workDoneToken: workDoneToken,
      conversationId: conversation.id,
      turnId: turn.id,
      type: "CANCEL",
      error: error
    }), this.openConversations.delete(conversation.id);
  }
  async end(conversation, turn, payload) {
    let workDoneToken = this.getWorkDoneToken(conversation);
    this.steps.push({
      workDoneToken: workDoneToken,
      conversationId: conversation.id,
      turnId: turn.id,
      type: "END",
      ...payload
    }), this.openConversations.delete(conversation.id);
  }
  async report(conversation, turn, payload) {
    let workDoneToken = this.getWorkDoneToken(conversation);
    this.steps.push({
      workDoneToken: workDoneToken,
      conversationId: conversation.id,
      turnId: turn.id,
      type: "REPORT",
      ...payload,
      steps: this.copyPayloadSteps(payload)
    });
  }
  copyPayloadSteps(payload) {
    var _a;
    return ((_a = payload.steps) == null ? void 0 : _a.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status,
      error: s.error
    }))) || [];
  }
  getWorkDoneToken(conversation) {
    let workDoneToken = this.openConversations.get(conversation.id);
    if (workDoneToken === void 0) throw new Error(`No work done token for conversation ${conversation.id}`);
    return workDoneToken;
  }
};

,__name(_TestConversationProgress, "TestConversationProgress");

,var TestConversationProgress = _TestConversationProgress;