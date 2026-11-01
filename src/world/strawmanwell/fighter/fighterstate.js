// ---------------------------------------------------------------------------------------
// THE FIGHTER'S STATE CHANGES (docs/plans/FIGHTER.md 4): the few helpers every part of a fighter's frame shares (fighter/kernel.js,
// kernelhurt.js, kernelholds.js): into a state, a move begun, gravity to the build's terminal or fast-fall speed, traction on the
// ground, landing lag, a blow's numbers as its striker deals it (charged, staled), and a move's data from platformfighter.js's MOVES or the kit's own two (moves.js KIT_MOVES).
//
// Prior art: Melee's decomp (ftCommon_8007D5D4's fall speed cap, ftCommon_8007CB74's traction; Fighter_ActionStateChange, the one door
// into a state).
//
//   go(F, st)   startMove(F, id)   gravity(F, k?)   traction(F, slide?)   land(F, n, { slide })   moveOf(id)
//   hitOf(A, id, { damage, scale }) -> the blow A's move deals, charged and staled   noteStale(A, id) (a move that hit, into A's queue)
// ---------------------------------------------------------------------------------------
import { FRAME, MOVES, STALE, stale, charged } from '../../../progress/platformfighter.js';
import { KIT_MOVES } from './moves.js';

/** A move's data: platformfighter.js's MOVES, or the kit's two (moves.js KIT_MOVES). */
export const moveOf = (id) => MOVES[id] || KIT_MOVES[id] || null;
/** Into a state, its frame count from 0. */
export function go(F, st) { F.st = st; F.f = 0; F.active = false; if (st !== 'attack') { F.m = null; F.charge = 0; } if (st !== 'idle') F.running = false; }
/** A move begun: its frame 1 is the first after this one (Melee counts the frame it is input as frame 1). */
export function startMove(F, id) {
  go(F, 'attack'); F.m = id; F.mf = 0; F.charge = 0; F.hits = new Set(); F.wd = false; F.tumble = false;
  const m = moveOf(id); F.rehitEvery = m?.hits > 1 ? Math.max(1, Math.ceil((m.active[1] - m.active[0] + 1) / m.hits)) : 0;
  const kind = /^jab/.test(id) ? 'jab' : /tilt$/.test(id) ? 'tilt' : /smash$/.test(id) ? null : /air$/.test(id) ? 'aerial' : /special$/.test(id) ? 'special' : null;
  if (kind) F.env.verb(F, kind);
}
/** Gravity on the kit's own velocity, held to the build's terminal speed, or snapped to its fast fall. */
export function gravity(F, k = 1) {
  F.vy -= F.stats.gravity * FRAME * k;
  F.vy = F.fastfall ? -F.stats.fastFall : Math.max(F.vy, -F.stats.terminal);
}
/** Traction on the ground: the speed taken toward still (twice as fast above the walk, Melee's, after a wavedash). */
export function traction(F, slide = false) {
  const t = F.stats.groundDecel * FRAME * (slide && Math.abs(F.vx) > F.stats.walkSpeed ? 2 : 1);
  F.vx = Math.abs(F.vx) <= t ? 0 : F.vx - Math.sign(F.vx) * t; F.vy = 0;
}
/** Landing lag: `n` frames held on the ground (a wavedash's slide kept). */
export function land(F, n, { slide = false } = {}) { go(F, 'land'); F.lagN = n; F.slide = slide; F.tumble = false; F.vy = 0; }
/** The blow A's move `id` deals now: its damage charged (a smash held) and staled (A's last nine hits), and its knockback's numbers. */
export function hitOf(A, id, { damage = null, scale = 1 } = {}) {
  const m = moveOf(id); if (!m) return null;
  let d = damage ?? m.damage;
  if (m.charge && A.charge) d = charged(d, A.charge);
  d = stale(d, A.stale, id) * scale;
  return { move: id, damage: Math.round(d * 10) / 10, angle: m.angle, base: m.base, growth: m.growth, throw: !!m.throw };
}
/** A move that hit goes to the front of A's stale queue (STALE.size long). */
export function noteStale(A, id) { A.stale.unshift(id); if (A.stale.length > STALE.size) A.stale.length = STALE.size; }
