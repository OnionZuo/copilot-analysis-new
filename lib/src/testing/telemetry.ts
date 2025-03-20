var import_http = require("http");

,var _TestPromiseQueue = class _TestPromiseQueue extends PromiseQueue {
  async awaitPromises() {
    await Promise.all(this.promises);
  }
};

,__name(_TestPromiseQueue, "TestPromiseQueue");

,var TestPromiseQueue = _TestPromiseQueue;

,async function withTelemetryCapture(ctx, work) {
  return _withTelemetryCapture(ctx, !0, work);
},__name(withTelemetryCapture, "withTelemetryCapture");

,async function _withTelemetryCapture(ctx, forceTelemetry, work) {
  let authorization,
    messages = [],
    server = (0, XIe.createServer)((req, res) => {
      if (req.method !== "POST") return;
      authorization = req.headers.authorization;
      let body = "";
      req.on("end", () => {
        let items = JSON.parse(body);
        messages.push(...items), res.writeHead(204), res.end();
      }), req.on("data", chunk => {
        body += String(chunk);
      });
    });
  server.unref();
  let port = await new Promise((resolve, reject) => {
    server.on("error", err => reject(err)), server.listen(() => resolve(server.address().port));
  });
  delete process.env.http_proxy, delete process.env.https_proxy;
  let oldUrl = ctx.get(NetworkConfiguration).getTelemetryUrl();
  ctx.get(NetworkConfiguration).setTelemetryUrlForTesting(`http://localhost:${port}/`), await setupTelemetryReporters(ctx, "copilot-test", forceTelemetry);
  let disposable = onCopilotToken(ctx, () => {
    setTimeout(() => {
      ctx.get(NetworkConfiguration).setTelemetryUrlForTesting(`http://localhost:${port}/`), setupTelemetryReporters(ctx, "copilot-test", forceTelemetry);
    }, 0);
  });
  try {
    let queue = new TestPromiseQueue();
    ctx.forceSet(PromiseQueue, queue);
    let result = await work();
    return await queue.awaitPromises(), await ctx.get(TelemetryReporters).deactivate(), await waitForCapturedTelemetryWithRetry(messages), [messages, result, authorization];
  } finally {
    ctx.get(NetworkConfiguration).setTelemetryUrlForTesting(oldUrl), server.close(), disposable.dispose();
  }
},__name(_withTelemetryCapture, "_withTelemetryCapture");

,async function waitForCapturedTelemetryWithRetry(messages) {
  for (let waitTimeMultiplier = 1; waitTimeMultiplier < 3; waitTimeMultiplier++) {
    if (await new Promise(resolve => setTimeout(resolve, waitTimeMultiplier * 50)), messages.length > 0) return;
    console.warn("Retrying to collect telemetry messages #" + waitTimeMultiplier);
  }
},__name(waitForCapturedTelemetryWithRetry, "waitForCapturedTelemetryWithRetry");

,var _FailingTelemetryReporter = class _FailingTelemetryReporter {
  sendTelemetryEvent(eventName, properties, measurements) {
    throw new Error("Telemetry disabled");
  }
  sendTelemetryErrorEvent(eventName, properties, measurements, errorProps) {
    throw new Error("Telemetry disabled");
  }
  dispose() {
    return Promise.resolve();
  }
  hackOptOutListener() {}
};

,__name(_FailingTelemetryReporter, "FailingTelemetryReporter");

,var FailingTelemetryReporter = _FailingTelemetryReporter;