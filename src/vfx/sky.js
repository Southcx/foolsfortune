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
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { warpMaterial } from './stormwarp.js';
import skyB64 from '../assets/sky.webp?b64';
import dayB64 from '../assets/sky_day.webp?b64';
import nightB64 from '../assets/sky_night.webp?b64';

export const SKY_GLSL = `
vec2 skyUv(vec3 d) { return vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); }
`;


// THE NIGHT ALIVE (the owner, R46: "make the night sky feel more alive"; the evaluation is docs/ART.md, "The night sky"): laid over the
// night painting in the dome's own shader, so it costs no draw call. STARS of our own on a wheel turning about a tilted pole (one turn
// a game day); now and then a METEOR; and at the Shore, an AURORA's curtains low over the sea.
// THE STARS AS A SKY HAS THEM (the owner, R10: "too uniform in colour and brightness", "drawn in front of the clouds"):
//   COLOUR      each star its own temperature, a lognormal round 6300 K (most near white, a tail to orange at 3000 K and to blue-white
//               past 15000 K), drawn on the Planckian locus, and the whole field leaning a little warmer or cooler across the sky
//   BRIGHTNESS  a power law (N(>F) ~ F^-1.4, near the -1.5 of stars spread evenly through space): many faint, a few bright, the
//               brightest a touch larger. A faint star is dimmer, never smaller: a soft Gaussian at least a pixel wide (no crawl)
//   BEHIND      the cloud layer's own field read here (vfx/clouds.js's mapping and noise, linked by vfx/nightsky.js), so a star is gone
//               under a cloud and fades at its fringe; the night painting's swirls (`swirl`) let them through only where they are thin;
//               a high CIRRUS drifting slower than the cloud dims patches of the field, so it is never even
//   TWINKLE     slow (a few seconds a breath), deeper near the horizon, where starlight crosses more air (and is dimmer there: extinction)
// Prior art: the Yale Bright Star Catalogue's colour indices and counts (most naked-eye stars white to yellow-white, the K giants
// orange, a few hot blue-white; three times as many at each fainter magnitude); Tanner Helland's fit to the blackbody in sRGB (2012);
// the starfields of Elite and of Outer Wilds (a few bright stars and a dust of faint ones); every real night, where cloud hides the stars.
const NIGHT_GLSL = /* glsl */`
uniform float uNT, uWheel, uAur, uMetK; uniform vec2 uAurDir; uniform vec3 uMetS, uMetE;
uniform sampler2D uCloudNoise; uniform vec2 uCloudOff; uniform vec4 uCloud; // (the cloud layer's cover and opacity, whether it is drawn, whether its noise is bound)
float nh1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float nn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(nh1(i), nh1(i + 1.0), f); }
vec3 nh3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
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
vec3 nightAlive(vec3 c, vec3 d, float k, float swirl) {
  float lum = dot(c, vec3(0.299, 0.587, 0.114)), dark = 1.0 - smoothstep(0.18, 0.5, lum), up = smoothstep(0.0, 0.1, d.y);
  float cl = uCloud.z > 0.5 ? cloudOver(d) : 0.0, clear = 1.0 - cl;
  float cirrus = uCloud.w > 0.5 ? texture2D(uCloudNoise, d.xz / (max(d.y, 0.0) + 0.3) * 0.08 + uCloudOff * 0.4 + 0.53).r : 0.6; // (the cirrus: higher and slower than the cloud)
  float air = mix(0.3, 1.0, smoothstep(0.03, 0.45, d.y));                                // (extinction: low stars through more air, dimmer)
  float seen = clear * mix(0.35, 1.0, smoothstep(0.34, 0.62, cirrus)) * (1.0 - smoothstep(0.05, 0.4, swirl)) * dark * up * air * k;
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
    sum += mix(vec3(1.0), starColour(temp), 0.85) * s * F * tw;
  }
  c += sum * 0.2 * seen;
  // a meteor: a short bright streak along its path, its tail fading behind the head
  if (uMetK >= 0.0) {
    vec3 hd = normalize(mix(uMetS, uMetE, uMetK)), tl = normalize(mix(uMetS, uMetE, max(0.0, uMetK - 0.3)));
    vec3 ab = hd - tl; float t = clamp(dot(d - tl, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float w = length(fwidth(d)) * 2.0, m = 1.0 - smoothstep(0.0, w, length(d - (tl + ab * t)));
    c += vec3(0.95, 0.92, 1.0) * m * t * t * (1.0 - uMetK * uMetK) * 2.6 * up * k * clear; // (behind the cloud too)
  }
  // the aurora: curtains low over the sea, hemmed in labradorite's green, lapis above, violet at the top, drifting and folding slowly
  if (uAur > 0.001) {
    float az = atan(d.z, d.x), da = abs(atan(sin(az - uAurDir.x), cos(az - uAurDir.x)));
    float sector = 1.0 - smoothstep(uAurDir.y * 0.6, uAurDir.y, da), u = az * 2.0;
    float e = asin(clamp(d.y, -1.0, 1.0));
    float fold = nn1(u * 6.0 + nn1(u * 1.7 + uNT * 0.03) * 4.0 + uNT * 0.05);
    float hem = 0.03 + 0.05 * nn1(u * 3.0 + uNT * 0.04), top = hem + 0.18 + 0.22 * fold;      // (radians of elevation: a frayed curtain)
    float body = smoothstep(hem - 0.01, hem + 0.025, e) * (1.0 - smoothstep(top * 0.6, top, e));
    float rays = 0.55 + 0.45 * nn1(u * 90.0 + fold * 8.0 + uNT * 0.02);
    float y = clamp((e - hem) / max(top - hem, 0.01), 0.0, 1.0);
    vec3 ac = mix(vec3(0.15, 0.95, 0.6), vec3(0.2, 0.35, 1.0), smoothstep(0.1, 0.6, y));
    ac = mix(ac, vec3(0.6, 0.25, 0.9), smoothstep(0.6, 1.0, y));
    c += ac * body * rays * sector * (0.4 + 0.6 * fold) * uAur * 0.9 * (0.5 + 0.5 * dark) * (1.0 - 0.85 * cl); // (the aurora is far above the cloud)
  }
  return c;
}`;
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
      // the night alive (vfx/nightsky.js drives them): its clock (real seconds), the stars' wheel (radians), the aurora (amount; its bearing
      // and half-width), and a meteor (its start and end directions; its age 0..1, below 0 none)
      uNT: { value: 0 }, uWheel: { value: 0 }, uAur: { value: 0 }, uAurDir: { value: new THREE.Vector2(0, 1.1) },
      uMetS: { value: new THREE.Vector3(1, 0, 0) }, uMetE: { value: new THREE.Vector3(1, 0, 0) }, uMetK: { value: -1 },
      // the cloud layer's field, so the stars sit behind it (vfx/nightsky.js links the layer's own: its noise, its drift, and its cover,
      // opacity, whether it is drawn and whether there is one)
      uCloudNoise: { value: null }, uCloudOff: { value: new THREE.Vector2() }, uCloud: { value: new THREE.Vector4(0.5, 0, 0, 0) } };
  }

  /** The grade over the paintings (the hour and the weather): the day's and the night's shares (the rest is dusk), an exposure, a
   *  multiply, the dusk painting's stars, a desaturation, and a haze toward the horizon. */
  grade({ day = 0, night = 0, expo = 1, mul, stars = 1, desat = 0, haze, hazeK = 0 } = {}) {
    const G = this.G;
    G.uDay.value = day; G.uNight.value = night; G.uExpo.value = expo; G.uStars.value = stars; G.uDesat.value = desat; G.uHazeK.value = hazeK;
    G.uMul.value.copy(mul || _white); G.uHaze.value.copy(haze || _black); // (an empty grade: the dusk painting as it is)
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
    const vp = Math.min(v, 0.93), day = G.uDay.value, night = G.uNight.value; // (the owner's paintings kept off the zenith, as the shader does)
    if (day > 0.001 && this.pxDay) out.lerp(this.pick(this.pxDay, u, vp, _t), day);
    if (night > 0.001 && this.pxNight) out.lerp(this.pick(this.pxNight, u, vp, _t), night);
    const l = out.r * 0.299 + out.g * 0.587 + out.b * 0.114;
    out.lerp(_t.setRGB(l, l, l), G.uDesat.value).multiply(G.uMul.value).multiplyScalar(G.uExpo.value);
    out.lerp(G.uHaze.value, G.uHazeK.value * (1 - THREE.MathUtils.smoothstep(Math.abs(d.y), 0, 0.5)));
    if (sun) { const sd = Math.max(0, d.dot(sun)), k = (Math.pow(sd, 60) * 0.35 + Math.pow(sd, 7) * 0.14) * Math.min(1, G.uExpo.value) * (1 - night); out.r += k; out.g += 0.78 * k; out.b += 0.46 * k; }
    return out;
  }

  /** A window onto the painting: a flat surface (an oculus in a ceiling) that shows the sky in whatever direction the eye looks through it. */
  windowMaterial(sunDir) {
    return new THREE.ShaderMaterial({ name: 'sky-env',
      side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false,
      uniforms: { uSky: { value: this.texture }, uSun: { value: sunDir.clone().normalize() } },
      vertexShader: 'varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vP; uniform vec3 uSun; uniform sampler2D uSky;
${SKY_GLSL}
void main() {
  vec3 d = normalize(vP - cameraPosition); d.y = abs(d.y) * 0.9 + 0.1;
  vec3 c = texture2D(uSky, skyUv(normalize(d))).rgb * 1.4;
  float sd = max(dot(normalize(d), normalize(uSun)), 0.0);
  c += vec3(1.0, 0.78, 0.46) * (pow(sd, 60.0) * 0.35 + pow(sd, 7.0) * 0.14);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
    });
  }

  /** The dome's material: the painting, graded by the hour and the weather (`grade`), with the sun laid over it (a moon by night, in the light's same direction). */
  domeMaterial(sunDir) {
    const m = new THREE.ShaderMaterial({ name: 'sky-dome',
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSky: { value: this.texture }, uSun: { value: sunDir.clone().normalize() }, uTime: { value: 0 }, ...this.G },
      vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uSun; uniform float uTime; uniform sampler2D uSky;
uniform sampler2D uSkyDay, uSkyNight; uniform float uDay, uNight, uExpo, uStars, uDesat, uHazeK; uniform vec3 uMul, uHaze;
${SKY_GLSL}
${NIGHT_GLSL}
void main() {
  vec3 d = normalize(vD);
  vec3 c = texture2D(uSky, skyUv(d)).rgb;
  c += max(c - vec3(0.45), 0.0) * smoothstep(0.05, 0.75, d.y) * (uStars - 1.0) * 1.5; // (the dusk painting's stars: its bright points high up)
  vec2 uvP = skyUv(d); uvP.y = min(uvP.y, 0.93); // (the owner's paintings: their top rows are a dark band, kept off the zenith)
  if (uDay > 0.001) c = mix(c, texture2D(uSkyDay, uvP).rgb, uDay);
  vec3 np = vec3(0.0); // (the night painting, kept: its swirls are the clouds the stars sit behind)
  if (uNight > 0.001) { np = texture2D(uSkyNight, uvP).rgb; c = mix(c, np, uNight); }
  c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), uDesat) * uMul * uExpo;
  c = mix(c, uHaze, uHazeK * (1.0 - smoothstep(0.0, 0.5, abs(d.y))));
  float sd = max(dot(d, normalize(uSun)), 0.0), sunK = 1.0 - uNight;
  c += vec3(1.0, 0.78, 0.46) * (pow(sd, 1400.0) * 5.0 + pow(sd, 60.0) * 0.35 + pow(sd, 7.0) * 0.14) * min(1.0, uExpo) * sunK; // (the sun fades with the night)
  // the moon where the sun was (the light's one direction): a cool small disc, its limb a little darker, and a faint ring of haze
  float md = dot(d, normalize(uSun)), disc = smoothstep(0.99985, 0.99992, md);
  c = mix(c, vec3(0.82, 0.86, 0.95) * (0.75 + 0.25 * smoothstep(0.99985, 0.99998, md)), disc * uNight) + vec3(0.45, 0.55, 0.8) * pow(sd, 300.0) * 0.12 * uNight;
  if (uNight > 0.01) c = nightAlive(c, d, (1.0 - disc) * uNight * min(1.0, uExpo * 1.5), max(np.r, max(np.g, np.b))); // (the stars, a meteor, the aurora: vfx/nightsky.js)
  gl_FragColor = vec4(max(c, 0.0), 1.0);
  #include <colorspace_fragment>
}`,
    });
    warpMaterial(m); // (the storm bends the sky with the sea: vfx/stormwarp.js)
    return m; // (its grade's uniforms are the sky's own, shared: every dome graded at once)
  }
}
const _white = new THREE.Color(1, 1, 1), _black = new THREE.Color(0, 0, 0), _t = new THREE.Color();
