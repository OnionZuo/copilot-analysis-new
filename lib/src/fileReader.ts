function statusFromTextDocumentResult(textDocumentResult) {
  switch (textDocumentResult.status) {
    case "valid":
      return textDocumentResult.document.getText().trim().length === 0 ? "empty" : "included";
    case "invalid":
      return "blocked";
    case "notfound":
      return "notfound";
  }
},__name(statusFromTextDocumentResult, "statusFromTextDocumentResult");

,var _FileReader = class _FileReader {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async getRelativePath(doc) {
    var _a;
    return (_a = this.ctx.get(TextDocumentManager).getRelativePath(doc)) != null ? _a : basename(doc.uri);
  }
  async readFile(uri) {
    let documentResult = await this.readFromTextDocumentManager({
      uri: uri
    });
    return documentResult.status !== "notfound" ? documentResult : await this.readFromFilesystem(uri);
  }
  async readFromTextDocumentManager(doc) {
    return await this.ctx.get(TextDocumentManager).getTextDocumentWithValidation(doc);
  }
  async readFromFilesystem(uri) {
    if (await this.fileExists(uri)) {
      if ((await this.getFileSizeMB(uri)) > 1) return {
        status: "notfound",
        message: "File too large"
      };
      let text = await this.doReadFile(uri);
      return (await this.ctx.get(CopilotContentExclusionManager).evaluate(uri, text)).isBlocked ? {
        status: "invalid",
        reason: "blocked"
      } : {
        status: "valid",
        document: CopilotTextDocument.create(uri, "UNKNOWN", 0, text)
      };
    }
    return {
      status: "notfound",
      message: "File not found"
    };
  }
  async doReadFile(uri) {
    return await this.ctx.get(FileSystem).readFileString(uri);
  }
  async getFileSizeMB(uri) {
    return (await this.ctx.get(FileSystem).stat(uri)).size / 1024 / 1024;
  }
  async fileExists(file) {
    try {
      return await this.ctx.get(FileSystem).stat(file), !0;
    } catch {
      return !1;
    }
  }
};

,__name(_FileReader, "FileReader");

,var FileReader = _FileReader;