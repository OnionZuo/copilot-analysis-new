var _NotificationSender = class _NotificationSender {
  async showWarningMessageOnlyOnce(_id, message, ...actions) {
    return this.showWarningMessage(message, ...actions);
  }
};

,__name(_NotificationSender, "NotificationSender");

,var NotificationSender = _NotificationSender;