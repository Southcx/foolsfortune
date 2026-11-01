// ---------------------------------------------------------------------------------------
// TRACKING, THE OPEN SEA (docs/plans/OPEN-SEA.md section 8): the voyage said in the log (the only narration) and counted in the ledger.
// The words are Espada's and plain, the open sea not yet called final; an islet's landing and secret lines are hers, npc/isletlines.js.
//
//   opensea.enter  opensea.board  opensea.moor { islet?, quay? }  sea.chart { square }  sea.find { id, kind, tier }  sea.fix { ok, how }
//   sea.report { id, tier, fee }  sea.dock { island, paid, fuelCost, short? }  sea.tow { to, fee }  sea.secret { kind }  sea.fuel.low { fuel }
//   sea.puzzle.seen { kind, id, islet } (a piece's first sight)  sea.pair.half { id, shape }  sea.pair { id, shape, tier }  sea.lineup { id, charted }
//   sea.echo.hear { id, notes, phrase, first }  sea.echo.miss { id, degree }  sea.echo { id }
//   sea.dig { id, tier, cubes, how }  sea.stele { islet, words, line }   sea.herds { day, n, herds }  sea.herd { id, square, cubes }  sea.herd.paid { cubes, n }   (the migrations)   seaserpent.paid { cubes, hull, of }   (the islets' puzzles and caches: world/opensea/puzzlepieces.js)
//   sea.luff { from } (head to wind under way)  sea.gust { k }  sea.rip { square }  sea.salvage { wreck, tier, cubes, part, left }  ship.part { slot, part, how }  sea.bottle { id, islet, text }  sea.rumour { id, squares, way }  sea.rumour.paid { id, cubes }  sea.habit { id, habit, label, first, cubes }  sea.square.done { square, cls, cubes, n, of }   (each with `by`)
//
//   openSeaRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { landingLine, secretLine } from '../../npc/isletlines.js';
import { said } from './lineformat.js';

const KIND = { islet: 'an islet', monument: 'a monument under the water', wreck: 'a wreck', phenomenon: 'something strange on the water', seep: 'a seep of crude' };
const ISLAND = { margarite: 'Margarite', anagami: 'Anagami', entra: 'Entropolis' };

export function openSeaRules({ on, L, log, g }) {
  on('opensea.enter', () => log.say('info', said(g, "Open sea: Anagami's quay. Press {use} at the ship to board. Use {heUp} and {heDown} to set the sail, and the stick or A and D to steer. Hint: sailing across the wind burns the least fuel."), { key: 'sea.enter', throttle: 4 }));
  on('opensea.board', () => L.inc('sea.board'));
  // the wind (progress/opensea/wind.js; OPEN-SEA.md 14): head to wind the sail gives nothing and the engine burns it all
  // salvage and the ship's parts (progress/opensea/salvage.js; OPEN-SEA.md 14.4)
  const PART = { lateen: 'a lateen sail', spinnaker: 'a spinnaker', storm: 'a storm sail', deep: 'a deep keel', shallow: 'a shallow keel', scaled: 'a scaled hull', light: 'a light hull', krakenSail: 'a kraken sail', worldSail: 'a Jormungandr sail', serpentKeel: 'a sea serpent keel', akhlutHull: 'an akhlut hull', monkHull: 'an umibozu hull' };
  on('sea.salvage', (e) => { if (e.by !== 'courier') return; L.inc('sea.salvage'); L.inc(`sea.salvage.${e.tier}`);
    log.say('gain', e.part ? `Crate hauled up. Inside: ${PART[e.part] || 'a ship\'s part'}. Fit it at a quay with /shippart ${e.part}.` : `Crate hauled up. Inside: ${e.cubes} cubes.${e.left ? '' : ' The wreck is empty for this game day.'}`, { key: 'sea.salvage', throttle: 1 }); });
  on('ship.part', (e) => { if (e.by !== 'courier') return; if (e.how === 'wear') { L.inc('ship.part.wear'); log.say('info', `Fitted: ${PART[e.part] || 'the part as built'}.`, { key: 'ship.part', throttle: 1 }); } else { L.inc('ship.part'); L.inc(`ship.part.${e.part}`); if (e.how === 'forge') { L.inc('ship.forge'); log.say('gain', `Forged at the quay: ${PART[e.part]}. Type /shippart ${e.part} to fit it.`, { key: 'ship.part', throttle: 1 }); } } });
  on('sea.rumour', (e) => log.say('info', `The board's rumour: a ${kind(e.id)} ${e.squares ? `${e.squares} square${e.squares === 1 ? '' : 's'} ${e.way}` : 'in these waters'}. Sink it there this game day for the bounty.`, { key: 'sea.rumour', throttle: 1 }));
  on('sea.rumour.paid', (e) => { if (e.by !== 'courier') return; L.inc('sea.rumour'); log.say('gain', `The rumour's bounty: ${e.cubes} cubes.`, { key: 'sea.rumour.paid', throttle: 1 }); });
  on('sea.habit', (e) => { if (e.by !== 'courier') return; L.inc(`sea.habit.${e.id}.${e.habit}`); if (!e.first) return; L.inc('sea.habit');
    log.say('explore', `Habit recorded: a ${kind(e.id)} ${e.label}.${e.cubes ? ` ${e.cubes} cubes paid at your next dock.` : ''}`, { key: 'sea.habit', throttle: 1 }); });
  on('sea.bottle', (e) => { if (e.by !== 'courier') return; L.inc('sea.bottle'); log.say('explore', `Drift bottle opened. The note reads: "${e.text}"`, { key: 'sea.bottle', throttle: 1 }); });
  on('sea.gust', (e) => { if (e.by === 'courier') L.inc('sea.gust'); }); // (a cat's paw caught: the sail and the water say it; the ledger counts it)
  on('sea.rip', (e) => { if (e.by !== 'courier') return; L.inc('sea.rip'); log.say('info', 'Rip current. Ride it, or steer out of its band.', { key: 'sea.rip', throttle: 60 }); });
  on('sea.luff', (e) => { if (e.by !== 'courier') return; L.inc('sea.luff'); log.say('info', 'Sail luffing. You are head to wind. Turn away from the wind to fill the sail.', { key: 'sea.luff', throttle: 30 }); });
  on('opensea.moor', (e) => { L.inc('sea.moor'); if (e.islet) log.say('info', said(g, `${landingLine(e.islet, e.kit)} (Press {use} at the ship to board again.)`), { key: 'sea.moor', throttle: 3 }); });
  on('sea.chart', (e) => { if (e.by !== 'courier') return; L.inc('sea.chart'); log.say('explore', 'New square charted.', { key: 'sea.chart', throttle: 6 }); });
  on('sea.find', (e) => { if (e.by !== 'courier') return; L.inc(`sea.find.${e.tier}`); log.say('explore', `Found: ${KIND[e.kind] || 'something'} (${e.tier}). Report it at a dock.`, { key: `sea.find.${e.id}`, throttle: 1 }); });
  on('sea.fix', (e) => { if (e.ok) { L.inc('sea.fix'); log.say('info', e.how === 'sky' ? 'Sky read. Position fixed.' : 'Known landmark sighted. Position fixed.', { key: 'sea.fix', throttle: 4 }); } else log.say('warn', 'No reading. The sky is hidden.', { key: 'sea.fix.no', throttle: 4 }); });
  on('sea.report', (e) => L.inc('sea.report'));
  // the migrations (progress/opensea/migrations.js; OPEN-SEA.md 13): the dock's board posts a game day's herds; one photographed pays once
  const kind = (id) => id.replace(/([A-Z])/g, ' $1').toLowerCase(); // (a species' plain words from its id until Espada names them)
  on('sea.herds', (e) => log.say('info', `Dock board: ${e.n} herds at sea this game day${e.herds?.length ? `. ${e.herds.map((h) => `${kind(h.id)}, ${h.squares ? `${h.squares} square${h.squares > 1 ? 's' : ''} ${h.way}` : 'here'}`).join('; ')}` : ''}. Photograph a herd in its square to be paid.`, { key: 'sea.herds', throttle: 30 }));
  on('sea.plate', (e) => { if (e.by !== 'courier') return; L.inc('sea.plate'); log.say('info', 'Plate taken over the bow.', { key: 'sea.plate', throttle: 2 }); });
  on('sea.herd.paid', (e) => { if (e.by !== 'courier') return; log.say('gain', `Herds photographed: ${e.n}. Paid: ${e.cubes} cubes.`, { key: 'sea.herd.paid', throttle: 1 }); });
  on('seaserpent.paid', (e) => { if (e.by !== 'courier') return; if (e.hull >= e.of) L.inc('seaserpent.down.whole'); log.say('gain', `Sea serpent sunk! Paid: ${e.cubes} cubes. Hull: ${e.hull} of ${e.of} hits left.`, { key: 'ss.paid', throttle: 1 }); }); // (Dovina's serpentPay; words a placeholder, Espada's)
  on('sea.herd', (e) => { if (e.by !== 'courier') return; L.inc('sea.herd'); L.inc(`sea.herd.${e.id}`); log.say('gain', `Herd photographed. ${e.cubes} cubes paid at your next dock.`, { key: 'sea.herd', throttle: 2 }); });
  on('sea.dock', (e) => log.say('info', `${ISLAND[e.island] || 'The dock'}. ${e.paid ? `Reports paid: ${e.paid} cubes.` : 'Nothing to report.'} ${e.short ? `You can pay for only ${e.fuelCost} cubes of fuel.` : `Tank filled for ${e.fuelCost} cubes.`}`, { key: 'sea.dock', throttle: 1 }));
  on('sea.square.done', (e) => { if (e.by !== 'courier') return; L.inc('sea.square.done'); L.inc(`sea.square.done.c${e.cls}`); log.say('find', `Square ${e.square} complete! Everything in it found. Reward: ${e.cubes} cubes. ${e.n} of ${e.of} squares complete.`, { key: 'sea.square', throttle: 1 }); });
  on('sea.tow', (e) => { L.inc('sea.tow'); log.say('warn', `Out of fuel. Towed to the lane for ${e.fee} cubes.`, { key: 'sea.tow', throttle: 2 }); });
  on('sea.secret', (e) => { L.inc(`sea.secret.${e.kind}`); log.say('explore', secretLine(e.kind, e.islet), { key: 'sea.secret', throttle: 1 }); });
  // the islets' puzzles say what they are (the owner tried them and "didn't know what I was looking at", 2026-10-30): once a piece, when you first
  // come near it, what it is and which tool solves it. The words are PLACEHOLDERS, plain, for Espada to word; {dvDowse} is the dowse's own
  // control on the device last touched, {use} the use key.
  const SIGHT_LINES = {
    pair: 'A carved stone. Its twin is on another islet. Find both.',
    lineup: 'A grooved stone. Stand on it and look along the groove, a little above the horizon.',
    echo: 'A singing stone. Play its notes back on the Crucibelle at the listening stone.',
    listen: 'A listening stone, with a socket for each note. Play the singing stone\'s phrase on the Crucibelle beside it.',
    cache: 'The sand here hums. Draw the Dreamvane and hold {dvDowse} to dowse.',
    bottle: 'A drift bottle. Come alongside and press {use} to read its note.',
  };
  on('sea.puzzle.seen', (e) => { if (e.by !== 'courier' || !SIGHT_LINES[e.kind]) return; L.inc('sea.puzzle.seen'); L.inc(`sea.puzzle.seen.${e.kind}`);
    log.say('explore', said(g, SIGHT_LINES[e.kind]), { key: `sea.puzzle.seen.${e.kind}.${e.id}`, throttle: 2 }); });
  on('sea.pair.half', (e) => log.say('explore', `A carved ${e.shape}, one of a pair. Find its twin, then report the pair at a dock.`, { key: `sea.pair.${e.id}`, throttle: 2 }));
  on('sea.pair', (e) => { L.inc('sea.pair'); log.say('explore', `Pair found: the twin of a ${e.shape} on another islet (${e.tier}). Report it at a dock.`, { key: 'sea.pair', throttle: 1 }); });
  on('sea.lineup', (e) => { L.inc('sea.lineup'); log.say('explore', `Arcs aligned into one ring. Position fixed${e.charted ? `. ${e.charted} squares around you charted` : ''}.`, { key: 'sea.lineup', throttle: 1 }); });
  // the phrase as the Crucibelle's note numbers (1 to 5, the keys it is played on), said each time you come near, at most once a real minute
  on('sea.echo.hear', (e) => log.say('explore', `Stone's phrase: ${(e.phrase || []).join(' ')}.${e.first ? ' Play it back on the Crucibelle at the listening stone.' : ''}`, { key: `sea.echo.${e.id}`, throttle: 60 }));
  on('sea.echo.miss', (e) => { if (e.by !== 'courier') return; L.inc('sea.echo.miss'); log.say('info', 'Wrong phrase. The stone starts it again.', { key: `sea.echo.miss.${e.id}`, throttle: 4 }); });
  on('sea.echo', () => { L.inc('sea.echo'); log.say('explore', 'Phrase matched. Something rises out of the sand.', { key: 'sea.echo', throttle: 1 }); });
  on('sea.dig', (e) => { if (e.by !== 'courier') return; L.inc('sea.dig'); L.inc(`sea.dig.${e.tier}`); log.say('find', `Buried cache dug up (${e.tier}). Inside: ${e.cubes} cubes.`, { key: 'sea.dig', throttle: 1 }); });
  on('sea.stele', (e) => { L.inc('sea.stele.read'); log.say('info', `The stele reads: ${e.line}`, { key: `sea.stele.${e.islet}`, throttle: 3 }); });
  on('sea.fuel.low', () => log.say('warn', 'Fuel low. Head for a dock.', { key: 'sea.fuel', throttle: 10 }));
}
