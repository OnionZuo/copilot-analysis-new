function maybeSnipCompletion(ctx, doc, position, completion) {
  var _a;
  let blockCloseToken = "}";
  try {
    blockCloseToken = (_a = promptLibProxy.getBlockCloseToken(doc.languageId)) != null ? _a : "}";
  } catch {}
  return maybeSnipCompletionImpl({
    getLineText: __name(lineIdx => doc.lineAt(lineIdx).text, "getLineText"),
    getLineCount: __name(() => doc.lineCount, "getLineCount")
  }, position, completion, blockCloseToken);
},__name(maybeSnipCompletion, "maybeSnipCompletion");

,function maybeSnipCompletionImpl(doc, position, completion, blockCloseToken) {
  let completionLinesInfo = splitByNewLine(completion),
    completionLines = completionLinesInfo.lines;
  if (completionLines.length === 1) return completion;
  for (let completionLineStartIdx = 1; completionLineStartIdx < completionLines.length; completionLineStartIdx++) {
    let matched = !0,
      docSkippedEmptyLineCount = 0,
      completionSkippedEmptyLineCount = 0;
    for (let offset = 0; offset + completionLineStartIdx + completionSkippedEmptyLineCount < completionLines.length; offset++) {
      let docLine;
      for (;;) {
        let docLineIdx = position.line + 1 + offset + docSkippedEmptyLineCount;
        if (docLine = docLineIdx >= doc.getLineCount() ? void 0 : doc.getLineText(docLineIdx), docLine !== void 0 && docLine.trim() === "") docSkippedEmptyLineCount++;else break;
      }
      let completionLineIdx, completionLine;
      for (; completionLineIdx = completionLineStartIdx + offset + completionSkippedEmptyLineCount, completionLine = completionLineIdx >= completionLines.length ? void 0 : completionLines[completionLineIdx], completionLine !== void 0 && completionLine.trim() === "";) completionSkippedEmptyLineCount++;
      let isLastCompletionLine = completionLineIdx === completionLines.length - 1;
      if (!completionLine || !(docLine && (isLastCompletionLine ? docLine.startsWith(completionLine) || completionLine.startsWith(docLine) : docLine === completionLine && completionLine.trim() === blockCloseToken))) {
        matched = !1;
        break;
      }
    }
    if (matched) return completionLines.slice(0, completionLineStartIdx).join(completionLinesInfo.newLineCharacter);
  }
  return completion;
},__name(maybeSnipCompletionImpl, "maybeSnipCompletionImpl");

,function splitByNewLine(text) {
  let newLineCharacter = text.includes(`\r
`) ? `\r
` : `
`;
  return {
    lines: text.split(newLineCharacter),
    newLineCharacter: newLineCharacter
  };
},__name(splitByNewLine, "splitByNewLine");

,function matchesNextLine(document, position, text) {
  let nextLine = "",
    lineNo = position.line + 1;
  for (; nextLine === "" && lineNo < document.lineCount;) {
    if (nextLine = document.lineAt(lineNo).text.trim(), nextLine === text.trim()) return !0;
    lineNo++;
  }
  return !1;
},__name(matchesNextLine, "matchesNextLine");

,async function postProcessChoiceInContext(ctx, document, position, choice, requestForNextLine, logger) {
  if (isRepetitive(choice.tokens)) {
    let telemetryData = TelemetryData.createAndMarkAsIssued();
    telemetryData.extendWithRequestId(choice.requestId), telemetry(ctx, "repetition.detected", telemetryData, 1), logger.info(ctx, "Filtered out repetitive solution");
    return;
  }
  let postProcessedChoice = {
    ...choice
  };
  if (requestForNextLine && (postProcessedChoice.completionText = `
` + postProcessedChoice.completionText), matchesNextLine(document, position, postProcessedChoice.completionText)) {
    let baseTelemetryData = TelemetryData.createAndMarkAsIssued();
    baseTelemetryData.extendWithRequestId(choice.requestId), telemetry(ctx, "completion.alreadyInDocument", baseTelemetryData), telemetry(ctx, "completion.alreadyInDocument", baseTelemetryData.extendedBy({
      completionTextJson: JSON.stringify(postProcessedChoice.completionText)
    }), 1), logger.info(ctx, "Filtered out solution matching next line");
    return;
  }
  return postProcessedChoice.completionText = maybeSnipCompletion(ctx, document, position, postProcessedChoice.completionText), postProcessedChoice.completionText ? postProcessedChoice : void 0;
},__name(postProcessChoiceInContext, "postProcessChoiceInContext");

,function checkSuffix(document, position, choice) {
  let restOfLine = document.lineAt(position.line).text.substring(position.character);
  if (restOfLine.length > 0) {
    if (choice.completionText.indexOf(restOfLine) !== -1) return restOfLine.length;
    {
      let lastIndex = -1,
        suffixLength = 0;
      for (let c of restOfLine) {
        let idx = choice.completionText.indexOf(c, lastIndex + 1);
        if (idx > lastIndex) suffixLength++, lastIndex = idx;else break;
      }
      return suffixLength;
    }
  }
  return 0;
},__name(checkSuffix, "checkSuffix");