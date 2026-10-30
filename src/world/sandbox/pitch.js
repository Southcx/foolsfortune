// ---------------------------------------------------------------------------------------
// THE SANDBOX'S PITCH: a little ground to kick a physics ball about (South, 2026-10-30: "a little area to practice kicking a physics enabled
// ball around"). Low clay walls round it so the ball comes back, a five-a-side goal at its north end, THE BALL (an ordinary prop of the level,
// `level.dynProp`, so the kick's shove and the god hand's grab move it as they do a crate), and the three small rules of a kickabout:
//   a GOAL     the ball's middle inside the goal's mouth (progress/sandbox.js inGoal): said once, the ball set back on its spot 1.5 real s after;
//   a KICK     the ball's speed jumping up with the Courier within 2 m and the god hand not out;
//   a JUGGLE   kicks in a row with the ball never touching the floor between them (each within GOAL.juggleGap real seconds of the last), said
//              when it comes down after two or more. The count is the ball's, not a combo: no multiplier, nothing paid.
// A ball out of the pitch for BALL.respawn real seconds, or off the hall's floor, is set back on its spot; a ball the Sondelass has sliced
// away (the level's props are sliceable) is made again.
//
// Prior art: Mario Strikers' and Rocket League's balls (a light, lively sphere that a body-sized foot sends flying), Super Mario Sunshine's
// kickable ball, FIFA Street's keepy-uppy (the juggle count), a five-a-side cage (the low wall that returns the ball), Dawn of Mana's
// Havok yard (the world's own props, one rule for them all).
//
//   const p = new Pitch(game)   p.build(kit)  (the statics: the hall's builder hands over its box helper)   p.spawnBall()   p.update(dt)
//   p.clear() (the ball taken away: the hall is coming down)   p.ball (the prop's entity, or null)   p.reset()  (the ball back on its spot)
//   events: sandbox.kick { by }   sandbox.juggle { n, by }   sandbox.goal { dist, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER } from '../../core/physics.js';
import { addOutline } from '../../render/outline.js';
import { SANDBOX, BALL, GOAL, inGoal } from '../../progress/sandbox.js';

const C = { turf: 0x6f8f55, line: 0xf0e6d0, wall: 0x9a6b4b, post: 0xf7f2e4, net: 0x57534b, leather: 0xf3ead6, patch: 0x3a2a22 };
const PLAIN = { outline: false, plain: true }, PLAIN_FLAT = { collide: false, outline: false, plain: true }; // (the goal's and the lines' own colours, not a room glaze's)
const WALL = { h: 0.6, t: 0.4 }; // (the low walls round the pitch, in metres)
const POST = 0.14, KICK = { near: 2, jump: 3 }; // (a goalpost's width; a kick: the Courier's middle within `near` m, the ball's speed up by `jump` m/s in one step)
const GOAL_RESET = 1.5; // (real seconds from a goal to the ball back on its spot)

export class Pitch {
  constructor(game) { this.game = game; this.ball = null; this.want = false; this.reset0(); }
  reset0() { this.n = 0; this.air = false; this.lastKick = -99; this.kickAt = null; this.sp = 0; this.out = 0; this.goalT = 0; this.remakeT = 0; this.t = 0; }

  /** The pitch's statics through the hall's builder: the turf and its lines, the low walls (a gap at the goal's mouth), the goal. */
  build(kit) {
    const B = SANDBOX.pitch, X = (x) => SANDBOX.at.x + x, Z = (z) => SANDBOX.at.z + z, y = SANDBOX.at.y;
    const x0 = B.x - B.w / 2, x1 = B.x + B.w / 2, z0 = B.z - B.d / 2, z1 = B.z + B.d / 2, h = WALL.h, t = WALL.t;
    kit.box([X(B.x), y + 0.015, Z(B.z)], [B.w, 0.03, B.d], C.turf, { collide: false, outline: false });
    // the lines: the halfway line, the centre spot, the box before the goal
    kit.box([X(B.x), y + 0.035, Z(B.z + B.d * 0.1)], [B.w, 0.01, 0.12], C.line, PLAIN_FLAT);
    kit.box([X(BALL.spot.x), y + 0.035, Z(BALL.spot.z)], [0.5, 0.01, 0.5], C.line, PLAIN_FLAT);
    for (const [dx, dz, sx, sz] of [[0, GOAL.z + 5.5, 10, 0.12], [-5, GOAL.z + 2.75, 0.12, 5.5], [5, GOAL.z + 2.75, 0.12, 5.5]]) kit.box([X(GOAL.x + dx), y + 0.035, Z(dz)], [sx, 0.01, sz], C.line, PLAIN_FLAT);
    // the low walls: west, east and south whole; the north in two, the goal's mouth between them
    kit.box([X(x0 - t / 2), y + h / 2, Z(B.z)], [t, h, B.d + 2 * t], C.wall);
    kit.box([X(x1 + t / 2), y + h / 2, Z(B.z)], [t, h, B.d + 2 * t], C.wall);
    kit.box([X(B.x), y + h / 2, Z(z1 + t / 2)], [B.w, h, t], C.wall);
    const gw = GOAL.w / 2 + POST * 1.5, ax = GOAL.x - gw, bx = GOAL.x + gw;
    kit.box([X((x0 + ax) / 2), y + h / 2, Z(z0 - t / 2)], [ax - x0, h, t], C.wall);
    kit.box([X((bx + x1) / 2), y + h / 2, Z(z0 - t / 2)], [x1 - bx, h, t], C.wall);
    // the goal: two posts and a crossbar at the mouth, a back wall, two side nets and a roof net as static colliders
    const gz = GOAL.z, back = GOAL.z - GOAL.depth, mid = (gz + back) / 2, hx = GOAL.w / 2 + POST / 2;
    for (const s of [-1, 1]) {
      kit.box([X(GOAL.x + s * hx), y + GOAL.h / 2, Z(gz)], [POST, GOAL.h, POST], C.post, { plain: true });
      kit.box([X(GOAL.x + s * (GOAL.w / 2 + POST)), y + GOAL.h / 2, Z(mid)], [0.06, GOAL.h, GOAL.depth], C.net, PLAIN);
    }
    kit.box([X(GOAL.x), y + GOAL.h + POST / 2, Z(gz)], [GOAL.w + 2 * POST, POST, POST], C.post, { plain: true });
    kit.box([X(GOAL.x), y + GOAL.h / 2, Z(back - 0.05)], [GOAL.w + 2 * POST, GOAL.h + POST, 0.1], C.net, PLAIN);
    kit.box([X(GOAL.x), y + GOAL.h + POST + 0.03, Z(mid)], [GOAL.w + 2 * POST, 0.06, GOAL.depth + 0.1], C.net, PLAIN);
  }

  /** Is a point (local metres) on the pitch, or in the goal behind its mouth? */
  onPitch(p) {
    const B = SANDBOX.pitch;
    if (Math.abs(p.x - B.x) <= B.w / 2 && Math.abs(p.z - B.z) <= B.d / 2) return true;
    return Math.abs(p.x - GOAL.x) <= GOAL.w / 2 + POST && p.z <= GOAL.z + 0.5 && p.z >= GOAL.z - GOAL.depth - 0.2 && p.y <= GOAL.h + 0.3;
  }

  /** The ball: an icosphere (cream, patched dark, so its turning is seen) on a ball collider that keeps the ball's bounce against any floor. */
  spawnBall() {
    const g = this.game, L = g.level, S = SANDBOX, r = BALL.r; if (!L || this.ball) return this.ball;
    const geo = new THREE.IcosahedronGeometry(r, 1), n = geo.attributes.position.count, col = new Float32Array(n * 3), cream = new THREE.Color(C.leather), dark = new THREE.Color(C.patch);
    for (let f = 0; f < n / 3; f++) { const c = f % 5 === 0 ? dark : cream; for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (f * 3 + k) * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.deleteAttribute('uv');
    const mesh = new THREE.Mesh(geo, L.propMat(0xffffff, true)); mesh.castShadow = mesh.receiveShadow = true; addOutline(mesh);
    const at = [S.at.x + BALL.spot.x, S.at.y + r + 0.02, S.at.z + BALL.spot.z];
    const cd = RAPIER.ColliderDesc.ball(r).setDensity(BALL.density).setRestitution(BALL.restitution).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max); // (Max: the floor's none cannot halve the ball's own)
    const e = this.ball = L.dynProp(mesh, at, cd, 'clay'); // (joins level.dynamic: the kick's shove and the god hand's grab find it there)
    e.body.collider(0).setFriction(BALL.friction); // (dynProp sets 0.8 on every prop)
    e.body.setLinearDamping(BALL.linearDamping); e.body.setAngularDamping(BALL.angularDamping); e.body.enableCcd(true);
    e.size = r * 2; e.half = [r, r, r]; e.kind = 'ball';
    this.reset0(); this.want = true; return e;
  }

  /** The ball back on its spot, at rest. */
  reset() {
    const e = this.ball, S = SANDBOX; if (!e?.body?.isValid()) return;
    e.body.setTranslation({ x: S.at.x + BALL.spot.x, y: S.at.y + BALL.r + 0.02, z: S.at.z + BALL.spot.z }, true);
    e.body.setLinvel({ x: 0, y: 0, z: 0 }, true); e.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.n = 0; this.air = false; this.out = 0; this.goalT = 0; this.sp = 0; this.kickAt = null;
  }

  /** The ball taken out of the world (the hall coming down). */
  clear() {
    const L = this.game.level, e = this.ball; this.ball = null; this.want = false;
    if (e && L?.dynamic.includes(e)) L.removeProp(e);
    this.reset0();
  }

  update(dt) {
    const g = this.game, S = SANDBOX, real = g.rawDt ?? dt; this.t += real;
    if (!this.want) return;
    const e = this.ball;
    if (!e || !g.level.dynamic.includes(e) || !e.body?.isValid()) { // (sliced away, or taken by something: made again after a beat)
      this.ball = null; if ((this.remakeT += real) > 1) { this.remakeT = 0; this.spawnBall(); }
      return;
    }
    const b = e.body, p = b.translation(), v = b.linvel(), sp = Math.hypot(v.x, v.y, v.z);
    const l = { x: p.x - S.at.x, y: p.y - S.at.y, z: p.z - S.at.z }, floor = l.y <= BALL.r + 0.05;
    // a goal: said once; the ball set back after a beat
    if (this.goalT > 0) { if ((this.goalT -= real) <= 0) this.reset(); this.sp = sp; return; }
    if (inGoal(l)) {
      const k = this.kickAt, dist = k ? Math.hypot(l.x - k.x, l.y - k.y, l.z - k.z) : Math.hypot(l.x - BALL.spot.x, l.z - BALL.spot.z);
      this.goalT = GOAL_RESET; g.events?.emit('sandbox.goal', { dist: +dist.toFixed(1), by: 'courier' });
      return;
    }
    // a kick: the ball's speed jumps up with the Courier beside it (a bounce or a wall only takes speed away), the god hand not out
    const P = g.player?.pos;
    if (sp - this.sp > KICK.jump && P && !g.god?.controlling && Math.hypot(p.x - P.x, p.y - P.y - 0.9, p.z - P.z) < KICK.near) this.kicked(l, real);
    else if (floor && this.air) { if (this.n >= 2) g.events?.emit('sandbox.juggle', { n: this.n, by: 'courier' }); this.n = 0; this.air = false; } // (down on the floor again)
    else if (!floor && this.n > 0) this.air = true;
    if (this.n > 0 && this.t - this.lastKick > GOAL.juggleGap && !floor) { this.n = 0; this.air = false; } // (up too long: the run is over)
    this.sp = sp;
    // out of the pitch: set back after BALL.respawn real seconds; off the hall's floor or out of the hall, at once
    const lost = l.y < -3 || l.y > SANDBOX.size.h + 2 || Math.abs(l.x) > SANDBOX.size.w / 2 || Math.abs(l.z) > SANDBOX.size.d / 2;
    if (lost || (!this.onPitch(l) && (this.out += real) > BALL.respawn)) this.reset(); else if (this.onPitch(l)) this.out = 0;
  }

  /** A kick of the ball: counted, and a juggle's run lengthened if the ball has not touched the floor since the last. */
  kicked(l, real) {
    const g = this.game;
    this.n = this.n > 0 && !(this.t - this.lastKick > GOAL.juggleGap) && this.air ? this.n + 1 : 1;
    this.lastKick = this.t; this.air = false; this.kickAt = { x: l.x, y: l.y, z: l.z };
    g.events?.emit('sandbox.kick', { by: 'courier' });
  }
}
