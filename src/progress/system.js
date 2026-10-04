import { T } from '../core/config.js';
import { ALL_ARTS, BY_ID, BY_TECH } from './skills.js';

// ---------------------------------------------------------------------------
// The System: watches what you do (game.events) and teaches you things for it. It owns
// which Movement Arts (and their variants) are unlocked, how far along each goal is, and
// Lab mode (everything unlocked, for testing and for showing the game off).
// It never touches the core movement: a tech asks `allows(id)` before it may start, and
// reads its tuning through `cfgFor(id)`, which lays the chosen variant over T.tech[id].
//
// Progress is saved in localStorage as it happens (debounced) and can be carried between
// browsers as a short code (export / import in the Codex).
// ---------------------------------------------------------------------------

const KEY = 'foolsfortune.system.v2'; // (v2: Lab mode is the default)
const VERSION = 2;

const goalKey = (skill, i) => `${skill}#${i}`;

export class System {
  constructor(game) {
    this.game = game;
    this.state = { v: VERSION, lab: true, unlocked: {}, progress: {}, variant: {} };
    this.chain = {}; // running chain state (not saved)
    this.proxies = new Map();
    this.dirty = 0;
    this.listeners = new Set(); // UI
    this.load();
    game.events?.on('*', (e) => this.feed(e));
  }

  // ---- queries ----
  get lab() { return !!this.state.lab; }
  unlocked(id) { return !!this.state.unlocked[id]; }
  has(id) { return this.lab || this.unlocked(id) || (!id.includes('.') && !!BY_ID[id]?.basic); }
  variantId(abilityId) { const v = this.state.variant[abilityId]; return v && this.has(`${abilityId}.${v}`) ? v : null; }

  /** How many arts plus variants you own. */
  mastery() { return Object.keys(this.state.unlocked).length; }

  /** May this tech start? Body techs (swim, ladders, hanging) always; Movement Arts once learned. */
  allows(techId) {
    const a = BY_TECH[techId];
    if (!a) return true;
    return this.has(a.id);
  }

  /** The tech's tuning with the selected variant laid over it (a live view: tuning edits show through). */
  cfgFor(techId) {
    const base = T.tech[techId];
    const a = BY_TECH[techId];
    if (!a || !base) return base;
    const vid = this.variantId(a.id);
    if (!vid) return base;
    const key = `${a.id}.${vid}`;
    if (!this.proxies.has(key)) {
      const over = a.variants.find((v) => v.id === vid).cfg;
      this.proxies.set(key, new Proxy(base, { get: (t, k) => (k in over ? over[k] : t[k]) }));
    }
    return this.proxies.get(key);
  }

  /** A god art's tuning with the selected variant laid over it (T.arts[id]). */
  artCfg(id) {
    const base = T.arts[id];
    const a = BY_ID[id];
    if (!a || !base) return base;
    const vid = this.variantId(id);
    if (!vid) return base;
    const key = `art:${id}.${vid}`;
    if (!this.proxies.has(key)) {
      const over = a.variants.find((v) => v.id === vid).cfg;
      this.proxies.set(key, new Proxy(base, { get: (t, k) => (k in over ? over[k] : t[k]) }));
    }
    return this.proxies.get(key);
  }

  // ---- progress ----
  /** [0..1] for one goal, or for a skill (the mean over its goals). */
  goalFrac(skillId, i, g) { return Math.min(1, (this.state.progress[goalKey(skillId, i)] || 0) / g.n); }
  skillFrac(id, goals) { return goals.reduce((s, g, i) => s + this.goalFrac(id, i, g), 0) / goals.length; }
  goalValue(skillId, i) { return this.state.progress[goalKey(skillId, i)] || 0; }

  /** Everything still to learn right now: [{ id, goals }] (variants only once their ability is yours). */
  pending() {
    const out = [];
    for (const a of ALL_ARTS) {
      if (a.basic) { for (const v of a.variants) if (!this.unlocked(`${a.id}.${v.id}`)) out.push({ id: `${a.id}.${v.id}`, goals: v.goals, ability: a, variant: v }); continue; }
      if (!this.unlocked(a.id)) out.push({ id: a.id, goals: a.goals, ability: a });
      else for (const v of a.variants) if (!this.unlocked(`${a.id}.${v.id}`)) out.push({ id: `${a.id}.${v.id}`, goals: v.goals, ability: a, variant: v });
    }
    return out;
  }

  feed(e) {
    if (e.name === 'system.unlock' || e.name === 'system.equip') return;
    for (const sk of this.pending()) {
      let all = true;
      sk.goals.forEach((g, i) => {
        const key = goalKey(sk.id, i);
        if ((this.state.progress[key] || 0) < g.n) this.advance(sk.id, key, g, e);
        if ((this.state.progress[key] || 0) < g.n) all = false;
      });
      if (all) this.unlock(sk.id, sk);
    }
  }

  advance(skillId, key, g, e) {
    const cur = this.state.progress[key] || 0;
    const ok = (ev, when) => ev === e.name && (!when || when(e));
    let next = cur;
    if (g.type === 'count' || g.type === 'feat') { if (ok(g.event, g.when)) next = Math.min(g.n, cur + 1); }
    else if (g.type === 'sum') { if (ok(g.event, g.when)) next = Math.min(g.n, cur + (Number(e[g.field]) || 0)); }
    else if (g.type === 'chain') {
      const st = (this.chain[key] ||= { i: 0, t: -99 });
      const step = (i) => (typeof g.steps[i] === 'string' ? { event: g.steps[i] } : g.steps[i]);
      if (st.i > 0 && e.t - st.t > g.within) st.i = 0;
      if (ok(step(st.i).event, step(st.i).when)) {
        st.i++; st.t = e.t;
        if (st.i === g.steps.length) { st.i = 0; next = Math.min(g.n, cur + 1); }
      } else if (ok(step(0).event, step(0).when)) { st.i = 1; st.t = e.t; }
    }
    if (next !== cur) { this.state.progress[key] = next; this.touch(); }
  }

  unlock(id, sk) {
    if (this.state.unlocked[id]) return;
    this.state.unlocked[id] = true;
    const a = sk?.ability || BY_ID[id.split('.')[0]];
    const v = sk?.variant;
    if (v && !this.state.variant[a.id]) this.state.variant[a.id] = v.id; // (the first variant you earn is picked up)
    this.touch(true);
    this.game.events?.emit('system.unlock', { id, ability: a.id, variant: v?.id || null, title: v ? v.name : a.name });
    this.changed();
  }

  // ---- variants ----
  setVariant(abilityId, variantId) {
    if (variantId && !this.has(`${abilityId}.${variantId}`)) return false;
    this.state.variant[abilityId] = variantId || null;
    this.touch(true); this.changed();
    return true;
  }

  setLab(on) { this.state.lab = !!on; this.touch(true); this.changed(); }

  // ---- saving ----
  touch(now = false) { if (now) this.save(); else if (!(this.dirty > 0)) this.dirty = 3; }

  changed() { for (const fn of this.listeners) fn(); }

  /** Per frame: flush progress that changed a while ago. */
  tick(dt) {
    if (this.dirty > 0) { this.dirty -= dt; if (this.dirty <= 0) this.save(); }
  }

  save() {
    this.dirty = 0;
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* storage unavailable */ }
  }

  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* storage unavailable or corrupt */ }
    if (raw) this.adopt(raw);
  }

  /** Take a saved state, keeping only what this build knows about. */
  adopt(raw) {
    const known = new Set();
    for (const a of ALL_ARTS) { known.add(a.id); for (const v of a.variants) known.add(`${a.id}.${v.id}`); }
    const s = { v: VERSION, lab: raw.lab !== false, unlocked: {}, progress: {}, variant: {} };
    for (const k of Object.keys(raw.unlocked || {})) if (known.has(k) && raw.unlocked[k]) s.unlocked[k] = true;
    for (const [k, v] of Object.entries(raw.progress || {})) if (Number.isFinite(v) && v >= 0) s.progress[k] = v;
    for (const [id, v] of Object.entries(raw.variant || {})) if (BY_ID[id] && (!v || s.unlocked[`${id}.${v}`])) s.variant[id] = v;
    this.state = s;
    this.proxies.clear();
    this.chain = {};
  }

  reset() {
    this.adopt({});
    this.save();
    this.changed();
  }

  /** A short code carrying the whole save between browsers: FFS1.<base64>.<checksum>. */
  exportCode() {
    const body = btoa(unescape(encodeURIComponent(JSON.stringify(this.state)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `FFS1.${body}.${checksum(body)}`;
  }

  importCode(code) {
    const m = /^FFS1\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/.exec(String(code).trim());
    if (!m || checksum(m[1]) !== m[2]) return false;
    try {
      const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))));
      this.adopt(JSON.parse(json));
      this.save();
      this.changed();
      return true;
    } catch { return false; }
  }
}

/** FNV-1a, 8 hex digits: enough to catch a mangled paste. */
function checksum(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
