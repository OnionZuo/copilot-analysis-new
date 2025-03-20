var TIMEOUT_MS = 300,
  defaultProviders = [LanguageSnippetProvider, PathSnippetProvider, SimilarFilesProvider, TooltipSignatureSnippetProvider, TraitProvider, CodeSnippetProvider],
  _ProviderError = class _ProviderError extends Error {
    constructor(providerType, error) {
      super();
      this.providerType = providerType;
      this.error = error;
    }
  };

,__name(_ProviderError, "ProviderError");

,var ProviderError = _ProviderError;

,function isFulfilledResult(result) {
  return result.status === "fulfilled";
},__name(isFulfilledResult, "isFulfilledResult");

,function isRejectedResult(result) {
  return result.status === "rejected";
},__name(isRejectedResult, "isRejectedResult");

,function providersSnippets(results) {
  return results.filter(isFulfilledResult).flatMap(r => r.value.snippets);
},__name(providersSnippets, "providersSnippets");

,function providersErrors(results) {
  return results.filter(isRejectedResult).flatMap(r => r.reason);
},__name(providersErrors, "providersErrors");

,function providersPerformance(results) {
  let runtimes = {},
    timeouts = {};
  return results.forEach(result => {
    isFulfilledResult(result) ? (runtimes[result.value.providerType] = Math.round(result.value.runtime), timeouts[result.value.providerType] = !1) : isProviderTimeout(result.reason) && (timeouts[result.reason.providerType] = !0, runtimes[result.reason.providerType] = 0);
  }), {
    runtimes: runtimes,
    timeouts: timeouts
  };
},__name(providersPerformance, "providersPerformance");

,function isProviderTimeout(reason) {
  return reason !== null && typeof reason == "object" && "error" in reason && reason.error instanceof ProviderTimeoutError;
},__name(isProviderTimeout, "isProviderTimeout");

,var _SnippetOrchestrator = class _SnippetOrchestrator {
  constructor(providers = defaultProviders) {
    this.startThreading = __name(() => workerProxy.startThreading(), "startThreading");
    this.stopThreading = __name(() => workerProxy.stopThreading(), "stopThreading");
    this.providers = providers.map(provider => new provider(workerProxy));
  }
  async getSnippets(context) {
    let signal = AbortSignal.timeout(TIMEOUT_MS),
      providerSnippets = this.providers.map(provider => provider.getSnippets(context, signal));
    return Promise.allSettled ? Promise.allSettled(providerSnippets) : allSettledBackup(providerSnippets);
  }
};

,__name(_SnippetOrchestrator, "SnippetOrchestrator");

,var SnippetOrchestrator = _SnippetOrchestrator;

,function allSettledBackup(promises) {
  return Promise.all(promises.map(p => p.then(createPromiseFulfilledResult, createPromiseRejectedResult)));
},__name(allSettledBackup, "allSettledBackup");

,function createPromiseFulfilledResult(value) {
  return {
    status: "fulfilled",
    value: value
  };
},__name(createPromiseFulfilledResult, "createPromiseFulfilledResult");

,function createPromiseRejectedResult(reason) {
  return {
    status: "rejected",
    reason: reason
  };
},__name(createPromiseRejectedResult, "createPromiseRejectedResult");