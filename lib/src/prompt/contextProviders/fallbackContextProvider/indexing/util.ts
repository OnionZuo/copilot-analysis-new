function isCancellationError(error) {
  return error instanceof CancellationError ? !0 : error instanceof Error && error.name === canceledName && error.message === canceledName;
},__name(isCancellationError, "isCancellationError");

,var _CancellationError = class _CancellationError extends Error {
  constructor() {
    super(canceledName), this.name = this.message;
  }
};

,__name(_CancellationError, "CancellationError");

,var CancellationError = _CancellationError,
  canceledName = "Canceled",
  _Stack = class _Stack {
    constructor() {
      this.items = [];
    }
    push(item) {
      this.items.push(item);
    }
    pop() {
      return this.items.pop();
    }
    peek() {
      return this.items[this.items.length - 1];
    }
    tryPeek() {
      return this.items.length > 0;
    }
    toArray() {
      return this.items;
    }
  };

,__name(_Stack, "Stack");

,var Stack = _Stack;