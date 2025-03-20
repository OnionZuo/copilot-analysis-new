var defaultRanking = "bm25",
  algorithms = new Map([["bm25", BM25Ranking]]);

,function getRankingAlgorithm(type) {
  let mappedType = type === "default" ? defaultRanking : type,
    implementation = algorithms.get(mappedType);
  if (!implementation) throw new Error(`Ranking constructor for type ${type} not found`);
  return implementation;
},__name(getRankingAlgorithm, "getRankingAlgorithm");