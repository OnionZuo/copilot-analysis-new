var _FixedWindowSizeJaccardMatcher = class _FixedWindowSizeJaccardMatcher extends WindowedMatcher {
  constructor(referenceDoc, windowLength) {
    super(referenceDoc), this.windowLength = windowLength;
  }
  id() {
    return "fixed:" + this.windowLength;
  }
  getWindowsDelineations(lines) {
    return getBasicWindowDelineations(this.windowLength, lines);
  }
  _getCursorContextInfo(referenceDoc) {
    return getCursorContext(referenceDoc, {
      maxLineCount: this.windowLength
    });
  }
  similarityScore(a, b) {
    return computeScore(a, b);
  }
};

,__name(_FixedWindowSizeJaccardMatcher, "FixedWindowSizeJaccardMatcher"), _FixedWindowSizeJaccardMatcher.FACTORY = __name(windowLength => ({
  to: __name(referenceDoc => new _FixedWindowSizeJaccardMatcher(referenceDoc, windowLength), "to")
}), "FACTORY");

,var FixedWindowSizeJaccardMatcher = _FixedWindowSizeJaccardMatcher;

,function computeScore(a, b) {
  let intersection = new Set();
  return a.forEach(x => {
    b.has(x) && intersection.add(x);
  }), intersection.size / (a.size + b.size - intersection.size);
},__name(computeScore, "computeScore");