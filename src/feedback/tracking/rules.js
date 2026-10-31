// ---------------------------------------------------------------------------------------
// TRACKING, THE RULE FILES: every `feedback/tracking/*.js` beside tracking.js, called in one place and in a fixed order (the crossing's
// tally before the voyage's "You make port"). A new area's rules are a file here and a line below. tracking.js keeps only what
// installs them. The order is the bus's order, so it is kept: the lead rules (once inline in tracking.js), each area's, the trail rules
// (inline too, after the areas). Each takes what it needs from one context: `on` (the bus), `L` (the ledger), `log`, `g` (the game),
// `where()` and `track` (the Tracking: the break chain, the pending record announcements, the room clock, `note`).
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
import { placeRules, placeEnterRules } from './place.js';
import { throwingRoomRules } from './throwingroom.js';
import { qaisRules } from './qais.js';
import { brushRules, brushToolRules } from './brush.js';
import { partyRules } from './party.js';
import { skiffRules, skiffSailingRules } from './skiff.js';
import { moveRules } from './moves.js';
import { heldStrikeRules } from './heldstrikes.js';
import { blowRules } from './blows.js';
import { figmentTelegraphRules } from './figmenttelegraphs.js';
import { ostracaRules } from './ostraca.js';
import { passageRules } from './passage.js';
import { wispRules } from './wisps.js';
import { poolRules } from './pool.js';
import { pairRules } from './pairs.js';
import { godRules, godHandRules } from './god.js';
import { lockheartRules, lockheartOutcomeRules } from './lockheart.js';
import { raceRules } from './race.js';
import { openSeaRules } from './opensea.js';
import { seaSerpentRules } from './seaserpent.js';
import { chatroomRules } from './chatroom.js';
import { raceModeRules } from './racemodes.js';
import { casinoRules } from './casino.js';
import { duelRules } from './duel.js';
import { graphicsRules } from './graphics.js';
import { instrumentRules } from './instruments.js';
import { touchPlayRules } from './touchplay.js';
import { perfReadoutRules } from './perfreadout.js';
import { startAtRules } from './startat.js';
import { familiarityRules } from './familiarity.js';
import { sealRules } from './seals.js';
import { spreadRules } from './spreads.js';
import { cardBackRules } from './cardbacks.js';
import { toolSkinRules } from './toolskins.js';
import { flourishRules } from './flourishes.js';
import { palmDieRules } from './palmdie.js';
import { trackEditorRules } from './trackeditor.js';
import { stunRules } from './stun.js';
import { sightRules } from './sight.js';
import { goalsRules } from './goals.js';
import { aptitudeRules } from './aptitude.js';
import { classArtsRules } from './classarts.js';
import { classArtsPlayRules } from './classartsplay.js';
import { pairWornRules } from './pairworn.js';
import { jellyMountRules } from './jellymount.js';
import { mimicryRules } from './mimicry.js';
import { sandboxRules } from './sandbox.js';
import { strawmanWellRules } from './strawmanwell.js';
import { questsRules } from './quests.js';
import { gardenGrowthRules } from './gardengrowth.js';
import { pairSpecialsPlayRules } from './pairspecialsplay.js';
import { touchstoneRules } from './touchstone.js';
import { worldShellRules } from './worldshells.js';
import { saveRules } from './save.js';
import { roomHelpRules } from './roomhelp.js';
import { breakRules } from './breaks.js';
import { gunShotRules, psygunVariantRules } from './gunshots.js';
import { groundMovementRules } from './groundmovement.js';
import { movementArtRules } from './movementarts.js';
import { mapRules } from './maps.js';
import { courseRules } from './course.js';
import { systemLineRules, commandEchoRules } from './systemlines.js';
import { veritomeRules } from './veritome.js';
import { itemRules } from './items.js';
import { chatLineRules } from './chatline.js';
import { folkRules } from './folk.js';
import { jellyRules } from './jellies.js';
import { creatureStatusRules } from './creaturestatus.js';
import { reprogramRules } from './reprogram.js';
import { toolRules } from './tools.js';
import { dreamvaneRules } from './dreamvane.js';
import { crucibelleRules } from './crucibelle.js';
import { rhythmRules } from './rhythm.js';
import { sondelassRules } from './sondelass.js';
import { treasureRules } from './treasure.js';
import { standingRules } from './standing.js';
import { shopRules } from './shop.js';
import { vesselRules } from './vessel.js';
import { shrineRules } from './shrines.js';

/** The ledger as the crossing's rules see it: inc, hi, lo and first do nothing while the showcase or a practice crossing sails. */
function atSea(ctx) {
  const L = ctx.L, still = () => !!(ctx.g?.rail?.showcase || ctx.g?.rail?.practice), sea = Object.create(L);
  for (const k of ['inc', 'hi', 'lo', 'first']) sea[k] = (...a) => (still() ? false : L[k](...a));
  return { ...ctx, L: sea };
}

export function areaRules(ctx) {
  const sea = atSea(ctx);
  // (the lead rules, once tracking.js's own: 24 files, in the order they stood there)
  breakRules(ctx);
  gunShotRules(ctx);
  groundMovementRules(ctx);
  movementArtRules(ctx);
  skiffSailingRules(ctx);
  godHandRules(ctx);
  mapRules(ctx);
  courseRules(ctx);
  systemLineRules(ctx);
  placeEnterRules(ctx);
  veritomeRules(ctx);
  itemRules(ctx);
  chatLineRules(ctx);
  folkRules(ctx);
  jellyRules(ctx);
  creatureStatusRules(ctx);
  reprogramRules(ctx);
  toolRules(ctx);
  dreamvaneRules(ctx);
  crucibelleRules(ctx);
  rhythmRules(ctx);
  lockheartOutcomeRules(ctx);
  brushToolRules(ctx);
  sondelassRules(ctx);
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
  aptitudeRules(ctx); // (the Assay's readings, said on /assay: progress/aptitude.js)
  classArtsRules(ctx); // (a class's arts opened, worn and asked for: progress/classarts.js)
  classArtsPlayRules(ctx); // (a class's arts used, firing and wearing off: courier/classarts/body.js)
  pairWornRules(ctx); // (a pair worn: the counts its special opens by, tracking/pairworn.js)
  jellyMountRules(ctx); // (the slip jelly mount's ledger, tracking/jellymount.js)
  mimicryRules(ctx); // (the god hand's mimicry puzzles, tracking/mimicry.js)
  strawmanWellRules(ctx); // (Strawman's Well's stages, KOs, trophies, falls and verbs: tracking/strawmanwell.js)
  questsRules(ctx); // (quests begun, stepped and done, the journal and the recap: tracking/quests.js)
  sandboxRules(ctx); // (the thrown hit anywhere, the Sandbox's lecterns and pitch: tracking/sandbox.js)
  pairSpecialsPlayRules(ctx); // (a pair's special played: tracking/pairspecialsplay.js)
  touchstoneRules(ctx); // (the Assay's room and its trials announced: tracking/touchstone.js)
  godRules(ctx);
  openSeaRules(ctx); // (the open sea: docs/plans/OPEN-SEA.md)
  seaSerpentRules(ctx); // (the sea serpent and the hull at the free helm: world/opensea/seafight.js)
  chatroomRules(ctx); // (the room: coop/chatroom.js, COOP.md C7)
  raceRules(ctx); // (the Raceway's race, and the skiff's carve, pop, plates: docs/plans/SKIFF-RACING.md)
  raceModeRules(ctx); // (the Raceway's modes, cups, licences, City Trial, wager and the board's rules: SKIFF-RACING.md 12)
  casinoRules(ctx); // (Raku's bazaar: the chips, the tables, what happens at them: docs/plans/CASINO.md)
  duelRules(ctx); // (a puzzle duel with an aberrant: docs/plans/PUZZLE-DUELS.md)
  cardBackRules(ctx); // (a deck's card back chosen: ui/cardbackchoice.js)
  toolSkinRules(ctx); // (a tool's skin worn: vfx/toolskinwear.js)
  flourishRules(ctx); // (a flourish of the Courier's worn: vfx/flourishes.js)
  graphicsRules(ctx); // (the graphics tier, dynamic resolution: render/graphics.js)
  instrumentRules(ctx); // (an instrument skin put on: vfx/instrumentskins.js)
  touchPlayRules(ctx); // (touch play's settings: the layout kept, gyro steering's motion access: core/layoutkeep.js, core/gyrosteer.js)
  perfReadoutRules(ctx); // (/perf: the performance readout, debug/perfreadout.js; nothing counted)
  startAtRules(ctx); // (?at=: where the Courier was set down, debug/startat.js; nothing counted)
  lockheartRules(ctx); // (the Lockheart's Overload recoil) // (the god hand's matter, miracles, epics and the island's rejection)
  voyageRules(sea);
  gardenRules(ctx);
  weatherRules(ctx);
  dunemawRules(ctx);
  placeRules(ctx);
  throwingRoomRules(ctx);
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
  // (the trail rules, once tracking.js's own, after every area's)
  treasureRules(ctx);
  standingRules(ctx);
  shopRules(ctx);
  psygunVariantRules(ctx);
  vesselRules(ctx);
  shrineRules(ctx);
  commandEchoRules(ctx);
  gardenGrowthRules(ctx); // (the garden's seeds, the slabs carved, the codes scanned: last, after every rule that counts an act a seed reads: tracking/gardengrowth.js)
}
