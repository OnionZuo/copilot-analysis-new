var _TestCertificateReader = class _TestCertificateReader extends RootCertificateReader {
  constructor(certificates) {
    super();
    this.certificates = certificates;
  }
  async getAllRootCAs() {
    return this.certificates;
  }
};

,__name(_TestCertificateReader, "TestCertificateReader");

,var TestCertificateReader = _TestCertificateReader,
  createTestCertificateReader = __name(certificates => new TestCertificateReader(certificates), "createTestCertificateReader");

,var _FakeFetcher = class _FakeFetcher extends Fetcher {
  constructor() {
    super(...arguments);
    this.name = "FakeFetcher";
  }
  disconnectAll() {
    throw new Error("Method not implemented.");
  }
  makeAbortController() {
    return new FakeAbortController();
  }
};

,__name(_FakeFetcher, "FakeFetcher");

,var FakeFetcher = _FakeFetcher;

,var _NoFetchFetcher = class _NoFetchFetcher extends FakeFetcher {
  fetch(url, options) {
    throw new Error("NoFetchFetcher does not support fetching");
  }
};

,__name(_NoFetchFetcher, "NoFetchFetcher");

,var NoFetchFetcher = _NoFetchFetcher;

,var _FakeAbortController = class _FakeAbortController {
  constructor() {
    this.signal = {
      aborted: !1,
      addEventListener: __name(() => {}, "addEventListener"),
      removeEventListener: __name(() => {}, "removeEventListener")
    };
  }
  abort() {
    this.signal.aborted = !0;
  }
};

,__name(_FakeAbortController, "FakeAbortController");

,var FakeAbortController = _FakeAbortController;