var _ProjectAgent = class _ProjectAgent {
  constructor() {
    this.slug = "project";
    this.name = "Project";
    this.description = "Ask about your project";
  }
  async additionalSkills(ctx) {
    return [ProjectContextSkillId];
  }
};

,__name(_ProjectAgent, "ProjectAgent");

,var ProjectAgent = _ProjectAgent;

,async function getAgents(ctx) {
  let agents = [];
  agents.push(new ExtensibilityPlatformAgent()), agents.push(...(await ctx.get(RemoteAgentRegistry).agents()));
  let features = ctx.get(Features),
    telemetryDataWithExp = await features.updateExPValuesAndAssignments();
  return features.ideChatEnableProjectContext(telemetryDataWithExp) && agents.push(new ProjectAgent()), agents;
},__name(getAgents, "getAgents");