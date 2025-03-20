var import_vscode = require("vscode");

,var _ExtensionNotificationSender = class _ExtensionNotificationSender extends NotificationSender {
  constructor() {
    super(...arguments);
    this.recentNotifications = new Map();
  }
  async showWarningMessage(message, ...actions) {
    return this.recentNotifications.get(message) ? void 0 : {
      title: await Iet.window.showWarningMessage(message, ...actions.map(action => action.title))
    };
  }
  async showWarningMessageOnlyOnce(id, message, ...actions) {
    if (id === "free_over_limits" || id === "not_signed_up" || this.recentNotifications.get(message)) return;
    let result = this.showWarningMessage(message, ...actions),
      now = nowSeconds();
    return this.recentNotifications.set(message, now), result;
  }
};

,__name(_ExtensionNotificationSender, "ExtensionNotificationSender");

,var ExtensionNotificationSender = _ExtensionNotificationSender;