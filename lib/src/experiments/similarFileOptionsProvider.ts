var languageSimilarFilesOptions = new Map([["cpp", getCppSimilarFilesOptions]]);

,function getSimilarFilesOptions(ctx, exp, langId) {
  let optionsProvider = languageSimilarFilesOptions.get(langId);
  return optionsProvider ? optionsProvider(ctx, exp) : {
    ...defaultSimilarFilesOptions,
    useSubsetMatching: useSubsetMatching(ctx, exp)
  };
},__name(getSimilarFilesOptions, "getSimilarFilesOptions");

,var numberOfSnippets = new Map([["cpp", getCppNumberOfSnippets]]);

,function getNumberOfSnippets(exp, langId) {
  let provider = numberOfSnippets.get(langId);
  return provider ? provider(exp) : DEFAULT_NUM_SNIPPETS;
},__name(getNumberOfSnippets, "getNumberOfSnippets");

,function useSubsetMatching(ctx, telemetryWithExp) {
  var _a;
  return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotsubsetmatching || getConfig(ctx, ConfigKey.UseSubsetMatching)) != null ? _a : !1;
},__name(useSubsetMatching, "useSubsetMatching");