var _StatementNode = class _StatementNode {
  constructor(node) {
    this.node = node;
    this.children = [];
  }
  addChild(child) {
    child.parent = this, child.nextSibling = void 0, this.children.length > 0 && (this.children[this.children.length - 1].nextSibling = child), this.children.push(child);
  }
  containsStatement(stmt) {
    return this.node.startIndex <= stmt.node.startIndex && this.node.endIndex >= stmt.node.endIndex;
  }
  statementAt(offset) {
    if (this.node.startIndex > offset || this.node.endIndex < offset) return;
    let innerMatch;
    return this.children.find(stmt => (innerMatch = stmt.statementAt(offset), innerMatch !== void 0)), innerMatch != null ? innerMatch : this;
  }
  get isCompoundStatementType() {
    return _StatementNode.compoundTypeNames.has(this.node.type);
  }
  get description() {
    return `${this.node.type} ([${this.node.startPosition.row},${this.node.startPosition.column}]..[${this.node.endPosition.row},${this.node.endPosition.column}]): ${JSON.stringify(this.node.text.length > 33 ? this.node.text.substring(0, 15) + "..." + this.node.text.slice(-15) : this.node.text)}`;
  }
  dump(prefix1 = "", prefix2 = "") {
    let result = [`${prefix1}${this.description}`];
    return this.children.forEach(child => {
      result.push(child.dump(`${prefix2}+- `, child.nextSibling === void 0 ? `${prefix2}   ` : `${prefix2}|  `));
    }), result.join(`
`);
  }
  dumpPath(prefix1 = "", prefix2 = "", forChild = !1) {
    if (this.parent) {
      let path = this.parent.dumpPath(prefix1, prefix2, !0),
        indentSize = path.length - path.lastIndexOf(`
`) - 1 - prefix2.length,
        indent = " ".repeat(indentSize),
        nextPrefix = forChild ? `
${prefix2}${indent}+- ` : "";
      return path + this.description + nextPrefix;
    } else {
      let nextPrefix = forChild ? `
${prefix2}+- ` : "";
      return prefix1 + this.description + nextPrefix;
    }
  }
};

,__name(_StatementNode, "StatementNode"), _StatementNode.compoundTypeNames = new Set(["function_declaration", "generator_function_declaration", "class_declaration", "statement_block", "if_statement", "switch_statement", "for_statement", "for_in_statement", "while_statement", "do_statement", "try_statement", "with_statement", "labeled_statement", "method_definition", "interface_declaration"]);

,var StatementNode = _StatementNode,
  _StatementTree = class _StatementTree {
    constructor(languageId, text, startOffset, endOffset) {
      this.languageId = languageId;
      this.text = text;
      this.startOffset = startOffset;
      this.endOffset = endOffset;
      this.statements = [];
    }
    dispose() {
      this.tree && (this.tree.delete(), this.tree = void 0);
    }
    clear() {
      this.statements.length = 0;
    }
    statementAt(offset) {
      let match;
      return this.statements.find(stmt => (match = stmt.statementAt(offset), match !== void 0)), match;
    }
    async build() {
      let parents = [];
      this.clear();
      let tree = await this.parse();
      this.getQuery(tree).captures(tree.rootNode, this.offsetToPosition(this.startOffset), this.offsetToPosition(this.endOffset)).forEach(capture => {
        let stmt = new StatementNode(capture.node);
        for (; parents.length > 0 && !parents[0].containsStatement(stmt);) parents.shift();
        parents.length > 0 ? parents[0].addChild(stmt) : this.addStatement(stmt), parents.unshift(stmt);
      });
    }
    addStatement(stmt) {
      stmt.parent = void 0, stmt.nextSibling = void 0, this.statements.length > 0 && (this.statements[this.statements.length - 1].nextSibling = stmt), this.statements.push(stmt);
    }
    async parse() {
      return this.tree || (this.tree = await parseTreeSitter(this.languageId, this.text)), this.tree;
    }
    getQuery(tree) {
      return tree.getLanguage().query(`[
            (export_statement)
            (import_statement)
            (debugger_statement)
            (expression_statement)
            (declaration)
            (statement_block)
            (if_statement)
            (switch_statement)
            (for_statement)
            (for_in_statement)
            (while_statement)
            (do_statement)
            (try_statement)
            (with_statement)
            (break_statement)
            (continue_statement)
            (return_statement)
            (throw_statement)
            (empty_statement)
            (labeled_statement)
            (method_definition)
            (public_field_definition)
        ] @statement`);
    }
    offsetToPosition(offset) {
      let lines = this.text.slice(0, offset).split(`
`),
        row = lines.length - 1,
        column = lines[lines.length - 1].length;
      return {
        row: row,
        column: column
      };
    }
    dump(prefix = "") {
      let result = [];
      return this.statements.forEach((stmt, idx) => {
        let idxStr = `[${idx}]`,
          idxSpaces = " ".repeat(idxStr.length);
        result.push(stmt.dump(`${prefix} ${idxStr} `, `${prefix} ${idxSpaces} `));
      }), result.join(`
`);
    }
  };

,__name(_StatementTree, "StatementTree");

,var StatementTree = _StatementTree,
  _BlockTrimmer = class _BlockTrimmer {
    constructor(languageId, prefix, completion, lineLimit = 10) {
      this.languageId = languageId;
      this.prefix = prefix;
      this.completion = completion;
      this.lineLimit = lineLimit;
      let completionLineEnds = [...this.completion.matchAll(/\n/g)];
      completionLineEnds.length >= this.lineLimit && this.lineLimit > 0 ? this.offsetLimit = completionLineEnds[this.lineLimit - 1].index : this.offsetLimit = void 0;
    }
    static isSupported(languageId) {
      return ["javascript", "javascriptreact", "jsx", "typescript", "typescriptreact"].includes(languageId);
    }
    async getCompletionTrimOffset() {
      var _a;
      let tree;
      try {
        tree = new StatementTree(this.languageId, this.prefix + this.completion, this.prefix.length, this.prefix.length + this.completion.length), await tree.build();
        let stmt = (_a = tree.statementAt(Math.max(this.prefix.length - 1, 0))) != null ? _a : tree.statements[0],
          offset = this.getContainingBlockOffset(stmt);
        return this.isWithinLimit(offset) || (offset = this.trimToBlankLine(offset)), this.isWithinLimit(offset) || (offset = this.trimToStatement(stmt, offset)), offset;
      } finally {
        tree == null || tree.dispose();
      }
    }
    getContainingBlockOffset(stmt) {
      let trimTo;
      if (stmt && stmt.isCompoundStatementType) trimTo = stmt;else if (stmt) {
        let parent = stmt.parent;
        for (; parent && !parent.isCompoundStatementType;) parent = parent.parent;
        trimTo = parent;
      }
      if (trimTo) {
        let newOffset = this.asCompletionOffset(trimTo.node.endIndex);
        if (newOffset && this.completion.substring(newOffset).trim() !== "") return newOffset;
      }
    }
    trimmedCompletion(offset) {
      return offset === void 0 ? this.completion : this.completion.substring(0, offset);
    }
    isWithinLimit(offset) {
      return this.offsetLimit === void 0 || offset !== void 0 && offset <= this.offsetLimit;
    }
    trimToBlankLine(offset) {
      let blankLines = [...this.trimmedCompletion(offset).matchAll(/\r?\n\s*\r?\n/g)].reverse();
      for (; blankLines.length > 0 && !this.isWithinLimit(offset);) offset = blankLines.pop().index;
      return offset;
    }
    trimToStatement(stmt, offset) {
      var _a, _b, _c;
      let min = this.prefix.length,
        max = this.prefix.length + ((_a = this.offsetLimit) != null ? _a : this.completion.length),
        s = stmt,
        next = stmt == null ? void 0 : stmt.nextSibling;
      for (; next && next.node.endIndex <= max;) s = next, next = next.nextSibling;
      return s && s === stmt && s.node.endIndex <= min && (s = next), s && s.node.endIndex > max ? this.trimToStatement(s.children[0], this.asCompletionOffset(s.node.endIndex)) : (_c = this.asCompletionOffset((_b = s == null ? void 0 : s.node) == null ? void 0 : _b.endIndex)) != null ? _c : offset;
    }
    asCompletionOffset(offset) {
      return offset === void 0 ? void 0 : offset - this.prefix.length;
    }
  };

,__name(_BlockTrimmer, "BlockTrimmer");

,var BlockTrimmer = _BlockTrimmer;