var CodeSnippets = __name((props, context) => {
  var _a;
  let [snippets, setSnippets] = context.useState(),
    [document, setDocument] = context.useState();
  if (context.useData(isCompletionRequestData, request => {
    request.codeSnippets !== snippets && setSnippets(request.codeSnippets), request.document.uri !== (document == null ? void 0 : document.uri) && setDocument(request.document);
  }), !snippets || snippets.length === 0 || !document) return;
  let languageId = normalizeLanguageId(document.clientLanguageId),
    codeSnippetsWithRelativePath = addRelativePathToCodeSnippets(props.ctx, snippets),
    snippetsByUri = new Map();
  for (let snippet of codeSnippetsWithRelativePath) {
    let uri = (_a = snippet.relativePath) != null ? _a : snippet.snippet.uri,
      groupedSnippets = snippetsByUri.get(uri);
    groupedSnippets === void 0 && (groupedSnippets = [], snippetsByUri.set(uri, groupedSnippets)), groupedSnippets.push(snippet);
  }
  let codeSnippetChunks = [];
  for (let [uri, snippets] of snippetsByUri.entries()) {
    let validSnippets = snippets.filter(s => s.snippet.value.length > 0);
    validSnippets.length > 0 && codeSnippetChunks.push({
      chunkElements: validSnippets.map(s => s.snippet),
      importance: Math.max(...validSnippets.map(snippet => {
        var _a;
        return (_a = snippet.snippet.importance) != null ? _a : 0;
      })),
      uri: uri
    });
  }
  if (codeSnippetChunks.length !== 0) return codeSnippetChunks.sort((a, b) => b.importance - a.importance), codeSnippetChunks.reverse(), codeSnippetChunks.map(chunk => {
    let elements = [];
    return elements.push(functionComponentFunction(Text, {
      children: commentBlockAsSingles(`Compare ${chunk.chunkElements.length > 1 ? "these snippets" : "this snippet"} from ${chunk.uri}:`, languageId)
    })), chunk.chunkElements.forEach((element, index) => {
      elements.push(functionComponentFunction(Text, {
        source: element,
        children: commentBlockAsSingles(element.value, languageId)
      }, element.id)), chunk.chunkElements.length > 1 && index < chunk.chunkElements.length - 1 && elements.push(functionComponentFunction(Text, {
        children: commentBlockAsSingles("---", languageId)
      }));
    }), functionComponentFunction(Chunk, {
      children: elements
    });
  });
}, "CodeSnippets");