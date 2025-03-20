var TELEMETRY_NAME = "contentExclusion",
  _context,
  _evaluateResultCache,
  _ruleLoaderCache,
  _CopilotContentExclusion_instances,
  rulesForScope_fn,
  _testingRules,
  _ruleLoader,
  telemetry_fn,
  _CopilotContentExclusion = class _CopilotContentExclusion extends PolicyEvaluator {
    constructor(context) {
      super();
      __privateAdd(this, _CopilotContentExclusion_instances);
      __privateAdd(this, _context);
      __privateAdd(this, _evaluateResultCache, new LRUCacheMap(1e4));
      __privateAdd(this, _ruleLoaderCache, new LRUCacheMap(200));
      __privateAdd(this, _testingRules);
      __privateAdd(this, _ruleLoader, o(async scopes => {
        let session = await __privateGet(this, _context).get(CopilotTokenManager).getGitHubSession();
        if (!session) throw new CopilotAuthError("No token found");
        let endpoint = __privateGet(this, _context).get(NetworkConfiguration).getContentRestrictionsUrl(session),
          url = new URL(endpoint),
          hasAllScope = scopes.includes(SCOPES.all);
        scopes.filter(s => s !== SCOPES.all).length > 0 && url.searchParams.set("repos", scopes.filter(s => s !== SCOPES.all).join(",")), url.searchParams.set("scope", hasAllScope ? SCOPES.all : SCOPES.repo);
        let result = await __privateGet(this, _context).get(Fetcher).fetch(url.href, {
            method: "GET",
            headers: {
              Authorization: `token ${session.token}`
            }
          }),
          data = await result.json();
        if (!result.ok) {
          if (result.status === 404) return Array.from(scopes, () => []);
          throw __privateMethod(this, _CopilotContentExclusion_instances, telemetry_fn).call(this, "fetch.error", {
            message: data.message
          }), new FetchResponseError(result);
        }
        return __privateMethod(this, _CopilotContentExclusion_instances, telemetry_fn).call(this, "fetch.success"), assertShape(ContentRestrictionsResponseSchema, data).map(r => r.rules);
      }, __privateGet(this, _ruleLoaderCache)));
      __privateSet(this, _context, context);
    }
    async evaluate(uri, fileContent) {
      var _a, _b;
      try {
        uri = resolveFilePath(uri).toString();
        let repoInfo = await this.getGitRepo(uri),
          rules = await __privateMethod(this, _CopilotContentExclusion_instances, rulesForScope_fn).call(this, (_a = repoInfo == null ? void 0 : repoInfo.url) != null ? _a : SCOPES.all);
        if (!rules) return NOT_BLOCKED_NO_MATCHING_POLICY_RESPONSE;
        let basePath = (_b = repoInfo == null ? void 0 : repoInfo.baseFolder) != null ? _b : "file://",
          filePathResult = await this.evaluateFilePathRules(uri, basePath, rules);
        if (filePathResult.isBlocked) return filePathResult;
        let textBasedResult = await this.evaluateTextBasedRules(uri, rules, fileContent);
        if (textBasedResult.isBlocked) return textBasedResult;
      } catch (err) {
        return logger.exception(__privateGet(this, _context), err, `${TELEMETRY_NAME}.evaluate`), BLOCKED_POLICY_ERROR_RESPONSE;
      }
      return NOT_BLOCKED_RESPONSE;
    }
    async evaluateFilePathRules(uri, baseUri, rules) {
      let cacheKey = uri;
      if (__privateGet(this, _evaluateResultCache).has(cacheKey)) return __privateGet(this, _evaluateResultCache).get(cacheKey);
      let result = NOT_BLOCKED_RESPONSE,
        matchingPattern,
        fileName = percentDecode(uri.replace(baseUri, ""));
      ruleLoop: for (let rule of rules) for (let pattern of rule.paths) if (minimatch(fileName, pattern, {
        nocase: !0,
        matchBase: !0,
        nonegate: !0,
        dot: !0
      })) {
        result = fileBlockedEvaluationResult(rule, "FILE_BLOCKED_PATH"), matchingPattern = pattern;
        break ruleLoop;
      }
      return logger.debug(__privateGet(this, _context), `Evaluated path-based exclusion rules for <${uri}>`, {
        result: result,
        baseUri: baseUri,
        fileName: fileName,
        matchingPattern: matchingPattern
      }), __privateGet(this, _evaluateResultCache).set(cacheKey, result), result;
    }
    async evaluateTextBasedRules(uri, rules, fileContent) {
      let blockedIfAnyMatchRules = rules.filter(r => r.ifAnyMatch),
        blockedIfNoneMatchRules = rules.filter(r => r.ifNoneMatch);
      if (!fileContent || blockedIfAnyMatchRules.length === 0 && blockedIfNoneMatchRules.length === 0) return NOT_BLOCKED_RESPONSE;
      let result = await this.evaluateFileContent(blockedIfAnyMatchRules, blockedIfNoneMatchRules, fileContent);
      return logger.debug(__privateGet(this, _context), `Evaluated text-based exclusion rules for <${uri}>`, {
        result: result
      }), result;
    }
    async evaluateFileContent(blockedIfAnyMatchRules, blockedIfNoneMatchRules, fileContent) {
      for (let rule of blockedIfAnyMatchRules) if (rule.ifAnyMatch && rule.ifAnyMatch.length > 0 && rule.ifAnyMatch.map(r => stringToRegex(r)).some(r => r.test(fileContent))) return fileBlockedEvaluationResult(rule, "FILE_BLOCKED_TEXT_BASED");
      for (let rule of blockedIfNoneMatchRules) if (rule.ifNoneMatch && rule.ifNoneMatch.length > 0 && !rule.ifNoneMatch.map(r => stringToRegex(r)).some(r => r.test(fileContent))) return fileBlockedEvaluationResult(rule, "FILE_BLOCKED_TEXT_BASED");
      return NOT_BLOCKED_RESPONSE;
    }
    async refresh() {
      try {
        let existingUrls = [...__privateGet(this, _ruleLoaderCache).keys()];
        this.reset(), await Promise.all(existingUrls.map(url => __privateGet(this, _ruleLoader).call(this, url)));
      } catch (err) {
        telemetryException(__privateGet(this, _context), err, `${TELEMETRY_NAME}.refresh`);
      }
    }
    reset() {
      __privateGet(this, _ruleLoaderCache).clear(), __privateGet(this, _evaluateResultCache).clear();
    }
    setTestingRules(rules) {
      __privateSet(this, _testingRules, rules);
    }
    async getGitRepo(uri) {
      let repo = await __privateGet(this, _context).get(RepositoryManager).getRepo(dirname(uri));
      if (!repo || !(repo != null && repo.remote)) return;
      let strippedUrl = repo.remote.getUrlForApi();
      if (strippedUrl) return {
        baseFolder: repo.baseFolder,
        url: strippedUrl
      };
    }
  };

,_context = new WeakMap(), _evaluateResultCache = new WeakMap(), _ruleLoaderCache = new WeakMap(), _CopilotContentExclusion_instances = new WeakSet(), rulesForScope_fn = __name(async function (scope) {
  var _a;
  if ((_a = __privateGet(this, _testingRules)) != null && _a.length) return __privateGet(this, _testingRules);
  let rules = await __privateGet(this, _ruleLoader).call(this, scope.toLowerCase());
  if (rules.length !== 0) return rules;
}, "#rulesForScope"), _testingRules = new WeakMap(), _ruleLoader = new WeakMap(), telemetry_fn = __name(function (event, properties, measurements) {
  telemetry(__privateGet(this, _context), `${TELEMETRY_NAME}.${event}`, TelemetryData.createAndMarkAsIssued(properties, measurements));
}, "#telemetry"), __name(_CopilotContentExclusion, "CopilotContentExclusion");

,var CopilotContentExclusion = _CopilotContentExclusion;

,function stringToRegex(str) {
  if (!str.startsWith("/") && !str.endsWith("/")) return new RegExp(str);
  let pattern = str.slice(1, str.lastIndexOf("/")),
    flags = str.slice(str.lastIndexOf("/") + 1);
  return new RegExp(pattern, flags);
},__name(stringToRegex, "stringToRegex");

,function fileBlockedEvaluationResult(rule, reason) {
  return {
    isBlocked: !0,
    message: `Your ${rule.source.type.toLowerCase()} '${rule.source.name}' has disabled Copilot for this file`,
    reason: reason
  };
},__name(fileBlockedEvaluationResult, "fileBlockedEvaluationResult");

,var SourceSchema = Type.Object({
    name: Type.String(),
    type: Type.String()
  }),
  RuleSchema = Type.Object({
    paths: Type.Array(Type.String()),
    ifNoneMatch: Type.Optional(Type.Array(Type.String())),
    ifAnyMatch: Type.Optional(Type.Array(Type.String())),
    source: SourceSchema
  }),
  RulesSchema = Type.Array(RuleSchema),
  RepoRuleSchema = Type.Object({
    rules: RulesSchema,
    last_updated_at: Type.String(),
    scope: Type.String()
  }),
  ContentRestrictionsResponseSchema = Type.Array(RepoRuleSchema);