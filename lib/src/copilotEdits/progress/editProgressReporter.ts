var _EditProgressReporter = class _EditProgressReporter {
  constructor(ctx) {
    this.ctx = ctx;
  }
};

,__name(_EditProgressReporter, "EditProgressReporter");

,var EditProgressReporter = _EditProgressReporter,
  _LibTestEditProgressReporter = class _LibTestEditProgressReporter extends EditProgressReporter {
    constructor() {
      super(...arguments);
      this.items = [];
    }
    reset() {
      this.items = [];
    }
    async reportTurn(turnCtx, resultItem) {
      this.items.push({
        editConversationId: turnCtx.editConversationId,
        editTurnId: turnCtx.editTurnId,
        ...resultItem
      });
    }
  };

,__name(_LibTestEditProgressReporter, "LibTestEditProgressReporter");

,var LibTestEditProgressReporter = _LibTestEditProgressReporter;