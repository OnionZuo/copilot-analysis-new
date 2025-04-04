var _HelixFetcher = class _HelixFetcher extends Fetcher {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.name = "HelixFetcher";
    this.createSocketFactory = __name((userSettings, rejectUnauthorized) => async requestOptions => {
      requestOptions.rejectUnauthorized = rejectUnauthorized, requestOptions.timeout = userSettings.connectionTimeoutInMs, await this.certificateConfigurator.applyToRequestOptions(requestOptions);
      let proxySettings = await this.certificateConfigurator.enhanceProxySettings(userSettings);
      return await this.proxySocketFactory.createSocket(requestOptions, proxySettings);
    }, "createSocketFactory");
    this.fetchApi = this.createFetchApi(ctx), this.certificateConfigurator = new RootCertificateConfigurator(ctx), this.proxySocketFactory = ctx.get(ProxySocketFactory);
  }
  set proxySettings(value) {
    this._proxySettings = value, this.fetchApi = this.createFetchApi(this.ctx);
  }
  get proxySettings() {
    return this._proxySettings;
  }
  set rejectUnauthorized(value) {
    super.rejectUnauthorized = value, this.fetchApi = this.createFetchApi(this.ctx);
  }
  get rejectUnauthorized() {
    return super.rejectUnauthorized;
  }
  createFetchApi(ctx) {
    let buildInfo = ctx.get(BuildInfo);
    return super.rejectUnauthorized === !1 && (process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"), context({
      userAgent: `GithubCopilot/${buildInfo.getVersion()}`,
      socketFactory: this._proxySettings ? this.createSocketFactory(this._proxySettings, super.rejectUnauthorized) : void 0,
      rejectUnauthorized: super.rejectUnauthorized
    });
  }
  async fetch(url, options) {
    var _a, _b;
    let signal = options.signal,
      timedOut = !1;
    if (options.timeout) {
      let abortController = this.makeAbortController();
      setTimeout(() => {
        abortController.abort(), timedOut = !0;
      }, options.timeout), (_a = options.signal) == null || _a.addEventListener("abort", () => abortController.abort()), (_b = options.signal) != null && _b.aborted && abortController.abort(), signal = abortController.signal;
    }
    let helixOptions = {
      ...options,
      body: options.body ? options.body : options.json,
      signal: signal
    };
    await this.certificateConfigurator.applyToRequestOptions(helixOptions);
    let certs = await this.certificateConfigurator.getCertificates();
    this.fetchApi.setCA(certs);
    let resp = await this.fetchApi.fetch(url, helixOptions).catch(e => {
      throw timedOut ? new HttpTimeoutError(`Request to <${url}> timed out after ${options.timeout}ms`, e) : e;
    });
    return new Response(resp.status, resp.statusText, resp.headers, () => resp.text(), () => resp.body);
  }
  disconnectAll() {
    return this.fetchApi.reset();
  }
  makeAbortController() {
    return new AbortController();
  }
};

,__name(_HelixFetcher, "HelixFetcher");

,var HelixFetcher = _HelixFetcher;