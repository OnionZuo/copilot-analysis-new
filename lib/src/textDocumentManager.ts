var _TextDocumentManager = class _TextDocumentManager {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async textDocuments() {
    let documents = this.getOpenTextDocuments(),
      filteredDocuments = [];
    for (let doc of documents) (await isDocumentValid(this.ctx, doc)).status === "valid" && filteredDocuments.push(doc);
    return filteredDocuments;
  }
  getOpenTextDocument(docId) {
    let uri = normalizeUri(docId.uri);
    return this.getOpenTextDocuments().find(t => t.uri == uri);
  }
  async getTextDocument(arg) {
    let docId = "uri" in arg ? arg : {
      uri: arg.toString()
    };
    return this.getTextDocumentWithValidation(docId).then(result => {
      if (result.status === "valid") return result.document;
    });
  }
  validateTextDocument(document, uri) {
    return document ? isDocumentValid(this.ctx, document).catch(() => this.notFoundResult(uri)) : this.notFoundResult(uri);
  }
  async getTextDocumentWithValidation(docId) {
    try {
      let document = this.getOpenTextDocument(docId);
      return !document && (document = await this.openTextDocument(docId.uri), !document) ? await this.notFoundResult(docId.uri) : isDocumentValid(this.ctx, document);
    } catch {
      return await this.notFoundResult(docId.uri);
    }
  }
  getOpenTextDocumentWithValidation(docId) {
    let document = this.getOpenTextDocument(docId);
    if (document) {
      let memoized;
      return {
        then: __name((onFulfilled, onRejected) => (memoized != null || (memoized = this.validateTextDocument(document, docId.uri)), memoized.then(onFulfilled, onRejected)), "then")
      };
    } else return this.notFoundResult(docId.uri);
  }
  async notFoundResult(uri) {
    let knownDocs = (await this.textDocuments()).map(doc => doc.uri).join(", ");
    return {
      status: "notfound",
      message: `Document for URI could not be found: ${uri}, URIs of the known document are: ${knownDocs}`
    };
  }
  async openTextDocument(uri) {
    try {
      if ((await this.ctx.get(FileSystem).stat(uri)).size > 5 * 1024 * 1024) return;
    } catch {
      return;
    }
    let text = await this.ctx.get(FileSystem).readFileString(uri);
    return CopilotTextDocument.create(uri, "UNKNOWN", 0, text);
  }
  async getWorkspaceFolder(doc) {
    return this.getWorkspaceFolders().find(f => doc.clientUri.startsWith(f.uri));
  }
  getRelativePath(doc) {
    if (!doc.uri.startsWith("untitled:")) {
      for (let folder of this.getWorkspaceFolders()) {
        let parentURI = folder.uri.replace(/[#?].*/, "").replace(/\/?$/, "/");
        if (doc.clientUri.startsWith(parentURI)) return doc.clientUri.slice(parentURI.length);
      }
      return basename(doc.uri);
    }
  }
};

,__name(_TextDocumentManager, "TextDocumentManager");

,var TextDocumentManager = _TextDocumentManager;