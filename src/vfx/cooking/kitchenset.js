// ---------------------------------------------------------------------------------------
// THE COOKING STAGE'S SET (plain name; Spirit Cooking, South 2026-11-02: "Pasta themed! Italian-Japanese cooking ... fields of wheat and
// grain ... how east and west are connected through grains"): the room the god hand cooks in, one kitchen of two traditions meeting over
// grain. A hinoki worktop dusted with flour under a shoji window full of wheat-gold light; behind it, the hearth's kamado and its
// brick oven mouth (where a loaf bakes); a celadon proofing bowl and its linen; a copper pot on a donabe's flame for the noodles; a bronze
// pasta die (a trafila) and a soba knife (soba-kiri bocho) on the board's edge; a rolling pin; ribbons of pasta and udon drying on a
// bamboo rack; a sheaf of wheat and a sheaf of rice in one vase; a Lachryma tank where the Weir's catch waits for its course.
// Built in the decor kit's soft primitives (two merged meshes: matte and glossy) and a few lamps' glows; its own scene, lit warm.
// Units: the god hand's (the hand about 0.9 tall), the board's top at y 0, the cook facing -Z.
//
// Prior art: a Japanese kitchen (the kamado, hinoki, the donabe), an Italian one (copper, the bronze die's rough pasta, the drying rack
// of the pastificio), Ghibli's kitchens (warm light, steam, things used), the Silk Road's noodle (lamian west to pasta, east to ramen
// and udon), and the decor kit's toy forms (vfx/garden/decorpieces/kit.js).
//
//   const set = buildKitchenSet()   set.group   set.spots { board, bowl, oven, pot, rack, tank } (Vector3s)   set.fire (Mesh: its glow)
//   set.update(t)   KITCHEN_SET (the colours)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../garden/decorpieces/kit.js';

export const KITCHEN_SET = {
  hinoki: 0xe2c08c, hinokiD: 0xb8925c, flour: 0xf6f1e6, plaster: 0xeee2c8, beam: 0x5a3a28, shoji: 0xfff3d6, brick: 0x9a4a2c, brickD: 0x6a2e1a,
  clay: 0xb8673f, celadon: 0x9cc8b4, linen: 0xeae2cc, copper: 0xc8743a, bronze: 0xa07838, steel: 0xb8bcc4, bamboo: 0xc8b46a, wheat: 0xe0b45a,
  rice: 0xd8c890, pasta: 0xf0d48a, udon: 0xf4ecd6, tank: 0x8fc8d8, lachryma: 0xd8ccff, ember: 0xff8a3a, ink: 0x241c1f,
};
const K = KITCHEN_SET, PI = Math.PI;

export function buildKitchenSet() {
  const m = new Piece(), g = new Piece(), glow = new Piece(); // (matte, glossy, and the lit: the fire, the window, the tank's Lachryma)
  // the room: a floor, the back wall's plaster and beams, the shoji window on the left wall's light
  m.slab(14, 0.1, 10, { at: [0, -1.05, -2], c: K.hinokiD });
  m.slab(14, 6, 0.2, { at: [0, 1.9, -4.2], c: K.plaster });
  for (const x of [-5, -1.6, 1.8, 5.2]) m.slab(0.28, 6, 0.3, { at: [x, 1.9, -4.05], c: K.beam });
  m.slab(14, 0.3, 0.32, { at: [0, 3.2, -4.0], c: K.beam });
  glow.slab(3.0, 2.0, 0.05, { at: [-3.4, 2.05, -4.06], c: K.shoji, g: 1 });
  for (let i = 0; i <= 4; i++) m.slab(0.05, 2.04, 0.08, { at: [-4.9 + i * 0.75, 2.05, -4.0], c: K.beam });
  for (let j = 0; j <= 3; j++) m.slab(3.04, 0.05, 0.08, { at: [-3.4, 1.05 + j * 0.667, -4.0], c: K.beam });
  // the worktop: hinoki on two trestles, flour dusted over its middle
  m.box(5.2, 0.16, 2.4, { at: [0, -0.08, -0.2], c: K.hinoki }, 0.04);
  for (const x of [-2.2, 2.2]) m.slab(0.2, 0.9, 2.0, { at: [x, -0.6, -0.2], c: K.hinokiD });
  for (let i = 0; i < 120; i++) { const a = i * 2.39996, r = Math.sqrt(i / 120) * 0.9; m.slab(0.06 + (i % 3) * 0.02, 0.004, 0.05, { at: [Math.cos(a) * r * 1.4, 0.003, -0.1 + Math.sin(a) * r * 0.8], rot: [0, a, 0], c: K.flour }); }
  // the proofing bowl and its linen (left)
  g.lathe([[0.2, 0], [0.5, 0.04], [0.78, 0.25], [0.86, 0.52], [0.9, 0.56], [0.84, 0.56], [0.78, 0.3], [0.48, 0.1], [0, 0.08]], { at: [-1.75, 0, -0.55], c: K.celadon }, 24);
  m.box(0.9, 0.04, 0.7, { at: [-1.75, 0.02, 0.35], rot: [0, 0.3, 0], c: K.linen }, 0.02);
  // the rolling pin, the trafila and the soba knife (right edge)
  m.cyl(0.07, 0.07, 1.4, { at: [1.6, 0.07, 0.65], rot: [0, 0, PI / 2], c: K.hinokiD }, 10);
  g.cyl(0.18, 0.18, 0.1, { at: [2.05, 0.05, -0.85], c: K.bronze }, 14);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; g.cyl(0.025, 0.025, 0.11, { at: [2.05 + Math.cos(a) * 0.09, 0.05, -0.85 + Math.sin(a) * 0.09], c: K.ink }, 6); }
  g.box(0.9, 0.02, 0.3, { at: [1.75, 0.02, -0.25], c: K.steel }, 0.01); m.box(0.9, 0.06, 0.08, { at: [1.75, 0.05, -0.12], c: K.beam }, 0.02);
  // the hearth behind, right: the kamado's brick mouth (the oven), its fire
  const ox = 3.4, oz = -2.6;
  m.box(2.6, 2.2, 1.6, { at: [ox, 0.1, oz], c: K.brick }, 0.15);
  m.geo(new THREE.TorusGeometry(0.7, 0.14, 6, 16, PI), { at: [ox, 0.25, oz + 0.82], c: K.brickD });
  m.slab(1.4, 0.12, 0.3, { at: [ox, -0.42, oz + 0.82], c: K.brickD });
  glow.geo(new THREE.CircleGeometry(0.66, 16, 0, PI), { at: [ox, 0.25, oz + 0.8], c: K.ember, g: 1 });
  glow.slab(1.3, 0.5, 0.05, { at: [ox, 0.0, oz + 0.79], c: K.ember, g: 1 });
  m.cyl(0.3, 0.38, 2.4, { at: [ox + 0.7, 2.4, oz - 0.3], c: K.brickD }, 10);
  // the noodle pot: copper on a donabe's flame (left back)
  const px = -3.4, pz = -2.4;
  m.cyl(0.7, 0.8, 0.9, { at: [px, -0.55, pz], c: K.clay }, 14); glow.cyl(0.45, 0.45, 0.02, { at: [px, -0.09, pz], c: K.ember, g: 1 }, 12);
  g.lathe([[0, 0], [0.5, 0.02], [0.58, 0.2], [0.6, 0.62], [0.64, 0.66]], { at: [px, -0.08, pz], c: K.copper }, 18);
  for (const s of [-1, 1]) g.ring(0.1, 0.03, { at: [px + s * 0.68, 0.45, pz], rot: [PI / 2, 0, 0], c: K.copper }, 8, 3);
  // the drying rack: bamboo, ribbons of pasta and udon hanging (back middle)
  for (const x of [-1.2, 1.0]) m.cyl(0.04, 0.04, 2.0, { at: [x, 0.9, -3.4], c: K.bamboo }, 6);
  m.cyl(0.035, 0.035, 2.4, { at: [-0.1, 1.85, -3.4], rot: [0, 0, PI / 2], c: K.bamboo }, 6);
  for (let i = 0; i < 26; i++) { const x = -1.1 + i * 0.08, len = 0.7 + ((i * 37) % 10) * 0.04; m.slab(i % 2 ? 0.03 : 0.012, len, 0.01, { at: [x, 1.85 - len / 2, -3.4 + (i % 2 ? 0.02 : -0.02)], c: i % 2 ? K.pasta : K.udon }); }
  // wheat and rice in one vase, by the window
  g.lathe([[0, 0], [0.18, 0.02], [0.24, 0.3], [0.14, 0.62], [0.1, 0.7], [0.14, 0.78]], { at: [-2.4, 0, -1.0], c: K.ink }, 12);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, t = 0.18 + (i % 3) * 0.05, wheat = i % 2 === 0;
    m.cyl(0.008, 0.008, 1.1, { at: [-2.4 + Math.cos(a) * t * 0.5, 1.2, -1.0 + Math.sin(a) * t * 0.5], rot: [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], c: wheat ? K.wheat : K.rice }, 4);
    m.cyl(0.03, 0.02, 0.22, { at: [-2.4 + Math.cos(a) * (t + 0.15), 1.78, -1.0 + Math.sin(a) * (t + 0.15)], rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5], c: wheat ? K.wheat : K.rice }, 5); }
  // the Lachryma tank: the Weir's catch waiting (right front)
  g.box(1.0, 0.7, 0.6, { at: [2.6, 0.35, 0.7], c: K.tank }, 0.06); glow.slab(0.9, 0.5, 0.5, { at: [2.6, 0.3, 0.7], c: K.lachryma, g: 1 });
  const parts = [];
  for (const [P, mat] of [[m, new THREE.MeshStandardMaterial({ name: 'cook-set', vertexColors: true, roughness: 0.82 })], [g, new THREE.MeshStandardMaterial({ name: 'cook-set-glaze', vertexColors: true, roughness: 0.25, metalness: 0.25 })], [glow, new THREE.MeshBasicMaterial({ name: 'cook-set-glow', vertexColors: true, toneMapped: false })]]) {
    const mesh = new THREE.Mesh(P.done(), mat); mesh.castShadow = mat.name !== 'cook-set-glow'; mesh.receiveShadow = true; parts.push(mesh);
  }
  const group = new THREE.Group(); group.name = 'cook-set'; group.add(...parts);
  // the light: a warm key from the window, the fire's glow, a soft fill
  const key = new THREE.DirectionalLight(0xffe2b0, 2.6); key.position.set(-4, 5, 1); key.target.position.set(0, 0, -0.3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 14 }); key.shadow.bias = -0.0008;
  const fire = new THREE.PointLight(0xff8a3a, 6, 6, 1.6); fire.position.set(ox, 0.3, oz + 1.2);
  const fill = new THREE.HemisphereLight(0xfff0d8, 0x5a3a28, 1.0);
  group.add(key, key.target, fire, fill);
  return {
    group, fire,
    spots: { board: new THREE.Vector3(0, 0, -0.1), bowl: new THREE.Vector3(-1.75, 0.08, -0.55), oven: new THREE.Vector3(ox, -0.36, oz + 0.55), pot: new THREE.Vector3(px, 0.6, pz), rack: new THREE.Vector3(-0.1, 1.4, -3.4), tank: new THREE.Vector3(2.6, 0.4, 0.7) },
    update(t) { fire.intensity = 5.5 + Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13.1) * 0.4; },
    dispose() { group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); },
  };
}
