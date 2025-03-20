var Traits = __name((_props, context) => {
  let [traits, setTraits] = context.useState(),
    [languageId, setLanguageId] = context.useState();
  if (context.useData(isCompletionRequestData, data => {
    data.traits !== traits && setTraits(data.traits);
    let normalizedLanguageId = normalizeLanguageId(data.document.clientLanguageId);
    normalizedLanguageId !== languageId && setLanguageId(normalizedLanguageId);
  }), !(!traits || traits.length === 0 || !languageId)) return functionComponentFunction(fragmentFunction, {
    children: [functionComponentFunction(Text, {
      children: commentBlockAsSingles(`Consider this related information:
`, languageId)
    }), ...traits.map(trait => functionComponentFunction(Text, {
      source: trait,
      children: commentBlockAsSingles(`${trait.name}: ${trait.value}`, languageId)
    }, trait.id))]
  });
}, "Traits");