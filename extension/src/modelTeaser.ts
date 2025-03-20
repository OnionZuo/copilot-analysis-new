var import_vscode = require("vscode");

,async function showModelTeaserIfNeeded(ctx) {
  let userAcknowledgedModelTeaserKey = "userAcknowledgedModelTeaser",
    changelogUrl = "https://gh.io/gpt-4o-copilot-changelog",
    telemetryData = await ctx.get(Features).updateExPValuesAndAssignments();
  async function isValidUserSKU() {
    let copilotToken = await ctx.get(CopilotTokenManager).getToken(),
      skuList = ["copilot_monthly_subscription", "free_educational", "free_limited_copilot", "monthly_subscriber", "yearly_subscriber", "trial_30_monthly_subscriber", "free_engaged_oss", "free_faculty", "trial_30_yearly_subscriber", "complimentary_access"],
      sku = copilotToken.getTokenValue("sku");
    return !!sku && skuList.includes(sku);
  }
  __name(isValidUserSKU, "isValidUserSKU");
  async function shouldShowNotification(ctx, featureSettings) {
    if (!ctx.get(Features).showModelTeaserFeature(featureSettings)) return !1;
    let userHasSelectedNonDefaultModel = !!getUserSelectedModelConfiguration(ctx),
      hasModelsAvailable = ctx.get(ModelPickerManager).shouldShowModelPicker,
      userAcknowledgedModel = ctx.get(Extension).context.globalState.get(userAcknowledgedModelTeaserKey);
    return userHasSelectedNonDefaultModel && !userAcknowledgedModel && hasModelsAvailable && (await isValidUserSKU());
  }
  __name(shouldShowNotification, "shouldShowNotification");
  async function showNotification(ctx) {
    let changeModelResponse = "Change model",
      moreInfoResponse = "More info",
      result = await pC.window.showInformationMessage("Try GPT-4o Copilot (Preview), a new code completion model with more recent knowledge and improved performance.", {
        modal: !1
      }, changeModelResponse, moreInfoResponse);
    result == changeModelResponse ? await pC.commands.executeCommand("github.copilot.openModelPicker") : result === moreInfoResponse && (await pC.env.openExternal(pC.Uri.parse(changelogUrl))), await ctx.get(Extension).context.globalState.update(userAcknowledgedModelTeaserKey, !0);
  }
  __name(showNotification, "showNotification"), (await shouldShowNotification(ctx, telemetryData)) && (await showNotification(ctx));
},__name(showModelTeaserIfNeeded, "showModelTeaserIfNeeded");

,var logger = new Logger("modelPicker"),
  _ModelPickerManager = class _ModelPickerManager {
    constructor(_ctx) {
      this._ctx = _ctx;
      this._ctx.get(AvailableModelsManager).addHandler(() => {
        g2.commands.executeCommand("setContext", CopilotModelPickerEnabled, this.shouldShowModelPicker);
      }), showModelTeaserIfNeeded(this._ctx);
    }
    get models() {
      return this._ctx.get(AvailableModelsManager).getGenericCompletionModels();
    }
    get shouldShowModelPicker() {
      return this.models.filter(model => model.modelId !== this.getDefaultModelId()).length > 0;
    }
    getDefaultModelId() {
      return this._ctx.get(AvailableModelsManager).getDefaultModelId();
    }
    async setUserSelectedCompletionModel(modelId) {
      return g2.workspace.getConfiguration(CopilotConfigPrefix).update(ConfigKey.UserSelectedCompletionModel, modelId != null ? modelId : "", !0);
    }
    async handleModelSelection(quickpickList) {
      let model = quickpickList.activeItems[0];
      model !== void 0 && (quickpickList.hide(), await this.selectModel(model));
    }
    async selectModel(model) {
      getUserSelectedModelConfiguration(this._ctx) !== model.modelId && (this._ctx.get(CompletionsCache).clear(), this._ctx.get(AsyncCompletionManager).clear());
      let modelSelection = model.modelId === this.getDefaultModelId() ? null : model.modelId;
      await this.setUserSelectedCompletionModel(modelSelection), modelSelection === null ? logger.info(this._ctx, "User selected default model; setting null") : logger.info(this._ctx, `Selected model: ${model.modelId}`), telemetry(this._ctx, "modelPicker.modelSelected", TelemetryData.createAndMarkAsIssued({
        engineName: modelSelection != null ? modelSelection : "default"
      }));
    }
    modelsForModelPicker() {
      let currentModelSelection = getUserSelectedModelConfiguration(this._ctx),
        items = this.models.map(model => ({
          modelId: model.modelId,
          label: `${model.label}${model.preview ? " (Preview)" : ""}`,
          description: `(${model.modelId})`,
          alwaysShow: model.modelId == this.getDefaultModelId()
        }));
      return [currentModelSelection, items];
    }
    async showModelPicker() {
      let [currentModelSelection, items] = this.modelsForModelPicker(),
        quickPick = g2.window.createQuickPick();
      quickPick.title = "Change Completions Model", quickPick.items = items, quickPick.onDidAccept(() => this.handleModelSelection(quickPick));
      let currentModelOrDefault = currentModelSelection != null ? currentModelSelection : this.getDefaultModelId(),
        selectedItem = quickPick.items.find(item => item.modelId === currentModelOrDefault);
      return selectedItem && (quickPick.activeItems = [selectedItem]), quickPick.show(), quickPick;
    }
    registerCommands() {
      registerCommandWrapper(this._ctx, CMDOpenModelPicker, this.showModelPicker.bind(this));
    }
  };

,__name(_ModelPickerManager, "ModelPickerManager");

,var ModelPickerManager = _ModelPickerManager;

,function registerModelPickerCommands(ctx) {
  ctx.get(ModelPickerManager).registerCommands();
},__name(registerModelPickerCommands, "registerModelPickerCommands");