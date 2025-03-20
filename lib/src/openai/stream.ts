var streamChoicesLogger = new Logger("streamChoices"),
  _APIJsonDataStreaming = class _APIJsonDataStreaming {
    constructor() {
      this.logprobs = [];
      this.top_logprobs = [];
      this.text = [];
      this.tokens = [];
      this.text_offset = [];
      this.copilot_annotations = new StreamCopilotAnnotations();
      this.tool_calls = [];
      this.function_call = new StreamingFunctionCall();
      this.copilot_references = [];
    }
    append(choice) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      if (choice.text && this.text.push(choice.text), (_a = choice.delta) != null && _a.content && choice.delta.role !== "function" && this.text.push(choice.delta.content), choice.logprobs && (this.tokens.push((_b = choice.logprobs.tokens) != null ? _b : []), this.text_offset.push((_c = choice.logprobs.text_offset) != null ? _c : []), this.logprobs.push((_d = choice.logprobs.token_logprobs) != null ? _d : []), this.top_logprobs.push((_e = choice.logprobs.top_logprobs) != null ? _e : [])), choice.copilot_annotations && this.copilot_annotations.update(choice.copilot_annotations), (_f = choice.delta) != null && _f.copilot_annotations && this.copilot_annotations.update(choice.delta.copilot_annotations), (_g = choice.delta) != null && _g.tool_calls && choice.delta.tool_calls.length > 0) for (let toolCall of choice.delta.tool_calls) {
        let index = toolCall.index;
        this.tool_calls[index] || (this.tool_calls[index] = new StreamingToolCall()), this.tool_calls[index].update(toolCall);
      }
      (_h = choice.delta) != null && _h.function_call && this.function_call.update(choice.delta.function_call);
    }
  };

,__name(_APIJsonDataStreaming, "APIJsonDataStreaming");

,var APIJsonDataStreaming = _APIJsonDataStreaming;

,function splitChunk(chunk) {
  let dataLines = chunk.split(`
`),
    newExtra = dataLines.pop();
  return [dataLines.filter(line => line != ""), newExtra];
},__name(splitChunk, "splitChunk");

,var _StreamingToolCall = class _StreamingToolCall {
  constructor() {
    this.arguments = [];
  }
  update(toolCall) {
    toolCall.function.name && (this.name = toolCall.function.name), this.arguments.push(toolCall.function.arguments);
  }
};

,__name(_StreamingToolCall, "StreamingToolCall");

,var StreamingToolCall = _StreamingToolCall,
  _StreamingFunctionCall = class _StreamingFunctionCall {
    constructor() {
      this.arguments = [];
    }
    update(functionCall) {
      functionCall.name && (this.name = functionCall.name), this.arguments.push(functionCall.arguments);
    }
  };

,__name(_StreamingFunctionCall, "StreamingFunctionCall");

,var StreamingFunctionCall = _StreamingFunctionCall,
  _StreamCopilotAnnotations = class _StreamCopilotAnnotations {
    constructor() {
      this.current = {};
    }
    update(annotations) {
      Object.entries(annotations).forEach(([namespace, annotations]) => {
        annotations.forEach(a => this.update_namespace(namespace, a));
      });
    }
    update_namespace(namespace, annotation) {
      this.current[namespace] || (this.current[namespace] = []);
      let annotationToUpdate = this.current[namespace],
        index = annotationToUpdate.findIndex(a => a.id === annotation.id);
      index >= 0 ? annotationToUpdate[index] = annotation : annotationToUpdate.push(annotation);
    }
    for(namespace) {
      var _a;
      return (_a = this.current[namespace]) != null ? _a : [];
    }
  };

,__name(_StreamCopilotAnnotations, "StreamCopilotAnnotations");

,var StreamCopilotAnnotations = _StreamCopilotAnnotations,
  _SSEProcessor = class _SSEProcessor {
    constructor(ctx, expectedNumChoices, response, body, telemetryData, dropCompletionReasons, cancellationToken) {
      this.ctx = ctx;
      this.expectedNumChoices = expectedNumChoices;
      this.response = response;
      this.body = body;
      this.telemetryData = telemetryData;
      this.dropCompletionReasons = dropCompletionReasons;
      this.cancellationToken = cancellationToken;
      this.requestId = getRequestId(this.response);
      this.stats = new ChunkStats(this.expectedNumChoices);
      this.solutions = {};
    }
    static create(ctx, expectedNumChoices, response, telemetryData, dropCompletionReasons, cancellationToken) {
      let body = response.body();
      return body.setEncoding("utf8"), new _SSEProcessor(ctx, expectedNumChoices, response, body, telemetryData, dropCompletionReasons != null ? dropCompletionReasons : ["content_filter"], cancellationToken);
    }
    async *processSSE(finishedCb = async () => {}) {
      try {
        yield* this.processSSEInner(finishedCb);
      } finally {
        this.cancel(), streamChoicesLogger.info(this.ctx, `request done: headerRequestId: [${this.requestId.headerRequestId}] model deployment ID: [${this.requestId.deploymentId}]`), streamChoicesLogger.debug(this.ctx, "request stats:", this.stats);
      }
    }
    async *processSSEInner(finishedCb) {
      var _a, _b, _c, _d, _e, _f;
      let extraData = "",
        currentFinishReason = null,
        model,
        usage;
      networkRead: for await (let chunk of this.body) {
        if (this.maybeCancel("after awaiting body chunk")) return;
        streamChoicesLogger.debug(this.ctx, "chunk", chunk.toString());
        let [dataLines, remainder] = splitChunk(extraData + chunk.toString());
        extraData = remainder;
        for (let dataLine of dataLines) {
          let lineWithoutData = dataLine.slice(5).trim();
          if (lineWithoutData == "[DONE]") {
            yield* this.finishSolutions(currentFinishReason, model, usage);
            return;
          }
          currentFinishReason = null;
          let json;
          try {
            json = JSON.parse(lineWithoutData);
          } catch {
            streamChoicesLogger.error(this.ctx, "Error parsing JSON stream data", dataLine);
            continue;
          }
          if (json.copilot_confirmation && isCopilotConfirmation(json.copilot_confirmation) && (await finishedCb("", {
            text: "",
            requestId: this.requestId,
            copilotConfirmation: json.copilot_confirmation
          })), json.copilot_references && (await finishedCb("", {
            text: "",
            requestId: this.requestId,
            copilotReferences: json.copilot_references
          })), json.choices === void 0) {
            !json.copilot_references && !json.copilot_confirmation && (json.error !== void 0 ? streamChoicesLogger.error(this.ctx, "Error in response:", json.error.message) : streamChoicesLogger.error(this.ctx, "Unexpected response with no choices or error: " + lineWithoutData)), json.copilot_errors && (await finishedCb("", {
              text: "",
              requestId: this.requestId,
              copilotErrors: json.copilot_errors
            }));
            continue;
          }
          if (this.requestId.created == 0 && (this.requestId = getRequestId(this.response, json), this.requestId.created === 0 && (_a = json.choices) != null && _a.length && streamChoicesLogger.error(this.ctx, 'Request id invalid, should have "completionId" and "created":', this.requestId)), model === void 0 && json.model && (model = json.model), usage === void 0 && json.usage && (usage = json.usage), this.allSolutionsDone()) {
            extraData = "";
            break networkRead;
          }
          for (let i = 0; i < ((_b = json.choices) == null ? void 0 : _b.length); i++) {
            let choice = json.choices[i];
            streamChoicesLogger.debug(this.ctx, "choice", choice), this.stats.add(choice.index), choice.index in this.solutions || (this.solutions[choice.index] = new APIJsonDataStreaming());
            let solution = this.solutions[choice.index];
            if (solution == null) continue;
            solution.append(choice);
            let finishOffset,
              hasNewLine = ((_c = choice.text) == null ? void 0 : _c.indexOf(`
`)) > -1 || ((_e = (_d = choice.delta) == null ? void 0 : _d.content) == null ? void 0 : _e.indexOf(`
`)) > -1;
            if (choice.finish_reason || hasNewLine) {
              let text = solution.text.join("");
              if (finishOffset = await finishedCb(text, {
                text: text,
                requestId: this.requestId,
                annotations: solution.copilot_annotations,
                copilotReferences: solution.copilot_references
              }), this.maybeCancel("after awaiting finishedCb")) return;
            }
            if (choice.finish_reason && solution.function_call.name !== void 0) {
              currentFinishReason = choice.finish_reason;
              continue;
            }
            if (!(choice.finish_reason || finishOffset !== void 0)) continue;
            let loggedReason = (_f = choice.finish_reason) != null ? _f : "client-trimmed";
            if (telemetry(this.ctx, "completion.finishReason", this.telemetryData.extendedBy({
              completionChoiceFinishReason: loggedReason,
              engineName: model != null ? model : "",
              engineChoiceSource: getEngineRequestInfo(this.ctx, this.telemetryData).engineChoiceSource
            })), this.dropCompletionReasons.includes(choice.finish_reason) ? this.solutions[choice.index] = null : (this.stats.markYielded(choice.index), yield {
              solution: solution,
              finishOffset: finishOffset,
              reason: choice.finish_reason,
              requestId: this.requestId,
              index: choice.index,
              model: model,
              usage: usage
            }), this.maybeCancel("after yielding finished choice")) return;
            this.solutions[choice.index] = null;
          }
        }
      }
      for (let [index, solution] of Object.entries(this.solutions)) {
        let solutionIndex = Number(index);
        if (solution != null && (telemetry(this.ctx, "completion.finishReason", this.telemetryData.extendedBy({
          completionChoiceFinishReason: "Iteration Done",
          engineName: model != null ? model : ""
        })), this.stats.markYielded(solutionIndex), yield {
          solution: solution,
          finishOffset: void 0,
          reason: "Iteration Done",
          requestId: this.requestId,
          index: solutionIndex,
          model: model,
          usage: usage
        }, this.maybeCancel("after yielding after iteration done"))) return;
      }
      if (extraData.length > 0) try {
        let extraDataJson = JSON.parse(extraData);
        extraDataJson.error !== void 0 && streamChoicesLogger.error(this.ctx, `Error in response: ${extraDataJson.error.message}`, extraDataJson.error);
      } catch {
        streamChoicesLogger.error(this.ctx, `Error parsing extraData: ${extraData}`);
      }
    }
    async *finishSolutions(currentFinishReason, model, usage) {
      for (let [index, solution] of Object.entries(this.solutions)) {
        let solutionIndex = Number(index);
        if (solution != null && (this.stats.markYielded(solutionIndex), telemetry(this.ctx, "completion.finishReason", this.telemetryData.extendedBy({
          completionChoiceFinishReason: currentFinishReason != null ? currentFinishReason : "DONE",
          engineName: model != null ? model : ""
        })), yield {
          solution: solution,
          finishOffset: void 0,
          reason: currentFinishReason != null ? currentFinishReason : "DONE",
          requestId: this.requestId,
          index: solutionIndex,
          model: model,
          usage: usage
        }, this.maybeCancel("after yielding on DONE"))) return;
      }
    }
    maybeCancel(description) {
      var _a;
      return (_a = this.cancellationToken) != null && _a.isCancellationRequested ? (streamChoicesLogger.debug(this.ctx, "Cancelled: " + description), this.cancel(), !0) : !1;
    }
    cancel() {
      this.body.destroy();
    }
    allSolutionsDone() {
      let solutions = Object.values(this.solutions);
      return solutions.length == this.expectedNumChoices && solutions.every(s => s == null);
    }
  };

,__name(_SSEProcessor, "SSEProcessor");

,var SSEProcessor = _SSEProcessor;

,function prepareSolutionForReturn(ctx, c, telemetryData) {
  let completionText = c.solution.text.join(""),
    blockFinished = !1;
  c.finishOffset !== void 0 && (streamChoicesLogger.debug(ctx, `solution ${c.index}: early finish at offset ${c.finishOffset}`), completionText = completionText.substring(0, c.finishOffset), blockFinished = !0), streamChoicesLogger.info(ctx, `solution ${c.index} returned. finish reason: [${c.reason}]`), streamChoicesLogger.debug(ctx, `solution ${c.index} details: finishOffset: [${c.finishOffset}] completionId: [{${c.requestId.completionId}}] created: [{${c.requestId.created}}]`);
  let jsonData = convertToAPIJsonData(c.solution);
  return convertToAPIChoice(ctx, completionText, jsonData, c.index, c.requestId, blockFinished, telemetryData);
},__name(prepareSolutionForReturn, "prepareSolutionForReturn");

,function convertToAPIJsonData(streamingData) {
  let joinedText = streamingData.text.join(""),
    toolCalls = extractToolCalls(streamingData),
    functionCall = extractFunctionCall(streamingData),
    annotations = streamingData.copilot_annotations.current,
    out = {
      text: joinedText,
      tokens: streamingData.text,
      tool_calls: toolCalls,
      function_call: functionCall,
      copilot_annotations: annotations
    };
  if (streamingData.logprobs.length === 0) return out;
  let flattenedLogprobs = streamingData.logprobs.reduce((acc, cur) => acc.concat(cur), []),
    flattenedTopLogprobs = streamingData.top_logprobs.reduce((acc, cur) => acc.concat(cur), []),
    flattenedOffsets = streamingData.text_offset.reduce((acc, cur) => acc.concat(cur), []),
    flattenedTokens = streamingData.tokens.reduce((acc, cur) => acc.concat(cur), []);
  return {
    ...out,
    logprobs: {
      token_logprobs: flattenedLogprobs,
      top_logprobs: flattenedTopLogprobs,
      text_offset: flattenedOffsets,
      tokens: flattenedTokens
    }
  };
},__name(convertToAPIJsonData, "convertToAPIJsonData");

,function isCopilotConfirmation(obj) {
  return typeof obj.title == "string" && typeof obj.message == "string" && !!obj.confirmation;
},__name(isCopilotConfirmation, "isCopilotConfirmation");

,function extractToolCalls(streamingData) {
  let toolCalls = [];
  for (let toolCall of streamingData.tool_calls) if (toolCall.name) {
    let args = toolCall.arguments.length > 0 ? JSON.parse(toolCall.arguments.join("")) : {};
    toolCalls.push({
      type: "function",
      function: {
        name: toolCall.name,
        arguments: args
      },
      approxNumTokens: toolCall.arguments.length + 1
    });
  }
  return toolCalls;
},__name(extractToolCalls, "extractToolCalls");

,function extractFunctionCall(streamingData) {
  if (streamingData.function_call.name) {
    let args = streamingData.function_call.arguments.length > 0 ? JSON.parse(streamingData.function_call.arguments.join("")) : {};
    return {
      name: streamingData.function_call.name,
      arguments: args
    };
  }
},__name(extractFunctionCall, "extractFunctionCall");

,var _ChunkStats = class _ChunkStats {
  constructor(expectedNumChoices) {
    this.choices = new Map();
    for (let i = 0; i < expectedNumChoices; i++) this.choices.set(i, new ChoiceStats());
  }
  add(choiceIndex) {
    this.choices.get(choiceIndex).increment();
  }
  markYielded(choiceIndex) {
    this.choices.get(choiceIndex).markYielded();
  }
  toString() {
    return Array.from(this.choices.entries()).map(([index, stats]) => `${index}: ${stats.yieldedTokens} -> ${stats.seenTokens}`).join(", ");
  }
};

,__name(_ChunkStats, "ChunkStats");

,var ChunkStats = _ChunkStats,
  _ChoiceStats = class _ChoiceStats {
    constructor() {
      this.yieldedTokens = -1;
      this.seenTokens = 0;
    }
    increment() {
      this.seenTokens++;
    }
    markYielded() {
      this.yieldedTokens = this.seenTokens;
    }
  };

,__name(_ChoiceStats, "ChoiceStats");

,var ChoiceStats = _ChoiceStats;