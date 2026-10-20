// ---------------------------------------------------------------------------------------
// TRACKING, THE OPEN SEA (docs/plans/OPEN-SEA.md section 8): the voyage said in the log (the only narration) and counted in the ledger.
// The words are plain placeholders for Espada's, the open sea not yet called final.
//
//   opensea.enter  opensea.board  opensea.moor { islet?, quay? }  sea.chart { square }  sea.find { id, kind, tier }  sea.fix { ok, how }
//   sea.report { id, tier, fee }  sea.dock { island, paid, fuelCost, short? }  sea.tow { to, fee }  sea.secret { kind }  sea.fuel.low { fuel }
//   (each with `by`)
//
//   openSeaRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const KIND = { islet: 'an islet', monument: 'a monument under the water', wreck: 'a wreck', phenomenon: 'something strange on the water', seep: 'a seep of crude' };
const ISLAND = { margarite: 'Margarite', anagami: 'Anagami', entra: 'Entropolis' };
const SECRET = { chest: 'a chest', ostracon: 'an ostracon', vantage: 'a view', nest: 'a nest', fuel: 'a fuel cache: 3 measures', stele: 'a stele', fishing: 'a fishing spot', crystal: 'a crystal' };

export function openSeaRules({ on, L, log }) {
  on('opensea.enter', () => log.say('info', "The open sea, at Anagami's quay. F at the ship to board; W and S set the sail, A and D the rudder.", { key: 'sea.enter', throttle: 4 }));
  on('opensea.board', () => L.inc('sea.board'));
  on('opensea.moor', (e) => { L.inc('sea.moor'); if (e.islet) log.say('info', 'You moor and step onto the islet. F at the ship to board again.', { key: 'sea.moor', throttle: 3 }); });
  on('sea.chart', (e) => { if (e.by !== 'courier') return; L.inc('sea.chart'); log.say('explore', 'You chart a new square of sea.', { key: 'sea.chart', throttle: 6 }); });
  on('sea.find', (e) => { if (e.by !== 'courier') return; L.inc(`sea.find.${e.tier}`); log.say('explore', `You find ${KIND[e.kind] || 'something'} (${e.tier}). Report it at a dock.`, { key: `sea.find.${e.id}`, throttle: 1 }); });
  on('sea.fix', (e) => { if (e.ok) { L.inc('sea.fix'); log.say('info', e.how === 'sky' ? 'You read the sky and know where you are.' : 'A landmark you know: you know where you are.', { key: 'sea.fix', throttle: 4 }); } else log.say('warn', 'The sky is hidden: no reading.', { key: 'sea.fix.no', throttle: 4 }); });
  on('sea.report', (e) => L.inc('sea.report'));
  on('sea.dock', (e) => log.say('info', `${ISLAND[e.island] || 'The dock'}: ${e.paid ? `your reports pay ${e.paid} cubes` : 'nothing to report'}; ${e.short ? `you can pay for ${e.fuelCost} cubes of fuel` : `the tank filled for ${e.fuelCost} cubes`}.`, { key: 'sea.dock', throttle: 1 }));
  on('sea.tow', (e) => { L.inc('sea.tow'); log.say('warn', `Your tank is dry: a tug tows you to the lane for ${e.fee} cubes.`, { key: 'sea.tow', throttle: 2 }); });
  on('sea.secret', (e) => { L.inc(`sea.secret.${e.kind}`); log.say('explore', `On the islet: ${SECRET[e.kind] || 'something'}.`, { key: 'sea.secret', throttle: 1 }); });
  on('sea.fuel.low', () => log.say('warn', 'Fuel is low: make for a dock.', { key: 'sea.fuel', throttle: 10 }));
}
