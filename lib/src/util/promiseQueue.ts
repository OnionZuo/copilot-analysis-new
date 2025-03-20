var _PromiseQueue = class _PromiseQueue {
  constructor() {
    this.promises = new Set();
  }
  register(promise) {
    this.promises.add(promise), promise.finally(() => this.promises.delete(promise));
  }
  async flush() {
    await Promise.allSettled(this.promises);
  }
};

,__name(_PromiseQueue, "PromiseQueue");

,var PromiseQueue = _PromiseQueue;