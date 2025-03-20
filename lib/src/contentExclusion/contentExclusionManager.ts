var _featureEnabled,
  _contentExclusions,
  _CopilotContentExclusionManager_instances,
  trackEvaluationResult_fn,
  _CopilotContentExclusionManager = class _CopilotContentExclusionManager {
    constructor(ctx) {
      this.ctx = ctx;
      __privateAdd(this, _CopilotContentExclusionManager_instances);
      __privateAdd(this, _featureEnabled, !1);
      __privateAdd(this, _contentExclusions, new CopilotContentExclusion(this.ctx));
      this.evaluateResultCache = new Map();
      this.onDidChangeActiveTextEditor = __name(async e => {
        if (!__privateGet(this, _featureEnabled)) return;
        if (!e) {
          this.updateStatusIcon(!1);
          return;
        }
        let result = await this.ctx.get(TextDocumentManager).getTextDocumentWithValidation(e.document),
          isBlocked = result.status === "invalid",
          reason = result.status === "invalid" ? result.reason : void 0;
        this.updateStatusIcon(isBlocked, reason);
      }, "onDidChangeActiveTextEditor");
      this.ctx.get(TextDocumentManager).onDidFocusTextDocument(this.onDidChangeActiveTextEditor), onCopilotToken(this.ctx, token => {
        var _a;
        __privateSet(this, _featureEnabled, (_a = token.envelope.copilotignore_enabled) != null ? _a : !1), this.evaluateResultCache.clear(), __privateGet(this, _contentExclusions).refresh();
      });
    }
    get enabled() {
      return __privateGet(this, _featureEnabled);
    }
    async evaluate(uri, fileContent, shouldUpdateStatusBar) {
      var _a;
      let isSupported = isSupportedUriScheme(uri);
      if (isSupported || logger.debug(this.ctx, `Unsupported file URI <${uri}>`), !__privateGet(this, _featureEnabled) || !isSupported) return {
        isBlocked: !1
      };
      let events = [],
        track = __name(async (key, ev) => {
          let startTimeMs = Date.now(),
            result = await ev.evaluate(uri, fileContent),
            endTimeMs = Date.now();
          return events.push({
            key: key,
            result: result,
            elapsedMs: endTimeMs - startTimeMs
          }), result;
        }, "track"),
        result = (_a = (await Promise.all([track("contentExclusion.evaluate", __privateGet(this, _contentExclusions))])).find(r => r == null ? void 0 : r.isBlocked)) != null ? _a : {
          isBlocked: !1
        };
      try {
        for (let event of events) __privateMethod(this, _CopilotContentExclusionManager_instances, trackEvaluationResult_fn).call(this, event.key, uri, event.result, event.elapsedMs);
      } catch (e) {
        logger.error(this.ctx, "Error tracking telemetry", e);
      }
      return shouldUpdateStatusBar === "UPDATE" && this.updateStatusIcon(result.isBlocked, result.message), result;
    }
    updateStatusIcon(isBlocked, reason) {
      __privateGet(this, _featureEnabled) && (isBlocked ? this.ctx.get(StatusReporter).setInactive(reason != null ? reason : "Copilot is disabled") : this.ctx.get(StatusReporter).clearInactive());
    }
    setTestingRules(rules) {
      __privateGet(this, _contentExclusions).setTestingRules(rules);
    }
    set __contentExclusions(contentRestrictions) {
      __privateSet(this, _contentExclusions, contentRestrictions);
    }
    get __contentExclusions() {
      return __privateGet(this, _contentExclusions);
    }
  };

,_featureEnabled = new WeakMap(), _contentExclusions = new WeakMap(), _CopilotContentExclusionManager_instances = new WeakSet(), trackEvaluationResult_fn = __name(function (key, uri, result, elapsedMs) {
  var _a, _b;
  let cacheKey = uri + key;
  if (this.evaluateResultCache.get(cacheKey) === result.reason) return !1;
  if (this.evaluateResultCache.set(cacheKey, (_a = result.reason) != null ? _a : "UNKNOWN"), result.reason === NOT_BLOCKED_NO_MATCHING_POLICY_RESPONSE.reason) return logger.debug(this.ctx, `[${key}] No matching policy for this repository. uri: ${uri}`), !1;
  let properties = {
      isBlocked: result.isBlocked ? "true" : "false",
      reason: (_b = result.reason) != null ? _b : "UNKNOWN"
    },
    measurements = {
      elapsedMs: elapsedMs
    };
  return telemetry(this.ctx, key, TelemetryData.createAndMarkAsIssued(properties, measurements)), telemetry(this.ctx, key, TelemetryData.createAndMarkAsIssued({
    ...properties,
    path: uri
  }, measurements), 1), logger.debug(this.ctx, `[${key}] ${uri}`, result), !0;
}, "#trackEvaluationResult"), __name(_CopilotContentExclusionManager, "CopilotContentExclusionManager");

,var CopilotContentExclusionManager = _CopilotContentExclusionManager;