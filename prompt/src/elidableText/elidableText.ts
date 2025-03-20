var _ElidableText = class _ElidableText {
  constructor(chunks) {
    this.lines = [];
    let lines = [];
    for (let chunk of chunks) {
      let value = Array.isArray(chunk) ? chunk[1] : 1,
        input = Array.isArray(chunk) ? chunk[0] : chunk;
      typeof input == "string" ? input.split(`
`).forEach(line => lines.push(new LineWithValueAndCost(line, value))) : input instanceof _ElidableText ? input.lines.forEach(line => lines.push(line.copy().adjustValue(value))) : "source" in input && "languageId" in input && elidableTextForSourceCode(input).lines.forEach(line => lines.push(line.copy().adjustValue(value)));
    }
    this.lines = lines;
  }
  adjust(multiplier) {
    this.lines.forEach(line => line.adjustValue(multiplier));
  }
  recost(coster = x => getTokenizer().tokenLength(x + `
`)) {
    this.lines.forEach(line => line.recost(coster));
  }
  makePrompt(maxTokens, ellipsis = "[...]", indentEllipses = !0, strategy = "removeLeastDesirable", tokenizer = getTokenizer()) {
    let lines = this.lines.map(line => line.copy());
    return makePrompt(lines, maxTokens, ellipsis, indentEllipses, strategy, tokenizer);
  }
};

,__name(_ElidableText, "ElidableText");

,var ElidableText = _ElidableText;

,function makePrompt(lines, maxTokens, ellipsis, indentEllipses, strategy, tokenizer) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (tokenizer.tokenLength(ellipsis + `
`) > maxTokens) throw new Error("maxTokens must be larger than the ellipsis length");
  strategy === "removeLeastBangForBuck" && lines.forEach(line => line.adjustValue(1 / line.cost));
  let infiniteWorth = lines.reduce((a, b) => Math.max(a, b.value), 0) + 1,
    infiniteIndentation = lines.reduce((a, b) => Math.max(a, b.text.length), 0) + 1,
    trimmedEllipsis = ellipsis.trim(),
    totalCost = lines.reduce((sum, line) => sum + line.cost, 0),
    defensiveCounter = lines.length + 1;
  for (; totalCost > maxTokens && defensiveCounter-- >= -1;) {
    let leastDesirable = lines.reduce((least, line) => line.value < least.value ? line : least),
      index = lines.indexOf(leastDesirable),
      mostRecentNonBlankLine = (_a = lines.slice(0, index + 1).reverse().find(line => line.text.trim() !== "")) != null ? _a : {
        text: ""
      },
      indentation = indentEllipses ? Math.min((_c = (_b = mostRecentNonBlankLine.text.match(/^\s*/)) == null ? void 0 : _b[0].length) != null ? _c : 0, ((_d = lines[index - 1]) == null ? void 0 : _d.text.trim()) === trimmedEllipsis ? (_g = (_f = (_e = lines[index - 1]) == null ? void 0 : _e.text.match(/^\s*/)) == null ? void 0 : _f[0].length) != null ? _g : 0 : infiniteIndentation, ((_h = lines[index + 1]) == null ? void 0 : _h.text.trim()) === trimmedEllipsis ? (_k = (_j = (_i = lines[index + 1]) == null ? void 0 : _i.text.match(/^\s*/)) == null ? void 0 : _j[0].length) != null ? _k : 0 : infiniteIndentation) : 0,
      insert = " ".repeat(indentation) + ellipsis,
      newEllipis = new LineWithValueAndCost(insert, infiniteWorth, tokenizer.tokenLength(insert + `
`), "loose");
    lines.splice(index, 1, newEllipis), ((_l = lines[index + 1]) == null ? void 0 : _l.text.trim()) === trimmedEllipsis && lines.splice(index + 1, 1), ((_m = lines[index - 1]) == null ? void 0 : _m.text.trim()) === trimmedEllipsis && lines.splice(index - 1, 1);
    let newTotalCost = lines.reduce((sum, line) => sum + line.cost, 0);
    newTotalCost >= totalCost && lines.every(line => line.value === infiniteWorth) && (indentEllipses = !1), totalCost = newTotalCost;
  }
  if (defensiveCounter < 0) throw new Error("Infinite loop in ElidableText.makePrompt: Defensive counter < 0 in ElidableText.makePrompt with end text");
  return lines.map(line => line.text).join(`
`);
},__name(makePrompt, "makePrompt");