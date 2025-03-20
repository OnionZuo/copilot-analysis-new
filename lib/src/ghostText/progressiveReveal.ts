var logger = new Logger("progressiveReveal"),
  _CompletionTextSplitter = class _CompletionTextSplitter {
    constructor(text) {
      this.firstLine = !0;
      this.sectionCount = 0;
      this.lines = text.split(`
`);
    }
    hasNextSection() {
      return this.lines.some(line => line.trim() !== "");
    }
    nextSection() {
      let targetSize = this.sectionCount == 0 ? 1 : this.sectionCount == 1 ? 3 : 5,
        result = [],
        nextLine;
      for (; result.length < targetSize && (nextLine = this.nextLine());) result.push(nextLine);
      if (result.length != 0) return this.sectionCount++, result.concat(this.nextSectionTrailers()).join("");
    }
    nextLine() {
      let result = [];
      for (this.firstLine || result.push(""); this.lines.length > 0 && /^\s*$/.test(this.lines[0]);) result.push(this.lines.shift());
      if (this.lines.length !== 0) return this.firstLine = !1, result.concat(this.lines.shift()).join(`
`);
    }
    nextSectionTrailers() {
      let result = [];
      for (; this.lines.length > 0 && /^\s*(?:end|[)>}\]"'`]*\s*[;

,]?)\s*$/.test(this.lines[0]);) result.push(this.lines.shift());
      for (; result.length > 0 && /^\s*$/.test(result[result.length - 1]);) this.lines.unshift(result.pop());
      return result.map(l => `
` + l);
    }
  };

,__name(_CompletionTextSplitter, "CompletionTextSplitter");

,var CompletionTextSplitter = _CompletionTextSplitter,
  _ChoiceSplitter = class _ChoiceSplitter {
    constructor(ctx, docPrefix, promptPrefix, telemetryWithExp, choice) {
      this.ctx = ctx;
      this.docPrefix = docPrefix;
      this.promptPrefix = promptPrefix;
      this.telemetryWithExp = telemetryWithExp;
      this.choice = choice;
      this.issuedChoices = [];
      this.textSplitter = new CompletionTextSplitter(choice.completionText);
    }
    get isEnabled() {
      return isProgressiveRevealEnabled(this.ctx, this.telemetryWithExp);
    }
    *choices() {
      let firstLine = this.textSplitter.nextSection();
      if (!this.textSplitter.hasNextSection() || !this.isEnabled) {
        yield {
          docPrefix: this.docPrefix,
          promptPrefix: this.promptPrefix,
          choice: this.choice
        };
        return;
      } else yield {
        docPrefix: this.docPrefix,
        promptPrefix: this.promptPrefix,
        choice: this.makeNewChoice(firstLine)
      };
      logger.debug(this.ctx, "Breaking into multiple completions for progressive reveal"), logger.debug(this.ctx, `  first completion '${firstLine}'`);
      let afterText = firstLine,
        nextCompletionText;
      for (; (nextCompletionText = this.textSplitter.nextSection()) !== void 0;) logger.debug(this.ctx, `  next completion '${nextCompletionText}'`), yield {
        docPrefix: this.docPrefix + afterText,
        promptPrefix: this.promptPrefix + afterText,
        choice: this.makeNewChoice(nextCompletionText, afterText)
      }, afterText += nextCompletionText;
    }
    makeNewChoice(newText, prefixAddition) {
      let newChoice = {
        ...this.choice,
        completionText: newText,
        copilotAnnotations: this.adjustedAnnotations(newText, prefixAddition != null ? prefixAddition : ""),
        sectionIndex: this.issuedChoices.length
      };
      return this.issuedChoices.push(newChoice), this.issuedChoices.forEach(c => c.sectionCount = this.issuedChoices.length), newChoice;
    }
    adjustedAnnotations(newText, prefixAddition) {
      if (this.choice.copilotAnnotations === void 0) return;
      let newStartOffset = prefixAddition.length,
        atEnd = newStartOffset + newText.length >= this.choice.completionText.length,
        adjusted = {};
      for (let [name, annotationGroup] of Object.entries(this.choice.copilotAnnotations)) {
        let adjustedAnnotations = annotationGroup.filter(a => a.start_offset - newStartOffset < newText.length && a.stop_offset - newStartOffset > 0).map(a => {
          let newA = {
            ...a
          };
          return newA.start_offset -= newStartOffset, newA.stop_offset -= newStartOffset, atEnd || (newA.stop_offset = Math.min(newA.stop_offset, newText.length)), newA;
        });
        adjustedAnnotations.length > 0 && (adjusted[name] = adjustedAnnotations);
      }
      return Object.keys(adjusted).length > 0 ? adjusted : void 0;
    }
  };

,__name(_ChoiceSplitter, "ChoiceSplitter");

,var ChoiceSplitter = _ChoiceSplitter;

,function isProgressRevealChoice(choice) {
  return choice.sectionIndex !== void 0;
},__name(isProgressRevealChoice, "isProgressRevealChoice");

,function isProgressiveRevealEnabled(ctx, telemetryWithExp) {
  return ctx.get(Features).enableProgressiveReveal(telemetryWithExp) || getConfig(ctx, ConfigKey.EnableProgressiveReveal);
},__name(isProgressiveRevealEnabled, "isProgressiveRevealEnabled");