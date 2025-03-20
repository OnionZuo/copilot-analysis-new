var import_ts_dedent = fn(Wu());

,var _PromptTemplateResponse = class _PromptTemplateResponse {
  constructor(message, error, annotations = [], notifications = [], references = [], confirmationRequest) {
    this.message = message;
    this.error = error;
    this.annotations = annotations;
    this.notifications = notifications;
    this.references = references;
    this.confirmationRequest = confirmationRequest;
  }
};

,__name(_PromptTemplateResponse, "PromptTemplateResponse");

,var PromptTemplateResponse = _PromptTemplateResponse,
  _StaticPromptTemplate = class _StaticPromptTemplate {
    constructor(id, description, shortDescription, prompt, skills = [], scopes = [], inlinePrompt, producesCodeEdits = !1) {
      this.id = id;
      this.description = description;
      this.shortDescription = shortDescription;
      this.prompt = prompt;
      this.skills = skills;
      this.scopes = scopes;
      this.inlinePrompt = inlinePrompt;
      this.producesCodeEdits = producesCodeEdits;
    }
    instructions(ctx, userMessage, source = "panel") {
      var _a;
      let prompt;
      return source === "inline" ? prompt = (_a = this.inlinePrompt) != null ? _a : this.prompt : prompt = this.prompt, prompt + `
` + userMessage;
    }
    async requiredSkills(ctx) {
      return this.skills;
    }
  };

,__name(_StaticPromptTemplate, "StaticPromptTemplate");

,var StaticPromptTemplate = _StaticPromptTemplate,
  GenerateTestsTemplate = new StaticPromptTemplate("tests", "Generate unit tests", "Generate Tests", bp.dedent`
        Write a set of unit tests for the code above, or for the selected code if provided.
        Provide tests for the functionality of the code and not the implementation details.
        The tests should test the happy path as well as the edge cases.
        Choose self explanatory names for the tests that describe the tested behavior. Do not start the test names with "test".
        Think about the different scenarios that could happen and test them.
        Do reply with the tests only and do not explain them further.
        Do reply with new or modified tests only and not with the complete test class or suite.
        Follow the same test style as in existing tests if they exist.
        You must not create inline comments like "Arrange, Act, Assert", unless existing tests use inline comments as well.
        If existing tests use any mocking or stubbing libraries, use the same libraries before writing your own test doubles.
        `, [TestContextSkillId, TestFailuresSkillId], ["chat-panel", "editor"]),
  SimplifyTemplate = new StaticPromptTemplate("simplify", "Simplify the code", "Simplify This", bp.dedent`
        Provide a simplified version of the selected code above.
        Do not change the behavior of the code. 
        The code should still be readable and easy to understand. 
        Do not reply with the original code but only a simplified version. 
        Do only reply with one code snippet that contains the complete simplified code and explain what you have simplified after.`, [], ["editor", "chat-panel", "inline"], bp.dedent`
        Provide a simplified version of the selected code.
        Modify the selected code to make it simpler and easier to understand.
        Do not change the behavior of the code. 
        Removing empty lines is not a simplification.
        You must not omit any code that is necessary for the code to compile and run, for example by replacing lines with ... or similar.
        Do not reply with the original code but only a simplified version.`, !0),
  FixTemplate = new StaticPromptTemplate("fix", "Fix problems and compile errors", "Fix This", bp.dedent`
        Fix the provided errors and problems. 
        Do not invent new problems.
        The fixed code should still be readable and easy to understand.
        If there are no problems provided do reply that you can't detect any problems and the user should describe more precisely what they want to be fixed. 
        Group problems if they are related and can be fixed by the same change. 
        Present a group as a single problem with a simple description that does not repeat the single problems but explains the whole group of problems in a few words.
        Explain each group of problems without repeating the detailed error message. 
        Show how the error can be fixed by providing a code snippet that displays the code before and after it has been fixed after each group. 
        Shorten fully qualified class names to the simple class name and full file paths to the file names only.
        When enumerating the groups, start with the word "Problem" followed by the number and a quick summary of the problem. Format this headline bold.
        At last provide a completely fixed version of the code if the fixes required multiple code changes.`, [ProblemsInActiveDocumentSkillId], ["editor", "chat-panel", "inline"], bp.dedent`
        Fix the provided errors and problems. 
        Do not invent new problems.
        The fixed code should still be readable and easy to understand.
        If there are no problems provided do reply that you can't detect any problems and the user should describe more precisely what they want to be fixed.
        Do not attempt to fix problems that are not provided, like unbalanced brackets or parentheses that are not causing errors.
        Briefly explain the problems without repeating the detailed error message.`, !0),
  ExplainTemplate = new StaticPromptTemplate("explain", "Explain how the code works", "Explain This", bp.dedent`
        Write an explanation for the selected code above as paragraphs of text. 
        Include excerpts of code snippets to underline your explanation. 
        Do not repeat the complete code.
        The explanation should be easy to understand for a developer who is familiar with the programming language used but not familiar with the code.`, [], ["editor", "chat-panel", "inline"], bp.dedent`
        Write an explanation for the code the user is selecting.
        Include excerpts of code snippets to underline your explanation. 
        Do not repeat the complete code.
        Keep the explanation brief and easy to understand for a developer who is familiar with the programming language used but not familiar with the code.`, !1),
  DocTemplate = new StaticPromptTemplate("doc", "Document the current selection of code", "Generate Docs", bp.dedent`
        Write documentation for the selected code.
        The reply should be a codeblock containing the original selection with the documentation added as comments.
        Use the most appropriate documentation style for the programming language used (e.g. JSDoc for JavaScript, docstrings for Python etc.)`, [], ["editor", "chat-panel", "inline"], bp.dedent`
        Add documentation to the selected code.
        Modify the selected code by adding documentation as comments.
        You must only modify the selected code and nothing else.
        Use the most appropriate documentation style for the programming language used (e.g. JSDoc for JavaScript, docstrings for Python etc.).
        Place the comments before functions and methods, unless the language has a different convention (for example Python's docstring).`, !0),
  _FeedbackPromptTemplate = class _FeedbackPromptTemplate {
    constructor() {
      this.id = "feedback";
      this.description = "Steps to provide feedback";
      this.shortDescription = "Feedback";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext) {
      let turnId = getLastTurnId(turnContext.conversation),
        response = bp.dedent`
            You can provide direct feedback by pressing the thumbs up/down buttons on a single message. 
            In case you want to share more details, please click [here](https://gh.io/copilot-chat-jb-feedback) to share your feedback.
            `;
      return turnId ? new PromptTemplateResponse(response + `

In order to help us understand your feedback better, you can include the following identifier in your feedback: by doing so, you are granting us permission to access the telemetry data associated with your feedback.
\`\`\`yaml
${turnContext.conversation.id}/${turnId}
\`\`\``) : new PromptTemplateResponse(response);
    }
  };

,__name(_FeedbackPromptTemplate, "FeedbackPromptTemplate");

,var FeedbackPromptTemplate = _FeedbackPromptTemplate,
  FeedbackTemplate = new FeedbackPromptTemplate(),
  _HelpPromptTemplate = class _HelpPromptTemplate {
    constructor() {
      this.id = "help";
      this.description = "Get help on how to use Copilot chat";
      this.shortDescription = "Help";
      this.scopes = ["chat-panel"];
    }
    async response(turnContext) {
      let templates = getUserFacingPromptTemplates(turnContext.ctx).filter(t => t != this),
        response = bp.dedent`
            You can ask me general programming questions, or use one of the following commands to get help with a specific task:

            ${templates.map(t => `- \`/${t.id}\` - ${t.description}`).join(`
`)}

            To have a great conversation, ask me questions as if I was a real programmer:
            
            - **Show me the code** you want to talk about by having the files open and selecting the most important lines.
            - On top of files, **I take different parts of your IDE into consideration** when answering questions. This includes, but is not limited to, test results and failures, build and runtime logs, active Git repository as well as details of the open project.
            - **Make refinements** by asking me follow-up questions, adding clarifications, providing errors, etc.
            - **Review my suggested code** and tell me about issues or improvements, so I can iterate on it.
        `;
      return new PromptTemplateResponse(response);
    }
  };

,__name(_HelpPromptTemplate, "HelpPromptTemplate");

,var HelpPromptTemplate = _HelpPromptTemplate,
  HelpTemplate = new HelpPromptTemplate();

,function getPromptTemplates() {
  return [GenerateTestsTemplate, SimplifyTemplate, FixTemplate, ExplainTemplate, DocTemplate, FeedbackTemplate, HelpTemplate, ...getDebugTemplates()];
},__name(getPromptTemplates, "getPromptTemplates");

,function getUserFacingPromptTemplates(ctx) {
  let templates = getPromptTemplates();
  return !isDebugEnabled(ctx) && !isRunningInTest(ctx) && (templates = templates.filter(t => !t.id.startsWith("debug."))), templates;
},__name(getUserFacingPromptTemplates, "getUserFacingPromptTemplates");