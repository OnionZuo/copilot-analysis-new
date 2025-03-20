function errorMessageForUnsupportedNodeVersion(version = process.versions.node) {
  let [major] = version.split(".").map(v => parseInt(v, 10));
  if (major < 20) return `Node.js 20.x is required to run GitHub Copilot but found ${version}`;
},__name(errorMessageForUnsupportedNodeVersion, "errorMessageForUnsupportedNodeVersion");

,var import_vscode = require("vscode");