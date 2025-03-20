var _CompletionsPromptRenderer = class _CompletionsPromptRenderer {
  constructor() {
    this.renderId = 0;
  }
  async render(snapshot, options, cancellationToken) {
    var _a, _b;
    let id = this.renderId++,
      renderStart = performance.now();
    try {
      if (cancellationToken != null && cancellationToken.isCancellationRequested) return {
        status: "cancelled"
      };
      let delimiter = (_a = options.delimiter) != null ? _a : "",
        tokenizer = (_b = options.tokenizer) != null ? _b : getTokenizer(),
        {
          prefixBlocks: prefixBlocks,
          suffixBlock: suffixBlock,
          componentStatistics: componentStatistics
        } = await this.processSnapshot(snapshot, delimiter),
        {
          prefixTokenLimit: prefixTokenLimit,
          suffixTokenLimit: suffixTokenLimit
        } = this.getPromptLimits(suffixBlock, options),
        elisionStart = performance.now(),
        elisionStrategy = new WishlistElision(tokenizer),
        [elidedSuffix, ...elidedPrefix] = elisionStrategy.elide(prefixBlocks, prefixTokenLimit, suffixBlock, suffixTokenLimit),
        elisionEnd = performance.now(),
        prefix = makePrompt(elidedPrefix),
        suffix = elidedSuffix.elidedValue,
        tokens = tokenizer.tokenLength(prefix) + elidedSuffix.elidedTokens;
      return componentStatistics.push(...computeComponentStatistics([...elidedPrefix, elidedSuffix])), {
        prefix: prefix,
        suffix: suffix,
        tokens: tokens,
        status: "ok",
        metadata: {
          renderId: id,
          elisionTimeMs: elisionEnd - elisionStart,
          renderTimeMs: performance.now() - renderStart,
          componentStatistics: componentStatistics,
          updateDataTimeMs: componentStatistics.reduce((acc, component) => {
            var _a;
            return acc + ((_a = component.updateDataTimeMs) != null ? _a : 0);
          }, 0),
          status: "ok"
        }
      };
    } catch (e) {
      return {
        status: "error",
        error: e
      };
    }
  }
  getPromptLimits(suffixBlock, options) {
    var _a, _b, _c;
    let suffix = (_a = suffixBlock == null ? void 0 : suffixBlock.value) != null ? _a : "",
      availableTokens = (_b = options.promptTokenLimit) != null ? _b : DEFAULT_MAX_PROMPT_LENGTH,
      suffixPercent = (_c = options.suffixPercent) != null ? _c : DEFAULT_SUFFIX_PERCENT;
    if (suffix.length == 0 || suffixPercent == 0) return {
      prefixTokenLimit: availableTokens,
      suffixTokenLimit: 0
    };
    availableTokens = suffix.length > 0 ? availableTokens - TOKENS_RESERVED_FOR_SUFFIX_ENCODING : availableTokens;
    let suffixTokenLimit = Math.ceil(availableTokens * (suffixPercent / 100));
    return {
      prefixTokenLimit: availableTokens - suffixTokenLimit,
      suffixTokenLimit: suffixTokenLimit
    };
  }
  async processSnapshot(snapshot, delimiter) {
    let prefixBlocks = [],
      suffixBlocks = [],
      componentStatistics = [],
      foundDocument = !1,
      beforeCursorFound = !1,
      afterCursorFound = !1;
    if (await this.walkSnapshot(snapshot, async (node, weight, currentChunk, currentSource) => {
      if (node === snapshot || (node.name === CurrentFile.name ? foundDocument = !0 : node.name === BeforeCursor.name ? beforeCursorFound = !0 : node.name === AfterCursor.name && (afterCursorFound = !0), node.statistics.updateDataTimeMs && node.statistics.updateDataTimeMs > 0 && componentStatistics.push({
        componentPath: node.path,
        updateDataTimeMs: node.statistics.updateDataTimeMs
      }), node.value === void 0 || node.value === "")) return !0;
      if (afterCursorFound) suffixBlocks.push({
        value: node.value,
        weight: weight,
        componentPath: node.path,
        nodeStatistics: node.statistics,
        chunk: currentChunk ? currentChunk.path : void 0,
        source: currentSource
      });else {
        let nodeValueWithDelimiter = node.value.endsWith(delimiter) ? node.value : node.value + delimiter,
          value = beforeCursorFound ? node.value : nodeValueWithDelimiter;
        prefixBlocks.push({
          value: value,
          weight: weight,
          componentPath: node.path,
          nodeStatistics: node.statistics,
          chunk: currentChunk ? currentChunk.path : void 0,
          source: currentSource
        });
      }
      return !0;
    }), !foundDocument) throw new Error(`Node of type ${CurrentFile.name} not found`);
    if (suffixBlocks.length > 1) throw new Error("Only one suffix is allowed");
    let suffixBlock = suffixBlocks[0];
    return {
      prefixBlocks: prefixBlocks,
      suffixBlock: suffixBlock,
      componentStatistics: componentStatistics
    };
  }
  async walkSnapshot(node, visitor) {
    await this.walkSnapshotNode(node, visitor, 1, void 0, void 0);
  }
  async walkSnapshotNode(node, visitor, parentWeight, chunk, source) {
    var _a, _b, _c, _d, _e;
    let weight = (_b = (_a = node.props) == null ? void 0 : _a.weight) != null ? _b : 1,
      scaledWeight = (typeof weight == "number" ? Math.max(0, Math.min(1, weight)) : 1) * parentWeight,
      currentChunk = node.name === Chunk.name ? node : chunk,
      currentSource = (_d = (_c = node.props) == null ? void 0 : _c.source) != null ? _d : source;
    if (await visitor(node, scaledWeight, currentChunk, currentSource)) for (let child of (_e = node.children) != null ? _e : []) await this.walkSnapshotNode(child, visitor, scaledWeight, currentChunk, currentSource);
  }
};

,__name(_CompletionsPromptRenderer, "CompletionsPromptRenderer");

,var CompletionsPromptRenderer = _CompletionsPromptRenderer;

,function computeComponentStatistics(elidedBlocks) {
  return elidedBlocks.map(block => {
    let result = {
      componentPath: block.componentPath
    };
    return block.tokens !== 0 && (result.expectedTokens = block.tokens, result.actualTokens = block.elidedTokens), block.nodeStatistics.updateDataTimeMs !== void 0 && (result.updateDataTimeMs = block.nodeStatistics.updateDataTimeMs), block.source && (result.source = block.source), result;
  });
},__name(computeComponentStatistics, "computeComponentStatistics");