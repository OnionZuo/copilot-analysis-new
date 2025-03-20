var oomCodes = new Set(["ERR_WORKER_OUT_OF_MEMORY", "ENOMEM"]);

,function isOomError(error) {
  var _a;
  return oomCodes.has((_a = error.code) != null ? _a : "") || error.name === "RangeError" && error.message === "WebAssembly.Memory(): could not allocate memory";
},__name(isOomError, "isOomError");

,function handleException(ctx, err, origin, _logger = logger) {
  if (!isAbortError(err)) {
    if (err instanceof Error) {
      let error = err;
      isOomError(error) ? ctx.get(StatusReporter).setWarning("Out of memory") : error.code === "EMFILE" || error.code === "ENFILE" ? ctx.get(StatusReporter).setWarning("Too many open files") : error.code === "CopilotPromptLoadFailure" ? ctx.get(StatusReporter).setWarning("Corrupted Copilot installation") : `${error.code}`.startsWith("CopilotPromptWorkerExit") ? ctx.get(StatusReporter).setWarning("Worker unexpectedly exited") : error.syscall === "uv_cwd" && error.code === "ENOENT" && ctx.get(StatusReporter).setWarning("Current working directory does not exist");
    }
    _logger.exception(ctx, err, origin);
  }
},__name(handleException, "handleException");