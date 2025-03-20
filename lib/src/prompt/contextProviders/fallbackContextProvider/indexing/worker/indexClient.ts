var import_vscode_languageserver_protocol = fn(Un());

,var IndexWorkerName = "indexWorker.js",
  _IndexClient = class _IndexClient {
    constructor(indexableWorkspaceFolders, maxConcurrentRequests = 3) {
      this.promiseResolvers = new Map();
      this.id = 0;
      try {
        let workerArgs = {
          cwd: process.cwd(),
          indexWorkspaceRoots: indexableWorkspaceFolders
        };
        this.worker = createWorker(IndexWorkerName, workerArgs), this.worker.on("message", this.handleWorkerMessage.bind(this)), this.worker.on("error", d => {
          this.handleUnexpectedError(d);
        }), this.postMessageQueue = new PriorityLimiter(maxConcurrentRequests);
      } catch (e) {
        throw console.error(`Failed to create worker: ${e.message}`), e;
      }
    }
    dispose() {
      return this.postMessageInQueue(new ExitRequest(this.id++), Ret.CancellationToken.None, !0);
    }
    async indexFile(filePath, languageId, token) {
      return await this.postMessageInQueue(new AddOrInvalidatedRequest(this.id++, filePath, languageId), token);
    }
    async getAllFileNames(baseWorkspaceFolderPath, token) {
      return this.postMessageInQueue(new GetAllDocumentsRequest(this.id++, baseWorkspaceFolderPath), token);
    }
    getContext(filePath, code, offset, languageId, token) {
      return this.postMessageInQueue(new GetContextRequest(this.id++, filePath, code, offset, languageId), token, !0);
    }
    tryCreateIndex(baseWorkspaceFolderPath, databaseFilePath, token) {
      return this.postMessageInQueue(new CreateIndexRequest(this.id++, baseWorkspaceFolderPath, databaseFilePath), token);
    }
    async postMessageInQueue(message, token, highPriority = !1) {
      return this.postMessageQueue.queue(() => this.postMessageAndWait(message, token), highPriority);
    }
    tryRemoveIndex(baseWorkspaceFolderPath, token) {
      return this.postMessageAndWait(new RemoveIndexRequest(this.id++, baseWorkspaceFolderPath), token);
    }
    async postMessageAndWait(message, token) {
      if (this.fatalError) return Promise.reject(this.fatalError);
      let promise = new Promise((resolve, reject) => {
        this.promiseResolvers.set(message.id, {
          resolve: resolve,
          reject: reject
        });
      });
      this.worker.postMessage(message);
      let cancellationHandler = token.onCancellationRequested(() => {
        this.worker.postMessage(new CancellationNotification(message.id));
      });
      try {
        return await promise;
      } finally {
        cancellationHandler.dispose();
      }
    }
    handleWorkerMessage(message) {
      if (message.operation !== "response") throw new Error("Unexpected message operation");
      let resolver = this.promiseResolvers.get(message.id);
      if (!resolver) throw new Error(`Received response for message that isn't in progress: ${message.id}`);
      this.promiseResolvers.delete(message.id), message.error ? (message.error.code = message.code, resolver.reject(message.error)) : resolver.resolve(message.data);
    }
    handleUnexpectedError(maybeError) {
      var _a;
      let error;
      if (maybeError instanceof Error) {
        error = maybeError, error.code === "MODULE_NOT_FOUND" && (_a = error.message) != null && _a.endsWith(IndexWorkerName + "'") && (error = new Error(`Failed to load ${IndexWorkerName}`), error.code = "CopilotPromptLoadFailure");
        let ourStack = new Error().stack;
        error.stack && ourStack != null && ourStack.match(/^Error\n/) && (error.stack += ourStack.replace(/^Error/, ""));
      } else maybeError && typeof maybeError == "object" && "name" in maybeError && "status" in maybeError && maybeError.name === "ExitStatus" && typeof maybeError.status == "number" ? (error = new Error(`worker.js exited with status ${maybeError.status}`), error.code = `CopilotPromptWorkerExit${maybeError.status}`) : error = new Error(`Non-error thrown: ${JSON.stringify(maybeError)}`);
      for (let handler of this.promiseResolvers.values()) handler.reject(error);
      this.promiseResolvers.clear(), this.fatalError = error;
    }
  };

,__name(_IndexClient, "IndexClient");

,var IndexClient = _IndexClient;