var import_vscode = require("vscode");

,var _CopilotListDocument = class _CopilotListDocument extends SolutionManager {
  constructor(ctx, textDocument, completionContext, panel, countTarget = solutionCountTarget) {
    super(textDocument, completionContext.position, completionContext, panel.cancellationToken, countTarget);
    this.panel = panel;
    this._solutionCount = 0;
    this._solutions = [];
    this._ctx = ctx;
  }
  areSolutionsDuplicates(solutionA, solutionB) {
    let stripA = normalizeCompletionText(solutionA.insertText),
      stripB = normalizeCompletionText(solutionB.insertText);
    return stripA === stripB;
  }
  async onSolution(unformatted) {
    let offset = this.textDocument.offsetAt(this.completionContext.position),
      rank = this._solutions.length,
      postInsertionCallback = __name(async () => {
        let telemetryData = this.savedTelemetryData.extendedBy({
          choiceIndex: unformatted.choiceIndex.toString()
        }, {
          compCharLen: unformatted.insertText.length,
          meanProb: unformatted.meanProb,
          rank: rank
        });
        return postInsertionTasks(this._ctx, "solution", unformatted.insertText, offset, this.textDocument.uri, telemetryData, {
          compType: "full"
        }, unformatted.copilotAnnotations);
      }, "postInsertionCallback"),
      newItem = {
        insertText: unformatted.insertText,
        range: new g8.Range(new g8.Position(unformatted.range.start.line, unformatted.range.start.character), new g8.Position(unformatted.range.end.line, unformatted.range.end.character)),
        copilotAnnotations: unformatted.copilotAnnotations,
        postInsertionCallback: postInsertionCallback
      };
    this._solutions.find(item => this.areSolutionsDuplicates(item, newItem)) || (this.panel.onItem(newItem), this._solutions.push(newItem)), this._solutionCount++, this.panel.onWorkDone({
      percentage: 100 * this._solutionCount / this.solutionCountTarget
    });
  }
  async onFinishedNormally() {
    return this.panel.onFinished();
  }
  onFinishedWithError(_) {
    return this.onFinishedNormally();
  }
  runQuery() {
    return runSolutions(this._ctx, this, this);
  }
};

,__name(_CopilotListDocument, "CopilotListDocument");

,var CopilotListDocument = _CopilotListDocument;