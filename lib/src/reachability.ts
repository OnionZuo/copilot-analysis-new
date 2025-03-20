function urlsToCheck(ctx) {
  let deviceUrl = ctx.get(NetworkConfiguration).getLoginReachabilityUrl(),
    apiUrl = ctx.get(NetworkConfiguration).getAPIUrl(),
    proxyUrl = ctx.get(NetworkConfiguration).getCompletionsUrl(ctx, "_ping"),
    capiUrl = ctx.get(NetworkConfiguration).getCAPIUrl(ctx, "_ping"),
    telemetryUrl = ctx.get(NetworkConfiguration).getTelemetryUrl("_ping");
  function label(url) {
    return new URL(url).host;
  }
  return __name(label, "label"), [{
    label: label(deviceUrl),
    url: deviceUrl
  }, {
    label: label(apiUrl),
    url: apiUrl
  }, {
    label: label(proxyUrl),
    url: proxyUrl
  }, {
    label: label(capiUrl),
    url: capiUrl
  }, {
    label: label(telemetryUrl),
    url: telemetryUrl
  }];
},__name(urlsToCheck, "urlsToCheck");

,async function checkReachability(ctx) {
  let reachabilityPromises = urlsToCheck(ctx).map(async ({
    label: label,
    url: url
  }) => {
    let {
      message: message,
      status: status
    } = await determineReachability(ctx, url);
    return {
      label: label,
      url: url,
      message: message,
      status: status
    };
  });
  return await Promise.all(reachabilityPromises);
},__name(checkReachability, "checkReachability");

,async function determineReachability(ctx, url) {
  try {
    let response = await ctx.get(Fetcher).fetch(url, {}),
      status = response.status >= 200 && response.status < 400 ? "reachable" : "unreachable";
    return {
      message: `HTTP ${response.status}` + (response.statusText ? ` - ${response.statusText}` : ""),
      status: status
    };
  } catch (err) {
    return {
      message: String(err),
      status: "unreachable"
    };
  }
},__name(determineReachability, "determineReachability");