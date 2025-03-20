var import_ts_dedent = fn(Wu());

,var _AbstractUserPromptStrategy = class _AbstractUserPromptStrategy {
  async elidableContent(turnContext, promptOptions) {
    let elidablePromptInputs = [],
      history = fromHistory(turnContext.conversation.turns.slice(0, -1));
    history !== null && elidablePromptInputs.push([history, .6]);
    let [skills, skillResolutions] = await this.elidableSkills(turnContext, promptOptions);
    return skills !== null && (history !== null && elidablePromptInputs.push(["", .1]), elidablePromptInputs.push([skills, .8])), [new ElidableText(elidablePromptInputs), skillResolutions];
  }
  async elidableSkills(turnContext, promptOptions) {
    return await fromSkills(turnContext, promptOptions);
  }
  async promptContent(turnContext, safetyPrompt, promptOptions) {
    let userInput = turnContext.conversation.getLastTurn().request.message,
      [elidableContent, skillResolutions] = await this.elidableContent(turnContext, promptOptions);
    return [[{
      role: "system",
      content: safetyPrompt
    }, {
      role: "user",
      content: elidableContent
    }, {
      role: "system",
      content: this.suffix(turnContext)
    }, {
      role: "user",
      content: userInput
    }], skillResolutions];
  }
};

,__name(_AbstractUserPromptStrategy, "AbstractUserPromptStrategy");

,var AbstractUserPromptStrategy = _AbstractUserPromptStrategy,
  _PanelUserPromptStrategy = class _PanelUserPromptStrategy extends AbstractUserPromptStrategy {
    suffix(turnContext) {
      return $qe.dedent` 
            Use the above information, including the additional context and conversation history (if available) to answer the user's question below.
            Prioritize the context given in the user's question.
            When generating code, think step-by-step. Briefly explain the code and then output it in a single code block.
            When fixing problems and errors, provide a brief description first.
            When generating classes, use a separate code block for each class.
            Keep your answers short and impersonal.
            Use Markdown formatting in your answers.
            Escape special Markdown characters (like *, ~, -, _, etc.) with a backslash or backticks when using them in your answers.
            You must enclose file names and paths in single backticks. Never use single or double quotes for file names or paths.
            Make sure to include the programming language name at the start of every code block.
            Avoid wrapping the whole response in triple backticks.
            Only use triple backticks codeblocks for code.
            Do not repeat the user's code excerpt when answering.
            Do not prefix your answer with "GitHub Copilot".
            Do not start your answer with a programming language name.
            Do not include follow up questions or suggestions for next turns.
            Respond in the following locale: ${turnContext.conversation.userLanguage}.
        `.trim();
    }
  };

,__name(_PanelUserPromptStrategy, "PanelUserPromptStrategy");

,var PanelUserPromptStrategy = _PanelUserPromptStrategy;