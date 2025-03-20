var _RemoteAgent = class _RemoteAgent {
  constructor(id, slug, name, description, avatarUrl, endpoint) {
    this.id = id;
    this.slug = slug;
    this.name = name;
    this.description = description;
    this.avatarUrl = avatarUrl;
    this.endpoint = endpoint;
  }
  async additionalSkills(ctx) {
    return [];
  }
  turnProcessor(turnContext) {
    return new RemoteAgentTurnProcessor(this, turnContext);
  }
};

,__name(_RemoteAgent, "RemoteAgent");

,var RemoteAgent = _RemoteAgent,
  _ExtensibilityPlatformAgent = class _ExtensibilityPlatformAgent extends RemoteAgent {
    constructor() {
      super(0, "github", "GitHub", "Get answers grounded in web search, code search, and your enterprise's knowledge bases.", "https://avatars.githubusercontent.com/u/9919?s=200&v=4", "chat");
    }
    turnProcessor(turnContext) {
      return new RemoteAgentTurnProcessor(this, turnContext);
    }
  };

,__name(_ExtensibilityPlatformAgent, "ExtensibilityPlatformAgent");

,var ExtensibilityPlatformAgent = _ExtensibilityPlatformAgent;