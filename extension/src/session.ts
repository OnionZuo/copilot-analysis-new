var import_vscode = require("vscode");

,var GITHUB_SCOPE_READ_USER = ["read:user"],
  GITHUB_SCOPE_ALIGNED = ["read:user", "user:email", "repo", "workflow"];

,function authProviderId() {
  var _a;
  return ((_a = uk.workspace.getConfiguration(CopilotConfigPrefix).get("advanced")) == null ? void 0 : _a.authProvider) === "github-enterprise" ? "github-enterprise" : "github";
},__name(authProviderId, "authProviderId");

,function isAuthMinimalMode() {
  var _a;
  return ((_a = uk.workspace.getConfiguration(CopilotConfigPrefix).get("advanced")) == null ? void 0 : _a.authPermissions) === "minimal";
},__name(isAuthMinimalMode, "isAuthMinimalMode");

,async function getSessionHelper(options) {
  let providerId = authProviderId(),
    scope_options = {
      silent: !0
    };
  options.forceNewSession && (scope_options = options);
  let session;
  try {
    isAuthMinimalMode() || (session = await uk.authentication.getSession(providerId, GITHUB_SCOPE_ALIGNED, scope_options), session != null || (session = await uk.authentication.getSession(providerId, GITHUB_SCOPE_READ_USER, scope_options))), session != null || (session = await uk.authentication.getSession(providerId, GITHUB_MINIMAL_SCOPE, options));
  } catch (e) {
    throw typeof e == "string" ? new TokenResultError({
      reason: "NotSignedIn",
      message: e
    }) : e instanceof Error && e.message === "Cancelled" ? new TokenResultError({
      reason: "NotSignedIn",
      message: e.message
    }) : e;
  }
  return session;
},__name(getSessionHelper, "getSessionHelper");

,async function getExistingSession() {
  return await getSessionHelper({
    createIfNone: !1
  });
},__name(getExistingSession, "getExistingSession");

,async function getOrCreateSession() {
  return getSessionHelper({
    createIfNone: !0
  });
},__name(getOrCreateSession, "getOrCreateSession");

,function attemptAuthentication(ctx) {
  return ctx.get(StatusReporter).withProgress(() => ctx.get(CopilotTokenManager).getToken()).then(() => !0, () => !1);
},__name(attemptAuthentication, "attemptAuthentication");

,async function signInCommand(ctx) {
  telemetryAuthNotifyShown(ctx, "command"), telemetryNewGitHubLogin(ctx, "command", "editorAuth"), await getOrCreateSession(), await attemptAuthentication(ctx);
},__name(signInCommand, "signInCommand");

,var _VSCodeCopilotTokenManager = class _VSCodeCopilotTokenManager extends CopilotTokenManagerFromGitHubTokenBase {
  constructor() {
    super(...arguments);
    this.everActivated = !1;
    this.shown401Message = !1;
  }
  async getGitHubSession() {
    let session = await getExistingSession();
    return session ? {
      token: session.accessToken
    } : void 0;
  }
  async getToken() {
    try {
      let token = await super.getToken();
      return this.everActivated = !0, DS.commands.executeCommand("setContext", "github.copilot.activated", !0), token;
    } catch (e) {
      if (DS.commands.executeCommand("setContext", "github.copilot.activated", !1), e instanceof TokenResultError && e.result.reason === "HTTP401") {
        let message = "Your GitHub token is invalid. Please sign out from your GitHub account using the Visual Studio Code UI and try again.";
        this.everActivated && !this.shown401Message && (this.shown401Message = !0, DS.window.showWarningMessage(message));
      }
      throw e;
    }
  }
};

,__name(_VSCodeCopilotTokenManager, "VSCodeCopilotTokenManager");

,var VSCodeCopilotTokenManager = _VSCodeCopilotTokenManager;