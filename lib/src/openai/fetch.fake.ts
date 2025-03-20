function fakeAPIChoice(headerRequestId, choiceIndex, completionText, telemetryData = TelemetryWithExp.createEmptyConfigForTesting()) {
  let tokenizer = getTokenizer();
  return {
    completionText: completionText,
    meanLogProb: .5,
    meanAlternativeLogProb: .5,
    numTokens: -1,
    choiceIndex: choiceIndex,
    requestId: {
      headerRequestId: headerRequestId,
      completionId: v4_default(),
      created: 0,
      serverExperiments: "dummy",
      deploymentId: "dummy"
    },
    telemetryData: telemetryData,
    tokens: tokenizer.tokenize(completionText).map(token => tokenizer.detokenize([token])).concat(),
    blockFinished: !1,
    clientCompletionId: v4_default()
  };
},__name(fakeAPIChoice, "fakeAPIChoice");

,async function* fakeAPIChoices(postOptions, finishedCb, completions, telemetryData) {
  let fakeHeaderRequestId = v4_default(),
    choiceIndex = 0;
  for (let completion of completions) {
    let stopOffset = -1;
    if ((postOptions == null ? void 0 : postOptions.stop) !== void 0) for (let stopToken of postOptions.stop) {
      let thisStopOffset = completion.indexOf(stopToken);
      thisStopOffset !== -1 && (stopOffset === -1 || thisStopOffset < stopOffset) && (stopOffset = thisStopOffset);
    }
    stopOffset !== -1 && (completion = completion.substring(0, stopOffset));
    let finishOffset = await finishedCb(completion, {
      text: completion
    });
    finishOffset !== void 0 && (completion = completion.substring(0, finishOffset));
    let choice = fakeAPIChoice(fakeHeaderRequestId, choiceIndex++, completion, telemetryData);
    choice.blockFinished = finishOffset !== void 0, yield choice;
  }
},__name(fakeAPIChoices, "fakeAPIChoices");

,function fakeResponse(completions, finishedCb, postOptions, telemetryData) {
  return {
    type: "success",
    choices: postProcessChoices(fakeAPIChoices(postOptions, finishedCb, completions, telemetryData)),
    getProcessingTime: __name(() => 0, "getProcessingTime")
  };
},__name(fakeResponse, "fakeResponse");

,var _SyntheticCompletions = class _SyntheticCompletions extends OpenAIFetcher {
  constructor(_completions) {
    super();
    this._completions = _completions;
    this._wasCalled = !1;
    this._speculationWasCalled = !1;
  }
  async fetchAndStreamCompletions(ctx, params, baseTelemetryData, finishedCb, cancel, teletryProperties) {
    if (ctx.get(CopilotTokenManager).getToken(), cancel != null && cancel.isCancellationRequested) return {
      type: "canceled",
      reason: "canceled during test"
    };
    if (this._wasCalled) {
      let emptyCompletions = this._completions.map(completion => "");
      return fakeResponse(emptyCompletions, finishedCb, params.postOptions, baseTelemetryData);
    } else return this._wasCalled = !0, fakeResponse(this._completions, finishedCb, params.postOptions, baseTelemetryData);
  }
  async fetchAndStreamSpeculation(ctx, params, baseTelemetryData, finishedCb, cancel) {
    if (ctx.get(CopilotTokenManager).getToken(), cancel != null && cancel.isCancellationRequested) return {
      type: "canceled",
      reason: "canceled during test"
    };
    if (this._speculationWasCalled) {
      let emptyCompletions = this._completions.map(completion => "");
      return fakeResponse(emptyCompletions, finishedCb, void 0, baseTelemetryData);
    } else return this._speculationWasCalled = !0, fakeResponse(this._completions, finishedCb, void 0, baseTelemetryData);
  }
};

,__name(_SyntheticCompletions, "SyntheticCompletions");

,var SyntheticCompletions = _SyntheticCompletions;