var _FixedCopilotTokenManager = class _FixedCopilotTokenManager extends CopilotTokenManager {
  constructor(token) {
    super();
    this.token = token;
    this.wasReset = !1;
  }
  async getGitHubSession() {
    return Promise.resolve({
      token: `copilot-client test oauth token ${v4_default()}`
    });
  }
  async getToken() {
    return createTestCopilotToken({
      token: this.token
    });
  }
  resetToken() {
    this.wasReset = !0;
  }
  async checkCopilotToken() {
    return {
      status: "OK"
    };
  }
};

,__name(_FixedCopilotTokenManager, "FixedCopilotTokenManager");

,var FixedCopilotTokenManager = _FixedCopilotTokenManager;