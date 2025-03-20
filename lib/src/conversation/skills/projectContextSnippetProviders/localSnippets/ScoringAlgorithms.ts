var defaultScoring = "cosine",
  algorithms = new Map([["cosine", CosineSimilarityScoring]]);

,function getScoringAlgorithm(type) {
  let mappedType = type === "default" ? defaultScoring : type,
    implementation = algorithms.get(mappedType);
  if (!implementation) throw new Error(`Scoring constructor for type ${type} not found`);
  return implementation;
},__name(getScoringAlgorithm, "getScoringAlgorithm");