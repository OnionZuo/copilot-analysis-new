function weighElidableList(elidableDocs, weightStrategy) {
  if (elidableDocs.length == 0) return new ElidableText([]);
  let weightedElidableDocs = elidableDocs.map((elidableDoc, index) => {
    let weight;
    switch (weightStrategy) {
      case "linear":
        weight = 1 - index / elidableDocs.length;
        break;
      case "inverseLinear":
        weight = (index + 1) / elidableDocs.length;
        break;
      case "positional":
        weight = 1 / (index + 1);
        break;
      case "inversePositional":
        weight = 1 / (elidableDocs.length - index);
        break;
    }
    return Array.isArray(elidableDoc) && elidableDoc.length == 2 && (weight *= elidableDoc[1], elidableDoc = elidableDoc[0]), [elidableDoc, weight];
  });
  return new ElidableText(weightedElidableDocs);
},__name(weighElidableList, "weighElidableList");