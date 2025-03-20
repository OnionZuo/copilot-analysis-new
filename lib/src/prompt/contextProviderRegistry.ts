var import_promises = require("timers/promises"),
  import_vscode_languageserver_protocol = fn(Un());

,var _ContextProviderRegistry = class _ContextProviderRegistry {};

,__name(_ContextProviderRegistry, "ContextProviderRegistry");

,var ContextProviderRegistry = _ContextProviderRegistry,
  _CoreContextProviderRegistry = class _CoreContextProviderRegistry extends ContextProviderRegistry {
    constructor(ctx, match) {
      super();
      this.ctx = ctx;
      this.match = match;
      this._providers = [];
    }
    registerContextProvider(provider) {
      if (provider.id.includes(",") || provider.id.includes("*")) throw new Error(`A context provider id cannot contain a comma or an asterisk. The id ${provider.id} is invalid.`);
      if (this._providers.find(p => p.id === provider.id)) throw new Error(`A context provider with id ${provider.id} has already been registered`);
      this._providers.push(provider);
    }
    unregisterContextProvider(providerId) {
      this._providers = this._providers.filter(p => p.id !== providerId);
    }
    get providers() {
      return this._providers.slice();
    }
    async resolveAllProviders(documentContext, telemetryData, completionCancellationToken, data) {
      if (completionCancellationToken != null && completionCancellationToken.isCancellationRequested) return logger.debug(this.ctx, "Resolving context providers cancelled"), [];
      let activeExperiments = new Map();
      fillInCppActiveExperiments(this.ctx, activeExperiments, telemetryData);
      let resolvedContextItems = [];
      if (this._providers.length === 0) return resolvedContextItems;
      let providersWithMatchScore = await this.matchProviders(documentContext, telemetryData),
        matchedProviders = providersWithMatchScore.filter(p => p[1] > 0);
      if (providersWithMatchScore.filter(p => p[1] <= 0).forEach(([provider, score]) => {
        let item = {
          providerId: provider.id,
          matchScore: score,
          resolution: "none",
          resolutionTimeMs: 0,
          data: []
        };
        resolvedContextItems.push(item);
      }), matchedProviders.length === 0) return resolvedContextItems;
      if (completionCancellationToken != null && completionCancellationToken.isCancellationRequested) return logger.debug(this.ctx, "Resolving context providers cancelled"), [];
      let timeBudget = isDebugEnabled(this.ctx) && !isRunningInSimulation(this.ctx) ? 0 : getConfig(this.ctx, ConfigKey.ContextProviderTimeBudget),
        budgetPerProvider = matchedProviders.length > 0 ? timeBudget / matchedProviders.length : timeBudget;
      for (let [provider, score] of matchedProviders) {
        let request = {
            completionId: extractCompletionId(telemetryData),
            documentContext: documentContext,
            activeExperiments: activeExperiments,
            timeBudget: budgetPerProvider,
            data: data
          },
          stats = this.ctx.get(ContextProviderStatistics).pop(provider.id);
        stats && (request.previousUsageStatistics = stats);
        let providerCancellationTokenSource = new A8e.CancellationTokenSource();
        completionCancellationToken == null || completionCancellationToken.onCancellationRequested(_ => {
          providerCancellationTokenSource.cancel();
        });
        let start = performance.now(),
          pendingContextItem = provider.resolver.resolve(request, providerCancellationTokenSource.token),
          [resolvedContextItemsData, resolution] = await extractDataFromPendingContextItem(this.ctx, pendingContextItem, request, provider, providerCancellationTokenSource),
          end = performance.now();
        this.ctx.get(ContextProviderStatistics).setLastResolution(provider.id, resolution);
        let [filteredItems, invalidItems] = filterSupportedContextItems(resolvedContextItemsData);
        invalidItems && logger.error(this.ctx, `Dropped ${invalidItems} context items from ${provider.id} due to invalid schema`);
        let filteredItemsWithId = addOrValidateContextItemsIDs(this.ctx, filteredItems),
          resolvedContextItem = {
            providerId: provider.id,
            matchScore: score,
            resolution: resolution,
            resolutionTimeMs: end - start,
            data: filteredItemsWithId
          };
        resolvedContextItems.push(resolvedContextItem);
      }
      return resolvedContextItems.sort((a, b) => b.matchScore - a.matchScore);
    }
    async matchProviders(documentContext, telemetryData) {
      let activeContextProviders = getExpContextProviders(this.ctx, telemetryData),
        enableAllProviders = activeContextProviders.length === 1 && activeContextProviders[0] === "*";
      return await Promise.all(this._providers.map(async provider => {
        if (!enableAllProviders && !activeContextProviders.includes(provider.id)) return [provider, 0];
        let matchScore = await this.match(this.ctx, provider.selector, documentContext);
        return [provider, matchScore];
      }));
    }
  };

,__name(_CoreContextProviderRegistry, "CoreContextProviderRegistry");

,var CoreContextProviderRegistry = _CoreContextProviderRegistry,
  _CachedContextProviderRegistry = class _CachedContextProviderRegistry extends ContextProviderRegistry {
    constructor(delegate) {
      super();
      this.delegate = delegate;
      this._cachedContextItems = new LRUCacheMap(5);
    }
    registerContextProvider(provider) {
      this.delegate.registerContextProvider(provider);
    }
    unregisterContextProvider(providerId) {
      this.delegate.unregisterContextProvider(providerId);
    }
    get providers() {
      return this.delegate.providers;
    }
    async resolveAllProviders(documentContext, telemetryData, completionToken, data) {
      let completionId = extractCompletionId(telemetryData),
        cachedItems = this._cachedContextItems.get(completionId);
      if (completionId && cachedItems && cachedItems.length > 0) return cachedItems;
      let resolvedContextItems = await this.delegate.resolveAllProviders(documentContext, telemetryData, completionToken, data);
      return resolvedContextItems.length > 0 && completionId && this._cachedContextItems.set(completionId, resolvedContextItems), resolvedContextItems;
    }
  };

,__name(_CachedContextProviderRegistry, "CachedContextProviderRegistry");

,var CachedContextProviderRegistry = _CachedContextProviderRegistry;

,function nullTimeout(timeoutMs) {
  return timeoutMs > 0 ? (0, l8e.setTimeout)(timeoutMs, null) : new Promise(() => {});
},__name(nullTimeout, "nullTimeout");

,async function extractDataFromPendingContextItem(ctx, resolvedContextItem, request, provider, providerCancellationTokenSource) {
  let result = [],
    resolution;
  return resolvedContextItem instanceof Promise ? [result, resolution] = await handlePromiseContextItem(ctx, resolvedContextItem, request, provider, providerCancellationTokenSource) : [result, resolution] = await handleAsyncIteratorContextItem(ctx, resolvedContextItem, request, provider, providerCancellationTokenSource), [result, resolution];
},__name(extractDataFromPendingContextItem, "extractDataFromPendingContextItem");

,async function handlePromiseContextItem(ctx, resolvedContextItem, request, provider, providerCancellationTokenSource) {
  let result = [],
    resolution,
    timeoutPromise = nullTimeout(request.timeBudget);
  try {
    let contextItem = await Promise.race([resolvedContextItem, timeoutPromise]);
    contextItem === null ? (resolution = "none", providerCancellationTokenSource.cancel(), logger.info(ctx, `Context provider ${provider.id} exceeded time budget of ${request.timeBudget}ms`)) : (resolution = "full", Array.isArray(contextItem) ? result.push(...contextItem) : result.push(contextItem));
  } catch (err) {
    return isCancellationError(err) || logger.error(ctx, `Error resolving context from ${provider.id}: `, err), providerCancellationTokenSource.cancel(), [[], "error"];
  }
  return [result, resolution];
},__name(handlePromiseContextItem, "handlePromiseContextItem");

,async function handleAsyncIteratorContextItem(ctx, resolvedContextItem, request, provider, providerCancellationTokenSource) {
  let result = [],
    resolution,
    timeoutPromise = nullTimeout(request.timeBudget),
    collectPromise = (async () => {
      for await (let item of resolvedContextItem) result.push(item);
      return result;
    })();
  try {
    (await Promise.race([collectPromise, timeoutPromise])) === null ? (resolution = result.length > 0 ? "partial" : "none", providerCancellationTokenSource.cancel(), logger.info(ctx, `Context provider ${provider.id} exceeded time budget of ${request.timeBudget}ms`)) : resolution = "full";
  } catch (err) {
    return isCancellationError(err) || logger.error(ctx, `Error resolving context from ${provider.id}: `, err), providerCancellationTokenSource.cancel(), [[], "error"];
  }
  return [result, resolution];
},__name(handleAsyncIteratorContextItem, "handleAsyncIteratorContextItem");

,function getContextProviderRegistry(ctx, match) {
  return new CachedContextProviderRegistry(new CoreContextProviderRegistry(ctx, match));
},__name(getContextProviderRegistry, "getContextProviderRegistry");

,function telemetrizeContextItems(ctx, resolvedContextItems) {
  let contextProviderStatistics = ctx.get(ContextProviderStatistics);
  return resolvedContextItems.map(p => {
    var _a;
    let {
        providerId: providerId,
        resolution: resolution,
        resolutionTimeMs: resolutionTimeMs,
        matchScore: matchScore,
        data: data
      } = p,
      providerStatistics = contextProviderStatistics.get(providerId),
      usage = (_a = providerStatistics == null ? void 0 : providerStatistics.usage) != null ? _a : "none";
    return (matchScore <= 0 || resolution === "none" || resolution === "error") && (usage = "none"), {
      providerId: providerId,
      resolution: resolution,
      resolutionTimeMs: resolutionTimeMs,
      usage: usage,
      usageDetails: providerStatistics == null ? void 0 : providerStatistics.usageDetails,
      matched: matchScore > 0,
      numResolvedItems: data.length
    };
  });
},__name(telemetrizeContextItems, "telemetrizeContextItems");

,function extractCompletionId(telemetryData) {
  return telemetryData.properties.headerRequestId;
},__name(extractCompletionId, "extractCompletionId");

,function matchContextItems(resolvedContextItem) {
  return resolvedContextItem.matchScore > 0 && resolvedContextItem.resolution !== "error";
},__name(matchContextItems, "matchContextItems");

,function getExpContextProviders(ctx, telemetryData) {
  var _a;
  if (isDebugEnabled(ctx)) return ["*"];
  let expContextProviders = ctx.get(Features).contextProviders(telemetryData),
    configContextProviders = (_a = getConfig(ctx, ConfigKey.ContextProviders)) != null ? _a : [];
  return expContextProviders.length === 1 && expContextProviders[0] === "*" || configContextProviders.length === 1 && configContextProviders[0] === "*" ? ["*"] : Array.from(new Set([...expContextProviders, ...configContextProviders]));
},__name(getExpContextProviders, "getExpContextProviders");

,function useContextProviderAPI(ctx, telemetryData) {
  return getExpContextProviders(ctx, telemetryData).length > 0;
},__name(useContextProviderAPI, "useContextProviderAPI");