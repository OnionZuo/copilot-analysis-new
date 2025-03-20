var _PathSnippetProvider = class _PathSnippetProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "path";
  }
  async buildSnippets(context) {
    let {
      currentFile: currentFile
    } = context;
    return currentFile.languageId = normalizeLanguageId(currentFile.languageId), [{
      provider: this.type,
      semantics: "snippet",
      snippet: newLineEnded(getPathMarker(currentFile)),
      relativePath: currentFile.relativePath,
      startLine: 0,
      endLine: 0,
      score: 0
    }];
  }
};

,__name(_PathSnippetProvider, "PathSnippetProvider");

,var PathSnippetProvider = _PathSnippetProvider;