function virtualNode(indentation, subs, label) {
  return {
    type: "virtual",
    indentation: indentation,
    subs: subs,
    label: label
  };
},__name(virtualNode, "virtualNode");

,function lineNode(indentation, lineNumber, sourceLine, subs, label) {
  if (sourceLine === "") throw new Error("Cannot create a line node with an empty source line");
  return {
    type: "line",
    indentation: indentation,
    lineNumber: lineNumber,
    sourceLine: sourceLine,
    subs: subs,
    label: label
  };
},__name(lineNode, "lineNode");

,function blankNode(line) {
  return {
    type: "blank",
    lineNumber: line,
    subs: []
  };
},__name(blankNode, "blankNode");

,function topNode(subs) {
  return {
    type: "top",
    indentation: -1,
    subs: subs != null ? subs : []
  };
},__name(topNode, "topNode");

,function isBlank(tree) {
  return tree.type === "blank";
},__name(isBlank, "isBlank");

,function isLine(tree) {
  return tree.type === "line";
},__name(isLine, "isLine");

,function isVirtual(tree) {
  return tree.type === "virtual";
},__name(isVirtual, "isVirtual");

,function isTop(tree) {
  return tree.type === "top";
},__name(isTop, "isTop");

,function cutTreeAfterLine(tree, lineNumber) {
  function cut(tree) {
    if (!isVirtual(tree) && !isTop(tree) && tree.lineNumber === lineNumber) return tree.subs = [], !0;
    for (let i = 0; i < tree.subs.length; i++) if (cut(tree.subs[i])) return tree.subs = tree.subs.slice(0, i + 1), !0;
    return !1;
  }
  __name(cut, "cut"), cut(tree);
},__name(cutTreeAfterLine, "cutTreeAfterLine");

,function duplicateTree(tree) {
  return JSON.parse(JSON.stringify(tree));
},__name(duplicateTree, "duplicateTree");