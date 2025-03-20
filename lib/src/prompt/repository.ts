var import_git_url_parse = fn(Eve());

,function isRepoInfo(info) {
  return info !== void 0 && info !== 0;
},__name(isRepoInfo, "isRepoInfo");

,async function getUserKind(ctx) {
  var _a, _b;
  let orgs = (_a = (await ctx.get(CopilotTokenManager).getToken()).organization_list) != null ? _a : [];
  return (_b = findKnownOrg(orgs)) != null ? _b : "";
},__name(getUserKind, "getUserKind");

,async function getTokenKeyValue(ctx, key) {
  var _a;
  return (_a = (await ctx.get(CopilotTokenManager).getToken()).getTokenValue(key)) != null ? _a : "";
},__name(getTokenKeyValue, "getTokenKeyValue");

,function getDogFood(repoInfo) {
  var _a;
  if (repoInfo === void 0 || repoInfo === 0) return "";
  let ghnwo = tryGetGitHubNWO(repoInfo);
  if (ghnwo === "github/github") return ghnwo;
  let adoNwo = (_a = tryGetADONWO(repoInfo)) == null ? void 0 : _a.toLowerCase();
  return adoNwo !== void 0 ? adoNwo : "";
},__name(getDogFood, "getDogFood");

,function tryGetGitHubNWO(repoInfo) {
  if (repoInfo !== void 0 && repoInfo !== 0 && repoInfo.hostname === "github.com") return repoInfo.owner + "/" + repoInfo.repo;
},__name(tryGetGitHubNWO, "tryGetGitHubNWO");

,function tryGetADONWO(repoInfo) {
  if (repoInfo !== void 0 && repoInfo !== 0 && (repoInfo.hostname.endsWith("azure.com") || repoInfo.hostname.endsWith("visualstudio.com"))) return repoInfo.owner + "/" + repoInfo.repo;
},__name(tryGetADONWO, "tryGetADONWO");

,function extractRepoInfoInBackground(ctx, uri) {
  let baseFolder = dirname(uri);
  return backgroundRepoInfo(ctx, baseFolder);
},__name(extractRepoInfoInBackground, "extractRepoInfoInBackground");

,var backgroundRepoInfo = computeInBackgroundAndMemoize(extractRepoInfo, 1e4);

,async function extractRepoInfo(ctx, uri) {
  var _a, _b;
  if (!getFsPath(uri)) return;
  let baseUri = await getRepoBaseUri(ctx, uri.toString());
  if (!baseUri) return;
  let fs = ctx.get(FileSystem),
    configUri = joinPath(baseUri, ".git", "config"),
    gitConfig;
  try {
    gitConfig = await fs.readFileString(configUri);
  } catch {
    return;
  }
  let url = (_a = getRepoUrlFromConfigText(gitConfig)) != null ? _a : "",
    parsedResult = parseRepoUrl(url),
    baseFolder = (_b = getFsPath(baseUri)) != null ? _b : "";
  return parsedResult === void 0 ? {
    baseFolder: baseFolder,
    url: url,
    hostname: "",
    owner: "",
    repo: "",
    pathname: ""
  } : {
    baseFolder: baseFolder,
    url: url,
    ...parsedResult
  };
},__name(extractRepoInfo, "extractRepoInfo");

,function parseRepoUrl(url) {
  let parsedUrl;
  try {
    if (parsedUrl = (0, Bve.GitUrlParse)(url), parsedUrl.resource == "" || parsedUrl.owner == "" || parsedUrl.name == "" || parsedUrl.pathname == "") return;
  } catch {
    return;
  }
  return {
    hostname: parsedUrl.resource,
    owner: parsedUrl.owner,
    repo: parsedUrl.name,
    pathname: parsedUrl.pathname
  };
},__name(parseRepoUrl, "parseRepoUrl");

,async function getRepoBaseUri(ctx, uri) {
  let previousUri = uri + "_add_to_make_longer",
    fs = ctx.get(FileSystem);
  for (; uri !== "file:///" && uri.length < previousUri.length;) {
    let configUri = joinPath(uri, ".git", "config"),
      result = !1;
    try {
      await fs.stat(configUri), result = !0;
    } catch {
      result = !1;
    }
    if (result) return uri;
    previousUri = uri, uri = dirname(uri);
  }
},__name(getRepoBaseUri, "getRepoBaseUri");

,function getRepoUrlFromConfigText(gitConfig) {
  var _a;
  let remoteSectionRegex = /^\s*\[\s*remote\s+"((\\\\|\\"|[^\\"])+)"/,
    deprecatedRemoteSectionRegex = /^\s*\[remote.([^"\s]+)/,
    setUrlRegex = /^\s*url\s*=\s*([^\s#;]+)/,
    newSectionRegex = /^\s*\[/,
    remoteUrl,
    remoteSection,
    isWithinMultilineUrl = !1;
  for (let line of gitConfig.split(`
`)) if (isWithinMultilineUrl && remoteUrl !== void 0) {
    if (remoteUrl += line, line.endsWith("\\")) remoteUrl = remoteUrl.substring(0, remoteUrl.length - 1);else if (isWithinMultilineUrl = !1, remoteSection === "origin") return remoteUrl;
  } else {
    let remoteSectionMatch = (_a = line.match(remoteSectionRegex)) != null ? _a : line.match(deprecatedRemoteSectionRegex);
    if (remoteSectionMatch) remoteSection = remoteSectionMatch[1];else if (line.match(newSectionRegex)) remoteSection = void 0;else {
      if (remoteUrl && remoteSection !== "origin") continue;
      {
        let urlMatch = line.match(setUrlRegex);
        if (urlMatch) {
          if (remoteUrl = urlMatch[1], remoteUrl.endsWith("\\")) remoteUrl = remoteUrl.substring(0, remoteUrl.length - 1), isWithinMultilineUrl = !0;else if (remoteSection === "origin") return remoteUrl;
        }
      }
    }
  }
  return remoteUrl;
},__name(getRepoUrlFromConfigText, "getRepoUrlFromConfigText");

,var _CompletedComputation = class _CompletedComputation {
  constructor(result) {
    this.result = result;
  }
};

,__name(_CompletedComputation, "CompletedComputation");

,var CompletedComputation = _CompletedComputation;

,function computeInBackgroundAndMemoize(fct, cacheSize) {
  let resultsCache = new LRUCacheMap(cacheSize),
    inComputation = new Set();
  return (ctx, ...args) => {
    let key = JSON.stringify(args),
      memorizedComputation = resultsCache.get(key);
    if (memorizedComputation) return memorizedComputation.result;
    if (inComputation.has(key)) return 0;
    let computation = fct(ctx, ...args);
    return inComputation.add(key), computation.then(computedResult => {
      resultsCache.set(key, new CompletedComputation(computedResult)), inComputation.delete(key);
    }), 0;
  };
},__name(computeInBackgroundAndMemoize, "computeInBackgroundAndMemoize");