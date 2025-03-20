var statusCodeRe = /^[1-6][0-9][0-9]$/,
  capitalsRe = /([A-Z][a-z]+)/,
  NAMESPACE = "code_referencing",
  _CodeQuoteTelemetry = class _CodeQuoteTelemetry {
    constructor(baseKey) {
      this.baseKey = baseKey;
    }
    buildKey(...keys) {
      return [NAMESPACE, this.baseKey, ...keys].join(".");
    }
  };

,__name(_CodeQuoteTelemetry, "CodeQuoteTelemetry");

,var CodeQuoteTelemetry = _CodeQuoteTelemetry,
  _CopilotOutputLogTelemetry = class _CopilotOutputLogTelemetry extends CodeQuoteTelemetry {
    constructor() {
      super("github_copilot_log");
    }
    handleOpen({
      context: context
    }) {
      let key = this.buildKey("open", "count"),
        data = TelemetryData.createAndMarkAsIssued();
      telemetry(context, key, data);
    }
    handleFocus({
      context: context
    }) {
      let data = TelemetryData.createAndMarkAsIssued(),
        key = this.buildKey("focus", "count");
      telemetry(context, key, data);
    }
    handleWrite({
      context: context
    }) {
      let data = TelemetryData.createAndMarkAsIssued(),
        key = this.buildKey("write", "count");
      telemetry(context, key, data);
    }
  };

,__name(_CopilotOutputLogTelemetry, "CopilotOutputLogTelemetry");

,var CopilotOutputLogTelemetry = _CopilotOutputLogTelemetry,
  copilotOutputLogTelemetry = new CopilotOutputLogTelemetry(),
  _MatchNotificationTelemetry = class _MatchNotificationTelemetry extends CodeQuoteTelemetry {
    constructor() {
      super("match_notification");
    }
    handleDoAction({
      context: context,
      actor: actor
    }) {
      let data = TelemetryData.createAndMarkAsIssued({
          actor: actor
        }),
        key = this.buildKey("acknowledge", "count");
      telemetry(context, key, data);
    }
    handleDismiss({
      context: context,
      actor: actor
    }) {
      let data = TelemetryData.createAndMarkAsIssued({
          actor: actor
        }),
        key = this.buildKey("ignore", "count");
      telemetry(context, key, data);
    }
  };

,__name(_MatchNotificationTelemetry, "MatchNotificationTelemetry");

,var MatchNotificationTelemetry = _MatchNotificationTelemetry,
  matchNotificationTelemetry = new MatchNotificationTelemetry(),
  _SnippyTelemetry = class _SnippyTelemetry extends CodeQuoteTelemetry {
    constructor() {
      super("snippy");
    }
    handleUnexpectedError({
      context: context,
      origin: origin,
      reason: reason
    }) {
      let data = TelemetryData.createAndMarkAsIssued({
        origin: origin,
        reason: reason
      });
      telemetryError(context, this.buildKey("unexpectedError"), data);
    }
    handleCompletionMissing({
      context: context,
      origin: origin,
      reason: reason
    }) {
      let data = TelemetryData.createAndMarkAsIssued({
        origin: origin,
        reason: reason
      });
      telemetryError(context, this.buildKey("completionMissing"), data);
    }
    handleSnippyNetworkError({
      context: context,
      origin: origin,
      reason: reason,
      message: message
    }) {
      if (!origin.match(statusCodeRe)) {
        codeReferenceLogger.debug(context, "Invalid status code, not sending telemetry", {
          origin: origin
        });
        return;
      }
      let errorType = reason.split(capitalsRe).filter(part => !!part).join("_").toLowerCase(),
        data = TelemetryData.createAndMarkAsIssued({
          message: message
        });
      telemetryError(context, this.buildKey(errorType, origin), data);
    }
  };

,__name(_SnippyTelemetry, "SnippyTelemetry");

,var SnippyTelemetry = _SnippyTelemetry,
  snippyTelemetry = new SnippyTelemetry();