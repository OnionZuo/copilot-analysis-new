var postInsertionLogger = new Logger("postInsertion"),
  captureTimeouts = [{
    seconds: 15,
    captureCode: !1,
    captureRejection: !1
  }, {
    seconds: 30,
    captureCode: !0,
    captureRejection: !0
  }, {
    seconds: 120,
    captureCode: !1,
    captureRejection: !1
  }, {
    seconds: 300,
    captureCode: !1,
    captureRejection: !1
  }, {
    seconds: 600,
    captureCode: !1,
    captureRejection: !1
  }],
  stillInCodeNearMargin = 50,
  stillInCodeFarMargin = 1500,
  stillInCodeFraction = .5,
  captureCodeMargin = 500,
  postInsertConfiguration = {
    triggerPostInsertionSynchroneously: !1,
    captureCode: !1,
    captureRejection: !1
  };

,async function captureCode(ctx, uri, completionTelemetry, offset, suffixOffset) {
  let document = await ctx.get(TextDocumentManager).getTextDocument({
    uri: uri
  });
  if (!document) return postInsertionLogger.info(ctx, `Could not get document for ${uri}. Maybe it was closed by the editor.`), {
    prompt: {
      prefix: "",
      suffix: "",
      isFimEnabled: !1,
      promptElementRanges: []
    },
    capturedCode: "",
    terminationOffset: 0
  };
  let documentText = document.getText(),
    documentTextBefore = documentText.substring(0, offset),
    position = document.positionAt(offset),
    hypotheticalPromptResponse = await extractPrompt(ctx, document, position, completionTelemetry),
    hypotheticalPrompt = hypotheticalPromptResponse.type === "prompt" ? hypotheticalPromptResponse.prompt : {
      prefix: documentTextBefore,
      suffix: "",
      isFimEnabled: !1,
      promptElementRanges: []
    };
  if (hypotheticalPrompt.isFimEnabled && suffixOffset !== void 0) {
    let capturedCode = documentText.substring(offset, suffixOffset);
    return hypotheticalPrompt.suffix = documentText.substring(suffixOffset), {
      prompt: hypotheticalPrompt,
      capturedCode: capturedCode,
      terminationOffset: 0
    };
  } else {
    let hypotheticalResponse = documentText.substring(offset),
      contextIndent = contextIndentationFromText(documentTextBefore, offset, document.languageId),
      terminationResult = await indentationBlockFinished(contextIndent, void 0)(hypotheticalResponse),
      maxOffset = Math.min(documentText.length, offset + (terminationResult ? terminationResult * 2 : captureCodeMargin)),
      capturedCode = documentText.substring(offset, maxOffset);
    return {
      prompt: hypotheticalPrompt,
      capturedCode: capturedCode,
      terminationOffset: terminationResult != null ? terminationResult : -1
    };
  }
},__name(captureCode, "captureCode");

,function postRejectionTasks(ctx, insertionCategory, insertionOffset, uri, completions) {
  completions.forEach(({
    completionText: completionText,
    completionTelemetryData: completionTelemetryData
  }) => {
    postInsertionLogger.debug(ctx, `${insertionCategory}.rejected choiceIndex: ${completionTelemetryData.properties.choiceIndex}`), telemetryRejected(ctx, insertionCategory, completionTelemetryData);
  });
  let positionTracker = new ChangeTracker(ctx, uri, insertionOffset - 1),
    suffixTracker = new ChangeTracker(ctx, uri, insertionOffset),
    checkInCode = __name(async t => {
      postInsertionLogger.debug(ctx, `Original offset: ${insertionOffset}, Tracked offset: ${positionTracker.offset}`);
      let {
          completionTelemetryData: completionTelemetryData
        } = completions[0],
        {
          prompt: prompt,
          capturedCode: capturedCode,
          terminationOffset: terminationOffset
        } = await captureCode(ctx, uri, completionTelemetryData, positionTracker.offset + 1, suffixTracker.offset),
        promptTelemetry;
      prompt.isFimEnabled ? promptTelemetry = {
        hypotheticalPromptPrefixJson: JSON.stringify(prompt.prefix),
        hypotheticalPromptSuffixJson: JSON.stringify(prompt.suffix)
      } : promptTelemetry = {
        hypotheticalPromptJson: JSON.stringify(prompt.prefix)
      };
      let customTelemetryData = completionTelemetryData.extendedBy({
        ...promptTelemetry,
        capturedCodeJson: JSON.stringify(capturedCode)
      }, {
        timeout: t.seconds,
        insertionOffset: insertionOffset,
        trackedOffset: positionTracker.offset,
        terminationOffsetInCapturedCode: terminationOffset
      });
      postInsertionLogger.debug(ctx, `${insertionCategory}.capturedAfterRejected choiceIndex: ${completionTelemetryData.properties.choiceIndex}`, customTelemetryData), telemetry(ctx, insertionCategory + ".capturedAfterRejected", customTelemetryData, 1);
    }, "checkInCode");
  captureTimeouts.filter(t => t.captureRejection).map(t => positionTracker.push(telemetryCatch(ctx, () => checkInCode(t), "postRejectionTasks"), t.seconds * 1e3));
},__name(postRejectionTasks, "postRejectionTasks");

,function postInsertionTasks(ctx, insertionCategory, completionText, insertionOffset, uri, telemetryData, suggestionStatus, copilotAnnotations) {
  let telemetryDataWithStatus = telemetryData.extendedBy({
    compType: suggestionStatus.compType
  }, {
    compCharLen: computeCompCharLen(suggestionStatus, completionText)
  });
  postInsertionLogger.debug(ctx, `${insertionCategory}.accepted choiceIndex: ${telemetryDataWithStatus.properties.choiceIndex}`), telemetryAccepted(ctx, insertionCategory, telemetryDataWithStatus);
  let fullCompletionText = completionText;
  completionText = computeCompletionText(completionText, suggestionStatus);
  let trimmedCompletion = completionText.trim(),
    tracker = new ChangeTracker(ctx, uri, insertionOffset),
    suffixTracker = new ChangeTracker(ctx, uri, insertionOffset + completionText.length),
    stillInCodeCheck = __name(async timeout => {
      await checkStillInCode(ctx, insertionCategory, trimmedCompletion, insertionOffset, uri, timeout, telemetryDataWithStatus, tracker, suffixTracker);
    }, "stillInCodeCheck");
  if (postInsertConfiguration.triggerPostInsertionSynchroneously && isRunningInTest(ctx)) {
    let check = stillInCodeCheck({
      seconds: 0,
      captureCode: postInsertConfiguration.captureCode,
      captureRejection: postInsertConfiguration.captureRejection
    });
    ctx.get(PromiseQueue).register(check);
  } else captureTimeouts.map(timeout => tracker.push(telemetryCatch(ctx, () => stillInCodeCheck(timeout), "postInsertionTasks"), timeout.seconds * 1e3));
  telemetryCatch(ctx, citationCheck, "post insertion citation check")(ctx, uri, fullCompletionText, completionText, insertionOffset, copilotAnnotations);
},__name(postInsertionTasks, "postInsertionTasks");

,async function citationCheck(ctx, uri, fullCompletionText, insertedText, insertionOffset, copilotAnnotations) {
  var _a, _b;
  if (!copilotAnnotations || ((_b = (_a = copilotAnnotations.ip_code_citations) == null ? void 0 : _a.length) != null ? _b : 0) < 1) return;
  let doc = await ctx.get(TextDocumentManager).getTextDocument({
    uri: uri
  });
  if (doc) {
    let found = find(doc.getText(), insertedText, stillInCodeNearMargin, insertionOffset);
    found.stillInCodeHeuristic && (insertionOffset = found.foundOffset);
  }
  for (let citation of copilotAnnotations.ip_code_citations) {
    let citationStart = computeCitationStart(fullCompletionText.length, insertedText.length, citation.start_offset);
    if (citationStart === void 0) {
      postInsertionLogger.info(ctx, `Full completion for ${uri} contains a reference matching public code, but the partially inserted text did not include the match.`);
      continue;
    }
    let offsetStart = insertionOffset + citationStart,
      start = doc == null ? void 0 : doc.positionAt(offsetStart),
      offsetEnd = insertionOffset + computeCitationEnd(fullCompletionText.length, insertedText.length, citation.stop_offset),
      end = doc == null ? void 0 : doc.positionAt(offsetEnd),
      text = start && end ? doc == null ? void 0 : doc.getText({
        start: start,
        end: end
      }) : "<unknown>";
    await ctx.get(CitationManager).handleIPCodeCitation(ctx, {
      inDocumentUri: uri,
      offsetStart: offsetStart,
      offsetEnd: offsetEnd,
      version: doc == null ? void 0 : doc.version,
      location: start && end ? {
        start: start,
        end: end
      } : void 0,
      matchingText: text,
      details: citation.details.citations
    });
  }
},__name(citationCheck, "citationCheck");

,function computeCitationStart(completionLength, insertedLength, citationStartOffset) {
  if (!(insertedLength < completionLength && citationStartOffset > insertedLength)) return citationStartOffset;
},__name(computeCitationStart, "computeCitationStart");

,function computeCitationEnd(completionLength, insertedLength, citationStopOffset) {
  return insertedLength < completionLength ? Math.min(citationStopOffset, insertedLength) : citationStopOffset;
},__name(computeCitationEnd, "computeCitationEnd");

,function find(documentText, completion, margin, offset) {
  let window = documentText.substring(Math.max(0, offset - margin), Math.min(documentText.length, offset + completion.length + margin)),
    lexAlignment = lexEditDistance(window, completion),
    fraction = lexAlignment.lexDistance / lexAlignment.needleLexLength,
    {
      distance: charEditDistance
    } = editDistance(window.substring(lexAlignment.startOffset, lexAlignment.endOffset), completion);
  return {
    relativeLexEditDistance: fraction,
    charEditDistance: charEditDistance,
    completionLexLength: lexAlignment.needleLexLength,
    foundOffset: lexAlignment.startOffset + Math.max(0, offset - margin),
    lexEditDistance: lexAlignment.lexDistance,
    stillInCodeHeuristic: fraction <= stillInCodeFraction ? 1 : 0
  };
},__name(find, "find");

,async function checkStillInCode(ctx, insertionCategory, completion, insertionOffset, uri, timeout, telemetryData, tracker, suffixTracker) {
  let document = await ctx.get(TextDocumentManager).getTextDocument({
    uri: uri
  });
  if (document) {
    let documentText = document.getText(),
      finding = find(documentText, completion, stillInCodeNearMargin, tracker.offset);
    finding.stillInCodeHeuristic || (finding = find(documentText, completion, stillInCodeFarMargin, tracker.offset)), postInsertionLogger.debug(ctx, `stillInCode: ${finding.stillInCodeHeuristic ? "Found" : "Not found"}! Completion '${completion}' in file ${uri}. lexEditDistance fraction was ${finding.relativeLexEditDistance}. Char edit distance was ${finding.charEditDistance}. Inserted at ${insertionOffset}, tracked at ${tracker.offset}, found at ${finding.foundOffset}. choiceIndex: ${telemetryData.properties.choiceIndex}`);
    let customTelemetryData = telemetryData.extendedBy({}, {
      timeout: timeout.seconds,
      insertionOffset: insertionOffset,
      trackedOffset: tracker.offset
    }).extendedBy({}, finding);
    if (telemetry(ctx, insertionCategory + ".stillInCode", customTelemetryData), timeout.captureCode) {
      let {
          prompt: prompt,
          capturedCode: capturedCode,
          terminationOffset: terminationOffset
        } = await captureCode(ctx, uri, customTelemetryData, tracker.offset, suffixTracker.offset),
        promptTelemetry;
      prompt.isFimEnabled ? promptTelemetry = {
        hypotheticalPromptPrefixJson: JSON.stringify(prompt.prefix),
        hypotheticalPromptSuffixJson: JSON.stringify(prompt.suffix)
      } : promptTelemetry = {
        hypotheticalPromptJson: JSON.stringify(prompt.prefix)
      };
      let afterAcceptedTelemetry = telemetryData.extendedBy({
        ...promptTelemetry,
        capturedCodeJson: JSON.stringify(capturedCode)
      }, {
        timeout: timeout.seconds,
        insertionOffset: insertionOffset,
        trackedOffset: tracker.offset,
        terminationOffsetInCapturedCode: terminationOffset
      });
      postInsertionLogger.debug(ctx, `${insertionCategory}.capturedAfterAccepted choiceIndex: ${telemetryData.properties.choiceIndex}`, customTelemetryData), telemetry(ctx, insertionCategory + ".capturedAfterAccepted", afterAcceptedTelemetry, 1);
    }
  }
},__name(checkStillInCode, "checkStillInCode");