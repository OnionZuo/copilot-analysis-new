var import_vscode = require("vscode");

,function exception(ctx, error, origin, logger) {
  error instanceof Error && error.name === "Canceled" || error instanceof Error && error.name === "CodeExpectedError" || handleException(ctx, error, origin, logger);
},__name(exception, "exception");

,function registerCommandWrapper(ctx, command, fn) {
  let disposable = Oje.commands.registerCommand(command, async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      exception(ctx, error, command);
    }
  });
  ctx.get(Extension).addSubscription(disposable);
},__name(registerCommandWrapper, "registerCommandWrapper");