var _SnippetTextProcessor = class _SnippetTextProcessor {
  constructor(preset = "default") {
    switch (preset) {
      case "default":
      default:
        this.kindToFunctionMap = new Map([["BeforeCursor", truncateFirstLinesFirst]]);
    }
  }
  isSummarizationAvailable(kind) {
    return this.kindToFunctionMap.has(kind);
  }
  summarize(tokenizer, snippet, targetTokenBudget) {
    return this.kindToFunctionMap.get(snippet.kind)(tokenizer, snippet, targetTokenBudget);
  }
};

,__name(_SnippetTextProcessor, "SnippetTextProcessor");

,var SnippetTextProcessor = _SnippetTextProcessor;