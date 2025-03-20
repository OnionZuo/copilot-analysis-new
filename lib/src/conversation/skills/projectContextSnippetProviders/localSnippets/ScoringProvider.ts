var _ScoringProvider = class _ScoringProvider {
  constructor() {
    this.workspaceScoringProviders = new LRUCacheMap(25);
  }
  createImplementation(ctx, type) {
    let algorithmCtor = getScoringAlgorithm(type);
    return new algorithmCtor();
  }
  getImplementation(ctx, workspaceFolder, type = "default") {
    let provider = this.workspaceScoringProviders.get(workspaceFolder);
    return provider || (provider = this.createImplementation(ctx, type), this.workspaceScoringProviders.set(workspaceFolder, provider)), provider;
  }
  score(ctx, workspaceFolder, vector1, vector2, type) {
    return this.getImplementation(ctx, workspaceFolder, type).score(vector1, vector2);
  }
  terminateScoring(ctx, workspaceFolder, type) {
    this.getImplementation(ctx, workspaceFolder, type).terminateScoring(), this.workspaceScoringProviders.delete(workspaceFolder);
  }
};

,__name(_ScoringProvider, "ScoringProvider");

,var ScoringProvider = _ScoringProvider;