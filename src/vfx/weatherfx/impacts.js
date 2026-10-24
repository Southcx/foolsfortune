// ---------------------------------------------------------------------------------------
// A WEATHER'S IMPACTS: where what falls meets the ground, per feeling and strength (the owner, 2026-10-24: "secondary particle effects
// for the emotion weather events themselves ... Seriously go wild"). All of it on the GPU: one Points program, its kinds a uniform
// (never a define: one program, CASEBOOK rule 5), each point an EVENT's part that loops on its own clock and lands somewhere new each
// time round, world-anchored and wrapped round the eye (as the hail's scatter in vfx/weather.js), on the ground the rain's own map
// finds (`overheadY`, vfx/overhead.js: a roof's top where there is a roof, so nothing lands inside a building), and on still water's
// surface where there is water. No JS object a drop; the JS only sets a kind's numbers.
// An event is four points: its role 0 the body of the moment (a crown, a puff, a star), roles 1 to 3 what flies from it.
//   0 SPLASH  rain: a crown ring opening and gone in a fifth of a second, then the dark wet mark it leaves drying (what reads on pale
//             sand), three bounce droplets on their arcs (Grief's silver, low and
//             many; Mirth's gold, high and catching the sun, a little rainbow spray in them by day: a sunshower's drops are prisms)
//   1 CHIPS   Fury's hail breaking: a white puff of ice dust, chips flung low that bounce twice and skitter to a stop, then melt
//   2 ASH     Dread's ash settling: flakes fluttering down the last metre and lying dark, and a soft puff where they land
//   3 DUST    Desire's dust skipping along the ground in the wind (saltation: hops about ten times as long as they are high), a low
//             puff where it lifts; a gust lifts it higher and further
//   4 GLINT   Wonder's diamond dust landing: crystals sinking the last metre, lying and glinting on their own slow turns, a four-point
//             star where one touches down; it sublimates
//   5 HAZE    the ground's own breath, a second instance: low wide soft sheets lying on the ground and drifting with the gusts (Grief's
//             rain hiss, the fine mist a downpour throws up off the ground; Desire's dust sheets streaming; Fury's hail fog, the cold
//             off a hailstorm's white; Mirth's sunshower steam off the warm sand)
// Comfort (CLAUDE.md, no aliasing crawl): a point below a pixel fades by its area instead of shrinking; every glint is a slow turn,
// never a twinkle; the crown is a ring drawn at the ellipse it projects to, soft-edged.
//
// Prior art: the splash particles of every rain since the seventh generation (Uncharted's and The Last of Us's "rain splash" sprites
// spawned on a depth map round the camera, the crown splash of a drop on a film: Worthington's photographs, 1908), Breath of the Wild's
// readable weathers (each told at a glance by what it does on the ground), real saltation of sand (Bagnold, "The Physics of Blown Sand",
// 1941: hops a few centimetres high, ten to fifteen times as long), the hail's shattering and its ground fog, a downpour's mist off hot
// ground, and the sixth generation's ground fog cards (vfx/weather.js's lenses, the same ellipse trick).
//
//   IMPACTS[aspect] { kind, rate, cycle, size, bounce, glint, hue, colour, ground: { n, size, alpha, colour } | null }
//   impactsOf(aspect, k, hv, dayK) -> { body, ground } specs (or null each); written into objects of this module's own
//   makeImpacts(n, occ, wet, shore, gust) -> { obj, u, n }   (n a multiple of 4)   impactsTo(piece, spec, colour)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OVERHEAD_GLSL } from '../overhead.js';
import { GUST_GLSL } from './gusts.js';

const C = (hex) => new THREE.Color(hex);
export const KIND = { splash: 0, chips: 1, ash: 2, dust: 3, glint: 4, haze: 5 };
/** Each weather's impacts. `rate` the share of the events running at full strength (`heavy` at a heavy spell's), `cycle` an event's
 *  loop in real seconds, `size` the body's size in metres, `bounce` the flung parts' launch speed (m/s), `glint` how much they catch
 *  the sun, `hue` a rainbow's share in the spray (by day); `ground` the haze instance's. `dayOnly`: the dust's glint needs the sun. */
export const IMPACTS = {
  grief:  { kind: KIND.splash, rate: 0.55, heavy: 1, cycle: 0.55, size: 0.2, bounce: 1.05, glint: 0.15, hue: 0, colour: C(0xc9d3de),
            ground: { n: 150, heavy: 260, size: 3.6, alpha: 0.16, heavyA: 0.3, colour: C(0xaeb8c4) } },
  mirth:  { kind: KIND.splash, rate: 0.28, heavy: 0.6, cycle: 0.9, size: 0.17, bounce: 2.3, glint: 1, hue: 0.55, colour: C(0xffcf5a),
            ground: { n: 70, size: 3, alpha: 0.08, colour: C(0xf6e2b8) } },
  fury:   { kind: KIND.chips, rate: 0.5, heavy: 0.9, cycle: 0.6, size: 0.24, bounce: 1, glint: 0.7, hue: 0, colour: C(0xeef6ff),
            ground: { n: 90, heavy: 160, size: 4, alpha: 0.1, heavyA: 0.18, colour: C(0xe2eaf2) } },
  dread:  { kind: KIND.ash, rate: 0.12, heavy: 0.5, cycle: 3.4, size: 0.55, bounce: 0, glint: 0, hue: 0, colour: C(0x3b3148), ground: null },
  desire: { kind: KIND.dust, rate: 0.35, heavy: 0.8, cycle: 1.5, size: 0.5, bounce: 1, glint: 0, hue: 0, colour: C(0xa8683c), // (a darker ochre than the sand it skips over: it must read on it)
            ground: { n: 120, heavy: 220, size: 4.2, alpha: 0.14, heavyA: 0.26, colour: C(0xc98a62) } },
  wonder: { kind: KIND.glint, rate: 0.16, heavy: 0.4, cycle: 3.6, size: 0.18, bounce: 0, glint: 1, hue: 0, colour: C(0xe4eeff), dayOnly: true, ground: null },
  gall:   null, // (the miasma's ground is its own fog and flies)
};

const lerp = THREE.MathUtils.lerp;
const _body = {}, _ground = {}, _out = { body: null, ground: null };
/** What a weather's impacts are at amount k (heaviness hv; `dayK` 0 at night .. 1 by day). Use the result before the next call. */
export function impactsOf(a, k, hv, dayK = 1) {
  const I = IMPACTS[a]; _out.body = _out.ground = null; if (!I || k <= 0) return _out;
  const day = I.dayOnly ? Math.max(dayK, 0.6 * hv) : 1, B = _body;
  B.a = k * day; B.kind = I.kind; B.colour = I.colour; B.cycle = I.cycle; B.size = I.size; B.bounce = I.bounce;
  B.glint = I.glint * dayK; B.hue = I.hue * dayK; B.alpha = Math.min(1, 0.55 + 0.45 * k) * day;
  B.share = lerp(I.rate, I.heavy ?? I.rate, hv) * k * (I.kind === KIND.ash ? 0.3 + 0.7 * hv : 1); // (Dread's ash: it is the heavy pall's)
  _out.body = B;
  if (I.ground) {
    const G = I.ground, H = _ground;
    H.a = k; H.kind = KIND.haze; H.colour = G.colour; H.cycle = 9; H.size = G.size; H.bounce = 0; H.glint = 0; H.hue = 0;
    H.alpha = lerp(G.alpha, G.heavyA ?? G.alpha, hv) * k; H.n = lerp(G.n, G.heavy ?? G.n, hv) * Math.min(1, 0.4 + 0.6 * k); H.share = 1;
    _out.ground = H;
  }
  return _out;
}

const R = 14; // (the ring round the eye an event may land in, metres; the haze's to 20)
const VERT = /* glsl */`
uniform float uT, uKind, uSize, uCycle, uBounce, uPx, uR; uniform vec3 uCam;
attribute vec3 aSeed; attribute float aId;
varying float vA, vG, vRole, vAsp, vM, vK;
${OVERHEAD_GLSL}
${GUST_GLSL}
uniform vec4 uShore; uniform vec2 uShoreA;
float shoreFade(vec3 w) {
  if (uShore.w <= 0.0) return 1.0;
  vec2 d = w.xz - uShore.xy; float a = atan(d.y, d.x) - uShoreA.x; a = abs(atan(sin(a), cos(a)));
  return a > uShoreA.y ? 1.0 : 1.0 - smoothstep(uShore.z - 2.0, uShore.z + 6.0, length(d));
}
uniform vec4 uWet[2]; uniform vec2 uWetY;
float wetAt(vec2 xz) {
  if (xz.x > uWet[0].x && xz.y > uWet[0].y && xz.x < uWet[0].z && xz.y < uWet[0].w) return uWetY.x;
  if (xz.x > uWet[1].x && xz.y > uWet[1].y && xz.x < uWet[1].z && xz.y < uWet[1].w) return uWetY.y;
  return -1e4;
}
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
vec2 wrapXZ(vec2 w, float r) { return mod(w - uCam.xz + r, 2.0 * r) - r; }
// a flung part's flight: launched at s = 0 from the event's spot at (vh along dir, vy up), bounces times off the ground losing
// keep of its speed each, then sliding to a stop; returns the offset (xz along the ground, y up) and in .w 1 while it flies
vec4 flight(float s, float vh, float vy, float bounces, float keep, float slide) {
  float x = 0.0, y = 0.0, f = 1.0;
  for (int i = 0; i < 3; i++) {
    float tb = 2.0 * vy / 9.8;
    if (s < tb) { x += vh * s; y = vy * s - 4.9 * s * s; return vec4(x, y, 0.0, f); }
    s -= tb; x += vh * tb;
    if (float(i) >= bounces) break;
    vy *= keep; vh *= keep + 0.25;
  }
  float st = vh / max(0.01, slide); s = min(s, st); // (the slide: decelerating to a stop)
  return vec4(x + vh * s - 0.5 * slide * s * s, 0.0, 0.0, 0.0);
}
void main() {
  float haze = step(4.5, uKind), role = mod(aId, 4.0), ev = haze > 0.5 ? aId : floor(aId / 4.0); // (a sheet of haze is an event of its own)
  float P = uCycle * (0.75 + 0.5 * h11(ev * 1.31 + 0.2)), cyc = uT / P + h11(ev * 7.7 + 0.4) * 7.0, k = floor(cyc), tau = fract(cyc) * P;
  vec3 hs = vec3(h11(k * 1.7 + ev * 0.913), h11(k * 2.3 + ev * 0.531 + 3.0), h11(k * 3.1 + ev * 0.771 + 5.0));
  float rr = mix(uR, 20.0, haze);
  vec2 rc = wrapXZ(hs.xz * 2.0 * rr, rr), xz = uCam.xz + rc;
  float oy = overheadY(xz), gy = oy, wy = wetAt(xz), onWater = 0.0;
  if (wy > -9000.0 && gy < wy - 0.05) { gy = wy; onWater = 1.0; } // (on still water: its surface; a pond's box has dry corners)
  float ps = h11(aId * 0.37 + k * 0.11), ps2 = h11(aId * 0.73 + k * 0.29 + 9.0), ang = ps * 6.2832; // (this part's own draws, new each time round)
  vec2 dir = vec2(cos(ang), sin(ang)), gd = gustDir();
  float g = gustAt(xz, 0.0);
  float a = 1.0, size = uSize, lift = 0.02, lo = 1.0, hi = 16.0; vG = 0.0; vRole = role; vAsp = 1.0; vM = hs.y; vK = 0.0;
  vec3 off = vec3(0.0);
  if (uKind < 0.5) { // SPLASH
    if (role < 0.5) {
      float t = tau / 0.2; a = step(t, 1.0) * (1.0 - t) * (1.0 - t); size *= 0.45 + 1.1 * sqrt(min(t, 1.0)); vK = t; lift = 0.015 + 0.03 * t;
      if (t > 1.0) { vRole = 7.0; a = 0.4 * (1.0 - onWater) * (1.0 - smoothstep(0.2, P, tau)); size = uSize * (0.7 + 0.4 * hs.x); lift = 0.01; } // (then the wet mark it leaves, darker, drying: what reads on pale sand)
    }
    else {
      float vy = uBounce * (0.55 + 0.6 * ps2) * (1.0 - 0.6 * onWater), vh = 0.3 + 0.55 * ps;
      vec4 f = flight(tau, vh, vy, 0.0, 0.0, 99.0); off = vec3(dir.x * f.x, f.y, dir.y * f.x); a = f.w;
      size *= 0.09 + 0.05 * ps2;
      vG = pow(max(0.0, sin(tau * 9.0 + ps * 30.0)), 6.0); // (a drop catching the sun on its arc: once or twice, never a twinkle)
      vK = ps2; // (its place in the spray's rainbow)
    }
  } else if (uKind < 1.5) { // CHIPS
    if (role < 0.5) { float t = tau / 0.3; a = step(t, 1.0) * (1.0 - t); size *= 0.4 + 1.4 * sqrt(min(t, 1.0)); lift = 0.04 + 0.12 * t; vRole = 4.0; }
    else {
      float vy = uBounce * (0.5 + 0.8 * ps2), vh = 1.0 + 1.6 * ps;
      vec4 f = flight(tau, vh, vy, 2.0, 0.4, 4.0); off = vec3(dir.x * f.x, f.y, dir.y * f.x);
      a = 1.0 - smoothstep(0.55 * P, 0.95 * P, tau); size *= 0.12 + 0.08 * ps2; lift = 0.02;
      vG = pow(max(0.0, sin(tau * 5.0 + ps * 40.0)), 10.0);
    }
  } else if (uKind < 2.5) { // ASH: flakes from a metre or so up, fluttering down onto the spot, a puff as the first lands
    float fall = 1.1 + 0.5 * hs.x, tl = fall / 0.8;
    if (role < 0.5) { float t = (tau - tl) / 1.6; a = step(0.0, t) * step(t, 1.0) * sin(3.1416 * sqrt(max(t, 0.0))) * 0.8; size *= 0.4 + 0.9 * sqrt(max(t, 0.0)); lift = 0.06 + 0.18 * t; vRole = 4.0; }
    else {
      float tf = tl * (0.8 + 0.4 * ps2), h = max(0.0, fall * (1.0 - tau / tf));
      off = vec3(dir * 0.25 * ps + 0.15 * vec2(sin(tau * 2.3 + ps * 9.0), cos(tau * 1.9 + ps * 7.0)) * (h / fall), h).xzy;
      off.xz += gd * uGust.z * 0.15 * g * (h / fall);
      a = 1.0 - smoothstep(tf + 0.4 * (P - tf), P * 0.97, tau); size *= 0.07 + 0.05 * ps2;
      size *= 0.75 + 0.25 * abs(sin(tau * 2.1 + ps * 20.0)); // (a flake turning as it falls: slow, its size never a pixel flicker)
    }
  } else if (uKind < 3.5) { // DUST: grains hopping downwind, a low puff where they lift
    vec2 wd = normalize(gd + dir * 0.25);
    if (role < 0.5) { float t = tau / (0.9 * P); a = step(t, 1.0) * sin(3.1416 * min(t, 1.0)) * 0.5; size *= 0.5 + 0.8 * t; off.xz = gd * tau * (0.8 + 2.0 * g); lift = 0.1 + 0.15 * t; vRole = 4.0; }
    else {
      float hop = (0.05 + 0.18 * ps2) * (1.0 + 1.5 * g), th = 2.0 * sqrt(2.0 * hop / 9.8), s = tau - 0.1 * ps, n = floor(s / th), u = fract(s / th);
      float hk = pow(0.7, n), len = 11.0 * hop;
      float x = len * (1.0 - pow(0.7, n)) / 0.3 + len * hk * u; // (the hops so far, each shorter, and this one's way along)
      off = vec3(wd.x * x, 4.0 * hop * hk * u * (1.0 - u), wd.y * x);
      a = step(0.0, s) * (1.0 - smoothstep(3.0, 4.0, n)); size *= 0.05 + 0.03 * ps2;
    }
  } else if (uKind < 4.5) { // GLINT: crystals sinking the last metre, lying and glinting, a star where one touches down
    float tl = 0.8 / 0.28;
    if (role < 0.5) { float t = (tau - tl) / 0.45; a = step(0.0, t) * step(t, 1.0) * sin(3.1416 * clamp(t, 0.0, 1.0)); size *= 1.6; lift = 0.05; vRole = 5.0; }
    else {
      float tf = tl * (0.85 + 0.3 * ps2), h = max(0.0, 0.8 * (1.0 - tau / tf));
      off = vec3(dir.x * 0.3 * ps + 0.06 * sin(tau * 1.3 + ps * 8.0), h, dir.y * 0.3 * ps);
      a = 1.0 - smoothstep(tf + 0.5 * (P - tf), P * 0.97, tau); size *= 0.25 + 0.15 * ps2;
      vG = pow(max(0.0, sin(uT * (0.6 + 0.5 * ps) + ps2 * 40.0)), 20.0);
    }
  } else { // HAZE: a low sheet of the ground's breath, drifting with the gusts, fading in and out over its cycle
    float t = tau / P;
    a = sin(3.1416 * t) * (0.6 + 0.4 * hs.y);
    off.xz = gd * (tau * (0.6 + 1.2 * hs.x) + uGust.z * g);
    size *= 0.6 + 0.8 * hs.y; lift = 0.2 + 0.25 * hs.x; lo = 1.0; hi = 220.0; vRole = 6.0;
  }
  vec3 w = vec3(xz.x + off.x, gy + lift + off.y, xz.y + off.z);
  if (vRole > 3.5 || role < 0.5) { // a body lying on the ground: drawn as the ellipse a flat disc there projects to, its near rim clear of the ground
    vec3 dv = uCam - w; float dist = length(dv), sEl = clamp(dv.y / max(0.1, dist), -1.0, 1.0), cEl = sqrt(1.0 - sEl * sEl);
    vAsp = vRole > 4.5 && vRole < 5.5 ? 1.0 : max(sEl, 0.2 * cEl);
    w.y = max(w.y, gy + 0.5 * size * vAsp * cEl + 0.02);
  }
  a *= step(-9000.0, oy); // (none where the ground is not known yet)
  a *= 1.0 - smoothstep(rr * 0.7, rr, length(rc));
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float px = size * uPx / max(0.1, -mv.z);
  gl_PointSize = clamp(px, lo, hi);
  a *= min(1.0, px * px / (lo * lo)) * shoreFade(w) * smoothstep(0.8, 2.0, -mv.z);
  gl_Position = projectionMatrix * mv;
  if (haze > 0.5) { vec2 ndc = gl_Position.xy / max(0.001, gl_Position.w); a *= smoothstep(1.5, 4.0, -mv.z) * (1.0 - smoothstep(0.82, 1.08, max(abs(ndc.x), abs(ndc.y)))); }
  vA = a;
}`;
const FRAG = /* glsl */`
uniform vec3 uCol, uCol2; uniform float uA, uKind, uGlint, uHue;
varying float vA, vG, vRole, vAsp, vM, vK;
vec3 spectrum(float t) { return clamp(abs(fract(t + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float alpha; vec3 c = uCol;
  if (vRole > 6.5) { // a wet mark: a soft dark disc on the ground, the drop's own colour deep in it
    vec2 q = p * vec2(2.0, 2.0 / vAsp);
    alpha = (1.0 - smoothstep(0.3, 1.0, length(q))) * 0.8; c = uCol * 0.18;
  } else if (vRole > 4.5 && vRole < 5.5) { // a four-point star: the diamond dust touching down
    float ax = abs(p.x), ay = abs(p.y);
    alpha = max(exp(-ax * ax * 900.0) * (1.0 - smoothstep(0.0, 0.5, ay)), exp(-ay * ay * 900.0) * (1.0 - smoothstep(0.0, 0.5, ax))) + 0.6 * exp(-dot(p, p) * 60.0);
    c = mix(uCol, vec3(1.0), 0.6) * 1.8;
  } else if (vRole > 3.5) { // a soft lying puff or sheet: the ellipse of a disc, mottled
    vec2 q = p * vec2(2.0, 2.0 / vAsp); float r = length(q);
    alpha = (1.0 - smoothstep(0.2, 1.0, r)) * (0.75 + 0.25 * sin(p.x * 9.0 + vM * 40.0) * sin(p.y * 7.0 / vAsp - vM * 23.0));
  } else if (vRole < 0.5) { // the crown: a ring at the ellipse it projects to, its rim notched (a crown's points), thinning as it opens
    vec2 q = p * vec2(2.0, 2.0 / vAsp); float r = length(q), an = atan(q.y, q.x);
    float band = exp(-pow((r - 0.7) / (0.12 + 0.1 * (1.0 - vK)), 2.0)) * (0.65 + 0.35 * sin(an * 9.0 + vM * 50.0));
    alpha = band + (1.0 - vK) * 0.5 * (1.0 - smoothstep(0.0, 0.5, r)); // (the spike of the drop's own splash at its middle, first)
    c = uCol * 1.6; // (bright: the crown catches the light, so it reads on pale ground too, and the glow takes its top)
  } else { // a droplet, a chip, a flake, a grain or a crystal: a soft dot, lit by its glint
    alpha = 1.0 - smoothstep(0.15, 0.5, length(p));
    c = mix(uCol, uCol * (0.4 + 1.2 * spectrum(vK)), uHue) * (1.0 + 1.8 * vG * uGlint) + uCol2 * vG * uGlint * 0.6;
  }
  alpha *= uA * vA; if (alpha < 0.004) discard;
  gl_FragColor = vec4(c, min(1.0, alpha));
}`;

/** The impacts' points: n of them (four an event), one program for every kind. `occ` the rain's map of the ground (vfx/overhead.js),
 *  `wet` and `shore` vfx/weather.js's shared uniforms, `gust` the gusts' (vfx/weatherfx/gusts.js). */
export function makeImpacts(n, occ, wet, shore, gust) {
  n = Math.ceil(n / 4) * 4;
  const seed = new Float32Array(n * 3), id = new Float32Array(n);
  for (let i = 0; i < n; i++) { id[i] = i; seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3)); g.setAttribute('aId', new THREE.BufferAttribute(id, 1));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uKind: { value: 0 }, uSize: { value: 0.2 }, uCycle: { value: 0.6 },
    uBounce: { value: 1 }, uPx: { value: 480 }, uR: { value: R }, uCol: { value: new THREE.Color() }, uCol2: { value: new THREE.Color(1, 0.95, 0.8) }, uA: { value: 0 }, uGlint: { value: 0 }, uHue: { value: 0 },
    ...occ, ...wet, ...shore, ...gust };
  const m = new THREE.ShaderMaterial({ name: 'weather-impacts', uniforms: u, transparent: true, depthWrite: false, fog: false, vertexShader: VERT, fragmentShader: FRAG });
  const P = new THREE.Points(g, m); P.frustumCulled = false; P.renderOrder = 5; P.visible = false;
  return { obj: P, u, n };
}

/** A spec from impactsOf on a piece (in a colour: the caller's tint, lit by the hour). The haze's spec counts sheets; a body's a share. */
export function impactsTo(P, s, col) {
  const u = P.u; u.uKind.value = s.kind; u.uCol.value.copy(col); u.uA.value = s.alpha; u.uSize.value = s.size; u.uCycle.value = s.cycle;
  u.uBounce.value = s.bounce; u.uGlint.value = s.glint; u.uHue.value = s.hue;
  P.obj.geometry.setDrawRange(0, s.kind === KIND.haze ? Math.min(P.n, Math.round(s.n)) : Math.min(P.n, Math.round(s.share * P.n / 4) * 4)); // (a sheet a point; an event four)
}
