var import_vscode = require("vscode");

,function initProxyEnvironment(fetcher, env) {
  Kwe.workspace.onDidChangeConfiguration(event => {
    let hasProxyUrlChanged = event.affectsConfiguration("http.proxy");
    (event.affectsConfiguration("http.proxyStrictSSL") || event.affectsConfiguration("http.proxyAuthorization") || event.affectsConfiguration("http.proxyKerberosServicePrincipal") || hasProxyUrlChanged) && updateProxyEnvironment(fetcher, env, hasProxyUrlChanged);
  }), updateProxyEnvironment(fetcher, env);
},__name(initProxyEnvironment, "initProxyEnvironment");

,var updateProxyEnvironment = __name((fetcher, env, hasProxyUrlChanged) => {
  let httpConfig = Kwe.workspace.getConfiguration("http"),
    httpProxy = httpConfig.get("proxy"),
    proxyUrl = httpProxy || getProxyFromEnvironment(env);
  if (proxyUrl) {
    let proxyAuthorization = httpConfig.get("proxyAuthorization"),
      proxyStrictSSL = httpConfig.get("proxyStrictSSL", !0),
      proxySettings = proxySettingFromUrl(proxyUrl);
    httpProxy && proxyAuthorization && (proxySettings.proxyAuth = proxyAuthorization);
    let spn = httpConfig.get("proxyKerberosServicePrincipal");
    spn && (proxySettings.kerberosServicePrincipal = spn), fetcher.proxySettings = proxySettings, fetcher.rejectUnauthorized = proxyStrictSSL;
  } else hasProxyUrlChanged && !proxyUrl && (fetcher.proxySettings = void 0);
}, "updateProxyEnvironment");