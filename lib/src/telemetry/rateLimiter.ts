var _ExceptionRateLimiter = class _ExceptionRateLimiter {
  constructor(perMinute = 5) {
    this.perMinute = perMinute;
    this.cache = new LRUCacheMap();
  }
  isThrottled(key) {
    let now = Date.now(),
      recent = this.cache.get(key) || new Array(this.perMinute).fill(0);
    return now - recent[0] < 6e4 ? !0 : (recent.push(now), recent.shift(), this.cache.set(key, recent), !1);
  }
};

,__name(_ExceptionRateLimiter, "ExceptionRateLimiter");

,var ExceptionRateLimiter = _ExceptionRateLimiter;