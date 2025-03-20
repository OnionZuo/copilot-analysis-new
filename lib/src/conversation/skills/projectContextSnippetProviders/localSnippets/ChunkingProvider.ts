var _ChunkingProvider = class _ChunkingProvider {
  constructor(ctx) {
    this.ctx = ctx;
    this.workspaceChunkingProviders = new Map();
  }
  get workspaceCount() {
    return this.workspaceChunkingProviders.size;
  }
  createImplementation(workspaceFolder, type) {
    let algorithmCtor = getChunkingAlgorithm(type),
      implementation = new algorithmCtor();
    return new ChunkingHandler(this.ctx, workspaceFolder, implementation);
  }
  getImplementation(workspaceFolder, type = "default") {
    let parentFolder = this.getParentFolder(workspaceFolder);
    if (parentFolder) return this.workspaceChunkingProviders.get(parentFolder);
    let provider = this.workspaceChunkingProviders.get(workspaceFolder);
    return provider || (provider = this.createImplementation(workspaceFolder, type), this.workspaceChunkingProviders.set(workspaceFolder, provider)), provider;
  }
  getParentFolder(workspaceFolder) {
    return [...this.workspaceChunkingProviders.keys()].find(folder => {
      let parentFolder = folder.replace(/[#?].*/, "").replace(/\/?$/, "/");
      return workspaceFolder !== folder && workspaceFolder.startsWith(parentFolder);
    });
  }
  status(workspaceFolder) {
    return this.getImplementation(workspaceFolder).status;
  }
  checkLimits(workspaceFolder) {
    let impl = this.getImplementation(workspaceFolder);
    return {
      fileCountExceeded: impl.fileCountExceeded,
      chunkCountExceeded: impl.chunkCountExceeded
    };
  }
  fileCount(workspaceFolder) {
    return this.getImplementation(workspaceFolder).getFilesCount();
  }
  chunkCount(workspaceFolder) {
    return this.getImplementation(workspaceFolder).getChunksCount();
  }
  chunkingTimeMs(workspaceFolder) {
    return this.getImplementation(workspaceFolder).chunkingTimeMs;
  }
  getChunks(workspaceFolder) {
    return this.getImplementation(workspaceFolder).getChunks();
  }
  async terminateChunking(ctx, workspaceFolder) {
    let impl = this.getImplementation(workspaceFolder);
    await impl.terminateChunking();
    let telemetryData = TelemetryData.createAndMarkAsIssued().extendedBy(void 0, {
      fileCount: impl.filesUpdatedCount
    });
    telemetry(ctx, "index.terminate", telemetryData), this.workspaceChunkingProviders.delete(workspaceFolder);
  }
  async clearChunks(ctx, workspaceFolder) {
    await this.terminateChunking(ctx, workspaceFolder), await this.getImplementation(workspaceFolder).clearChunks();
  }
  async deleteSubfolderChunks(parentFolder, workspaceFolder) {
    return await this.getImplementation(parentFolder).deleteSubfolderChunks(workspaceFolder);
  }
  async deleteFileChunks(workspaceFolder, filepaths) {
    let impl = this.getImplementation(workspaceFolder),
      chunks = [];
    Array.isArray(filepaths) || (filepaths = [filepaths]);
    for (let filepath of filepaths) chunks.push(...(await impl.deleteFileChunks(filepath)));
    return chunks;
  }
  async chunk(ctx, workspaceFolder, documentsOrType, type) {
    let documents;
    return documentsOrType && (Array.isArray(documentsOrType) ? documents = documentsOrType : type = documentsOrType), type || (type = "default"), documents ? await this.chunkFiles(ctx, workspaceFolder, documents, type) : await this.chunkFolder(ctx, workspaceFolder, type);
  }
  async chunkFolder(ctx, workspaceFolder, type = "default") {
    let impl = this.getImplementation(workspaceFolder, type),
      chunks = await impl.chunk(ctx),
      telemetryData = TelemetryData.createAndMarkAsIssued().extendedBy(void 0, {
        fileCount: impl.totalFileCount,
        chunkCount: await impl.getChunksCount(),
        timeTakenMs: impl.chunkingTimeMs,
        workspaceCount: this.workspaceCount
      });
    return telemetry(ctx, "index.chunk", telemetryData), chunks;
  }
  async chunkFiles(ctx, workspaceFolder, documents, type = "default") {
    return await this.getImplementation(workspaceFolder, type).chunk(ctx, documents);
  }
};

,__name(_ChunkingProvider, "ChunkingProvider");

,var ChunkingProvider = _ChunkingProvider;