// ---------------------------------------------------------------------------------------
// THE MANTLE AND THE STEP-OVER (part of courier/player.js): a ledge in front, between a least height and the mantle's most above the
// feet and with room to stand on it, that the body climbs in the mantle's time (up first, then over; anim/mantle.js poses it); and a
// wall no taller than the step-over's 0.55 m over the floor at its foot, hopped at the speed the body came in at (a jump pressed during
// it leaves from the top at once). `tryMantle` begins one (the fixed step asks it at a jump beside a ledge, in a fall past a lip and at
// a low wall run into); `stepMantle` carries one out each fixed step, those other moves begin too (moves/hang.js's pull-up,
// moves/ladder.js's climb-out), and sets the body down on the top, a jump queued in it leaving at once. It emits move.mantle and
// move.jump, through the Player's `ev`.
//
// Prior art: Mirror's Edge's and Uncharted's low vault for the step-over, Mario 64's step-over; as courier/player.js.
//
//   tryMantle(P, minH, vy, stepOnly) -> true when begun   stepMantle(P, dt)     (P: the Player, which has a method of each name)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../../core/physics.js';
import { T } from '../../core/config.js';
import { RADIUS } from './capsule.js';
import { surfaceUnder, stepSpeed } from '../stepsurface.js';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const hlen = (v) => Math.hypot(v.x, v.z);

// ---- mantle ---------------------------------------------------------------------
/**
 * A ledge in front between minH and mantleMax above the feet, with room to stand? A wall no taller than stepOverMax (0.55 m) over
 * the floor at its foot is a STEP-OVER: a quick hop up that keeps the Courier's speed (Mirror's Edge's and Uncharted's low vault: a
 * knee-high wall should never stop a run), and a jump pressed during it leaves from the top at once. stepOnly: only a step-over.
 */
export function tryMantle(P, minH, vy = 0, stepOnly = false) {
  const M = T.movement;
  const f = P.forward(new THREE.Vector3());
  const solid = (c) => !c.isSensor() && !c.parent()?.isDynamic();
  const feet = P.pos;
  // something in front at chest height or below the ledge
  const wall = P.physics.raycast({ x: feet.x, y: feet.y + (minH < 0.3 ? minH + 0.04 : Math.max(minH, 0.35)), z: feet.z }, f, RADIUS + M.mantleReach, P.collider, GROUPS.controllerQuery, solid); // (a low lip is felt for low: at 0.35 a 0.23 m step was not there at all)
  if (!wall || Math.abs(wall.normal.y) > 0.5) return false;
  const reach = wall.distance + 0.3;
  const top = { x: feet.x + f.x * reach, y: feet.y + M.mantleMax + 0.15, z: feet.z + f.z * reach };
  const down = P.physics.raycast(top, { x: 0, y: -1, z: 0 }, M.mantleMax + 0.15 - minH, P.collider, GROUPS.controllerQuery, solid);
  if (!down || down.normal.y < 0.7) return false;
  const h = down.point.y - feet.y;
  if (h < minH || h > M.mantleMax) return false;
  // how tall the wall is over the floor at its foot (not over the feet: in the air the feet may be anywhere)
  const foot = P.physics.raycast({ x: feet.x + f.x * (wall.distance - 0.15), y: down.point.y - 0.05, z: feet.z + f.z * (wall.distance - 0.15) }, { x: 0, y: -1, z: 0 }, 3, P.collider, GROUPS.controllerQuery, solid);
  const wallH = foot ? down.point.y - foot.point.y : h;
  const step = wallH <= (M.stepOverMax ?? 0.55) + 0.01 && h <= (M.stepOverMax ?? 0.55) + 0.25;
  if (stepOnly && !step) return false;
  // a ledge the jump will clear anyway isn't a mantle (hop over hurdles at speed)
  if (vy > 0 && h < (vy * vy) / (2 * M.gravity) - 0.15) return false;
  // room to crouch on the ledge (a thin lip against a wall doesn't count), and over our own head for the climb
  const to = new THREE.Vector3(down.point.x, down.point.y + 0.02, down.point.z).addScaledVector(f, 0.15);
  if (!P.fits(to, true)) return false;
  if (P.physics.raycast({ x: feet.x, y: feet.y + P.height - 0.1, z: feet.z }, UP, h + 0.1, P.collider, GROUPS.controllerQuery, solid)) return false;
  const speed = hlen(P.vel);
  P.mantle = { from: feet.clone(), to, t: 0, dur: M.mantleTime * THREE.MathUtils.lerp(0.75, 1.1, h / M.mantleMax), exit: Math.max(2.5, speed * 0.6),
    edge: new THREE.Vector3(feet.x + f.x * wall.distance, down.point.y, feet.z + f.z * wall.distance), right: P.right(new THREE.Vector3()) };
  if (step) {
    // a step-over: over in a fifth of a second, and out at the speed it came in at (never slower than a walk)
    Object.assign(P.mantle, { step: true, dur: THREE.MathUtils.lerp(0.14, 0.22, Math.max(0, h) / 0.8), exit: Math.max(M.walkSpeed, speed) });
    to.addScaledVector(f, 0.25);
    if (!P.fits(to, true)) to.addScaledVector(f, -0.25);
  }
  // a ledge on a moving platform: the goal rides along
  const mover = down.entity?.type === 'mover' ? down.entity.mover : null;
  if (mover) Object.assign(P.mantle, { mover, toL: mover.toLocal(to), edgeL: mover.toLocal(P.mantle.edge) });
  P.platform = null;
  P.sliding = false;
  P.dashT = 0;
  P.wallrun = null;
  P.vel.set(0, 0, 0);
  P.jumpBuf = 0;
  P.coyote = 0;
  P.mantle.jumpHeld = P.input.isDown('Space'); // (a held jump is not a new one: only a fresh press chains out of it)
  if (step) P.ev('move.step', { surface: surfaceUnder(P.game, P.pos, P.collider), speed: stepSpeed(P.game), by: 'courier' }); else P.sfx.mantle(); // (a step up is a step: heard on the bus, audio/cues.js)
  P.ev('move.mantle', { height: h, step });
  return true;
}

export function stepMantle(P, dt) {
  const m = P.mantle;
  if (m.mover) {
    // where the ledge will be by the end of this step
    m.mover.toWorld(m.toL, m.to); m.to.add(m.mover.displacement(m.to, _v));
    m.mover.toWorld(m.edgeL, m.edge); m.edge.add(m.mover.displacement(m.edge, _v));
  }
  m.t += dt / m.dur;
  // a fresh jump press is never lost: from a step-over it leaves at once, from a mantle once the body is up (it is kept till then)
  const sp = P.input.isDown('Space');
  if (m.jumpHeld === undefined) m.jumpHeld = sp; // (a mantle begun by another move: whatever is held then is not a press)
  if (sp && !m.jumpHeld && m.t > (m.step ? 0.35 : 0.45)) m.jumpQueued = true;
  m.jumpHeld = sp;
  if (m.step && m.jumpQueued) m.t = Math.max(m.t, 1);
  const k = Math.min(1, m.t);
  const ky = 1 - (1 - k) * (1 - k); // up first...
  const kx = k * k; // ...then over
  P.pos.set(
    THREE.MathUtils.lerp(m.from.x, m.to.x, kx),
    THREE.MathUtils.lerp(m.from.y, m.to.y, ky),
    THREE.MathUtils.lerp(m.from.z, m.to.z, kx),
  );
  P.grounded = false;
  P.body.setNextKinematicTranslation({ x: P.pos.x, y: P.pos.y, z: P.pos.z });
  if (k >= 1) {
    P.mantle = null;
    P.grounded = true;
    P.platform = P.moverUnder();
    P.landed = 3.5;
    // if the ledge is low-ceilinged, stay crouched
    if (!P.canStand()) P.setLow(true);
    const f = P.forward(new THREE.Vector3());
    P.vel.set(f.x * m.exit, 0, f.z * m.exit); // come out of it still moving
    if (m.jumpQueued && P.canStand()) {
      // the jump that was asked for: off the top, with the speed kept
      P.vel.y = T.movement.jumpVelocity; P.grounded = false; P.coyote = 0; P.jumpBuf = 0; P.jumpHeldLast = true;
      P.ev('move.jump', { kind: m.step ? 'vault' : 'mantle', speed: m.exit });
    }
  }
}
