var _CopilotExtensionStatus = class _CopilotExtensionStatus {
  constructor(kind = "Normal", message, busy = !1, command) {
    this.kind = kind;
    this.message = message;
    this.busy = busy;
    this.command = command;
  }
};

,__name(_CopilotExtensionStatus, "CopilotExtensionStatus");

,var CopilotExtensionStatus = _CopilotExtensionStatus;