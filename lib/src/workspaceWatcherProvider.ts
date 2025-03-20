var _WorkspaceWatcherProvider = class _WorkspaceWatcherProvider {
  constructor(ctx) {
    this.ctx = ctx;
    this.watchers = new LRUCacheMap(25);
  }
  getWatcher(workspaceFolder) {
    let watcher = this.watchers.get(workspaceFolder.uri);
    if (watcher) return watcher;
    let parentWatcher = this.getParentFolder(workspaceFolder.uri);
    return parentWatcher ? this.watchers.get(parentWatcher) : void 0;
  }
  getParentFolder(workspaceFolder) {
    return [...this.watchers.keys()].find(folder => {
      let parentFolder = folder.replace(/[#?].*/, "").replace(/\/?$/, "/");
      return workspaceFolder !== folder && workspaceFolder.startsWith(parentFolder);
    });
  }
  hasWatcher(workspaceFolder) {
    return this.getParentFolder(workspaceFolder.uri) || this.getWatcher(workspaceFolder) !== void 0;
  }
  startWatching(workspaceFolder) {
    var _a;
    if (conversationLogger.debug(this.ctx, `WorkspaceWatcherProvider - Start watching workspace ${workspaceFolder.uri}`), this.hasWatcher(workspaceFolder)) {
      (_a = this.getWatcher(workspaceFolder)) == null || _a.startWatching();
      return;
    }
    let watcher = this.createWatcher(workspaceFolder);
    this.watchers.set(workspaceFolder.uri, watcher);
  }
  stopWatching(workspaceFolder) {
    var _a;
    (_a = this.getWatcher(workspaceFolder)) == null || _a.stopWatching();
  }
  terminateSubfolderWatchers(workspaceFolder) {
    let watchedFolders = [...this.watchers.keys()],
      parentFolder = workspaceFolder.uri.replace(/[#?].*/, "").replace(/\/?$/, "/"),
      subfolders = watchedFolders.filter(watchedFolder => watchedFolder !== workspaceFolder.uri && watchedFolder.startsWith(parentFolder));
    for (let uri of subfolders) this.terminateWatching({
      uri: uri
    });
    return subfolders;
  }
  terminateWatching(workspaceFolder) {
    var _a;
    if (((_a = this.getWatcher(workspaceFolder)) == null ? void 0 : _a.status) !== "stopped") return this.stopWatching(workspaceFolder), this.watchers.delete(workspaceFolder.uri);
    this.watchers.delete(workspaceFolder.uri);
  }
  onFileChange(workspaceFolder, listener) {
    var _a;
    (_a = this.getWatcher(workspaceFolder)) == null || _a.onFileChange(listener);
  }
  async getWatchedFiles(workspaceFolder) {
    var _a, _b;
    return (_b = await ((_a = this.getWatcher(workspaceFolder)) == null ? void 0 : _a.getWatchedFiles())) != null ? _b : [];
  }
  getStatus(workspaceFolder) {
    var _a;
    return (_a = this.getWatcher(workspaceFolder)) == null ? void 0 : _a.status;
  }
};

,__name(_WorkspaceWatcherProvider, "WorkspaceWatcherProvider");

,var WorkspaceWatcherProvider = _WorkspaceWatcherProvider;