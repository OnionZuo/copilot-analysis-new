var _IndexNotification = class _IndexNotification {
  constructor(operation) {
    this.operation = operation;
  }
};

,__name(_IndexNotification, "IndexNotification");

,var IndexNotification = _IndexNotification,
  _IndexRequest = class _IndexRequest extends IndexNotification {
    constructor(id, operation) {
      super(operation);
      this.id = id;
      this.id = id;
    }
  };

,__name(_IndexRequest, "IndexRequest");

,var IndexRequest = _IndexRequest,
  _CancellationNotification = class _CancellationNotification extends IndexNotification {
    constructor(messageIdToCancel) {
      super(MessageOperations.Cancel);
      this.messageIdToCancel = messageIdToCancel;
    }
  };

,__name(_CancellationNotification, "CancellationNotification");

,var CancellationNotification = _CancellationNotification,
  MessageOperations = {
    CreateIndex: "createIndex",
    AddOrInvalidated: "addOrInvalidated",
    GetContext: "getContext",
    Exit: "exit",
    Response: "response",
    RemoveIndex: "removeIndex",
    Cancel: "cancel",
    GetAllDocumentsInWorkspace: "getAllDocumentsInWorkspace"
  },
  _CreateIndexRequest = class _CreateIndexRequest extends IndexRequest {
    constructor(id, baseWorkspaceFolderPath, databaseFilePath) {
      super(id, MessageOperations.CreateIndex);
      this.baseWorkspaceFolderPath = baseWorkspaceFolderPath;
      this.databaseFilePath = databaseFilePath;
    }
  };

,__name(_CreateIndexRequest, "CreateIndexRequest");

,var CreateIndexRequest = _CreateIndexRequest,
  _RemoveIndexRequest = class _RemoveIndexRequest extends IndexRequest {
    constructor(id, baseWorkspaceFolderPath) {
      super(id, MessageOperations.RemoveIndex);
      this.baseWorkspaceFolderPath = baseWorkspaceFolderPath;
    }
  };

,__name(_RemoveIndexRequest, "RemoveIndexRequest");

,var RemoveIndexRequest = _RemoveIndexRequest,
  _AddOrInvalidatedRequest = class _AddOrInvalidatedRequest extends IndexRequest {
    constructor(id, filePath, languageId) {
      super(id, MessageOperations.AddOrInvalidated);
      this.filePath = filePath;
      this.languageId = languageId;
    }
  };

,__name(_AddOrInvalidatedRequest, "AddOrInvalidatedRequest");

,var AddOrInvalidatedRequest = _AddOrInvalidatedRequest,
  _GetAllDocumentsRequest = class _GetAllDocumentsRequest extends IndexRequest {
    constructor(id, baseWorkspaceFolderPath) {
      super(id, MessageOperations.GetAllDocumentsInWorkspace);
      this.baseWorkspaceFolderPath = baseWorkspaceFolderPath;
    }
  };

,__name(_GetAllDocumentsRequest, "GetAllDocumentsRequest");

,var GetAllDocumentsRequest = _GetAllDocumentsRequest,
  _GetContextRequest = class _GetContextRequest extends IndexRequest {
    constructor(id, filePath, code, offset, languageId) {
      super(id, MessageOperations.GetContext);
      this.filePath = filePath;
      this.code = code;
      this.offset = offset;
      this.languageId = languageId;
    }
  };

,__name(_GetContextRequest, "GetContextRequest");

,var GetContextRequest = _GetContextRequest,
  _ExitRequest = class _ExitRequest extends IndexRequest {
    constructor(id) {
      super(id, MessageOperations.Exit);
    }
  };

,__name(_ExitRequest, "ExitRequest");

,var ExitRequest = _ExitRequest;