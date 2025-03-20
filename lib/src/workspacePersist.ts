var import_crypto = require("crypto"),
  import_fs = require("fs"),
  import_path = fn(require("path"));

,var lookupFile = "symbolDatabaseLookup",
  databaseDir = "fallbackContextProviderDocumentSymbols",
  _WorkspaceDatabasePersistenceManager = class _WorkspaceDatabasePersistenceManager {
    constructor(persistenceManager) {
      this.persistenceManager = persistenceManager;
    }
    async getDBFilePath(workspaceFolderPath) {
      await this.init();
      let fileName = await this.persistenceManager.read(lookupFile, workspaceFolderPath);
      return fileName || (fileName = await this.createDBFile(workspaceFolderPath)), Twe.path.join(this.persistenceManager.directory, databaseDir, fileName);
    }
    async init() {
      let dbDir = Twe.path.join(this.persistenceManager.directory, databaseDir);
      await this.createIfNotExists(dbDir);
    }
    async dirExists(dir) {
      try {
        return await Fwe.fs.access(dir), !0;
      } catch {
        return !1;
      }
    }
    async createIfNotExists(dir) {
      try {
        (await this.dirExists(dir)) || (await Fwe.fs.mkdir(dir, {
          recursive: !0
        }));
      } catch {
        throw new Error(`Failed to create directory: ${dir}`);
      }
    }
    async createDBFile(workspaceFolderPath) {
      let fileName = `${(0, Met.randomUUID)()}.db`;
      return await this.persistenceManager.update(lookupFile, workspaceFolderPath, fileName), fileName;
    }
    async deleteDBFile(workspaceFolderPath) {}
  };

,__name(_WorkspaceDatabasePersistenceManager, "WorkspaceDatabasePersistenceManager");

,var WorkspaceDatabasePersistenceManager = _WorkspaceDatabasePersistenceManager;