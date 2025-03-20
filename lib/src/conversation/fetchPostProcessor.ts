var _ChatFetchResultPostProcessor = class _ChatFetchResultPostProcessor {
  constructor(turnContext, chatFetcher, computeSuggestions) {
    this.turnContext = turnContext;
    this.chatFetcher = chatFetcher;
    this.computeSuggestions = computeSuggestions;
  }
  async postProcess(fetchResult, token, appliedText, baseTelemetryWithExp, augmentedTelemetryWithExp, messageText, uiKind, doc) {
    var _a;
    switch (createUserMessageTelemetryData(this.turnContext.ctx, uiKind, messageText, fetchResult.type == "offTopic", fetchResult.requestId, doc, augmentedTelemetryWithExp.extendedBy({}, {
      fileCount: this.turnContext.ctx.get(ChunkingProvider).workspaceCount
    })), await this.turnContext.ctx.get(ConversationInspector).inspectFetchResult(fetchResult), fetchResult.type) {
      case "success":
        return await this.processSuccessfulFetchResult(appliedText, fetchResult.numTokens, fetchResult.requestId, token, uiKind, baseTelemetryWithExp, augmentedTelemetryWithExp, doc);
      case "offTopic":
        return await this.processOffTopicFetchResult(augmentedTelemetryWithExp, uiKind, doc);
      case "canceled":
        return this.turnContext.turn.status = "cancelled", this.turnContext.turn.response = {
          message: "Cancelled",
          type: "user"
        }, {
          error: this.turnContext.turn.response
        };
      case "failed":
        return this.turnContext.turn.status = "error", this.turnContext.turn.response = {
          message: fetchResult.reason,
          type: "server"
        }, {
          error: {
            message: CapiErrorTranslator.translateErrorMessage(fetchResult.code, fetchResult.reason),
            code: fetchResult.code
          }
        };
      case "filtered":
        return this.turnContext.turn.status = "filtered", {
          error: {
            message: "Oops, your response got filtered. Vote down if you think this shouldn't have happened.",
            responseIsFiltered: !0
          }
        };
      case "length":
        return this.turnContext.turn.status = "error", {
          error: {
            message: "Oops, the response got too long. Try to reformulate your question.",
            responseIsIncomplete: !0
          }
        };
      case "agentAuthRequired":
        return this.turnContext.turn.status = "error", this.turnContext.turn.response = {
          message: "Authorization required",
          type: "server"
        }, {
          error: {
            message: "Authorization required",
            responseIsFiltered: !1
          }
        };
      case "no_choices":
        return this.turnContext.turn.status = "error", this.turnContext.turn.response = {
          message: "No choices returned",
          type: "server"
        }, {
          error: {
            message: "Oops, no choices received from the server. Please try again.",
            responseIsFiltered: !1,
            responseIsIncomplete: !0
          }
        };
      case "no_finish_reason":
        return this.turnContext.turn.status = "error", appliedText && appliedText.length > 0 ? this.turnContext.turn.response = {
          message: appliedText,
          type: "model",
          references: (_a = this.turnContext.turn.response) == null ? void 0 : _a.references
        } : this.turnContext.turn.response = {
          message: "No finish reason",
          type: "server"
        }, {
          error: {
            message: "Oops, unexpected end of stream. Please try again.",
            responseIsFiltered: !1,
            responseIsIncomplete: !0
          }
        };
      case "model_not_supported":
        return this.turnContext.turn.status = "error", this.turnContext.turn.response = {
          message: "Model not supported",
          type: "server"
        }, {
          error: {
            message: "Oops, the model is not supported. Please try again.",
            code: 400,
            reason: "model_not_supported",
            responseIsFiltered: !1
          }
        };
      case "successMultiple":
      case "tool_calls":
      case "unknown":
        return this.turnContext.turn.status = "error", {
          error: {
            message: "Unknown server side error occurred. Please try again.",
            responseIsFiltered: !1
          }
        };
    }
  }
  async processSuccessfulFetchResult(appliedText, responseNumTokens, requestId, cancelationToken, uiKind, baseTelemetryWithExp, augmentedTelemetryWithExp, doc) {
    var _a;
    if (appliedText && appliedText.length > 0) {
      baseTelemetryWithExp.markAsDisplayed(), augmentedTelemetryWithExp.markAsDisplayed(), this.turnContext.turn.status = "success", this.turnContext.turn.response = {
        message: appliedText,
        type: "model",
        references: (_a = this.turnContext.turn.response) == null ? void 0 : _a.references
      }, createModelMessageTelemetryData(this.turnContext.ctx, this.turnContext.conversation, uiKind, appliedText, responseNumTokens, requestId, doc, augmentedTelemetryWithExp);
      let suggestions = this.computeSuggestions ? await this.fetchSuggestions(cancelationToken, uiKind, baseTelemetryWithExp, doc) : void 0;
      if (suggestions) {
        let {
          followUp: followUp,
          suggestedTitle: suggestedTitle
        } = suggestions;
        return {
          followup: followUp.message !== "" ? followUp : void 0,
          suggestedTitle: suggestedTitle !== "" ? suggestedTitle : void 0
        };
      }
      return {};
    }
    return this.turnContext.turn.status = "error", this.turnContext.turn.response = {
      message: "The model returned successful but did not contain any response text.",
      type: "meta"
    }, {
      error: this.turnContext.turn.response
    };
  }
  async fetchSuggestions(cancelationToken, uiKind, baseTelemetryWithExp, doc) {
    let suggestionsFetchResult = await new TurnSuggestions(this.turnContext.ctx, this.chatFetcher).fetchRawSuggestions(this.turnContext, cancelationToken, uiKind, baseTelemetryWithExp);
    if (suggestionsFetchResult === void 0) return;
    let enrichedFollowup = this.enrichFollowup(suggestionsFetchResult, uiKind, baseTelemetryWithExp, doc);
    return conversationLogger.debug(this.turnContext.ctx, "Computed followup", enrichedFollowup), conversationLogger.debug(this.turnContext.ctx, "Computed suggested title", suggestionsFetchResult.suggestedTitle), {
      followUp: enrichedFollowup,
      suggestedTitle: suggestionsFetchResult.suggestedTitle
    };
  }
  enrichFollowup(suggestionsFetchResult, uiKind, baseTelemetryWithExp, doc) {
    let extendedTelemetry = baseTelemetryWithExp.extendedBy({
      messageSource: "chat.suggestions",
      suggestionId: v4_default(),
      suggestion: "Follow-up from model"
    }, {
      promptTokenLen: suggestionsFetchResult.promptTokenLen,
      numTokens: suggestionsFetchResult.numTokens
    });
    return createSuggestionShownTelemetryData(this.turnContext.ctx, uiKind, extendedTelemetry, doc), {
      message: suggestionsFetchResult.followUp,
      id: extendedTelemetry.properties.suggestionId,
      type: extendedTelemetry.properties.suggestion
    };
  }
  async processOffTopicFetchResult(baseTelemetryWithExp, uiKind, doc) {
    let offTopicMessage = "Sorry, but I can only assist with programming related questions.";
    return this.turnContext.turn.response = {
      message: offTopicMessage,
      type: "offtopic-detection"
    }, this.turnContext.turn.status = "off-topic", createOffTopicMessageTelemetryData(this.turnContext.ctx, this.turnContext.conversation, uiKind, offTopicMessage, baseTelemetryWithExp.properties.messageId, doc, baseTelemetryWithExp), {
      error: {
        message: offTopicMessage,
        responseIsFiltered: !0
      }
    };
  }
};

,__name(_ChatFetchResultPostProcessor, "ChatFetchResultPostProcessor");

,var ChatFetchResultPostProcessor = _ChatFetchResultPostProcessor;