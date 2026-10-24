// ---------------------------------------------------------------------------------------
// A TRAP'S POSSESSOR, AS A BOT (docs/plans/TRACK-EDITOR.md 6, 7; the owner, 2026-10-24: "bots and shared tracks"): a sibling haunting a
// made track's traps against the rider, as Crawl's ghosts do, so the haunted race has haunters when no one else is there. One decision a
// trap a pass: when the rider's arrival at the trap will meet its active moment (its tell plus half its action from now), fire, missed by
// the haunter's own error; never within a gate's grace (the trap's own law), never twice in a cooldown. A haunter has a skill (how close
// its timing is) and a temper (how often it bothers); the three siblings differ, as their racing does (rivals.js ROSTERS).
//
// Prior art: Crawl's AI ghosts (a possessed trap fired as the hero comes into its reach); Mario Kart's item AI (a held item thrown when
// the target is in its arc, with a deliberate miss so it can be beaten); the house's own rivals (a skill a racer).
//
//   HAUNTERS [{ name, skill, eager }]   leadOf(kind) -> real seconds from firing to the trap's middle moment
//   wantsFire({ kind, gapM, speed, ready, inGrace, haunter, rand }) -> bool
// ---------------------------------------------------------------------------------------
import { TRAPS } from './traps.js';

/** The haunters: the siblings (their names, their racing's skill turned to timing). `skill` 0..1: 1 fires on the frame; `eager` 0..1: the
 *  chance a pass it fires at all (a little mercy: Mario Kart's AI sometimes holds its shell). */
export const HAUNTERS = [
  { name: 'Petra', skill: 0.85, eager: 0.75 },
  { name: 'Calissa', skill: 0.7, eager: 0.9 },
  { name: 'Espada', skill: 0.78, eager: 0.8 },
];

/** Real seconds from a trap's firing to the moment it is most dangerous: its tell, then half its action (a turret's: its ball's flight is
 *  added by the caller, from the range). */
export function leadOf(kind) {
  const K = TRAPS[kind], C = K.cycle;
  return C.tell + (kind === 'pendulum' ? C.period / 4 : C.active / 2);
}

/** Whether the haunter fires now: the rider `gapM` metres before the trap at `speed` m/s arrives when the trap is at its worst, within
 *  the haunter's error (a worse haunter fires up to 0.6 real s early or late). One roll a decision, from the caller's seeded `rand`. */
export function wantsFire({ kind, gapM, speed, ready, inGrace, haunter, rand, extra = 0 }) {
  if (!ready || inGrace || gapM <= 0 || speed < 2) return false;
  const eta = gapM / speed, want = leadOf(kind) + extra, slop = (1 - haunter.skill) * 0.6;
  if (Math.abs(eta - want) > 0.05 + slop * Math.abs(rand() * 2 - 1)) return false;
  return rand() < haunter.eager;
}
