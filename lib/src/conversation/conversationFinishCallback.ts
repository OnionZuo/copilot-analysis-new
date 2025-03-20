var _ConversationFinishCallback = class _ConversationFinishCallback {
  constructor(deltaApplier) {
    this.deltaApplier = deltaApplier;
    this.appliedLength = 0;
    this.appliedText = "";
    this.appliedAnnotations = [];
  }
  isFinishedAfter(text, delta) {
    var _a;
    let toApply = text.substring(this.appliedLength, text.length),
      deltaAnnotations = this.mapAnnotations(delta.annotations).filter(a => !this.appliedAnnotations.includes(a.id));
    this.append(toApply, deltaAnnotations, filterUnsupportedReferences(delta.copilotReferences), (_a = delta.copilotErrors) != null ? _a : [], delta.copilotConfirmation);
  }
  append(text, annotations, references, errors, confirmation) {
    this.deltaApplier(text, annotations, references, errors, confirmation), this.appliedLength += text.length, this.appliedText += text, this.appliedAnnotations.push(...annotations.map(a => a.id));
  }
  mapAnnotations(annotations) {
    if (!annotations) return [];
    let mappedAnnotations = [],
      vulnerabilities = annotations.for("CodeVulnerability").map(a => ({
        ...a,
        type: "code_vulnerability"
      })),
      IPCodeCitations = annotations.for("IPCodeCitations").map(a => ({
        ...a,
        type: "ip_code_citations"
      }));
    return mappedAnnotations.push(...vulnerabilities), mappedAnnotations.push(...IPCodeCitations), mappedAnnotations;
  }
};

,__name(_ConversationFinishCallback, "ConversationFinishCallback");

,var ConversationFinishCallback = _ConversationFinishCallback;