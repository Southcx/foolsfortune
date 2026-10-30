// ---------------------------------------------------------------------------------------
// THE TOUCHSTONE (Espada's name, proposed; docs/plans/APTITUDE.md 10.3; the owner, 2026-10-18): the Assay's own room, the one place with
// nothing else in it, so a standard trial's conditions are fixed and the streak is only yours. A dark hall far from everything (its zone
// `touchstone`), a black stone standing at its north end where the trials are shown, and five plinths before it, one a trial
// (progress/assaytrials.js TRIALS): F at a plinth begins that trial (world/touchstone/trialrun.js), and the trial is announced as one
// ("sometimes it's good to know you're being tested"). Its interface goes when you leave the room. Two ways in: the Index's row, and the
// door back to the hub on its south wall. An area of its own (render/areas.js stage 2): built when the camera comes to it, torn down whole
// after it leaves. The look is a placeholder (the goldsmith's black stone streaked gold: Calissa's to dress).
//
// Prior art: the psychophysics booth (a dark room, one display, nothing to look at but the test), Brain Age's and the Human Benchmark's
// test-a-time menus, Raku's bazaar (world/bazaar/bazaar.js: the same build, teardown, arrival and F wiring).
//
//   TOUCHSTONE (where it stands; its stone, plinths and door)   game.touchstone = new Touchstone(game)   .here   .arrive()   .leave()
//   .build()   .teardown()   .built   .update(dt)   .light()   .run (the trial running, or null)   events touchstone.enter, touchstone.leave
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { addOutline } from '../../render/outline.js';
import { zoneOf } from '../../render/zonemap.js';
import { label } from '../basement/basement.js';
import { TRIALS } from '../../progress/assaytrials.js';
import { TrialRun } from './trialrun.js';

/** Where it stands (Petra's place, 2026-10-29: empty ground east of the bazaar, out of every sky), its size, and where things are on its
 *  floor (local metres; north is -z). */
export const TOUCHSTONE = {
  x: 3000, y: 200, z: -3000, w: 22, d: 18, h: 8,
  stone: { z: -6.5, w: 4.4, h: 2.6, t: 0.5, y: 2.1 }, plinthZ: -1.6, door: { z: 8.4 }, arrive: { x: 0, z: 6, yaw: Math.PI },
  plinths: ['gonogo', 'pitch', 'colour', 'rhythm', 'react'].map((id, i) => ({ id, x: (i - 2) * 3.4 })),
};
/** Its air: near black, the stone the only thing lit. */
export const AIR = { fog: 0x0b0a0d, density: 0.012 };
const EYE = 1.6; // (m: the first person's eye over the floor, near enough to aim the view at the stone's middle)
const C = { floor: 0x1a181c, wall: 0x121014, stone: 0x060507, plinth: 0x2b2830, gold: 0xd9a441, door: 0x6b5a3a };

export class Touchstone {
  constructor(game) { this.game = game; this.built = false; this.run = null; this.lamps = []; }

  build() {
    if (this.built) return;
    const g = this.game, B = TOUCHSTONE, y = B.y, X = (x) => B.x + x, Z = (z) => B.z + z, phys = g.physics;
    const room = this.room = new THREE.Group(); room.name = 'touchstone'; room.userData.zone = 'touchstone';
    const geos = new Map(), cols = this.colliders = [], body = g.level?.fixedBody;
    const put = (geo, color) => { if (!geos.has(color)) geos.set(color, []); geos.get(color).push(geo.index ? geo.toNonIndexed() : geo); };
    const box = (pos, size, color, collide = true) => {
      const geo = new THREE.BoxGeometry(...size); geo.translate(...pos); put(geo, color);
      if (collide && phys && body) cols.push(phys.world.createCollider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setTranslation(...pos).setCollisionGroups(GROUPS.static).setFriction(0.9), body));
    };
    box([X(0), y - 0.5, Z(0)], [B.w + 2, 1, B.d + 2], C.floor);
    box([X(0), y + B.h + 0.5, Z(0)], [B.w + 2, 1, B.d + 2], C.wall);
    for (const s of [-1, 1]) box([X(s * (B.w / 2 + 0.5)), y + B.h / 2, Z(0)], [1, B.h, B.d + 2], C.wall);
    box([X(0), y + B.h / 2, Z(-B.d / 2 - 0.5)], [B.w + 2, B.h, 1], C.wall);
    for (const s of [-1, 1]) box([X(s * 6.5), y + B.h / 2, Z(B.d / 2 + 0.5)], [B.w / 2 - 2, B.h, 1], C.wall); // (the south wall, a gap for the door)
    box([X(0), y + B.h - 1.5, Z(B.d / 2 + 0.5)], [5, 3, 1], C.wall);
    box([X(0), y + 2.5, Z(B.d / 2 + 0.9)], [3, 5, 0.3], C.door); // (the door: F goes back to the hub)
    const S = B.stone; box([X(0), y + S.y, Z(S.z)], [S.w, S.h, S.t], C.stone); // (the touchstone: the trials are shown on its face)
    box([X(0), y + S.y - S.h / 2 - 0.15, Z(S.z)], [S.w + 0.6, 0.3, S.t + 0.4], C.plinth);
    for (const P of B.plinths) { box([X(P.x), y + 0.5, Z(B.plinthZ)], [0.9, 1, 0.9], C.plinth); box([X(P.x), y + 1.02, Z(B.plinthZ)], [0.7, 0.04, 0.7], C.gold, false); }
    for (const [color, list] of geos) {
      const merged = mergeGeometries(list.map((q) => { q.deleteAttribute('uv'); return q; }), false); for (const q of list) q.dispose();
      const m = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color, roughness: color === C.stone ? 0.35 : 0.9, metalness: color === C.gold ? 0.6 : 0, flatShading: true }));
      m.receiveShadow = true; m.castShadow = color !== C.floor; if (color !== C.floor && color !== C.wall) addOutline(m); room.add(m);
    }
    // a gold streak along the stone's foot (the goldsmith's mark) and the trials' names on the floor before each plinth
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(S.w * 0.8, 0.05), new THREE.MeshBasicMaterial({ color: C.gold, toneMapped: false }));
    streak.position.set(X(0), y + S.y - S.h / 2 + 0.12, Z(S.z + S.t / 2 + 0.01)); room.add(streak);
    for (const P of B.plinths) label(room, TRIALS[P.id].label.toUpperCase(), [X(P.x), y + 0.01, Z(B.plinthZ + 1.1)], { rotY: Math.PI, width: 2.4 });
    label(room, 'THE TOUCHSTONE', [X(0), y + S.y + S.h / 2 + 0.6, Z(S.z + S.t / 2 + 0.02)], { rotY: Math.PI, width: 3.2, vertical: true });
    // two lamps of the light budget: one on the stone, one over the plinths (render/lightbudget.js adopts them from the scene)
    for (const [lx, ly, lz, i] of [[0, 5.5, -3.5, 14], [0, 6, 3, 8]]) { const l = new THREE.PointLight(0xfff1dc, i, 16, 1.6); l.position.set(X(lx), y + ly, Z(lz)); room.add(l); this.lamps.push(l); }
    g.scene.add(room);
    this.built = true;
  }

  teardown() {
    if (!this.built) return;
    const g = this.game, phys = g.physics;
    this.stopRun();
    if (this.room) {
      g.scene.remove(this.room);
      this.room.traverse((o) => { if (o.geometry && !o.userData.isOutline) o.geometry.dispose(); if (o.material && !o.userData.isOutline) for (const m of [].concat(o.material)) m.dispose(); }); // (the labels' textures are the basement's shared ones: kept)
    }
    for (const c of this.colliders || []) phys?.world?.removeCollider(c, false);
    this.room = null; this.colliders = []; this.lamps = []; this.built = false;
  }

  get here() { return zoneOf(this.game.player.pos) === 'touchstone'; }
  arrive() {
    const g = this.game, B = TOUCHSTONE;
    g.player.killY = B.y - 60; g.course?.teleport(new THREE.Vector3(B.x + B.arrive.x, B.y + 0.05, B.z + B.arrive.z), B.arrive.yaw);
    g.events?.emit('touchstone.enter', { by: 'courier' });
  }
  leave() {
    const g = this.game, C2 = g.course; this.stopRun();
    const home = () => C2?.teleport(C2.hubSpawn.v, C2.hubSpawn.yaw);
    g.seam?.cross(home) || home();
    g.events?.emit('touchstone.leave', { by: 'courier' });
  }

  /** F at a plinth or the door (wired on the first frame, as the bazaar's: the chevron exists after boot). */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('touchstone', () => {
      if (!this.built || !this.here || this.run || g.dialogue?.open || g.god?.controlling) return null;
      const P = g.player.pos, B = TOUCHSTONE; let best = null;
      const near = (ref, x, z, reach, h) => { const d = Math.hypot(P.x - (B.x + x), P.z - (B.z + z)); if (d < reach && (!best || d < best.d)) best = { pos: new THREE.Vector3(B.x + x, B.y + h, B.z + z), d, ref }; };
      for (const p of B.plinths) near(p.id, p.x, B.plinthZ, 1.6, 1.6);
      near('door', 0, B.door.z, 2.4, 3);
      return best;
    });
  }

  /** A trial begun at its plinth: the Courier stood behind it facing the stone and held still, the screen the trial's on touch. */
  begin(id) {
    const g = this.game, B = TOUCHSTONE, P = g.player, S = B.stone, p = B.plinths.find((q) => q.id === id); if (!p || this.run) return;
    g.course?.teleport(new THREE.Vector3(B.x + p.x * 0.35, B.y + 0.05, B.z + B.plinthZ + 1.4), Math.PI, { keepPool: true });
    this.froze = P.freeze; P.freeze = true; P.vel?.set?.(0, 0, 0);
    this.view0 = P.view; P.view = 'fp'; P.pitch = Math.atan2(S.y - EYE, B.plinthZ + 1.4 - S.z); // (the stone seen in the first person, square on: nothing of the Courier between)
    const held = g.belt?.inHand, main = g.belt?.get?.(g.belt.main); this.held = held || null; // (empty hands: no tool's reticle over the stimulus, the prone holster's way: tools/proneholster.js)
    held?.stow(); if (main && main !== held) main.stow(); // (the main put away too, or the first person draws the psygun on its own: tools/psygun/weapon.js)
    const stage = { group: this.room, at: new THREE.Vector3(B.x, B.y + S.y, B.z + S.z + S.t / 2 + 0.01), right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0), normal: new THREE.Vector3(0, 0, 1) };
    this.run = new TrialRun(g, id, stage);
    if (g.touch) { this.run.taker.keepsHud = true; g.touch.take = this.run.taker; } // (the screen is the trial's, the log's ticker kept: its instructions are there, core/touchdriver.js hudTaken)
  }
  stopRun() {
    const g = this.game; if (!this.run) return;
    if (!this.run.done) this.run.stop();
    this.run = null; g.player.freeze = !!this.froze; if (this.view0) { g.player.view = this.view0; this.view0 = null; }
    if (this.held) { if (g.belt?.isWorn?.(this.held.id)) g.belt.draw(this.held); this.held = null; }
    if (g.touch?.take) g.touch.take = null;
  }

  /** Its own air (after the room's fog is graded each frame, as the bazaar's). */
  light() {
    const g = this.game, F = g.scene.fog; if (!F || zoneOf(g.camera.position) !== 'touchstone') return;
    F.color.setHex(AIR.fog); F.density = AIR.density;
  }

  update(dt) {
    this.wire();
    const g = this.game, it = g.interact?.cur, P = g.player;
    if (it?.id === 'touchstone' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      if (it.ref === 'door') this.leave(); else this.begin(it.ref);
    }
    if (this.run) { this.run.update(g.rawDt ?? dt); if (this.run.done || !this.here) this.stopRun(); }
  }
}
