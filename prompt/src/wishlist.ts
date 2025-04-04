var MAX_EDIT_DISTANCE_LENGTH = 50,
  TOKENS_RESERVED_FOR_SUFFIX_ENCODING = 5,
  _PromptBackground = class _PromptBackground {
    constructor() {
      this.used = new Map();
      this.unused = new Map();
    }
    add(other) {
      for (let [id, element] of other.used) this.used.set(id, element);
      for (let [id, element] of other.unused) this.unused.set(id, element);
    }
    markUsed(element) {
      this.IsSnippet(element) && this.used.set(element.id, this.convert(element));
    }
    undoMarkUsed(element) {
      this.IsSnippet(element) && this.used.delete(element.id);
    }
    markUnused(element) {
      this.IsSnippet(element) && this.unused.set(element.id, this.convert(element));
    }
    convert(element) {
      return {
        score: element.score.toFixed(4),
        length: element.text.length
      };
    }
    IsSnippet(element) {
      return element.kind == "SimilarFile" || element.kind == "TooltipSignature";
    }
  };

,__name(_PromptBackground, "PromptBackground");

,var PromptBackground = _PromptBackground,
  _PromptChoices = class _PromptChoices {
    constructor() {
      this.used = new Map();
      this.unused = new Map();
      this.usedCounts = new Map();
      this.unusedCounts = new Map();
    }
    toJSON() {
      return {
        used: Object.fromEntries(this.used),
        unused: Object.fromEntries(this.unused),
        usedCounts: Object.fromEntries(this.usedCounts),
        unusedCounts: Object.fromEntries(this.unusedCounts)
      };
    }
    add(other) {
      for (let [kind, count] of other.used) this.used.set(kind, (this.used.get(kind) || 0) + count);
      for (let [kind, count] of other.unused) this.unused.set(kind, (this.unused.get(kind) || 0) + count);
      for (let [kind, count] of other.usedCounts) this.usedCounts.set(kind, (this.usedCounts.get(kind) || 0) + count);
      for (let [kind, count] of other.unusedCounts) this.unusedCounts.set(kind, (this.unusedCounts.get(kind) || 0) + count);
    }
    markUsed(element) {
      this.used.set(element.kind, (this.used.get(element.kind) || 0) + element.tokens), element.kind == "BeforeCursor" ? this.usedCounts.set(element.kind, (this.usedCounts.get(element.kind) || 0) + element.text.split(`
`).length) : this.usedCounts.set(element.kind, (this.usedCounts.get(element.kind) || 0) + 1);
    }
    undoMarkUsed(element) {
      this.used.set(element.kind, (this.used.get(element.kind) || 0) - element.tokens), element.kind == "BeforeCursor" ? this.usedCounts.set(element.kind, (this.usedCounts.get(element.kind) || 0) - element.text.split(`
`).length) : this.usedCounts.set(element.kind, (this.usedCounts.get(element.kind) || 0) - 1);
    }
    markUnused(element) {
      this.unused.set(element.kind, (this.unused.get(element.kind) || 0) + element.tokens), element.kind == "BeforeCursor" ? this.unusedCounts.set(element.kind, (this.unusedCounts.get(element.kind) || 0) + element.text.split(`
`).length) : this.unusedCounts.set(element.kind, (this.unusedCounts.get(element.kind) || 0) + 1);
    }
  };

,__name(_PromptChoices, "PromptChoices");

,var PromptChoices = _PromptChoices,
  _PromptOrderList = class _PromptOrderList {
    constructor(preset = "default") {
      this._rankedList = ["LanguageMarker", "PathMarker", "Traits", "CodeSnippet", "SimilarFile", "BeforeCursor", "TooltipSignature"];
    }
    get rankedList() {
      return this._rankedList;
    }
    sortElements(elements) {
      return elements.sort((a, b) => {
        let aIndex = this._rankedList.indexOf(a.kind),
          bIndex = this._rankedList.indexOf(b.kind);
        if (aIndex === -1 || bIndex === -1) throw new Error(`Invalid element kind: ${a.kind} or ${b.kind}, not found in prompt element ordering list`);
        return aIndex === bIndex ? a.id - b.id : aIndex - bIndex;
      });
    }
  };

,__name(_PromptOrderList, "PromptOrderList");

,var PromptOrderList = _PromptOrderList,
  _PromptPriorityList = class _PromptPriorityList extends PromptOrderList {
    constructor(preset = "default") {
      switch (super(), preset) {
        case "office-exp":
          this._rankedList = ["PathMarker", "TooltipSignature", "BeforeCursor", "CodeSnippet", "SimilarFile", "LanguageMarker", "Traits"];
          break;
        default:
          this._rankedList = ["TooltipSignature", "BeforeCursor", "CodeSnippet", "SimilarFile", "PathMarker", "LanguageMarker", "Traits"];
      }
    }
    sortElements(elements) {
      return elements.sort((a, b) => {
        let aIndex = this._rankedList.indexOf(a.kind),
          bIndex = this._rankedList.indexOf(b.kind);
        if (aIndex === -1 || bIndex === -1) throw new Error(`Invalid element kind: ${a.kind} or ${b.kind}, not found in snippet provider priority list`);
        return aIndex === bIndex ? b.id - a.id : aIndex - bIndex;
      });
    }
  };
  
  ,__name(_PromptPriorityList, "PromptPriorityList");

,var PromptPriorityList = _PromptPriorityList;

,function kindForSnippetProviderType(provider) {
  switch (provider) {
    case "similar-files":
      return "SimilarFile";
    case "path":
      return "PathMarker";
    case "language":
      return "LanguageMarker";
    case "tooltip-signature":
      return "TooltipSignature";
    case "trait":
      return "Traits";
    case "code":
      return "CodeSnippet";
    default:
      throw new Error(`Unknown snippet provider type ${provider}`);
  }
}

,__name(kindForSnippetProviderType, "kindForSnippetProviderType");

,var _PromptElementRanges = class _PromptElementRanges {
  constructor(usedElements) {
    this.ranges = new Array();
    let nextRangeStart = 0,
      previousKind;
    for (let element of usedElements) element.text.length !== 0 && (previousKind === "BeforeCursor" && element.kind === "BeforeCursor" ? this.ranges[this.ranges.length - 1].end += element.text.length : this.ranges.push({
      kind: element.kind,
      start: nextRangeStart,
      end: nextRangeStart + element.text.length
    }), previousKind = element.kind, nextRangeStart += element.text.length);
  }
};

,__name(_PromptElementRanges, "PromptElementRanges");

,var PromptElementRanges = _PromptElementRanges,
  _PromptWishlist = class _PromptWishlist {
    constructor(tokenizer, lineEndingOption, orderingList, snippetTextProcessor, priorityList) {
      this.tokenizer = tokenizer;
      this.lineEndingOption = lineEndingOption;
      this.orderingList = orderingList;
      this.snippetTextProcessor = snippetTextProcessor;
      this.priorityList = priorityList;
      this.content = [];
      this.basePromptBackground = new PromptBackground();
      this.baseTallyOfChoices = new PromptChoices();
    }
    extMarkUnused(element) {
      this.basePromptBackground.markUnused(element), this.baseTallyOfChoices.markUnused(element);
    }
    getContent() {
      return [...this.content];
    }
    convertLineEndings(text) {
      return this.lineEndingOption === "unix" && (text = text.replace(/\r\n?/g, `
`)), text;
    }
    maxPrefixTokenLength() {
      return this.content.reduce((sum, element) => sum += element.tokens, 0);
    }
    append(text, kind, tokens = this.tokenizer.tokenLength(text), score = NaN) {
      text = this.convertLineEndings(text);
      let id = this.content.length;
      return this.content.push({
        id: id,
        text: text,
        kind: kind,
        tokens: tokens,
        score: score
      }), id;
    }
    fulfillPrefix(maxPromptLength) {
      let promptBackground = new PromptBackground();
      promptBackground.add(this.basePromptBackground);
      let tallyOfChoices = new PromptChoices();
      tallyOfChoices.add(this.baseTallyOfChoices);
      function markUsed(element) {
        promptBackground.markUsed(element), tallyOfChoices.c(element);
      }
      __name(markUsed, "markUsed");
      function undoMarkUsed(element) {
        promptBackground.undoMarkUsed(element), tallyOfChoices.undoMarkUsed(element);
      }
      __name(undoMarkUsed, "undoMarkUsed");
      function markUnused(element) {
        promptBackground.markUnused(element), tallyOfChoices.markUnused(element);
      }
      __name(markUnused, "markUnused"), this.priorityList.sortElements(this.content);
      let budgetBreakingElement,
        remainingContent = [],
        remainingBudget = maxPromptLength;
      this.content.forEach(e => {
        if (remainingBudget > 0 || budgetBreakingElement === void 0) {
          let budgetUse = e.tokens;
          if (remainingBudget >= budgetUse) remainingBudget -= budgetUse, markUsed(e), remainingContent.push(e);else if (e.kind === "BeforeCursor" && remainingBudget > 0) {
            let {
              summarizedElement: summarizedElement,
              removedMaterial: removedMaterial
            } = this.snippetTextProcessor.summarize(this.tokenizer, e, remainingBudget);
            e = summarizedElement, budgetUse = e.tokens, remainingBudget -= budgetUse, e.text.length > 0 && markUsed(e), removedMaterial.text.length > 0 && markUnused(removedMaterial), remainingContent.push(e);
          } else budgetBreakingElement === void 0 ? budgetBreakingElement = e : markUnused(e);
        } else markUnused(e);
      }), this.orderingList.sortElements(remainingContent);
      let prompt = remainingContent.reduce((a, b) => a + b.text, ""),
        promptLength = this.tokenizer.tokenLength(prompt);
      for (; promptLength > maxPromptLength;) {
        this.priorityList.sortElements(remainingContent);
        let removeAfterAll = remainingContent.pop();
        removeAfterAll && (undoMarkUsed(removeAfterAll), markUnused(removeAfterAll), budgetBreakingElement !== void 0 && markUnused(budgetBreakingElement), budgetBreakingElement = void 0), this.orderingList.sortElements(remainingContent), prompt = remainingContent.reduce((a, b) => a + b.text, ""), promptLength = this.tokenizer.tokenLength(prompt);
      }
      let extendedContent = [...remainingContent];
      if (budgetBreakingElement !== void 0) {
        extendedContent.push(budgetBreakingElement), this.orderingList.sortElements(extendedContent);
        let prompt = extendedContent.reduce((a, b) => a + b.text, ""),
          promptLength = this.tokenizer.tokenLength(prompt);
        if (promptLength <= maxPromptLength) {
          markUsed(budgetBreakingElement);
          let promptElementRanges = new PromptElementRanges(extendedContent);
          return {
            prefix: prompt,
            suffix: "",
            prefixLength: promptLength,
            suffixLength: 0,
            promptChoices: tallyOfChoices,
            promptBackground: promptBackground,
            promptElementRanges: promptElementRanges
          };
        } else markUnused(budgetBreakingElement);
      }
      let promptElementRanges = new PromptElementRanges(remainingContent);
      return {
        prefix: prompt,
        suffix: "",
        prefixLength: promptLength,
        suffixLength: 0,
        promptChoices: tallyOfChoices,
        promptBackground: promptBackground,
        promptElementRanges: promptElementRanges
      };
    }
    fulfill(suffixText, completeOptions, cachedSuffix) {
      var _a;
      if (completeOptions.suffixPercent === 0 || suffixText.length === 0) return {
        promptInfo: this.fulfillPrefix(completeOptions.maxPromptLength),
        newCachedSuffix: cachedSuffix
      };
      let availableTokens = completeOptions.maxPromptLength - TOKENS_RESERVED_FOR_SUFFIX_ENCODING,
        prefixTokenBudget = Math.floor(availableTokens * (100 - completeOptions.suffixPercent) / 100),
        suffixTokenBudget = availableTokens - prefixTokenBudget,
        trimmedSuffixText = suffixText.replace(/^.*/, "").trimStart();
      if (availableTokens > MAX_EDIT_DISTANCE_LENGTH && suffixTokenBudget < MAX_EDIT_DISTANCE_LENGTH) throw new Error(`Suffix budget is smaller than MAX_EDIT_DISTANCE_LENGTH: ${suffixTokenBudget} < ${MAX_EDIT_DISTANCE_LENGTH}
`);
      let firstSuffixTokens = this.tokenizer.takeFirstTokens(trimmedSuffixText, MAX_EDIT_DISTANCE_LENGTH),
        useCachedSuffix = !1;
      firstSuffixTokens.tokens.length > 0 && completeOptions.suffixMatchThreshold > 0 && 100 * ((_a = findEditDistanceScore(firstSuffixTokens.tokens, cachedSuffix.tokens.slice(0, MAX_EDIT_DISTANCE_LENGTH))) == null ? void 0 : _a.score) < completeOptions.suffixMatchThreshold * firstSuffixTokens.tokens.length && (useCachedSuffix = !0);
      let newCachedSuffix;
      if (useCachedSuffix) prefixTokenBudget = availableTokens - cachedSuffix.tokens.length, newCachedSuffix = cachedSuffix;else {
        let maxPrefixTokenLength = this.maxPrefixTokenLength(),
          maxSuffixTokenLength = this.tokenizer.tokenLength(trimmedSuffixText);
        maxPrefixTokenLength < prefixTokenBudget ? (prefixTokenBudget = maxPrefixTokenLength, suffixTokenBudget = availableTokens - prefixTokenBudget) : maxSuffixTokenLength < suffixTokenBudget && (prefixTokenBudget = availableTokens - maxSuffixTokenLength, suffixTokenBudget = maxSuffixTokenLength), newCachedSuffix = this.tokenizer.takeFirstTokens(trimmedSuffixText, suffixTokenBudget);
      }
      let promptInfo = this.fulfillPrefix(prefixTokenBudget);
      return promptInfo.suffix = newCachedSuffix.text, promptInfo.suffixLength = newCachedSuffix.tokens.length, {
        promptInfo: promptInfo,
        newCachedSuffix: newCachedSuffix
      };
    }
  };

,__name(_PromptWishlist, "PromptWishlist");

,var PromptWishlist = _PromptWishlist;