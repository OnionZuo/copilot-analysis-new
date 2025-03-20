var _VirtualPromptReconciler = class _VirtualPromptReconciler {
  constructor() {
    this.lifecycleData = new Map();
  }
  async initialize(prompt) {
    this.vTree = await this.virtualizeElement(prompt, "$", 0);
  }
  async reconcile(cancellationToken) {
    if (!this.vTree) throw new Error("No tree to reconcile, make sure to pass a valid prompt");
    return cancellationToken != null && cancellationToken.isCancellationRequested ? this.vTree : (this.vTree = await this.reconcileNode(this.vTree, "$", 0, cancellationToken), this.vTree);
  }
  async reconcileNode(node, parentNodePath, nodeIndex, cancellationToken) {
    var _a, _b;
    if (!node.children && !node.lifecycle) return node;
    let newNode = node;
    if ((_a = node.lifecycle) == null ? void 0 : _a.isRemountRequired()) {
      let oldChildrenPaths = this.collectChildPaths(node);
      await ((_b = node.lifecycle) == null ? void 0 : _b.componentWillUnmount()), newNode = await this.virtualizeElement(node.component, parentNodePath, nodeIndex);
      let newChildrenPaths = this.collectChildPaths(newNode);
      this.cleanupState(oldChildrenPaths, newChildrenPaths);
    } else if (node.children) {
      let children = [];
      for (let i = 0; i < node.children.length; i++) {
        let child = node.children[i];
        if (child) {
          let reconciledChild = await this.reconcileNode(child, node.path, i, cancellationToken);
          reconciledChild !== void 0 && children.push(reconciledChild);
        }
      }
      newNode.children = children;
    }
    return newNode;
  }
  async virtualizeElement(component, parentNodePath, nodeIndex) {
    if (!(typeof component > "u")) {
      if (typeof component == "string" || typeof component == "number") return {
        name: typeof component,
        path: `${parentNodePath}[${nodeIndex}]`,
        props: {
          value: component
        },
        component: component
      };
      if (isFragmentFunction(component.type)) {
        let fragment = component.type(component.props.children),
          indexIndicator = parentNodePath !== "$" ? `[${nodeIndex}]` : "",
          componentPath = `${parentNodePath}${indexIndicator}.${fragment.type}`,
          children = await Promise.all(fragment.children.map((c, i) => this.virtualizeElement(c, componentPath, i)));
        return this.ensureUniqueKeys(children), {
          name: fragment.type,
          path: componentPath,
          children: children.flat().filter(c => c !== void 0),
          component: component
        };
      }
      return await this.virtualizeFunctionComponent(parentNodePath, nodeIndex, component, component.type);
    }
  }
  async virtualizeFunctionComponent(parentNodePath, nodeIndex, component, functionComponent) {
    let indexIndicator = component.props.key ? `["${component.props.key}"]` : `[${nodeIndex}]`,
      componentPath = `${parentNodePath}${indexIndicator}.${functionComponent.name}`,
      lifecycle = new PromptElementLifecycle(this.getOrCreateLifecycleData(componentPath));
    await lifecycle.componentWillMount();
    let element = await functionComponent(component.props, lifecycle);
    await lifecycle.componentDidMount();
    let elementToVirtualize = Array.isArray(element) ? element : [element],
      children = (await Promise.all(elementToVirtualize.map((e, i) => this.virtualizeElement(e, componentPath, i)))).flat().filter(e => e !== void 0);
    return this.ensureUniqueKeys(children), {
      name: functionComponent.name,
      path: componentPath,
      props: component.props,
      children: children,
      component: component,
      lifecycle: lifecycle
    };
  }
  ensureUniqueKeys(nodes) {
    var _a;
    let keyCount = new Map();
    for (let node of nodes) {
      if (!node) continue;
      let key = (_a = node.props) == null ? void 0 : _a.key;
      key && keyCount.set(key, (keyCount.get(key) || 0) + 1);
    }
    let duplicates = Array.from(keyCount.entries()).filter(([_, count]) => count > 1).map(([key]) => key);
    if (duplicates.length > 0) throw new Error(`Duplicate keys found: ${duplicates.join(", ")}`);
  }
  collectChildPaths(node) {
    let paths = [];
    if (node != null && node.children) for (let child of node.children) child && (paths.push(child.path), paths.push(...this.collectChildPaths(child)));
    return paths;
  }
  cleanupState(oldChildrenPaths, newChildrenPaths) {
    for (let path of oldChildrenPaths) newChildrenPaths.includes(path) || this.lifecycleData.delete(path);
  }
  getOrCreateLifecycleData(path) {
    return this.lifecycleData.has(path) || this.lifecycleData.set(path, new PromptElementLifecycleData([])), this.lifecycleData.get(path);
  }
  createPipe() {
    return {
      pump: __name(async data => {
        await this.pumpData(data);
      }, "pump")
    };
  }
  async pumpData(data) {
    if (!this.vTree) throw new Error("No tree to pump data into. Pumping data before initializing?");
    await this.recursivelyPumpData(data, this.vTree);
  }
  async recursivelyPumpData(data, node) {
    var _a;
    if (!node) throw new Error("Can't pump data into undefined node.");
    await ((_a = node.lifecycle) == null ? void 0 : _a.dataHook.updateData(data));
    for (let child of node.children || []) await this.recursivelyPumpData(data, child);
  }
};

,__name(_VirtualPromptReconciler, "VirtualPromptReconciler");

,var VirtualPromptReconciler = _VirtualPromptReconciler,
  _PromptElementLifecycleData = class _PromptElementLifecycleData {
    constructor(state) {
      this.state = state, this._updateTimeMs = 0;
    }
    getUpdateTimeMsAndReset() {
      let value = this._updateTimeMs;
      return this._updateTimeMs = 0, value;
    }
  };

,__name(_PromptElementLifecycleData, "PromptElementLifecycleData");

,var PromptElementLifecycleData = _PromptElementLifecycleData,
  _PromptElementLifecycle = class _PromptElementLifecycle {
    constructor(lifecycleData) {
      this.lifecycleData = lifecycleData;
      this.effectHook = new UseEffect();
      this.stateHook = new UseState(lifecycleData.state), this.dataHook = new UseData(updateTimeMs => {
        lifecycleData._updateTimeMs = updateTimeMs;
      });
    }
    useState(initialState) {
      return this.stateHook.useState(initialState);
    }
    useEffect(effect) {
      this.effectHook.useEffect(effect);
    }
    useData(typePredicate, consumer) {
      this.dataHook.useData(typePredicate, consumer);
    }
    isRemountRequired() {
      return this.stateHook.hasChanged();
    }
    async componentWillMount() {
      await this.effectHook.runEffects();
    }
    async componentDidMount() {
      await this.effectHook.runEffects();
    }
    async componentWillUnmount() {
      await this.effectHook.cleanup();
    }
  };

,__name(_PromptElementLifecycle, "PromptElementLifecycle");

,var PromptElementLifecycle = _PromptElementLifecycle;

,function isFragmentFunction(element) {
  return typeof element == "function" && "isFragmentFunction" in element;
},__name(isFragmentFunction, "isFragmentFunction");