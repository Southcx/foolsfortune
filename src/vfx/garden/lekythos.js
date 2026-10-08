// ---------------------------------------------------------------------------------------
// THE KEEPSAKE POT, DRAWN: a white-ground lekythos (docs/plans/MYCELIUM.md section 5; Espada's look, the owner's ruling 2026-10-08: "keep
// the pots"). A spirit let go is fired at the Chimney into one, and it stands in the Inner Realm for good (Dovina's progress/keepsakes.js
// keeps the list; Petra places them). Its colour is the spirit's: the figure's outline, the ribbon and the meander border are in it.
//
//   THE POT      the cylinder lekythos of Athens, fifth century BC, the oil flask left at a grave: a disc foot, a tall body a little
//                wider at the shoulder, a sharp-angled shoulder, a narrow neck, a cup-shaped mouth, a strap handle at the back. One lathe,
//                the handle merged into it (one draw), the seam at the back under the handle.
//   THE WARE     the body's picture field on the white ground (a coat of white clay, matt), the rest in the black (glossy: its roughness
//                is read off the paint, so a pot is one map): the foot, the lower body with a line reserved in the clay, the neck and the
//                mouth. The shoulder white, with three palmettes in the black and a tongue border at the neck. The meander border over the
//                field in the colour.
//   THE PICTURE  in the white-ground hand (vfx/blackfigure.js paintLikeness, paintStele: the black-figure painter's own figures turned to
//                outline): the spirit's likeness at the front, outlined in a dark of its colour and washed thinly in it, a ribbon hung
//                in the field over it; to its left its grave stele on two steps, an anthemion on top, a ribbon in the colour tied round
//                it, a lekythos on its step. The back is bare white, as the real ones are. The white flaked here and there (it was the
//                fragile part of the ware).
// One program for every keepsake pot (a standard material with its own map; the black's gloss read off the map in the shader), and one
// painting (with its material) for every pot of one kind and colour, counted by the pots that wear it and freed with the last: a painting
// is about 5 MB (its canvas and its texture's mips), so a ring of 64 pots of a few kinds and feelings costs a few paintings, not 64.
//
// Prior art, as a museum label: the Attic white-ground lekythoi of c. 470 to 400 BC, the funerary vase (the Achilles Painter's, the
// Bosanquet Painter's, the Reed Painter's and Group R's: figures in a dilute line on a white ground beside a stele hung with ribbons, the
// colours washed on and since faded; the meander over the scene; palmettes on the shoulder), as in the Metropolitan Museum's and
// the National Archaeological Museum of Athens' collections; Spiritfarer's Everdoor (care ending as a gift).
//
//   const P = lekythos({ colour?, feeling?, spirit?, height? })   P.group (stands on its origin, its picture to +z)   P.dispose()
//   (colour: a hex, a THREE.Color, a CSS colour or Soul Alchemy's { h, s }; feeling: 'wonder' .. 'dread', its canon colour when no colour is
//    given; spirit: its kind ('sporeling', 'slipjelly'...) or a keepsake pot's record { kind, colour, feeling } (game.keepsakes.pots[i]: the
//    record's own colour and feeling are used when not given); anything else is drawn as a slip jelly; `seed` is still taken and no longer
//    varies anything: a painting's flaking is drawn from its kind and colour, so pots that share one share it)
//   lekythosParked() -> a mesh of the pots' material for the warm-up (never disposed)   lekythosShared() -> { paintings, geometries } (live)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WARE, paintMeander, paintTongues, paintPalmette, paintLikeness, paintStele } from '../blackfigure.js';
import { wheelColour } from '../wheelcolour.js';
import { COLOR } from '../../progress/weather.js';

/** The numbers: the pot's height (metres), its canvas (around, along), lathe segments, the white ground's colour. */
export const LEKYTHOS = { height: 0.62, canvas: [512, 1024], segments: 40, white: '#efe8da' };

// the profile (r, y) at a height of 0.958, from the foot's centre up the outside and down into the mouth; where the paint changes on it
const PROFILE = [[0, 0], [0.098, 0], [0.104, 0.008], [0.104, 0.022], [0.096, 0.03], [0.07, 0.034], [0.058, 0.042], [0.062, 0.052], [0.09, 0.062],
  [0.118, 0.08], [0.13, 0.105], [0.134, 0.14], [0.137, 0.25], [0.14, 0.36], [0.143, 0.48], [0.146, 0.6], [0.146, 0.62], [0.143, 0.632], [0.134, 0.645],
  [0.118, 0.659], [0.095, 0.672], [0.066, 0.683], [0.05, 0.69], [0.044, 0.7], [0.043, 0.76], [0.046, 0.79], [0.05, 0.8], [0.058, 0.83], [0.07, 0.87],
  [0.082, 0.91], [0.088, 0.935], [0.089, 0.95], [0.082, 0.958], [0.07, 0.958], [0.064, 0.95], [0.058, 0.92], [0.05, 0.89], [0.001, 0.88]];
const TOP = 0.958;
const AT = { reserve: 0.172, field: 0.195, meander: [0.548, 0.606], shoulder: 0.62, neck: 0.69 };

const MAT_KEY = 'garden-lekythos-1';
let PARKED = null;
const PAINTINGS = new Map(), GEOS = new Map(); // (kind|colour -> { map, mat, users }; height -> { geo, users })
const ROUGH = /* glsl */`
  {
    float lumK = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
    roughnessFactor = mix(0.3, 0.86, smoothstep(0.015, 0.09, lumK)); // (the black is glossy, the white and the colours matt)
  }
`;
function potMaterial(map) {
  const m = new THREE.MeshStandardMaterial({ name: 'garden-lekythos', map, roughness: 0.8, metalness: 0 });
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${ROUGH}`); };
  m.customProgramCacheKey = () => MAT_KEY;
  return m;
}

/** A colour from anything the callers hold; a feeling's canon colour when it holds none. */
function toColour(c, feeling) {
  if (c && typeof c === 'object' && 'h' in c && 's' in c) return wheelColour(c.h, c.s);
  if (c && c.isColor) return c.clone();
  return new THREE.Color(c ?? COLOR[feeling] ?? 0x8fb0ff);
}
/** The painting's colours (CSS, sRGB: rule 87): the line a dark of the colour, the wash it thinned, the border's colour kept off the white. */
function paletteOf(colour) {
  const hsl = colour.getHSL({}, THREE.SRGBColorSpace), c = new THREE.Color();
  const line = c.setHSL(hsl.h, Math.max(0.45, hsl.s), Math.min(hsl.l, 0.26), THREE.SRGBColorSpace).getStyle(THREE.SRGBColorSpace);
  const border = c.setHSL(hsl.h, Math.max(0.5, hsl.s), Math.min(hsl.l, 0.5), THREE.SRGBColorSpace).getStyle(THREE.SRGBColorSpace);
  const s = colour.getRGB({}, THREE.SRGBColorSpace), [r, g, b] = [s.r, s.g, s.b].map((x) => Math.round(THREE.MathUtils.clamp(x, 0, 1) * 255));
  return { line, border, wash: `rgba(${r}, ${g}, ${b}, 0.38)` };
}
function seeded(n) { let h = (n * 2654435761) >>> 0 || 1; return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }

/** The profile's arc length at each point (the canvas runs along it, so nothing painted is stretched where the shoulder turns). */
function arcs() { const s = [0]; for (let i = 1; i < PROFILE.length; i++) s.push(s[i - 1] + Math.hypot(PROFILE[i][0] - PROFILE[i - 1][0], PROFILE[i][1] - PROFILE[i - 1][1])); return s; }
const ARC = arcs(), TOTAL = ARC[ARC.length - 1];
/** The arc length where the outside of the pot reaches a height (its first crossing). */
function arcAt(y) { for (let i = 1; i < PROFILE.length; i++) if (PROFILE[i][1] >= y) { const k = (y - PROFILE[i - 1][1]) / Math.max(1e-6, PROFILE[i][1] - PROFILE[i - 1][1]); return ARC[i - 1] + (ARC[i] - ARC[i - 1]) * k; } return TOTAL; }

/** The pot's painting: its parts by height, the meander, the shoulder, the picture, the flaking. */
function paintPot(colour, kind, seed) {
  const [W, H] = LEKYTHOS.canvas, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), Y = (y) => (1 - arcAt(y) / TOTAL) * H, P = paletteOf(colour), rnd = seeded(seed);
  g.fillStyle = WARE.black; g.fillRect(0, 0, W, H);
  // the white: the shoulder and the body's field
  const yField = Y(AT.field), yNeck = Y(AT.neck), yShoulder = Y(AT.shoulder), b0 = Y(AT.meander[1]), b1 = Y(AT.meander[0]);
  g.fillStyle = LEKYTHOS.white; g.fillRect(0, yNeck + 2, W, yShoulder - yNeck - 4); g.fillRect(0, b0 - 3, W, yField - b0 + 3);
  // the meander in the colour, a whole number of its repeats round the pot (seamless at the back)
  const n = 26, bh = (W * 54) / (17.6 * n);
  g.save(); g.beginPath(); g.rect(0, b0, W, b1 - b0); g.clip(); paintMeander(g, 0, (b0 + b1) / 2 - bh / 2, W, bh, P.border); g.restore();
  // under the shoulder's edge two lines of the black; at the neck a tongue border; three palmettes on the shoulder, the middle one front
  g.fillStyle = WARE.black; g.fillRect(0, yShoulder - 4, W, 3); g.fillRect(0, b0 - 8, W, 2);
  const tg = Math.max(8, (yShoulder - yNeck) * 0.28); paintTongues(g, 0, yNeck, W, tg);
  for (const fx of [0.31, 0.5, 0.69]) paintPalmette(g, fx * W, yShoulder - 6, (yShoulder - yNeck - tg) * 0.92);
  // the lower body's line reserved in the clay
  g.fillStyle = WARE.clay; g.fillRect(0, Y(AT.reserve) - 1.5, W, 3);
  // the picture: the spirit's likeness at the front, its stele to the left
  // (both panels at one scale, so their groundlines meet; the scene kept within about 70 degrees of the front, where it is seen)
  const fh = yField - b0 - 12, top = b0 + 6, lw = W * 0.36, sw = lw / 2, cx = W * 0.5 + W * 0.05;
  paintStele(g, cx - lw / 2 - sw + lw * 0.12, top, sw, fh, { line: P.line, ribbon: P.border, ground: LEKYTHOS.white });
  paintLikeness(g, kind, cx - lw / 2, top, lw, fh, { line: P.line, wash: P.wash, ribbon: P.border, ground: LEKYTHOS.white });
  // the white flaked: small losses showing the clay under it, more toward the foot
  for (let i = 0; i < 140; i++) {
    const x = rnd() * W, y = b0 + (yField - b0) * Math.sqrt(rnd()), r = 0.6 + rnd() * 1.6;
    g.fillStyle = `rgba(200, 160, 120, ${(0.18 + rnd() * 0.25).toFixed(2)})`; g.beginPath(); g.ellipse(x, y, r * 1.4, r, rnd() * 3, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}

/** The pot's shape: the lathe, its canvas laid along the profile's arc, and the strap handle at the back (uv on the black). */
function potGeometry(height) {
  const k = height / TOP, pts = PROFILE.map(([r, y]) => new THREE.Vector2(r * k, y * k));
  const lathe = new THREE.LatheGeometry(pts, LEKYTHOS.segments, Math.PI, Math.PI * 2), uv = lathe.attributes.uv, np = pts.length;
  for (let i = 0; i < uv.count; i++) uv.setY(i, ARC[i % np] / TOTAL);
  const curve = new THREE.CatmullRomCurve3([[0, 0.655, -0.112], [0, 0.69, -0.142], [0, 0.745, -0.13], [0, 0.775, -0.085], [0, 0.77, -0.044]].map(([x, y, z]) => new THREE.Vector3(x, y * k, z * k)));
  const handle = new THREE.TubeGeometry(curve, 16, 0.011 * k, 6, false); handle.scale(1.9, 1, 1);
  const hu = handle.attributes.uv; for (let i = 0; i < hu.count; i++) hu.setXY(i, 0.0, ARC[np - 8] / TOTAL);
  const geo = mergeGeometries([lathe.toNonIndexed(), handle.toNonIndexed()]); lathe.dispose(); handle.dispose();
  geo.computeBoundingSphere(); return geo;
}

/** The painting a pot of this kind and colour wears, painted once and shared (its flaking seeded by the key, so it is the same each time). */
function paintingOf(colour, kind) {
  const key = `${kind ?? 'slipjelly'}|${colour.getHexString()}`;
  let p = PAINTINGS.get(key);
  if (!p) {
    let h = 7; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const map = paintPot(colour, kind, h || 1); p = { key, map, mat: potMaterial(map), users: 0 }; PAINTINGS.set(key, p);
  }
  p.users++; return p;
}
function geometryOf(height) {
  let q = GEOS.get(height);
  if (!q) { q = { height, geo: potGeometry(height), users: 0 }; GEOS.set(height, q); }
  q.users++; return q;
}

/** A keepsake pot. */
export function lekythos({ colour, feeling, spirit = null, height = LEKYTHOS.height } = {}) {
  const rec = spirit && typeof spirit === 'object' ? spirit : null, kind = typeof spirit === 'string' ? spirit : rec?.kind ?? null;
  const P = paintingOf(toColour(colour ?? rec?.colour, feeling ?? rec?.feeling), kind), Q = geometryOf(height);
  const mesh = new THREE.Mesh(Q.geo, P.mat); mesh.name = 'keepsake-lekythos'; mesh.castShadow = true; mesh.receiveShadow = true;
  P.mat.userData.shared = true; // (freed by its last pot, never by a holder sweeping its children: workbench.js)
  const group = new THREE.Group(); group.name = 'keepsake-pot'; group.add(mesh);
  let gone = false;
  return {
    group, mesh,
    dispose() {
      if (gone) return; gone = true; group.parent?.remove(group);
      if (--Q.users <= 0) { GEOS.delete(Q.height); Q.geo.dispose(); }
      if (--P.users <= 0) { PAINTINGS.delete(P.key); P.mat.dispose(); P.map.dispose(); }
    },
  };
}

/** How many paintings and pot shapes are alive (the sweeps and the review read it). */
export function lekythosShared() { return { paintings: PAINTINGS.size, geometries: GEOS.size }; }

/** A small pot of the pots' material for the warm-up (the program the garden will draw; never disposed). */
export function lekythosParked() {
  if (PARKED) return PARKED;
  const P = lekythos({ colour: 0x8fb0ff, height: 0.1 }); PARKED = P.mesh; PARKED.name = 'keepsake-lekythos-parked'; // (its painting's count is never let down)
  return PARKED;
}
