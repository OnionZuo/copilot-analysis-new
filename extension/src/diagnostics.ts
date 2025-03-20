var import_vscode = require("vscode");

,async function openDiagnosticReport(ctx) {
  let installationCheck = __name(name => Wk.extensions.getExtension(name) !== void 0, "installationCheck"),
    reportData = await new DiagnosticReport(installationCheck).collectData(ctx),
    report = formatDiagnosticsAsMarkdown(reportData),
    doc = await Wk.workspace.openTextDocument({
      language: "markdown",
      content: report
    });
  await Wk.window.showTextDocument(doc);
},__name(openDiagnosticReport, "openDiagnosticReport");

,var _DiagnosticReport = class _DiagnosticReport {
  constructor(isExtensionInstalled, httpConfig = Wk.workspace.getConfiguration("http")) {
    this.isExtensionInstalled = isExtensionInstalled;
    this.httpConfig = httpConfig;
  }
  async collectData(ctx) {
    return {
      sections: [...(await collectDiagnostics(ctx)).sections, this.collectConfigurationSection(), this.collectExtensionSection(ctx), await this.collectAuthSection(ctx)]
    };
  }
  collectConfigurationSection() {
    return {
      name: "VS Code Configuration",
      items: {
        "HTTP proxy": this.httpConfig.proxy,
        "HTTP proxy authentication": this.httpConfig.proxyAuthorization,
        "Proxy Strict SSL": this.httpConfig.proxyStrictSSL,
        "Extension HTTP proxy support": this.httpConfig.proxySupport
      }
    };
  }
  collectExtensionSection(ctx) {
    return {
      name: "Extensions",
      items: {
        "Is `win-ca` installed?": this.isExtensionInstalled("ukoloff.win-ca"),
        "Is `mac-ca` installed?": this.isExtensionInstalled("linhmtran168.mac-ca-vscode")
      }
    };
  }
  async collectAuthSection(_ctx) {
    let user,
      session = await getExistingSession();
    return session && (user = session == null ? void 0 : session.account.label), {
      name: "Authentication",
      items: {
        "GitHub username": user != null ? user : "Not signed in"
      }
    };
  }
};

,__name(_DiagnosticReport, "DiagnosticReport");

,var DiagnosticReport = _DiagnosticReport;