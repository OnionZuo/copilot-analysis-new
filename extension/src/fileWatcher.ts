var import_vscode = require("vscode");

,var _ExtensionFileWatcher = class _ExtensionFileWatcher extends FileWatcher {
  constructor(workspaceUris, params) {
    super(workspaceUris, params);
    this.disposableStore = [];
    this.gitIgnoreGlobs = Promise.resolve([]);
    this.filesExcludeGlob = Promise.resolve([]);
    this.searchExcludeGlob = Promise.resolve([]);
    this.fileWatchers = [];
    this.workspaceWatchers = [];
    this.refreshIgnorePatterns(), GU.workspace.onDidChangeConfiguration(async e => {
      e.affectsConfiguration(SEARCH_EXCLUDE) && params.excludeIDESearchIgnoredFiles && (this.searchExcludeGlob = getSettingExcludeRelativePatterns(this.workspaceUris, "search")), e.affectsConfiguration(FILES_EXCLUDE) && params.excludeIDEIgnoredFiles && (this.filesExcludeGlob = getSettingExcludeRelativePatterns(this.workspaceUris, "files"));
    }), this.editorWatcher = GU.workspace.createFileSystemWatcher("**"), this.disposableStore.push(this.editorWatcher.onDidChange(async e => {
      await this._triggerOnFileChange(0, e);
    })), this.disposableStore.push(this.editorWatcher.onDidDelete(async e => {
      await this._triggerOnFileChange(1, e);
    })), this.disposableStore.push(this.editorWatcher.onDidCreate(async e => {
      await this._triggerOnFileChange(2, e);
    })), GU.workspace.onDidChangeWorkspaceFolders(async e => {
      for (let workspaceFolder of e.added) await this._triggerOnWorkspaceChange(0, workspaceFolder.uri);
      for (let workspaceFolder of e.removed) await this._triggerOnWorkspaceChange(1, workspaceFolder.uri);
    });
  }
  onFileChange(func) {
    this.fileWatchers.push(func);
  }
  async getIgnoreGlobs() {
    return [...(await this.gitIgnoreGlobs), ...(await this.filesExcludeGlob), ...(await this.searchExcludeGlob)];
  }
  onWorkspaceChange(func) {
    this.workspaceWatchers.push(func);
  }
  refreshIgnorePatterns() {
    this.params.excludeGitignoredFiles && (this.gitIgnoreGlobs = getGitIgnoredRelativePatterns(this.workspaceUris)), this.params.excludeIDEIgnoredFiles && (this.filesExcludeGlob = getSettingExcludeRelativePatterns(this.workspaceUris, "files")), this.params.excludeIDESearchIgnoredFiles && (this.searchExcludeGlob = getSettingExcludeRelativePatterns(this.workspaceUris, "search"));
  }
  dispose() {
    for (let disposable of this.disposableStore) disposable.dispose();
  }
  async _triggerOnFileChange(changeType, uri) {
    let ignoreGlobs = await this.getIgnoreGlobs();
    for (let ignoreRelativePattern of ignoreGlobs) if (uri.fsPath.startsWith(ignoreRelativePattern.baseUri.fsPath)) {
      let uriSuffix = uri.fsPath.substring(ignoreRelativePattern.baseUri.fsPath.length);
      if (minimatch(uriSuffix, ignoreRelativePattern.pattern, {
        nocase: !0,
        dot: !0
      })) return;
    }
    await Promise.all(this.fileWatchers.map(watcher => watcher(changeType, uri.toString())));
  }
  async _triggerOnWorkspaceChange(changeType, uri) {
    changeType === 0 ? (this.workspaceUris.push(uri.toString()), this.refreshIgnorePatterns()) : changeType === 1 && (this.workspaceUris = this.workspaceUris.filter(e => e !== uri.toString()), this.refreshIgnorePatterns()), await Promise.all(this.workspaceWatchers.map(watcher => watcher(changeType, uri.toString())));
  }
};

,__name(_ExtensionFileWatcher, "ExtensionFileWatcher");

,var ExtensionFileWatcher = _ExtensionFileWatcher;