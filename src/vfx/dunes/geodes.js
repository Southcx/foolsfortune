// ---------------------------------------------------------------------------------------
// THE DUNES' GEODES (plain name): Lachrymite geodes half buried in the sand round each crystal formation (world/dunes/crystals.js), cracked
// open into two halves lying apart, a rind of dark sandstone and a lining of little Lachrymite points inside, glowing in the colour of
// the feeling in the air (the weather's here: an Ego's mood sets hard in its Lachryma), Lachrymite's own violet when the weather is fair.
// By day the lining is only glass catching the sun; from dusk it glows, brightest at night, easing in over a real second or two as the
// light goes, never a flash. A look: no collider, no harvest (a formation is struck; a geode is only seen).
// TWO DRAWS for every geode in the sea: the rinds (one InstancedMesh, a half an instance, a plain flat standard: the clay chips' program,
// vfx/particles.js) and the linings (one InstancedMesh in the Dunes' crystal program, vfx/crystalfrets.js, its frets left undrawn, the
// instance colours the feeling's): no program added.
//
// Prior art: real geodes (a hollow nodule lined with quartz or amethyst points, found split on desert ground: the Dugway beds of Utah),
// Minecraft's amethyst geodes (a rind, a lining, crystals that glow), and the house's own crystals (their spires, program and frets).
//
//   const G = new Geodes(game, parent)   G.build()   (once the crystals are laid)   G.update(dt, { night, colour })   G.prewarm() -> undo
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crystalFretMaterial, CrystalFrets } from '../crystalfrets.js';

/** The numbers: geodes round each formation, how far out from its edge (m), their size (m), how far a half's lip stands over the sand (of its
 *  size; the bowl under it buried), the rind's colours; the lining's glow by day and by night. */
export const GEODE = { per: 2, out: [1.6, 4.5], size: [0.45, 0.9], sink: -0.12, rind: 0xa06a4c, inner: 0x6a3f36, glow: [0.08, 1.6] };

const bare = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); return n; };
/** A half geode: a bowl (the outside), its inner face turned in, and its lip, opening along +y. */
function rindGeometry() {
  const out = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); // (the lower half: a bowl)
  const inn = new THREE.SphereGeometry(0.82, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); inn.scale(-1, 1, 1); // (turned in: its faces seen from inside)
  const lip = new THREE.RingGeometry(0.82, 1, 10, 1).rotateX(-Math.PI / 2);
  const g = mergeGeometries([bare(out), bare(inn), bare(lip)]);
  // a broken edge: the lip's vertices pushed up and down a little, so the halves read as cracked, never cut
  const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > -0.05) P.setY(i, y + 0.12 * Math.sin(Math.atan2(P.getZ(i), P.getX(i)) * 5 + 1)); }
  g.computeVertexNormals(); return g;
}
/** The lining: little six-sided points standing in from the bowl's inside, toward its open mouth. */
function liningGeometry() {
  const parts = [], q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  for (let k = 0; k < 13; k++) {
    const a = (k / 13) * Math.PI * 2 + (k % 3) * 0.4, el = 0.2 + 0.55 * ((k * 0.618) % 1), r = 0.8;
    d.set(Math.cos(a) * Math.cos(el), -Math.sin(el), Math.sin(a) * Math.cos(el)); // (a point on the inside of the bowl)
    const h = 0.28 + 0.22 * ((k * 0.37) % 1), w = 0.07 + 0.04 * ((k * 0.71) % 1);
    const s = mergeGeometries([bare(new THREE.CylinderGeometry(w, w, h * 0.7, 6).translate(0, h * 0.35, 0)), bare(new THREE.ConeGeometry(w, h * 0.3, 6).translate(0, h * 0.85, 0))]);
    q.setFromUnitVectors(up, d.clone().negate().add(new THREE.Vector3(0, 0.35, 0)).normalize()); // (pointing in and up, to the mouth)
    s.applyQuaternion(q).translate(d.x * r, d.y * r, d.z * r); parts.push(s);
  }
  return mergeGeometries(parts);
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();

export class Geodes {
  constructor(game, parent) {
    this.game = game; this.parent = parent; this.built = false; this.k = -1;
    this.rindMat = new THREE.MeshStandardMaterial({ name: 'dunes-geode-rind', color: GEODE.rind, roughness: 0.92, metalness: 0, flatShading: true });
    this.liningMat = crystalFretMaterial({ color: 0xffffff, emissive: 0x7a52d8, emissiveIntensity: GEODE.glow[0], roughness: 0.2, metalness: 0.15, flatShading: true });
    this.liningMat.name = 'dunes-geode-lining';
  }

  /** Two halves a geode, laid round each formation (a fixed draw: the same sea every time). */
  build() {
    const C = this.game.crystals?.list, D = this.game.dunes; if (this.built || !C?.length || !D) return;
    this.built = true;
    let s = 99173; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const halves = [];
    for (const e of C) for (let j = 0; j < GEODE.per; j++) {
      const a = rnd() * Math.PI * 2, d = e.r + GEODE.out[0] + rnd() * (GEODE.out[1] - GEODE.out[0]), size = GEODE.size[0] + rnd() * (GEODE.size[1] - GEODE.size[0]);
      const x = e.ground.x + Math.cos(a) * d, z = e.ground.z + Math.sin(a) * d, y = D.heightAt(x, z), yaw = rnd() * Math.PI * 2, gap = size * (0.5 + rnd() * 0.5);
      for (const side of [-1, 1]) { // (the two halves fallen apart, each tipped out on its back, its mouth to the sky and a little away)
        const hx = x + Math.cos(yaw) * gap * side * 0.6, hz = z + Math.sin(yaw) * gap * side * 0.6;
        halves.push({ x: hx, y: D.heightAt(hx, hz) - size * GEODE.sink, z: hz, size, yaw, tip: side * (0.35 + rnd() * 0.3) });
      }
    }
    const n = halves.length;
    this.rinds = new THREE.InstancedMesh(rindGeometry(), this.rindMat, n); this.rinds.name = 'dunes-geode-rinds';
    this.linings = new THREE.InstancedMesh(liningGeometry(), this.liningMat, n); this.linings.name = 'dunes-geode-linings';
    this.linings.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.frets = new CrystalFrets(this.linings); // (the crystal program's own attributes: its frets undrawn)
    halves.forEach((h, i) => {
      _e.set(h.tip * Math.cos(h.yaw), h.yaw, h.tip * Math.sin(h.yaw)); _q.setFromEuler(_e);
      _m.compose(_p.set(h.x, h.y, h.z), _q, _s.setScalar(h.size)); this.rinds.setMatrixAt(i, _m); this.linings.setMatrixAt(i, _m);
      this.linings.setColorAt(i, _c.set(0xffffff));
    });
    for (const m of [this.rinds, this.linings]) { m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; this.parent.add(m); }
  }

  /** Built now, so the boot's compile sees both draws (they stand in the sea from then on). */
  prewarm() { this.build(); return () => {}; }

  /** `night` 0..1 (the hour's dark), `colour` the feeling's (a THREE.Color). */
  update(dt, { night = 0, colour }) {
    if (!this.built) this.build(); if (!this.built) return;
    const want = GEODE.glow[0] + (GEODE.glow[1] - GEODE.glow[0]) * night;
    this.k = this.k < 0 ? want : this.k + (want - this.k) * Math.min(1, dt * 0.7);
    const M = this.liningMat; M.emissiveIntensity = this.k;
    const E = M.emissive;
    if (colour && Math.abs(E.r - colour.r) + Math.abs(E.g - colour.g) + Math.abs(E.b - colour.b) > 1e-3) {
      E.lerp(colour, Math.min(1, dt * 0.8)); // (a change of weather eased in)
      if (Math.abs(E.r - colour.r) + Math.abs(E.g - colour.g) + Math.abs(E.b - colour.b) < 2e-3) E.copy(colour);
      _c.copy(M.emissive).lerp(_c.set(0xffffff), 0.55);
      for (let i = 0; i < this.linings.count; i++) this.linings.setColorAt(i, _c);
      this.linings.instanceColor.needsUpdate = true;
    }
  }
}
