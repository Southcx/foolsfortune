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
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { press, distance } from './econ/materials.js';

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

const fresh = () => ({ colour: { h: 0, s: 0 }, ranks: {} });

export class SoulAlchemy {
  constructor(game) {
    this.game = game;
    this.s = fresh();
    game.save?.section('alchemy', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
  }
  get colour() { return { ...this.s.colour }; }
  rank(id) { return this.s.ranks[id] || 0; }
  widen(key) { return widenAtRank(key, KNOB[key] ? this.rank(KNOB[key].attr) : 0); }

  /** Into the hopper: the materials in these box slots, in this order (each is used up). The colour walks their paths. */
  press(slots = []) {
    const box = this.game.pneuka, mats = [];
    for (const i of new Set(slots)) { const s = box?.slots[i]; if (s?.data?.path) mats.push({ i, m: s.data }); } // (a slot named twice is pressed once)
    if (!mats.length) return { colour: this.colour, trail: [] };
    const r = press(this.s.colour, mats.map((x) => x.m));
    for (const { i } of [...mats].sort((a, b) => b.i - a.i)) box.take(i);
    this.s.colour = { h: +r.colour.h.toFixed(1), s: +r.colour.s.toFixed(3) };
    this.game.save?.dirty('alchemy');
    this.game.events.emit('alchemy.press', { count: mats.length, hue: this.s.colour.h, sat: this.s.colour.s, near: this.near(), by: 'courier' });
    return { colour: this.colour, trail: r.trail };
  }

  /** The attribute whose target the soul colour is inside now (the nearest, if two), or null. */
  near() {
    let best = null, bd = Infinity;
    for (const id of Object.keys(ATTRIBUTES)) {
      const d = distance(this.s.colour, targetOf(id));
      if (d <= radiusAt(this.rank(id)) && d < bd) { best = id; bd = d; }
    }
    return best;
  }

  /** The igniter: raise the attribute the colour is inside, for its fuel. Refused (with why) when it is in none, at the top, or poor. */
  fire() {
    const id = this.near();
    if (!id) return { ok: false, why: 'Your soul colour sits in no attribute: press it nearer one.' };
    const r = this.rank(id);
    if (r >= A.ranks) return { ok: false, why: `Your ${ATTRIBUTES[id].name} is as wide as it goes.` };
    const fuel = fuelAt(r);
    if (!this.game.cubes?.spend(fuel, 'alchemy')) return { ok: false, why: `The press burns ${fuel} cubes of refined Lachryma.` };
    this.s.ranks[id] = r + 1;
    this.game.save?.dirty('alchemy');
    this.game.events.emit('alchemy.fire', { attribute: id, rank: r + 1, fuel, by: 'courier' });
    return { ok: true, attribute: id, rank: r + 1 };
  }
}
