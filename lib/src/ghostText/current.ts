var _CurrentGhostText = class _CurrentGhostText {
  constructor() {
    this.choices = [];
  }
  get clientCompletionId() {
    var _a;
    return (_a = this.choices[0]) == null ? void 0 : _a.clientCompletionId;
  }
  setGhostText(prefix, suffix, choices, resultType) {
    resultType !== 2 && (this.prefix = prefix, this.suffix = suffix, this.choices = choices);
  }
  getCompletionsForUserTyping(prefix, suffix) {
    let remainingPrefix = this.getRemainingPrefix(prefix, suffix);
    if (remainingPrefix !== void 0 && startsWithAndExceeds(this.choices[0].completionText, remainingPrefix)) return adjustChoicesStart(this.choices, remainingPrefix);
  }
  hasAcceptedCurrentCompletion(prefix, suffix) {
    var _a;
    let remainingPrefix = this.getRemainingPrefix(prefix, suffix);
    return remainingPrefix === void 0 ? !1 : remainingPrefix === ((_a = this.choices) == null ? void 0 : _a[0].completionText);
  }
  getRemainingPrefix(prefix, suffix) {
    if (!(this.prefix === void 0 || this.suffix === void 0 || this.choices.length === 0) && this.suffix === suffix && prefix.startsWith(this.prefix)) return prefix.substring(this.prefix.length);
  }
};

,__name(_CurrentGhostText, "CurrentGhostText");

,var CurrentGhostText = _CurrentGhostText;

,function adjustChoicesStart(choices, remainingPrefix) {
  return choices.filter(choice => startsWithAndExceeds(choice.completionText, remainingPrefix)).map(choice => ({
    ...choice,
    completionText: choice.completionText.substring(remainingPrefix.length)
  }));
},__name(adjustChoicesStart, "adjustChoicesStart");

,function startsWithAndExceeds(text, prefix) {
  return text.startsWith(prefix) && text.length > prefix.length;
},__name(startsWithAndExceeds, "startsWithAndExceeds");