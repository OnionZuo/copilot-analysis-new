var _InstallationManager = class _InstallationManager {
  async startup(ctx) {
    (await this.isNewInstall(ctx)) ? (await this.markInstalled(ctx), this.handleInstall(ctx, await this.wasPreviouslyInstalled(ctx))) : (await this.isNewUpgrade(ctx)) && (await this.markUpgraded(ctx), this.handleUpgrade(ctx));
  }
  async uninstall(ctx) {
    return await this.handleUninstall(ctx);
  }
  handleInstall(ctx, previouslyInstalled) {
    previouslyInstalled ? telemetry(ctx, "installed.reinstall") : telemetry(ctx, "installed.new");
  }
  handleUpgrade(ctx) {
    telemetry(ctx, "installed.upgrade");
  }
  async handleUninstall(ctx) {
    telemetry(ctx, "uninstalled");
  }
};

,__name(_InstallationManager, "InstallationManager");

,var InstallationManager = _InstallationManager;