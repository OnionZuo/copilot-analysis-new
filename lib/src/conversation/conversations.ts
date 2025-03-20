var _ConversationHolder = class _ConversationHolder {
  constructor(conversation, capabilities) {
    this.conversation = conversation;
    this.capabilities = capabilities;
  }
};

,__name(_ConversationHolder, "ConversationHolder");

,var ConversationHolder = _ConversationHolder,
  _Conversations = class _Conversations {
    constructor(ctx) {
      this.ctx = ctx;
      this.conversations = new LRUCacheMap(100);
    }
    async create(capabilities, source = "panel", userLanguage) {
      let conversation = new Conversation([], source, userLanguage);
      return this.conversations.set(conversation.id, new ConversationHolder(conversation, capabilities)), conversation;
    }
    destroy(conversationId) {
      this.conversations.delete(conversationId);
    }
    async addTurn(conversationId, turn, references, workspaceFolder, ignoreSkills, confirmationResponse) {
      let conversation = this.get(conversationId);
      return turn.request.references = references && references.length > 0 ? references : [], workspaceFolder && (turn.workspaceFolder = workspaceFolder), ignoreSkills && ignoreSkills.length > 0 && (turn.ignoredSkills = ignoreSkills.map(skillId => ({
        skillId: skillId
      }))), confirmationResponse && (turn.agent = {
        agentSlug: confirmationResponse.agentSlug
      }, turn.confirmationResponse = confirmationResponse), await this.determineAndApplyAgent(conversation, turn), await this.determineAndApplyTemplate(conversation, turn), conversation.addTurn(turn), turn;
    }
    async determineAndApplyAgent(conversation, turn) {
      if (conversation.source === "panel" && turn.request.message.trim().startsWith("@")) {
        let [agentSlug, userQuestion] = this.extractKeywordAndQuestionFromRequest(turn.request.message, "@");
        (await getAgents(this.ctx)).find(candidate => candidate.slug === agentSlug) && (turn.request.message = userQuestion, turn.request.type = "user", turn.agent = {
          agentSlug: agentSlug
        });
      }
    }
    async determineAndApplyTemplate(conversation, turn) {
      if (turn.request.message.trim().startsWith("/")) {
        let [templateId, userQuestion] = this.extractKeywordAndQuestionFromRequest(turn.request.message, "/"),
          template = getPromptTemplates().find(template => template.id === templateId);
        if (template) {
          turn.request.message = userQuestion, turn.request.type = "user", await this.determineAndApplyAgent(conversation, turn);
          let templateInstructions = template.instructions ? template.instructions(this.ctx, turn.request.message, conversation.source) : userQuestion;
          turn.template = {
            templateId: templateId,
            userQuestion: turn.request.message
          }, turn.request.message = templateInstructions, turn.request.type = "template";
        }
      }
    }
    extractKeywordAndQuestionFromRequest(request, keywordIndicator) {
      let [keyword, ...question] = request.trim().split(" "),
        userQuestion = question.join(" ");
      return [keyword.replace(keywordIndicator, ""), userQuestion];
    }
    deleteTurn(conversationId, turnId) {
      this.get(conversationId).deleteTurn(turnId);
    }
    get(id) {
      return this.getHolder(id).conversation;
    }
    getCapabilities(id) {
      return this.getHolder(id).capabilities;
    }
    getSupportedSkills(id) {
      let implicitSkills = this.ctx.get(ConversationSkillRegistry).getDescriptors().filter(s => s.type === "implicit").map(s => s.id),
        supportedSkill = this.getCapabilities(id).skills;
      return [...implicitSkills, ...supportedSkill];
    }
    filterSupportedSkills(id, skillIds) {
      let supportedSkills = this.getSupportedSkills(id);
      return skillIds.filter(skillId => supportedSkills.includes(skillId));
    }
    getHolder(id) {
      let holder = this.conversations.get(id);
      if (!holder) throw new Error(`Conversation with id ${id} does not exist`);
      return holder;
    }
    getAll() {
      let conversationsHolders = this.conversations.values();
      return Array.from(conversationsHolders).map(holder => holder.conversation);
    }
    findByTurnId(turnId) {
      return this.getAll().find(conversation => conversation.hasTurn(turnId));
    }
  };

,__name(_Conversations, "Conversations");

,var Conversations = _Conversations;