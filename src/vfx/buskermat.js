// ---------------------------------------------------------------------------------------
// THE BUSKER'S MAT: where busking begins on a pier (the owner, 2026-10-07: the full build, Round 1; docs/plans/BUILD.md, SYSTEMS.md D5:
// "a busker's mat on each pier ... F at it with the Crucibelle worn begins the rhythm mode", a trial begun in its own room). It says
// "play here" without a word: a worn, woven mat laid on the planks, a tip pot at its corner, and the cubes the crowd has thrown in it.
//
//   THE MAT      a round-cornered rag rug, woven in bands of the island's colours (terracotta, cream, a dusty teal), its fringe at the ends
//   THE POT      a little tip pot thrown like the Pneuka Jar (the same silhouette, hand-sized), so a busker's takings sit in a vessel
//   THE TIPS     tip(n) puts that many Lachryma cubes in the pot (up to twelve show, heaped), oil-black with the film's sheen as the
//                cubes are everywhere (world/treasure/cubes.js oilMaterial)
//   PLAYING      set({ playing }) warms the mat's centre a little (a spot of light where the player stands), and nothing else: the rhythm
//                mode's own marks are Wanda's and Petra's
//
// Prior art: the busker's pitch (a rug or an open case and a hat), Animal Crossing's K.K. Slider on his stool (the place music happens),
// and the Pneuka Jar itself (vfx/sloop.js JAR: the vessel's silhouette reused at every scale).
//
//   const B = new BuskerMat({ env })   B.group (lies on its origin, +Z its long way)   B.tip(n)   B.set({ playing })   B.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { oilMaterial } from '../world/treasure/cubes.js';
import { mergeStatic } from '../render/merge.js';

const JAR = [[0, 0], [0.03, 0.34], [0.1, 0.66], [0.24, 0.93], [0.4, 1], [0.58, 0.95], [0.74, 0.78], [0.84, 0.6], [0.9, 0.5], [0.95, 0.54], [1, 0.6]]; // (the Pneuka Jar's profile, as the sloop's hull)

function rugTexture() {
  const W = 32, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const bands = ['#b5532d', '#f1d9b6', '#5f8c88', '#f1d9b6', '#8a3a22', '#e8c98f', '#5f8c88', '#f1d9b6'];
  for (let y = 0; y < H; y += 4) { g.fillStyle = bands[(y / 4) % bands.length]; g.fillRect(0, y, W, 4); }
  g.fillStyle = 'rgba(40,24,16,0.18)'; for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 2; x < W; x += 2) g.fillRect(x, y, 1, 1); // (the weave)
  g.fillStyle = '#3a241a'; g.fillRect(0, 0, W, 1); g.fillRect(0, H - 1, W, 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
}

export class BuskerMat {
  constructor({ env = null, length = 1.6, width = 1.0 } = {}) {
    this.group = new THREE.Group(); this.group.name = 'busker-mat';
    const body = new THREE.Group(); this.group.add(body);
    // the mat: a rounded rectangle, a hair above the planks, its corners curling up a touch
    const sh = new THREE.Shape(), r = 0.18, w = width / 2, l = length / 2;
    sh.moveTo(-w + r, -l); sh.lineTo(w - r, -l); sh.quadraticCurveTo(w, -l, w, -l + r); sh.lineTo(w, l - r); sh.quadraticCurveTo(w, l, w - r, l); sh.lineTo(-w + r, l); sh.quadraticCurveTo(-w, l, -w, l - r); sh.lineTo(-w, -l + r); sh.quadraticCurveTo(-w, -l, -w + r, -l);
    const mg = new THREE.ShapeGeometry(sh, 6); mg.rotateX(-Math.PI / 2);
    const P = mg.attributes.position, uv = mg.attributes.uv;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); uv.setXY(i, (x + w) / width, (z + l) / length); P.setY(i, 0.012 + 0.02 * Math.max(0, Math.abs(x) / w - 0.85) * 6); }
    mg.computeVertexNormals();
    this.matMat = new THREE.MeshStandardMaterial({ name: 'busker-rug', map: rugTexture(), roughness: 1, emissive: 0xffc070, emissiveIntensity: 0 });
    const mat = new THREE.Mesh(mg, this.matMat); mat.name = 'busker-rug'; mat.receiveShadow = true; body.add(mat);
    // the fringe at its two ends
    const fringe = new THREE.MeshStandardMaterial({ color: 0xe8d4b0, roughness: 1 });
    for (const sz of [-1, 1]) for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.07), fringe); f.position.set(-w * 0.8 + (i / 8) * w * 1.6, 0.012, sz * (l + 0.03)); body.add(f); }
    // the tip pot at a corner: the Jar's silhouette, hand-sized
    const pot = new THREE.LatheGeometry(JAR.map(([u, rr]) => new THREE.Vector2(Math.max(0.001, rr * 0.09), u * 0.22)), 14);
    const clay = new THREE.MeshStandardMaterial({ color: 0xb5532d, roughness: 0.6, side: THREE.DoubleSide, shadowSide: THREE.BackSide }); // (its shadow cast as every one-sided caster's: a two-sided caster's depth program was compiled in play, the first time the Weir's mat came into the sun's shadow)
    const potM = new THREE.Mesh(pot, clay); potM.position.set(w * 0.62, 0.015, l * 0.72); potM.castShadow = true; body.add(potM);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 5, 14), new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 0.6, roughness: 0.35 })); lip.rotation.x = Math.PI / 2; lip.position.set(w * 0.62, 0.015 + 0.22, l * 0.72); body.add(lip);
    mergeStatic(body);
    // the tips: Lachryma cubes heaped in the pot's mouth (twelve at most show)
    const cube = new THREE.BoxGeometry(0.03, 0.03, 0.03); cube.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(cube.attributes.position.count).fill(0.4), 1));
    this.oil = oilMaterial({ env, envIntensity: 0.3 });
    this.cubes = new THREE.InstancedMesh(cube, this.oil.mat, 12); this.cubes.count = 0; this.cubes.name = 'busker-tips'; this.group.add(this.cubes);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 12; i++) { const a = i * 2.4, rr = 0.012 + 0.02 * ((i * 7) % 3) / 2; q.setFromEuler(e.set(i * 0.7, i * 1.3, i * 0.4)); this.cubes.setMatrixAt(i, m.compose(new THREE.Vector3(w * 0.62 + Math.cos(a) * rr, 0.015 + 0.2 + Math.floor(i / 4) * 0.022, l * 0.72 + Math.sin(a) * rr), q, one)); }
    this.n = 0; this.glow = 0; this.playing = false; this.t = 0;
  }
  /** The tips in the pot: n cubes (twelve at most show). */
  tip(n) { this.n = Math.max(0, n | 0); this.cubes.count = Math.min(12, this.n); }
  set({ playing = this.playing } = {}) { this.playing = playing; }
  update(raw = 1 / 60) { this.t += raw; this.glow += ((this.playing ? 1 : 0) - this.glow) * Math.min(1, raw * 3); this.matMat.emissiveIntensity = this.glow * (0.06 + 0.02 * Math.sin(this.t * 4)); }
  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => o.geometry?.dispose?.()); this.matMat.map.dispose(); this.matMat.dispose(); this.oil.mat.dispose(); }
}
