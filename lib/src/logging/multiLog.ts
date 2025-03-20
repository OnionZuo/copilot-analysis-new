var _MultiLog = class _MultiLog extends LogTarget {
  constructor(targets) {
    super();
    this.targets = targets;
  }
  logIt(ctx, level, category, ...extra) {
    for (let target of this.targets) target.logIt(ctx, level, category, ...extra);
  }
};

,__name(_MultiLog, "MultiLog");

,var MultiLog = _MultiLog;