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
// a game day), each at least a pixel and a half across so the turning field never crawls, twinkling slowly and more near the horizon
// (as starlight scintillates through more air); now and then a METEOR; and at the Shore, an AURORA's curtains low over the sea.
const NIGHT_GLSL = /* glsl */`
uniform float uNT, uWheel, uAur, uMetK; uniform vec2 uAurDir; uniform vec3 uMetS, uMetE;
float nh1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float nn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(nh1(i), nh1(i + 1.0), f); }
vec3 nh3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
vec3 nightAlive(vec3 c, vec3 d, float k) {
  float lum = dot(c, vec3(0.299, 0.587, 0.114)), dark = 1.0 - smoothstep(0.18, 0.5, lum), up = smoothstep(0.0, 0.1, d.y);
  // the wheel: the sky turned about a pole 35 degrees off the zenith, toward the north (-z)
  vec3 P = normalize(vec3(0.0, 0.819, -0.574)); float ca = cos(uWheel), sa = sin(uWheel);
  vec3 r = d * ca + cross(P, d) * sa + P * dot(P, d) * (1.0 - ca);
  vec3 q = r * 70.0, cell = floor(q), h = nh3(cell), f = fract(q);
  float px = max(fwidth(q.x) + fwidth(q.y) + fwidth(q.z), 1e-4) * 0.5;                  // (a pixel, in the star field's own units)
  if (h.x < 0.16) {                                                                       // (one cell in six holds a star)
    vec3 at = 0.25 + 0.5 * nh3(cell + 17.0);
    float mag = pow(h.y, 5.0), rad = px * (0.75 + 0.9 * mag);                             // (most faint; at least a pixel and a half across)
    float tw = 1.0 + (0.25 + 0.45 * (1.0 - smoothstep(0.0, 0.5, d.y))) * sin(uNT * (0.8 + 1.4 * h.z) + h.x * 40.0); // (a slow twinkle, deeper low down)
    float s = 1.0 - smoothstep(rad * 0.5, rad, length(f - at));
    vec3 col = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.86, 0.7), h.z);
    c += col * s * (0.35 + 1.6 * mag) * tw * dark * up * k;
  }
  // a meteor: a short bright streak along its path, its tail fading behind the head
  if (uMetK >= 0.0) {
    vec3 hd = normalize(mix(uMetS, uMetE, uMetK)), tl = normalize(mix(uMetS, uMetE, max(0.0, uMetK - 0.3)));
    vec3 ab = hd - tl; float t = clamp(dot(d - tl, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float w = length(fwidth(d)) * 2.0, m = 1.0 - smoothstep(0.0, w, length(d - (tl + ab * t)));
    c += vec3(0.95, 0.92, 1.0) * m * t * t * (1.0 - uMetK * uMetK) * 2.6 * up * k;
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
    c += ac * body * rays * sector * (0.4 + 0.6 * fold) * uAur * 0.9 * (0.5 + 0.5 * dark);
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
      uMetS: { value: new THREE.Vector3(1, 0, 0) }, uMetE: { value: new THREE.Vector3(1, 0, 0) }, uMetK: { value: -1 } };
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
    const x = Math.min(this.W - 1, Math.floor(u * this.W)), y = Math.min(this.H - 1, Math.floor((1 - v) * this.H)), o = (y * this.W + x) * 4;
    return out.setRGB(this.px[o] / 255, this.px[o + 1] / 255, this.px[o + 2] / 255, THREE.SRGBColorSpace);
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
  if (uNight > 0.001) c = mix(c, texture2D(uSkyNight, uvP).rgb, uNight);
  c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), uDesat) * uMul * uExpo;
  c = mix(c, uHaze, uHazeK * (1.0 - smoothstep(0.0, 0.5, abs(d.y))));
  float sd = max(dot(d, normalize(uSun)), 0.0), sunK = 1.0 - uNight;
  c += vec3(1.0, 0.78, 0.46) * (pow(sd, 1400.0) * 5.0 + pow(sd, 60.0) * 0.35 + pow(sd, 7.0) * 0.14) * min(1.0, uExpo) * sunK; // (the sun fades with the night)
  // the moon where the sun was (the light's one direction): a cool small disc, its limb a little darker, and a faint ring of haze
  float md = dot(d, normalize(uSun)), disc = smoothstep(0.99985, 0.99992, md);
  c = mix(c, vec3(0.82, 0.86, 0.95) * (0.75 + 0.25 * smoothstep(0.99985, 0.99998, md)), disc * uNight) + vec3(0.45, 0.55, 0.8) * pow(sd, 300.0) * 0.12 * uNight;
  if (uNight > 0.01) c = nightAlive(c, d, (1.0 - disc) * uNight * min(1.0, uExpo * 1.5)); // (the stars, a meteor, the aurora: vfx/nightsky.js)
  gl_FragColor = vec4(max(c, 0.0), 1.0);
  #include <colorspace_fragment>
}`,
    });
    warpMaterial(m); // (the storm bends the sky with the sea: vfx/stormwarp.js)
    return m; // (its grade's uniforms are the sky's own, shared: every dome graded at once)
  }
}
const _white = new THREE.Color(1, 1, 1), _black = new THREE.Color(0, 0, 0);
