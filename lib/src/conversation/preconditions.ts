var import_node_events = fn(require("events"));

,var _TokenPreconditionCheck = class _TokenPreconditionCheck {
  async check(ctx) {
    let authRecord = await ctx.get(AuthManager).getAuthRecord(),
      appInfo = ctx.get(GitHubAppInfo),
      fallbackAppId = appInfo.fallbackAppId();
    return authRecord && authRecord.githubAppId && authRecord.githubAppId !== fallbackAppId ? {
      type: "token",
      status: "ok"
    } : {
      type: "token",
      status: "failed",
      githubAppId: appInfo.githubAppId
    };
  }
};

,__name(_TokenPreconditionCheck, "TokenPreconditionCheck");

,var TokenPreconditionCheck = _TokenPreconditionCheck,
  _ChatEnabledPreconditionCheck = class _ChatEnabledPreconditionCheck {
    async check(ctx) {
      return {
        type: "chat_enabled",
        status: (await ctx.get(CopilotTokenManager).getToken()).envelope.chat_enabled ? "ok" : "failed"
      };
    }
  };

,__name(_ChatEnabledPreconditionCheck, "ChatEnabledPreconditionCheck");

,var ChatEnabledPreconditionCheck = _ChatEnabledPreconditionCheck,
  PRECONDITION_CHECKS = [new TokenPreconditionCheck(), new ChatEnabledPreconditionCheck()],
  preconditionsChangedEvent = "onPreconditionsChanged",
  _PreconditionsCheck = class _PreconditionsCheck {
    constructor(ctx, checks = PRECONDITION_CHECKS) {
      this.ctx = ctx;
      this.checks = checks;
      this.emitter = new lje.EventEmitter();
      onCopilotToken(ctx, async () => {
        await this.check();
      });
    }
    check(forceCheck) {
      return forceCheck && (this.result = void 0), this.result === void 0 && (this.result = this.requestChecks()), this.result;
    }
    async requestChecks() {
      let results = [];
      this.checks.length > 0 && (results = await Promise.all(this.checks.map(check => check.check(this.ctx))));
      let status = results.every(p => p.status === "ok") ? "ok" : "failed",
        result = {
          results: results,
          status: status
        };
      return this.emit(result), result;
    }
    onChange(listener) {
      this.emitter.on(preconditionsChangedEvent, listener);
    }
    emit(result) {
      this.emitter.emit(preconditionsChangedEvent, result);
    }
  };

,__name(_PreconditionsCheck, "PreconditionsCheck");

,var PreconditionsCheck = _PreconditionsCheck;