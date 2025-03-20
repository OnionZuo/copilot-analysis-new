function telemetryShown(ctx, insertionCategory, completion) {
  completion.telemetry.markAsDisplayed(), completion.telemetry.properties.reason = resultTypeToString(completion.resultType), telemetry(ctx, `${insertionCategory}.shown`, completion.telemetry);
},__name(telemetryShown, "telemetryShown");

,function telemetryAccepted(ctx, insertionCategory, telemetryData) {
  let telemetryName = insertionCategory + ".accepted",
    cfManager = ctx.get(ContextualFilterManager);
  cfManager.previousLabel = 1, cfManager.previousLabelTimestamp = Date.now(), telemetry(ctx, telemetryName, telemetryData);
},__name(telemetryAccepted, "telemetryAccepted");

,function telemetryRejected(ctx, insertionCategory, telemetryData) {
  let telemetryName = insertionCategory + ".rejected",
    cfManager = ctx.get(ContextualFilterManager);
  cfManager.previousLabel = 0, cfManager.previousLabelTimestamp = Date.now(), telemetry(ctx, telemetryName, telemetryData);
},__name(telemetryRejected, "telemetryRejected");

,function mkCanceledResultTelemetry(telemetryBlob, extraFlags = {}) {
  return {
    ...extraFlags,
    telemetryBlob: telemetryBlob
  };
},__name(mkCanceledResultTelemetry, "mkCanceledResultTelemetry");

,function mkBasicResultTelemetry(telemetryBlob) {
  let result = {
    headerRequestId: telemetryBlob.properties.headerRequestId,
    copilot_trackingId: telemetryBlob.properties.copilot_trackingId
  };
  return telemetryBlob.properties.sku !== void 0 && (result.sku = telemetryBlob.properties.sku), telemetryBlob.properties.opportunityId !== void 0 && (result.opportunityId = telemetryBlob.properties.opportunityId), telemetryBlob.properties.organizations_list !== void 0 && (result.organizations_list = telemetryBlob.properties.organizations_list), telemetryBlob.properties.enterprise_list !== void 0 && (result.enterprise_list = telemetryBlob.properties.enterprise_list), telemetryBlob.properties.clientCompletionId !== void 0 && (result.clientCompletionId = telemetryBlob.properties.clientCompletionId), result["abexp.assignmentcontext"] = telemetryBlob.filtersAndExp.exp.assignmentContext, result;
},__name(mkBasicResultTelemetry, "mkBasicResultTelemetry");

,function handleGhostTextResultTelemetry(ctx, result) {
  if (result.type === "success") {
    let timeToProduceMs = now() - result.telemetryBlob.issuedTime,
      reason = resultTypeToString(result.resultType),
      properties = {
        ...result.telemetryData,
        reason: reason
      },
      {
        foundOffset: foundOffset
      } = result.telemetryBlob.measurements;
    return logger.debug(ctx, `ghostText produced from ${reason} in ${timeToProduceMs}ms with foundOffset ${foundOffset}`), telemetryRaw(ctx, "ghostText.produced", properties, {
      timeToProduceMs: timeToProduceMs,
      foundOffset: foundOffset
    }), result.value;
  }
  if (result.type !== "promptOnly") {
    if (result.type === "canceled") {
      telemetry(ctx, "ghostText.canceled", result.telemetryData.telemetryBlob.extendedBy({
        reason: result.reason,
        cancelledNetworkRequest: result.telemetryData.cancelledNetworkRequest ? "true" : "false"
      }));
      return;
    }
    telemetryRaw(ctx, `ghostText.${result.type}`, {
      ...result.telemetryData,
      reason: result.reason
    }, {});
  }
},__name(handleGhostTextResultTelemetry, "handleGhostTextResultTelemetry");

,function resultTypeToString(resultType) {
  switch (resultType) {
    case 0:
      return "network";
    case 1:
      return "cache";
    case 3:
      return "cycling";
    case 2:
      return "typingAsSuggested";
    case 4:
      return "async";
  }
},__name(resultTypeToString, "resultTypeToString");