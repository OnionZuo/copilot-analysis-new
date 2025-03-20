async function fromSkills(turnContext, promptOptions) {
  let [elidableSkills, nonElidableSkills, skillResolutions] = await handleSkillsInReverse(turnContext, promptOptions);
  return skillResolutions.push(...handleIgnoredSkills(turnContext)), elidableSkills.length > 0 || nonElidableSkills.length > 0 ? [new ElidableText([[new ElidableText(["Consider the additional context:"]), 1], [weighElidableList(elidableSkills, "inverseLinear"), .9], ...nonElidableSkills]), skillResolutions] : [null, skillResolutions];
},__name(fromSkills, "fromSkills");

,async function handleSkillsInReverse(turnContext, promptOptions) {
  var _a;
  let skillResolutions = [],
    elidableSkills = [],
    nonElidableSkills = [],
    reverseSkills = [...turnContext.turn.skills].reverse();
  for (let skill of reverseSkills) {
    if (!(await includeSkill(turnContext, skill.skillId, (_a = promptOptions == null ? void 0 : promptOptions.languageId) != null ? _a : ""))) continue;
    let [elidedSkill, resolution] = await safelyProcessSkill(turnContext, skill.skillId);
    elidedSkill && (mandatorySkills().indexOf(skill.skillId) === -1 ? elidableSkills.push(elidedSkill) : nonElidableSkills.push(elidedSkill)), skillResolutions.push(resolution);
  }
  return elidableSkills.reverse(), nonElidableSkills.reverse(), skillResolutions.reverse(), [elidableSkills, nonElidableSkills, skillResolutions];
},__name(handleSkillsInReverse, "handleSkillsInReverse");

,async function safelyProcessSkill(turnContext, skillId) {
  let skill = turnContext.ctx.get(ConversationSkillRegistry).getSkill(skillId);
  try {
    let resolutionStart = Date.now(),
      resolvedSkill = await turnContext.skillResolver.resolve(skillId),
      resolutionTimeMs = Date.now() - resolutionStart;
    if (resolvedSkill) {
      let processor = skill == null ? void 0 : skill.processor(turnContext),
        processingStart = Date.now(),
        processedSkill = await (processor == null ? void 0 : processor.processSkill(resolvedSkill, turnContext)),
        processingTimeMs = Date.now() - processingStart;
      return processedSkill ? await handleProcessedSkill(turnContext, skill, processor, processedSkill, resolutionTimeMs, processingTimeMs) : [void 0, await determineResolution(turnContext, skill, "unprocessable", void 0, resolutionTimeMs, processingTimeMs)];
    } else return [void 0, await determineResolution(turnContext, skill, "unresolvable", void 0, resolutionTimeMs)];
  } catch (e) {
    if (conversationLogger.exception(turnContext.ctx, e, `Error while resolving skill ${skillId}`), e instanceof ConversationAbortError) throw e;
    return [void 0, await determineResolution(turnContext, skill, "failed")];
  }
},__name(safelyProcessSkill, "safelyProcessSkill");

,async function handleProcessedSkill(turnContext, skill, processor, processedSkill, resolutionTimeMs, processingTimeMs) {
  let elidableSkill;
  return typeof processedSkill == "string" ? elidableSkill = new ElidableText([[processedSkill, 1]]) : elidableSkill = processedSkill, [[elidableSkill, (processor == null ? void 0 : processor.value()) || 0], await determineResolution(turnContext, skill, "resolved", elidableSkill, resolutionTimeMs, processingTimeMs)];
},__name(handleProcessedSkill, "handleProcessedSkill");

,async function determineResolution(turnContext, skill, resolutionState, elidableSkill, resolutionTimeMs, processingTimeMs) {
  var _a, _b;
  let files = turnContext.collector.collectiblesForCollector((_a = skill == null ? void 0 : skill.id) != null ? _a : "unknown").filter(c => c.type === "file"),
    resolution = {
      skillId: (_b = skill == null ? void 0 : skill.id) != null ? _b : "unknown",
      resolution: resolutionState,
      files: files,
      resolutionTimeMs: resolutionTimeMs,
      processingTimeMs: processingTimeMs
    };
  if (elidableSkill) {
    let modelConfiguration = await turnContext.ctx.get(ModelConfigurationProvider).getBestChatModelConfig(getSupportedModelFamiliesForPrompt("user")),
      fullyProcessedSkill = elidableSkill.makePrompt(modelConfiguration.maxRequestTokens);
    resolution.tokensPreEliding = getTokenizer(modelConfiguration.tokenizer).tokenLength(fullyProcessedSkill);
  }
  return turnContext.ctx.get(ConversationDumper).addResolution(turnContext.turn.id, resolution), resolution;
},__name(determineResolution, "determineResolution");

,function handleIgnoredSkills(turnContext) {
  return turnContext.turn.ignoredSkills.map(skill => ({
    skillId: skill.skillId,
    resolution: "ignored"
  }));
},__name(handleIgnoredSkills, "handleIgnoredSkills");

,async function includeSkill(turnContext, skillId, languageId) {
  if (skillId !== ProjectMetadataSkillId && skillId !== ProjectLabelsSkillId) return !0;
  let features = turnContext.ctx.get(Features),
    telemetryDataWithExp = await features.updateExPValuesAndAssignments({
      languageId: languageId
    });
  return features.ideChatEnableProjectMetadata(telemetryDataWithExp) ? skillId === ProjectMetadataSkillId : skillId === ProjectLabelsSkillId;
},__name(includeSkill, "includeSkill");