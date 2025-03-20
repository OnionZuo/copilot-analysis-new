var _GitRemoteResolver = class _GitRemoteResolver {
  async resolveRemote(ctx, baseFolder) {
    var _a, _b, _c, _d;
    let config = await ctx.get(GitConfigLoader).getConfig(ctx, baseFolder);
    if (!config) return;
    let remotes = this.getRemotes(config),
      gitHubRemotes = remotes.filter(r => r.url.isGitHub());
    if (gitHubRemotes.length) return (_b = (_a = gitHubRemotes.find(r => r.name === "origin")) == null ? void 0 : _a.url) != null ? _b : gitHubRemotes[0].url;
    if (remotes.length) return (_d = (_c = remotes.find(r => r.name === "origin")) == null ? void 0 : _c.url) != null ? _d : remotes[0].url;
  }
  getRemotes(config) {
    let rules = this.getInsteadOfRules(config);
    return config.getSectionValues("remote", "url").map(name => {
      var _a;
      return {
        name: name,
        url: new GitRemoteUrl(this.applyInsteadOfRules(rules, (_a = config.get(`remote.${name}.url`)) != null ? _a : ""))
      };
    }).filter(r => r.url.isRemote());
  }
  applyInsteadOfRules(rules, toValue) {
    for (let rule of rules) if (toValue.startsWith(rule.insteadOf)) return rule.base + toValue.slice(rule.insteadOf.length);
    return toValue;
  }
  getInsteadOfRules(config) {
    return config.getSectionValues("url", "insteadof").map(base => ({
      base: base,
      insteadOf: config.get(`url.${base}.insteadof`)
    })).sort((a, b) => b.base.length - a.base.length);
  }
};

,__name(_GitRemoteResolver, "GitRemoteResolver");

,var GitRemoteResolver = _GitRemoteResolver;