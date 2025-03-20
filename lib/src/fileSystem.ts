var import_fs = require("fs");

,var _FileSystem = class _FileSystem {};

,__name(_FileSystem, "FileSystem");

,var FileSystem = _FileSystem,
  _LocalFileSystem = class _LocalFileSystem extends FileSystem {
    getFsPath(uri) {
      typeof uri == "string" && (uri = parseUri(uri, !0));
      let path = getFsPath(uri);
      if (path !== void 0) return path;
      throw isSupportedUriScheme(uri.scheme) ? new Error("Unsupported remote file path") : new Error(`Unsupported scheme: ${uri.scheme}`);
    }
    async readFileString(uri) {
      return (await iR.fsp.readFile(this.getFsPath(uri))).toString();
    }
    async stat(uri) {
      let {
        targetStat: targetStat,
        lstat: lstat,
        stat: stat
      } = await this.statWithLink(this.getFsPath(uri));
      return {
        ctime: targetStat.ctimeMs,
        mtime: targetStat.mtimeMs,
        size: targetStat.size,
        type: this.getFileType(targetStat, lstat, stat)
      };
    }
    async statWithLink(fsPath) {
      let lstat = await iR.fsp.lstat(fsPath);
      if (lstat.isSymbolicLink()) try {
        let stat = await iR.fsp.stat(fsPath);
        return {
          lstat: lstat,
          stat: stat,
          targetStat: stat
        };
      } catch {}
      return {
        lstat: lstat,
        targetStat: lstat
      };
    }
    getFileType(targetStat, lstat, stat) {
      let type = 0;
      return targetStat.isFile() && (type = 1), targetStat.isDirectory() && (type = 2), lstat.isSymbolicLink() && stat && (type |= 64), type;
    }
  };

,__name(_LocalFileSystem, "LocalFileSystem");

,var LocalFileSystem = _LocalFileSystem;