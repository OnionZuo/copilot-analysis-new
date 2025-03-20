var _TextRange = class _TextRange {
  constructor(start, length) {
    this.start = start, this.length = length;
  }
  static fromBounds(start, end) {
    return new _TextRange(start, end - start);
  }
  get end() {
    return this.start + this.length;
  }
  contains(position) {
    return this.start <= position && this.end >= position;
  }
  containsRange(other) {
    return this.start <= other.start && this.end >= other.end;
  }
  equals(other) {
    return this.start === other.start && this.length === other.length;
  }
  getText(sourceText) {
    return sourceText.slice(this.start, this.end);
  }
  getTextWithIndentation(sourceText, desiredIndent) {
    let builder = [],
      i = this.start;
    for (i = consumeIndent(sourceText, sourceText.length, i), appendIndent(builder, desiredIndent); i < this.end;) sourceText[i] !== "\r" && sourceText[i] !== `
` ? builder.push(sourceText[i++]) : sourceText[i] === "\r" && i < sourceText.length && sourceText[i + 1] !== `
` || sourceText[i] === `
` ? (builder.push(`
`), i = consumeIndent(sourceText, sourceText.length, ++i), appendIndent(builder, desiredIndent)) : i++;
    return builder.join("");
  }
};

,__name(_TextRange, "TextRange"), _TextRange.empty = new _TextRange(0, 0);

,var TextRange = _TextRange;

,function appendIndent(builder, desiredIndent) {
  for (let i = 0; i < desiredIndent; i++) builder.push(" ");
},__name(appendIndent, "appendIndent");

,function consumeIndent(sourceText, end, i) {
  for (; i < end && (sourceText[i] === " " || sourceText[i] === "	");) i++;
  return i;
},__name(consumeIndent, "consumeIndent");

,var _SymbolRange = class _SymbolRange {
  constructor(fileName, fullyQualifiedName, unqualifiedName, commentRange, nameRange, bodyRange, extentRange, kind, refKind) {
    this.fileName = fileName;
    this.fullyQualifiedName = fullyQualifiedName;
    this.unqualifiedName = unqualifiedName;
    this.commentRange = commentRange;
    this.nameRange = nameRange;
    this.bodyRange = bodyRange;
    this.extentRange = extentRange;
    this.kind = kind;
    this.refKind = refKind;
    if (fileName.indexOf("\\") !== -1) throw new Error("fileName must be normalized to use forward slashes as path separators");
  }
  equals(other) {
    return this.fileName === other.fileName && this.fullyQualifiedName === other.fullyQualifiedName && this.unqualifiedName === other.unqualifiedName && this.commentRange.equals(other.commentRange) && this.nameRange.equals(other.nameRange) && this.bodyRange.equals(other.bodyRange) && this.extentRange.equals(other.extentRange) && this.kind === other.kind && this.refKind === other.refKind;
  }
};

,__name(_SymbolRange, "SymbolRange");

,var SymbolRange = _SymbolRange,
  _SymbolExtractorBase = class _SymbolExtractorBase {
    constructor() {
      this.queriesCache = new Map();
    }
    async executeQuery(filePath, code, query) {
      let tree;
      try {
        tree = await parseTreeSitter(this.languageId, code);
        let language = tree.getLanguage(),
          matches = this.getOrCreateQuery(language, query).matches(tree.rootNode),
          scopes = new Stack(),
          results = [];
        for (let match of matches) {
          let symbolRange = this.createSymbolRange(scopes, filePath, code, match.captures);
          symbolRange && results.push(symbolRange);
        }
        return results;
      } finally {
        tree == null || tree.delete();
      }
    }
    getOrCreateQuery(language, query) {
      let tsQuery = this.queriesCache.get(query);
      return tsQuery || (tsQuery = language.query(query), this.queriesCache.set(query, tsQuery)), tsQuery;
    }
    createSymbolRange(scopes, filePath, code, captures) {
      let commentStart = 0,
        commentEnd = 0,
        start = 0,
        end = 0,
        nameStart = 0,
        nameEnd = 0,
        bodyStart = 0,
        bodyEnd = 0,
        kind = null,
        receiverType = null;
      for (let i = 0; i < captures.length; i++) {
        let captureKind = captures[i].name;
        captureKind === "name" ? (nameStart = captures[i].node.startIndex, nameEnd = captures[i].node.endIndex) : captureKind === "reference" ? (nameStart = captures[i].node.startIndex, nameEnd = captures[i].node.endIndex, start = captures[i].node.startIndex, end = captures[i].node.endIndex, kind = captureKind) : captureKind === "body" ? (bodyStart = captures[i].node.startIndex, bodyEnd = captures[i].node.endIndex) : captureKind === "comment" ? (commentStart = commentStart === 0 ? captures[i].node.startIndex : Math.min(commentStart, captures[i].node.startIndex), commentEnd = Math.max(commentEnd, captures[i].node.endIndex)) : captureKind === "receiver" ? receiverType = TextRange.fromBounds(captures[i].node.startIndex, captures[i].node.endIndex).getText(code) : (start = captures[i].node.startIndex, end = captures[i].node.endIndex, kind = captureKind);
      }
      kind === "definition.module.filescoped" && (bodyEnd = code.length, end = bodyEnd);
      let extentRange = TextRange.fromBounds(start, end),
        range = start > 0 || end > 0 || nameStart > 0 || nameEnd > 0 ? new SymbolRange(filePath, "", "", TextRange.fromBounds(commentStart, commentEnd), TextRange.fromBounds(nameStart, nameEnd), TextRange.fromBounds(bodyStart, bodyEnd), extentRange, _SymbolExtractorBase.kindFromString(kind), 0) : null;
      if (range) {
        _SymbolExtractorBase.updateScopesForSymbol(scopes, range);
        let unqualifiedName = range.nameRange.getText(code),
          fullyQualifiedName = this.createNameFromScopes(code, scopes.toArray());
        return fullyQualifiedName = receiverType ? `${receiverType}.${fullyQualifiedName}` : fullyQualifiedName, new SymbolRange(filePath, fullyQualifiedName, unqualifiedName.substring(unqualifiedName.lastIndexOf(".") + 1), range.commentRange, range.nameRange, range.bodyRange, range.extentRange, range.kind, 0);
      }
      return null;
    }
    static updateScopesForSymbol(scopes, symbolRange) {
      var _a;
      for (; scopes.tryPeek() && !((_a = scopes.peek()) != null && _a.extentRange.containsRange(symbolRange.extentRange));) scopes.pop();
      scopes.push(symbolRange);
    }
    static kindFromString(kind) {
      switch (kind) {
        case "definition.class":
          return 0;
        case "definition.constant":
          return 1;
        case "definition.enum_variant":
          return 3;
        case "definition.enum":
          return 2;
        case "definition.field":
          return 4;
        case "definition.function":
          return 5;
        case "definition.implementation":
          return 6;
        case "definition.interface":
          return 7;
        case "definition.macro":
          return 8;
        case "definition.method":
          return 9;
        case "definition.module":
        case "definition.module.filescoped":
          return 10;
        case "definition.struct":
          return 11;
        case "definition.trait":
          return 12;
        case "definition.type":
          return 13;
        case "definition.union":
          return 14;
        case "reference":
          return 16;
        default:
          throw new Error("NotSupportedException");
      }
    }
  };

,__name(_SymbolExtractorBase, "SymbolExtractorBase");

,var SymbolExtractorBase = _SymbolExtractorBase;