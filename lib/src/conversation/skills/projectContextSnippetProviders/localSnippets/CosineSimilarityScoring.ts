var _CosineSimilarityScoring = class _CosineSimilarityScoring {
  score(vector1, vector2) {
    let mag1 = Math.sqrt(vector1.reduce((acc, value) => acc + value * value, 0)),
      mag2 = Math.sqrt(vector2.reduce((acc, value) => acc + value * value, 0));
    return vector1.reduce((acc, value, idx) => acc + value * vector2[idx], 0) / (mag1 * mag2);
  }
  terminateScoring() {}
};

,__name(_CosineSimilarityScoring, "CosineSimilarityScoring");

,var CosineSimilarityScoring = _CosineSimilarityScoring;