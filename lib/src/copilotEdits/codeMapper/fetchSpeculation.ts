var SpeculationFetchParam = Type.Object({
    prompt: Type.String(),
    speculation: Type.String(),
    languageId: Type.String(),
    stops: Type.Array(Type.String())
  }),
  _SpeculationFetcher = class _SpeculationFetcher {
    constructor(ctx) {
      this.ctx = ctx;
    }
    async fetchSpeculation(params, ct) {
      let engineUrl = getProxyURLWithPath(this.ctx, "/v1/engines/copilot-centralus-h100"),
        speculationParams = {
          prompt: params.prompt,
          speculation: params.speculation,
          engineUrl: engineUrl,
          uiKind: "editsPanel",
          temperature: 0,
          stream: !0,
          stops: params.stops
        },
        telemetryWithExp = await this.ctx.get(Features).updateExPValuesAndAssignments(),
        res = await this.ctx.get(OpenAIFetcher).fetchAndStreamSpeculation(this.ctx, speculationParams, telemetryWithExp, async (text, delta) => {}, ct);
      switch (res.type) {
        case "success":
          return res;
        case "canceled":
          throw new FetchSpeculationCanceledException(res.reason);
        case "failed":
          throw new FetchSpeculationFailedException(res.reason);
      }
    }
  };

,__name(_SpeculationFetcher, "SpeculationFetcher");

,var SpeculationFetcher = _SpeculationFetcher;