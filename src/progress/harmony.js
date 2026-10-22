// ---------------------------------------------------------------------------------------
// THE GARDEN'S HARMONY: how calm or overgrown each planetoid of the Spirit Garden is, 0 (briar) to 1 (calm), resting at 0.5
// (docs/plans/GARDEN-COZY.md section A, a plan the owner prunes; plain-named until the owner rules). The garden is the Courier's own
// psyche made ground (LORE.md, proposed), so it follows the mental state's law: what is carried in pushes it toward briar, quiet tending
// settles it toward calm. It is a modifier with a source you can see (DESIGN.md 22, "base change bad"): thorns grow where their cause is
// (the arrival lotus for what you carried in, the Mulberry Grove for a spirit left waiting), and no rule of the garden changes. Nothing is
// ever lost: thorns slow and block spreading, pruning one is a stroke, and both bloom and briar ease back to rest on their own.
//
// Prior art: Animal Crossing's once-a-day acts (a soft daily cap: a visit is worth more than a marathon), its weeds (neglect costs
// chores, never things), Viva Pinata's sours (the bad state a creature with its own life, tameable, never a corruption of your land),
// Black & White (both alignments change the land and both are playable), Okami (lifting the blight is the reward you see), and
// Darkest Dungeon's stress (a meter moved by what you do and settled by rest, as the mental state already is).
//
//   HARMONY, TEND, CARRY, NEGLECT, THORNS, BRIAR   bandOf(h) -> 'briar' | 'between' | 'bloom'   briarOf(h) -> 0 comfort .. 1 briar
//   carriedIn({ v, brimming }) -> negative   dayStep(p, { held }) -> { h, thorns, grew }   (pure: scripts/garden.mjs measures them)
//   game.harmony = new Harmony(game)   .update(dt)   .of(planetoid) -> 0..1   .band(planetoid)   .briarK(planetoid?) -> 0..1 (the looks')   .thorns(planetoid) -> [{ at, n }]
//   .prune(planetoid) -> { ok, cutting }   (the world's pruning stroke calls it; Petra's)   /harmony
//   events: garden.tend { planetoid, kind, h }   garden.harmony { planetoid, band, was, h, blooming }   garden.thorn { planetoid, at, n }
//           garden.prune { planetoid, n, h }   garden.briar.held { planetoid, days }   garden.harmony.ask { planets }
// ---------------------------------------------------------------------------------------
import { today } from '../core/calendar.js';

/** The gauge: a planetoid at rest is 0.5; under `briar` it grows thorns, over `bloom` it blooms (both shown, never said as a number).
 *  `drift`: how far it eases back to rest a game day untouched (so bloom wants a visit now and then, and briar fades by itself in a
 *  week of game days: no state is permanent). */
export const HARMONY = { rest: 0.5, briar: 0.35, bloom: 0.75, drift: 0.02, catchUp: 7, look: 1 };
/** Tending: each kind counts once a planetoid a game day (the soft cap), +`each`, at most +`cap` a planetoid a game day. The kinds are
 *  the garden's quiet acts; sculpting, painting and the hand's other work are play and never move it (SPIRIT-GARDEN.md, GROUND). */
export const TEND = { each: 0.05, cap: 0.25, kinds: ['water', 'harvest', 'plant', 'feed', 'pet', 'wish', 'rest'] };
/** What is carried in: entering above Balanced (the mental state's v over 0.5) lowers the Dantian by (v - 0.5) x `per` (Prismatic, v 1,
 *  is -0.2), and an overflow on entering by `brim` more. Laid at the arrival lotus, where it came in. */
export const CARRY = { per: 0.4, brim: 0.1, at: 'dantian', where: 'lotus' };
/** What waits: while a spirit goes unvisited (fed, petted, drilled, raced, sparred) past `grace` game days, the Mulberry Grove's rest is
 *  held `per` lower, `max` in all: a modifier held while its cause stands and gone the moment the spirit is visited, so the Grove
 *  drifts toward it a game day at a time and back. One or two forgotten spirits are a nudge, three or more an overgrown Grove in a
 *  week of game days (measured: scripts/garden-cozy.mjs; the Horseshoe report's "no needy companions", so the grace is three). */
export const NEGLECT = { grace: 3, per: 0.06, max: 0.3, at: 'mulberryGrove', where: 'spirit' };
/** Thorns: one grows a game day on a planetoid under HARMONY.briar, at its newest cause, up to `max`; pruning one gives `prune` back and
 *  a briar cutting (a material of Gall's kind, the cutting's only source: GARDEN-COZY.md E3). */
export const THORNS = { max: 6, prune: 0.03 };
/** The briar garden as a choice (GARDEN-COZY.md A6): Fury, Gall and Dread spirits gain `bond` a game day while their planetoid is in
 *  briar; briar fruit grows only on thorns. (The bond is applied by the spirits' keeper when built; the number is here.) */
export const BRIAR = { likes: ['fury', 'gall', 'dread'], bond: 1 };

const clamp = (x) => Math.max(0, Math.min(1, x));
/** A harmony as the look's scalar: 0 comfort (bloom and over) .. 1 briar (harmony 0). */
export const briarOf = (h) => Math.max(0, Math.min(1, (HARMONY.bloom - h) / HARMONY.bloom));
export const bandOf = (h) => (h < HARMONY.briar ? 'briar' : h > HARMONY.bloom ? 'bloom' : 'between');

/** What entering the garden carries in: 0 at or below Balanced, down to -(CARRY.per / 2 + CARRY.brim) from Prismatic brimming. */
export function carriedIn({ v = 0.5, brimming = false } = {}) {
  return -(Math.max(0, v - 0.5) * CARRY.per + (brimming ? CARRY.brim : 0));
}

/** One game day passing on a planetoid (pure): the drift toward its rest (lowered while spirits wait: NEGLECT), a thorn grown in briar.
 *  `p` = { h, thorns: [{ at, n }], cause }   `held` = how far its rest is held down today (0..NEGLECT.max). Returns the new state. */
export function dayStep(p, { held = 0 } = {}) {
  let h = p.h ?? HARMONY.rest;
  const rest = HARMONY.rest - Math.min(NEGLECT.max, held);
  h = clamp(h + Math.sign(rest - h) * Math.min(Math.abs(rest - h), HARMONY.drift));
  const thorns = (p.thorns || []).map((t) => ({ ...t }));
  const count = thorns.reduce((n, t) => n + t.n, 0);
  let grew = null;
  if (h < HARMONY.briar && count < THORNS.max) {
    const at = p.cause || 'any', t = thorns.find((x) => x.at === at);
    if (t) t.n++; else thorns.push({ at, n: 1 });
    grew = at;
  }
  return { h, thorns, grew };
}

const fresh = () => ({ day: null, by: {}, seen: {}, tended: {}, carried: 0 });
const blank = () => ({ h: HARMONY.rest, thorns: [], cause: null });

export class Harmony {
  constructor(game) {
    this.game = game; this.s = fresh(); this.lookT = 0;
    game.save?.section('harmony', { scope: 'player', version: 1,
      dump: () => this.s,
      load: (d) => { if (d && typeof d.by === 'object') this.s = { ...fresh(), ...d }; },
      reset: () => { this.s = fresh(); } });
    const E = game.events;
    if (E) {
      const where = (e) => e.planetoid || game.realm?.jarBody?.planet?.id || 'dantian'; // (an act's planetoid: the event's, else where the Pneuka Jar stands)
      const tend = (kind) => (e) => { if (e.by === 'courier') this.tend(where(e), kind); };
      E.on('garden.water', tend('water'));
      E.on('garden.harvest', tend('harvest'));
      E.on('garden.plant', tend('plant'));
      const spirit = (kind) => (e) => { if (e.by !== 'courier') return; this.visit(e); if (kind) this.tend(NEGLECT.at, kind); };
      E.on('spirit.feed', spirit('feed'));
      E.on('spirit.pet', spirit('pet'));
      E.on('spirit.drill', spirit(null));
      E.on('spirit.race.start', (e) => { if (e.by === 'courier') for (const r of e.runners || []) this.visit({ spirit: r }); });
      E.on('spirit.spar.start', (e) => { if (e.by === 'courier') { this.visit({ spirit: e.a }); this.visit({ spirit: e.b }); } });
      E.on('garden.enter', (e) => { if (e.by === 'courier') this.enter(); });
    }
    game.chat?.add?.('harmony', { help: 'how calm or overgrown each planetoid of your garden is: /harmony', run: () => this.game.events?.emit('garden.harmony.ask', { planets: this.list(), by: 'courier' }) });
  }
  planet(id) { return (this.s.by[id] ||= blank()); }
  of(id) { return this.s.by[id]?.h ?? HARMONY.rest; }
  band(id) { return bandOf(this.of(id)); }
  /** The one scalar every look and sound lever reads (Calissa's ask, 2026-10-22): 0 comfort .. 1 briar, from a planetoid's harmony
   *  (0 at bloom and over, about 0.33 at rest: the abandoned moss garden, never ugly; 0.53 at the briar's edge; 1 at harmony 0). With
   *  no planetoid, the one the Pneuka Jar stands on. */
  briarK(id = this.game.realm?.jarBody?.planet?.id) { return briarOf(this.of(id)); }
  thorns(id) { return this.s.by[id]?.thorns || []; }
  list() { return Object.entries(this.s.by).map(([planetoid, p]) => ({ planetoid, band: bandOf(p.h), thorns: p.thorns.reduce((n, t) => n + t.n, 0) })); }
  /** A gauge moved: the band said once it changes (the log's line, the look's cue). */
  set(id, h, cause) {
    const p = this.planet(id), was = bandOf(p.h);
    p.h = clamp(h); if (cause) p.cause = cause;
    const band = bandOf(p.h);
    if (band !== was) this.game.events?.emit('garden.harmony', { planetoid: id, band, was, h: +p.h.toFixed(3), blooming: this.blooming(), by: 'courier' });
    this.game.save?.dirty('harmony');
  }
  /** How many planetoids are in bloom now (In Full Bloom's count). */
  blooming() { return Object.values(this.s.by).filter((p) => bandOf(p.h) === 'bloom').length; }
  /** A quiet act on a planetoid: once a kind a game day, up to TEND.cap. */
  tend(id, kind) {
    this.roll();
    const T = (this.s.tended[id] ||= { kinds: [], gained: 0 });
    if (T.kinds.includes(kind) || T.gained >= TEND.cap - 1e-9) return false;
    const add = Math.min(TEND.each, TEND.cap - T.gained);
    T.kinds.push(kind); T.gained += add;
    this.set(id, this.of(id) + add);
    this.game.events?.emit('garden.tend', { planetoid: id, kind, h: +this.of(id).toFixed(3), by: 'courier' });
    return true;
  }
  /** A spirit visited: its waiting starts over (keyed by its name, else its kind). */
  visit(e) { const k = e.spirit || e.kind; if (k) { this.s.seen[k] = today(); this.game.save?.dirty('harmony'); } }
  /** Entering the garden: what the mental state carries in is laid at the arrival lotus (and the game days missed are caught up). */
  enter() {
    this.roll();
    const M = this.game.courierMind, d = -carriedIn({ v: M?.v ?? 0.5, brimming: !!M?.brimming }), more = d - (this.s.carried || 0);
    if (more > 1e-9) { this.s.carried = d; this.set(CARRY.at, this.of(CARRY.at) - more, CARRY.where); } // (the most carried in counts once a game day: going in and out is no deeper)
  }
  /** How far the Grove's rest is held down on a game day: NEGLECT.per for each spirit bound and unseen past NEGLECT.grace game days. */
  owed(day) {
    let n = 0;
    for (const e of this.game.bound?.list || []) {
      const k = e.name || e.kind; if (!k) continue;
      const seen = this.s.seen[k] ?? (this.s.seen[k] = day); // (a spirit first seen now starts its count today)
      if (day - seen > NEGLECT.grace) n += NEGLECT.per;
    }
    return Math.min(NEGLECT.max, n);
  }
  /** The game days passed since the last look, each stepped (at most HARMONY.catchUp: a month away is a week's weeds, never more). */
  roll() {
    const day = today();
    if (this.s.day == null) { this.s.day = day; return; }
    if (day === this.s.day) return;
    const steps = Math.min(HARMONY.catchUp, day - this.s.day);
    if (this.game.bound?.list?.length) this.planet(NEGLECT.at); // (the Grove keeps its own gauge once spirits live there)
    for (let i = steps; i >= 1; i--) {
      const d = day - i + 1;
      for (const [id, p] of Object.entries(this.s.by)) {
        const owe = id === NEGLECT.at ? this.owed(d) : 0;
        const was = bandOf(p.h);
        const r = dayStep(owe > 0 ? { ...p, cause: NEGLECT.where } : p, { held: owe });
        p.h = r.h; p.thorns = r.thorns; if (owe > 0) p.cause = NEGLECT.where;
        if (r.grew) this.game.events?.emit('garden.thorn', { planetoid: id, at: r.grew, n: r.thorns.reduce((n, t) => n + t.n, 0), by: 'environment' });
        const band = bandOf(p.h);
        if (band !== was) this.game.events?.emit('garden.harmony', { planetoid: id, band, was, h: +p.h.toFixed(3), blooming: this.blooming(), by: 'environment' });
        p.held = band === 'briar' ? (p.held || 0) + 1 : 0; // (game days kept in briar in a row: the briar way's count, GARDEN-COZY.md A6)
        if (p.held) this.game.events?.emit('garden.briar.held', { planetoid: id, days: p.held, by: 'courier' });
      }
    }
    this.s.day = day; this.s.tended = {}; this.s.carried = 0;
    this.game.save?.dirty('harmony');
  }
  /** One thorn pruned on a planetoid (the god hand's stroke: the world calls it): its harmony back a little, a briar cutting for the
   *  Pneuka Box (the caller gives it: `cutting` says one is owed). */
  prune(id) {
    const p = this.s.by[id], t = p?.thorns.find((x) => x.n > 0);
    if (!t) return { ok: false };
    t.n--; p.thorns = p.thorns.filter((x) => x.n > 0);
    this.set(id, p.h + THORNS.prune);
    this.game.events?.emit('garden.prune', { planetoid: id, n: p.thorns.reduce((n, x) => n + x.n, 0), h: +p.h.toFixed(3), by: 'courier' });
    return { ok: true, cutting: true };
  }
  update(dt = 0) {
    if ((this.lookT -= dt) > 0) return; this.lookT = HARMONY.look;
    this.roll();
  }
}
