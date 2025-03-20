var import_vscode = require("vscode");

,var _ExtensionFileSystem = class _ExtensionFileSystem extends FileSystem {
  async readFileString(uri) {
    return typeof uri == "string" && (uri = d2.Uri.parse(uri, !0)), new TextDecoder().decode(await d2.workspace.fs.readFile(uri));
  }
  async stat(uri) {
    return typeof uri == "string" && (uri = d2.Uri.parse(uri, !0)), await d2.workspace.fs.stat(uri);
  }
};

,__name(_ExtensionFileSystem, "ExtensionFileSystem");

,var ExtensionFileSystem = _ExtensionFileSystem,
  extensionFileSystem = new ExtensionFileSystem();