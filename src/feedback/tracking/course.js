// ---------------------------------------------------------------------------------------
// TRACKING, THE COURSE, THE CIRCUITS AND THE TRIAL: the basement's course stations, splits and laps, the lap circuits' gates and
// finishes, and the Gnomon-side trial's lanterns. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as
// tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   courseRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { clock, fx } from './lineformat.js';

const MEDAL = { GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze' };

export function courseRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('course.station', (e) => { L.inc('course.station'); L.first(`station.${e.room}`); log.say('circuit', `You take up ${e.title} (${e.room}).`, { key: 'stn', win: 1 }); });
  on('course.split', (e) => {
    L.inc('course.split'); L.lo(`course.room.${e.room}`, e.time);
    log.say('circuit', `${e.room}: ${fx(e.time)} s${e.pb ? ' (a best)' : e.best ? ` (best ${fx(e.best)} s)` : ''}.`);
  });
  on('course.lap', (e) => { L.inc('course.lap'); const r = L.lo('course.lap.time', e.time); log.say('circuit', `Lap complete: ${fx(e.time)} s${e.pb || r === 'beat' ? ' — a new best' : ''}.`); });
  on('course.reset', () => L.inc('course.reset'));
  on('course.gate', (e) => { L.inc('course.gate'); L.hi('course.gate.speed', e.speed); log.say('circuit', `Speed gate: ${fx(e.speed, 1)} m/s.`, { key: 'gate', win: 0.8 }); });
  on('circuit.enter', (e) => { L.inc(`circuit.${e.id}.enter`); L.inc('circuit.enter'); log.say('circuit', `You enter ${e.title}.${e.par ? ` Gold under ${e.par.gold} s, silver ${e.par.silver}, bronze ${e.par.bronze}.` : ''}${e.best ? ` Your best: ${fx(e.best)} s.` : ''}`); }); // (the circuit panel's targets, now in the log: the owner, 2026-10-07)
  on('circuit.gate', (e) => {
    L.inc('circuit.gate');
    log.say('circuit', `${e.label}: ${fx(e.time)} s${e.delta != null ? ` (${e.delta >= 0 ? '+' : '−'}${fx(Math.abs(e.delta))})` : ''}${e.slow ? ' Too slow, +1 s.' : ''}`);
    if (e.slow) L.inc('circuit.slow');
  });
  on('circuit.fall', (e) => { L.inc('circuit.fall'); L.inc(`circuit.${e.id}.fall`); log.say('warn', 'You fall. +3 s.'); });
  on('circuit.finish', (e) => {
    const id = e.id;
    L.inc('circuit.finish'); L.inc(`circuit.${id}.finish`);
    if (e.clean) { L.inc('circuit.clean'); L.inc(`circuit.${id}.clean`); }
    const m = MEDAL[e.medal]; if (m) { L.inc(`circuit.medal.${m}`); L.inc(`circuit.${id}.medal.${m}`); }
    if (m === 'gold' && e.clean) L.inc('circuit.goldclean');
    const r = L.lo(`circuit.${id}.time`, e.time, { clean: e.clean });
    if (e.clean) L.lo(`circuit.${id}.time.clean`, e.time);
    log.say('circuit', `${e.title} complete: ${fx(e.time)} s${m ? ` (${m})` : ''}${e.clean ? ', clean' : ''}${e.pb || r === 'beat' ? '. A new personal best!' : '.'}`);
  });
  on('trial.start', () => { L.inc('trial.start'); log.say('circuit', 'The trial begins.'); });
  on('trial.jar', (e) => {
    L.inc('trial.jar'); if (e.quick) L.inc('trial.quick');
    log.say('circuit', `Lantern ${e.n}/${e.of} (${clock(e.time)})${e.quick ? '. Quick double, −1 s' : ''}.`, { key: 'tj', win: 0.2 });
  });
  on('trial.finish', (e) => {
    L.inc('trial.finish'); const m = MEDAL[e.medal]; if (m) L.inc(`trial.medal.${m}`);
    const r = L.lo('trial.time', e.time);
    log.say('circuit', `Trial complete: ${clock(e.time)}${m ? ` (${m})` : ''}${e.pb || r === 'beat' ? '. A new personal best!' : '.'}`);
  });
}
