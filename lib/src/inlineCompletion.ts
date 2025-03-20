async function getInlineCompletions(ctx, telemetryData, textDocument, position, textEditorOptions, options, token) {
  var _a;
  options = {
    ...options,
    positionBeforeApplyingEdits: position
  };
  let lineLengthIncrease = 0;
  if ((_a = options.selectedCompletionInfo) != null && _a.text) {
    let edit = {
      range: options.selectedCompletionInfo.range,
      newText: options.selectedCompletionInfo.text
    };
    ({
      textDocument: textDocument,
      position: position
    } = applyEditsWithPosition(textDocument, edit.range.end, [edit])), lineLengthIncrease = position.character - edit.range.end.character, telemetryData.properties.completionsActive = "true";
  }
  let result = await getGhostText(ctx, textDocument, position, telemetryData, token, options);
  if (result.type !== "success") return result;
  let [resultArray, resultType] = result.value;
  if (token != null && token.isCancellationRequested) return {
    type: "canceled",
    reason: "after getGhostText",
    telemetryData: {
      telemetryBlob: result.telemetryBlob
    }
  };
  let index = setLastShown(ctx, textDocument, position, resultType),
    completions = completionsFromGhostTextResults(ctx, resultArray, resultType, textDocument, position, textEditorOptions, index);
  if (completions.length === 0) return {
    type: "empty",
    reason: "no completions in final result",
    telemetryData: result.telemetryData
  };
  let value = completions.map(completion => {
    let {
        start: start,
        end: end
      } = completion.range,
      range = Qo.Range.create(start, Qo.Position.create(end.line, end.character - lineLengthIncrease));
    return {
      ...completion,
      range: range
    };
  });
  return {
    ...result,
    value: value
  };
},__name(getInlineCompletions, "getInlineCompletions");