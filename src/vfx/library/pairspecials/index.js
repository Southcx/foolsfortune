// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS' LOOKS, gathered: the 21 pair specials (progress/toolpairs.js PAIR_SPECIALS, I to XXI) as library effects, one module
// a main tool (the special's hero is the main's verb: progress/toolpairs.js PAIR_SPECIALS[n].main), all from the pair specials' kit
// (kit.js: the seven tools' grammars, braided). vfx/library.js spreads PAIR_SPECIAL_EFFECTS into LIBRARY; vfx/pairspeciallooks.js plays
// them on Petra's events (tools/pairspecials.js). The moments:
//   pair.<n>.use    the special's act, once a use (on `pair.special`)
//   pair.<n>.hold   what a special keeps up while it lasts (a channel, a drag, a decoy, a chain): held, let go when its state ends
//   pair.<n>.mark   a mark held or set on a thing (The Mark's, Revelation's, the mop's ground, a lure's stamp, the rod's gathering)
//   pair.<n>.hit    where it lands (a round, a blow, a bolt, the weather)
//
//   PAIR_SPECIAL_EFFECTS
// ---------------------------------------------------------------------------------------
import { PSYGUN_MAIN_EFFECTS } from './psygunmain.js';
import { SONDELASS_MAIN_EFFECTS } from './sondelassmain.js';
import { DREAMVANE_MAIN_EFFECTS } from './dreamvanemain.js';
import { LOCKHEART_MAIN_EFFECTS } from './lockheartmain.js';
import { VERITOME_MAIN_EFFECTS } from './veritomemain.js';
import { CRUCIBELLE_MAIN_EFFECTS } from './crucibellemain.js';
import { SOULBRUSH_MAIN_EFFECTS } from './soulbrushmain.js';

export const PAIR_SPECIAL_EFFECTS = {
  ...PSYGUN_MAIN_EFFECTS, ...SONDELASS_MAIN_EFFECTS, ...DREAMVANE_MAIN_EFFECTS, ...LOCKHEART_MAIN_EFFECTS, ...VERITOME_MAIN_EFFECTS,
  ...CRUCIBELLE_MAIN_EFFECTS, ...SOULBRUSH_MAIN_EFFECTS,
};
