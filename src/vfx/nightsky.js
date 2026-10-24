// ---------------------------------------------------------------------------------------
// THE NIGHT ALIVE: the dome's night layer (its GLSL, NIGHT_GLSL, pasted into vfx/sky.js's one program, and its uniforms, NIGHT_UNIFORMS,
// shared by every dome) and what drives it once a frame (the owner, R46: "auroras on the horizon at night at The Shore" and "make the
// night sky feel more alive"; 2026-10-24: "the art to flow"). Nothing here is a draw call of its own.
//
//   THE WHEEL      the stars turn about their pole once a game day (the hour's own phase), too slowly to see except over a stay
//   METEORS        one every 25 to 70 real seconds of night, a short streak falling across 8 to 14 degrees of sky in 0.6 s; on a
//                  METEOR SHOWER's night (`meteorShowerOf(day)`: about one game day in six, seeded by today(), the same for everyone)
//                  one every 1.5 to 5 real seconds, each running out from the shower's radiant
//   THE AURORA     at the Shore, by night: curtains low over the sea (the shore's bearing), easing in over 6 s as you come down to the
//                  beach and out as you leave it
//   THE CLOUD      the cloud layer's own field (vfx/clouds.js: its noise, drift, cover and opacity) handed to the dome each frame, so the
//                  stars, the meteor and the aurora sit behind it (the owner, R10); with no layer drawn, nothing hides them
//   THE MOON       where the sun was (the light's one direction), its PHASE by the game days (`moonOf(ms)`: new to full and back over
//                  MOON.days game days, the terminator soft, the dark side in earthshine), its glow and its lift on the night's own colour
//                  (`uMoon.z`: the dome's night grade brightened and cooled a little by a full moon; render/daylight.js may read the
//                  same lift for the ground's light: a handoff to Petra)
//   THE CONSTELLATIONS  the house's figures (vfx/constellations.js: the Fool's and the twelve zodiac Majors'), their stars always there,
//                  brighter than the field; their LINES fade in when the camera holds still looking up for a few real seconds
//   A FEELING'S NIGHT   each weather has its own (the shares from vfx/weather.js's `eff`, by night):
//                  Wonder   the aurora everywhere, brighter, taller and quicker
//                  Mirth    fireflies of starlight low in the sky, drifting and breathing gold, and a warm 22-degree halo round the moon
//                  Desire   a rose-gold haze over the stars (the stars warmed with it) and a slow comet, its tail away from the hidden sun
//                  Fury     heat lightning: a soft glow swelling and falling inside far cloud on the horizon, never more than a patch of
//                           sky, never quicker than a breath (CLAUDE.md: no flicker)
//                  Gall     a sickly green airglow banding the horizon, its gravity waves drifting
//                  Grief    the overcast: no stars but through one break in it, which wanders
//                  Dread    the stars going out one by one as a slow wave crosses the sky, and coming back behind it
//
// Prior art: the turning star fields of Okami and Outer Wilds (the sky a clock you can read), Breath of the Wild's shooting stars and its
// blood moon (a rare night the sky gives you), the Perseids (a shower's meteors all run out from one radiant), the aurora as seen from a
// northern shore, the planetarium's lines faded in on a pause (Stellarium's), the real moon's phases (its lit fraction (1 - cos a) / 2),
// a 22-degree ice halo, airglow's green 557.7 nm bands photographed from orbit, and heat lightning seen inside far summer cloud.
//
//   game.nightSky = new NightSky(game, { seaBearing })   .update(rawDt, camera)   .shown (the constellations' lines, 0..1)
//   NIGHT_UNIFORMS()  the uniforms (sky.js spreads them into its G)   NIGHT_GLSL   moonOf(ms)   meteorShowerOf(day)   MOON
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { now, today, DAY_MS } from '../core/calendar.js';
import { CONSTELLATIONS } from './constellations.js';

/** The moon: game days a lunation (new, waxing, full, waning, one a game day), the day it was new, and how much a full moon lifts the night's colour. */
export const MOON = { days: 8, epoch: 3, lift: 0.14 };
/** The moon at a time: its age through the lunation (0 new .. 0.5 full .. 1), its phase angle (radians) and its lit fraction. */
export function moonOf(ms = now()) {
  const p = ((((ms / DAY_MS - MOON.epoch) / MOON.days) % 1) + 1) % 1, a = p * Math.PI * 2;
  return { age: p, angle: a, lit: (1 - Math.cos(a)) / 2 };
}
/** A game day's seeded draw (the same for everyone): mulberry32. */
const rnd = (n) => { let t = (n + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** Whether a game day's night has a meteor shower, and its radiant (azimuth, elevation, radians): about one game day in six. */
export function meteorShowerOf(day = today()) {
  if (rnd(day * 7 + 1) > 0.17) return null;
  return { az: rnd(day * 7 + 2) * Math.PI * 2, el: (40 + 30 * rnd(day * 7 + 3)) * (Math.PI / 180) };
}

// THE CONSTELLATIONS PACKED: one small float texture the dome reads with exact texels (a row a kind): 0 the stars (direction on the
// stars' wheel, brightness), 1 and 2 a line's ends (2's w: the figure's brightness), 3 each figure's cap (its centre and the cosine of
// its radius: a pixel outside it skips the figure), 4 each figure's ranges (first star, star count, first line, line count).
const CON_W = 128, CON_H = 5;
const POLE = new THREE.Vector3(0, 0.819, -0.574).normalize(), E1 = new THREE.Vector3(1, 0, 0), E2 = new THREE.Vector3().crossVectors(POLE, E1).normalize();
function onWheel(ra, dec, out = new THREE.Vector3()) { // (a direction on the stars' wheel: the same frame the shader turns the sky in)
  const a = ra * (Math.PI / 180), d = dec * (Math.PI / 180);
  return out.copy(E1).multiplyScalar(Math.cos(a) * Math.cos(d)).addScaledVector(E2, Math.sin(a) * Math.cos(d)).addScaledVector(POLE, Math.sin(d));
}
function constellationTexture() {
  const D = new Float32Array(CON_W * CON_H * 4), put = (row, i, a, b, c, w) => { const o = (row * CON_W + i) * 4; D[o] = a; D[o + 1] = b; D[o + 2] = c; D[o + 3] = w; };
  const east = new THREE.Vector3(), north = new THREE.Vector3(), C = new THREE.Vector3(), p = new THREE.Vector3(), R = Math.PI / 180;
  let ns = 0, nl = 0;
  CONSTELLATIONS.forEach((K, ci) => {
    onWheel(K.ra, K.dec, C); const a = K.ra * R, d = K.dec * R, br = K.bright ?? 1;
    east.copy(E1).multiplyScalar(-Math.sin(a)).addScaledVector(E2, Math.cos(a));
    north.copy(E1).multiplyScalar(-Math.sin(d) * Math.cos(a)).addScaledVector(E2, -Math.sin(d) * Math.sin(a)).addScaledVector(POLE, Math.cos(d));
    const at = K.stars.map(([x, y]) => p.copy(C).addScaledVector(east, x * R).addScaledVector(north, y * R).normalize().clone());
    let cosR = 1; for (const s of at) cosR = Math.min(cosR, s.dot(C));
    const s0 = ns, l0 = nl;
    at.forEach((s, i) => put(0, ns++, s.x, s.y, s.z, K.stars[i][2] * br));
    for (const [i, j] of K.lines) { put(1, nl, at[i].x, at[i].y, at[i].z, 0); put(2, nl++, at[j].x, at[j].y, at[j].z, br); }
    put(3, ci, C.x, C.y, C.z, Math.cos(Math.acos(cosR) + 2 * R)); put(4, ci, s0, at.length, l0, K.lines.length);
  });
  const t = new THREE.DataTexture(D, CON_W, CON_H, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return { texture: t, count: CONSTELLATIONS.length };
}

/** The night layer's uniforms (every dome shares one set: sky.js spreads them into its G). */
export function NIGHT_UNIFORMS() {
  const con = constellationTexture();
  return {
    // its clock (real seconds), the stars' wheel (radians), the aurora (amount, its own clock, its height; its bearing and half-width),
    // and a meteor (its start and end directions; its age 0..1, below 0 none)
    uNT: { value: 0 }, uWheel: { value: 0 }, uAur: { value: 0 }, uAurT: { value: 0 }, uAurH: { value: 1 }, uAurDir: { value: new THREE.Vector2(0, 1.1) },
    uMetS: { value: new THREE.Vector3(1, 0, 0) }, uMetE: { value: new THREE.Vector3(1, 0, 0) }, uMetK: { value: -1 },
    // the cloud layer's field, so the stars sit behind it (its noise, its drift; its cover, opacity, whether drawn, whether bound)
    uCloudNoise: { value: null }, uCloudOff: { value: new THREE.Vector2() }, uCloud: { value: new THREE.Vector4(0.5, 0, 0, 0) },
    // the moon (phase angle, lit fraction, the lift on the night's colour); the constellations (texture, count, the lines' fade)
    uMoon: { value: new THREE.Vector4(Math.PI, 1, 0, 0) }, uConTex: { value: con.texture }, uConN: { value: con.count }, uCons: { value: 0 },
    // a feeling's night: the shares (wonder, mirth, desire, fury | gall, grief, dread), Fury's flash (azimuth, elevation, radius,
    // amount), Desire's comet (head, tail length | the tail's way), Grief's break (its direction)
    uFN0: { value: new THREE.Vector4() }, uFN1: { value: new THREE.Vector4() }, uFlash: { value: new THREE.Vector4(0, 0.1, 0.15, 0) },
    uComet: { value: new THREE.Vector4(0, 1, 0, 0) }, uCometT: { value: new THREE.Vector3(0, 1, 0) }, uBreak: { value: new THREE.Vector3(0, 1, 0) },
  };
}

// THE STARS AS A SKY HAS THEM (the owner, R10: "too uniform in colour and brightness", "drawn in front of the clouds"):
//   COLOUR      each star its own temperature, a lognormal round 6300 K (most near white, a tail to orange at 3000 K and to blue-white
//               past 15000 K), drawn on the Planckian locus, and the whole field leaning a little warmer or cooler across the sky
//   BRIGHTNESS  a power law (N(>F) ~ F^-1.4, near the -1.5 of stars spread evenly through space): many faint, a few bright, the
//               brightest a touch larger. A faint star is dimmer, never smaller: a soft Gaussian at least a pixel wide (no crawl)
//   BEHIND      the cloud layer's own field read here, so a star is gone under a cloud and fades at its fringe; the night painting's
//               swirls (`swirl`) let them through only where they are thin; a high CIRRUS drifting slower than the cloud dims patches
//   TWINKLE     slow (a few seconds a breath), deeper near the horizon, where starlight crosses more air (and is dimmer there: extinction)
// Prior art: the Yale Bright Star Catalogue's colour indices and counts; Tanner Helland's fit to the blackbody in sRGB (2012); the
// starfields of Elite and of Outer Wilds (a few bright stars and a dust of faint ones); every real night, where cloud hides the stars.
export const NIGHT_GLSL = /* glsl */`
uniform float uNT, uWheel, uAur, uAurT, uAurH, uMetK, uConN, uCons; uniform vec2 uAurDir; uniform vec3 uMetS, uMetE;
uniform sampler2D uCloudNoise; uniform vec2 uCloudOff; uniform vec4 uCloud; // (the cloud layer's cover and opacity, whether it is drawn, whether its noise is bound)
uniform vec4 uMoon, uFN0, uFN1, uFlash, uComet; uniform vec3 uCometT, uBreak; uniform sampler2D uConTex;
float nh1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float nn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(nh1(i), nh1(i + 1.0), f); }
float nh2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(nh2(i), nh2(i + vec2(1.0, 0.0)), f.x), mix(nh2(i + vec2(0.0, 1.0)), nh2(i + vec2(1.0)), f.x), f.y); }
vec3 nh3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
vec4 conAt(float i, float row) { return texture2D(uConTex, vec2((i + 0.5) / ${CON_W}.0, (row + 0.5) / ${CON_H}.0)); }
// a star's colour at a temperature (Kelvin): Tanner Helland's fit to the Planckian locus in sRGB, taken to linear light
vec3 starColour(float t) {
  t *= 0.01;
  float r = t <= 66.0 ? 1.0 : 1.292936 * pow(t - 60.0, -0.1332047);
  float g = t <= 66.0 ? 0.3900816 * log(t) - 0.6318414 : 1.1298909 * pow(t - 60.0, -0.0755148);
  float b = t >= 66.0 ? 1.0 : 0.5432068 * log(max(t - 10.0, 1.0)) - 1.1962541;
  return pow(clamp(vec3(r, g, b), 0.0, 1.0), vec3(2.2));
}
// the cloud layer over a direction, as vfx/clouds.js draws it (its flat ceiling and two octaves), widened a little: what it hides
float cloudOver(vec3 d) {
  vec2 uv = d.xz / (max(d.y, 0.0) + 0.1) * 0.22;
  float n = texture2D(uCloudNoise, uv + uCloudOff).r * 0.7 + texture2D(uCloudNoise, uv * 2.7 - uCloudOff * 1.6 + 0.37).r * 0.3;
  return smoothstep(uCloud.x - 0.08, uCloud.x + 0.16, n) * smoothstep(0.015, 0.22, d.y) * clamp(uCloud.y * 2.5, 0.0, 1.0);
}
// Dread's wave: a star with threshold h (0..1) is out while the wave over it is below its threshold, eased over a second or two
float dreadOn(vec3 d, float h) {
  float w = 0.5 + 0.5 * sin(dot(d, vec3(0.78, 0.22, 0.58)) * 2.6 - uNT * 0.11);
  float t = 0.05 + 0.9 * h; return smoothstep(t - 0.04, t + 0.04, w);
}
// THE MOON: its disc where the sun was, lit by its phase (uMoon.x: 0 new, pi full), the dark side in earthshine; returns its cover
float moonDisc(inout vec3 c, vec3 d, vec3 m, float night) {
  float md = dot(d, m), disc = smoothstep(0.99985, 0.99992, md);
  if (disc > 0.0) {
    vec3 X = normalize(cross(m, abs(m.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0))), Y = cross(X, m);
    vec2 o = vec2(dot(d, X), dot(d, Y)) / 0.0155; vec3 n = vec3(o, sqrt(max(0.0, 1.0 - dot(o, o)))); // (z toward the eye)
    float lit = smoothstep(-0.06, 0.1, dot(n, vec3(sin(uMoon.x), 0.0, -cos(uMoon.x))));
    float maria = 0.86 + 0.14 * sin(o.x * 5.0 + 1.0) * sin(o.y * 4.0 + 2.0);
    vec3 mc = vec3(0.82, 0.86, 0.95) * (0.75 + 0.25 * smoothstep(0.99985, 0.99998, md)) * maria * mix(0.05, 1.0, lit);
    c = mix(c, mc, disc * night);
  }
  c += vec3(0.45, 0.55, 0.8) * pow(max(md, 0.0), 300.0) * 0.12 * night * (0.2 + 0.8 * uMoon.y); // (its glow, as full as it is)
  return disc;
}
vec3 nightAlive(vec3 c, vec3 d, float k, float swirl, vec3 moon) {
  float wonK = uFN0.x, mirK = uFN0.y, desK = uFN0.z, furK = uFN0.w, galK = uFN1.x, griK = uFN1.y, drdK = uFN1.z;
  float lum = dot(c, vec3(0.299, 0.587, 0.114)), dark = 1.0 - smoothstep(0.18, 0.5, lum), up = smoothstep(0.0, 0.1, d.y);
  float pxA = max(length(fwidth(d)), 1e-5);                                              // (a pixel, in radians of sky)
  float az = atan(d.z, d.x), e = asin(clamp(d.y, -1.0, 1.0));
  float cl = uCloud.z > 0.5 ? cloudOver(d) : 0.0, clear = 1.0 - cl;
  // Grief's overcast: the stars only through one break, which wanders; the rest a low grey lid, the break's rim moonlit
  float brk = 1.0;
  if (griK > 0.001) {
    float edge = 0.2 + 0.07 * nn1(dot(d, vec3(9.1, 4.3, 6.7)) + uNT * 0.05);
    brk = smoothstep(cos(edge + 0.06), cos(edge - 0.03), dot(d, uBreak));
    c = mix(c, c * 0.55 + vec3(0.028, 0.032, 0.04), griK * (1.0 - brk) * 0.75 * up);
    c += vec3(0.05, 0.06, 0.08) * griK * brk * (1.0 - brk) * 2.5 * k;
  }
  float starMask = mix(1.0, brk, griK) * mix(1.0, 0.75, galK * (1.0 - smoothstep(0.0, 0.35, e)));
  float cirrus = uCloud.w > 0.5 ? texture2D(uCloudNoise, d.xz / (max(d.y, 0.0) + 0.3) * 0.08 + uCloudOff * 0.4 + 0.53).r : 0.6; // (the cirrus: higher and slower than the cloud)
  float air = mix(0.3, 1.0, smoothstep(0.03, 0.45, d.y));                                // (extinction: low stars through more air, dimmer)
  float seen = clear * mix(0.35, 1.0, smoothstep(0.34, 0.62, cirrus)) * (1.0 - smoothstep(0.05, 0.4, swirl)) * dark * up * air * k * starMask;
  vec3 rose = vec3(1.0, 0.68, 0.55);                                                     // (Desire's rose gold)
  // the wheel: the sky turned about a pole 35 degrees off the zenith, toward the north (-z)
  vec3 P = normalize(vec3(0.0, 0.819, -0.574)); float ca = cos(uWheel), sa = sin(uWheel);
  vec3 r = d * ca + cross(P, d) * sa + P * dot(P, d) * (1.0 - ca);
  vec3 q = r * 70.0, base = floor(q - 0.5);
  float px = max(max(length(dFdx(q)), length(dFdy(q))), 1e-4);                          // (a pixel, in the star field's own units)
  float lean = sin(r.x * 2.1 + 1.3) * sin(r.y * 1.7 + 0.4) * sin(r.z * 2.3 + 2.1);         // (the field warmer or cooler across the sky)
  float low = 1.0 - smoothstep(0.0, 0.5, d.y);
  vec3 sum = vec3(0.0);
  if (seen > 0.002) for (int i = 0; i < 8; i++) {                                         // (the eight cells round the point: a star is found whole)
    vec3 cell = base + vec3(mod(float(i), 2.0), mod(floor(float(i) * 0.5), 2.0), floor(float(i) * 0.25));
    vec3 h = nh3(cell);
    if (h.x > 0.24) continue;                                                              // (one cell in four may hold a star)
    vec3 S = normalize(cell + 0.15 + 0.7 * nh3(cell + 17.0)) * 70.0;                      // (the star, on the sphere)
    if (any(notEqual(floor(S), cell))) continue;                                           // (only one whose point lies in its own cell)
    vec3 h2 = nh3(cell + 41.0);
    float F = min(pow(max(h.y, 0.004), -0.72), 40.0);                                      // (its flux: most near 1, one in a hundred past 25)
    float temp = 6300.0 * exp((h2.x + h2.y + h2.z - 1.5) * 0.9 + lean * 0.3);
    float sig = px * mix(0.62, 1.05, smoothstep(3.0, 25.0, F)), dd = length(q - S);
    float s = exp(-dd * dd / (2.0 * sig * sig)) * (1.0 - smoothstep(0.32, 0.5, dd));
    float tw = 1.0 + (0.12 + 0.3 * low) * sin(uNT * (0.5 + 0.9 * h.z) + h.x * 40.0);  // (a slow twinkle, deeper low down)
    if (drdK > 0.001) s *= mix(1.0, dreadOn(d, h.z), drdK);                                // (Dread: out one by one as the wave passes)
    sum += mix(mix(vec3(1.0), starColour(temp), 0.85), rose, 0.45 * desK) * s * F * tw;
  }
  c += sum * 0.2 * seen;
  // THE CONSTELLATIONS: their stars always (brighter than the field), their lines faded in by uCons, kept a little clear of each star
  float seenC = clear * dark * up * air * k * starMask * (1.0 - smoothstep(0.05, 0.4, swirl) * 0.7);
  if (seenC > 0.002) for (int ci = 0; ci < 16; ci++) {
    if (float(ci) >= uConN) break;
    vec4 C = conAt(float(ci), 3.0); if (dot(r, C.xyz) < C.w) continue;                     // (outside this figure's cap)
    vec4 R = conAt(float(ci), 4.0); float near = 1e3;
    for (int si = 0; si < 12; si++) {
      if (float(si) >= R.y) break;
      vec4 st = conAt(R.x + float(si), 0.0); float dd = length(r - st.xyz) / pxA; near = min(near, dd);
      float s = exp(-dd * dd / (2.0 * 0.85 * 0.85)) * st.w * 2.4 * (1.0 + 0.1 * sin(uNT * 0.7 + float(si) * 2.3));
      if (drdK > 0.001) s *= mix(1.0, dreadOn(d, fract(float(si) * 0.618 + float(ci) * 0.37)), drdK);
      c += mix(vec3(1.0, 0.96, 0.88), rose, 0.45 * desK) * s * seenC;
    }
    if (uCons > 0.002) for (int li = 0; li < 12; li++) {
      if (float(li) >= R.w) break;
      vec4 a = conAt(R.z + float(li), 1.0), b = conAt(R.z + float(li), 2.0);
      vec3 ab = b.xyz - a.xyz; float t = clamp(dot(r - a.xyz, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
      float dl = length(r - a.xyz - ab * t) / pxA, la = length(ab) / pxA;
      float gap = smoothstep(3.0, 6.0, min(t * la, (1.0 - t) * la));                       // (the line stops short of its stars, a chart's way)
      c += vec3(0.95, 0.8, 0.5) * exp(-dl * dl / (2.0 * 0.6 * 0.6)) * gap * 0.3 * b.w * uCons * seenC; // (0.16 read too faint against the night painting in the headless look; raised, not looked at again)
    }
  }
  // a meteor: a short bright streak along its path, its tail fading behind the head
  if (uMetK >= 0.0) {
    vec3 hd = normalize(mix(uMetS, uMetE, uMetK)), tl = normalize(mix(uMetS, uMetE, max(0.0, uMetK - 0.3)));
    vec3 ab = hd - tl; float t = clamp(dot(d - tl, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float w = length(fwidth(d)) * 2.0, m = 1.0 - smoothstep(0.0, w, length(d - (tl + ab * t)));
    c += vec3(0.95, 0.92, 1.0) * m * t * t * (1.0 - uMetK * uMetK) * 2.6 * up * k * clear * starMask; // (behind the cloud too)
  }
  // the aurora: curtains hemmed in labradorite's green, lapis above, violet at the top, drifting and folding (its own clock: Wonder's quicker)
  if (uAur > 0.001) {
    float da = abs(atan(sin(az - uAurDir.x), cos(az - uAurDir.x)));
    float sector = 1.0 - smoothstep(uAurDir.y * 0.6, uAurDir.y, da), u = az * 2.0, T = uAurT;
    float fold = nn1(u * 6.0 + nn1(u * 1.7 + T * 0.03) * 4.0 + T * 0.05);
    float hem = 0.03 + 0.05 * nn1(u * 3.0 + T * 0.04), top = hem + (0.18 + 0.22 * fold) * uAurH; // (radians of elevation: a frayed curtain)
    float body = smoothstep(hem - 0.01, hem + 0.025, e) * (1.0 - smoothstep(top * 0.6, top, e));
    float rays = 0.55 + 0.45 * nn1(u * 90.0 + fold * 8.0 + T * 0.02);
    float y = clamp((e - hem) / max(top - hem, 0.01), 0.0, 1.0);
    vec3 ac = mix(vec3(0.15, 0.95, 0.6), vec3(0.2, 0.35, 1.0), smoothstep(0.1, 0.6, y));
    ac = mix(ac, vec3(0.6, 0.25, 0.9), smoothstep(0.6, 1.0, y));
    c += ac * body * rays * sector * (0.4 + 0.6 * fold) * uAur * 0.9 * (0.5 + 0.5 * dark) * (1.0 - 0.85 * cl); // (the aurora is far above the cloud)
  }
  // Mirth: fireflies of starlight low in the sky (a mote a 5 x 4 degree cell, two in five held), and a warm halo round the moon
  if (mirK > 0.001) {
    vec2 cs = vec2(0.0873, 0.0698), p = vec2(az, e) / cs; vec2 b0 = floor(p);
    float band = smoothstep(0.03, 0.08, e) * (1.0 - smoothstep(0.35, 0.6, e)), glow = 0.0;
    if (band > 0.0) for (int i = 0; i < 9; i++) {
      vec2 cell = b0 + vec2(mod(float(i), 3.0) - 1.0, floor(float(i) / 3.0) - 1.0);
      vec3 h = nh3(vec3(mod(cell.x, 72.0), cell.y, 5.0)); if (h.x > 0.4) continue;
      vec2 at = cell + 0.5 + 0.32 * vec2(sin(uNT * (0.22 + 0.3 * h.y) + h.z * 30.0), cos(uNT * (0.17 + 0.25 * h.z) + h.y * 30.0));
      vec2 dv = (p - at) * cs * vec2(cos(e), 1.0); float dd = length(dv) / pxA;
      float breath = pow(0.5 + 0.5 * sin(uNT * (0.45 + 0.5 * h.y) + h.x * 50.0), 3.0);
      glow += (exp(-dd * dd / 1.3) * 1.6 + exp(-dd * dd / 14.0) * 0.12) * breath;
    }
    c += vec3(1.0, 0.8, 0.4) * glow * band * mirK * k * clear;
    float ang = acos(clamp(dot(d, moon), -1.0, 1.0));
    vec3 hc = mix(vec3(1.0, 0.5, 0.25), vec3(1.0, 0.9, 0.72), smoothstep(0.37, 0.405, ang));
    c += (hc * exp(-pow((ang - 0.384) / 0.02, 2.0)) * 0.3 + vec3(1.0, 0.78, 0.5) * exp(-ang * ang / 0.0045) * 0.18) * mirK * k * (0.3 + 0.7 * uMoon.y) * up;
  }
  // Desire: the rose-gold haze over the stars, deepest low, and the slow comet (a nucleus, its coma, a tail widening away from the sun)
  if (desK > 0.001) {
    c += rose * vec3(0.22, 0.11, 0.08) * (1.0 - smoothstep(0.0, 1.1, e)) * desK * k * up;
    vec3 v = d - uComet.xyz; float al = dot(v, uCometT), pr = length(v - uCometT * al), vv = dot(v, v);
    float head = exp(-vv / (2.0 * pxA * pxA)) * 1.8 + exp(-vv / 0.00022) * 0.4, tail = 0.0;
    if (al > 0.0 && al < uComet.w) { float wd = 0.004 + al * 0.17; tail = exp(-pr * pr / (wd * wd)) * pow(1.0 - al / uComet.w, 1.6) * smoothstep(0.0, 0.02, al); }
    c += (vec3(1.0, 0.88, 0.8) * head + vec3(1.0, 0.72, 0.62) * tail * 0.5) * desK * k * clear * up;
  }
  // Fury: heat lightning inside far cloud on the horizon, a soft swell (uFlash.w, eased in JS), its billows lit from within
  if (furK > 0.001 && uFlash.w > 0.001) {
    vec3 F = vec3(cos(uFlash.y) * cos(uFlash.x), sin(uFlash.y), cos(uFlash.y) * sin(uFlash.x));
    float blob = exp(-2.0 * (1.0 - dot(d, F)) / (uFlash.z * uFlash.z));
    float bill = nn2(vec2(az * 16.0, e * 30.0) + uFlash.x * 7.0) * 0.6 + nn2(vec2(az * 40.0, e * 70.0)) * 0.4;
    float inCloud = smoothstep(0.3, 0.75, bill) * (1.0 - smoothstep(0.1, 0.38, e)) * smoothstep(-0.02, 0.03, e);
    c += mix(vec3(0.85, 0.22, 0.28), vec3(1.0, 0.86, 0.82), blob) * blob * (0.25 + 0.75 * inCloud) * uFlash.w * furK * k * 0.5;
  }
  // Gall: a sickly green airglow banding the horizon, its gravity waves drifting along it
  if (galK > 0.001) {
    float band = exp(-pow((e - 0.1) / 0.075, 2.0)), waves = (0.6 + 0.4 * sin(az * 9.0 + sin(az * 3.0 + uNT * 0.02) * 1.5 + uNT * 0.03)) * (0.8 + 0.2 * sin(az * 31.0 - e * 40.0 + uNT * 0.05));
    c += vec3(0.32, 0.62, 0.1) * band * waves * galK * k * 0.55;
  }
  return c;
}`;

const _d = new THREE.Vector3(), _last = new THREE.Vector3();
const ASPECT_N = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'];

export class NightSky {
  constructor(game, { seaBearing = 0, half = 1.1 } = {}) {
    this.game = game; this.t = 0; this.aur = 0; this.aurT = 0;
    this.next = 20 + Math.random() * 30; this.met = -1;
    this.bearing = seaBearing; this.half = half;
    this.hold = 0; this.shown = 0; this.lastDir = null;           // (the constellations: how long the camera has held still looking up)
    this.flash = { t: -1, dur: 0.8, two: false, gap: 3 };          // (Fury's heat lightning)
    this.day = null; this.shower = null; this.seed = 0;
  }

  update(raw = 1 / 60, camera = null) {
    const g = this.game, G = g.sky?.G; if (!G) return;
    this.t += raw; G.uNT.value = this.t;
    const night = G.uNight.value, L = g.weatherLook;
    const phase = L?.wx?.phase; if (phase != null) G.uWheel.value = phase * Math.PI * 2; // (one turn a game day)
    // the game day: the moon's phase and its lift on the night's colour, a shower or none, the comet's and the break's seeds
    const ms = now(), day = today(); if (day !== this.day) { this.day = day; this.shower = meteorShowerOf(day); this.seed = rnd(day * 13 + 5); }
    const M = moonOf(ms); G.uMoon.value.set(M.angle, M.lit, MOON.lift * M.lit, 0);
    // a feeling's night: the weather look's shares (an awakening's surge included), by night
    const F = ASPECT_N.map((a) => Math.min(1, (L?.eff?.[a] || 0) + 0.5 * (L?.sec?.[a] || 0)) * night);
    G.uFN0.value.set(F[0], F[1], F[2], F[3]); G.uFN1.value.set(F[4], F[5], F[6], 0);
    // the aurora: by night at the Shore; Wonder's everywhere, brighter, taller, quicker
    const atShore = g.zones?.current === 'beach', won = F[0];
    this.aur += (Math.max(atShore ? night : 0, won * 1.4) - this.aur) * (1 - Math.exp(-raw / 6 * 3));
    this.aurT += raw * (1 + 2.5 * won);
    G.uAur.value = this.aur < 1e-3 ? 0 : this.aur; G.uAurT.value = this.aurT; G.uAurH.value = 1 + 0.9 * won;
    G.uAurDir.value.set(this.bearing, THREE.MathUtils.lerp(this.half, 5, Math.min(1, won * 1.5)));
    this.meteor(raw, night);
    this.comet(F[2], phase ?? 0);
    this.heat(raw, F[3], camera);
    { const a = this.seed * 6.283 + this.t * 0.006 + 0.7 * Math.sin(this.t * 0.011), el = 0.85 + 0.25 * Math.sin(this.t * 0.017 + 1); // (Grief's break, wandering)
      G.uBreak.value.set(Math.cos(el) * Math.cos(a), Math.sin(el), Math.cos(el) * Math.sin(a)); }
    this.constellations(raw, night, camera);
    // the cloud the stars are behind: the layer's own uniforms, linked (it drifts and is graded where it lives)
    const CL = g.dunes?.clouds, CU = CL?.uniforms;
    if (CU) { G.uCloudNoise.value = CU.uNoise.value; G.uCloudOff.value = CU.uOff.value; G.uCloud.value.set(CU.uCover.value, CU.uOpacity.value, CL.visible ? 1 : 0, 1); }
    else G.uCloud.value.set(0.5, 0, 0, 0);
  }

  /** A meteor now and then, only by night; on a shower's night often, each running out from the radiant. */
  meteor(raw, night) {
    const G = this.game.sky.G, S = this.shower;
    if (this.met >= 0) { this.met += raw / 0.6; if (this.met > 1) this.met = -1; }
    else if (night > 0.5 && (this.next -= raw) <= 0) {
      this.next = S ? 1.5 + Math.random() * 3.5 : 25 + Math.random() * 45; this.met = 0;
      const start = G.uMetS.value, len = (8 + Math.random() * 6) * (Math.PI / 180);
      if (S) { // (a point 8 to 40 degrees off the radiant, running away from it)
        const R = _d.set(Math.cos(S.el) * Math.cos(S.az), Math.sin(S.el), Math.cos(S.el) * Math.sin(S.az));
        const side = new THREE.Vector3(-Math.sin(S.az), 0, Math.cos(S.az)), upv = new THREE.Vector3().crossVectors(side, R).normalize();
        const off = (8 + Math.random() * 32) * (Math.PI / 180), a = Math.random() * Math.PI * 2;
        const way = side.multiplyScalar(Math.cos(a)).addScaledVector(upv, Math.sin(a));
        start.copy(R).multiplyScalar(Math.cos(off)).addScaledVector(way, Math.sin(off)).normalize();
        if (start.y < 0.15) { start.y = 0.15 + Math.random() * 0.3; start.normalize(); } // (kept above the horizon)
        const dir = start.clone().sub(R).addScaledVector(start, -start.dot(start.clone().sub(R))).normalize();
        G.uMetE.value.copy(start).addScaledVector(dir, len).normalize();
      } else {
        const az = Math.random() * Math.PI * 2, el = (30 + Math.random() * 35) * (Math.PI / 180);
        start.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
        const side = Math.random() < 0.5 ? -1 : 1, down = new THREE.Vector3(0, -1, 0).addScaledVector(start, start.y).normalize(); // (toward the horizon, along the sky)
        const across = new THREE.Vector3().crossVectors(start, down).multiplyScalar(side * 0.6);
        G.uMetE.value.copy(start).addScaledVector(down.add(across).normalize(), len).normalize();
      }
    }
    G.uMetK.value = this.met;
  }

  /** Desire's comet: where it stands this game day (seeded), creeping along the sky through the night, its tail turned up and away from the hidden sun. */
  comet(k, phase) {
    const G = this.game.sky.G; if (k < 1e-3) { G.uComet.value.w = 0; return; }
    const a = this.seed * 6.283 + 2.1 + phase * 0.5, el = 0.38 + 0.12 * Math.sin(this.seed * 17);
    const H = _d.set(Math.cos(el) * Math.cos(a), Math.sin(el), Math.cos(el) * Math.sin(a));
    const sun = this.game.dunes?.sunDir, T = G.uCometT.value.set(0, 1, 0);
    if (sun) T.addScaledVector(_last.copy(sun).multiplyScalar(-1), 0.6);                  // (a tail points away from the sun, below the horizon by night)
    T.addScaledVector(H, -T.dot(H)).normalize();
    G.uComet.value.set(H.x, H.y, H.z, 0.3);
  }

  /** Fury's heat lightning: a swell every 1.5 to 5 real seconds (quicker when heavy) somewhere low on the horizon, mostly where you look;
   *  its envelope a breath (sin^2 over 0.6 to 1 s, now and then a second softer one): never a strobe. */
  heat(raw, k, camera) {
    const G = this.game.sky.G, f = this.flash, U = G.uFlash.value;
    if (k < 1e-3) { U.w = 0; f.t = -1; return; }
    if (f.t < 0) {
      if ((f.gap -= raw) > 0) { U.w = 0; return; }
      const look = camera ? (camera.getWorldDirection(_d), Math.atan2(_d.z, _d.x)) : 0;
      U.set(look + (Math.random() * 2 - 1) * 1.1, (2 + Math.random() * 9) * (Math.PI / 180), 0.1 + Math.random() * 0.12, 0);
      f.t = 0; f.dur = 0.6 + Math.random() * 0.4; f.two = Math.random() < 0.45;
    }
    f.t += raw; const u = f.t / f.dur;
    U.w = u < 1 ? Math.sin(Math.PI * u) ** 2 : (f.two && u < 1.8 ? 0.55 * Math.sin(Math.PI * (u - 1) / 0.8) ** 2 : 0);
    if (u >= (f.two ? 1.8 : 1)) { f.t = -1; f.gap = (1.5 + Math.random() * 3.5) * (1.3 - 0.6 * k); U.w = 0; }
  }

  /** The constellations' lines: in while the camera has held still looking up (25 degrees or more) for about three real seconds, by night. */
  constellations(raw, night, camera) {
    const G = this.game.sky.G;
    if (camera) {
      camera.getWorldDirection(_d);
      const still = this.lastDir ? _d.angleTo(this.lastDir) / Math.max(raw, 1e-4) < 0.06 : false;
      (this.lastDir ||= new THREE.Vector3()).copy(_d);
      this.hold = _d.y > 0.42 && still && night > 0.5 ? Math.min(6, this.hold + raw) : Math.max(0, this.hold - raw * 3);
    }
    const want = THREE.MathUtils.smoothstep(this.hold, 2.5, 4.5);
    this.shown += (want - this.shown) * (1 - Math.exp(-raw * 2));
    G.uCons.value = this.shown < 1e-3 ? 0 : this.shown;
  }
}
