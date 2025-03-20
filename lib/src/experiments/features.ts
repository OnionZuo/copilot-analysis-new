var _FilterSettingsToExpConfigs = class _FilterSettingsToExpConfigs {
  constructor(ctx) {
    this.ctx = ctx;
    this.cache = new LRUCacheMap(200);
  }
  async fetchExpConfig(settings) {
    let task = this.cache.get(settings.stringify());
    return task || (task = new Task(() => this.ctx.get(ExpConfigMaker).fetchExperiments(this.ctx, settings.toHeaders()), 1e3 * 60 * 60), this.cache.set(settings.stringify(), task)), task.run();
  }
  getCachedExpConfig(settings) {
    let task = this.cache.get(settings.stringify());
    return task == null ? void 0 : task.value();
  }
};

,__name(_FilterSettingsToExpConfigs, "FilterSettingsToExpConfigs");

,var FilterSettingsToExpConfigs = _FilterSettingsToExpConfigs,
  _Task = class _Task {
    constructor(producer, expirationMs = 1 / 0) {
      this.producer = producer;
      this.expirationMs = expirationMs;
    }
    async run() {
      return this.promise === void 0 && (this.promise = this.producer(), this.storeResult(this.promise).then(() => {
        this.expirationMs < 1 / 0 && this.promise !== void 0 && setTimeout(() => this.promise = void 0, this.expirationMs);
      })), this.promise;
    }
    async storeResult(promise) {
      try {
        this.result = await promise;
      } finally {
        this.result === void 0 && (this.promise = void 0);
      }
    }
    value() {
      return this.result;
    }
  };

,__name(_Task, "Task");

,var Task = _Task;

,function isCompletionsFiltersInfo(info) {
  return "uri" in info;
},__name(isCompletionsFiltersInfo, "isCompletionsFiltersInfo");

,var _Features = class _Features {
  constructor(ctx) {
    this.ctx = ctx;
    this.staticFilters = {};
    this.dynamicFilters = {};
    this.dynamicFilterGroups = [];
    this.upcomingDynamicFilters = {};
    this.assignments = new FilterSettingsToExpConfigs(this.ctx);
  }
  registerStaticFilters(filters) {
    Object.assign(this.staticFilters, filters);
  }
  registerDynamicFilter(filter, generator) {
    this.dynamicFilters[filter] = generator;
  }
  registerDynamicFilterGroup(generator) {
    this.dynamicFilterGroups.push(generator);
  }
  getDynamicFilterValues() {
    let values = {};
    for (let generator of this.dynamicFilterGroups) Object.assign(values, generator());
    for (let [filter, generator] of Object.entries(this.dynamicFilters)) values[filter] = generator();
    return values;
  }
  registerUpcomingDynamicFilter(filter, generator) {
    this.upcomingDynamicFilters[filter] = generator;
  }
  async updateExPValuesAndAssignments(filtersInfo, telemetryData = TelemetryData.createAndMarkAsIssued()) {
    var _a, _b, _c, _d, _e;
    if (telemetryData instanceof TelemetryWithExp) throw new Error("updateExPValuesAndAssignments should not be called with TelemetryWithExp");
    let repoInfo = filtersInfo && isCompletionsFiltersInfo(filtersInfo) ? extractRepoInfoInBackground(this.ctx, filtersInfo.uri) : void 0,
      repoNwo = (_a = tryGetGitHubNWO(repoInfo)) != null ? _a : "",
      dogFood = (_b = getDogFood(repoInfo)) != null ? _b : "",
      fileType = (_c = filtersInfo == null ? void 0 : filtersInfo.languageId) != null ? _c : "",
      model = getEngineRequestInfo(this.ctx).modelId,
      userKind = await getUserKind(this.ctx),
      customModel = await getTokenKeyValue(this.ctx, "ft"),
      orgs = await getTokenKeyValue(this.ctx, "ol"),
      customModelNames = await getTokenKeyValue(this.ctx, "cml"),
      copilotTrackingId = await getTokenKeyValue(this.ctx, "tid"),
      requestFilters = {
        "X-Copilot-Repository": repoNwo,
        "X-Copilot-FileType": fileType,
        "X-Copilot-UserKind": userKind,
        "X-Copilot-Dogfood": dogFood,
        "X-Copilot-Engine": model,
        "X-Copilot-CustomModel": customModel,
        "X-Copilot-Orgs": orgs,
        "X-Copilot-CustomModelNames": customModelNames,
        "X-Copilot-CopilotTrackingId": copilotTrackingId
      },
      granularityDirectory = this.getGranularityDirectory(),
      preGranularityFilters = this.makeFilterSettings(requestFilters),
      rememberedGranularityExtension = granularityDirectory.extendFilters(preGranularityFilters),
      expAccordingToRememberedExtension = await this.getExpConfig(rememberedGranularityExtension.newFilterSettings);
    granularityDirectory.update(preGranularityFilters, +((_d = expAccordingToRememberedExtension.variables.copilotbycallbuckets) != null ? _d : NaN), +((_e = expAccordingToRememberedExtension.variables.copilottimeperiodsizeinh) != null ? _e : NaN));
    let currentGranularityExtension = granularityDirectory.extendFilters(preGranularityFilters),
      filters = currentGranularityExtension.newFilterSettings,
      exp = await this.getExpConfig(filters),
      backgroundQueue = new Promise(resolve => setTimeout(resolve, _Features.upcomingDynamicFilterCheckDelayMs));
    for (let upcomingFilter of currentGranularityExtension.otherFilterSettingsToPrefetch) backgroundQueue = backgroundQueue.then(async () => {
      await new Promise(resolve => setTimeout(resolve, _Features.upcomingDynamicFilterCheckDelayMs)), this.getExpConfig(upcomingFilter);
    });
    return this.prepareForUpcomingFilters(filters), new TelemetryWithExp(telemetryData.properties, telemetryData.measurements, telemetryData.issuedTime, {
      filters: filters,
      exp: exp
    });
  }
  getGranularityDirectory() {
    if (!this.granularityDirectory) {
      let machineId = this.ctx.get(EditorSession).machineId;
      this.granularityDirectory = new GranularityDirectory(machineId, this.ctx.get(Clock));
    }
    return this.granularityDirectory;
  }
  makeFilterSettings(requestFilters) {
    return new FilterSettings({
      ...this.staticFilters,
      ...this.getDynamicFilterValues(),
      ...requestFilters
    });
  }
  async getExpConfig(settings) {
    try {
      return this.assignments.fetchExpConfig(settings);
    } catch (e) {
      return ExpConfig.createFallbackConfig(this.ctx, `Error fetching ExP config: ${String(e)}`);
    }
  }
  async prepareForUpcomingFilters(filters) {
    if (!(new Date().getMinutes() < 60 - _Features.upcomingTimeBucketMinutes)) for (let [filter, generator] of Object.entries(this.upcomingDynamicFilters)) await new Promise(resolve => setTimeout(resolve, _Features.upcomingDynamicFilterCheckDelayMs)), this.getExpConfig(filters.withChange(filter, generator()));
  }
  stringify() {
    var _a;
    let defaultExpConfig = this.assignments.getCachedExpConfig(new FilterSettings({}));
    return JSON.stringify((_a = defaultExpConfig == null ? void 0 : defaultExpConfig.variables) != null ? _a : {});
  }
  async getFallbackExpAndFilters() {
    let filters = this.makeFilterSettings({}),
      exp = await this.getExpConfig(filters);
    return {
      filters: filters,
      exp: exp
    };
  }
  disableLogProb(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotdisablelogprob) != null ? _a : !0;
  }
  overrideBlockMode(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotoverrideblockmode || void 0;
  }
  overrideNumGhostCompletions(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotoverridednumghostcompletions;
  }
  dropCompletionReasons(telemetryWithExp) {
    let reasons = telemetryWithExp.filtersAndExp.exp.variables.copilotdropcompletionreasons;
    if (reasons) return reasons.split(",");
  }
  showModelTeaserFeature(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.showmodelteaser) != null ? _a : !1;
  }
  customEngine(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotcustomengine) != null ? _a : "";
  }
  customEngineTargetEngine(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcustomenginetargetengine;
  }
  suffixPercent(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.CopilotSuffixPercent) != null ? _a : DEFAULT_SUFFIX_PERCENT;
  }
  suffixMatchThreshold(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotsuffixmatchthreshold) != null ? _a : DEFAULT_SUFFIX_MATCH_THRESHOLD;
  }
  cppHeaders(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotcppheaders) != null ? _a : !1;
  }
  relatedFilesVSCodeCSharp(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotrelatedfilesvscodecsharp) != null ? _a : !1;
  }
  relatedFilesVSCodeTypeScript(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotrelatedfilesvscodetypescript) != null ? _a : !1;
  }
  cppIncludeTraits(telemetryWithExp) {
    let includeTraits = telemetryWithExp.filtersAndExp.exp.variables.copilotcppIncludeTraits;
    if (includeTraits) return includeTraits.split(",");
  }
  cppMsvcCompilerArgumentFilter(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppMsvcCompilerArgumentFilter;
  }
  cppClangCompilerArgumentFilter(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppClangCompilerArgumentFilter;
  }
  cppGccCompilerArgumentFilter(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppGccCompilerArgumentFilter;
  }
  cppCompilerArgumentDirectAskMap(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppCompilerArgumentDirectAskMap;
  }
  relatedFilesVSCode(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotrelatedfilesvscode) != null ? _a : !1;
  }
  excludeOpenTabFilesCSharp(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotexcludeopentabfilescsharp) != null ? _a : !1;
  }
  excludeOpenTabFilesCpp(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotexcludeopentabfilescpp) != null ? _a : !1;
  }
  excludeOpenTabFilesTypeScript(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotexcludeopentabfilestypescript) != null ? _a : !1;
  }
  fallbackToOpenTabFilesWithNoRelatedFiles(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotfallbacktoopentabfiles) != null ? _a : !1;
  }
  contextProviders(telemetryWithExp) {
    var _a;
    let providers = (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotcontextproviders) != null ? _a : "";
    return providers ? providers.split(",").map(provider => provider.trim()) : [];
  }
  includeNeighboringFiles(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotincludeneighboringfiles) != null ? _a : !1;
  }
  maxPromptCompletionTokens(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.maxpromptcompletionTokens) != null ? _a : DEFAULT_MAX_PROMPT_LENGTH + DEFAULT_MAX_COMPLETION_LENGTH;
  }
  promptOrderListPreset(telemetryWithExp) {
    let expvalue = telemetryWithExp.filtersAndExp.exp.variables.copilotpromptorderlistpreset;
    return "default";
  }
  promptPriorityPreset(telemetryWithExp) {
    switch (telemetryWithExp.filtersAndExp.exp.variables.copilotpromptprioritypreset) {
      case "office-exp":
        return "office-exp";
      default:
        return "default";
    }
  }
  promptComponentsEnabled(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotpromptcomponents) != null ? _a : !1;
  }
  ideChatMaxRequestTokens(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.idechatmaxrequesttokens) != null ? _a : -1;
  }
  ideChatExpModelIds(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.idechatexpmodelids) != null ? _a : "";
  }
  ideChatEnableProjectMetadata(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.idechatenableprojectmetadata) != null ? _a : !1;
  }
  ideChatEnableProjectContext(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.idechatenableprojectcontext) != null ? _a : !1;
  }
  ideEnableCopilotEdits(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.ideenablecopilotedits) != null ? _a : !1;
  }
  ideChatProjectContextFileCountThreshold(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.idechatprojectcontextfilecountthreshold) != null ? _a : 0;
  }
  disableDebounce(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotdisabledebounce) != null ? _a : !1;
  }
  debounceThreshold(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotdebouncethreshold;
  }
  triggerCompletionAfterAccept(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilottriggercompletionafteraccept;
  }
  enableAsyncCompletions(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotasynccompletions) != null ? _a : !1;
  }
  enableSpeculativeRequests(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotspeculativerequests) != null ? _a : !1;
  }
  cppCodeSnippetsFeatures(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppcodesnippetsFeatureNames;
  }
  cppCodeSnippetsTimeBudgetFactor(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppcodesnippetsTimeBudgetFactor;
  }
  cppCodeSnippetsMaxDistanceToCaret(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotcppcodesnippetsMaxDistanceToCaret;
  }
  enableProgressiveReveal(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotprogressivereveal) != null ? _a : !1;
  }
  disableContextualFilter(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotdisablecontextualfilter) != null ? _a : !1;
  }
  vscodeDebounceThreshold(telemetryWithExp) {
    return telemetryWithExp.filtersAndExp.exp.variables.copilotvscodedebouncethreshold;
  }
  enableElectronFetcher(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotelectronfetcher) != null ? _a : !1;
  }
  asyncCompletionsTimeout(telemetryWithExp) {
    var _a;
    return (_a = telemetryWithExp.filtersAndExp.exp.variables.copilotasynccompletionstimeout) != null ? _a : 100;
  }
};

,__name(_Features, "Features"), _Features.upcomingDynamicFilterCheckDelayMs = 20, _Features.upcomingTimeBucketMinutes = 5 + Math.floor(Math.random() * 11);

,var Features = _Features;