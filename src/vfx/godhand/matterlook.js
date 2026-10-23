// ---------------------------------------------------------------------------------------
// THE MATTER'S LOOK (docs/plans/GODHAND.md section 9; Dovina's handoff of 2026-10-13): what the god hand's matter is drawn with, by the
// island it belongs to (godhand/matter.js `GROUND`: on Anagami, clay and sand). One program for all of it, a branch on a uniform a role
// (CASEBOOK rules 5 and 124): the island's matter laid on the ground, the ball the hand holds, and the hand's voxel creations.
//
//   THE GROUND'S LAYERS  the firm layer (Anagami's clay) mottled damp and dry by the room glaze atlas's pooling, its iron specks and the
//                        orange peel's tooth; the loose layer (the sand) grained by the peel, its grit by the specks, paler where the
//                        wind sorted it; the two blended cell by cell by the loose share. THE SEAM where it thins onto the authored
//                        ground is a lip: a contact shade and the clay wetter there, as a heap's foot is, never a hard colour cut.
//   A CREATION           raised, greenware: leather-hard clay, matte, a little darker where it is wetter. SET (on Anagami it looks
//                        fired: REGISTERS.md 6) it is the anagama's ware: the body toasted, the flame's FLASHING blushing across it, ASH
//                        specks on what faced the fire, and the natural ash glaze (ROOM_GLAZES.ash, the kilns' own) pooling glassy on top
//                        and running down the sides. As THE MENDING eats it (densities falling evenly, the surface walking in) the clay
//                        dries pale and CRAZES, a cell net opening and its hairlines widening (frostbisque.js's 'craze', fixed in the
//                        world), faded out under three pixels a cell so it never crawls at 480 lines.
//   LACHRYMA             on the ground: the house's own liquid, the shared Lachryma instance of vfx/water.js (the Weir's Well's: its
//                        clock, its film, its meniscus), the field's leading feeling and its ice told to it through `aDepth`'s code
//                        (`liquidDepth`); in the hand's ball: ink, glossy, the thin film's colours at the turn (liquid.js's `liqFilm`).
//   THE BALL             a lumpy icosahedron (`lumpyBall`) in the look of what it holds, turning.
//
// Prior art: the room glaze atlas and its triplanar taps (vfx/surfaces.js: Geiss, GPU Gems 3 ch. 1) and the ash glaze's row
// (vfx/roomglazes.js); frostbisque.js's crazing net (Worley's F2 - F1) and its pixel fade; From Dust's matter drawn as layered skins;
// the anagama's firing as it really marks a pot (Bizen's hi-iro flashing and goma ash, Shigaraki's bidoro glass running in beads);
// greenware's leather-hard to bone-dry, the clay paling and crazing as it dries.
//
//   matterMaterial(role, island?)   role: 'ground' | 'creation' | 'set' | 'lachryma': a shared MeshStandardMaterial (userData.shared)
//   matterAttrs(geo, count)          gives a geometry the look's attributes (`aMl`: loose share, thickness, craze; and a white `color`)
//   lumpyBall()                      the held ball's geometry, its attributes given
//   lachrymaSkin(game)               the shared Lachryma liquid material (game.water's), or null
//   liquidDepth(depth, tint, k, hide) the `aDepth` code the Lachryma skin reads (tint: -1 none, 0..6 a feeling in DISPLAY_ORDER, 7 ice)
//   tickMatterLook(dt)               the look's own clock (the ball's film)   prewarm(scene) -> park()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { glazeAtlas } from '../surfaces.js';
import { ROOM_GLAZES } from '../roomglazes.js';
import { makeWaterMaterial, WATER_TINTS } from '../water.js';
import { COLOR, DISPLAY_ORDER } from '../../progress/weather.js';
import { groundOf } from '../../godhand/matter.js';

/** Each island's dress for its two layers and its fired ware (the bodies are GROUND's colours; the rest the look's). A new island adds its
 *  row; one missing falls back to Anagami's. Roughness: [firm, loose, fired body, glaze]. */
export const MATTER_LOOK = {
  anagami: {
    firmDamp: 0x6e3a24, firmSpeck: 0x4a2416, // (the clay wet, and its iron)
    looseLight: 0xeed7a2, looseGrit: 0x8c6a44, // (the sand sorted pale by the wind, and its dark grains)
    flash: 0xc8602e, ash: 0xa48a4c, glaze: 'ash', // (the flame's blush, the goma ash, the kiln's natural ash glaze)
    rough: [0.92, 0.97, 0.86, 0.42],
  },
};
const lookOf = (island) => MATTER_LOOK[island] || MATTER_LOOK.anagami;
const ROLE = { ground: 0, creation: 1, set: 1, lachryma: 2 };

/** The look's clock (rule 121: passed down by the caller's frame). */
const ML_TIME = { value: 0 };
export const tickMatterLook = (dt) => { ML_TIME.value = (ML_TIME.value + dt) % 600; };

const VERT_DECL = 'attribute vec4 aMl;\nvarying vec3 vMlP;\nvarying vec3 vMlN;\nvarying vec4 vMl;\n';
const FRAG_DECL = /* glsl */`
varying vec3 vMlP;
varying vec3 vMlN;
varying vec4 vMl;
uniform sampler2D mlAtlas;
uniform float mlKind, mlSet, mlTime;
uniform vec3 mlFirm, mlFirmDamp, mlFirmSpeck, mlLoose, mlLooseLight, mlLooseGrit, mlFlash, mlAsh, mlGlazeThick, mlGlazeThin, mlTint;
uniform vec4 mlRoughs;
float mlRough = 1.0; float mlWide = 0.5;
float mlHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mlCells(vec3 p) { // (F2 - F1 of a cell net: 0 on an edge; frostbisque.js's)
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), o = vec3(mlHash(i + g), mlHash(i + g + 17.3), mlHash(i + g + 41.9));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
vec4 mlTri(vec3 p, vec3 tw) { return tw.y * texture2D(mlAtlas, p.xz) + tw.x * texture2D(mlAtlas, p.zy) + tw.z * texture2D(mlAtlas, p.xy); }
`;
const FRAG = /* glsl */`
  float mlFw = length(fwidth(vMlP)); // (metres a pixel, taken where every fragment runs)
  {
    vec3 an = abs(vMlN); vec3 tw = an * an; tw *= tw; tw /= tw.x + tw.y + tw.z + 1e-5;
    vec4 A = mlTri(vMlP, tw);
    mlWide = mlTri(vMlP * 0.37 + vec3(0.29, 0.13, 0.61), tw).r;
    float pool = clamp((0.62 * mlWide + 0.38 * A.r - 0.5) * 1.3 + 0.5, 0.0, 1.0);
    float up = vMlN.y / max(length(vMlN), 1e-4), face = smoothstep(0.35, 0.85, up);
    vec3 col;
    if (mlKind < 0.5) { // THE GROUND'S LAYERS
      float damp = smoothstep(0.5, 0.85, pool), lip = 1.0 - smoothstep(0.0, 0.8, vMl.y), s = vMl.x;
      vec3 firm = mix(mlFirm, mlFirmDamp, clamp(damp * 0.6 + lip * 0.45, 0.0, 1.0)) * (0.88 + 0.24 * A.b);
      firm = mix(firm, mlFirmSpeck, A.a * 0.5);
      vec3 loose = mlLoose * (0.86 + 0.28 * A.b);
      loose = mix(loose, mlLooseLight, smoothstep(0.55, 0.9, pool) * 0.45 * (0.4 + 0.6 * face));
      loose = mix(loose, mlLooseGrit, A.a * 0.5);
      col = mix(firm, loose, s) * (1.0 - lip * mix(0.2, 0.1, s)); // (the lip: a contact shade where it thins onto the authored ground)
      mlRough = mix(mlRoughs.x - 0.22 * clamp(damp + lip * 0.6, 0.0, 1.0), mlRoughs.y, s);
    } else if (mlKind < 1.5) { // A CREATION
      col = mlFirm * (0.86 + 0.28 * A.b);
      col = mix(col, mlFirmDamp, smoothstep(0.55, 0.9, pool) * 0.35);
      col = mix(col, mlFirmSpeck, A.a * 0.3);
      mlRough = mlRoughs.x;
      if (mlSet > 0.5) { // fired: toasted, the flame's flashing, ash on what faced the fire, the ash's glass on top and running down
        col *= vec3(1.06, 0.94, 0.86);
        col = mix(col, mlFlash, smoothstep(0.35, 0.8, mlWide) * 0.55);
        col = mix(col, mlAsh, A.a * face * 0.8);
        float cover = smoothstep(0.35, 0.65, face + (pool - 0.5) * 0.6);
        float run = clamp(A.g * 1.3 * (1.0 - face) * smoothstep(-0.25, 0.25, up) * smoothstep(0.3, 0.7, pool), 0.0, 1.0);
        float gl = max(cover, run), thick = clamp(0.5 + (pool - 0.5) * 1.2 + 0.3 * face, 0.0, 1.0);
        col = mix(col, mix(mlGlazeThin, mlGlazeThick, thick), gl);
        mlRough = mix(mlRoughs.z, mlRoughs.w, gl);
      }
      float k = vMl.z;
      if (k > 0.001) { // the mending eats it: the clay dries pale and crazes
        col = mix(col, col * 1.18 + vec3(0.04, 0.035, 0.03), 0.6 * k);
        float sc = 5.0, aa = max(mlFw * sc * 1.5, 1e-5), seen = smoothstep(2.5, 5.0, 1.0 / max(mlFw * sc, 1e-5));
        float e = mlCells(vMlP * sc), w = mix(0.006, 0.035, k), lw = max(w, aa * 1.2);
        float crack = (1.0 - smoothstep(lw - aa, lw + aa, e)) * seen * smoothstep(0.0, 0.15, k);
        float sh = (1.0 - smoothstep(lw * 2.6 - aa, lw * 2.6 + aa, e)) * seen * smoothstep(0.0, 0.15, k) - crack;
        col = mix(col, col * 1.12, sh * 0.5); col = mix(col, col * 0.55, crack * 0.8); // (drying clay's hairlines: a darker clay, never black; Calissa's look of 2026-10-23, a tortoise shell before)
        mlRough = mix(mlRough, 1.0, k);
      }
    } else { // LACHRYMA, held: ink, a feeling's colour deep in it
      col = mix(vec3(0.012, 0.01, 0.02), mlTint, 0.16);
      mlRough = 0.12;
    }
    diffuseColor.rgb = col;
  }
`;
const ROUGH = '\n  roughnessFactor = mlRough;';
const GLOW = /* glsl */`
  if (mlKind > 1.5) { // the thin film's colours at the turn of the ink (liquid.js's liqFilm), drifting
    float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (mlWide * 1.4 + fr * 0.8 + mlTime * 0.03 + vec3(0.0, 0.33, 0.67)));
    totalEmissiveRadiance += film * (0.03 + 0.45 * fr) + mlTint * 0.05;
  }
`;

const _mats = new Map();
/** The shared material for a role on an island ('ground', 'creation', 'set', 'lachryma'); `tint` for 'lachryma' (a hex, its feeling). */
export function matterMaterial(role, island = 'anagami') {
  const key = `${island}|${role}`;
  if (_mats.has(key)) return _mats.get(key);
  const G = groundOf(island), L = lookOf(island), gz = ROOM_GLAZES[L.glaze] || ROOM_GLAZES.ash, c = (h) => new THREE.Color(h);
  const m = new THREE.MeshStandardMaterial({ name: `matter-${role}`, vertexColors: true, alphaTest: 0.5, roughness: 0.9, metalness: 0 });
  const uniforms = {
    mlAtlas: { value: glazeAtlas() }, mlKind: { value: ROLE[role] ?? 0 }, mlSet: { value: role === 'set' ? 1 : 0 }, mlTime: ML_TIME,
    mlFirm: { value: c(G.firm.colour) }, mlFirmDamp: { value: c(L.firmDamp) }, mlFirmSpeck: { value: c(L.firmSpeck) },
    mlLoose: { value: c(G.loose.colour) }, mlLooseLight: { value: c(L.looseLight) }, mlLooseGrit: { value: c(L.looseGrit) },
    mlFlash: { value: c(L.flash) }, mlAsh: { value: c(L.ash) }, mlGlazeThick: { value: c(gz.thick) }, mlGlazeThin: { value: c(gz.thin) },
    mlTint: { value: c(0x9fd8e0) }, mlRoughs: { value: new THREE.Vector4(...L.rough) },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMlP = position;\n  vMlN = normal;\n  vMl = aMl;');
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>${FRAG}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>${ROUGH}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${GLOW}`);
  };
  m.customProgramCacheKey = () => 'matterlook';
  m.userData.shared = true; m.userData.matterUniforms = uniforms;
  _mats.set(key, m);
  return m;
}

/** Give a geometry of `count` vertices the look's attributes (zeroed `aMl`, a white `color`); returns the `aMl` array to write. */
export function matterAttrs(geo, count = geo.attributes.position.count) {
  const ml = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) ml[i * 4 + 1] = 1; // (full thickness: no lip)
  geo.setAttribute('aMl', new THREE.BufferAttribute(ml, 4));
  if (!geo.attributes.color) geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 4).fill(1), 4));
  return ml;
}

/** The held ball: an icosahedron pressed lumpy (three slow waves on its radius), smooth-shaded, radius about 0.5. */
export function lumpyBall() {
  let g = new THREE.IcosahedronGeometry(0.5, 3);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const P = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i).normalize();
    const r = 0.5 * (1 + 0.09 * Math.sin(v.x * 5.1 + v.y * 2.3) + 0.07 * Math.sin(v.y * 6.7 - v.z * 3.1) + 0.05 * Math.sin(v.z * 8.3 + v.x * 4.4));
    P.setXYZ(i, v.x * r, v.y * r, v.z * r);
  }
  g.computeVertexNormals();
  matterAttrs(g);
  return g;
}

/** The house's Lachryma liquid (the Weir's Well's instance, its clock kept by game.water), its feelings' tints filled in once. */
export function lachrymaSkin(game) {
  const W = game.water; if (!W?.mats) return null;
  const m = (W.mats.lachryma ||= makeWaterMaterial(W.sky, 'lachryma'));
  const T = m.uniforms.uTints?.value;
  if (T && !m.userData.feelTints) { DISPLAY_ORDER.forEach((f, i) => T[i]?.setHex(COLOR[f])); T[7]?.setHex(0xe6f6ff); m.userData.feelTints = true; }
  m.userData.shared = true;
  return m;
}
/** `aDepth`'s code for the Lachryma skin: the depth (0..9.99 m), a tint (-1 none, 0..6 a feeling, 7 ice) at strength k 0..1, or hidden. */
export const liquidDepth = (depth, tint = -1, k = 0, hide = false) => {
  const d = Math.min(9.99, Math.max(0, depth));
  return (hide ? WATER_TINTS.hide : tint < 0 ? WATER_TINTS.none : tint + WATER_TINTS.first) * 100 + Math.round(Math.min(1, Math.max(0, k)) * 9) * 10 + d;
};

/** Compile the look's one program (and the role's uniforms) in the warm-up: a parked mesh of each role, 50 m down. */
export function prewarm(scene) {
  const geo = lumpyBall(), parked = ['ground', 'creation', 'set', 'lachryma'].map((r) => {
    const o = new THREE.Mesh(geo, matterMaterial(r)); o.position.set(0, -50, 0); o.userData.zoneFree = true; scene.add(o); return o;
  });
  return () => { for (const o of parked) scene.remove(o); geo.dispose(); };
}
