var CopilotPanelScheme = "copilot",
  solutionCountTarget = 10;

,function completionTypeToString(type) {
  switch (type) {
    case 2:
      return "open copilot";
    default:
      return "unknown";
  }
},__name(completionTypeToString, "completionTypeToString");

,var _CompletionContext = class _CompletionContext {
  constructor(ctx, position, completionType) {
    this.appendToCompletion = "";
    this.indentation = null;
    this.completionType = 2;
    this.position = LocationFactory.position(position.line, position.character), this.completionType = completionType;
  }
};

,__name(_CompletionContext, "CompletionContext");

,var CompletionContext = _CompletionContext;

,function completionContextForDocument(ctx, document, position) {
  let returnPosition = position,
    line = document.lineAt(position.line);
  return line.isEmptyOrWhitespace || (returnPosition = line.range.end), new CompletionContext(ctx, returnPosition, 2);
},__name(completionContextForDocument, "completionContextForDocument");

,var seq = 0;

,function encodeLocation(targetUri, completionContext) {
  let panelFileName = "GitHub Copilot Suggestions",
    target = targetUri.toString().split("#"),
    remain = target.length > 1 ? target[1] : "",
    query = JSON.stringify([target[0], completionContext, remain]),
    targetFileName = basename(targetUri);
  return targetFileName.length > 0 && (panelFileName += ` for ${targetFileName}`), factory_exports.from({
    scheme: CopilotPanelScheme,
    path: panelFileName,
    query: query,
    fragment: `${seq++}`
  });
},__name(encodeLocation, "encodeLocation");