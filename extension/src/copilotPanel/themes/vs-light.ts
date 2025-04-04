var vsLight = {
  $schema: "vscode://schemas/color-theme",
  type: "light",
  colors: {
    "actionBar.toggledBackground": "#dddddd",
    "activityBarBadge.background": "#007acc",
    "checkbox.border": "#919191",
    "editor.background": "#ffffff",
    "editor.foreground": "#000000",
    "editor.inactiveSelectionBackground": "#e5ebf1",
    "editor.selectionHighlightBackground": "#add6ff80",
    "editorIndentGuide.activeBackground1": "#939393",
    "editorIndentGuide.background1": "#d3d3d3",
    "editorSuggestWidget.background": "#f3f3f3",
    "input.placeholderForeground": "#767676",
    "list.activeSelectionIconForeground": "#ffffff",
    "list.focusAndSelectionOutline": "#90c2f9",
    "list.hoverBackground": "#e8e8e8",
    "menu.border": "#d4d4d4",
    "notebook.cellBorderColor": "#e8e8e8",
    "notebook.selectedCellBackground": "#c8ddf150",
    "ports.iconRunningProcessForeground": "#369432",
    "searchEditor.textInputBorder": "#cecece",
    "settings.numberInputBorder": "#cecece",
    "settings.textInputBorder": "#cecece",
    "sideBarSectionHeader.background": "#00000000",
    "sideBarSectionHeader.border": "#61616130",
    "sideBarTitle.foreground": "#6f6f6f",
    "statusBarItem.errorBackground": "#c72e0f",
    "statusBarItem.remoteBackground": "#16825d",
    "statusBarItem.remoteForeground": "#ffffff",
    "tab.lastPinnedBorder": "#61616130",
    "terminal.inactiveSelectionBackground": "#e5ebf1",
    "widget.border": "#d4d4d4"
  },
  tokenColors: [{
    scope: ["meta.embedded", "source.groovy.embedded", "string meta.image.inline.markdown", "variable.legacy.builtin.python"],
    settings: {
      foreground: "#000000"
    }
  }, {
    scope: "emphasis",
    settings: {
      fontStyle: "italic"
    }
  }, {
    scope: "strong",
    settings: {
      fontStyle: "bold"
    }
  }, {
    scope: "meta.diff.header",
    settings: {
      foreground: "#000080"
    }
  }, {
    scope: "comment",
    settings: {
      foreground: "#008000"
    }
  }, {
    scope: "constant.language",
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: ["constant.numeric", "variable.other.enummember", "keyword.operator.plus.exponent", "keyword.operator.minus.exponent"],
    settings: {
      foreground: "#098658"
    }
  }, {
    scope: "constant.regexp",
    settings: {
      foreground: "#811F3F"
    }
  }, {
    scope: "entity.name.tag",
    settings: {
      foreground: "#800000"
    }
  }, {
    scope: "entity.name.selector",
    settings: {
      foreground: "#800000"
    }
  }, {
    scope: "entity.other.attribute-name",
    settings: {
      foreground: "#E50000"
    }
  }, {
    scope: ["entity.other.attribute-name.class.css", "entity.other.attribute-name.class.mixin.css", "entity.other.attribute-name.id.css", "entity.other.attribute-name.parent-selector.css", "entity.other.attribute-name.pseudo-class.css", "entity.other.attribute-name.pseudo-element.css", "source.css.less entity.other.attribute-name.id", "entity.other.attribute-name.scss"],
    settings: {
      foreground: "#800000"
    }
  }, {
    scope: "invalid",
    settings: {
      foreground: "#CD3131"
    }
  }, {
    scope: "markup.underline",
    settings: {
      fontStyle: "underline"
    }
  }, {
    scope: "markup.bold",
    settings: {
      foreground: "#000080",
      fontStyle: "bold"
    }
  }, {
    scope: "markup.heading",
    settings: {
      foreground: "#800000",
      fontStyle: "bold"
    }
  }, {
    scope: "markup.italic",
    settings: {
      fontStyle: "italic"
    }
  }, {
    scope: "markup.strikethrough",
    settings: {
      fontStyle: "strikethrough"
    }
  }, {
    scope: "markup.inserted",
    settings: {
      foreground: "#098658"
    }
  }, {
    scope: "markup.deleted",
    settings: {
      foreground: "#A31515"
    }
  }, {
    scope: "markup.changed",
    settings: {
      foreground: "#0451A5"
    }
  }, {
    scope: ["punctuation.definition.quote.begin.markdown", "punctuation.definition.list.begin.markdown"],
    settings: {
      foreground: "#0451A5"
    }
  }, {
    scope: "markup.inline.raw",
    settings: {
      foreground: "#800000"
    }
  }, {
    scope: "punctuation.definition.tag",
    settings: {
      foreground: "#800000"
    }
  }, {
    scope: ["meta.preprocessor", "entity.name.function.preprocessor"],
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "meta.preprocessor.string",
    settings: {
      foreground: "#A31515"
    }
  }, {
    scope: "meta.preprocessor.numeric",
    settings: {
      foreground: "#098658"
    }
  }, {
    scope: "meta.structure.dictionary.key.python",
    settings: {
      foreground: "#0451A5"
    }
  }, {
    scope: "storage",
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "storage.type",
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: ["storage.modifier", "keyword.operator.noexcept"],
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: ["string", "meta.embedded.assembly"],
    settings: {
      foreground: "#A31515"
    }
  }, {
    scope: ["string.comment.buffered.block.pug", "string.quoted.pug", "string.interpolated.pug", "string.unquoted.plain.in.yaml", "string.unquoted.plain.out.yaml", "string.unquoted.block.yaml", "string.quoted.single.yaml", "string.quoted.double.xml", "string.quoted.single.xml", "string.unquoted.cdata.xml", "string.quoted.double.html", "string.quoted.single.html", "string.unquoted.html", "string.quoted.single.handlebars", "string.quoted.double.handlebars"],
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "string.regexp",
    settings: {
      foreground: "#811F3F"
    }
  }, {
    scope: ["punctuation.definition.template-expression.begin", "punctuation.definition.template-expression.end", "punctuation.section.embedded"],
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: ["meta.template.expression"],
    settings: {
      foreground: "#000000"
    }
  }, {
    scope: ["support.constant.property-value", "support.constant.font-name", "support.constant.media-type", "support.constant.media", "constant.other.color.rgb-value", "constant.other.rgb-value", "support.constant.color"],
    settings: {
      foreground: "#0451A5"
    }
  }, {
    scope: ["support.type.vendored.property-name", "support.type.property-name", "variable.css", "variable.scss", "variable.other.less", "source.coffee.embedded"],
    settings: {
      foreground: "#E50000"
    }
  }, {
    scope: ["support.type.property-name.json"],
    settings: {
      foreground: "#0451A5"
    }
  }, {
    scope: "keyword",
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "keyword.control",
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "keyword.operator",
    settings: {
      foreground: "#000000"
    }
  }, {
    scope: ["keyword.operator.new", "keyword.operator.expression", "keyword.operator.cast", "keyword.operator.sizeof", "keyword.operator.alignof", "keyword.operator.typeid", "keyword.operator.alignas", "keyword.operator.instanceof", "keyword.operator.logical.python", "keyword.operator.wordlike"],
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "keyword.other.unit",
    settings: {
      foreground: "#098658"
    }
  }, {
    scope: ["punctuation.section.embedded.begin.php", "punctuation.section.embedded.end.php"],
    settings: {
      foreground: "#800000"
    }
  }, {
    scope: "support.function.git-rebase",
    settings: {
      foreground: "#0451A5"
    }
  }, {
    scope: "constant.sha.git-rebase",
    settings: {
      foreground: "#098658"
    }
  }, {
    scope: ["storage.modifier.import.java", "variable.language.wildcard.java", "storage.modifier.package.java"],
    settings: {
      foreground: "#000000"
    }
  }, {
    scope: "variable.language",
    settings: {
      foreground: "#0000FF"
    }
  }, {
    scope: "ref.matchtext",
    settings: {
      foreground: "#000000"
    }
  }, {
    scope: "token.info-token",
    settings: {
      foreground: "#316BCD"
    }
  }, {
    scope: "token.warn-token",
    settings: {
      foreground: "#CD9731"
    }
  }, {
    scope: "token.error-token",
    settings: {
      foreground: "#CD3131"
    }
  }, {
    scope: "token.debug-token",
    settings: {
      foreground: "#800080"
    }
  }]
};

,var _Highlighter = class _Highlighter {
  constructor(languageId, highlighter) {
    this.languageId = languageId;
    this.highlighter = highlighter;
  }
  static async create(languageId = (_a => (n = Mf.window.activeTextEditor) == null ? void 0 : _a.document.languageId)()) {
    if (!languageId) return new _Highlighter(void 0, void 0);
    let highlighter = await getSingletonHighlighterCore({
      langs: Object.values(bundledLanguages),
      loadWasm: getWasmInstance
    });
    if (!bundledLanguages[languageId]) {
      let additionalLang = vscLanguageMap[languageId];
      additionalLang && (await highlighter.loadLanguage(additionalLang));
    }
    return new _Highlighter(languageId, highlighter);
  }
  createSnippet(text) {
    return !this.highlighter || !this.languageId || !this.languageSupported() ? `<pre>${text}</pre>` : this.highlighter.codeToHtml(text, {
      lang: this.languageId,
      theme: getCurrentTheme()
    });
  }
  languageSupported() {
    var _a;
    return this.languageId ? !!((_a = this.highlighter) != null && _a.getLoadedLanguages().includes(this.languageId)) : !1;
  }
};

,__name(_Highlighter, "Highlighter");

,var Highlighter = _Highlighter;

,function getCurrentTheme() {
  let workbenchConfig = Mf.workspace.getConfiguration("workbench");
  if (workbenchConfig) {
    let vsCodeTheme = workbenchConfig.get("colorTheme");
    if (vsCodeTheme && isSupportedTheme(vsCodeTheme)) return vscThemeMap[vsCodeTheme];
    let themeType = Mf.window.activeColorTheme;
    return vscDefaultMap[themeType.kind];
  } else return vscThemeMap["Default Dark Modern"];
},__name(getCurrentTheme, "getCurrentTheme");

,var vscDefaultMap = {
    [Mf.ColorThemeKind.Dark]: darkModern,
    [Mf.ColorThemeKind.Light]: lightModern,
    [Mf.ColorThemeKind.HighContrast]: darkHC,
    [Mf.ColorThemeKind.HighContrastLight]: lightHC
  },
  vscThemeMap = {
    Abyss: abyss,
    "Dark High Contrast": darkHC,
    "Light High Constrast": lightHC,
    "Default Dark Modern": darkModern,
    "Kimbie Dark": kimbieDark,
    "Default Light Modern": lightModern,
    "Monokai Dimmed": monokaiDim,
    "Quiet Light": quietLight,
    Red: red,
    "Tomorrow Night Blue": tomorrowNightBlue,
    "Visual Studio Dark": vsDark,
    "Visual Studio Light": vsLight,
    "Default Dark+": darkPlus,
    "Default Light+": lightPlus,
    Monokai: monokai,
    "Solarized Dark": solarizedDark,
    "Solarized Light": solarizedLight
  };

,function isSupportedTheme(theme) {
  return theme in vscThemeMap;
},__name(isSupportedTheme, "isSupportedTheme");

,var vscLanguageMap = {
  "cuda-cpp": cudaCpp,
  javascriptreact: javascriptreact,
  markdown_latex_combined: markdownLatexCombined,
  "markdown-math": markdownMath,
  restructuredtext: restructuredtext,
  "search-result": searchResult,
  typescriptreact: typescriptreact
};

,function pluralize(count, noun, suffix = "s") {
  return `${count} ${noun}${count !== 1 ? suffix : ""}`;
},__name(pluralize, "pluralize");

,var _items,
  _percentage,
  _highlighter,
  _documentUri,
  _cts,
  _SuggestionsPanel_instances,
  render_fn,
  _SuggestionsPanel = class _SuggestionsPanel {
    constructor(ctx, webviewpPanel, document, suggestionsPanelManager) {
      this.ctx = ctx;
      this.webviewpPanel = webviewpPanel;
      this.suggestionsPanelManager = suggestionsPanelManager;
      __privateAdd(this, _SuggestionsPanel_instances);
      this._disposables = [];
      __privateAdd(this, _items, []);
      __privateAdd(this, _percentage, 0);
      __privateAdd(this, _highlighter);
      this._isDisposed = !1;
      __privateAdd(this, _documentUri);
      __privateAdd(this, _cts, new Kd.CancellationTokenSource());
      this.render = debounce(10, () => __privateMethod(this, _SuggestionsPanel_instances, render_fn).call(this));
      webviewpPanel.onDidDispose(() => this._dispose(), null, this._disposables), webviewpPanel.webview.html = this._getWebviewContent(), __privateSet(this, _documentUri, document.uri), __privateSet(this, _highlighter, Highlighter.create(document.languageId)), Kd.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration("workbench.colorTheme")) return this.render();
      }), webviewpPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case "acceptSolution":
            return this.acceptSolution(__privateGet(this, _items)[message.solutionIndex]);
          case "focusSolution":
            this._focusedSolution = __privateGet(this, _items)[message.solutionIndex];
            return;
        }
      }, void 0), webviewpPanel.onDidChangeViewState(e => {
        var _a;
        (_a = e.webviewPanel) != null && _a.visible && (this.suggestionsPanelManager.activeWebviewPanel = this);
      });
    }
    get cancellationToken() {
      return __privateGet(this, _cts).token;
    }
    _buildExtensionUri(...path) {
      let extensionPath = Kd.Uri.joinPath(this.ctx.get(Extension).context.extensionUri, ...path);
      return this.webviewpPanel.webview.asWebviewUri(extensionPath);
    }
    _getWebviewContent() {
      let nonce = getNonce(),
        scriptUri = this._buildExtensionUri("dist", "suggestionsPanelWebview.js"),
        codiconsUri = this._buildExtensionUri("dist", "node_modules", "@vscode", "codicons", "dist", "codicon.css");
      return `
        <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta
                        http-equiv="Content-Security-Policy"
                        content="default-src 'none'; font-src ${this.webviewpPanel.webview.cspSource}; style-src 'unsafe-inline' ${this.webviewpPanel.webview.cspSource}; script-src 'nonce-${nonce}';"
                    />
                    <title>GitHub Copilot Suggestions</title>
                    <link href="${codiconsUri.toString()}" rel="stylesheet" />
                    <style>
                        .solutionHeading {
                            margin-top: 40px;
                        }
                        pre:focus-visible {
                            border: 1px solid var(--vscode-focusBorder);
                            outline: none;
                        }
                        pre {
                            margin-bottom: 6px;
                            display: block;
                            padding: 9.5px;
                            line-height: 1.42857143;
                            word-break: break-all;
                            word-wrap: break-word;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            border: 1px solid var(--vscode-notebook-cellBorderColor);
                            white-space: pre-wrap;
                            font-size: var(--vscode-editor-font-size);
                        }
                        pre.shiki {
                            padding: 0.5em 0.7em;
                            margin-top: 1em;
                            margin-bottom: 1em;
                            border-radius: 4px;
                        }
                        code {
                            background-color: transparent;
                        }
                    </style>
                </head>
                <body>
                    <h2>GitHub Copilot Suggestions</h2>
                    <div id="loadingContainer" aria-live="assertive" aria-atomic="true">
                        <label for="progress-bar">Loading suggestions:</label>
                        <progress id="progress-bar" max="100" value="0"></progress>
                    </div>
                    <div id="solutionsContainer" aria-busy="true" aria-describedby="progress-bar"></div>
                    <script nonce="${nonce}" type="module" src="${scriptUri.toString()}"></script>
                </body>
            </html>
        `;
    }
    onWorkDone({
      percentage: percentage
    }) {
      __privateSet(this, _percentage, percentage), this.render();
    }
    onItem(item) {
      __privateGet(this, _items).push(item), this.render();
    }
    onFinished() {
      __privateSet(this, _percentage, 100), this.render();
    }
    async acceptSolution(solution) {
      if (this._isDisposed === !1 && solution != null && solution.range) {
        let edit = new Kd.WorkspaceEdit();
        edit.replace(__privateGet(this, _documentUri), solution.range, solution.insertText), await Kd.workspace.applyEdit(edit), __privateGet(this, _cts).cancel(), await Kd.commands.executeCommand("workbench.action.closeActiveEditor"), await solution.postInsertionCallback();
      }
    }
    async acceptFocusedSolution() {
      let solution = this._focusedSolution;
      if (solution) return this.acceptSolution(solution);
    }
    postMessage(message) {
      if (this._isDisposed === !1) return this.webviewpPanel.webview.postMessage(message);
    }
    _dispose() {
      for (this._isDisposed = !0, this.suggestionsPanelManager.decrementPanelCount(); this._disposables.length;) {
        let disposable = this._disposables.pop();
        disposable && disposable.dispose();
      }
    }
  };

,_items = new WeakMap(), _percentage = new WeakMap(), _highlighter = new WeakMap(), _documentUri = new WeakMap(), _cts = new WeakMap(), _SuggestionsPanel_instances = new WeakSet(), render_fn = __name(async function () {
  let highlighter = await __privateGet(this, _highlighter),
    content = __privateGet(this, _items).map(item => {
      var _a, _b;
      let firstCitation = (_b = (_a = item.copilotAnnotations) == null ? void 0 : _a.ip_code_citations) == null ? void 0 : _b[0],
        details = firstCitation == null ? void 0 : firstCitation.details.citations,
        renderedCitatation;
      if (details && details.length > 0) {
        let licensesSet = new Set(details.map(d => d.license));
        licensesSet.has("NOASSERTION") && (licensesSet.delete("NOASSERTION"), licensesSet.add("unknown"));
        let allLicenses = Array.from(licensesSet).sort(),
          licenseString = allLicenses.length == 1 ? allLicenses[0] : `[${allLicenses.join(", ")}]`;
        renderedCitatation = {
          message: `Similar code with ${pluralize(allLicenses.length, "license type")} ${licenseString} detected.`,
          url: details[0].url
        };
      }
      return {
        htmlSnippet: highlighter.createSnippet(item.insertText.trim()),
        citation: renderedCitatation
      };
    });
  await this.postMessage({
    command: "solutionsUpdated",
    solutions: content,
    percentage: __privateGet(this, _percentage)
  });
}, "#render"), __name(_SuggestionsPanel, "SuggestionsPanel");

,var SuggestionsPanel = _SuggestionsPanel;

,function getNonce() {
  let text = "",
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
},__name(getNonce, "getNonce");

,var _SuggestionsPanelManager = class _SuggestionsPanelManager {
  constructor(_ctx) {
    this._ctx = _ctx;
    this._panelCount = 0;
  }
  renderPanel(completionContext, document, wrapped, uri) {
    let panel = lC.window.createWebviewPanel("GitHub Copilot Suggestions", basename(uri), lC.ViewColumn.Two, {
        enableScripts: !0,
        localResourceRoots: [lC.Uri.joinPath(this._ctx.get(Extension).context.extensionUri, "dist")],
        retainContextWhenHidden: !0
      }),
      suggestionPanel = new SuggestionsPanel(this._ctx, panel, document, this);
    return useLanguageClient() ? new LanguageClientPanel(this._ctx, document, completionContext, suggestionPanel).runQuery() : new CopilotListDocument(this._ctx, wrapped, completionContext, suggestionPanel).runQuery(), this.activeWebviewPanel = suggestionPanel, this._panelCount = this._panelCount + 1, suggestionPanel;
  }
  registerCommands() {
    registerCommandWrapper(this._ctx, CMDAcceptCursorPanelSolution, () => {
      var _a;
      return (_a = this.activeWebviewPanel) == null ? void 0 : _a.acceptFocusedSolution();
    }), registerCommandWrapper(this._ctx, CMDNavigatePreviousPanelSolution, () => {
      var _a;
      return (_a = this.activeWebviewPanel) == null ? void 0 : _a.postMessage({
        command: "navigatePreviousSolution"
      });
    }), registerCommandWrapper(this._ctx, CMDNavigateNextPanelSolution, () => {
      var _a;
      return (_a = this.activeWebviewPanel) == null ? void 0 : _a.postMessage({
        command: "navigateNextSolution"
      });
    });
  }
  decrementPanelCount() {
    this._panelCount = this._panelCount - 1, this._panelCount === 0 && lC.commands.executeCommand("setContext", CopilotPanelVisible, !1);
  }
};

,__name(_SuggestionsPanelManager, "SuggestionsPanelManager");

,var SuggestionsPanelManager = _SuggestionsPanelManager;

,function registerPanelSupport(ctx) {
  let suggestionsPanelManager = new SuggestionsPanelManager(ctx);
  registerCommandWrapper(ctx, CMDOpenPanel, async () => {
    await tF.commands.executeCommand("editor.action.inlineSuggest.hide"), await commandOpenPanel(ctx, suggestionsPanelManager);
  }), suggestionsPanelManager.registerCommands();
},__name(registerPanelSupport, "registerPanelSupport");

,function commandOpenPanel(ctx, suggestionsPanelManager) {
  let editor = tF.window.activeTextEditor;
  if (!editor) return;
  let wrapped = wrapDoc(ctx, editor.document);
  if (!wrapped) return;
  let completionContext = completionContextForDocument(ctx, wrapped, editor.selection.active),
    uri = encodeLocation(editor.document.uri, completionContext);
  return suggestionsPanelManager.renderPanel(completionContext, editor.document, wrapped, uri), tF.commands.executeCommand("setContext", CopilotPanelVisible, !0);
},__name(commandOpenPanel, "commandOpenPanel");