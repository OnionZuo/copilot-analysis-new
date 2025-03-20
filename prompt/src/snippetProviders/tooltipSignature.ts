var _TooltipSignatureSnippetProvider = class _TooltipSignatureSnippetProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "tooltip-signature";
  }
  async buildSnippets(context) {
    let {
        currentFile: currentFile,
        tooltipSignature: tooltipSignature
      } = context,
      snippets = [];
    return currentFile.languageId = normalizeLanguageId(currentFile.languageId), tooltipSignature && endsWithAttributesOrMethod(currentFile) && snippets.push({
      provider: this.type,
      semantics: "snippet",
      snippet: newLineEnded(announceTooltipSignatureSnippet(tooltipSignature, currentFile.languageId)),
      relativePath: currentFile.relativePath,
      startLine: 0,
      endLine: 0,
      score: 0
    }), snippets;
  }
};
,__name(_TooltipSignatureSnippetProvider, "TooltipSignatureSnippetProvider");
,var TooltipSignatureSnippetProvider = _TooltipSignatureSnippetProvider;