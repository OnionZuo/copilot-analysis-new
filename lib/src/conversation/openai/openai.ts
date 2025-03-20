var StringEnum = __name((values, options) => Type.Unsafe({
    type: "string",
    enum: values,
    description: options == null ? void 0 : options.description
  }), "StringEnum"),
  ChatConfirmationResponseSchema = Type.Optional(Type.Object({
    agentSlug: Type.String(),
    state: Type.Union([Type.Literal("accepted"), Type.Literal("dismissed")]),
    confirmation: Type.Any()
  }));

,function convertToChatCompletion(ctx, message, jsonData, choiceIndex, requestId, blockFinished, finishReason, telemetryData) {
  let chatMessageWithToolCalls = JSON.parse(JSON.stringify(message));
  return jsonData.tool_calls && (chatMessageWithToolCalls.tool_calls = jsonData.tool_calls), logEngineMessages(ctx, [chatMessageWithToolCalls], telemetryData), {
    message: message,
    choiceIndex: choiceIndex,
    requestId: requestId,
    blockFinished: blockFinished,
    finishReason: finishReason,
    tokens: jsonData.tokens,
    numTokens: jsonData.tokens.length,
    tool_calls: jsonData.tool_calls,
    function_call: jsonData.function_call,
    telemetryData: telemetryData
  };
},__name(convertToChatCompletion, "convertToChatCompletion");