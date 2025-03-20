var _CitationManager = class _CitationManager {};

,__name(_CitationManager, "CitationManager");

,var CitationManager = _CitationManager,
  _NoOpCitationManager = class _NoOpCitationManager extends CitationManager {
    async handleIPCodeCitation(ctx, citation) {}
  };

,__name(_NoOpCitationManager, "NoOpCitationManager");

,var NoOpCitationManager = _NoOpCitationManager;