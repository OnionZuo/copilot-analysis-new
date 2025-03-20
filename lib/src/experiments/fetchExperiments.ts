var _ExpConfigMaker = class _ExpConfigMaker {};

,__name(_ExpConfigMaker, "ExpConfigMaker");

,var ExpConfigMaker = _ExpConfigMaker,
  _ExpConfigFromTAS = class _ExpConfigFromTAS extends ExpConfigMaker {
    constructor(overrideTASUrl = "", defaultFilters = {}) {
      super();
      this.overrideTASUrl = overrideTASUrl;
      this.defaultFilters = defaultFilters;
    }
    async fetchExperiments(ctx, filterHeaders) {
      var _a;
      let fetcher = ctx.get(Fetcher),
        headers = Object.keys(filterHeaders).length === 0 ? this.defaultFilters : filterHeaders,
        experimentationUrl = this.overrideTASUrl.length === 0 ? ctx.get(NetworkConfiguration).getExperimentationUrl() : this.overrideTASUrl,
        resp;
      try {
        resp = await fetcher.fetch(experimentationUrl, {
          method: "GET",
          headers: headers,
          timeout: 5e3
        });
      } catch (e) {
        return ExpConfig.createFallbackConfig(ctx, `Error fetching ExP config: ${String(e)}`);
      }
      if (!resp.ok) return ExpConfig.createFallbackConfig(ctx, `ExP responded with ${resp.status}`);
      let json;
      try {
        json = await resp.json();
      } catch (e) {
        if (e instanceof SyntaxError) return telemetryException(ctx, e, "fetchExperiments"), ExpConfig.createFallbackConfig(ctx, "ExP responded with invalid JSON");
        throw e;
      }
      let vscodeConfig = (_a = json.Configs.find(c => c.Id === "vscode")) != null ? _a : {
          Id: "vscode",
          Parameters: {}
        },
        features = Object.entries(vscodeConfig.Parameters).map(([name, value]) => name + (value ? "" : "cf"));
      return new ExpConfig(vscodeConfig.Parameters, json.AssignmentContext, features.join(";"));
    }
  };

,__name(_ExpConfigFromTAS, "ExpConfigFromTAS");

,var ExpConfigFromTAS = _ExpConfigFromTAS,
  _ExpConfigNone = class _ExpConfigNone extends ExpConfigMaker {
    async fetchExperiments(ctx, filterHeaders) {
      return ExpConfig.createEmptyConfig();
    }
  };

,__name(_ExpConfigNone, "ExpConfigNone");

,var ExpConfigNone = _ExpConfigNone;