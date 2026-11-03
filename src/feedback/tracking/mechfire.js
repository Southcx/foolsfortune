// ---------------------------------------------------------------------------------------
// TRACKING, FIRE IN THE TOY CITY (docs/plans/MECHS.md 12; progress/mechs/fire.js): what a fire says in the log and what the ledger keeps
// of it. Beside tracking/mechs.js and tracking/mechnight.js, the same house: a line an event, the Courier's counted (`by`), the log said
// at a fire's turns (started, a building down, put out, gone out) and never at each cell; words plain until Espada's.
//
// Prior art: Far Cry 2's fire (seen, not narrated: the log says only that it started and what it took), the house's counters.
//
//   mechFireRules({ on, L, log })   (feedback/tracking/rules.js calls it)
//   ledger: city.ignite, city.ignite.<cause>, city.burned.cells, city.felled.fire, city.douse, city.douse.<cause>, mech.heat.full,
//     giant.burn.<id>, giant.vitrify
// ---------------------------------------------------------------------------------------
import { BUILDINGS } from '../../progress/mechs/destruction.js';
import { giantOf } from '../../progress/mechs/giants.js';

const bld = (id) => (BUILDINGS[id]?.label || 'building').toLowerCase();
const giant = (id) => (giantOf(id)?.label || 'giant').toLowerCase();

export function mechFireRules({ on, L, log }) {
  const mine = (e) => e.by === 'courier';
  // city.ignite { building, lot, at, cause, by }
  on('city.ignite', (e) => { if (!mine(e)) return; L.inc('city.ignite'); if (e.cause) L.inc(`city.ignite.${e.cause}`); log.say('info', `The ${bld(e.building)} catches fire.`, { key: `city.ignite.${e.lot}`, throttle: 6 }); });
  // city.char { building, lot, cells, at, by }: cells burned away
  on('city.char', (e) => { if (mine(e) && e.cells > 0) L.inc('city.burned.cells', e.cells | 0); });
  // city.felled gains cause 'fire' (tracking/mechs.js counts the felling itself)
  on('city.felled', (e) => { if (mine(e) && e.cause === 'fire') { L.inc('city.felled.fire'); log.say('gain', `The ${bld(e.building)} burns down.`, { key: 'city.felled.fire', throttle: 2 }); } });
  // city.douse { building, lot, cells, cause: 'water' | 'pound', by }
  on('city.douse', (e) => { if (!mine(e) || !(e.cells > 0)) return; L.inc('city.douse'); if (e.cause) L.inc(`city.douse.${e.cause}`); log.say('info', e.cause === 'water' ? `Water puts out the fire in the ${bld(e.building)}.` : `The blast smothers the fire in the ${bld(e.building)}.`, { key: `city.douse.${e.lot}`, throttle: 3 }); });
  // city.out { building, lot }
  on('city.out', (e) => log.say('info', `The fire in the ${bld(e.building)} burns out.`, { key: `city.out.${e.lot}`, throttle: 6 }));
  // mech.heat { k }: said once as it reaches full
  let hot = false;
  on('mech.heat', (e) => { if (e.k >= 1 && !hot) { hot = true; L.inc('mech.heat.full'); log.say('warn', 'Mech overheating. Get out of the fire.', { key: 'mech.heat', throttle: 4 }); } else if (e.k < 0.5) hot = false; });
  // giant.burn { id, k, by }: alight (k > 0) and out (k 0)
  const alight = new Set();
  on('giant.burn', (e) => {
    if (e.k > 0 && !alight.has(e.id)) { alight.add(e.id); if (mine(e)) L.inc(`giant.burn.${e.id}`); log.say('gain', `The ${giant(e.id)} is on fire.`, { key: `giant.burn.${e.id}`, throttle: 4 }); }
    else if (!(e.k > 0) && alight.delete(e.id)) log.say('info', `The ${giant(e.id)} is no longer burning.`, { key: `giant.burn.out.${e.id}`, throttle: 4 });
  });
  // giant.vitrify { id, on, by }
  on('giant.vitrify', (e) => { if (e.on) { if (mine(e)) L.inc('giant.vitrify'); log.say('gain', `The ${giant(e.id)}'s sand fires to glass.`, { key: 'giant.vitrify', throttle: 4 }); } else log.say('info', `The ${giant(e.id)}'s glass crumbles back to sand.`, { key: 'giant.vitrify.off', throttle: 4 }); });
}
