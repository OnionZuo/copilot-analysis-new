var _TelemetryLogSenderImpl = class _TelemetryLogSenderImpl extends TelemetryLogSender {
  sendError(ctx, category, ...extra) {
    telemetryError(ctx, "log", TelemetryData.createAndMarkAsIssued({
      context: category,
      level: LogLevel[1],
      message: telemetryMessage(...extra)
    }), 1);
  }
  sendException(ctx, error, origin) {
    telemetryException(ctx, error, origin);
  }
};

,__name(_TelemetryLogSenderImpl, "TelemetryLogSenderImpl");

,var TelemetryLogSenderImpl = _TelemetryLogSenderImpl;

,function telemetryMessage(...extra) {
  return extra.length > 0 ? JSON.stringify(extra) : "no msg";
},__name(telemetryMessage, "telemetryMessage");