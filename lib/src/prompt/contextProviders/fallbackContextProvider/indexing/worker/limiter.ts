var _PriorityLimiter = class _PriorityLimiter {
  constructor(maxDegreeOfParalellism) {
    this.maxDegreeOfParalellism = maxDegreeOfParalellism;
    this.outstandingPromises = [], this.runningPromises = 0;
  }
  queue(factory, highPriority = !1) {
    return new Promise((c, e) => {
      highPriority ? this.outstandingPromises.unshift({
        factory: factory,
        c: c,
        e: e
      }) : this.outstandingPromises.push({
        factory: factory,
        c: c,
        e: e
      }), this.consume();
    });
  }
  consume() {
    for (; this.outstandingPromises.length && this.runningPromises < this.maxDegreeOfParalellism;) {
      let iLimitedTask = this.outstandingPromises.shift();
      this.runningPromises++;
      let promise = iLimitedTask.factory();
      promise.then(iLimitedTask.c, iLimitedTask.e), promise.then(() => this.consumed(), () => this.consumed());
    }
  }
  consumed() {
    this.runningPromises--, this.outstandingPromises.length > 0 && this.consume();
  }
};

,__name(_PriorityLimiter, "PriorityLimiter");

,var PriorityLimiter = _PriorityLimiter;