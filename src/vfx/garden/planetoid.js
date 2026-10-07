// ---------------------------------------------------------------------------------------
// A PLANETOID: one small world of the Spirit Garden (the owner, 2026-10-07: "SMG from the get-go"; docs/plans/SPIRIT-GARDEN.md section
// 3). Small enough to hop round in seconds, so the garden feels like a toy in your hand; soft and floating, as Dual Hearts' islands are.
// Petra's Jar walks on it with gravity toward its heart and asks it where its surface is; Round 3's sculpting moves that surface.
//
//   THE SURFACE  an icosphere whose every point has its own height (the field the hand will sculpt): `surface(dir)` is its radius that
//                way, `sculpt(dir, amount, size)` pushes or pulls it (kept within a band of the radius, never through its heart)
//   THE SKIN     coloured by height and by kind: soft grass over the top, a rocky underside with a few roots of stone hanging from it
//                (it floats over the cloud sea), the colours lifted toward pastel, as Dual Hearts paints
//   THE KINDS    dantian   the heart, 20 m: a lake of your own Lachryma at its crown in a ring of stones, the Pneuka Box's shed
//                terraces  12 m: the herb terraces stepped round its crown, rows of spirit herbs on them
//                furnace   10 m: basalt in columns, a vent at its crown glowing with the pill furnace's fire
//                pavilions 14 m: pale paving over its crown, where the pavilions of echoes will stand
//                grove     16 m: moss and round-crowned spirit trees (the cocoon tree is Round 4's)
//                peak       8 m and tall: a needle of rock drawn up to a little platform, the meditation peak
//
// Prior art: Super Mario Galaxy's planetoids (a world you run round in seconds, a single readable shape each), Dual Hearts' floating
// isles, the xianxia cave abode and its spirit fields (terraces, the pill furnace, the needle peak of a sect's mountain), and Animal
// Crossing's soft, rounded toy-like ground.
//
//   const P = new Planetoid({ kind, radius, seed, surface })   P.group (its heart at its origin)   P.surface(dir) -> m   P.up(pos, out)
//   P.place(obj, dir, lift)   P.sculpt(dir, amount, size)   P.tint(lakeHex)   P.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from '../../render/merge.js';

export const PLANETOIDS = {
  dantian: { radius: 20, top: 0x9fd88a, low: 0x7fb08a, rock: 0x8a7f94 },
  terraces: { radius: 12, top: 0xb4dc7e, low: 0x8cb878, rock: 0x947e78 },
  furnace: { radius: 10, top: 0x6a5a6a, low: 0x564a5a, rock: 0x3a3440 },
  pavilions: { radius: 14, top: 0xe8dcc8, low: 0xb8d494, rock: 0x9a8c98 },
  grove: { radius: 16, top: 0x7cc48a, low: 0x5fa47a, rock: 0x7a6f86 },
  peak: { radius: 8, top: 0xd8d2dc, low: 0xa89cb4, rock: 0x7a7088 },
};

const BAND = 0.18; // (sculpting keeps the surface within this share of the radius, in or out)

export class Planetoid {
  constructor({ kind = 'grove', radius = null, seed = 1, surface = null } = {}) {
    if (surface) this.surface = surface; // (a reader of the ground the game keeps, O(1): the search below is the fallback)
    const K = PLANETOIDS[kind] ?? PLANETOIDS.grove; this.kind = kind; this.R = radius ?? K.radius; this.K = K;
    this.group = new THREE.Group(); this.group.name = `planetoid-${kind}`;
    this.rnd = lcg(seed * 977 + this.R);
    let g = new THREE.IcosahedronGeometry(1, Math.min(6, Math.round(3 + this.R / 6))); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
    this.geo = g; const P = g.attributes.position, n = P.count;
    this.dir = new Float32Array(n * 3); this.h = new Float32Array(n); this.base = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); this.dir.set([x, y, z], i * 3); this.base[i] = this.shape(x, y, z); }
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.mat = new THREE.MeshStandardMaterial({ name: `planetoid-${kind}`, vertexColors: true, roughness: 0.85, flatShading: false });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.name = 'planetoid-ground'; this.mesh.receiveShadow = true; this.mesh.castShadow = true;
    this.group.add(this.mesh);
    this.rebuild();
    this.props = new THREE.Group(); this.props.name = 'planetoid-props'; this.group.add(this.props);
    this.dress(); mergeStatic(this.props);
    this.t = 0;
  }

  /** Its unsculpted shape: a radius (in units of R) for a direction. */
  shape(x, y, z) {
    const n3 = (a, b, c) => Math.sin(a * 2.3 + b * 1.7) * Math.sin(b * 2.9 - c * 1.3) * Math.sin(c * 2.1 + a * 2.7); // (soft rolling hills)
    let r = 1 + 0.035 * n3(x * 2, y * 2, z * 2) + 0.015 * n3(x * 5 + 1, y * 5, z * 5 - 2);
    if (this.kind === 'terraces' && y > 0.15) r += Math.floor(y * 6) / 6 * 0.06 - y * 0.06; // (stepped terraces round its crown)
    if (this.kind === 'furnace') { const c = Math.floor(Math.atan2(z, x) * 4) + Math.floor(y * 6) * 7; r += (((c * 37) % 11) / 11 - 0.5) * 0.04; } // (basalt columns)
    if (this.kind === 'pavilions' && y > 0.6) r = Math.min(r, 1.005); // (its crown paved smooth)
    if (this.kind === 'peak' && y > 0) r *= 1 + 2.6 * y ** 12; // (drawn up into a needle: only the very crown is pulled)
    if (y < -0.35) r *= 1 + 0.08 * (-y - 0.35); // (its underside a touch deeper: the island's keel)
    return r;
  }

  /** Recompute the mesh from the heights (after a sculpt). */
  rebuild() {
    const P = this.geo.attributes.position, C = this.geo.attributes.color, K = this.K, R = this.R;
    const top = _c1.setHex(K.top), low = _c2.setHex(K.low), rock = _c3.setHex(K.rock);
    for (let i = 0; i < P.count; i++) {
      const x = this.dir[i * 3], y = this.dir[i * 3 + 1], z = this.dir[i * 3 + 2], r = R * (this.base[i] + this.h[i]);
      P.setXYZ(i, x * r, y * r, z * r);
      const grass = THREE.MathUtils.smoothstep(y, -0.45, -0.1), up = THREE.MathUtils.smoothstep(y, 0.1, 0.8), dug = THREE.MathUtils.clamp(-this.h[i] / BAND * 2, 0, 1);
      _c4.copy(low).lerp(top, up).lerp(rock, 1 - grass).lerp(rock, dug * 0.6); // (green over the top, rock under it, and where it is dug)
      const v = 0.94 + 0.06 * Math.sin(x * 31 + z * 17 + y * 23); C.setXYZ(i, _c4.r * v, _c4.g * v, _c4.b * v);
    }
    P.needsUpdate = true; C.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }

  /** Its surface's radius in a direction (local; normalised here). */
  surface(dir) {
    _d.copy(dir).normalize(); let best = -1, bi = 0; const D = this.dir;
    for (let i = 0; i < this.h.length; i++) { const d = D[i * 3] * _d.x + D[i * 3 + 1] * _d.y + D[i * 3 + 2] * _d.z; if (d > best) { best = d; bi = i; } }
    return this.R * (this.base[bi] + this.h[bi]);
  }
  /** Up at a world position: away from its heart. */
  up(pos, out = new THREE.Vector3()) { return out.copy(pos).sub(this.group.getWorldPosition(_e)).normalize(); }
  /** Stand `obj` on its surface in direction `dir` (local), its +Y along the surface's up, `lift` metres above it. */
  place(obj, dir, lift = 0) { _d.copy(dir).normalize(); obj.position.copy(_d).multiplyScalar(this.surface(_d) + lift); obj.quaternion.setFromUnitVectors(_y, _d); return obj; }
  /** The hand's clay (Round 3): push (+) or pull (-) the surface round `dir` by `amount` metres over a brush `size` metres across. */
  sculpt(dir, amount, size = 3) {
    _d.copy(dir).normalize(); const D = this.dir, a = amount / this.R, cosR = Math.cos(size / this.R);
    for (let i = 0; i < this.h.length; i++) { const d = D[i * 3] * _d.x + D[i * 3 + 1] * _d.y + D[i * 3 + 2] * _d.z; if (d < cosR) continue; const f = (d - cosR) / (1 - cosR), w = f * f * (3 - 2 * f); this.h[i] = THREE.MathUtils.clamp(this.h[i] + a * w, -BAND, BAND); }
    this.rebuild();
  }
  /** The Dantian's lake: your Lachryma's colour (your draught). */
  tint(hex) { if (this.lakeMat) { this.lakeMat.color.setHex(hex); this.lakeMat.emissive.setHex(hex).multiplyScalar(0.35); } }

  dress() {
    const R = this.R, rnd = this.rnd, std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
    const at = (obj, x, y, z, lift = 0) => { this.place(obj, _v.set(x, y, z), lift); this.props.add(obj); return obj; };
    // the roots of stone under every island (Dual Hearts: they float)
    const rock = std(this.K.rock, { flatShading: true });
    for (let i = 0; i < 5; i++) { const a = rnd() * 6.28, d = _v.set(Math.cos(a) * 0.35, -1, Math.sin(a) * 0.35).normalize(); const h = R * (0.15 + 0.2 * rnd()); const m = new THREE.Mesh(new THREE.ConeGeometry(R * 0.08, h, 6).translate(0, h / 2, 0), rock); this.place(m, d, -R * 0.03); this.props.add(m); } // (base on the surface, tip hanging away)
    const stone = std(0xd8d0c8, { flatShading: true });
    if (this.kind === 'dantian') {
      this.lakeMat = std(0xf2c84a, { roughness: 0.1, metalness: 0.2, emissive: 0x553f10 }); this.lakeMat.userData.noMerge = true;
      const lake = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 32, 8, 0, Math.PI * 2, 0, 0.32), this.lakeMat); lake.name = 'dantian-lake'; this.props.add(lake);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.28; at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + rnd() * 0.3, 0), stone), Math.cos(a) * 0.33, 0.94, Math.sin(a) * 0.33, 0.1); }
      const shed = new THREE.Group(); shed.add(new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 2.4).translate(0, 1.2, 0), std(0xc98a5a)));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4).translate(0, 3.1, 0), std(0x7a4a6a)); roof.rotation.y = Math.PI / 4; shed.add(roof);
      shed.name = 'dantian-shed'; at(shed, 0.5, 0.75, 0.42);
    } else if (this.kind === 'terraces') {
      const herb = std(0x5fae5a), bloom = std(0xf2a8c8);
      for (let i = 0; i < 60; i++) { const a = rnd() * 6.28, y = 0.25 + rnd() * 0.65, s = Math.sqrt(1 - y * y); at(new THREE.Mesh(new THREE.SphereGeometry(0.28 + rnd() * 0.1, 6, 4), i % 6 ? herb : bloom), Math.cos(a) * s, y, Math.sin(a) * s, 0.1); }
    } else if (this.kind === 'furnace') {
      this.vent = new THREE.Mesh(new THREE.CircleGeometry(R * 0.26, 16), new THREE.MeshBasicMaterial({ color: 0xff7a3a })); this.vent.name = 'furnace-vent';
      this.place(this.vent, _v.set(0, 1, 0), 0.06); this.vent.rotateX(-Math.PI / 2); this.props.add(this.vent);
    } else if (this.kind === 'pavilions') {
      const pave = new THREE.Mesh(new THREE.SphereGeometry(R * 1.006, 32, 6, 0, Math.PI * 2, 0, 0.6), std(0xeee4d4, { roughness: 0.6 })); pave.name = 'pavilions-paving'; pave.material.userData.noMerge = true; this.props.add(pave);
    } else if (this.kind === 'grove') {
      const trunk = std(0x8a6a5a), leaf = [std(0x8fd4a0), std(0xa8e0b4), std(0xc8e8a0), std(0xf2c8d8)];
      for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, y = -0.1 + rnd() * 1.0, s = Math.sqrt(Math.max(0, 1 - y * y)), h = 2 + rnd() * 2.5, tree = new THREE.Group();
        tree.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, h, 5).translate(0, h / 2, 0), trunk)); tree.add(new THREE.Mesh(new THREE.SphereGeometry(1 + rnd() * 0.8, 8, 6).translate(0, h + 0.6, 0), leaf[i % 4]));
        this.place(tree, _v.set(Math.cos(a) * s, y, Math.sin(a) * s), -0.1); tree.updateMatrix(); for (const c of [...tree.children]) { c.applyMatrix4(tree.matrix); this.props.add(c); } }
    } else if (this.kind === 'peak') {
      const top = this.surface(_v.set(0, 1, 0));
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 0.4, 8).translate(0, top + 0.1, 0), stone); this.props.add(plat);
    }
  }

  update(raw = 1 / 60) {
    this.t += raw;
    if (this.vent) this.vent.material.color.setRGB(1, 0.42 + 0.1 * Math.sin(this.t * 3.1), 0.2).multiplyScalar(0.85 + 0.15 * Math.sin(this.t * 7.3));
  }

  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
}

function lcg(seed) { let a = Math.floor(Math.abs(seed) * 1000) % 2147483647 || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color(), _c4 = new THREE.Color();
