var CERTIFICATE_ERRORS = ["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_SIGNATURE_FAILURE"],
  errorMsg = "Your proxy connection requires a trusted certificate. Please make sure the proxy certificate and any issuers are configured correctly and trusted by your operating system.",
  learnMoreLink = "https://gh.io/copilot-network-errors",
  _UserErrorNotifier = class _UserErrorNotifier {
    constructor() {
      this.notifiedErrorCodes = [];
    }
    notifyUser(ctx, e) {
      if (!(e instanceof Error)) return;
      let error = e;
      error.code && CERTIFICATE_ERRORS.includes(error.code) && !this.didNotifyBefore(error.code) && (this.notifiedErrorCodes.push(error.code), this.displayCertificateErrorNotification(ctx, error));
    }
    async displayCertificateErrorNotification(ctx, err) {
      new Logger("certificates").error(ctx, `${errorMsg} Please visit ${learnMoreLink} to learn more. Original cause:`, err);
      let learnMoreAction = {
        title: "Learn more"
      };
      return ctx.get(NotificationSender).showWarningMessage(errorMsg, learnMoreAction).then(userResponse => {
        if ((userResponse == null ? void 0 : userResponse.title) === learnMoreAction.title) return ctx.get(UrlOpener).open(learnMoreLink);
      });
    }
    didNotifyBefore(code) {
      return this.notifiedErrorCodes.indexOf(code) !== -1;
    }
  };

,__name(_UserErrorNotifier, "UserErrorNotifier");

,var UserErrorNotifier = _UserErrorNotifier;