var util = fn(require("util"));

,var logger = new Logger("fetchChat"),
  _OpenAIChatMLFetcher = class _OpenAIChatMLFetcher {
    async fetchAndStreamChat(ctx, params, baseTelemetryWithExp, finishedCb, cancel) {
      var _a, _b;
      let response = await this.fetchWithParameters(ctx, params.endpoint, params, baseTelemetryWithExp, cancel);
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
        let telemetryData = this.createTelemetryData(params.endpoint, ctx, params);
        return this.handleError(ctx, telemetryData, response);
      }
      if (((_a = params.postOptions) == null ? void 0 : _a.stream) === !1) {
        let textResponse = await response.text(),
          jsonResponse = JSON.parse(textResponse),
          message = jsonResponse.choices != null ? jsonResponse.choices[0].message : {
            role: "assistant",
            content: ""
          },
          requestId = (_b = response.headers.get("X-Request-ID")) != null ? _b : v4_default(),
          completion = {
            blockFinished: !1,
            choiceIndex: 0,
            finishReason: "stop",
            message: message,
            tokens: message.content.split(" "),
            requestId: {
              headerRequestId: requestId,
              completionId: jsonResponse.id ? jsonResponse.id : "",
              created: jsonResponse.created ? Number(jsonResponse.created) : 0,
              deploymentId: "",
              serverExperiments: ""
            },
            telemetryData: baseTelemetryWithExp,
            numTokens: 0
          },
          text = message.content;
        return await finishedCb(text, {
          text: text,
          copilotReferences: jsonResponse.copilot_references
        }), {
          type: "success",
          chatCompletions: async function* () {
            yield completion;
          }(),
          getProcessingTime: __name(() => getProcessingTime(response), "getProcessingTime")
        };
      } else {
        let finishedCompletions = SSEProcessor.create(ctx, params.count, response, baseTelemetryWithExp, [], cancel).processSSE(finishedCb);
        return {
          type: "success",
          chatCompletions: asyncIterableMap(finishedCompletions, async solution => prepareChatCompletionForReturn(ctx, solution, baseTelemetryWithExp)),
          getProcessingTime: __name(() => getProcessingTime(response), "getProcessingTime")
        };
      }
    }
    createTelemetryData(endpoint, ctx, params) {
      return TelemetryData.createAndMarkAsIssued({
        endpoint: endpoint,
        engineName: extractEngineName(ctx, params.engineUrl),
        uiKind: params.uiKind,
        headerRequestId: params.ourRequestId
      });
    }
    async fetchWithParameters(ctx, endpoint, params, telemetryWithExp, cancel) {
      let request = {
          messages: params.messages,
          tools: params.tools,
          tool_choice: params.tool_choice,
          model: params.model,
          temperature: getTemperatureForSamples(ctx, params.count),
          top_p: getTopP(ctx),
          n: params.count,
          stop: [`


`],
          copilot_thread_id: params.copilot_thread_id
        },
        githubNWO = tryGetGitHubNWO(params.repoInfo);
      return githubNWO !== void 0 && (request.nwo = githubNWO), params.postOptions && Object.assign(request, params.postOptions), params.intent && (request.intent = params.intent, params.intent_model && (request.intent_model = params.intent_model), params.intent_tokenizer && (request.intent_tokenizer = params.intent_tokenizer), params.intent_threshold && (request.intent_threshold = params.intent_threshold), params.intent_content && (request.intent_content = params.intent_content)), cancel != null && cancel.isCancellationRequested ? "not-sent" : await fetchWithInstrumentation(ctx, params.messages, params.engineUrl, endpoint, params.ourRequestId, request, params.authToken, params.uiKind, telemetryWithExp, cancel);
    }
    async handleError(ctx, telemetryData, response) {
      if (response.clientError && !response.headers.get("x-github-request-id")) {
        let message = `Last response was a ${response.status} error and does not appear to originate from GitHub. Is a proxy or firewall intercepting this request? https://gh.io/copilot-firewall`;
        logger.error(ctx, message), telemetryData.properties.error = `Response status was ${response.status} with no x-github-request-id header`;
      } else telemetryData.properties.error = `Response status was ${response.status}`;
      if (telemetryData.properties.status = String(response.status), telemetry(ctx, "request.shownWarning", telemetryData), response.status === 401) try {
        let text = await response.text(),
          json = JSON.parse(text);
        if (json.authorize_url) return {
          type: "authRequired",
          reason: "not authorized",
          authUrl: json.authorize_url
        };
      } catch {}
      if (response.status === 401 || response.status === 403) return ctx.get(CopilotTokenManager).resetToken(response.status), {
        type: "failed",
        reason: `token expired or invalid: ${response.status}`,
        code: response.status
      };
      if (response.status === 499) return logger.info(ctx, "Cancelled by server"), {
        type: "failed",
        reason: "canceled by server",
        code: response.status
      };
      let text = await response.text();
      if (response.status === 466) return logger.info(ctx, text), {
        type: "failed",
        reason: `client not supported: ${text}`,
        code: response.status
      };
      if (response.status === 400 && text.includes("off_topic")) return {
        type: "failed",
        reason: "filtered as off_topic by intent classifier: message was not programming related",
        code: response.status
      };
      if (response.status === 400 && text.includes("model_not_supported")) return {
        type: "failed",
        reason: "model is not supported.",
        code: response.status
      };
      if (response.status === 424) return {
        type: "failedDependency",
        reason: text
      };
      if (response.status === 402) {
        let retryAfter = response.headers.get("retry-after");
        return {
          type: "failed",
          reason: retryAfter ? `You've reached your monthly chat messages limit. Upgrade to Copilot Pro (30-day free trial) or wait until ${new Date(retryAfter).toLocaleString()} for your limit to reset.` : "You've reached your monthly chat messages limit. Upgrade to Copilot Pro (30-day free trial) or wait for your limit to reset.",
          code: response.status
        };
      }
      return logger.error(ctx, "Unhandled status from server:", response.status, text), {
        type: "failed",
        reason: `unhandled status from server: ${response.status} ${text}`,
        code: response.status
      };
    }
  };

,__name(_OpenAIChatMLFetcher, "OpenAIChatMLFetcher");

,var OpenAIChatMLFetcher = _OpenAIChatMLFetcher;

,async function fetchWithInstrumentation(ctx, messages, engineUrl, endpoint, ourRequestId, request, secretKey, uiKind, telemetryWithExp, cancel) {
  var _a;
  let uri = _$e.format("%s/%s", engineUrl, endpoint);
  if (!secretKey) throw new Error(`Failed to send request to ${uri} due to missing key`);
  let extendedTelemetryWithExp = telemetryWithExp.extendedBy({
    endpoint: endpoint,
    engineName: extractEngineName(ctx, engineUrl),
    uiKind: uiKind
  });
  for (let [key, value] of Object.entries(request)) key != "messages" && (extendedTelemetryWithExp.properties[`request.option.${key}`] = (_a = JSON.stringify(value)) != null ? _a : "undefined");
  extendedTelemetryWithExp.properties.headerRequestId = ourRequestId, telemetry(ctx, "request.sent", extendedTelemetryWithExp);
  let requestStart = now(),
    intent = uiKindToIntent(uiKind);
  return postRequest(ctx, uri, secretKey, intent, ourRequestId, request, cancel).then(response => {
    let modelRequestId = getRequestId(response, void 0);
    extendedTelemetryWithExp.extendWithRequestId(modelRequestId);
    let totalTimeMs = now() - requestStart;
    return extendedTelemetryWithExp.measurements.totalTimeMs = totalTimeMs, logger.info(ctx, `request.response: [${uri}] took ${totalTimeMs} ms`), logger.debug(ctx, "request.response properties", extendedTelemetryWithExp.properties), logger.debug(ctx, "request.response measurements", extendedTelemetryWithExp.measurements), logger.debug(ctx, "messages:", JSON.stringify(messages)), telemetry(ctx, "request.response", extendedTelemetryWithExp), response;
  }).catch(error => {
    var _a, _b, _c, _d;
    if (isAbortError(error)) throw error;
    let warningTelemetry = extendedTelemetryWithExp.extendedBy({
      error: "Network exception"
    });
    telemetry(ctx, "request.shownWarning", warningTelemetry), extendedTelemetryWithExp.properties.message = String((_a = getKey(error, "name")) != null ? _a : ""), extendedTelemetryWithExp.properties.code = String((_b = getKey(error, "code")) != null ? _b : ""), extendedTelemetryWithExp.properties.errno = String((_c = getKey(error, "errno")) != null ? _c : ""), extendedTelemetryWithExp.properties.type = String((_d = getKey(error, "type")) != null ? _d : "");
    let totalTimeMs = now() - requestStart;
    throw extendedTelemetryWithExp.measurements.totalTimeMs = totalTimeMs, logger.debug(ctx, `request.response: [${uri}] took ${totalTimeMs} ms`), logger.debug(ctx, "request.error properties", extendedTelemetryWithExp.properties), logger.debug(ctx, "request.error measurements", extendedTelemetryWithExp.measurements), telemetry(ctx, "request.error", extendedTelemetryWithExp), error;
  }).finally(() => {
    logEngineMessages(ctx, messages, extendedTelemetryWithExp);
  });
},__name(fetchWithInstrumentation, "fetchWithInstrumentation");