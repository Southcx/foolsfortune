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
//   HUNGER  the hungry wind: amber-rose dust streaming along the wind and a haze closing the horizon; no heat shimmer, ever (it wobbles
//           at a varying rate: the flicker rule) (Influence's rose and warm gold)
//   GRIEF   the long rain: steady, long, silver, the sky grey and drained (Illusion's labradorite, in the drops' sheen)
//   DREAD   the pall: a bruise-coloured haze, ink and violet-green, and thunder far off as FAR BOLTS, each held a beat and fading
//           over a second and a half, with a slow glow in the cloud behind; never a flash on the screen (Delirium's ink and green)
// What falls is in the world, never on the screen: long thin streaks and motes in a cylinder round the eye, each at a constant speed
// along its own path (the sixth generation's rain: a few thousand lines wrapped round the camera), so nothing swims or flickers.
// Only an OPEN place gets it (`game.weather.here(pos).exposure`): a roofed room keeps its own light, a Well its own sky.
//
// THE HOUR: the maker's painted sky is DUSK, and dusk is the painting untouched; the other hours are graded from it (vfx/sky.js
// `grade`): the day lifts and cools it and lays a day sky over the maroon zenith and its stars, dawn is rose, the night darkens and
// cools it and brightens the stars (until the maker paints a night: then it is blended in by the hour). The light ON the scene (the
// sun, the fog) is Petra's (render/daylight.js): `fogOf(aspect, strength)` and `look.lift` are what this module offers it.
//
// Prior art: the sixth generation's camera-wrapped rain (Wind Waker, Metal Gear Solid 2's tanker deck), real atmospheric optics (the
// 22-degree halo and parhelia from hexagonal plate crystals, the primary bow at 42 degrees round the antisolar point, diamond dust),
// Breath of the Wild's lightning (a bolt seen far off before its thunder), Okami's painted skies graded by the hour, and Journey's
// weather as feeling.
//
//   game.weatherLook = new WeatherLook(game)   .update(dt, camera)   .force({ aspect, strength, phase, light } | null) (tests, the lab)
//   .lift (0 .. 0.1: a far bolt's light, for daylight.js to add)   LOOK[aspect]   hourGrade(phase)   fogOf(aspect, strength)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const C = (hex) => new THREE.Color(hex);
/** Each weather's look: its colour, what falls (and how), its mark, and what it does to the sky's grade and the fog. */
export const LOOK = {
  mirth:  { colour: C(0xf4d58c), clouds: { cover: 0.62 },  fall: { kind: 'rain', rate: 0.3, speed: 6, len: 0.7, alpha: 0.55, vel: [0.12, -1, 0.05] }, mark: 'rainbow',
            sky: { expo: 1.08, mul: [1.06, 1.0, 0.9] }, fog: C(0xe8cf9e), fogD: 0.9 },
  wonder: { colour: C(0xa8c4ff), clouds: { cover: 0.6, opacity: 0.6 },  fall: { kind: 'diamond', rate: 0.6, speed: 0.35 }, mark: 'halo', night: 'aurora',
            sky: { expo: 1.02, mul: [0.93, 0.99, 1.1] }, fog: C(0xb8c8e8), fogD: 0.8 },
  hunger: { colour: C(0xb5674a), clouds: { cover: 0.56, opacity: 0.6 },  fall: { kind: 'sirocco', rate: 1, speed: 9, len: 3, alpha: 0.55, vel: [1, 0.04, 0.35] },
            sky: { expo: 0.95, mul: [1.08, 0.94, 0.86], haze: C(0xc98a62), hazeK: 0.85 }, fog: C(0xc48a66), fogD: 2.2 },
  grief:  { colour: C(0xb4c0cc), clouds: { cover: 0.32, opacity: 0.95 },  fall: { kind: 'rain', rate: 1, speed: 13, len: 1.5, alpha: 0.45, vel: [0.12, -1, 0.05] },
            sky: { expo: 0.78, mul: [0.92, 0.96, 1.04], desat: 0.65 }, fog: C(0x7c858e), fogD: 1.6 },
  dread:  { colour: C(0x6f8a5a), clouds: { cover: 0.28, opacity: 0.95 },  fall: null, mark: 'bolts',
            sky: { expo: 0.55, mul: [0.8, 0.86, 0.8], desat: 0.35, haze: C(0x2e2838), hazeK: 0.75 }, fog: C(0x2c2a34), fogD: 2.6 },
};
const ASPECTS = Object.keys(LOOK);

/** The hour's grade of the painting (dusk is the painting): keys by the hour of the day, blended round the clock. */
const HOURS = [
  [0, { expo: 0.32, mul: [0.6, 0.7, 1.05], stars: 2.2 }],
  [4.5, { expo: 0.32, mul: [0.6, 0.7, 1.05], stars: 2.2 }],
  [6, { expo: 0.85, mul: [1.0, 0.86, 0.92], top: [0.42, 0.36, 0.48], topK: 0.4, stars: 0.6 }],
  [8, { expo: 1.12, mul: [0.94, 0.98, 1.08], top: [0.5, 0.56, 0.68], topK: 0.8, stars: 0 }],
  [16.5, { expo: 1.12, mul: [0.94, 0.98, 1.08], top: [0.5, 0.56, 0.68], topK: 0.8, stars: 0 }],
  [19, { expo: 1, mul: [1, 1, 1], top: [0, 0, 0], topK: 0, stars: 1 }], // (dusk: the maker's own)
  [21, { expo: 0.32, mul: [0.6, 0.7, 1.05], stars: 2.2 }],
  [24, { expo: 0.32, mul: [0.6, 0.7, 1.05], stars: 2.2 }],
];
const lerp = THREE.MathUtils.lerp, smooth = THREE.MathUtils.smoothstep;
/** The hour's grade (phase 0..1 through the day), as numbers for sky.grade. */
export function hourGrade(phase) {
  const h = ((phase % 1) + 1) % 1 * 24;
  let i = 0; while (i < HOURS.length - 2 && HOURS[i + 1][0] <= h) i++;
  const [h0, a] = HOURS[i], [h1, b] = HOURS[i + 1], k = smooth(h, h0, h1);
  const v = (x, y, d) => lerp(x ?? d, y ?? d, k);
  const v3 = (x, y, d) => [0, 1, 2].map((j) => lerp((x || d)[j], (y || d)[j], k));
  return { expo: v(a.expo, b.expo, 1), mul: v3(a.mul, b.mul, [1, 1, 1]), top: v3(a.top, b.top, [0.5, 0.56, 0.68]), topK: v(a.topK, b.topK, 0), stars: v(a.stars, b.stars, 1), desat: 0, haze: [0, 0, 0], hazeK: 0 };
}
/** The fog a weather asks for (render/daylight.js lays it on the scene's): its colour and a multiplier on the density. */
export function fogOf(aspect, strength = 1) { const L = LOOK[aspect]; return L ? { colour: L.fog, density: lerp(1, L.fogD, strength), k: strength } : null; }

// ---------------------------------------------------------------- what falls
const R = 26, H = 22; // (the cylinder round the eye: radius and height, metres)
const WRAP = /* glsl */`
uniform float uT; uniform vec3 uCam; uniform vec3 uVel;
vec3 wrapAt(vec3 seed, float sp) { // (a world-anchored path, wrapped into the cylinder round the eye: nothing moves with the camera)
  vec3 w = vec3(seed.x * ${2 * R}.0, seed.y * ${H}.0, seed.z * ${2 * R}.0) + uVel * sp * uT;
  return vec3(mod(w.x - uCam.x + ${R}.0, ${2 * R}.0) - ${R}.0, mod(w.y - uCam.y + ${H / 2}.0, ${H}.0) - ${H / 2}.0, mod(w.z - uCam.z + ${R}.0, ${2 * R}.0) - ${R}.0);
}
float edgeFade(vec3 r) { return (1.0 - smoothstep(${R * 0.7}, ${R}.0, length(r.xz))) * (1.0 - smoothstep(${H * 0.35}, ${H / 2}.0, abs(r.y))); }`;

function makeRain(n) {
  const seed = new Float32Array(n * 6), end = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const s = [Math.random(), Math.random(), Math.random()];
    seed.set(s, i * 6); seed.set(s, i * 6 + 3); end[i * 2] = 0; end[i * 2 + 1] = 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uVel: { value: new THREE.Vector3(0, -10, 0) }, uLen: { value: 1 }, uCol: { value: new THREE.Color() }, uA: { value: 0 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, fog: false,
    vertexShader: `${WRAP}
attribute vec3 aSeed; attribute float aEnd; uniform float uLen; varying float vA;
void main() {
  float sp = 0.85 + 0.3 * fract(aSeed.x * 17.3);
  vec3 r = wrapAt(aSeed, sp);
  vec3 p = uCam + r - normalize(uVel) * uLen * aEnd; // (the streak: its head, and its tail back along the way it falls)
  vA = edgeFade(r) * (1.0 - 0.8 * aEnd);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,
    fragmentShader: 'uniform vec3 uCol; uniform float uA; varying float vA; void main() { gl_FragColor = vec4(uCol, uA * vA); }',
  });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; L.renderOrder = 5; L.visible = false;
  return { obj: L, u, n };
}

function makeMotes(n) {
  const seed = new Float32Array(n * 3); for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const u = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uVel: { value: new THREE.Vector3(0, -0.35, 0) }, uCol: { value: new THREE.Color() }, uA: { value: 0 }, uSize: { value: 0.06 }, uHex: { value: 1 }, uPx: { value: 480 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, fog: false,
    vertexShader: `${WRAP}
attribute vec3 aSeed; uniform float uSize, uHex, uPx; varying float vA; varying float vG;
void main() {
  vec3 r = wrapAt(aSeed, 0.8 + 0.4 * fract(aSeed.y * 13.1));
  r.x += sin(uT * 0.4 + aSeed.z * 30.0) * 0.4 * uHex; // (the ice sways as it sinks; the dust only streams)
  vec4 mv = viewMatrix * vec4(uCam + r, 1.0);
  // a crystal's glint: a slow turn that catches the light for a moment, each on its own long period (never a twinkle field)
  vG = uHex * pow(max(0.0, sin(uT * (0.5 + 0.4 * aSeed.x) + aSeed.z * 40.0)), 24.0);
  vA = edgeFade(r);
  gl_PointSize = clamp(uSize * uPx / -mv.z, 1.0, 6.0) * (1.0 + 1.5 * vG);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `uniform vec3 uCol; uniform float uA, uHex; varying float vA; varying float vG;
void main() {
  vec2 p = gl_PointCoord - 0.5;
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
function ringMesh(r0, r1, frag, extra = {}) {
  const u = { uA: { value: 0 }, uR0: { value: r0 }, uR1: { value: r1 }, ...extra };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.9998; }', // (at the back of the depth, as the dome: past the far plane, behind everything near)
    fragmentShader: `uniform float uA, uR0, uR1; varying vec2 vP;
vec3 spectrum(float t) { return clamp(abs(fract(t + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
void main() { float t = clamp((length(vP) - uR0) / (uR1 - uR0), 0.0, 1.0); float edge = smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.75, 1.0, t)); ${frag} }`,
  });
  const o = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96, 1), m); o.frustumCulled = false; o.renderOrder = 4; o.visible = false;
  return { obj: o, u };
}
const tanD = (d) => Math.tan(THREE.MathUtils.degToRad(d)) * SKYD;

function makeAurora() {
  const u = { uT: { value: 0 }, uA: { value: 0 } };
  const m = new THREE.ShaderMaterial({
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
    this.group = new THREE.Group(); this.group.name = 'weather';
    game.scene?.add(this.group);
    this.rain = makeRain(3000); this.motes = makeMotes(1400);
    this.halo = ringMesh(tanD(21), tanD(23.5), `gl_FragColor = vec4(mix(vec3(1.0, 0.55, 0.4), vec3(0.85, 0.9, 1.0), t), uA * edge);`);
    this.bow = ringMesh(tanD(40.5), tanD(42.5), `gl_FragColor = vec4(spectrum(0.78 - t * 0.78), uA * edge);`);
    this.dogs = [0, 1].map(() => ringMesh(0, tanD(1.6), `gl_FragColor = vec4(mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.5, 0.35), t), uA * (1.0 - t) * (1.0 - t));`));
    this.aurora = makeAurora();
    const boltMat = new THREE.MeshBasicMaterial({ color: 0xd8e8c8, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.bolt = new THREE.Mesh(boltGeo(rng(7)), boltMat); this.bolt.frustumCulled = false; this.bolt.visible = false;
    this.glow = ringMesh(0, 90, 'gl_FragColor = vec4(vec3(0.45, 0.4, 0.6) * (1.0 - t) * (1.0 - t), uA);');
    for (const o of [this.rain.obj, this.motes.obj, this.halo.obj, this.bow.obj, ...this.dogs.map((d) => d.obj), this.aurora.obj, this.bolt, this.glow.obj]) this.group.add(o);
    this.amt = Object.fromEntries(ASPECTS.map((a) => [a, 0])); // (each weather's present amount, eased: a spell comes in and goes out)
    this.forced = null; this.wx = null; this.poll = 0; this.t = 0; this.lift = 0;
    this.strike = { next: 4, t: -9, n: 0 };
  }

  /** Show a weather and an hour whatever the rules say (tests, the workbench); null hands it back to `game.weather`. */
  force(w) { this.forced = w ? { aspect: null, strength: 1, phase: 19 / 24, light: 0.5, exposure: 'open', ...w } : null; }

  /** What the look follows: the forced weather, or the rules where the eye is. Null (no rules yet): nothing, the painting untouched. */
  read(pos) {
    if (this.forced) return this.forced;
    const W = this.game.weather;
    if (!W?.here) return null;
    const h = W.here(pos), s = W.sky?.(undefined, h.place);
    return { aspect: h.aspect, strength: h.strength, exposure: h.exposure, phase: s?.phase ?? h.phase, light: s?.light ?? 0.5 };
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
    }
    // the sky's grade: the hour, then the weather over it (with no rules, the painting as it is)
    if (sky?.grade) {
      if (!w) sky.grade({});
      else {
        const g = hourGrade(w.phase);
        for (const a of ASPECTS) {
          const k = this.amt[a], S = LOOK[a].sky; if (!k) continue;
          g.expo *= lerp(1, S.expo ?? 1, k);
          if (S.mul) g.mul = g.mul.map((v, i) => v * lerp(1, S.mul[i], k));
          g.desat = Math.max(g.desat, (S.desat || 0) * k);
          if (S.haze && S.hazeK * k > g.hazeK) { g.hazeK = S.hazeK * k; g.haze = S.haze.toArray(); }
        }
        sky.grade({ expo: g.expo, mul: _c.fromArray(g.mul), top: _c2.fromArray(g.top), topK: g.topK, stars: g.stars, desat: g.desat, haze: _c3.fromArray(g.haze), hazeK: g.hazeK });
        // the clouds take the hour's light (less of the night's dark: they hold what light there is) and the weather's cover
        const CL = this.game.dunes?.clouds, B = CL?.base;
        if (B) {
          let cover = B.cover, opacity = B.opacity;
          for (const a of ASPECTS) { const k = this.amt[a], Q = LOOK[a].clouds; if (k && Q) { cover = lerp(cover, Q.cover ?? cover, k); opacity = lerp(opacity, Q.opacity ?? opacity, k); } }
          CL.grade({ expo: Math.pow(g.expo, 0.8) * (1 - 0.5 * g.desat), mul: _c.lerp(_white, 0.5), cover, opacity });
        }
      }
    }
    if (!w) this.game.dunes?.clouds?.grade?.({});
    const light = w?.light ?? 0.5, dayK = smooth(light, 0.3, 0.6), nightK = 1 - smooth(light, 0.15, 0.4);
    const sun = _v.copy(this.game.dunes?.sunDir || _up).normalize();
    // what falls: the strongest falling weather's way of falling, the others' colours eased in (one rain, one mote field)
    let rainA = 0, moteA = 0;
    const R0 = this.rain.u, M0 = this.motes.u;
    for (const a of ASPECTS) {
      const k = open ? this.amt[a] : 0, F = LOOK[a].fall; if (!F || !k) continue;
      if (F.vel && k > rainA) { // (streaks: rain falling, or sand blown along the ground)
        rainA = k; R0.uCol.value.copy(LOOK[a].colour); R0.uLen.value = F.len; R0.uA.value = F.alpha * k;
        R0.uVel.value.fromArray(F.vel); const wd = this.game.dunes?.wind?.dir; if (wd && F.kind === 'sirocco') R0.uVel.value.set(wd.x, F.vel[1], wd.y); R0.uVel.value.multiplyScalar(F.speed); // (the hungry wind blows the way the dunes' wind does) this.rain.obj.geometry.setDrawRange(0, Math.round(this.rain.n * F.rate * k) * 2);
      }
      const diamond = F.kind === 'diamond', dk = diamond ? k * dayK : k; // (diamond dust by day; at night wonder is the aurora)
      if ((diamond || F.kind === 'sirocco') && dk > moteA) {
        moteA = dk; M0.uCol.value.copy(LOOK[a].colour); M0.uHex.value = diamond ? 1 : 0; M0.uSize.value = diamond ? 0.05 : 0.12;
        M0.uVel.value.set(diamond ? 0.05 : F.speed, diamond ? -F.speed : 0.3, diamond ? 0 : F.speed * 0.3); M0.uA.value = (diamond ? 0.8 : 0.6) * dk;
        this.motes.obj.geometry.setDrawRange(0, Math.round(this.motes.n * F.rate * dk));
      }
    }
    for (const [L, A] of [[this.rain, rainA], [this.motes, moteA]]) { L.obj.visible = A > 0.01; L.u.uT.value = this.t; L.u.uCam.value.copy(cam); }
    M0.uPx.value = 480 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); // (the scene is drawn at 480 lines)
    // the marks in the sky (open places only: none of them is seen from a room)
    const won = open ? this.amt.wonder : 0, mir = open ? this.amt.mirth : 0, dre = open ? this.amt.dread : 0;
    this.sky(this.halo, won * dayK * 0.22, cam, sun, 1);
    this.sky(this.bow, mir * dayK * 0.16, cam, sun, -1);
    const elev = Math.asin(THREE.MathUtils.clamp(sun.y, -1, 1)), az = Math.atan2(sun.z, sun.x), off = THREE.MathUtils.degToRad(22) / Math.max(0.3, Math.cos(elev));
    this.dogs.forEach((d, i) => { _w.set(Math.cos(az + (i ? off : -off)) * Math.cos(elev), Math.sin(elev), Math.sin(az + (i ? off : -off)) * Math.cos(elev)); this.sky(d, won * dayK * 0.6, cam, _w, 1); });
    const au = this.aurora; au.obj.visible = won * nightK > 0.01; au.u.uA.value = 0.55 * won * nightK; au.u.uT.value = this.t; au.obj.position.set(cam.x, cam.y + 230, cam.z);
    this.thunder(dt, dre, cam);
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
      const r = rng(1 + S.n++ * 7919), bear = r() * Math.PI * 2, dist = 260 + r() * 70; // (inside the dunes' far plane: a long way off, never on top of you)
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
    this.game.sky?.grade?.({});
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh || o.isPoints || o.isLineSegments) { o.geometry.dispose(); o.material.dispose(); } });
  }
}
const _white = new THREE.Color(1, 1, 1), _c = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
