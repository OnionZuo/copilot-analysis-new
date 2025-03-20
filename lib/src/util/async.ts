var _Deferred = class _Deferred {
  constructor() {
    this.resolve = __name(() => {}, "resolve");
    this.reject = __name(() => {}, "reject");
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve, this.reject = reject;
    });
  }
};

,__name(_Deferred, "Deferred");

,var Deferred = _Deferred;