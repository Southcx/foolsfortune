// ---------------------------------------------------------------------------------------
// THE KEY POSE TABLES, REGISTERED (docs/plans/KEY-POSES.md 6, 7): each tool's table (courier/anim/keys/<tool>.js, KEYS[move]) handed to
// the key track's registry (courier/anim/keyposes.js registerKeys), keyed by the moveset's id. Imported once at boot (boot/courier.js).
// A move with no keys plays its clip as before. Every tool's own string is keyed for the world too
// (keys/<tool>.js KEYS: the flail, the whip, the bashes, the club, the pole, the tolls).
//
//   import './courier/anim/keys/index.js'   KEY_TABLES (the tool ids registered, for the contact sheet)
//   FIGHTER_KEYS (the Arena fighter's table, not registered here: its timing is the rule's, so whoever lands the fighter kit calls
//   registerKeys('fighter', FIGHTER_KEYS, fillKeys) with platformfighter.js's fillKeys)
// ---------------------------------------------------------------------------------------
import { registerKeys } from '../keyposes.js';
import { KEYS as CUTLASS } from './cutlass.js';
import { KEYS as LOCKHEART } from './lockheart.js';
import { KEYS as PSYGUN } from './psygun.js';
import { KEYS as VERITOME } from './veritome.js';
import { KEYS as SOULBRUSH } from './soulbrush.js';
import { KEYS as DREAMVANE } from './dreamvane.js';
import { KEYS as CRUCIBELLE } from './crucibelle.js';
import { KEYS as KICK } from './kick.js';
import { T } from '../../../core/config.js';

export const KEY_TABLES = { cutlass: CUTLASS, lockheart: LOCKHEART, psygun: PSYGUN, veritome: VERITOME, club: SOULBRUSH, dreamvane: DREAMVANE, crucibelle: CRUCIBELLE }; // (keyed by the moveset's id: the Soul Brush's is 'club')
for (const [tool, KEYS] of Object.entries(KEY_TABLES)) registerKeys(tool, KEYS);
/** The kick's guard string (keys/kick.js): a trial, played only while the setting `visual.keyPoses` is on (KEY-POSES.md 7). */
registerKeys('kick', KICK, (m, raw) => (T.visual.keyPoses ? raw : null));

export { KEYS as FIGHTER_KEYS } from './fighter.js';
export { FIGHTER as FIGHTER_LOCKHEART_KEYS } from './lockheart.js';
export { FIGHTER as FIGHTER_PSYGUN_KEYS } from './psygun.js';
export { FIGHTER as FIGHTER_VERITOME_KEYS } from './veritome.js';
export { FIGHTER as FIGHTER_SOULBRUSH_KEYS } from './soulbrush.js';
export { FIGHTER as FIGHTER_DREAMVANE_KEYS } from './dreamvane.js';
export { FIGHTER as FIGHTER_CRUCIBELLE_KEYS } from './crucibelle.js';
export { SONDELASS as FIGHTER_SONDELASS_KEYS, BRAWLER as FIGHTER_BRAWLER_KEYS, BARRAGE_CYCLE } from './fighterkits.js';
