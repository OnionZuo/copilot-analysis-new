var import_ts_dedent = fn(Wu());

,var _SkillDump = class _SkillDump {
  constructor() {
    this.resolvedSkills = {};
    this.resolutions = [];
  }
};

,__name(_SkillDump, "SkillDump");

,var SkillDump = _SkillDump,
  _ConversationDumper = class _ConversationDumper {
    constructor() {
      this.dump = new LRUCacheMap(25);
      this.promptsDump = new LRUCacheMap(1);
    }
    addResolvedSkill(turnId, skillId, resolvedSkill) {
      let dump = this.getDump(turnId);
      dump.resolvedSkills[skillId] = resolvedSkill;
    }
    getResolvedSkill(turnId, skillId) {
      return this.getDump(turnId).resolvedSkills[skillId];
    }
    addResolution(turnId, resolution) {
      this.getDump(turnId).resolutions.push(resolution);
    }
    getDump(turnId) {
      let dump = this.dump.get(turnId);
      return dump || (dump = new SkillDump(), this.dump.set(turnId, dump)), dump;
    }
    addPrompt(turnId, prompt, promptType) {
      let promptDump = this.promptsDump.get(turnId);
      promptDump === void 0 && (promptDump = new Map(), this.promptsDump.set(turnId, promptDump)), promptDump.set(promptType, prompt);
    }
    getLastTurnPrompts() {
      if (this.promptsDump === void 0) return;
      let promptsDumpIterator = this.promptsDump.values().next();
      if (!promptsDumpIterator.done) return promptsDumpIterator.value;
    }
  };

,__name(_ConversationDumper, "ConversationDumper");

,var ConversationDumper = _ConversationDumper;

,function filterConversationTurns(conversation) {
  let conversationCopy = conversation.copy();
  return conversationCopy.turns = conversationCopy.turns.filter(turn => {
    var _a;
    return turn.status !== "in-progress" && (turn.response === void 0 || ((_a = turn.response) == null ? void 0 : _a.type) === "model");
  }), conversationCopy;
},__name(filterConversationTurns, "filterConversationTurns");

,function getLastTurnId(conversation) {
  var _a;
  return (_a = filterConversationTurns(conversation).getLastTurn()) == null ? void 0 : _a.id;
},__name(getLastTurnId, "getLastTurnId");

,async function getConversationDump(turnContext) {
  let filteredConversation = filterConversationTurns(turnContext.conversation),
    lastTurnId = getLastTurnId(turnContext.conversation);
  if (!lastTurnId) return "Nothing to dump because no request has been sent to the model yet.";
  let dump = turnContext.ctx.get(ConversationDumper).getDump(lastTurnId),
    yml = toSimulationFormat(dump, filteredConversation.turns);
  logger.debug(turnContext.ctx, `conversation.dump
`, `
` + yml);
  let files = await fileDump(dump, turnContext.ctx);
  return rk.dedent`
        ${getInfoDumpMessage(turnContext.conversation, lastTurnId)}
        ${getEditorInfoDumpMessage(turnContext.ctx)}

        The following code can be copied into a chat simulation \`yml\` file. This response has not polluted the conversation history and did not cause any model roundtrip.
        \`\`\`yaml
        ${yml}
        \`\`\`${files ? `
${files}` : ""}
        `;
},__name(getConversationDump, "getConversationDump");

,function getEditorInfoDumpMessage(ctx) {
  let info = ctx.get(EditorAndPluginInfo);
  return rk.dedent`
        - IDE: \`${info.getEditorInfo().name} (${info.getEditorInfo().version})\`
        - Plugin: \`${info.getEditorPluginInfo().version}\`
    `;
},__name(getEditorInfoDumpMessage, "getEditorInfoDumpMessage");

,function getInfoDumpMessage(conversation, lastTurnId) {
  return rk.dedent`
        Debug information for the last turn of the conversation.

        - ConversationId: \`${conversation.id}\`
        - MessageId: \`${lastTurnId}\`
    `;
},__name(getInfoDumpMessage, "getInfoDumpMessage");

,async function getSkillsDump(turnContext, cancellationToken, skillId) {
  let skillRegistry = turnContext.ctx.get(ConversationSkillRegistry),
    resp = "# Available skills",
    supportedSkills = skillRegistry.getDescriptors().filter(s => turnContext.ctx.get(Conversations).getSupportedSkills(turnContext.conversation.id).includes(s.id));
  if (skillId && (supportedSkills = supportedSkills.filter(s => s.id === skillId)), supportedSkills.length === 0) return `No skill with id ${skillId} available`;
  for (let skill of supportedSkills) resp += `
- ${skill.id}`;
  turnContext.turn.request.message && turnContext.turn.request.message.trim().length > 0 && (resp += `

**User message**: ${turnContext.turn.request.message}`);
  for (let skill of supportedSkills) {
    resp += `
## ${skill.id}`, resp += rk.dedent`
            \n\n
            **Description**
            
            ${skill.description()}`;
    let skillProperties = skillRegistry.getSkill(skill.id),
      skillResolution = await (skillProperties == null ? void 0 : skillProperties.resolver(turnContext).resolveSkill(turnContext));
    if (skillResolution) {
      resp += rk.dedent`
                \n\n
                **Resolution**
                
                \`\`\`yaml
                ${dump(skillResolution)}
                \`\`\``;
      let processedSkill = await (skillProperties == null ? void 0 : skillProperties.processor(turnContext).processSkill(skillResolution, turnContext));
      if (processedSkill) {
        let processedSkillValue = typeof processedSkill == "string" ? processedSkill : processedSkill.makePrompt(1e3);
        resp += rk.dedent`
                    \n\n
                    **Processed value**
                    
                    ${processedSkillValue}`;
      } else resp += `

**Unprocessable**`;
    } else resp += `

**Unresolvable**`;
  }
  return resp;
},__name(getSkillsDump, "getSkillsDump");

,function toSimulationFormat(dump, turns) {
  let ymlDump = {
    state: {
      skills: dump.resolvedSkills
    },
    turns: turns.map((t, index) => {
      let turn = {
        request: t.request.message
      };
      return t.response && (turn.response = t.response.message), turn;
    })
  };
  return dump(ymlDump);
},__name(toSimulationFormat, "toSimulationFormat");

,async function fileDump(dump, ctx) {
  let files = dump.resolutions.map(resolution => resolution.files).flat(),
    uniqueFiles = files.filter((file, index) => file && files.indexOf(file) === index),
    fileDump;
  for (let file of uniqueFiles) if (file && file.status === "included") {
    fileDump || (fileDump = `The following files have been used:
`);
    let document = await ctx.get(TextDocumentManager).getTextDocument(file),
      text = document == null ? void 0 : document.getText();
    logger.debug(ctx, `conversation.dump.file
`, text), fileDump += `
**${file.uri}**

\`\`\`${document == null ? void 0 : document.languageId}
${text}
\`\`\``;
  }
  return fileDump;
},__name(fileDump, "fileDump");