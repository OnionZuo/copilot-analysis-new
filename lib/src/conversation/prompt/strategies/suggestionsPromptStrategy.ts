var import_ts_dedent = fn(Wu());

,var _SuggestionsPromptStrategy = class _SuggestionsPromptStrategy {
  toolConfig() {
    return {
      tool_choice: {
        type: "function",
        function: {
          name: "showSuggestions"
        }
      },
      tools: [{
        type: "function",
        function: {
          name: "showSuggestions",
          description: "Show the computed suggestions to the user",
          parameters: Type.Object({
            suggestedTitle: Type.String({
              description: "The suggested title for the conversation"
            }),
            followUp: Type.String({
              description: "The suggested follow-up question for the conversation"
            })
          })
        }
      }],
      extractArguments(toolCall) {
        return {
          suggestedTitle: toolCall.function.arguments.suggestedTitle,
          followUp: toolCall.function.arguments.followUp
        };
      }
    };
  }
  suffix(turnContext) {
    return jqe.dedent`
            Your task is to come up with two suggestions:

            1) Suggest a title for the current conversation based on the history of the conversation so far.
                - The title must be a short phrase that captures the essence of the conversation.
                - The title must be relevant to the conversation context.
                - The title must not be offensive or inappropriate.
                - The title must be in the following locale: ${turnContext.conversation.userLanguage}.

            2) Write a short one-sentence question that the user can ask as a follow up to continue the current conversation.
                - The question must be phrased as a question asked by the user, not by Copilot.
                - The question must be relevant to the conversation context.
                - The question must not be offensive or inappropriate.
                - The question must not appear in the conversation history.
                - The question must not have already been answered.
                - The question must be in the following locale: ${turnContext.conversation.userLanguage}.
        `.trim();
  }
  async elidableContent(conversation) {
    let history = fromHistory(conversation.turns.slice()),
      elidablePromptInputs = [];
    return history !== null && elidablePromptInputs.push([history, .6]), new ElidableText(elidablePromptInputs);
  }
  async promptContent(turnContext, safetyPrompt, promptOptions) {
    return [[{
      role: "system",
      content: safetyPrompt
    }, {
      role: "user",
      content: await this.elidableContent(turnContext.conversation)
    }, {
      role: "system",
      content: this.suffix(turnContext)
    }], []];
  }
};

,__name(_SuggestionsPromptStrategy, "SuggestionsPromptStrategy");

,var SuggestionsPromptStrategy = _SuggestionsPromptStrategy;