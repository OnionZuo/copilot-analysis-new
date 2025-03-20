function hasKey(value, key) {
  return value !== null && typeof value == "object" && key in value;
},__name(hasKey, "hasKey");

,function getKey(value, key) {
  return hasKey(value, key) ? value[key] : void 0;
},__name(getKey, "getKey");