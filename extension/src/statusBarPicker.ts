var import_vscode = require("vscode");

,var _CopilotStatusBarPickMenu = class _CopilotStatusBarPickMenu {
  constructor(ctx) {
    this.ctx = ctx;
    this.state = ctx.get(CopilotExtensionStatus);
  }
  showStatusMenu() {
    let quickpickList = Xk.window.createQuickPick();
    return quickpickList.placeholder = "Select an option", quickpickList.title = "Configure Copilot Completions", quickpickList.items = this.collectQuickPickItems(), quickpickList.onDidAccept(() => this.handleItemSelection(quickpickList)), quickpickList.show(), quickpickList;
  }
  async handleItemSelection(quickpickList) {
    let selection = quickpickList.selectedItems[0];
    if (selection !== void 0) if ("command" in selection) {
      let commandSelection = selection;
      await Xk.commands.executeCommand(commandSelection.command, ...commandSelection.commandArgs), quickpickList.hide();
    } else throw new Error("Unexpected Copilot quick picker selection");
  }
  collectQuickPickItems() {
    return [this.newStatusItem(), this.newSeparator(), ...this.collectLanguageSpecificItems(), this.newKeyboardItem(), this.newSettingsItem(), this.newDiagnosticsItem(), this.newOpenLogsItem(), this.newSeparator(), this.newDocsItem(), this.newForumItem(), ...this.collectQuickPickSignInItems()];
  }
  collectQuickPickSignInItems() {
    return this.hasWarningOrErrorStatus() ? [this.newSeparator(), this.newSignInItem()] : [];
  }
  collectLanguageSpecificItems() {
    let items = [];
    if (!this.hasActiveStatus()) return items;
    let editor = Xk.window.activeTextEditor;
    return editor && items.push(this.newPanelItem()), items.push(...this.newChangeModelItem()), editor && items.push(...this.newEnableLanguageItem()), items.length && items.push(this.newSeparator()), items;
  }
  hasActiveStatus() {
    return ["Normal"].includes(this.state.kind);
  }
  hasWarningOrErrorStatus() {
    return ["Error", "Warning"].includes(this.state.kind);
  }
  isCompletionEnabled() {
    return isInlineSuggestEnabled() && isCompletionEnabled(this.ctx);
  }
  newEnableLanguageItem() {
    let isEnabled = this.isCompletionEnabled();
    return isEnabled ? [this.newCommandItem("Disable Completions", CMDDisableCompletions)] : isEnabled === !1 ? [this.newCommandItem("Enable Completions", CMDEnableCompletions)] : [];
  }
  newStatusItem() {
    let statusText,
      statusIcon = "$(copilot)";
    switch (this.state.kind) {
      case "Normal":
        statusText = "Ready", isInlineSuggestEnabled() === !1 ? statusText += " (VS Code inline suggestions disabled)" : isCompletionEnabled(this.ctx) === !1 && (statusText += " (Disabled)");
        break;
      case "Inactive":
        statusText = this.state.message || "Copilot is currently inactive", statusIcon = "$(copilot-blocked)";
        break;
      default:
        statusText = this.state.message || "Copilot has encountered an error", statusIcon = "$(copilot-not-connected)";
        break;
    }
    return this.newCommandItem(`${statusIcon} Status: ${statusText}`, CMDOpenLogs);
  }
  newSignInItem() {
    return this.newCommandItem("Sign in to GitHub", CMDSignIn);
  }
  newOpenLogsItem() {
    return this.newCommandItem("Open Logs...", CMDOpenLogs);
  }
  newDiagnosticsItem() {
    return this.newCommandItem("Show Diagnostics...", CMDCollectDiagnostics);
  }
  newKeyboardItem() {
    return this.newCommandItem("$(keyboard) Edit Keyboard Shortcuts...", "workbench.action.openGlobalKeybindings", ["copilot"]);
  }
  newSettingsItem() {
    return this.newCommandItem("$(settings-gear) Edit Settings...", "workbench.action.openSettings", ["GitHub Copilot"]);
  }
  newPanelItem() {
    return this.newCommandItem("Open Completions Panel...", CMDOpenPanel);
  }
  newChangeModelItem() {
    return this.ctx.get(ModelPickerManager).shouldShowModelPicker ? [this.newCommandItem("Change Completions Model...", CMDOpenModelPicker)] : [];
  }
  newForumItem() {
    return this.newCommandItem("$(comments-view-icon) View Copilot Forum...", CMDSendFeedback);
  }
  newDocsItem() {
    return this.newCommandItem("$(remote-explorer-documentation) View Copilot Documentation...", CMDOpenDocumentation);
  }
  newCommandItem(label, command, commandArgs) {
    return new CommandQuickItem(label, command, commandArgs || []);
  }
  newSeparator() {
    return {
      label: "",
      kind: Xk.QuickPickItemKind.Separator
    };
  }
};

,__name(_CopilotStatusBarPickMenu, "CopilotStatusBarPickMenu");

,var CopilotStatusBarPickMenu = _CopilotStatusBarPickMenu,
  _CommandQuickItem = class _CommandQuickItem {
    constructor(label, command, commandArgs) {
      this.label = label;
      this.command = command;
      this.commandArgs = commandArgs;
    }
  };

,__name(_CommandQuickItem, "CommandQuickItem");

,var CommandQuickItem = _CommandQuickItem;