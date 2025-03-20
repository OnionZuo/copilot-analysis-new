var solutionsLogger = new Logger("solutions");

,async function* trimChoices(choices) {
  for await (let choice of choices) {
    let choiceCopy = {
      ...choice
    };
    choiceCopy.completionText = choiceCopy.completionText.trimEnd(), yield choiceCopy;
  }
},__name(trimChoices, "trimChoices");

,var _SolutionManager = class _SolutionManager {
  constructor(textDocument, startPosition, completionContext, cancellationToken, solutionCountTarget) {
    this.textDocument = textDocument;
    this.startPosition = startPosition;
    this.completionContext = completionContext;
    this.cancellationToken = cancellationToken;
    this.solutionCountTarget = solutionCountTarget;
  }
  get savedTelemetryData() {
    return this._savedTelemetryData;
  }
  set savedTelemetryData(data) {
    this._savedTelemetryData = data;
  }
};

,__name(_SolutionManager, "SolutionManager");

,var SolutionManager = _SolutionManager;

,function normalizeCompletionText(text) {
  return text.replace(/\s+/g, "");
},__name(normalizeCompletionText, "normalizeCompletionText");

,async function launchSolutions(ctx, solutionManager) {
  var _a, _b, _c, _d, _e;
  let position = solutionManager.completionContext.position,
    indentation = solutionManager.completionContext.indentation,
    document = solutionManager.textDocument,
    repoInfo = extractRepoInfoInBackground(ctx, document.uri),
    ourRequestId = v4_default(),
    tempTelemetry = TelemetryData.createAndMarkAsIssued({
      headerRequestId: ourRequestId,
      languageId: document.languageId,
      source: completionTypeToString(solutionManager.completionContext.completionType)
    }, {});
  solutionManager.savedTelemetryData = await ctx.get(Features).updateExPValuesAndAssignments({
    uri: document.uri,
    languageId: document.languageId
  }, tempTelemetry);
  let promptResponse = await extractPrompt(ctx, document, position, solutionManager.savedTelemetryData);
  if (promptResponse.type === "copilotContentExclusion") return {
    status: "FinishedNormally"
  };
  if (promptResponse.type === "contextTooShort") return {
    status: "FinishedWithError",
    error: "Context too short"
  };
  if (promptResponse.type === "promptCancelled") return {
    status: "FinishedWithError",
    error: "Prompt cancelled"
  };
  if (promptResponse.type === "promptTimeout") return {
    status: "FinishedWithError",
    error: "Prompt timeout"
  };
  if (promptResponse.type === "promptError") return {
    status: "FinishedWithError",
    error: "Prompt error"
  };
  let prompt = promptResponse.prompt,
    trailingWs = promptResponse.trailingWs;
  trailingWs.length > 0 && (solutionManager.startPosition = LocationFactory.position(solutionManager.startPosition.line, solutionManager.startPosition.character - trailingWs.length));
  let cancellationToken = solutionManager.cancellationToken;
  solutionManager.savedTelemetryData = solutionManager.savedTelemetryData.extendedBy({}, {
    ...telemetrizePromptLength(prompt),
    solutionCount: solutionManager.solutionCountTarget,
    promptEndPos: document.offsetAt(position)
  }), solutionsLogger.debug(ctx, "prompt:", prompt), telemetry(ctx, "solution.requested", solutionManager.savedTelemetryData);
  let blockMode = await ctx.get(BlockModeConfig).forLanguage(ctx, document.languageId, solutionManager.savedTelemetryData),
    isSupportedLanguage = promptLibProxy.isSupportedLanguageId(document.languageId),
    contextIndent = contextIndentation(document, position),
    postOptions = {
      stream: !0,
      extra: {
        language: document.languageId,
        next_indent: (_a = contextIndent.next) != null ? _a : 0,
        prompt_tokens: (_b = prompt.prefixTokens) != null ? _b : 0,
        suffix_tokens: (_c = prompt.suffixTokens) != null ? _c : 0
      }
    };
  blockMode === "parsing" && !isSupportedLanguage && (postOptions.stop = [`

`, `\r
\r
`]);
  let engineInfo = getEngineRequestInfo(ctx, solutionManager.savedTelemetryData),
    completionParams = {
      prompt: prompt,
      languageId: document.languageId,
      repoInfo: repoInfo,
      ourRequestId: ourRequestId,
      engineUrl: engineInfo.url,
      count: solutionManager.solutionCountTarget,
      uiKind: "synthesize",
      postOptions: postOptions,
      requestLogProbs: !0,
      headers: engineInfo.headers
    },
    finishedCb;
  switch (blockMode) {
    case "server":
      finishedCb = __name(async text => {}, "finishedCb"), postOptions.extra.force_indent = (_d = contextIndent.prev) != null ? _d : -1, postOptions.extra.trim_by_indentation = !0;
      break;
    case "parsingandserver":
      finishedCb = isSupportedLanguage ? parsingBlockFinished(ctx, document, solutionManager.startPosition) : async text => {}, postOptions.extra.force_indent = (_e = contextIndent.prev) != null ? _e : -1, postOptions.extra.trim_by_indentation = !0;
      break;
    case "parsing":
    default:
      finishedCb = isSupportedLanguage ? parsingBlockFinished(ctx, document, solutionManager.startPosition) : async text => {};
      break;
  }
  let telemetryData = solutionManager.savedTelemetryData,
    res = await ctx.get(OpenAIFetcher).fetchAndStreamCompletions(ctx, completionParams, telemetryData.extendedBy(), finishedCb, cancellationToken);
  if (res.type === "failed" || res.type === "canceled") return {
    status: "FinishedWithError",
    error: `${res.type}: ${res.reason}`
  };
  let choices = res.choices;
  choices = trimChoices(choices), indentation !== null && (choices = cleanupIndentChoices(choices, indentation)), choices = asyncIterableMapFilter(choices, async choice => postProcessChoiceInContext(ctx, document, position, choice, !1, solutionsLogger));
  let solutions = asyncIterableMapFilter(choices, async apiChoice => {
    var _a;
    let display = apiChoice.completionText;
    solutionsLogger.info(ctx, `Open Copilot completion: [${apiChoice.completionText}]`);
    let displayStartPos = (_a = await getNodeStart(ctx, document, position, apiChoice.completionText)) != null ? _a : LocationFactory.position(position.line, 0),
      [displayBefore] = trimLastLine(document.getText(LocationFactory.range(displayStartPos, position)));
    display = displayBefore + display;
    let completionText = apiChoice.completionText;
    trailingWs.length > 0 && completionText.startsWith(trailingWs) && (completionText = completionText.substring(trailingWs.length));
    let meanLogProb = apiChoice.meanLogProb,
      meanProb = meanLogProb !== void 0 ? Math.exp(meanLogProb) : 0,
      solutionTelemetryData = telemetryData.extendedBy({
        choiceIndex: apiChoice.choiceIndex.toString()
      });
    return {
      completionText: completionText,
      insertText: display,
      range: LocationFactory.range(displayStartPos, position),
      meanProb: meanProb,
      meanLogProb: meanLogProb || 0,
      requestId: apiChoice.requestId,
      choiceIndex: apiChoice.choiceIndex,
      telemetryData: solutionTelemetryData,
      copilotAnnotations: apiChoice.copilotAnnotations
    };
  });
  return generateSolutionsStream(cancellationToken, solutions[Symbol.asyncIterator]());
},__name(launchSolutions, "launchSolutions");

,async function reportSolutions(nextSolutionPromise, solutionHandler) {
  let nextSolution = await nextSolutionPromise;
  switch (nextSolution.status) {
    case "Solution":
      await solutionHandler.onSolution(nextSolution.solution), await reportSolutions(nextSolution.next, solutionHandler);
      break;
    case "FinishedNormally":
      await solutionHandler.onFinishedNormally();
      break;
    case "FinishedWithError":
      await solutionHandler.onFinishedWithError(nextSolution.error);
      break;
  }
},__name(reportSolutions, "reportSolutions");

,async function runSolutions(ctx, solutionManager, solutionHandler) {
  return ctx.get(StatusReporter).withProgress(async () => {
    let nextSolution = launchSolutions(ctx, solutionManager);
    return await reportSolutions(nextSolution, solutionHandler);
  });
},__name(runSolutions, "runSolutions");

,async function generateSolutionsStream(cancellationToken, solutions) {
  if (cancellationToken.isCancellationRequested) return {
    status: "FinishedWithError",
    error: "Cancelled"
  };
  let nextResult = await solutions.next();
  return nextResult.done === !0 ? {
    status: "FinishedNormally"
  } : {
    status: "Solution",
    solution: nextResult.value,
    next: generateSolutionsStream(cancellationToken, solutions)
  };
},__name(generateSolutionsStream, "generateSolutionsStream");