var _FifoCache = class _FifoCache {
  constructor(size) {
    this.keys = [];
    this.cache = {};
    this.size = size;
  }
  put(key, value) {
    var _a;
    if (this.cache[key] = value, this.keys.length > this.size) {
      this.keys.push(key);
      let leavingKey = (_a = this.keys.shift()) != null ? _a : "";
      delete this.cache[leavingKey];
    }
  }
  get(key) {
    return this.cache[key];
  }
};

,__name(_FifoCache, "FifoCache");

,var FifoCache = _FifoCache;

,var _Tokenizer = class _Tokenizer {
  constructor(doc) {
    var _a;
    this.stopsForLanguage = (_a = SPECIFIC_STOPS.get(doc.languageId)) != null ? _a : GENERIC_STOPS;
  }
  tokenize(a) {
    return new Set(splitIntoWords(a).filter(x => !this.stopsForLanguage.has(x)));
  }
};

,__name(_Tokenizer, "Tokenizer");

,var Tokenizer = _Tokenizer,
  WINDOWED_TOKEN_SET_CACHE = new FifoCache(20),
  _WindowedMatcher = class _WindowedMatcher {
    constructor(referenceDoc) {
      this.referenceDoc = referenceDoc, this.tokenizer = new Tokenizer(referenceDoc);
    }
    get referenceTokens() {
      return this.createReferenceTokens();
    }
    async createReferenceTokens() {
      var _a;
      return (_a = this.referenceTokensCache) != null ? _a : this.referenceTokensCache = this.tokenizer.tokenize(this._getCursorContextInfo(this.referenceDoc).context);
    }
    sortScoredSnippets(snippets, sortOption = "descending") {
      return sortOption == "ascending" ? snippets.sort((snippetA, snippetB) => snippetA.score > snippetB.score ? 1 : -1) : sortOption == "descending" ? snippets.sort((snippetA, snippetB) => snippetA.score > snippetB.score ? -1 : 1) : snippets;
    }
    async retrieveAllSnippets(objectDoc, sortOption = "descending") {
      var _a;
      let snippets = [];
      if (objectDoc.source.length === 0 || (await this.referenceTokens).size === 0) return snippets;
      let lines = objectDoc.source.split(`
`),
        key = this.id() + ":" + objectDoc.source,
        tokensInWindows = (_a = WINDOWED_TOKEN_SET_CACHE.get(key)) != null ? _a : [],
        needToComputeTokens = tokensInWindows.length == 0,
        tokenizedLines = needToComputeTokens ? lines.map(l => this.tokenizer.tokenize(l), this.tokenizer) : [];
      for (let [index, [startLine, endLine]] of this.getWindowsDelineations(lines).entries()) {
        if (needToComputeTokens) {
          let tokensInWindow = new Set();
          tokenizedLines.slice(startLine, endLine).forEach(x => x.forEach(s => tokensInWindow.add(s), tokensInWindow)), tokensInWindows.push(tokensInWindow);
        }
        let tokensInWindow = tokensInWindows[index],
          score = this.similarityScore(tokensInWindow, await this.referenceTokens);
        if (snippets.length && startLine > 0 && snippets[snippets.length - 1].endLine > startLine) {
          snippets[snippets.length - 1].score < score && (snippets[snippets.length - 1].score = score, snippets[snippets.length - 1].startLine = startLine, snippets[snippets.length - 1].endLine = endLine);
          continue;
        }
        snippets.push({
          score: score,
          startLine: startLine,
          endLine: endLine
        });
      }
      return needToComputeTokens && WINDOWED_TOKEN_SET_CACHE.put(key, tokensInWindows), this.sortScoredSnippets(snippets, sortOption);
    }
    findMatches(objectDoc, maxSnippetsPerFile) {
      return this.findBestMatch(objectDoc, maxSnippetsPerFile);
    }
    async findBestMatch(objectDoc, maxSnippetsPerFile) {
      if (objectDoc.source.length === 0 || (await this.referenceTokens).size === 0) return [];
      let lines = objectDoc.source.split(`
`),
        snippets = await this.retrieveAllSnippets(objectDoc, "descending");
      if (snippets.length === 0) return [];
      let bestSnippets = [];
      for (let i = 0; i < snippets.length && i < maxSnippetsPerFile; i++) if (snippets[i].score !== 0) {
        let snippetCode = lines.slice(snippets[i].startLine, snippets[i].endLine).join(`
`);
        bestSnippets.push({
          snippet: snippetCode,
          semantics: "snippet",
          provider: "similar-files",
          ...snippets[i]
        });
      }
      return bestSnippets;
    }
  };

,__name(_WindowedMatcher, "WindowedMatcher");

,var WindowedMatcher = _WindowedMatcher;

,function splitIntoWords(a) {
  return a.split(/[^a-zA-Z0-9]/).filter(x => x.length > 0);
},__name(splitIntoWords, "splitIntoWords");

,var ENGLISH_STOPS = new Set(["we", "our", "you", "it", "its", "they", "them", "their", "this", "that", "these", "those", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "can", "don", "t", "s", "will", "would", "should", "what", "which", "who", "when", "where", "why", "how", "a", "an", "the", "and", "or", "not", "no", "but", "because", "as", "until", "again", "further", "then", "once", "here", "there", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "above", "below", "to", "during", "before", "after", "of", "at", "by", "about", "between", "into", "through", "from", "up", "down", "in", "out", "on", "off", "over", "under", "only", "own", "same", "so", "than", "too", "very", "just", "now"]),
  GENERIC_STOPS = new Set(["if", "then", "else", "for", "while", "with", "def", "function", "return", "TODO", "import", "try", "catch", "raise", "finally", "repeat", "switch", "case", "match", "assert", "continue", "break", "const", "class", "enum", "struct", "static", "new", "super", "this", "var", ...ENGLISH_STOPS]),
  SPECIFIC_STOPS = new Map([]);