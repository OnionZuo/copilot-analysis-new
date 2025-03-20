var _ChatMLFetcher = class _ChatMLFetcher {
  constructor(ctx) {
    this.ctx = ctx;
    this.fetcher = new OpenAIChatMLFetcher();
  }
  async fetchResponse(params, cancellationToken, baseTelemetryWithExp, finishedCb) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    let ourRequestId = v4_default(),
      postOptions = {
        n: (_a = params.num_suggestions) != null ? _a : 1,
        temperature: (_b = params.temperature) != null ? _b : 0,
        stop: params.stop,
        top_p: (_c = params.topP) != null ? _c : 1,
        copilot_thread_id: params.copilot_thread_id
      },
      modelConfiguration = params.modelConfiguration;
    modelConfiguration && (postOptions.max_tokens = modelConfiguration.maxResponseTokens, postOptions.stream = !!modelConfiguration.stream), params.logitBias && (postOptions.logit_bias = params.logitBias);
    let engineUrl = (_d = params.engineUrl) != null ? _d : await getChatURL(this.ctx),
      endpoint = (_e = params.endpoint) != null ? _e : "completions",
      authToken = (_f = params.authToken) != null ? _f : (await this.ctx.get(CopilotTokenManager).getToken()).token,
      chatParams = {
        messages: params.messages,
        repoInfo: void 0,
        ourRequestId: ourRequestId,
        engineUrl: engineUrl,
        endpoint: endpoint,
        count: (_g = params.num_suggestions) != null ? _g : 1,
        uiKind: params.uiKind,
        postOptions: postOptions,
        authToken: authToken,
        ...params.intentParams
      };
    return modelConfiguration && (chatParams.model = modelConfiguration.modelId), params.tools && ((_h = params.tools) == null ? void 0 : _h.length) > 0 && (modelConfiguration === void 0 || modelConfiguration.toolCalls) && (chatParams.tools = params.tools, chatParams.tool_choice = (_i = params.tool_choice) != null ? _i : "auto"), await this.fetch(chatParams, finishedCb, cancellationToken, baseTelemetryWithExp);
  }
  async fetch(chatParams, finishedCb, cancellationToken, baseTelemetryWithExp) {
    try {
      let response = await this.fetcher.fetchAndStreamChat(this.ctx, chatParams, baseTelemetryWithExp.extendedBy({
        uiKind: chatParams.uiKind
      }), finishedCb || (async () => {}), cancellationToken);
      switch (response.type) {
        case "success":
          return await this.processSuccessfulResponse(response, chatParams.ourRequestId, baseTelemetryWithExp);
        case "canceled":
          return this.processCanceledResponse(response, chatParams.ourRequestId);
        case "failed":
        case "failedDependency":
          return this.processFailedResponse(response, chatParams.ourRequestId);
        case "authRequired":
          return {
            type: "agentAuthRequired",
            reason: "Agent authentication required.",
            authUrl: response.authUrl,
            requestId: chatParams.ourRequestId
          };
      }
    } catch (err) {
      return this.processError(err, chatParams.ourRequestId);
    }
  }
  async processSuccessfulResponse(response, requestId, baseTelemetryWithExp) {
    var _a, _b;
    let results = [],
      postProcessed = asyncIterableMapFilter(response.chatCompletions, async completion => this.postProcess(completion, baseTelemetryWithExp));
    for await (let chatCompletion of postProcessed) conversationLogger.debug(this.ctx, `Received choice: ${JSON.stringify(chatCompletion, null, 2)}`), results.push(chatCompletion);
    if (results.length == 1) {
      let result = results[0];
      switch (result.finishReason) {
        case "stop":
          return {
            type: "success",
            value: (_b = (_a = result.message) == null ? void 0 : _a.content) != null ? _b : "",
            toolCalls: result.tool_calls,
            requestId: requestId,
            numTokens: result.numTokens
          };
        case "tool_calls":
          return {
            type: "tool_calls",
            toolCalls: result.tool_calls,
            requestId: requestId
          };
        case "content_filter":
          return {
            type: "filtered",
            reason: "Response got filtered.",
            requestId: requestId
          };
        case "length":
          return {
            type: "length",
            reason: "Response too long.",
            requestId: requestId
          };
        case "DONE":
          return {
            type: "no_finish_reason",
            reason: "No finish reason received.",
            requestId: requestId
          };
        default:
          return {
            type: "unknown",
            reason: "Unknown finish reason received.",
            requestId: requestId
          };
      }
    } else if (results.length > 1) {
      let filtered_results = results.filter(r => r.finishReason == "stop" || r.finishReason == "tool_calls");
      if (filtered_results.length > 0) return {
        type: "successMultiple",
        value: filtered_results.map(r => r.message.content),
        toolCalls: filtered_results.map(r => r.tool_calls).filter(f => f),
        requestId: requestId
      };
    }
    return {
      type: "no_choices",
      reason: "Response contained no choices.",
      requestId: requestId
    };
  }
  postProcess(chatCompletion, baseTelemetryWithExp) {
    return isRepetitive(chatCompletion.tokens) ? (baseTelemetryWithExp.extendWithRequestId(chatCompletion.requestId), telemetry(this.ctx, "conversation.repetition.detected", baseTelemetryWithExp, 0), chatCompletion.finishReason !== "" ? chatCompletion : void 0) : chatCompletion.message ? chatCompletion : void 0;
  }
  processCanceledResponse(response, requestId) {
    return conversationLogger.debug(this.ctx, "Cancelled after awaiting fetchConversation"), {
      type: "canceled",
      reason: response.reason,
      requestId: requestId
    };
  }
  processFailedResponse(response, requestId) {
    return response != null && response.reason.includes("filtered as off_topic by intent classifier") ? {
      type: "offTopic",
      reason: response.reason,
      requestId: requestId
    } : response != null && response.reason.includes("model is not supported") ? {
      type: "model_not_supported",
      reason: response.reason,
      requestId: requestId
    } : {
      type: "failed",
      reason: response.reason,
      requestId: requestId,
      code: response.type === "failed" ? response.code : void 0
    };
  }
  processError(err, requestId) {
    return isAbortError(err) ? {
      type: "canceled",
      reason: "network request aborted",
      requestId: requestId
    } : (conversationLogger.exception(this.ctx, err, "Error on conversation request"), {
      type: "failed",
      reason: "Error on conversation request. Check the log for more details.",
      requestId: requestId
    });
  }
};

,__name(_ChatMLFetcher, "ChatMLFetcher");

,var ChatMLFetcher = _ChatMLFetcher;