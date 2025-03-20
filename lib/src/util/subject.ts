var _Subject = class _Subject {
  constructor() {
    this.observers = new Set();
  }
  subscribe(observer) {
    return this.observers.add(observer), () => this.observers.delete(observer);
  }
  next(value) {
    for (let observer of this.observers) observer.next(value);
  }
  error(err) {
    var _a;
    for (let observer of this.observers) (_a = observer.error) == null || _a.call(observer, err);
  }
  complete() {
    var _a;
    for (let observer of this.observers) (_a = observer.complete) == null || _a.call(observer);
  }
};

,__name(_Subject, "Subject");

,var Subject = _Subject,
  _ReplaySubject = class _ReplaySubject extends Subject {
    subscribe(observer) {
      let subscription = super.subscribe(observer);
      return this._value !== void 0 && observer.next(this._value), subscription;
    }
    next(value) {
      this._value = value, super.next(value);
    }
  };

,__name(_ReplaySubject, "ReplaySubject");

,var ReplaySubject = _ReplaySubject;