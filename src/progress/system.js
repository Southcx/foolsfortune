// ---------------------------------------------------------------------------
// The System: teaches you things for what you do. Every art and variant is the reward of an
// achievement (achievements.js: `art_<id>`, its goals predicates over the ledger: skills.js), so
// the System counts nothing itself: it reads how far each goal has come from the ledger, and
// unlocks an art once its achievement is done (retroactive, as every achievement is). It owns
// which arts are unlocked, the variant chosen for each, and the all-arts switch (`lendAll`:
// every art lent, for testing and for showing the game off).
// It never touches the core movement: a tech asks `allows(id)` before it may start, and
// reads its tuning through `cfgFor(id)`, which lays the chosen variant over T.tech[id].
//
// Progress is kept in the save's player scope (core/save.js, section 'system'), marked a few seconds after it changes, and can be carried between
// browsers as a short code (export / import in the Codex).
// ---------------------------------------------------------------------------
import { T } from '../core/config.js';
import { ALL_ARTS, BY_ID, BY_TECH, achOf, goalFracOf } from './skills.js';


const VERSION = 2;

export class System {
  constructor(game) {
    this.game = game;
    this.state = { v: VERSION, lendAll: true, unlocked: {}, variant: {} };
    this.checkT = 0;
    this.proxies = new Map();
    this.dirty = 0;
    this.listeners = new Set(); // UI
    game.save?.section('system', { scope: 'player', version: 1, dump: () => this.state, load: (d) => this.adopt(d || {}), reset: () => this.adopt({}) }); // (core/save.js)
  }

  // ---- queries ----
  get lendAll() { return !!this.state.lendAll; }
  unlocked(id) { return !!this.state.unlocked[id]; }
  has(id) { return this.lendAll || this.unlocked(id) || (!id.includes('.') && !!BY_ID[id]?.basic); }
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

  // ---- progress (read from the ledger) ----
  /** [0..1] for one goal, or for a skill (the mean over its goals). */
  goalFrac(skillId, i, g) { return goalFracOf(this.game.ledger, g); }
  skillFrac(id, goals) { return goals.length ? goals.reduce((s, g, i) => s + this.goalFrac(id, i, g), 0) / goals.length : 1; }
  goalValue(skillId, i) { const sk = this.skill(skillId); const g = sk?.goals[i]; return g ? (this.game.ledger?.get(g.key) || 0) : 0; }
  /** An art or a variant by id ('blink', 'blink.rush'), with its goals. */
  skill(id) {
    const [aid, vid] = id.split('.'), a = BY_ID[aid];
    if (!a) return null;
    return vid ? { id, ability: a, variant: a.variants.find((v) => v.id === vid), goals: a.variants.find((v) => v.id === vid)?.goals || [] } : { id, ability: a, goals: a.goals };
  }

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

  /** Unlock whatever's achievement is done (a variant once its ability is yours): run a few times a second, and at once on load. */
  check() {
    const done = this.game.ledger?.done || {};
    let again = true;
    while (again) { // (an ability unlocked this pass opens its variants to the next)
      again = false;
      for (const sk of this.pending()) if (done[achOf(sk.id)] !== undefined) { this.unlock(sk.id, sk); again = true; } // (done at play time 0 is 0)
    }
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

  setLendAll(on) { this.state.lendAll = !!on; this.touch(true); this.changed(); }

  // ---- saving ----
  touch(now = false) { if (now) this.save(); else if (!(this.dirty > 0)) this.dirty = 3; }

  changed() { for (const fn of this.listeners) fn(); }

  /** Per frame: unlock what the achievements have earned (twice a second), and flush what changed a while ago. */
  tick(dt) {
    this.checkT -= dt;
    if (this.checkT <= 0) { this.checkT = 0.5; this.check(); }
    if (this.dirty > 0) { this.dirty -= dt; if (this.dirty <= 0) this.save(); }
  }

  /** Mark the System for the save (core/save.js writes the player scope whole at the end of the frame). */
  save() { this.dirty = 0; this.game.save?.dirty('system'); }

  /** Take a saved state, keeping only what this build knows about. */
  adopt(raw) {
    const known = new Set();
    for (const a of ALL_ARTS) { known.add(a.id); for (const v of a.variants) known.add(`${a.id}.${v.id}`); }
    const s = { v: VERSION, lendAll: (raw.lendAll ?? raw.lab) !== false, unlocked: {}, variant: {} };
    for (const k of Object.keys(raw.unlocked || {})) if (known.has(k) && raw.unlocked[k]) s.unlocked[k] = true;
    for (const [id, v] of Object.entries(raw.variant || {})) if (BY_ID[id] && (!v || s.unlocked[`${id}.${v}`])) s.variant[id] = v;
    this.state = s;
    this.proxies.clear();
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
