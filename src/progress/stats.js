// ---------------------------------------------------------------------------------------
// STATS: the quiet ledger behind everything the game says and every achievement. Nothing here is shown as it
// happens; it is counted, and the log (gamelog.js) and the achievements (achievements.js) read from it.
//
// What is kept, after how Old School RuneScape and Final Fantasy XIV keep theirs:
//  - COUNTERS that only go up (OSRS: kill counts, XP; FFXIV: the number behind each achievement), each kept for the
//    lifetime and for this session, with dotted keys that group them ('move.jump', 'break.kind.jar', 'time.tech.blink').
//  - RECORDS, a best value with when and where it was set (OSRS hiscores rank a score and then "the time to reach
//    it"; personal bests in a speed log). `hi` keeps the largest, `lo` the smallest (a best time).
//  - FIRSTS: the first time something ever happened, timestamped in play time (OSRS's collection log slots: a fixed
//    set of things to have seen, shared between every way of seeing them, so a slot is by thing, not by source).
//  - DONE: which achievements are complete, and when (FFXIV keeps the date of every one).
// Retroactive by construction: achievements are predicates over these numbers, so anything counted counts (OSRS
// made its kill-count combat tasks retroactive the same way). Kept in the save's player scope (core/save.js, section 'ledger'), written a
// few seconds after it changes.
//
//   stats.inc('move.jump')                          a counter
//   stats.hi('speed.max', 13.2, { at: 'the workshop' })   -> 'new' (first ever), 'beat' (a real improvement), or false
//   stats.lo('circuit.braid.time', 41.2)
//   stats.first('kind.jar')                         -> true the first time
// ---------------------------------------------------------------------------------------
export class Stats {
  constructor(save = null) {
    this.life = {}; this.rec = {}; this.firsts = {}; this.done = {};
    this.sess = {};
    this.play = 0;      // lifetime seconds of play
    this.sessionT = 0;  // this session's
    this.sessions = 0;
    this.dirty = 0;
    this.version = 0;   // bumps on any change (the achievement check reads it)
    this.store = save;
    save?.section('ledger', { scope: 'player', version: 1, dump: () => this.dump(), load: (d) => this.load(d), reset: () => this.clear() });
    this.sessions++;
  }

  // ---- counters
  inc(key, n = 1) {
    if (!(n > 0)) return;
    this.life[key] = (this.life[key] || 0) + n;
    this.sess[key] = (this.sess[key] || 0) + n;
    this.touch();
  }
  get(key) { return this.life[key] || 0; }
  session(key) { return this.sess[key] || 0; }
  /** Everything at or under a prefix: [[key, value]] */
  under(prefix) { return Object.entries(this.life).filter(([k]) => k.startsWith(prefix)); }

  // ---- records
  hi(key, v, meta = {}) {
    const r = this.rec[key];
    if (r && v <= r.v) return false;
    this.rec[key] = { v, t: this.play, ...meta };
    this.touch();
    return r ? (v >= r.v * 1.05 + 1e-9 ? 'beat' : 'small') : 'new';
  }
  lo(key, v, meta = {}) {
    const r = this.rec[key];
    if (r && v >= r.v) return false;
    this.rec[key] = { v, t: this.play, ...meta };
    this.touch();
    return r ? (v <= r.v * 0.98 ? 'beat' : 'small') : 'new';
  }
  best(key) { return this.rec[key]?.v; }

  // ---- firsts
  first(key) {
    if (this.firsts[key] !== undefined) return false;
    this.firsts[key] = this.play;
    this.touch();
    return true;
  }
  has(key) { return this.firsts[key] !== undefined; }
  firstCount(prefix = '') { return Object.keys(this.firsts).filter((k) => k.startsWith(prefix)).length; }

  // ---- time
  tick(dt) {
    this.play += dt; this.sessionT += dt;
    if (this.dirty > 0) { this.dirty -= dt; if (this.dirty <= 0) this.save(); }
  }

  touch() { this.version++; if (!(this.dirty > 0)) this.dirty = 5; }

  /** Mark the ledger for the save (core/save.js writes the player scope whole at the end of the frame). */
  save() { this.dirty = 0; this.store?.dirty('ledger'); }
  dump() { return { life: this.life, rec: this.rec, firsts: this.firsts, done: this.done, play: this.play, sessions: this.sessions }; }
  load(raw) {
    if (!raw || typeof raw !== 'object') return;
    this.life = raw.life || {}; this.rec = raw.rec || {}; this.firsts = raw.firsts || {}; this.done = raw.done || {};
    this.play = raw.play || 0; this.sessions = raw.sessions || 0;
    this.version++;
  }
  clear() { this.life = {}; this.rec = {}; this.firsts = {}; this.done = {}; this.sess = {}; this.play = 0; this.sessions = 0; this.version++; }

  reset() { this.clear(); this.sessions = 1; this.save(); }
}
