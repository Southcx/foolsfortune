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
// Prior art: Dark Souls' rings and FFXI's gear (a slot that trades one number for another, never a straight upgrade); Path of Exile's
// keystones (a large gain paid for with a real loss); Darkest Dungeon's stress (a meter that is power and danger at once); Breath of the
// Wild's elixirs (what you take in changes what you can do, for a while); the old lapidaries (amethyst against drunkenness, citrine the
// merchant's stone, moonstone the night's, onyx for grounding, emerald's jardin, ruby's fire).
//
//   STONES[id] = { pool: { maxBonus?, regenMult?, costMult?, regenDelayMult? }, reach, heady, tint, gulp?, overflow, cubes?, night?, luck? }
//   stoneOf(id) -> the row (the Maker's when unknown)   modifier(id, { night }) -> a LachrymaPool modifier (courier/lachryma.js addModifier)
//   intake(id, amount, { full, night, luckRoll? }) -> { take, flushed, cubes, heady }   draughtOf(id, aspect, strength, second?) -> { aspect: share }
//   COURIER_MIND = { perDrink, perOverflow, settlePerSec }   DRAUGHT = { build, fadePerSec }   reachOf(id, { night }) -> magnet radius x
// ---------------------------------------------------------------------------------------

/** How much a drink moves the Courier's mental state (one whole state is 1, as for creatures): a clapperjar's 36 is a third of a state;
 *  a drink past full pushes four times as hard (BRIMMING, Espada's word; never "drunk" in player text); quiet settles it back at the creatures' own rate. */
export const COURIER_MIND = { perDrink: 0.01, perOverflow: 0.04, settlePerSec: 0.05 };
/** The draught's worth: a blow of the drunk feeling's damage type builds its status up to half again as fast, at a full draught; the
 *  draught fades over a real minute without drinking (a feeling carried, not kept). */
export const DRAUGHT = { build: 0.5, fadePerSec: 1 / 60 };

/** The stones. `reach` multiplies the bauble magnet's radius; `heady` how far a drink pushes the mind; `tint` how strongly the place's
 *  feeling comes in with it; `gulp` caps the take a second (the rest waits in the stones and arrives smoothly); `overflow` where the
 *  overflow goes: `lockheart` (the share the Lockheart drinks), `bleed` (lost, harmlessly). Every number is a trade against the Maker's. */
export const STONES = {
  maker: { pool: {}, reach: 1, heady: 1, tint: 1, overflow: { lockheart: 0.8 } }, // (the Prince's choice: the baseline)
  amethyst: { // the sober stone: a big gulp comes in gently, the head stays clear, the weather's feeling barely reaches you
    pool: { regenMult: 0.85 }, reach: 0.8, heady: 0.4, tint: 0.5, gulp: 25, overflow: { lockheart: 0, bleed: 1 },
  },
  citrine: { // the merchant's stone: a tenth of what is drunk is kept as cubes; a smaller vessel to drink into
    pool: { maxBonus: -15 }, reach: 1, heady: 1, tint: 1, cubes: 0.1, overflow: { lockheart: 0.8 },
  },
  moonstone: { // the night's stone: strong when Lachryma glows, weak by day
    pool: {}, reach: 1, heady: 1, tint: 1, overflow: { lockheart: 0.8 },
    night: { regenMult: 1.3, reach: 1.3 }, day: { regenMult: 0.85, reach: 0.9 },
  },
  onyx: { // grounding: nothing of the weather comes in, and every drop of overflow goes to the Lockheart; a slower, shorter reach
    pool: { regenMult: 0.9 }, reach: 0.85, heady: 0.75, tint: 0, overflow: { lockheart: 1 },
  },
  emerald: { // the garden inside it: drinks wide and deep of the place's feeling, and feels it
    pool: {}, reach: 1.5, heady: 1.3, tint: 2, overflow: { lockheart: 0.8 },
  },
  sapphire: { // calm and wisdom: every use costs less, and the vessel fills slower
    pool: { costMult: { '*': 0.85 }, regenMult: 0.8 }, reach: 1, heady: 0.75, tint: 1, overflow: { lockheart: 0.8 },
  },
  ruby: { // fire: a bigger vessel that burns hot (every use costs more, and it is heady)
    pool: { maxBonus: 30, costMult: { '*': 1.15 } }, reach: 1, heady: 1.25, tint: 1, overflow: { lockheart: 0.8 },
  },
  diamond: { // splits the light: a drink pushes the mind twice as far (Prismatic is near), and an agate's two feelings both come in
    pool: {}, reach: 1, heady: 2, tint: 1, split: true, overflow: { lockheart: 0.8 },
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
/** The bauble magnet's radius multiplier for a stone, by day or by night. */
export function reachOf(id, { night = false } = {}) {
  const s = stoneOf(id), phase = night ? s.night : s.day;
  return s.reach * (phase?.reach ?? 1);
}

/** One drink of `amount` through the stones: how much is taken in now (`take`; the gulp-capped rest waits), how much the mind is pushed
 *  (`heady`, in mind units: more past full), and the cubes kept (citrine). `luckRoll` is a number in [0, 1) from the simulation's
 *  stream (opal): below `none` the drink is lost, above 1 - `double` it is doubled. `dt` (seconds) bounds the gulp. */
export function intake(id, amount, { full = false, luckRoll = null, dt = 1 } = {}) {
  const s = stoneOf(id);
  let take = amount;
  if (s.luck && luckRoll != null) { if (luckRoll < s.luck.none) take = 0; else if (luckRoll >= 1 - s.luck.double) take = amount * 2; }
  const cap = s.gulp ? s.gulp * dt : Infinity, now = Math.min(take, cap);
  const heady = s.heady * (full ? COURIER_MIND.perOverflow : COURIER_MIND.perDrink) * now;
  return { take: now, waiting: take - now, heady, cubes: (s.cubes || 0) * now };
}

/** The draught a drink leaves: the place's feeling, by the stone's tint and the weather's strength (diamond takes an agate's two). */
export function draughtOf(id, aspect, strength = 0, second = null, secondStrength = 0) {
  const s = stoneOf(id), out = {};
  if (!aspect || !s.tint) return out;
  out[aspect] = Math.min(1, s.tint * strength);
  if (s.split && second) out[second] = Math.min(1, s.tint * secondStrength);
  return out;
}
