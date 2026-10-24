// ---------------------------------------------------------------------------------------
// THE GUSTS: a travelling front of stronger wind sweeping through the weather every few real seconds, felt by everything that falls
// together (the streaks and the drifting motes of vfx/weather.js, the impacts' dust and haze, the lens drops' grit), so the field
// never reads as one even drizzle. A front is a line across the wind, bent a little along its length, moving downwind at its own
// speed; where it passes, what falls lurches downwind fast and eases back slowly, and the curl noise (`curlish`) sways harder. Each
// front is its own strength (a smooth swell along it, never a seam), so one gust is a shove and the next a breath.
// Per feeling (`GUSTS`): Desire's wanting wind the strongest and quickest, Grief's long rain in slow heavy shoves, Gall's miasma almost
// still (stagnant air is the point), Fury's hail too heavy to be blown far.
//
// Prior art: real squall gust fronts (the outflow boundary ahead of a storm: a line of stronger wind passing through), the wind fields of
// Ghost of Tsushima and Breath of the Wild's grass (a gust as a band travelling across the field, not every blade at once), and the
// "wind zones" of the seventh generation's engines (Unity's wind zone: a main wind plus pulses of turbulence at a frequency).
//
//   GUST_U   the uniforms (shared, one object: every falling program spreads it into its own uniforms)
//   GUST_GLSL  gustAt(vec2 xz, float back) -> 0..1, the gust on a spot (`back` real seconds ago: a streak's tail); gustDir() the gusts'
//              heading (xz, unit); uGust.z its push in metres
//   gustAt(x, z) the same in JS, now (the lens drops' grit asks it at the eye)
//   GUSTS[aspect] { push, heavy, period, speed }   setGusts(eff, heavyOf, wind, dt) the uniforms set from the weathers' amounts, each
//              frame (vfx/weatherfx/index.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Each weather's gusts: `push` metres downwind at a front's peak, `period` real seconds between fronts on one spot, `speed` the
 *  front's own speed (m/s); `heavy` the push when its spell runs heavy. */
export const GUSTS = {
  desire: { push: 3.2, heavy: 5, period: 5, speed: 10 },
  grief:  { push: 1.4, heavy: 2.6, period: 7, speed: 7 },
  mirth:  { push: 0.7, period: 8, speed: 5 },
  wonder: { push: 0.5, period: 9, speed: 3 },
  dread:  { push: 1.1, heavy: 1.8, period: 6, speed: 6 },
  fury:   { push: 0.35, period: 6, speed: 11 },
  gall:   { push: 0.12, period: 10, speed: 2 },
};
const DEFAULT_DIR = new THREE.Vector2(0.92, 0.38).normalize(); // (the way the rain slants in vfx/weather.js, where no dunes' wind is)

export const GUST_U = {
  uGust: { value: new THREE.Vector4(DEFAULT_DIR.x, DEFAULT_DIR.y, 0, 42) }, // (heading xz, push metres, the fronts' spacing in metres)
  uGustT: { value: new THREE.Vector2(0, 0) }, // (the fronts' phase: how many have passed the origin, accumulated, so a change of pace never jumps them)
};

export const GUST_GLSL = /* glsl */`
uniform vec4 uGust; uniform vec2 uGustT;
vec2 gustDir() { return uGust.xy; }
// how much of a gust is on this spot, 0..1, back seconds-worth of phase ago (a streak's tail): quick to rise (a fifteenth of the
// period), slow to ease; zero as the next front arrives, so a front's own strength changing between fronts is never a jump
float gustAt(vec2 xz, float back) {
  if (uGust.z <= 0.0) return 0.0;
  vec2 d = uGust.xy, q = vec2(-d.y, d.x);
  float L = max(1.0, uGust.w), lat = dot(xz, q);
  float s = (dot(xz, d) + 7.0 * sin(lat * 0.043) + 3.0 * sin(lat * 0.11 + 1.7)) / L - (uGustT.x - back * uGustT.y);
  float f = fract(-s), n = floor(-s);
  float p = smoothstep(0.0, 0.07, f) * (1.0 - smoothstep(0.18, 0.85, f));
  return p * (0.5 + 0.5 * sin(n * 2.39 + lat * 0.031 + 0.8)) * (0.6 + 0.4 * sin(n * 1.13 - lat * 0.017)); // (each front its own strength, swelling along it)
}`;

const smooth = THREE.MathUtils.smoothstep;
/** The gust on a spot (JS twin of the GLSL). */
export function gustAt(x, z) {
  const G = GUST_U.uGust.value; if (G.z <= 0) return 0;
  const lat = -G.y * x + G.x * z, L = Math.max(1, G.w);
  const s = (G.x * x + G.y * z + 7 * Math.sin(lat * 0.043) + 3 * Math.sin(lat * 0.11 + 1.7)) / L - GUST_U.uGustT.value.x;
  const f = -s - Math.floor(-s), n = Math.floor(-s);
  const p = smooth(f, 0, 0.07) * (1 - smooth(f, 0.18, 0.85));
  return p * (0.5 + 0.5 * Math.sin(n * 2.39 + lat * 0.031 + 0.8)) * (0.6 + 0.4 * Math.sin(n * 1.13 - lat * 0.017));
}

/** The gusts' uniforms from what is falling now: the strongest weather's gusts, by its amount (`eff`: the look's amounts, `heavyOf` its
 *  heaviness), heading with the dunes' wind where there is one. */
export function setGusts(eff, heavyOf, wind, dt) {
  let best = null, bk = 0;
  for (const a in GUSTS) if ((eff[a] || 0) > bk) { bk = eff[a]; best = a; }
  const G = GUST_U.uGust.value, d = wind || DEFAULT_DIR, T = GUST_U.uGustT.value, e = 1 - Math.exp(-dt * 0.5);
  const S = best ? GUSTS[best] : null, push = S ? THREE.MathUtils.lerp(S.push, S.heavy ?? S.push, heavyOf(bk)) * bk : 0;
  G.x = d.x; G.y = d.y; G.z += (push - G.z) * e; // (eased: a change of weather never jolts the field)
  if (S) { G.w += (S.speed * S.period - G.w) * e; T.y = S.speed / Math.max(1, G.w); } // (the spacing eased; the pace in fronts a second)
  T.x = (T.x + dt * T.y) % 4096; // (the phase, kept small for the GPU's floats; a wrap lands on a whole front, where the pulse is zero)
}
