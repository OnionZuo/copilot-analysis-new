var import_vscode = require("vscode");

,var matchCodeMessage = "We found a reference to public code in a recent suggestion. To learn more about public code references, review the [documentation](https://aka.ms/github-copilot-match-public-code).",
  MatchAction = "View reference",
  SettingAction = "Change setting",
  CodeReferenceKey = "codeReference.notified";

,function notify(ctx) {
  let extension = ctx.get(Extension);
  if (extension.context.globalState.get(CodeReferenceKey)) return;
  let notificationSender = ctx.get(NotificationSender),
    messageItems = [{
      title: MatchAction
    }, {
      title: SettingAction
    }];
  return notificationSender.showWarningMessage(matchCodeMessage, ...messageItems).then(async action => {
    let event = {
      context: ctx,
      actor: "user"
    };
    switch (action == null ? void 0 : action.title) {
      case MatchAction:
        {
          matchNotificationTelemetry.handleDoAction(event), await kQ.commands.executeCommand(OutputPaneShowCommand);
          break;
        }
      case SettingAction:
        {
          await kQ.env.openExternal(kQ.Uri.parse("https://aka.ms/github-copilot-settings"));
          break;
        }
      case void 0:
        {
          matchNotificationTelemetry.handleDismiss(event);
          break;
        }
    }
  }), extension.context.globalState.update(CodeReferenceKey, !0);
},__name(notify, "notify");