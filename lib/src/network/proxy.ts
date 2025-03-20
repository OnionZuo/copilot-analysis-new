var import_net = require("net");

,function getProxyFromEnvironment(env) {
  return env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
},__name(getProxyFromEnvironment, "getProxyFromEnvironment");

,var HttpSettings = Type.Object({
  proxy: Type.Optional(Type.String()),
  proxyStrictSSL: Type.Optional(Type.Boolean()),
  proxyAuthorization: Type.Optional(Type.String()),
  proxyKerberosServicePrincipal: Type.Optional(Type.String())
});

,function proxySettingFromUrl(proxyUrl) {
  (0, stt.isIPv6)(proxyUrl) ? proxyUrl = "https://[" + proxyUrl + "]" : /:\/\//.test(proxyUrl) || (proxyUrl = `https://${proxyUrl}`);
  let {
    hostname: hostname,
    port: port,
    username: username,
    password: password
  } = new URL(proxyUrl);
  return {
    host: hostname,
    port: parsePort(port),
    proxyAuth: getAuth(username, password)
  };
},__name(proxySettingFromUrl, "proxySettingFromUrl");

,function parsePort(port) {
  if (!port) return 80;
  let portNumber = Number(port);
  if (isNaN(portNumber)) throw new TypeError("Invalid proxy port");
  return portNumber;
},__name(parsePort, "parsePort");

,function getAuth(username, password) {
  return !username || !password ? "" : `${decodeURIComponent(username)}:${decodeURIComponent(password)}`;
},__name(getAuth, "getAuth");