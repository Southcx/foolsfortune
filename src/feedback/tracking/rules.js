// ---------------------------------------------------------------------------------------
// TRACKING, THE RULE FILES: every `feedback/tracking/*.js` beside tracking.js, called in one place and in a fixed order (the crossing's
// tally before the voyage's "You make port"). A new area's rules are a file here and a line below, so tracking.js keeps its own
// rules only. Each takes what it needs from one context: `on` (the bus), `L` (the ledger), `log`, `g` (the game), `where()`.
//
//   areaRules(ctx)   (tracking.js listen() calls it once)
// ---------------------------------------------------------------------------------------
import { anglingRules } from './angling.js';
import { wellRules } from './wells.js';
import { voyageRules } from './voyage.js';
import { railRules } from './rail.js';
import { gardenRules } from './garden.js';
import { weatherRules } from './weather.js';
import { dunemawRules } from './dunemaw.js';
import { placeRules } from './place.js';
import { testroomRules } from './testroom.js';
import { qaisRules } from './qais.js';
import { brushRules } from './brush.js';
import { partyRules } from './party.js';
import { comboRules } from './combo.js';
import { skiffRules } from './skiff.js';
import { blowRules } from './blows.js';

export function areaRules(ctx) {
  anglingRules(ctx);
  wellRules(ctx);
  railRules(ctx); // (the crossing's tally, before the voyage's "You make port")
  voyageRules(ctx);
  gardenRules(ctx);
  weatherRules(ctx);
  dunemawRules(ctx);
  placeRules(ctx);
  testroomRules(ctx);
  brushRules(ctx); // (the Soul Brush's load: paint, mop, the Lachrymato Bottles, the stains)
  qaisRules(ctx); // (QAIS: a report filed, a round sent, /goto; nothing counted)
  partyRules(ctx); // (the siblings: coop/party.js)
  comboRules(ctx); // (the combo engine's launchers, air strings, plunges and specials: tools/moveset.js)
  skiffRules(ctx); // (the Solar Skiff's summon, parking, recall and bail: courier/skiff/skiff.js)
  blowRules(ctx); // (the unarmed V's blows and the psygun's whip, fan and flourish)
}
