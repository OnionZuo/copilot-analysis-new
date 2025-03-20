var util = fn(require("util")),
  import_util = require("util");

,var _rejectUnauthorized,
  _Fetcher = class _Fetcher {
    constructor() {
      __privateAdd(this, _rejectUnauthorized);
    }
    set rejectUnauthorized(value) {
      __privateSet(this, _rejectUnauthorized, value);
    }
    get rejectUnauthorized() {
      return __privateGet(this, _rejectUnauthorized);
    }
  };

,_rejectUnauthorized = new WeakMap(), __name(_Fetcher, "Fetcher");

,var Fetcher = _Fetcher,
  _HttpTimeoutError = class _HttpTimeoutError extends Error {
    constructor(message, cause) {
      super(message);
      this.cause = cause;
      this.name = "HttpTimeoutError";
    }
  };

,__name(_HttpTimeoutError, "HttpTimeoutError");

,var HttpTimeoutError = _HttpTimeoutError;

,function isAbortError(e) {
  return !e || typeof e != "object" ? !1 : e instanceof HttpTimeoutError || e instanceof AbortError || "name" in e && e.name === "AbortError" || e instanceof FetchError && e.code === "ABORT_ERR";
},__name(isAbortError, "isAbortError");

,var _JsonParseError = class _JsonParseError extends SyntaxError {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "JsonParseError";
  }
};

,__name(_JsonParseError, "JsonParseError");

,var JsonParseError = _JsonParseError,
  _FetchResponseError = class _FetchResponseError extends Error {
    constructor(response) {
      super(`HTTP ${response.status} ${response.statusText}`), this.name = "FetchResponseError", this.code = `HTTP${response.status}`;
    }
  };

,__name(_FetchResponseError, "FetchResponseError");

,var FetchResponseError = _FetchResponseError,
  networkErrorCodes = new Set(["ECONNABORTED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ENOTCONN", "ENOTFOUND", "ETIMEDOUT", "ERR_HTTP2_STREAM_ERROR", "ERR_SSL_BAD_DECRYPT", "ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC", "ERR_SSL_INVALID_LIBRARY_(0)", "ERR_SSL_SSLV3_ALERT_BAD_RECORD_MAC", "ERR_SSL_WRONG_VERSION_NUMBER", "ERR_STREAM_PREMATURE_CLOSE", "ERR_TLS_CERT_ALTNAME_INVALID"]);

,function isNetworkError(e, checkCause = !0) {
  var _a, _b;
  return e instanceof Error ? checkCause && "cause" in e && isNetworkError(e.cause, !1) ? !0 : e instanceof FetchError || e.name === "EditorFetcherError" || e.name === "FetchError" || e instanceof JsonParseError || e instanceof FetchResponseError || ((_a = e == null ? void 0 : e.message) == null ? void 0 : _a.startsWith("net::")) || networkErrorCodes.has((_b = e.code) != null ? _b : "") : !1;
},__name(isNetworkError, "isNetworkError");

,var _Response = class _Response {
  constructor(status, statusText, headers, getText, getBody) {
    this.status = status;
    this.statusText = statusText;
    this.headers = headers;
    this.getText = getText;
    this.getBody = getBody;
    this.ok = this.status >= 200 && this.status < 300;
    this.clientError = this.status >= 400 && this.status < 500;
  }
  async text() {
    return this.getText();
  }
  async json() {
    let text = await this.text(),
      contentType = this.headers.get("content-type");
    if (!contentType || !contentType.includes("json")) throw new JsonParseError(`Response content-type is ${contentType != null ? contentType : "missing"} (status=${this.status})`, `ContentType=${contentType}`);
    try {
      return JSON.parse(text);
    } catch (e) {
      if (e instanceof SyntaxError) {
        let posMatch = e.message.match(/^(.*?) in JSON at position (\d+)(?: \(line \d+ column \d+\))?$/);
        if (posMatch && parseInt(posMatch[2], 10) == text.length || e.message === "Unexpected end of JSON input") {
          let actualLength = new gEe.TextEncoder().encode(text).length,
            headerLength = this.headers.get("content-length");
          throw headerLength === null ? new JsonParseError(`Response body truncated: actualLength=${actualLength}`, "Truncated") : new JsonParseError(`Response body truncated: actualLength=${actualLength}, headerLength=${headerLength}`, "Truncated");
        }
      }
      throw e;
    }
  }
  body() {
    return this.getBody();
  }
};

,__name(_Response, "Response");

,var Response = _Response;

,function postRequest(ctx, url, secretKey, intent, requestId, body, cancelToken, extraHeaders, timeout) {
  let headers = {
    ...extraHeaders,
    Authorization: dEe.format("Bearer %s", secretKey),
    "X-Request-Id": requestId,
    "Openai-Organization": "github-copilot",
    "VScode-SessionId": ctx.get(EditorSession).sessionId,
    "VScode-MachineId": ctx.get(EditorSession).machineId,
    ...editorVersionHeaders(ctx)
  };
  ctx.get(HeaderContributors).contributeHeaders(url, headers), intent && (headers["OpenAI-Intent"] = intent);
  let request = {
      method: "POST",
      headers: headers,
      json: body,
      timeout: timeout
    },
    fetcher = ctx.get(Fetcher);
  if (cancelToken) {
    let abort = fetcher.makeAbortController();
    cancelToken.onCancellationRequested(() => {
      telemetry(ctx, "networking.cancelRequest", TelemetryData.createAndMarkAsIssued({
        headerRequestId: requestId
      })), abort.abort();
    }), request.signal = abort.signal;
  }
  return fetcher.fetch(url, request).catch(reason => {
    if (isInterruptedNetworkError(reason)) return telemetry(ctx, "networking.disconnectAll"), fetcher.disconnectAll().then(() => fetcher.fetch(url, request));
    throw reason;
  });
},__name(postRequest, "postRequest");

,function isInterruptedNetworkError(error) {
  return error instanceof Error ? error.message == "ERR_HTTP2_GOAWAY_SESSION" ? !0 : "code" in error ? error.code == "ECONNRESET" || error.code == "ETIMEDOUT" || error.code == "ERR_HTTP2_INVALID_SESSION" : !1 : !1;
},__name(isInterruptedNetworkError, "isInterruptedNetworkError");