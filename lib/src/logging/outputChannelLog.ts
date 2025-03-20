var _OutputChannelLog = class _OutputChannelLog extends LogTarget {
  constructor(outputChannel, alwaysVerbose = !0) {
    super();
    this.outputChannel = outputChannel;
    this.alwaysVerbose = alwaysVerbose;
  }
  logIt(ctx, level, category, ...extra) {
    if (!shouldLog(ctx, level, category)) return;
    let shouldVerboseLog = this.alwaysVerbose || verboseLogging(ctx),
      message = formatLogMessage(category, ...extra);
    level == 1 ? this.outputChannel.error(message) : level == 2 ? this.outputChannel.warn(message) : shouldVerboseLog && level == 3 ? this.outputChannel.info(message) : shouldVerboseLog && level == 4 && this.outputChannel.debug(message);
  }
};

,__name(_OutputChannelLog, "OutputChannelLog");

,var OutputChannelLog = _OutputChannelLog;

,function shouldLog(ctx, level, category) {
  var _a, _b;
  if (verboseLogging(ctx)) return !0;
  let levels = getConfig(ctx, ConfigKey.DebugFilterLogCategories);
  if (levels.length > 0 && !levels.includes(category)) return !1;
  let defaultLevel = isProduction(ctx) ? 3 : 4,
    overrides = getConfig(ctx, ConfigKey.DebugOverrideLogLevels),
    maxLevel = (_b = (_a = stringToLevel(overrides["*"])) != null ? _a : stringToLevel(overrides[category])) != null ? _b : defaultLevel;
  return level <= maxLevel;
},__name(shouldLog, "shouldLog");

,function stringToLevel(s) {
  return LogLevel[s];
},__name(stringToLevel, "stringToLevel");