var commentMap = {
    javascript: ["//"],
    typescript: ["//"],
    typescriptreact: ["//"],
    javascriptreact: ["//"],
    vue: ["//", "-->"],
    php: ["//", "#"],
    dart: ["//"],
    go: ["//"],
    cpp: ["//"],
    scss: ["//"],
    csharp: ["//"],
    java: ["//"],
    c: ["//"],
    rust: ["//"],
    python: ["#"],
    markdown: ["#", "-->"],
    css: ["*/"]
  },
  languageMap = {
    javascript: 1,
    javascriptreact: 2,
    typescript: 3,
    typescriptreact: 4,
    python: 5,
    go: 6,
    ruby: 7
  };

,function hasComment(text, lineNumber, language, ignoreEmptyLines = !0) {
  var _a;
  let lines = text.split(`
`);
  if (ignoreEmptyLines && (lines = lines.filter(line => line.trim().length > 0)), Math.abs(lineNumber) > lines.length || lineNumber >= lines.length) return !1;
  lineNumber < 0 && (lineNumber = lines.length + lineNumber);
  let line = lines[lineNumber];
  return ((_a = commentMap[language]) != null ? _a : []).some(commentChar => line.includes(commentChar));
},__name(hasComment, "hasComment");

,var _PromptFeatures = class _PromptFeatures {
  constructor(promptComponentText, language) {
    let [firstLine, lastLine] = this.firstAndLast(promptComponentText),
      firstAndLastTrimEnd = this.firstAndLast(promptComponentText.trimEnd());
    this.language = language, this.length = promptComponentText.length, this.firstLineLength = firstLine.length, this.lastLineLength = lastLine.length, this.lastLineRstripLength = lastLine.trimEnd().length, this.lastLineStripLength = lastLine.trim().length, this.rstripLength = promptComponentText.trimEnd().length, this.stripLength = promptComponentText.trim().length, this.rstripLastLineLength = firstAndLastTrimEnd[1].length, this.rstripLastLineStripLength = firstAndLastTrimEnd[1].trim().length, this.secondToLastLineHasComment = hasComment(promptComponentText, -2, language), this.rstripSecondToLastLineHasComment = hasComment(promptComponentText.trimEnd(), -2, language), this.prefixEndsWithNewline = promptComponentText.endsWith(`
`), this.lastChar = promptComponentText.slice(-1), this.rstripLastChar = promptComponentText.trimEnd().slice(-1), this.firstChar = promptComponentText[0], this.lstripFirstChar = promptComponentText.trimStart().slice(0, 1);
  }
  firstAndLast(text) {
    let lines = text.split(`
`),
      numLines = lines.length,
      firstLine = lines[0],
      lastLine = lines[numLines - 1];
    return lastLine == "" && numLines > 1 && (lastLine = lines[numLines - 2]), [firstLine, lastLine];
  }
};

,__name(_PromptFeatures, "PromptFeatures");

,var PromptFeatures = _PromptFeatures,
  _MultilineModelFeatures = class _MultilineModelFeatures {
    constructor(prefix, suffix, language) {
      this.language = language, this.prefixFeatures = new PromptFeatures(prefix, language), this.suffixFeatures = new PromptFeatures(suffix, language);
    }
    constructFeatures() {
      var _a, _b, _c, _d, _e;
      let numFeatures = new Array(14).fill(0);
      numFeatures[0] = this.prefixFeatures.length, numFeatures[1] = this.prefixFeatures.firstLineLength, numFeatures[2] = this.prefixFeatures.lastLineLength, numFeatures[3] = this.prefixFeatures.lastLineRstripLength, numFeatures[4] = this.prefixFeatures.lastLineStripLength, numFeatures[5] = this.prefixFeatures.rstripLength, numFeatures[6] = this.prefixFeatures.rstripLastLineLength, numFeatures[7] = this.prefixFeatures.rstripLastLineStripLength, numFeatures[8] = this.suffixFeatures.length, numFeatures[9] = this.suffixFeatures.firstLineLength, numFeatures[10] = this.suffixFeatures.lastLineLength, numFeatures[11] = this.prefixFeatures.secondToLastLineHasComment ? 1 : 0, numFeatures[12] = this.prefixFeatures.rstripSecondToLastLineHasComment ? 1 : 0, numFeatures[13] = this.prefixFeatures.prefixEndsWithNewline ? 1 : 0;
      let langFeatures = new Array(Object.keys(languageMap).length + 1).fill(0);
      langFeatures[(_a = languageMap[this.language]) != null ? _a : 0] = 1;
      let prefixLastCharFeatures = new Array(Object.keys(contextualFilterCharacterMap).length + 1).fill(0);
      prefixLastCharFeatures[(_b = contextualFilterCharacterMap[this.prefixFeatures.lastChar]) != null ? _b : 0] = 1;
      let prefixRstripLastCharFeatures = new Array(Object.keys(contextualFilterCharacterMap).length + 1).fill(0);
      prefixRstripLastCharFeatures[(_c = contextualFilterCharacterMap[this.prefixFeatures.rstripLastChar]) != null ? _c : 0] = 1;
      let suffixFirstCharFeatures = new Array(Object.keys(contextualFilterCharacterMap).length + 1).fill(0);
      suffixFirstCharFeatures[(_d = contextualFilterCharacterMap[this.suffixFeatures.firstChar]) != null ? _d : 0] = 1;
      let suffixLstripFirstCharFeatures = new Array(Object.keys(contextualFilterCharacterMap).length + 1).fill(0);
      return suffixLstripFirstCharFeatures[(_e = contextualFilterCharacterMap[this.suffixFeatures.lstripFirstChar]) != null ? _e : 0] = 1, numFeatures.concat(langFeatures, prefixLastCharFeatures, prefixRstripLastCharFeatures, suffixFirstCharFeatures, suffixLstripFirstCharFeatures);
    }
  };

,__name(_MultilineModelFeatures, "MultilineModelFeatures");

,var MultilineModelFeatures = _MultilineModelFeatures;

,function constructMultilineFeatures(prompt, language) {
  return new MultilineModelFeatures(prompt.prefix, prompt.suffix, language);
},__name(constructMultilineFeatures, "constructMultilineFeatures");

,function requestMultilineScore(prompt, language) {
  let features = constructMultilineFeatures(prompt, language).constructFeatures();
  return multilineModelPredict(features)[1];
},__name(requestMultilineScore, "requestMultilineScore");