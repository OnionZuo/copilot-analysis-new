var _Conversation = class _Conversation {
  constructor(turns = [], source = "panel", userLanguage = "en") {
    this.turns = turns;
    this.source = source;
    this.userLanguage = userLanguage;
    this._id = v4_default();
    this._timestamp = Date.now();
  }
  copy() {
    let turnsCopy = JSON.parse(JSON.stringify(this.turns)),
      conversationCopy = new _Conversation(turnsCopy, this.source, this.userLanguage);
    return conversationCopy._id = this.id, conversationCopy._timestamp = this.timestamp, conversationCopy;
  }
  get id() {
    return this._id;
  }
  get timestamp() {
    return this._timestamp;
  }
  addTurn(turn) {
    this.turns.push(turn);
  }
  deleteTurn(turnId) {
    this.turns = this.turns.filter(turn => turn.id !== turnId);
  }
  getLastTurn() {
    return this.turns[this.turns.length - 1];
  }
  hasTurn(turnId) {
    return this.turns.some(turn => turn.id === turnId);
  }
};

,__name(_Conversation, "Conversation");

,var Conversation = _Conversation;