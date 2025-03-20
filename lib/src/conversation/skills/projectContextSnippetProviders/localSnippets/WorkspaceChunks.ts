var import_crypto_js = fn(_B()),
  fs = fn(require("fs")),
  import_os = require("os"),
  path = fn(require("path")),
  import_process = require("process");

,var MAX_CHUNK_COUNT = 5e4,
  logger = new Logger("workspaceChunks"),
  _WorkspaceChunks = class _WorkspaceChunks {
    constructor(ctx, workspaceFolder) {
      this.ctx = ctx;
      this.pathHashLength = 8;
      let workspaceName = fp.basename(workspaceFolder),
        workspaceHash = (0, Mz.SHA256)(workspaceFolder).toString().substring(0, this.pathHashLength);
      this.cacheRootPath = fp.join(getXdgCachePath(), "project-context", `${workspaceName}.${workspaceHash}`);
    }
    getChunksCacheFile(codeFilePath) {
      let key = (0, Mz.SHA256)(codeFilePath).toString().substring(0, this.pathHashLength),
        fileName = fp.basename(codeFilePath);
      return fp.join(this.cacheRootPath, `${fileName}.${key}.json`);
    }
    async getChunksCacheFromCacheFile(cacheFile) {
      let raw = await Cb.promises.readFile(cacheFile, {
        encoding: "utf8"
      }).catch(() => {});
      if (raw) try {
        return JSON.parse(raw);
      } catch {}
    }
    async getChunksCache(codeFilePathUri) {
      let cacheFile = this.getChunksCacheFile(codeFilePathUri);
      return await this.getChunksCacheFromCacheFile(cacheFile);
    }
    async setChunksCache(codeFilePathUri, cache) {
      let cacheFile = this.getChunksCacheFile(codeFilePathUri);
      try {
        await Cb.promises.mkdir(fp.dirname(cacheFile), {
          recursive: !0
        }), await Cb.promises.writeFile(cacheFile, JSON.stringify(cache), {
          encoding: "utf8"
        });
      } catch (e) {
        logger.debug(this.ctx, "Failed to set chunks cache:", e);
      }
    }
    async removeChunksCache(codeFilePathUri) {
      let cacheFile = this.getChunksCacheFile(codeFilePathUri);
      await Cb.promises.rm(cacheFile).catch(() => {});
    }
    async enumerateChunksCacheFileNames() {
      return await Cb.promises.readdir(this.cacheRootPath).catch(() => []);
    }
    async getFilesCount() {
      return (await this.enumerateChunksCacheFileNames()).length;
    }
    async getChunksCount() {
      let count = 0;
      for await (let _ of this.getChunks()) count++;
      return count++;
    }
    async *getChunksForFile({
      uri: uri
    }) {
      let cache = await this.getChunksCache(uri);
      cache !== void 0 && (yield* cache.documentChunks);
    }
    async *getChunksFromCacheFile(cacheFile) {
      let cache = await this.getChunksCacheFromCacheFile(cacheFile);
      yield* cache ? cache.documentChunks : [];
    }
    async *getChunks(arg) {
      if (arg !== void 0) yield* this.getChunksForFile(arg);else {
        let cacheFiles = await this.enumerateChunksCacheFileNames();
        for (let cacheFile of cacheFiles) yield* this.getChunksFromCacheFile(fp.join(this.cacheRootPath, cacheFile));
      }
    }
    async getFileHash(codeFilePathUri) {
      let content = await Cb.promises.readFile(factory_exports.parse(codeFilePathUri).fsPath, {
        encoding: "utf8"
      });
      return (0, Mz.SHA256)(content).toString();
    }
    async addChunks({
      uri: uri
    }, chunks) {
      let fileHash = await this.getFileHash(uri),
        existingChunks = await this.getChunksCache(uri);
      if (existingChunks !== void 0 && existingChunks.hash === fileHash && existingChunks.version === _WorkspaceChunks.CACHE_VERSION) return;
      let cache = {
        version: _WorkspaceChunks.CACHE_VERSION,
        filePath: uri,
        hash: fileHash,
        documentChunks: chunks
      };
      await this.setChunksCache(uri, cache);
    }
    async deleteChunksForSource(codeFilePath) {
      let codeFilePathUri = factory_exports.file(codeFilePath).toString(),
        cache = await this.getChunksCache(codeFilePathUri);
      return cache === void 0 ? [] : (await this.removeChunksCache(codeFilePathUri), cache.documentChunks);
    }
    async deleteChunks({
      uri: uri
    }) {
      let codeFilePath = getFsPath(uri);
      if (!codeFilePath) return [];
      let files;
      try {
        files = await Cb.promises.readdir(codeFilePath);
      } catch {
        return await this.deleteChunksForSource(codeFilePath);
      }
      let chunks = [];
      for (let file of files) {
        let subUri = factory_exports.file(fp.join(codeFilePath, file)).toString();
        chunks.push(...(await this.deleteChunks({
          uri: subUri
        })));
      }
      return chunks;
    }
    async clear() {
      await Cb.promises.rm(this.cacheRootPath, {
        recursive: !0
      }).catch(() => {});
    }
  };

,__name(_WorkspaceChunks, "WorkspaceChunks"), _WorkspaceChunks.CACHE_VERSION = "1.0.0";

,var WorkspaceChunks = _WorkspaceChunks;

,function getXdgCachePath() {
  return pQ.env.XDG_CACHE_HOME && fp.isAbsolute(pQ.env.XDG_CACHE_HOME) ? pQ.env.XDG_CACHE_HOME + "/github-copilot" : (0, j$e.platform)() === "win32" ? pQ.env.USERPROFILE + "\\AppData\\Local\\Temp\\github-copilot" : pQ.env.HOME + "/.cache/github-copilot";
},__name(getXdgCachePath, "getXdgCachePath");