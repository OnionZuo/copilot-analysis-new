var util = fn(require("util"));

,var logger = new Logger("fetchCompletions");

,function getRequestId(response, json) {
  return {
    headerRequestId: response.headers.get("x-request-id") || "",
    completionId: json && json.id ? json.id : "",
    created: json && json.created ? json.created : 0,
    serverExperiments: response.headers.get("X-Copilot-Experiment") || "",
    deploymentId: response.headers.get("azureml-model-deployment") || ""
  };
},__name(getRequestId, "getRequestId");

,function getProcessingTime(response) {
  let reqIdStr = response.headers.get("openai-processing-ms");
  return reqIdStr ? parseInt(reqIdStr, 10) : 0;
},__name(getProcessingTime, "getProcessingTime");

,function extractEngineName(ctx, engineUrl) {
  let engineName = engineUrl.split("/").pop();
  return engineName || (logger.error(ctx, "Malformed engine URL: " + engineUrl), engineUrl);
},__name(extractEngineName, "extractEngineName");

,function uiKindToIntent(uiKind) {
  switch (uiKind) {
    case "ghostText":
      return "copilot-ghost";
    case "synthesize":
      return "copilot-panel";
  }
},__name(uiKindToIntent, "uiKindToIntent");

,var _OpenAIFetcher = class _OpenAIFetcher {};

,__name(_OpenAIFetcher, "OpenAIFetcher");

,var OpenAIFetcher = _OpenAIFetcher;

,async function fetchWithInstrumentation(ctx, prompt, engineUrl, endpoint, ourRequestId, request, copilotToken, uiKind, cancel, telemetryProperties, headers) {
  var _a;
  let statusReporter = ctx.get(StatusReporter),
    uri = S4e.format("%s/%s", engineUrl, endpoint),
    telemetryData = TelemetryData.createAndMarkAsIssued({
      endpoint: endpoint,
      engineName: extractEngineName(ctx, engineUrl),
      uiKind: uiKind
    }, telemetrizePromptLength(prompt));
  telemetryProperties && (telemetryData = telemetryData.extendedBy(telemetryProperties));
  for (let [key, value] of Object.entries(request)) key == "prompt" || key == "suffix" || (telemetryData.properties[`request.option.${key}`] = (_a = JSON.stringify(value)) != null ? _a : "undefined");
  telemetryData.properties.headerRequestId = ourRequestId, telemetry(ctx, "request.sent", telemetryData);
  let requestStart = now(),
    intent = uiKindToIntent(uiKind);
  return postRequest(ctx, uri, copilotToken.token, intent, ourRequestId, request, cancel, headers).then(response => {
    let modelRequestId = getRequestId(response, void 0);
    telemetryData.extendWithRequestId(modelRequestId);
    let totalTimeMs = now() - requestStart;
    return telemetryData.measurements.totalTimeMs = totalTimeMs, logger.info(ctx, `request.response: [${uri}] took ${totalTimeMs} ms`), logger.debug(ctx, "request.response properties", telemetryData.properties), logger.debug(ctx, "request.response measurements", telemetryData.measurements), logger.debug(ctx, "prompt:", prompt), telemetry(ctx, "request.response", telemetryData), response;
  }).catch(error => {
    var _a, _b, _c, _d, _e;
    if (isAbortError(error)) throw error;
    statusReporter.setWarning((_a = getKey(error, "message")) != null ? _a : "");
    let warningTelemetry = telemetryData.extendedBy({
      error: "Network exception"
    });
    telemetry(ctx, "request.shownWarning", warningTelemetry), telemetryData.properties.message = String((_b = getKey(error, "name")) != null ? _b : ""), telemetryData.properties.code = String((_c = getKey(error, "code")) != null ? _c : ""), telemetryData.properties.errno = String((_d = getKey(error, "errno")) != null ? _d : ""), telemetryData.properties.type = String((_e = getKey(error, "type")) != null ? _e : "");
    let totalTimeMs = now() - requestStart;
    throw telemetryData.measurements.totalTimeMs = totalTimeMs, logger.debug(ctx, `request.response: [${uri}] took ${totalTimeMs} ms`), logger.debug(ctx, "request.error properties", telemetryData.properties), logger.debug(ctx, "request.error measurements", telemetryData.measurements), telemetry(ctx, "request.error", telemetryData), error;
  }).finally(() => {
    logEnginePrompt(ctx, prompt, telemetryData);
  });
},__name(fetchWithInstrumentation, "fetchWithInstrumentation");

,function postProcessChoices(choices) {
  return asyncIterableFilter(choices, async choice => choice.completionText.trim().length > 0);
},__name(postProcessChoices, "postProcessChoices");

,var CMDQuotaExceeded = "github.copilot.completions.quotaExceeded",
  _disabledReason,
  _LiveOpenAIFetcher = class _LiveOpenAIFetcher extends OpenAIFetcher {
    constructor() {
      super(...arguments);
      __privateAdd(this, _disabledReason);
    }
    async fetchAndStreamCompletions(ctx, params, baseTelemetryData, finishedCb, cancel, telemetryProperties) {
      if (__privateGet(this, _disabledReason)) return {
        type: "canceled",
        reason: __privateGet(this, _disabledReason)
      };
      let statusReporter = ctx.get(StatusReporter),
        endpoint = "completions",
        copilotToken = await ctx.get(CopilotTokenManager).getToken(),
        response = await this.fetchWithParameters(ctx, endpoint, params, copilotToken, baseTelemetryData, cancel, telemetryProperties);
      if (response === "not-sent") return {
        type: "canceled",
        reason: "before fetch request"
      };
      if (cancel != null && cancel.isCancellationRequested) {
        let body = response.body();
        try {
          body.destroy();
        } catch (e) {
          logger.exception(ctx, e, "Error destroying stream");
        }
        return {
          type: "canceled",
          reason: "after fetch request"
        };
      }
      if (response.status !== 200) {
        let telemetryData = this.createTelemetryData(endpoint, ctx, params);
        return this.handleError(ctx, statusReporter, telemetryData, response, copilotToken);
      }
      let dropCompletionReasons = ctx.get(Features).dropCompletionReasons(baseTelemetryData),
        finishedCompletions = SSEProcessor.create(ctx, params.count, response, baseTelemetryData, dropCompletionReasons, cancel).processSSE(finishedCb),
        choices = asyncIterableMap(finishedCompletions, async solution => prepareSolutionForReturn(ctx, solution, baseTelemetryData));
      return {
        type: "success",
        choices: postProcessChoices(choices),
        getProcessingTime: __name(() => getProcessingTime(response), "getProcessingTime")
      };
    }
    async fetchAndStreamSpeculation(ctx, params, baseTelemetryData, finishedCb, cancel, telemetryProperties) {
      var _a;
      if (__privateGet(this, _disabledReason)) return {
        type: "canceled",
        reason: __privateGet(this, _disabledReason)
      };
      let statusReporter = ctx.get(StatusReporter),
        endpoint = "speculation",
        copilotToken = await ctx.get(CopilotTokenManager).getToken(),
        completionParams = {
          prompt: {
            prefix: params.prompt,
            suffix: "",
            isFimEnabled: !1,
            promptElementRanges: []
          },
          postOptions: {
            speculation: params.speculation,
            temperature: params.temperature,
            stream: params.stream,
            stop: (_a = params.stops) != null ? _a : []
          },
          languageId: "",
          count: 0,
          repoInfo: void 0,
          ourRequestId: v4_default(),
          engineUrl: params.engineUrl,
          uiKind: params.uiKind,
          headers: params.headers
        },
        response = await this.fetchSpeculationWithParameters(ctx, endpoint, completionParams, copilotToken, cancel, telemetryProperties);
      if (response === "not-sent") return {
        type: "canceled",
        reason: "before fetch request"
      };
      if (cancel != null && cancel.isCancellationRequested) {
        let body = response.body();
        try {
          body.destroy();
        } catch (e) {
          logger.exception(ctx, e, "Error destroying stream");
        }
        return {
          type: "canceled",
          reason: "after fetch request"
        };
      }
      if (response.status !== 200) {
        let telemetryData = this.createTelemetryData(endpoint, ctx, completionParams);
        return this.handleError(ctx, statusReporter, telemetryData, response, copilotToken);
      }
      let dropCompletionReasons = ctx.get(Features).dropCompletionReasons(baseTelemetryData),
        finishedCompletions = SSEProcessor.create(ctx, 1, response, baseTelemetryData, dropCompletionReasons, cancel).processSSE(finishedCb),
        choices = asyncIterableMap(finishedCompletions, async solution => prepareSolutionForReturn(ctx, solution, baseTelemetryData));
      return {
        type: "success",
        choices: postProcessChoices(choices),
        getProcessingTime: __name(() => getProcessingTime(response), "getProcessingTime")
      };
    }
    createTelemetryData(endpoint, ctx, params) {
      return TelemetryData.createAndMarkAsIssued({
        endpoint: endpoint,
        engineName: extractEngineName(ctx, params.engineUrl),
        uiKind: params.uiKind,
        headerRequestId: params.ourRequestId
      });
    }
    async fetchSpeculationWithParameters(ctx, endpoint, params, copilotToken, cancel, telemetryProperties) {
      let request = {
        prompt: params.prompt.prefix
      };
      return params.postOptions && Object.assign(request, params.postOptions), await new Promise((resolve, _reject) => {
        setImmediate(resolve);
      }), cancel != null && cancel.isCancellationRequested ? "not-sent" : await fetchWithInstrumentation(ctx, params.prompt, params.engineUrl, endpoint, params.ourRequestId, request, copilotToken, params.uiKind, cancel, telemetryProperties, params.headers);
    }
    async fetchWithParameters(ctx, endpoint, params, copilotToken, baseTelemetryData, cancel, telemetryProperties) {
      let disableLogProb = ctx.get(Features).disableLogProb(baseTelemetryData),
        request = {
          prompt: params.prompt.prefix,
          suffix: params.prompt.suffix,
          max_tokens: getMaxSolutionTokens(ctx),
          temperature: getTemperatureForSamples(ctx, params.count),
          top_p: getTopP(ctx),
          n: params.count,
          stop: getStops(ctx, params.languageId)
        };
      (params.requestLogProbs || !disableLogProb) && (request.logprobs = 2);
      let githubNWO = tryGetGitHubNWO(params.repoInfo);
      return githubNWO !== void 0 && (request.nwo = githubNWO), params.postOptions && Object.assign(request, params.postOptions), await new Promise((resolve, _reject) => {
        setImmediate(resolve);
      }), cancel != null && cancel.isCancellationRequested ? "not-sent" : await fetchWithInstrumentation(ctx, params.prompt, params.engineUrl, endpoint, params.ourRequestId, request, copilotToken, params.uiKind, cancel, telemetryProperties, params.headers);
    }
    async handleError(ctx, statusReporter, telemetryData, response, copilotToken) {
      let text = await response.text();
      if (response.clientError && !response.headers.get("x-github-request-id")) {
        let message = `Last response was a ${response.status} error and does not appear to originate from GitHub. Is a proxy or firewall intercepting this request? https://gh.io/copilot-firewall`;
        logger.error(ctx, message), statusReporter.setWarning(message), telemetryData.properties.error = `Response status was ${response.status} with no x-github-request-id header`;
      } else response.clientError ? (logger.warn(ctx, `Response status was ${response.status}:`, text), statusReporter.setWarning(`Last response was a ${response.status} error: ${text}`), telemetryData.properties.error = `Response status was ${response.status}: ${text}`) : (statusReporter.setWarning(`Last response was a ${response.status} error`), telemetryData.properties.error = `Response status was ${response.status}`);
      if (telemetryData.properties.status = String(response.status), telemetry(ctx, "request.shownWarning", telemetryData), response.status === 401 || response.status === 403) return ctx.get(CopilotTokenManager).resetToken(response.status), {
        type: "failed",
        reason: `token expired or invalid: ${response.status}`
      };
      if (response.status === 429) return setTimeout(() => {
        __privateSet(this, _disabledReason, void 0);
      }, 10 * 1e3), __privateSet(this, _disabledReason, "rate limited"), logger.warn(ctx, "Rate limited by server. Denying completions for the next 10 seconds."), {
        type: "failed",
        reason: __privateGet(this, _disabledReason)
      };
      if (response.status === 402) {
        __privateSet(this, _disabledReason, "monthly free code completions exhausted"), statusReporter.setError("Completions limit reached", {
          command: CMDQuotaExceeded,
          title: "Learn More"
        });
        let event = onCopilotToken(ctx, t => {
          var _a, _b;
          __privateSet(this, _disabledReason, void 0), ((_b = (_a = t.envelope.limited_user_quotas) == null ? void 0 : _a.completions) != null ? _b : 1) > 0 && (statusReporter.forceNormal(), event.dispose());
        });
        return {
          type: "failed",
          reason: __privateGet(this, _disabledReason)
        };
      }
      return response.status === 499 ? (logger.info(ctx, "Cancelled by server"), {
        type: "failed",
        reason: "canceled by server"
      }) : response.status === 466 ? (statusReporter.setError(text), logger.info(ctx, text), {
        type: "failed",
        reason: `client not supported: ${text}`
      }) : (logger.error(ctx, "Unhandled status from server:", response.status, text), {
        type: "failed",
        reason: `unhandled status from server: ${response.status} ${text}`
      });
    }
  };

,_disabledReason = new WeakMap(), __name(_LiveOpenAIFetcher, "LiveOpenAIFetcher");

,var LiveOpenAIFetcher = _LiveOpenAIFetcher;