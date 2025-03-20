var import_events = fn(require("events"));

,var eventName = "CopilotToken",
  _emitter,
  _lastToken,
  _CopilotTokenNotifier = class _CopilotTokenNotifier {
    constructor() {
      __privateAdd(this, _emitter, new i4e.EventEmitter());
      __privateAdd(this, _lastToken);
      __privateGet(this, _emitter).setMaxListeners(20);
    }
    emitToken(token) {
      var _a;
      if (token.token !== ((_a = __privateGet(this, _lastToken)) == null ? void 0 : _a.token)) return __privateSet(this, _lastToken, token), __privateGet(this, _emitter).emit(eventName, token);
    }
    onToken(listener) {
      return __privateGet(this, _emitter).on(eventName, listener), Qo.Disposable.create(() => __privateGet(this, _emitter).off(eventName, listener));
    }
  };

,_emitter = new WeakMap(), _lastToken = new WeakMap(), __name(_CopilotTokenNotifier, "CopilotTokenNotifier");

,var CopilotTokenNotifier = _CopilotTokenNotifier;

,function onCopilotToken(ctx, listener) {
  let wrapper = telemetryCatch(ctx, listener, `event.${eventName}`);
  return ctx.get(CopilotTokenNotifier).onToken(wrapper);
},__name(onCopilotToken, "onCopilotToken");

,function emitCopilotToken(ctx, token) {
  return ctx.get(CopilotTokenNotifier).emitToken(token);
},__name(emitCopilotToken, "emitCopilotToken");