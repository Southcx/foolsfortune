// ---------------------------------------------------------------------------------------
// TRACKING, THE RULE FILES: every `feedback/tracking/*.js` beside tracking.js, called in one place and in a fixed order (the crossing's
// tally before the voyage's "You make port"). A new area's rules are a file here and a line below, so tracking.js keeps its own
// rules only. Each takes what it needs from one context: `on` (the bus), `L` (the ledger), `log`, `g` (the game), `where()`.
//
//   areaRules(ctx)   (tracking.js listen() calls it once)
// The crossing's rules (rail, voyage, passage) see the ledger through `atSea`: held still while the showcase crossing sails (DEBUG only,
// world/emocean/stage.js `showcase`: nothing counted), the ledger itself otherwise; what they say is said either way.
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
import { skiffRules } from './skiff.js';
import { moveRules } from './moves.js';
import { heldStrikeRules } from './heldstrikes.js';
import { blowRules } from './blows.js';
import { figmentTelegraphRules } from './figmenttelegraphs.js';
import { ostracaRules } from './ostraca.js';
import { passageRules } from './passage.js';
import { wispRules } from './wisps.js';
import { godRules } from './god.js';
import { lockheartRules } from './lockheart.js';
import { raceRules } from './race.js';
import { openSeaRules } from './opensea.js';
import { raceModeRules } from './racemodes.js';
import { casinoRules } from './casino.js';
import { duelRules } from './duel.js';
import { graphicsRules } from './graphics.js';
import { familiarityRules } from './familiarity.js';
import { sealRules } from './seals.js';
import { stunRules } from './stun.js';
import { sightRules } from './sight.js';

/** The ledger as the crossing's rules see it: inc, hi, lo and first do nothing while the showcase crossing sails. */
function atSea(ctx) {
  const L = ctx.L, still = () => !!ctx.g?.emocean?.showcase, sea = Object.create(L);
  for (const k of ['inc', 'hi', 'lo', 'first']) sea[k] = (...a) => (still() ? false : L[k](...a));
  return { ...ctx, L: sea };
}

export function areaRules(ctx) {
  const sea = atSea(ctx);
  anglingRules(ctx);
  wellRules(ctx);
  railRules(sea); // (the crossing's tally, before the voyage's "You make port")
  moveRules(ctx); // (the movesets: launchers, air strings, specials, the skiff's bails)
  wispRules(ctx); // (the Lantern Wisps)
  familiarityRules(ctx); // (how well each kind of creature is known: the overlay's readouts)
  sealRules(ctx); // (the Seal Book: the cradles your seal set in)
  stunRules(ctx); // (the stun and its depth: dazed, stunned, out cold)
  sightRules(ctx); // (the Sight's waypoint, set and cleared)
  godRules(ctx);
  openSeaRules(ctx); // (the open sea: docs/plans/OPEN-SEA.md)
  raceRules(ctx); // (the Raceway's race, and the skiff's carve, pop, plates: docs/plans/SKIFF-RACING.md)
  raceModeRules(ctx); // (the Raceway's modes, cups, licences, City Trial, wager and the board's rules: SKIFF-RACING.md 12)
  casinoRules(ctx); // (Raku's bazaar: the chips, the tables, what happens at them: docs/plans/CASINO.md)
  duelRules(ctx); // (a puzzle duel with an aberrant: docs/plans/PUZZLE-DUELS.md)
  graphicsRules(ctx); // (the graphics tier, dynamic resolution: render/graphics.js)
  lockheartRules(ctx); // (the Lockheart's Overload recoil) // (the god hand's matter, miracles, epics and the island's rejection)
  voyageRules(sea);
  gardenRules(ctx);
  weatherRules(ctx);
  dunemawRules(ctx);
  placeRules(ctx);
  testroomRules(ctx);
  brushRules(ctx); // (the Soul Brush's load: paint, mop, the Lachrymato Bottles, the stains)
  qaisRules(ctx); // (QAIS: a report filed, a round sent, /goto; nothing counted)
  partyRules(ctx); // (the siblings: coop/party.js)
  skiffRules(ctx); // (the Solar Skiff's summon, parking, recall and bail: courier/skiff/skiff.js)
  ostracaRules(ctx); // (the ostraca and stelae: neuralese words dug up into the Crib Sheet)
  passageRules(sea); // (an encounter's choice at sea done: world/emocean/triprun.js)
  heldStrikeRules(ctx); // (the toll string, the flail, the book bash: the held tools on the combo engine)
  blowRules(ctx); // (the unarmed V's blows and the psygun's whip, fan and flourish)
  figmentTelegraphRules(ctx); // (a windup read, and Divination's ladder said as it is climbed)
}
