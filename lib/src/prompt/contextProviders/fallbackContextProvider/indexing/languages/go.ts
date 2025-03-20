var _GoSymbolExtractor = class _GoSymbolExtractor extends SymbolExtractorBase {
  get languageId() {
    return "go";
  }
  extractSymbols(documentPath, code) {
    return this.executeQuery(documentPath, code, GoSymbolsQuery);
  }
  createNameFromScopes(code, scopes) {
    return scopes.map(scope => scope.nameRange.getText(code)).join(".");
  }
};

,__name(_GoSymbolExtractor, "GoSymbolExtractor");

,var GoSymbolExtractor = _GoSymbolExtractor,
  _GoReferenceExtractor = class _GoReferenceExtractor extends SymbolExtractorBase {
    get languageId() {
      return "go";
    }
    createNameFromScopes(code, scopes) {
      return scopes.length > 0 ? scopes[scopes.length - 1].nameRange.getText(code) : "";
    }
    extractReferences(documentPath, code) {
      return this.executeQuery(documentPath, code, GoReferencesQuery);
    }
    async extractLocalReferences(documentPath, code, selection) {
      let locals = await this.executeQuery(documentPath, code, GoLocalReferencesQuery),
        references = locals.filter(local => local.kind !== 9),
        methods = locals.filter(local => local.kind === 9 && local.extentRange.containsRange(selection)),
        result = [];
      for (let method of methods) result.push(...references.filter(r => method.extentRange.containsRange(r.extentRange)));
      return result;
    }
  };

,__name(_GoReferenceExtractor, "GoReferenceExtractor");

,var GoReferenceExtractor = _GoReferenceExtractor,
  GoSymbolsQuery = `
(
    ((comment)* @comment)
    .
    (type_declaration (type_spec name: (_) @name type: (struct_type (field_declaration_list) @body))) @definition.struct
)

(
    ((comment)* @comment)
    .
    (type_declaration (type_spec name: (_) @name type: (interface_type (_)) @body)) @definition.interface
)

(
    ((comment)* @comment)
    .
    (method_declaration receiver: (parameter_list (parameter_declaration type: [(type_identifier) @receiver (pointer_type (type_identifier) @receiver)] )) name: (_) @name body: (_) @body) @definition.method
)

(
    ((comment)* @comment)
    .
    (method_elem name: (_) @name) @definition.method
)

(
    ((comment)* @comment)
    .
    (function_declaration name: (_) @name) @definition.method
)

(
    ((comment)* @comment)
    .
    (field_declaration name: (_) @name) @definition.field
)
`,
  GoReferencesQuery = `
(call_expression function: (_) @name) @reference

(type_identifier) @reference
`,
  GoLocalReferencesQuery = `
(call_expression function: (_) @name) @reference

(type_identifier) @reference
`;