var _TraitProvider = class _TraitProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "trait";
  }
  async buildSnippets(context) {
    if (context.traits.length === 0) return [];
    let {
      currentFile: currentFile
    } = context;
    return currentFile.languageId = normalizeLanguageId(currentFile.languageId), [{
      provider: this.type,
      semantics: "snippet",
      snippet: commentBlockAsSingles(`Consider this related information:
` + context.traits.map(trait => trait.kind === "string" ? newLineEnded(trait.value) : newLineEnded(`${trait.name}: ${trait.value}`)).join(""), currentFile.languageId),
      relativePath: currentFile.relativePath,
      startLine: 0,
      endLine: 0,
      score: 0
    }];
  }
};

,__name(_TraitProvider, "TraitProvider");

,var TraitProvider = _TraitProvider;