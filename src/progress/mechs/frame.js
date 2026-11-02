// ---------------------------------------------------------------------------------------
// A MECH'S FRAME, ASSEMBLED (docs/plans/MECHS.md 3, 4.1): nine parts summed into the numbers the mech moves by, and the checks the gantry
// refuses on. Every number is physics, so the way a frame moves teaches it without a word (DESIGN.md 22):
//   acceleration     a = F / m           the booster's thrust over the frame's mass: a heavy frame starts and stops slowly
//   the stride       T = 2π √(2L / 3g)   a leg swung as a pendulum (a uniform rod about its hip); a step is half a swing
//   the walk's top   v = √(Fr · g · L)   Froude's walking limit (Fr 0.5, where people break into a run): only boosters go faster
//   the quick boost  Δv = F · t / m      an impulse: the thrust held for `QB.t`
//   the boost's top  v = F / C           the assault boost's speed, where thrust meets the air's drag (a force, C·v, set by the frame's
//                                        size, not its mass): every frame on one booster tops out alike, the heavy one later (τ = m / C)
//   a charge's blow  p = m · v           its momentum against the clay frame's at a charge (P0): the heavy frame hits hardest
//   the battery      t = E / P           the generator's capacity over the draw: off the cable, energy is time
//
// Prior art: Armored Core's assembly and its refusals (overweight, arm load, energy), Front Mission's parts, a physics textbook.
//
//   G   FR   QB   DRAG (kN·s/m)   P0   assemble(sel) -> stats   strideOf(leg) -> real s a step   walkTopOf(leg) -> m/s   chargeK(mass, v) -> k
//   stats = { sel, parts, mass, load, armMass, armLoad, draw, output, capacity, thrust, accel, fire, qb, boostTop, legType, leg, step,
//             walkTop, jump, lock, radar, armour { region: x }, punch, aim, minutesIdle, checks [{ id, why }], ok, overweight, armHeavy, under }
// ---------------------------------------------------------------------------------------
import { SLOTS, PARTS, LEG_TYPES, CLAY_FRAME, partOf } from './parts.js';

/** Gravity (m/s²): real, so the stride and the walk come out as a real giant's would. */
export const G = 9.81;
/** Froude's number where a walk becomes a run (people and animals break at about 0.5): the walk's top. */
export const FR = 0.5;
/** The quick boost: the thrust held this long (real s), an impulse. */
export const QB = { t: 0.6 };
/** The air's drag on a frame at speed (kN per m/s, a force C·v): the boost's top is thrust over it. */
export const DRAG = 27;
/** The clay frame's momentum at a charge (t·m/s: 45.5 t at about 20 m/s): a charge's blow is the frame's own over this, a full blow 1. */
export const P0 = 900;
/** The jump's take-off speed (m/s) for a leg type's 1 (a 14 m frame clears its own knee). */
export const JUMP_V = 9;

/** Real seconds a step takes: half a pendulum swing of a leg of length `leg` (m). A tank has no stride (0). */
export const strideOf = (leg) => (leg > 0 ? Math.PI * Math.sqrt((2 * leg) / (3 * G)) : 0);
/** The walk's top speed (m/s) for a leg (Froude's limit). */
export const walkTopOf = (leg) => Math.sqrt(FR * G * Math.max(0, leg));
/** A charge's blow (a full blow 1) from the frame's mass (t) and speed (m/s): its momentum over P0, at most 3. */
export const chargeK = (mass, v) => Math.min(3, (mass * Math.max(0, v)) / P0);

/** The frame's numbers from a selection { slot: partId } (missing slots take the clay frame's). */
export function assemble(sel = {}) {
  const pick = { ...CLAY_FRAME, ...sel }, parts = {};
  for (const s of SLOTS) parts[s] = partOf(pick[s]);
  const P = parts, legs = P.legs || PARTS.clayLegs, type = LEG_TYPES[legs.type] || LEG_TYPES.biped;
  const mass = SLOTS.reduce((a, s) => a + (P[s]?.mass || 0), 0);
  const draw = SLOTS.reduce((a, s) => a + (s === 'generator' ? 0 : P[s]?.draw || 0), 0);
  const armMass = (P.weaponL?.mass || 0) + (P.weaponR?.mass || 0);
  const gen = P.generator || PARTS.clayGenerator, boost = P.booster || PARTS.clayBooster, arms = P.arms || PARTS.clayArms;
  const overweight = mass > legs.load, armHeavy = armMass > arms.load, under = draw > gen.output;
  const accel = boost.thrust / mass, leg = legs.leg || 0;
  let walkTop = type.treads ? type.treads : walkTopOf(leg);
  if (overweight) walkTop *= 0.5;
  const checks = [];
  if (overweight) checks.push({ id: 'overweight', why: `${mass.toFixed(1)} t on legs that carry ${legs.load} t: it walks at half and cannot boost.` });
  if (armHeavy) checks.push({ id: 'armHeavy', why: `${armMass.toFixed(1)} t of weapons on arms that hold ${arms.load} t: they aim at half speed.` });
  if (under) checks.push({ id: 'under', why: `The parts draw ${draw} kW and the generator gives ${gen.output} kW: the battery drains even on the cable.` });
  const core = P.core || PARTS.clayCore;
  return {
    sel: pick, parts: P, mass, load: legs.load, armMass, armLoad: arms.load, draw, output: gen.output, capacity: gen.capacity,
    thrust: boost.thrust, accel, fire: boost.fire, qb: overweight ? 0 : (boost.thrust * QB.t) / mass, boostTop: overweight ? 0 : boost.thrust / DRAG, tau: mass / DRAG,
    legType: legs.type, leg, step: type.stride ? strideOf(leg) : 0, walkTop, jump: overweight ? 0 : JUMP_V * type.jump, hoverFree: type.hoverFree,
    lock: P.head?.lock ?? 180, radar: P.head?.radar ?? 300, punch: arms.punch, aim: arms.aim * (armHeavy ? 0.5 : 1),
    armour: { head: 1, core: core.armour ?? 1, armL: 1, armR: 1, legs: legs.armour ?? 1, back: 1 },
    minutesIdle: gen.capacity / Math.max(1, draw) / 60,
    checks, ok: checks.length === 0, overweight, armHeavy, under,
  };
}
