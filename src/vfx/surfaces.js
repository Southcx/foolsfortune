// ---------------------------------------------------------------------------------------
// SURFACES: what the built world is made of. Every static box the level builds (level.box / addGeo, merged per zone and colour) was
// a flat colour; here each colour is dressed with a small tiling detail texture, so a wall reads as plaster, a floor as fired tiles,
// a beam or a crate as planks, the way the era's rooms did it: one modest texture repeated at an even texel density, multiplying a
// colour that still carries the palette.
//
// Prior art: the PS2's tiling 128 px textures over vertex colour (Dark Cloud 2's Palm Brinks, Ico's castle, Jak & Daxter's huts),
// where the texture is detail and the colour is the art direction; and box ("cube") mapping, the level editors' default for
// brushes (Quake's and Unreal's world-aligned texturing): a face takes the texture along whichever axis it faces most nearly, so a
// box of any size is textured at the same density with no UVs authored. (The level's merged geometry has no UVs left: level.js.)
//
// One 128 x 128 RGBA texture holds four greyscale patterns, one per channel (R plaster, G planks, B tiles, A brick), drawn here
// from noise once at startup; a material picks its pattern for floors and for walls with two weights (a dot product, one sampler).
// The projection uses the OBJECT's own position, so the merged statics (built in world space) line up across boxes, and a moving
// platform carries its texture with it rather than sliding through it. Mipmapped and filtered: nothing crawls at a distance.
//
//   dress(material, color)     called by Level.mat(): picks the pattern from the colour (PALETTE), leaves others on the defaults
//   SURFACE                    the table: colour -> { floor, wall, k } (k: how strongly the detail shows)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../config.js';

const N = 128;            // texels a side
const METRES = 2;         // one tile of the texture covers 2 m: 64 texels a metre, the era's density for a wall seen at a few metres

// the patterns, as channel weights
const P = { plaster: [1, 0, 0, 0], planks: [0, 1, 0, 0], tiles: [0, 0, 1, 0], brick: [0, 0, 0, 1] };

// which colour is made of what (anything not listed: tiles underfoot, plaster on the walls, gently)
export const SURFACE = {
  [PALETTE.wall]: { floor: 'plaster', wall: 'plaster', k: 0.32 },
  [PALETTE.floor]: { floor: 'tiles', wall: 'plaster', k: 0.38 },
  [PALETTE.wood]: { floor: 'planks', wall: 'planks', k: 0.42 },
  [PALETTE.mid]: { floor: 'planks', wall: 'planks', k: 0.34 },
  [PALETTE.dark]: { floor: 'planks', wall: 'planks', k: 0.3 },
  [PALETTE.deep]: { floor: 'plaster', wall: 'plaster', k: 0.22 },
};
const DEFAULT = { floor: 'tiles', wall: 'plaster', k: 0.22 };

// --- the patterns ------------------------------------------------------------------------
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Tileable value noise at a cell size that divides N, smoothstepped. */
function noise(cells, seed) {
  const r = rng(seed), g = new Float32Array(cells * cells).map(() => r());
  const out = new Float32Array(N * N), s = N / cells;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const fx = x / s, fy = y / s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const ux = tx * tx * (3 - 2 * tx), uy = ty * ty * (3 - 2 * ty);
    const at = (i, j) => g[((j % cells) * cells) + (i % cells)];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    out[y * N + x] = (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy;
  }
  return out;
}
const fbm = (seed, octaves) => { const o = new Float32Array(N * N); let amp = 0.5, tot = 0; for (const [cells, k] of octaves.map((c, i) => [c, i])) { const n = noise(cells, seed + k * 101); for (let i = 0; i < o.length; i++) o[i] += n[i] * amp; tot += amp; amp *= 0.5; } for (let i = 0; i < o.length; i++) o[i] /= tot; return o; };

function plaster() {
  // broad blotches of a trowelled wall and a fine grain over them
  const big = fbm(11, [4, 8, 16]), fine = noise(64, 7);
  return big.map((v, i) => 0.72 + 0.34 * v + 0.1 * (fine[i] - 0.5));
}

function planks() {
  // boards 1/4 of the tile wide (25 cm), running along x, each its own shade, with a dark seam, grain streaks and staggered butt ends
  const out = new Float32Array(N * N), r = rng(23), rows = 8, h = N / rows;
  const shade = Array.from({ length: rows }, () => 0.82 + 0.2 * r()), butt = Array.from({ length: rows }, () => Math.floor(r() * N));
  const grain = noise(32, 29), streak = Array.from({ length: N }, (_, y) => Math.sin(y * 1.7 + Math.sin(y * 0.31) * 3) * 0.5 + 0.5);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const row = Math.floor(y / h), yy = y - row * h;
    let v = shade[row] * (0.9 + 0.12 * streak[y] * (0.6 + 0.8 * grain[y * N + x]));
    if (yy === 0) v *= 0.45; else if (yy === 1 || yy === h - 1) v *= 0.8; // the seam and its soft shoulders
    const dx = (x - butt[row] + N) % N;
    if (dx === 0) v *= 0.5; else if (dx === 1) v *= 0.82;
    out[y * N + x] = v;
  }
  return out;
}

function tiles() {
  // square fired tiles, 4 to the tile (50 cm), each its own firing, with a recessed grout line
  const out = new Float32Array(N * N), r = rng(41), n = 4, s = N / n;
  const shade = Array.from({ length: n * n }, () => 0.8 + 0.24 * r()), mottle = fbm(43, [8, 16, 32]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = Math.floor(x / s), j = Math.floor(y / s), lx = x - i * s, ly = y - j * s;
    let v = shade[j * n + i] * (0.88 + 0.22 * mottle[y * N + x]);
    const e = Math.min(lx, ly, s - 1 - lx, s - 1 - ly);
    if (e === 0) v = 0.42; else if (e === 1) v *= 0.78; else if (e === 2) v *= 1.06; // grout, the tile's lip, a catch of light on its edge
    out[y * N + x] = v;
  }
  return out;
}

function brick() {
  // running bond, 8 courses to the tile (25 cm), half-brick offset, mortar recessed
  const out = new Float32Array(N * N), r = rng(57), courses = 8, ch = N / courses, bw = N / 4;
  const shade = new Map(), mottle = fbm(59, [16, 32]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = Math.floor(y / ch), ly = y - c * ch, ox = (c % 2) * bw / 2, b = Math.floor(((x + ox) % N) / bw), lx = (x + ox) % N - b * bw;
    const key = c * 8 + b;
    if (!shade.has(key)) shade.set(key, 0.78 + 0.26 * r());
    let v = shade.get(key) * (0.9 + 0.18 * mottle[y * N + x]);
    if (ly === 0 || lx === 0) v = 0.5; else if (ly === 1 || lx === 1) v *= 0.82;
    out[y * N + x] = v;
  }
  return out;
}

let _tex = null;
function texture() {
  if (_tex) return _tex;
  const ch = [plaster(), planks(), tiles(), brick()];
  const data = new Uint8Array(N * N * 4);
  // stored as v / 2 (0..2 -> 0..255): the shader doubles it back, so the patterns can brighten as well as darken around 1
  for (let i = 0; i < N * N; i++) for (let c = 0; c < 4; c++) data[i * 4 + c] = Math.max(0, Math.min(255, Math.round(ch[c][i] * 0.5 * 255)));
  _tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  _tex.wrapS = _tex.wrapT = THREE.RepeatWrapping;
  _tex.magFilter = THREE.LinearFilter;
  _tex.minFilter = THREE.LinearMipmapLinearFilter; // (trilinear: no crawl as a floor recedes)
  _tex.generateMipmaps = true;
  _tex.anisotropy = 4;
  _tex.colorSpace = THREE.NoColorSpace;
  _tex.needsUpdate = true;
  return _tex;
}

// --- the dressing -------------------------------------------------------------------------
const VERT_DECL = 'varying vec3 vSurfP;\nvarying vec3 vSurfN;\n';
const FRAG_DECL = `varying vec3 vSurfP;
varying vec3 vSurfN;
uniform sampler2D surfTex;
uniform vec4 surfFloor;
uniform vec4 surfWall;
uniform float surfK;
`;
const FRAG = `
  {
    vec3 an = abs(vSurfN);
    vec2 suv = an.y >= an.x && an.y >= an.z ? vSurfP.xz : (an.x >= an.z ? vSurfP.zy : vSurfP.xy);
    vec4 tx = texture2D(surfTex, suv * ${(1 / METRES).toFixed(4)}) * 2.0;
    float d = dot(tx, an.y > 0.7 ? surfFloor : surfWall);
    diffuseColor.rgb *= mix(1.0, d, surfK);
  }
`;

/** Dress a level material with the pattern its colour is made of. Safe to call once per material. */
export function dress(material, color) {
  const s = SURFACE[color] || DEFAULT;
  const uniforms = {
    surfTex: { value: texture() },
    surfFloor: { value: new THREE.Vector4(...P[s.floor]) },
    surfWall: { value: new THREE.Vector4(...P[s.wall]) },
    surfK: { value: s.k },
  };
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vSurfP = position;\n  vSurfN = normal;');
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>${FRAG}`);
  };
  const key = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `surf|${key ? key() : ''}`;
  material.userData.surface = s;
  return material;
}
