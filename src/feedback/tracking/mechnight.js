// ---------------------------------------------------------------------------------------
// TRACKING, THE MECHS' SMASH CHALLENGES AND THE GIANTS' WRESTLING (docs/plans/MECHS.md 11): what the proving ground's challenges and a
// giant thrown say in the log, and what the ledger keeps of them. Beside tracking/mechs.js (the mech, the ring, the city), the same
// house: a line an event, counted only for the Courier's (`by`), words plain until Espada's.
//
// Prior art: Ultimate Destruction's challenge results (the medal said once, the best kept), Wii Sports' bowling (STRIKE said big, a
// spare said kindly), the house's counters (Old School RuneScape's).
//
//   mechNightRules({ on, L, log })   (feedback/tracking/rules.js calls it)
//   ledger: challenge.play, challenge.play.<id>, challenge.best.<id> (hi), challenge.medal.<id> (hi 0..3), challenge.gold, bowling.strike,
//     bowling.spare, giant.grab, giant.throw, giant.throw.building, giant.throw.cells (hi), giant.slam, giant.down.<id> (tracking/mechs.js)
// ---------------------------------------------------------------------------------------
import { CHALLENGES, MEDAL_NAMES } from '../../progress/mechs/challenges.js';
import { giantOf } from '../../progress/mechs/giants.js';

const name = (id) => CHALLENGES[id]?.label || id;
const giant = (id) => (giantOf(id)?.label || 'giant').toLowerCase();

export function mechNightRules({ on, L, log }) {
  const mine = (e) => e.by === 'courier';
  // challenge.start { id }, challenge.score { id, add, total, what }, challenge.end { id, score, medal, best }, challenge.quit { id }
  on('challenge.start', (e) => { if (!mine(e)) return; L.inc('challenge.play'); L.inc(`challenge.play.${e.id}`); log.say('info', `${name(e.id)}: ${CHALLENGES[e.id]?.line || ''}`, { key: 'challenge.start', throttle: 1 }); });
  on('challenge.score', (e) => {
    if (!mine(e)) return;
    if (e.what === 'STRIKE') L.inc('bowling.strike'); else if (e.what === 'SPARE') L.inc('bowling.spare');
    log.say(e.add > 0 ? 'gain' : 'info', `${name(e.id)}: ${e.what}.`, { key: 'challenge.score', throttle: 0.3 });
  });
  on('challenge.end', (e) => {
    if (!mine(e)) return;
    L.hi(`challenge.best.${e.id}`, e.score | 0); L.hi(`challenge.medal.${e.id}`, e.medal | 0); if (e.medal >= 3) L.inc('challenge.gold');
    const unit = CHALLENGES[e.id]?.unit || '';
    log.say(e.medal ? 'gain' : 'info', `${name(e.id)} over: ${e.score} ${unit}, ${MEDAL_NAMES[e.medal | 0]}.${e.best ? ' A new best.' : ''}`, { key: 'challenge.end', throttle: 1 });
  });
  on('challenge.quit', (e) => { if (mine(e)) log.say('info', `${name(e.id)} left unfinished.`, { key: 'challenge.quit', throttle: 1 }); });
  // giant wrestling: giant.grab { id }, giant.throw { id, hit ('building' | 'ground'), cells }, giant.slam { id }, giant.slip { id, why }
  on('giant.grab', (e) => { if (!mine(e)) return; L.inc('giant.grab'); log.say('battle', `You lift the ${giant(e.id)}.`, { key: 'giant.grab', throttle: 1 }); });
  on('giant.throw', (e) => {
    if (!mine(e)) return; L.inc('giant.throw');
    if (e.hit === 'building') { L.inc('giant.throw.building'); L.hi('giant.throw.cells', e.cells | 0); }
    log.say('battle', e.hit === 'building' ? `You throw the ${giant(e.id)} through a building.` : `You throw the ${giant(e.id)}.`, { key: 'giant.throw', throttle: 1 });
  });
  on('giant.slam', (e) => { if (!mine(e)) return; L.inc('giant.slam'); log.say('battle', `You slam the ${giant(e.id)} into the ground.`, { key: 'giant.slam', throttle: 1 }); });
  on('giant.slip', (e) => log.say('info', e.why === 'heavy' ? `The ${giant(e.id)} is too heavy for these legs.` : `The ${giant(e.id)} struggles free.`, { key: 'giant.slip', throttle: 2 }));
}
