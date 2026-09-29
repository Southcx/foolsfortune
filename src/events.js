// A tiny event bus. Movement, techs, targets and the level report what happened
// (`game.events.emit('slam.impact', { height: 52, target: true })`) and anything that cares
// listens: the System (unlocks), the stress test, tests. Emitting never throws into the
// caller, and the last few hundred events are kept for inspection.

export class Events {
  constructor() {
    this.handlers = new Map();
    this.log = [];
    this.counts = {};
    this.time = 0; // game seconds (main advances it)
  }

  /** Listen for one event name, or '*' for all. Returns an unsubscribe function. */
  on(name, fn) {
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name).add(fn);
    return () => this.handlers.get(name)?.delete(fn);
  }

  emit(name, data = {}) {
    const e = { ...data, name, t: this.time };
    this.counts[name] = (this.counts[name] || 0) + 1;
    this.log.push(e);
    if (this.log.length > 300) this.log.shift();
    for (const key of [name, '*']) {
      const set = this.handlers.get(key);
      if (!set) continue;
      for (const fn of [...set]) {
        try { fn(e); } catch (err) { console.error(`event handler for ${name}:`, err); }
      }
    }
    return e;
  }

  /** Most recent event with this name (tests). */
  last(name) {
    for (let i = this.log.length - 1; i >= 0; i--) if (this.log[i].name === name) return this.log[i];
    return null;
  }
}
