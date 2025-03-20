var import_ts_dedent = fn(Wu());

,var _MetaPromptStrategy = class _MetaPromptStrategy {
  elidableContent(conversation) {
    let history = fromHistory(conversation.turns.slice(0, -1)),
      elidablePromptInputs = [];
    return history !== null && elidablePromptInputs.push([history, .6]), new ElidableText(elidablePromptInputs);
  }
  suffix(options) {
    if (options.promptType !== "meta") throw new Error("Invalid prompt options for strategy");
    if (!options.supportedSkillDescriptors) throw new Error("Supported skills must be provided for meta prompts");
    return this.buildMetaPrompt(options.supportedSkillDescriptors);
  }
  buildMetaPrompt(availableSkills) {
    return MAe.dedent`
            Your task is to provide a helpful answer to the user's question.
            To help you create that answer, you can resolve skills that give you more context.
            Each skill has a description and some example user questions to help you understand when the skill may be useful. 
            
            List of available skills:
            ${availableSkills.map(c => `${this.skillToPrompt(c)}
`).join(`
`)}
        `.trim();
  }
  createFunctionArgumentSchema(supportedSkills) {
    let skillIdsEnum = StringEnum(supportedSkills.map(s => s.id));
    return Type.Object({
      skillIds: Type.Array(skillIdsEnum, {
        description: "The skill ids to resolve ranked from most to least useful"
      })
    });
  }
  toolConfig(promptOptions) {
    if (promptOptions.promptType !== "meta") throw new Error("Invalid prompt options for strategy");
    return {
      tool_choice: {
        type: "function",
        function: {
          name: "resolveSkills"
        }
      },
      tools: [{
        type: "function",
        function: {
          name: "resolveSkills",
          description: "Resolves the skills by id to help answer the user question.",
          parameters: this.createFunctionArgumentSchema(promptOptions.supportedSkillDescriptors)
        }
      }],
      extractArguments(toolCall) {
        return {
          skillIds: toolCall.function.arguments.skillIds
        };
      }
    };
  }
  skillToPrompt(skillDescriptor) {
    let description = skillDescriptor.description ? skillDescriptor.description() : skillDescriptor.id,
      prompt = `Skill Id: ${skillDescriptor.id}
Skill Description: ${description}`,
      examples = skillDescriptor.examples ? skillDescriptor.examples() : [];
    return examples.length > 0 && (prompt += `
Skill Examples:
${examples.map(e => `  - ${e}`).join(`
`)}`), prompt;
  }
  async promptContent(turnContext, safetyPrompt, promptOptions) {
    let userInput = turnContext.conversation.getLastTurn().request.message,
      elidableContent = this.elidableContent(turnContext.conversation);
    return [[{
      role: "system",
      content: safetyPrompt
    }, {
      role: "user",
      content: elidableContent
    }, {
      role: "system",
      content: this.suffix(promptOptions)
    }, {
      role: "user",
      content: MAe.dedent`
                    This is the user's question: 
                    ${userInput.trim()} 
                `.trim()
    }], []];
  }
};

,__name(_MetaPromptStrategy, "MetaPromptStrategy");

,var MetaPromptStrategy = _MetaPromptStrategy;