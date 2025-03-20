var _NullLog = class _NullLog extends LogTarget {
  logIt(..._) {}
};

,__name(_NullLog, "NullLog");

,var NullLog = _NullLog;

,function _createBaselineContext(configProvider) {
  let ctx = new Context();
  return ctx.set(ConfigProvider, configProvider), ctx.set(BuildInfo, new BuildInfo()), ctx.set(RuntimeMode, new RuntimeMode({
    debug: !1,
    verboseLogging: !1,
    testMode: !0,
    simulation: !1
  })), ctx.set(RootCertificateReader, createTestCertificateReader([])), ctx.set(ProxySocketFactory, getProxySocketFactory(ctx)), ctx.set(Clock, new Clock()), ctx.set(ExpConfigMaker, new ExpConfigNone()), ctx.set(ContextualFilterManager, new ContextualFilterManager()), ctx.set(CopilotTokenNotifier, new CopilotTokenNotifier()), ctx.set(ExceptionRateLimiter, new ExceptionRateLimiter()), ctx.set(TelemetryUserConfig, new TelemetryUserConfig(ctx, "tid=test", !0)), ctx.set(TelemetryReporters, new TelemetryReporters()), ctx.set(NotificationSender, new TestNotificationSender()), ctx.set(UrlOpener, new TestUrlOpener()), ctx.set(TelemetryLogSender, new TelemetryLogSenderImpl()), ctx.set(LogTarget, new NullLog()), ctx.set(UserErrorNotifier, new UserErrorNotifier()), ctx.set(EditorSession, new EditorSession("test-session", "test-machine")), ctx.set(NetworkConfiguration, new DefaultNetworkConfiguration(ctx)), ctx.set(TelemetryInitialization, new TelemetryInitialization()), setupTelemetryReporters(ctx, "copilot-test", !0), ctx.set(Features, new Features(ctx)), ctx.set(CompletionsCache, new CompletionsCache()), ctx.set(BlockModeConfig, new ConfigBlockModeConfig()), ctx.set(CopilotTokenManager, new FixedCopilotTokenManager("tid=test")), ctx.set(StatusReporter, new NoOpStatusReporter()), ctx.set(HeaderContributors, new HeaderContributors()), ctx.set(PromiseQueue, new PromiseQueue()), ctx.set(CompletionsPromptFactory, createCompletionsPromptFactory(ctx)), ctx.set(SnippetOrchestrator, new SnippetOrchestrator()), ctx.set(LastGhostText, new LastGhostText()), ctx.set(CurrentGhostText, new CurrentGhostText()), ctx.set(ForceMultiLine, ForceMultiLine.default), ctx.set(WorkspaceNotifier, new WorkspaceNotifier()), ctx.set(AvailableModelsManager, new AvailableModelsManager(ctx, !1)), ctx.set(GitHubAppInfo, new GitHubAppInfo()), ctx.set(FileReader, new FileReader(ctx)), ctx.set(CitationManager, new NoOpCitationManager()), ctx.set(ContextProviderStatistics, new ContextProviderStatistics()), ctx.set(ContextProviderRegistry, getContextProviderRegistry(ctx, async (_, documentSelector, documentContext) => documentSelector.find(ds => ds === "*") ? 1 : documentSelector.find(ds => typeof ds != "string" && ds.language === documentContext.languageId) ? 10 : 0)), registerConversation(ctx), ctx.set(AsyncCompletionManager, new AsyncCompletionManager(ctx)), ctx;
},__name(_createBaselineContext, "_createBaselineContext");

,function registerConversation(ctx) {
  ctx.set(Conversations, new Conversations(ctx)), ctx.set(ConversationProgress, new TestConversationProgress()), ctx.set(ConversationPromptEngine, new ConversationPromptEngine(ctx)), ctx.set(ConversationSkillRegistry, new ConversationSkillRegistry()), ctx.set(ConversationDumper, new ConversationDumper()), ctx.set(ConversationInspector, new TestConversationInspector()), ctx.set(PreconditionsCheck, new PreconditionsCheck(ctx, [])), ctx.set(ModelConfigurationProvider, new TestModelConfigurationProvider()), ctx.set(RemoteAgentRegistry, new TestRemoteAgentRegistry()), ctx.set(GitHubRepositoryApi, new GitHubRepositoryApi(ctx)), ctx.set(BlackbirdIndexingStatus, new BlackbirdIndexingStatus()), ctx.set(ChunkingProvider, new ChunkingProvider(ctx)), ctx.set(RankingProvider, new RankingProvider()), ctx.set(ScoringProvider, new ScoringProvider());
},__name(registerConversation, "registerConversation");

,function createLibTestingContext() {
  let ctx = _createBaselineContext(new DefaultsOnlyConfigProvider());
  return ctx.set(Fetcher, new NoFetchFetcher()), ctx.set(EditorAndPluginInfo, new LibTestsEditorInfo()), ctx.set(TextDocumentManager, new TestTextDocumentManager(ctx)), ctx.set(FileSystem, new LocalFileSystem()), ctx.set(CopilotContentExclusionManager, new CopilotContentExclusionManager(ctx)), ctx.set(PersistenceManager, new InMemoryPersistenceManager()), ctx.set(EditConversations, new EditConversations(ctx)), ctx.set(EditProgressReporter, new LibTestEditProgressReporter(ctx)), ctx;
},__name(createLibTestingContext, "createLibTestingContext");

,var _LibTestsEditorInfo = class _LibTestsEditorInfo extends EditorAndPluginInfo {
  getEditorInfo() {
    return {
      name: "lib-tests-editor",
      version: "1"
    };
  }
  getEditorPluginInfo() {
    return {
      name: "lib-tests-plugin",
      version: "2"
    };
  }
  getRelatedPluginInfo() {
    return [{
      name: "lib-tests-related-plugin",
      version: "3"
    }];
  }
};

,__name(_LibTestsEditorInfo, "LibTestsEditorInfo");

,var LibTestsEditorInfo = _LibTestsEditorInfo;