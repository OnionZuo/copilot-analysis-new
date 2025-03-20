var microjob = fn(Lz()),
  os = fn(require("os")),
  import_ts_dedent = fn(Wu());

,var MAX_THREAD_COUNT = Math.max(Yqe.cpus().length - 1, 1),
  _WorkerPoolToken = class _WorkerPoolToken {
    constructor() {
      this.isActive = !0;
    }
    static async startWorkerPool() {
      _WorkerPoolToken.workerPoolStarted || (_WorkerPoolToken.workerPoolStarted = !0, await y$.start({
        maxWorkers: MAX_THREAD_COUNT
      })), _WorkerPoolToken.activeProcessCount++;
      let token = new _WorkerPoolToken();
      return _WorkerPoolToken.allTokens.push(token), token;
    }
    async stopWorkerPool() {
      this.isActive && (this.isActive = !1, _WorkerPoolToken.activeProcessCount--, _WorkerPoolToken.activeProcessCount == 0 && (await y$.stop(), _WorkerPoolToken.workerPoolStarted = !1), _WorkerPoolToken.allTokens.includes(this) && _WorkerPoolToken.allTokens.splice(_WorkerPoolToken.allTokens.indexOf(this), 1));
    }
    static async forceStopWorkerPool() {
      let iter = _WorkerPoolToken.allTokens[Symbol.iterator]();
      for (let token of iter) await token.stopWorkerPool();
      _WorkerPoolToken.workerPoolStarted = !1, _WorkerPoolToken.activeProcessCount = 0;
    }
  };

,__name(_WorkerPoolToken, "WorkerPoolToken"), _WorkerPoolToken.workerPoolStarted = !1, _WorkerPoolToken.activeProcessCount = 0, _WorkerPoolToken.allTokens = [];

,var WorkerPoolToken = _WorkerPoolToken,
  startWorkerPool = WorkerPoolToken.startWorkerPool.bind(WorkerPoolToken);

,var ProjectContextSnippetSchema = Type.Object({
  uri: Type.String(),
  snippet: Type.String(),
  range: Type.Object({
    start: Type.Object({
      line: Type.Number(),
      character: Type.Number()
    }),
    end: Type.Object({
      line: Type.Number(),
      character: Type.Number()
    })
  })
});

,var ProjectContextSkillId = "project-context";