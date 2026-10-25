// ---------------------------------------------------------------------------------------
// TRACKING, GROUND MOVEMENT: the core movement the Courier reports: jump, dash, slide, wallrun, mantle, land, roll, the rescues, movers
// and updrafts. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School
// RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   groundMovementRules({ on, L, log, where, track })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { fx } from './lineformat.js';

export function groundMovementRules({ on, L, log, where, track }) {
  on('move.jump', (e) => { L.inc('move.jump'); L.inc(`move.jump.${e.kind}`); if (e.kind === 'air') L.inc('move.airjump'); if (e.kind === 'wall') L.inc('move.walljump'); });
  on('move.dash', (e) => { L.inc('move.dash'); L.hi('dash.speed', e.speed); });
  on('slide.start', () => L.inc('move.slide'));
  on('slide.end', (e) => { L.inc('slide.time', e.dur); L.inc('slide.dist', e.dist || 0); L.hi('slide.longest', e.dist || 0); L.hi('slide.longest.time', e.dur); });
  on('wallrun.start', () => L.inc('move.wallrun'));
  on('wallrun.end', (e) => { L.inc('wallrun.dist', e.dist || 0); L.hi('wallrun.longest', e.dist || 0); L.hi('wallrun.longest.time', e.dur); });
  on('move.mantle', (e) => { L.inc('move.mantle'); L.hi('mantle.height', e.height); });
  on('move.land', (e) => {
    L.inc('move.land');
    const drop = e.drop || 0;
    if (drop > 0.5) { const r = L.hi('fall.max', drop, { at: where() }); track.note('fall.max', r, `Your longest fall is now ${Math.round(drop)} m.`, 12, drop); }
    if (drop >= 12) L.inc('land.drop12');
    if (drop >= 20) L.inc('land.drop20');
    if (drop >= 10) log.say('move', `You land from a ${Math.round(drop)} m fall.`, { key: 'land', win: 1 });
    if (e.air > 0.3) { const r = L.hi('air.longest', e.air, { at: where() }); track.note('air.longest', r, `Your longest airtime is now ${fx(e.air, 1)} s.`, 2.5, e.air); }
  });
  on('move.roll', (e) => { L.inc('move.roll'); if (e.mitigated) { L.inc('roll.fall'); L.hi('roll.fall.height', e.fall || 0); log.say('move', 'You roll out of the fall.', { key: 'roll', win: 1.5 }); } });
  on('courier.impulse', (e) => { L.inc(`courier.impulse.${e.why}`); });
  on('courier.respawn', (e) => { L.inc('courier.respawn'); L.inc(`courier.respawn.${e.why}`); });
  on('courier.rescue', (e) => L.inc(`courier.rescue.${e.kind}`));
  on('mover.leave', (e) => { L.inc('move.mover.leave'); L.hi('mover.leave.speed', e.speed); });
  on('mover.push', () => L.inc('mover.push'));
  on('updraft.enter', () => L.inc('updraft.enter'));
}
