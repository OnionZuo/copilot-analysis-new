var import_console = require("console");

,var _ConversationPromptEngine = class _ConversationPromptEngine {
  constructor(ctx, promptStrategyFactory = new DefaultPromptStrategyFactory()) {
    this.ctx = ctx;
    this.promptStrategyFactory = promptStrategyFactory;
  }
  async toPrompt(turnContext, options) {
    var _a, _b;
    let promptStrategy = await this.promptStrategyFactory.createPromptStrategy(this.ctx, options.promptType, options.modelConfiguration.modelFamily),
      [elidableChatMessages, skillResolutions] = await promptStrategy.promptContent(turnContext, await this.safetyPrompt((_a = options.userSelectedModelName) != null ? _a : options.modelConfiguration.uiName), options),
      [chatMessages, tokens] = await this.elideChatMessages(elidableChatMessages, options.modelConfiguration);
    return await this.ctx.get(ConversationInspector).inspectPrompt({
      type: options.promptType,
      prompt: debugChatMessages(chatMessages),
      tokens: tokens
    }), this.ctx.get(ConversationDumper).addPrompt(turnContext.turn.id, debugChatMessages(chatMessages), options.promptType), {
      messages: chatMessages,
      tokens: tokens,
      skillResolutions: skillResolutions,
      toolConfig: (_b = promptStrategy.toolConfig) == null ? void 0 : _b.call(promptStrategy, options)
    };
  }
  async elideChatMessages(elidableChatMessages, modelConfiguration) {
    let elidableMessages = elidableChatMessages.filter(m => typeof m.content != "string");
    (0, Gqe.assert)(elidableMessages.length == 1, "Only one elidable message is supported right now.");
    let nonElidableTokens = this.computeNonElidableTokens(elidableChatMessages, modelConfiguration),
      tokenBudget = modelConfiguration.maxRequestTokens - nonElidableTokens,
      messages = elidableChatMessages.map(m => typeof m.content == "string" ? m : {
        role: m.role,
        content: processResultOfElidableText(m.content.makePrompt(tokenBudget))
      }).filter(m => m.content.length > 0);
    return [messages, countMessagesTokens(messages, modelConfiguration)];
  }
  computeNonElidableTokens(elidableChatMessages, modelConfiguration) {
    let nonElidableMessages = elidableChatMessages.filter(m => typeof m.content == "string");
    return nonElidableMessages.push({
      role: "user",
      content: ""
    }), countMessagesTokens(nonElidableMessages, modelConfiguration);
  }
  async safetyPrompt(modelName) {
    var _a;
    let authRecord = await this.ctx.get(AuthManager).getAuthRecord(),
      editorName = (_a = this.ctx.get(EditorAndPluginInfo).getEditorInfo().readableName) != null ? _a : this.ctx.get(EditorAndPluginInfo).getEditorInfo().name,
      osInfo = mapPlatformToOs(process.platform);
    return await chatBasePrompt(this.ctx, editorName, authRecord == null ? void 0 : authRecord.user, osInfo, modelName);
  }
};

,__name(_ConversationPromptEngine, "ConversationPromptEngine");

,var ConversationPromptEngine = _ConversationPromptEngine;

,function processResultOfElidableText(elidedText) {
  return elidedText.trimStart().replace(/^\[\.\.\.\]\n?/, "");
},__name(processResultOfElidableText, "processResultOfElidableText");

,function debugChatMessages(chatMessages) {
  return chatMessages.map(m => m.content).join(`

`);
},__name(debugChatMessages, "debugChatMessages");

,function mapPlatformToOs(platform) {
  switch (platform) {
    case "darwin":
      return "macOS";
    case "win32":
      return "Windows";
    case "linux":
      return "Linux";
    case "freebsd":
      return "FreeBSD";
    case "openbsd":
      return "OpenBSD";
    case "sunos":
      return "SunOS";
    case "aix":
      return "AIX";
    default:
      return;
  }
},__name(mapPlatformToOs, "mapPlatformToOs");