var tools = [{
    type: "function",
    function: {
      name: "queryWithKeywords",
      description: "Searches the workspace for synonyms and relevant keywords related to the original user query. These keywords could be used as file names, symbol names, abbreviations, or comments in the relevant code.",
      parameters: Type.Object({
        keywords: Type.Array(Type.Object({
          keyword: Type.String({
            description: "A keyword or phrase relevant to the original user query that a user could search to answer their question. Keywords are not generic and do not repeat."
          }),
          variations: Type.Array(Type.String(), {
            description: "An array of relevant variations of the keyword. Variations include synonyms and plural forms. Variations are not generic and do not repeat."
          })
        }))
      })
    }
  }],
  _UserQuerySynonymsPromptStrategy = class _UserQuerySynonymsPromptStrategy extends AbstractUserPromptStrategy {
    suffix() {
      return `
You are a coding assistant that helps developers find relevant code in their workspace by providing a list of relevant keywords they can search for.
The user will provide you with potentially relevant information from the workspace. This information may be incomplete.

# Additional Rules

Think step by step:
1. Read the user's question to understand what they are asking about their workspace.
2. If there are pronouns in the question, such as 'it', 'that', 'this', try to understand what they refer to by looking at the rest of the question and the conversation history.
3. Output a list of up to 8 relevant keywords that the user could search to answer their question. These keywords could be used as file names, symbol names, abbreviations, or comments in the relevant code. Put the keywords most relevant to the question first. Do not include overly generic keywords. Do not repeat keywords.
4. For each keyword in the list of relevant keywords, output a list of relevant variations of the keyword if applicable. Consider synonyms and plural forms. Do not include overly generic variations. Do not repeat variations.

# Example

User: Where is the code for base64 encoding?

Response:

queryWithKeywords([
    { "keyword": "base64 encoding", "variations": ["base64 encoder", "base64 encode"] },
    { "keyword": "base64", "variations": ["base 64"] },
    { "keyword": "encode", "variations": ["encoding", "encoded", "encoder", "encoders"] }
]);
`.trim();
    }
    async promptContent(turnContext, safetyPrompt, promptOptions) {
      if (promptOptions.promptType !== "synonyms") throw new Error("Invalid prompt options for user query strategy");
      let userInput = turnContext.conversation.getLastTurn().request.message;
      return [[{
        role: "system",
        content: safetyPrompt
      }, {
        role: "system",
        content: this.suffix()
      }, {
        role: "user",
        content: userInput.toLowerCase()
      }], []];
    }
    toolConfig(promptOptions) {
      if (promptOptions.promptType !== "synonyms") throw new Error("Invalid prompt options for user query strategy");
      return {
        tools: tools,
        tool_choice: {
          type: "function",
          function: {
            name: "queryWithKeywords"
          }
        },
        extractArguments(toolCall) {
          var _a;
          let args = toolCall.function.arguments.keywords;
          if (!args || !Array.isArray(args)) return {
            keywords: []
          };
          let keywordsSet = new Set();
          for (let arg of args) if (!(!hasKey(arg, "keyword") || !arg.keyword || typeof arg.keyword != "string") && (keywordsSet.add(arg.keyword.toLowerCase()), !(!hasKey(arg, "variations") || !arg.variations || !Array.isArray(arg.variations)))) for (let variation of arg.variations) typeof variation == "string" && keywordsSet.add(variation.toLowerCase());
          return {
            keywords: (_a = Array.from(keywordsSet)) != null ? _a : []
          };
        }
      };
    }
  };

,__name(_UserQuerySynonymsPromptStrategy, "UserQuerySynonymsPromptStrategy");

,var UserQuerySynonymsPromptStrategy = _UserQuerySynonymsPromptStrategy;