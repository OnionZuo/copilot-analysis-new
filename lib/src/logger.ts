var LogLevel = (i => (LogLevel[i.DEBUG = 4] = "DEBUG", LogLevel[i.INFO = 3] = "INFO", LogLevel[i.WARN = 2] = "WARN", LogLevel[i.ERROR = 1] = "ERROR", LogLevel))(MB || {}),
  _LogTarget = class _LogTarget {};

,__name(_LogTarget, "LogTarget");

,var LogTarget = _LogTarget,
  _TelemetryLogSender = class _TelemetryLogSender {};

,__name(_TelemetryLogSender, "TelemetryLogSender");

,var TelemetryLogSender = _TelemetryLogSender,
  _Logger = class _Logger {
    constructor(category) {
      this.category = category;
    }
    log(ctx, level, ...extra) {
      ctx.get(LogTarget).logIt(ctx, level, this.category, ...extra);
    }
    debug(ctx, ...extra) {
      this.log(ctx, 4, ...extra);
    }
    info(ctx, ...extra) {
      this.log(ctx, 3, ...extra);
    }
    warn(ctx, ...extra) {
      this.log(ctx, 2, ...extra);
    }
    error(ctx, ...extra) {
      ctx.get(TelemetryLogSender).sendError(ctx, this.category, ...extra), this.errorWithoutTelemetry(ctx, ...extra);
    }
    errorWithoutTelemetry(ctx, ...extra) {
      this.log(ctx, 1, ...extra);
    }
    exception(ctx, error, origin) {
      if (error instanceof Error && error.name === "Canceled" && error.message === "Canceled") return;
      let message = origin;
      origin.startsWith(".") && (message = origin.substring(1), origin = `${this.category}${origin}`), ctx.get(TelemetryLogSender).sendException(ctx, error, origin);
      let safeError = error instanceof Error ? error : new Error(`Non-error thrown: ${String(error)}`);
      this.log(ctx, 1, `${message}:`, safeError);
    }
  };

,__name(_Logger, "Logger");

,var Logger = _Logger,
  logger = new Logger("default");