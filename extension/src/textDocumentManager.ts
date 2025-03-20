var import_vscode = require("vscode");

,var ignoreUriSchemes = new Set([CopilotPanelScheme, "output", "search-editor", "comment"]);

,function wrapDoc(_ctx, doc) {
  var _a;
  if (ignoreUriSchemes.has(doc.uri.scheme)) return;
  let text;
  try {
    text = doc.getText();
  } catch (e) {
    if (e instanceof RangeError) return;
    throw e;
  }
  let languageId = (_a = detectLanguage({
    uri: doc.uri.toString()
  })) != null ? _a : doc.languageId;
  return CopilotTextDocument.create(doc.uri.toString(), doc.languageId, doc.version, text, languageId);
},__name(wrapDoc, "wrapDoc");

,var _ExtensionTextDocumentManager = class _ExtensionTextDocumentManager extends TextDocumentManager {
  constructor(ctx) {
    super(ctx);
    this.onDidFocusTextDocument = __name((listener, thisArgs) => Bb.window.onDidChangeActiveTextEditor(event => {
      let uri = event == null ? void 0 : event.document.uri;
      uri ? listener.call(thisArgs, {
        document: {
          uri: uri.toString()
        }
      }) : listener.call(thisArgs, void 0);
    }), "onDidFocusTextDocument");
    this.onDidChangeTextDocument = __name((listener, thisArgs, disposables) => Bb.workspace.onDidChangeTextDocument(e => {
      let document = wrapDoc(this.ctx, e.document);
      document && listener({
        document: document,
        contentChanges: e.contentChanges
      });
    }, thisArgs, disposables), "onDidChangeTextDocument");
    this.onDidOpenTextDocument = __name((listener, thisArgs, disposables) => Bb.workspace.onDidOpenTextDocument(e => {
      let document = wrapDoc(this.ctx, e);
      document && listener({
        document: document,
        contentChanges: []
      });
    }, thisArgs, disposables), "onDidOpenTextDocument");
    this.onDidCloseTextDocument = __name((listener, thisArgs, disposables) => Bb.workspace.onDidCloseTextDocument(e => {
      let document = wrapDoc(this.ctx, e);
      document && listener({
        document: document,
        contentChanges: []
      });
    }, thisArgs, disposables), "onDidCloseTextDocument");
  }
  getOpenTextDocuments() {
    let docs = [];
    for (let vscodeDoc of Bb.workspace.textDocuments) {
      let doc = wrapDoc(this.ctx, vscodeDoc);
      doc && docs.push(doc);
    }
    return docs;
  }
  findNotebook(doc) {
    for (let notebook of Bb.workspace.notebookDocuments) if (notebook.getCells().some(cell => cell.document.uri.toString() === doc.uri.toString())) return {
      getCells: __name(() => notebook.getCells().map(cell => this.wrapCell(cell)), "getCells"),
      getCellFor: __name(({
        uri: uri
      }) => {
        let cell = notebook.getCells().find(cell => cell.document.uri.toString() === uri.toString());
        return cell ? this.wrapCell(cell) : void 0;
      }, "getCellFor")
    };
  }
  wrapCell(cell) {
    return {
      ...cell,
      get document() {
        return CopilotTextDocument.create(cell.document.uri.toString(), cell.document.languageId, cell.document.version, cell.document.getText(), cell.document.languageId);
      }
    };
  }
  getWorkspaceFolders() {
    var _a, _b;
    return (_b = (_a = Bb.workspace.workspaceFolders) == null ? void 0 : _a.map(f => ({
      uri: f.uri.toString()
    }))) != null ? _b : [];
  }
};

,__name(_ExtensionTextDocumentManager, "ExtensionTextDocumentManager");

,var ExtensionTextDocumentManager = _ExtensionTextDocumentManager;