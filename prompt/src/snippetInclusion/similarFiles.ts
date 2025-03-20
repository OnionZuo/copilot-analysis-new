var DEFAULT_SNIPPET_THRESHOLD = 0,
  DEFAULT_SNIPPET_WINDOW_SIZE = 60,
  DEFAULT_MAX_TOP_SNIPPETS = 4,
  DEFAULT_MAX_SNIPPETS_PER_FILE = 1,
  DEFAULT_MAX_NUMBER_OF_FILES = 20,
  DEFAULT_MAX_CHARACTERS_PER_FILE = 1e4,
  defaultSimilarFilesOptions = {
    snippetLength: DEFAULT_SNIPPET_WINDOW_SIZE,
    threshold: DEFAULT_SNIPPET_THRESHOLD,
    maxTopSnippets: DEFAULT_MAX_TOP_SNIPPETS,
    maxCharPerFile: DEFAULT_MAX_CHARACTERS_PER_FILE,
    maxNumberOfFiles: DEFAULT_MAX_NUMBER_OF_FILES,
    maxSnippetsPerFile: DEFAULT_MAX_SNIPPETS_PER_FILE,
    useSubsetMatching: !1
  };

,var defaultCppSimilarFilesOptions = {
  snippetLength: 60,
  threshold: 0,
  maxTopSnippets: 16,
  maxCharPerFile: 1e5,
  maxNumberOfFiles: 200,
  maxSnippetsPerFile: 4
};

,function getMatcher(doc, selection) {
  return (selection.useSubsetMatching ? BlockTokenSubsetMatcher.FACTORY(selection.snippetLength) : FixedWindowSizeJaccardMatcher.FACTORY(selection.snippetLength)).to(doc);
},__name(getMatcher, "getMatcher");

,async function getSimilarSnippets(doc, similarFiles, options) {
  let matcher = getMatcher(doc, options);
  return options.maxTopSnippets === 0 ? [] : (await similarFiles.filter(similarFile => similarFile.source.length < options.maxCharPerFile && similarFile.source.length > 0).slice(0, options.maxNumberOfFiles).reduce(async (acc, similarFile) => (await acc).concat((await matcher.findMatches(similarFile, options.maxSnippetsPerFile)).map(snippet => ({
    relativePath: similarFile.relativePath,
    ...snippet
  }))), Promise.resolve([]))).filter(similarFile => similarFile.score && similarFile.snippet && similarFile.score > options.threshold).sort((a, b) => a.score - b.score).slice(-options.maxTopSnippets);
},__name(getSimilarSnippets, "getSimilarSnippets");