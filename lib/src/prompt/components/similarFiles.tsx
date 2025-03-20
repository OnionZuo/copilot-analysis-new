var SimilarFiles = __name((props, context) => {
    let [document, setDocument] = context.useState(),
      [similarFiles, setSimilarFiles] = context.useState([]);
    context.useData(isCompletionRequestData, async requestData => {
      requestData.document.uri !== (document == null ? void 0 : document.uri) && setSimilarFiles([]), setDocument(requestData.document);
      let files = requestData.turnOffSimilarFiles ? NeighborSource.defaultEmptyResult() : await NeighborSource.getNeighborFilesAndTraits(props.ctx, requestData.document.uri, requestData.document.detectedLanguageId, requestData.telemetryData, requestData.cancellationToken, requestData.data),
        similarFiles = await produceSimilarFiles(requestData.telemetryData, requestData.document, requestData, files);
      setSimilarFiles(similarFiles);
    });
    async function produceSimilarFiles(telemetryData, doc, requestData, files) {
      let promptOptions = getPromptOptions(props.ctx, telemetryData, doc.detectedLanguageId);
      return (await findSimilarSnippets(promptOptions, telemetryData, doc, requestData, files)).filter(s => s.snippet.length > 0).sort((a, b) => a.score - b.score).map(s => ({
        text: announceSnippet(s, doc.detectedLanguageId),
        score: s.score
      }));
    }
    __name(produceSimilarFiles, "produceSimilarFiles");
    async function findSimilarSnippets(promptOptions, telemetryData, doc, requestData, files) {
      let similarFilesOptions = promptOptions.similarFilesOptions || getSimilarFilesOptions(props.ctx, telemetryData, doc.detectedLanguageId),
        relativePath = props.ctx.get(TextDocumentManager).getRelativePath(doc),
        docInfo = {
          uri: doc.uri,
          source: doc.getText(),
          offset: doc.offsetAt(requestData.position),
          relativePath: relativePath,
          languageId: doc.detectedLanguageId
        };
      return await getSimilarSnippets(docInfo, Array.from(files.docs.values()), similarFilesOptions);
    }
    return __name(findSimilarSnippets, "findSimilarSnippets"), functionComponentFunction(fragmentFunction, {
      children: similarFiles.map((file, index) => functionComponentFunction(SimilarFile, {
        text: file.text
      }))
    });
  }, "SimilarFiles"),
  SimilarFile = __name((props, context) => functionComponentFunction(Text, {
    children: props.text
  }), "SimilarFile");