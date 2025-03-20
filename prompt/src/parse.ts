var import_fs = require("fs"),
  import_path = fn(require("path")),
  import_web_tree_sitter = fn(hIe());

,var WASMLanguage = (l => (WASMLanguage.Python = "python", WASMLanguage.JavaScript = "javascript", WASMLanguage.TypeScript = "typescript", WASMLanguage.TSX = "tsx", WASMLanguage.Go = "go", WASMLanguage.Ruby = "ruby", WASMLanguage.CSharp = "c_sharp", WASMLanguage.Java = "java", WASMLanguage))(yIe || {}),
  languageIdToWasmLanguageMapping = {
    python: "python",
    javascript: "javascript",
    javascriptreact: "javascript",
    jsx: "javascript",
    typescript: "typescript",
    typescriptreact: "tsx",
    go: "go",
    ruby: "ruby",
    csharp: "c_sharp",
    java: "java"
  };

,function isSupportedLanguageId(languageId) {
  return languageId in languageIdToWasmLanguageMapping && languageId !== "csharp" && languageId !== "java";
},__name(isSupportedLanguageId, "isSupportedLanguageId");

,function languageIdToWasmLanguage(languageId) {
  if (!(languageId in languageIdToWasmLanguageMapping)) throw new Error(`Unrecognized language: ${languageId}`);
  return languageIdToWasmLanguageMapping[languageId];
},__name(languageIdToWasmLanguage, "languageIdToWasmLanguage");

,var languageLoadPromises = new Map();

,async function loadWasmLanguage(language) {
  let wasmBytes,
    treeSitterPath = vR.path.resolve(vR.path.extname(__filename) !== ".ts" ? __dirname : vR.path.resolve(__dirname, "../../dist"), `tree-sitter-${language}.wasm`);
  try {
    wasmBytes = await bIe.fsp.readFile(treeSitterPath);
  } catch (e) {
    throw e instanceof Error && "code" in e && typeof e.code == "string" && e.name === "Error" ? new CopilotPromptLoadFailure(`Could not load tree-sitter-${language}.wasm`, e) : e;
  }
  return IR.Parser.Language.load(wasmBytes);
},__name(loadWasmLanguage, "loadWasmLanguage");

,function getLanguage(language) {
  let wasmLanguage = languageIdToWasmLanguage(language);
  if (!languageLoadPromises.has(wasmLanguage)) {
    let loadedLang = loadWasmLanguage(wasmLanguage);
    languageLoadPromises.set(wasmLanguage, loadedLang);
  }
  return languageLoadPromises.get(wasmLanguage);
},__name(getLanguage, "getLanguage");

,var _WrappedError = class _WrappedError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
  }
};

,__name(_WrappedError, "WrappedError");

,var WrappedError = _WrappedError;

,async function parseTreeSitter(language, source) {
  await IR.Parser.init();
  let parser;
  try {
    parser = new IR.Parser();
  } catch (e) {
    throw e && typeof e == "object" && "message" in e && typeof e.message == "string" && e.message.includes("table index is out of bounds") ? new WrappedError(`Could not init Parse for language <${language}>`, e) : e;
  }
  let treeSitterLanguage = await getLanguage(language);
  parser.setLanguage(treeSitterLanguage);
  let parsedTree = parser.parse(source);
  return parser.delete(), parsedTree;
},__name(parseTreeSitter, "parseTreeSitter");

,function getBlockCloseToken(language) {
  switch (languageIdToWasmLanguage(language)) {
    case "python":
      return null;
    case "javascript":
    case "typescript":
    case "tsx":
    case "go":
    case "c_sharp":
    case "java":
      return "}";
    case "ruby":
      return "end";
  }
},__name(getBlockCloseToken, "getBlockCloseToken");

,function innerQuery(queries, root) {
  let matches = [];
  for (let query of queries) {
    if (!query[1]) {
      let lang = root.tree.getLanguage();
      query[1] = lang.query(query[0]);
    }
    matches.push(...query[1].matches(root));
  }
  return matches;
},__name(innerQuery, "innerQuery");

,var docstringQuery = [`[
    (class_definition (block (expression_statement (string))))
    (function_definition (block (expression_statement (string))))
]`];

,function queryPythonIsDocstring(blockNode) {
  return innerQuery([docstringQuery], blockNode).length == 1;
},__name(queryPythonIsDocstring, "queryPythonIsDocstring");