var os = fn(require("os")),
  tls = fn(require("tls"));

,async function collectDiagnostics(ctx) {
  return {
    sections: [collectCopilotSection(ctx), collectEnvironmentSection(), await collectFeatureFlagsSection(ctx), collectNodeSection(), collectNetworkConfigSection(ctx), await collectReachabilitySection(ctx)]
  };
},__name(collectDiagnostics, "collectDiagnostics");

,function formatDiagnosticsAsMarkdown(data) {
  return data.sections.map(formatSectionAsMarkdown).join(Ip.EOL + Ip.EOL);
},__name(formatDiagnosticsAsMarkdown, "formatDiagnosticsAsMarkdown");

,function collectCopilotSection(ctx) {
  return {
    name: "Copilot",
    items: {
      Version: getVersion(ctx),
      Build: getBuildType(ctx),
      Editor: editorVersionHeaders(ctx)["Editor-Version"]
    }
  };
},__name(collectCopilotSection, "collectCopilotSection");

,function collectEnvironmentSection() {
  return {
    name: "Environment",
    items: {
      http_proxy: findEnvironmentVariable("http_proxy"),
      https_proxy: findEnvironmentVariable("https_proxy"),
      no_proxy: findEnvironmentVariable("no_proxy"),
      SSL_CERT_FILE: findEnvironmentVariable("SSL_CERT_FILE"),
      SSL_CERT_DIR: findEnvironmentVariable("SSL_CERT_DIR"),
      OPENSSL_CONF: findEnvironmentVariable("OPENSSL_CONF")
    }
  };
},__name(collectEnvironmentSection, "collectEnvironmentSection");

,function collectNodeSection() {
  return {
    name: "Node setup",
    items: {
      "Number of root certificates": u2.rootCertificates.length,
      "Operating system": Ip.type(),
      "Operating system version": Ip.release(),
      "Operating system architecture": Ip.arch(),
      NODE_OPTIONS: findEnvironmentVariable("NODE_OPTIONS"),
      NODE_EXTRA_CA_CERTS: findEnvironmentVariable("NODE_EXTRA_CA_CERTS"),
      NODE_TLS_REJECT_UNAUTHORIZED: findEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED"),
      "tls default min version": u2.DEFAULT_MIN_VERSION,
      "tls default max version": u2.DEFAULT_MAX_VERSION
    }
  };
},__name(collectNodeSection, "collectNodeSection");

,async function collectFeatureFlagsSection(ctx) {
  var _a, _b;
  let items = {};
  try {
    let token = await ctx.get(CopilotTokenManager).getToken();
    items["Send Restricted Telemetry"] = token.getTokenValue("rt") === "1" ? "enabled" : "disabled", items.Chat = (_a = token.envelope) != null && _a.chat_enabled ? "enabled" : void 0, items["Content exclusion"] = (_b = token.envelope) != null && _b.copilotignore_enabled ? "enabled" : "unavailable";
  } catch {}
  return Object.keys(items).forEach(key => items[key] === void 0 && delete items[key]), {
    name: "Feature Flags",
    items: items
  };
},__name(collectFeatureFlagsSection, "collectFeatureFlagsSection");

,function collectNetworkConfigSection(ctx) {
  var _a, _b, _c;
  let fetcher = ctx.get(Fetcher);
  return {
    name: "Network Configuration",
    items: {
      "Proxy host": (_a = fetcher.proxySettings) == null ? void 0 : _a.host,
      "Proxy port": (_b = fetcher.proxySettings) == null ? void 0 : _b.port,
      "Kerberos SPN": (_c = fetcher.proxySettings) == null ? void 0 : _c.kerberosServicePrincipal,
      "Reject unauthorized": fetcher.rejectUnauthorized ? "enabled" : "disabled",
      Fetcher: fetcher.name
    }
  };
},__name(collectNetworkConfigSection, "collectNetworkConfigSection");

,async function collectReachabilitySection(ctx) {
  return {
    name: "Reachability",
    items: Object.fromEntries((await checkReachability(ctx)).map(({
      label: label,
      status: status,
      message: message
    }) => [label, message]))
  };
},__name(collectReachabilitySection, "collectReachabilitySection");

,function findEnvironmentVariable(name) {
  let key = Object.keys(process.env).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? process.env[key] : void 0;
},__name(findEnvironmentVariable, "findEnvironmentVariable");

,function formatSectionAsMarkdown(s) {
  return `## ${s.name}` + Ip.EOL + Ip.EOL + Object.keys(s.items).filter(k => k !== "name").map(k => {
    var _a;
    return `- ${k}: ${(_a = s.items[k]) != null ? _a : "n/a"}`;
  }).join(Ip.EOL);
},__name(formatSectionAsMarkdown, "formatSectionAsMarkdown");