async function extractRepoInfo(turnContext) {
  let currentEditorSkillResolution = await turnContext.skillResolver.resolve(CurrentEditorSkillId);
  if (currentEditorSkillResolution) {
    let currentFolderUri = currentEditorSkillResolution.uri,
      repoInfo = extractRepoInfoInBackground(turnContext.ctx, currentFolderUri);
    if (isRepoInfo(repoInfo)) return {
      repoInfo: repoInfo,
      skillUsed: CurrentEditorSkillId
    };
  }
  let gitMetadataSkillResolution = await turnContext.skillResolver.resolve(GitMetadataSkillId);
  if (!gitMetadataSkillResolution || !gitMetadataSkillResolution.remotes || gitMetadataSkillResolution.remotes.length === 0) {
    conversationLogger.debug(turnContext.ctx, "Git metadata skill is not available or no remotes available.");
    return;
  }
  let originRemote = gitMetadataSkillResolution.remotes.find(r => r.name === "origin"),
    remote = originRemote != null ? originRemote : gitMetadataSkillResolution.remotes[0],
    parsedInfo = parseRepoUrl(remote.url),
    baseFolder = getFsPath(gitMetadataSkillResolution.path);
  if (!(!parsedInfo || !baseFolder)) return {
    repoInfo: {
      baseFolder: baseFolder,
      url: remote.url,
      ...parsedInfo
    },
    skillUsed: GitMetadataSkillId
  };
},__name(extractRepoInfo, "extractRepoInfo");