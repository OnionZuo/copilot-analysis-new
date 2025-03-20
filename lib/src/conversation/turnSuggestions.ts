var _TurnSuggestions = class _TurnSuggestions {
  constructor(ctx, chatFetcher) {
    this.ctx = ctx;
    this.chatFetcher = chatFetcher;
  }
  async fetchRawSuggestions(turnContext, token, uiKind, baseTelemetryWithExp) {
    let modelConfiguration = await this.ctx.get(ModelConfigurationProvider).getBestChatModelConfig(getSupportedModelFamiliesForPrompt("suggestions"), {
        tool_calls: !0
      }),
      promptOptions = {
        promptType: "suggestions",
        modelConfiguration: modelConfiguration
      },
      prompt = await this.ctx.get(ConversationPromptEngine).toPrompt(turnContext, promptOptions),
      extendedTelemetry = baseTelemetryWithExp.extendedBy({
        messageSource: "chat.suggestions"
      }, {
        promptTokenLen: prompt.tokens
      }),
      params = {
        modelConfiguration: modelConfiguration,
        messages: prompt.messages,
        uiKind: uiKind
      };
    if (prompt.toolConfig === void 0) throw new Error("No tool call configuration found in suggestions prompt.");
    params.tool_choice = prompt.toolConfig.tool_choice, params.tools = prompt.toolConfig.tools;
    let response = await this.chatFetcher.fetchResponse(params, token, extendedTelemetry);
    if (response.type !== "success" && (conversationLogger.error(this.ctx, "Failed to fetch suggestions, trying again..."), response = await this.chatFetcher.fetchResponse(params, token, extendedTelemetry)), response.type === "success") {
      if (!response.toolCalls || response.toolCalls.length === 0) {
        conversationLogger.error(this.ctx, "Missing tool call in suggestions response");
        return;
      }
      let firstToolCall = response.toolCalls[0],
        {
          followUp: followUp,
          suggestedTitle: suggestedTitle
        } = prompt.toolConfig.extractArguments(firstToolCall);
      if (!followUp || !suggestedTitle) {
        conversationLogger.error(this.ctx, "Missing follow-up or suggested title in suggestions response");
        return;
      }
      return {
        followUp: followUp.trim(),
        suggestedTitle: suggestedTitle.trim(),
        promptTokenLen: prompt.tokens,
        numTokens: response.numTokens + firstToolCall.approxNumTokens
      };
    } else if (response.type === "successMultiple") {
      conversationLogger.error(this.ctx, "successMultiple response is unexpected for suggestions");
      return;
    } else if (response.type === "tool_calls") {
      conversationLogger.error(this.ctx, "tool_calls response is unexpected for suggestions");
      return;
    } else {
      conversationLogger.error(this.ctx, `Failed to fetch suggestions due to reason: ${response.reason}`);
      return;
    }
  }
};

,__name(_TurnSuggestions, "TurnSuggestions");

,var TurnSuggestions = _TurnSuggestions;