var _transientAuthRecord,
  _AuthManager = class _AuthManager {
    constructor(authPersistence, _copilotTokenManager) {
      this.authPersistence = authPersistence;
      this._copilotTokenManager = _copilotTokenManager;
      __privateAdd(this, _transientAuthRecord);
      this.pendingSignIn = void 0;
    }
    getCopilotTokenManager() {
      return this._copilotTokenManager;
    }
    async checkAndUpdateStatus(ctx, options) {
      var _a, _b;
      let localChecksOnly = (_a = options == null ? void 0 : options.localChecksOnly) != null ? _a : !1,
        authRecord = getAuthRecordFromEnv(process.env);
      return authRecord === void 0 && (authRecord = await this.getAuthRecord(options == null ? void 0 : options.githubAppId)), authRecord === void 0 ? (this._copilotTokenManager.resetToken(), await this._copilotTokenManager.primeToken(), {
        status: "NotSignedIn"
      }) : localChecksOnly ? {
        status: "MaybeOK",
        user: authRecord.user
      } : (options != null && options.forceRefresh && this._copilotTokenManager.resetToken(), {
        status: await this.getTokenWithSignUpLimited(ctx, authRecord, (_b = options == null ? void 0 : options.freshSignIn) != null ? _b : !1),
        user: authRecord.user
      });
    }
    async getAuthRecord(githubAppId) {
      var _a;
      if (__privateGet(this, _transientAuthRecord) !== null) return (_a = __privateGet(this, _transientAuthRecord)) != null ? _a : this.getPersistedAuthRecord(githubAppId);
    }
    async getTokenWithSignUpLimited(ctx, authRecord, freshSignIn) {
      var _a;
      try {
        await this._copilotTokenManager.getToken();
      } catch (e) {
        if (e instanceof TokenResultError) return freshSignIn && (_a = e.result.envelope) != null && _a.can_signup_for_limited && (await this.signUpLimited(ctx, authRecord)) ? this.getTokenWithSignUpLimited(ctx, authRecord, !1) : e.result.reason === "HTTP401" ? "NotSignedIn" : e.result.reason;
        throw e;
      }
      return "OK";
    }
    async getPersistedAuthRecord(githubAppId) {
      return await this.authPersistence.getAuthRecord(githubAppId);
    }
    async getGitHubToken(ctx) {
      var _a;
      let authRecord = (_a = getAuthRecordFromEnv(process.env)) != null ? _a : await this.getAuthRecord();
      if (authRecord === void 0) return;
      let gitHubToken = {
        token: authRecord.oauth_token
      };
      return authRecord.dev_override && getBuildType(ctx) === "dev" && (gitHubToken.devOverride = {
        copilotTokenUrl: authRecord.dev_override.copilot_token_url,
        notificationUrl: authRecord.dev_override.notification_url,
        contentRestrictionsUrl: authRecord.dev_override.content_restrictions_url
      }), gitHubToken;
    }
    async signUpLimited(ctx, authRecord) {
      let signUpLimitedUrl = ctx.get(NetworkConfiguration).getSignUpLimitedUrl();
      try {
        let signUpLimitedResult = await (await ctx.get(Fetcher).fetch(signUpLimitedUrl, {
          headers: {
            Authorization: `token ${authRecord.oauth_token}`,
            ...editorVersionHeaders(ctx)
          },
          method: "POST",
          body: JSON.stringify({
            restricted_telemetry: ctx.get(TelemetryInitialization).isEnabled ? "enabled" : "disabled",
            public_code_suggestions: "enabled"
          })
        })).json();
        return (signUpLimitedResult == null ? void 0 : signUpLimitedResult.subscribed) || !1;
      } catch (error) {
        return authLogger.exception(ctx, error, "signUpLimited failed"), !1;
      }
    }
    async setAuthRecord(ctx, authRecord) {
      await this.authPersistence.saveAuthRecord(authRecord), this._copilotTokenManager.resetToken();
    }
    setTransientAuthRecord(ctx, authRecord, resetToken = !0) {
      __privateSet(this, _transientAuthRecord, authRecord), resetToken && this._copilotTokenManager.resetToken();
    }
    async deleteAuthRecord(ctx) {
      await this.authPersistence.deleteAuthRecord(), !__privateGet(this, _transientAuthRecord) && (this._copilotTokenManager.resetToken(), await this._copilotTokenManager.primeToken());
    }
  };

,_transientAuthRecord = new WeakMap(), __name(_AuthManager, "AuthManager");

,var AuthManager = _AuthManager;

,function getAuthRecordFromEnv(env) {
  if (env.GH_COPILOT_TOKEN && !/=/.test(env.GH_COPILOT_TOKEN)) return {
    user: "<environment-variable-user>",
    oauth_token: env.GH_COPILOT_TOKEN
  };
  if (env.GITHUB_COPILOT_TOKEN) return {
    user: "<environment-variable-user>",
    oauth_token: env.GITHUB_COPILOT_TOKEN
  };
  if (env.CODESPACES === "true" && env.GITHUB_TOKEN) return {
    user: env.GITHUB_USER || "<codespaces-user>",
    oauth_token: env.GITHUB_TOKEN
  };
},__name(getAuthRecordFromEnv, "getAuthRecordFromEnv");