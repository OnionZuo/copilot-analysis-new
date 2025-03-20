function getCppSimilarFilesOptions(ctx, telemetryWithExp) {
  return {
    ...defaultCppSimilarFilesOptions,
    useSubsetMatching: useSubsetMatching(ctx, telemetryWithExp)
  };
},__name(getCppSimilarFilesOptions, "getCppSimilarFilesOptions");

,function getCppNumberOfSnippets(telemetryWithExp) {
  return defaultCppSimilarFilesOptions.maxTopSnippets;
},__name(getCppNumberOfSnippets, "getCppNumberOfSnippets");