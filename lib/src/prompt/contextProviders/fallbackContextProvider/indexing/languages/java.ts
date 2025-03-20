var _JavaSymbolExtractor = class _JavaSymbolExtractor extends SymbolExtractorBase {
  get languageId() {
    return "java";
  }
  extractSymbols(documentPath, code) {
    return this.executeQuery(documentPath, code, JavaSymbolsQuery);
  }
  createNameFromScopes(code, scopes) {
    return scopes.map(scope => scope.nameRange.getText(code)).join(".");
  }
};

,__name(_JavaSymbolExtractor, "JavaSymbolExtractor");

,var JavaSymbolExtractor = _JavaSymbolExtractor,
  _JavaReferenceExtractor = class _JavaReferenceExtractor extends SymbolExtractorBase {
    get languageId() {
      return "java";
    }
    createNameFromScopes(code, scopes) {
      return scopes.length > 0 ? scopes[scopes.length - 1].nameRange.getText(code) : "";
    }
    extractReferences(documentPath, code) {
      return this.executeQuery(documentPath, code, JavaReferencesQuery);
    }
    async extractLocalReferences(documentPath, code, selection) {
      let locals = await this.executeQuery(documentPath, code, JavaLocalReferencesQuery),
        references = locals.filter(local => local.kind !== 9),
        methods = locals.filter(local => local.kind === 9 && local.extentRange.containsRange(selection)),
        result = [];
      for (let method of methods) result.push(...references.filter(r => method.extentRange.containsRange(r.extentRange)));
      return result;
    }
  };

,__name(_JavaReferenceExtractor, "JavaReferenceExtractor");

,var JavaReferenceExtractor = _JavaReferenceExtractor,
  JavaSymbolsQuery = `
(
    [
        (block_comment) @comment
        (line_comment)* @comment
    ]
    .
    (class_declaration name: (identifier) @name body: (class_body) @body) @definition.class
)

(
    [
        (block_comment) @comment
        (line_comment)* @comment
    ]
    .
    (constructor_declaration name: (identifier) @name body: (constructor_body) @body) @definition.method
)

(
    [
        (block_comment) @comment
        (line_comment)* @comment
    ]
    .
    (method_declaration name: (identifier) @name body: (block)? @body) @definition.method
)

(
    [
        (block_comment) @comment
        (line_comment)* @comment
    ]
    .
    (interface_declaration name: (identifier) @name body: (interface_body) @body) @definition.interface
)

(
    [
        (block_comment) @comment
        (line_comment)* @comment
    ]
    .
    (field_declaration declarator: (variable_declarator name: (identifier) @name)) @definition.field
)

(
    [
        ((line_comment)* @comment)
        ((block_comment)* @comment)
    ]
    .
    (enum_declaration name: (_) @name body: (_) @body) @definition.enum
)

(
    [
        ((line_comment)* @comment)
        ((block_comment)* @comment)
    ]
    .
    (enum_constant name: (identifier) @name) @definition.enum_variant
)
`,
  JavaReferencesQuery = `
(method_invocation 
  name: (identifier) @name
) @reference

(type_identifier) @reference
`,
  JavaLocalReferencesQuery = `
(method_invocation 
  name: (identifier) @name
) @reference

(type_identifier) @reference
`;