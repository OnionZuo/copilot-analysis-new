var import_semver = fn(dU()),
  import_stream = require("stream");

,var logger = new Logger("fetcher"),
  _ElectronFetcher = class _ElectronFetcher extends Fetcher {
    constructor(ctx, net) {
      super();
      this.net = net;
      this.name = "ElectronFetcher";
      this.userAgent = `GithubCopilot/${ctx.get(BuildInfo).getVersion()}`;
    }
    static create(ctx, versions = process.versions) {
      if (!(!versions.electron || (0, yet.lt)(versions.electron, "28.2.5"))) try {
        let net = require("electron").net;
        return net ? new _ElectronFetcher(ctx, net) : void 0;
      } catch (e) {
        logger.error(ctx, "Failed to load electron net module", e);
      }
    }
    async fetch(url, options) {
      let headers = options.headers || {};
      headers["User-Agent"] = this.userAgent;
      let body = options.body;
      if (options.json) {
        if (options.body) throw new Error("Illegal arguments! Cannot pass in both 'body' and 'json'!");
        headers["Content-Type"] = "application/json", body = JSON.stringify(options.json);
      }
      let method = options.method || "GET";
      if (method !== "GET" && method !== "POST") throw new Error("Illegal arguments! 'method' must be either 'GET' or 'POST'!");
      if (options.signal && !(options.signal instanceof AbortSignal)) throw new Error("Illegal arguments! 'signal' must be an instance of AbortSignal!");
      let signal = AbortSignal.any([...(options.signal ? [options.signal] : []), ...(options.timeout ? [AbortSignal.timeout(options.timeout)] : [])]),
        resp = await this.net.fetch(url, {
          method: method,
          headers: headers,
          body: body,
          signal: signal
        });
      return new Response(resp.status, resp.statusText, resp.headers, () => resp.text(), () => {
        if (!resp.body) return Gye.Readable.from([]);
        let iterator = resp.body[Symbol.asyncIterator]();
        return Gye.Readable.from(iterator);
      });
    }
    async disconnectAll() {}
    makeAbortController() {
      return new AbortController();
    }
  };

,__name(_ElectronFetcher, "ElectronFetcher");

,var ElectronFetcher = _ElectronFetcher;

,var logger = new Logger("fetcher"),
  _ExtensionDelegatingFetcher = class _ExtensionDelegatingFetcher extends Fetcher {
    constructor(ctx, helixFetcher = new HelixFetcher(ctx), electronFetcher = ElectronFetcher.create(ctx), versions = process.versions) {
      super();
      this.ctx = ctx;
      this.helixFetcher = helixFetcher;
      this.electronFetcher = electronFetcher;
      this.versions = versions;
      this.electronFetcherFeatureFlag = !1;
      this.electronFetcherExperimentEnabled = !1;
      this.currentFetcher = this.helixFetcher, onCopilotToken(this.ctx, token => {
        var _a;
        this.electronFetcherFeatureFlag = (_a = token.envelope.vsc_electron_fetcher_v2) != null ? _a : !1, this.updateFetcher(), ctx.get(Features).updateExPValuesAndAssignments().then(telemExp => {
          this.electronFetcherExperimentEnabled = ctx.get(Features).enableElectronFetcher(telemExp), this.updateFetcher();
        });
      }), this.updateFetcher();
    }
    updateFetcher() {
      if (!this.electronFetcher) {
        logger.info(this.ctx, "Using Helix fetcher, Electron fetcher is not available."), this.currentFetcher = this.helixFetcher;
        return;
      }
      let debugUseElectronFetcher = getConfig(this.ctx, ConfigKey.DebugUseElectronFetcher);
      if (debugUseElectronFetcher === !0) {
        logger.info(this.ctx, "Using Electron fetcher, debug flag is enabled."), this.currentFetcher = this.electronFetcher;
        return;
      }
      if (debugUseElectronFetcher === !1) {
        logger.info(this.ctx, "Using Helix fetcher, debug flag is disabled."), this.currentFetcher = this.helixFetcher;
        return;
      }
      if (this.electronFetcherFeatureFlag === !0) {
        if (this.versions.electron && (0, wet.gte)(this.versions.electron, "30.4.0")) {
          logger.info(this.ctx, "Using Electron fetcher, feature flag is enabled."), this.currentFetcher = this.electronFetcher;
          return;
        }
        logger.info(this.ctx, "Electron fetcher feature flag enabled, but VS Code version is older than 1.93");
      }
      if (this.electronFetcherExperimentEnabled) {
        logger.info(this.ctx, "Using Electron fetcher, experiment is enabled."), this.currentFetcher = this.electronFetcher;
        return;
      }
      logger.info(this.ctx, "Using Helix fetcher."), this.currentFetcher = this.helixFetcher;
    }
    get name() {
      return this.currentFetcher.name;
    }
    set proxySettings(value) {
      this.helixFetcher.proxySettings = value;
    }
    get proxySettings() {
      return this.currentFetcher.proxySettings;
    }
    set rejectUnauthorized(value) {
      super.rejectUnauthorized = value, this.helixFetcher.rejectUnauthorized = value;
    }
    get rejectUnauthorized() {
      return super.rejectUnauthorized;
    }
    async fetch(url, options) {
      return this.currentFetcher.fetch(url, options);
    }
    async disconnectAll() {
      return this.currentFetcher.disconnectAll();
    }
    makeAbortController() {
      return this.currentFetcher.makeAbortController();
    }
  };

,__name(_ExtensionDelegatingFetcher, "ExtensionDelegatingFetcher");

,var ExtensionDelegatingFetcher = _ExtensionDelegatingFetcher;