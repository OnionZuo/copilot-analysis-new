var FallbackModelId = "copilot-codex",
  PreReleaseModelId = "gpt-4o-copilot",
  _AvailableModelsManager = class _AvailableModelsManager {
    constructor(_ctx, shouldFetch = !0) {
      this._ctx = _ctx;
      this.onModelsFetchedCallbacks = [];
      this.fetchedModelData = [];
      this.customModels = [];
      this.editorPreviewFeaturesDisabled = !1;
      shouldFetch && onCopilotToken(this._ctx, t => this.refreshAvailableModels(t));
    }
    async refreshAvailableModels(token) {
      await this.refreshModels(token);
      for (let callback of this.onModelsFetchedCallbacks) callback();
    }
    addHandler(handler) {
      this.onModelsFetchedCallbacks.push(handler);
    }
    getDefaultModelId() {
      if (this.fetchedModelData) {
        let fetchedDefaultModel = _AvailableModelsManager.filterCompletionModels(this.fetchedModelData, this.editorPreviewFeaturesDisabled)[0];
        if (fetchedDefaultModel) return fetchedDefaultModel.id;
      }
      return FallbackModelId;
    }
    parseModelsResponse(json) {
      try {
        return value_exports.Parse(ModelsMetadataSchema, json);
      } catch (error) {
        logger.exception(this._ctx, error, "Failed to parse /models response from CAPI");
        return;
      }
    }
    async refreshModels(token) {
      let fetchedData = await this.fetchModels(token);
      fetchedData && (this.fetchedModelData = fetchedData);
    }
    async fetchModels(token) {
      var _a, _b;
      return this.customModels = (_b = (_a = token.getTokenValue("cml")) == null ? void 0 : _a.split(",")) != null ? _b : [], this.editorPreviewFeaturesDisabled = token.getTokenValue("editor_preview_features") == "0", await this.fetch();
    }
    async fetch() {
      var _a, _b;
      let response = await fetchCapiUrl(this._ctx, "/models");
      return response.ok ? (_b = (_a = this.parseModelsResponse(await response.json())) == null ? void 0 : _a.data) != null ? _b : [] : (logger.error(this._ctx, "Failed to fetch models from CAPI", {
        status: response.status,
        statusText: response.statusText
      }), null);
    }
    getGenericCompletionModels() {
      let filteredResult = _AvailableModelsManager.filterCompletionModels(this.fetchedModelData, this.editorPreviewFeaturesDisabled);
      return _AvailableModelsManager.mapCompletionModels(filteredResult);
    }
    static filterCompletionModels(data, editorPreviewFeaturesDisabled) {
      return data.filter(item => item.capabilities.type === "completion").filter(item => !editorPreviewFeaturesDisabled || item.preview === !1 || item.preview === void 0);
    }
    static mapCompletionModels(data) {
      return data.map(item => ({
        modelId: item.id,
        label: item.name,
        preview: !!item.preview
      }));
    }
    getCurrentModelRequestInfo(featureSettings = void 0) {
      let defaultModelId = this.getDefaultModelId(),
        userSelectedCompletionModel = getUserSelectedModelConfiguration(this._ctx);
      if (userSelectedCompletionModel) {
        let genericModels = this.getGenericCompletionModels().map(model => model.modelId);
        genericModels.includes(userSelectedCompletionModel) || (genericModels.length > 0 && logger.error(this._ctx, `User selected model ${userSelectedCompletionModel} is not in the list of generic models: ${genericModels.join(", ")}, falling back to default model.`), userSelectedCompletionModel = null);
      }
      let debugOverride = getConfig(this._ctx, ConfigKey.DebugOverrideEngine) || getConfig(this._ctx, ConfigKey.DebugOverrideEngineLegacy);
      if (debugOverride) return new ModelRequestInfo(debugOverride, defaultModelId === debugOverride, "override");
      let customEngine = featureSettings ? this._ctx.get(Features).customEngine(featureSettings) : "",
        targetEngine = featureSettings ? this._ctx.get(Features).customEngineTargetEngine(featureSettings) : void 0;
      if (userSelectedCompletionModel) return customEngine && targetEngine && userSelectedCompletionModel === targetEngine ? new ModelRequestInfo(customEngine, defaultModelId === customEngine, "exp") : new ModelRequestInfo(userSelectedCompletionModel, defaultModelId === userSelectedCompletionModel, "modelpicker");
      if (customEngine) return new ModelRequestInfo(customEngine, defaultModelId === customEngine, "exp");
      if (isPreRelease(this._ctx) && !this.editorPreviewFeaturesDisabled) {
        let forcedModel = PreReleaseModelId;
        if (this.getGenericCompletionModels().map(model => model.modelId).includes(forcedModel)) return new ModelRequestInfo(forcedModel, !1, "prerelease");
      }
      return this.customModels.length > 0 ? new ModelRequestInfo(this.customModels[0], !1, "custommodel") : new ModelRequestInfo(defaultModelId, !1, "default");
    }
  };

,__name(_AvailableModelsManager, "AvailableModelsManager");

,var AvailableModelsManager = _AvailableModelsManager,
  _ModelRequestInfo = class _ModelRequestInfo {
    constructor(modelId, forceBaseModel = !1, modelChoiceSource) {
      this.modelId = modelId;
      this.forceBaseModel = forceBaseModel;
      this.modelChoiceSource = modelChoiceSource;
    }
    get path() {
      return `/v1/engines/${encodeURIComponent(this.modelId)}`;
    }
    get headers() {
      return this.forceBaseModel ? {
        "X-Custom-Model": "disable"
      } : {};
    }
  };

,__name(_ModelRequestInfo, "ModelRequestInfo");

,var ModelRequestInfo = _ModelRequestInfo;