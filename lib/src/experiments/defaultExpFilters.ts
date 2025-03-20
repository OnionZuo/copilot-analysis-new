var logger = new Logger("exp");

,function setupExperimentationService(ctx) {
  let features = ctx.get(Features);
  features.registerStaticFilters(createAllFilters(ctx)), features.registerDynamicFilter("X-Copilot-OverrideEngine", () => getConfig(ctx, ConfigKey.DebugOverrideEngine) || getConfig(ctx, ConfigKey.DebugOverrideEngineLegacy)), features.registerDynamicFilter("X-VSCode-ExtensionName", () => ctx.get(EditorAndPluginInfo).getEditorPluginInfo().name), features.registerDynamicFilter("X-VSCode-ExtensionVersion", () => trimVersionSuffix(!ctx.get(BuildInfo).isProduction() && ctx.get(EditorAndPluginInfo).getEditorPluginInfo().name === "copilot" ? "1.999.0" : ctx.get(EditorAndPluginInfo).getEditorPluginInfo().version)), features.registerDynamicFilter("X-VSCode-ExtensionRelease", () => getPluginRelease(ctx)), features.registerDynamicFilter("X-VSCode-Build", () => ctx.get(EditorAndPluginInfo).getEditorInfo().name), features.registerDynamicFilter("X-VSCode-AppVersion", () => trimVersionSuffix(ctx.get(EditorAndPluginInfo).getEditorInfo().version)), features.registerDynamicFilter("X-VSCode-TargetPopulation", () => getTargetPopulation(ctx)), features.registerDynamicFilterGroup(() => {
    let result = {};
    for (let plugin of ctx.get(EditorAndPluginInfo).getRelatedPluginInfo()) {
      let filterName = CopilotRelatedPluginVersionPrefix + plugin.name.replace(/[^A-Za-z]/g, "").toLowerCase();
      if (!Object.values(Filter).includes(filterName)) {
        telemetryExpProblem(ctx, {
          reason: `A filter could not be registered for the unrecognized related plugin "${plugin.name}".`
        });
        continue;
      }
      result[filterName] = trimVersionSuffix(plugin.version);
    }
    return result;
  });
},__name(setupExperimentationService, "setupExperimentationService");

,function getPluginRelease(ctx) {
  let editorPluginInfo = ctx.get(EditorAndPluginInfo).getEditorPluginInfo();
  return editorPluginInfo.name === "copilot" && getBuildType(ctx) === "nightly" || editorPluginInfo.name === "copilot-intellij" && editorPluginInfo.version.endsWith("nightly") ? "nightly" : "stable";
},__name(getPluginRelease, "getPluginRelease");

,function getTargetPopulation(ctx) {
  let editorInfo = ctx.get(EditorAndPluginInfo).getEditorInfo();
  return editorInfo.name === "vscode" && editorInfo.version.endsWith("-insider") ? "insider" : "public";
},__name(getTargetPopulation, "getTargetPopulation");

,function createAllFilters(ctx) {
  return createDefaultFilters(ctx);
},__name(createAllFilters, "createAllFilters");

,function createDefaultFilters(ctx) {
  let editorSession = ctx.get(EditorSession);
  return {
    "X-MSEdge-ClientId": editorSession.machineId
  };
},__name(createDefaultFilters, "createDefaultFilters");

,function trimVersionSuffix(version) {
  return version.split("-")[0];
},__name(trimVersionSuffix, "trimVersionSuffix");