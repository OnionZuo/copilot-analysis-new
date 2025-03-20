var cachedSuffix = {
  text: "",
  tokens: []
};

,function resetSuffixCache() {
  cachedSuffix = {
    text: "",
    tokens: []
  };
},__name(resetSuffixCache, "resetSuffixCache");

,var DEFAULT_MAX_COMPLETION_LENGTH = 500,
  DEFAULT_MAX_PROMPT_LENGTH = 8192 - DEFAULT_MAX_COMPLETION_LENGTH,
  DEFAULT_NUM_SNIPPETS = 4,
  MAX_TOOLTIP_SIGNATURE_TOKENS = 150,
  DEFAULT_SUFFIX_MATCH_THRESHOLD = 10,
  DEFAULT_SUFFIX_PERCENT = 15,
  LineEndingOptions = (n => (LineEndingOptions.ConvertToUnix = "unix", LineEndingOptions.KeepOriginal = "keep", LineEndingOptions))(OY || {}),
  SuffixOption = (n => (SuffixOption.None = "none", SuffixOption.FifteenPercent = "fifteenPercent", SuffixOption))(BIe || {}),
  SuffixMatchOption = (n => (SuffixMatchOption.Equal = "equal", SuffixMatchOption.Levenshtein = "levenshteineditdistance", SuffixMatchOption))(vIe || {}),
  _PromptOptions = class _PromptOptions {
    constructor(options, languageId) {
      this.maxPromptLength = DEFAULT_MAX_PROMPT_LENGTH;
      this.lineEnding = "unix";
      this.tokenizerName = "cl100k_base";
      this.suffixPercent = 15;
      this.suffixMatchThreshold = DEFAULT_SUFFIX_MATCH_THRESHOLD;
      this.promptOrderListPreset = "default";
      this.promptPriorityPreset = "default";
      this.snippetTextProcessingPreset = "default";
      var _a, _b, _c, _d;
      if (Object.assign(this, options), this.suffixPercent < 0 || this.suffixPercent > 100) throw new Error(`suffixPercent must be between 0 and 100, but was ${this.suffixPercent}`);
      if (this.suffixMatchThreshold < 0 || this.suffixMatchThreshold > 100) throw new Error(`suffixMatchThreshold must be at between 0 and 100, but was ${this.suffixMatchThreshold}`);
      languageId === "cpp" ? ((_a = this.similarFilesOptions) != null || (this.similarFilesOptions = defaultCppSimilarFilesOptions), (_b = this.numberOfSnippets) != null || (this.numberOfSnippets = defaultCppSimilarFilesOptions.maxTopSnippets)) : ((_c = this.similarFilesOptions) != null || (this.similarFilesOptions = defaultSimilarFilesOptions), (_d = this.numberOfSnippets) != null || (this.numberOfSnippets = DEFAULT_NUM_SNIPPETS));
    }
  };
  
  ,__name(_PromptOptions, "PromptOptions");

,var PromptOptions = _PromptOptions,
  languageNormalizationMap = {
    javascriptreact: "javascript",
    jsx: "javascript",
    typescriptreact: "typescript",
    jade: "pug",
    cshtml: "razor",
    c: "cpp"
  };

,function normalizeLanguageId(languageId) {
  var _a;
  return languageId = languageId.toLowerCase(), (_a = languageNormalizationMap[languageId]) != null ? _a : languageId;
}

,__name(normalizeLanguageId, "normalizeLanguageId");

,async function getPrompt(doc, options = {}, snippets = []) {
  let completeOptions = new PromptOptions(options, doc.languageId),
    tokenizer = getTokenizer(completeOptions.tokenizerName),
    snippetTextProcessor = new SnippetTextProcessor(completeOptions.snippetTextProcessingPreset),
    promptOrderList = new PromptOrderList(completeOptions.promptOrderListPreset),
    promptPriorityList = new PromptPriorityList(completeOptions.promptPriorityPreset),
    {
      source: source,
      offset: offset
    } = doc;
  if (offset < 0 || offset > source.length) throw new Error(`Offset ${offset} is out of range.`);
  doc.languageId = normalizeLanguageId(doc.languageId);
  let promptWishlist = new PromptWishlist(tokenizer, completeOptions.lineEnding, promptOrderList, snippetTextProcessor, promptPriorityList),
    pathSnippet = snippets.find(s => s.provider === "path"),
    languageSnippet = snippets.find(s => s.provider === "language"),
    traitsSnippet = snippets.find(s => s.provider === "trait"),
    tooltipSignatureSnippet = snippets.find(s => s.provider === "tooltip-signature");
  pathSnippet !== void 0 && pathSnippet.snippet.length > 0 ? (
    promptWishlist.append(pathSnippet.snippet, "PathMarker"), languageSnippet && promptWishlist.extMarkUnused({
    text: languageSnippet.snippet,
    kind: "LanguageMarker",
    tokens: tokenizer.tokenLength(languageSnippet.snippet),
    id: NaN,
    score: NaN
  })) : languageSnippet && promptWishlist.append(languageSnippet.snippet, "LanguageMarker"), traitsSnippet != null && promptWishlist.append(traitsSnippet.snippet, "Traits"), snippets = snippets.filter(s => s.provider !== "language" && s.provider !== "path" && s.provider !== "tooltip-signature" && s.provider !== "trait");
  function addSnippetsNow() {
    processSnippetsForWishlist(snippets, doc.languageId, tokenizer, promptPriorityList, completeOptions.numberOfSnippets).forEach(snippet => {
      let kind = kindForSnippetProviderType(snippet.provider);
      promptWishlist.append(snippet.announcedSnippet, kind, snippet.tokens, snippet.score);
    });
  }
  __name(addSnippetsNow, "addSnippetsNow"), addSnippetsNow();
  let directContext = source.substring(0, offset);
  tooltipSignatureSnippet !== void 0 && tokenizer.tokenLength(tooltipSignatureSnippet.snippet) <= MAX_TOOLTIP_SIGNATURE_TOKENS ? (
    [directContext, tooltipSignatureSnippet] = transferLastLineToTooltipSignature(directContext, tooltipSignatureSnippet),
    promptWishlist.append(tooltipSignatureSnippet.snippet, "TooltipSignature")
  ) : tooltipSignatureSnippet !== void 0 && promptWishlist.extMarkUnused({
    text: tooltipSignatureSnippet.snippet,
    kind: "TooltipSignature",
    tokens: tokenizer.tokenLength(tooltipSignatureSnippet.snippet),
    id: NaN,
    score: NaN
  }),
  promptWishlist.append(directContext, "BeforeCursor");
  let suffixText = source.slice(offset),
    {
      promptInfo: promptInfo,
      newCachedSuffix: newCachedSuffix
    } = promptWishlist.fulfill(suffixText, completeOptions, cachedSuffix);
  return cachedSuffix = newCachedSuffix, promptInfo;
},__name(getPrompt, "getPrompt");