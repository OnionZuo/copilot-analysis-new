var _inProgressCount,
  _kind,
  _message,
  _command,
  _startup,
  _StatusReporter_instances,
  didChange_fn,
  _StatusReporter = class _StatusReporter {
    constructor() {
      __privateAdd(this, _StatusReporter_instances);
      __privateAdd(this, _inProgressCount, 0);
      __privateAdd(this, _kind, "Normal");
      __privateAdd(this, _message);
      __privateAdd(this, _command);
      __privateAdd(this, _startup, !0);
    }
    get busy() {
      return __privateGet(this, _inProgressCount) > 0;
    }
    withProgress(callback) {
      return __privateGet(this, _kind) === "Warning" && this.forceNormal(), __privateWrapper(this, _inProgressCount)._++ === 0 && __privateMethod(this, _StatusReporter_instances, didChange_fn).call(this), callback().finally(() => {
        --__privateWrapper(this, _inProgressCount)._ === 0 && __privateMethod(this, _StatusReporter_instances, didChange_fn).call(this);
      });
    }
    forceStatus(kind, message, command) {
      __privateGet(this, _kind) === kind && __privateGet(this, _message) === message && !command && !__privateGet(this, _command) && !__privateGet(this, _startup) || (__privateSet(this, _kind, kind), __privateSet(this, _message, message), __privateSet(this, _command, command), __privateSet(this, _startup, !1), __privateMethod(this, _StatusReporter_instances, didChange_fn).call(this));
    }
    forceNormal() {
      __privateGet(this, _kind) !== "Inactive" && this.forceStatus("Normal");
    }
    setError(message, command) {
      this.forceStatus("Error", message, command);
    }
    setWarning(message) {
      __privateGet(this, _kind) !== "Error" && this.forceStatus("Warning", message);
    }
    setInactive(message) {
      __privateGet(this, _kind) === "Error" || __privateGet(this, _kind) === "Warning" || this.forceStatus("Inactive", message);
    }
    clearInactive() {
      __privateGet(this, _kind) === "Inactive" && this.forceStatus("Normal");
    }
  };

,_inProgressCount = new WeakMap(), _kind = new WeakMap(), _message = new WeakMap(), _command = new WeakMap(), _startup = new WeakMap(), _StatusReporter_instances = new WeakSet(), didChange_fn = __name(function () {
  let event = {
    kind: __privateGet(this, _kind),
    message: __privateGet(this, _message),
    busy: this.busy,
    command: __privateGet(this, _command)
  };
  this.didChange(event);
}, "#didChange"), __name(_StatusReporter, "StatusReporter");

,var StatusReporter = _StatusReporter,
  _NoOpStatusReporter = class _NoOpStatusReporter extends StatusReporter {
    didChange() {}
  };

,__name(_NoOpStatusReporter, "NoOpStatusReporter");

,var NoOpStatusReporter = _NoOpStatusReporter;