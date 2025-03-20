var fs = fn(require("fs"));

,var tokenFileName = `${process.env.HOME}/.copilot-testing-gh-token`,
  githubToken,
  copilotToken;

,async function setTestingCopilotTokenManager(ctx) {
  ctx.forceSet(CopilotTokenManager, new FixedCopilotTokenManager(await getCopilotToken()));
},__name(setTestingCopilotTokenManager, "setTestingCopilotTokenManager");

,var getCopilotToken = __name(async () => {
  var _a;
  if (process.env.GH_COPILOT_IDE_TOKEN) return process.env.GH_COPILOT_IDE_TOKEN;
  let ghCopilotToken = (_a = process.env.GH_COPILOT_TOKEN) != null ? _a : "";
  if (/=/.test(ghCopilotToken)) return ghCopilotToken;
  if (copilotToken) return copilotToken;
  let githubToken = ghCopilotToken || process.env.GITHUB_COPILOT_TOKEN || (await getTestingGitHubToken()),
    ctx = createLibTestingContext(),
    fetcher = new HelixFetcher(ctx);
  return ctx.forceSet(Fetcher, fetcher), copilotToken = authFromGitHubToken(ctx, {
    token: githubToken
  }).then(ctr => {
    if (ctr.kind === "success") return ctr.envelope.token;
    throw new CopilotAuthError('Could not fetch testing Copilot token. Try running "npm run get_token" again?');
  }), copilotToken;
}, "getCopilotToken");

,async function getTestingGitHubToken() {
  var _a;
  try {
    githubToken != null || (githubToken = (await fje.promises.readFile(tokenFileName)).toString().trim());
  } catch {
    githubToken != null || (githubToken = (_a = process.env.GITHUB_TOKEN) != null ? _a : "");
  }
  if (!githubToken) throw new Error(`Tests: either GH_COPILOT_IDE_TOKEN, GH_COPILOT_TOKEN, or GITHUB_TOKEN must be set, or there must be a GitHub token from an app with access to Copilot in ${tokenFileName}. Run "npm run get_token" to get one.`);
  return githubToken;
},__name(getTestingGitHubToken, "getTestingGitHubToken");

,function createTestCopilotToken(envelope) {
  return new CopilotToken({
    token: `test token ${v4_default()}`,
    refresh_in: 0,
    expires_at: 0,
    ...envelope
  });
},__name(createTestCopilotToken, "createTestCopilotToken");