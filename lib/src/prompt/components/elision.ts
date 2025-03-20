var _WishlistElision = class _WishlistElision {
  constructor(tokenizer) {
    this.tokenizer = tokenizer;
  }
  elide(prefixBlocks, prefixTokenLimit, suffixBlock, suffixTokenLimit = 0) {
    if (prefixTokenLimit <= 0) throw new Error("Prefix limit must be greater than 0");
    let weightedSuffixBlock = suffixBlock != null ? suffixBlock : {
        componentPath: "",
        value: "",
        weight: 1,
        nodeStatistics: {}
      },
      [elidablePrefixBlocks, maxPrefixTokens] = this.preparePrefixBlocks(prefixBlocks),
      {
        elidedSuffix: elidedSuffix,
        adjustedPrefixTokenLimit: adjustedPrefixTokenLimit
      } = this.elideSuffix(weightedSuffixBlock, suffixTokenLimit, prefixTokenLimit, maxPrefixTokens),
      elidedPrefix = this.elidePrefix(elidablePrefixBlocks, adjustedPrefixTokenLimit, maxPrefixTokens);
    return [elidedSuffix, ...elidedPrefix];
  }
  preparePrefixBlocks(blocks) {
    let maxPrefixTokens = 0,
      componentPaths = new Set();
    return [blocks.map((block, index) => {
      let tokens = this.tokenizer.tokenLength(block.value);
      maxPrefixTokens += tokens;
      let componentPath = block.componentPath;
      if (componentPaths.has(componentPath)) throw new Error(`Duplicate component path in prefix blocks: ${componentPath}`);
      return componentPaths.add(componentPath), {
        ...block,
        tokens: tokens,
        markedForRemoval: !1,
        originalIndex: index
      };
    }), maxPrefixTokens];
  }
  elideSuffix(weightedSuffixBlock, suffixTokenLimit, prefixTokenLimit, maxPrefixTokens) {
    let suffix = weightedSuffixBlock.value;
    if (suffix.length === 0 || suffixTokenLimit <= 0) return {
      elidedSuffix: {
        ...weightedSuffixBlock,
        tokens: 0,
        elidedValue: "",
        elidedTokens: 0
      },
      adjustedPrefixTokenLimit: prefixTokenLimit + Math.max(0, suffixTokenLimit)
    };
    maxPrefixTokens < prefixTokenLimit && (suffixTokenLimit = suffixTokenLimit + (prefixTokenLimit - maxPrefixTokens), prefixTokenLimit = maxPrefixTokens);
    let shortenedSuffix = this.tokenizer.takeFirstTokens(suffix, suffixTokenLimit);
    return {
      elidedSuffix: {
        ...weightedSuffixBlock,
        value: suffix,
        tokens: this.tokenizer.tokenLength(suffix),
        elidedValue: shortenedSuffix.text,
        elidedTokens: shortenedSuffix.tokens.length
      },
      adjustedPrefixTokenLimit: prefixTokenLimit + Math.max(0, suffixTokenLimit - shortenedSuffix.tokens.length)
    };
  }
  elidePrefix(elidablePrefixBlocks, tokenLimit, maxPrefixTokens) {
    let prefixBlocks = this.removeLowWeightPrefixBlocks(elidablePrefixBlocks, tokenLimit, maxPrefixTokens),
      linesWithComponentPath = prefixBlocks.filter(block => !block.markedForRemoval).flatMap(block => block.value.split(/([^\n]*\n+)/).map(line => ({
        line: line,
        componentPath: block.componentPath
      }))).filter(l => l.line !== "");
    if (linesWithComponentPath.length === 0) return [];
    let [trimmedLines, prefixTokens] = this.trimPrefixLinesToFit(linesWithComponentPath, tokenLimit),
      currentPrefixTokens = prefixTokens;
    return prefixBlocks.map(block => {
      if (block.markedForRemoval) return currentPrefixTokens + block.tokens <= tokenLimit && !block.chunk ? (currentPrefixTokens += block.tokens, {
        ...block,
        elidedValue: block.value,
        elidedTokens: block.tokens
      }) : {
        ...block,
        elidedValue: "",
        elidedTokens: 0
      };
      let elidedValue = trimmedLines.filter(l => l.componentPath === block.componentPath && l.line !== "").map(l => l.line).join(""),
        elidedTokens = block.tokens;
      return elidedValue !== block.value && (elidedTokens = elidedValue !== "" ? this.tokenizer.tokenLength(elidedValue) : 0), {
        ...block,
        elidedValue: elidedValue,
        elidedTokens: elidedTokens
      };
    });
  }
  removeLowWeightPrefixBlocks(elidablePrefixBlocks, tokenLimit, maxPrefixTokens) {
    let totalPrefixTokens = maxPrefixTokens;
    elidablePrefixBlocks.sort((a, b) => a.weight - b.weight);
    for (let block of elidablePrefixBlocks) {
      if (totalPrefixTokens <= tokenLimit) break;
      if (block.weight !== 1 && !(block.chunk && block.markedForRemoval)) if (block.chunk) for (let relatedBlock of elidablePrefixBlocks) relatedBlock.chunk === block.chunk && !relatedBlock.markedForRemoval && (relatedBlock.markedForRemoval = !0, totalPrefixTokens -= relatedBlock.tokens);else block.markedForRemoval = !0, totalPrefixTokens -= block.tokens;
    }
    return elidablePrefixBlocks.sort((a, b) => a.originalIndex - b.originalIndex).map(block => {
      let {
        originalIndex: originalIndex,
        ...originalBlock
      } = block;
      return originalBlock;
    });
  }
  trimPrefixLinesToFit(linesWithComponentPath, tokenLimit) {
    let currentPrefixTokens = 0,
      fittingLines = [];
    for (let i = linesWithComponentPath.length - 1; i >= 0; i--) {
      let currentLine = linesWithComponentPath[i],
        text = currentLine.line,
        lineTokens = this.tokenizer.tokenLength(text);
      if (currentPrefixTokens + lineTokens <= tokenLimit) fittingLines.unshift(currentLine), currentPrefixTokens += lineTokens;else break;
    }
    if (fittingLines.length === 0) {
      let lastLine = linesWithComponentPath[linesWithComponentPath.length - 1];
      if (lastLine && lastLine.line.length > 0) {
        let prompt = this.tokenizer.takeLastTokens(lastLine.line, tokenLimit);
        return fittingLines.push({
          line: prompt.text,
          componentPath: lastLine.componentPath
        }), [fittingLines, prompt.tokens.length];
      }
      let errorMsg = `Cannot fit prefix within limit of ${tokenLimit} tokens`;
      throw new Error(errorMsg);
    }
    return [fittingLines, currentPrefixTokens];
  }
};

,__name(_WishlistElision, "WishlistElision");

,var WishlistElision = _WishlistElision;

,function makePrompt(elidedBlocks) {
  return elidedBlocks.map(block => block.elidedValue).join("");
},__name(makePrompt, "makePrompt");