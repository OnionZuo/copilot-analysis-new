var logger = new Logger("CopilotEditsConversations"),
  _EditConversations = class _EditConversations {
    constructor(ctx) {
      this.editConversations = new LRUCacheMap(50);
      this.ctx = ctx;
    }
    create(source = "panel", userLanguage) {
      let editConversation = new EditConversation([], source, userLanguage);
      return this.editConversations.set(editConversation.id, editConversation), editConversation;
    }
    destroy(conversationId) {
      this.editConversations.delete(conversationId) !== !0 && logger.warn(this.ctx, `Edit code conversation ${conversationId} does not exist`);
    }
    addTurn(conversationId, turn) {
      return this.get(conversationId).addTurn(turn), turn;
    }
    deleteTurn(conversationId, turnId) {
      this.get(conversationId).deleteTurn(turnId);
    }
    get(id) {
      return this.getEditConversation(id);
    }
    getEditConversation(id) {
      let editConversation = this.editConversations.get(id);
      if (!editConversation) throw new EditConversationNotFoundException(`Conversation with id ${id} does not exist`);
      return editConversation;
    }
    getAll() {
      return Array.from(this.editConversations.values());
    }
    findByTurnId(turnId) {
      let conversations = this.getAll();
      for (let conversation of conversations) if (conversation.hasTurn(turnId)) return conversation;
    }
  };

,__name(_EditConversations, "EditConversations");

,var EditConversations = _EditConversations;