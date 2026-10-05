// ---------------------------------------------------------------------------------------
// TRACKING, THE EMOCEAN: the rules that hear a voyage (progress/voyage.js) and keep the counts the slice's contract names
// (docs/plans/SLICE.md, "The contract"), with the log's lines for casting off, making port, losing cargo and finding the way. The words
// are placeholders for Espada's (the log's phrasing is Espada's to edit as strings). tracking.js calls it from listen().
//
//   voyageRules({ on, L, log })     on(event, fn)   L: the ledger   log: the game log
// ---------------------------------------------------------------------------------------
import { NODES } from '../../progress/econ/emocean.js';

const PLACE = (id) => NODES[id]?.name || id;

export function voyageRules({ on, L, log }) {
  let haul = 0; // (what this cargo has made so far: one crossing's sales, for the record)
  on('emocean.hop', (e) => { if (e.by !== 'courier') return; L.inc('emocean.hop'); haul = 0; log.say('explore', `You cast off for ${PLACE(e.to)}, burning ${e.fuel} cubes of fuel.`); });
  on('emocean.stage', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`emocean.port.${e.to}`);
    if (e.passed) { L.inc('emocean.stage.passed'); if (!e.hits) L.inc('emocean.stage.clean'); }
    if (e.spilled) L.inc('crude.spill');
    if (e.lost) log.say('warn', `The sea takes ${e.lost} ${e.lost === 1 ? 'cask' : 'casks'} of crude${e.spilled ? ', and what spills of it goes on burning' : ''}.`);
    log.say('explore', `You make port at ${PLACE(e.to)}.`);
  });
  on('emocean.reckon', (e) => {
    if (e.by !== 'courier') return;
    const pct = Math.round((e.reckoning || 0) * 100), route = [e.from, e.to].sort().join('-');
    L.hi(`emocean.reckon.${route}`, pct); L.hi('emocean.reckon.best', pct);
  });
  on('emocean.found', (e) => { if (e.by !== 'courier') return; L.inc(`emocean.found.${e.node}`); log.say('explore', `You have divined the way to ${PLACE(e.node)}.`); });
  on('crude.buy', (e) => { if (e.by === 'courier') L.inc('crude.bought', e.units || 1); });
  on('crude.sell', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`crude.sold.${e.island}`, e.units || 1); L.inc(`crude.route.${e.from}.${e.island}`, e.units || 1);
    haul += e.profit || 0; if (haul > 0) L.hi('crude.profit', haul);
  });
  on('cogitomap.sell', (e) => { if (e.by !== 'courier') return; L.inc('cogitomap.sold'); L.inc(`cogitomap.sold.${e.island}`); });
}
