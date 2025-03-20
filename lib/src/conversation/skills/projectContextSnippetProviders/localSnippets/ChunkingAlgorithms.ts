var defaultChunking = "fixedSize",
  algorithms = new Map([["fixedSize", FixedSizeChunking]]);

,function getChunkingAlgorithm(type) {
  let mappedType = type === "default" ? defaultChunking : type,
    implementation = algorithms.get(mappedType);
  if (!implementation) throw new Error(`Chunking constructor for type ${type} not found`);
  return implementation;
},__name(getChunkingAlgorithm, "getChunkingAlgorithm");