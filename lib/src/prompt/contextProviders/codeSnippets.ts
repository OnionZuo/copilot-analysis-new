var CONTENT_EXCLUDED_EXPECTATION = "content_excluded";

,async function getCodeSnippetsFromContextItems(ctx, resolvedContextItems, languageId) {
  var _a;
  let result = [],
    codeSnippetContextItems = filterContextItemsByType(resolvedContextItems, "CodeSnippet");
  if (codeSnippetContextItems.length === 0) return result;
  let tdm = ctx.get(TextDocumentManager),
    statistics = ctx.get(ContextProviderStatistics),
    mappedSnippets = codeSnippetContextItems.flatMap(item => item.data.map(data => ({
      providerId: item.providerId,
      data: data
    })));
  for (let snippet of mappedSnippets) {
    let contentExclusionPromises = [snippet.data.uri, ...((_a = snippet.data.additionalUris) != null ? _a : [])].map(uri => tdm.getTextDocumentWithValidation({
      uri: uri
    }));
    (await Promise.all(contentExclusionPromises)).every(r => r.status === "valid") ? (result.push(snippet.data), statistics.addPromptLibExpectations(snippet.providerId, [commentBlockAsSingles(snippet.data.value, normalizeLanguageId(languageId))]), statistics.addPromptComponentsExpectations(snippet.providerId, [[snippet.data, "included"]])) : (statistics.addPromptLibExpectations(snippet.providerId, [CONTENT_EXCLUDED_EXPECTATION]), statistics.addPromptComponentsExpectations(snippet.providerId, [[snippet.data, CONTENT_EXCLUDED_EXPECTATION]]));
  }
  return result;
},__name(getCodeSnippetsFromContextItems, "getCodeSnippetsFromContextItems");

,function addRelativePathToCodeSnippets(ctx, codeSnippets) {
  let tdm = ctx.get(TextDocumentManager);
  return codeSnippets.map(codeSnippet => {
    let snippetDocument = CopilotTextDocument.create(codeSnippet.uri, "unknown", 0, codeSnippet.value);
    return {
      snippet: codeSnippet,
      relativePath: tdm.getRelativePath(snippetDocument)
    };
  });
},__name(addRelativePathToCodeSnippets, "addRelativePathToCodeSnippets");