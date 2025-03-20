var import_crypto_js = fn(_B());

,var ghostTextLogger = new Logger("ghostText");

,async function genericGetCompletionsFromNetwork(ctx, requestContext, baseTelemetryData, cancellationToken, finishedCb, what, processChoices) {
  var _a, _b, _c, _d, _e;
  ghostTextLogger.debug(ctx, `Getting ${what} from network`), baseTelemetryData = baseTelemetryData.extendedBy();
  let numGhostCompletions = await getNumGhostCompletions(ctx, requestContext, baseTelemetryData),
    temperature = getTemperatureForSamples(ctx, numGhostCompletions),
    postOptions = {
      stream: !0,
      n: numGhostCompletions,
      temperature: temperature,
      extra: {
        language: requestContext.languageId,
        next_indent: (_a = requestContext.indentation.next) != null ? _a : 0,
        trim_by_indentation: shouldDoServerTrimming(requestContext.blockMode),
        prompt_tokens: (_b = requestContext.prompt.prefixTokens) != null ? _b : 0,
        suffix_tokens: (_c = requestContext.prompt.suffixTokens) != null ? _c : 0
      }
    };
  requestContext.multiline || (postOptions.stop = [`
`]);
  let requestStart = Date.now(),
    newProperties = {
      endpoint: "completions",
      uiKind: "ghostText",
      temperature: JSON.stringify(temperature),
      n: JSON.stringify(numGhostCompletions),
      stop: (_d = JSON.stringify(postOptions.stop)) != null ? _d : "unset",
      logit_bias: JSON.stringify((_e = postOptions.logit_bias) != null ? _e : null)
    };
  Object.assign(baseTelemetryData.properties, newProperties);
  try {
    let completionParams = {
        prompt: requestContext.prompt,
        languageId: requestContext.languageId,
        repoInfo: requestContext.repoInfo,
        ourRequestId: requestContext.ourRequestId,
        engineUrl: requestContext.engineURL,
        count: numGhostCompletions,
        uiKind: "ghostText",
        postOptions: postOptions,
        headers: requestContext.headers
      },
      res = await ctx.get(OpenAIFetcher).fetchAndStreamCompletions(ctx, completionParams, baseTelemetryData, finishedCb, cancellationToken);
    if (res.type === "failed") return {
      type: "failed",
      reason: res.reason,
      telemetryData: mkBasicResultTelemetry(baseTelemetryData)
    };
    if (res.type === "canceled") return ghostTextLogger.debug(ctx, "Cancelled after awaiting fetchCompletions"), {
      type: "canceled",
      reason: res.reason,
      telemetryData: mkCanceledResultTelemetry(baseTelemetryData)
    };
    let trimmedChoices = isProgressiveRevealEnabled(ctx, baseTelemetryData) ? trimChoicesForProgressiveReveal(ctx, requestContext, baseTelemetryData, res.choices) : res.choices;
    return processChoices(numGhostCompletions, requestStart, res.getProcessingTime(), trimmedChoices);
  } catch (err) {
    if (isAbortError(err)) return {
      type: "canceled",
      reason: "network request aborted",
      telemetryData: mkCanceledResultTelemetry(baseTelemetryData, {
        cancelledNetworkRequest: !0
      })
    };
    if (ghostTextLogger.exception(ctx, err, "Error on ghost text request"), ctx.get(UserErrorNotifier).notifyUser(ctx, err), shouldFailForDebugPurposes(ctx)) throw err;
    return {
      type: "failed",
      reason: "non-abort error on ghost text request",
      telemetryData: mkBasicResultTelemetry(baseTelemetryData)
    };
  }
},__name(genericGetCompletionsFromNetwork, "genericGetCompletionsFromNetwork");

,function postProcessChoices(newChoice, currentChoices) {
  if (currentChoices || (currentChoices = []), newChoice.completionText = newChoice.completionText.trimEnd(), !!newChoice.completionText && currentChoices.findIndex(v => v.completionText.trim() === newChoice.completionText.trim()) === -1) return newChoice;
},__name(postProcessChoices, "postProcessChoices");

,async function* trimChoicesForProgressiveReveal(ctx, requestContext, telemetryWithExp, choices) {
  for await (let choice of choices) {
    let choices = new ChoiceSplitter(ctx, requestContext.prefix, requestContext.prompt.prefix, telemetryWithExp, choice).choices(),
      firstChoice = choices.next().value;
    if (firstChoice) {
      for (let nextChoice of choices) {
        let newContext = {
          ...requestContext,
          prefix: nextChoice.docPrefix,
          prompt: {
            ...requestContext.prompt,
            prefix: nextChoice.promptPrefix
          }
        };
        appendToCache(ctx, newContext, {
          multiline: requestContext.multiline,
          choices: [nextChoice.choice]
        });
      }
      yield firstChoice.choice;
    }
  }
},__name(trimChoicesForProgressiveReveal, "trimChoicesForProgressiveReveal");

,async function getCompletionsFromNetwork(ctx, requestContext, baseTelemetryData, cancellationToken, finishedCb) {
  return genericGetCompletionsFromNetwork(ctx, requestContext, baseTelemetryData, cancellationToken, finishedCb, "completions", async (numGhostCompletions, requestStart, processingTime, choicesStream) => {
    let firstRes = await choicesStream[Symbol.asyncIterator]().next();
    if (firstRes.done) return ghostTextLogger.debug(ctx, "All choices redacted"), {
      type: "empty",
      reason: "all choices redacted",
      telemetryData: mkBasicResultTelemetry(baseTelemetryData)
    };
    if (cancellationToken != null && cancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled after awaiting redactedChoices iterator"), {
      type: "canceled",
      reason: "after awaiting redactedChoices iterator",
      telemetryData: mkCanceledResultTelemetry(baseTelemetryData)
    };
    let firstChoice = firstRes.value;
    if (firstChoice === void 0) return ghostTextLogger.debug(ctx, "Got undefined choice from redactedChoices iterator"), {
      type: "empty",
      reason: "got undefined choice from redactedChoices iterator",
      telemetryData: mkBasicResultTelemetry(baseTelemetryData)
    };
    telemetryPerformance(ctx, "performance", firstChoice, requestStart, processingTime), ghostTextLogger.debug(ctx, `Awaited first result, id:  ${firstChoice.choiceIndex}`);
    let processedFirstChoice = postProcessChoices(firstChoice);
    processedFirstChoice && (appendToCache(ctx, requestContext, {
      multiline: requestContext.multiline,
      choices: [processedFirstChoice]
    }), ghostTextLogger.debug(ctx, `GhostText first completion (index ${processedFirstChoice == null ? void 0 : processedFirstChoice.choiceIndex}): ${JSON.stringify(processedFirstChoice == null ? void 0 : processedFirstChoice.completionText)}`));
    let cacheDone = (async () => {
      let apiChoices = processedFirstChoice !== void 0 ? [processedFirstChoice] : [];
      for await (let choice of choicesStream) {
        if (choice === void 0) continue;
        ghostTextLogger.debug(ctx, `GhostText later completion (index ${choice == null ? void 0 : choice.choiceIndex}): ${JSON.stringify(choice.completionText)}`);
        let processedChoice = postProcessChoices(choice, apiChoices);
        processedChoice && (apiChoices.push(processedChoice), appendToCache(ctx, requestContext, {
          multiline: requestContext.multiline,
          choices: [processedChoice]
        }));
      }
    })();
    return isRunningInTest(ctx) && (await cacheDone), processedFirstChoice ? {
      type: "success",
      value: [makeGhostAPIChoice(processedFirstChoice, {
        forceSingleLine: !1
      }), cacheDone],
      telemetryData: mkBasicResultTelemetry(baseTelemetryData),
      telemetryBlob: baseTelemetryData,
      resultType: 0
    } : {
      type: "empty",
      reason: "got undefined processedFirstChoice",
      telemetryData: mkBasicResultTelemetry(baseTelemetryData)
    };
  });
},__name(getCompletionsFromNetwork, "getCompletionsFromNetwork");

,async function getAllCompletionsFromNetwork(ctx, requestContext, baseTelemetryData, cancellationToken, finishedCb) {
  return genericGetCompletionsFromNetwork(ctx, requestContext, baseTelemetryData, cancellationToken, finishedCb, "all completions", async (numGhostCompletions, requestStart, processingTime, choicesStream) => {
    let apiChoices = [];
    for await (let choice of choicesStream) {
      if (cancellationToken != null && cancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled after awaiting choices iterator"), {
        type: "canceled",
        reason: "after awaiting choices iterator",
        telemetryData: mkCanceledResultTelemetry(baseTelemetryData)
      };
      let processedChoice = postProcessChoices(choice, apiChoices);
      processedChoice && apiChoices.push(processedChoice);
    }
    return apiChoices.length > 0 && (appendToCache(ctx, requestContext, {
      multiline: requestContext.multiline,
      choices: apiChoices
    }), telemetryPerformance(ctx, "cyclingPerformance", apiChoices[0], requestStart, processingTime)), {
      type: "success",
      value: [apiChoices, Promise.resolve()],
      telemetryData: mkBasicResultTelemetry(baseTelemetryData),
      telemetryBlob: baseTelemetryData,
      resultType: 3
    };
  });
},__name(getAllCompletionsFromNetwork, "getAllCompletionsFromNetwork");

,function makeGhostAPIChoice(choice, options) {
  let ghostChoice = {
    ...choice
  };
  if (options.forceSingleLine) {
    let {
      completionText: completionText
    } = ghostChoice;
    (completionText == null ? void 0 : completionText[0]) === `
` ? ghostChoice.completionText = `
` + completionText.split(`
`)[1] : ghostChoice.completionText = completionText.split(`
`)[0];
  }
  return ghostChoice;
},__name(makeGhostAPIChoice, "makeGhostAPIChoice");

,async function getNumGhostCompletions(ctx, requestContext, telemetryData) {
  let override = ctx.get(Features).overrideNumGhostCompletions(telemetryData);
  return override ? requestContext.isCycling ? Math.max(3, override) : override : shouldDoParsingTrimming(requestContext.blockMode) && requestContext.multiline ? 3 : requestContext.isCycling ? 2 : 1;
},__name(getNumGhostCompletions, "getNumGhostCompletions");

,async function getGhostTextStrategy(ctx, document, position, prompt, isCycling, inlineSuggestion, hasAcceptedCurrentCompletion, requestForNextLine, preIssuedTelemetryData) {
  let blockMode = await ctx.get(BlockModeConfig).forLanguage(ctx, document.languageId, preIssuedTelemetryData);
  switch (blockMode) {
    case "server":
      return {
        blockMode: "server",
        requestMultiline: !0,
        isCyclingRequest: isCycling,
        finishedCb: __name(async _ => {}, "finishedCb")
      };
    case "parsing":
    case "parsingandserver":
    case "moremultiline":
    default:
      {
        if (await shouldRequestMultiline(ctx, blockMode, document, position, inlineSuggestion, hasAcceptedCurrentCompletion, requestForNextLine, prompt)) {
          let adjustedPosition;
          return prompt.trailingWs.length > 0 && !prompt.prompt.prefix.endsWith(prompt.trailingWs) ? adjustedPosition = LocationFactory.position(position.line, Math.max(position.character - prompt.trailingWs.length, 0)) : adjustedPosition = position, {
            blockMode: blockMode,
            requestMultiline: !0,
            isCyclingRequest: !1,
            finishedCb: blockMode == "moremultiline" && BlockTrimmer.isSupported(document.languageId) ? blockTrimmerFinished(ctx, document, adjustedPosition) : parsingBlockFinished(ctx, document, adjustedPosition)
          };
        }
        return {
          blockMode: blockMode,
          requestMultiline: !1,
          isCyclingRequest: isCycling,
          finishedCb: __name(async _ => {}, "finishedCb")
        };
      }
  }
},__name(getGhostTextStrategy, "getGhostTextStrategy");

,function blockTrimmerFinished(ctx, document, position) {
  let prefix = document.getText(LocationFactory.range(LocationFactory.position(0, 0), position)),
    languageId = document.languageId;
  return async function (completion) {
    return await new BlockTrimmer(languageId, prefix, completion).getCompletionTrimOffset();
  };
},__name(blockTrimmerFinished, "blockTrimmerFinished");

,var ghostTextDebouncer = new Debouncer(),
  defaultOptions = {
    isCycling: !1,
    promptOnly: !1,
    isSpeculative: !1
  };

,async function getGhostTextWithoutAbortHandling(ctx, document, position, preIssuedTelemetryData, cancellationToken, options) {
  let ghostTextOptions = {
      ...defaultOptions,
      ...options
    },
    ourRequestId = v4_default();
  preIssuedTelemetryData = preIssuedTelemetryData.extendedBy({
    headerRequestId: ourRequestId
  });
  let currentGhostText = ctx.get(CurrentGhostText),
    currentClientCompletionId = currentGhostText.clientCompletionId,
    features = ctx.get(Features),
    preIssuedTelemetryDataWithExp;
  if (preIssuedTelemetryData instanceof TelemetryWithExp) preIssuedTelemetryDataWithExp = preIssuedTelemetryData;else if (preIssuedTelemetryDataWithExp = await features.updateExPValuesAndAssignments({
    uri: document.uri,
    languageId: document.detectedLanguageId
  }, preIssuedTelemetryData), cancellationToken != null && cancellationToken.isCancellationRequested) return {
    type: "abortedBeforeIssued",
    reason: "cancelled before extractPrompt",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  };
  let inlineSuggestion = isInlineSuggestion(document, position);
  if (inlineSuggestion === void 0) return ghostTextLogger.debug(ctx, "Breaking, invalid middle of the line"), {
    type: "abortedBeforeIssued",
    reason: "Invalid middle of the line",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  };
  let asyncCompletions = ctx.get(AsyncCompletionManager).isEnabled(preIssuedTelemetryDataWithExp) ? ctx.get(AsyncCompletionManager) : void 0,
    originalCancellationToken = cancellationToken,
    asyncCancellationTokenSource = new Qo.CancellationTokenSource();
  asyncCompletions && (cancellationToken = asyncCancellationTokenSource.token);
  let prompt = await extractPrompt(ctx, document, position, preIssuedTelemetryDataWithExp, cancellationToken, ghostTextOptions);
  return prompt.type === "copilotContentExclusion" ? (ghostTextLogger.debug(ctx, "Copilot not available, due to content exclusion"), {
    type: "abortedBeforeIssued",
    reason: "Copilot not available due to content exclusion",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : prompt.type === "contextTooShort" ? (ghostTextLogger.debug(ctx, "Breaking, not enough context"), {
    type: "abortedBeforeIssued",
    reason: "Not enough context",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : prompt.type === "promptError" ? (ghostTextLogger.debug(ctx, "Error while building the prompt"), {
    type: "abortedBeforeIssued",
    reason: "Error while building the prompt",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : ghostTextOptions.promptOnly ? {
    type: "promptOnly",
    reason: "Breaking, promptOnly set to true",
    prompt: prompt
  } : prompt.type === "promptCancelled" ? (ghostTextLogger.debug(ctx, "Cancelled during extractPrompt"), {
    type: "abortedBeforeIssued",
    reason: "Cancelled during extractPrompt",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : prompt.type === "promptTimeout" ? (ghostTextLogger.debug(ctx, "Timeout during extractPrompt"), {
    type: "abortedBeforeIssued",
    reason: "Timeout",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : prompt.prompt.prefix.length === 0 && prompt.prompt.suffix.length === 0 ? (ghostTextLogger.debug(ctx, "Error empty prompt"), {
    type: "abortedBeforeIssued",
    reason: "Empty prompt",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : cancellationToken != null && cancellationToken.isCancellationRequested ? (ghostTextLogger.debug(ctx, "Cancelled after extractPrompt"), {
    type: "abortedBeforeIssued",
    reason: "Cancelled after extractPrompt",
    telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
  }) : ctx.get(StatusReporter).withProgress(async () => {
    var _a, _b, _c, _d, _e, _f, _g;
    let [prefix] = trimLastLine(document.getText(LocationFactory.range(LocationFactory.position(0, 0), position))),
      triggerCompletionAfterAccept = features.triggerCompletionAfterAccept(preIssuedTelemetryDataWithExp),
      hasAcceptedCurrentCompletion = ctx.get(CurrentGhostText).hasAcceptedCurrentCompletion(prefix, prompt.prompt.suffix),
      requestForNextLine = triggerCompletionAfterAccept ? hasAcceptedCurrentCompletion : void 0;
    requestForNextLine && (prompt.prompt = {
      ...prompt.prompt,
      prefix: prompt.prompt.prefix + `
`
    });
    let ghostTextStrategy = await getGhostTextStrategy(ctx, document, position, prompt, ghostTextOptions.isCycling, inlineSuggestion, hasAcceptedCurrentCompletion, requestForNextLine != null ? requestForNextLine : !1, preIssuedTelemetryDataWithExp);
    if (cancellationToken != null && cancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled after requestMultiline"), {
      type: "abortedBeforeIssued",
      reason: "Cancelled after requestMultiline",
      telemetryData: mkBasicResultTelemetry(preIssuedTelemetryDataWithExp)
    };
    let choices = getLocalInlineSuggestion(ctx, prefix, prompt.prompt, ghostTextStrategy.requestMultiline),
      repoInfo = extractRepoInfoInBackground(ctx, document.uri),
      engineInfo = getEngineRequestInfo(ctx, preIssuedTelemetryDataWithExp),
      requestContext = {
        blockMode: ghostTextStrategy.blockMode,
        languageId: document.languageId,
        repoInfo: repoInfo,
        engineURL: engineInfo.url,
        ourRequestId: ourRequestId,
        prefix: prefix,
        prompt: prompt.prompt,
        multiline: ghostTextStrategy.requestMultiline,
        indentation: contextIndentation(document, position),
        isCycling: ghostTextOptions.isCycling,
        headers: engineInfo.headers,
        requestForNextLine: requestForNextLine
      },
      telemetryData = telemetryIssued(ctx, document, requestContext, position, prompt, preIssuedTelemetryDataWithExp, engineInfo),
      speculativeConfig = getConfig(ctx, ConfigKey.EnableSpeculativeRequests),
      speculativeFlag = features.enableSpeculativeRequests(preIssuedTelemetryDataWithExp),
      speculativeEnabled = (speculativeConfig || speculativeFlag) && !ghostTextOptions.isSpeculative && !ghostTextStrategy.isCyclingRequest,
      allChoicesPromise = Promise.resolve();
    if (asyncCompletions && choices === void 0 && !ghostTextStrategy.isCyclingRequest && asyncCompletions.shouldWaitForAsyncCompletions(prefix, prompt.prompt)) {
      let choice = await asyncCompletions.getFirstMatchingRequestWithTimeout(ourRequestId, prefix, prompt.prompt, ghostTextOptions.isSpeculative, telemetryData);
      if (choice) {
        let forceSingleLine = !ghostTextStrategy.requestMultiline;
        choices = [[makeGhostAPIChoice(choice[0], {
          forceSingleLine: forceSingleLine
        })], 4], allChoicesPromise = choice[1];
      }
      if (originalCancellationToken != null && originalCancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled before requesting a new completion"), {
        type: "abortedBeforeIssued",
        reason: "Cancelled after waiting for async completion",
        telemetryData: mkBasicResultTelemetry(telemetryData)
      };
    }
    if (choices !== void 0 && (!ghostTextStrategy.isCyclingRequest || choices[0].length > 1)) ghostTextLogger.debug(ctx, `Found inline suggestions locally via ${resultTypeToString(choices[1])}`);else if (ghostTextStrategy.isCyclingRequest) {
      let networkChoices = await getAllCompletionsFromNetwork(ctx, requestContext, telemetryData, cancellationToken, ghostTextStrategy.finishedCb);
      if (networkChoices.type === "success") {
        let resultChoices = (_a = choices == null ? void 0 : choices[0]) != null ? _a : [];
        networkChoices.value[0].forEach(c => {
          resultChoices.findIndex(v => v.completionText.trim() === c.completionText.trim()) === -1 && resultChoices.push(c);
        }), choices = [resultChoices, 3];
      } else if (choices === void 0) return networkChoices;
    } else {
      let debounceThresholdExp = features.debounceThreshold(preIssuedTelemetryDataWithExp),
        debounceThreshold = debounceThresholdExp != null ? debounceThresholdExp : engineInfo.modelId.startsWith("gpt-4o") || engineInfo.modelId.startsWith("chat-") ? 0 : 75;
      if (!(asyncCompletions !== void 0 || requestContext.requestForNextLine === !0 || debounceThreshold === 0)) {
        try {
          await ghostTextDebouncer.debounce(debounceThreshold);
        } catch {
          return {
            type: "canceled",
            reason: "by debouncer",
            telemetryData: mkCanceledResultTelemetry(telemetryData)
          };
        }
        if (cancellationToken != null && cancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled during debounce"), {
          type: "canceled",
          reason: "during debounce",
          telemetryData: mkCanceledResultTelemetry(telemetryData)
        };
      }
      if (cancellationToken != null && cancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled before contextual filter"), {
        type: "canceled",
        reason: "before contextual filter",
        telemetryData: mkCanceledResultTelemetry(telemetryData)
      };
      if (!features.disableContextualFilter(preIssuedTelemetryDataWithExp) && telemetryData.measurements.contextualFilterScore < 35 / 100) return ghostTextLogger.debug(ctx, "Cancelled by contextual filter"), {
        type: "canceled",
        reason: "contextualFilterScore below threshold",
        telemetryData: mkCanceledResultTelemetry(telemetryData)
      };
      let finishedCb = asyncCompletions ? (text, delta) => (asyncCompletions.updateCompletion(ourRequestId, text), ghostTextStrategy.finishedCb(text, delta)) : ghostTextStrategy.finishedCb,
        requestPromise = getCompletionsFromNetwork(ctx, requestContext, telemetryData, cancellationToken, finishedCb);
      if (asyncCompletions) {
        asyncCompletions.queueCompletionRequest(ourRequestId, prefix, prompt.prompt, asyncCancellationTokenSource, requestPromise);
        let c = await asyncCompletions.getFirstMatchingRequest(ourRequestId, prefix, prompt.prompt, ghostTextOptions.isSpeculative);
        if (c === void 0) return {
          type: "empty",
          reason: "received no results from async completions",
          telemetryData: mkBasicResultTelemetry(telemetryData)
        };
        choices = [[c[0]], 4], allChoicesPromise = c[1];
      } else {
        let c = await requestPromise;
        if (c.type !== "success") return c;
        choices = [[c.value[0]], 0], allChoicesPromise = c.value[1];
      }
    }
    if (choices === void 0) return {
      type: "failed",
      reason: "internal error: choices should be defined after network call",
      telemetryData: mkBasicResultTelemetry(telemetryData)
    };
    let [choicesArray, resultType] = choices,
      postProcessedChoices = asyncIterableMapFilter(asyncIterableFromArray(choicesArray), async choice => {
        var _a;
        return postProcessChoiceInContext(ctx, document, position, choice, (_a = requestContext.requestForNextLine) != null ? _a : !1, ghostTextLogger);
      }),
      postProcessedChoicesArray = [],
      results = [];
    for await (let choice of postProcessedChoices) {
      if (postProcessedChoicesArray.push(choice), originalCancellationToken != null && originalCancellationToken.isCancellationRequested) return ghostTextLogger.debug(ctx, "Cancelled after post processing completions"), {
        type: "canceled",
        reason: "after post processing completions",
        telemetryData: mkCanceledResultTelemetry(telemetryData)
      };
      let choiceTelemetryData = telemetryWithAddData(ctx, document, requestContext, choice, telemetryData),
        suffixCoverage = inlineSuggestion ? checkSuffix(document, position, choice) : 0,
        res = {
          completion: adjustLeadingWhitespace(choice.choiceIndex, choice.completionText, prompt.trailingWs),
          telemetry: choiceTelemetryData,
          isMiddleOfTheLine: inlineSuggestion,
          suffixCoverage: suffixCoverage,
          copilotAnnotations: choice.copilotAnnotations
        };
      results.push(res);
    }
    if (telemetryData.properties.clientCompletionId = (_c = (_b = results == null ? void 0 : results[0]) == null ? void 0 : _b.telemetry) == null ? void 0 : _c.properties.clientCompletionId, telemetryData.measurements.foundOffset = (_g = (_f = (_e = (_d = results == null ? void 0 : results[0]) == null ? void 0 : _d.telemetry) == null ? void 0 : _e.measurements) == null ? void 0 : _f.foundOffset) != null ? _g : -1, ghostTextLogger.debug(ctx, `Produced ${results.length} results from ${resultTypeToString(resultType)} at ${telemetryData.measurements.foundOffset} offset`), speculativeEnabled && results.length > 0) {
      let updated = applyEditsWithPosition(document, position, [{
          newText: results[0].completion.completionText,
          range: {
            start: position,
            end: position
          }
        }]),
        newTelemetryData = TelemetryData.createAndMarkAsIssued({
          ...preIssuedTelemetryData.properties,
          reason: "speculative"
        }, preIssuedTelemetryData.measurements),
        newCancellationToken = new Qo.CancellationTokenSource().token;
      allChoicesPromise.then(() => {
        getGhostText(ctx, updated.textDocument, updated.position, newTelemetryData, newCancellationToken, {
          positionBeforeApplyingEdits: ghostTextOptions.positionBeforeApplyingEdits,
          isSpeculative: !0
        });
      });
    }
    if (currentClientCompletionId !== currentGhostText.clientCompletionId) {
      let choicesTyping = currentGhostText.getCompletionsForUserTyping(prefix, prompt.prompt.suffix);
      if (choicesTyping && choicesTyping.length > 0) return ghostTextLogger.warn(ctx, "Current completion changed before returning"), {
        type: "canceled",
        reason: "current completion changed before returning",
        telemetryData: mkCanceledResultTelemetry(telemetryData)
      };
    }
    return ghostTextOptions.isSpeculative || currentGhostText.setGhostText(prefix, prompt.prompt.suffix, postProcessedChoicesArray, resultType), {
      type: "success",
      value: [results, resultType],
      telemetryData: mkBasicResultTelemetry(telemetryData),
      telemetryBlob: telemetryData,
      resultType: resultType
    };
  });
},__name(getGhostTextWithoutAbortHandling, "getGhostTextWithoutAbortHandling");

,async function getGhostText(ctx, textDocument, position, telemetryData, token, options) {
  try {
    return await getGhostTextWithoutAbortHandling(ctx, textDocument, position, telemetryData, token, options);
  } catch (e) {
    if (isAbortError(e)) return {
      type: "canceled",
      reason: "aborted at unknown location",
      telemetryData: mkCanceledResultTelemetry(telemetryData, {
        cancelledNetworkRequest: !0
      })
    };
    throw e;
  }
},__name(getGhostText, "getGhostText");

,function getLocalInlineSuggestion(ctx, prefix, prompt, requestMultiline) {
  let choicesTyping = ctx.get(CurrentGhostText).getCompletionsForUserTyping(prefix, prompt.suffix),
    choicesCache = getCompletionsFromCache(ctx, prefix, prompt, requestMultiline);
  if (choicesTyping && choicesTyping.length > 0) {
    let choicesCacheDeduped = (choicesCache != null ? choicesCache : []).filter(c => !choicesTyping.some(t => t.completionText === c.completionText));
    return [choicesTyping.concat(choicesCacheDeduped), 2];
  }
  if (choicesCache && choicesCache.length > 0) return [choicesCache, 1];
},__name(getLocalInlineSuggestion, "getLocalInlineSuggestion");

,function isInlineSuggestion(document, position) {
  let isMiddleOfLine = isMiddleOfTheLine(position, document),
    isValidMiddleOfLine = isValidMiddleOfTheLinePosition(position, document);
  return isMiddleOfLine && !isValidMiddleOfLine ? void 0 : isMiddleOfLine && isValidMiddleOfLine;
},__name(isInlineSuggestion, "isInlineSuggestion");

,function isMiddleOfTheLine(selectionPosition, doc) {
  return doc.lineAt(selectionPosition).text.substr(selectionPosition.character).trim().length != 0;
},__name(isMiddleOfTheLine, "isMiddleOfTheLine");

,function isValidMiddleOfTheLinePosition(selectionPosition, doc) {
  let endOfLine = doc.lineAt(selectionPosition).text.substr(selectionPosition.character).trim();
  return /^\s*[)>}\]"'`]*\s*[:{;

,]?\s*$/.test(endOfLine);
},__name(isValidMiddleOfTheLinePosition, "isValidMiddleOfTheLinePosition");

,function isNewLine(selectionPosition, doc) {
  return doc.lineAt(selectionPosition).text.trim().length === 0;
},__name(isNewLine, "isNewLine");

,var _ForceMultiLine = class _ForceMultiLine {
  constructor(requestMultilineOverride = !1) {
    this.requestMultilineOverride = requestMultilineOverride;
  }
};

,__name(_ForceMultiLine, "ForceMultiLine"), _ForceMultiLine.default = new _ForceMultiLine();

,var ForceMultiLine = _ForceMultiLine;

,async function shouldRequestMultiline(ctx, blockMode, document, position, inlineSuggestion, hasAcceptedCurrentCompletion, requestForNextLine, prompt) {
  if (ctx.get(ForceMultiLine).requestMultilineOverride) return !0;
  if (document.lineCount >= 8e3) telemetry(ctx, "ghostText.longFileMultilineSkip", TelemetryData.createAndMarkAsIssued({
    languageId: document.languageId,
    lineCount: String(document.lineCount),
    currentLine: String(position.line)
  }));else {
    if (blockMode == "moremultiline") return hasAcceptedCurrentCompletion ? !0 : !inlineSuggestion && isSupportedLanguageId(document.languageId) ? await isEmptyBlockStart(document, position) : inlineSuggestion && isSupportedLanguageId(document.languageId) ? (await isEmptyBlockStart(document, position)) || (await isEmptyBlockStart(document, document.lineAt(position).range.end)) : !1;
    if (requestForNextLine) {
      let indentation = contextIndentation(document, position),
        whitespaceChar = indentation.current > 0 ? document.lineAt(position).text[0] : void 0,
        change = {
          range: {
            start: position,
            end: position
          },
          newText: `
` + (whitespaceChar ? whitespaceChar.repeat(indentation.current) : "")
        };
      document = document.applyEdits([change]);
    }
    if (["typescript", "typescriptreact"].includes(document.languageId) && isNewLine(position, document)) return !0;
    let requestMultiline = !1;
    return !inlineSuggestion && isSupportedLanguageId(document.languageId) ? requestMultiline = await isEmptyBlockStart(document, position) : inlineSuggestion && isSupportedLanguageId(document.languageId) && (requestMultiline = (await isEmptyBlockStart(document, position)) || (await isEmptyBlockStart(document, document.lineAt(position).range.end))), requestMultiline || ["javascript", "javascriptreact", "python"].includes(document.languageId) && (requestMultiline = requestMultilineScore(prompt.prompt, document.languageId) > .5), requestMultiline;
  }
  return !1;
},__name(shouldRequestMultiline, "shouldRequestMultiline");

,function appendToCache(ctx, requestContext, newContents) {
  var _a;
  let promptHash = keyForPrompt(requestContext.prompt),
    existing = ctx.get(CompletionsCache).get(promptHash);
  existing && existing.multiline === newContents.multiline ? ctx.get(CompletionsCache).set(promptHash, {
    multiline: existing.multiline,
    choices: existing.choices.concat(newContents.choices)
  }) : ctx.get(CompletionsCache).set(promptHash, newContents), ghostTextLogger.debug(ctx, `Appended ${newContents.choices.length} cached ghost text for key: ${promptHash}, multiline: ${newContents.multiline}, total number of suggestions: ${((_a = existing == null ? void 0 : existing.choices.length) != null ? _a : 0) + newContents.choices.length}`);
},__name(appendToCache, "appendToCache");

,function getCachedChoices(ctx, promptHash, multiline) {
  let contents = ctx.get(CompletionsCache).get(promptHash);
  if (contents && !(multiline && !contents.multiline)) return contents.choices;
},__name(getCachedChoices, "getCachedChoices");

,function adjustLeadingWhitespace(index, text, ws) {
  if (ws.length > 0) {
    if (text.startsWith(ws)) return {
      completionIndex: index,
      completionText: text,
      displayText: text.substring(ws.length),
      displayNeedsWsOffset: !1
    };
    {
      let textLeftWs = text.substring(0, text.length - text.trimStart().length);
      return ws.startsWith(textLeftWs) ? {
        completionIndex: index,
        completionText: text,
        displayText: text.trimStart(),
        displayNeedsWsOffset: !0
      } : {
        completionIndex: index,
        completionText: text,
        displayText: text,
        displayNeedsWsOffset: !1
      };
    }
  } else return {
    completionIndex: index,
    completionText: text,
    displayText: text,
    displayNeedsWsOffset: !1
  };
},__name(adjustLeadingWhitespace, "adjustLeadingWhitespace");

,var MAX_COMPLETION_CACHE_PREFIX_BACKTRACK = 50;

,function getCompletionsFromCache(ctx, currentPrefix, prompt, multiline) {
  for (let i = 0; i < MAX_COMPLETION_CACHE_PREFIX_BACKTRACK; i++) {
    let choices = [],
      prefix = prompt.prefix.substring(0, prompt.prefix.length - i),
      promptHash = keyForPrompt({
        prefix: prefix,
        suffix: prompt.suffix
      }),
      cachedChoices = getCachedChoices(ctx, promptHash, multiline);
    if (!cachedChoices) continue;
    ghostTextLogger.debug(ctx, `Got completions from cache at ${i} characters back for key: ${promptHash}, multiline: ${multiline}`);
    let remainingPrefix = prompt.prefix.substring(prefix.length);
    for (let choice of cachedChoices) {
      let completionText = choice.completionText;
      if (!completionText.startsWith(remainingPrefix) || completionText.length <= remainingPrefix.length) continue;
      completionText = completionText.substring(remainingPrefix.length);
      let choiceToReturn = makeGhostAPIChoice({
        ...choice,
        completionText: completionText
      }, {
        forceSingleLine: !multiline && !isProgressRevealChoice(choice)
      });
      choiceToReturn.telemetryData.measurements.foundOffset = i, choiceToReturn.completionText !== "" && choices.push(choiceToReturn);
    }
    if (ghostTextLogger.debug(ctx, `Found ${choices.length} matching completions from cache at ${i} characters back`), choices.length > 0) return choices;
  }
  return [];
},__name(getCompletionsFromCache, "getCompletionsFromCache");

,function telemetryWithAddData(ctx, document, requestContext, choice, issuedTelemetryData) {
  let requestId = choice.requestId,
    properties = {
      choiceIndex: choice.choiceIndex.toString(),
      clientCompletionId: choice.clientCompletionId
    },
    numLines = choice.completionText.split(`
`).length,
    measurements = {
      compCharLen: choice.completionText.length,
      numLines: requestContext.requestForNextLine ? numLines - 1 : numLines
    };
  choice.meanLogProb && (measurements.meanLogProb = choice.meanLogProb), choice.meanAlternativeLogProb && (measurements.meanAlternativeLogProb = choice.meanAlternativeLogProb);
  let extendedTelemetry = choice.telemetryData.extendedBy(properties, measurements);
  return extendedTelemetry.issuedTime = issuedTelemetryData.issuedTime, extendedTelemetry.measurements.timeToProduceMs = performance.now() - issuedTelemetryData.issuedTime, addDocumentTelemetry(extendedTelemetry, document), extendedTelemetry.extendWithRequestId(requestId), extendedTelemetry.measurements.confidence = ghostTextScoreConfidence(ctx, extendedTelemetry), extendedTelemetry.measurements.quantile = ghostTextScoreQuantile(ctx, extendedTelemetry), ghostTextLogger.debug(ctx, `Extended telemetry for ${choice.telemetryData.properties.headerRequestId} with retention confidence ${extendedTelemetry.measurements.confidence} (expected as good or better than about ${extendedTelemetry.measurements.quantile} of all suggestions)`), extendedTelemetry;
},__name(telemetryWithAddData, "telemetryWithAddData");

,function telemetryIssued(ctx, document, requestContext, position, prompt, baseTelemetryData, requestInfo) {
  let properties = {
    languageId: document.languageId
  };
  requestContext.requestForNextLine !== void 0 && (properties.requestForNextLine = requestContext.requestForNextLine.toString());
  let telemetryData = baseTelemetryData.extendedBy(properties);
  addDocumentTelemetry(telemetryData, document);
  let repoInfo = requestContext.repoInfo;
  telemetryData.properties.gitRepoInformation = repoInfo === void 0 ? "unavailable" : repoInfo === 0 ? "pending" : "available", repoInfo !== void 0 && repoInfo !== 0 && (telemetryData.properties.gitRepoUrl = repoInfo.url, telemetryData.properties.gitRepoHost = repoInfo.hostname, telemetryData.properties.gitRepoOwner = repoInfo.owner, telemetryData.properties.gitRepoName = repoInfo.repo, telemetryData.properties.gitRepoPath = repoInfo.pathname), telemetryData.properties.engineName = requestInfo.modelId, telemetryData.properties.engineChoiceSource = requestInfo.engineChoiceSource, telemetryData.properties.isMultiline = JSON.stringify(requestContext.multiline), telemetryData.properties.isCycling = JSON.stringify(requestContext.isCycling);
  let currentLine = document.lineAt(position.line),
    lineBeforeCursor = document.getText(LocationFactory.range(currentLine.range.start, position)),
    restOfLine = document.getText(LocationFactory.range(position, currentLine.range.end)),
    typeFileHashCode = Array.from(prompt.neighborSource.entries()).map(typeFiles => [typeFiles[0], typeFiles[1].map(f => (0, F8e.SHA256)(f).toString())]),
    extendedProperties = {
      beforeCursorWhitespace: JSON.stringify(lineBeforeCursor.trim() === ""),
      afterCursorWhitespace: JSON.stringify(restOfLine.trim() === ""),
      promptChoices: JSON.stringify(prompt.promptChoices, (key, value) => value instanceof Map ? Array.from(value.entries()).reduce((acc, [k, v]) => ({
        ...acc,
        [k]: v
      }), {}) : value),
      promptBackground: JSON.stringify(prompt.promptBackground, (key, value) => value instanceof Map ? Array.from(value.values()) : value),
      neighborSource: JSON.stringify(typeFileHashCode),
      blockMode: requestContext.blockMode
    },
    extendedMeasurements = {
      ...telemetrizePromptLength(prompt.prompt),
      promptEndPos: document.offsetAt(position),
      promptComputeTimeMs: prompt.computeTimeMs
    };
  prompt.metadata && (extendedProperties.promptMetadata = JSON.stringify(prompt.metadata)), prompt.contextProvidersTelemetry && (extendedProperties.contextProviders = JSON.stringify(prompt.contextProvidersTelemetry));
  let telemetryDataToSend = telemetryData.extendedBy(extendedProperties, extendedMeasurements);
  return telemetryDataToSend.measurements.contextualFilterScore = contextualFilterScore(ctx, telemetryDataToSend, prompt.prompt), telemetry(ctx, "ghostText.issued", telemetryDataToSend), telemetryData;
},__name(telemetryIssued, "telemetryIssued");

,function addDocumentTelemetry(telemetry, document) {
  telemetry.measurements.documentLength = document.getText().length, telemetry.measurements.documentLineCount = document.lineCount;
},__name(addDocumentTelemetry, "addDocumentTelemetry");

,function telemetryPerformance(ctx, performanceKind, choice, requestStart, processingTimeMs) {
  let requestTimeMs = Date.now() - requestStart,
    deltaMs = requestTimeMs - processingTimeMs,
    telemetryData = choice.telemetryData.extendedBy({}, {
      completionCharLen: choice.completionText.length,
      requestTimeMs: requestTimeMs,
      processingTimeMs: processingTimeMs,
      deltaMs: deltaMs,
      meanLogProb: choice.meanLogProb || NaN,
      meanAlternativeLogProb: choice.meanAlternativeLogProb || NaN
    });
  telemetryData.extendWithRequestId(choice.requestId), telemetry(ctx, `ghostText.${performanceKind}`, telemetryData);
},__name(telemetryPerformance, "telemetryPerformance");