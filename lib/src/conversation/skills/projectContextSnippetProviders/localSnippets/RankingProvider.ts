var _RankingProvider = class _RankingProvider {
  constructor() {
    this.workspaceRankingProviders = new LRUCacheMap(25);
  }
  createImplementation(ctx, workspaceFolder, type) {
    let algorithmCtor = getRankingAlgorithm(type);
    return new algorithmCtor(ctx, workspaceFolder);
  }
  getImplementation(ctx, workspaceFolder, type = "default") {
    let provider = this.workspaceRankingProviders.get(workspaceFolder);
    return provider || (provider = this.createImplementation(ctx, workspaceFolder, type), this.workspaceRankingProviders.set(workspaceFolder, provider)), provider;
  }
  status(ctx, workspaceFolder, type) {
    return this.getImplementation(ctx, workspaceFolder, type).status;
  }
  async initialize(ctx, workspaceFolder, chunks, type = "default") {
    await this.getImplementation(ctx, workspaceFolder, type).initialize(chunks);
  }
  async addChunks(ctx, workspaceFolder, chunks, type = "default") {
    await this.getImplementation(ctx, workspaceFolder, type).addChunks(chunks);
  }
  async query(ctx, workspaceFolder, queries, type) {
    return this.getImplementation(ctx, workspaceFolder, type).query(queries);
  }
  async terminateRanking(ctx, workspaceFolder, type) {
    await this.getImplementation(ctx, workspaceFolder, type).terminateRanking(), this.workspaceRankingProviders.delete(workspaceFolder);
  }
  deleteEmbeddings(ctx, workspaceFolder, chunks, type) {
    return this.getImplementation(ctx, workspaceFolder, type).deleteEmbeddings(chunks);
  }
};

,__name(_RankingProvider, "RankingProvider");

,var RankingProvider = _RankingProvider;