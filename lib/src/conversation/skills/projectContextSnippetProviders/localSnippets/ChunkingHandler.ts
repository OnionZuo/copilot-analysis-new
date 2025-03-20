var _ChunkingHandler = class _ChunkingHandler {
  constructor(ctx, workspaceFolder, implementation) {
    this.workspaceFolder = workspaceFolder;
    this.implementation = implementation;
    this._chunkLimiter = new Limiter();
    this.status = "notStarted", this.workspaceChunks = new WorkspaceChunks(ctx, workspaceFolder), this.cancellationToken = new ChunkingCancellationToken(), this._chunkingTimeMs = 0, this._fileCountExceeded = !1, this._chunkCountExceeded = !1, this._totalFileCount = 0, this._filesUpdated = new Set();
  }
  async chunk(ctx, documents) {
    return documents ? await this.chunkFiles(ctx, documents) : await this.chunkWorkspace(ctx);
  }
  async chunkWorkspace(ctx) {
    let chunkStart = performance.now();
    if (this.status = "started", this.cancellationToken.isCancelled()) return this.status = "cancelled", this.updateChunkingTime(chunkStart, performance.now()), this.workspaceChunks.getChunks();
    await this.updateModelConfig(ctx);
    let watchedFiles = await ctx.get(WorkspaceWatcherProvider).getWatchedFiles({
        uri: this.workspaceFolder
      }),
      features = ctx.get(Features),
      telemetryDataWithExp = await features.updateExPValuesAndAssignments(),
      threshold = features.ideChatProjectContextFileCountThreshold(telemetryDataWithExp);
    this._totalFileCount = watchedFiles.length, watchedFiles.length > threshold && (this._fileCountExceeded = !0, watchedFiles = watchedFiles.slice(0, threshold));
    let promises = watchedFiles.map(async document => {
      this.cancellationToken.isCancelled() || (await this._chunkLimiter.queue(() => this._chunk(ctx, document)));
    });
    try {
      await Promise.all(promises);
    } catch (e) {
      telemetryException(ctx, e, "ChunkingProvider.chunk"), await this.terminateChunking();
    }
    return this.status = this.cancellationToken.isCancelled() ? "cancelled" : "completed", this.updateChunkingTime(chunkStart, performance.now()), (await this.workspaceChunks.getChunksCount()) > MAX_CHUNK_COUNT && (this._chunkCountExceeded = !0), this.workspaceChunks.getChunks();
  }
  async chunkFiles(ctx, documents) {
    await this.updateModelConfig(ctx);
    let promises = documents.map(async document => {
      this.cancellationToken.isCancelled() || (this._filesUpdated.add(document.uri), await this._chunkLimiter.queue(() => this._chunk(ctx, document)));
    });
    try {
      await Promise.all(promises);
    } catch (e) {
      telemetryException(ctx, e, "ChunkingProvider.chunkFiles"), await this.terminateChunking();
    }
    (await this.workspaceChunks.getChunksCount()) > MAX_CHUNK_COUNT && (this._chunkCountExceeded = !0);
    let features = ctx.get(Features),
      telemetryDataWithExp = await features.updateExPValuesAndAssignments(),
      fileCountThreshold = features.ideChatProjectContextFileCountThreshold(telemetryDataWithExp);
    return (await this.workspaceChunks.getFilesCount()) > fileCountThreshold && (this._fileCountExceeded = !0), asyncIterableConcat(...documents.map(document => this.workspaceChunks.getChunks(document)));
  }
  async _chunk(ctx, document) {
    if (this.cancellationToken.isCancelled()) return;
    let docChunks = await this.implementation.chunk(document, this.modelConfig);
    await this.workspaceChunks.addChunks(document, docChunks);
  }
  async updateModelConfig(ctx) {
    this.modelConfig || (this.modelConfig = await ctx.get(ModelConfigurationProvider).getBestChatModelConfig(getSupportedModelFamiliesForPrompt("user")));
  }
  async terminateChunking() {
    this.cancellationToken.cancel();
  }
  async clearChunks() {
    await this.workspaceChunks.clear();
  }
  updateChunkingTime(start, end) {
    this._chunkingTimeMs = end - start;
  }
  get chunkingTimeMs() {
    return Math.floor(this._chunkingTimeMs);
  }
  get fileCountExceeded() {
    return this._fileCountExceeded;
  }
  get totalFileCount() {
    return this._totalFileCount;
  }
  get chunkCountExceeded() {
    return this._chunkCountExceeded;
  }
  get filesUpdatedCount() {
    return this._filesUpdated.size;
  }
  async getFilesCount() {
    return this.workspaceChunks.getFilesCount();
  }
  getChunks() {
    return this.workspaceChunks.getChunks();
  }
  async getChunksCount() {
    return this.workspaceChunks.getChunksCount();
  }
  deleteSubfolderChunks(uri) {
    return this.workspaceChunks.deleteChunks({
      uri: uri
    });
  }
  deleteFileChunks(uri) {
    return this._filesUpdated.add(uri), this.workspaceChunks.deleteChunks({
      uri: uri
    });
  }
};

,__name(_ChunkingHandler, "ChunkingHandler");

,var ChunkingHandler = _ChunkingHandler,
  _ChunkingCancellationToken = class _ChunkingCancellationToken {
    constructor() {
      this.cancelled = !1;
    }
    cancel() {
      this.cancelled = !0;
    }
    isCancelled() {
      return this.cancelled;
    }
  };

,__name(_ChunkingCancellationToken, "ChunkingCancellationToken");

,var ChunkingCancellationToken = _ChunkingCancellationToken,
  _Limiter = class _Limiter {
    constructor(maxCount = 20) {
      this.maxCount = maxCount;
      this.tasks = [];
      this.runningTasks = 0;
    }
    async queue(task) {
      return new Promise((resolve, reject) => {
        this.tasks.push({
          factory: task,
          resolve: resolve,
          reject: reject
        }), this.consume();
      });
    }
    consume() {
      for (; this.tasks.length > 0 && this.runningTasks <= this.maxCount;) {
        let {
          factory: factory,
          resolve: resolve,
          reject: reject
        } = this.tasks.shift();
        this.runningTasks++;
        let promise = factory();
        promise.then(resolve, reject), promise.then(() => this.consumed(), () => this.consumed());
      }
    }
    consumed() {
      this.runningTasks--, this.consume();
    }
  };

,__name(_Limiter, "Limiter");

,var Limiter = _Limiter;