// ---------------------------------------------------------------------------------------
// PIP'S TRIES: the Well's straw dummies drawn as Pip's earlier tries at stitching Strawman (LORE.md, the folk: Pip, the stoneware
// apprentice afraid of breaking things, stitched Strawman, the one thing in a workshop of clay that cannot shatter; these came first).
// Each is Strawman's own doll (vfx/strawman.js) restitched by its `restyle`, rougher or odder, and none wears the heart charm (Pip's, and
// given only to the one that worked). A dummy stands about 47 lines tall at the 480-line present, so each try reads first by its
// silhouette and its cloth, and its stitches are a bonus up close:
//   buttons     the first: a linen sack with a target pencilled on lopsided (three times over), mismatched button eyes (a big brass one,
//               a small teal one), a brass thimble for a hat, mustard sleeves with a button at each cuff
//   patched     a lumpy burlap sack patched with gingham, velvet and felt in big crude stitches, a patch over one eye, the hat knocked
//               crooked, one sleeve teal and the other rose
//   sock        a sock puppet for a head (a rose toe for a mouth, one felt eye bigger than the other), a body knitted in stripes, no hat
//   pincushion  a tomato pincushion for a body (crimson velvet in lobes, a felt calyx at its neck), pins stuck all over it, two pinheads
//               for eyes and a needle through its head trailing thread
//   egg         a darning egg for a head (maple, a worried face painted on, its handle for a neck), a cotton reel for a hat, a sack half
//               darned in teal
//   bandaged    a dark, saggy sack split at its side seams with the straw poking out, bandaged round the belly and round the head
// One try a dummy by its index (`tryOf(i)`, stable). Its canvases and meshes become the model's own (it disposes them); what a try hangs
// on a part is one mesh for that part, coloured from a strip of swatches (one texel a colour), in the sack's own program: no try adds a
// program, and a part's hung pieces are one draw.
//
// Prior art: the first drafts of every handmade doll (a sock puppet, a tomato pincushion, the darning egg in the basket, a cotton reel),
// LittleBigPlanet's sackfolk and their costume parts (one doll, its pieces swapped), Pollock's toy-theatre figures under stage light;
// the house's own Strawman for the weave and the stitches (vfx/strawman.js's canvases).
//
//   TRIES (the ids, in order)   tryOf(i) -> id   stitchTry(model, id, palette) -> model (restyled once: `model.group.userData.pipTry`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TRIES = ['buttons', 'patched', 'sock', 'pincushion', 'egg', 'bandaged'];
export const tryOf = (i) => TRIES[((i % TRIES.length) + TRIES.length) % TRIES.length];

const S = 256, BODY_H = 0.95, TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1);
/** Strawman's own colours the tries share (vfx/strawman.js C: the straw, the seam's thread, the sack's burlap). */
const STRAW = 0xe0c070, SEAM = 0x6b5236, SACK = 0xcdb48c;
const css = (hex, a = 1) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

// ---- the canvases --------------------------------------------------------------------------
function paint(fn, w = S, h = w) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); fn(g, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
/** A cloth's weave: crossed threads, a little uneven (Strawman's sack's, with its strength). */
function weave(g, base, k = 1, step = 3) {
  g.fillStyle = css(base); g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += step) {
    g.fillStyle = `rgba(60,40,20,${(0.08 + 0.06 * Math.sin(i * 1.7)) * k})`; g.fillRect(i, 0, 1, S);
    g.fillStyle = `rgba(255,240,210,${(0.06 + 0.05 * Math.sin(i * 2.3)) * k})`; g.fillRect(0, i, S, 1);
  }
}
/** A run of slanted stitches from one point to another (big and crude: Pip's hand). */
function stitches(g, x0, y0, x1, y1, n, col, w = 3, len = 5) {
  g.strokeStyle = css(col); g.lineWidth = w; g.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    g.beginPath(); g.moveTo(x - len, y - len * 0.7); g.lineTo(x + len, y + len * 0.7); g.stroke();
  }
}
const ring = (g, x0, y0, x1, y1, n, col, w, len) => { stitches(g, x0, y0, x1, y0, n, col, w, len); stitches(g, x1, y0, x1, y1, n, col, w, len); stitches(g, x1, y1, x0, y1, n, col, w, len); stitches(g, x0, y1, x0, y0, n, col, w, len); };
const cross = (g, x, y, s, col, w = 6) => {
  g.strokeStyle = css(col); g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke();
};
/** The seam round a sack's top and one down its back (u wraps), as Strawman's. */
const seams = (g, col = SEAM) => { stitches(g, 0, 8, S, 8, 24, col, 2, 4); stitches(g, S - 8, 0, S - 8, S, 24, col, 2, 4); };
/** A stitched mouth, wavering (a hand not yet sure). */
function mouth(g, x0, x1, y, col, wob = 4) {
  g.strokeStyle = css(col); g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * 7) * wob; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }
  g.stroke();
  for (let k = 0; k < 6; k++) { const x = x0 + (k + 0.5) * (x1 - x0) / 6; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 2, y + 6); g.stroke(); }
}
/** Stripes round a knitted thing: bands down the canvas (round the body), fine ribs across them. */
function knit(g, bands, rib = 0.14) {
  let y = 0, i = 0;
  while (y < S) { const [col, hgt] = bands[i++ % bands.length]; g.fillStyle = css(col); g.fillRect(0, y, S, hgt); y += hgt; }
  for (let x = 0; x < S; x += 4) { g.fillStyle = `rgba(30,20,10,${rib})`; g.fillRect(x, 0, 1, S); g.fillStyle = `rgba(255,250,235,${rib * 0.6})`; g.fillRect(x + 2, 0, 1, S); }
}

// ---- the shapes ------------------------------------------------------------------------------
/** A sack shaped as Strawman's pear (`round` 1: a squat ball instead), with `lobes` round it (a pincushion's) and lumps (stuffing pushed
 *  in unevenly), in the lathe's own frame (the body mesh turns it). */
function sackGeometry({ lobes = 0, lobeK = 0, lumps = 0, round = 0, seed = 1 } = {}) {
  const prof = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, pear = 0.07 + 0.42 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.3 * t), ball = 0.05 + 0.44 * Math.pow(Math.sin(Math.PI * t), 0.7);
    prof.push(new THREE.Vector2(pear + (ball - pear) * round, -BODY_H + t * BODY_H));
  }
  const geo = new THREE.LatheGeometry(prof, lobes ? 40 : 28), P = geo.attributes.position, r = rng(seed), ph = [r() * TAU, r() * TAU, r() * TAU];
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), t = (P.getY(i) + BODY_H) / BODY_H, a = Math.atan2(x, z), env = Math.sin(Math.PI * t);
    const k = 1 + lobeK * Math.cos(lobes * a) * env + lumps * env * (0.6 * Math.sin(2 * a + ph[0]) * Math.sin(TAU * t + ph[1]) + 0.4 * Math.sin(3 * a + ph[2]));
    P.setX(i, x * k); P.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}
/** A point on the sack's surface in the sack's frame (front +z, `th` round toward +x, `t` 0 its foot to 1 its neck), `push` m off it. */
function sackAt(th, t, push = 0, round = 0) {
  const pear = 0.07 + 0.42 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.3 * t), ball = 0.05 + 0.44 * Math.pow(Math.sin(Math.PI * t), 0.7);
  const r = pear + (ball - pear) * round + push;
  return new THREE.Vector3(Math.sin(th) * r, -BODY_H + t * BODY_H, Math.cos(th) * r * 0.85);
}
/** A piece to hang: its geometry moved to `pos`, its +y turned to `dir`, scaled; `c` its swatch. */
function piece(geo, c, pos, dir = null, scale = null, spin = 0) {
  const q = new THREE.Quaternion();
  if (dir) q.setFromUnitVectors(UP, dir.clone().normalize());
  if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, spin));
  geo.applyMatrix4(new THREE.Matrix4().compose(pos, q, scale || ONE));
  return { geo, c };
}
/** Pieces built about their own +y as one group, then moved together. */
function group(list, pos, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()), m = new THREE.Matrix4().compose(pos, q, ONE);
  for (const p of list) p.geo.applyMatrix4(m);
  return list;
}
/** A sewing button about its own +y: its body, its holes, the thread crossed through them. */
function button(r, body, hole, thread, holes = 4) {
  const out = [piece(new THREE.CylinderGeometry(r, r * 0.94, r * 0.3, 16), body, new THREE.Vector3())];
  const h = r * 0.32;
  for (let i = 0; i < holes; i++) { const a = (i / holes) * TAU + Math.PI / 4; out.push(piece(new THREE.CylinderGeometry(r * 0.13, r * 0.13, r * 0.32, 6), hole, new THREE.Vector3(Math.cos(a) * h, 0.02 * r, Math.sin(a) * h))); }
  for (const a of holes > 2 ? [Math.PI / 4, -Math.PI / 4] : [0]) out.push(piece(new THREE.BoxGeometry(r * 0.95, r * 0.1, r * 0.1), thread, new THREE.Vector3(0, r * 0.2, 0), null, null, a));
  return out;
}
/** A pin about its own +y from its point (y 0) to its head (y len). */
const pin = (len, head, shaft, hr = 0.055) => [
  piece(new THREE.CylinderGeometry(0.013, 0.013, len, 5), shaft, new THREE.Vector3(0, len / 2, 0)),
  piece(new THREE.SphereGeometry(hr, 10, 8), head, new THREE.Vector3(0, len, 0)),
];
/** The pieces made one mesh, coloured from a strip of swatches (one texel a colour, nearest: never a material a colour). */
function hung(list, colours, { rough = 0.7, metal = 0.1 } = {}) {
  const n = colours.length;
  const geos = list.map(({ geo, c }) => {
    const flat = geo.index ? geo.toNonIndexed() : geo; if (flat !== geo) geo.dispose();
    const uv = flat.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (c + 0.5) / n, 0.5);
    return flat;
  });
  const geo = mergeGeometries(geos, false); for (const g of geos) g.dispose();
  const map = paint((g) => colours.forEach((hex, i) => { g.fillStyle = css(hex); g.fillRect(i, 0, 1, 1); }), n, 1);
  map.magFilter = map.minFilter = THREE.NearestFilter; map.generateMipmaps = false; map.anisotropy = 1;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: metal, map }));
  mesh.name = 'pip-try';
  return mesh;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** A head's front, seen from its own frame (the head is turned a quarter: its +x is the doll's front, its +z the doll's left side). */
const faceDir = (side, up = 0.12, round = 0.62) => V(Math.cos(round), up, side * Math.sin(round));

// ---- the tries -------------------------------------------------------------------------------
const TRY = {
  buttons(P, r) {
    const body = paint((g) => {
      weave(g, P.linen, 0.7, 2); seams(g, P.burlapDark);
      g.strokeStyle = 'rgba(70,64,58,0.75)'; g.lineWidth = 3; // (the target pencilled on, lopsided, practised on each side)
      for (const [u, k] of [[0.5, 1], [0.24, 0.8], [0.76, 0.8]]) for (const [rr, dx, dy] of [[56, 0, 0], [38, 7, -4], [19, -5, 6], [6, 3, 2]]) {
        g.beginPath(); g.ellipse(S * u + dx * k, S * 0.56 + dy * k, rr * 0.42 * k + r() * 3, rr * k + r() * 4, 0.12 * (r() - 0.5), 0, TAU); g.stroke();
      }
    });
    const head = paint((g) => { weave(g, P.linen, 0.7, 2); mouth(g, S * 0.43, S * 0.6, S * 0.64, P.burlapDark, 5); stitches(g, S * 0.62, S * 0.2, S * 0.7, S * 0.36, 3, P.burlapDark, 2, 4); });
    const cuff = paint((g) => {
      g.fillStyle = css(P.mustard); g.fillRect(0, 0, S, S); g.fillStyle = css(P.brass); g.beginPath(); g.arc(S / 2, S / 2, S * 0.3, 0, TAU); g.fill();
      g.fillStyle = css(P.ink); for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(S / 2 + dx * 22, S / 2 + dy * 22, 9, 0, TAU); g.fill(); }
      cross(g, S / 2, S / 2, 24, P.teal, 5);
    });
    const C = [P.brass, P.ink, P.mustard, P.teal, P.chalk, 0x9a7a2e];
    const eyes = [...group(button(0.12, 0, 1, 2), faceDir(1).multiplyScalar(0.23), faceDir(1)), ...group(button(0.07, 3, 1, 4, 2), faceDir(-1, 0.2).multiplyScalar(0.23), faceDir(-1, 0.2))];
    const thimble = new THREE.LatheGeometry([V(0.0, 0, 0), V(0.14, 0, 0), V(0.135, 0.2, 0), V(0.115, 0.27, 0), V(0.06, 0.31, 0), V(0, 0.315, 0)].map((v) => new THREE.Vector2(v.x, v.y)), 16);
    const hat = [piece(thimble, 0, V(0, 0, 0)), piece(new THREE.TorusGeometry(0.14, 0.022, 6, 20), 5, V(0, 0.015, 0), V(0, 0, 1))];
    return {
      body: { map: body }, head: { map: head }, legs: { map: paint((g) => weave(g, P.linen, 0.7, 2)) }, sleeves: [P.mustard, P.mustard], cuffs: [cuff, cuff],
      hat: false, heart: false, on: { head: [hung(eyes, C, { rough: 0.45, metal: 0.35 })], hat: [hung(hat, C, { rough: 0.35, metal: 0.6 })] },
    };
  },

  patched(P, r) {
    const body = paint((g) => {
      weave(g, P.burlap, 1.1); seams(g);
      const patch = (x, y, w, h, fill, thread) => { g.save(); g.translate(x, y); g.rotate(0.15 * (r() - 0.5)); fill(-w / 2, -h / 2, w, h); ring(g, -w / 2, -h / 2, w / 2, h / 2, 4, thread, 4, 6); g.restore(); };
      patch(S * 0.42, S * 0.36, 58, 52, (x, y, w, h) => { for (let i = 0; i < w; i += 10) for (let j = 0; j < h; j += 10) { g.fillStyle = css(((i + j) / 10) % 2 ? P.chalk : P.teal); g.fillRect(x + i, y + j, 10, 10); } }, P.rose); // (gingham)
      patch(S * 0.76, S * 0.58, 64, 70, (x, y, w, h) => { g.fillStyle = css(P.velvet); g.fillRect(x, y, w, h); g.strokeStyle = css(P.gold); g.lineWidth = 3; g.strokeRect(x + 4, y + 4, w - 8, h - 8); }, P.mustard); // (velvet, gold trim)
      patch(S * 0.22, S * 0.5, 52, 60, (x, y, w, h) => { g.fillStyle = css(P.mustard); g.fillRect(x, y, w, h); g.fillStyle = 'rgba(120,80,10,0.25)'; for (let i = 0; i < 40; i++) g.fillRect(x + r() * w, y + r() * h, 2, 2); }, P.teal); // (felt)
      patch(S * 0.56, S * 0.82, 40, 26, (x, y, w, h) => { g.fillStyle = css(P.sage); g.fillRect(x, y, w, h); }, P.burlapDark);
    });
    const head = paint((g) => {
      weave(g, SACK); cross(g, S * 0.6, S * 0.43, 10, 0x2a1d14);
      g.strokeStyle = css(P.velvetDeep); g.lineWidth = 4; g.beginPath(); g.moveTo(0, S * 0.36); g.lineTo(S, S * 0.52); g.stroke(); // (the patch's strap, round the head)
      g.fillStyle = css(P.velvet); g.beginPath(); g.ellipse(S * 0.41, S * 0.46, 20, 24, 0, 0, TAU); g.fill();
      stitches(g, S * 0.38, S * 0.36, S * 0.45, S * 0.56, 4, P.gold, 2, 3); mouth(g, S * 0.42, S * 0.6, S * 0.64, 0x2a1d14, 3);
    });
    const spiral = paint((g) => {
      g.fillStyle = css(P.teal); g.fillRect(0, 0, S, S); g.strokeStyle = css(P.chalk); g.lineWidth = 9; g.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.1) { const rr = 8 + a * 5.2, x = S / 2 + Math.cos(a) * rr, y = S / 2 + Math.sin(a) * rr; a ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
    const gingham = paint((g) => { for (let i = 0; i < S; i += 32) for (let j = 0; j < S; j += 32) { g.fillStyle = css(((i + j) / 32) % 2 ? P.chalk : P.rose); g.fillRect(i, j, 32, 32); } });
    return { body: { map: body, geometry: sackGeometry({ lumps: 0.07, seed: 11 }) }, head: { map: head }, sleeves: [P.teal, P.rose], cuffs: [spiral, gingham], hat: { rotation: [0.1, 0, -0.42] }, heart: false };
  },

  sock(P) {
    const toe = paint((g) => {
      knit(g, [[P.teal, 26], [P.chalk, 16], [P.mustard, 22], [P.chalk, 16]]);
      g.fillStyle = css(P.rose); g.fillRect(0, 0, S, S * 0.2); // (the toe: the mouth's end; a capsule's top is the canvas's top)
      g.fillStyle = css(P.mustard); g.fillRect(0, S * 0.82, S, S * 0.18); for (let x = 0; x < S; x += 8) { g.fillStyle = 'rgba(80,50,10,0.35)'; g.fillRect(x, S * 0.82, 3, S * 0.18); } // (its ribbed cuff, at the neck)
    });
    const knitted = paint((g) => knit(g, [[P.sage, 30], [P.chalk, 12], [P.teal, 20], [P.chalk, 12], [P.mustard, 16]], 0.18));
    const ribbed = paint((g) => { g.fillStyle = css(P.sage); g.fillRect(0, 0, S, S); g.strokeStyle = 'rgba(30,40,20,0.4)'; g.lineWidth = 6; for (let rr = 20; rr < S / 2; rr += 22) { g.beginPath(); g.arc(S / 2, S / 2, rr, 0, TAU); g.stroke(); } });
    const sockGeo = new THREE.CapsuleGeometry(0.15, 0.3, 6, 16).rotateZ(-Math.PI / 2).translate(0.1, 0, 0); // (along its own +x: the doll's front)
    const C = [P.chalk, P.ink, P.velvetDeep, P.rose];
    const face = [
      ...group([piece(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14), 0, V(0, 0, 0)), piece(new THREE.CylinderGeometry(0.036, 0.036, 0.04, 10), 1, V(0.012, 0.01, 0))], V(0.17, 0.135, 0.075), V(0.25, 1, 0.45)),
      ...group([piece(new THREE.CylinderGeometry(0.046, 0.046, 0.03, 12), 0, V(0, 0, 0)), piece(new THREE.CylinderGeometry(0.024, 0.024, 0.04, 8), 1, V(0.008, 0.01, 0))], V(0.24, 0.13, -0.07), V(0.35, 1, -0.45)),
      piece(new THREE.SphereGeometry(0.1, 12, 8), 2, V(0.36, -0.03, 0), null, V(0.45, 0.28, 1.15)),
      piece(new THREE.SphereGeometry(0.06, 10, 6), 3, V(0.4, -0.06, 0), null, V(0.6, 0.25, 0.9)),
    ];
    return {
      head: { geometry: sockGeo, map: toe, scale: [1, 1, 1], position: [0.0, 0.2, 0.04], rotation: [0.05, -Math.PI / 2, -0.04] },
      body: { map: knitted }, legs: { map: knitted }, sleeves: [P.sage, P.sage], cuffs: [ribbed, ribbed], hat: false, heart: false,
      on: { head: [hung(face, C, { rough: 0.9, metal: 0 })] },
    };
  },

  pincushion(P, r) {
    const body = paint((g) => {
      g.fillStyle = css(P.velvet); g.fillRect(0, 0, S, S);
      for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, rr = 10 + r() * 26, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,120,130,0.12)'); gr.addColorStop(1, 'rgba(255,120,130,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } // (the velvet's nap catching the light)
      for (let k = 0; k < 8; k++) { const x = ((k + 0.5) / 8) * S; g.fillStyle = css(P.velvetDeep, 0.8); g.fillRect(x - 5, 0, 10, S); stitches(g, x, 0, x, S, 14, P.gold, 2, 4); } // (the lobes' seams, gold thread down each)
    });
    const head = paint((g) => { weave(g, SACK); mouth(g, S * 0.44, S * 0.58, S * 0.63, 0x2a1d14, 2); });
    const trim = paint((g) => { g.fillStyle = css(P.velvet); g.fillRect(0, 0, S, S); g.strokeStyle = css(P.gold); g.lineWidth = 12; g.beginPath(); g.arc(S / 2, S / 2, S * 0.38, 0, TAU); g.stroke(); });
    const C = [P.steel, P.rose, P.mustard, P.teal, P.chalk, P.gold, P.sky, P.sage, P.ink];
    const pins = [], round = 0.85;
    for (const [th, t] of [[0.1, 0.55], [0.7, 0.72], [-0.6, 0.4], [2.4, 0.6], [-2.6, 0.75], [3.1, 0.35], [1.5, 0.9], [-1.4, 0.88], [1.2, 0.3], [-1.0, 0.65]]) {
      const at = sackAt(th, t, -0.06, round), dir = V(Math.sin(th), 0.25 + (t - 0.5) * 1.2, Math.cos(th) * 0.85).add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.5));
      pins.push(...group(pin(0.3, 1 + Math.floor(r() * 6), 0), at, dir));
    }
    const calyx = [piece(new THREE.CylinderGeometry(0.2, 0.25, 0.05, 6), 7, V(0, -0.03, 0))];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; calyx.push(piece(new THREE.ConeGeometry(0.06, 0.2, 4), 7, V(Math.sin(a) * 0.24, -0.06, Math.cos(a) * 0.22), V(Math.sin(a), -0.5, Math.cos(a)))); }
    const needle = [ // (through the top of its head, its eye trailing teal thread)
      ...group([piece(new THREE.CylinderGeometry(0.016, 0.006, 0.66, 6), 0, V(0, 0, 0)), piece(new THREE.TorusGeometry(0.03, 0.009, 5, 10), 0, V(0, 0.34, 0), V(1, 0, 0))], V(-0.02, 0.18, 0), V(-0.45, 1, 0.15)),
      ...group([piece(new THREE.CylinderGeometry(0.01, 0.01, 0.34, 4), 3, V(0, 0, 0))], V(-0.24, 0.38, 0.02), V(-0.6, -1, 0)),
      ...group(pin(0.12, 8, 0, 0.06), faceDir(1, 0.1, 0.55).multiplyScalar(0.18), faceDir(1, 0.1, 0.55)), ...group(pin(0.12, 1, 0, 0.045), faceDir(-1, 0.16, 0.55).multiplyScalar(0.18), faceDir(-1, 0.16, 0.55)),
    ];
    return {
      body: { map: body, geometry: sackGeometry({ lobes: 8, lobeK: 0.09, round }) }, head: { map: head }, sleeves: [P.velvet, P.velvet], cuffs: [trim, trim], hat: false, heart: false,
      on: { sack: [hung([...pins, ...calyx], C, { rough: 0.5, metal: 0.3 })], head: [hung(needle, C, { rough: 0.35, metal: 0.6 })] },
    };
  },

  egg(P, r) {
    const body = paint((g) => {
      weave(g, P.burlap); seams(g);
      g.strokeStyle = css(P.rose, 0.85); g.lineWidth = 4; for (const rr of [44, 26, 10]) { g.beginPath(); g.ellipse(S * 0.5 + 4, S * 0.58, rr * 0.42, rr, 0.1, 0, TAU); g.stroke(); } // (the target, a little off)
      const x0 = S * 0.6, y0 = S * 0.3, w = 90, h = 110; // (the darn, half done: the warp laid, the weft woven over and under part way)
      g.fillStyle = css(P.burlapDark); g.fillRect(x0, y0, w, h);
      for (let x = x0 + 4; x < x0 + w; x += 9) { g.fillStyle = css(P.teal); g.fillRect(x, y0 - 6, 4, h + 12); }
      for (let j = 0, y = y0 + 4; y < y0 + h * 0.62; j++, y += 9) for (let x = x0 + (j % 2 ? 0 : 9); x < x0 + w; x += 18) { g.fillStyle = css(P.sky); g.fillRect(x - 2, y, 13, 4); }
      g.strokeStyle = css(P.sky); g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + w * 0.5, y0 + h * 0.64); g.bezierCurveTo(x0 + w * 0.3, y0 + h, x0 + w * 0.8, y0 + h * 1.1, x0 + w * 0.6, y0 + h * 1.35); g.stroke(); // (the loose end)
    });
    const wood = paint((g) => {
      g.fillStyle = css(P.maple); g.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) { const x0 = r() * S; g.strokeStyle = `rgba(110,64,30,${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 2.5; g.beginPath(); for (let y = 0; y <= S; y += 16) { const x = x0 + Math.sin(y * 0.04 + i) * 6; y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.fillStyle = css(P.ink); for (const [x, y, rr] of [[0.43, 0.5, 9], [0.59, 0.47, 7]]) { g.beginPath(); g.arc(S * x, S * y, rr, 0, TAU); g.fill(); } // (a worried face, painted)
      g.strokeStyle = css(P.ink); g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(S * 0.38, S * 0.4); g.lineTo(S * 0.47, S * 0.43); g.moveTo(S * 0.64, S * 0.38); g.lineTo(S * 0.56, S * 0.41); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.ellipse(S * 0.52, S * 0.62, 6, 8, 0, 0, TAU); g.stroke();
      g.fillStyle = css(P.rose, 0.35); for (const x of [0.38, 0.66]) { g.beginPath(); g.arc(S * x, S * 0.57, 12, 0, TAU); g.fill(); }
    });
    const darnCuff = paint((g) => { g.fillStyle = css(P.walnut); g.fillRect(0, 0, S, S); for (let i = 40; i < S - 40; i += 16) { g.fillStyle = css(P.teal); g.fillRect(i, 40, 6, S - 80); g.fillStyle = css(P.sky); g.fillRect(40, i, S - 80, 6); } });
    const eggGeo = new THREE.SphereGeometry(0.22, 24, 16), E = eggGeo.attributes.position;
    for (let i = 0; i < E.count; i++) { const y = E.getY(i), k = 1 - 0.15 * (y / 0.22); E.setXYZ(i, E.getX(i) * k, y * 1.2, E.getZ(i) * k); } // (an egg: taller, narrow at its top)
    eggGeo.computeVertexNormals();
    const C = [P.walnut, P.maple, P.teal, 0x9a6a38];
    const reel = [
      piece(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 18), 1, V(0, 0.025, 0)), piece(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 18), 1, V(0, 0.335, 0)),
      piece(new THREE.CylinderGeometry(0.13, 0.13, 0.27, 18), 2, V(0, 0.18, 0)), piece(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), 3, V(0, 0.18, 0)),
      ...group([piece(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), 2, V(0, 0, 0))], V(0.15, 0.08, 0.02), V(0.3, -1, 0.1)),
    ];
    return {
      head: { geometry: eggGeo, map: wood, scale: [1, 1, 1], position: [0.03, 0.29, 0.04] }, body: { map: body }, sleeves: [P.walnut, P.walnut], cuffs: [darnCuff, darnCuff],
      hat: false, heart: false, on: { head: [hung([piece(new THREE.CylinderGeometry(0.045, 0.065, 0.24, 10), 0, V(0, -0.33, 0))], C, { rough: 0.5 })], hat: [hung(reel, C, { rough: 0.6 })] },
    };
  },

  bandaged(P, r) {
    const body = paint((g) => {
      weave(g, P.burlapDark, 1.2); seams(g, 0x3a2a18);
      for (const u of [0.25, 0.75]) { // (the side seams split open, the straw's ends showing in the gash)
        const x = S * u; g.fillStyle = 'rgba(30,18,8,0.9)'; g.beginPath(); g.moveTo(x - 4, S * 0.28); g.quadraticCurveTo(x + 16, S * 0.5, x - 2, S * 0.74); g.quadraticCurveTo(x - 14, S * 0.5, x - 4, S * 0.28); g.fill();
        g.strokeStyle = css(STRAW); g.lineWidth = 2; for (let i = 0; i < 14; i++) { const y = S * (0.32 + r() * 0.38); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 22, y + (r() - 0.5) * 12); g.stroke(); }
        stitches(g, x - 10, S * 0.2, x - 10, S * 0.3, 2, P.chalk, 2, 4); stitches(g, x - 8, S * 0.76, x - 8, S * 0.86, 2, P.chalk, 2, 4);
      }
    });
    const head = paint((g) => {
      weave(g, P.burlap, 1.1);
      g.strokeStyle = '#2a1d14'; g.lineWidth = 6; g.lineCap = 'round';
      const X = (x, y, s) => { g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke(); };
      X(S * 0.42, S * 0.46, 12); X(S * 0.6, S * 0.43, 12); mouth(g, S * 0.43, S * 0.6, S * 0.66, 0x2a1d14, 2);
      stitches(g, S * 0.66, S * 0.3, S * 0.72, S * 0.62, 6, P.chalk, 2, 4); // (a scar, mended)
    });
    const wrap = paint((g) => { g.fillStyle = css(P.linen); g.fillRect(0, 0, S, S); g.strokeStyle = 'rgba(120,100,70,0.35)'; g.lineWidth = 3; for (let i = -S; i < S * 2; i += 26) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S * 0.6, S); g.stroke(); } });
    const C = [P.linen, STRAW, SACK, P.steel, 0xb8973f];
    const belly = [];
    for (const [t, tilt, push] of [[0.48, 0.14, 0.03], [0.36, -0.1, 0.035]]) {
      const rr = sackAt(Math.PI / 2, t).x + push;
      belly.push(piece(new THREE.TorusGeometry(rr, 0.05, 6, 30).rotateX(Math.PI / 2), 0, V(0, -BODY_H + t * BODY_H, 0), V(Math.sin(tilt), Math.cos(tilt), 0)));
    }
    for (const p of belly) p.geo.scale(1, 1, 0.88); // (round the sack, which is narrower front to back)
    belly.push(piece(new THREE.TorusGeometry(0.05, 0.012, 5, 12), 3, sackAt(0.2, 0.48, 0.06), V(0, 0, 1)));
    const straw = [];
    for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
      const th = side * (Math.PI / 2 + (r() - 0.5) * 0.7), t = 0.35 + r() * 0.35, at = sackAt(th, t, -0.04);
      straw.push(piece(new THREE.BoxGeometry(0.035, 0.3 + r() * 0.12, 0.035), 1 + (i % 2) * 3, at.add(V(Math.sin(th), 0.3, Math.cos(th)).multiplyScalar(0.13)), V(Math.sin(th) + (r() - 0.5) * 0.8, 0.5 + r(), Math.cos(th) * 0.85 + (r() - 0.5) * 0.8)));
    }
    const headWrap = [ // (a toothache's bandage: over the crown and under the chin, across the cheek the stage sees, its knot on top)
      piece(new THREE.TorusGeometry(0.24, 0.045, 6, 24).rotateY(Math.PI / 2).rotateZ(0.22), 0, V(-0.01, 0, 0)),
      piece(new THREE.SphereGeometry(0.07, 8, 6), 0, V(-0.03, 0.27, 0.07), null, V(0.6, 0.5, 1.3)), piece(new THREE.SphereGeometry(0.06, 8, 6), 0, V(-0.05, 0.27, -0.07), null, V(0.6, 0.5, 1.2)),
    ];
    return {
      body: { map: body, geometry: sackGeometry({ lumps: 0.09, seed: 29 }) }, head: { map: head }, sleeves: [P.burlapDark, P.burlapDark], cuffs: [wrap, wrap],
      hat: { rotation: [0.18, 0, 0.36] }, heart: false, on: { sack: [hung([...belly, ...straw], C, { rough: 0.95, metal: 0 })], head: [hung(headWrap, C, { rough: 0.95, metal: 0 })] },
    };
  },
};

/** Restitch a dummy's doll as Pip's try `id` (once a model), in the Well's palette (vfx/strawmanwell/look.js WELL_LOOK.palette). */
export function stitchTry(model, id, palette) {
  if (!model?.restyle || model.group.userData.pipTry || !TRY[id]) return model;
  model.restyle(TRY[id](palette, rng(TRIES.indexOf(id) * 977 + 13)));
  model.group.userData.pipTry = id;
  return model;
}
