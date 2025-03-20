async function getTraitsFromContextItems(ctx, resolvedContextItems) {
  let traitsContextItems = filterContextItemsByType(resolvedContextItems, "Trait");
  for (let item of traitsContextItems) setupExpectationsForTraits(ctx, item.data, item.providerId);
  return traitsContextItems.flatMap(p => p.data).sort((a, b) => {
    var _a, _b;
    return ((_a = a.importance) != null ? _a : 0) - ((_b = b.importance) != null ? _b : 0);
  });
},__name(getTraitsFromContextItems, "getTraitsFromContextItems");

,function setupExpectationsForTraits(ctx, traits, providerId) {
  let statistics = ctx.get(ContextProviderStatistics);
  traits.forEach(t => {
    statistics.addPromptLibExpectations(providerId, [t.value]), statistics.addPromptComponentsExpectations(providerId, [[t, "included"]]);
  });
},__name(setupExpectationsForTraits, "setupExpectationsForTraits");

,function convertTraitsToRelatedFileTraits(traits) {
  return traits.map(trait => ({
    ...trait,
    includeInPrompt: !0
  }));
},__name(convertTraitsToRelatedFileTraits, "convertTraitsToRelatedFileTraits");

,function addKindToRelatedFileTrait(trait) {
  return trait.promptTextOverride ? {
    kind: "string",
    value: trait.promptTextOverride
  } : {
    kind: "name-value",
    name: trait.name,
    value: trait.value
  };
},__name(addKindToRelatedFileTrait, "addKindToRelatedFileTrait");