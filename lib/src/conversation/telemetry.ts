async function createTelemetryWithExpWithId(ctx, messageId, conversationId, filtersInfo) {
  let telemetryWithId = TelemetryData.createAndMarkAsIssued({
    messageId: messageId,
    conversationId: conversationId
  });
  return await ctx.get(Features).updateExPValuesAndAssignments(filtersInfo, telemetryWithId);
},__name(createTelemetryWithExpWithId, "createTelemetryWithExpWithId");

,function extendUserMessageTelemetryData(conversation, uiKind, messageCharLen, promptTokenLen, suggestion, suggestionId, baseTelemetryWithExp, skillResolutions) {
  let skillIds = conversation.turns[conversation.turns.length - 1].skills.map(skill => skill.skillId).sort(),
    properties = {
      source: "user",
      turnIndex: (conversation.turns.length - 1).toString(),
      uiKind: uiKind,
      skillIds: skillIds.join(",")
    },
    measurements = {
      promptTokenLen: promptTokenLen,
      messageCharLen: messageCharLen
    };
  return suggestion && (properties.suggestion = suggestion), suggestionId && (properties.suggestionId = suggestionId), skillResolutions.length > 0 && (properties.skillResolutionsJson = JSON.stringify(mapSkillResolutionsForTelemetry(skillResolutions))), baseTelemetryWithExp = baseTelemetryWithExp.extendedBy(properties, measurements), baseTelemetryWithExp;
},__name(extendUserMessageTelemetryData, "extendUserMessageTelemetryData");

,function mapSkillResolutionsForTelemetry(skillResolutions) {
  return skillResolutions.map(resolution => {
    var _a, _b, _c, _d;
    return {
      skillId: resolution.skillId,
      resolution: resolution.resolution,
      fileStatus: (_a = resolution.files) == null ? void 0 : _a.map(file => file.status),
      tokensPreEliding: (_b = resolution.tokensPreEliding) != null ? _b : 0,
      resolutionTimeMs: (_c = resolution.resolutionTimeMs) != null ? _c : 0,
      processingTimeMs: (_d = resolution.processingTimeMs) != null ? _d : 0
    };
  });
},__name(mapSkillResolutionsForTelemetry, "mapSkillResolutionsForTelemetry");

,function createUserMessageTelemetryData(ctx, uiKind, messageText, offTopic, requestId, doc, baseTelemetryWithExp) {
  return offTopic != null && (baseTelemetryWithExp = baseTelemetryWithExp.extendedBy({
    offTopic: offTopic.toString()
  })), telemetryMessage(ctx, doc, uiKind, messageText, {
    uiKind: uiKind,
    headerRequestId: requestId
  }, {}, baseTelemetryWithExp).properties.messageId;
},__name(createUserMessageTelemetryData, "createUserMessageTelemetryData");

,function createModelMessageTelemetryData(ctx, conversation, uiKind, appliedText, responseNumTokens, requestId, doc, baseTelemetryWithExp) {
  let codeBlockLanguages = getCodeBlocks(appliedText);
  return telemetryMessage(ctx, doc, uiKind, appliedText, {
    source: "model",
    turnIndex: (conversation.turns.length - 1).toString(),
    headerRequestId: requestId,
    uiKind: uiKind,
    codeBlockLanguages: JSON.stringify({
      ...codeBlockLanguages
    })
  }, {
    messageCharLen: appliedText.length,
    numCodeBlocks: codeBlockLanguages.length,
    numTokens: responseNumTokens
  }, baseTelemetryWithExp).properties.messageId;
},__name(createModelMessageTelemetryData, "createModelMessageTelemetryData");

,function createOffTopicMessageTelemetryData(ctx, conversation, uiKind, appliedText, userMessageId, doc, baseTelemetryWithExp) {
  telemetryMessage(ctx, doc, uiKind, appliedText, {
    source: "offTopic",
    turnIndex: conversation.turns.length.toString(),
    userMessageId: userMessageId,
    uiKind: uiKind
  }, {
    messageCharLen: appliedText.length
  }, baseTelemetryWithExp);
},__name(createOffTopicMessageTelemetryData, "createOffTopicMessageTelemetryData");

,function telemetryMessage(ctx, document, uiKind, messageText, properties, measurements, baseTelemetry) {
  let telemetryData = baseTelemetry != null ? baseTelemetry : TelemetryData.createAndMarkAsIssued(),
    restrictedProperties = {
      messageText: messageText,
      ...properties
    };
  if (!("messageId" in properties) && !("messageId" in telemetryData.properties)) {
    let messageId = v4_default();
    properties.messageId = messageId, restrictedProperties.messageId = messageId;
  }
  document && (properties.languageId = document.languageId, measurements.documentLength = document.getText().length, measurements.documentLineCount = document.lineCount);
  let standardTelemetryData = telemetryData.extendedBy(properties, measurements),
    restrictedTelemetryData = telemetryData.extendedBy(restrictedProperties),
    prefix = telemetryPrefixForUiKind(uiKind);
  return telemetry(ctx, `${prefix}.message`, standardTelemetryData), telemetry(ctx, `${prefix}.messageText`, restrictedTelemetryData, 1), standardTelemetryData;
},__name(telemetryMessage, "telemetryMessage");

,function createSuggestionShownTelemetryData(ctx, uiKind, baseTelemetryWithExp, doc) {
  telemetryUserAction(ctx, doc, {
    uiKind: uiKind
  }, {}, "conversation.suggestionShown", baseTelemetryWithExp);
},__name(createSuggestionShownTelemetryData, "createSuggestionShownTelemetryData");

,function telemetryUserAction(ctx, document, properties, measurements, name, baseTelemetry) {
  let telemetryData = baseTelemetry != null ? baseTelemetry : TelemetryData.createAndMarkAsIssued();
  document && (properties.languageId = document.languageId, measurements.documentLength = document.getText().length, measurements.documentLineCount = document.lineCount);
  let standardTelemetryData = telemetryData.extendedBy(properties, measurements);
  return telemetry(ctx, name, standardTelemetryData), standardTelemetryData;
},__name(telemetryUserAction, "telemetryUserAction");

,function logEngineMessages(ctx, messages, telemetryData) {
  let telemetryDataWithPrompt = telemetryData.extendedBy({
    messagesJson: JSON.stringify(messages)
  });
  return telemetry(ctx, "engine.messages", telemetryDataWithPrompt, 1);
},__name(logEngineMessages, "logEngineMessages");

,function telemetryPrefixForUiKind(uiKind) {
  switch (uiKind) {
    case "editsPanel":
      return "copilotEditsPanel";
    case "conversationInline":
      return "inlineConversation";
    case "conversationPanel":
    default:
      return "conversation";
  }
},__name(telemetryPrefixForUiKind, "telemetryPrefixForUiKind");

,function getCodeBlocks(text) {
  let textLines = text.split(`
`),
    codeBlockLanguages = [],
    languageStack = [];
  for (let i = 0; i < textLines.length; i++) {
    let line = textLines[i];
    line.startsWith("```") && (languageStack.length > 0 && line === "```" ? codeBlockLanguages.push(languageStack.pop()) : languageStack.length === 0 && languageStack.push(line.substring(3)));
  }
  return codeBlockLanguages;
},__name(getCodeBlocks, "getCodeBlocks");

,function uiKindToIntent(uiKind) {
  return uiKind == "conversationInline" ? "conversation-inline" : "conversation-panel";
},__name(uiKindToIntent, "uiKindToIntent");