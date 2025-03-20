var CopilotRelatedPluginVersionPrefix = "X-Copilot-RelatedPluginVersion-",
  Filter = (te => (Filter.Market = "X-MSEdge-Market", Filter.CorpNet = "X-FD-Corpnet", Filter.Build = "X-VSCode-Build", Filter.ApplicationVersion = "X-VSCode-AppVersion", Filter.TargetPopulation = "X-VSCode-TargetPopulation", Filter.ClientId = "X-MSEdge-ClientId", Filter.ExtensionName = "X-VSCode-ExtensionName", Filter.ExtensionVersion = "X-VSCode-ExtensionVersion", Filter.ExtensionRelease = "X-VSCode-ExtensionRelease", Filter.Language = "X-VSCode-Language", Filter.CopilotClientTimeBucket = "X-Copilot-ClientTimeBucket", Filter.CopilotEngine = "X-Copilot-Engine", Filter.CopilotOverrideEngine = "X-Copilot-OverrideEngine", Filter.CopilotRepository = "X-Copilot-Repository", Filter.CopilotFileType = "X-Copilot-FileType", Filter.CopilotUserKind = "X-Copilot-UserKind", Filter.CopilotDogfood = "X-Copilot-Dogfood", Filter.CopilotCustomModel = "X-Copilot-CustomModel", Filter.CopilotOrgs = "X-Copilot-Orgs", Filter.CopilotCustomModelNames = "X-Copilot-CustomModelNames", Filter.CopilotTrackingId = "X-Copilot-CopilotTrackingId", Filter.CopilotRelatedPluginVersionCppTools = CopilotRelatedPluginVersionPrefix + "msvscodecpptools", Filter.CopilotRelatedPluginVersionCMakeTools = CopilotRelatedPluginVersionPrefix + "msvscodecmaketools", Filter.CopilotRelatedPluginVersionMakefileTools = CopilotRelatedPluginVersionPrefix + "msvscodemakefiletools", Filter.CopilotRelatedPluginVersionCSharpDevKit = CopilotRelatedPluginVersionPrefix + "msdotnettoolscsdevkit", Filter.CopilotRelatedPluginVersionPython = CopilotRelatedPluginVersionPrefix + "mspythonpython", Filter.CopilotRelatedPluginVersionPylance = CopilotRelatedPluginVersionPrefix + "mspythonvscodepylance", Filter.CopilotRelatedPluginVersionJavaPack = CopilotRelatedPluginVersionPrefix + "vscjavavscodejavapack", Filter.CopilotRelatedPluginVersionTypescript = CopilotRelatedPluginVersionPrefix + "vscodetypescriptlanguagefeatures", Filter.CopilotRelatedPluginVersionTypescriptNext = CopilotRelatedPluginVersionPrefix + "msvscodevscodetypescriptnext", Filter.CopilotRelatedPluginVersionCSharp = CopilotRelatedPluginVersionPrefix + "msdotnettoolscsharp", Filter))(i3 || {});

,var telmetryNames = {
    "X-Copilot-ClientTimeBucket": "timeBucket",
    "X-Copilot-OverrideEngine": "engine",
    "X-Copilot-Repository": "repo",
    "X-Copilot-FileType": "fileType",
    "X-Copilot-UserKind": "userKind"
  },
  _FilterSettings = class _FilterSettings {
    constructor(filters) {
      this.filters = filters;
      for (let [filter, value] of Object.entries(this.filters)) value === "" && delete this.filters[filter];
    }
    extends(otherFilterSettings) {
      for (let [filter, value] of Object.entries(otherFilterSettings.filters)) if (this.filters[filter] !== value) return !1;
      return !0;
    }
    addToTelemetry(telemetryData) {
      for (let [filter, value] of Object.entries(this.filters)) {
        let telemetryName = telmetryNames[filter];
        telemetryName !== void 0 && (telemetryData.properties[telemetryName] = value);
      }
    }
    stringify() {
      let keys = Object.keys(this.filters);
      return keys.sort(), keys.map(key => `${key}:${this.filters[key]}`).join(";");
    }
    toHeaders() {
      return {
        ...this.filters
      };
    }
    withChange(filter, value) {
      return new _FilterSettings({
        ...this.filters,
        [filter]: value
      });
    }
  };

,__name(_FilterSettings, "FilterSettings");

,var FilterSettings = _FilterSettings;