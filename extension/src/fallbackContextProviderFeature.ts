async function shouldActivateFallbackContextProvider(ctx, completionsFiltersInfo) {
  let shouldActivate = !1;
  try {
    let telemetryData = await ctx.get(Features).updateExPValuesAndAssignments(completionsFiltersInfo),
      contextProviders = getExpContextProviders(ctx, telemetryData);
    shouldActivate = contextProviders.includes(FALLBACK_CONTEXT_PROVIDER_ID) || contextProviders.length === 1 && contextProviders[0] === "*";
  } catch (e) {
    return fallbackContextProviderLogger.debug(ctx, "Failed to check Fallback Context Provider activation conditions:", e), !1;
  }
  return shouldActivate;
},__name(shouldActivateFallbackContextProvider, "shouldActivateFallbackContextProvider");

,async function activateFallbackContextProviderFeature(ctx) {
  let workspaceFolders = ctx.get(TextDocumentManager).getWorkspaceFolders(),
    extensionFileWatcher = new ExtensionFileWatcher(workspaceFolders.map(f => f.uri), {
      excludeGitignoredFiles: !0,
      excludeIDEIgnoredFiles: !0,
      excludeIDESearchIgnoredFiles: !0
    });
  ctx.set(FileWatcher, extensionFileWatcher), ctx.set(FileSearch, new ExtensionFileSearch());
  let persistenceManager = makeXdgPersistenceManager(),
    databasePersist = new WorkspaceDatabasePersistenceManager(persistenceManager),
    indexableWorkspaceFolders = await Promise.all(workspaceFolders.map(async folder => createIndexableWorkspaceFolder(folder.uri, databasePersist)));
  ctx.set(FallbackContextIndexWatcher, new FallbackContextIndexWatcher(ctx, extensionFileWatcher, databasePersist, indexableWorkspaceFolders)), ctx.get(ContextProviderRegistry).registerContextProvider(new FallbackContextProvider(ctx));
},__name(activateFallbackContextProviderFeature, "activateFallbackContextProviderFeature");

,async function cleanupFallbackContextProviderFeature(ctx) {
  try {
    ctx.get(FileWatcher).dispose(), await ctx.get(FallbackContextIndexWatcher).dispose();
  } catch {}
},__name(cleanupFallbackContextProviderFeature, "cleanupFallbackContextProviderFeature");