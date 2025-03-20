var import_tiktokenizer = fn(tIe()),
  import_fs = require("fs"),
  import_path = require("path");

,var TokenizerName = (a => (TokenizerName.cl100k = "cl100k_base", TokenizerName.o200k = "o200k_base", TokenizerName.mock = "mock", TokenizerName))(h1 || {}),
  tokenizers = new Map();

,function getTokenizer(name = "cl100k_base") {
  let tokenizer = tokenizers.get(name);
  return tokenizer !== void 0 || (name === "mock" ? tokenizer = new MockTokenizer() : tokenizer = new TTokenizer(name), tokenizers.set(name, tokenizer)), tokenizer;
},__name(getTokenizer, "getTokenizer");

,function parseTikTokenNoIndex(file) {
  if (!file.endsWith(".tiktoken.noindex")) throw new Error("File does not end with .tiktoken.noindex");
  let contents = (0, aIe.readFileSync)(file, "utf-8"),
    result = new Map();
  for (let line of contents.split(`
`)) {
    if (!line) continue;
    let buffer = Buffer.from(line, "base64");
    result.set(buffer, result.size);
  }
  return result;
},__name(parseTikTokenNoIndex, "parseTikTokenNoIndex");

,var _TTokenizer = class _TTokenizer {
  constructor(encoder) {
    try {
      this._tokenizer = (0, f1.createTokenizer)(parseTikTokenNoIndex((0, iIe.join)(__dirname, `./resources/${encoder}.tiktoken.noindex`)), (0, f1.getSpecialTokensByEncoder)(encoder), (0, f1.getRegexByEncoder)(encoder), 32768);
    } catch (e) {
      throw e instanceof Error ? new CopilotPromptLoadFailure("Could not load tokenizer", e) : e;
    }
  }
  tokenize(text) {
    return this._tokenizer.encode(text);
  }
  detokenize(tokens) {
    return this._tokenizer.decode(tokens);
  }
  tokenLength(text) {
    return this.tokenize(text).length;
  }
  tokenizeStrings(text) {
    return this.tokenize(text).map(token => this.detokenize([token]));
  }
  takeLastTokens(text, n) {
    if (n <= 0) return {
      text: "",
      tokens: []
    };
    let CHARS_PER_TOKENS_START = 4,
      CHARS_PER_TOKENS_ADD = 1,
      chars = Math.min(text.length, n * CHARS_PER_TOKENS_START),
      suffix = text.slice(-chars),
      suffixT = this.tokenize(suffix);
    for (; suffixT.length < n + 2 && chars < text.length;) chars = Math.min(text.length, chars + n * CHARS_PER_TOKENS_ADD), suffix = text.slice(-chars), suffixT = this.tokenize(suffix);
    return suffixT.length < n ? {
      text: text,
      tokens: suffixT
    } : (suffixT = suffixT.slice(-n), {
      text: this.detokenize(suffixT),
      tokens: suffixT
    });
  }
  takeFirstTokens(text, n) {
    if (n <= 0) return {
      text: "",
      tokens: []
    };
    let CHARS_PER_TOKENS_START = 4,
      CHARS_PER_TOKENS_ADD = 1,
      chars = Math.min(text.length, n * CHARS_PER_TOKENS_START),
      prefix = text.slice(0, chars),
      prefix_t = this.tokenize(prefix);
    for (; prefix_t.length < n + 2 && chars < text.length;) chars = Math.min(text.length, chars + n * CHARS_PER_TOKENS_ADD), prefix = text.slice(0, chars), prefix_t = this.tokenize(prefix);
    return prefix_t.length < n ? {
      text: text,
      tokens: prefix_t
    } : (prefix_t = prefix_t.slice(0, n), {
      text: this.detokenize(prefix_t),
      tokens: prefix_t
    });
  }
  takeLastLinesTokens(text, n) {
    let {
      text: suffix
    } = this.takeLastTokens(text, n);
    if (suffix.length === text.length || text[text.length - suffix.length - 1] === `
`) return suffix;
    let newline = suffix.indexOf(`
`);
    return suffix.substring(newline + 1);
  }
};

,__name(_TTokenizer, "TTokenizer");

,var TTokenizer = _TTokenizer,
  _MockTokenizer = class _MockTokenizer {
    constructor() {
      this.hash = __name(str => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          let char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char, hash &= hash & 65535;
        }
        return hash;
      }, "hash");
    }
    tokenize(text) {
      return this.tokenizeStrings(text).map(this.hash);
    }
    detokenize(tokens) {
      return tokens.map(token => token.toString()).join(" ");
    }
    tokenizeStrings(text) {
      return text.split(/\b/);
    }
    tokenLength(text) {
      return this.tokenizeStrings(text).length;
    }
    takeLastTokens(text, n) {
      let tokens = this.tokenizeStrings(text).slice(-n);
      return {
        text: tokens.join(""),
        tokens: tokens.map(this.hash)
      };
    }
    takeFirstTokens(text, n) {
      let tokens = this.tokenizeStrings(text).slice(0, n);
      return {
        text: tokens.join(""),
        tokens: tokens.map(this.hash)
      };
    }
    takeLastLinesTokens(text, n) {
      let {
        text: suffix
      } = this.takeLastTokens(text, n);
      if (suffix.length === text.length || text[text.length - suffix.length - 1] === `
`) return suffix;
      let newline = suffix.indexOf(`
`);
      return suffix.substring(newline + 1);
    }
  };

,__name(_MockTokenizer, "MockTokenizer");

,var MockTokenizer = _MockTokenizer;