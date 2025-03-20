var _CopilotTokenManager = class _CopilotTokenManager {
  constructor() {}
  async getGitHubToken() {
    let token = await this.getGitHubSession();
    return token == null ? void 0 : token.token;
  }
  primeToken() {
    try {
      return this.getToken().then(() => {}, () => {});
    } catch {
      return Promise.resolve();
    }
  }
};

,__name(_CopilotTokenManager, "CopilotTokenManager");

,var CopilotTokenManager = _CopilotTokenManager,
  _TokenResultError = class _TokenResultError extends CopilotAuthError {
    constructor(result) {
      var _a;
      super((_a = result.message) != null ? _a : "");
      this.result = result;
    }
  };

,__name(_TokenResultError, "TokenResultError");

,var TokenResultError = _TokenResultError,
  _CopilotTokenManagerFromGitHubTokenBase = class _CopilotTokenManagerFromGitHubTokenBase extends CopilotTokenManager {
    constructor(ctx) {
      super();
      this.ctx = ctx;
      this.token = void 0;
      this.tokenPromise = void 0;
    }
    async fetchCopilotTokenEnvelope() {
      let gitHubToken = await this.getGitHubSession();
      if (!gitHubToken) throw new TokenResultError({
        reason: "NotSignedIn"
      });
      if (!(gitHubToken != null && gitHubToken.token)) throw new TokenResultError({
        reason: "HTTP401"
      });
      let tokenResult = await authFromGitHubToken(this.ctx, gitHubToken);
      if (tokenResult.kind === "failure") {
        if (tokenResult.message) throw new TokenResultError(tokenResult);
        let error = new Error(`Unexpected error getting Copilot token: ${tokenResult.reason}`);
        throw error.code = `CopilotToken.${tokenResult.reason}`, error;
      }
      return tokenResult.envelope;
    }
    async getToken() {
      var _a;
      if (!this.tokenPromise && (!this.token || (_a = this.token) != null && _a.needsRefresh())) {
        let tokenPromise = this.fetchCopilotTokenEnvelope().then(env => {
          let token = new CopilotToken(env);
          return this.tokenPromise !== tokenPromise ? token : (this.token = token, this.tokenPromise = void 0, this.ctx.get(StatusReporter).forceNormal(), this.token);
        }, e => {
          if (this.tokenPromise !== tokenPromise) throw e;
          this.tokenPromise = void 0;
          let reporter = this.ctx.get(StatusReporter);
          if (e instanceof TokenResultError) switch (e.result.reason) {
            case "NotSignedIn":
              reporter.setError("You are not signed into GitHub.", {
                command: "github.copilot.signIn",
                title: "Sign In"
              });
              break;
            case "HTTP401":
              reporter.setError("Your GitHub token is invalid. Try signing in again.");
              break;
            case "NotAuthorized":
              reporter.setError(e.message || "No access to Copilot found.");
              break;
          } else reporter.setWarning(String(e));
          throw e;
        });
        this.tokenPromise = tokenPromise;
      }
      return this.token && !this.token.isExpired() ? this.token : await this.tokenPromise;
    }
    resetToken(httpError) {
      httpError !== void 0 ? (telemetry(this.ctx, "auth.reset_token_" + httpError), authLogger.debug(this.ctx, `Resetting copilot token on HTTP error ${httpError}`)) : authLogger.debug(this.ctx, "Resetting copilot token"), this.token = void 0, this.tokenPromise = void 0;
    }
  };

,__name(_CopilotTokenManagerFromGitHubTokenBase, "CopilotTokenManagerFromGitHubTokenBase");

,var CopilotTokenManagerFromGitHubTokenBase = _CopilotTokenManagerFromGitHubTokenBase;