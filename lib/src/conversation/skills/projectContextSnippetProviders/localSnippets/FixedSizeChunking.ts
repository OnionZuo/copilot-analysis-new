var microjob = fn(Lz()),
  import_path = fn(require("path"));

,var chunkSize = 500,
  overlap = Math.floor(.25 * chunkSize),
  _FixedSizeChunking = class _FixedSizeChunking {
    async chunk(doc, modelConfig) {
      let results = [],
        filename = Zle.path.extname(__filename) === ".ts" ? Zle.path.resolve(__dirname, "../../../../../../dist/main.js") : __filename;
      return results = await z$e.job(async ({
        text: text,
        uri: uri,
        tokenizerName: tokenizerName,
        directory: directory,
        chunkSize: chunkSize,
        overlap: overlap
      }) => {
        let tokenizer = require(directory).getTokenizer(tokenizerName),
          tokens = tokenizer.tokenize(text),
          length = tokens.length,
          chunks = [],
          tokenStart = 0;
        for (; tokenStart < length;) {
          let isLastChunk = tokenStart + chunkSize >= length,
            tokenEnd = isLastChunk ? length : tokenStart + chunkSize,
            chunkTokens = tokens.slice(tokenStart, tokenEnd),
            chunk = tokenizer.detokenize(chunkTokens),
            chunkStart = text.indexOf(chunk);
          chunks.push({
            id: `${uri.toString()}#${tokenStart}`,
            chunk: chunk,
            tokenCount: chunkTokens.length,
            range: {
              start: chunkStart,
              end: chunkStart + chunk.length
            }
          }), tokenStart = isLastChunk ? tokenEnd : tokenEnd - overlap;
        }
        return chunks;
      }, {
        data: {
          text: doc.getText(),
          uri: doc.uri.toString(),
          tokenizerName: modelConfig.tokenizer,
          directory: filename,
          chunkSize: chunkSize,
          overlap: overlap
        }
      }), results;
    }
  };

,__name(_FixedSizeChunking, "FixedSizeChunking");

,var FixedSizeChunking = _FixedSizeChunking;