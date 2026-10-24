// ---------------------------------------------------------------------------------------
// THE STONES' MINERALS (the owner, 2026-10-24: "more pneuka stones"; docs/plans/DICE.md 7: the stones are your dice, cut in their
// mineral): what each stone set looks like as a mineral, beyond its colour. The kiln's gems (courier/vessel/glazes.js, kind 'gem') give a
// stone its colour, its second colour and its optics (facets, fire, play, glow: vfx/finish.js GEM); this table gives it what a lapidary
// would know it by at arm's length: amethyst's colour zoning, citrine's honey, emerald's jardin, onyx's bands, moonstone's floating
// blue, opal's patches of play, and the eight new ones (labradorite's schiller, obsidian's sheen, malachite's rings, lapis's pyrite,
// garnet's dark heart, rose quartz's milk, tiger's eye's rolling line). Looks only: what a stone DOES is Dovina's (progress/stones.js),
// and an id the rules do not know is worn as the Maker's (stoneOf).
//
// It is drawn in the gem branch of the vessel's one finish program (vfx/finish.js: `uFinM` the mineral, `uFinC` its third colour), so a
// mineral is a few uniforms, never a program of its own. Everything it draws is in the die's own radii (`uFinM.y` 1 / the radius in the
// mesh's units), so a 2 cm die on the vessel, the palm die and the flee's d20 wear one pattern at their own sizes; and every detail
// fades out as it shrinks under a pixel or two (CLAUDE.md: no aliasing crawl), so a far body shows the colour and the facets alone.
//
//   1 ZONED     amethyst, sapphire: colour laid in growth zones, chevrons pale to deep (a crystal's sectors as it grew)
//   2 DEEP      citrine, garnet, ruby: a dark heart and the colour lit where light comes back out at the edges; honey's veils in it
//   3 BANDED    onyx: straight white lines in the black (chalcedony laid down layer on layer)
//   4 RINGS     malachite: concentric bands, dark and pale green, round a few hearts (a botryoidal mass cut through)
//   5 JARDIN    emerald: feathers and specks inside it, a little behind the face (fake parallax: they shift with the eye)
//   6 MOON      moonstone: a milky body and a blue light billowing under it as the face turns toward you (adularescence)
//   7 PLAY      opal: patches of spectral colour, each turning on and off with the angle (harlequin play; the stacked spheres)
//   8 SCHILLER  labradorite: a dark body, and broad flashes in the house's own palette (vfx/labradorite.js's seven stops) where a
//               domain of its lamellae faces the eye; the film's schiller is this stone
//   9 GLASS     obsidian: black glass and a soft sheen band riding across it with the view (sheen obsidian's aligned bubbles)
//  10 FLECKS    lapis lazuli: deep blue, white calcite clouds, and pyrite's gold flecks that glint (metal in the stone)
//  11 MILK      rose quartz: pink clouded with milk, lit softly from within
//  12 CHATOYANT tiger's eye: golden and brown fibre bands, and the cat's-eye line of light rolling across them as the eye moves
//
// Prior art: real gemmology (zoning, jardin, adularescence, play of colour, labradorescence, chatoyancy, sheen: the GIA's gem
// encyclopedia's words for them); the jewel-match games' and Spyro's gems for the facet glint (vfx/finish.js); the house's labradorite
// (vfx/labradorite.js) for the schiller's palette; Worley's cells (finish.js finCells) for opal's patches and the pyrite; malachite's
// rings as distance bands, the way wood grain is drawn in a shader (Perlin's "Hypertexture", 1989); a parallax inclusion layer as in
// Far Cry's and Destiny's ice shaders (the sample offset along the view).
//
//   MINERALS[id] = { pattern, c3, scale, k }   mineralOf(id) -> the row (the Maker's, none, when unknown)
//   dressStone(U, material, id, { radius, ink }) -> the finish's gem uniforms (vfx/finish.js dressFinish) set for a stone: its glaze,
//     its mineral, at its radius; `ink` keeps the material's map's dark numerals (the palm die's and the flee's bodies)
//   MINERAL_COLOR, MINERAL_SURFACE, MINERAL_LIGHT   the GLSL vfx/finish.js puts in the gem branch
// ---------------------------------------------------------------------------------------
import { GLAZES } from '../courier/vessel/glazes.js';

/** The minerals by stone id. `pattern` (above); `c3` the third colour (a zone's pale, a band's white, the pyrite's gold is the gem's
 *  colour2); `scale` how many of the pattern's units a die's radius holds; `k` how strongly it shows. */
export const MINERALS = {
  maker: { pattern: 0, c3: 0xffffff, scale: 1, k: 0 },
  amethyst: { pattern: 1, c3: 0xd8c4f0, scale: 1.4, k: 0.85 },
  sapphire: { pattern: 1, c3: 0x5a7ad8, scale: 2.2, k: 0.45 },
  citrine: { pattern: 2, c3: 0xa0500c, scale: 1.2, k: 0.7 },
  ruby: { pattern: 2, c3: 0x5a0410, scale: 1.0, k: 0.45 },
  garnet: { pattern: 2, c3: 0x1a0206, scale: 1.0, k: 1.0 },
  onyx: { pattern: 3, c3: 0xe8e2dc, scale: 2.4, k: 0.9 },
  malachite: { pattern: 4, c3: 0x5adc8c, scale: 2.6, k: 1.0 },
  emerald: { pattern: 5, c3: 0xb8e8c0, scale: 1.6, k: 0.8 },
  moonstone: { pattern: 6, c3: 0xf4f6fa, scale: 1.2, k: 0.9 },
  opal: { pattern: 7, c3: 0xf2f0f6, scale: 2.6, k: 1.0 },
  labradorite: { pattern: 8, c3: 0x3a4248, scale: 1.0, k: 1.0 },
  sheenobsidian: { pattern: 9, c3: 0x302a34, scale: 1.0, k: 1.0 },
  lapis: { pattern: 10, c3: 0xdcdcd8, scale: 1.6, k: 1.0 },
  rosequartz: { pattern: 11, c3: 0xfaf0f2, scale: 1.0, k: 0.8 },
  tigerseye: { pattern: 12, c3: 0x3a1c08, scale: 1.4, k: 1.0 },
};
export const mineralOf = (id) => MINERALS[id] || MINERALS.maker;

/** Set the finish's gem uniforms for a stone worn on a material dressed with vfx/finish.js `dressFinish(m, 'gem')`. The Maker's (a `keep`
 *  finish) is the material's own: the finish off. */
export function dressStone(U, m, id, { radius = 1, ink = false } = {}) {
  const G = GLAZES[id]?.kind === 'gem' ? GLAZES[id] : GLAZES.maker, M = mineralOf(G.id);
  U.uFinOn.value = G.keep ? 0 : 1;
  U.uFinA.value.setHex(G.color); U.uFinB.value.setHex(G.color2 ?? G.color); U.uFinP.value.set(...(G.p || [0, 0, 0, 0]));
  U.uFinM.value.set(M.pattern, M.scale / Math.max(1e-6, radius), M.k, 0); U.uFinC.value.setHex(M.c3);
  U.uFinPart.value = ink ? 1 : 0; // (for a gem: how much of the map's dark numerals to keep)
  if (!G.keep) m.color.setHex(0xffffff);
  m.roughness = Math.max(0.06, G.rough ?? 0.1); m.metalness = G.metal ?? 0;
  return G;
}

// THE COLOUR (after the gem's own: diffuseColor is the stone's body). q in the die's radii; px its size a pixel; finKeep(f): a detail of
// frequency f, whole while it spans a few pixels, gone under one. Writes finPatS (a weight the light stage reads: a fleck, a veil)
// and finPatH (a hash or phase for it), finPatM / finPatR / finPatRo (metal, glassier, matte) as the glaze's patterns do.
export const MINERAL_COLOR = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5) {
    vec3 q = vFinObj * uFinM.y; float px = length(fwidth(q)), mk = uFinM.z; int mp = int(uFinM.x + 0.5);
    #define finKeep(f) (1.0 - smoothstep(0.35, 0.9, px * (f)))
    vec3 Vv = normalize(vViewPosition);
    if (mp == 1) {        // ZONED: chevron growth zones, pale to deep
      float t = q.y * 1.1 + abs(q.x) * 0.7 + (finNoise(q * 1.7) - 0.5) * 0.5;
      float z = abs(fract(t * 1.3) * 2.0 - 1.0), zone = smoothstep(0.25, 0.75, z) * finKeep(2.6);
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC * (0.35 + 0.65 * finLuma(diffuseColor.rgb / max(uFinA, vec3(0.05)))), (1.0 - zone) * mk * 0.7);
    } else if (mp == 2) { // DEEP: honey veils and a dark heart (the edges lit in the light stage)
      float veil = finNoise(q * vec3(1.6, 4.0, 1.6) + vec3(0.0, finNoise(q * 0.8) * 2.0, 0.0));
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC, smoothstep(0.35, 0.85, veil) * mk * 0.75 * finKeep(4.0));
      diffuseColor.rgb *= mix(1.0, 0.45, mk * 0.6);
    } else if (mp == 3) { // BANDED: thin straight white lines in the black, gently waved
      float b = fract((q.y + (finNoise(q * 0.9) - 0.5) * 0.35) * 0.9), w = 0.16 + 0.08 * finNoise(q * 3.1);
      float line = (smoothstep(0.0, w * 0.5, b) - smoothstep(w, w * 1.6, b)) * finKeep(0.9 / w);
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC, line * mk); finPatRo = line * 0.3;
    } else if (mp == 4) { // RINGS: concentric bands round a few hearts
      vec3 c = finCells(q * 0.35 + 3.7); float d = c.x * 2.9 + (finNoise(q * 2.2) - 0.5) * 0.18;
      float r = abs(fract(d * 1.0) * 2.0 - 1.0), fine = abs(fract(d * 3.0) * 2.0 - 1.0);
      float band = smoothstep(0.3, 0.7, r) * finKeep(2.0), thin = smoothstep(0.75, 0.95, fine) * finKeep(6.0);
      diffuseColor.rgb = mix(uFinA * 0.55, uFinC, band * mk); diffuseColor.rgb = mix(diffuseColor.rgb, uFinA * 0.25, thin * 0.6 * mk);
    } else if (mp == 5) { // JARDIN: feathers and specks a little behind the face, shifting with the eye
      vec3 p = q + Vv * 0.35;
      float feather = smoothstep(0.62, 0.8, finNoise(p * vec3(2.2, 6.5, 2.2)) * 0.7 + finNoise(p * 9.0) * 0.3) * finKeep(9.0);
      vec3 c = finCells(p * 5.0); float speck = (1.0 - smoothstep(0.08, 0.16, c.x)) * step(0.7, c.z) * finKeep(14.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC * 0.8, feather * mk * 0.6); diffuseColor.rgb *= 1.0 - speck * mk * 0.75;
      finPatS = feather * mk;
    } else if (mp == 6) { // MOON: a milky body, clouded
      float cl = finNoise(q * 1.4 + 1.3) * 0.65 + finNoise(q * 4.0) * 0.35;
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC * 0.8, (0.35 + 0.4 * cl) * mk * finKeep(4.0) + 0.2 * mk);
    } else if (mp == 7) { // PLAY: a milky body; the patches are the light stage's
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC * 0.85, 0.5 * mk);
      vec3 c = finCells(q * 1.0); finPatH = c.z; finPatS = (1.0 - smoothstep(0.0, 0.08, c.y - c.x)) * finKeep(3.0); // (the patches' seams, dark)
      diffuseColor.rgb *= 1.0 - finPatS * 0.35;
    } else if (mp == 8) { // SCHILLER: a dark body with its lamellae drawn faintly in it
      float lam = finNoise(vec3(q.x * 9.0, q.y * 0.8, q.z * 9.0) + q.y * 0.6);
      diffuseColor.rgb = mix(uFinA * 0.55, uFinC, smoothstep(0.45, 0.75, lam) * 0.5 * finKeep(9.0));
    } else if (mp == 9) { // GLASS: black glass, glassier; the sheen is the light stage's
      diffuseColor.rgb = uFinA * (0.4 + 0.6 * finNoise(q * 0.7)); finPatR = 1.0;
    } else if (mp == 10) { // FLECKS: calcite clouds and pyrite flecks
      float cal = smoothstep(0.66, 0.8, finNoise(q * 1.8 + 7.0) * 0.7 + finNoise(q * 6.0) * 0.3) * finKeep(6.0);
      vec3 c = finCells(q * 6.0); float fl = (1.0 - smoothstep(0.1, 0.2, c.x)) * step(0.55, c.z) * finKeep(12.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC * 0.9, cal * mk * 0.8);
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinB, fl * mk); finPatM = fl * 0.85; finPatR = fl; finPatS = fl * mk; finPatH = c.z;
      finPatRo = (1.0 - fl) * cal * 0.4; // (the calcite duller than the lazurite)
    } else if (mp == 11) { // MILK: pink clouded with milk
      float cl = finNoise(q * 1.1 + 2.0) * 0.6 + finNoise(q * 3.2) * 0.4;
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinC * 0.85, (0.25 + 0.45 * smoothstep(0.3, 0.8, cl) * finKeep(3.2)) * mk);
    } else if (mp == 12) { // CHATOYANT: fibre bands, gold and brown, waved
      float w = q.y * 1.6 + (finNoise(q * vec3(0.8, 0.3, 0.8)) - 0.5) * 1.6;
      float band = smoothstep(0.3, 0.7, finNoise(vec3(q.x * 0.5, w, q.z * 0.5))) * finKeep(2.0);
      float fibre = finNoise(vec3(q.x * 0.6, w * 14.0, q.z * 0.6)) * finKeep(14.0);
      diffuseColor.rgb = mix(uFinC, uFinA, band) * (0.85 + 0.3 * fibre * mk); finPatH = w;
    }
    #undef finKeep
  }`;

// THE SURFACE: metal and gloss for the flecks, the glass and the matte calcite (the gem branch's own roughness is the glaze's `rough`).
export const MINERAL_SURFACE = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5) { metalnessFactor = mix(metalnessFactor, 0.9, finPatM); roughnessFactor = mix(roughnessFactor, 0.05, finPatR * 0.8); roughnessFactor = mix(roughnessFactor, 0.6, finPatRo); }`;

// THE LIGHT: what a mineral throws back with the view (schiller, play, sheen, the cat's eye, moonstone's billow, a glint off pyrite,
// light out of a deep stone's edges). V the way to the eye, n the shaded normal (view space), as the gem's own light uses them.
export const MINERAL_LIGHT = /* glsl */`
  if (uFinOn > 0.5 && uFinM.x > 0.5) {
    vec3 V = normalize(vViewPosition), n = normalize(normal); vec3 q = vFinObj * uFinM.y; float px = length(fwidth(q)), mk = uFinM.z;
    float ndv = abs(dot(n, V)), rim = 1.0 - ndv; int mp = int(uFinM.x + 0.5);
    if (mp == 2) totalEmissiveRadiance += uFinB * pow(rim, 1.6) * mk * 0.55;                                       // DEEP: light out at the edges
    else if (mp == 5) totalEmissiveRadiance += uFinC * finPatS * 0.08;                                            // JARDIN: the feathers catch a little
    else if (mp == 6) {                                                                                            // MOON: the billow under the face
      float bil = smoothstep(0.35, 0.8, finNoise(q * 1.3 + vec3(V.xy * 1.2, 0.0)));
      totalEmissiveRadiance += uFinB * bil * pow(ndv, 2.0) * mk * 0.7;
    } else if (mp == 7) {                                                                                          // PLAY: patches turning on and off
      vec3 c = finCells(q * 1.0); float a = dot(V, n) * 5.0 + c.z * 6.2832;
      float on = smoothstep(0.35, 0.85, 0.5 + 0.5 * sin(a)) * (1.0 - smoothstep(1.0, 2.0, px * 3.0));
      totalEmissiveRadiance += finSpectrum(c.z * 2.0 + dot(V, n) * 0.6) * on * (1.0 - finPatS) * mk * 0.75;
    } else if (mp == 8) {                                                                                          // SCHILLER: a domain's flash, in the house's palette
      vec3 dom = vec3(finNoise(q * 0.9), finNoise(q * 0.9 + 5.3), finNoise(q * 0.9 + 9.1)) - 0.5;
      vec3 dn = normalize(n + dom * 1.6);
      float flash = smoothstep(0.55, 0.95, dot(dn, V)) * mk;
      float ph = finNoise(q * 0.6 + 2.0) * 1.4 + dot(V, n) * 0.25, x = fract(ph) * 7.0, i = floor(x), f = smoothstep(0.0, 1.0, x - i);
      totalEmissiveRadiance += mix(finLab(int(i)), finLab(int(mod(i + 1.0, 7.0))), f) * flash * 1.1;
    } else if (mp == 9) {                                                                                          // GLASS: the sheen band riding across
      float s = exp(-pow((dot(V, n) - 0.55 - (finNoise(q * 1.4) - 0.5) * 0.5) * 5.0, 2.0));
      totalEmissiveRadiance += uFinB * s * mk * 0.45 + finSpectrum(dot(V, n) * 1.5) * s * mk * 0.05;
    } else if (mp == 10) {                                                                                         // FLECKS: the pyrite glints
      float gl = pow(max(0.0, dot(reflect(-V, n), normalize(vec3(0.3, 0.8, 0.5)))), 6.0) * (0.4 + 0.6 * fract(finPatH * 7.0));
      totalEmissiveRadiance += uFinB * finPatS * (0.12 + gl * 1.4);
    } else if (mp == 11) totalEmissiveRadiance += uFinB * (0.06 + pow(rim, 1.5) * 0.3) * mk;                       // MILK: lit softly from within
    else if (mp == 12) {                                                                                           // CHATOYANT: the cat's-eye line
      float line = exp(-pow((fract(finPatH * 0.25 + V.y * 0.9 + V.x * 0.3) - 0.5) * 9.0, 2.0)) * (1.0 - smoothstep(0.6, 1.4, px * 2.0));
      totalEmissiveRadiance += mix(uFinA, vec3(1.0, 0.9, 0.6), 0.4) * line * mk * 0.7;
    }
  }`;

// the house's labradorite palette (vfx/labradorite.js labStop: violet, ultramarine, blue, peacock, green, gold, copper), in linear light;
// copied, not included, so a material that chains both never declares it twice
export const MINERAL_HEAD = /* glsl */`
uniform vec4 uFinM; uniform vec3 uFinC;
vec3 finLab(int i) { vec3 c = i == 0 ? vec3(0.40, 0.22, 0.82) : i == 1 ? vec3(0.22, 0.30, 0.95) : i == 2 ? vec3(0.14, 0.50, 0.98) : i == 3 ? vec3(0.10, 0.70, 0.86)
  : i == 4 ? vec3(0.22, 0.78, 0.55) : i == 5 ? vec3(0.92, 0.76, 0.32) : vec3(0.88, 0.46, 0.26); return pow(c, vec3(2.2)); }`;
