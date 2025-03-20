var tls = fn(require("tls"));

,var _cache,
  _RootCertificateConfigurator = class _RootCertificateConfigurator {
    constructor(ctx) {
      __privateAdd(this, _cache);
      this._certificateReader = ctx.get(RootCertificateReader);
    }
    async enhanceProxySettings(proxySettings) {
      let certs = await this.getCertificates();
      return {
        ...proxySettings,
        ca: certs
      };
    }
    async getCertificates() {
      let certificates = await this._certificateReader.getAllRootCAs();
      if (certificates.length !== 0) return certificates;
    }
    async createSecureContext() {
      let certs = await this._certificateReader.getAllRootCAs(),
        secureContext = A$e.createSecureContext({
          _vscodeAdditionalCaCerts: certs
        });
      for (let cert of certs) secureContext.context.addCACert(cert);
      return {
        secureContext: secureContext,
        certs: certs
      };
    }
    async applyToRequestOptions(requestOptions) {
      var _a;
      (_a = __privateGet(this, _cache)) != null || __privateSet(this, _cache, this.createSecureContext());
      let cache = await __privateGet(this, _cache);
      requestOptions.secureContext = cache.secureContext, requestOptions.ca = cache.certs, requestOptions.cert = cache.certs;
    }
  };

,_cache = new WeakMap(), __name(_RootCertificateConfigurator, "RootCertificateConfigurator");

,var RootCertificateConfigurator = _RootCertificateConfigurator;