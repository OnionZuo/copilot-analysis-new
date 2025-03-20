function computeCompCharLen(suggestionStatus, completionText) {
  return suggestionStatus.compType === "partial" ? suggestionStatus.acceptedLength : completionText.length;
},__name(computeCompCharLen, "computeCompCharLen");

,function computeCompletionText(completionText, suggestionStatus) {
  return suggestionStatus.compType === "partial" ? completionText.substring(0, suggestionStatus.acceptedLength) : completionText;
},__name(computeCompletionText, "computeCompletionText");

,function computePartialLength(cmp, acceptedLength, triggerKind) {
  return cmp.displayText !== cmp.insertText && cmp.insertText.trim() === cmp.displayText || triggerKind === 3 ? acceptedLength : acceptedLength - cmp.range.end.character + cmp.range.start.character;
},__name(computePartialLength, "computePartialLength");