// ---------------------------------------------------------------------------------------
// OXIDATION: how Lachryma left lying in the open turns, and the colours it turns through (the owner, 2026-10-09: "All crude stains are
// just unrefined Lachryma", "Every feat of the Courier's power reads as Lachryma"; docs/plans/LACHRYMA-LOOP.md sections 0, 1 and 5 item
// 7). One clock and one film for everything of Lachryma that lies in the air:
//
//   THE RAMP     a clapperjar's dropped bauble is Lachryma just out of clay, pale cream and glowing; from OXIDATION.start real seconds
//                it darkens through amber to crude (near-black, the oil film on it) by OXIDATION.full, and from OXIDATION.melt it runs
//                into the ground, gone at OXIDATION.gone. `oxidationMaterial(k)` is the
//                bauble's look at a step of it (one program, 'bauble-ox', for every step).
//   THE FILM     the oil film over crude: thin-film interference's colours walked round a loop (violet, teal, gold, magenta), brightest
//                at a grazing look. `oxFilm(t)` in OXIDATION_GLSL, `filmColour(t)` on the CPU: the same colours.
//   A SLICK      crude spilled in a fight (vfx/slicks.js) enters the ramp where the bauble ends, at crude, and runs on along
//                OXIDATION.slick (shares of its life): fresh it is thick and black, the film only at its rim and a grazing look; THINNED
//                the film's bands come up through it at any angle and their hue walks as it thins; then a SHEEN, dull and pale, that
//                soaks away (`slickColour` in the GLSL).
//   featTint     a feat of the Courier's power (the blink's afterimage, a slam's ring, a jet's thrust, every shockwave) wears the film's
//                hue shift, the colours the Lachryma tools' trails and the bauble's film run through: `featTint(t)` walks them by t.
//
// Prior art: the pickups that fade before they vanish (Zelda's hearts and rupees, Kingdom Hearts' orbs that dim), made a change of
// matter rather than a blink (the comfort rule: nothing flickers); thin-film interference (Newton's colours: an oil film's hue is set
// by its thickness, so it walks as the film thins and as the eye moves; Belcour and Barla, "A Practical Extension to Microfacet Theory
// for the Modeling of Varying Iridescence", SIGGRAPH 2017, for the hue as a function of thickness and angle); and the Bonn Agreement Oil
// Appearance Code (the five looks of spilled oil from thick to thin: continuous true colour, discontinuous true colour, metallic,
// rainbow, sheen), which is the slick's ramp read from the top: black, then the rainbow, then the sheen, then nothing.
//
//   SCHILLER     a mark worn on the Solar Skiff (the board's gauges, the Raceway's strings and lanes) in the labradorite's own play,
//                not a cyan glow (the owner, v204: "the UI elements all read as too blue versus Lachryma labradorite"): a dark body with
//                the film's colours flashing up through it in broad bands at a constant rate, labInk's CPU twin on the film's palette
//                (vfx/labradorite.js). `schillerInk(ph, out?, { sheen, floor })`, walked by SCHILLER.rate a real second.
//
//   OXIDATION   oxidationColour(k, out)   oxidationGlow(k, out) -> intensity
//   oxidationFilm(k) -> the film's strength   oxidationMaterial(k) (the bauble's)   OXIDATION_GLSL (oxFilm, slickColour)
//   FILM (the film's four colours, linear)   filmColour(t, out)   featTint(t, out?, { feeling, k, bright })
//   SCHILLER (the ink, the walk's rate)   schillerInk(ph, out?, { sheen, floor })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../core/config.js';
import { COLOR } from '../progress/weather.js';

/** The ramp, in real seconds for a bauble (`steps`: shared looks, one program; at 8 the colour visibly stepped), and a slick's shares
 *  of its own life: thinned (the film's bands up through it) and sheen (pale, soaking away; gone at 1). */
export const OXIDATION = { start: 7, full: 22, melt: 38, gone: 40.5, steps: 64, slick: { thinned: 0.3, sheen: 0.72 } };

const CREAM = new THREE.Color(PALETTE.cream), CRUDE = new THREE.Color(0x05040a), GLOW = new THREE.Color(PALETTE.glow), GLOW_CRUDE = new THREE.Color(0x2a1450);
/** The body's colour at oxidation k: cream to the black of crude. */
export const oxidationColour = (k, out = new THREE.Color()) => out.copy(CREAM).lerp(CRUDE, Math.pow(k, 0.8));
/** The glow under it at k (into `out`), and its intensity (returned): fresh Lachryma glows, crude hardly at all. */
export function oxidationGlow(k, out = new THREE.Color()) { out.copy(GLOW).lerp(GLOW_CRUDE, k); return 0.45 * (1 - k) + 0.04; }
/** How strongly the oil film shows at k: none fresh, all of it on crude. */
export const oxidationFilm = (k) => 1.25 * k * k;

/** The film and the slick's colours, as GLSL: include it once in any material that wears them. */
export const OXIDATION_GLSL = /* glsl */`
vec3 oxFilm(float t) { t = fract(t) * 4.0; vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t)); }
// crude on the ground at u along a slick's life (0 fresh .. 1 gone): fres the grazing look (0 straight down .. 1 edge on), h the film's
// thickness here (a smooth field: its own noise), aa how much h changes across a pixel (fwidth: the bands fade to their mean before
// they could crawl), rim 1 at the pool's thin edge. The film is its interference lines, the contours of h: fresh, a few faint ones at a
// grazing look over ink; thinned, more and brighter, their hue walking with u; then the sheen, dull and silvery, the lines gone.
vec3 slickColour(float u, float fres, float h, float aa, float rim) {
  float thin = smoothstep(0.05, ${OXIDATION.slick.thinned.toFixed(2)} + 0.15, u), sheen = smoothstep(${OXIDATION.slick.sheen.toFixed(2)} - 0.12, 1.0, u);
  vec3 ink = vec3(0.006, 0.005, 0.01);
  float orders = mix(4.0, 8.0, thin), x = h * orders + u * 1.5, sharp = mix(16.0, 6.0, thin);
  float band = mix(pow(0.5 + 0.5 * cos(x * 6.2832), sharp), inversesqrt(3.1416 * sharp), smoothstep(0.15, 0.5, aa * orders)); // (a line's mean, past a pixel: never a crawl)
  float k = band * mix(0.02 + 0.08 * fres, 0.06 + 0.18 * fres, thin) * (1.0 - sheen) + 0.02 * fres; // (fresh: dark and oily, the lines dim)
  vec3 c = ink + oxFilm(x * 0.25 + fres * 0.5) * k + vec3(0.05, 0.05, 0.07) * fres * (1.0 - thin); // (and fresh, a black mirror at a grazing look)
  c = mix(c, vec3(0.30, 0.29, 0.33) * (0.25 + 0.5 * fres), sheen * 0.55);
  return c + oxFilm(h + u + 0.35) * rim * (0.12 + 0.12 * thin) * (1.0 - sheen); // (the edge, where the film is thinnest: its brightest band)
}
`;

/** A bauble's look at oxidation k (0 fresh cream and glowing .. 1 liquid Lachryma: near-black, the oil film on it). Every k one program. */
export function oxidationMaterial(k) {
  const glow = new THREE.Color(), gi = oxidationGlow(k, glow);
  const m = new THREE.MeshPhysicalMaterial({
    color: oxidationColour(k), emissive: glow, emissiveIntensity: gi, roughness: 0.18 + 0.04 * k, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const uOil = { value: oxidationFilm(k) };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uOil = uOil;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uOil;
${OXIDATION_GLSL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0); float fres = pow(1.0 - ndv, 2.2);
  totalEmissiveRadiance += oxFilm(fres * 0.8 + normal.y * 0.2) * (0.03 + 1.5 * fres) * uOil; }`);
  };
  m.customProgramCacheKey = () => 'bauble-ox';
  return m;
}

/** The film's four colours (linear light), as oxFilm walks them. */
export const FILM = [[0.30, 0.06, 0.70], [0.04, 0.55, 0.75], [0.95, 0.72, 0.18], [0.85, 0.10, 0.50]];
const ss = (x) => x * x * (3 - 2 * x);
/** The film's colour at t (wraps: 1 is once round the loop), as oxFilm gives it. */
export function filmColour(t, out = new THREE.Color()) {
  const x = (((t % 1) + 1) % 1) * 4, i = Math.floor(x) % 4, f = ss(x - Math.floor(x)), a = FILM[i], b = FILM[(i + 1) % 4];
  return out.setRGB(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
}

const _f = new THREE.Color(), _w = new THREE.Color(1, 1, 1);
/** A feat's colour at t (its hue shift: walk t over the feat's life, or along its pieces): the film's colour, lifted to read as light
 *  (bright, a little toward white). With a `feeling` (a jet's thrust, which sprays the brush's paint) the film is laid over that
 *  feeling's colour by k. */
export function featTint(t, out = new THREE.Color(), { feeling = null, k = 0.5, bright = 1.25 } = {}) {
  filmColour(t, _f).lerp(_w, 0.1).multiplyScalar(bright);
  if (feeling && COLOR[feeling] !== undefined) return out.setHex(COLOR[feeling]).lerp(_f, k);
  return out.copy(_f);
}

/** The marks' schiller (labInk's numbers on the film's palette): the dark body (sRGB, the labradorite's ink lifted a little so a mark
 *  still has a shape on night sand), the walk (film loops a real second: once round in about 14 real s, a band's flash every 3.5),
 *  and how far along a mark's length (film loops a metre) the hue moves on. */
export const SCHILLER = { ink: 0x17111f, rate: 0.07, along: 0.035 };
const _ink = new THREE.Color(SCHILLER.ink);
/** A mark's colour at phase ph (walk it by SCHILLER.rate x real seconds, plus SCHILLER.along x metres along the mark): the ink, with
 *  the film's colour coming up through it in broad bands (labInk's: a band a quarter of the loop), never below `floor` of the film nor
 *  past `sheen`, so a mark reads on noon sand (the ink) and at night (the flash). */
export function schillerInk(ph, out = new THREE.Color(), { sheen = 0.9, floor = 0.35, bright = 1.25 } = {}) {
  const band = Math.min(1, Math.max(0, (0.5 + 0.5 * Math.sin(ph * Math.PI * 4) - 0.18) / 0.64)), b = band * band * (3 - 2 * band);
  featTint(ph, _f, { bright });
  return out.copy(_ink).lerp(_f, floor + (sheen - floor) * b);
}
