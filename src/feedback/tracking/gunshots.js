// ---------------------------------------------------------------------------------------
// TRACKING, THE PSYGUN'S SHOTS AND SHELLS: the shot fired and charged, the shell kinds fired, refilled, sliced, marked and banked, the
// target struck, the mind pushed into a state; and (the trail) the psygun's variant and its chambers. Moved out of tracking.js whole, the
// words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an
// event).
//
//   gunShotRules({ on, L, log })
//   psygunVariantRules({ on, L, log })   (feedback/tracking/rules.js calls them)
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';
import { PSYGUNS } from '../../tools/psygun/kinds.js';
import { SHELL_TYPES } from '../../tools/psygun/shells.js';

export function gunShotRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('shot.fire', (e) => { L.inc('shot.fired'); if (e.charged) L.inc('shot.charged'); if (e.air) L.inc('shot.air'); });
  on('weapon.charged', () => L.inc('shot.fullcharge'));
  on('shell.fire', (e) => { L.inc(`shell.fire.${e.id}`); L.inc('shell.fire'); if (e.air) L.inc('shell.air'); first(`shell.${e.id}`, `Logged: your first ${e.id} shell.`); });
  on('shell.dry', () => L.inc('shell.dry'));
  on('shell.refill', (e) => { L.inc('shell.refill'); L.inc('shell.received', e.got); log.say('gain', `You receive ${plural(e.got, 'shell')}.`, { key: 'refill', win: 4 }); });
  on('shell.slice', (e) => { L.inc('shell.slice.cuts', e.cuts); L.hi('shell.slice.best', e.cuts); if (e.cuts >= 3) log.say('battle', `Your cleave cuts through ${e.cuts} things.`); });
  on('shell.mark', (e) => { L.inc('shell.mark.targets', e.n); L.hi('shell.mark.best', e.n); log.say('battle', `You mark ${plural(e.n, 'target')}.`, { key: 'mark', win: 1 }); });
  on('shell.bank', (e) => { L.inc('shell.bank'); L.hi('shell.bank.best', e.bounces); log.say('battle', `Your bank shot ricochets ${e.bounces} times before it lands.`); });
  on('target.hit', (e) => {
    L.inc('target.hit');
    if (e.drop > 5) L.hi('target.drop', e.drop);
    if (e.moving) L.inc('target.moving');
    if (e.cause === 'slam' && e.drop >= 50 && e.moving) L.inc('target.slam.moving50');
    if (e.drop > 5 || e.moving) log.say('battle', `You strike the target${e.drop > 5 ? ` from ${Math.round(e.drop)} m up` : ''}${e.moving ? ' as it moves' : ''}.`, { key: 'tgt', win: 0.5 });
  });
  on('slip.splat', () => L.inc('slip.splat'));
  on('creature.mind', (e) => { if (e.by === 'courier') L.inc(`creature.mind.${e.state}`); }); // (a mind pushed into a state: Prismatic's sound is Wanda's)
}

export function psygunVariantRules({ on, L, log }) {
  // the psygun's kind and its chambers (tools/psygun/kinds.js)
  // a variant's own play (tools/psygun/variantplay.js): the Bombardier's flare, the Pentagun's pentacle, the Pepperbox's both barrels
  on('psygun.flare', (e) => { L.inc('psygun.flare'); if (e.n) log.say('battle', `Your flare shows ${e.n === 1 ? 'one of them' : `${e.n} of them`}.`, { key: 'psy.flare', throttle: 6 }); });
  on('psygun.pentacle', (e) => { L.inc('psygun.pentacle'); log.say('battle', e.n ? `Your five-type volley lands: five forces strike ${e.n === 1 ? 'it' : `${e.n} of them`}.` : 'Your five-type volley hits nothing.'); });
  on('psygun.barrels', (e) => { L.inc('psygun.barrels'); log.say('battle', `Both barrels: ${e.n} chamber${e.n === 1 ? '' : 's'} at once.`); });
  on('psygun.change', (e) => { L.inc('psygun.change'); log.say('system', `You carry ${PSYGUNS[e.gun]?.name || 'another psygun'}: ${PSYGUNS[e.gun]?.chambers ?? '?'} chambers.`); });
  on('psygun.chamber', (e) => { L.inc('psygun.chamber'); const i = SHELL_TYPES.findIndex((t) => t.id === e.shell); log.say('info', `Chamber ${e.chamber + 1} takes ${SHELL_TYPES[i]?.no || ''} ${SHELL_TYPES[i]?.name || ''}.`, { key: 'chamber', win: 1.2, fmt: (n) => `${n} chambers loaded.` }); });
}
