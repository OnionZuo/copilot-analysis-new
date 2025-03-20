var import_vscode = require("vscode");

,var GitHubCopilotChannelName = "GitHub Copilot Log";

,function getCurrentTimestamp() {
  let toTwoDigits = __name(v => v < 10 ? `0${v}` : v, "toTwoDigits"),
    toThreeDigits = __name(v => v < 10 ? `00${v}` : v < 100 ? `0${v}` : v, "toThreeDigits"),
    currentTime = new Date();
  return `${currentTime.getFullYear()}-${toTwoDigits(currentTime.getMonth() + 1)}-${toTwoDigits(currentTime.getDate())} ${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
},__name(getCurrentTimestamp, "getCurrentTimestamp");

,var _CodeReferenceOutputChannel = class _CodeReferenceOutputChannel {
  constructor(output) {
    this.output = output;
  }
  info(...messages) {
    this.output.appendLine(`${getCurrentTimestamp()} [info] ${messages.join(" ")}`);
  }
  show(preserveFocus) {
    this.output.show(preserveFocus);
  }
  dispose() {
    this.output.dispose();
  }
};

,__name(_CodeReferenceOutputChannel, "CodeReferenceOutputChannel");

,var CodeReferenceOutputChannel = _CodeReferenceOutputChannel,
  _event,
  _GitHubCopilotLogger = class _GitHubCopilotLogger {
    constructor(ctx) {
      __privateAdd(this, _event);
      this.checkCopilotToken = __name(token => {
        var _a;
        token.envelope.code_quote_enabled ? this.output = this.createChannel() : (_a = this.output) == null || _a.dispose();
      }, "checkCopilotToken");
      __privateSet(this, _event, onCopilotToken(ctx, t => this.checkCopilotToken(t))), this.output = this.createChannel();
    }
    static create(ctx) {
      return new _GitHubCopilotLogger(ctx);
    }
    createChannel() {
      return this.output ? this.output : new CodeReferenceOutputChannel(Fje.window.createOutputChannel(GitHubCopilotChannelName, "code-referencing"));
    }
    log(type, ...messages) {
      this.output || (this.output = this.createChannel());
      let [base, ...rest] = messages;
      this.output[type](base, ...rest);
    }
    info(...messages) {
      this.log("info", ...messages);
    }
    forceShow() {
      var _a;
      (_a = this.output) == null || _a.show(!0);
    }
    dispose() {
      var _a;
      (_a = this.output) == null || _a.dispose(), __privateGet(this, _event).dispose();
    }
  };

,_event = new WeakMap(), __name(_GitHubCopilotLogger, "GitHubCopilotLogger");

,var GitHubCopilotLogger = _GitHubCopilotLogger;

,var _LoggingCitationManager = class _LoggingCitationManager extends CitationManager {
  constructor(codeReference) {
    super();
    this.codeReference = codeReference;
    let disposable = onCopilotToken(codeReference.ctx, _ => {
      if (this.logger) return;
      this.logger = GitHubCopilotLogger.create(codeReference.ctx);
      let initialNotificationCommand = Tje.commands.registerCommand(OutputPaneShowCommand, () => {
        var _a;
        return (_a = this.logger) == null ? void 0 : _a.forceShow();
      });
      this.codeReference.addDisposable(initialNotificationCommand);
    });
    this.codeReference.addDisposable(disposable);
  }
  async handleIPCodeCitation(ctx, citation) {
    var _a, _b;
    if (!this.codeReference.enabled || !this.logger || citation.details.length === 0) return;
    let start = (_a = citation.location) == null ? void 0 : _a.start,
      matchLocation = start ? `[Ln ${start.line + 1}, Col ${start.character + 1}]` : "Location not available",
      shortenedMatchText = `${(_b = citation.matchingText) == null ? void 0 : _b.slice(0, 100).replace(/[\r\n\t]+|^[ \t]+/gm, " ").trim()}...`;
    this.logger.info(citation.inDocumentUri, "Similar code at ", matchLocation, shortenedMatchText);
    for (let detail of citation.details) {
      let {
        license: license,
        url: url
      } = detail;
      this.logger.info(`License: ${license.replace("NOASSERTION", "unknown")}, URL: ${url}`);
    }
    copilotOutputLogTelemetry.handleWrite({
      context: ctx
    }), await notify(ctx);
  }
};

,__name(_LoggingCitationManager, "LoggingCitationManager");

,var LoggingCitationManager = _LoggingCitationManager;