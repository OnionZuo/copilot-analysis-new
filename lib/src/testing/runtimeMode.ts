var _RuntimeMode = class _RuntimeMode {
  constructor(flags) {
    this.flags = flags;
  }
  static fromEnvironment(isRunningInTest, argv = process.argv, env = process.env) {
    return new _RuntimeMode({
      debug: determineDebugFlag(argv, env),
      verboseLogging: determineVerboseLoggingEnabled(argv, env),
      testMode: isRunningInTest,
      simulation: determineSimulationFlag(env)
    });
  }
};

,__name(_RuntimeMode, "RuntimeMode");

,var RuntimeMode = _RuntimeMode;

,function isRunningInTest(ctx) {
  return ctx.get(RuntimeMode).flags.testMode;
},__name(isRunningInTest, "isRunningInTest");

,function shouldFailForDebugPurposes(ctx) {
  return isRunningInTest(ctx);
},__name(shouldFailForDebugPurposes, "shouldFailForDebugPurposes");

,function isDebugEnabled(ctx) {
  return ctx.get(RuntimeMode).flags.debug;
},__name(isDebugEnabled, "isDebugEnabled");

,function isVerboseLoggingEnabled(ctx) {
  return ctx.get(RuntimeMode).flags.verboseLogging;
},__name(isVerboseLoggingEnabled, "isVerboseLoggingEnabled");

,function determineDebugFlag(argv, env) {
  return argv.includes("--debug") || determineEnvFlagEnabled(env, "DEBUG");
},__name(determineDebugFlag, "determineDebugFlag");

,function determineSimulationFlag(env) {
  return determineEnvFlagEnabled(env, "SIMULATION");
},__name(determineSimulationFlag, "determineSimulationFlag");

,function isRunningInSimulation(ctx) {
  return ctx.get(RuntimeMode).flags.simulation;
},__name(isRunningInSimulation, "isRunningInSimulation");

,function determineVerboseLoggingEnabled(argv, env) {
  var _a;
  return env.COPILOT_AGENT_VERBOSE === "1" || ((_a = env.COPILOT_AGENT_VERBOSE) == null ? void 0 : _a.toLowerCase()) === "true" || determineEnvFlagEnabled(env, "VERBOSE") || determineDebugFlag(argv, env);
},__name(determineVerboseLoggingEnabled, "determineVerboseLoggingEnabled");

,function determineEnvFlagEnabled(env, name) {
  for (let prefix of ["GH_COPILOT_", "GITHUB_COPILOT_"]) {
    let val = env[`${prefix}${name}`];
    if (val) return val === "1" || (val == null ? void 0 : val.toLowerCase()) === "true";
  }
  return !1;
},__name(determineEnvFlagEnabled, "determineEnvFlagEnabled");