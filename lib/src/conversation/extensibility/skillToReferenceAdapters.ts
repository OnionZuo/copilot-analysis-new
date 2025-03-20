async function skillsToReference(turnContext) {
  let references = [];
  return await addRepositoryReference(turnContext, references), await addSelectionReference(turnContext, references), await addFileReferences(turnContext, references), references;
},__name(skillsToReference, "skillsToReference");

,async function addRepositoryReference(turnContext, references) {
  let repositoryReference = await gitMetadataToReference(turnContext);
  repositoryReference && references.push(repositoryReference);
},__name(addRepositoryReference, "addRepositoryReference");

,async function addSelectionReference(turnContext, references) {
  let selectionReference = await currentEditorToSelectionReference(turnContext);
  selectionReference && references.push(selectionReference);
},__name(addSelectionReference, "addSelectionReference");

,async function addFileReferences(turnContext, references) {
  let fileReferences = [],
    currentEditorReference = await currentEditorToFileReference(turnContext);
  currentEditorReference && fileReferences.push(currentEditorReference), fileReferences.push(...(await fileReferenceToPlatformFileReference(turnContext))), fileReferences.length > 0 && references.push(...fileReferences);
},__name(addFileReferences, "addFileReferences");

,async function gitMetadataToReference(turnContext) {
  let maybeRepoInfo = await extractRepoInfo(turnContext);
  if (maybeRepoInfo) {
    let repoApi = turnContext.ctx.get(GitHubRepositoryApi),
      owner = maybeRepoInfo.repoInfo.owner,
      repo = maybeRepoInfo.repoInfo.repo;
    if (await repoApi.isAvailable(owner, repo)) return {
      type: "github.repository",
      id: `${owner}/${repo}`,
      data: {
        type: "repository",
        name: repo,
        ownerLogin: owner,
        id: (await repoApi.getRepositoryInfo(owner, repo)).id
      }
    };
  }
},__name(gitMetadataToReference, "gitMetadataToReference");

,async function currentEditorToSelectionReference(turnContext) {
  let currentEditor = await turnContext.skillResolver.resolve(CurrentEditorSkillId);
  if (currentEditor && currentEditor.selection) {
    let documentResult = await turnContext.ctx.get(FileReader).readFile(currentEditor.uri),
      fileStatus = statusFromTextDocumentResult(documentResult);
    if (await turnContext.collectFile(turnContext.turn.agent.agentSlug, currentEditor.uri, fileStatus, currentEditor.selection), documentResult.status === "valid") return await extractSelection(currentEditor, documentResult.document);
  }
},__name(currentEditorToSelectionReference, "currentEditorToSelectionReference");

,async function extractSelection(currentEditor, doc) {
  if (currentEditor.selection && !isEmptyRange(currentEditor.selection)) {
    let selection = doc.getText(currentEditor.selection);
    return {
      type: "client.selection",
      id: currentEditor.uri,
      data: {
        start: {
          line: currentEditor.selection.start.line,
          col: currentEditor.selection.start.character
        },
        end: {
          line: currentEditor.selection.end.line,
          col: currentEditor.selection.end.character
        },
        content: selection
      }
    };
  }
},__name(extractSelection, "extractSelection");

,async function currentEditorToFileReference(turnContext) {
  let currentEditor = await turnContext.skillResolver.resolve(CurrentEditorSkillId);
  if (currentEditor) {
    let documentResult = await turnContext.ctx.get(FileReader).readFile(currentEditor.uri),
      fileStatus = statusFromTextDocumentResult(documentResult);
    if (await turnContext.collectFile(turnContext.turn.agent.agentSlug, currentEditor.uri, fileStatus), documentResult.status === "valid") return {
      type: "client.file",
      id: documentResult.document.uri,
      data: {
        content: documentResult.document.getText(),
        language: documentResult.document.languageId
      }
    };
  }
},__name(currentEditorToFileReference, "currentEditorToFileReference");

,async function fileReferenceToPlatformFileReference(turnContext) {
  let platformReferences = [],
    references = turnContext.turn.request.references;
  if (references && references.length > 0) {
    let fileReader = turnContext.ctx.get(FileReader);
    for (let reference of references) if (reference.type === "file") {
      let documentResult = await fileReader.readFile(reference.uri),
        fileStatus = statusFromTextDocumentResult(documentResult);
      if (await turnContext.collectFile(turnContext.turn.agent.agentSlug, reference.uri, fileStatus, reference.selection), documentResult.status === "valid") {
        let content = documentResult.document.getText();
        platformReferences.push({
          type: "client.file",
          id: reference.uri,
          data: {
            content: content,
            language: documentResult.document.languageId
          }
        });
      }
    }
  }
  return platformReferences;
},__name(fileReferenceToPlatformFileReference, "fileReferenceToPlatformFileReference");