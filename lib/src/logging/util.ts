var import_node_util = fn(require("util"));

,function formatLogMessage(category, ...extra) {
  return `[${category}] ${format(extra)}`;
},__name(formatLogMessage, "formatLogMessage");

,function format(args) {
  return J8e.util.formatWithOptions({
    maxStringLength: 1 / 0
  }, ...args);
},__name(format, "format");

,function verboseLogging(ctx) {
  return isVerboseLoggingEnabled(ctx);
},__name(verboseLogging, "verboseLogging");