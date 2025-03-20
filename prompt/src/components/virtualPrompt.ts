var _VirtualPrompt = class _VirtualPrompt {
  static async create(prompt) {
    let virtualPrompt = new _VirtualPrompt();
    return await virtualPrompt.initialize(prompt), virtualPrompt;
  }
  constructor() {
    this.reconciler = new VirtualPromptReconciler();
  }
  async initialize(prompt) {
    await this.reconciler.initialize(prompt);
  }
  snapshotNode(node, cancellationToken) {
    var _a, _b, _c, _d;
    if (!node) return;
    if (cancellationToken != null && cancellationToken.isCancellationRequested) return "cancelled";
    let children = [];
    for (let child of (_a = node.children) != null ? _a : []) {
      let result = this.snapshotNode(child, cancellationToken);
      if (result === "cancelled") return "cancelled";
      result !== void 0 && children.push(result);
    }
    return {
      value: (_c = (_b = node.props) == null ? void 0 : _b.value) == null ? void 0 : _c.toString(),
      name: node.name,
      path: node.path,
      props: node.props,
      children: children,
      statistics: {
        updateDataTimeMs: (_d = node.lifecycle) == null ? void 0 : _d.lifecycleData.getUpdateTimeMsAndReset()
      }
    };
  }
  async snapshot(cancellationToken) {
    try {
      let vTree = await this.reconciler.reconcile(cancellationToken);
      if (cancellationToken != null && cancellationToken.isCancellationRequested) return {
        snapshot: void 0,
        status: "cancelled"
      };
      if (!vTree) throw new Error("Invalid virtual prompt tree");
      let snapshotNode = this.snapshotNode(vTree, cancellationToken);
      return snapshotNode === "cancelled" || cancellationToken != null && cancellationToken.isCancellationRequested ? {
        snapshot: void 0,
        status: "cancelled"
      } : {
        snapshot: snapshotNode,
        status: "ok"
      };
    } catch (e) {
      return {
        snapshot: void 0,
        status: "error",
        error: e
      };
    }
  }
  createPipe() {
    return this.reconciler.createPipe();
  }
};

,__name(_VirtualPrompt, "VirtualPrompt");

,var VirtualPrompt = _VirtualPrompt;