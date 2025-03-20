var genericBuiltinTypeNames = new Set(["int", "str", "float", "bool", "list", "dict", "tuple", "set"]),
  _PythonSymbolExtractor = class _PythonSymbolExtractor extends SymbolExtractorBase {
    get languageId() {
      return "python";
    }
    extractSymbols(documentPath, code) {
      return this.executeQuery(documentPath, code, PythonSymbolsQuery);
    }
    createNameFromScopes(code, scopes) {
      return scopes.map(scope => scope.nameRange.getText(code)).join(".");
    }
  };

,__name(_PythonSymbolExtractor, "PythonSymbolExtractor");

,var PythonSymbolExtractor = _PythonSymbolExtractor,
  _PythonReferenceExtractor = class _PythonReferenceExtractor extends SymbolExtractorBase {
    get languageId() {
      return "python";
    }
    createNameFromScopes(code, scopes) {
      return scopes.length > 0 ? scopes[scopes.length - 1].nameRange.getText(code) : "";
    }
    async extractReferences(documentPath, code) {
      return (await this.executeQuery(documentPath, code, PythonReferencesQuery)).filter(e => !genericBuiltinTypeNames.has(e.unqualifiedName));
    }
    async extractLocalReferences(documentPath, code, selection) {
      let locals = await this.executeQuery(documentPath, code, PythonLocalReferencesQuery),
        references = locals.filter(local => local.kind !== 9),
        methods = locals.filter(local => local.kind === 9 && local.extentRange.containsRange(selection)),
        result = [];
      for (let method of methods) result.push(...references.filter(r => method.extentRange.containsRange(r.extentRange)));
      return result;
    }
  };

,__name(_PythonReferenceExtractor, "PythonReferenceExtractor");

,var PythonReferenceExtractor = _PythonReferenceExtractor,
  PythonSymbolsQuery = `
(
    ((comment)* @comment)
    .
    (class_definition name: (_) @name body: (_) @body) @definition.class
)

(
    ((comment)* @comment)
    .
    (function_definition name: (_) @name body: (_) @body) @definition.method
)
`,
  PythonReferencesQuery = `
(call function: (_) @name) @reference

(type [  
    (identifier)* @name  
    (_ (identifier) @name)* 
]) @reference

(class_definition superclasses: (argument_list (identifier) @name)) @reference
`,
  PythonLocalReferencesQuery = `
(call function: (_) @name) @reference

(type [  
    (identifier)* @name  
    (_ (identifier) @name)* 
])  @reference

(class_definition superclasses: (argument_list (identifier) @name)) @reference
`;