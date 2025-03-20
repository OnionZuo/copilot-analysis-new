var crypto = fn(require("crypto")),
  fs = fn(require("fs")),
  macCa = fn(kze()),
  import_tls = require("tls"),
  windowsCaCerts = fn(Eze());

,var certLogger = new Logger("certificates"),
  _RootCertificateReader = class _RootCertificateReader {};

,__name(_RootCertificateReader, "RootCertificateReader");

,var RootCertificateReader = _RootCertificateReader;

,function getRootCertificateReader(ctx, platform = process.platform) {
  return new CachingRootCertificateReader(ctx, [new NodeTlsRootCertificateReader(), new EnvironmentVariableRootCertificateReader(), createPlatformReader(ctx, platform)]);
},__name(getRootCertificateReader, "getRootCertificateReader");

,function createPlatformReader(ctx, platform) {
  switch (platform) {
    case "linux":
      return new LinuxRootCertificateReader(ctx);
    case "darwin":
      return new MacRootCertificateReader(ctx);
    case "win32":
      return new WindowsRootCertificateReader(ctx);
    default:
      return new UnsupportedPlatformRootCertificateReader();
  }
},__name(createPlatformReader, "createPlatformReader");

,var _ErrorHandlingCertificateReader = class _ErrorHandlingCertificateReader extends RootCertificateReader {
  constructor(ctx, delegate) {
    super();
    this.ctx = ctx;
    this.delegate = delegate;
  }
  async getAllRootCAs() {
    try {
      return await this.delegate.getAllRootCAs();
    } catch (ex) {
      return certLogger.warn(this.ctx, "Failed to read root certificates:", ex), [];
    }
  }
};

,__name(_ErrorHandlingCertificateReader, "ErrorHandlingCertificateReader");

,var ErrorHandlingCertificateReader = _ErrorHandlingCertificateReader,
  _CachingRootCertificateReader = class _CachingRootCertificateReader extends RootCertificateReader {
    constructor(ctx, delegates) {
      super();
      this.ctx = ctx;
      this.delegates = delegates.map(d => new ErrorHandlingCertificateReader(ctx, d));
    }
    async getAllRootCAs() {
      return this.certificates || (this.certificates = this.removeExpiredCertificates((await Promise.all(this.delegates.map(d => d.getAllRootCAs()))).flat())), this.certificates;
    }
    removeExpiredCertificates(certs) {
      let now = Date.now(),
        filtered = certs.filter(cert => {
          try {
            let parsedCert = new Bze.X509Certificate(cert),
              parsedDate = Date.parse(parsedCert.validTo);
            return isNaN(parsedDate) || parsedDate > now;
          } catch (err) {
            return certLogger.warn(this.ctx, "Failed to parse certificate", cert, err), !1;
          }
        });
      return certs.length !== filtered.length && certLogger.info(this.ctx, `Removed ${certs.length - filtered.length} expired certificates`), filtered;
    }
  };

,__name(_CachingRootCertificateReader, "CachingRootCertificateReader");

,var CachingRootCertificateReader = _CachingRootCertificateReader,
  _NodeTlsRootCertificateReader = class _NodeTlsRootCertificateReader extends RootCertificateReader {
    async getAllRootCAs() {
      return Qze.rootCertificates;
    }
  };

,__name(_NodeTlsRootCertificateReader, "NodeTlsRootCertificateReader");

,var NodeTlsRootCertificateReader = _NodeTlsRootCertificateReader,
  _EnvironmentVariableRootCertificateReader = class _EnvironmentVariableRootCertificateReader extends RootCertificateReader {
    async getAllRootCAs() {
      let extraCertsFile = process.env.NODE_EXTRA_CA_CERTS;
      return extraCertsFile ? await readCertsFromFile(extraCertsFile) : [];
    }
  };

,__name(_EnvironmentVariableRootCertificateReader, "EnvironmentVariableRootCertificateReader");

,var EnvironmentVariableRootCertificateReader = _EnvironmentVariableRootCertificateReader,
  _LinuxRootCertificateReader = class _LinuxRootCertificateReader extends RootCertificateReader {
    constructor(ctx) {
      super();
      this.ctx = ctx;
    }
    async getAllRootCAs() {
      let rootCAs = [];
      for (let certPath of ["/etc/ssl/certs/ca-certificates.crt", "/etc/ssl/certs/ca-bundle.crt"]) {
        let certs = await readCertsFromFile(certPath);
        certLogger.debug(this.ctx, `Read ${certs.length} certificates from ${certPath}`), rootCAs = rootCAs.concat(certs);
      }
      return rootCAs;
    }
  };

,__name(_LinuxRootCertificateReader, "LinuxRootCertificateReader");

,var LinuxRootCertificateReader = _LinuxRootCertificateReader,
  _MacRootCertificateReader = class _MacRootCertificateReader extends RootCertificateReader {
    constructor(ctx) {
      super();
      this.ctx = ctx;
    }
    async getAllRootCAs() {
      let certs = Ize.get();
      return certLogger.debug(this.ctx, `Read ${certs.length} certificates from Mac keychain`), certs;
    }
  };

,__name(_MacRootCertificateReader, "MacRootCertificateReader");

,var MacRootCertificateReader = _MacRootCertificateReader,
  _WindowsRootCertificateReader = class _WindowsRootCertificateReader extends RootCertificateReader {
    constructor(ctx) {
      super();
      this.ctx = ctx;
    }
    async getAllRootCAs() {
      let certs = Dze.all();
      return certLogger.debug(this.ctx, `Read ${certs.length} certificates from Windows store`), certs;
    }
  };

,__name(_WindowsRootCertificateReader, "WindowsRootCertificateReader");

,var WindowsRootCertificateReader = _WindowsRootCertificateReader,
  _UnsupportedPlatformRootCertificateReader = class _UnsupportedPlatformRootCertificateReader extends RootCertificateReader {
    async getAllRootCAs() {
      throw new Error("No certificate reader available for unsupported platform");
    }
  };

,__name(_UnsupportedPlatformRootCertificateReader, "UnsupportedPlatformRootCertificateReader");

,var UnsupportedPlatformRootCertificateReader = _UnsupportedPlatformRootCertificateReader;

,async function readCertsFromFile(certFilePath) {
  try {
    let nonEmptyCerts = (await vze.promises.readFile(certFilePath, {
        encoding: "utf8"
      })).split(/(?=-----BEGIN CERTIFICATE-----)/g).filter(pem => pem.length > 0),
      uniqueCerts = new Set(nonEmptyCerts);
    return Array.from(uniqueCerts);
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return [];
    throw err;
  }
},__name(readCertsFromFile, "readCertsFromFile");