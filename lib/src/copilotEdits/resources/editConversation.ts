var _EditTurnManager = class _EditTurnManager {
  constructor(turns = []) {
    this.turns = [];
    this.turns = turns;
  }
  addTurn(turn) {
    this.turns.push(turn);
  }
  deleteTurn(turnId) {
    this.turns = this.turns.filter(turn => turn.id !== turnId);
  }
  getLastTurn() {
    if (this.turns.length !== 0) return this.turns[this.turns.length - 1];
  }
  hasTurn(turnId) {
    return this.turns.some(turn => turn.id === turnId);
  }
  getTurns() {
    return [...this.turns];
  }
};

,__name(_EditTurnManager, "EditTurnManager");

,var EditTurnManager = _EditTurnManager,
  _EditConversation = class _EditConversation {
    constructor(turns = [], source = "panel", userLanguage = "en") {
      this._id = v4_default();
      this._timestamp = Date.now();
      this.source = "panel";
      this.userLanguage = "en";
      this.source = source, this.userLanguage = userLanguage, this.turnsManager = new EditTurnManager(turns);
    }
    get id() {
      return this._id;
    }
    get timestamp() {
      return this._timestamp;
    }
    getUserLanguage() {
      return this.userLanguage;
    }
    getTurns() {
      return this.turnsManager.getTurns();
    }
    getSource() {
      return this.source;
    }
    addTurn(turn) {
      this.turnsManager.addTurn(turn);
    }
    deleteTurn(turnId) {
      this.turnsManager.deleteTurn(turnId);
    }
    getLastTurn() {
      let lastTurn = this.turnsManager.getLastTurn();
      if (lastTurn === void 0) throw new EditTurnNotFoundException(`No turns in the conversation ${this._id}`);
      return lastTurn;
    }
    hasTurn(turnId) {
      return this.turnsManager.hasTurn(turnId);
    }
  };

,__name(_EditConversation, "EditConversation");

,var EditConversation = _EditConversation;