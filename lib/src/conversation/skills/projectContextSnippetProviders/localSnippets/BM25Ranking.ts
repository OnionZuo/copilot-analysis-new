var microjob = fn(Lz());

,var b = .75,
  k1 = 1.2,
  MAX_SNIPPET_COUNT = 47,
  _BM25Ranking = class _BM25Ranking {
    constructor(ctx, workspaceFolder) {
      this.ctx = ctx;
      this.workspaceFolder = workspaceFolder;
      this.chunksCount = 0;
      this.sumTokenCount = 0;
      this.status = "notStarted";
    }
    get avgTokenCount() {
      return this.sumTokenCount / this.chunksCount;
    }
    async initialize(chunks) {
      this.sumTokenCount = 0, this.chunksCount = 0;
      for await (let chunk of chunks) this.sumTokenCount += chunk.tokenCount, this.chunksCount++;
      this.status = "completed";
    }
    async addChunks(chunks) {
      for await (let chunk of chunks) this.sumTokenCount += chunk.tokenCount, this.chunksCount++;
    }
    async query(keywords) {
      let workerPoolToken = await startWorkerPool();
      try {
        return await this.doQuery(keywords);
      } finally {
        await workerPoolToken.stopWorkerPool();
      }
    }
    async doQuery(keywords) {
      let lowercaseKeywords = keywords.map(keyword => keyword.toLowerCase()),
        idfValues = await this.calculateIDFValues(lowercaseKeywords),
        countLimit = Math.min(10 * keywords.length, MAX_SNIPPET_COUNT),
        limit = Math.min(countLimit, this.chunksCount);
      return await this.calculateBM25Scores(lowercaseKeywords, this.avgTokenCount, idfValues, limit);
    }
    async calculateIDFValues(keywords) {
      let workspaceChunks = this.ctx.get(ChunkingProvider).getChunks(this.workspaceFolder),
        chunkDocuments = asyncIterableMap(workspaceChunks, async chunk => ({
          ...chunk,
          chunk: chunk.chunk.toLowerCase()
        })),
        chunks = asyncIterableMap(chunkDocuments, async doc => doc.chunk);
      return await calculateIDFValues(keywords, chunks);
    }
    async calculateBM25Scores(keywords, avgTokenCount, idfValues, limit) {
      let workspaceChunks = this.ctx.get(ChunkingProvider).getChunks(this.workspaceFolder),
        heap = new SimpleHeap(limit);
      for await (let chunk of workspaceChunks) {
        let scoredDocument = await calculateBM25Score({
          ...chunk,
          chunk: chunk.chunk.toLowerCase()
        }, keywords, avgTokenCount, idfValues);
        heap.add({
          ...scoredDocument,
          chunk: chunk.chunk
        });
      }
      return heap.toArray(.75);
    }
    async deleteEmbeddings(chunks) {
      this.chunksCount -= chunks.length, this.sumTokenCount -= chunks.reduce((acc, chunk) => acc + chunk.tokenCount, 0);
    }
    async terminateRanking() {}
  };

,__name(_BM25Ranking, "BM25Ranking");

,var BM25Ranking = _BM25Ranking;

,async function calculateIDFValues(keywords, chunks) {
  let keywordsBuffer = new SharedArrayBuffer(keywords.length * Int32Array.BYTES_PER_ELEMENT),
    keywordsArray = new Int32Array(keywordsBuffer),
    jobs = [],
    chunksLength = 0;
  for await (let chunk of chunks) {
    chunksLength++;
    let job = iue.job(({
      snippet: snippet,
      keywords: keywords
    }) => keywords.map(keyword => snippet.includes(keyword) ? 1 : 0), {
      data: {
        snippet: chunk,
        keywords: keywords
      }
    }).then(results => {
      for (let i = 0; i < keywords.length; i++) Atomics.add(keywordsArray, i, results[i]);
    });
    jobs.push(job);
  }
  await Promise.all(jobs);
  let idfArray = new Int32Array(keywordsBuffer),
    idfValues = {};
  for (let i = 0; i < keywords.length; i++) idfValues[keywords[i]] = Math.log((chunksLength - idfArray[i] + .5) / (idfArray[i] + .5) + 1);
  return idfValues;
},__name(calculateIDFValues, "calculateIDFValues");

,async function calculateBM25Score(chunk, keywords, avgTokenCount, idfValues) {
  return {
    score: await iue.job(({
      keywords: keywords,
      document: document,
      docLength: docLength,
      avgTokenCount: avgTokenCount,
      idfValues: idfValues,
      k1: k1,
      b: b
    }) => {
      let totalScore = 0;
      for (let keyword of keywords) {
        let idf = idfValues[keyword],
          tf = (document.match(new RegExp(keyword, "g")) || []).length,
          numerator = idf * (tf * (k1 + 1)),
          denominator = tf + k1 * (1 - b + b * docLength / avgTokenCount);
        totalScore += numerator / denominator;
      }
      return totalScore;
    }, {
      data: {
        document: chunk.chunk,
        docLength: chunk.tokenCount,
        keywords: keywords,
        avgTokenCount: avgTokenCount,
        idfValues: idfValues,
        k1: k1,
        b: b
      }
    }),
    ...chunk
  };
},__name(calculateBM25Score, "calculateBM25Score");

,var _SimpleHeap = class _SimpleHeap {
  constructor(maxSize, minScore = -1 / 0) {
    this.maxSize = maxSize;
    this.minScore = minScore;
    this.store = [];
  }
  toArray(maxSpread) {
    if (this.store.length && typeof maxSpread == "number") {
      let minScore = this.store.at(0).score * (1 - maxSpread);
      return this.store.filter(x => x.score >= minScore);
    }
    return this.store;
  }
  add(value) {
    var _a, _b;
    if (value.score <= this.minScore) return;
    let index = this.store.findIndex(entry => entry.score < value.score);
    for (this.store.splice(index >= 0 ? index : this.store.length, 0, value); this.store.length > this.maxSize;) this.store.pop();
    this.store.length === this.maxSize && (this.minScore = (_b = (_a = this.store.at(-1)) == null ? void 0 : _a.score) != null ? _b : this.minScore);
  }
};

,__name(_SimpleHeap, "SimpleHeap");

,var SimpleHeap = _SimpleHeap;