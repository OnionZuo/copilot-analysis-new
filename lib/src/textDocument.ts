var _LocationFactory = class _LocationFactory {};

,__name(_LocationFactory, "LocationFactory"), _LocationFactory.range = Range.create.bind(Range), _LocationFactory.position = Position.create.bind(Position);

,var LocationFactory = _LocationFactory;

,function applyEditsWithPosition(textDocument, position, edits) {
  let offset = textDocument.offsetAt(position);
  for (let {
    range: range,
    newText: newText
  } of edits) {
    let oldText = textDocument.getText(range),
      oldEndOffset = textDocument.offsetAt(range.end);
    textDocument = textDocument.applyEdits([{
      range: range,
      newText: newText
    }]), !(offset < textDocument.offsetAt(range.start)) && (offset < oldEndOffset && (offset = oldEndOffset), offset += newText.length - oldText.length);
  }
  return {
    textDocument: textDocument,
    position: textDocument.positionAt(offset)
  };
},__name(applyEditsWithPosition, "applyEditsWithPosition");

,var _CopilotTextDocument = class _CopilotTextDocument {
  constructor(uri, _textDocument, detectedLanguageId, appliedEdits = []) {
    this.uri = uri;
    this._textDocument = _textDocument;
    this.detectedLanguageId = detectedLanguageId;
    this.appliedEdits = appliedEdits;
  }
  static withChanges(textDocument, changes, version) {
    let lspDoc = TextDocument.create(textDocument.clientUri, textDocument.clientLanguageId, version, textDocument.getText());
    return TextDocument.update(lspDoc, changes, version), new _CopilotTextDocument(textDocument.uri, lspDoc, textDocument.detectedLanguageId);
  }
  applyEdits(edits) {
    let lspDoc = TextDocument.create(this.clientUri, this.clientLanguageId, this.version, this.getText());
    return TextDocument.update(lspDoc, edits.map(c => ({
      text: c.newText,
      range: c.range
    })), this.version), new _CopilotTextDocument(this.uri, lspDoc, this.detectedLanguageId, [...this.appliedEdits, ...edits]);
  }
  static create(uri, clientLanguageId, version, text, detectedLanguageId = detectLanguage({
    uri: uri,
    clientLanguageId: clientLanguageId
  })) {
    return new _CopilotTextDocument(normalizeUri(uri), TextDocument.create(uri, clientLanguageId, version, text), detectedLanguageId);
  }
  get clientUri() {
    return this._textDocument.uri;
  }
  get clientLanguageId() {
    return this._textDocument.languageId;
  }
  get languageId() {
    return this.detectedLanguageId;
  }
  get version() {
    return this._textDocument.version;
  }
  get lineCount() {
    return this._textDocument.lineCount;
  }
  getText(range) {
    return this._textDocument.getText(range);
  }
  positionAt(offset) {
    return this._textDocument.positionAt(offset);
  }
  offsetAt(position) {
    return this._textDocument.offsetAt(position);
  }
  lineAt(position) {
    let lineNumber = typeof position == "number" ? position : position.line;
    if (lineNumber < 0 || lineNumber >= this.lineCount) throw new RangeError("Illegal value for lineNumber");
    let rangeWithNewline = Range.create(lineNumber, 0, lineNumber + 1, 0),
      text = this.getText(rangeWithNewline).replace(/\r\n$|\r$|\n$/g, ""),
      range = Range.create(Position.create(lineNumber, 0), Position.create(lineNumber, text.length)),
      isEmptyOrWhitespace = text.trim().length === 0;
    return {
      text: text,
      range: range,
      isEmptyOrWhitespace: isEmptyOrWhitespace
    };
  }
};

,__name(_CopilotTextDocument, "CopilotTextDocument");

,var CopilotTextDocument = _CopilotTextDocument;