// ---------------------------------------------------------------------------------------
// SOUL ALCHEMY: the spirit press in the Spirit Garden (docs/DESIGN.md, section 16; SYSTEMS.md, D2). The Courier has a SOUL COLOUR, a hue
// and a saturation on the wheel (it starts grey, at the centre). Pressing materials walks it along each one's winding path, in the order
// they go into the hopper (progress/econ/materials.js); FIRING the press while the colour sits inside an ATTRIBUTE's target raises that
// attribute a rank and spends refined Lachryma (cubes: the long sink). The target narrows with every rank, so the skill is the
// navigation. An attribute widens the VESSEL (what the Courier is), as a domain widens the tools (what the Courier does): never a skill.
//
// Prior art: Potion Craft (ingredients as paths across a map, the order of them the craft, a potion a place you steer to), the owner's
// design document v0.1 (the attributes, raised at the shrine; Luck kept apart), Atelier's synthesis, and a painter's colour wheel.
//
//   ATTRIBUTES[id] = { id, name, hue, does, widen: { key: { mult | plus, atMax } } }   targetOf(id) -> { h, s }   radiusAt(rank)   fuelAt(rank)
//   game.alchemy = new SoulAlchemy(game)   .colour   .rank(id)   .press(slots) -> { colour, trail }   .near() -> id | null
//   .fire() -> { ok, why?, attribute?, rank? }   .widen(key) -> a multiplier, or a bonus to a count (1 / +0 at rank 0)
//   SEASONING (event -> attribute, points, when)   swatchRadius(rank, seasoning, formation)   aimedFuel(rank, d, r)   isTrue(d, r)
//   complementGrey(colour, hue)   (the press's new rules: docs/plans/SOUL-ALCHEMY.md, the owner's laws of 2026-10-08)
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { press, distance } from './econ/materials.js';
import { DAY_MS, now as calNow } from '../core/calendar.js';

const A = ECON.alchemy, M = (n) => Math.max(1, Math.round(n * ECON.perMinute));

/** The seven, a seventh of the wheel apart, each widening the vessel. */
export const ATTRIBUTES = {
  willpower:     { name: 'Willpower',     does: "the shield's pool",                              widen: { 'willpower.shield': { mult: true, atMax: 1.5 } } },
  focus:         { name: 'Focus',         does: 'how long the statuses you build hold',             widen: { 'focus.hold': { mult: true, atMax: 1.3 } } },
  charisma:      { name: 'Charisma',      does: 'what the folk pay and ask (prices, the haggle)',   widen: { 'charisma.trade': { mult: true, atMax: 1.15 } } },
  perception:    { name: 'Perception',    does: "how far ahead a creature's intent shows",          widen: { 'perception.notice': { mult: true, atMax: 1.5 } } },
  dexterity:     { name: 'Dexterity',     does: 'drawing and stowing a tool',                       widen: { 'dexterity.draw': { mult: true, atMax: 1.3 } } },
  visualization: { name: 'Visualization', does: 'the canvas the Soul Brush and the hand work on',   widen: { 'visualization.canvas': { mult: true, atMax: 1.4 } } },
  resilience:    { name: 'Resilience',    does: 'the clay mending, and the hits a ship bears',      widen: { 'resilience.mend': { mult: true, atMax: 1.5 }, 'resilience.bears': { plus: true, atMax: 2 } } },
};
Object.entries(ATTRIBUTES).forEach(([id, a], i) => { a.id = id; a.hue = Math.round(i * 360 / 7 + 20); });
const KNOB = Object.fromEntries(Object.values(ATTRIBUTES).flatMap((a) => Object.entries(a.widen).map(([k, w]) => [k, { ...w, attr: a.id }])));

export const targetOf = (id) => ({ h: ATTRIBUTES[id].hue, s: A.sat });
export const radiusAt = (rank = 0) => A.radius[0] + (A.radius[1] - A.radius[0]) * Math.min(1, rank / Math.max(1, A.ranks - 1));
export const fuelAt = (rank = 0) => M(A.fuel[0] + rank * A.fuel[1]);
/** A knob's value at an attribute's rank: a multiplier (1 .. atMax) or a bonus to a count (0 .. atMax, whole). */
export function widenAtRank(key, rank = 0) {
  const w = KNOB[key];
  if (!w) return 1;
  const f = Math.min(1, Math.max(0, rank) / A.ranks);
  return w.plus ? Math.round(w.atMax * f) : 1 + (w.atMax - 1) * f;
}

// ---- the press's new rules (SOUL-ALCHEMY.md section 3; Petra wires them into SoulAlchemy and the press, these are their numbers)

/** SEASONING: what doing each attribute's thing anywhere gives it (0 .. ECON.alchemy.seasonMax), each source at most seasonPerHour a game
 *  hour. `when(e)` filters the event (the Courier's, and done well enough to count). The grind that closes the gap (DESIGN.md 22). */
export const SEASONING = [
  { event: 'vessel.shield',   attribute: 'willpower',     points: 1, when: (e) => e.by !== 'environment' },      // (a blow taken on the shield)
  { event: 'mind.settle',     attribute: 'willpower',     points: 2, when: () => true },                         // (brimming, and settling back)
  { event: 'creature.status', attribute: 'focus',         points: 1, when: (e) => e.by === 'courier' },          // (a status built on a creature)
  { event: 'rhythm.score',    attribute: 'focus',         points: 3, when: (e) => (e.combo || e.maxCombo || 0) >= 25 },
  { event: 'npc.talk',        attribute: 'charisma',      points: 1, when: () => true },
  { event: 'shop.sell',       attribute: 'charisma',      points: 1, when: (e) => e.by !== 'environment' },
  { event: 'shop.haggle',     attribute: 'charisma',      points: 2, when: (e) => e.won !== false },
  { event: 'move.parry',      attribute: 'perception',    points: 2, when: (e) => e.by === 'courier' && e.how },  // (a parry that answered something)
  { event: 'photo.appraise',  attribute: 'perception',    points: 2, when: (e) => (e.stars || 0) >= 3 },
  { event: 'drill.end',       attribute: 'dexterity',     points: 3, when: (e) => !e.tuned?.length },            // (a Throwing Room drill finished, untuned: `tuned` is the list of knobs away from default)
  { event: 'creature.zandatsu', attribute: 'dexterity',   points: 2, when: (e) => e.by !== 'environment' },
  { event: 'sigil.pop',       attribute: 'visualization', points: 2, when: (e) => e.by !== 'environment' },
  { event: 'garden.sculpt',   attribute: 'visualization', points: 1, when: (e) => e.by === 'courier' },
  { event: 'vessel.mend',     attribute: 'resilience',    points: 2, when: () => true },                         // (a crack mended: break it, mend it)
  { event: 'emocean.stage',   attribute: 'resilience',    points: 4, when: (e) => !!e.passed },                  // (a crossing survived)
];
/** A swatch's radius now: its rank's (narrowing), widened by seasoning, times the press's formation (clamped). */
export const swatchRadius = (rank = 0, seasoning = 0, formation = 1) => {
  const [lo, hi] = A.formationClamp, f = Math.max(lo, Math.min(hi, formation));
  return radiusAt(rank) * (1 + A.seasonWiden * Math.max(0, Math.min(A.seasonMax, seasoning)) / A.seasonMax) * f;
};
/** The cubes a firing costs, aimed: half at the swatch's heart, all of it at its rim. */
export const aimedFuel = (rank = 0, d = 0, r = 1) => M((A.fuel[0] + rank * A.fuel[1]) * (A.aim[0] + A.aim[1] * Math.min(1, Math.max(0, d / Math.max(1e-6, r)))));
/** A true firing: within trueShare of the radius. */
export const isTrue = (d, r) => d <= r * A.trueShare;
/** The painter's rule: a material whose hue lies within complementArc of the colour's opposite greys it by `complement` of its own
 *  saturation step (returned: the saturation to take off, 0 if it is no complement). */
export function complementGrey(colour, hue, satStep) {
  const opp = (colour.h + 180) % 360, off = Math.abs(((hue - opp + 540) % 360) - 180);
  return off <= A.complementArc ? A.complement * Math.abs(satStep || 0) : 0;
}

const fresh = () => ({ colour: { h: 0, s: 0 }, ranks: {}, season: {}, fed: {} }); // (season: each attribute's 0..seasonMax; fed: a source's points this game hour)
const GAME_HOUR = DAY_MS / 24, wrapH = (h) => ((h % 360) + 360) % 360;
/** A step on the wheel from colour `c` toward hue `h` (at least the swatches' saturation), `by` of the wheel's distance (0..1). */
function stepToward(c, h, by) {
  const s = Math.max(c.s, A.sat), ax = c.s * Math.cos(c.h * Math.PI / 180), ay = c.s * Math.sin(c.h * Math.PI / 180);
  const bx = s * Math.cos(h * Math.PI / 180), by2 = s * Math.sin(h * Math.PI / 180), dx = bx - ax, dy = by2 - ay, len = Math.hypot(dx, dy);
  if (len < 1e-6) return { ...c };
  const k = Math.min(1, (2 * by) / len), x = ax + dx * k, y = ay + dy * k;
  return { h: wrapH(Math.atan2(y, x) * 180 / Math.PI), s: Math.min(1, Math.hypot(x, y)) };
}

export class SoulAlchemy {
  constructor(game) {
    this.game = game;
    this.s = fresh();
    game.save?.section('alchemy', { scope: 'player', version: 2, migrate: (d) => ({ ...fresh(), ...(d || {}) }), dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    // seasoning: doing each attribute's thing anywhere (SEASONING), a source at most seasonPerHour a game hour, so it is played, never idled
    for (const S of SEASONING) game.events?.on?.(S.event, (e) => { try { if (S.when(e || {})) this.season(S.attribute, S.points, S.event); } catch { /* a filter that cannot read its event: not this one */ } });
  }
  get colour() { return { ...this.s.colour }; }
  rank(id) { return this.s.ranks[id] || 0; }
  seasoning(id) { return this.s.season[id] || 0; }
  widen(key) { return widenAtRank(key, KNOB[key] ? this.rank(KNOB[key].attr) : 0); }
  /** The press's formation where it stands (the Athanor's features and ground: world/garden/press.js), 1 when there is no press. */
  formation() { return this.game.realm?.press?.formation?.() ?? 1; }
  /** A swatch's radius now: its rank, its seasoning, the press's formation. */
  radius(id) { return swatchRadius(this.rank(id), this.seasoning(id), this.formation()); }

  /** Points of seasoning from a source (an event's name), capped a game hour. */
  season(id, pts, source) {
    const hour = Math.floor(calNow() / GAME_HOUR), f = this.s.fed[source] || (this.s.fed[source] = { hour, pts: 0 });
    if (f.hour !== hour) { f.hour = hour; f.pts = 0; }
    const add = Math.min(pts, A.seasonPerHour - f.pts, A.seasonMax - this.seasoning(id)); if (add <= 0) return 0;
    f.pts += add; this.s.season[id] = this.seasoning(id) + add;
    this.game.save?.dirty('alchemy');
    if (this.s.season[id] >= A.seasonMax) this.game.events?.emit('alchemy.seasoned', { attribute: id, by: 'courier' });
    return add;
  }

  /** What pressing these materials would do, without doing it: the trail the colour walks (for the press's preview). */
  walk(mats, colour = this.s.colour) {
    const g = this.game, brim = !!g.courierMind?.brimming, d = g.draught || {}, lead = Object.keys(d).sort((a, b) => d[b] - d[a])[0], tint = brim && lead ? A.feelingHue[lead] : null;
    let c = { ...colour }; const trail = [{ ...c }]; let greyed = 0;
    for (const m of mats) {
      const before = { ...c }, r = press(c, [m]);
      trail.push(...r.trail.slice(1)); c = { ...r.colour };
      const grey = complementGrey(before, m.hue, m.path.reduce((a, [, ds]) => a + Math.abs(ds), 0)); // (the painter's rule: a complement greys)
      if (grey > 0) { c.s = Math.max(0, c.s - grey); trail.push({ ...c }); greyed++; }
      if (tint != null) { c = stepToward(c, tint, A.brimStep); trail.push({ ...c }); } // (brimming: your draught tints what you take in)
    }
    return { colour: c, trail, greyed, tinted: tint != null };
  }

  /** Into the hopper: the materials in these box slots, in this order (each is used up). The colour walks their paths. */
  press(slots = []) {
    const box = this.game.pneuka, mats = [];
    for (const i of new Set(slots)) { const s = box?.slots[i]; if (s?.data?.path) mats.push({ i, m: s.data }); } // (a slot named twice is pressed once)
    if (!mats.length) return { colour: this.colour, trail: [] };
    const r = this.walk(mats.map((x) => x.m));
    for (const { i } of [...mats].sort((a, b) => b.i - a.i)) box.take(i);
    this.s.colour = { h: +r.colour.h.toFixed(1), s: +r.colour.s.toFixed(3) };
    this.game.save?.dirty('alchemy');
    this.game.events.emit('alchemy.press', { count: mats.length, hue: this.s.colour.h, sat: this.s.colour.s, near: this.near(), greyed: r.greyed, tinted: r.tinted, by: 'courier' });
    return { colour: this.colour, trail: r.trail };
  }

  /** The attribute whose swatch the soul colour is inside now (the nearest, if two), or null; with its distance and radius. */
  near() { return this.nearest()?.id ?? null; }
  nearest() {
    let best = null;
    for (const id of Object.keys(ATTRIBUTES)) {
      const d = distance(this.s.colour, targetOf(id)), r = this.radius(id);
      if (d <= r && (!best || d / r < best.d / best.r)) best = { id, d, r };
    }
    return best;
  }

  /** The igniter: raise the attribute the colour is inside, for its aimed fuel (half at the heart). Its seasoning is spent. */
  fire() {
    const N = this.nearest();
    if (!N) return { ok: false, why: 'Your soul colour sits in no attribute: press it nearer one.' };
    const { id, d, r: rad } = N, r = this.rank(id);
    if (r >= A.ranks) return { ok: false, why: `Your ${ATTRIBUTES[id].name} is as wide as it goes.` };
    const fuel = aimedFuel(r, d, rad);
    if (!this.game.cubes?.spend(fuel, 'alchemy')) return { ok: false, why: `The press burns ${fuel} cubes of refined Lachryma.` };
    const isT = isTrue(d, rad);
    this.s.ranks[id] = r + 1; this.s.season[id] = 0;
    this.game.save?.dirty('alchemy');
    this.game.events.emit('alchemy.fire', { attribute: id, rank: r + 1, fuel, true: isT, d: +(d / rad).toFixed(2), by: 'courier' });
    return { ok: true, attribute: id, rank: r + 1, true: isT, fuel };
  }
}
