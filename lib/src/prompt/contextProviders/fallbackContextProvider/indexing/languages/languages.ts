var languagesExtractors = [{
  symbolExtractor: new JavaSymbolExtractor(),
  referenceExtractor: new JavaReferenceExtractor(),
  languageId: "java"
}, {
  symbolExtractor: new GoSymbolExtractor(),
  referenceExtractor: new GoReferenceExtractor(),
  languageId: "go"
}, {
  symbolExtractor: new PythonSymbolExtractor(),
  referenceExtractor: new PythonReferenceExtractor(),
  languageId: "python"
}];

,function getSupportedLanguageIdForFallbackProvider(filePath) {
  let languageId = detectLanguage({
    uri: filePath
  });
  if (languageId && languagesExtractors.some(l => languageId === l.languageId)) return languageId;
},__name(getSupportedLanguageIdForFallbackProvider, "getSupportedLanguageIdForFallbackProvider");

,var PredefinedReferenceExtractors = languagesExtractors.map(l => l.referenceExtractor),
  PredefinedSymbolExtractors = languagesExtractors.map(l => l.symbolExtractor),
  supportedFileEndings = languagesExtractors.map(l => knownLanguages[l.languageId].extensions).flat();