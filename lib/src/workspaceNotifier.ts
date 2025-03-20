var import_node_events = fn(require("events"));

,var workspaceChangedEvent = "onWorkspaceChanged",
  _WorkspaceNotifier = class _WorkspaceNotifier {
    constructor() {
      this.emitter = new i$e.EventEmitter();
    }
    onChange(listener) {
      this.emitter.on(workspaceChangedEvent, listener);
    }
    emit(event) {
      this.emitter.emit(workspaceChangedEvent, event);
    }
  };

,__name(_WorkspaceNotifier, "WorkspaceNotifier");

,var WorkspaceNotifier = _WorkspaceNotifier;