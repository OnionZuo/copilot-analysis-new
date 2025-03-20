var ghostTextLogger = new Logger("ghostText"),
  _position,
  _uri,
  _shownCompletions,
  _LastGhostText = class _LastGhostText {
    constructor() {
      __privateAdd(this, _position);
      __privateAdd(this, _uri);
      __privateAdd(this, _shownCompletions, []);
    }
    get position() {
      return __privateGet(this, _position);
    }
    get shownCompletions() {
      return __privateGet(this, _shownCompletions) || [];
    }
    get uri() {
      return __privateGet(this, _uri);
    }
    resetState() {
      __privateSet(this, _uri, void 0), __privateSet(this, _position, void 0), __privateSet(this, _shownCompletions, []);
    }
    setState({
      uri: uri
    }, position) {
      __privateSet(this, _uri, uri), __privateSet(this, _position, position), __privateSet(this, _shownCompletions, []);
    }
    resetPartialAcceptanceState() {
      this.partiallyAcceptedLength = 0;
    }
  };

,_position = new WeakMap(), _uri = new WeakMap(), _shownCompletions = new WeakMap(), __name(_LastGhostText, "LastGhostText");

,var LastGhostText = _LastGhostText;

,function computeRejectedCompletions(last) {
  let rejectedCompletions = [];
  return last.shownCompletions.forEach(c => {
    if (c.displayText && c.telemetry) {
      let completionText, completionTelemetryData;
      last.partiallyAcceptedLength ? (completionText = c.displayText.substring(last.partiallyAcceptedLength - 1), completionTelemetryData = c.telemetry.extendedBy({
        compType: "partial"
      }, {
        compCharLen: completionText.length
      })) : (completionText = c.displayText, completionTelemetryData = c.telemetry);
      let rejection = {
        completionText: completionText,
        completionTelemetryData: completionTelemetryData,
        offset: c.offset
      };
      rejectedCompletions.push(rejection);
    }
  }), rejectedCompletions;
},__name(computeRejectedCompletions, "computeRejectedCompletions");

,function rejectLastShown(ctx, offset) {
  let last = ctx.get(LastGhostText);
  if (!last.position || !last.uri) return;
  let rejectedCompletions = computeRejectedCompletions(last);
  rejectedCompletions.length > 0 && postRejectionTasks(ctx, "ghostText", offset != null ? offset : rejectedCompletions[0].offset, last.uri, rejectedCompletions), last.resetState(), last.resetPartialAcceptanceState();
},__name(rejectLastShown, "rejectLastShown");

,function setLastShown(ctx, document, position, resultType) {
  let last = ctx.get(LastGhostText);
  return last.position && last.uri && !(last.position.line === position.line && last.position.character === position.character && last.uri.toString() === document.uri.toString()) && resultType !== 2 && rejectLastShown(ctx, document.offsetAt(last.position)), last.setState(document, position), last.index;
},__name(setLastShown, "setLastShown");

,function handleGhostTextShown(ctx, cmp) {
  var _a, _b;
  let last = ctx.get(LastGhostText);
  if (last.index = cmp.index, !last.shownCompletions.find(c => c.index === cmp.index) && (cmp.uri === last.uri && ((_a = last.position) == null ? void 0 : _a.line) === cmp.position.line && ((_b = last.position) == null ? void 0 : _b.character) == cmp.position.character && last.shownCompletions.push(cmp), cmp.displayText)) {
    let fromCache = cmp.resultType !== 0;
    ghostTextLogger.debug(ctx, `[${cmp.telemetry.properties.headerRequestId}] shown choiceIndex: ${cmp.telemetry.properties.choiceIndex}, fromCache ${fromCache}`), cmp.telemetry.measurements.compCharLen = cmp.displayText.length, telemetryShown(ctx, "ghostText", cmp);
  }
},__name(handleGhostTextShown, "handleGhostTextShown");

,function handleGhostTextPostInsert(ctx, cmp) {
  let last = ctx.get(LastGhostText);
  last.resetState(), ghostTextLogger.debug(ctx, "Ghost text post insert");
  let suggestionStatus = last.partiallyAcceptedLength ? {
    compType: "partial",
    acceptedLength: cmp.displayText.length
  } : {
    compType: "full"
  };
  return last.resetPartialAcceptanceState(), postInsertionTasks(ctx, "ghostText", cmp.displayText, cmp.offset, cmp.uri, cmp.telemetry, suggestionStatus, cmp.copilotAnnotations);
},__name(handleGhostTextPostInsert, "handleGhostTextPostInsert");

,function handlePartialGhostTextPostInsert(ctx, cmp, acceptedLength, triggerKind = 0) {
  let last = ctx.get(LastGhostText);
  acceptedLength === cmp.insertText.length && last.resetState(), ghostTextLogger.debug(ctx, "Ghost text partial post insert");
  let partialAcceptanceLength = computePartialLength(cmp, acceptedLength, triggerKind);
  if (partialAcceptanceLength) return last.partiallyAcceptedLength = acceptedLength, postInsertionTasks(ctx, "ghostText", cmp.displayText, cmp.offset, cmp.uri, cmp.telemetry, {
    compType: "partial",
    acceptedLength: partialAcceptanceLength
  }, cmp.copilotAnnotations);
},__name(handlePartialGhostTextPostInsert, "handlePartialGhostTextPostInsert");