async function fetchCapiUrl(ctx, path) {
  let token = await ctx.get(CopilotTokenManager).getToken(),
    url = ctx.get(NetworkConfiguration).getCAPIUrl(ctx, path),
    headers = {
      Authorization: `Bearer ${token.token}`,
      ...editorVersionHeaders(ctx)
    };
  return ctx.get(HeaderContributors).contributeHeaders(url, headers), await ctx.get(Fetcher).fetch(new URL(url).href, {
    method: "GET",
    headers: headers
  });
},__name(fetchCapiUrl, "fetchCapiUrl");