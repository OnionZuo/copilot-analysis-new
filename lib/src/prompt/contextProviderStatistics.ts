var _ContextProviderStatistics = class _ContextProviderStatistics {
  constructor() {
    this._prompt_lib_expectations = new Map();
    this._prompt_components_expectations = new Map();
    this._lastResolution = new Map();
    this._statistics = new Map();
  }
  addPromptLibExpectations(providerId, expectations) {
    var _a;
    let providerExpectations = (_a = this._prompt_lib_expectations.get(providerId)) != null ? _a : [];
    this._prompt_lib_expectations.set(providerId, [...providerExpectations, ...expectations]);
  }
  addPromptComponentsExpectations(providerId, expectations) {
    var _a;
    let providerExpectations = (_a = this._prompt_components_expectations.get(providerId)) != null ? _a : [];
    this._prompt_components_expectations.set(providerId, [...providerExpectations, ...expectations]);
  }
  clearExpectations() {
    this._prompt_lib_expectations.clear(), this._prompt_components_expectations.clear();
  }
  setLastResolution(providerId, resolution) {
    this._lastResolution.set(providerId, resolution);
  }
  get(providerId) {
    return this._statistics.get(providerId);
  }
  pop(providerId) {
    let statistics = this._statistics.get(providerId);
    if (statistics) return this._statistics.delete(providerId), statistics;
  }
  computeMatchWithPrompt(prompt) {
    var _a;
    try {
      for (let [providerId, expectations] of this._prompt_lib_expectations) {
        if (expectations.length === 0) continue;
        let resolution = (_a = this._lastResolution.get(providerId)) != null ? _a : "none";
        if (resolution === "none" || resolution === "error") {
          this._statistics.set(providerId, {
            usage: "none",
            resolution: resolution
          });
          continue;
        }
        let usedItems = 0,
          contentExcluded = !1;
        for (let expectation of expectations) {
          if (expectation == CONTENT_EXCLUDED_EXPECTATION) {
            contentExcluded = !0;
            continue;
          }
          prompt.includes(expectation) && usedItems++;
        }
        let usedPercentage = usedItems / expectations.length,
          usage;
        contentExcluded ? usage = usedPercentage === 0 ? "none_content_excluded" : "partial_content_excluded" : usage = usedPercentage === 1 ? "full" : usedPercentage === 0 ? "none" : "partial", this._statistics.set(providerId, {
          usage: usage,
          resolution: resolution
        });
      }
    } finally {
      this.clearExpectations(), this._lastResolution.clear();
    }
  }
  computeMatch(promptMatchers) {
    var _a;
    try {
      for (let [providerId, expectations] of this._prompt_components_expectations) {
        if (expectations.length === 0) continue;
        let resolution = (_a = this._lastResolution.get(providerId)) != null ? _a : "none";
        if (resolution === "none" || resolution === "error") {
          this._statistics.set(providerId, {
            usage: "none",
            resolution: resolution
          });
          continue;
        }
        let providerUsageDetails = [],
          contentExcluded = !1;
        for (let [item, expectation] of expectations) {
          let itemDetails = {
            id: item.id,
            type: item.type
          };
          if (item.origin && (itemDetails.origin = item.origin), expectation === "content_excluded") {
            contentExcluded = !0, providerUsageDetails.push({
              ...itemDetails,
              usage: "none_content_excluded"
            });
            continue;
          }
          let itemStatistics = promptMatchers.find(component => component.source === item);
          itemStatistics === void 0 ? providerUsageDetails.push({
            ...itemDetails,
            usage: "error"
          }) : providerUsageDetails.push({
            ...itemDetails,
            usage: itemStatistics.expectedTokens > 0 && itemStatistics.expectedTokens === itemStatistics.actualTokens ? "full" : itemStatistics.actualTokens > 0 ? "partial" : "none",
            expectedTokens: itemStatistics.expectedTokens,
            actualTokens: itemStatistics.actualTokens
          });
        }
        let usedPercentage = providerUsageDetails.reduce((acc, item) => item.usage === "full" ? acc + 1 : item.usage === "partial" ? acc + .5 : acc, 0) / expectations.length,
          usage;
        contentExcluded ? usage = usedPercentage === 0 ? "none_content_excluded" : "partial_content_excluded" : usage = usedPercentage === 1 ? "full" : usedPercentage === 0 ? "none" : "partial", this._statistics.set(providerId, {
          resolution: resolution,
          usage: usage,
          usageDetails: providerUsageDetails
        });
      }
    } finally {
      this.clearExpectations(), this._lastResolution.clear();
    }
  }
};

,__name(_ContextProviderStatistics, "ContextProviderStatistics");

,var ContextProviderStatistics = _ContextProviderStatistics;

,function componentStatisticsToPromptMatcher(promptComponentStatistics) {
  return promptComponentStatistics.map(component => {
    if (!(component.source === void 0 || component.expectedTokens === void 0 || component.actualTokens === void 0)) return {
      source: component.source,
      expectedTokens: component.expectedTokens,
      actualTokens: component.actualTokens
    };
  }).filter(p => p !== void 0);
},__name(componentStatisticsToPromptMatcher, "componentStatisticsToPromptMatcher");