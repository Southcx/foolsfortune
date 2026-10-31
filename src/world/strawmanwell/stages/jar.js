// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE JAR (docs/plans/STRAWMANS-WELL.md 3.13): the stage played as your Pneuka Jar, small and round, through what the
// Courier could not pass. While it is played the Courier is held out of the way (hidden, frozen, in a closed box under the stage's
// start: nothing of the core movement changes), and the Jar is a ball of its own on the plane (a Rapier body held to the lane, rolling
// only about the depth axis), the camera following it as the frame follows the Courier. At the goal the Jar is the Courier again,
// standing where it stopped; left any other way, the Courier is given back as they were.
//   the roll     A and D roll it (Metroid's morph ball, LocoRoco); down a slope it keeps what the slope gave it
//   the hop      Space, off the ground
//   the tunnel   JAR.r m round, it fits under a ceiling no taller than a crawl
//   the throw    LMB held on the ground: the Jar is lifted, its arc shown and its strength growing (W and S lift and lower it, A and D turn
//                it about); let go, it flies (Kirby: Canvas Curse's flick; the god hand's throw is the plan's, later)
// A fall (under the stage's floor by 6 m) is a death as the Pit's: said, and back at the last checkpoint in PIT.retry real s. Placeholder
// looks (a terracotta jar, gold dots for the arc): Calissa dresses the Pneuka Jar.
//
// Prior art: Metroid's morph ball (a ball through a low tunnel), Kirby: Canvas Curse (a round body thrown along a drawn arc), LocoRoco
// (a body rolled by tilting), the god hand's Pneuka Jar (godhand/jar.js: its form, not its rules).
//
//   default export: a stage module (stagemods.js's contract)   JAR
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, G, groups } from '../../../core/physics.js';
import { PIT } from '../../../progress/strawmanwell.js';
import { scaffold, floor, slope, goalFlag, sign } from '../stages.js';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { SIDE_CAM } from '../wellframe.js';
import { lendTool } from './arsenalaim.js';

/** The Jar: its radius (m), its roll (m/s) and how fast it gets there on the ground and in the air (1/s), its hop (m/s), its gravity
 *  (times the world's: 14 x 1.5, the core movement's 21), its throw (m/s, least and most; real s to full; its start angle and how fast
 *  W and S turn it, rad and rad/s), and where it waits out of the way (lane m). */
export const JAR = { r: 0.32, roll: 6.5, accel: 6, air: 2, hop: 7.2, gravity: 1.5, throwMin: 5, throwMax: 15, charge: 0.8, angle: 0.8, turn: 1.4, park: [2, -12] };
const GOAL = 70, CHECKS = [[2, 0], [17, -2], [37, -1.2], [53, 0]];
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);

/** The placeholder Pneuka Jar: a turned terracotta jar, its mouth up. */
function jarMesh() {
  const pts = [[0, -0.33], [0.2, -0.33], [0.29, -0.2], [0.32, 0], [0.27, 0.16], [0.15, 0.25], [0.13, 0.29], [0.17, 0.33], [0, 0.33]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), new THREE.MeshStandardMaterial({ color: 0xb8643c, roughness: 0.75, flatShading: true }));
  m.castShadow = true; return m;
}

export default {
  id: 'jar',
  build(well, S) {
    const len = S.lane.len;
    const st = (this.st = { well, S, on: false, offs: [], face: 1, cam: { x: 0, y: 0, lead: 0, snap: true } });
    scaffold(S, len);
    floor(S, -1, 10.2); sign(S, 'YOUR PNEUKA JAR', 4, 3.4, 'A and D roll it');
    slope(S, 10, 0, 16, -2); floor(S, 15.8, 20.2, -2);
    S.box(20, 44, -5, -1.2, COLOR.boards); sign(S, 'HOP', 19, 2.4, 'Space hops it up');
    S.box(26, 36, -0.5, 9, COLOR.spool); sign(S, 'THE JAR FITS', 31, 10.2, 'where the Courier never could');
    S.box(52, len + 1, -5, 0, COLOR.boards); sign(S, 'THROW', 44, 4.2, 'hold LMB: W and S lift the arc; let go to throw');
    goalFlag(S, GOAL, 0);
    // where the Courier waits: a closed box under the start, never seen
    const [px, py] = JAR.park;
    S.box(px - 1.5, px + 1.5, py - 1, py, 0, { hidden: true }); S.box(px - 2, px - 1.5, py, py + 3, 0, { hidden: true }); S.box(px + 1.5, px + 2, py, py + 3, 0, { hidden: true }); S.box(px - 1.5, px + 1.5, py + 2.4, py + 2.9, 0, { hidden: true });
    st.mesh = jarMesh(); st.mesh.visible = false; S.add(st.mesh);
    st.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: COLOR.gold }), 16);
    st.dots.visible = false; st.dots.frustumCulled = false; S.add(st.dots);
    st.offs.push(well.game.events?.on('zone.acoustic', () => { if (!well.here) this.leave(well); }));
    return { goal: null, door: [74, 0], checks: CHECKS, noRetry: true };
  },

  enter(well) {
    const st = this.st; if (!st) return;
    this.leave(well);
    const g = well.game, P = g.player, B = g.belt, w = g.physics.world;
    st.lend = B?.main === 'psygun' ? lendTool(well, 'sondelass', { draw: false }) : null; // (the mouse is the Jar's: the psygun not the main hears none of it)
    for (const t of B?.tools || []) if (t.wants || t.drawT > 0) t.stow();
    st.froze = P.freeze; P.freeze = true; P.endCore?.(); this.park();
    g.character?.setHidden(true);
    const at = this.at(CHECKS[0]);
    st.body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(at.x, at.y, at.z).setGravityScale(JAR.gravity).setCcdEnabled(true).setLinearDamping(0.05).setAngularDamping(0.4).setCanSleep(false));
    st.body.setEnabledTranslations(true, true, false, true); st.body.setEnabledRotations(false, false, true, true);
    st.col = w.createCollider(RAPIER.ColliderDesc.ball(JAR.r).setFriction(1).setRestitution(0.1).setDensity(1).setCollisionGroups(groups(G.PROP, G.STATIC)), st.body);
    Object.assign(st, { on: true, check: 0, dead: 0, aiming: false, power: 0, angle: JAR.angle, rolled: 0, space: false, mouse: false, face: 1 });
    st.mesh.visible = true; st.cam.snap = true;
  },
  /** The Jar given back to the Courier: at `to` (world) standing, or where they were held. */
  leave(well, to = null) {
    const st = this.st; if (!st || !st.on) { st?.lend?.restore(); if (st) st.lend = null; return; }
    const g = well.game, P = g.player;
    st.on = false; st.mesh.visible = false; st.dots.visible = false;
    try { g.physics.world.removeRigidBody(st.body); } catch { /* (gone already) */ }
    st.body = null; st.col = null;
    P.freeze = !!st.froze; g.character?.setHidden(false);
    if (to) { P.moveTo(to, new THREE.Vector3()); well.frame.face = st.face; }
    st.lend?.restore(); st.lend = null;
  },
  park() { const P = this.st.well.game.player, [x, y] = JAR.park; P.moveTo(_v.set(AT.x + x, AT.y + y + 0.05, this.st.S.z), P.vel.set(0, 0, 0)); },
  at([x, y]) { return new THREE.Vector3(AT.x + x, AT.y + y + JAR.r + 0.05, this.st.S.z); },
  grounded() {
    const st = this.st, t = st.body.translation();
    return !!st.well.game.physics.raycast(_v.set(t.x, t.y, t.z), DOWN, JAR.r + 0.1, st.col, undefined, (c) => !c.isSensor());
  },
  /** The throw's velocity now. */
  throwVel(out) { const st = this.st, s = JAR.throwMin + (JAR.throwMax - JAR.throwMin) * st.power; return out.set(st.face * Math.cos(st.angle) * s, Math.sin(st.angle) * s, 0); },

  /** Before each fixed step: the keys are the Jar's. */
  pre(well, dt) {
    const st = this.st; if (!st?.on || well.stage?.id !== 'jar' || st.dead > 0) return;
    const R = well.frame.realInput, b = st.body; if (!R || !b) return;
    const lv = b.linvel(), ground = this.grounded();
    const h = (R.isDown('KeyD') ? 1 : 0) - (R.isDown('KeyA') ? 1 : 0);
    if (h) st.face = h;
    const mouse = R.isDown('Mouse0'), fresh = mouse && !st.mouse; st.mouse = mouse;
    const sp = R.isDown('Space'), hop = sp && !st.space; st.space = sp;
    if (st.aiming) {
      // lifted: held still, the arc turned and charged
      if (R.isDown('KeyW')) st.angle = Math.min(1.45, st.angle + JAR.turn * dt);
      if (R.isDown('KeyS')) st.angle = Math.max(0.1, st.angle - JAR.turn * dt);
      st.power = Math.min(1, st.power + dt / JAR.charge);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      if (!mouse) { st.aiming = false; b.setGravityScale(JAR.gravity, true); const v = this.throwVel(_d); b.setLinvel({ x: v.x, y: v.y, z: 0 }, true); well.verb('jarThrow'); }
      return;
    }
    if (fresh && (ground || Math.hypot(lv.x, lv.y) < 1)) { st.aiming = true; st.power = 0; b.setGravityScale(0, true); const t = b.translation(); b.setTranslation({ x: t.x, y: t.y + 0.25, z: t.z }, true); return; }
    let vx = lv.x, vy = lv.y;
    if (h) vx += (h * JAR.roll - vx) * Math.min(1, (ground ? JAR.accel : JAR.air) * dt);
    if (hop && ground) vy = JAR.hop;
    b.setLinvel({ x: vx, y: vy, z: 0 }, true);
    if (ground) b.setAngvel({ x: 0, y: 0, z: -vx / JAR.r }, true); // (rolling, not sliding)
    if (h && ground) { st.rolled += Math.abs(vx) * dt; if (st.rolled > 2) well.verb('jarRoll'); }
  },
  /** After each fixed step: the Courier kept where they wait; the Jar's checkpoints, its fall, its goal. */
  post(well, dt) {
    const st = this.st; if (!st?.on || well.stage?.id !== 'jar') return;
    this.park();
    const t = st.body.translation(), x = t.x - AT.x, y = t.y - AT.y;
    if (st.dead > 0) {
      if ((st.dead -= dt) <= 0) { const p = this.at(CHECKS[st.check]); st.body.setTranslation({ x: p.x, y: p.y, z: p.z }, true); st.body.setLinvel({ x: 0, y: 0, z: 0 }, true); st.body.setAngvel({ x: 0, y: 0, z: 0 }, true); st.mesh.visible = true; st.cam.snap = true; }
      return;
    }
    CHECKS.forEach(([cx, cy], i) => { if (i > st.check && x >= cx - 0.5 && Math.abs(y - JAR.r - cy) < 1) st.check = i; });
    if (y < -6) { st.dead = PIT.retry; st.mesh.visible = false; st.aiming = false; st.body.setGravityScale(JAR.gravity, true); well.game.events?.emit('well.pit.death', { stage: 'jar', cause: 'fall', by: 'courier' }); return; }
    if (x >= GOAL - 0.5 && Math.abs(y - JAR.r) < 1 && !well.stage.cleared) { well.clear(); this.leave(well, new THREE.Vector3(t.x, AT.y + 0.05, st.S.z)); }
  },

  update(well) {
    const st = this.st; if (!st) return;
    if (well.stage?.id !== 'jar') { if (st.on || st.lend) this.leave(well); return; }
    if (!st.on) return;
    const t = st.body.translation(), r = st.body.rotation();
    st.mesh.position.set(t.x, t.y, t.z); st.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    well.game.character?.setHidden(true);
    st.dots.visible = st.aiming;
    if (st.aiming) {
      const v = this.throwVel(_d), g = 14 * JAR.gravity;
      for (let i = 0; i < 16; i++) { const k = (i + 1) * 0.07; st.dots.setMatrixAt(i, _m.compose(_e.set(t.x + v.x * k, t.y + v.y * k - 0.5 * g * k * k, t.z), _q.identity(), _s.setScalar(0.6 + 0.4 * st.power))); }
      st.dots.instanceMatrix.needsUpdate = true;
    }
  },
  /** The camera follows the Jar as the frame follows the Courier (its numbers: SIDE_CAM). */
  camera(well, dt) {
    const st = this.st; if (!st?.on || well.stage?.id !== 'jar' || well.game.god?.controlling) return;
    const g = well.game, cam = g.camera, C = SIDE_CAM, F = well.frame.spec, t = st.body.translation(), c = st.cam;
    const k = c.snap ? 1 : 1 - Math.exp(-C.ease * dt);
    c.lead += (st.face * C.lead - c.lead) * (c.snap ? 1 : 1 - Math.exp(-C.leadEase * dt));
    const lo = F.x0 + C.edge, hi = F.x1 - C.edge;
    const wx = THREE.MathUtils.clamp(t.x + c.lead, lo, hi), wy = THREE.MathUtils.clamp(t.y + C.lift * 0.6, F.band[0], F.band[1]);
    if (c.snap) { c.x = wx; c.y = wy; } else { c.x += (wx - c.x) * k; c.y += (wy - c.y) * k; }
    c.snap = false;
    cam.position.set(c.x, c.y, F.z + C.dist);
    _m.lookAt(cam.position, _e.set(c.x, c.y - C.look, F.z), _u); cam.quaternion.setFromRotationMatrix(_m);
    cam.fov = C.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  },

  clear(well) {
    const st = this.st; if (!st) return;
    this.leave(well);
    for (const off of st.offs) off?.();
    this.st = null;
  },
};
