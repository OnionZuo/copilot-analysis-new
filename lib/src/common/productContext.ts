function createProductionContext(configProvider) {
  let ctx = new Context();
  return ctx.set(ConfigProvider, configProvider), ctx.set(Clock, new Clock()), ctx.set(BuildInfo, new BuildInfo()), setupRudimentaryLogging(ctx), ctx.set(CompletionsCache, new CompletionsCache()), ctx.set(CopilotTokenNotifier, new CopilotTokenNotifier()), ctx.set(RootCertificateReader, getRootCertificateReader(ctx)), ctx.set(ProxySocketFactory, getProxySocketFactory(ctx)), ctx.set(Features, new Features(ctx)), ctx.set(ExceptionRateLimiter, new ExceptionRateLimiter()), ctx.set(TelemetryUserConfig, new TelemetryUserConfig(ctx)), ctx.set(TelemetryReporters, new TelemetryReporters()), ctx.set(TelemetryInitialization, new TelemetryInitialization()), setHeaderContributors(ctx), ctx.set(UserErrorNotifier, new UserErrorNotifier()), ctx.set(ContextualFilterManager, new ContextualFilterManager()), ctx.set(OpenAIFetcher, new LiveOpenAIFetcher()), ctx.set(BlockModeConfig, new ConfigBlockModeConfig()), ctx.set(ExpConfigMaker, new ExpConfigFromTAS()), ctx.set(PromiseQueue, new PromiseQueue()), ctx.set(CompletionsPromptFactory, createCompletionsPromptFactory(ctx)), ctx.set(SnippetOrchestrator, new SnippetOrchestrator()), ctx.set(LastGhostText, new LastGhostText()), ctx.set(CurrentGhostText, new CurrentGhostText()), ctx.set(ForceMultiLine, ForceMultiLine.default), ctx.set(RepositoryManager, new RepositoryManager(ctx)), ctx.set(GitConfigLoader, new GitFallbackConfigLoader([new GitCLIConfigLoader(), new GitParsingConfigLoader()])), ctx.set(WorkspaceNotifier, new WorkspaceNotifier()), ctx.set(AvailableModelsManager, new AvailableModelsManager(ctx)), ctx.set(GitHubAppInfo, new GitHubAppInfo()), ctx.set(AsyncCompletionManager, new AsyncCompletionManager(ctx)), ctx.set(SpeculationFetcher, new SpeculationFetcher(ctx)), ctx;
},__name(createProductionContext, "createProductionContext");

,function setHeaderContributors(ctx) {
  let headerContributors = new HeaderContributors();
  headerContributors.add(new CapiVersionHeaderContributor(ctx)), ctx.set(HeaderContributors, headerContributors);
},__name(setHeaderContributors, "setHeaderContributors");

,function setupRudimentaryLogging(ctx) {
  ctx.set(RuntimeMode, RuntimeMode.fromEnvironment(!1)), ctx.set(TelemetryLogSender, new TelemetryLogSenderImpl()), ctx.set(LogTarget, new ConsoleLog(console));
},__name(setupRudimentaryLogging, "setupRudimentaryLogging");

,var logger = new Logger("context");