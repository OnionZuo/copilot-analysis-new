var _BlockTokenSubsetMatcher = class _BlockTokenSubsetMatcher extends WindowedMatcher {
  constructor(referenceDoc, windowLength) {
    super(referenceDoc), this.windowLength = windowLength;
  }
  id() {
    return "fixed:" + this.windowLength;
  }
  getWindowsDelineations(lines) {
    return getBasicWindowDelineations(this.windowLength, lines);
  }
  _getCursorContextInfo(referenceDoc) {
    return getCursorContext(referenceDoc, {
      maxLineCount: this.windowLength
    });
  }
  get referenceTokens() {
    return this.createReferenceTokensForLanguage();
  }
  async createReferenceTokensForLanguage() {
    return this.referenceTokensCache ? this.referenceTokensCache : (this.referenceTokensCache = _BlockTokenSubsetMatcher.syntaxAwareSupportsLanguage(this.referenceDoc.languageId) ? await this.syntaxAwareReferenceTokens() : await super.referenceTokens, this.referenceTokensCache);
  }
  async syntaxAwareReferenceTokens() {
    var _a;
    let start = (_a = await this.getEnclosingMemberStart(this.referenceDoc.source, this.referenceDoc.offset)) == null ? void 0 : _a.startIndex,
      end = this.referenceDoc.offset,
      text = start ? this.referenceDoc.source.slice(start, end) : getCursorContext(this.referenceDoc, {
        maxLineCount: this.windowLength
      }).context;
    return this.tokenizer.tokenize(text);
  }
  static syntaxAwareSupportsLanguage(languageId) {
    switch (languageId) {
      case "csharp":
        return !0;
      default:
        return !1;
    }
  }
  similarityScore(a, b) {
    return computeScore(a, b);
  }
  async getEnclosingMemberStart(text, offset) {
    var _a;
    let tree;
    try {
      tree = await parseTreeSitter(this.referenceDoc.languageId, text);
      let nodeAtPos = tree.rootNode.namedDescendantForIndex(offset);
      for (; nodeAtPos && !(_BlockTokenSubsetMatcher.isMember(nodeAtPos) || _BlockTokenSubsetMatcher.isBlock(nodeAtPos));) nodeAtPos = (_a = nodeAtPos.parent) != null ? _a : void 0;
      return nodeAtPos;
    } finally {
      tree == null || tree.delete();
    }
  }
  static isMember(node) {
    switch (node == null ? void 0 : node.type) {
      case "method_declaration":
      case "property_declaration":
      case "field_declaration":
      case "constructor_declaration":
        return !0;
      default:
        return !1;
    }
  }
  static isBlock(node) {
    switch (node == null ? void 0 : node.type) {
      case "class_declaration":
      case "struct_declaration":
      case "record_declaration":
      case "enum_declaration":
      case "interface_declaration":
        return !0;
      default:
        return !1;
    }
  }
};

,__name(_BlockTokenSubsetMatcher, "BlockTokenSubsetMatcher"), _BlockTokenSubsetMatcher.FACTORY = __name(windowLength => ({
  to: __name(referenceDoc => new _BlockTokenSubsetMatcher(referenceDoc, windowLength), "to")
}), "FACTORY");

,var BlockTokenSubsetMatcher = _BlockTokenSubsetMatcher;

,function computeScore(a, b) {
  let subsetOverlap = new Set();
  return b.forEach(x => {
    a.has(x) && subsetOverlap.add(x);
  }), subsetOverlap.size;
},__name(computeScore, "computeScore");