var import_fs = require("fs"),
  import_os = require("os"),
  path = fn(require("path")),
  import_process = require("process");

,var _PersistenceManager = class _PersistenceManager {};

,__name(_PersistenceManager, "PersistenceManager");

,var PersistenceManager = _PersistenceManager,
  _FilePersistenceManager = class _FilePersistenceManager extends PersistenceManager {
    constructor(directory) {
      super();
      this.directory = directory;
    }
    async read(setting, key) {
      try {
        return (await this.readJsonObject(setting))[key];
      } catch {
        return;
      }
    }
    async update(setting, key, value) {
      await Ow.fs.mkdir(this.directory, {
        recursive: !0,
        mode: 448
      });
      let configFile = `${this.directory}/${setting}.json`,
        contentsJSON = await this.readJsonObject(setting);
      contentsJSON[key] = value, await Ow.fs.writeFile(configFile, JSON.stringify(contentsJSON) + `
`, {
        encoding: "utf8"
      });
    }
    async delete(setting, key) {
      let configFile = `${this.directory}/${setting}.json`;
      try {
        let contentsJSON = await this.readJsonObject(setting);
        delete contentsJSON[key];
        let contentsOut = JSON.stringify(contentsJSON) + `
`;
        contentsOut === `{}
` ? await Ow.fs.rm(configFile) : await Ow.fs.writeFile(configFile, contentsOut, {
          encoding: "utf8"
        });
      } catch {}
    }
    async deleteSetting(setting) {
      let configFile = `${this.directory}/${setting}.json`;
      try {
        await Ow.fs.rm(configFile);
      } catch {}
    }
    async listSettings() {
      try {
        return (await Ow.fs.readdir(this.directory)).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5));
      } catch {
        return [];
      }
    }
    async listKeys(setting) {
      return Object.keys(await this.readJsonObject(setting));
    }
    async readJsonObject(setting) {
      let configFile = `${this.directory}/${setting}.json`;
      try {
        let contents = await Ow.fs.readFile(configFile, {
          encoding: "utf8"
        });
        return JSON.parse(contents);
      } catch {
        return {};
      }
    }
  };

,__name(_FilePersistenceManager, "FilePersistenceManager");

,var FilePersistenceManager = _FilePersistenceManager;

,function getXdgConfigPath() {
  return uQ.env.XDG_CONFIG_HOME && l$e.isAbsolute(uQ.env.XDG_CONFIG_HOME) ? uQ.env.XDG_CONFIG_HOME + "/github-copilot" : (0, c$e.platform)() === "win32" ? uQ.env.USERPROFILE + "\\AppData\\Local\\github-copilot" : uQ.env.HOME + "/.config/github-copilot";
},__name(getXdgConfigPath, "getXdgConfigPath");

,function makeXdgPersistenceManager() {
  return new FilePersistenceManager(getXdgConfigPath());
},__name(makeXdgPersistenceManager, "makeXdgPersistenceManager");