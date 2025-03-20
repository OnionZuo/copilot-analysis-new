var authLogger = new Logger("auth"),
  REFRESH_BUFFER_SECONDS = 60;

,function nowSeconds() {
  return Math.floor(Date.now() / 1e3);
},__name(nowSeconds, "nowSeconds");

,async function authFromGitHubToken(ctx, githubToken) {
  let resultTelemetryData = TelemetryData.createAndMarkAsIssued({}, {});
  telemetry(ctx, "auth.new_login");
  let response = await fetchCopilotToken(ctx, githubToken),
    tokenEnvelope = await response.json(),
    notification = tokenEnvelope.user_notification;
  if (notifyUser(ctx, notification, githubToken), response.clientError && !response.headers.get("x-github-request-id") && authLogger.error(ctx, `HTTP ${response.status} response does not appear to originate from GitHub. Is a proxy or firewall intercepting this request? https://gh.io/copilot-firewall`), response.status === 401) {
    let message = "Failed to get copilot token due to 401 status. Please sign out and try again.";
    return authLogger.info(ctx, message), telemetryError(ctx, "auth.unknown_401", resultTelemetryData), {
      kind: "failure",
      reason: "HTTP401",
      message: message,
      envelope: tokenEnvelope
    };
  }
  if (!response.ok || !tokenEnvelope.token) {
    authLogger.info(ctx, `Invalid copilot token: missing token: ${response.status} ${response.statusText}`), telemetryError(ctx, "auth.invalid_token", resultTelemetryData.extendedBy({
      status: response.status.toString(),
      status_text: response.statusText
    }));
    let error_details = tokenEnvelope.error_details;
    return (error_details == null ? void 0 : error_details.notification_id) !== "not_signed_up" && notifyUser(ctx, error_details, githubToken), {
      kind: "failure",
      reason: "NotAuthorized",
      message: "User not authorized",
      envelope: tokenEnvelope,
      ...error_details
    };
  }
  let expires_at = tokenEnvelope.expires_at;
  tokenEnvelope.expires_at = nowSeconds() + tokenEnvelope.refresh_in + REFRESH_BUFFER_SECONDS;
  let copilotToken = new CopilotToken(tokenEnvelope);
  return emitCopilotToken(ctx, copilotToken), telemetry(ctx, "auth.new_token", resultTelemetryData.extendedBy({}, {
    adjusted_expires_at: tokenEnvelope.expires_at,
    expires_at: expires_at,
    current_time: nowSeconds()
  })), {
    kind: "success",
    envelope: tokenEnvelope
  };
},__name(authFromGitHubToken, "authFromGitHubToken");

,async function fetchCopilotToken(ctx, githubToken) {
  let copilotTokenUrl = ctx.get(NetworkConfiguration).getTokenUrl(githubToken);
  try {
    return await ctx.get(Fetcher).fetch(copilotTokenUrl, {
      headers: {
        Authorization: `token ${githubToken.token}`,
        ...editorVersionHeaders(ctx)
      },
      timeout: 12e4
    });
  } catch (err) {
    throw ctx.get(UserErrorNotifier).notifyUser(ctx, err), err;
  }
},__name(fetchCopilotToken, "fetchCopilotToken");

,function notifyUser(ctx, notification, githubToken) {
  notification && ctx.get(NotificationSender).showWarningMessageOnlyOnce(notification.notification_id, notification.message, {
    title: notification.title
  }, {
    title: "Dismiss"
  }).then(async r => {
    let showUrl = (r == null ? void 0 : r.title) === notification.title,
      ackNotification = showUrl || (r == null ? void 0 : r.title) === "Dismiss";
    if (showUrl) {
      let editorInfo = ctx.get(EditorAndPluginInfo).getEditorPluginInfo(),
        urlWithContext = notification.url.replace("{EDITOR}", encodeURIComponent(editorInfo.name + "_" + editorInfo.version));
      await ctx.get(UrlOpener).open(urlWithContext);
    }
    notification.notification_id && ackNotification && (await sendNotificationResultToGitHub(ctx, notification.notification_id, githubToken));
  }).catch(error => {
    authLogger.exception(ctx, error, "copilotToken.notification");
  });
},__name(notifyUser, "notifyUser");

,async function sendNotificationResultToGitHub(ctx, notification_id, githubToken) {
  let notificationUrl = ctx.get(NetworkConfiguration).getNotificationUrl(githubToken),
    response = await ctx.get(Fetcher).fetch(notificationUrl, {
      headers: {
        Authorization: `token ${githubToken.token}`,
        ...editorVersionHeaders(ctx)
      },
      method: "POST",
      body: JSON.stringify({
        notification_id: notification_id
      })
    });
  (!response || !response.ok) && authLogger.error(ctx, `Failed to send notification result to GitHub: ${response == null ? void 0 : response.status} ${response == null ? void 0 : response.statusText}`);
},__name(sendNotificationResultToGitHub, "sendNotificationResultToGitHub");

,var _CopilotToken = class _CopilotToken {
  constructor(envelope) {
    this.envelope = envelope;
    this.token = envelope.token, this.organization_list = envelope.organization_list, this.enterprise_list = envelope.enterprise_list, this.tokenMap = this.parseToken(this.token);
  }
  needsRefresh() {
    return (this.envelope.expires_at - REFRESH_BUFFER_SECONDS) * 1e3 < Date.now();
  }
  isExpired() {
    return this.envelope.expires_at * 1e3 < Date.now();
  }
  get hasKnownOrg() {
    return findKnownOrg(this.organization_list || []) !== void 0;
  }
  parseToken(token) {
    let result = new Map(),
      fields = (token != null ? token : "").split(":")[0].split(";");
    for (let field of fields) {
      let [key, value] = field.split("=");
      result.set(key, value);
    }
    return result;
  }
  getTokenValue(key) {
    return this.tokenMap.get(key);
  }
};

,__name(_CopilotToken, "CopilotToken");

,var CopilotToken = _CopilotToken;