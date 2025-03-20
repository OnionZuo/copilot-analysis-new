var _CapiErrorTranslator = class _CapiErrorTranslator {
  static translateErrorMessage(errorCode, reason) {
    switch (errorCode) {
      case 466:
        return "Oops, your plugin is out of date. Please update it.";
      case 401:
        return "Oops, you are not authorized. Please sign in.";
      case 402:
        return reason || "Oops, you need to upgrade your plan.";
      case 429:
        return "Oops, there was a problem with your request. Please try again.";
      default:
        return "Sorry, an error occurred while generating a response.";
    }
  }
};

,__name(_CapiErrorTranslator, "CapiErrorTranslator");

,var CapiErrorTranslator = _CapiErrorTranslator;