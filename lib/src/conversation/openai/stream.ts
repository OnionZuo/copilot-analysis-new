var streamChoicesLogger = new Logger("streamMessages");

,function prepareChatCompletionForReturn(ctx, c, telemetryData) {
  var _a;
  let messageContent = c.solution.text.join(""),
    blockFinished = !1;
  c.finishOffset !== void 0 && (streamChoicesLogger.debug(ctx, `message ${c.index}: early finish at offset ${c.finishOffset}`), messageContent = messageContent.substring(0, c.finishOffset), blockFinished = !0), streamChoicesLogger.info(ctx, `message ${c.index} returned. finish reason: [${c.reason}]`), streamChoicesLogger.debug(ctx, `message ${c.index} details: finishOffset: [${c.finishOffset}] completionId: [{${c.requestId.completionId}}] created: [{${c.requestId.created}}]`);
  let jsonData = convertToAPIJsonData(c.solution),
    message = {
      role: "assistant",
      content: messageContent
    };
  return convertToChatCompletion(ctx, message, jsonData, c.index, c.requestId, blockFinished, (_a = c.reason) != null ? _a : "", telemetryData);
},__name(prepareChatCompletionForReturn, "prepareChatCompletionForReturn");