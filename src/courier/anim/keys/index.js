// ---------------------------------------------------------------------------------------
// THE ARENA'S KEY POSE TABLES (docs/plans/KEY-POSES.md 6): each tool's FIGHTER table (courier/anim/keys/<tool>.js), passed on to the
// Arena's pose hook (world/strawmanwell/fighter/pose.js). The world's strings play their clips, interpolated: the stepped key track in the
// world was retired (South, 2026-11-15: "reads as laggy and choppy"); a tool's KEYS stay only as the Arena slots' stills.
//
//   FIGHTER_KEYS (the Arena fighter's table, not registered here: its timing is the rule's, so whoever lands the fighter kit calls
//   registerKeys('fighter', FIGHTER_KEYS, fillKeys) with platformfighter.js's fillKeys)
// ---------------------------------------------------------------------------------------
export { KEYS as FIGHTER_KEYS } from './fighter.js';
export { FIGHTER as FIGHTER_LOCKHEART_KEYS } from './lockheart.js';
export { FIGHTER as FIGHTER_PSYGUN_KEYS } from './psygun.js';
export { FIGHTER as FIGHTER_VERITOME_KEYS } from './veritome.js';
export { FIGHTER as FIGHTER_SOULBRUSH_KEYS } from './soulbrush.js';
export { FIGHTER as FIGHTER_DREAMVANE_KEYS } from './dreamvane.js';
export { FIGHTER as FIGHTER_CRUCIBELLE_KEYS } from './crucibelle.js';
export { SONDELASS as FIGHTER_SONDELASS_KEYS, BRAWLER as FIGHTER_BRAWLER_KEYS, BARRAGE_CYCLE } from './fighterkits.js';
