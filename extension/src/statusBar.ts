var import_vscode = require("vscode");

,var _CopilotStatusBar = class _CopilotStatusBar extends StatusReporter {
  constructor(ctx, outputChannel, id = "github.copilot.languageStatus", showLegacyItem = !1) {
    super();
    this.ctx = ctx;
    this.outputChannel = outputChannel;
    this.showingMessage = !1;
    this.disposables = [];
    showLegacyItem && (this.legacyItem = Fs.window.createStatusBarItem("status", Fs.StatusBarAlignment.Right, 1), this.legacyItem.name = "Copilot Status", this.legacyItem.show(), this.legacyItem.text = this.checkEnabledForLanguage() ? "$(copilot)" : "$(copilot-not-connected)", this.legacyItem.command = CMDToggleStatusLegacyMenu, this.legacyItem.tooltip = "Show Copilot status menu"), this.item = Fs.languages.createLanguageStatusItem(id, "*"), this.disposables.push(this.item), this.state = ctx.get(CopilotExtensionStatus), this.updateStatusBarIndicator(), this.disposables.push(Fs.window.onDidChangeActiveTextEditor(() => {
      this.updateStatusBarIndicator();
    })), this.disposables.push(Fs.workspace.onDidCloseTextDocument(() => {
      this.updateStatusBarIndicator();
    })), this.disposables.push(Fs.workspace.onDidOpenTextDocument(() => {
      this.updateStatusBarIndicator();
    })), this.disposables.push(Fs.workspace.onDidChangeConfiguration(e => {
      e.affectsConfiguration(CopilotConfigPrefix) && this.updateStatusBarIndicator();
    }));
  }
  didChange(event) {
    this.state.kind = event.kind, this.state.message = event.message, this.state.command = event.command, this.updateStatusBarIndicator();
  }
  checkEnabledForLanguage() {
    var _a;
    return (_a = isCompletionEnabled(this.ctx)) != null ? _a : !0;
  }
  updateStatusBarIndicator() {
    var _a;
    if (this.isDisposed()) return;
    Fs.commands.executeCommand("setContext", "github.copilot.completions.quotaExceeded", ((_a = this.state.command) == null ? void 0 : _a.command) === CMDQuotaExceeded);
    let enabled = this.checkEnabledForLanguage();
    switch (Fs.commands.executeCommand("setContext", "github.copilot.completions.enabled", enabled), this.item.command = {
      command: CMDToggleStatusMenu,
      title: "View Details"
    }, this.state.kind) {
      case "Error":
        this.item.severity = Fs.LanguageStatusSeverity.Error, this.item.text = "$(copilot-warning) Completions", this.item.detail = "Error";
        break;
      case "Warning":
        this.item.severity = Fs.LanguageStatusSeverity.Warning, this.item.text = "$(copilot-warning) Completions", this.item.detail = "Temporary issues";
        break;
      case "Inactive":
        this.item.severity = Fs.LanguageStatusSeverity.Information, this.item.text = "$(copilot-blocked) Completions", this.item.detail = "Inactive";
        break;
      case "Normal":
        this.item.severity = Fs.LanguageStatusSeverity.Information, isInlineSuggestEnabled() ? enabled ? (this.item.text = "$(copilot) Completions", this.item.detail = "") : (this.item.text = "$(copilot-not-connected) Completions", this.item.detail = "Disabled") : (this.item.text = "$(copilot-not-connected) Completions", this.item.detail = "VS Code inline suggestions disabled"), this.item.command.title = "Open Menu";
        break;
    }
    this.state.command && (this.item.command = this.state.command, this.item.detail = this.state.message);
  }
  setError(message, command, showErrorPopup = !command) {
    super.setError(message, command), showErrorPopup && this.showErrorMessage();
  }
  showErrorMessage() {
    if (this.showingMessage) return;
    this.showingMessage = !0;
    let showOutputOption = "Show Output Log",
      options = [showOutputOption];
    Fs.window.showWarningMessage(this.state.message, ...options).then(res => {
      switch (this.showingMessage = !1, res) {
        case showOutputOption:
          this.outputChannel.show();
          break;
      }
    });
  }
  dispose() {
    for (let d of this.disposables) d.dispose();
    this.disposables = [];
  }
  isDisposed() {
    return this.disposables.length === 0;
  }
};

,__name(_CopilotStatusBar, "CopilotStatusBar");

,var CopilotStatusBar = _CopilotStatusBar;