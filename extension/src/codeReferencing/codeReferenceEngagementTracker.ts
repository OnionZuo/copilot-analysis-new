var import_vscode = require("vscode");

,var CopilotOutputLogFilename = "GitHub Copilot Log",
  _CodeRefEngagementTracker = class _CodeRefEngagementTracker {
    constructor(ctx) {
      this.ctx = ctx;
      this.activeLog = !1;
      this.subscriptions = [];
      this.onActiveEditorChange = __name(editor => {
        this.isOutputLog(editor) && copilotOutputLogTelemetry.handleFocus({
          context: this.ctx
        });
      }, "onActiveEditorChange");
      this.onVisibleEditorsChange = __name(currEditors => {
        let copilotLog = currEditors.find(this.isOutputLog);
        this.activeLog ? copilotLog || (this.activeLog = !1) : copilotLog && (this.activeLog = !0, copilotOutputLogTelemetry.handleOpen({
          context: this.ctx
        }));
      }, "onVisibleEditorsChange");
      this.isOutputLog = __name(editor => editor && editor.document.uri.scheme === "output" && editor.document.uri.path.includes(CopilotOutputLogFilename), "isOutputLog");
    }
    register() {
      let activeEditorChangeSub = Ome.window.onDidChangeActiveTextEditor(this.onActiveEditorChange),
        visibleEditorsSub = Ome.window.onDidChangeVisibleTextEditors(this.onVisibleEditorsChange);
      this.subscriptions.push(visibleEditorsSub), this.subscriptions.push(activeEditorChangeSub);
    }
    dispose() {
      for (let sub of this.subscriptions) sub.dispose();
      this.subscriptions = [];
    }
    get logVisible() {
      return this.activeLog;
    }
  };

,__name(_CodeRefEngagementTracker, "CodeRefEngagementTracker");

,var CodeRefEngagementTracker = _CodeRefEngagementTracker;

,function registerCodeRefEngagementTracker(ctx) {
  let engagementTracker = new CodeRefEngagementTracker(ctx);
  return engagementTracker.register(), engagementTracker;
},__name(registerCodeRefEngagementTracker, "registerCodeRefEngagementTracker");

,var _CodeReference = class _CodeReference {
  constructor(ctx) {
    this.ctx = ctx;
    this.enabled = !1;
    this.onCopilotToken = __name(token => {
      var _a;
      if (this.enabled = token.envelope.code_quote_enabled || !1, !token.envelope.code_quote_enabled) {
        (_a = this.subscriptions) == null || _a.dispose(), this.subscriptions = void 0, codeReferenceLogger.debug(this.ctx, "Public code references are disabled.");
        return;
      }
      codeReferenceLogger.info(this.ctx, "Public code references are enabled."), this.addDisposable(registerCodeRefEngagementTracker(this.ctx));
    }, "onCopilotToken");
  }
  dispose() {
    var _a, _b;
    (_a = this.subscriptions) == null || _a.dispose(), (_b = this.event) == null || _b.dispose();
  }
  register() {
    return isRunningInTest(this.ctx) || (this.event = onCopilotToken(this.ctx, this.onCopilotToken)), this;
  }
  addDisposable(disposable) {
    this.subscriptions ? this.subscriptions = Hme.Disposable.from(this.subscriptions, disposable) : this.subscriptions = Hme.Disposable.from(disposable);
  }
};

,__name(_CodeReference, "CodeReference");

,var CodeReference = _CodeReference;