// ---------------------------------------------------------------------------------------
// THE CAMERA'S FOLLOW ON TOUCH (docs/plans/MOBILE.md 4.8: "on a phone the camera follows by itself, and the right thumb takes it only while
// it drags; let go, it eases back", Sky: Children of the Light's lesson): while the device is touch and no thumb is on the look area, a
// Courier running on the ground in the third person has the view's yaw eased toward the way they run, at `T.camera.follow` (0 never,
// 1 quick: a setting, core/settings.js), FOLLOW.wait real s after the thumb lifts. It never swings round to a Courier running at the
// camera (more than FOLLOW.back from the view's way), and never in a lock-on, an aim, the first person, on the Solar Skiff, or on a
// keyboard or a pad: the core movement and the desk's camera are as they were.
//
// Prior art: the chase cameras of the mobile action games (Genshin Impact's, Sky's), a console third-person camera's auto-centre.
//
//   camFollow(player, dt, adsT)   (courier/player.js look() calls it)   FOLLOW
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';

/** rate: the ease a real second at follow 1; speed: m/s on the ground before it follows; back: radians off the view's way past which a
 *  run toward the camera is left alone; wait: real seconds after the look thumb lifts. */
export const FOLLOW = { rate: 2.4, speed: 1.5, back: 2.4, wait: 0.35 };

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function camFollow(P, dt, adsT = 0) {
  const g = P.game, k = g?.input?.device === 'touch' ? +(T.camera.follow ?? 0) : 0;
  if (!(k > 0)) return;
  if (g.touch?.look) { P.followWait = FOLLOW.wait; return; }
  if ((P.followWait = Math.max(0, (P.followWait || 0) - dt)) > 0) return;
  if (P.fp || adsT > 0.1 || !P.grounded || g.lock?.target || g.techs?.get?.('skiff')?.riding) return;
  const vx = P.vel.x, vz = P.vel.z; if (vx * vx + vz * vz < FOLLOW.speed * FOLLOW.speed) return;
  const d = wrap(Math.atan2(vx, vz) - P.yaw); if (Math.abs(d) > FOLLOW.back) return;
  P.yaw += d * (1 - Math.exp(-FOLLOW.rate * k * dt));
}
