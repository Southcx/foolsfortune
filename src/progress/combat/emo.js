// ---------------------------------------------------------------------------------------
// EMOTIONAL OUTPUT (EmO): a Figment's agitation, 0 (calm) to 1 (beside itself), from the owner's design document v0.1 (section 9.3). It
// rises as the creature is fought (each blow, and slowly while it hunts), and falls when it is soothed (a Crucibelle lullaby, the
// Lockheart's hush) or left alone. Three things read it:
//  - YIELD: the Lachryma it gives when struck peaks in a band (OPTIMAL), and is thin when it is calm or past the band;
//  - ENRAGE: past `enrage` it fights harder (its mind's drives read it: docs/AI.md); the body shows it, never text;
//  - THE CATCH (docs/plans/SYSTEMS.md, C2): a Figment is easiest to catch with its EmO in the band and its mind laid low.
// Data and pure functions; a creature carries `emo` once Petra wires it (SYSTEMS.md, B4).
//
// Prior art: v0.1's EmO (a soft enrage whose Lachryma yield peaks between two bounds); Monster Hunter's rage state (tells in the body,
// a window to exploit); Pokemon's catch odds rising as the target weakens; the "goldilocks" band of every good harvest timing.
//
//   EMO = { perBlow, perSec, decayPerSec, optimal: [lo, hi], enrage }   rise(emo, blows, dt, hunting) -> emo   yieldOf(emo) -> 0..1
//   enraged(emo) -> bool   catchFactor(emo) -> 0..1
// ---------------------------------------------------------------------------------------

// tuned against the slip jelly, which bursts after about 8 shots: the band opens at the 5th blow and lasts to the end of the fight
// (scripts/combat.mjs). A bigger Figment class (Barracuda .. Leviathan) should rise more slowly: divide perBlow by its class, not here.
export const EMO = { perBlow: 0.08, perSec: 0.01, decayPerSec: 0.03, optimal: [0.35, 0.75], enrage: 0.85 };

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** EmO after `blows` blows and `dt` seconds (rising while it hunts, decaying otherwise). */
export const rise = (emo = 0, blows = 0, dt = 0, hunting = false) => clamp01(emo + blows * EMO.perBlow + dt * (hunting ? EMO.perSec : -EMO.decayPerSec));

/** The share of its Lachryma a blow draws out: a plateau of 1 across the optimal band, falling linearly to 0.25 at calm and at the top. */
export function yieldOf(emo = 0) {
  const [lo, hi] = EMO.optimal, e = clamp01(emo);
  if (e < lo) return 0.25 + 0.75 * (e / lo);
  if (e <= hi) return 1;
  return 1 - 0.75 * ((e - hi) / (1 - hi));
}

export const enraged = (emo = 0) => emo >= EMO.enrage;

/** How the agitation moves the catch's odds: whole in the band, half at calm, a fifth when enraged (a creature beside itself fights the coffin). */
export function catchFactor(emo = 0) {
  const [lo, hi] = EMO.optimal, e = clamp01(emo);
  if (e >= lo && e <= hi) return 1;
  if (e < lo) return 0.5 + 0.5 * (e / lo);
  return enraged(e) ? 0.2 : 1 - 0.8 * ((e - hi) / (EMO.enrage - hi));
}
