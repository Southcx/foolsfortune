// ---------------------------------------------------------------------------------------
// SOUL ALCHEMY: the spirit press in the Spirit Garden (docs/DESIGN.md, section 16; SYSTEMS.md, D2). The Courier has a SOUL COLOUR, a hue
// and a saturation on the wheel (it starts grey, at the centre). Pressing materials walks it along each one's winding path, in the order
// they go into the hopper (progress/econ/materials.js); FIRING the press while the colour sits inside an ATTRIBUTE's target raises that
// attribute a rank and spends refined Lachryma (cubes: the long sink). The target narrows with every rank, so the skill is the
// navigation. An attribute widens the VESSEL (what the Courier is), as a domain widens the tools (what the Courier does): never a skill.
//
// Prior art: Newton's centre of gravity (a mixture between its parts), Potion Craft (ingredients as paths across a map, the order of them the craft, a potion a place you steer to), the owner's
// design document v0.1 (the attributes, raised at the shrine; Luck kept apart), Atelier's synthesis, and a painter's colour wheel.
//
//   ATTRIBUTES[id] = { id, name, hue, does, widen: { key: { mult | plus, atMax } } }   targetOf(id) -> { h, s }   radiusAt(rank)   fuelAt(rank)
//   game.alchemy = new SoulAlchemy(game)   .colour   .rank(id)   .press(slots) -> { colour, trail }   .near() -> id | null
//   .fire() -> { ok, why?, attribute?, rank? }   .widen(key) -> a multiplier, or a bonus to a count (1 / +0 at rank 0)
//   SEASONING (event -> attribute, points, when)   swatchRadius(rank, seasoning)   heartRadius(rank)   aimedFuel(rank, d, r, formation)
//   isTrue(d, rank)   FEELING_HUE   .walk(mats) (the one walk: press and preview)   (SOUL-ALCHEMY.md section 3, the rulings of 2026-10-08)
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { press, pullStep, distance } from './econ/materials.js';
import { COLOR } from './weather.js';
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
  { event: 'angle.catch',     attribute: 'focus',         points: 2, when: () => true },                         // (patience: a snapped line loses the fish, so a catch is a line held: Petra)
  { event: 'npc.talk',        attribute: 'charisma',      points: 1, when: () => true },
  { event: 'shop.sell',       attribute: 'charisma',      points: 1, when: (e) => e.by !== 'environment' },
  { event: 'shop.haggle',     attribute: 'charisma',      points: 2, when: (e) => e.step === 'deal' },          // (a haggle struck, not each step: Petra, v114)
  { event: 'move.parry',      attribute: 'perception',    points: 2, when: (e) => e.by === 'courier' && e.how },  // (a parry that answered something)
  { event: 'photo.appraise',  attribute: 'perception',    points: 2, when: (e) => (e.stars || 0) >= 3 },
  { event: 'drill.end',       attribute: 'dexterity',     points: 3, when: (e) => !e.tuned?.length },            // (a Throwing Room drill finished, untuned: `tuned` is the list of knobs away from default)
  { event: 'creature.zandatsu', attribute: 'dexterity',   points: 2, when: (e) => e.by !== 'environment' },
  { event: 'sigil.pop',       attribute: 'visualization', points: 2, when: (e) => e.by !== 'environment' },
  { event: 'garden.sculpt',   attribute: 'visualization', points: 1, when: (e) => e.by === 'courier' },
  { event: 'vessel.mend',     attribute: 'resilience',    points: 2, when: () => true },                         // (a crack mended: break it, mend it)
  { event: 'emocean.stage',   attribute: 'resilience',    points: 4, when: (e) => !!e.passed },                  // (a crossing survived)
];
/** A swatch's radius now: its rank's (narrowing), widened toward the ceiling by seasoning (Calissa's ruling 2: no swatch reaches a
 *  neighbour's). The formation no longer touches it (ruling 3). */
export const swatchRadius = (rank = 0, seasoning = 0) => {
  const r = radiusAt(rank), f = Math.max(0, Math.min(A.seasonMax, seasoning)) / A.seasonMax;
  return r + Math.max(0, A.seasonCeiling - r) * f;
};
/** A tile's heart: trueShare of the BARE rank radius, so seasoning widens where a firing counts, never where it is true (ruling 4). */
export const heartRadius = (rank = 0) => radiusAt(rank) * A.trueShare;
/** The cubes a firing costs: aimed (half at the swatch's heart, all of it at its rim), and divided by the press's formation, clamped
 *  (a hotter furnace burns fewer cubes: ruling 3). */
export const aimedFuel = (rank = 0, d = 0, r = 1, formation = 1) => {
  const [lo, hi] = A.formationClamp, f = Math.max(lo, Math.min(hi, formation));
  return M((A.fuel[0] + rank * A.fuel[1]) * (A.aim[0] + A.aim[1] * Math.min(1, Math.max(0, d / Math.max(1e-6, r)))) / f);
};
/** A true firing: inside the tile's heart (the bare radius's quarter). */
export const isTrue = (d, rank = 0) => d <= heartRadius(rank);
/** Each feeling's hue on the colour wheel, from the one feeling table (weather.js COLOR: Plutchik's petals; Calissa's ruling 7). */
export const FEELING_HUE = Object.fromEntries(Object.entries(COLOR).map(([k, hex]) => {
  const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const h = d === 0 ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [k, Math.round(((h * 60) + 360) % 360)];
}));

const fresh = () => ({ colour: { h: 0, s: 0 }, ranks: {}, season: {}, fed: {}, cocked: false }); // (season: each attribute's 0..seasonMax; fed: a source's points this game hour; cocked: pressed since the last firing)
const GAME_HOUR = DAY_MS / 24, wrapH = (h) => ((h % 360) + 360) % 360;
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
  radius(id) { return swatchRadius(this.rank(id), this.seasoning(id)); }

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

  /** What pressing these materials would do, without doing it: the trail the colour walks. The one walk (ruling: the preview is the
   *  press): each material's own pull (materials.js), a spirit at work's extra step, and while a draught lasts (game.draught, fading
   *  over a real minute) a pull of draughtPull x its strength toward the draught's feeling, at the swatches' saturation. */
  walk(mats, colour = this.s.colour, { extra = this.game.realm?.press?.extra?.() ?? 0 } = {}) {
    const d = this.game.draught || {}, lead = Object.keys(d).sort((a, b) => d[b] - d[a])[0], str = lead ? Math.min(1, d[lead] || 0) : 0;
    const to = lead && FEELING_HUE[lead] != null ? { h: FEELING_HUE[lead], s: A.sat } : null;
    let c = { ...colour }; const trail = [{ ...c }]; let greyed = 0;
    for (const m of mats) {
      const before = c.s, r = press(c, [m], { extra });
      trail.push(...r.trail.slice(1)); c = { ...r.colour };
      if (c.s < before - 0.02) greyed++; // (the painter's rule, seen: a pull across the wheel passes through grey)
      if (to && str > 0) { c = pullStep(c, to, A.draughtPull * str); trail.push({ ...c }); }
    }
    return { colour: c, trail, greyed, tinted: !!(to && str > 0) };
  }

  /** Into the hopper: the materials in these box slots, in this order (each is used up). The colour walks their paths. */
  press(slots = []) {
    const box = this.game.pneuka, mats = [];
    for (const i of new Set(slots)) { const s = box?.slots[i]; if (s?.data?.path) mats.push({ i, m: s.data }); } // (a slot named twice is pressed once)
    if (!mats.length) return { colour: this.colour, trail: [] };
    const r = this.walk(mats.map((x) => x.m));
    for (const { i } of [...mats].sort((a, b) => b.i - a.i)) box.take(i);
    this.s.colour = { h: +r.colour.h.toFixed(1), s: +r.colour.s.toFixed(3) }; this.s.cocked = true; // (pressing cocks the lever: one firing a press, ruling 5)
    this.game.save?.dirty('alchemy');
    this.game.events.emit('alchemy.press', { count: mats.length, kinds: mats.map((x) => x.m.kind), hue: this.s.colour.h, sat: this.s.colour.s, near: this.near(), greyed: r.greyed, tinted: r.tinted, by: 'courier' });
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

  /** The igniter: raise the attribute the colour is inside, for its aimed fuel over the press's formation. Its seasoning is spent, and
   *  the lever is let down until the next press. Refused, with `code` (outside | full | poor | spent) and why. */
  fire() {
    if (!this.s.cocked) return { ok: false, code: 'spent', why: 'The bath is empty. Press a material first.' };
    const N = this.nearest();
    if (!N) return { ok: false, code: 'outside', why: 'The press does not fire: the colour is outside every swatch.' };
    const { id, d, r: rad } = N, r = this.rank(id);
    if (r >= A.ranks) return { ok: false, code: 'full', why: `Your ${ATTRIBUTES[id].name} is as wide as it goes.` };
    const fuel = aimedFuel(r, d, rad, this.formation());
    if (!this.game.cubes?.spend(fuel, 'alchemy')) return { ok: false, code: 'poor', why: `The press does not fire: it needs ${fuel} cubes.` };
    const isT = isTrue(d, r);
    this.s.ranks[id] = r + 1; this.s.season[id] = 0; this.s.cocked = false;
    this.game.save?.dirty('alchemy');
    this.game.events.emit('alchemy.fire', { attribute: id, rank: r + 1, fuel, true: isT, d: +(d / rad).toFixed(2), by: 'courier' });
    return { ok: true, attribute: id, rank: r + 1, true: isT, fuel };
  }
}
