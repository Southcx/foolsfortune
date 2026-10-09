// ---------------------------------------------------------------------------------------
// TRACKING, THE GREAT DUNEMAW, THE SOLAR SKIFFING TRIAL AND STRAWMAN: the rules that hear the crowned FOE, the nursery, the finds and the
// warp, the sundial's trial and the Workshop's dummy (docs/plans/DUNEMAW-SYSTEMS.md; the data: progress/combat/dunemaw.js), keep their
// counts for the achievements, and say the few things worth a sentence. Strawman's blows are never counted (`training`); its bout is
// said once, when the blows stop. The words are placeholders for Espada's. tracking.js calls it from listen().
//
//   dunemawRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { medalOf } from '../../progress/combat/dunemaw.js';
import { dropsFor, DROPS, NAMES } from '../../progress/combat/greatjelly.js';

const DONE = { stun: 'stunned', halt: 'halted', slow: 'slowed', sleep: 'put to sleep', charm: 'charmed', blind: 'blinded', confusion: 'confused', doubt: 'made to doubt' };
const TYPE = { impact: 'Impact', ego: 'Ego', influence: 'Influence', illusion: 'Illusion', delirium: 'Delirium' };

export function dunemawRules({ on, L, log }) {
  // the crowned FOE
  on('foe.crack', (e) => { if (e.by !== 'courier') return; L.inc('foe.crack'); if (e.cause === 'ram') L.inc('foe.crack.ram'); });
  on('foe.break', (e) => { if (e.by !== 'courier') return; L.inc('foe.break'); log.say('combat', "The Great Slip Jelly's crown breaks. Its core lies bare."); });
  on('foe.end', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`foe.${e.how}`);
    const drops = dropsFor(e);
    for (const id of drops) L.inc(`foe.drop.${id}`); // (the cosmetics its achievements guarantee: greatjelly.js DROPS; the boss drops them)
    log.say('gain', e.how === 'reprogram' ? 'You reprogram the Great Slip Jelly. The nursery is yours.' : 'The Great Slip Jelly bursts.');
    for (const id of drops) { const d = DROPS.find((x) => x.id === id); if (d?.name) log.say('gain', `It drops ${d.name}.`); } // (the words a placeholder for Espada's)
  });
  // the nursery, the finds and the warp
  on('clutch.break', (e) => { if (e.by !== 'courier') return; L.inc('clutch.break'); log.say('combat', 'You break a clutch. Fewer brood will wake.', { key: 'clutch', throttle: 1 }); }); // (DUNEMAW-EXTREME acceptance 2; the words a placeholder for Espada's)
  on('find.take', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`find.${e.kind}`);
    if (e.warped) L.inc('find.warped');
  });
  on('foe.wipe', (e) => { if (e.by === 'courier') { L.inc('foe.wipe'); log.say('warn', 'The Dunemaw takes you back to the Lip Stone.', { key: 'wipe', throttle: 3 }); } });
  on('foe.cast', (e) => { const n = NAMES[e.cast]; if (n) log.say('combat', `The Great Slip Jelly readies ${n}.`, { key: 'cast', throttle: 0.5 }); }); // (foe.cast { cast }: Espada's names)
  // the fight's moments (Espada's lines): foe.moment { what, by: 'creature' }
  const MOMENT = { crack: "The Great Slip Jelly's crown cracks.", mirror: 'Eye Cup turns back. The Great Slip Jelly is stunned.', sink: 'The Great Slip Jelly sinks into the dish.',
    feed: 'A brood reaches the Great Slip Jelly. It heals.', sherds: 'The Great Slip Jelly breaks into four sherds.', mend: 'The sherds mend. The Great Slip Jelly heals.',
    sodden: 'You are sodden.', dry: 'You are no longer sodden.', swallowed: 'The Dunemaw swallows you.' };
  on('foe.moment', (e) => { if (MOMENT[e.what]) log.say(e.what === 'swallowed' || e.what === 'sodden' ? 'warn' : 'combat', MOMENT[e.what], { key: `moment.${e.what}`, throttle: 0.5 }); }); // (the cast named as it begins: FFXIV's cast bar, in the log)
  on('floor.shift', (e) => { if (e.by === 'courier') log.say('explore', 'The floor shifts round what you took.', { key: 'shift', throttle: 5 }); });
  // the Solar Skiffing trial
  on('trial.solar', (e) => {
    if (e.by !== 'courier') return;
    L.inc('trial.solar');
    const medal = e.medal !== undefined ? e.medal : medalOf(e.seconds); // (the medal's times are data: progress/combat/dunemaw.js SOLAR)
    L.lo('trial.solar.best', e.seconds); L.lo(`trial.solar.best.${e.phase}`, e.seconds);
    if (medal) L.inc(`trial.solar.${medal}`);
    if (e.lit && e.taken >= e.lit && (e.phase === 'dawn' || e.phase === 'dusk')) L.inc('trial.solar.allLitLong');
    log.say('gain', `Solar skiffing: ${e.seconds.toFixed(1)} s, ${e.taken} of ${e.lit} lit rings${medal ? `, ${medal}` : ''}.`);
  });
  // Strawman: one line a bout, never a count
  on('strawman.bout', (e) => {
    const types = Object.entries(e.byType || {}).filter(([t]) => t !== 'blocked').sort((a, b) => b[1] - a[1]).map(([t, d]) => `${TYPE[t] || t} ${Math.round(d)}`).join(', ');
    const st = Object.entries(e.statuses || {}).map(([s, n]) => `${DONE[s] || s} ${n === 1 ? 'once' : `${n} times`}`).join(', ');
    log.say('info', `Strawman took ${e.blows} ${e.blows === 1 ? 'blow' : 'blows'} in ${e.seconds} s: ${Math.round(e.damage)} damage, ${e.perSecond} a second${types ? ` (${types})` : ''}${e.blocked ? `; ${e.blocked} blocked` : ''}${st ? `; ${st}` : ''}.`);
  });
  on('strawman.mode', (e) => log.say('info', `Strawman: ${e.mode}.`, { key: 'strawman', throttle: 1 }));
}
