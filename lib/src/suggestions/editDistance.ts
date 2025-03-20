function editDistance(haystack, needle, compare = (h, n) => h === n ? 0 : 1) {
  if (needle.length === 0 || haystack.length === 0) return {
    distance: needle.length,
    startOffset: 0,
    endOffset: 0
  };
  let curRow = new Array(needle.length + 1).fill(0),
    curStart = new Array(needle.length + 1).fill(0),
    prevRow = new Array(haystack.length + 1).fill(0),
    prevStart = new Array(haystack.length + 1).fill(0),
    c = needle[0];
  for (let i = 0; i < haystack.length + 1; i++) i === 0 ? curRow[i] = 1 : curRow[i] = compare(haystack[i - 1], c, i - 1, 0), curStart[i] = i > 0 ? i - 1 : 0;
  for (let j = 1; j < needle.length; j++) {
    let swap = prevRow;
    prevRow = curRow, curRow = swap, swap = prevStart, prevStart = curStart, curStart = swap, c = needle[j], curRow[0] = j + 1;
    for (let i = 1; i < haystack.length + 1; i++) {
      let inserted = 1 + prevRow[i],
        deleted = 1 + curRow[i - 1],
        substituted = compare(haystack[i - 1], c, i - 1, j) + prevRow[i - 1];
      curRow[i] = Math.min(deleted, inserted, substituted), curRow[i] === substituted ? curStart[i] = prevStart[i - 1] : curRow[i] === inserted ? curStart[i] = prevStart[i] : curStart[i] = curStart[i - 1];
    }
  }
  let best = 0;
  for (let i = 0; i < haystack.length + 1; i++) curRow[i] < curRow[best] && (best = i);
  return {
    distance: curRow[best],
    startOffset: curStart[best],
    endOffset: best
  };
},__name(editDistance, "editDistance");

,function emptyLexDictionary() {
  return new Map();
},__name(emptyLexDictionary, "emptyLexDictionary");

,function reverseLexDictionary(d) {
  let lookup = new Array(d.size);
  for (let [lexeme, idx] of d) lookup[idx] = lexeme;
  return lookup;
},__name(reverseLexDictionary, "reverseLexDictionary");

,function* lexGeneratorWords(s) {
  let buffer = "",
    State;
  (c => (State[c.Word = 0] = "Word", State[c.Space = 1] = "Space", State[c.Other = 2] = "Other"))(State || (n = {}));
  let state = 0;
  for (let c of s) {
    let newState;
    new RegExp("(\\p{L}|\\p{Nd}|_)", "u").test(c) ? newState = 0 : c === " " ? newState = 1 : newState = 2, newState === state && newState !== 2 ? buffer += c : (buffer.length > 0 && (yield buffer), buffer = c, state = newState);
  }
  buffer.length > 0 && (yield buffer);
},__name(lexGeneratorWords, "lexGeneratorWords");

,function lexicalAnalyzer(s, d, lexGenerator, lexFilter) {
  let lexed = [],
    offset = 0;
  for (let lexeme of lexGenerator(s)) lexFilter(lexeme) && (d.has(lexeme) || d.set(lexeme, d.size), lexed.push([d.get(lexeme), offset])), offset += lexeme.length;
  return [lexed, d];
},__name(lexicalAnalyzer, "lexicalAnalyzer");

,function notSingleSpace(s) {
  return s !== " ";
},__name(notSingleSpace, "notSingleSpace");

,function lexEditDistance(haystack, needle, lexGenerator = lexGeneratorWords) {
  let [haystackLexed, d] = lexicalAnalyzer(haystack, emptyLexDictionary(), lexGenerator, notSingleSpace),
    [needleLexed, dBoth] = lexicalAnalyzer(needle, d, lexGenerator, notSingleSpace);
  if (needleLexed.length === 0 || haystackLexed.length === 0) return {
    lexDistance: needleLexed.length,
    startOffset: 0,
    endOffset: 0,
    haystackLexLength: haystackLexed.length,
    needleLexLength: needleLexed.length
  };
  let lookupId = reverseLexDictionary(dBoth),
    needleLexedLength = needleLexed.length,
    needleFirst = lookupId[needleLexed[0][0]],
    needleLast = lookupId[needleLexed[needleLexedLength - 1][0]];
  function compare(hLexId, nLexId, hIndex, nIndex) {
    if (nIndex === 0 || nIndex === needleLexedLength - 1) {
      let haystackLexeme = lookupId[haystackLexed[hIndex][0]];
      return nIndex == 0 && haystackLexeme.endsWith(needleFirst) || nIndex == needleLexedLength - 1 && haystackLexeme.startsWith(needleLast) ? 0 : 1;
    } else return hLexId === nLexId ? 0 : 1;
  }
  __name(compare, "compare");
  let alignment = editDistance(haystackLexed.map(x => x[0]), needleLexed.map(x => x[0]), compare),
    startOffset = haystackLexed[alignment.startOffset][1],
    endOffset = alignment.endOffset < haystackLexed.length ? haystackLexed[alignment.endOffset][1] : haystack.length;
  return endOffset > 0 && haystack[endOffset - 1] === " " && --endOffset, {
    lexDistance: alignment.distance,
    startOffset: startOffset,
    endOffset: endOffset,
    haystackLexLength: haystackLexed.length,
    needleLexLength: needleLexed.length
  };
},__name(lexEditDistance, "lexEditDistance");