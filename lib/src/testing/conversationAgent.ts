var _TestRemoteAgentRegistry = class _TestRemoteAgentRegistry extends RemoteAgentRegistry {
  constructor(_agents = []) {
    super();
    this._agents = _agents;
  }
  async agents() {
    return this._agents;
  }
};

,__name(_TestRemoteAgentRegistry, "TestRemoteAgentRegistry");

,var TestRemoteAgentRegistry = _TestRemoteAgentRegistry;