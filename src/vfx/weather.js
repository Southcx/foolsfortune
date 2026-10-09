// ---------------------------------------------------------------------------------------
// THE WEATHER'S LOOK: what the emotional weather and the hour look like (docs/plans/WEATHER.md; the rules are progress/weather.js,
// `game.weather`, Dovina's). Weather is a place's mood falling as Lachryma, and each of the five wears the colour and the motif of
// the damage type it feeds (docs/ART.md, section 2), so a weather and a status read as kin:
//
//   MIRTH   the fox's wedding: a sunshower, gold drops, fewer and slower, through warm light; a RAINBOW opposite the sun (Impact's bone
//           and gold)
//   WONDER  by day DIAMOND DUST, hexagonal ice glinting as it sinks, and the 22-degree HALO with its SUN DOGS (real halos are made by
//           hexagonal ice: the lawful lattice twice over); by night the AURORA, slow curtains from lapis to the labradorite's green
//           (Ego's lapis and hexagons)
//   DESIRE  the wanting wind: amber-rose dust streaming along the wind and a haze closing the horizon; no heat shimmer, ever (it wobbles
//           at a varying rate: the flicker rule) (Influence's rose and warm gold)
//   GRIEF   the long rain: steady, long, silver, the sky grey and drained (Illusion's labradorite, in the drops' sheen)
//   DREAD   the pall: a bruise-coloured haze, ink and violet-green, and thunder far off as FAR BOLTS, each held a beat and fading
//           over a second and a half, with a slow glow in the cloud behind; never a flash on the screen (Delirium's ink and green)
//   GALL    the miasma (docs/plans/GALL-AND-FURY.md): a low sour fog lying in the hollows and thin on the crests (lenses of it on the
//           ground, flat-topped as valley fog is), Gall's violet greyed toward bile; FLIES in a few loose clouds low over the sand;
//           a CURDLED FILM on still water and Lachryma, the oil film's colours gone sour (vfx/water.js `SOUR_U`); a low flat sky with a
//           bruise at the horizon (Ego's, as Wonder: but rot, never the hexagon)
//   FURY    the hail: hard white pellets falling fast and nearly straight, each BOUNCING once and lying as a thin white SCATTER that
//           melts, POCKING still water with small hard rings (the ripple tank, `game.water.disturb`); a hard, bright overcast in the
//           cumulonimbus's grey-green, a red edge at the horizon (Fury's). Never thunder, never lightning: those are Dread's
// What falls is in the world, never on the screen: long thin streaks and motes in a column round the eye, each along its own path
// (the sixth generation's rain: lines wrapped round the camera), so nothing swims or flickers. Since R46 (the owner: "toned down in
// number and presence ... higher in the sky ... noise modulation befitting their travel path"): fewer; most of it high, only a sparse
// few near the ground; none within a few metres of the eye, under a roof or below the ground (vfx/overhead.js); and each path
// wanders on a curl noise, the streak bending along it.
// Only an OPEN place gets it (`game.weather.here(pos).exposure`): a roofed room keeps its own light, a Well its own sky.
//
// THE HOUR: three paintings (vfx/sky.js `grade`): the maker's is DUSK, untouched at its hour; the owner's DAY (clouds and floating
// soap bubbles) and NIGHT (violet and green swirls over a dark crown) are blended in by the hour; dawn is the dusk painting turned rose. The light ON the scene (the
// sun, the fog) is Petra's (render/daylight.js): `fogOf(aspect, strength)` and `look.lift` are what this module offers it.
//
// Prior art: the sixth generation's camera-wrapped rain (Wind Waker, Metal Gear Solid 2's tanker deck), real atmospheric optics (the
// 22-degree halo and parhelia from hexagonal plate crystals, the primary bow at 42 degrees round the antisolar point, diamond dust),
// Breath of the Wild's lightning (a bolt seen far off before its thunder), Okami's painted skies graded by the hour, and Journey's
// weather as feeling. The miasma: Silent Hill's and Dark Souls' Blighttown's sulphurous low fogs, Pathologic's plague miasma, and
// valley fog's flat top (the cold air pooling in the hollows); its lenses are soft point sprites faded by their area and at the
// screen's edge (the sixth generation's fog cards, with the soft-particle problem met by sitting each one on the ground). The hail:
// real hailstorms (the cumulonimbus's grey-green light; a stone's one bounce and its white scatter melting on warm ground) and Breath
// of the Wild's weather readability (each weather known at a glance by what it does, not only by its colour).
//
//   game.weatherLook = new WeatherLook(game)   .update(dt, camera)   .force({ aspect, strength, phase, light } | null) (tests, the workbench)
//   An AGATE sky (two feelings: `second`, `secondStrength` from the rules): the first falls; the second colours the sky, the clouds and
//   what falls, and may raise its own mark (an aurora under a pall: awe). Opposites cancel in the rules, so there is nothing to draw.
//   .shoreline({ center, angle, half, r })   the mood ends at the waterline (vfx/shore.js tells it)
//   .prewarm() (made and shown for the boot's warm-up; returns what hides it)   .lift (0 .. 0.1: a far bolt's light, for daylight.js to add)   LOOK[aspect]   hourGrade(phase)   fogOf(aspect, strength)
//   Every look shares two falling programs: the streaks (one LineSegments) and the motes (Points, a mode each: drift, flies, hail,
//   fog lens), the miasma's lenses a second instance of the motes' very source (three caches a program by its source: no new one).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Overhead, OVERHEAD_GLSL } from './overhead.js';
import { COLOR } from '../progress/weather.js';
import { SOUR_U } from './water.js';

const C = (hex) => new THREE.Color(hex);
/** The feelings' colours: the game's one table (progress/weather.js COLOR, Dovina's; ruled the one table 2026-10-08, SOUL-ALCHEMY.md), re-exported
 *  here so the looks that import it from vfx/weather.js keep their import. */
export { COLOR };
/** Each weather's look: its colour, what falls (and how), its mark, and what it does to the sky's grade and the fog. */
export const LOOK = {
  mirth:  { colour: C(COLOR.mirth), clouds: { cover: 0.62 },  fall: { kind: 'rain', rate: 0.3, speed: 6, len: 0.7, alpha: 0.55, vel: [0.12, -1, 0.05] }, mark: 'rainbow',
            sky: { expo: 1.08, mul: [1.06, 1.0, 0.9] }, fog: C(0xe8cf9e), fogD: 0.9 },
  wonder: { colour: C(COLOR.wonder), clouds: { cover: 0.6, opacity: 0.6 },  fall: { kind: 'diamond', rate: 0.6, speed: 0.35 }, mark: 'halo', night: 'aurora',
            sky: { expo: 1.02, mul: [0.93, 0.99, 1.1] }, fog: C(0xb8c8e8), fogD: 0.8 },
  desire: { colour: C(COLOR.desire), tone: 0.7, clouds: { cover: 0.56, opacity: 0.6 },  fall: { kind: 'sirocco', rate: 1, speed: 9, len: 3, alpha: 0.55, vel: [1, 0.04, 0.35] },
            sky: { expo: 0.95, mul: [1.08, 0.94, 0.86], haze: C(0xc98a62), hazeK: 0.85 }, fog: C(0xc48a66), fogD: 2.2 },
  grief:  { colour: C(COLOR.grief), clouds: { cover: 0.32, opacity: 0.95 },  fall: { kind: 'rain', rate: 1, speed: 13, len: 1.5, alpha: 0.45, vel: [0.12, -1, 0.05] },
            sky: { expo: 0.78, mul: [0.92, 0.96, 1.04], desat: 0.65 }, fog: C(0x7c858e), fogD: 1.6 },
  dread:  { colour: C(COLOR.dread), clouds: { cover: 0.28, opacity: 0.95 },  fall: null, mark: 'bolts',
            sky: { expo: 0.55, mul: [0.8, 0.86, 0.8], desat: 0.35, haze: C(0x26302a), hazeK: 0.75 }, fog: C(0x24302a), fogD: 2.6 },
  // (the miasma's fall is its fog lenses and its flies; `mist` the lenses' colour, Gall's violet greyed toward bile; `fly` the flies')
  gall:   { colour: C(COLOR.gall), clouds: { cover: 0.24, opacity: 0.97 },  fall: { kind: 'miasma', rate: 1, flies: 96, lenses: 440 }, mist: C(0x7e6e88), fly: C(0x140f16),
            sky: { expo: 0.62, mul: [1.0, 0.97, 0.84], desat: 0.5, haze: C(0x4c3452), hazeK: 0.8 }, fog: C(0x7a6c7c), fogD: 2.4 },
  // (the hail falls white whatever its feeling: `fall.colour`; the red is the sky's edge, never the stones)
  fury:   { colour: C(COLOR.fury), clouds: { cover: 0.26, opacity: 0.97 },  fall: { kind: 'hail', rate: 1, speed: 26, len: 0.2, alpha: 1, vel: [0.05, -1, 0.02], noise: 0.1, lowK: 0.7, colour: C(0xeef6ff), scatter: 2000 },
            sky: { expo: 0.86, mul: [0.88, 0.98, 0.9], desat: 0.5, haze: C(0x8a1a24), hazeK: 0.7 }, fog: C(0x8c968c), fogD: 1.4 },
};
const ASPECTS = Object.keys(LOOK);

/** The hour's grade: the owner's day and night paintings blended in over the maker's dusk, and a little light on each. Keys by the hour
 *  of the day, blended round the clock; dawn is the dusk painting turned rose (it is the same light, the other way round). */
const HOURS = [
  [0, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }], // (the night leans plum: the owner's playlist, sad but bright)
  [4.5, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }],
  [6, { expo: 0.9, mul: [1.0, 0.86, 0.94], stars: 0.6 }],
  [8, { day: 1, expo: 1.0 }],
  [16.5, { day: 1, expo: 1.0 }],
  [17.75, { day: 0.6, expo: 1.0, mul: [1.07, 0.92, 0.84] }], // (the golden hour on the way to dusk: peach, the playlist's pastel over the shadow)
  [19, { expo: 1, stars: 1 }], // (dusk: the maker's own)
  [21, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }],
  [24, { night: 1, expo: 0.55, desat: 0.15, mul: [1.04, 0.94, 1.08] }],
];
const lerp = THREE.MathUtils.lerp, smooth = THREE.MathUtils.smoothstep;
/** The hour's grade (phase 0..1 through the day), as numbers for sky.grade. */
export function hourGrade(phase, out = { mul: [1, 1, 1], haze: [0, 0, 0] }) { // (out: a grade to write into, so a caller each frame makes nothing)
  const h = ((phase % 1) + 1) % 1 * 24;
  let i = 0; while (i < HOURS.length - 2 && HOURS[i + 1][0] <= h) i++;
  const [h0, a] = HOURS[i], [h1, b] = HOURS[i + 1], k = smooth(h, h0, h1);
  const v = (x, y, d) => lerp(x ?? d, y ?? d, k);
  out.day = v(a.day, b.day, 0); out.night = v(a.night, b.night, 0); out.expo = v(a.expo, b.expo, 1); out.stars = v(a.stars, b.stars, 1); out.desat = v(a.desat, b.desat, 0); out.hazeK = 0;
  for (let j = 0; j < 3; j++) { out.mul[j] = lerp(a.mul ? a.mul[j] : 1, b.mul ? b.mul[j] : 1, k); out.haze[j] = 0; }
  return out; // (the night held a little below the painting's full cry: it is night, not a rave)
}
/** The fog a weather asks for (render/daylight.js lays it on the scene's): its colour and a multiplier on the density. */
export function fogOf(aspect, strength = 1) { const L = LOOK[aspect]; return L ? { colour: L.fog, density: lerp(1, L.fogD, strength), k: strength } : null; }

// ---------------------------------------------------------------- what falls
const R = 26, H = 30, LOW = 4; // (the column round the eye: its radius, and its height, from LOW metres under the eye up; most of what falls is high)
const WET_U = { uWet: { value: [new THREE.Vector4(1, 1, 0, 0), new THREE.Vector4(1, 1, 0, 0)] }, uWetY: { value: new THREE.Vector2() } }; // (the still waters nearest the eye, shared by the motes: WeatherLook.wet sets them)
const SHORE_U = { uShore: { value: new THREE.Vector4(0, 0, 0, 0) }, uShoreA: { value: new THREE.Vector2(0, 0) } }; // (shared by what falls: vfx/shore.js sets it)
const WRAP = /* glsl */`
uniform float uT; uniform vec3 uCam; uniform vec3 uVel; uniform float uNoise, uLowK;
vec3 wrapAt(vec3 seed, float sp) { // (a world-anchored path, wrapped into the column round the eye: nothing moves with the camera)
  vec3 w = vec3(seed.x * ${2 * R}.0, seed.y * ${H}.0, seed.z * ${2 * R}.0) + uVel * sp * uT;
  return vec3(mod(w.x - uCam.x + ${R}.0, ${2 * R}.0) - ${R}.0, mod(w.y - uCam.y + ${LOW}.0, ${H}.0) - ${LOW}.0, mod(w.z - uCam.z + ${R}.0, ${2 * R}.0) - ${R}.0);
}
// a cheap curl noise: the curl of a vector potential of sines (two octaves), so the field has no sources or sinks and neighbouring
// drops sway together, like a gust, instead of each jittering on its own (Bridson et al. 2007, "Curl-noise for procedural fluid flow")
vec3 curlOf(vec3 p, float t) {
  vec3 a = vec3(0.21 * p.y + 0.13 * p.z + 0.7 * t, 0.17 * p.z + 0.19 * p.x + 0.9 * t + 2.0, 0.23 * p.x + 0.11 * p.y + 0.6 * t + 4.0);
  vec3 c = cos(a);
  return vec3(0.11 * c.z - 0.17 * c.y, 0.13 * c.x - 0.23 * c.z, 0.19 * c.y - 0.21 * c.x) * 3.0;
}
vec3 curlish(vec3 p, float t) { return curlOf(p, t) + 0.5 * curlOf(p * 2.7 + 11.0, t * 1.7); }
${OVERHEAD_GLSL}
uniform vec4 uShore; uniform vec2 uShoreA; // (a shore: its centre xz, the waterline's radius, on; its bearing and half-width)
float shoreFade(vec3 w) { // (the island's mood ends at the waterline: nothing falls over the crude)
  if (uShore.w <= 0.0) return 1.0;
  vec2 d = w.xz - uShore.xy; float a = atan(d.y, d.x) - uShoreA.x; a = abs(atan(sin(a), cos(a)));
  return a > uShoreA.y ? 1.0 : 1.0 - smoothstep(uShore.z - 2.0, uShore.z + 6.0, length(d));
}
// the column's edges, and nothing within a few metres of the eye (no streak drawn across the lens)
float edgeFade(vec3 r) {
  return (1.0 - smoothstep(${R * 0.7}, ${R}.0, length(r.xz))) * (1.0 - smoothstep(${H - LOW - 6}.0, ${H - LOW}.0, r.y)) * smoothstep(${-LOW}.0, ${-LOW + 1.5}, r.y)
    * smoothstep(1.2, 3.5, length(r)) * shoreFade(uCam + r);
}
// under a roof, inside a wall's top or below the ground: nothing (vfx/overhead.js); near the ground only the sparse few (uLowK of them)
float fallFade(vec3 w, float seed) {
  float oy = overheadY(w.xz);
  if (w.y < oy + 0.05) return 0.0;
  float ground = oy > -9000.0 ? oy : uCam.y - 2.0;
  return max(step(fract(seed * 91.7), uLowK), smoothstep(2.5, 8.0, w.y - ground));
}`;

function makeRain(n, occ) {
  const seed = new Float32Array(n * 6), end = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const s = [Math.random(), Math.random(), Math.random()];
    seed.set(s, i * 6); seed.set(s, i * 6 + 3); end[i * 2] = 0; end[i * 2 + 1] = 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uShore: SHORE_U.uShore, uShoreA: SHORE_U.uShoreA, uVel: { value: new THREE.Vector3(0, -10, 0) }, uLen: { value: 1 }, uCol: { value: new THREE.Color() }, uA: { value: 0 },
    uNoise: { value: 0.6 }, uLowK: { value: 0.12 }, ...occ };
  const m = new THREE.ShaderMaterial({ name: 'weather-rain',
    uniforms: u, transparent: true, depthWrite: false, fog: false,
    vertexShader: `${WRAP}
attribute vec3 aSeed; attribute float aEnd; uniform float uLen; varying float vA;
void main() {
  float sp = 0.85 + 0.3 * fract(aSeed.x * 17.3);
  vec3 r = wrapAt(aSeed, sp);
  vec3 p = uCam + r - normalize(uVel) * uLen * aEnd; // (the streak: its head, and its tail back along the way it falls)
  float tt = uT - aEnd * uLen / max(0.001, length(uVel) * sp); // (the tail is where the head was a moment ago, on the same wandering path)
  p += curlish(p * 0.08, tt) * uNoise;
  vA = edgeFade(r) * fallFade(p, aSeed.y) * (1.0 - 0.8 * aEnd);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,
    fragmentShader: 'uniform vec3 uCol; uniform float uA; varying float vA; void main() { gl_FragColor = vec4(uCol, uA * vA); }',
  });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; L.renderOrder = 5; L.visible = false;
  return { obj: L, u, n };
}

/** The motes: one Points program in four modes (a uniform, never a define: one program for all of them, CASEBOOK rule 5).
 *   0 DRIFT  dust and diamond dust on the wind's eddies (wonder, desire)
 *   1 FLIES  a few loose clouds, each a drifting centre low over the ground with its flies buzzing round it (gall)
 *   2 HAIL   a stone landing: the last of its fall, one bounce, then lying where it skipped to and melting; each lands somewhere new
 *            each time round (fury; the streaks are the fall itself)
 *   3 LENS   a lens of low fog, wider than tall, sat on the ground (so the ground never cuts it), more and taller in a hollow than
 *            on a crest, mottled; laid out to 48 m round the eye on a coarser map of the ground (gall)
 *  Below its least size a dot fades with its area instead of shrinking (a far fly or stone thins, it never crawls a pixel at a time). */
function makeMotes(n, occ) {
  const seed = new Float32Array(n * 3); for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uShore: SHORE_U.uShore, uShoreA: SHORE_U.uShoreA, uVel: { value: new THREE.Vector3(0, -0.35, 0) }, uCol: { value: new THREE.Color() }, uA: { value: 0 }, uSize: { value: 0.06 }, uHex: { value: 1 }, uPx: { value: 480 },
    uNoise: { value: 1.5 }, uLowK: { value: 0.2 }, uMode: { value: 0 }, uWet: WET_U.uWet, uWetY: WET_U.uWetY, ...occ };
  const m = new THREE.ShaderMaterial({ name: 'weather-motes',
    uniforms: u, transparent: true, depthWrite: false, fog: false,
    vertexShader: `${WRAP}
attribute vec3 aSeed; uniform float uSize, uHex, uPx, uMode; varying float vA; varying float vG; varying float vM; varying float vAsp;
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
vec2 wrapXZ(vec2 w, float r) { return mod(w - uCam.xz + r, 2.0 * r) - r; } // (world-anchored, wrapped round the eye at radius r)
float groundAt(vec2 xz, float or) { float oy = overheadY(xz); return oy > -9000.0 ? oy : or; } // (the top of what is there, or a stand-in)
uniform vec4 uWet[2]; uniform vec2 uWetY; // (the two still waters nearest the eye: their boxes x0 z0 x1 z1, their surfaces; a box with x1 < x0 is none)
float wetAt(vec2 xz) { // (the surface of still water here, or the stand-in for none)
  if (xz.x > uWet[0].x && xz.y > uWet[0].y && xz.x < uWet[0].z && xz.y < uWet[0].w) return uWetY.x;
  if (xz.x > uWet[1].x && xz.y > uWet[1].y && xz.x < uWet[1].z && xz.y < uWet[1].w) return uWetY.y;
  return -1e4;
}
void main() {
  vec3 w; float a = 1.0, size = uSize, lo = 2.5, hi = 8.0; vG = 0.0; vM = aSeed.z; vAsp = 1.0;
  if (uMode < 0.5) {
    vec3 r = wrapAt(aSeed, 0.8 + 0.4 * fract(aSeed.y * 13.1));
    w = uCam + r;
    w += curlish(w * 0.08, uT) * uNoise; // (each mote wanders on the wind's own eddies, the ice sinking slower through them)
    // a crystal's glint: a slow turn that catches the light for a moment, each on its own long period (never a twinkle field)
    vG = uHex * pow(max(0.0, sin(uT * (0.5 + 0.4 * aSeed.x) + aSeed.z * 40.0)), 24.0);
    vA = edgeFade(r) * fallFade(w, aSeed.x);
    vec4 mv0 = viewMatrix * vec4(w, 1.0);
    gl_PointSize = clamp(uSize * uPx / -mv0.z, 1.0, 6.0) * (1.0 + 1.5 * vG);
    gl_Position = projectionMatrix * mv0;
    return;
  }
  if (uMode < 1.5) { // FLIES: nine loose clouds, three of them in a close ring round the eye (they find you), each drifting slowly,
    // its flies on fast unequal loops round it; world-anchored, a cloud wrapping round the eye fades out behind and in ahead
    float c = floor(aSeed.x * 9.0), wr = c < 3.0 ? 6.0 : 16.0;
    vec2 cr = wrapXZ(vec2(h11(c + 1.0), h11(c + 7.0)) * 2.0 * wr + vec2(sin(uT * 0.11 + c), cos(uT * 0.09 + c * 1.7)) * 2.0, wr);
    vec3 cc = vec3(uCam.x + cr.x, 0.0, uCam.z + cr.y);
    cc.y = groundAt(cc.xz, uCam.y - 1.6) + 0.5 + 1.0 * h11(c + 13.0);
    float ph = aSeed.z * 40.0, rr = 0.25 + 0.55 * fract(aSeed.y * 17.0);
    w = cc + rr * vec3(sin(uT * (2.0 + 4.0 * aSeed.y) + ph), 0.5 * sin(uT * (3.0 + 3.0 * aSeed.z) + ph * 1.3), cos(uT * (2.5 + 3.5 * fract(aSeed.x * 31.0)) + ph * 0.7))
      + 0.07 * vec3(sin(uT * 23.0 + ph), sin(uT * 19.0 + ph * 2.0), cos(uT * 29.0 + ph)); // (the dart and jitter of a fly, never a smooth orbit)
    a = 1.0 - smoothstep(wr * 0.65, wr, length(cr));
    if (w.y < overheadY(w.xz) - 0.05) a = 0.0; // (under a roof's edge: none)
  } else if (uMode < 2.5) { // HAIL: a stone's landing, bounce and scatter, a new spot each time round
    float P = 2.6 + 1.4 * aSeed.y, cyc = uT / P + aSeed.x * 7.0, k = floor(cyc), tau = fract(cyc) * P;
    vec3 hs = vec3(h11(k * 1.7 + aSeed.z * 91.0), h11(k * 2.3 + aSeed.x * 53.0), h11(k * 3.1 + aSeed.y * 71.0));
    vec2 rc = wrapXZ(hs.xz * 22.0, 11.0), xz = uCam.xz + rc;
    float gy = groundAt(xz, -1e4), wy = wetAt(xz), tf = 0.1, vb = 1.2 + 1.6 * hs.y, tb = 2.0 * vb / 9.8, y;
    vec2 skip = vec2(cos(hs.y * 40.0), sin(hs.y * 40.0)) * (0.15 + 0.3 * hs.x); // (it skips a little way off the way it bounced)
    if (wy > -9000.0) { gy = wy; a = step(tau, tf); } // (on water a stone is gone at the surface: its ring is the pock, vfx/ripples.js)
    if (tau < tf) y = gy + 22.0 * (tf - tau);
    else if (tau < tf + tb) { float s = tau - tf; y = gy + vb * s - 4.9 * s * s; xz += skip * (s / tb); }
    else { y = gy; xz += skip; }
    w = vec3(xz.x, y + 0.03, xz.y);
    float rest = tf + tb, melt = 1.0 - smoothstep(rest + (P - rest) * 0.4, P * 0.97, tau); // (lying white, then melting into the sand)
    a *= melt * (1.0 - smoothstep(7.0, 11.0, length(rc))) * step(-9000.0, gy); // (none where the ground is not known yet)
    size *= 0.55 + 0.45 * melt;
  } else { // LENS: a pancake of low fog lying on the ground, thicker and deeper in the hollows, drawn as the ellipse it projects to
    vec2 rc = wrapXZ(aSeed.xz * 96.0 + uVel.xz * uT, 48.0), xz = uCam.xz + rc;
    xz += curlish(vec3(xz.x, 0.0, xz.y) * 0.03, uT * 0.25).xz * uNoise;
    float g0 = groundAt(xz, -1e4);
    float gn = 0.125 * (groundAt(xz + vec2(6.0, 0.0), g0) + groundAt(xz - vec2(6.0, 0.0), g0) + groundAt(xz + vec2(0.0, 6.0), g0) + groundAt(xz - vec2(0.0, 6.0), g0)
      + groundAt(xz + vec2(15.0, 9.0), g0) + groundAt(xz - vec2(15.0, 9.0), g0) + groundAt(xz + vec2(-9.0, 15.0), g0) + groundAt(xz - vec2(-9.0, 15.0), g0)); // (the ground round it, near and further: a dip and a basin both count)
    float hollow = clamp((gn - g0) / 1.5, 0.0, 1.0), crest = clamp((g0 - gn) / 1.2, 0.0, 1.0);
    w = vec3(xz.x, g0 + (0.3 + 0.5 * aSeed.y) * (1.0 + 1.5 * hollow), xz.y);
    vec3 dv = uCam - w; float dist = length(dv), sEl = clamp(dv.y / max(0.1, dist), -1.0, 1.0), cEl = sqrt(1.0 - sEl * sEl);
    size *= clamp(dist / 22.0, 0.35, 1.0); // (smaller near the eye: finer there, and never past the sprite's cap)
    vAsp = max(sEl, 0.22 * cEl); // (a flat disc seen at an elevation is an ellipse that tall: edge-on a thin band, from above nearly round)
    w.y = max(w.y, g0 + 0.5 * size * vAsp * cEl + 0.1); // (lifted till its near rim clears the ground: a sprite's one depth never cuts it)
    a = (0.6 + 0.4 * hollow) * (1.0 - 0.7 * crest) * (1.0 - smoothstep(34.0, 48.0, length(rc))) * step(-9000.0, g0); // (none where the ground is not known yet)
    lo = 1.0; hi = 240.0;
  }
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float px = size * uPx / max(0.1, -mv.z);
  gl_PointSize = clamp(px, lo, hi);
  a *= min(1.0, px * px / (lo * lo)) * shoreFade(w);
  gl_Position = projectionMatrix * mv;
  if (uMode > 2.5) { // (a lens fades near the eye and as its centre nears the screen's edge, so a big sprite never pops at the edge)
    vec2 ndc = gl_Position.xy / max(0.001, gl_Position.w);
    a *= smoothstep(1.5, 4.5, -mv.z) * (1.0 - smoothstep(0.82, 1.08, max(abs(ndc.x), abs(ndc.y))));
  } else a *= smoothstep(1.2, 3.5, -mv.z);
  vA = a;
}`,
    fragmentShader: `uniform vec3 uCol; uniform float uA, uHex, uMode; varying float vA; varying float vG; varying float vM; varying float vAsp;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  if (uMode > 2.5) { // a lens of fog: the ellipse its disc projects to, soft to nothing at its rim, mottled by two slow lumps (curdled, never even)
    vec2 q = p * vec2(2.0, 2.0 / vAsp);
    float r = length(q), s = 1.0 - smoothstep(0.15, 1.0, r);
    float lump = 0.7 + 0.3 * sin(p.x * 11.0 + vM * 40.0) * sin(p.y * 9.0 / vAsp - vM * 23.0);
    float k = s * lump; if (k < 0.004) discard;
    gl_FragColor = vec4(mix(uCol, uCol * vec3(1.06, 1.1, 0.7), smoothstep(0.25, 0.9, r)), uA * vA * k); // (the violet sours to bile toward its rim)
    return;
  }
  if (uMode > 1.5) { // a hailstone: a little ice ball lit from above, white on top and blue-grey beneath, so it reads on pale sand as on dark clay
    float d = length(p), body = 1.0 - smoothstep(0.36, 0.5, d);
    if (body < 0.01) discard;
    float lit = clamp(0.5 - 1.6 * p.y - 0.4 * p.x, 0.0, 1.0); // (gl_PointCoord's y runs down the screen: the top is lit)
    gl_FragColor = vec4(uCol * mix(vec3(0.38, 0.46, 0.56), vec3(1.0), lit), uA * vA * body);
    return;
  }
  float hex = max(abs(p.x) * 0.866 + abs(p.y) * 0.5, abs(p.y)); // (a hexagon: the plate crystal)
  float shape = uHex > 0.5 ? 1.0 - smoothstep(0.38, 0.46, hex) : 1.0 - smoothstep(0.15, 0.5, length(p));
  if (shape < 0.01) discard;
  gl_FragColor = vec4(uCol * (0.7 + 1.6 * vG), uA * vA * shape * (0.45 + 0.55 * vG));
}`,
  });
  const P = new THREE.Points(g, m); P.frustumCulled = false; P.renderOrder = 5; P.visible = false;
  return { obj: P, u, n };
}

// ---------------------------------------------------------------- the marks in the sky
const SKYD = 520; // (how far off the sky's marks hang: drawn at the back of the depth, as the dome is, whatever the far plane)
const RING_FRAG = /* glsl */`uniform float uA, uR0, uR1, uMode; varying vec2 vP;
vec3 spectrum(float t) { return clamp(abs(fract(t + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
void main() {
  float t = clamp((length(vP) - uR0) / (uR1 - uR0), 0.0, 1.0), edge = smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.75, 1.0, t)), fall = (1.0 - t) * (1.0 - t);
  if (uMode < 0.5) gl_FragColor = vec4(mix(vec3(1.0, 0.55, 0.4), vec3(0.85, 0.9, 1.0), t), uA * edge);         // the halo: red inside, as ice bends it
  else if (uMode < 1.5) gl_FragColor = vec4(spectrum(0.78 - t * 0.78), uA * edge);                              // the bow: violet inside, red out
  else if (uMode < 2.5) gl_FragColor = vec4(mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.5, 0.35), t), uA * fall);  // a sun dog
  else gl_FragColor = vec4(vec3(0.45, 0.4, 0.6) * fall, uA);                                                    // the glow in the cloud behind a far bolt
}`;
/** A sky mark: a ring (or a disc) facing the eye, one shader for all of them (one program; `mode` picks the look). */
function ringMesh(mode, r0, r1) {
  const u = { uA: { value: 0 }, uR0: { value: r0 }, uR1: { value: r1 }, uMode: { value: mode } };
  const m = new THREE.ShaderMaterial({ name: `weather-${['halo', 'bow', 'dogs', 'glow'][mode]}`,
    uniforms: u, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.9998; }', // (at the back of the depth, as the dome: past the far plane, behind everything near)
    fragmentShader: RING_FRAG,
  });
  const o = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96, 1), m); o.frustumCulled = false; o.renderOrder = 4; o.visible = false;
  return { obj: o, u };
}
const tanD = (d) => Math.tan(THREE.MathUtils.degToRad(d)) * SKYD;

function makeAurora() {
  const u = { uT: { value: 0 }, uA: { value: 0 } };
  const m = new THREE.ShaderMaterial({ name: 'weather-aurora',
    uniforms: u, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9998; }',
    fragmentShader: `uniform float uT, uA; varying vec2 vUv;
float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
void main() {
  float a = vUv.x * 6.2832, y = vUv.y;
  float band = smoothstep(0.15, 0.55, n1(vUv.x * 5.0 + uT * 0.006));                      // (where the curtains hang: most of the sky, drifting)
  float fold = n1(vUv.x * 40.0 + n1(vUv.x * 9.0 + uT * 0.02) * 4.0);                     // (their folds, slow)
  float rays = 0.55 + 0.45 * n1(vUv.x * 260.0 + fold * 6.0);                              // (the fine vertical rays)
  float body = smoothstep(0.0, 0.25, y) * (1.0 - smoothstep(0.45 + 0.35 * fold, 1.0, y)); // (a hem at the bottom, frayed upward)
  vec3 c = mix(vec3(0.12, 0.85, 0.6), vec3(0.2, 0.32, 0.95), smoothstep(0.15, 0.6, y));     // (labradorite's green at the hem, lapis above)
  c = mix(c, vec3(0.55, 0.25, 0.85), smoothstep(0.6, 1.0, y));                             // (and violet at the top)
  gl_FragColor = vec4(c * 1.6, uA * band * body * rays * (0.6 + 0.4 * fold));
}`,
  });
  const o = new THREE.Mesh(new THREE.CylinderGeometry(SKYD, SKYD, 240, 96, 1, true), m); o.frustumCulled = false; o.renderOrder = 4; o.visible = false;
  return { obj: o, u };
}

/** A far bolt: a jagged ribbon from the cloud to the ground, a long way off, its own shape each strike. */
function boltGeo(rand) {
  const pts = []; let x = 0;
  for (let i = 0; i <= 14; i++) { pts.push(new THREE.Vector2(x, 150 - i * 11)); x += (rand() - 0.5) * 18; }
  const pos = []; const w = 1.6;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    pos.push(a.x - w, a.y, 0, a.x + w, a.y, 0, b.x + w, b.y, 0, a.x - w, a.y, 0, b.x + w, b.y, 0, b.x - w, b.y, 0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
}
const rng = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

export class WeatherLook {
  constructor(game) {
    this.game = game;
    this.made = false; // (its meshes are made the first time a weather shows: nothing is compiled for a calm that never ends)
    this.amt = Object.fromEntries(ASPECTS.map((a) => [a, 0])); // (each weather's present amount, eased: a spell comes in and goes out)
    this.sec = Object.fromEntries(ASPECTS.map((a) => [a, 0])); // (and as the AGATE's second: it colours, it never falls)
    this.forced = null; this.wx = null; this.poll = 0; this.t = 0; this.lift = 0;
    this.strike = { next: 4, t: -9, n: 0 };
  }

  /** The meshes, made once, the first time a weather shows. */
  make() {
    this.made = true;
    this.group = new THREE.Group(); this.group.name = 'weather'; this.group.userData.zoneFree = true;
    this.game.scene?.add(this.group);
    this.over = new Overhead(this.game); // (what stands over each spot round the eye: nothing falls under it, vfx/overhead.js)
    this.rain = makeRain(2000, this.over.u); this.motes = makeMotes(2000, this.over.u); // (fewer than they were, R46; the hail's scatter is the most of them)
    this.wide = new Overhead(this.game, { n: 40, cell: 3 }); // (the ground to 60 m round the eye, coarser: the miasma's lenses lie out to 48 m)
    this.mist = makeMotes(LOOK.gall.fall.lenses, this.wide.u); this.mist.u.uMode.value = 3; this.mist.u.uSize.value = 12; this.mist.u.uNoise.value = 2.5;
    this.falls = [this.rain, this.motes, this.mist];
    this.halo = ringMesh(0, tanD(21), tanD(23.5));
    this.bow = ringMesh(1, tanD(40.5), tanD(42.5));
    this.dogs = [0, 1].map(() => ringMesh(2, 0, tanD(1.6)));
    this.aurora = makeAurora();
    const boltMat = new THREE.MeshBasicMaterial({ name: 'weather-bolt', color: 0xd8e8c8, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.bolt = new THREE.Mesh(boltGeo(rng(7)), boltMat); this.bolt.frustumCulled = false; this.bolt.visible = false;
    this.glow = ringMesh(3, 0, 90);
    for (const o of [this.rain.obj, this.motes.obj, this.mist.obj, this.halo.obj, this.bow.obj, ...this.dogs.map((d) => d.obj), this.aurora.obj, this.bolt, this.glow.obj]) this.group.add(o);
  }

  /** For the boot's shader warm-up (main.js): everything made and shown, so its programs compile with the rest and the first weather
   *  never compiles in the middle of play; returns what hides it again (the next update decides what shows). */
  prewarm() {
    if (!this.made) this.make();
    this.group.visible = true; this.group.traverse((o) => { o.visible = true; });
    return () => { this.group.traverse((o) => { if (o !== this.group) o.visible = false; }); };
  }

  /** Where an island's weather stops: a shore's sector (its centre, bearing, half-width, the waterline's radius). Nothing falls past it. */
  shoreline({ center, angle, half, r }) { SHORE_U.uShore.value.set(center.x, center.z, r, 1); SHORE_U.uShoreA.value.set(angle, half); }

  /** Show a weather and an hour whatever the rules say (tests, the workbench); null hands it back to `game.weather`. */
  force(w) { this.forced = w ? { aspect: null, strength: 1, phase: 19 / 24, light: 0.5, exposure: 'open', ...w } : null; }

  /** What the look follows: the forced weather, or the rules where the eye is. Null (no rules yet): nothing, the painting untouched. */
  read(pos) {
    if (this.forced) return this.forced;
    const W = this.game.weather;
    if (!W?.here) return null;
    const h = W.here(pos), s = W.sky?.(undefined, h.place);
    return { aspect: h.aspect, strength: h.strength, second: h.second || null, secondStrength: h.secondStrength || 0, exposure: h.exposure, phase: s?.phase ?? h.phase, light: s?.light ?? 0.5 };
  }

  update(dt, camera) {
    if (!camera) return;
    this.t += dt;
    if ((this.poll -= dt) <= 0 || this.forced) { this.poll = 0.5; this.wx = this.read(camera.position); }
    const w = this.wx, cam = camera.position, sky = this.game.sky;
    // the amounts: the weather here, eased in and out over a few seconds; nothing falls under a roof or down a Well
    const open = w && w.exposure === 'open';
    for (const a of ASPECTS) {
      const tgt = w && w.aspect === a ? w.strength : 0;
      this.amt[a] += (tgt - this.amt[a]) * (1 - Math.exp(-dt * 0.6));
      if (this.amt[a] < 1e-3 && tgt === 0) this.amt[a] = 0;
      const t2 = w && w.second === a ? (w.secondStrength || 0) * (w.strength || 0) : 0; // (the second, as strong as it is in a sky as strong as the first)
      this.sec[a] += (t2 - this.sec[a]) * (1 - Math.exp(-dt * 0.6));
      if (this.sec[a] < 1e-3 && t2 === 0) this.sec[a] = 0;
    }
    // the sky's grade: the hour, then the weather over it (with no rules, the painting as it is)
    if (sky?.grade) {
      if (!w) sky.grade({});
      else {
        const g = hourGrade(w.phase, _g);
        for (const a of ASPECTS) {
          const k = Math.min(1, this.amt[a] + 0.7 * this.sec[a]), S = LOOK[a].sky; if (!k) continue; // (the second colours the sky too)
          g.expo *= lerp(1, S.expo ?? 1, k);
          if (S.mul) for (let i = 0; i < 3; i++) g.mul[i] *= lerp(1, S.mul[i], k);
          g.desat = Math.max(g.desat, (S.desat || 0) * k);
          if (S.haze && S.hazeK * k > g.hazeK) { g.hazeK = S.hazeK * k; S.haze.toArray(g.haze); for (let i = 0; i < 3; i++) g.haze[i] *= 1 - 0.65 * g.night; } // (a horizon's haze holds what light there is: at night an ember, never a lit band)
        }
        sky.grade(Object.assign(_sg, { day: g.day, night: g.night, expo: g.expo, mul: _c.fromArray(g.mul), stars: g.stars, desat: g.desat, haze: _c3.fromArray(g.haze), hazeK: g.hazeK }));
        // the clouds take the hour's light (less of the night's dark: they hold what light there is) and the weather's cover
        const CL = this.game.dunes?.clouds, B = CL?.base;
        if (B) {
          let cover = B.cover, opacity = B.opacity;
          for (const a of ASPECTS) { const k = Math.min(1, this.amt[a] + 0.5 * this.sec[a]), Q = LOOK[a].clouds; if (k && Q) { cover = lerp(cover, Q.cover ?? cover, k); opacity = lerp(opacity, Q.opacity ?? opacity, k); } }
          CL.grade({ expo: Math.pow(g.expo, 0.8) * (1 - 0.5 * g.desat) * (1 - 0.65 * g.night), mul: _c.lerp(_white, 0.5), cover, opacity: opacity * (1 - 0.5 * g.night) * (1 - 0.4 * g.day) }); // (thin under the day's and the night's own painted clouds)
        }
      }
    }
    if (!w) this.game.dunes?.clouds?.grade?.({});
    let any = false; for (const a of ASPECTS) if (this.amt[a] > 1e-3 || this.sec[a] > 1e-3) any = true;
    if (!this.made) { if (!any) { this.lift = 0; return; } this.make(); } // (calm since the boot and never warmed: nothing to draw, nothing made)
    this.group.visible = any || this.t - this.strike.t < 3; // (calm: nothing drawn, nothing updated)
    if (!this.group.visible) { this.lift = 0; SOUR_U.uSour.value = 0; return; }
    const light = w?.light ?? 0.5, dayK = smooth(light, 0.3, 0.6), nightK = 1 - smooth(light, 0.15, 0.4);
    const sun = _v.copy(this.game.dunes?.sunDir || _up).normalize();
    // what falls: the strongest falling weather's way of falling, the others' colours eased in (one rain, one mote field, one fog)
    let rainA = 0, moteA = 0, mistA = 0, hailK = 0;
    const R0 = this.rain.u, M0 = this.motes.u, lit = 0.18 + 0.82 * smooth(light, 0.1, 0.6); // (the fog and the stones take the hour's light; Lachryma's own rain still glows at night)
    for (const a of ASPECTS) {
      const k = open ? this.amt[a] : 0, F = LOOK[a].fall; if (!F || !k) continue;
      if (F.vel && k > rainA) { // (streaks: rain falling, hail, or sand blown along the ground)
        rainA = k; this.tint(R0.uCol.value, a); R0.uLen.value = F.len; R0.uA.value = F.alpha * k;
        if (F.kind === 'hail') R0.uCol.value.multiplyScalar(lit);
        R0.uNoise.value = F.noise ?? (F.kind === 'sirocco' ? 1.2 : 0.6); R0.uLowK.value = F.lowK ?? (F.kind === 'sirocco' ? 0.3 : 0.18); // (the sirocco streams along the ground: more of it low; the hail falls nearly straight, most of it to the ground)
        R0.uVel.value.fromArray(F.vel); const wd = this.game.dunes?.wind?.dir; if (wd && F.kind === 'sirocco') R0.uVel.value.set(wd.x, F.vel[1], wd.y); R0.uVel.value.multiplyScalar(F.speed); // (the wanting wind blows the way the dunes' wind does)
        this.rain.obj.geometry.setDrawRange(0, Math.round(this.rain.n * F.rate * k) * 2);
      }
      const diamond = F.kind === 'diamond', dk = diamond ? k * dayK : k; // (diamond dust by day; at night wonder is the aurora)
      if (F.kind !== 'rain' && dk > moteA) {
        moteA = dk; this.tint(M0.uCol.value, a); M0.uHex.value = diamond ? 1 : 0;
        if (F.kind === 'miasma') { // (the flies: dark whatever the agate, a few dozen in nine loose clouds)
          M0.uMode.value = 1; M0.uCol.value.copy(LOOK[a].fly); M0.uSize.value = 0.05; M0.uA.value = 0.9 * dk;
          this.motes.obj.geometry.setDrawRange(0, Math.round(F.flies * dk));
        } else if (F.kind === 'hail') { // (the stones landing, bouncing once and lying white till they melt)
          M0.uMode.value = 2; M0.uCol.value.multiplyScalar(lit); M0.uSize.value = 0.075; M0.uA.value = 0.85 * dk;
          this.motes.obj.geometry.setDrawRange(0, Math.min(this.motes.n, Math.round(F.scatter * dk)));
        } else {
          M0.uMode.value = 0; M0.uSize.value = diamond ? 0.05 : 0.12;
          M0.uVel.value.set(diamond ? 0.05 : F.speed, diamond ? -F.speed : 0.3, diamond ? 0 : F.speed * 0.3); M0.uA.value = (diamond ? 0.8 : 0.6) * dk;
          M0.uNoise.value = diamond ? 1.0 : 2.0; M0.uLowK.value = diamond ? 0.2 : 0.3;
          this.motes.obj.geometry.setDrawRange(0, Math.min(this.motes.n, Math.round(800 * F.rate * dk))); // (the drift as it was: 800 at most)
        }
      }
      if (F.lenses && k > mistA) { // (the miasma's low fog: its lenses, tinted by an agate's second, lit by the hour)
        mistA = k; const U = this.mist.u; U.uCol.value.copy(LOOK[a].mist); this.tintBy(U.uCol.value, a).multiplyScalar(lit);
        const fc = this.game.scene?.fog?.color; if (fc) U.uCol.value.lerp(fc, 0.6 * nightK); // (at night a fog is the night's own fog, a little lighter than the sand, never a dark stain)
        U.uA.value = 0.8 * k;
        const wd = this.game.dunes?.wind?.dir; U.uVel.value.set(wd ? wd.x * 0.35 : 0.3, 0, wd ? wd.y * 0.35 : 0.15); // (it creeps with the wind, slowly)
        this.mist.obj.geometry.setDrawRange(0, Math.round(F.lenses * Math.min(1, 0.4 + 0.6 * k)));
      }
      if (F.kind === 'hail') hailK = Math.max(hailK, k);
    }
    this.rain.obj.visible = rainA > 0.01; this.motes.obj.visible = moteA > 0.01; this.mist.obj.visible = mistA > 0.01;
    if (this.rain.obj.visible || this.motes.obj.visible) this.over.update(cam, 48); // (a few dozen rays a frame: the map round the eye kept fresh)
    if (this.mist.obj.visible) this.wide.update(cam, 32);
    for (const L of this.falls) { L.u.uT.value = this.t; L.u.uCam.value.copy(cam); }
    M0.uPx.value = this.mist.u.uPx.value = 480 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); // (the scene is drawn at 480 lines)
    this.pock(dt, hailK, cam); if (hailK > 0.01) this.wet(cam);
    SOUR_U.uSour.value = open ? Math.min(1, this.amt.gall || 0) : 0; // (the curdled film on still water and Lachryma, as strong as the miasma here)
    // the marks in the sky (open places only: none of them is seen from a room)
    const mk = (a) => (open ? Math.min(1, this.amt[a] + this.sec[a]) : 0); // (the marks are the sky's colouring: a second raises its own, an aurora under a pall)
    const won = mk('wonder'), mir = mk('mirth'), dre = mk('dread');
    this.sky(this.halo, won * dayK * 0.22, cam, sun, 1);
    this.sky(this.bow, mir * dayK * 0.16, cam, sun, -1);
    const elev = Math.asin(THREE.MathUtils.clamp(sun.y, -1, 1)), az = Math.atan2(sun.z, sun.x), off = THREE.MathUtils.degToRad(22) / Math.max(0.3, Math.cos(elev));
    for (let i = 0; i < 2; i++) { _w.set(Math.cos(az + (i ? off : -off)) * Math.cos(elev), Math.sin(elev), Math.sin(az + (i ? off : -off)) * Math.cos(elev)); this.sky(this.dogs[i], won * dayK * 0.6, cam, _w, 1); }
    const au = this.aurora; au.obj.visible = won * nightK > 0.01; au.u.uA.value = 0.55 * won * nightK; au.u.uT.value = this.t; au.obj.position.set(cam.x, cam.y + 230, cam.z);
    this.thunder(dt, dre, cam);
  }

  /** What falls takes its weather's colour (or its own: the hail is white), with the agate's second worked into it (the second
   *  colours; it never falls). */
  tint(out, a) { out.copy(LOOK[a].fall?.colour ?? LOOK[a].colour).multiplyScalar(LOOK[a].tone ?? 1); return this.tintBy(out, a); }
  /** An agate's second worked into a colour. */
  tintBy(out, a) {
    for (const b of ASPECTS) if (b !== a && this.sec[b] > 0.01) out.lerp(_c3.copy(LOOK[b].colour).multiplyScalar(LOOK[b].tone ?? 1), 0.5 * this.sec[b]);
    return out;
  }

  /** The two still waters nearest the eye, for the hail (a stone that lands on water is gone, not lying), twice a second. */
  wet(cam) {
    if ((this.wetT = (this.wetT || 0) - 1) > 0) return; this.wetT = 30;
    const vols = (this.game.water?.volumes || []).filter((v) => Math.abs(v.surface - cam.y) < 40).map((v) => [Math.hypot(Math.max(v.x0 - cam.x, 0, cam.x - v.x1), Math.max(v.z0 - cam.z, 0, cam.z - v.z1)), v]).sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < 2; i++) { const v = vols[i]?.[0] < 30 ? vols[i][1] : null; WET_U.uWet.value[i].set(v ? v.x0 : 1, v ? v.z0 : 1, v ? v.x1 : 0, v ? v.z1 : 0); WET_U.uWetY.value.setComponent(i, v ? v.surface : 0); }
  }

  /** The hail on still water: a few small hard rings a second near the eye, a light touch in the ripple tank (`game.water.disturb`;
   *  a touch off the water is no touch). Kind 'drop', weak, so a ring is small and quick. */
  pock(dt, k, cam) {
    const W = this.game.water; if (!W?.disturb || k < 0.05) return;
    this.pockAcc = (this.pockAcc || 0) + dt * 36 * k;
    while (this.pockAcc >= 1) { this.pockAcc -= 1; W.disturb(cam.x + (Math.random() - 0.5) * 22, cam.z + (Math.random() - 0.5) * 22, 0.35 + 0.25 * Math.random(), 'drop'); }
  }

  /** Hang a sky mark: a ring centred on a direction from the eye (the sun's, or its opposite), facing the eye. */
  sky(m, a, cam, dir, sign) {
    m.obj.visible = a > 0.005; if (!m.obj.visible) return;
    m.u.uA.value = a;
    m.obj.position.copy(cam).addScaledVector(dir, SKYD * sign);
    m.obj.lookAt(cam);
  }

  /** The pall's thunder: far bolts on their own clock, each held a beat and fading; a slow glow in the cloud; a small lift for the light. */
  thunder(dt, k, cam) {
    const S = this.strike, B = this.bolt, G = this.glow;
    if (k > 0.05 && this.t >= S.next) {
      const r = rng(hash32(1 + S.n++)), bear = r() * Math.PI * 2, dist = 260 + r() * 70; // (inside the dunes' far plane: a long way off, never on top of you; the seed hashed, since a Lehmer generator's first draw is linear in it and the bearings walked round in 22-degree steps)
      B.geometry.dispose(); B.geometry = boltGeo(r);
      B.position.set(cam.x + Math.cos(bear) * dist, cam.y - 40, cam.z + Math.sin(bear) * dist); B.lookAt(cam.x, cam.y - 40, cam.z);
      G.obj.position.set(B.position.x, cam.y + 110, B.position.z); G.obj.lookAt(cam);
      S.t = this.t; S.next = this.t + (6 + 10 * r()) / Math.max(0.3, k);
    }
    const e = this.t - S.t;
    const bolt = e < 0.12 ? e / 0.12 : e < 0.4 ? 1 : Math.max(0, 1 - (e - 0.4) / 1.5); // (up, held a beat, a second and a half to go)
    const glow = e < 0.5 ? smooth(e, 0, 0.5) : Math.max(0, 1 - (e - 0.5) / 2.2);
    B.visible = bolt > 0.01 && k > 0.01; B.material.opacity = 0.85 * bolt * Math.min(1, k * 2);
    G.obj.visible = glow > 0.01 && k > 0.01; G.u.uA.value = 0.35 * glow * k;
    this.lift = 0.1 * glow * k;
  }

  dispose() {
    this.game.sky?.grade?.({}); SOUR_U.uSour.value = 0;
    if (!this.made) return;
    this.over.dispose(); this.wide.dispose();
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh || o.isPoints || o.isLineSegments) { o.geometry.dispose(); o.material.dispose(); } });
  }
}
const _g = { mul: [1, 1, 1], haze: [0, 0, 0] }, _sg = {};
const hash32 = (n) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) % 2147483646 + 1; }; // (a seed scattered: neighbours land far apart)
const _white = new THREE.Color(1, 1, 1), _c = new THREE.Color(), _c3 = new THREE.Color(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
