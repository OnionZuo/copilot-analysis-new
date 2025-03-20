var _BlackbirdIndexingStatus = class _BlackbirdIndexingStatus {
  constructor() {
    this._cache = new LRUCacheMap(100);
  }
  async queryIndexingStatus(turnContext, repoNwo, githubToken) {
    let ctx = turnContext.ctx,
      indexingStatusUrl = ctx.get(NetworkConfiguration).getBlackbirdIndexingStatusUrl();
    if (!githubToken) return !1;
    let url = new URL(indexingStatusUrl);
    url.searchParams.set("nwo", repoNwo);
    let headers = {
        Authorization: `token ${githubToken}`
      },
      response = await ctx.get(Fetcher).fetch(url.href, {
        method: "GET",
        headers: headers
      });
    if (!response.ok) return !1;
    let json = await response.json();
    return json.docs_status === "indexed" || json.code_status === "indexed";
  }
  isValid(cacheEntry) {
    return cacheEntry !== void 0 && Date.now() - cacheEntry.timestamp < 30 * 60 * 1e3;
  }
  async isRepoIndexed(turnContext, repoInfo, githubToken, forceCheck = !1) {
    let repoNwo = tryGetGitHubNWO(repoInfo);
    if (!repoNwo) return !1;
    let cached = this._cache.get(repoNwo);
    if (!forceCheck && this.isValid(cached)) return cached.status;
    let status = await this.queryIndexingStatus(turnContext, repoNwo, githubToken);
    return this._cache.set(repoNwo, {
      status: status,
      timestamp: Date.now()
    }), status;
  }
  get cache() {
    return this._cache;
  }
};

,__name(_BlackbirdIndexingStatus, "BlackbirdIndexingStatus");

,var BlackbirdIndexingStatus = _BlackbirdIndexingStatus;