var DotComAuthority = "github.com",
  DotComUrl = `https://${DotComAuthority}`,
  CAPIDotComUrl = "https://api.githubcopilot.com",
  TelemetryDotComUrl = "https://copilot-telemetry.githubusercontent.com/telemetry",
  ExperimentationDotComUrl = "https://copilot-telemetry.githubusercontent.com/telemetry",
  OpenAIProxyUrl = "https://copilot-proxy.githubusercontent.com",
  OriginTrackerUrl = "https://origin-tracker.githubusercontent.com",
  _DefaultNetworkConfiguration = class _DefaultNetworkConfiguration extends NetworkConfiguration {
    constructor(ctx, url = DotComUrl, env = process.env) {
      super();
      this.env = env;
      this.recalculateUrlDefaults(url), onCopilotToken(ctx, token => this.onCopilotToken(ctx, token));
    }
    onCopilotToken(ctx, token) {
      token.envelope.endpoints && this.updateServiceEndpoints(ctx, token.envelope.endpoints);
    }
    isGitHubEnterprise() {
      return this.isEnterprise;
    }
    getAuthAuthority() {
      return this.baseUrlObject.host;
    }
    getAPIUrl(path) {
      return this.join(this.apiUrl, path);
    }
    getTokenUrl(githubToken) {
      var _a, _b;
      return (_b = (_a = githubToken.devOverride) == null ? void 0 : _a.copilotTokenUrl) != null ? _b : this.tokenUrl;
    }
    getNotificationUrl(githubToken) {
      var _a, _b;
      return (_b = (_a = githubToken.devOverride) == null ? void 0 : _a.notificationUrl) != null ? _b : this.notificationUrl;
    }
    getContentRestrictionsUrl(githubToken) {
      var _a, _b;
      return (_b = (_a = githubToken.devOverride) == null ? void 0 : _a.contentRestrictionsUrl) != null ? _b : this.contentRestrictionsUrl;
    }
    getBlackbirdIndexingStatusUrl() {
      return this.blackbirdIndexingStatusUrl;
    }
    getLoginReachabilityUrl() {
      return this.loginReachabilityUrl;
    }
    getDeviceFlowStartUrl() {
      return this.deviceFlowStartUrl;
    }
    getDeviceFlowCompletionUrl() {
      return this.deviceFlowCompletionUrl;
    }
    getSignUpLimitedUrl() {
      return this.signUpLimitedUrl;
    }
    getUserInfoUrl() {
      return this.userInfoUrl;
    }
    getCAPIUrl(ctx, path) {
      let url = this.urlOrConfigOverride(ctx, this.capiUrl, [ConfigKey.DebugOverrideCapiUrl, ConfigKey.DebugOverrideCapiUrlLegacy], [ConfigKey.DebugTestOverrideCapiUrl, ConfigKey.DebugTestOverrideCapiUrlLegacy]);
      return this.join(url, path);
    }
    getBlackbirdCodeSearchUrl(ctx) {
      return this.getCAPIUrl(ctx, "/search/code");
    }
    getBlackbirdDocsSearchUrl(ctx) {
      return this.getCAPIUrl(ctx, "/search/docs");
    }
    getEmbeddingsUrl(ctx) {
      return this.getCAPIUrl(ctx, "/embeddings");
    }
    getTelemetryUrl(path) {
      return this.join(this.telemetryUrl, path);
    }
    setTelemetryUrlForTesting(url) {
      this.telemetryUrl = url;
    }
    getExperimentationUrl(path) {
      return this.join(this.experimentationUrl, path);
    }
    getCompletionsUrl(ctx, path) {
      let url = this.urlOrConfigOverride(ctx, this.completionsUrl, [ConfigKey.DebugOverrideProxyUrl, ConfigKey.DebugOverrideProxyUrlLegacy], [ConfigKey.DebugTestOverrideProxyUrl, ConfigKey.DebugTestOverrideProxyUrlLegacy]);
      return this.join(url, path);
    }
    getSnippetRetrievalUrl(ctx, repoNwo, serverRouteImpl) {
      let url = new URL(this.getCompletionsUrl(ctx, "v0/retrieval"));
      return url.search = new URLSearchParams({
        repo: repoNwo,
        impl: serverRouteImpl
      }).toString(), url.href;
    }
    getOriginTrackingUrl(ctx, path) {
      let url = isProduction(ctx) ? this.originTrackerUrl : this.urlOrConfigOverride(ctx, this.originTrackerUrl, [ConfigKey.DebugSnippyOverrideUrl]);
      return this.join(url, path);
    }
    updateBaseUrl(ctx, newUrl) {
      newUrl || (a = DotComUrl);
      let oldUrl = this.baseUrlObject;
      if (!this.isPermittedUrl(ctx, newUrl)) {
        ctx.get(NotificationSender).showWarningMessage(`Ignoring invalid or unsupported authentication URL "${newUrl}".`);
        return;
      }
      this.withTelemetryReInitialization(ctx, () => {
        this.recalculateUrlDefaults(newUrl), oldUrl.href !== this.baseUrlObject.href && ctx.get(CopilotTokenManager).resetToken();
      });
    }
    updateBaseUrlFromTokenEndpoint(ctx, tokenUrl) {
      try {
        let endpoint = new URL(tokenUrl);
        endpoint.hostname.startsWith("api.") ? this.updateBaseUrl(ctx, `https://${endpoint.hostname.substring(4)}`) : this.updateBaseUrl(ctx);
      } catch {
        this.updateBaseUrl(ctx);
      }
    }
    updateServiceEndpoints(ctx, endpoints) {
      this.isPermittedUrl(ctx, endpoints.api) && (this.capiUrl = endpoints.api), this.isPermittedUrl(ctx, endpoints.proxy) && (this.completionsUrl = endpoints.proxy), this.isPermittedUrl(ctx, endpoints["origin-tracker"]) && (this.originTrackerUrl = endpoints["origin-tracker"]), this.isPermittedUrl(ctx, endpoints.telemetry) && this.withTelemetryReInitialization(ctx, () => {
        this.telemetryUrl = this.join(endpoints.telemetry, "telemetry"), this.experimentationUrl = this.join(endpoints.telemetry, "telemetry");
      });
    }
    withTelemetryReInitialization(ctx, fn) {
      let origUrl = this.telemetryUrl;
      if (fn(), origUrl === this.telemetryUrl) return;
      let telemetry = ctx.get(TelemetryInitialization);
      telemetry.isInitialized && telemetry.reInitialize(ctx);
    }
    recalculateUrlDefaults(url) {
      let urls = this.parseUrls(url);
      this.baseUrlObject = urls.base;
      let apiUrl = urls.api;
      this.isEnterprise = this.baseUrlObject.host !== DotComAuthority, this.apiUrl = apiUrl.href, this.tokenUrl = this.join(apiUrl.href, "/copilot_internal/v2/token"), this.notificationUrl = this.join(apiUrl.href, "/copilot_internal/notification"), this.contentRestrictionsUrl = this.join(apiUrl.href, "/copilot_internal/content_exclusion"), this.blackbirdIndexingStatusUrl = this.join(apiUrl.href, "/copilot_internal/check_indexing_status"), this.loginReachabilityUrl = this.join(this.baseUrlObject.href, "/login/device"), this.deviceFlowStartUrl = this.join(this.baseUrlObject.href, "/login/device/code"), this.deviceFlowCompletionUrl = this.join(this.baseUrlObject.href, "/login/oauth/access_token"), this.userInfoUrl = this.join(apiUrl.href, "/user"), this.signUpLimitedUrl = this.join(apiUrl.href, "/copilot_internal/subscribe_limited_user"), this.capiUrl = this.isEnterprise ? this.prefixWith("copilot-api.", this.baseUrlObject).href : CAPIDotComUrl, this.telemetryUrl = this.isEnterprise ? this.join(this.prefixWith("copilot-telemetry-service.", this.baseUrlObject).href, "/telemetry") : TelemetryDotComUrl, this.experimentationUrl = this.isEnterprise ? this.join(this.prefixWith("copilot-telemetry-service.", this.baseUrlObject).href, "/telemetry") : ExperimentationDotComUrl, this.completionsUrl = OpenAIProxyUrl, this.originTrackerUrl = OriginTrackerUrl;
    }
    parseUrls(url) {
      if (this.env.CODESPACES === "true" && this.env.GITHUB_TOKEN && this.env.GITHUB_SERVER_URL && this.env.GITHUB_API_URL) try {
        return {
          base: new URL(this.env.GITHUB_SERVER_URL),
          api: new URL(this.env.GITHUB_API_URL)
        };
      } catch {}
      let base = new URL(url),
        api = this.prefixWith("api.", base);
      return {
        base: base,
        api: api
      };
    }
    isPermittedUrl(ctx, url) {
      return this.isValidUrl(url) && this.hasSupportedProtocol(ctx, url);
    }
    isValidUrl(url) {
      try {
        if (url) return new URL(url), !0;
      } catch {}
      return !1;
    }
    hasSupportedProtocol(ctx, url) {
      let proto = new URL(url).protocol;
      return proto === "https:" || !isProduction(ctx) && proto === "http:";
    }
    join(url, path) {
      return path ? new URL(path, url).href : url;
    }
    prefixWith(prefix, url) {
      return new URL(`${url.protocol}//${prefix}${url.host}`);
    }
    urlOrConfigOverride(ctx, url, overrideKeys, testOverrideKeys) {
      if (testOverrideKeys && isRunningInTest(ctx)) {
        for (let overrideKey of testOverrideKeys) {
          let override = getConfig(ctx, overrideKey);
          if (override) return override;
        }
        return url;
      }
      for (let overrideKey of overrideKeys) {
        let override = getConfig(ctx, overrideKey);
        if (override) return override;
      }
      return url;
    }
  };

,__name(_DefaultNetworkConfiguration, "DefaultNetworkConfiguration");

,var DefaultNetworkConfiguration = _DefaultNetworkConfiguration;