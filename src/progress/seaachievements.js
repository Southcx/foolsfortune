// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S ACHIEVEMENTS (docs/plans/OPEN-SEA.md sections 8, 13 and 14): predicates over the ledger (feedback/tracking/opensea.js and
// seaserpent.js keep it), the EMOCEAN category's "The Open Sea" sub: charting, the migrations, the sea serpent, and the rework's salvage,
// gusts and ship's parts. Split from achievements.js (its module budget), in its old place in the list.
//
// Prior art: Sea of Thieves' commendations (a count of shipwrecks salvaged), the house's own achievements.js (its helpers passed in).
//
//   seaAchievements({ C, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { SHIP_PARTS, PART_SLOTS } from './opensea/salvage.js';
import { EGREGORES } from './opensea/safari.js';

const PARTS = PART_SLOTS.flatMap((s) => Object.keys(SHIP_PARTS[s]).filter((id) => id !== 'stock'));

export function seaAchievements({ C, F }) {
  // the open sea (progress/opensea/; OPEN-SEA.md 8 and 13): charting, the whole sea, the migrations; names placeholders for Espada's
  C('sea1', 'emocean', 'The Open Sea', 1, 'count', 'Off the Lanes', 'Chart a square of the open sea.', 'sea.chart', 1);
  C('sea2', 'emocean', 'The Open Sea', 4, 'collect', 'Cartographer', 'Chart every square of the open sea.', 'sea.chart', 63, { title: 'Cartographer' });
  C('sea3', 'emocean', 'The Open Sea', 2, 'count', 'Herd Watcher', 'Photograph ten herds from the dock\'s board.', 'sea.herd', 10);
  F('sea4', 'emocean', 'The Open Sea', 3, 'collect', 'Migration Season', 'Photograph herds of six kinds of Egregore.', (L) => Object.keys(EGREGORES).filter((id) => L.get(`sea.herd.${id}`) >= 1).length, 6);
  // the sea serpent (Petra's fight, world/opensea/seafight.js; its counts tracking/seaserpent.js, the whole hull tracking/opensea.js)
  C('sea5', 'emocean', 'The Open Sea', 2, 'count', 'Something Long', 'Sink a sea serpent.', 'seaserpent.down', 1);
  C('sea6', 'emocean', 'The Open Sea', 2, 'mechanic', 'Shake It Loose', 'Shoot a coiled sea serpent loose of your hull.', 'seaserpent.free.shot', 1);
  C('sea7', 'emocean', 'The Open Sea', 3, 'mechanic', 'Not a Scratch', 'Sink a sea serpent with your hull whole.', 'seaserpent.down.whole', 1);
  C('sea8', 'emocean', 'The Open Sea', 3, 'endure', 'Serpent Season', 'Sink 10 sea serpents.', 'seaserpent.down', 10);
  // the rework (OPEN-SEA.md 14): salvage, the gusts, the ship's parts
  C('sea9', 'emocean', 'The Open Sea', 1, 'count', 'Salvager', 'Haul a crate up from a wreck.', 'sea.salvage', 1);
  C('sea10', 'emocean', 'The Open Sea', 3, 'endure', 'Wrecker\'s Wages', 'Haul 50 crates up from wrecks.', 'sea.salvage', 50);
  C('sea11', 'emocean', 'The Open Sea', 2, 'mechanic', 'Cat\'s Paw', 'Sail into 20 gusts.', 'sea.gust', 20);
  F('sea12', 'emocean', 'The Open Sea', 3, 'collect', 'Fitted Out', 'Find every ship\'s part: three sails, two keels, two hulls.', (L) => PARTS.filter((id) => L.get(`ship.part.${id}`) > 0).length, PARTS.length);
  C('sea13', 'emocean', 'The Open Sea', 2, 'count', 'Refit', 'Fit a part to your ship at a quay.', 'ship.part.wear', 1);
  C('sea14', 'emocean', 'The Open Sea', 2, 'count', 'Message in a Bottle', 'Read the note in a drift bottle.', 'sea.bottle', 1);
}
