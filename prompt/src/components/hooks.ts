var _UseState = class _UseState {
  constructor(states) {
    this.states = states;
    this.currentIndex = 0;
    this.stateChanged = !1;
  }
  useState(initialState) {
    let index = this.currentIndex;
    if (this.states[index] === void 0) {
      let initial = typeof initialState == "function" ? initialState() : initialState;
      this.states[index] = initial;
    }
    let setState = __name(newState => {
      let nextState = typeof newState == "function" ? newState(this.states[index]) : newState;
      this.states[index] = nextState, this.stateChanged = !0;
    }, "setState");
    return this.currentIndex++, [this.states[index], setState];
  }
  hasChanged() {
    return this.stateChanged;
  }
};

,__name(_UseState, "UseState");

,var UseState = _UseState,
  _UseData = class _UseData {
    constructor(measureUpdateTime) {
      this.measureUpdateTime = measureUpdateTime;
      this.consumers = [];
    }
    useData(typePredicate, consumer) {
      this.consumers.push({
        predicate: typePredicate,
        consumer: __name(data => {
          if (typePredicate(data)) return consumer(data);
        }, "consumer")
      });
    }
    async updateData(data) {
      if (this.consumers.length > 0) {
        let start = performance.now();
        for (let {
          predicate: predicate,
          consumer: consumer
        } of this.consumers) predicate(data) && (await consumer(data));
        this.measureUpdateTime(performance.now() - start);
      }
    }
  };

,__name(_UseData, "UseData");

,var UseData = _UseData,
  _UseEffect = class _UseEffect {
    constructor() {
      this.effects = [];
      this.cleanupFunctions = [];
    }
    useEffect(effect) {
      this.effects.push(effect);
    }
    async runEffects() {
      for (let effect of this.effects) {
        let cleanup = await effect();
        cleanup && this.cleanupFunctions.push(cleanup);
      }
      this.effects = [];
    }
    async cleanup() {
      for (let cleanup of this.cleanupFunctions) await cleanup();
    }
  };

,__name(_UseEffect, "UseEffect");

,var UseEffect = _UseEffect;