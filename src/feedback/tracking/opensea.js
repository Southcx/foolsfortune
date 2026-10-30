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
  on('opensea.enter', () => log.say('info', said(g, "The open sea, at Anagami's quay. {use} at the ship boards it; {heUp} and {heDown} set the sail, the stick or A and D the rudder; across the wind the engine burns least."), { key: 'sea.enter', throttle: 4 }));
  on('opensea.board', () => L.inc('sea.board'));
  // the wind (progress/opensea/wind.js; OPEN-SEA.md 14): head to wind the sail gives nothing and the engine burns it all
  // salvage and the ship's parts (progress/opensea/salvage.js; OPEN-SEA.md 14.4)
  const PART = { lateen: 'a lateen sail', spinnaker: 'a spinnaker', storm: 'a storm sail', deep: 'a deep keel', shallow: 'a shallow keel', scaled: 'a scaled hull', light: 'a light hull', krakenSail: 'a kraken sail', worldSail: 'a Jormungandr sail', serpentKeel: 'a sea serpent keel', akhlutHull: 'an akhlut hull', monkHull: 'an umibozu hull' };
  on('sea.salvage', (e) => { if (e.by !== 'courier') return; L.inc('sea.salvage'); L.inc(`sea.salvage.${e.tier}`);
    log.say('gain', e.part ? `You haul up a crate: ${PART[e.part] || 'a ship\'s part'}. Fit it at a quay (/shippart ${e.part}).` : `You haul up a crate: ${e.cubes} cubes.${e.left ? '' : ' The wreck gives no more this game day.'}`, { key: 'sea.salvage', throttle: 1 }); });
  on('ship.part', (e) => { if (e.by !== 'courier') return; if (e.how === 'wear') { L.inc('ship.part.wear'); log.say('info', `Fitted: ${PART[e.part] || 'the part as built'}.`, { key: 'ship.part', throttle: 1 }); } else { L.inc('ship.part'); L.inc(`ship.part.${e.part}`); if (e.how === 'forge') { L.inc('ship.forge'); log.say('gain', `The quay's forge makes you ${PART[e.part]}. /shippart ${e.part} fits it.`, { key: 'ship.part', throttle: 1 }); } } });
  on('sea.rumour', (e) => log.say('info', `The board's rumour: a ${kind(e.id)} ${e.squares ? `${e.squares} square${e.squares === 1 ? '' : 's'} ${e.way}` : 'in these waters'}. Sink it there this game day for the bounty.`, { key: 'sea.rumour', throttle: 1 }));
  on('sea.rumour.paid', (e) => { if (e.by !== 'courier') return; L.inc('sea.rumour'); log.say('gain', `The rumour's bounty: ${e.cubes} cubes.`, { key: 'sea.rumour.paid', throttle: 1 }); });
  on('sea.habit', (e) => { if (e.by !== 'courier') return; L.inc(`sea.habit.${e.id}.${e.habit}`); if (!e.first) return; L.inc('sea.habit');
    log.say('explore', `A ${kind(e.id)} ${e.label}: new for your research.${e.cubes ? ` Paid at the next dock (${e.cubes} cubes).` : ''}`, { key: 'sea.habit', throttle: 1 }); });
  on('sea.bottle', (e) => { if (e.by !== 'courier') return; L.inc('sea.bottle'); log.say('explore', `A bottle adrift, a note inside: "${e.text}"`, { key: 'sea.bottle', throttle: 1 }); });
  on('sea.gust', (e) => { if (e.by === 'courier') L.inc('sea.gust'); }); // (a cat's paw caught: the sail and the water say it; the ledger counts it)
  on('sea.rip', (e) => { if (e.by !== 'courier') return; L.inc('sea.rip'); log.say('info', 'A current takes the ship. Ride it, or steer out of its band.', { key: 'sea.rip', throttle: 60 }); });
  on('sea.luff', (e) => { if (e.by !== 'courier') return; L.inc('sea.luff'); log.say('info', 'Your sail luffs: you are head to wind. Bear away and it fills.', { key: 'sea.luff', throttle: 30 }); });
  on('opensea.moor', (e) => { L.inc('sea.moor'); if (e.islet) log.say('info', said(g, `${landingLine(e.islet, e.kit)} ({use} at the ship to board again.)`), { key: 'sea.moor', throttle: 3 }); });
  on('sea.chart', (e) => { if (e.by !== 'courier') return; L.inc('sea.chart'); log.say('explore', 'You chart a new square of sea.', { key: 'sea.chart', throttle: 6 }); });
  on('sea.find', (e) => { if (e.by !== 'courier') return; L.inc(`sea.find.${e.tier}`); log.say('explore', `You find ${KIND[e.kind] || 'something'} (${e.tier}). Report it at a dock.`, { key: `sea.find.${e.id}`, throttle: 1 }); });
  on('sea.fix', (e) => { if (e.ok) { L.inc('sea.fix'); log.say('info', e.how === 'sky' ? 'You read the sky and know where you are.' : 'A landmark you know: you know where you are.', { key: 'sea.fix', throttle: 4 }); } else log.say('warn', 'The sky is hidden: no reading.', { key: 'sea.fix.no', throttle: 4 }); });
  on('sea.report', (e) => L.inc('sea.report'));
  // the migrations (progress/opensea/migrations.js; OPEN-SEA.md 13): the dock's board posts a game day's herds; one photographed pays once
  const kind = (id) => id.replace(/([A-Z])/g, ' $1').toLowerCase(); // (a species' plain words from its id until Espada names them)
  on('sea.herds', (e) => log.say('info', `The board at the dock: ${e.n} herds gathered at sea this game day${e.herds?.length ? `: ${e.herds.map((h) => `${kind(h.id)}, ${h.squares ? `${h.squares} square${h.squares > 1 ? 's' : ''} ${h.way}` : 'here'}`).join('; ')}` : ''}. A plate of one in its square pays.`, { key: 'sea.herds', throttle: 30 }));
  on('sea.plate', (e) => { if (e.by !== 'courier') return; L.inc('sea.plate'); log.say('info', 'You take a plate over the bow.', { key: 'sea.plate', throttle: 2 }); });
  on('sea.herd.paid', (e) => { if (e.by !== 'courier') return; log.say('gain', `The herds you photographed pay ${e.cubes} cubes (${e.n}).`, { key: 'sea.herd.paid', throttle: 1 }); });
  on('seaserpent.paid', (e) => { if (e.by !== 'courier') return; if (e.hull >= e.of) L.inc('seaserpent.down.whole'); log.say('gain', `Sinking the sea serpent pays ${e.cubes} cubes. Your hull came through able to take ${e.hull} of ${e.of} hits.`, { key: 'ss.paid', throttle: 1 }); }); // (Dovina's serpentPay; words a placeholder, Espada's)
  on('sea.herd', (e) => { if (e.by !== 'courier') return; L.inc('sea.herd'); L.inc(`sea.herd.${e.id}`); log.say('gain', `You photograph the herd: ${e.cubes} cubes when you next dock.`, { key: 'sea.herd', throttle: 2 }); });
  on('sea.dock', (e) => log.say('info', `${ISLAND[e.island] || 'The dock'}: ${e.paid ? `your reports pay ${e.paid} cubes` : 'nothing to report'}; ${e.short ? `you can pay for ${e.fuelCost} cubes of fuel` : `the tank filled for ${e.fuelCost} cubes`}.`, { key: 'sea.dock', throttle: 1 }));
  on('sea.square.done', (e) => { if (e.by !== 'courier') return; L.inc('sea.square.done'); L.inc(`sea.square.done.c${e.cls}`); log.say('find', `Square ${e.square} is charted whole: you have found everything in it. ${e.cubes} cubes. ${e.n} of ${e.of} squares done.`, { key: 'sea.square', throttle: 1 }); });
  on('sea.tow', (e) => { L.inc('sea.tow'); log.say('warn', `Your tank is dry: a tug tows you to the lane for ${e.fee} cubes.`, { key: 'sea.tow', throttle: 2 }); });
  on('sea.secret', (e) => { L.inc(`sea.secret.${e.kind}`); log.say('explore', secretLine(e.kind, e.islet), { key: 'sea.secret', throttle: 1 }); });
  // the islets' puzzles say what they are (the owner tried them and "didn't know what I was looking at", 2026-10-30): once a piece, when you first
  // come near it, what it is and which tool solves it. The words are PLACEHOLDERS, plain, for Espada to word; {dvDowse} is the dowse's own
  // control on the device last touched, {use} the use key.
  const SIGHT_LINES = {
    pair: 'A carved stone. Its twin stands on another islet: find both.',
    lineup: 'A grooved stone. Stand on it and look along the groove, a little above the horizon.',
    echo: 'A stone that sings. Play its notes back on the Crucibelle at the stone that listens.',
    listen: 'A stone with a socket for each note. Play the phrase the singing stone sings, on the Crucibelle, beside this one.',
    cache: 'The sand here hums. Draw the Dreamvane and hold {dvDowse} to dowse.',
    bottle: 'A bottle adrift. Come alongside and press {use} to read its note.',
  };
  on('sea.puzzle.seen', (e) => { if (e.by !== 'courier' || !SIGHT_LINES[e.kind]) return; L.inc('sea.puzzle.seen'); L.inc(`sea.puzzle.seen.${e.kind}`);
    log.say('explore', said(g, SIGHT_LINES[e.kind]), { key: `sea.puzzle.seen.${e.kind}.${e.id}`, throttle: 2 }); });
  on('sea.pair.half', (e) => log.say('explore', `A carved ${e.shape} stands here. It looks like one of a pair: seen both, they are a find to report at a dock.`, { key: `sea.pair.${e.id}`, throttle: 2 }));
  on('sea.pair', (e) => { L.inc('sea.pair'); log.say('explore', `This ${e.shape} is the twin of one you saw on another islet: a find (${e.tier}). Report it at a dock.`, { key: 'sea.pair', throttle: 1 }); });
  on('sea.lineup', (e) => { L.inc('sea.lineup'); log.say('explore', `The arcs close into one ring. You know where you are${e.charted ? `, and ${e.charted} squares round you are charted` : ''}.`, { key: 'sea.lineup', throttle: 1 }); });
  // the phrase as the Crucibelle's note numbers (1 to 5, the keys it is played on), said each time you come near, at most once a real minute
  on('sea.echo.hear', (e) => log.say('explore', `The stone sings: ${(e.phrase || []).join(' ')}.${e.first ? ' Play it back on the Crucibelle at the stone that listens.' : ''}`, { key: `sea.echo.${e.id}`, throttle: 60 }));
  on('sea.echo.miss', (e) => { if (e.by !== 'courier') return; L.inc('sea.echo.miss'); log.say('info', 'The stone does not answer. Its phrase starts again.', { key: `sea.echo.miss.${e.id}`, throttle: 4 }); });
  on('sea.echo', () => { L.inc('sea.echo'); log.say('explore', 'The listening stone hears its phrase. Something rises out of the sand.', { key: 'sea.echo', throttle: 1 }); });
  on('sea.dig', (e) => { if (e.by !== 'courier') return; L.inc('sea.dig'); L.inc(`sea.dig.${e.tier}`); log.say('find', `You dig up a buried cache (${e.tier}): ${e.cubes} cubes.`, { key: 'sea.dig', throttle: 1 }); });
  on('sea.stele', (e) => { L.inc('sea.stele.read'); log.say('info', `The stele reads: ${e.line}`, { key: `sea.stele.${e.islet}`, throttle: 3 }); });
  on('sea.fuel.low', () => log.say('warn', 'Fuel is low: make for a dock.', { key: 'sea.fuel', throttle: 10 }));
}
