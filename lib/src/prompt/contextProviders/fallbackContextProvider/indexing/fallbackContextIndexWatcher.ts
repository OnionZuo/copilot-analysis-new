var import_vscode_languageserver_protocol = fn(Un());

,var FALLBACK_CONTEXT_PROVIDER_ID = "fallbackContextProvider",
  fallbackContextProviderLogger = new Logger(FALLBACK_CONTEXT_PROVIDER_ID),
  _FallbackContextIndexWatcher = class _FallbackContextIndexWatcher {
    constructor(ctx, watcher, workspaceDatabasePersistenceManager, initialIndexableWorkspaceFolders) {
      this.ctx = ctx;
      this.watcher = watcher;
      this.workspaceDatabasePersistenceManager = workspaceDatabasePersistenceManager;
      this.workspaceInit = new Map();
      this.watcher.onFileChange(async (changeType, filePath) => {
        var _a;
        await this.indexFile(filePath, (_a = this.languageId(filePath)) != null ? _a : "plaintext");
      }), this.watcher.onWorkspaceChange(async (changeType, workspacePath) => {
        if (changeType === 1) {
          await this.indexClient.tryRemoveIndex(workspacePath, rF.CancellationToken.None);
          return;
        }
        await this.indexAddedWorkspace(workspacePath);
      }), this.indexClient = new IndexClient(initialIndexableWorkspaceFolders);
      for (let workspaceFolder of initialIndexableWorkspaceFolders) {
        let workspacePath = workspaceFolder.rootPath;
        this.workspaceInit.set(workspacePath, this.doWorkspaceIndex(workspacePath).then(e => {
          fallbackContextProviderLogger.debug(this.ctx, `workspace ${workspacePath} indexed`), this.workspaceInit.delete(workspacePath);
        }));
      }
    }
    dispose() {
      return this.indexClient.dispose();
    }
    async indexAddedWorkspace(workspacePath) {
      let indexableWorkspaceFolders = await createIndexableWorkspaceFolder(workspacePath, this.workspaceDatabasePersistenceManager);
      await this.indexClient.tryCreateIndex(indexableWorkspaceFolders.rootPath, indexableWorkspaceFolders.databaseFilePath, rF.CancellationToken.None), this.workspaceInit.has(workspacePath) && (await this.workspaceInit.get(workspacePath));
      let promise = this.doWorkspaceIndex(workspacePath).then(e => {
        fallbackContextProviderLogger.debug(this.ctx, `workspace ${workspacePath} indexed`), this.workspaceInit.delete(workspacePath);
      });
      this.workspaceInit.set(workspacePath, promise);
    }
    async doWorkspaceIndex(workspacePath) {
      fallbackContextProviderLogger.debug(this.ctx, `indexing workspace ${workspacePath}`);
      let fileEndingsGlobItems = supportedFileEndings.map(e => `*${e}`);
      if (fileEndingsGlobItems.length === 0) return;
      let targetGlob = `**/${supportedFileEndings.length === 1 ? fileEndingsGlobItems[0] : `{${fileEndingsGlobItems.join(",")}}`}`,
        fileSearch = this.ctx.get(FileSearch),
        relevantFiles = await Promise.all([fileSearch.findFiles(targetGlob, workspacePath, {
          excludeGitignoredFiles: !0,
          excludeIDEIgnoredFiles: !0,
          excludeIDESearchIgnoredFiles: !0
        }).then(files => files.map(f => f.toString())), this.indexClient.getAllFileNames(workspacePath, rF.CancellationToken.None)]),
        fileSearchResults = relevantFiles[0],
        indexedFiles = relevantFiles[1],
        filesToIndex = Array.from(new Set([...fileSearchResults, ...indexedFiles]));
      await Promise.all(filesToIndex.map(async file => {
        let languageId = this.languageId(file);
        languageId && (await this.indexFile(file, languageId));
      }));
    }
    async indexFile(filePath, languageId) {
      try {
        await this.indexClient.indexFile(filePath, languageId, rF.CancellationToken.None);
      } catch (error) {
        fallbackContextProviderLogger.debug(this.ctx, `failed to index ${filePath} with ${error}`);
      }
    }
    languageId(filePath) {
      return getSupportedLanguageIdForFallbackProvider(filePath);
    }
  };

,__name(_FallbackContextIndexWatcher, "FallbackContextIndexWatcher");

,var FallbackContextIndexWatcher = _FallbackContextIndexWatcher;

,async function createIndexableWorkspaceFolder(workspaceFolderPath, workspaceDatabasePersistenceManager) {
  return {
    databaseFilePath: await workspaceDatabasePersistenceManager.getDBFilePath(workspaceFolderPath),
    rootPath: workspaceFolderPath
  };
},__name(createIndexableWorkspaceFolder, "createIndexableWorkspaceFolder");