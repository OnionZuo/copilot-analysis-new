var import_path = fn(require("path")),
  import_worker_threads = require("worker_threads");

,function sleep(delay) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`delay: ${delay}`), delay);
  });
},__name(sleep, "sleep");

,var workerFns = ["getSimilarSnippets", "sleep"],
  _WorkerProxy = class _WorkerProxy {
    constructor() {
      this.nextHandlerId = 0;
      this.handlers = new Map();
      this.fns = new Map();
      this.getSimilarSnippets = getSimilarSnippets;
      this.sleep = sleep;
      var _a;
      !Hg.isMainThread && (_a = Hg.workerData) != null && _a.port && (oZ(), process.cwd = () => Hg.workerData.cwd, this.configureWorkerResponse(Hg.workerData.port));
    }
    initWorker() {
      let {
        port1: port1,
        port2: port2
      } = new Hg.MessageChannel();
      this.port = port1, this.worker = new Hg.Worker(GR.path.resolve(GR.path.extname(__filename) !== ".ts" ? __dirname : GR.path.resolve(__dirname, "../../dist"), "workerProxy.js"), {
        workerData: {
          port: port2,
          cwd: process.cwd()
        },
        transferList: [port2]
      }), this.port.on("message", m => this.handleMessage(m)), this.port.on("error", e => this.handleError(e));
    }
    startThreading() {
      if (this.worker) throw new Error("Worker thread already initialized.");
      this.proxyFunctions(), this.initWorker();
    }
    stopThreading() {
      this.worker && (this.worker.terminate(), this.worker.removeAllListeners(), this.worker = void 0, this.unproxyFunctions(), this.handlers.clear());
    }
    proxyFunctions() {
      for (let fn of workerFns) this.fns.set(fn, this[fn]), this.proxy(fn);
    }
    unproxyFunctions() {
      for (let fn of workerFns) {
        let originalFn = this.fns.get(fn);
        if (originalFn) this[fn] = originalFn;else throw new Error(`Unproxy function not found: ${fn}`);
      }
    }
    configureWorkerResponse(port) {
      this.port = port, this.port.on("message", a => void this.onMessage(a));
    }
    async onMessage({
      id: id,
      fn: fn,
      args: args
    }) {
      let proxiedFunction = this[fn];
      if (!proxiedFunction) throw new Error(`Function not found: ${fn}`);
      try {
        let res = await proxiedFunction.apply(this, args);
        this.port.postMessage({
          id: id,
          res: res
        });
      } catch (err) {
        if (!(err instanceof Error)) throw err;
        typeof err.code == "string" ? this.port.postMessage({
          id: id,
          err: err,
          code: err.code
        }) : this.port.postMessage({
          id: id,
          err: err
        });
      }
    }
    handleMessage({
      id: id,
      err: err,
      code: code,
      res: res
    }) {
      let handler = this.handlers.get(id);
      handler && (this.handlers.delete(id), err ? (err.code = code, handler.reject(err)) : handler.resolve(res));
    }
    handleError(maybeError) {
      var _a;
      let err;
      if (maybeError instanceof Error) {
        err = maybeError, err.code === "MODULE_NOT_FOUND" && (_a = err.message) != null && _a.endsWith("workerProxy.js'") && (err = new CopilotPromptLoadFailure("Failed to load workerProxy.js"));
        let ourStack = new Error().stack;
        err.stack && ourStack != null && ourStack.match(/^Error\n/) && (err.stack += ourStack.replace(/^Error/, ""));
      } else maybeError && typeof maybeError == "object" && "name" in maybeError && maybeError.name === "ExitStatus" && "status" in maybeError && typeof maybeError.status == "number" ? (err = new Error(`workerProxy.js exited with status ${maybeError.status}`), err.code = `CopilotPromptWorkerExit${maybeError.status}`) : err = new Error(`Non-error thrown: ${JSON.stringify(maybeError)}`);
      for (let handler of this.handlers.values()) handler.reject(err);
      throw err;
    }
    proxy(fn) {
      this[fn] = function (...args) {
        let id = this.nextHandlerId++;
        return new Promise((resolve, reject) => {
          var _a;
          this.handlers.set(id, {
            resolve: resolve,
            reject: reject
          }), (_a = this.port) == null || _a.postMessage({
            id: id,
            fn: fn,
            args: args
          });
        });
      };
    }
  };

,__name(_WorkerProxy, "WorkerProxy");

,var WorkerProxy = _WorkerProxy,
  workerProxy = new WorkerProxy();