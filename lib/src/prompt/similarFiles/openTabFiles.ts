var _OpenTabFiles = class _OpenTabFiles {
  constructor(docManager) {
    this.docManager = docManager;
  }
  async truncateDocs(docs, uri, languageId, maxNumNeighborFiles) {
    let openFiles = new Map(),
      totalLen = 0;
    for (let doc of docs) if (!(totalLen + doc.getText().length > NeighborSource.MAX_NEIGHBOR_AGGREGATE_LENGTH) && (doc.uri.startsWith("file:") && uri.startsWith("file:") && doc.uri !== uri && considerNeighborFile(languageId, doc.languageId) && (openFiles.set(doc.uri.toString(), {
      uri: doc.uri.toString(),
      relativePath: this.docManager.getRelativePath(doc),
      source: doc.getText()
    }), totalLen += doc.getText().length), openFiles.size >= maxNumNeighborFiles)) break;
    return openFiles;
  }
  async getNeighborFiles(uri, languageId, maxNumNeighborFiles) {
    let neighborFiles = new Map(),
      neighborSource = new Map();
    return neighborFiles = await this.truncateDocs(sortByAccessTimes(await this.docManager.textDocuments()), uri, languageId, maxNumNeighborFiles), neighborSource.set("opentabs", Array.from(neighborFiles.keys()).map(uri => uri.toString())), {
      docs: neighborFiles,
      neighborSource: neighborSource
    };
  }
};

,__name(_OpenTabFiles, "OpenTabFiles");

,var OpenTabFiles = _OpenTabFiles;