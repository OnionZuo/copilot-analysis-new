var DEFAULT_TREE_TRAVERSAL_CONFIG = {
  worthUp: .9,
  worthSibling: .88,
  worthDown: .8
};

,function fromTreeWithFocussedLines(tree, config = DEFAULT_TREE_TRAVERSAL_CONFIG) {
  let treeWithDistances = mapLabels(tree, x => x ? 1 : void 0);
  return visitTree(treeWithDistances, node => {
    var _a;
    if (isBlank(node)) return;
    let maxChildLabel = node.subs.reduce((memo, child) => {
      var _a;
      return Math.max(memo, (_a = child.label) != null ? _a : 0);
    }, 0);
    node.label = Math.max((_a = node.label) != null ? _a : 0, maxChildLabel * config.worthUp);
  }, "bottomUp"), visitTree(treeWithDistances, node => {
    if (isBlank(node)) return;
    let values = node.subs.map(sub => {
        var _a;
        return (_a = sub.label) != null ? _a : 0;
      }),
      new_values = [...values];
    for (let i = 0; i < values.length; i++) values[i] !== 0 && (new_values = new_values.map((v, j) => Math.max(v, Math.pow(config.worthSibling, Math.abs(i - j)) * values[i])));
    let nodeLabel = node.label;
    nodeLabel !== void 0 && (new_values = new_values.map(v => Math.max(v, config.worthDown * nodeLabel))), node.subs.forEach((sub, i) => sub.label = new_values[i]);
  }, "topDown"), fromTreeWithValuedLines(treeWithDistances);
},__name(fromTreeWithFocussedLines, "fromTreeWithFocussedLines");

,function fromTreeWithValuedLines(tree) {
  let valuedLines = foldTree(tree, [], (node, acc) => {
    var _a, _b;
    return (node.type === "line" || node.type === "blank") && acc.push(node.type === "line" ? [deparseLine(node).trimEnd(), (_a = node.label) != null ? _a : 0] : ["", (_b = node.label) != null ? _b : 0]), acc;
  }, "topDown");
  return new ElidableText(valuedLines);
},__name(fromTreeWithValuedLines, "fromTreeWithValuedLines");