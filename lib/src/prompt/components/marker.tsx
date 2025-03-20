var DocumentMarker = __name((props, context) => {
    let [document, setDocument] = context.useState();
    if (context.useData(isCompletionRequestData, request => {
      request.document.uri !== (document == null ? void 0 : document.uri) && setDocument(request.document);
    }), document) {
      let tdm = props.ctx.get(TextDocumentManager),
        relativePath = tdm.getRelativePath(document),
        docInfo = {
          uri: document.uri,
          source: document.getText(),
          offset: -1,
          relativePath: relativePath,
          languageId: document.detectedLanguageId
        },
        notebook = tdm.findNotebook(document);
      return docInfo.relativePath && !notebook ? functionComponentFunction(PathMarker, {
        docInfo: docInfo
      }) : functionComponentFunction(LanguageMarker, {
        docInfo: docInfo
      });
    }
  }, "DocumentMarker"),
  PathMarker = __name((props, context) => functionComponentFunction(Text, {
    children: getPathMarker(props.docInfo)
  }), "PathMarker"),
  LanguageMarker = __name((props, context) => functionComponentFunction(Text, {
    children: getLanguageMarker(props.docInfo)
  }), "LanguageMarker");