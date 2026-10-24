// ---------------------------------------------------------------------------------------
// TRACKING, THE RULE FILES: every `feedback/tracking/*.js` beside tracking.js, called in one place and in a fixed order (the crossing's
// tally before the voyage's "You make port"). A new area's rules are a file here and a line below, so tracking.js keeps its own
// rules only. Each takes what it needs from one context: `on` (the bus), `L` (the ledger), `log`, `g` (the game), `where()`.
//
//   areaRules(ctx)   (tracking.js listen() calls it once)
// The crossing's rules (rail, voyage, passage) see the ledger through `atSea`: held still while the showcase crossing sails (DEBUG only,
// world/emocean/stage.js `showcase`: nothing counted) or a practice crossing (`practice`: only `rail.practice`, counted here), the ledger
// itself otherwise; what they say is said either way.
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
import { poolRules } from './pool.js';
import { pairRules } from './pairs.js';
import { godRules } from './god.js';
import { lockheartRules } from './lockheart.js';
import { raceRules } from './race.js';
import { openSeaRules } from './opensea.js';
import { seaSerpentRules } from './seaserpent.js';
import { chatroomRules } from './chatroom.js';
import { raceModeRules } from './racemodes.js';
import { casinoRules } from './casino.js';
import { duelRules } from './duel.js';
import { graphicsRules } from './graphics.js';
import { touchPlayRules } from './touchplay.js';
import { perfReadoutRules } from './perfreadout.js';
import { startAtRules } from './startat.js';
import { familiarityRules } from './familiarity.js';
import { sealRules } from './seals.js';
import { spreadRules } from './spreads.js';
import { cardBackRules } from './cardbacks.js';
import { flourishRules } from './flourishes.js';
import { palmDieRules } from './palmdie.js';
import { trackEditorRules } from './trackeditor.js';
import { stunRules } from './stun.js';
import { sightRules } from './sight.js';
import { goalsRules } from './goals.js';
import { worldShellRules } from './worldshells.js';
import { saveRules } from './save.js';
import { roomHelpRules } from './roomhelp.js';

/** The ledger as the crossing's rules see it: inc, hi, lo and first do nothing while the showcase or a practice crossing sails. */
function atSea(ctx) {
  const L = ctx.L, still = () => !!(ctx.g?.emocean?.showcase || ctx.g?.emocean?.practice), sea = Object.create(L);
  for (const k of ['inc', 'hi', 'lo', 'first']) sea[k] = (...a) => (still() ? false : L[k](...a));
  return { ...ctx, L: sea };
}

export function areaRules(ctx) {
  const sea = atSea(ctx);
  poolRules(ctx); // (the pool: spent, gained, low, empty)
  pairRules(ctx); // (/pairs: the 21 cards a main and a sub make)
  anglingRules(ctx);
  wellRules(ctx);
  railRules(sea); // (the crossing's tally, before the voyage's "You make port")
  ctx.on('rail.leg.end', (e) => { if (e.practice && e.by === 'courier') ctx.L.inc('rail.practice'); }); // (practice's own count, the one thing it keeps: RAIL-STANDARDS.md 5)
  moveRules(ctx); // (the movesets: launchers, air strings, specials, the skiff's bails)
  wispRules(ctx); // (the Lantern Wisps)
  familiarityRules(ctx); // (how well each kind of creature is known: the overlay's readouts)
  sealRules(ctx); // (the Seal Book: the cradles your seal set in)
  spreadRules(ctx); // (the spread laid on the Box's underside: progress/laidspread.js)
  trackEditorRules(ctx); // (made tracks, their traps, the haunt mode: TRACK-EDITOR.md)
  palmDieRules(ctx); // (the palm die's growth and what it condensed: progress/dice.js)
  stunRules(ctx); // (the stun and its depth: dazed, stunned, out cold)
  sightRules(ctx); // (the Sight's waypoint, set and cleared)
  goalsRules(ctx); // (the game day's three goals: progress/goals.js)
  godRules(ctx);
  openSeaRules(ctx); // (the open sea: docs/plans/OPEN-SEA.md)
  seaSerpentRules(ctx); // (the sea serpent and the hull at the free helm: world/opensea/seafight.js)
  chatroomRules(ctx); // (the room: coop/chatroom.js, COOP.md C7)
  raceRules(ctx); // (the Raceway's race, and the skiff's carve, pop, plates: docs/plans/SKIFF-RACING.md)
  raceModeRules(ctx); // (the Raceway's modes, cups, licences, City Trial, wager and the board's rules: SKIFF-RACING.md 12)
  casinoRules(ctx); // (Raku's bazaar: the chips, the tables, what happens at them: docs/plans/CASINO.md)
  duelRules(ctx); // (a puzzle duel with an aberrant: docs/plans/PUZZLE-DUELS.md)
  cardBackRules(ctx); // (a deck's card back chosen: ui/cardbackchoice.js)
  flourishRules(ctx); // (a flourish of the Courier's worn: vfx/flourishes.js)
  graphicsRules(ctx); // (the graphics tier, dynamic resolution: render/graphics.js)
  touchPlayRules(ctx); // (touch play's settings: the layout kept, gyro steering's motion access: core/layoutkeep.js, core/gyrosteer.js)
  perfReadoutRules(ctx); // (/perf: the performance readout, debug/perfreadout.js; nothing counted)
  startAtRules(ctx); // (?at=: where the Courier was set down, debug/startat.js; nothing counted)
  lockheartRules(ctx); // (the Lockheart's Overload recoil) // (the god hand's matter, miracles, epics and the island's rejection)
  voyageRules(sea);
  gardenRules(ctx);
  weatherRules(ctx);
  dunemawRules(ctx);
  placeRules(ctx);
  testroomRules(ctx);
  brushRules(ctx); // (the Soul Brush's load: paint, mop, the Lachrymato Bottles, the stains)
  worldShellRules(ctx); // (the World shells: found from blots, drawn on the place, a dry click)
  saveRules(ctx); // (where your save is kept: the browser, the cloud; the graphics context lost and given back)
  roomHelpRules(ctx); // (a room's help in the words of the device last touched)
  qaisRules(ctx); // (QAIS: a report filed, a round sent, /goto; nothing counted)
  partyRules(ctx); // (the siblings: coop/party.js)
  skiffRules(ctx); // (the Solar Skiff's summon, parking, recall and bail: courier/skiff/skiff.js)
  ostracaRules(ctx); // (the ostraca and stelae: neuralese words dug up into the Crib Sheet)
  passageRules(sea); // (an encounter's choice at sea done: world/emocean/triprun.js)
  heldStrikeRules(ctx); // (the toll string, the flail, the book bash: the held tools on the combo engine)
  blowRules(ctx); // (the unarmed V's blows and the psygun's whip, fan and flourish)
  figmentTelegraphRules(ctx); // (a windup read, and Divination's ladder said as it is climbed)
}
