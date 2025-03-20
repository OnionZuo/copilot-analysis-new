var _ContextItemSchema = Type.Object({
    importance: Type.Optional(Type.Integer({
      minimum: 0,
      maximum: 100
    })),
    id: Type.Optional(Type.String()),
    origin: Type.Optional(Type.Union([Type.Literal("request"), Type.Literal("update")]))
  }),
  _TraitSchema = Type.Intersect([Type.Object({
    name: Type.String(),
    value: Type.String()
  }), _ContextItemSchema]),
  _CodeSnippetSchema = Type.Intersect([Type.Object({
    uri: Type.String(),
    value: Type.String(),
    additionalUris: Type.Optional(Type.Array(Type.String()))
  }), _ContextItemSchema]),
  _SupportedContextItemSchema = [_TraitSchema, _CodeSnippetSchema],
  _SupportedContextItemSchemaUnion = Type.Union(_SupportedContextItemSchema),
  supportedContextItemValidators = new Map([["Trait", TypeCompiler.Compile(_TraitSchema)], ["CodeSnippet", TypeCompiler.Compile(_CodeSnippetSchema)]]),
  ensureTypesAreEqual = __name(x => x, "ensureTypesAreEqual");

,ensureTypesAreEqual(!0);

,var ContextProviderSupportedContext = Type.Object({
    contextItems: Type.Array(_SupportedContextItemSchemaUnion)
  }),
  ContextProviderSelectorPartialSchema = Type.Object({
    selector: Type.Array(Type.Union([Type.String(), Type.Object({
      language: Type.Optional(Type.String()),
      scheme: Type.Optional(Type.String()),
      pattern: Type.Optional(Type.String())
    })]))
  }),
  BaseContextProviderSchema = Type.Object({
    id: Type.String()
  }),
  RegistrationContextProviderSchema = Type.Intersect([BaseContextProviderSchema, ContextProviderSelectorPartialSchema]),
  CompletionContextProviderSchema = Type.Intersect([BaseContextProviderSchema, ContextProviderSupportedContext]),
  ContextProviderRegistrationSchema = Type.Object({
    providers: Type.Array(RegistrationContextProviderSchema)
  }),
  ContextProviderUnregisterSchema = Type.Object({
    providers: Type.Array(BaseContextProviderSchema)
  }),
  LspContextItemSchema = Type.Object({
    providers: Type.Array(CompletionContextProviderSchema),
    updating: Type.Optional(Type.Array(Type.String()))
  }),
  CopilotInlineCompletionWithContextItemsSchema = Type.Intersect([CopilotInlineCompletionSchema, Type.Object({
    contextItems: Type.Optional(LspContextItemSchema)
  })]);

,function filterContextItemsByType(resolvedContextItems, type) {
  return resolvedContextItems.map(item => {
    let filteredData = item.data.filter(data => data.type === type);
    return filteredData.length > 0 ? {
      ...item,
      data: filteredData
    } : void 0;
  }).filter(r => r !== void 0);
},__name(filterContextItemsByType, "filterContextItemsByType");

,function filterSupportedContextItems(contextItems) {
  let filteredItems = [],
    invalidItemsCounter = 0;
  return contextItems.forEach(item => {
    let matched = !1;
    for (let [type, validator] of supportedContextItemValidators.entries()) if (validator.Check(item)) {
      filteredItems.push({
        ...item,
        type: type
      }), matched = !0;
      break;
    }
    matched || invalidItemsCounter++;
  }), [filteredItems, invalidItemsCounter];
},__name(filterSupportedContextItems, "filterSupportedContextItems");

,function validateContextItemId(id) {
  return id.length > 0 && id.replaceAll(/[^a-zA-Z0-9-]/g, "").length === id.length;
},__name(validateContextItemId, "validateContextItemId");

,function addOrValidateContextItemsIDs(ctx, contextItems) {
  var _a;
  let seenIds = new Set(),
    contextItemsWithId = [];
  for (let item of contextItems) {
    let id = (_a = item.id) != null ? _a : v4_default();
    if (!validateContextItemId(id)) {
      let newID = v4_default();
      logger.error(ctx, `Invalid context item ID ${id}, replacing with ${newID}`), id = newID;
    }
    if (seenIds.has(id)) {
      let newID = v4_default();
      logger.error(ctx, `Duplicate context item ID ${id}, replacing with ${newID}`), id = newID;
    }
    seenIds.add(id), contextItemsWithId.push({
      ...item,
      id: id
    });
  }
  return contextItemsWithId;
},__name(addOrValidateContextItemsIDs, "addOrValidateContextItemsIDs");