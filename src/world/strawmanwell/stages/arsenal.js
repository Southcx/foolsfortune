// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE ARSENAL (docs/plans/STRAWMANS-WELL.md 3.5): run and gun on the plane. The psygun is lent for the stage (the belt's
// main, given back on leaving) and its shot held to the plane, aimed eight ways by the keys (arsenalaim.js); the shot is the house's, and
// what it struck is read from `shot.fire`. Four beats, each shown safe before it is asked:
//   targets       straw targets on stands: one ahead (its gate opens), one overhead and one up a diagonal (W, then W + D), one at a
//                 ledge's foot (S + D from the ledge): every gate a door that slides up when its targets are down
//   straw turrets two bales with a barrel that throw a slow straw ball at you while you are near; three shots each (a ball that meets you
//                 knocks you back and counts as a hit)
//   the cracked wall   only the charged shot (LMB held) breaks it; a plain round sparks off it
//   terrain bombs past the bomb crate F throws a bomb along the aim (a lob ahead with no key held), its fuse BOMB.fuse real s; it blows a
//                 hole of BOMB.r m in the blocks (Spelunky's tiles): through a wall of them, then down through a floor of them into the
//                 passage under the last wall, where the goal is
// Placeholder looks (the targets felt, the blocks spool wood, the bombs dark); Calissa dresses them. Words placeholders, Espada's.
//
// Prior art: Contra's and Metal Slug's run and gun (eight ways, while running), Mega Man's charge shot and its walls, Spelunky's bombs and
// its tile grid, Worms' lob, Super Mario Bros. 1-1's teaching by layout.
//
//   default export: a stage module (stagemods.js's contract)   BOMB   TURRET
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, G, groups } from '../../../core/physics.js';
import { sfx } from '../../../audio/sfx.js';
import { scaffold, floor, goalFlag, sign } from '../stages.js';
import { COLOR, DEPTH } from '../stagekit.js';
import { AT } from '../layout.js';
import { PlaneAim, aimOf, chestOf, lendTool } from './arsenalaim.js';

/** A bomb: its throw (m/s), the lob's angle with no key held (rad), its fuse (real s), the hole it blows (m), its push on you (m/s), its
 *  ball (m), and the time between two throws (real s). */
export const BOMB = { speed: 9.5, lob: 0.7, fuse: 1.6, r: 1.8, knock: 7, ball: 0.22, every: 0.7 };
/** A straw turret: its shots to fall, its reach (m), its beat (real s), its ball's speed (m/s), radius and life (s), its knock (m/s). */
export const TURRET = { hp: 3, reach: 13, every: 2.4, speed: 6, ball: 0.26, life: 4, knock: 5.5 };
const BLOCK = 1, RISE = 7.5;
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const inside = (p, r, pad = 0.12) => p.x > r.x0 - pad && p.x < r.x1 + pad && p.y > r.y0 - pad && p.y < r.y1 + pad;
const nearRect = (cx, cy, r, R) => { const x = Math.max(r.x0, Math.min(cx, r.x1)), y = Math.max(r.y0, Math.min(cy, r.y1)); return (x - cx) ** 2 + (y - cy) ** 2 < R * R; };

export default {
  id: 'arsenal',
  build(well, S) {
    const len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y;
    const st = (this.st = { well, S, targets: [], gates: [], turrets: [], balls: [], blocks: [], bombs: [], cool: 0, bag: false, offs: [] });
    scaffold(S, len);
    S.box(-1, len + 1, 13, 14, 0, { hidden: true }); // (a lid: a shot up meets something)
    const rect = (x0, x1, y0, y1) => ({ x0: X(x0), x1: X(x1), y0: Y(y0), y1: Y(y1) });
    const gate = (x, top = RISE) => { const b = S.box(x - 0.3, x + 0.3, 0, top, COLOR.door, { own: true }); const G0 = { ...b, y0: b.mesh.position.y, k: 0, open: false, solid: true }; st.gates.push(G0); return G0; };
    const target = (x0, x1, y0, y1, G0) => {
      const b = S.box(x0, x1, y0, y1, COLOR.mark, { own: true, d: 0.6 });
      const T0 = { ...b, rect: rect(x0, x1, y0, y1), gate: G0, down: false }; st.targets.push(T0); return T0;
    };
    // the first: one ahead
    floor(S, -1, 26); sign(S, 'SHOOT', 4, 4.2, 'LMB fires; W A S D aim it, eight ways');
    S.box(8.95, 9.05, 0, 0.7, COLOR.pin, { collide: false });
    const g1 = gate(11.6); target(8.7, 9.3, 0.7, 1.9, g1);
    // overhead and a diagonal
    sign(S, 'UP AND ACROSS', 15, 4.2, 'W aims up; W + D up the diagonal');
    const g2 = gate(25.3); target(16.7, 17.3, 7, 7.8, g2); target(22.2, 22.8, 6, 6.8, g2);
    S.box(16.97, 17.03, 7.8, 13, COLOR.thread, { collide: false, d: 0.05 }); S.box(22.47, 22.53, 6.8, 13, COLOR.thread, { collide: false, d: 0.05 });
    // a ledge, and a target at its foot (S + D from the top)
    S.box(26, 27.5, -4, 1.5, COLOR.boards); S.box(27.5, 33, -4, 3, COLOR.boards); sign(S, 'DOWN', 30, 6.2, 'S + D from the ledge aims down the diagonal');
    floor(S, 33, 72);
    const g3 = gate(39.4); target(34.8, 37, 0, 0.45, g3);
    // straw turrets
    sign(S, 'STRAW TURRETS', 44, 5.4, 'three shots each');
    const g4 = gate(57.4);
    S.box(52.5, 55.5, 0, 1.4, COLOR.spool);
    for (const [x, y, dir] of [[48, 0, -1], [54, 1.4, -1]]) {
      const b = S.box(x - 0.6, x + 0.6, y, y + 1.7, COLOR.thin, { own: true });
      const barrel = S.box(x + dir * 0.6 - 0.25, x + dir * 0.6 + 0.25, y + 1.05, y + 1.35, COLOR.door, { own: true, collide: false, d: 0.4 });
      st.turrets.push({ ...b, barrel: barrel.mesh, rect: rect(x - 0.6, x + 0.6, y, y + 1.7), at: S.at(x + dir * 0.9, y + 1.2), hp: TURRET.hp, t: TURRET.every * 0.6, gate: g4, flash: 0 });
    }
    // the cracked wall: the charge shot's
    sign(S, 'CHARGE', 59.2, 9.4, 'hold LMB, let go: only that cracks it');
    const wall = S.box(60, 61.2, 0, 13, COLOR.slope, { own: true });
    st.cracks = [[2.2, 0.5], [4, -0.6], [5.6, 0.4], [7.4, -0.3]].map(([y, a]) => S.box(60.1, 61.1, y, y + 0.08, COLOR.door, { collide: false, rotZ: a, d: DEPTH + 0.05, outline: false, own: true }).mesh);
    st.wall = { ...wall, rect: rect(60, 61.2, 0, 13), broken: false };
    // the bombs: a crate of them, a wall of blocks, then a floor of blocks over the passage under the last wall
    S.box(63.2, 64.6, 0, 0.9, COLOR.spool); for (const dx of [0, 0.45, 0.9]) S.box(63.4 + dx, 63.75 + dx, 0.9, 1.25, COLOR.door, { collide: false, d: 0.35 });
    sign(S, 'BOMBS', 64, 5.2, 'F throws one along the aim; it blows the blocks');
    st.bagAt = X(63.2);
    for (let x = 67; x < 69; x++) for (let y = 0; y < 13; y++) this.block(x + 0.5, y + 0.5);
    for (let x = 72; x < 77; x++) for (let y = -2; y < 0; y++) this.block(x + 0.5, y + 0.5);
    S.box(71, len + 1, -9, -5, COLOR.boards); S.box(77, 78.5, -2, 0, COLOR.boards); S.box(78.5, 80, -2, 13, COLOR.wing); S.box(80, len + 1, -2, 0, COLOR.boards);
    sign(S, 'DIG DOWN', 74.5, 4, 'S + F sets one at your feet; the way is under the wall');
    this.blocksMesh(S);
    goalFlag(S, 85, -5);
    st.listen = (e) => this.shot(e);
    st.offs.push(well.game.events?.on('shot.fire', st.listen), well.game.events?.on('zone.acoustic', () => { if (!well.here) this.leave(well); }));
    st.aim = new PlaneAim(well, ['arsenal']);
    return { goal: [85, -5], door: [87.5, -5], checks: [[2, 0], [13, 0], [34, 0], [42, 0], [62, 0], [73.5, -5]] };
  },

  /** A block of the stage's matter (Spelunky's tile): an instance of one mesh, a collider of its own. */
  block(cx, cy) {
    const st = this.st, X = AT.x + cx, Y = AT.y + cy, z = st.S.z;
    const collider = st.well.kit.collider(RAPIER.ColliderDesc.cuboid(BLOCK / 2, BLOCK / 2, DEPTH / 2).setTranslation(X, Y, z).setFriction(0.9));
    st.blocks.push({ x: X, y: Y, collider, alive: true, i: st.blocks.length });
  },
  blocksMesh(S) {
    const st = this.st, n = st.blocks.length;
    const M = new THREE.InstancedMesh(new THREE.BoxGeometry(BLOCK * 0.98, BLOCK * 0.98, DEPTH), new THREE.MeshStandardMaterial({ color: COLOR.spool, roughness: 0.9, flatShading: true }), n);
    st.blocks.forEach((b, i) => M.setMatrixAt(i, _m.makeTranslation(b.x, b.y, S.z)));
    M.instanceMatrix.needsUpdate = true; M.computeBoundingSphere(); M.castShadow = M.receiveShadow = true; S.add(M); st.blockMesh = M;
  },
  blow(b) {
    const st = this.st; if (!b.alive) return;
    b.alive = false; b.collider?.setEnabled(false);
    st.blockMesh.setMatrixAt(b.i, _m.compose(_v.set(b.x, b.y, st.S.z), _q.identity(), _s.setScalar(0))); st.blockMesh.instanceMatrix.needsUpdate = true;
    st.well.game.fx?.impact?.(_v.set(b.x, b.y, st.S.z + 0.6), _d.set(0, 1, 0), { sparks: 3, dust: 6 });
  },

  enter(well) {
    const st = this.st; if (!st) return;
    st.lend?.restore(); st.lend = lendTool(well, 'psygun', { draw: true }); st.aim.on();
    st.bag = false; st.cool = 0;
  },
  leave() {
    const st = this.st; if (!st) return;
    st.aim?.off(); st.lend?.restore(); st.lend = null;
  },

  /** A round's end read from `shot.fire`: a target, a turret, the cracked wall. */
  shot(e) {
    const st = this.st, W = st?.well; if (!st || W.stage?.id !== 'arsenal' || !e?.at) return;
    e = { ...e, at: this.reach(e) };
    if (Math.abs(e.dir?.y ?? 0) > 0.3) W.verb('shoot8'); // (aimed off the level: the eight ways)
    for (const T0 of st.targets) if (!T0.down && inside(e.at, T0.rect)) this.strike(T0);
    for (const U of st.turrets) if (U.hp > 0 && inside(e.at, U.rect)) this.hurt(U, 1);
    if (!st.wall.broken && inside(e.at, st.wall.rect, 0.2) && e.charged) this.breakWall();
    if (e.charged) W.verb('chargeShot');
  },
  /** Where a round ended on the plane: its `at`, or (where the house's ray ended off the plane, a miss) the chest along its way. */
  reach(e) {
    const W = this.st.well, z = this.st.S.z;
    if (Math.abs(e.at.z - z) < 2) return e.at;
    const from = chestOf(W, e.dir, new THREE.Vector3()), h = W.game.physics.raycast(from, e.dir, 60, W.game.player.collider, groups(0xffff, G.STATIC));
    return h ? h.point : e.at;
  },
  strike(T0) {
    const st = this.st; T0.down = true; T0.collider?.setEnabled(false);
    T0.mesh.material.color.setHex(COLOR.used); T0.mesh.rotation.z = 1.2; T0.mesh.position.y -= 0.3;
    st.well.game.fx?.impact?.(T0.mesh.position.clone(), _d.set(0, 1, 0), { sparks: 8, dust: 4 });
    if (st.targets.filter((t) => t.gate === T0.gate).every((t) => t.down)) T0.gate.open = true;
  },
  hurt(U, n) {
    const st = this.st; U.hp -= n; U.flash = 0.15;
    if (U.hp > 0) return;
    U.collider?.setEnabled(false); U.mesh.visible = false; U.barrel.visible = false;
    st.well.game.fx?.impact?.(U.mesh.position.clone(), _d.set(0, 1, 0), { sparks: 14, dust: 14 });
    if (st.turrets.filter((u) => u.gate === U.gate).every((u) => u.hp <= 0)) U.gate.open = true;
  },
  breakWall() {
    const st = this.st, w = st.wall; w.broken = true; w.collider?.setEnabled(false); w.mesh.visible = false;
    for (const c of st.cracks) c.visible = false;
    const g = st.well.game; g.fx?.explosion?.(w.mesh.position.clone(), 2); sfx.explosion?.(4);
    for (let y = 1; y < 12; y += 2) g.fx?.impact?.(_v.set(w.mesh.position.x, AT.y + y, st.S.z + 0.6), _d.set(-1, 0, 0), { sparks: 4, dust: 8 });
  },

  // ---------------------------------------------------------------- bombs
  throwBomb(well) {
    const st = this.st, g = well.game, P = g.player, w = g.physics.world;
    const aim = aimOf(well, new THREE.Vector3()), R = well.frame.realInput;
    const drop = R.isDown('KeyS') && !R.isDown('KeyA') && !R.isDown('KeyD') && P.grounded; // (S alone on the ground: set down at the feet, Spelunky's)
    if (!R.isDown('KeyW') && !R.isDown('KeyS')) aim.set(well.frame.face * Math.cos(BOMB.lob), Math.sin(BOMB.lob), 0); // (no key held: a lob ahead)
    const at = drop ? new THREE.Vector3(P.pos.x + well.frame.face * 0.45, P.pos.y + BOMB.ball + 0.05, P.pos.z) : chestOf(well, aim, new THREE.Vector3()).addScaledVector(aim, 0.6);
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(at.x, at.y, at.z).setGravityScale(1.5).setCcdEnabled(true).setLinearDamping(0.1));
    body.setEnabledTranslations(true, true, false, true); body.setEnabledRotations(false, false, false, true); // (it slides to a stop where it lands: a ball that rolled took the blast away from the wall it was thrown at)
    w.createCollider(RAPIER.ColliderDesc.ball(BOMB.ball).setRestitution(0.12).setFriction(1.2).setDensity(3).setCollisionGroups(groups(G.DEBRIS, G.STATIC)), body);
    if (!drop) body.setLinvel({ x: aim.x * BOMB.speed + P.vel.x * 0.5, y: aim.y * BOMB.speed + Math.max(0, P.vel.y) * 0.3, z: 0 }, true);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(BOMB.ball, 12, 8), new THREE.MeshStandardMaterial({ color: COLOR.door, roughness: 0.6, emissive: 0x401000 }));
    const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), new THREE.MeshBasicMaterial({ color: 0xffb040 })); fuse.position.y = BOMB.ball + 0.06; mesh.add(fuse);
    mesh.position.copy(at); st.S.group.add(mesh);
    st.bombs.push({ body, mesh, t: BOMB.fuse }); st.cool = BOMB.every;
  },
  explode(B) {
    const st = this.st, W = st.well, g = W.game, P = g.player, t = B.body.translation(), cx = t.x, cy = t.y;
    for (const b of st.blocks) if (b.alive && nearRect(cx, cy, { x0: b.x - 0.5, x1: b.x + 0.5, y0: b.y - 0.5, y1: b.y + 0.5 }, BOMB.r)) this.blow(b);
    for (const U of st.turrets) if (U.hp > 0 && nearRect(cx, cy, U.rect, BOMB.r)) this.hurt(U, TURRET.hp);
    for (const T0 of st.targets) if (!T0.down && nearRect(cx, cy, T0.rect, BOMB.r)) this.strike(T0);
    _v.set(P.pos.x - cx, P.pos.y + 0.9 - cy, 0);
    if (_v.length() < BOMB.r + 0.4 && !(P.invuln > 0)) { _v.normalize(); P.impulse(new THREE.Vector3(_v.x * BOMB.knock, Math.max(3, _v.y * BOMB.knock), 0), 'bomb'); W.hit(); }
    g.fx?.explosion?.(new THREE.Vector3(cx, cy, st.S.z), BOMB.r); sfx.explosion?.(Math.max(1, Math.abs(P.pos.x - cx)));
    this.removeBomb(B);
    W.verb('bomb');
  },
  removeBomb(B) {
    try { this.st.well.game.physics.world.removeRigidBody(B.body); } catch { /* (gone already) */ }
    B.mesh.parent?.remove(B.mesh); B.mesh.geometry.dispose(); B.mesh.material.dispose(); B.mesh.children[0]?.geometry?.dispose(); B.mesh.children[0]?.material?.dispose();
  },

  // ---------------------------------------------------------------- each frame
  update(well, dt) {
    const st = this.st; if (!st) return;
    const g = well.game, P = g.player, here = well.stage?.id === 'arsenal', raw = g.rawDt ?? dt;
    if (!here && st.lend) this.leave(well);
    for (const G0 of st.gates) {
      G0.k += ((G0.open ? 1 : 0) - G0.k) * Math.min(1, dt * 4); G0.mesh.position.y = G0.y0 + G0.k * RISE;
      const solid = G0.k < 0.4; if (solid !== G0.solid) { G0.solid = solid; G0.collider?.setEnabled(solid); }
    }
    for (let i = st.bombs.length - 1; i >= 0; i--) {
      const B = st.bombs[i], t = B.body.translation(), r = B.body.rotation();
      B.mesh.position.set(t.x, t.y, t.z); B.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      B.mesh.children[0].visible = Math.floor(B.t * 10) % 2 === 0;
      if ((B.t -= raw) <= 0 || t.y < AT.y - 12) { if (B.t <= 0) this.explode(B); else this.removeBomb(B); st.bombs.splice(i, 1); }
    }
    if (!here) return;
    // the bomb bag: past the crate, F throws (when F has nothing else here to act on)
    if (!st.bag && P.pos.x > st.bagAt) st.bag = true;
    st.cool -= raw;
    const it = g.interact?.cur;
    if (st.bag && P.peekLatch?.('KeyF') && it?.id !== 'strawmanwell' && st.cool <= 0 && !g.god?.controlling) { P.latch('KeyF'); this.throwBomb(well); }
    // the turrets: a slow straw ball at you while you are near
    for (const U of st.turrets) {
      if (U.flash > 0) { U.flash -= raw; U.mesh.material.color.setHex(U.flash > 0 ? 0xffffff : COLOR.thin); }
      if (U.hp <= 0) continue;
      const near = Math.abs(P.pos.x - U.at.x) < TURRET.reach && Math.abs(P.pos.y - U.at.y) < 8;
      if (!near || (U.t -= raw) > 0) continue;
      U.t = TURRET.every;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(TURRET.ball, 0), new THREE.MeshStandardMaterial({ color: COLOR.thin, flatShading: true }));
      m.position.copy(U.at); st.S.group.add(m);
      _d.set(P.pos.x - U.at.x, P.pos.y + 1.1 - U.at.y, 0).normalize();
      st.balls.push({ m, v: _d.clone().multiplyScalar(TURRET.speed), t: TURRET.life });
    }
    for (let i = st.balls.length - 1; i >= 0; i--) {
      const B = st.balls[i]; B.m.position.addScaledVector(B.v, raw); B.m.rotation.z += raw * 6;
      _v.set(P.pos.x, P.pos.y + 1, P.pos.z);
      let gone = (B.t -= raw) <= 0;
      if (!gone && _v.distanceTo(B.m.position) < 0.7 && !(P.invuln > 0)) { P.impulse(new THREE.Vector3(Math.sign(B.v.x || 1) * TURRET.knock, 3, 0), 'cannon'); well.hit(); gone = true; }
      if (!gone) { const h = g.physics.raycast(B.m.position, _d.copy(B.v).normalize(), TURRET.speed * raw + TURRET.ball, P.collider, groups(0xffff, G.STATIC)); if (h && !st.turrets.some((u) => u.collider === h.collider)) gone = true; }
      if (gone) { B.m.parent?.remove(B.m); B.m.geometry.dispose(); B.m.material.dispose(); st.balls.splice(i, 1); }
    }
  },

  clear(well) {
    const st = this.st; if (!st) return;
    this.leave(well);
    for (const off of st.offs) off?.();
    for (const B of st.bombs) this.removeBomb(B);
    this.st = null; // (the kit takes its own meshes and colliders, the balls and the blocks' mesh with the room's group)
  },
};
