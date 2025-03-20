var AuthTelemetryNames = {
  AuthNotifyShown: "auth.auth_notify_shown",
  AuthNotifyDismissed: "auth.auth_notify_dismissed",
  NewGitHubLogin: "auth.new_github_login",
  GitHubLoginSuccess: "auth.github_login_success"
};

,function telemetryAuthNotifyShown(ctx, authSource) {
  let data = TelemetryData.createAndMarkAsIssued({
    authSource: authSource
  });
  return telemetry(ctx, AuthTelemetryNames.AuthNotifyShown, data);
},__name(telemetryAuthNotifyShown, "telemetryAuthNotifyShown");

,function telemetryNewGitHubLogin(ctx, authSource, authType) {
  let data = TelemetryData.createAndMarkAsIssued({
    authSource: authSource,
    authType: authType
  });
  return telemetry(ctx, AuthTelemetryNames.NewGitHubLogin, data);
},__name(telemetryNewGitHubLogin, "telemetryNewGitHubLogin");