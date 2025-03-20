var import_semver = fn(dU());

,var _VsCodeInstallationManager = class _VsCodeInstallationManager extends InstallationManager {
  async isNewInstall(ctx) {
    return !ctx.get(Extension).context.globalState.get("installedVersion") && !(await getExistingSession());
  }
  async markInstalled(ctx) {
    let info = ctx.get(EditorAndPluginInfo).getEditorPluginInfo();
    await ctx.get(Extension).context.globalState.update("installedVersion", info.version);
  }
  async wasPreviouslyInstalled(ctx) {
    return !1;
  }
  async isNewUpgrade(ctx) {
    let current = ctx.get(EditorAndPluginInfo).getEditorPluginInfo(),
      last = ctx.get(Extension).context.globalState.get("installedVersion");
    if (last === void 0) return !0;
    try {
      return (0, AF.gt)((0, AF.coerce)(current.version), (0, AF.coerce)(last));
    } catch {
      return !1;
    }
  }
  async markUpgraded(ctx) {
    await this.markInstalled(ctx);
  }
};

,__name(_VsCodeInstallationManager, "VsCodeInstallationManager");

,var VsCodeInstallationManager = _VsCodeInstallationManager;