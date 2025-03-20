var _GitHubRepositoryApi = class _GitHubRepositoryApi {
  constructor(ctx) {
    this.ctx = ctx;
    this.githubRepositoryInfoCache = new Map();
  }
  async getRepositoryInfo(owner, repo) {
    let cachedInfo = this.githubRepositoryInfoCache.get(`${owner}/${repo}`);
    if (cachedInfo) return cachedInfo;
    let response = await this._doGetRepositoryInfo(owner, repo);
    if (response.ok) {
      let repoInfo = await response.json();
      return this.githubRepositoryInfoCache.set(`${owner}/${repo}`, repoInfo), repoInfo;
    }
    throw new Error(`Failed to fetch repository info for ${owner}/${repo}`);
  }
  async _doGetRepositoryInfo(owner, repo) {
    let authToken = await this.ctx.get(CopilotTokenManager).getGitHubToken(),
      headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      };
    authToken && (headers.Authorization = `Bearer ${authToken}`);
    let repoUrl = this.ctx.get(NetworkConfiguration).getAPIUrl(`repos/${owner}/${repo}`);
    return this.ctx.get(Fetcher).fetch(repoUrl, {
      method: "GET",
      headers: headers
    });
  }
  async isAvailable(org, repo) {
    try {
      return (await this._doGetRepositoryInfo(org, repo)).ok;
    } catch {
      return !1;
    }
  }
};

,__name(_GitHubRepositoryApi, "GitHubRepositoryApi");

,var GitHubRepositoryApi = _GitHubRepositoryApi;