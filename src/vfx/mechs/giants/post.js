// ---------------------------------------------------------------------------------------
// THE GIANT POST'S DRESS (plain name; docs/plans/MECHS.md 11.2; the post Dovina's, world/hangar/giantpost.js): her plinth, pillar and
// lamp drawn as a stone lantern on a plinth with a bell, one job, a look only (her floor sign kept):
//   THE LANTERN  a kasuga-dōrō at the mech's scale: a hexagonal granite foot on a stepped plinth, a round pillar, its platform, the
//                firebox with its windows lit warm (her lamp's place), a six-sided roof whose corners curl up, the jewel on top
//   THE BELL     a bronze temple bell (a bonshō) hung under a wooden bracket off the pillar, toward the yard, its striking log beside it;
//                on `giant.call` the log swings into it, the bell sways on a damped swing and the gold rings of its note go out
// Prior art: the Kasuga Taisha's stone lanterns, a temple's bonshō and its shumoku log, Shadow of the Colossus's shrine idol (what calls
// the next giant), the hangar's yard dress (vfx/mechs/hangardress/yard.js: the house's stone and glaze at the mech's scale).
//
//   const P = new GiantPostLook(game)   P.update(dt, t)   P.dispose()   POST_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The colours and the bell's swing (rad at its strike, its damping a real s). */
export const POST_LOOK = { stone: 0x8a857a, dark: 0x5e5a52, bronze: 0x6a4a2a, verdigris: 0x5a8a74, wood: 0x6b4a2a, glow: 0xffb04a, swing: 0.35, damp: 1.4 };
const L = POST_LOOK, PI = Math.PI;

function merged(parts) { const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false); for (const p of parts) p.dispose(); return g; }
const at = (g, x, y, z, rx = 0, ry = 0, rz = 0) => g.rotateX(rx).rotateY(ry).rotateZ(rz).translate(x, y, z);

export class GiantPostLook {
  constructor(game) {
    this.game = game; this.post = null; this.own = null; this.swing = 0; this.vel = 0; this.offs = [];
    this.offs.push(game.events?.on?.('giant.call', () => this.strike()));
  }
  build(post) {
    const m = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
    this.mats = { stone: m({ color: L.stone, flatShading: true }), dark: m({ color: L.dark, flatShading: true }), bronze: m({ color: L.bronze, metalness: 0.75, roughness: 0.42 }),
      verd: m({ color: L.verdigris, metalness: 0.3, roughness: 0.6 }), wood: m({ color: L.wood }), glow: new THREE.MeshBasicMaterial({ color: L.glow, toneMapped: false }) };
    const own = this.own = new THREE.Group(); own.name = 'giant.post.dress'; post.add(own);
    const hex = (rt, rb, h) => new THREE.CylinderGeometry(rt, rb, h, 6);
    const stone = merged([
      at(new THREE.BoxGeometry(5.4, 0.6, 5.4), 0, 0.3, 0), at(hex(2.4, 2.7, 0.9), 0, 1.05, 0), at(hex(1.7, 2.3, 0.6), 0, 1.8, 0), // (the plinth and the foot)
      at(new THREE.CylinderGeometry(0.62, 0.7, 4.2, 14), 0, 4.2, 0), at(new THREE.TorusGeometry(0.72, 0.12, 5, 14), 0, 4.4, 0, PI / 2), // (the pillar and its tie)
      at(hex(1.9, 1.3, 0.7), 0, 6.6, 0), // (the platform)
      at(hex(2.9, 2.0, 0.7), 0, 8.95, 0), at(hex(1.2, 2.6, 0.9), 0, 9.75, 0), at(new THREE.CylinderGeometry(0.35, 0.5, 0.45, 10), 0, 10.4, 0), // (the roof)
    ]);
    const dark = merged([
      ...[0, 1, 2, 3, 4, 5].map((i) => at(new THREE.ConeGeometry(0.28, 0.9, 5), Math.cos(i * PI / 3 + PI / 6) * 2.8, 9.2, Math.sin(i * PI / 3 + PI / 6) * 2.8, 0, 0, 0)), // (the roof's curled corners)
      at(new THREE.SphereGeometry(0.55, 12, 10), 0, 10.95, 0), at(new THREE.ConeGeometry(0.32, 0.7, 10), 0, 11.6, 0), // (the jewel)
    ]);
    // the firebox: six posts round its windows, the light inside
    const box = merged([0, 1, 2, 3, 4, 5].map((i) => at(new THREE.BoxGeometry(0.3, 1.6, 0.3), Math.cos(i * PI / 3) * 1.15, 7.75, Math.sin(i * PI / 3) * 1.15)));
    const add = (g, mat, name) => { const o = new THREE.Mesh(g, mat); o.name = `giant.post.dress.${name}`; o.castShadow = o.receiveShadow = true; own.add(o); return o; };
    add(stone, this.mats.stone, 'stone'); add(dark, this.mats.dark, 'roof'); add(box, this.mats.stone, 'firebox');
    this.lamp = add(new THREE.CylinderGeometry(1.05, 1.05, 1.5, 6), this.mats.glow, 'light'); this.lamp.position.y = 7.75; this.lamp.castShadow = false;
    // the bell on its bracket, toward +z (the yard), and the striking log
    add(merged([at(new THREE.BoxGeometry(0.4, 0.4, 3.4), 0, 5.9, 1.7), at(new THREE.BoxGeometry(0.3, 2.2, 0.3), 0, 4.9, 3.25, 0.5)]), this.mats.wood, 'bracket');
    const hang = this.bell = new THREE.Group(); hang.position.set(0, 5.7, 3.1); own.add(hang);
    const prof = [[0, 0], [0.32, 0], [0.5, -0.15], [0.62, -1.0], [0.78, -1.75], [0.8, -1.9], [0.7, -1.95]].map(([r, y]) => new THREE.Vector2(r, y));
    const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), this.mats.bronze); bell.castShadow = true; hang.add(bell);
    for (const y of [-0.55, -1.35]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.67 + (y < -1 ? 0.08 : 0), 0.05, 4, 20), this.mats.verd); b.rotation.x = PI / 2; b.position.y = y; hang.add(b); }
    const log = this.log = new THREE.Group(); log.position.set(1.6, 6.0, 3.1); own.add(log);
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2, 10), this.mats.wood); lg.rotation.z = PI / 2; lg.position.set(0, -1.4, 0); log.add(lg);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), this.mats.wood); rope.position.set(0, -0.7, 0); log.add(rope);
  }
  /** The post called: the log swung into the bell. */
  strike() {
    if (!this.bell) return;
    this.vel = -L.swing * 6; this.logT = 0.5;
    this.bell.updateMatrixWorld(true); const p = this.bell.getWorldPosition(new THREE.Vector3()).setY(this.bell.getWorldPosition(new THREE.Vector3()).y - 1);
    try { this.game.vfx?.play('giant.post.bell', { pos: p }); } catch { /* (headless) */ }
  }
  update(dt, t) {
    const post = this.game.hangar?.post?.group || null;
    if (post !== this.post) { this.release(); this.post = post; if (post) { for (const c of post.children) if (c.isMesh && c.name.startsWith('giant.post.')) c.visible = false; this.build(post); } }
    if (!this.own) return;
    this.vel += (-this.swing * 18 - this.vel * L.damp) * dt; this.swing += this.vel * dt; this.bell.rotation.x = this.swing; // (a damped swing, the bell's)
    this.logT = Math.max(0, (this.logT || 0) - dt); this.log.rotation.z = -0.5 * Math.sin(PI * Math.min(1, (0.5 - this.logT) / 0.5)) * (this.logT > 0 ? 1 : 0);
    this.mats.glow.color.setHex(L.glow).multiplyScalar(1.2 + 0.18 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
  }
  release() {
    if (!this.own) return;
    this.own.removeFromParent(); this.own.traverse((o) => o.geometry?.dispose()); for (const m of Object.values(this.mats)) m.dispose();
    this.own = null; this.bell = null; this.log = null; this.post = null;
  }
  dispose() { this.release(); for (const o of this.offs) o?.(); this.offs = []; }
}
