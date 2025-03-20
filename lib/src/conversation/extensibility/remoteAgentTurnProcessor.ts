var GENERATE_RESPONSE_STEP = "generate-response",
  _RemoteAgentAuthorizationError = class _RemoteAgentAuthorizationError extends Error {
    constructor(message, authorizationUri, agentSlug, agentName) {
      super(message);
      this.authorizationUri = authorizationUri;
      this.agentSlug = agentSlug;
      this.agentName = agentName;
    }
  };

,__name(_RemoteAgentAuthorizationError, "RemoteAgentAuthorizationError");

,var RemoteAgentAuthorizationError = _RemoteAgentAuthorizationError,
  _RemoteAgentTurnProcessor = class _RemoteAgentTurnProcessor {
    constructor(agent, turnContext, chatFetcher) {
      this.agent = agent;
      this.turnContext = turnContext;
      this.chatFetcher = chatFetcher;
      var _a;
      this.conversationProgress = turnContext.ctx.get(ConversationProgress), this.chatFetcher = (_a = this.chatFetcher) != null ? _a : new ChatMLFetcher(turnContext.ctx), this.postProcessor = new ChatFetchResultPostProcessor(turnContext, this.chatFetcher, !1), this.conversation = turnContext.conversation, this.turn = turnContext.turn;
    }
    async process(workDoneToken, cancellationToken, followUp, doc) {
      try {
        await this.processWithAgent(workDoneToken, cancellationToken, this.turnContext, doc);
      } catch (err) {
        conversationLogger.error(this.turnContext.ctx, `Error processing turn ${this.turn.id}`, err);
        let errorMessage = err instanceof Error ? err.message : String(err);
        this.turn.status = "error", this.turn.response = {
          message: errorMessage,
          type: "meta"
        }, err instanceof RemoteAgentAuthorizationError ? await this.endProgress({
          unauthorized: {
            authorizationUri: err.authorizationUri,
            agentSlug: err.agentSlug,
            agentName: err.agentName
          }
        }) : await this.endProgress({
          error: {
            message: errorMessage,
            responseIsIncomplete: !0
          }
        });
      }
    }
    async processWithAgent(workDoneToken, cancellationToken, turnContext, doc) {
      var _a, _b;
      await this.conversationProgress.begin(this.conversation, this.turn, workDoneToken);
      let telemetryWithExp = await createTelemetryWithExpWithId(this.turnContext.ctx, this.turn.id, this.conversation.id, {
        languageId: (_a = doc == null ? void 0 : doc.languageId) != null ? _a : ""
      });
      if (cancellationToken.isCancellationRequested) {
        this.turn.status = "cancelled", await this.cancelProgress();
        return;
      }
      let conversationPrompt = await this.buildAgentPrompt(turnContext);
      if (!conversationPrompt) await this.endTurnWithResponse(`No prompt created for agent ${this.agent.id}`, "error");else {
        let promptInspection = {
          type: "user",
          prompt: JSON.stringify(conversationPrompt.messages, null, 2),
          tokens: conversationPrompt.tokens
        };
        await turnContext.ctx.get(ConversationInspector).inspectPrompt(promptInspection), await turnContext.steps.start(GENERATE_RESPONSE_STEP, "Generating response");
        let augmentedTelemetryWithExp = this.augmentTelemetry(conversationPrompt, telemetryWithExp, this.turn.template, doc);
        if (cancellationToken.isCancellationRequested) {
          this.turn.status = "cancelled", await this.cancelProgress();
          return;
        }
        let response = await this.fetchConversationResponse(conversationPrompt.messages, cancellationToken, telemetryWithExp.extendedBy({
          messageSource: "chat.user"
        }, {
          promptTokenLen: conversationPrompt.tokens
        }), augmentedTelemetryWithExp, doc);
        this.turn.status === "cancelled" && ((_b = this.turn.response) == null ? void 0 : _b.type) === "user" ? await this.cancelProgress() : (await this.finishGenerateResponseStep(response, turnContext), await this.endProgress({
          error: response.error,
          followUp: response.followup,
          suggestedTitle: response.suggestedTitle,
          skillResolutions: conversationPrompt.skillResolutions
        }));
      }
    }
    async buildAgentPrompt(turnContext) {
      let messages = this.createMessagesFromHistory(turnContext),
        outgoingReferences = await this.computeCopilotReferences(turnContext),
        sessionId = this.getOrCreateAgentSessionId(turnContext);
      return this.turn.agent && (this.turn.agent.sessionId = sessionId), this.turn.confirmationResponse ? this.addConfirmationResponse(this.turn.confirmationResponse, messages) : messages.push({
        role: "user",
        content: turnContext.turn.request.message,
        copilot_references: outgoingReferences.length > 0 ? outgoingReferences : void 0
      }), {
        messages: messages,
        tokens: -1,
        skillResolutions: []
      };
    }
    getOrCreateAgentSessionId(turnContext) {
      var _a, _b;
      let agentSlug = (_a = this.turn.agent) == null ? void 0 : _a.agentSlug;
      if (agentSlug) {
        for (let turn of turnContext.conversation.turns) if (((_b = turn.agent) == null ? void 0 : _b.agentSlug) === agentSlug && turn.agent.sessionId) return turn.agent.sessionId;
      }
      return v4_default();
    }
    addConfirmationResponse(confirmationResponse, messages) {
      messages.push({
        role: "user",
        content: "",
        copilot_confirmations: [confirmationResponse]
      });
    }
    createMessagesFromHistory(turnContext) {
      return filterTurns(turnContext.conversation.turns.slice(0, -1), this.agent.slug).flatMap(turn => {
        let messages = [];
        if (turn.request && messages.push({
          role: "user",
          content: turn.request.message
        }), turn.response && turn.response.type === "model") {
          let references = convertToCopilotReferences(turn.response.references);
          messages.push({
            role: "assistant",
            content: turn.response.message,
            copilot_references: references.length > 0 ? references : void 0
          });
        }
        return messages;
      });
    }
    async computeCopilotReferences(turnContext) {
      return await skillsToReference(turnContext);
    }
    async endTurnWithResponse(response, status) {
      this.turn.response = {
        type: "meta",
        message: response
      }, this.turn.status = status, await this.conversationProgress.report(this.conversation, this.turn, {
        reply: response
      }), await this.endProgress();
    }
    async fetchConversationResponse(messages, token, baseTelemetryWithExp, augmentedTelemetryWithExp, doc) {
      var _a, _b;
      token.onCancellationRequested(async () => {
        await this.cancelProgress();
      });
      let finishCallback = new ConversationFinishCallback((text, annotations, references, errors, confirmation) => {
          let confirmationRequest = confirmation ? {
            ...confirmation,
            agentSlug: this.agent.slug
          } : void 0;
          this.conversationProgress.report(this.conversation, this.turn, {
            reply: text,
            annotations: annotations,
            references: references,
            notifications: errors.map(e => ({
              message: e.message,
              severity: "warning"
            })),
            confirmationRequest: confirmationRequest
          }), this.turn.response ? (this.turn.response.message += text, this.turn.response.references.push(...references)) : this.turn.response = {
            message: text,
            type: "model",
            references: references
          }, this.turn.annotations.push(...(annotations != null ? annotations : [])), confirmationRequest && (this.turn.confirmationRequest = confirmationRequest);
        }),
        agentsUrl = this.turnContext.ctx.get(NetworkConfiguration).getCAPIUrl(this.turnContext.ctx, "agents"),
        authToken = await this.turnContext.ctx.get(CopilotTokenManager).getGitHubToken(),
        params = {
          engineUrl: agentsUrl,
          endpoint: (_a = this.agent.endpoint) != null ? _a : this.agent.slug,
          messages: messages,
          uiKind: "conversationPanel",
          intentParams: {
            intent: !0,
            intent_threshold: .7,
            intent_content: this.turn.request.message
          },
          authToken: authToken,
          copilot_thread_id: (_b = this.turn.agent) == null ? void 0 : _b.sessionId
        },
        fetchResult = await this.chatFetcher.fetchResponse(params, token, baseTelemetryWithExp, async (text, delta) => finishCallback.isFinishedAfter(text, delta));
      return this.ensureAgentIsAuthorized(fetchResult), await this.postProcessor.postProcess(fetchResult, token, finishCallback.appliedText, baseTelemetryWithExp, augmentedTelemetryWithExp.extendedBy(this.addExtensibilityInfoTelemetry()), this.turn.request.message, "conversationPanel", doc);
    }
    ensureAgentIsAuthorized(fetchResult) {
      if (fetchResult.type === "agentAuthRequired") throw this.turnContext.turn.status = "error", this.turnContext.turn.response = {
        message: "Authorization required",
        type: "server"
      }, new RemoteAgentAuthorizationError("Authorization required", fetchResult.authUrl, this.agent.slug, this.agent.name);
    }
    augmentTelemetry(conversationPrompt, userTelemetryWithExp, template, doc) {
      return extendUserMessageTelemetryData(this.conversation, "conversationPanel", this.turn.request.message.length, conversationPrompt.tokens, template == null ? void 0 : template.templateId, void 0, userTelemetryWithExp, conversationPrompt.skillResolutions);
    }
    addExtensibilityInfoTelemetry() {
      var _a, _b, _c, _d, _e;
      return {
        extensibilityInfoJson: JSON.stringify({
          agent: this.agent.slug,
          outgoingReferences: (_b = (_a = this.turn.request.references) == null ? void 0 : _a.map(r => r.type)) != null ? _b : [],
          incomingReferences: (_e = (_d = (_c = this.turn.response) == null ? void 0 : _c.references) == null ? void 0 : _d.map(r => r.type)) != null ? _e : []
        })
      };
    }
    async finishGenerateResponseStep(response, turnContext) {
      response.error ? await turnContext.steps.error(GENERATE_RESPONSE_STEP, response.error.message) : await turnContext.steps.finish(GENERATE_RESPONSE_STEP);
    }
    async endProgress(payload) {
      await this.turnContext.steps.finishAll(), await this.conversationProgress.end(this.conversation, this.turn, payload);
    }
    async cancelProgress() {
      await this.turnContext.steps.finishAll("cancelled"), await this.conversationProgress.cancel(this.conversation, this.turn);
    }
  };

,__name(_RemoteAgentTurnProcessor, "RemoteAgentTurnProcessor");

,var RemoteAgentTurnProcessor = _RemoteAgentTurnProcessor;