// ---------------------------------------------------------------------------------------
// THE KEY POSE TABLES, REGISTERED (docs/plans/KEY-POSES.md 6, 7): each tool's table (courier/anim/keys/<tool>.js, KEYS[move]) handed to
// the key track's registry (courier/anim/keyposes.js registerKeys), keyed by the moveset's id. Imported once at boot (boot/courier.js).
// A move with no keys plays its clip as before. The Lockheart's flail (keys/lockheart.js KEYS) is keyed for the world too.
//
//   import './courier/anim/keys/index.js'   KEY_TABLES (the tool ids registered, for the contact sheet)
//   FIGHTER_KEYS (the Arena fighter's table, not registered here: its timing is the rule's, so whoever lands the fighter kit calls
//   registerKeys('fighter', FIGHTER_KEYS, fillKeys) with platformfighter.js's fillKeys)
// ---------------------------------------------------------------------------------------
import { registerKeys } from '../keyposes.js';
import { KEYS as CUTLASS } from './cutlass.js';
import { KEYS as LOCKHEART } from './lockheart.js';

export const KEY_TABLES = { cutlass: CUTLASS, lockheart: LOCKHEART };
for (const [tool, KEYS] of Object.entries(KEY_TABLES)) registerKeys(tool, KEYS);

export { KEYS as FIGHTER_KEYS } from './fighter.js';
export { FIGHTER as FIGHTER_LOCKHEART_KEYS } from './lockheart.js';
export { SONDELASS as FIGHTER_SONDELASS_KEYS, BRAWLER as FIGHTER_BRAWLER_KEYS, BARRAGE_CYCLE } from './fighterkits.js';
