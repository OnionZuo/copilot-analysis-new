var _CopilotPromptLoadFailure = class _CopilotPromptLoadFailure extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.code = "CopilotPromptLoadFailure";
  }
};

,__name(_CopilotPromptLoadFailure, "CopilotPromptLoadFailure");

,var CopilotPromptLoadFailure = _CopilotPromptLoadFailure;