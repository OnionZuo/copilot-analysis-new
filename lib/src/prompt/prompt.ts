var import_node_perf_hooks = require("perf_hooks");

,var MIN_PROMPT_CHARS = 10,
  _contextTooShort = {
    type: "contextTooShort"
  },
  _copilotContentExclusion = {
    type: "copilotContentExclusion"
  },
  _promptError = {
    type: "promptError"
  },
  _promptCancelled = {
    type: "promptCancelled"
  },
  _promptTimeout = {
    type: "promptTimeout"
  };

,async function getPromptForSource(ctx, source, offset, position, relativePath, uri, detectedLanguageId, clientLanguageId, version, edits, telemetryData, cancellationToken, opts = {}) {
  var _a, _b;
  let docInfo = {
      uri: uri.toString(),
      source: source,
      offset: offset,
      relativePath: relativePath,
      languageId: detectedLanguageId
    },
    promptOptions = getPromptOptions(ctx, telemetryData, detectedLanguageId),
    snippets = [],
    docs = new Map(),
    neighborSource = new Map(),
    traits = [],
    resolvedContextItems = [],
    codeSnippets = [],
    traitsFromContextProviders = [],
    turnOffNeighboringFiles = !1;
  try {
    if (useContextProviderAPI(ctx, telemetryData)) {
      resolvedContextItems = await ctx.get(ContextProviderRegistry).resolveAllProviders({
        uri: uri,
        languageId: clientLanguageId,
        version: version,
        offset: offset,
        position: (_a = opts.positionBeforeApplyingEdits) != null ? _a : position,
        proposedEdits: edits.length > 0 ? edits : void 0
      }, telemetryData, cancellationToken, opts.data);
      let matchedContextItems = resolvedContextItems.filter(matchContextItems);
      !ctx.get(Features).includeNeighboringFiles(telemetryData) && matchedContextItems.length > 0 && (turnOffNeighboringFiles = !0), traitsFromContextProviders = await getTraitsFromContextItems(ctx, matchedContextItems), codeSnippets = await getCodeSnippetsFromContextItems(ctx, matchedContextItems, detectedLanguageId);
    }
    let result = turnOffNeighboringFiles ? NeighborSource.defaultEmptyResult() : await NeighborSource.getNeighborFilesAndTraits(ctx, uri, detectedLanguageId, telemetryData, cancellationToken, opts.data);
    docs = result.docs, neighborSource = result.neighborSource, traits = result.traits.concat(convertTraitsToRelatedFileTraits(traitsFromContextProviders)).filter(trait => trait.includeInPrompt).map(addKindToRelatedFileTrait);
  } catch (e) {
    telemetryException(ctx, e, "prompt.getPromptForSource.exception");
  }
  try {
    let spContext = {
        currentFile: docInfo,
        similarFiles: Array.from(docs.values()),
        traits: traits,
        tooltipSignature: (_b = opts.selectedCompletionInfo) == null ? void 0 : _b.tooltipSignature,
        options: new PromptOptions(promptOptions, detectedLanguageId),
        codeSnippets: addRelativePathToCodeSnippets(ctx, codeSnippets)
      },
      snippetProviderResults = await ctx.get(SnippetOrchestrator).getSnippets(spContext),
      orchestratorSnippets = providersSnippets(snippetProviderResults),
      errors = providersErrors(snippetProviderResults),
      {
        runtimes: runtimes,
        timeouts: timeouts
      } = providersPerformance(snippetProviderResults);
    telemetryData.extendWithConfigProperties(ctx), telemetryData.sanitizeKeys();
    let telemetryResult = mkBasicResultTelemetry(telemetryData);
    docs.size > 0 ? telemetryRaw(ctx, "prompt.stat", {
      ...telemetryResult,
      neighborFilesTimeout: `${timeouts["similar-files"]}`
    }, {
      neighborFilesRuntimeMs: runtimes["similar-files"]
    }) : telemetryRaw(ctx, "prompt.stat", {
      ...telemetryResult
    }, {});
    for (let e of errors) e.error instanceof ProviderTimeoutError || telemetryException(ctx, e.error, "getSnippets");
    snippets.push(...orchestratorSnippets);
  } catch (e) {
    throw telemetryException(ctx, e, "prompt.orchestrator.getSnippets.exception"), e;
  }
  let promptInfo;
  try {
    promptInfo = await promptLibProxy.getPrompt(docInfo, promptOptions, snippets), useContextProviderAPI(ctx, telemetryData) && (ctx.get(ContextProviderStatistics).computeMatchWithPrompt(promptInfo.prefix + `
` + promptInfo.suffix), promptInfo.contextProvidersTelemetry = telemetrizeContextItems(ctx, resolvedContextItems));
  } catch (e) {
    throw telemetryException(ctx, e, "prompt.getPromptForSource.exception"), e;
  }
  return {
    neighborSource: neighborSource,
    ...promptInfo
  };
},__name(getPromptForSource, "getPromptForSource");

,function trimLastLine(source) {
  let lines = source.split(`
`),
    lastLine = lines[lines.length - 1],
    extraSpace = lastLine.length - lastLine.trimEnd().length,
    promptTrim = source.slice(0, source.length - extraSpace),
    trailingWs = source.slice(promptTrim.length);
  return [lastLine.length == extraSpace ? promptTrim : source, trailingWs];
},__name(trimLastLine, "trimLastLine");

,async function extractPromptForSource(ctx, source, offset, position, relativePath, uri, detectedLanguageId, clientLanguageId, version, edits, telemetryData, cancellationToken, opts = {}) {
  if ((await ctx.get(CopilotContentExclusionManager).evaluate(uri, source, "UPDATE")).isBlocked) return _copilotContentExclusion;
  let suffixPercent = ctx.get(Features).suffixPercent(telemetryData);
  if ((suffixPercent > 0 ? source.length : offset) < MIN_PROMPT_CHARS) return _contextTooShort;
  let startTime = Nne.performance.now(),
    {
      prefix: prefix,
      suffix: suffix,
      prefixLength: prefixLength,
      suffixLength: suffixLength,
      promptChoices: promptChoices,
      promptBackground: promptBackground,
      promptElementRanges: promptElementRanges,
      neighborSource: neighborSource,
      contextProvidersTelemetry: contextProvidersTelemetry
    } = await getPromptForSource(ctx, source, offset, position, relativePath, uri, detectedLanguageId, clientLanguageId, version, edits, telemetryData, cancellationToken, opts),
    [resPrompt, trailingWs] = trimLastLine(prefix),
    endTime = Nne.performance.now();
  return {
    type: "prompt",
    prompt: {
      prefix: resPrompt,
      suffix: suffix,
      prefixTokens: prefixLength,
      suffixTokens: suffixLength,
      isFimEnabled: suffixPercent > 0 && suffix.length > 0,
      promptElementRanges: promptElementRanges.ranges
    },
    trailingWs: trailingWs,
    promptChoices: promptChoices,
    computeTimeMs: endTime - startTime,
    promptBackground: promptBackground,
    neighborSource: neighborSource,
    contextProvidersTelemetry: contextProvidersTelemetry
  };
},__name(extractPromptForSource, "extractPromptForSource");

,async function extractPromptForDocument(ctx, doc, position, telemetryData, strategy = "wishlist", cancellationToken, opts = {}) {
  let relativePath = ctx.get(TextDocumentManager).getRelativePath(doc);
  return strategy === "components" ? (telemetryData.extendWithConfigProperties(ctx), telemetryData.sanitizeKeys(), ctx.get(CompletionsPromptFactory).prompt(doc, position, telemetryData, cancellationToken, opts)) : extractPromptForSource(ctx, doc.getText(), doc.offsetAt(position), position, relativePath, doc.uri, doc.detectedLanguageId, doc.clientLanguageId, doc.version, doc.appliedEdits, telemetryData, cancellationToken, opts);
},__name(extractPromptForDocument, "extractPromptForDocument");

,function addNeighboringCellsToPrompt(neighboringCell, activeCellLanguageId) {
  let languageId = neighboringCell.document.detectedLanguageId,
    text = neighboringCell.document.getText();
  return languageId === activeCellLanguageId ? text : commentBlockAsSingles(text, activeCellLanguageId);
},__name(addNeighboringCellsToPrompt, "addNeighboringCellsToPrompt");

,async function extractPromptForNotebook(ctx, doc, notebook, position, telemetryData, strategy = "wishlist", cancellationToken, opts = {}) {
  let activeCell = notebook.getCellFor(doc);
  if (activeCell) {
    let beforeCells = notebook.getCells().filter(cell => cell.index < activeCell.index && considerNeighborFile(activeCell.document.detectedLanguageId, cell.document.detectedLanguageId)),
      beforeSource = beforeCells.length > 0 ? beforeCells.map(cell => addNeighboringCellsToPrompt(cell, activeCell.document.detectedLanguageId)).join(`

`) + `

` : "",
      source = beforeSource + doc.getText(),
      offset = beforeSource.length + doc.offsetAt(position);
    if (strategy === "components") {
      telemetryData.extendWithConfigProperties(ctx), telemetryData.sanitizeKeys();
      let promptFactory = ctx.get(CompletionsPromptFactory),
        cellDoc = CopilotTextDocument.create(doc.uri, activeCell.document.clientLanguageId, activeCell.document.version, source, activeCell.document.detectedLanguageId),
        pos = cellDoc.positionAt(offset);
      return promptFactory.prompt(cellDoc, pos, telemetryData, cancellationToken, opts);
    }
    return extractPromptForSource(ctx, source, offset, position, void 0, doc.uri, activeCell.document.detectedLanguageId, activeCell.document.clientLanguageId, activeCell.document.version, activeCell.document.appliedEdits, telemetryData, cancellationToken, opts);
  } else return extractPromptForDocument(ctx, doc, position, telemetryData, strategy, cancellationToken, opts);
},__name(extractPromptForNotebook, "extractPromptForNotebook");

,function extractPrompt(ctx, doc, position, telemetryData, cancellationToken, opts = {}) {
  let notebook = ctx.get(TextDocumentManager).findNotebook(doc),
    strategy = getPromptStrategy(ctx, telemetryData);
  return notebook === void 0 ? extractPromptForDocument(ctx, doc, position, telemetryData, strategy, cancellationToken, opts) : extractPromptForNotebook(ctx, doc, notebook, position, telemetryData, strategy, cancellationToken, opts);
},__name(extractPrompt, "extractPrompt");

,function getPromptOptions(ctx, telemetryData, languageId) {
  let maxPromptLength = ctx.get(Features).maxPromptCompletionTokens(telemetryData) - getMaxSolutionTokens(ctx),
    numberOfSnippets = getNumberOfSnippets(telemetryData, languageId),
    similarFilesOptions = getSimilarFilesOptions(ctx, telemetryData, languageId),
    promptOrderListPreset = ctx.get(Features).promptOrderListPreset(telemetryData),
    promptPriorityPreset = ctx.get(Features).promptPriorityPreset(telemetryData),
    promptOptions = {
      maxPromptLength: maxPromptLength,
      similarFilesOptions: similarFilesOptions,
      numberOfSnippets: numberOfSnippets,
      promptOrderListPreset: promptOrderListPreset,
      promptPriorityPreset: promptPriorityPreset
    },
    suffixPercent = ctx.get(Features).suffixPercent(telemetryData),
    suffixMatchThreshold = ctx.get(Features).suffixMatchThreshold(telemetryData);
  return suffixPercent > 0 && suffixMatchThreshold > 0 && (promptOptions = {
    ...promptOptions,
    suffixPercent: suffixPercent,
    suffixMatchThreshold: suffixMatchThreshold
  }), promptOptions;
},__name(getPromptOptions, "getPromptOptions");