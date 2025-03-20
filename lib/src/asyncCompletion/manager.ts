var _hasKnownOrg,
  _logger,
  _AsyncCompletionManager = class _AsyncCompletionManager {
    constructor(ctx) {
      this.ctx = ctx;
      __privateAdd(this, _hasKnownOrg, !1);
      __privateAdd(this, _logger, new Logger("AsyncCompletionManager"));
      this.requests = new LRUCacheMap(100);
      this.mostRecentRequestId = "";
      onCopilotToken(ctx, token => {
        __privateSet(this, _hasKnownOrg, token.hasKnownOrg);
      });
    }
    clear() {
      this.requests.clear();
    }
    isEnabled(telemetryWithExp) {
      let config = getConfig(this.ctx, ConfigKey.UseAsyncCompletions);
      return __privateGet(this, _hasKnownOrg) && typeof config == "boolean" ? config : this.ctx.get(Features).enableAsyncCompletions(telemetryWithExp);
    }
    shouldWaitForAsyncCompletions(prefix, prompt) {
      for (let [_, request] of this.requests) if (isCandidate(prefix, prompt, request)) return !0;
      return !1;
    }
    updateCompletion(headerRequestId, text) {
      let request = this.requests.get(headerRequestId);
      request !== void 0 && (request.partialCompletionText = text, request.subject.next(request));
    }
    queueCompletionRequest(headerRequestId, prefix, prompt, cancellationTokenSource, resultPromise) {
      __privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Queueing async completion request:`, prefix.substring(prefix.lastIndexOf(`
`) + 1));
      let subject = new ReplaySubject();
      return this.requests.set(headerRequestId, {
        state: 2,
        cancellationTokenSource: cancellationTokenSource,
        headerRequestId: headerRequestId,
        prefix: prefix,
        prompt: prompt,
        subject: subject
      }), resultPromise.then(result => {
        if (this.requests.delete(headerRequestId), result.type !== "success") {
          __privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Request failed with`, result.reason), subject.error(result.reason);
          return;
        }
        let completed = {
          cancellationTokenSource: cancellationTokenSource,
          headerRequestId: headerRequestId,
          prefix: prefix,
          prompt: prompt,
          subject: subject,
          choice: result.value[0],
          result: result,
          state: 0,
          allChoicesPromise: result.value[1]
        };
        this.requests.set(headerRequestId, completed), subject.next(completed), subject.complete();
      }).catch(e => {
        __privateGet(this, _logger).error(this.ctx, `[${headerRequestId}] Request errored with`, e), this.requests.delete(headerRequestId), subject.error(e);
      });
    }
    getFirstMatchingRequestWithTimeout(headerRequestId, prefix, prompt, isSpeculative, telemetryWithExp) {
      let timeout = this.ctx.get(Features).asyncCompletionsTimeout(telemetryWithExp);
      return timeout < 0 ? (__privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Waiting for completions without timeout`), this.getFirstMatchingRequest(headerRequestId, prefix, prompt, isSpeculative)) : (__privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Waiting for completions with timeout of ${timeout}ms`), Promise.race([this.getFirstMatchingRequest(headerRequestId, prefix, prompt, isSpeculative), new Promise(r => setTimeout(() => r(null), timeout))]).then(result => {
        if (result === null) {
          __privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Timed out waiting for completion`);
          return;
        }
        return result;
      }));
    }
    async getFirstMatchingRequest(headerRequestId, prefix, prompt, isSpeculative) {
      isSpeculative || (this.mostRecentRequestId = headerRequestId);
      let resolved = !1,
        deferred = new Deferred(),
        subscriptions = new Map(),
        finishRequest = __name(id => () => {
          let subscription = subscriptions.get(id);
          subscription !== void 0 && (subscription(), subscriptions.delete(id), !resolved && subscriptions.size === 0 && (resolved = !0, __privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] No matching completions found`), deferred.resolve(void 0)));
        }, "finishRequest"),
        next = __name(request => {
          if (isCandidate(prefix, prompt, request)) {
            if (request.state === 0) {
              let remainingPrefix = prefix.substring(request.prefix.length),
                {
                  completionText: completionText
                } = request.choice;
              if (!completionText.startsWith(remainingPrefix) || completionText.length <= remainingPrefix.length) {
                finishRequest(request.headerRequestId)();
                return;
              }
              completionText = completionText.substring(remainingPrefix.length), request.choice.telemetryData.measurements.foundOffset = remainingPrefix.length, __privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Found completion at offset ${remainingPrefix.length}: ${JSON.stringify(completionText)}`), deferred.resolve([{
                ...request.choice,
                completionText: completionText
              }, request.allChoicesPromise]), resolved = !0;
            }
          } else this.cancelRequest(headerRequestId, request), finishRequest(request.headerRequestId)();
        }, "next");
      for (let [id, request] of this.requests) isCandidate(prefix, prompt, request) ? subscriptions.set(id, request.subject.subscribe({
        next: next,
        error: finishRequest(id),
        complete: finishRequest(id)
      })) : this.cancelRequest(headerRequestId, request);
      return deferred.promise.finally(() => {
        for (let dispose of subscriptions.values()) dispose();
      });
    }
    cancelRequest(headerRequestId, request) {
      headerRequestId === this.mostRecentRequestId && request.state !== 0 && (__privateGet(this, _logger).debug(this.ctx, `[${headerRequestId}] Cancelling request: ${request.headerRequestId}`), request.cancellationTokenSource.cancel(), this.requests.delete(request.headerRequestId));
    }
  };

,_hasKnownOrg = new WeakMap(), _logger = new WeakMap(), __name(_AsyncCompletionManager, "AsyncCompletionManager");

,var AsyncCompletionManager = _AsyncCompletionManager;

,function isCandidate(prefix, prompt, request) {
  if (request.prompt.suffix !== prompt.suffix || !prefix.startsWith(request.prefix)) return !1;
  let remainingPrefix = prefix.substring(request.prefix.length);
  return request.state === 0 ? request.choice.completionText.startsWith(remainingPrefix) && request.choice.completionText.trimEnd().length > remainingPrefix.length : request.partialCompletionText === void 0 ? !0 : request.partialCompletionText.startsWith(remainingPrefix);
},__name(isCandidate, "isCandidate");