function CurrentFile(_props, context) {
  let [document, setDocument] = context.useState(),
    [position, setPosition] = context.useState(),
    [suffixMatchThreshold, setSuffixMatchThreshold] = context.useState();
  return context.useData(isCompletionRequestData, request => {
    let requestDocument = request.document;
    (request.document.uri !== (document == null ? void 0 : document.uri) || requestDocument.getText() !== (document == null ? void 0 : document.getText())) && setDocument(requestDocument), request.position !== position && setPosition(request.position), request.suffixMatchThreshold !== suffixMatchThreshold && setSuffixMatchThreshold(request.suffixMatchThreshold);
  }), functionComponentFunction(fragmentFunction, {
    children: [functionComponentFunction(BeforeCursor, {
      document: document,
      position: position
    }), functionComponentFunction(AfterCursor, {
      document: document,
      position: position,
      suffixMatchThreshold: suffixMatchThreshold
    })]
  });
},__name(CurrentFile, "CurrentFile");

,function BeforeCursor(props) {
  return props.document === void 0 || props.position === void 0 ? functionComponentFunction(Text, {}) : functionComponentFunction(Text, {
    children: props.document.getText({
      start: {
        line: 0,
        character: 0
      },
      end: props.position
    })
  });
},__name(BeforeCursor, "BeforeCursor");

,function AfterCursor(props, context) {
  var _a, _b;
  let [cachedSuffix, setCachedSuffix] = context.useState("");
  if (props.document === void 0 || props.position === void 0) return functionComponentFunction(Text, {});
  let trimmedSuffix = props.document.getText({
    start: props.position,
    end: {
      line: Number.MAX_VALUE,
      character: Number.MAX_VALUE
    }
  }).replace(/^.*/, "").trimStart();
  if (trimmedSuffix === "") return functionComponentFunction(Text, {});
  if (cachedSuffix === trimmedSuffix) return functionComponentFunction(Text, {
    children: cachedSuffix
  });
  let suffixToUse = trimmedSuffix;
  if (cachedSuffix !== "") {
    let tokenizer = getTokenizer(),
      firstSuffixTokens = tokenizer.takeFirstTokens(trimmedSuffix, MAX_EDIT_DISTANCE_LENGTH);
    firstSuffixTokens.tokens.length > 0 && 100 * ((_a = findEditDistanceScore(firstSuffixTokens.tokens, tokenizer.takeFirstTokens(cachedSuffix, MAX_EDIT_DISTANCE_LENGTH).tokens)) == null ? void 0 : _a.score) < ((_b = props.suffixMatchThreshold) != null ? _b : DEFAULT_SUFFIX_MATCH_THRESHOLD) * firstSuffixTokens.tokens.length && (suffixToUse = cachedSuffix);
  }
  return suffixToUse !== cachedSuffix && setCachedSuffix(suffixToUse), functionComponentFunction(Text, {
    children: suffixToUse
  });
},__name(AfterCursor, "AfterCursor");