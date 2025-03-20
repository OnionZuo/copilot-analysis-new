var regexAttributeOrMethod = /(\.|->|::)\w+$/;
,function announceTooltipSignatureSnippet(snippet, targetDocLanguageId) {
  let formattedSnippet = `Use ${snippet}`;
  return commentBlockAsSingles(formattedSnippet, targetDocLanguageId);
}

,__name(announceTooltipSignatureSnippet, "announceTooltipSignatureSnippet");

,function endsWithAttributesOrMethod(doc) {
  let directContext = doc.source.substring(0, doc.offset);
  return regexAttributeOrMethod.test(directContext);
}

,__name(endsWithAttributesOrMethod, "endsWithAttributesOrMethod");

,function transferLastLineToTooltipSignature(directContext, tooltipSignatureSnippet) {
  let lastLineStart = directContext.lastIndexOf(``) + 1,
    directContextBeforePartialLastLine = directContext.substring(0, lastLineStart),
    partialLastLine = directContext.substring(lastLineStart);
  return tooltipSignatureSnippet.snippet = tooltipSignatureSnippet.snippet + partialLastLine, [directContextBeforePartialLastLine, tooltipSignatureSnippet];
}

,__name(transferLastLineToTooltipSignature, "transferLastLineToTooltipSignature");