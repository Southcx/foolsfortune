// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S ACHIEVEMENTS (docs/plans/OPEN-SEA.md sections 8, 13 and 14): predicates over the ledger (feedback/tracking/opensea.js and
// seaserpent.js keep it), the EMOCEAN category's "The Open Sea" sub: charting, the migrations, the sea serpent, and the rework's salvage,
// gusts and ship's parts, and the islets' puzzles and caches (sea23 to sea30). Split from achievements.js (its module budget), in its old place in the list.
//
// Prior art: Sea of Thieves' commendations (a count of shipwrecks salvaged), the house's own achievements.js (its helpers passed in).
//
//   seaAchievements({ C, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { SALVAGE_PARTS } from './opensea/salvage.js';
import { FORGE_PARTS } from './opensea/forge.js';
import { EGREGORES } from './opensea/safari.js';
import { PUZZLE_COUNT } from './opensea/isletpuzzles.js';

const PARTS = SALVAGE_PARTS;

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
  // the forge (opensea/forge.js; OPEN-SEA.md 14.10): a beast's part forged from the beasts sunk
  C('sea15', 'emocean', 'The Open Sea', 2, 'count', 'Carved', 'Forge a beast\'s part at a quay.', 'ship.forge', 1);
  F('sea16', 'emocean', 'The Open Sea', 4, 'collect', 'Trophy Hull', 'Forge every beast\'s part: the serpent\'s, the akhlut\'s, the umibozu\'s, the kraken\'s and Jormungandr\'s.', (L) => FORGE_PARTS.filter((id) => L.get(`ship.part.${id}`) > 0).length, FORGE_PARTS.length);
  // the umibozu and the kraken in play (Petra's v314, creatures/seaserpent/shapes.js; counts tracking/seaserpent.js)
  C('sea21', 'emocean', 'The Open Sea', 3, 'mechanic', 'A Ladle with No Bottom', 'Drink the umibozu\'s pour with the Lockheart\'s gulp until it lets go.', 'seabeast.free.gulp', 1);
  C('sea22', 'emocean', 'The Open Sea', 3, 'endure', 'Eight Arms Short', 'Shoot 12 of the kraken\'s arms off.', 'seabeast.break', 12);
  // a square completed (opensea/squares.js; OPEN-SEA.md 15.5): everything in it found, taken and salvaged
  C('sea18', 'emocean', 'The Open Sea', 2, 'count', 'Every Stone', 'Complete a square of the open sea: everything in it found.', 'sea.square.done', 1);
  C('sea19', 'emocean', 'The Open Sea', 4, 'endure', 'Cartographer', 'Complete 20 squares of the open sea.', 'sea.square.done', 20);
  C('sea20', 'emocean', 'The Open Sea', 4, 'mechanic', 'Edge of the Map', 'Complete a square of the open sea\'s wildest class (3).', 'sea.square.done.c3', 1);
  C('sea17', 'emocean', 'The Open Sea', 2, 'count', 'Bigger Fish', 'Sink a beast of the sea other than a serpent.', 'seabeast.down', 1);
  C('sea14', 'emocean', 'The Open Sea', 2, 'count', 'Message in a Bottle', 'Read the note in a drift bottle.', 'sea.bottle', 1);
  // the islets' puzzles and the buried caches (isletpuzzles.js, puzzlepieces.js; OPEN-SEA.md 12; their counts tracking/opensea.js): the first of each kind,
  // then every one of it a sea deals (a sea always deals 3 pairs, 3 line-ups and 2 echoes on its 20 islets; its caches run 7 to 13, so the Medium is 7)
  C('sea23', 'emocean', 'The Open Sea', 1, 'mechanic', 'Matched Pair', 'Find both carved stones of a pair, on two islets.', 'sea.pair', 1);
  C('sea24', 'emocean', 'The Open Sea', 2, 'collect', 'Every Twin', 'Find every pair of carved stones in the open sea.', 'sea.pair', PUZZLE_COUNT.pairs);
  C('sea25', 'emocean', 'The Open Sea', 1, 'mechanic', 'Lined Up', 'Stand on a grooved stone and close the arcs into a ring.', 'sea.lineup', 1);
  C('sea26', 'emocean', 'The Open Sea', 2, 'collect', 'Every Ring', 'Close every ring of arcs in the open sea.', 'sea.lineup', PUZZLE_COUNT.lineups);
  C('sea27', 'emocean', 'The Open Sea', 1, 'mechanic', 'Played Back', 'Play a singing stone\'s phrase back on the Crucibelle at the stone that listens.', 'sea.echo', 1);
  C('sea28', 'emocean', 'The Open Sea', 2, 'collect', 'Every Stone Sings', 'Answer every singing stone in the open sea.', 'sea.echo', PUZZLE_COUNT.echoes);
  C('sea29', 'emocean', 'The Open Sea', 1, 'mechanic', 'X Marks the Sand', 'Dig up a buried cache.', 'sea.dig', 1);
  C('sea30', 'emocean', 'The Open Sea', 2, 'endure', 'Treasure Hunter', 'Dig up 7 buried caches.', 'sea.dig', 7);
}
