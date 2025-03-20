var CppCodeSnippetsEnabledFeatures = "CppCodeSnippetsEnabledFeatures",
  CppCodeSnippetsTimeBudgetFactor = "CppCodeSnippetsTimeBudgetFactor",
  CppCodeSnippetsMaxDistanceToCaret = "CppCodeSnippetsMaxDistanceToCaret";

,function fillInCppActiveExperiments(ctx, activeExperiments, telemetryData) {
  try {
    let cppCodeSnippetsFeature = ctx.get(Features).cppCodeSnippetsFeatures(telemetryData);
    if (cppCodeSnippetsFeature) {
      activeExperiments.set(CppCodeSnippetsEnabledFeatures, cppCodeSnippetsFeature);
      let cppCodeSnippetsTimeBudgetFactor = ctx.get(Features).cppCodeSnippetsTimeBudgetFactor(telemetryData);
      cppCodeSnippetsTimeBudgetFactor && activeExperiments.set(CppCodeSnippetsTimeBudgetFactor, cppCodeSnippetsTimeBudgetFactor);
      let cppCodeSnippetsMaxDistanceToCaret = ctx.get(Features).cppCodeSnippetsMaxDistanceToCaret(telemetryData);
      cppCodeSnippetsMaxDistanceToCaret && activeExperiments.set(CppCodeSnippetsMaxDistanceToCaret, cppCodeSnippetsMaxDistanceToCaret);
    }
  } catch (e) {
    return logger.debug(ctx, `Failed to get the active C++ Code Snippets experiments for the Context Provider API: ${e}`), !1;
  }
  return !0;
},__name(fillInCppActiveExperiments, "fillInCppActiveExperiments");