var _CodeSnippetProvider = class _CodeSnippetProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "code";
  }
  async buildSnippets(context) {
    var _a;
    if (context.codeSnippets === void 0 || context.codeSnippets.length === 0) return [];
    let {
        codeSnippets: codeSnippets
      } = context,
      snippetsByUri = new Map();
    for (let snippetWithRelativePath of codeSnippets) {
      let uri = (_a = snippetWithRelativePath.relativePath) != null ? _a : snippetWithRelativePath.snippet.uri,
        snippets = snippetsByUri.get(uri);
      snippets === void 0 && (snippets = [], snippetsByUri.set(uri, snippets)), snippets.push(snippetWithRelativePath);
    }
    let result = [];
    return snippetsByUri.forEach((snippets, uri) => {
      let value = snippets.map(snippet => snippet.snippet.value).join(`---`);
      result.push({
        provider: this.type,
        semantics: snippets.length > 1 ? "snippets" : "snippet",
        snippet: newLineEnded(value),
        relativePath: uri,
        startLine: 0,
        endLine: 0,
        score: Math.max(...snippets.map(s => {
          var _a;
          return (_a = s.snippet.importance) != null ? _a : 0;
        }))
      });
    }), result;
  }
};

,__name(_CodeSnippetProvider, "CodeSnippetProvider");

,var CodeSnippetProvider = _CodeSnippetProvider;