function getUserSelectedModelConfiguration(ctx) {
  let value = getConfig(ctx, ConfigKey.UserSelectedCompletionModel);
  return typeof value == "string" && value.length > 0 ? value : null;
},__name(getUserSelectedModelConfiguration, "getUserSelectedModelConfiguration");