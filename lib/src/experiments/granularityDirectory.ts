var BUCKETFILTER = "X-Copilot-ClientTimeBucket",
  _GranularityDirectory = class _GranularityDirectory {
    constructor(prefix, clock) {
      this.specs = new Map();
      this.prefix = prefix, this.clock = clock, this.defaultGranularity = DEFAULT_GRANULARITY(prefix);
    }
    selectGranularity(filters) {
      for (let [rememberedFilters, granularity] of this.specs.entries()) if (filters.extends(rememberedFilters)) return granularity;
      return this.defaultGranularity;
    }
    update(filters, byCallBuckets, timePeriodSizeInH) {
      if (byCallBuckets = byCallBuckets > 1 ? byCallBuckets : NaN, timePeriodSizeInH = timePeriodSizeInH > 0 ? timePeriodSizeInH : NaN, isNaN(byCallBuckets) && isNaN(timePeriodSizeInH)) this.specs.delete(filters);else {
        let newGranularity = new TimeBucketGranularity(this.prefix);
        isNaN(byCallBuckets) || newGranularity.setByCallBuckets(byCallBuckets), isNaN(timePeriodSizeInH) || newGranularity.setTimePeriod(timePeriodSizeInH * 3600 * 1e3), this.specs.set(filters, newGranularity);
      }
    }
    extendFilters(filters) {
      let implementation = this.selectGranularity(filters),
        [value, upcomingValues] = implementation.getCurrentAndUpComingValues(this.clock.now());
      return {
        newFilterSettings: filters.withChange(BUCKETFILTER, value),
        otherFilterSettingsToPrefetch: upcomingValues.map(value => filters.withChange(BUCKETFILTER, value))
      };
    }
  };

,__name(_GranularityDirectory, "GranularityDirectory");

,var GranularityDirectory = _GranularityDirectory;