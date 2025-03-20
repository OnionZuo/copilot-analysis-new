var _LanguageSnippetProvider = class _LanguageSnippetProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "language";
  }
  async buildSnippets(context) {
    let {
      currentFile: currentFile
    } = context;
    return currentFile.languageId = normalizeLanguageId(currentFile.languageId), [{
      provider: this.type,
      semantics: "snippet",
      snippet: newLineEnded(getLanguageMarker(currentFile)),
      relativePath: currentFile.relativePath,
      startLine: 0,
      endLine: 0,
      score: 0
    }];
  }
};

,__name(_LanguageSnippetProvider, "LanguageSnippetProvider");

,var LanguageSnippetProvider = _LanguageSnippetProvider;