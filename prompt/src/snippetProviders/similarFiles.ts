var _SimilarFilesProvider = class _SimilarFilesProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "similar-files";
  }
  async buildSnippets(context) {
    let {
      currentFile: currentFile,
      similarFiles: similarFiles,
      options: options
    } = context;
    return options && similarFiles && similarFiles.length ? await this.api.getSimilarSnippets(currentFile, similarFiles, options.similarFilesOptions) : [];
  }
};

,__name(_SimilarFilesProvider, "SimilarFilesProvider");

,var SimilarFilesProvider = _SimilarFilesProvider;