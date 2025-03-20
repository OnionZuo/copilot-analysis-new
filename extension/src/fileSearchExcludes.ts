var import_vscode = require("vscode");

,var SEARCH_EXCLUDE = "search.exclude",
  FILES_EXCLUDE = "files.exclude";

,async function getSettingExcludeGlobs(workspaceUri, section) {
  let excludes = sF.workspace.getConfiguration(section, factory_exports.parse(workspaceUri)).get("exclude", {}),
    ret = [];
  return Object.keys(excludes).forEach(key => {
    excludes[key] && ret.push(key);
  }), ret.map(glob => [glob, `${glob}/**`]).flat();
},__name(getSettingExcludeGlobs, "getSettingExcludeGlobs");

,async function getGitIgnoredGlobs(workspaceUri) {
  return ["**/out/**", "**/dist/**"];
},__name(getGitIgnoredGlobs, "getGitIgnoredGlobs");

,async function getSettingExcludeRelativePatterns(workspaceUris, section) {
  return Promise.all(workspaceUris.map(async workspace => (await getSettingExcludeGlobs(workspace, section)).map(line => new sF.RelativePattern(factory_exports.parse(workspace), line)))).then(e => e.flat());
},__name(getSettingExcludeRelativePatterns, "getSettingExcludeRelativePatterns");

,async function getGitIgnoredRelativePatterns(workspaceUris) {
  return Promise.all(workspaceUris.map(async workspace => (await getGitIgnoredGlobs(workspace)).map(line => new sF.RelativePattern(factory_exports.parse(workspace), line)))).then(e => e.flat());
},__name(getGitIgnoredRelativePatterns, "getGitIgnoredRelativePatterns");

,var _ExtensionFileSearch = class _ExtensionFileSearch extends FileSearch {
  async findFiles(pattern, workspaceUri, params) {
    let excludeStrings = [];
    params.excludeIDESearchIgnoredFiles && excludeStrings.push(...(await getSettingExcludeGlobs(workspaceUri, "search"))), params.excludeGitignoredFiles && excludeStrings.push(...(await getGitIgnoredGlobs(workspaceUri)));
    let globPattern = new p2.RelativePattern(p2.Uri.parse(workspaceUri), pattern);
    return (await p2.workspace.findFiles(globPattern, params.excludeIDEIgnoredFiles ? void 0 : null)).filter(uri => {
      let uriSuffix = uri.toString().substring(workspaceUri.length);
      return !excludeStrings.some(pattern => minimatch(uriSuffix, pattern, {
        nocase: !0,
        dot: !0
      }));
    });
  }
};

,__name(_ExtensionFileSearch, "ExtensionFileSearch");

,var ExtensionFileSearch = _ExtensionFileSearch;