var _ProviderTimeoutError = class _ProviderTimeoutError extends Error {
  constructor(message) {
    super(message), this.name = "ProviderTimeoutError";
  }
};

,__name(_ProviderTimeoutError, "ProviderTimeoutError");

,var ProviderTimeoutError = _ProviderTimeoutError,
  _SnippetProvider = class _SnippetProvider {
    constructor(workerProxy) {
      this.api = workerProxy;
    }
    getSnippets(context, signal) {
      return new Promise((resolve, reject) => {
        signal.aborted && reject(new ProviderError(this.type, new ProviderTimeoutError("provider aborted"))), signal.addEventListener("abort", () => {
          reject(new ProviderError(this.type, new ProviderTimeoutError(`max runtime exceeded: ${TIMEOUT_MS} ms`)));
        }, {
          once: !0
        });
        let startTime = performance.now();
        this.buildSnippets(context).then(snippets => {
          let endTime = performance.now();
          resolve({
            snippets: snippets,
            providerType: this.type,
            runtime: endTime - startTime
          });
        }).catch(error => {
          reject(new ProviderError(this.type, error));
        });
      });
    }
  };

,__name(_SnippetProvider, "SnippetProvider");

,var SnippetProvider = _SnippetProvider;