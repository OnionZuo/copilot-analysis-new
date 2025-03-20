var _TestUrlOpener = class _TestUrlOpener extends UrlOpener {
  constructor() {
    super(...arguments);
    this.openedUrls = [];
    this.opened = new Deferred();
  }
  async open(target) {
    this.openedUrls.push(target), this.opened.resolve();
  }
};

,__name(_TestUrlOpener, "TestUrlOpener");

,var TestUrlOpener = _TestUrlOpener,
  _TestNotificationSender = class _TestNotificationSender extends NotificationSender {
    constructor() {
      super();
      this.sentMessages = [];
      this.warningPromises = [];
    }
    performDismiss() {
      this.actionToPerform = "DISMISS";
    }
    performAction(title) {
      this.actionToPerform = title;
    }
    showWarningMessage(message, ...actions) {
      this.sentMessages.push(message);
      let warningPromise;
      if (this.actionToPerform) {
        if (this.actionToPerform === "DISMISS") warningPromise = Promise.resolve(void 0);else {
          let action = actions.find(a => a.title === this.actionToPerform);
          warningPromise = action ? Promise.resolve(action) : Promise.resolve(void 0);
        }
      } else warningPromise = actions ? Promise.resolve(actions[0]) : Promise.resolve(void 0);
      return this.warningPromises.push(warningPromise), warningPromise;
    }
    async waitForWarningMessages() {
      await Promise.all(this.warningPromises);
    }
  };

,__name(_TestNotificationSender, "TestNotificationSender");

,var TestNotificationSender = _TestNotificationSender;