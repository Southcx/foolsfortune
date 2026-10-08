// ---------------------------------------------------------------------------------------
// THE HOKORA (docs/plans/SOUL-ALCHEMY.md 4.2; the glossary: the plate shrine's own small shrine on the Athanor's east shoulder, its own
// F): a roadside hokora, kiln-sized, in the Spirit Garden's palette. A miniature Shinto shrine on a two-step stone plinth: a little
// hall of plum-dark wood with lattice doors and a narrow veranda, under a gabled roof with deep eaves (the front eave longer, in the
// nagare style) gone green with moss, a ridge beam with crossed finials (chigi) and two short logs across it (katsuogi); a straw rope
// (shimenawa) slung between the front posts with two zigzag paper streamers (shide) hanging from it; a cup of offering on the step;
// and, leant against the doors, a photograph plate glowing faintly: what the plate shrine wakes a spirit from.
// One merged mesh in vertex colours on the planetoids' own material (no new program), an outline, and the plate's small glow.
//
// Prior art: the roadside hokora of Japan (the miniature shrine on a stone plinth by a path or a field, a hall of the gods in small),
// the nagare-zukuri roof (its long front eave), the shimenawa and its shide, the garden's own palette (vfx/garden/planetoid.js, the
// spirit press), and Okami's shrines (the same shape at the size of a person's knee to their chest).
//
//   const H = new Hokora()   group.add(H.group)   (about 1.7 m tall, its front +Z; world/garden/place.js stands it in the 'hokora' group)
//   H.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../../render/outline.js';

const C = { stone: 0x6d686e, stoneDk: 0x4e4a52, wood: 0x4a3436, woodDk: 0x2c2023, lattice: 0x1d1517, moss: 0x2f4a40, mossHi: 0x5f7e64, ridge: 0x3a2a2c, rope: 0xc4b07c, paper: 0xe6e2d6, cup: 0xd8d2c4 };

/** A primitive coloured and placed (for the merge). */
function piece(geo, hex, { at = [0, 0, 0], rot = [0, 0, 0], top = null } = {}) {
  geo.rotateX(rot[0]); geo.rotateY(rot[1]); geo.rotateZ(rot[2]); geo.translate(...at);
  const n = geo.attributes.position.count, col = new Float32Array(n * 3), a = new THREE.Color(hex), b = new THREE.Color(top ?? hex);
  let y0 = Infinity, y1 = -Infinity; for (let i = 0; i < n; i++) { const y = geo.attributes.position.getY(i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) { c.copy(a).lerp(b, top == null ? 0 : (geo.attributes.position.getY(i) - y0) / Math.max(1e-4, y1 - y0)); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** A gable's infill: a triangular prism along x (width w), its base `d` deep and its apex `h` up (indexed, as the primitives are). */
function gable(w, h, d) {
  const x = w / 2, z = d / 2, V = [[-x, 0, z], [-x, 0, -z], [-x, h, 0], [x, 0, z], [x, 0, -z], [x, h, 0]];
  const F = [0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3], pos = F.flatMap((k) => V[k]); // (a vertex a corner of a face: flat shading)
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(F.length * 2).fill(0), 2));
  g.setIndex(F.map((_, i) => i)); g.computeVertexNormals(); return g;
}

export class Hokora {
  constructor() {
    const g = (this.group = new THREE.Group()); g.name = 'hokora-model';
    const P = [], box = (w, h, d, hex, o) => P.push(piece(new THREE.BoxGeometry(w, h, d), hex, o)), cyl = (r0, r1, h, hex, o, seg = 8) => P.push(piece(new THREE.CylinderGeometry(r0, r1, h, seg), hex, o));
    // the plinth: two steps of grey stone
    box(1.0, 0.2, 0.92, C.stoneDk, { at: [0, 0.1, 0], top: C.stone });
    box(0.78, 0.34, 0.7, C.stoneDk, { at: [0, 0.37, -0.02], top: C.stone });
    // the hall: a floor and its veranda, four posts, walls, lattice doors at the front
    box(0.7, 0.035, 0.62, C.wood, { at: [0, 0.557, 0.02] });
    for (const [x, z] of [[-0.27, 0.2], [0.27, 0.2], [-0.27, -0.2], [0.27, -0.2]]) box(0.05, 0.56, 0.05, C.woodDk, { at: [x, 0.85, z] });
    box(0.5, 0.5, 0.36, C.wood, { at: [0, 0.82, -0.02] });
    box(0.44, 0.44, 0.012, C.woodDk, { at: [0, 0.82, 0.165] }); // (the doors' recess)
    for (let i = -2; i <= 2; i++) box(0.012, 0.42, 0.012, C.lattice, { at: [i * 0.085, 0.82, 0.175] }); // (the lattice: uprights)
    for (let j = -2; j <= 2; j++) box(0.43, 0.012, 0.012, C.lattice, { at: [0, 0.82 + j * 0.085, 0.177] }); // (and rails)
    box(0.012, 0.44, 0.02, C.woodDk, { at: [0, 0.82, 0.18] }); // (where the two doors meet)
    // the roof: two slabs meeting at a ridge along x, the front eave longer (nagare), moss on top; the ridge beam, chigi, katsuogi
    const slope = 0.52, ridgeY = 1.36;
    P.push(piece(gable(0.5, ridgeY - 1.07, 0.36), C.wood, { at: [0, 1.07, -0.02] })); // (the gable over the walls, to the ridge)
    box(0.88, 0.085, 0.64, C.moss, { at: [0, ridgeY - Math.sin(slope) * 0.32, 0.28 * Math.cos(slope) + 0.03], rot: [slope, 0, 0], top: C.mossHi });
    box(0.88, 0.085, 0.48, C.moss, { at: [0, ridgeY - Math.sin(slope) * 0.24, -0.21 * Math.cos(slope) - 0.02], rot: [-slope, 0, 0], top: C.mossHi });
    box(0.9, 0.03, 0.68, C.woodDk, { at: [0, ridgeY - Math.sin(slope) * 0.34 - 0.06, 0.3 * Math.cos(slope) + 0.03], rot: [slope, 0, 0] }); // (the eaves' boards under the moss)
    box(0.9, 0.03, 0.52, C.woodDk, { at: [0, ridgeY - Math.sin(slope) * 0.26 - 0.06, -0.23 * Math.cos(slope) - 0.02], rot: [-slope, 0, 0] });
    cyl(0.035, 0.035, 0.96, C.ridge, { at: [0, ridgeY + 0.02, 0], rot: [0, 0, Math.PI / 2] });
    for (const sx of [-1, 1]) for (const lean of [-0.5, 0.5]) box(0.03, 0.26, 0.02, C.ridge, { at: [sx * 0.46, ridgeY + 0.11, lean * 0.12], rot: [lean, 0, 0] }); // (the chigi, crossed at each end)
    for (const x of [-0.18, 0.18]) cyl(0.03, 0.03, 0.16, C.ridge, { at: [x, ridgeY + 0.07, 0], rot: [Math.PI / 2, 0, 0] }); // (the katsuogi)
    // the shimenawa: a straw rope slung between the front posts, and two shide hanging from it in zigzags
    const rope = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.29, 1.07, 0.24), new THREE.Vector3(0, 1.02, 0.25), new THREE.Vector3(0.29, 1.07, 0.24)]);
    P.push(piece(new THREE.TubeGeometry(rope, 12, 0.018, 6), C.rope));
    for (const x of [-0.12, 0.12]) for (let k = 0; k < 3; k++) box(0.05, 0.05, 0.004, C.paper, { at: [x + (k % 2 ? 0.02 : 0), 0.99 - k * 0.05, 0.255] });
    // the offering: a little cup on the upper step
    cyl(0.035, 0.025, 0.04, C.cup, { at: [0.24, 0.56, 0.3] }, 10);
    const geo = mergeGeometries(P, false); P.forEach((x) => x.dispose());
    this.mat = new THREE.MeshStandardMaterial({ name: 'hokora', vertexColors: true, roughness: 0.85 }); // (the planetoids' own: the same program)
    const m = (this.mesh = new THREE.Mesh(geo, this.mat)); m.castShadow = true; m.receiveShadow = true; g.add(m); addOutline(m);
    // the plate leant against the doors: glass with a faint pale light in it (the plate shrine wakes a spirit from a plate)
    this.plateMat = new THREE.MeshStandardMaterial({ name: 'hokora-plate', color: 0x15171c, emissive: new THREE.Color(0.45, 0.52, 0.62), emissiveIntensity: 0.22, roughness: 0.15, metalness: 0.1 });
    const pl = (this.plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.01), this.plateMat)); pl.position.set(-0.1, 0.655, 0.235); pl.rotation.x = -0.25; g.add(pl); // (dark glass, a faint image in it)
  }
  dispose() { this.group.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); this.plate.geometry.dispose(); this.plateMat.dispose(); }
}
