// ---------------------------------------------------------------------------------------
// THE MOUNTS ON DECK: the bell and the coffin (the Crucibelle's toll and the Lockheart's gulp at sea: Dovina's SEA_MOUNTS, Petra's
// world/opensea/seamounts.js), a part of the mounts' look (vfx/opensea/seamounts.js). Each stands on the hull while its tool is worn,
// in the hull's frame (so it heels and pitches with it).
//   THE BELL      the Crucibelle's bronze on a timber yoke at the bow: rung, it swings hard and settles, a glint at its lip; knocked dull
//                 (a fizzle) it barely stirs.
//   THE COFFIN    the Lockheart's, lying on the foredeck, its head aft and its lid hinged there: a gulp throws the lid up and the sea off
//                 the bow spirals into it (its own little whirl of dark crude blobs drawn in, quickening, Lachryma's violet glints as
//                 each goes in; a spit drunk as a fat blob), then the lid drops. While it holds a drink (`gulped`) the lid rides a crack
//                 open and the light leaks round it; the bow shot that carries the drink back leaves with a violet burst at the coffin
//                 and a dark-cored violet wake behind it.
// Prior art: a ship's bell on its belfry (rung by its lanyard), the Lockheart's hoover on foot (tools/lockheart: the coffin drawing in),
// Luigi's Mansion's Poltergust swirl (a vortex you can read), Sea of Thieves' bucket bailing the sea out of a hull.
//
//   new DeckMounts(M)   .ring(k?)   .gulp(e)   .bellAt(out)   .coffinAt(out)   .update(dt)   .parked() -> [mesh]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** bell: where (a share of the hull's length forward), its size (m), swing (rad, rad/s, decay /s); coffin: where, its size (m), the
 *  lid's open and close (real s), held open (real s); vortex: blobs drawn in a real s, how long they come, the reach drawn from (m),
 *  their cap; glow: the drink's colour. */
export const DECK_MOUNTS_LOOK = {
  bell: { z: 0.4, h: 1.6, swing: 0.55, hz: 7, decay: 2.2, bronze: 0xb3793a, wood: 0x4e3324 },
  coffin: { z: 0.24, len: 2.6, wide: 1.1, deep: 0.55, open: 0.15, hold: 1.0, close: 0.35, wood: 0x2a1b17, brass: 0xc9a24a },
  vortex: { rate: 120, for: 0.85, reach: 24, cap: 110, crude: 0x15100c },
  glow: 0xb68cff,
};
const D = DECK_MOUNTS_LOOK, UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const _hide = new THREE.Matrix4().makeScale(0, 0, 0);

/** The coffin's outline in the plane (x across, y along: the head at -y), its six sides. */
function coffinShape(len, wide) {
  const h = len / 2, w = wide / 2, s = new THREE.Shape();
  s.moveTo(-w * 0.6, -h); s.lineTo(w * 0.6, -h); s.lineTo(w, -h * 0.45); s.lineTo(w * 0.55, h); s.lineTo(-w * 0.55, h); s.lineTo(-w, -h * 0.45); s.closePath();
  return s;
}

export class DeckMounts {
  constructor(M) {
    this.M = M; this.host = null; this.swing = 0; this.swingV = 0; this.lid = 0; this.gulpT = -1; this.blobs = []; this.seen = new WeakSet(); this.flareT = 0;
    const B = D.bell, bronze = new THREE.MeshStandardMaterial({ color: B.bronze, metalness: 0.85, roughness: 0.32 }), wood = new THREE.MeshStandardMaterial({ color: B.wood, roughness: 0.8 });
    // the bell: a lathe profile hung from its crown, the clapper under it, on a yoke of two posts and a beam
    const prof = [[0.0, 0], [0.32, -0.02], [0.4, -0.25], [0.42, -0.7], [0.52, -1.1], [0.75, -1.45], [0.78, -1.55], [0.7, -1.52]].map(([r, y]) => new THREE.Vector2(r * B.h / 1.6, y * B.h / 1.6));
    const bell = new THREE.LatheGeometry(prof, 20), clap = new THREE.SphereGeometry(0.16, 8, 6); clap.translate(0, -B.h * 0.85, 0);
    const crown = new THREE.TorusGeometry(0.14, 0.05, 6, 10); crown.translate(0, 0.08, 0);
    this.bell = new THREE.Group(); this.bellSwing = new THREE.Group(); this.bellSwing.position.y = B.h * 1.75; this.bell.add(this.bellSwing);
    this.bellSwing.add(new THREE.Mesh(mergeGeometries([bell, clap, crown].map((g) => g.toNonIndexed())), bronze));
    const post = (x) => { const g = new THREE.BoxGeometry(0.18, B.h * 1.9, 0.18); g.translate(x, B.h * 0.95, 0); return g; };
    const beam = new THREE.BoxGeometry(B.h * 1.4, 0.2, 0.22); beam.translate(0, B.h * 1.85, 0);
    this.bell.add(new THREE.Mesh(mergeGeometries([post(B.h * 0.62), post(-B.h * 0.62), beam].map((g) => g.toNonIndexed())), wood));
    this.bellMat = bronze;
    // the coffin: its box, its lid on a hinge at its head (aft), a brass cross on the lid, the glow under the lid
    const C = D.coffin, sh = coffinShape(C.len, C.wide);
    const box = new THREE.ExtrudeGeometry(sh, { depth: C.deep, bevelEnabled: false }); box.rotateX(-Math.PI / 2);
    const lid = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 }); lid.rotateX(-Math.PI / 2); lid.translate(0, 0, -C.len / 2);
    const cw = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.55 }), brass = new THREE.MeshStandardMaterial({ color: C.brass, metalness: 0.9, roughness: 0.3 });
    const crossA = new THREE.BoxGeometry(0.12, 0.05, C.len * 0.6), crossB = new THREE.BoxGeometry(C.wide * 0.6, 0.05, 0.12); crossB.translate(0, 0, -C.len * 0.2);
    const cross = mergeGeometries([crossA, crossB].map((g) => g.toNonIndexed())); cross.translate(0, 0.16, -C.len / 2 - C.len * 0.02);
    // (the shape's -y is its head: rotateX(-PI/2) lays it with the head at +z; the coffin group turns it so the head is aft)
    this.coffin = new THREE.Group(); this.coffin.rotation.y = Math.PI;
    this.coffin.add(new THREE.Mesh(box, cw));
    this.lidPivot = new THREE.Group(); this.lidPivot.position.set(0, C.deep, C.len / 2); this.coffin.add(this.lidPivot);
    this.lidPivot.add(new THREE.Mesh(lid, cw), new THREE.Mesh(cross, brass));
    const inner = new THREE.ShapeGeometry(coffinShape(C.len * 0.9, C.wide * 0.85)); inner.rotateX(-Math.PI / 2);
    this.glowMat = new THREE.MeshBasicMaterial({ color: D.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.glow = new THREE.Mesh(inner, this.glowMat); this.glow.position.y = C.deep - 0.04; this.coffin.add(this.glow);
    this.mouth = new THREE.Object3D(); this.mouth.position.set(0, C.deep + 0.2, 0); this.coffin.add(this.mouth);
    // the whirl's blobs, one instanced draw in the world
    const V = D.vortex;
    this.whirl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshStandardMaterial({ color: V.crude, roughness: 0.15, metalness: 0.4, emissive: 0x2a0c30, emissiveIntensity: 0.8 }), V.cap);
    this.whirl.frustumCulled = false; this.whirl.count = 0; this.whirl.userData.zone = 'opensea'; this.whirl.name = 'gulp-whirl'; M.game.scene?.add(this.whirl);
    for (const o of [this.bell, this.coffin]) { o.visible = false; o.userData.zone = 'opensea'; o.traverse((x) => { if (x.isMesh) x.castShadow = true; }); }
  }
  parked() { return [this.whirl, this.bellSwing.children[0], this.coffin.children[0], this.glow]; }

  /** Stand the props on the hull now drawn (a new hull: moved to it), each while its tool is worn. */
  seat() {
    const M = this.M, K = M.helm?.look, host = K?.body || K?.group || null, worn = M.live ? M.fight?.mounts?.worn || [] : [];
    if (host !== this.host) { this.host = host; if (host) host.add(this.bell, this.coffin); }
    if (!host) { this.bell.visible = this.coffin.visible = false; return; }
    const L = M.L, zb = L * D.bell.z, zc = L * D.coffin.z;
    this.bell.position.set(0, M.deckAt(zb), zb); this.coffin.position.set(0, M.deckAt(zc), zc);
    this.bell.visible = worn.includes('crucibelle'); this.coffin.visible = worn.includes('lockheart');
  }
  bellAt(out) { return this.bell.visible ? this.bellSwing.getWorldPosition(out) : this.M.shipPoint(0, this.M.deckAt(this.M.L * D.bell.z) + D.bell.h, this.M.L * D.bell.z, out); }
  coffinAt(out) { return this.coffin.visible ? this.mouth.getWorldPosition(out) : this.M.shipPoint(0, this.M.deckAt(this.M.L * D.coffin.z) + 0.8, this.M.L * D.coffin.z, out); }

  /** The bell rung (k 1), or knocked dull (a fizzle, k small). */
  ring(k = 1) {
    this.swingV += D.bell.swing * D.bell.hz * k * (this.swing > 0 ? -1 : 1);
    if (k < 0.5) return;
    const fx = this.M.fx, p = this.bellAt(_a); p.y -= D.bell.h * 0.9;
    for (let i = 0; i < 12; i++) fx?.add?.emit({ pos: p.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 2, (Math.random() - 0.5) * 5), life: 0.4, size: 0.18, sizeEnd: 0.03, color: 0xffe2a0, alpha: 1, drag: 2, gravity: 1, floor: -1e9 });
  }
  /** The gulp: the lid thrown up and the sea off the bow drawn in (a spit drunk, a fat blob with it). */
  gulp(e) { this.gulpT = 0; this.pending = e.drunk || 0; this.spawnA = 0; }

  update(dt) {
    const M = this.M, B = D.bell, C = D.coffin; this.seat();
    // the bell's swing: a damped spring
    this.swingV += (-B.hz * B.hz * this.swing - 2 * B.decay * this.swingV) * dt; this.swing += this.swingV * dt;
    this.bellSwing.rotation.x = this.swing;
    // the lid: thrown up by a gulp, else a crack open while a drink is held
    const held = M.live ? M.fight?.mounts?.gulped || 0 : 0;
    let want = held > 0 ? 0.12 : 0;
    if (this.gulpT >= 0) { this.gulpT += dt; want = this.gulpT < C.open + C.hold ? 1 : want; if (this.gulpT > C.open + C.hold + C.close) this.gulpT = -1; }
    this.lid += (want - this.lid) * Math.min(1, dt / (want > this.lid ? C.open : C.close) * 2.5);
    this.lidPivot.rotation.x = this.lid * 1.7;
    this.glowMat.opacity = Math.min(1, held > 0 ? 0.55 + 0.25 * Math.sin(M.t * 5) : 0) + this.lid * 0.6 * (this.gulpT >= 0 ? 1 : 0);
    this.vortex(dt);
    this.carried(dt);
  }

  /** The whirl: blobs spawned in the bow's cone, drawn round and in to the coffin's mouth, quickening and shrinking as they near it. */
  vortex(dt) {
    const M = this.M, V = D.vortex, H = M.helm, fx = M.fx;
    if (this.gulpT >= 0 && this.gulpT < V.for && H && M.live) {
      const spawn = (big) => {
        const rel = (Math.random() - 0.5) * 0.85, d = M.L * 0.5 + 4 + Math.random() * V.reach, a = H.yaw + rel;
        const p = new THREE.Vector3(H.pos.x + Math.sin(a) * d, 0, H.pos.z + Math.cos(a) * d); p.y = M.surf(p.x, p.z) + 0.2;
        if (this.blobs.length < V.cap) this.blobs.push({ p, s: big ? 1.6 : 0.5 + Math.random() * 0.8, spin: Math.random() < 0.5 ? 1 : -1, age: 0 });
      };
      for (; this.pending > 0; this.pending--) spawn(true);
      for (this.spawnA += dt * V.rate; this.spawnA >= 1; this.spawnA--) spawn(false);
      if (Math.random() < 0.5) { const p = M.shipPoint(0, 0, M.L * 0.5 + 6); M.game.water?.disturb?.(p.x, p.z, 0.4, 'stroke', M.surf(p.x, p.z)); }
    }
    const mouth = this.coffinAt(_b); let n = 0;
    for (const o of this.blobs) {
      o.age += dt; _a.subVectors(mouth, o.p); const d = _a.length();
      if (d < 0.7 || o.age > 2.5 || !M.live) { o.dead = true; if (M.live && Math.random() < 0.35) fx?.add?.emit({ pos: mouth.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2), life: 0.35, size: 0.25, sizeEnd: 0.03, color: D.glow, alpha: 1, drag: 2, gravity: 0, floor: -1e9 }); continue; }
      _a.multiplyScalar(1 / d); _s.crossVectors(UP, _a).multiplyScalar(o.spin * Math.min(10, d * 0.6));
      const sp = 10 + o.age * 34; o.p.addScaledVector(_a, sp * dt).addScaledVector(_s, dt);
      const sc = o.s * Math.min(1, d / 6 + 0.25);
      _q.setFromAxisAngle(UP, o.age * 9); _m.compose(o.p, _q, _s.set(sc, sc * 0.8, sc)); this.whirl.setMatrixAt(n++, _m);
    }
    this.blobs = this.blobs.filter((o) => !o.dead);
    this.whirl.count = n; if (!n) this.whirl.setMatrixAt(0, _hide); this.whirl.instanceMatrix.needsUpdate = true;
  }

  /** The bow shot that carries a drink back (the gun's shot past its plain power: seafight.js `takeGulp`): a burst at the coffin as it
   *  leaves, and a violet wake behind it with a dark core. */
  carried(dt) {
    const M = this.M, fx = M.fx; if (!fx || !M.live) return;
    for (const s of M.fight?.shots || []) {
      if (s.heavy || !(s.power > 1)) continue;
      if (!this.seen.has(s)) {
        this.seen.add(s); this.gulpT = this.gulpT < 0 ? 0.9 : this.gulpT; // (the lid kicks)
        const p = this.coffinAt(_a);
        for (let i = 0; i < 16; i++) fx.add?.emit({ pos: p.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6), life: 0.45, size: 0.3, sizeEnd: 0.04, color: D.glow, colorEnd: 0x40104a, alpha: 1, drag: 2, gravity: 2, floor: -1e9 });
      }
      fx.add?.emit({ pos: s.pos.clone(), vel: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)), life: 0.4, size: 0.55, sizeEnd: 0.08, color: D.glow, colorEnd: 0x3a1040, alpha: 0.95, drag: 1, gravity: 0, floor: -1e9 });
      fx.alpha?.emit({ pos: s.pos.clone(), vel: new THREE.Vector3(0, 0.3, 0), life: 0.3, size: 0.35, sizeEnd: 0.1, color: 0x120c10, alpha: 0.8, drag: 1, gravity: 0, floor: -1e9 });
    }
  }
}
