var SnippetProviderType = (s => (SnippetProviderType.SimilarFiles = "similar-files", SnippetProviderType.Language = "language", SnippetProviderType.Path = "path", SnippetProviderType.TooltipSignature = "tooltip-signature", SnippetProviderType.Trait = "trait", SnippetProviderType.CodeSnippet = "code", SnippetProviderType))(Eu || {}),
  SnippetSemantics = (m => (SnippetSemantics.Function = "function", SnippetSemantics.Snippet = "snippet", SnippetSemantics.Snippets = "snippets", SnippetSemantics.Variable = "variable", SnippetSemantics.Parameter = "parameter", SnippetSemantics.Method = "method", SnippetSemantics.Class = "class", SnippetSemantics.Module = "module", SnippetSemantics.Alias = "alias", SnippetSemantics.Enum = "enum member", SnippetSemantics.Interface = "interface", SnippetSemantics))(Ph || {}),
  snippetSemanticsToString = {
    function: "function",
    snippet: "snippet",
    snippets: "snippets",
    variable: "variable",
    parameter: "parameter",
    method: "method",
    class: "class",
    module: "module",
    alias: "alias",
    "enum member": "enum member",
    interface: "interface"
  };

,function announceSnippet(snippet, targetDocLanguageId) {
  let semantics = snippetSemanticsToString[snippet.semantics],
    pluralizedSemantics = ["snippets"].includes(snippet.semantics) ? "these" : "this",
    headlinedSnippet = (snippet.relativePath ? `Compare ${pluralizedSemantics} ${semantics} from ${snippet.relativePath}:` : `Compare ${pluralizedSemantics} ${semantics}:`) + `` + snippet.snippet;
  return headlinedSnippet.endsWith(``) || (headlinedSnippet += ``), commentBlockAsSingles(headlinedSnippet, targetDocLanguageId);
}

,__name(announceSnippet, "announceSnippet");

,function sortSnippetsDescending(snippets) {
  snippets.sort((a, b) => b.score - a.score);
}

,__name(sortSnippetsDescending, "sortSnippetsDescending");

,function selectSnippets(snippets, numberOfSnippets, promptPriorityList) {
  if (numberOfSnippets == 0) return [];
  let snippetsWithElementKind = snippets.map(snippet => ({
      ...snippet,
      kind: kindForSnippetProviderType(snippet.provider)
    })),
    allSnippets = [];
  return promptPriorityList.rankedList.forEach(promptElementKind => {
    let snippets = snippetsWithElementKind.filter(({
      kind: snippetKind
    }) => snippetKind === promptElementKind);
    sortSnippetsDescending(snippets), allSnippets.push(...snippets);
  }), allSnippets.slice(0, numberOfSnippets);
},__name(selectSnippets, "selectSnippets");

,function processSnippetsForWishlist(snippets, targetDocLanguageId, tokenizer, promptPriorityList, totalPrioritized) {
  let processedSnippets = selectSnippets(snippets, totalPrioritized, promptPriorityList).map(snippet => {
    let announced = announceSnippet(snippet, targetDocLanguageId),
      tokens = tokenizer.tokenLength(announced);
    return {
      announcedSnippet: announced,
      provider: snippet.provider,
      score: snippet.score,
      tokens: tokens,
      relativePath: snippet.relativePath
    };
  }).filter(snippet => snippet.tokens > 0);
  return sortSnippetsDescending(processedSnippets), processedSnippets.reverse(), processedSnippets;
}

,__name(processSnippetsForWishlist, "processSnippetsForWishlist");