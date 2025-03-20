var import_os = require("os"),
  import_path = require("path");

,function decodeURIComponentGraceful(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str.length > 3 ? str.substring(0, 3) + decodeURIComponentGraceful(str.substring(3)) : str;
  }
},__name(decodeURIComponentGraceful, "decodeURIComponentGraceful");

,var _rEncodedAsHex = /(%[0-9A-Za-z][0-9A-Za-z])+/g;

,function percentDecode(str) {
  return str.match(_rEncodedAsHex) ? str.replace(_rEncodedAsHex, match => decodeURIComponentGraceful(match)) : str;
},__name(percentDecode, "percentDecode");

,function parseUri(uri, strict = !1) {
  return parse(uri, strict);
},__name(parseUri, "parseUri");

,function normalizeUri(uri) {
  try {
    return parseUri(uri, !1).toString();
  } catch {
    return uri;
  }
},__name(normalizeUri, "normalizeUri");

,function isSupportedUriScheme(schemeOrUri) {
  return isFsScheme(schemeOrUri.toString().split(":")[0]);
},__name(isSupportedUriScheme, "isSupportedUriScheme");

,function isFsScheme(scheme) {
  return ["file", "notebook", "vscode-notebook", "vscode-notebook-cell"].includes(scheme);
},__name(isFsScheme, "isFsScheme");

,function isFsUri(uri) {
  return isFsScheme(uri.scheme) && (!uri.authority || (0, ZW.platform)() == "win32");
},__name(isFsUri, "isFsUri");

,function getFsPath(uri) {
  try {
    typeof uri == "string" && (uri = parseUri(uri, !0));
  } catch {
    return;
  }
  if (isFsUri(uri)) if ((0, ZW.platform)() === "win32") {
    let path = uri.path;
    return uri.authority ? path = `//${uri.authority}${uri.path}` : /^\/[A-Za-z]:/.test(path) && (path = path.substring(1)), (0, eR.normalize)(path);
  } else return uri.authority ? void 0 : uri.path;
},__name(getFsPath, "getFsPath");

,function resolveFilePath(arg, ...fileSystemPaths) {
  let uri = typeof arg == "string" ? parseUri(arg, !0) : arg,
    resolved,
    fsPath = getFsPath(uri);
  return fsPath ? resolved = URI.file((0, eR.resolve)(fsPath, ...fileSystemPaths)) : resolved = Utils.resolvePath(uri, ...fileSystemPaths.map(p => pathToURIPath(p))), typeof arg == "string" ? resolved.toString() : resolved;
},__name(resolveFilePath, "resolveFilePath");

,function joinPath(arg, ...paths) {
  let uri = typeof arg == "string" ? parseUri(arg, !0) : arg,
    joined = Utils.joinPath(uri, ...paths.map(pathToURIPath));
  return typeof arg == "string" ? joined.toString() : joined;
},__name(joinPath, "joinPath");

,function pathToURIPath(fileSystemPath) {
  return isWinPath(fileSystemPath) ? fileSystemPath.replaceAll("\\", "/") : fileSystemPath;
},__name(pathToURIPath, "pathToURIPath");

,function isWinPath(path) {
  return /^[^/\\]*\\/.test(path);
},__name(isWinPath, "isWinPath");

,function basename(uri) {
  return percentDecode(uri.toString().replace(/[#?].*$/, "").replace(/\/$/, "").replace(/^.*[/:]/, ""));
},__name(basename, "basename");

,function dirname(arg) {
  let uri = typeof arg == "string" ? parseUri(arg, !0) : arg,
    dir;
  return ["notebook", "vscode-notebook", "vscode-notebook-cell"].includes(uri.scheme) ? dir = Utils.dirname(uri).with({
    scheme: "file",
    fragment: ""
  }) : dir = Utils.dirname(uri), typeof arg == "string" ? dir.toString() : dir;
},__name(dirname, "dirname");