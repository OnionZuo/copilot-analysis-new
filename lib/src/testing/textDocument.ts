function createTextDocument(uri, clientAndDetectedLanguageId, version, text) {
  return CopilotTextDocument.create(parseUri(uri.toString(), !0).toString(), clientAndDetectedLanguageId, version, text, clientAndDetectedLanguageId);
},__name(createTextDocument, "createTextDocument");

,var _SimpleTestTextDocumentManager = class _SimpleTestTextDocumentManager extends TextDocumentManager {
  constructor(ctx) {
    super(ctx);
    this._openTextDocuments = [];
    this._notebookDocuments = new Map();
    this._workspaceFolders = [];
    this._focusSubscribers = [];
    this._changeSubscribers = [];
    this._openSubscribers = [];
    this._closeSubscribers = [];
    this.onDidFocusTextDocument = __name((listener, thisArgs, disposables) => {
      let handler = listener.bind(thisArgs);
      return this._focusSubscribers.push(handler), {
        dispose: __name(() => {
          this._focusSubscribers = this._focusSubscribers.filter(sub => sub !== handler);
        }, "dispose")
      };
    }, "onDidFocusTextDocument");
    this.onDidChangeTextDocument = __name((listener, thisArgs, disposables) => {
      let handler = listener.bind(thisArgs);
      return this._changeSubscribers.push(handler), {
        dispose: __name(() => {
          this._changeSubscribers = this._changeSubscribers.filter(sub => sub !== handler);
        }, "dispose")
      };
    }, "onDidChangeTextDocument");
    this.onDidOpenTextDocument = __name((listener, thisArgs, disposables) => {
      let handler = listener.bind(thisArgs);
      return this._openSubscribers.push(handler), {
        dispose: __name(() => {
          this._openSubscribers = this._openSubscribers.filter(sub => sub !== handler);
        }, "dispose")
      };
    }, "onDidOpenTextDocument");
    this.onDidCloseTextDocument = __name((listener, thisArgs, disposables) => {
      let handler = listener.bind(thisArgs);
      return this._closeSubscribers.push(handler), {
        dispose: __name(() => {
          this._closeSubscribers = this._closeSubscribers.filter(sub => sub !== handler);
        }, "dispose")
      };
    }, "onDidCloseTextDocument");
  }
  init(workspaceFolders) {
    this._workspaceFolders = workspaceFolders;
  }
  async openTextDocument(uri) {
    return super.openTextDocument(uri);
  }
  getOpenTextDocuments() {
    return this._openTextDocuments;
  }
  setTextDocument(uri, languageId, text) {
    this._openTextDocuments.push(createTextDocument(uri, languageId, 0, text));
  }
  updateTextDocument(uri, newText) {
    let idx = this._openTextDocuments.findIndex(t => t.uri === uri.toString());
    if (idx < 0) throw new Error("Document not found");
    let oldDoc = this._openTextDocuments[idx];
    this._openTextDocuments[idx] = createTextDocument(uri, oldDoc.clientLanguageId, oldDoc.version + 1, newText);
  }
  setNotebookDocument(doc, notebook) {
    this._notebookDocuments.set(doc.uri.replace(/#.*/, ""), notebook);
  }
  findNotebook({
    uri: uri
  }) {
    return this._notebookDocuments.get(uri.replace(/#.*/, ""));
  }
  getWorkspaceFolders() {
    return this._workspaceFolders;
  }
  emitEvent(e) {
    switch (e.eventName) {
      case "focus":
        this._focusSubscribers.forEach(sub => sub(e.args));
        break;
      case "change":
        this._changeSubscribers.forEach(sub => sub(e.args));
        break;
      case "open":
        this._openSubscribers.forEach(sub => sub(e.args));
        break;
      case "close":
        this._closeSubscribers.forEach(sub => sub(e.args));
        break;
    }
  }
};

,__name(_SimpleTestTextDocumentManager, "SimpleTestTextDocumentManager");

,var SimpleTestTextDocumentManager = _SimpleTestTextDocumentManager,
  _TestTextDocumentManager = class _TestTextDocumentManager extends SimpleTestTextDocumentManager {
    constructor(ctx) {
      super(ctx);
      this._closedTextDocuments = [];
    }
    async openTextDocument(uri) {
      return this._closedTextDocuments.find(t => t.uri === uri);
    }
    setClosedTextDocument(uri, languageId, text) {
      this._closedTextDocuments.push(createTextDocument(uri, languageId, 0, text));
    }
  };

,__name(_TestTextDocumentManager, "TestTextDocumentManager");

,var TestTextDocumentManager = _TestTextDocumentManager;