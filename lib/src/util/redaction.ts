var import_os = require("os"),
  path = fn(require("path"));

,function redactPaths(input) {
  return input.replace(/(file:\/\/)([^\s<>]+)/gi, "$1[redacted]").replace(/(^|[\s|:=(<'"`])((?:\/(?=[^/])|\\|[a-zA-Z]:[\\/])[^\s:)>'"`]+)/g, "$1[redacted]");
},__name(redactPaths, "redactPaths");

,var knownErrorLiterals = new Set(["Maximum call stack size exceeded", "Set maximum size exceeded", "Invalid arguments"]),
  knownErrorPatterns = [/^[\p{L}\p{Nl}$\p{Mn}\p{Mc}\p{Nd}\p{Pc}.]+ is not a function[ \w]*$/u, /^Cannot read properties of undefined \(reading '[\p{L}\p{Nl}$\p{Mn}\p{Mc}\p{Nd}\p{Pc}]+'\)$/u];

,function redactMessage(input) {
  if (knownErrorLiterals.has(input)) return input;
  for (let pattern of knownErrorPatterns) if (pattern.test(input)) return input;
  return redactPaths(input).replace(/\bDNS:(?:\*\.)?[\w.-]+/gi, "DNS:[redacted]");
},__name(redactMessage, "redactMessage");

,function escapeForRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
},__name(escapeForRegExp, "escapeForRegExp");

,var homedirRegExp = new RegExp("(?<=^|[\\s|(\"'`]|file://)" + escapeForRegExp((0, aQe.homedir)()) + "(?=$|[\\\\/:\"'`])", "gi");

,function redactHomeDir(input) {
  return input.replace(homedirRegExp, "~");
},__name(redactHomeDir, "redactHomeDir");

,var relativePathSuffix = "[\\\\/]?([^:)]*)(?=:\\d)",
  pathSepRegExp = new RegExp(escapeForRegExp(iQe.sep), "g"),
  rootDirRegExp = new RegExp(escapeForRegExp(__dirname.replace(/[\\/]lib[\\/]src[\\/]util$|[\\/]dist$/, "")) + relativePathSuffix, "gi");

,function cloneError(original, prepareMessage, allowUnknownPaths = !1, replacements = []) {
  var _a;
  let error = new Error(prepareMessage(original));
  error.name = original.name, typeof original.syscall == "string" && (error.syscall = original.syscall), typeof original.code == "string" && (error.code = original.code), typeof original.errno == "number" && (error.errno = original.errno), error.stack = void 0;
  let originalStack = (_a = original.stack) == null ? void 0 : _a.replace(/^.*?:\d+\n.*\n *\^?\n\n/, ""),
    stackFrames;
  for (let stackPrefix of [original.toString(), `${original.name}: ${original.message}`]) if (originalStack != null && originalStack.startsWith(stackPrefix + `
`)) {
    stackFrames = originalStack.slice(stackPrefix.length + 1).split(/\n/);
    break;
  }
  if (stackFrames) {
    error.stack = error.toString();
    for (let frame of stackFrames) if (rootDirRegExp.test(frame)) error.stack += `
${redactPaths(frame.replace(rootDirRegExp, (_, relative) => "./" + relative.replace(pathSepRegExp, "/")))}`;else if (/[ (]node:|[ (]wasm:\/\/wasm\/| \(<anonymous>\)$/.test(frame)) error.stack += `
${redactPaths(frame)}`;else {
      let found = !1;
      for (let {
        prefix: prefix,
        path: dir
      } of replacements) {
        let dirRegExp = new RegExp(escapeForRegExp(dir.replace(/[\\/]$/, "")) + relativePathSuffix, "gi");
        if (dirRegExp.test(frame)) {
          error.stack += `
${redactPaths(frame.replace(dirRegExp, (_, relative) => prefix + relative.replace(pathSepRegExp, "/")))}`, found = !0;
          break;
        }
      }
      if (found) continue;
      allowUnknownPaths ? error.stack += `
${redactHomeDir(frame)}` : error.stack += `
    at [redacted]:0:0`;
    }
  } else allowUnknownPaths && originalStack && (error.stack = redactHomeDir(originalStack));
  return original.cause instanceof Error && (error.cause = cloneError(original.cause, prepareMessage, allowUnknownPaths, replacements)), error;
},__name(cloneError, "cloneError");

,function errorMessageWithoutPath(error) {
  let message = error.message;
  return typeof error.path == "string" && error.path.length > 0 && (message = message.replaceAll(error.path, "<path>")), message;
},__name(errorMessageWithoutPath, "errorMessageWithoutPath");

,function prepareErrorForRestrictedTelemetry(original, replacements) {
  return cloneError(original, __name(function (e) {
    return redactHomeDir(errorMessageWithoutPath(e));
  }, "prepareMessage"), !0, replacements);
},__name(prepareErrorForRestrictedTelemetry, "prepareErrorForRestrictedTelemetry");

,function redactError(original, replacements, telemetryOptIn = !1) {
  return cloneError(original, __name(function (e) {
    if (telemetryOptIn) return redactMessage(errorMessageWithoutPath(e));
    let message = "[redacted]";
    return typeof e.code == "string" && (message = e.code + " " + message), typeof e.syscall == "string" ? message = redactPaths(e.syscall) + " " + message : e instanceof FetchError && e.erroredSysCall && (message = e.erroredSysCall + " " + message), message;
  }, "prepareMessage"), !1, replacements);
},__name(redactError, "redactError");