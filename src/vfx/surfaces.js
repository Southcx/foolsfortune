// ---------------------------------------------------------------------------------------
// SURFACES: what the built world is made of. Every static box the level builds (level.box / addGeo, merged per zone and colour) was
// a flat colour; here each colour is dressed with a small tiling detail texture, so a wall reads as plaster, a floor as fired tiles,
// a beam or a crate as planks, the way the era's rooms did it: one modest texture repeated at an even texel density, multiplying a
// colour that still carries the palette. A room glaze's colour id (vfx/roomglazes.js `ROOM_GLAZE_ID`) is dressed with its clay body's
// pattern and then the glaze fired over it, drawn from the room glaze atlas: where it lies, where it pools thick or runs thin, its
// specks, its orange peel, its gloss and the room's light at the turn of the glass. The same program for every colour: a palette
// colour has no glaze (its cover is 0) and draws as it always did.
//
// Prior art: the PS2's tiling 128 px textures over vertex colour (Dark Cloud 2's Palm Brinks, Ico's castle, Jak & Daxter's huts),
// where the texture is detail and the colour is the art direction; and box ("cube") mapping, the level editors' default for
// brushes (Quake's and Unreal's world-aligned texturing): a face takes the texture along whichever axis it faces most nearly, so a
// box of any size is textured at the same density with no UVs authored. (The level's merged geometry has no UVs left: level.js.)
// The glaze's model is how a glaze fires: it gathers where it can lie (the floor-facing faces, the recesses of the body: mortar,
// grout, a seam) and runs thin and breaks over what stands proud, and a glaze laid only where the fire put it (the kilns' ash) lies
// on top and runs down the sides in rivulets.
//
// One 128 x 128 RGBA texture holds four greyscale patterns, one per channel (R plaster, G planks, B tiles, A brick), drawn here
// from noise once at startup; a material picks its pattern for floors and for walls with two weights (a dot product, one sampler).
// The projection uses the OBJECT's own position, so the merged statics (built in world space) line up across boxes, and a moving
// platform carries its texture with it rather than sliding through it. Mipmapped and filtered: nothing crawls at a distance.
// The room glaze atlas is a second 128 x 128 RGBA texture, a metre a tile (R the pooling, read again at 2.7 m a tile and the two mixed,
// so a long wall does not repeat; G the runs; B the orange peel; A the specks), its finest mark 4 texels (3 cm, three pixels at 4 m at 480 lines),
// mipmapped to plain tone beyond: no crackle, no trailed line, nothing a pixel wide.
//
//   dress(material, color)     called by Level.mat(): picks the pattern (and a room glaze) from the colour, leaves others on the defaults
//   SURFACE                    the table: colour -> { floor, wall, k } (k: how strongly the detail shows)
//   glazeAtlas()               the room glaze atlas (one texture, made once)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../core/config.js';
import { roomGlazeOf } from './roomglazes.js';

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
  // running bond, 8 courses to the tile (25 cm), half-brick offset, mortar recessed: two texels and a shoulder (3 cm), never a line one
  // texel wide (it would crawl on a wall seen across the hub)
  const out = new Float32Array(N * N), r = rng(57), courses = 8, ch = N / courses, bw = N / 4;
  const shade = new Map(), mottle = fbm(59, [16, 32]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = Math.floor(y / ch), ly = y - c * ch, ox = (c % 2) * bw / 2, b = Math.floor(((x + ox) % N) / bw), lx = (x + ox) % N - b * bw;
    const key = c * 8 + b;
    if (!shade.has(key)) shade.set(key, 0.78 + 0.26 * r());
    let v = shade.get(key) * (0.9 + 0.18 * mottle[y * N + x]);
    if (ly <= 1 || lx <= 1) v = 0.56; else if (ly === 2 || lx === 2) v *= 0.84;
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

// --- the room glaze atlas ------------------------------------------------------------------
const GLAZE_METRES = 1; // one tile a metre (128 texels a metre); the pooling is read again at 2.7 m a tile and the two mixed (FRAG)
const stretch = (a) => { let lo = Infinity, hi = -Infinity; for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); } return a.map((v) => (v - lo) / Math.max(1e-6, hi - lo)); };
const wrap = (i) => ((i % N) + N) % N;

function pooling() {
  // where a glaze gathers thick or runs thin: soft blotches of 50, 25 and 12 cm over each other (the shader reads it at two scales)
  return stretch(fbm(71, [2, 4, 8]));
}

function runs() {
  // rivulets down a wall-facing face (v is up): each starts thin, widens and ends in a bead, 8 to 15 texels wide (6 to 12 cm), a wobble
  const out = new Float32Array(N * N), r = rng(83);
  for (let k = 0; k < 6; k++) {
    const cx = r() * N, top = r() * N, len = 40 + r() * 60, w = 4 + r() * 3.5, ph = r() * 6.28, amp = 0.6 + r() * 1.6;
    for (let dy = 0; dy <= len + w; dy++) {
      const t = dy / len, y = wrap(Math.floor(top - dy));
      const xc = cx + Math.sin(ph + dy * 0.08) * amp;
      const ww = w * (0.55 + 0.45 * Math.min(1, t * 1.6)) * (t > 0.82 ? 1 + (Math.min(t, 1) - 0.82) * 2.2 : 1); // (thin at its head, a bead at its foot)
      const v = Math.min(1, t * 5) * (t > 1 ? Math.max(0, 1 - ((t - 1) * len) / w) : 1);
      for (let dx = -Math.ceil(ww) - 1; dx <= Math.ceil(ww) + 1; dx++) {
        const xi = Math.floor(xc) + dx, e = Math.abs(xi + 0.5 - xc) / ww;
        if (e >= 1) continue;
        const o = y * N + wrap(xi), p = Math.cos(e * Math.PI / 2) ** 2 * v;
        if (p > out[o]) out[o] = p;
      }
    }
  }
  return out;
}

function peel() {
  // orange peel: the dimpled skin of a salt glaze or a shino, cells of 8 and 16 texels (6 and 12 cm: anything finer crawls on a wall)
  const a = noise(16, 89), b = noise(8, 91);
  return stretch(a.map((v, i) => 0.65 * v + 0.35 * b[i]));
}

function specks() {
  // round specks 4 to 7 texels across (3 to 5.5 cm): iron, ash, rust or a pinhole, as the row says; soft at the edge
  const out = new Float32Array(N * N), r = rng(97);
  for (let k = 0; k < 64; k++) {
    const cx = r() * N, cy = r() * N, rad = 2 + r() * 1.6, s = 0.6 + 0.4 * r();
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const xi = Math.floor(cx) + dx, yi = Math.floor(cy) + dy, d = Math.hypot(xi + 0.5 - cx, yi + 0.5 - cy) / rad;
      if (d >= 1) continue;
      const o = wrap(yi) * N + wrap(xi), p = s * (1 - d * d) ** 1.5;
      if (p > out[o]) out[o] = p;
    }
  }
  return out;
}

let _glaze = null;
/** The room glaze atlas: R the pooling, G the runs, B the orange peel, A the specks (each 0..1), a metre a tile, mipmapped. */
export function glazeAtlas() {
  if (_glaze) return _glaze;
  const ch = [pooling(), runs(), peel(), specks()];
  const data = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) for (let c = 0; c < 4; c++) data[i * 4 + c] = Math.max(0, Math.min(255, Math.round(ch[c][i] * 255)));
  _glaze = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  _glaze.wrapS = _glaze.wrapT = THREE.RepeatWrapping;
  _glaze.magFilter = THREE.LinearFilter;
  _glaze.minFilter = THREE.LinearMipmapLinearFilter; // (trilinear: the runs and specks fade to an even film with distance, never crawl)
  _glaze.generateMipmaps = true;
  _glaze.anisotropy = 4;
  _glaze.colorSpace = THREE.NoColorSpace;
  _glaze.needsUpdate = true;
  return _glaze;
}

// --- the dressing -------------------------------------------------------------------------
const VERT_DECL = 'varying vec3 vSurfP;\nvarying vec3 vSurfN;\n';
const FRAG_DECL = `varying vec3 vSurfP;
varying vec3 vSurfN;
uniform sampler2D surfTex;
uniform vec4 surfFloor;
uniform vec4 surfWall;
uniform float surfK;
uniform sampler2D glazeTex;
uniform vec4 glazeThick; // (rgb where it pools thick; a how clear: the body's relief seen through it)
uniform vec4 glazeThin;  // (rgb where it runs thin or breaks; a the orange peel)
uniform vec4 glazeSpeck; // (rgb the specks; a how many)
uniform vec4 glazeCover; // (x on floor-facing faces, y on wall-facing faces, z the runs, w the pooling's say: at its edge, in its thickness)
uniform vec4 glazeGloss; // (x the glass's roughness, y its sheen, z how thick it lies, w how much more it pools in a recess)
`;
const FRAG = `
  float glazeAmt = 0.0; vec4 glazeF = vec4(0.5);
  {
    vec3 an = abs(vSurfN);
    vec2 suv = an.y >= an.x && an.y >= an.z ? vSurfP.xz : (an.x >= an.z ? vSurfP.zy : vSurfP.xy);
    vec4 tx = texture2D(surfTex, suv * ${(1 / METRES).toFixed(4)}) * 2.0;
    float d = dot(tx, an.y > 0.7 ? surfFloor : surfWall);
    diffuseColor.rgb *= mix(1.0, d, surfK);
    if (glazeCover.x + glazeCover.y > 0.0) { // (a room glaze: vfx/roomglazes.js)
      glazeF = texture2D(glazeTex, suv * ${(1 / GLAZE_METRES).toFixed(4)});
      float pool = clamp((0.62 * texture2D(glazeTex, suv * 0.37 + vec2(0.29, 0.61)).r + 0.38 * glazeF.r - 0.5) * 1.3 + 0.5, 0.0, 1.0); // (2.7 m and 1 m a tile: a long wall never shows the repeat)
      float up = vSurfN.y / max(length(vSurfN), 1e-4);
      float face = smoothstep(0.35, 0.85, up); // (1 floor-facing: where a glaze lies and the ash lands)
      float run = glazeF.g * glazeCover.z * (1.0 - face) * smoothstep(0.05, 0.5, up) * smoothstep(0.35, 0.7, pool); // (down the sides from where it gathered, dying out toward the foot)
      float cover = mix(glazeCover.y, glazeCover.x, face) + (pool - 0.5) * glazeCover.w + run;
      float cw = 0.08 + fwidth(cover);
      glazeAmt = smoothstep(0.5 - cw, 0.5 + cw, cover);
      float thick = clamp(glazeGloss.z + (pool - 0.5) * (0.4 + 1.4 * glazeCover.w) + 0.3 * face + (1.0 - d) * glazeGloss.w + 0.5 * glazeF.g * glazeCover.z * (1.0 - face), 0.0, 1.0);
      vec3 gc = mix(glazeThin.rgb, glazeThick.rgb, thick);
      gc *= 1.0 + (glazeF.b - 0.5) * 0.3 * glazeThin.a; // (orange peel)
      gc = mix(gc, glazeSpeck.rgb, glazeF.a * glazeSpeck.a * (1.0 - 0.6 * thick)); // (specks show where it is thin)
      gc *= mix(1.0, d, glazeThick.a * surfK); // (a clear glaze shows the body's relief)
      diffuseColor.rgb = mix(diffuseColor.rgb, gc, glazeAmt);
    }
  }
`;
// the glass's gloss, after the roughness is read (and after the paint's, whichever runs first: a glaze only ever makes it glossier)
const ROUGH = `
  roughnessFactor = min(roughnessFactor, mix(1.0, glazeGloss.x * (1.0 + (glazeF.b - 0.5) * 0.6 * glazeThin.a), glazeAmt));`;
// the glass's sheen: the room's own light (ambient and hemisphere) taken as a dim even surround and reflected by the standard BRDF, so it
// shows at the turn of the glass (its Fresnel) and not face on; the scene has no environment map to reflect
const SHEEN = `
#if defined( RE_IndirectSpecular ) && defined( RE_IndirectDiffuse )
  radiance += glazeAmt * glazeGloss.y * irradiance * RECIPROCAL_PI;
#endif
`;

const ZERO = () => new THREE.Vector4(0, 0, 0, 0);
const rgba = (hex, a) => { const c = new THREE.Color(hex); return new THREE.Vector4(c.r, c.g, c.b, a); };

/** Dress a level material with the pattern its colour is made of, and the room glaze fired over it if the colour is one's id. */
export function dress(material, color) {
  const g = roomGlazeOf(color);
  const s = g ? g.clay : SURFACE[color] || DEFAULT;
  const uniforms = {
    surfTex: { value: texture() },
    surfFloor: { value: new THREE.Vector4(...P[s.floor]) },
    surfWall: { value: new THREE.Vector4(...P[s.wall]) },
    surfK: { value: s.k },
    glazeTex: { value: glazeAtlas() },
    glazeThick: { value: g ? rgba(g.thick, g.clear) : ZERO() },
    glazeThin: { value: g ? rgba(g.thin, g.peel) : ZERO() },
    glazeSpeck: { value: g ? rgba(g.speck, g.specks) : ZERO() },
    glazeCover: { value: g ? new THREE.Vector4(g.cover[0], g.cover[1], g.runs, g.pool) : ZERO() },
    glazeGloss: { value: g ? new THREE.Vector4(g.gloss, g.sheen, g.fat, g.recess) : ZERO() },
  };
  if (g) material.roughness = g.bodyRough; // (the bare body's; the glass's is the shader's)
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vSurfP = position;\n  vSurfN = normal;');
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>${FRAG}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>${ROUGH}`)
      .replace('#include <lights_fragment_end>', `${SHEEN}#include <lights_fragment_end>`);
  };
  const key = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `surf|${key ? key() : ''}`;
  material.userData.surface = s;
  if (g) material.userData.roomGlaze = g.key;
  return material;
}
