// ---------------------------------------------------------------------------------------
// STEADY KEEL (docs/plans/MOBILE.md 8; the owner, 2026-10-24: "steering assist toggleable is a good idea"): the knack that leans the Solar
// Skiff back toward its line while no steer is given. A thumb on glass steers coarser than a key, so the assist serves the phone first,
// and the keyboard alike: a knack (knacks.js `steadyKeel`), earned, on until switched off, and off it restores the board exactly.
// It acts only in a race, on the sand, with A / D (or the stick) let go: it aims the board at a point KEEL.ahead metres down the line
// (pure pursuit, the self-driving car's oldest steering law) at most KEEL.max of a full steer, and gives nothing once the board is on the
// line and pointing along it, so it never carries you past the centre. Any steer of your own wins outright: it is never added to one.
// Not in the air, not on a rail, not in a carve, not in the cavern's branch (its line is its own).
//
// Prior art: Mario Kart 8 and Tour's Smart Steering (keeps a kart on the road, switchable, the race otherwise the same); Gran Turismo's
// steering assist; Coulter's pure pursuit (1992), the look-ahead point on a path.
//
//   KEEL { ahead, gain, max, dead, onLine }   keelSteer(game, skiff) -> steer -1 .. 1 (0: none)   (skiff.js asks with A / D let go)
// ---------------------------------------------------------------------------------------
import { RW } from './track.js';

/** ahead: metres down the line the board is aimed at; gain: steer per radian off that aim; max: the most it steers (of a full key's 1);
 *  dead: radians off the aim it lets be; onLine: metres from the centre inside which, aimed along the line, it lets be. */
export const KEEL = { ahead: 14, gain: 1.5, max: 0.4, dead: 0.03, onLine: 0.6 };

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** The keel's steer for the skiff now, in the skiff's own sign (+ as D): 0 unless the knack is on and a race is running on the sand. */
export function keelSteer(game, skiff) {
  if (!game.knacks?.on?.('steadyKeel')) return 0;
  const race = game.race, T = race?.running ? race.T : null;
  if (!T || !game.raceway?.active || skiff.air || skiff.carve || skiff.grind?.on) return 0;
  const P = game.player, lx = P.pos.x - RW.x, lz = P.pos.z - RW.z;
  const n = T.nearest(lx, lz, skiff.keelS ?? null); if (!n) return 0;
  skiff.keelS = n.s;
  const F = T.frame(n.s); if (n.d > F.w * 2) return 0; // (well off the line, in the sand: no line to lean toward)
  const A = T.frame((n.s + KEEL.ahead) % T.length);
  const want = Math.atan2(A.x - lx, A.z - lz), along = Math.atan2(F.fx, F.fz);
  const yaw = skiff.headingDir ? skiff.headingDir() : skiff.heading;
  if (Math.abs(n.lat) < KEEL.onLine && Math.abs(wrap(along - yaw)) < KEEL.dead * 2) return 0;
  const off = wrap(want - yaw); if (Math.abs(off) < KEEL.dead) return 0;
  return Math.max(-KEEL.max, Math.min(KEEL.max, -off * KEEL.gain)); // (heading -= steer: a steer of + turns the heading down)
}
