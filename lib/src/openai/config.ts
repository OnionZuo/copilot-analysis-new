function getProxyURLWithPath(ctx, path) {
  return ctx.get(NetworkConfiguration).getCompletionsUrl(ctx, path);
},__name(getProxyURLWithPath, "getProxyURLWithPath");

,function getCapiURLWithPath(ctx, path) {
  let capiUrl = ctx.get(NetworkConfiguration).getCAPIUrl(ctx);
  return joinPath(capiUrl, path);
},__name(getCapiURLWithPath, "getCapiURLWithPath");

,function getEngineRequestInfo(ctx, telemetryData = void 0) {
  let modelRequestInfo = ctx.get(AvailableModelsManager).getCurrentModelRequestInfo(telemetryData);
  return {
    url: getProxyURLWithPath(ctx, modelRequestInfo.path),
    headers: modelRequestInfo.headers,
    modelId: modelRequestInfo.modelId,
    engineChoiceSource: modelRequestInfo.modelChoiceSource
  };
},__name(getEngineRequestInfo, "getEngineRequestInfo");