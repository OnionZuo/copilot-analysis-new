var _InMemoryPersistenceManager = class _InMemoryPersistenceManager extends PersistenceManager {
  constructor() {
    super(...arguments);
    this.settings = new Map();
  }
  get directory() {
    throw new Error("Not supported");
  }
  async read(setting, key) {
    try {
      return this.readJsonObject(setting)[key];
    } catch {
      return;
    }
  }
  async update(setting, key, value) {
    let contentsJSON = this.readJsonObject(setting);
    contentsJSON[key] = value, this.settings.set(setting, contentsJSON);
  }
  async delete(setting, key) {
    let contentsJSON = this.readJsonObject(setting);
    delete contentsJSON[key], this.settings.set(setting, contentsJSON);
  }
  async deleteSetting(setting) {
    this.settings.delete(setting);
  }
  async listSettings() {
    return [...this.settings.keys()];
  }
  async listKeys(setting) {
    return Object.keys(this.readJsonObject(setting));
  }
  readJsonObject(setting) {
    var _a;
    return (_a = this.settings.get(setting)) != null ? _a : {};
  }
};

,__name(_InMemoryPersistenceManager, "InMemoryPersistenceManager");

,var InMemoryPersistenceManager = _InMemoryPersistenceManager;