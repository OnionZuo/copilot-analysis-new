async function isDocumentValid(ctx, document) {
  var _a;
  let rcmResult = await ctx.get(CopilotContentExclusionManager).evaluate(document.uri, document.getText());
  return rcmResult.isBlocked ? {
    status: "invalid",
    reason: (_a = rcmResult.message) != null ? _a : "Document is blocked by repository policy"
  } : {
    status: "valid",
    document: document
  };
},__name(isDocumentValid, "isDocumentValid");