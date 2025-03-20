var _TelemetryUserConfig = class _TelemetryUserConfig {
  constructor(ctx, trackingId, optedIn, ftFlag) {
    this.trackingId = trackingId, this.optedIn = optedIn != null ? optedIn : !1, this.ftFlag = ftFlag != null ? ftFlag : "", this.setupUpdateOnToken(ctx);
  }
  setupUpdateOnToken(ctx) {
    onCopilotToken(ctx, copilotToken => {
      var _a;
      let restrictedTelemetry = copilotToken.getTokenValue("rt") === "1",
        ftFlag = (_a = copilotToken.getTokenValue("ft")) != null ? _a : "",
        trackingId = copilotToken.getTokenValue("tid"),
        organizationsList = copilotToken.organization_list,
        enterpriseList = copilotToken.enterprise_list,
        sku = copilotToken.getTokenValue("sku");
      trackingId !== void 0 && (this.trackingId = trackingId, this.organizationsList = organizationsList == null ? void 0 : organizationsList.toString(), this.enterpriseList = enterpriseList == null ? void 0 : enterpriseList.toString(), this.sku = sku, this.optedIn = restrictedTelemetry, this.ftFlag = ftFlag);
    });
  }
};

,__name(_TelemetryUserConfig, "TelemetryUserConfig");

,var TelemetryUserConfig = _TelemetryUserConfig;