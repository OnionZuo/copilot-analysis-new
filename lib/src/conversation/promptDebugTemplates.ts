var import_ts_dedent = fn(Wu());

,var FilteredMessage = "Oops, your response got filtered. Vote down if you think this shouldn't have happened",
  UpgradeMessage = "You've reached your monthly chat messages limit. Upgrade to Copilot Pro (30-day free trial) or wait for your limit to reset.",
  _DebugFailPromptTemplate = class _DebugFailPromptTemplate {
    constructor() {
      this.id = "debug.fail";
      this.description = "Fail for debugging purposes";
      this.shortDescription = "Fail";
      this.scopes = ["chat-panel"];
    }
    response(_turnContext, userMessage) {
      throw new Error(userMessage.length > 0 ? userMessage : "Debug Fail");
    }
  };

,__name(_DebugFailPromptTemplate, "DebugFailPromptTemplate");

,var DebugFailPromptTemplate = _DebugFailPromptTemplate,
  DebugFailTemplate = new DebugFailPromptTemplate(),
  _DebugUpgradePromptTemplate = class _DebugUpgradePromptTemplate {
    constructor() {
      this.id = "debug.upgrade";
      this.description = "upgrade for debugging purposes";
      this.shortDescription = "upgrade";
      this.scopes = ["chat-panel"];
    }
    async response(_turnContext, userMessage) {
      return new PromptTemplateResponse(UpgradeMessage, {
        message: "",
        code: 402,
        responseIsIncomplete: !0,
        responseIsFiltered: !1
      });
    }
  };

,__name(_DebugUpgradePromptTemplate, "DebugUpgradePromptTemplate");

,var DebugUpgradePromptTemplate = _DebugUpgradePromptTemplate,
  DebugUpgradeTemplate = new DebugUpgradePromptTemplate(),
  _DebugNotificationPromptTemplate = class _DebugNotificationPromptTemplate {
    constructor() {
      this.id = "debug.notify";
      this.description = "Notify for debugging purposes";
      this.shortDescription = "Notify";
      this.scopes = ["chat-panel", "inline"];
    }
    async response(_turnContext, userMessage) {
      let severity = "warning";
      userMessage.includes("info") && (severity = "info");
      let message = userMessage.replace("info", "").replace("warning", "").trim(),
        notifications = [{
          severity: severity,
          message: message.length > 0 ? message : "Debug Notification"
        }];
      return new PromptTemplateResponse("Alright, I'm producing a notification", void 0, [], notifications);
    }
  };

,__name(_DebugNotificationPromptTemplate, "DebugNotificationPromptTemplate");

,var DebugNotificationPromptTemplate = _DebugNotificationPromptTemplate,
  DebugWarnTemplate = new DebugNotificationPromptTemplate(),
  _DebugFilterPromptTemplate = class _DebugFilterPromptTemplate {
    constructor() {
      this.id = "debug.filter";
      this.description = "Make the RAI filter kick in";
      this.shortDescription = "RAI Filter";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext, userMessage) {
      return turnContext.turn.status = "filtered", new PromptTemplateResponse(FilteredMessage, {
        message: "",
        responseIsFiltered: !0,
        responseIsIncomplete: !1
      });
    }
  };

,__name(_DebugFilterPromptTemplate, "DebugFilterPromptTemplate");

,var DebugFilterPromptTemplate = _DebugFilterPromptTemplate,
  DebugFilterTemplate = new DebugFilterPromptTemplate(),
  _DebugDumpPromptTemplate = class _DebugDumpPromptTemplate {
    constructor() {
      this.id = "debug.dump";
      this.description = "Dump the conversation";
      this.shortDescription = "Dump";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext) {
      return new PromptTemplateResponse(await getConversationDump(turnContext));
    }
  };

,__name(_DebugDumpPromptTemplate, "DebugDumpPromptTemplate");

,var DebugDumpPromptTemplate = _DebugDumpPromptTemplate,
  DebugDumpTemplate = new DebugDumpPromptTemplate(),
  _DebugChristmasTreePromptTemplate = class _DebugChristmasTreePromptTemplate {
    constructor() {
      this.id = "debug.tree";
      this.description = "Jingle bells, jingle bells, jingle all the way";
      this.shortDescription = "Christmas Tree";
      this.scopes = ["chat-panel"];
    }
    async requiredSkills(ctx) {
      return [ProjectLabelsSkillId, CurrentEditorSkillId];
    }
    instructions(ctx, userMessage) {
      return "Create a function that prints a christmas tree";
    }
  };

,__name(_DebugChristmasTreePromptTemplate, "DebugChristmasTreePromptTemplate");

,var DebugChristmasTreePromptTemplate = _DebugChristmasTreePromptTemplate,
  DebugChristmasTreeTemplate = new DebugChristmasTreePromptTemplate(),
  _DebugEchoPromptTemplate = class _DebugEchoPromptTemplate {
    constructor() {
      this.id = "debug.echo";
      this.description = "Echo the user message back to the user";
      this.shortDescription = "Echo";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext) {
      return new PromptTemplateResponse(turnContext.turn.request.message);
    }
  };

,__name(_DebugEchoPromptTemplate, "DebugEchoPromptTemplate");

,var DebugEchoPromptTemplate = _DebugEchoPromptTemplate,
  DebugEchoTemplate = new DebugEchoPromptTemplate(),
  _DebugPromptPromptTemplate = class _DebugPromptPromptTemplate {
    constructor() {
      this.id = "debug.prompt";
      this.description = "Show the prompt for the last response or generate a new one";
      this.shortDescription = "Prompt";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext, _userMessage) {
      let promptsMap = turnContext.ctx.get(ConversationDumper).getLastTurnPrompts();
      if (promptsMap !== void 0 && promptsMap.size > 0) {
        let promptDebugString = "Here are the prompts used in the last turn:";
        return promptsMap.forEach((value, key) => {
          promptDebugString += ije.dedent`

                        ### ${key} prompt
                        
                        \`\`\`\`
                        ${value}
                        \`\`\`\`
                    `;
        }), new PromptTemplateResponse(promptDebugString);
      }
      return new PromptTemplateResponse("No prompt available");
    }
  };

,__name(_DebugPromptPromptTemplate, "DebugPromptPromptTemplate");

,var DebugPromptPromptTemplate = _DebugPromptPromptTemplate,
  DebugPromptTemplate = new DebugPromptPromptTemplate(),
  _DebugSkillsPromptTemplate = class _DebugSkillsPromptTemplate {
    constructor() {
      this.id = "debug.skills";
      this.description = "Resolves and displays all available skills or a single skill (id) if provided";
      this.shortDescription = "Skills";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext, userMessage, cancellationToken) {
      let skillId, strippedMessage;
      if (userMessage.length > 0) {
        let split = userMessage.split(" ");
        skillId = split[0], strippedMessage = split.slice(1).join(" ");
      }
      return turnContext.turn.request.message = strippedMessage != null ? strippedMessage : "", new PromptTemplateResponse(await getSkillsDump(turnContext, cancellationToken, skillId));
    }
  };

,__name(_DebugSkillsPromptTemplate, "DebugSkillsPromptTemplate");

,var DebugSkillsPromptTemplate = _DebugSkillsPromptTemplate,
  DebugSkillsTemplate = new DebugSkillsPromptTemplate(),
  _DebugVulnerabilityPromptTemplate = class _DebugVulnerabilityPromptTemplate {
    constructor() {
      this.id = "debug.vulnerability";
      this.description = "Create a message with a vulnerability annotation";
      this.shortDescription = "Vulnerability";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext, userMessage) {
      let {
        reply: reply,
        vulnerabilities: vulnerabilities
      } = parseVulnerabilitiesInstructions(userMessage);
      for (let i = 0; i < vulnerabilities; i++) turnContext.turn.annotations.push(DebugCodeVulnerability);
      return new PromptTemplateResponse(reply, void 0, turnContext.turn.annotations);
    }
  };

,__name(_DebugVulnerabilityPromptTemplate, "DebugVulnerabilityPromptTemplate");

,var DebugVulnerabilityPromptTemplate = _DebugVulnerabilityPromptTemplate,
  DebugVulnerabilityTemplate = new DebugVulnerabilityPromptTemplate(),
  _DebugCodeCitationPromptTemplate = class _DebugCodeCitationPromptTemplate {
    constructor() {
      this.id = "debug.citation";
      this.description = "Create a message with a code citation annotation";
      this.shortDescription = "CodeCitation";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext, userMessage) {
      return turnContext.turn.annotations.push(DebugCodeCitation), new PromptTemplateResponse(DebugCodeCitationDefaultReply, void 0, turnContext.turn.annotations);
    }
  };

,__name(_DebugCodeCitationPromptTemplate, "DebugCodeCitationPromptTemplate");

,var DebugCodeCitationPromptTemplate = _DebugCodeCitationPromptTemplate,
  DebugCodeCitationTemplate = new DebugCodeCitationPromptTemplate(),
  _DebugMarkdownRenderingPromptTemplate = class _DebugMarkdownRenderingPromptTemplate {
    constructor() {
      this.id = "debug.markdown";
      this.description = "Markdown rendering specification by example";
      this.shortDescription = "Markdown";
      this.scopes = ["chat-panel", "inline"];
    }
    async response(turnContext, userMessage) {
      return new PromptTemplateResponse(exampleMarkdown);
    }
  };

,__name(_DebugMarkdownRenderingPromptTemplate, "DebugMarkdownRenderingPromptTemplate");

,var DebugMarkdownRenderingPromptTemplate = _DebugMarkdownRenderingPromptTemplate,
  DebugMarkdownRenderingTemplate = new DebugMarkdownRenderingPromptTemplate(),
  _DebugLongPromptTemplate = class _DebugLongPromptTemplate {
    constructor() {
      this.id = "debug.long";
      this.description = "Generate a long response";
      this.shortDescription = "Long";
      this.scopes = ["chat-panel"];
    }
    instructions(ctx, userMessage) {
      return "Write out the OWASP top 10 with code examples in java";
    }
  };

,__name(_DebugLongPromptTemplate, "DebugLongPromptTemplate");

,var DebugLongPromptTemplate = _DebugLongPromptTemplate,
  DebugLongTemplate = new DebugLongPromptTemplate(),
  _DebugProjectContextPromptTemplate = class _DebugProjectContextPromptTemplate {
    constructor() {
      this.id = "debug.project";
      this.description = "Generate a response using the project context skill";
      this.shortDescription = "Project";
      this.scopes = ["chat-panel", "inline"];
    }
    async requiredSkills(ctx) {
      return [ProjectContextSkillId];
    }
  };

,__name(_DebugProjectContextPromptTemplate, "DebugProjectContextPromptTemplate");

,var DebugProjectContextPromptTemplate = _DebugProjectContextPromptTemplate,
  DebugProjectContextTemplate = new DebugProjectContextPromptTemplate(),
  _DebugConfirmationPromptTemplate = class _DebugConfirmationPromptTemplate {
    constructor() {
      this.id = "debug.confirmation";
      this.description = "Generate a response with a confirmation";
      this.shortDescription = "Confirmation";
      this.scopes = ["chat-panel", "inline"];
    }
    async response() {
      let confirmation = {
        type: "action",
        title: "Confirmation that you want to proceed",
        message: "Do you want to proceed?",
        agentSlug: "debug.confirmation",
        confirmation: {
          answer: "yes"
        }
      };
      return new PromptTemplateResponse("Alright, I'm producing a notification", void 0, [], [], [], confirmation);
    }
  };

,__name(_DebugConfirmationPromptTemplate, "DebugConfirmationPromptTemplate");

,var DebugConfirmationPromptTemplate = _DebugConfirmationPromptTemplate,
  DebugConfirmationTemplate = new DebugConfirmationPromptTemplate();

,function getDebugTemplates() {
  return [DebugFailTemplate, DebugUpgradeTemplate, DebugWarnTemplate, DebugFilterTemplate, DebugChristmasTreeTemplate, DebugDumpTemplate, DebugEchoTemplate, DebugPromptTemplate, DebugSkillsTemplate, DebugVulnerabilityTemplate, DebugCodeCitationTemplate, DebugConfirmationTemplate, DebugMarkdownRenderingTemplate, DebugLongTemplate, DebugProjectContextTemplate];
},__name(getDebugTemplates, "getDebugTemplates");