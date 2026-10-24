// ---------------------------------------------------------------------------------------
// THE STONES: how a Courier takes Lachryma in (the owner, 2026-10-06: "the Courier has a Courier_Stones material that can be recoloured
// in the kiln. We just found our vehicle for adjusting how the Courier processes Lachryma absorption"; Espada's lore: LORE.md, "The
// stones"). A Courier drinks through its stones as a pot breathes through its glaze. The stone set decides how much is taken in, how fast,
// how far it is drawn from, which feeling comes with it, how heady it is, and where the overflow goes. The Maker's Stones are the
// baseline; every other stone is a TRADE, never an upgrade (each row below gives and takes). One set at a time (the stones are one region
// of the vessel, one material).
//
// Two things the stones act on are new, and both are built once:
//   - the Courier's MIND (progress/combat/mind.js, the creatures' own five states, Stoic .. Prismatic): Lachryma drunk pushes it up,
//     quiet settles it. Prismatic is power (a Lachryma-driven blow x1.5) and fragility (statuses on you x2); Stoic the reverse. HEADY is
//     how far a stone lets a drink push it. That is the "sobriety" amethyst keeps: the canon's madness for folk, softened for a Courier.
//   - the DRAUGHT: the feeling of the Lachryma last drunk (the weather where it was drunk: progress/weather.js). Your blows of that
//     feeling's damage type build their status faster. TINT is how strongly a stone takes the place's feeling.
//
// The stones are dice (the owner, 2026-10-23: "merge the Pneuka stones with the stones"; docs/plans/DICE.md): a set is seven dice of
// solid Lachryma in the standard set's shapes, its mineral its trade (the rows below), and the chance rolled for the Courier is thrown on
// them; the god hand holds them as one palm die. Nothing below changes for it.
//
// Prior art: Dark Souls' rings and FFXI's gear (a slot that trades one number for another, never a straight upgrade); Path of Exile's
// keystones (a large gain paid for with a real loss); Darkest Dungeon's stress (a meter that is power and danger at once); Breath of the
// Wild's elixirs (what you take in changes what you can do, for a while); the old lapidaries (amethyst against drunkenness, citrine the
// merchant's stone, moonstone the night's, onyx for grounding, emerald's jardin, ruby's fire).
//
//   STONES[id] = { pool: { maxBonus?, regenMult?, costMult?, regenDelayMult? }, reach, heady, tint, gulp?, overflow, cubes?, night?, luck? }
//   stoneOf(id) -> the row (the Maker's when unknown)   modifier(id, { night }) -> a LachrymaPool modifier (courier/lachryma.js addModifier)
//   draughtOf(id, aspect, strength, second?) -> { aspect: share }
//   COURIER_MIND = { perDrink, perOverflow, settlePerSec }   COURIER_MIND_EFFECT[state] = { power, fragility }   courierMindEffect(mind)
//   DRAUGHT = { build, fadePerSec }
//   PRESSURE = { unit, crack }   apertureOf(id) -> x   pressureOf(amount, id) -> whole units (docs/plans/SPINE.md 4: the way OUT)
// ---------------------------------------------------------------------------------------
import { stateOf } from './combat/mind.js';

/** How much a drink moves the Courier's mental state (one whole state is 1, as for creatures). The owner, 2026-10-09 (QAIS T145): one
 *  clapperjar moved a whole state; a state should take 10 to 15 clapperjars' worth. So a clapperjar's 36 is a twelfth of a state
 *  (12 x 36 x 0.0023 = 1.0); a drink past full pushes twice as hard (BRIMMING, Espada's word; never "drunk" in player text: it was four
 *  times, which made a full pool cross a state on one jar), about 6 jars a state; quiet settles it back at the creatures' own rate. */
export const COURIER_MIND = { perDrink: 0.0023, perOverflow: 0.0046, settlePerSec: 0.05 };
/** What the Courier's mental state does to a fight (the owner, 2026-10-09, QAIS "loose-prismatic": Build): `power` multiplies the damage
 *  of the Courier's blows and shots, `fragility` the damage the Courier takes (the shield and the clay alike). Prismatic is power and
 *  fragility (x1.5 dealt, x2 taken), Stoic the reverse (x0.67, x0.5), Balanced neither; between them, a step each way. Read by
 *  `courierMindEffect(mind)` (the mind's own -2 .. +2 scale, progress/combat/mind.js); applied where blows land (Petra's wiring). */
export const COURIER_MIND_EFFECT = {
  stoic: { power: 0.67, fragility: 0.5 }, resolved: { power: 0.83, fragility: 0.75 }, balanced: { power: 1, fragility: 1 },
  fluid: { power: 1.25, fragility: 1.5 }, prismatic: { power: 1.5, fragility: 2 },
};
export const courierMindEffect = (mind = 0) => COURIER_MIND_EFFECT[stateOf(mind).id];
/** The draught's worth: a blow of the drunk feeling's damage type builds its status up to half again as fast, at a full draught; the
 *  draught fades over a real minute without drinking (a feeling carried, not kept). */
export const DRAUGHT = { build: 0.5, fadePerSec: 1 / 60 };

/** The stones. `reach` multiplies the bauble magnet's radius; `heady` how far a drink pushes the mind; `tint` how strongly the place's
 *  feeling comes in with it; `gulp` caps the take a second (the rest waits in the stones and arrives smoothly); `overflow` where the
 *  overflow goes: `lockheart` (the share the Lockheart drinks), `bleed` (lost, harmlessly). Every number is a trade against the Maker's. */
/** THE WAY OUT (docs/plans/SPINE.md 4; the owner, 2026-10-13: "an open cup when putting things in, but a pressurized vessel when taking
 *  things out"). A RELEASE (a tier IV caster shell, an Overload, an epic miracle) lets Lachryma out through the stones; its PRESSURE is how
 *  much over the APERTURE (a stone's `aperture`, the Maker's 1): every whole `unit` of it cracks the least cracked part of the vessel by
 *  `crack`, never through the shield (the shield is outside). A wide aperture is a stone's trade (safer releases), a narrow one a cost. */
export const PRESSURE = { unit: 40, crack: 0.6 };
export const apertureOf = (id) => STONES[id]?.aperture ?? 1;
/** Whole units of pressure a release of `amount` Lachryma makes through a stone set (at least one: a release is never free). */
export const pressureOf = (amount, id) => Math.max(1, Math.round(amount / (PRESSURE.unit * apertureOf(id))));

export const STONES = {
  maker: { pool: {}, reach: 1, heady: 1, tint: 1, aperture: 1, overflow: { lockheart: 0.8 } }, // (the Prince's choice: the baseline)
  amethyst: { // the sober stone: a big gulp comes in gently, the head stays clear, the weather's feeling barely reaches you
    pool: { regenMult: 0.85 }, reach: 0.8, heady: 0.4, tint: 0.5, gulp: 25, aperture: 1.5, overflow: { lockheart: 0, bleed: 1 }, // (and lets a release out gently)
  },
  citrine: { // the merchant's stone: a tenth of what is drunk is kept as cubes; a smaller vessel to drink into
    pool: { maxBonus: -15 }, reach: 1, heady: 1, tint: 1, cubes: 0.1, overflow: { lockheart: 0.8 },
  },
  moonstone: { // the night's stone: strong when Lachryma glows, weak by day
    pool: {}, reach: 1, heady: 1, tint: 1, overflow: { lockheart: 0.8 },
    night: { regenMult: 1.3, reach: 1.3 }, day: { regenMult: 0.85, reach: 0.9 },
  },
  onyx: { // grounding: nothing of the weather comes in, and every drop of overflow goes to the Lockheart; a slower, shorter reach
    pool: { regenMult: 0.9 }, reach: 0.85, heady: 0.75, tint: 0, aperture: 1.25, overflow: { lockheart: 1 }, // (grounded: a release runs to earth)
  },
  emerald: { // the garden inside it: drinks wide and deep of the place's feeling, and feels it
    pool: {}, reach: 1.5, heady: 1.3, tint: 2, overflow: { lockheart: 0.8 },
  },
  sapphire: { // calm and wisdom: every use costs less, and the vessel fills slower
    pool: { costMult: { '*': 0.85 }, regenMult: 0.8 }, reach: 1, heady: 0.75, tint: 1, overflow: { lockheart: 0.8 },
  },
  ruby: { // fire: a bigger vessel that burns hot (every use costs more, and it is heady)
    pool: { maxBonus: 30, costMult: { '*': 1.15 } }, reach: 1, heady: 1.25, tint: 1, aperture: 0.75, overflow: { lockheart: 0.8 }, // (and a release burns: it cracks sooner)
  },
  diamond: { // splits the light: a drink pushes the mind twice as far (Prismatic is near), and an agate's two feelings both come in
    pool: {}, reach: 1, heady: 2, tint: 1, split: true, aperture: 0.75, overflow: { lockheart: 0.8 },
  },
  opal: { // play of colour: each drink is a little game of chance, paid out by Luck (progress/luck.js)
    pool: {}, reach: 1, heady: 1, tint: 1, luck: { double: 0.1, none: 0.1 }, overflow: { lockheart: 0.8 },
  },
};
export const stoneOf = (id) => STONES[id] || STONES.maker;

/** The LachrymaPool modifier for a stone (courier/lachryma.js `addModifier('stones', ...)`), by day or by night. */
export function modifier(id, { night = false } = {}) {
  const s = stoneOf(id), m = { ...s.pool }, phase = night ? s.night : s.day;
  if (phase?.regenMult) m.regenMult = (m.regenMult ?? 1) * phase.regenMult;
  return m;
}

/** The draught a drink leaves: the place's feeling, by the stone's tint and the weather's strength (diamond takes an agate's two). */
export function draughtOf(id, aspect, strength = 0, second = null, secondStrength = 0) {
  const s = stoneOf(id), out = {};
  if (!aspect || !s.tint) return out;
  out[aspect] = Math.min(1, s.tint * strength);
  if (s.split && second) out[second] = Math.min(1, s.tint * secondStrength);
  return out;
}
