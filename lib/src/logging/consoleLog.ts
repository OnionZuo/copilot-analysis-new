var _ConsoleLog = class _ConsoleLog extends LogTarget {
  constructor(console) {
    super();
    this.console = console;
  }
  logIt(ctx, level, category, ...extra) {
    level == 1 ? this.console.error(`[${category}]`, ...extra) : (level == 2 || verboseLogging(ctx)) && this.console.warn(`[${category}]`, ...extra);
  }
};

,__name(_ConsoleLog, "ConsoleLog");

,var ConsoleLog = _ConsoleLog;