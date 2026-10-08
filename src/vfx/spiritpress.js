// ---------------------------------------------------------------------------------------
// THE SPIRIT PRESS: Soul Alchemy's station in the Spirit Garden (docs/DESIGN.md, section 16; progress/alchemy.js), after the owner's
// concept (docs/ref/concept_spirit_press.png, a value study: the colour is ours). Not a machine but a thing that GREW: a garden
// shrine of root and leaf over a stone drum, the three parts the owner named grown into it, top to bottom:
//
//   THE HOPPER    the crown: a great mass of leaf and root with a SPIRAL MOUTH in its face, a striped leaf for a crest; what is
//                 pressed goes into the spiral (`queue`: the materials waiting, a lump each in its hue, circling the mouth in order)
//   THE IGNITER   the platter under the crown, its EYE at the front (rings of bronze round a lens that takes the soul colour and
//                 burns with `fire`), and the LEVER on its right, a long arm with a heavy ball (`pull` swings it down)
//   THE TRUNK     gnarled, a second spiral in it, a hollow at its side, roots spilling over the drum; when it presses (`press`) both
//                 spirals turn and a thread of the soul runs from the eye's drop down into the crucible
//   THE CRUCIBLE  the hourglass of glass standing in the drum's pool, a bead of the soul colour in its waist; a little lantern beside
//                 it, whose flame stands tall when your cubes cover a firing here and gutters low when they do not (and, refused for
//                 too few cubes, gutters out in a thread of smoke)
//   THE DRUM      stone, ball-footed, a medallion of glass with a spiral in it at the front; on top THE DRUM'S POOL, the soul colour
//                 itself turning slowly (a liquid stirred), brighter when fired, grey while the soul is (the bath is the basin now)
//   THE ROOT SPOUT a root grown out of the drum's front lip, reaching over the ware ring and the kerb to the bath's north lip (the
//                 tsukubai's kakei: the press pours into the bath as a bamboo spout into a garden basin); while it presses, THE THREAD
//                 of the soul runs from the eye's drop down through the hourglass and along the root, and falls into the bath at north
//   THE BALL      the lever's: up after a press, down at its stop after a firing, so its height says whether the press can fire; with
//                 the bead inside a spread it lifts a touch more and warms (an EMBER in the lacquer)
//   THE EYE       brightens in the soul colour as the bead nears a tile's heart; at a firing it flares and lays a pinpoint on the bead,
//                 a BURNING GLASS (the beam here, the point on the bath: vfx/alchemy/bath.js)
//   THE HUE RING  the concept's floating lights, seven, one per attribute at its hue: vfx/alchemy/huering.js (they orbit, settle into
//                 their seals when the press view opens, lift over a tile, dive at a firing, go home)
// The palette is the Spirit Garden's: moss and deep teal leaf, plum-dark bark, grey stone, dull bronze; the soul's colour is the only
// bright thing on it, and every colour of the colour wheel on it is wheelColour's (vfx/wheelcolour.js: the bead, the eye, the thread,
// the drum's pool, the lumps, the lights), so the press and its bath agree. (R58's first press, a potter's screw press, is gone.)
//
// Prior art: the owner's concept, the alchemist's athanor (the furnace and its feeding tower: the crown over the fire), the hourglass
// as the alchemist's vessel, the spirit shrines of Okami and Ghibli's forest spirits (a living shrine, lights about it), the tsukubai
// and its kakei (the root spout), the burning glass (a lens laying the sun on a point), and Potion Craft's map.
//
//   const P = new SpiritPress({ env, hues })   scene.add(P.group)   P.parts (hopper, mouth, eye, lever, ball, trunk, crucible, pool, spout)
//   P.seat({ seals, tiles, lip, up })   (the bath's places in the press's own frame: the spout and the thread reach its lip, the lights its seals)
//   P.set({ soul: { h, s }, fill, fire, press, pull, near, queue: [hue, ...], regia,
//           view, heart, unlit, bead, dive: { k, burn, deep }, ember, eye, flare, flame, smoke, beam })   P.update(t)
//   (about 3.2 m tall; +Z its front. pull: the ball's way down 0..1; ember 0..1; eye 0..1 the lens; flare 0..1 a firing's;
//   flame 0..1.6 the lantern's height; smoke 0..1 its thread; beam 0..1 the burning glass, aimed at `bead` (the press's own frame))
//   regia: 1 when something gilded is pressed: the drum's pool turns gold-orange and fumes, clearing by itself over about 4 real seconds
//   hues: the seven attributes' hues, in order (progress/alchemy.js ATTRIBUTES; by default the same seventh-of-the-colour-wheel spacing)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../render/outline.js';
import { LIQUID_GLSL, liquidUniforms } from './liquid.js';
import { wheelColour } from './wheelcolour.js';
import { HueRing } from './alchemy/huering.js';

const SEVEN = Array.from({ length: 7 }, (_, i) => Math.round(i * 360 / 7 + 20));
const C = { bark: 0x3a2a2c, barkHi: 0x5b4a44, leaf: 0x24403a, leafHi: 0x62806a, bronze: 0x8a6a3a, lacquer: 0x1a1517, dark: 0x0e0b0d, ember: 0xff6a28 };
const DRUM = { lip: new THREE.Vector3(0, 0.5, 0.93), drop: new THREE.Vector3(0, 1.66, 0.81), top: new THREE.Vector3(0, 1.0, 0.74), waist: new THREE.Vector3(0, 0.78, 0.74), foot: new THREE.Vector3(0, 0.6, 0.74) }; // (the press's own frame: where the root grows out; the eye's drop; the hourglass's mouth, waist and foot)

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function part(parent, geo, mat, x = 0, y = 0, z = 0, outline = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); if (outline) addOutline(m); return m;
}
/** A root's taper: a tube along a curve, thick at its start, thin at its tip. */
function taperTube(curve, r0, r1, seg = 24) {
  const g = new THREE.TubeGeometry(curve, seg, 1, 7), p = g.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) { curve.getPointAt(i / seg, c); const r = THREE.MathUtils.lerp(r0, r1, i / seg); for (let j = 0; j <= 7; j++) { const k = i * 8 + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g;
}
/** The thread's flow: a soft bright dash, scrolled along the thread while it presses. */
let _flow = null;
function flowTexture() {
  if (_flow) return _flow;
  const c = document.createElement('canvas'); c.width = 64; c.height = 4; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0.35)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 4);
  _flow = new THREE.CanvasTexture(c); _flow.wrapS = THREE.RepeatWrapping; _flow.colorSpace = THREE.SRGBColorSpace;
  _flow.generateMipmaps = true; _flow.minFilter = THREE.LinearMipmapLinearFilter; // (no crawl along a thread seen thin)
  return _flow;
}

/** A grown mass: a sphere pushed in and out by a few low waves (leaf or root), two-toned by the same waves in its vertex colours. */
function blob(r, seed, { sy = 1, rough = 0.2, lo = C.leaf, hi = C.leafHi } = {}) {
  const g = new THREE.IcosahedronGeometry(r, 3), p = g.attributes.position, col = new Float32Array(p.count * 3);
  const a = new THREE.Color(lo), b = new THREE.Color(hi), c = new THREE.Color(), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const w = (Math.sin(3.1 * v.x + seed) + Math.sin(2.7 * v.y + 2 * seed) + Math.sin(3.7 * v.z + 3 * seed)) / 3;
    const f = Math.sin(9.0 * v.x + 4 * seed) * Math.sin(8.0 * v.y + seed) * Math.sin(7.0 * v.z + 2 * seed);
    const d = 1 + rough * w + 0.06 * f;
    p.setXYZ(i, v.x * r * d, v.y * r * d * sy, v.z * r * d);
    c.copy(a).lerp(b, THREE.MathUtils.clamp(0.5 + 0.9 * w + 0.6 * f + 0.25 * v.y, 0, 1)); col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  return g;
}

/** A spiral face (the hopper's mouth, the trunk's whorl, the medallion's): a dark hollow with lighter coils, its edge soft. */
let _spiral = null;
function spiralTexture() {
  if (_spiral) return _spiral;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64); grd.addColorStop(0, '#060408'); grd.addColorStop(0.8, '#1a1418'); grd.addColorStop(1, 'rgba(26,20,24,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#6a5c66'; g.lineWidth = 3; g.beginPath();
  for (let t = 0; t < Math.PI * 7; t += 0.05) { const r = 3 + t * 2.4; g.lineTo(64 + Math.cos(t) * r, 64 + Math.sin(t) * r); }
  g.stroke();
  _spiral = new THREE.CanvasTexture(c); _spiral.colorSpace = THREE.SRGBColorSpace;
  return _spiral;
}
/** The drum's carving: swirls and roots in low relief, dark in the cut (wrapped round the drum, seamless). */
let _carve = null;
function carveTexture() {
  if (_carve) return _carve;
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#57514f'; g.fillRect(0, 0, 512, 64);
  g.strokeStyle = '#1e1a1c'; g.lineWidth = 5; g.lineCap = 'round';
  for (let k = 0; k < 8; k++) { // (a swirl every eighth of the way round, a root-line running between them)
    const x = 32 + k * 64, y = 32 + (k % 2 ? 6 : -6);
    g.beginPath(); for (let t = 0; t < Math.PI * 3.2; t += 0.1) { const r = 2 + t * 3.4; g.lineTo(x + Math.cos(t + k) * r, y + Math.sin(t + k) * r * 0.8); } g.stroke();
    g.beginPath(); g.moveTo(x + 18, y + 10); g.bezierCurveTo(x + 30, 60, x + 40, 4, x + 52, 34); g.stroke();
  }
  _carve = new THREE.CanvasTexture(c); _carve.colorSpace = THREE.SRGBColorSpace; _carve.wrapS = THREE.RepeatWrapping;
  return _carve;
}
/** The crest's leaf: pale, striped dark along its length. */
let _leaf = null;
function leafTexture() {
  if (_leaf) return _leaf;
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#d9d4c4'; g.beginPath(); g.ellipse(64, 32, 62, 28, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3a3a3c'; g.lineWidth = 4;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(10, 32 + i * 7); g.quadraticCurveTo(64, 32 + i * 13, 120, 32 + i * 4); g.stroke(); }
  _leaf = new THREE.CanvasTexture(c); _leaf.colorSpace = THREE.SRGBColorSpace;
  return _leaf;
}
/** A leaf: a strip bent along its length and curled at its tip. */
function leafGeo(len, wid) {
  const g = new THREE.PlaneGeometry(len, wid, 10, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / len + 0.5, y = p.getY(i); p.setZ(i, -0.35 * len * x * x + Math.abs(y) * 0.3); p.setY(i, y * (1 - 0.7 * x * x) + 0.15 * len * x * x); }
  g.computeVertexNormals(); return g;
}

export class SpiritPress {
  constructor({ env = null, hues = SEVEN } = {}) {
    const group = this.group = new THREE.Group(); group.name = 'spirit press';
    const P = this.parts = {};
    const bark = std(0xffffff, { vertexColors: true, roughness: 0.9 }), leaf = std(0xffffff, { vertexColors: true, roughness: 0.85 });
    const stone = std(0xffffff, { map: carveTexture(), roughness: 0.9 }), bronze = std(C.bronze, { metalness: 0.75, roughness: 0.4, envMap: env }), lacquer = std(C.lacquer, { roughness: 0.35, envMap: env });
    const spiralM = std(0xffffff, { map: spiralTexture(), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40 }); // (pressed hard onto the lumpy face it sits in)
    const barkTone = { lo: C.bark, hi: C.barkHi };
    this.barkM = std(C.bark, { roughness: 0.9 });

    // THE DRUM: ball feet, stone, bronze rims, the medallion; the drum's pool on top
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; part(group, new THREE.SphereGeometry(0.13, 12, 8), bronze, Math.sin(a) * 0.82, 0.12, Math.cos(a) * 0.82); }
    part(group, new THREE.CylinderGeometry(0.95, 0.98, 0.42, 32), stone, 0, 0.36, 0);
    part(group, new THREE.TorusGeometry(0.96, 0.045, 6, 40), bronze, 0, 0.57, 0).rotation.x = Math.PI / 2;
    part(group, new THREE.TorusGeometry(0.98, 0.04, 6, 40), bronze, 0, 0.15, 0).rotation.x = Math.PI / 2;
    const med = part(group, new THREE.CircleGeometry(0.15, 24), spiralM, 0, 0.36, 0.985, false); med.material = spiralM.clone(); med.material.polygonOffset = false;
    part(group, new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xdfe6ee, { transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, envMap: env }), 0, 0.36, 0.95).rotation.x = Math.PI / 2;
    part(group, new THREE.TorusGeometry(0.17, 0.025, 6, 24), bronze, 0, 0.36, 0.97);
    this.poolU = { uT: { value: 0 }, uSoul: { value: new THREE.Color(0.75, 0.78, 0.82) }, uHeat: { value: 0 }, uRegia: { value: 0 } };
    const pool = this.poolMat = std(0x0c0a10, { roughness: 0.12, metalness: 0.2, envMap: env });
    pool.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.poolU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vBathP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBathP = position.xy;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uT, uHeat, uRegia; uniform vec3 uSoul; varying vec2 vBathP;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec2 q = vBathP; float r = length(q), a = atan(q.y, q.x);
  float swirl = 0.5 + 0.5 * sin(a * 3.0 + r * 7.0 - uT * 0.7) * (1.0 - 0.5 * r); // (stirred: three slow arms turning, a liquid's own movement)
  totalEmissiveRadiance += mix(uSoul, vec3(1.0, 0.55, 0.12) * 1.6, uRegia) * (0.3 + 0.6 * max(uHeat, uRegia)) * (0.55 + 0.45 * swirl) * (0.6 + 0.4 * (1.0 - r)); } // (aqua regia: the pool gold-orange while gold dissolves in it)`);
    };
    pool.customProgramCacheKey = () => 'spirit-bath';
    P.pool = part(group, new THREE.CircleGeometry(0.9, 32), pool, 0, 0.56, 0, false); P.pool.rotation.x = -Math.PI / 2;

    // THE CRUCIBLE: the hourglass of glass in the pool, the soul's bead in its waist; the lantern by it, and its thread of smoke
    const hg = [[0.0, 0], [0.13, 0], [0.14, 0.02], [0.1, 0.1], [0.03, 0.2], [0.03, 0.24], [0.11, 0.34], [0.14, 0.44], [0.12, 0.45], [0.09, 0.36], [0.0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y));
    const cru = P.crucible = new THREE.Group(); cru.position.set(0, 0.56, 0.74); group.add(cru); // (front and centre, under the eye's drop)
    part(cru, new THREE.LatheGeometry(hg, 20), std(0xe8f0f4, { transparent: true, opacity: 0.2, roughness: 0.05, envMap: env, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0, false);
    this.beadMat = std(0x101010, { emissive: new THREE.Color(0.7, 0.72, 0.76), emissiveIntensity: 0.6, roughness: 0.2 });
    P.bead = part(cru, new THREE.SphereGeometry(0.05, 12, 8), this.beadMat, 0, 0.12, 0, false);
    const lan = P.lantern = new THREE.Group(); lan.position.set(0.5, 0.56, 0.62); lan.scale.setScalar(1.5); group.add(lan); // (out on the drum's front, clear of the roots, and big enough to read from the press view)
    part(lan, new THREE.CylinderGeometry(0.075, 0.075, 0.2, 12, 1, true), std(0xf0e6d0, { transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0, 0.1, 0, false);
    part(lan, new THREE.CylinderGeometry(0.085, 0.09, 0.03, 12), bronze, 0, 0.015, 0); part(lan, new THREE.ConeGeometry(0.09, 0.07, 12), bronze, 0, 0.235, 0);
    this.flameMat = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
    P.flame = part(lan, new THREE.ConeGeometry(0.035, 0.11, 8, 1, true), this.flameMat, 0, 0.09, 0, false); P.flame.castShadow = false;

    // THE TRUNK: gnarled masses, a whorl in its face, a hollow at its side, roots over the drum
    const trunk = P.trunk = new THREE.Group(); group.add(trunk);
    part(trunk, blob(0.5, 1.3, { sy: 1.0, rough: 0.22, ...barkTone }), bark, 0, 1.12, -0.04);
    part(trunk, blob(0.32, 2.1, { rough: 0.3, lo: C.bark, hi: C.leafHi }), bark, 0.34, 0.92, 0.1);
    part(trunk, blob(0.3, 3.7, { rough: 0.3, lo: C.bark, hi: C.leafHi }), bark, -0.38, 1.3, 0.0);
    part(trunk, new THREE.CylinderGeometry(0.2, 0.28, 0.5, 10), this.barkM, 0, 1.65, -0.02);
    P.whorl = part(trunk, new THREE.CircleGeometry(0.2, 24), spiralM, 0.02, 1.14, 0.56, false);
    part(trunk, new THREE.CircleGeometry(0.17, 18), std(C.dark, { roughness: 1 }), -0.42, 1.0, 0.27, false).rotation.y = -0.7; // (the hollow)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4, s = 0.8 + 0.3 * Math.sin(i * 2.3);
      const pts = [new THREE.Vector3(Math.sin(a) * 0.3, 0.95, Math.cos(a) * 0.3), new THREE.Vector3(Math.sin(a) * 0.62 * s, 0.72, Math.cos(a) * 0.62 * s), new THREE.Vector3(Math.sin(a + 0.2) * 0.82 * s, 0.6, Math.cos(a + 0.2) * 0.82 * s), new THREE.Vector3(Math.sin(a + 0.3) * 0.93, 0.5, Math.cos(a + 0.3) * 0.93)];
      part(trunk, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.07 * s, 6), this.barkM, 0, 0, 0);
    }
    // THE ROOT SPOUT and THE THREAD are built to reach the bath (seat(); until seated, toward where a bath would stand)
    this.threadMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: flowTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });

    // THE IGNITER: the platter, its eye, the lever and its ball
    part(group, new THREE.CylinderGeometry(0.78, 0.7, 0.08, 32), lacquer, 0, 1.86, 0);
    part(group, new THREE.TorusGeometry(0.78, 0.06, 8, 40), lacquer, 0, 1.9, 0).rotation.x = Math.PI / 2;
    part(group, new THREE.TorusGeometry(0.5, 0.02, 6, 32), bronze, 0, 1.91, 0).rotation.x = Math.PI / 2;
    const eye = P.eye = new THREE.Group(); eye.position.set(0, 1.86, 0.8); group.add(eye);
    part(eye, new THREE.BoxGeometry(0.42, 0.14, 0.08), lacquer, 0, 0, -0.03);
    part(eye, new THREE.TorusGeometry(0.11, 0.025, 6, 24), bronze, 0, 0, 0.02); part(eye, new THREE.TorusGeometry(0.065, 0.015, 6, 20), bronze, 0, 0, 0.04);
    this.lensMat = std(0x101010, { emissive: new THREE.Color(0.7, 0.72, 0.76), emissiveIntensity: 0.4, roughness: 0.1, envMap: env });
    part(eye, new THREE.SphereGeometry(0.06, 14, 10), this.lensMat, 0, 0, 0.03, false);
    part(eye, new THREE.ConeGeometry(0.045, 0.14, 10), bronze, 0, -0.13, 0.01).rotation.x = Math.PI; // (the drop under the eye)
    // the burning glass: a faint cone of light from the lens to the bead, laid at a firing (its point on the bath is the bath's to draw)
    this.beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const bg = new THREE.ConeGeometry(0.07, 1, 12, 1, true); bg.translate(0, -0.5, 0); bg.rotateX(-Math.PI / 2); // (a unit long along +Z from the lens, its point at the far end)
    P.beam = new THREE.Mesh(bg, this.beamMat); P.beam.visible = false; P.beam.position.copy(eye.position).add(new THREE.Vector3(0, 0, 0.06)); group.add(P.beam);
    const lever = P.lever = new THREE.Group(); lever.position.set(0.8, 1.86, 0.05); group.add(lever);
    part(lever, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.22, 0.18, 0), new THREE.Vector3(0.32, 0.5, 0), new THREE.Vector3(0.38, 0.78, 0)]), 12, 0.035, 6), std(C.bark, { roughness: 0.6 }), 0, 0, 0);
    this.ballMat = std(C.lacquer, { roughness: 0.35, envMap: env, emissive: new THREE.Color(C.ember), emissiveIntensity: 0 });
    P.ball = part(lever, new THREE.SphereGeometry(0.19, 18, 12), this.ballMat, 0.4, 0.95, 0);
    part(lever, new THREE.TorusGeometry(0.05, 0.02, 6, 12), bronze, 0, 0, 0).rotation.y = Math.PI / 2;

    // THE HOPPER: the crown, its spiral mouth, the crest, drips and sprouts; the materials waiting, circling the mouth
    const hop = P.hopper = new THREE.Group(); group.add(hop);
    part(hop, blob(0.62, 0.7, { sy: 0.92, rough: 0.2 }), leaf, 0, 2.48, -0.05);
    part(hop, blob(0.36, 4.4, { rough: 0.28 }), leaf, -0.5, 2.3, 0.08);
    part(hop, blob(0.34, 5.2, { rough: 0.28 }), leaf, 0.52, 2.38, 0.0);
    part(hop, blob(0.3, 6.1, { rough: 0.3, ...barkTone }), bark, 0, 2.0, 0.0);
    P.mouth = part(hop, new THREE.CircleGeometry(0.26, 28), spiralM, 0.02, 2.5, 0.68, false);
    for (const [x, y, z, l] of [[-0.62, 2.1, 0.25, 0.32], [-0.7, 2.25, 0.05, 0.22], [0.66, 2.15, 0.2, 0.18]]) part(hop, new THREE.ConeGeometry(0.04, l, 6), std(C.leaf, { roughness: 0.85 }), x, y - l / 2, z).rotation.x = Math.PI; // (drips hanging from the crown)
    const leafM = std(0xffffff, { map: leafTexture(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
    const crest = new THREE.Group(); crest.position.set(0.1, 3.02, -0.05); crest.rotation.set(0.1, -0.3, -0.35); hop.add(crest);
    part(crest, leafGeo(0.9, 0.34), leafM, 0.4, 0, 0, false); part(crest, leafGeo(0.75, 0.28), leafM, 0.3, -0.05, 0.12, false).rotation.z = -0.25;
    part(hop, new THREE.CylinderGeometry(0.02, 0.03, 0.22, 5), std(C.bark), 0.02, 2.98, -0.05).rotation.z = -0.3;
    for (const [x, y, z, r] of [[-0.42, 2.98, 0.0, 0.5], [-0.85, 1.95, 0.35, 1.1]]) { const s = part(hop, leafGeo(0.2, 0.1), std(C.leafHi, { side: THREE.DoubleSide }), x, y, z, false); s.rotation.set(0, 0.5, r); } // (sprouts)
    this.lumps = []; P.queue = new THREE.Group(); P.queue.position.set(0.02, 2.5, 0.7); hop.add(P.queue);
    const lumpG = new THREE.DodecahedronGeometry(0.04);
    for (let i = 0; i < 6; i++) {
      const m = std(0xffffff, { roughness: 0.45, emissive: new THREE.Color(0), emissiveIntensity: 0.35 });
      const l = part(P.queue, lumpG, m, 0, 0, 0, false); l.visible = false; this.lumps.push(l);
    }

    // THE HUE RING: seven lights, one per attribute (vfx/alchemy/huering.js)
    this.ring = new HueRing(group, hues); P.hues = this.ring.lights;

    this.t = 0;
    // AQUA REGIA (the owner's playlist: Sleep Token's "Aqua Regia"): the one acid that dissolves gold. When something gilded goes into
    // the press, the drum's pool turns gold-orange and a column of fume rises off it, fraying as it climbs, then clears as the acid spends
    // itself. The lantern's thread of smoke, when it gutters out, is the same shader in grey (one program).
    // Prior art: the real thing (nitric and hydrochloric acid, orange-yellow with nitrosyl chloride, fuming off gold), the alchemists'
    // aqua regia, "royal water" (it dissolves the king of metals), and the coloured smokes over every alchemy bench.
    const fume = (u, geo) => new THREE.Mesh(geo, new THREE.ShaderMaterial({ name: 'spirit-fume', uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; varying vec3 vN, vW; void main() { vU = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec2 vU; varying vec3 vN, vW; uniform float uT, uA; uniform vec3 uCol0, uCol1;
${LIQUID_GLSL}
void main() {
  float m = liqTap(vec2(vU.x * 2.0, vU.y * 0.8 - uT * 0.12)).r, b = liqTap(vec2(vU.x * 3.0 + 0.3, vU.y * 1.4 - uT * 0.2)).g;
  float wisps = smoothstep(0.35, 0.75, m * 0.6 + b * 0.4);
  float edge = 1.0 - abs(dot(normalize(cameraPosition - vW), vN));
  float a = uA * wisps * (0.4 + 0.6 * edge) * smoothstep(0.0, 0.15, vU.y) * (1.0 - smoothstep(0.45, 1.0, vU.y));
  gl_FragColor = vec4(mix(uCol0, uCol1, vU.y), a * 0.7);
  #include <colorspace_fragment>
}` }));
    this.fumeU = { uT: { value: 0 }, uA: { value: 0 }, uCol0: { value: new THREE.Color(1.0, 0.72, 0.25) }, uCol1: { value: new THREE.Color(0.95, 0.45, 0.12) }, ...liquidUniforms() };
    const fg = new THREE.CylinderGeometry(0.55, 0.85, 1.6, 24, 8, true); fg.translate(0, 0.8 + 0.58, 0);
    P.fume = fume(this.fumeU, fg); P.fume.visible = false; group.add(P.fume);
    this.smokeU = { uT: { value: 0 }, uA: { value: 0 }, uCol0: { value: new THREE.Color(0.5, 0.48, 0.5) }, uCol1: { value: new THREE.Color(0.78, 0.76, 0.76) }, ...liquidUniforms() };
    const sg = new THREE.CylinderGeometry(0.09, 0.02, 0.8, 8, 4, true); sg.translate(0, 0.4 + 0.25, 0); // (from the lantern's cap up)
    P.smoke = fume(this.smokeU, sg); P.smoke.visible = false; lan.add(P.smoke);
    this.k = { soul: { h: 0, s: 0 }, fill: 0.6, fire: 0, press: 0, pull: 0, near: -1, queue: [], regia: 0, view: false, heart: false, unlit: false, bead: null, dive: null, ember: 0, eye: null, flare: 0, flame: null, smoke: 0, beam: 0 };
    this.seat({ lip: new THREE.Vector3(0, 0.45, 1.95), up: new THREE.Vector3(0, 1, 0) }); // (a bath where the Athanor's stands, until the press is seated)
    this.set(); this.update(0);
  }

  /** The bath's places in the press's own frame: its north lip (the spout reaches over the ware ring and the kerb to it, and the thread
   *  falls there), its up, each seal's carving and each tile's centre (the hue ring's lights settle into the seals, hang over the tiles). */
  seat({ seals = null, tiles = null, lip, up }) {
    const P = this.parts, U = up.clone().normalize(), tip = lip.clone().addScaledVector(U, 0.22).add(_v.set(0, 0, -0.08));
    const out = DRUM.lip.clone(), mid = out.clone().lerp(tip, 0.5).addScaledVector(U, 0.12);
    const curve = new THREE.CatmullRomCurve3([out.clone().add(_v.set(0, -0.06, -0.06)), out.clone().add(_v.set(0, 0.04, 0.12)), mid, tip]);
    if (P.spout) { P.spout.removeFromParent(); P.spout.geometry.dispose(); }
    P.spout = part(this.group, taperTube(curve, 0.085, 0.04), this.barkM, 0, 0, 0); // (a root, thick where it leaves the drum)
    // the thread: from the eye's drop down into the hourglass, out over the drum's lip, along the root's back, and falling into the bath
    const along = [0.2, 0.45, 0.7, 1].map((u) => curve.getPointAt(u).addScaledVector(U, 0.07 * (1 - u) + 0.045));
    const pts = [DRUM.drop, DRUM.top, DRUM.waist, DRUM.foot, out.clone().addScaledVector(U, 0.13), ...along, lip.clone().addScaledVector(U, 0.01)];
    const tc = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    if (P.thread) { P.thread.removeFromParent(); P.thread.geometry.dispose(); }
    P.thread = new THREE.Mesh(new THREE.TubeGeometry(tc, 64, 0.012, 5), this.threadMat); P.thread.castShadow = false; P.thread.visible = false; this.group.add(P.thread);
    this.threadMat.map.repeat.set(tc.getLength() / 0.18, 1);
    if (seals && tiles) this.ring.seat({ seals, tiles, up: U });
  }

  /** The press's state (each key optional, kept until set again): the soul colour (the bead, the eye, the thread, the drum's pool), how
   *  full the pool is, the fire, the press, the ball's way down, the light the soul is inside, the materials in the mouth; and at the
   *  bath, the press view, a tile's heart, the ball's ember, the eye, a firing's flare, the lantern, its smoke, the burning glass. */
  set(o = {}) {
    const k = this.k, P = this.parts, cl = THREE.MathUtils.clamp;
    for (const key of ['view', 'heart', 'unlit', 'bead', 'dive', 'near']) if (o[key] !== undefined) k[key] = o[key];
    for (const key of ['fill', 'fire', 'press', 'pull', 'ember', 'flare', 'smoke', 'beam', 'regia']) if (o[key] !== undefined) k[key] = cl(o[key], 0, 1);
    if (o.eye !== undefined) k.eye = o.eye == null ? null : cl(o.eye, 0, 1);
    if (o.flame !== undefined) k.flame = o.flame == null ? null : cl(o.flame, 0, 1.6);
    if (o.soul) k.soul = { h: o.soul.h, s: o.soul.s };
    if (o.queue) k.queue = o.queue.slice(0, this.lumps.length);
    const sc = wheelColour(k.soul.h, k.soul.s, this.poolU.uSoul.value).multiplyScalar(1.15); // (the soul's colour, wheelColour's, a little hot: it is lit from within)
    this.poolU.uHeat.value = k.fire;
    this.beadMat.emissive.copy(sc); this.beadMat.emissiveIntensity = 0.5 + 1.2 * k.fire;
    const eye = k.eye ?? (0.15 + 0.85 * k.fire); // (the lens: dark outside every spread, brightening toward a tile's heart; flaring at a firing)
    this.lensMat.emissive.copy(sc).lerp(_white, 0.4 * k.flare); this.lensMat.emissiveIntensity = 0.1 + 2.2 * eye + 4 * k.flare;
    this.threadMat.color.copy(sc);
    P.pool.position.y = 0.575 + 0.012 * k.fill; // (just over the drum's top: a full pool brims)
    P.lever.rotation.z = -k.pull * 1.15 + 0.08 * k.ember; // (down at its stop, the ball level with the pivot; inside a spread it lifts a touch more)
    this.ballMat.emissiveIntensity = 0.9 * k.ember;
    const fl = k.flame ?? (0.6 + 0.9 * k.fire);
    this.flameMat.opacity = fl > 0.01 ? 0.25 + 0.45 * Math.min(1, fl) : 0; P.flame.scale.set(1, Math.max(0.001, fl), 1); P.flame.visible = fl > 0.01;
    P.smoke.visible = k.smoke > 0.01; this.smokeU.uA.value = k.smoke;
    P.thread.visible = k.press > 0.02; this.threadMat.opacity = 0.85 * k.press;
    P.beam.visible = k.beam > 0.01 && !!k.bead; this.beamMat.opacity = 0.16 * k.beam; this.beamMat.color.copy(sc).lerp(_white, 0.6);
    if (P.beam.visible) { const d = _v.copy(k.bead).sub(P.beam.position), len = d.length(); P.beam.quaternion.setFromUnitVectors(_z, d.normalize()); P.beam.scale.set(0.4 + 0.6 * k.beam, 0.4 + 0.6 * k.beam, len); }
    this.lumps.forEach((l, i) => {
      const h = k.queue[i]; l.visible = h !== undefined;
      if (l.visible) { wheelColour(h, 0.65, l.material.color); l.material.emissive.copy(l.material.color).multiplyScalar(0.5); }
    });
  }

  /** Per frame (`t` real seconds): the pool turns, the spirals turn as it presses, the materials circle in, the lights move, the flame
   *  breathes, the thread flows. */
  update(t) {
    const dt = Math.min(0.1, Math.max(0, t - this.t)); this.t = t;
    const k = this.k, P = this.parts;
    this.poolU.uT.value = t;
    k.regia = Math.max(0, k.regia - dt / 4); // (the acid spends itself over about four real seconds)
    this.poolU.uRegia.value = k.regia; this.fumeU.uT.value = t; this.fumeU.uA.value = Math.min(1, k.regia * 1.5); P.fume.visible = k.regia > 0.01;
    this.smokeU.uT.value = t * 1.6;
    this.spin = (this.spin || 0) + dt * (0.15 + 2.4 * k.press);
    P.mouth.rotation.z = this.spin; P.whorl.rotation.z = -this.spin * 0.8;
    this.lumps.forEach((l, i) => { const a = this.spin * 1.5 + i * 1.05, r = 0.2 - 0.02 * i; l.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.02); l.rotation.set(t + i, t * 0.7, 0); });
    if (k.press > 0.02) this.threadMat.map.offset.x -= dt * 2.2; // (the soul running down the root)
    this.ring.update(dt, t, { view: k.view, near: k.near, heart: k.heart, unlit: k.unlit, bead: k.bead, dive: k.dive });
    const fl = k.flame ?? (0.6 + 0.9 * k.fire);
    if (fl > 0.01) P.flame.scale.y = fl * (1 + 0.06 * Math.sin(t * 5.0) + (fl < 0.5 ? 0.12 * Math.sin(t * 17.0) : 0)); // (a low flame gutters: it flickers)
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); } });
  }
}
const _v = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1), _white = new THREE.Color(1, 1, 1);
