// ---------------------------------------------------------------------------------------
// THE SKY: the painting the game's maker drew (assets/sky.webp): an equirectangular panorama, a dusty peach haze that deepens to
// maroon and stars at the zenith. One image, three jobs, so that everything under it agrees about what the sky is:
//   - the dome over the dunes (dunes.js draws it with `skyMaterial`),
//   - the reflection in water (the water shader samples it along the mirrored view ray),
//   - the light on anything glossy (a PMREM-filtered copy, `sky.env`, for the Lachryma cubes and the chests' metal).
// It is not the workshop's ambient light: the workshop keeps its own warm interior (an environment map on every material would
// change the whole look), and only the things that ask for the sky get it.
//
// The equirect convention is three.js's own (u = atan(z, x), v = asin(y)), so the dome, the water and the PMREM copy line up.
//
//   game.sky = await new Sky(game).load()      sky.texture   sky.env   sky.horizon (a THREE.Color)   sky.at(dir, out)
//   sky.toneAt(dir, out, sunDir)   the dome's colour there as it is drawn now (the three paintings by the hour, the grade, the sun's glow),
//   from small copies in memory: for a mark that must read against the sky (vfx/wirecompass.js), never a read of the GPU
//   sky.GLSL  a snippet with `skyUv(vec3)` to paste into a shader that has `uniform sampler2D uSky`
//   sky.grade({ day, night, expo, mul, stars, desat, haze, hazeK })   the hour and the weather on every dome (vfx/weather.js sets it).
//   Three paintings: the maker's is DUSK (the identity grade leaves it untouched); the owner's DAY (clouds and floating soap bubbles,
//   assets/sky_day.webp) and NIGHT (violet and green swirls over a dark crown, assets/sky_night.webp) are blended in by the hour
//   (`day`, `night`: their shares). The reflections and `at` stay the dusk painting's.
//   Every dome bends with the storm over the crossing (vfx/stormwarp.js warpMaterial); elsewhere the bend is nothing.
// A FEELING'S SKY (the owner, 2026-10-24: "full pass, full marks, wire em in"): Calissa's paintings of a feeling's weather (FEELING_SKIES,
//   assets/sky_feeling_<aspect>.webp; painted on the sphere in watercolour or oil, scripts/skypaint/) come in over the paintings above by
//   the weather's strength (`sky.feeling(aspect, k, dt)`, from vfx/weather.js: at most FEELING_SKY.max, eased back by night), one at a
//   time: a change of feeling fades the one shown out before the next comes in. Each is loaded the first time its weather falls. A
//   painting with a sun of its own is turned so its sun stands where the game's does. THE EYE: every painting's top rows are an iris and
//   a pupil round the zenith (the owner's convention: the eye is the window to the soul, and an Island of Ego is a mind's), so no
//   painting is kept off the zenith.
//   sky.feeling(aspect | null, k 0..1, dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { warpMaterial } from './stormwarp.js';
import { NIGHT_GLSL, NIGHT_UNIFORMS } from './nightsky.js';
import skyB64 from '../assets/sky.webp?b64';
import dayB64 from '../assets/sky_day.webp?b64';
import nightB64 from '../assets/sky_night.webp?b64';

/** The feelings' skies: the paintings that stand (the owner's ruling, 2026-10-24), each loaded when first wanted; `sunLon` where the
 *  painting's own sun stands (radians, atan2(z, x)), so it can be turned to the game's. All seven feelings have one. */
export const FEELING_SKIES = {
  wonder: { load: () => import('../assets/sky_feeling_wonder.webp?b64'), sunLon: 1.1 },   // (its halo and sun dogs round the sun)
  mirth: { load: () => import('../assets/sky_feeling_mirth.webp?b64'), sunLon: -0.6 },    // (its rainbow opposite the sun)
  grief: { load: () => import('../assets/sky_feeling_grief.webp?b64') },
  gall: { load: () => import('../assets/sky_feeling_gall.webp?b64') },
  desire: { load: () => import('../assets/sky_feeling_desire.webp?b64'), sunLon: 0.3 },
  fury: { load: () => import('../assets/sky_feeling_fury.webp?b64') },
  dread: { load: () => import('../assets/sky_feeling_dread.webp?b64') },
};
/** How far a feeling's sky covers the others at full strength, how much of that the night takes back, and how fast it eases (per real s). */
export const FEELING_SKY = { max: 0.85, night: 0.45, rate: 0.5 };

export const SKY_GLSL = `
vec2 skyUv(vec3 d) { return vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); }
`;


// THE NIGHT ALIVE (the owner, R46: "make the night sky feel more alive"; the evaluation is docs/ART.md, "The night sky"): laid over the
// night painting in this dome's own shader, so it costs no draw call: the stars on their wheel, meteors and showers, the aurora, the
// moon's phases, the house's constellations, and each feeling's night. Its GLSL and uniforms are vfx/nightsky.js's (NIGHT_GLSL,
// NIGHT_UNIFORMS), driven there once a frame.
export class Sky {
  constructor(game) {
    this.game = game;
    this.texture = null;
    this.env = null;
    this.horizon = new THREE.Color(0xd1b184);
    this.zenith = new THREE.Color(0x49322a);
    this.GLSL = SKY_GLSL;
    this.px = null; this.W = 0; this.H = 0;
    this.G = { uSkyDay: { value: null }, uSkyNight: { value: null }, uDay: { value: 0 }, uNight: { value: 0 }, uExpo: { value: 1 }, uMul: { value: new THREE.Color(1, 1, 1) },
      uStars: { value: 1 }, uDesat: { value: 0 }, uHaze: { value: new THREE.Color(0, 0, 0) }, uHazeK: { value: 0 },
      ...NIGHT_UNIFORMS(), // (the night alive: vfx/nightsky.js drives them)
      // a feeling's sky: its painting, its share, and its turn (radians about the up axis, so its sun meets the game's)
      uSkyFeeling: { value: null }, uFeeling: { value: 0 }, uFeelingYaw: { value: 0 } };
    this.feel = { shown: null, k: 0, tex: {}, px: {}, loading: {} };
  }

  /** The grade over the paintings (the hour and the weather): the day's and the night's shares (the rest is dusk), an exposure, a
   *  multiply, the dusk painting's stars, a desaturation, and a haze toward the horizon. */
  grade({ day = 0, night = 0, expo = 1, mul, stars = 1, desat = 0, haze, hazeK = 0 } = {}) {
    const G = this.G;
    G.uDay.value = day; G.uNight.value = night; G.uExpo.value = expo; G.uStars.value = stars; G.uDesat.value = desat; G.uHazeK.value = hazeK;
    G.uMul.value.copy(mul || _white); G.uHaze.value.copy(haze || _black); // (an empty grade: the dusk painting as it is)
  }

  /** A feeling's sky (FEELING_SKIES) over the paintings, wanted at share `k` (0..1, already the weather's strength). One shows at a time:
   *  another wanted fades the one shown out first. Called every frame by vfx/weather.js; `sunDir`, the game's sun, turns a painted sun. */
  feeling(aspect, k, dt, sunDir = null) {
    const F = this.feel, G = this.G, row = aspect && FEELING_SKIES[aspect];
    const want = row ? Math.min(FEELING_SKY.max, k) * (1 - FEELING_SKY.night * G.uNight.value) : 0;
    if (row && !F.tex[aspect] && !F.loading[aspect]) F.loading[aspect] = this.loadFeeling(aspect);
    const ready = row && F.tex[aspect];
    let target = 0;
    if (F.shown && F.shown !== aspect) target = 0;              // (the one shown goes first)
    else if (ready) { F.shown = aspect; target = want; }
    F.k += (target - F.k) * (1 - Math.exp(-dt * FEELING_SKY.rate * 3));
    if (F.k < 0.002 && target === 0) { F.k = 0; if (F.shown !== aspect) F.shown = ready ? aspect : null; }
    G.uFeeling.value = F.shown ? F.k : 0;
    if (F.shown) {
      G.uSkyFeeling.value = F.tex[F.shown];
      const sl = FEELING_SKIES[F.shown].sunLon;
      G.uFeelingYaw.value = sl != null && sunDir ? Math.atan2(sunDir.z, sunDir.x) - sl : 0;
    }
  }
  async loadFeeling(aspect) {
    try {
      const { default: b64 } = await FEELING_SKIES[aspect].load();
      const t = await new THREE.TextureLoader().loadAsync(`data:image/webp;base64,${b64}`);
      t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
      this.game.renderer?.initTexture?.(t); // (uploaded now, not at its first frame)
      const c = document.createElement('canvas'); c.width = this.W || 128; c.height = this.H || 64;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(t.image, 0, 0, c.width, c.height);
      this.feel.px[aspect] = g.getImageData(0, 0, c.width, c.height).data;
      this.feel.tex[aspect] = t;
    } catch (e) { console.warn(`the sky of ${aspect}`, e); }
  }

  async load() {
    const tex = await new THREE.TextureLoader().loadAsync(`data:image/webp;base64,${skyB64}`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; // (no mipmaps: the atan seam would show as a line)
    this.texture = tex;
    const [day, night] = await Promise.all([dayB64, nightB64].map((b) => new THREE.TextureLoader().loadAsync(`data:image/webp;base64,${b}`)));
    for (const t of [day, night]) { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; }
    this.G.uSkyDay.value = day; this.G.uSkyNight.value = night;
    // a small copy in memory: what colour is the sky in a direction (for the fog, and for things that tint by it)
    const im = tex.image, W = 128, H = 64;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0, W, H);
    this.px = g.getImageData(0, 0, W, H).data; this.W = W; this.H = H;
    for (const [k, t] of [['pxDay', day], ['pxNight', night]]) { g.clearRect(0, 0, W, H); g.drawImage(t.image, 0, 0, W, H); this[k] = g.getImageData(0, 0, W, H).data; } // (the day's and the night's too, for toneAt)
    this.horizon.copy(this.average(0.44, 0.56));
    this.zenith.copy(this.average(0.86, 0.96));
    // the filtered copy for reflections (one small cost, once)
    const pm = new THREE.PMREMGenerator(this.game.renderer);
    this.env = pm.fromEquirectangular(tex).texture;
    pm.dispose();
    return this;
  }

  /** The average colour of a band of the painting (v from the bottom, 0..1), as a linear colour. */
  average(v0, v1, out = new THREE.Color()) {
    let r = 0, gg = 0, b = 0, n = 0;
    for (let y = Math.floor((1 - v1) * this.H); y < Math.ceil((1 - v0) * this.H); y++) for (let x = 0; x < this.W; x++) {
      const o = (y * this.W + x) * 4; r += this.px[o]; gg += this.px[o + 1]; b += this.px[o + 2]; n++;
    }
    n = Math.max(1, n);
    return out.setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
  }

  /** The painting's colour in a direction (unit vector), linear. */
  at(d, out = new THREE.Color()) {
    const u = Math.atan2(d.z, d.x) / (Math.PI * 2) + 0.5, v = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) / Math.PI + 0.5;
    return this.pick(this.px, u, v, out);
  }
  /** A small copy's colour at (u, v), linear. */
  pick(px, u, v, out) {
    const x = Math.min(this.W - 1, Math.floor(u * this.W)), y = Math.min(this.H - 1, Math.max(0, Math.floor((1 - v) * this.H))), o = (y * this.W + x) * 4;
    return out.setRGB(px[o] / 255, px[o + 1] / 255, px[o + 2] / 255, THREE.SRGBColorSpace);
  }

  /** The dome's colour in a direction as `domeMaterial` draws it now (its paintings by the hour, the weather's grade, the sun's glow;
   *  not the stars), linear. From the small copies in memory, so a mark can be told what it is drawn against without reading the GPU. */
  toneAt(d, out = new THREE.Color(), sun = null) {
    const G = this.G, u = Math.atan2(d.z, d.x) / (Math.PI * 2) + 0.5, v = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) / Math.PI + 0.5;
    this.pick(this.px, u, v, out);
    const day = G.uDay.value, night = G.uNight.value; // (every painting to the zenith: its top rows are the eye)
    if (day > 0.001 && this.pxDay) out.lerp(this.pick(this.pxDay, u, v, _t), day);
    if (night > 0.001 && this.pxNight) out.lerp(this.pick(this.pxNight, u, v, _t), night);
    const fk = G.uFeeling.value, fpx = this.feel.shown && this.feel.px[this.feel.shown];
    if (fk > 0.001 && fpx) out.lerp(this.pick(fpx, (((u - G.uFeelingYaw.value / (Math.PI * 2)) % 1) + 1) % 1, v, _t), fk);
    const l = out.r * 0.299 + out.g * 0.587 + out.b * 0.114;
    out.lerp(_t.setRGB(l, l, l), G.uDesat.value * (1 - fk)).multiply(_t.copy(G.uMul.value).lerp(_white, fk)).multiplyScalar(G.uExpo.value);
    out.lerp(G.uHaze.value, G.uHazeK.value * (1 - 0.6 * fk) * (1 - THREE.MathUtils.smoothstep(Math.abs(d.y), 0, 0.5)));
    out.multiplyScalar(1 + (G.uMoon?.value.z || 0) * night); // (the moon's lift on the night's colour, as the dome draws it)
    if (sun) { const sd = Math.max(0, d.dot(sun)), k = (Math.pow(sd, 60) * 0.35 + Math.pow(sd, 7) * 0.14) * Math.min(1, G.uExpo.value) * (1 - night); out.r += k; out.g += 0.78 * k; out.b += 0.46 * k; }
    return out;
  }

  /** The dome's material: the painting, graded by the hour and the weather (`grade`), with the sun laid over it (a moon by night, in the light's same direction). */
  domeMaterial(sunDir) {
    const m = new THREE.ShaderMaterial({ name: 'sky-dome',
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSky: { value: this.texture }, uSun: { value: sunDir.clone().normalize() }, uTime: { value: 0 }, ...this.G },
      vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uSun; uniform float uTime; uniform sampler2D uSky;
uniform sampler2D uSkyDay, uSkyNight, uSkyFeeling; uniform float uDay, uNight, uExpo, uStars, uDesat, uHazeK, uFeeling, uFeelingYaw; uniform vec3 uMul, uHaze;
${SKY_GLSL}
${NIGHT_GLSL}
void main() {
  vec3 d = normalize(vD);
  vec3 c = texture2D(uSky, skyUv(d)).rgb;
  c += max(c - vec3(0.45), 0.0) * smoothstep(0.05, 0.75, d.y) * (uStars - 1.0) * 1.5; // (the dusk painting's stars: its bright points high up)
  vec2 uvP = skyUv(d); // (every painting to the zenith: the top rows are the eye, the owner's convention)
  if (uDay > 0.001) c = mix(c, texture2D(uSkyDay, uvP).rgb, uDay);
  vec3 np = vec3(0.0); // (the night painting, kept: its swirls are the clouds the stars sit behind)
  if (uNight > 0.001) { np = texture2D(uSkyNight, uvP).rgb; c = mix(c, np, uNight); }
  if (uFeeling > 0.001) c = mix(c, texture2D(uSkyFeeling, vec2(uvP.x - uFeelingYaw * 0.15915494, uvP.y)).rgb, uFeeling); // (a feeling's sky, turned to the sun)
  c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), uDesat * (1.0 - uFeeling)) * mix(uMul, vec3(1.0), uFeeling) * uExpo; // (a feeling's painting is its weather already: the grade's desat and tint give way to it, the hour's light stays)
  c = mix(c, uHaze, uHazeK * (1.0 - 0.6 * uFeeling) * (1.0 - smoothstep(0.0, 0.5, abs(d.y))));
  float sd = max(dot(d, normalize(uSun)), 0.0), sunK = 1.0 - uNight;
  c += vec3(1.0, 0.78, 0.46) * (pow(sd, 1400.0) * 5.0 + pow(sd, 60.0) * 0.35 + pow(sd, 7.0) * 0.14) * min(1.0, uExpo) * sunK; // (the sun fades with the night)
  c *= 1.0 + uMoon.z * uNight; // (the moon's light on the night's own colour: a full moon lifts it a little, vfx/nightsky.js MOON.lift)
  // the moon where the sun was (the light's one direction), in its phase by the game days, and its glow
  float disc = uNight > 0.001 ? moonDisc(c, d, normalize(uSun), uNight) : 0.0;
  if (uNight > 0.01) c = nightAlive(c, d, (1.0 - disc) * uNight * min(1.0, uExpo * 1.5), max(np.r, max(np.g, np.b)), normalize(uSun)); // (the stars, meteors, the aurora, the constellations, a feeling's night: vfx/nightsky.js)
  gl_FragColor = vec4(max(c, 0.0), 1.0);
  #include <colorspace_fragment>
}`,
    });
    warpMaterial(m); // (the storm bends the sky with the sea: vfx/stormwarp.js)
    return m; // (its grade's uniforms are the sky's own, shared: every dome graded at once)
  }
}
const _white = new THREE.Color(1, 1, 1), _black = new THREE.Color(0, 0, 0), _t = new THREE.Color();
