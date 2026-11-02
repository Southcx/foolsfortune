// ---------------------------------------------------------------------------------------
// THE GIANTS' DRESS KIT (plain name; the shared pieces of vfx/mechs/giants/: the straw giant's body, the dune colossus's body): what a
// giant's dress is built from at a mech's scale, so a 16 to 22 m body stays a few draws a joint.
//   SOUP      pieces gathered a (joint, material) and merged into one mesh each when done (a primitive placed, turned and scaled),
//             so a dressed joint is one draw a material, parented to the placeholder's own joint and carried by its pose
//   CANVASES  the burlap (the weave, a stitched seam round its edge), the sack's front (Strawman's red-on-cream target), the sack's
//             face (stitched X eyes, a running-stitch mouth), the clay's face (fired terracotta, its hollow eyes and mouth dark), drawn
//             once and shared by every giant
//   TUFT      a burst of straw (thin cones splayed out round a ring), the straw giant's seams and fists
//   HIDE      a placeholder's own meshes hidden (its materials' `visible` false, kept for its own dispose), and shown again
// Prior art: the house's merged-piece builders (vfx/garden/decorpieces/kit.js Piece, vfx/strawmanwell/props/kit.js Soup), the
// marionette's sack canvases (vfx/strawmanwell/marionette.js), Strawman's make (vfx/strawman.js).
//
//   new Soup()  .add(joint, geo, matKey, { at, rot, scale })  .done(mats) -> meshes   tuft(soup, joint, matKeys, r, n, len, { at, up, rot })
//   giantCanvas(kind) -> CanvasTexture (shared; 'burlap' | 'target' | 'face' | 'clay' | 'clayFace')   hidePlaceholder(mats, hide)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

/** Pieces gathered a joint and a material, merged one mesh each when done. */
export class Soup {
  constructor() { this.bins = new Map(); }
  add(joint, geo, mat, { at = [0, 0, 0], rot = [0, 0, 0], scale = 1 } = {}) {
    const g = geo; // (every primitive here is indexed: the merge needs them all alike)
    _e.set(...rot); _q.setFromEuler(_e); _p.set(...at); Array.isArray(scale) ? _s.set(...scale) : _s.setScalar(scale);
    g.applyMatrix4(_m.compose(_p, _q, _s));
    const key = joint; let bin = this.bins.get(key); if (!bin) this.bins.set(key, (bin = {}));
    (bin[mat] ||= []).push(g);
    return g;
  }
  /** Each bin merged and hung on its joint; returns the meshes (the caller disposes their geometry). */
  done(mats) {
    const out = [];
    for (const [joint, bin] of this.bins) for (const [k, list] of Object.entries(bin)) {
      const g = mergeGeometries(list, false); for (const x of list) x.dispose();
      if (!g) continue;
      const m = new THREE.Mesh(g, mats[k]); m.name = `giant.dress.${k}`; m.castShadow = true; m.receiveShadow = true; joint.add(m); out.push(m);
    }
    this.bins.clear();
    return out;
  }
}

/** A burst of straw: `n` thin cones round a ring of radius r, splayed outward (up 1, down -1), each a little different. */
export function tuft(S, joint, mats, r, n, len, { at = [0, 0, 0], up = 1, rot = [0, 0, 0], seed = 1, splay = 0.8 } = {}) {
  const base = new THREE.Vector3(...at), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), Y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const h = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453, f = h - Math.floor(h);
    const a = (i / n) * Math.PI * 2 + f * 0.6, L = len * (0.6 + 0.8 * f), w = 0.07 + 0.06 * f, sp = splay * (0.6 + 0.7 * f);
    const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const dir = radial.clone().multiplyScalar(Math.sin(sp)).addScaledVector(Y, Math.cos(sp) * up).normalize().applyQuaternion(q);
    const where = radial.multiplyScalar(r).applyQuaternion(q).add(base);
    _e.setFromQuaternion(_q.setFromUnitVectors(Y, dir));
    S.add(joint, new THREE.ConeGeometry(w, L, 3).translate(0, L / 2, 0), mats[i % mats.length], { at: where.toArray(), rot: [_e.x, _e.y, _e.z] });
  }
}

const CANVAS = {};
/** A shared canvas, drawn once: the burlap's weave, the sack's target, the sack's face, the fired clay and the clay's face. */
export function giantCanvas(kind) {
  if (CANVAS[kind]) return CANVAS[kind];
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const weave = (base, dark) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < S; i += 4) { g.fillStyle = `rgba(${dark},${0.1 + (i % 8 ? 0.04 : 0.12)})`; g.fillRect(0, i, S, 2); g.fillRect(i, 0, 2, S); }
    for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${dark},0.12)`; g.fillRect((k * 97) % S, (k * 53) % S, 3 + (k % 5), 2); } // (slubs)
  };
  if (kind === 'burlap' || kind === 'target' || kind === 'face') {
    weave('#b8945e', '80,54,26');
    g.strokeStyle = '#3a2614'; g.lineWidth = 4; g.setLineDash([12, 8]); g.strokeRect(8, 8, S - 16, S - 16); g.setLineDash([]); // (the seam's running stitch)
    if (kind === 'target') {
      for (const [r, c] of [[100, '#efe2c4'], [76, '#b8322a'], [52, '#efe2c4'], [28, '#b8322a']]) { g.fillStyle = c; g.beginPath(); g.arc(S / 2, S / 2, r, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 0.25; weave('rgba(0,0,0,0)', '60,30,16'); g.globalAlpha = 1; // (the paint soaked into the weave)
      g.strokeStyle = '#5a1810'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.arc(S / 2, S / 2, 100, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    } else if (kind === 'face') {
      g.strokeStyle = '#1c1410'; g.lineCap = 'round'; g.lineWidth = 16;
      for (const x of [78, 178]) { g.beginPath(); g.moveTo(x - 26, 70); g.lineTo(x + 26, 122); g.moveTo(x + 26, 70); g.lineTo(x - 26, 122); g.stroke(); }
      g.lineWidth = 8; g.beginPath(); g.moveTo(64, 184); g.quadraticCurveTo(128, 210, 192, 184); g.stroke();
      g.lineWidth = 5; for (let x = 74; x <= 182; x += 18) { const y = 184 + Math.sin((x - 64) / 128 * Math.PI) * 14; g.beginPath(); g.moveTo(x, y - 11); g.lineTo(x, y + 11); g.stroke(); }
      for (const [r, c] of [[24, '#efe2c4'], [16, '#b8322a'], [9, '#efe2c4'], [4, '#b8322a']]) { g.fillStyle = c; g.beginPath(); g.arc(128, 150, r, 0, Math.PI * 2); g.fill(); } // (a painted target for a nose: Strawman's own mark)
    }
  } else {
    // fired clay: terracotta mottled by the fire, specks, hairline crazing
    g.fillStyle = '#a8603c'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 160; k++) { const x = (k * 71) % S, y = (k * 37 + k * k) % S, r = 6 + (k % 9) * 3; g.fillStyle = `rgba(${k % 3 ? '70,30,14' : '220,150,100'},0.10)`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    for (let k = 0; k < 400; k++) { g.fillStyle = k % 2 ? 'rgba(40,20,10,0.5)' : 'rgba(240,210,170,0.4)'; g.fillRect((k * 131) % S, (k * 89) % S, 2, 2); }
    g.strokeStyle = 'rgba(50,22,10,0.35)'; g.lineWidth = 1; for (let k = 0; k < 14; k++) { g.beginPath(); let x = (k * 53) % S, y = (k * 29) % S; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += ((s * 7 + k) % 9) - 4; y += 9; g.lineTo(x, y); } g.stroke(); }
    if (kind === 'clayFace') { // (the haniwa's face: two almond hollows and a round mouth, cut through)
      g.fillStyle = '#120806';
      for (const x of [86, 170]) { g.beginPath(); g.ellipse(x, 104, 26, 13, 0, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.ellipse(128, 182, 18, 15, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(200,60,40,0.4)'; for (const x of [62, 194]) { g.beginPath(); g.arc(x, 150, 16, 0, Math.PI * 2); g.fill(); } // (a haniwa's red ochre on the cheeks)
    }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return (CANVAS[kind] = t);
}

/** A placeholder's own meshes hidden (or shown): its materials made invisible, kept for its own dispose. */
export function hidePlaceholder(mats, hide, keep = []) { for (const [k, m] of Object.entries(mats || {})) if (!keep.includes(k)) m.visible = !hide; }

/** A primitive's texture repeated (its uv scaled), for a canvas laid over metres. */
export function uvs(g, ru, rv) { const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * ru, U.getY(i) * rv); return g; }
/** A cylinder bellied out (a sack stuffed full: `belly` its swell at the middle) and pressed flat front to back (`d` its depth's share). */
export function sack(rTop, rBot, h, { belly = 0.12, d = 0.75, seg = 20, rows = 8, lump = 0.03 } = {}) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, rows), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const v = P.getY(i) / h + 0.5, k = 1 + belly * Math.sin(Math.PI * v) + lump * Math.sin(i * 1.7) * Math.sin(Math.PI * v); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k * d); }
  g.computeVertexNormals(); return g;
}
