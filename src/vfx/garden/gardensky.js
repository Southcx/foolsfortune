// ---------------------------------------------------------------------------------------
// THE GARDEN'S SKY: the inside of the Pneuka Jar, a small galaxy in soft light (the owner, 2026-10-07: "the dreaminess of Dual Hearts";
// docs/plans/SPIRIT-GARDEN.md section 3). There is no ground to stand on but the planetoids, so the sky is everything round them:
//
//   THE DOME     a soft gradient, lavender at the zenith to a warm haze at the horizon, the haze tinted by YOUR DRAUGHT (the feeling
//                you drink: weather.js COLOR), so the garden's air is your mood
//   THE CLOUDS   a sea of cloud BELOW, lit from above and drifting slowly (the sky-plane mapping vfx/clouds.js uses, turned upside
//                down): the planetoids float over it, as Dual Hearts' islands do
//   THE NIGHT    the game's own hour: at night the dome deepens to indigo, stars come out above and the cloud sea glows faintly from
//                within (the Lachryma under it)
//   THE MOTES    soft points of light drifting slowly round the eye, as dust in a sunbeam (Dual Hearts' air)
//   THE GREY SURROUND  while the press view is open (docs/plans/SOUL-ALCHEMY.md 4.3), the dome, the haze (and so the fog, which is the
//                haze) and the motes ease to a neutral grey of their own lightness over 0.8 real seconds, and back over 0.5: a colour is
//                judged on a grey ground (Albers; the colour booth's grey surround; Okami's world stilled to a canvas)
//
// Prior art: Dual Hearts (a dreamworld of floating islands in pastel light), Super Mario Galaxy's skies (a hub of small worlds in a
// soft void), Journey's and Sky's cloud seas, Chinese landscape painting's mist below the peaks (the xianxia sky), and the colour
// matching booth's neutral surround (Josef Albers, Interaction of Color) for the grey.
//
//   const S = new GardenSky()   scene.add(S.group)   S.set({ draught: hex, night: 0..1, rain: 0..1 })   S.update(rawDt, camera)   S.fog (a Color: the haze)
//   S.surround(on)   S.grey (0 coloured .. 1 the grey surround, eased)   S.surround(false, true) (back at once: the garden left)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const DOME_V = /* glsl */`varying vec3 vD; void main() { vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const DOME_F = /* glsl */`varying vec3 vD; uniform float uT, uNight; uniform vec3 uHaze, uZenith, uCloud;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
float fbm(vec2 p) { return n(p) * 0.55 + n(p * 2.1 + 7.3) * 0.3 + n(p * 4.3 + 1.7) * 0.15; }
void main() {
  vec3 d = normalize(vD); float y = d.y;
  vec3 sky = mix(uHaze, uZenith, smoothstep(0.0, 0.7, y));
  // the stars, above, at night
  vec2 sp = floor(d.xz / max(0.15, d.y + 0.2) * 220.0);
  float star = step(0.9975, h(sp)) * smoothstep(0.1, 0.5, y) * uNight * (0.6 + 0.4 * sin(uT * 2.0 + h(sp + 3.0) * 30.0));
  sky += vec3(0.9, 0.9, 1.0) * star;
  // the cloud sea, below: the sky-plane mapping turned down, so it lies in perspective under the planetoids
  float below = smoothstep(0.02, -0.12, y);
  vec2 q = d.xz / max(0.06, -y) * 0.6 + vec2(uT * 0.006, uT * 0.004);
  float c = fbm(q), c2 = fbm(q * 2.7 - uT * 0.01);
  float cover = smoothstep(0.38, 0.7, c * 0.7 + c2 * 0.3);
  vec3 lit = mix(uCloud * 0.75, uCloud, smoothstep(0.4, 0.9, c2));                    // (lit from above: their tops bright, their hollows soft)
  vec3 glow = mix(vec3(0.0), uHaze * 0.35, uNight) * (1.0 - cover);                     // (at night the gaps glow: the Lachryma under them)
  vec3 sea = mix(uHaze * 0.55 + glow, lit, cover);                                     // (the gaps between them deeper, so the clouds read)
  sea = mix(sea, uHaze, smoothstep(-0.06, 0.0, y));                                     // (lost in the haze at the horizon)
  gl_FragColor = vec4(mix(sky, sea, below), 1.0);
  #include <colorspace_fragment>
}`;

const DAY = { zenith: new THREE.Color(0.16, 0.2, 0.58), haze: new THREE.Color(0.86, 0.46, 0.56), cloud: new THREE.Color(0.95, 0.84, 0.88) }; // (pastel, and kept below white: the scene is linear)
const NIGHT = { zenith: new THREE.Color(0.02, 0.02, 0.07), haze: new THREE.Color(0.12, 0.08, 0.2), cloud: new THREE.Color(0.2, 0.17, 0.32) };
const SURROUND = { in: 0.8, out: 0.5 }; // (real seconds: SOUL-ALCHEMY.md 4.3)
const _g = new THREE.Color();
/** A colour eased toward the neutral grey of its own lightness (Rec. 709 luminance, linear): the grey surround keeps the sky's value. */
const toGrey = (c, k) => { if (k <= 0) return c; const y = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; return c.lerp(_g.setRGB(y, y, y), k); };

export class GardenSky {
  constructor({ radius = 900, motes = 220 } = {}) {
    this.group = new THREE.Group(); this.group.name = 'garden-sky';
    this.u = { uT: { value: 0 }, uNight: { value: 0 }, uHaze: { value: new THREE.Color() }, uZenith: { value: new THREE.Color() }, uCloud: { value: new THREE.Color() } };
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), new THREE.ShaderMaterial({ name: 'garden-dome', uniforms: this.u, vertexShader: DOME_V, fragmentShader: DOME_F, side: THREE.BackSide, depthWrite: false }));
    this.dome.frustumCulled = false; this.dome.renderOrder = -10; this.group.add(this.dome);
    // the motes: soft points drifting round the eye (they wrap round a box that follows it)
    const N = motes, pos = new Float32Array(N * 3); this.seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos.set([(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60], i * 3); this.seed[i] = Math.random() * 6.28; }
    this.moteG = new THREE.BufferGeometry(); this.moteG.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.motes = new THREE.Points(this.moteG, new THREE.PointsMaterial({ size: 0.16, map: softDot(), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff0d8 }));
    this.motes.frustumCulled = false; this.group.add(this.motes);
    this.fog = new THREE.Color(); this.draught = new THREE.Color(0xf2c84a); this.night = 0; this.rain = 0; this.t = 0; this.grey = 0; this.greyTo = 0;
    this.set({});
  }

  /** Your draught (a feeling's colour) tints the haze; `night` 0 day .. 1 the middle of the night (the game's own hour); `rain` 0..1 greys it (vfx/garden/gardenrain.js). */
  set({ draught = null, night = this.night, rain = this.rain } = {}) {
    if (draught != null) this.draught.setHex(draught); this.night = THREE.MathUtils.clamp(night, 0, 1);
    const k = this.night, u = this.u;
    u.uZenith.value.copy(DAY.zenith).lerp(NIGHT.zenith, k);
    u.uHaze.value.copy(DAY.haze).lerp(NIGHT.haze, k).lerp(this.draught, 0.28); // (your mood in the air)
    u.uCloud.value.copy(DAY.cloud).lerp(NIGHT.cloud, k).lerp(this.draught, 0.08);
    this.rain = THREE.MathUtils.clamp(rain, 0, 1); const r = this.rain * 0.45; // (under rain the air greys and the light lowers)
    if (r > 0) for (const [c, dim] of [[u.uZenith.value, 0.82], [u.uHaze.value, 0.88], [u.uCloud.value, 0.86]]) { const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; c.lerp(_g.setRGB(l, l, l * 1.04), r).multiplyScalar(1 - (1 - dim) * this.rain); }
    toGrey(u.uZenith.value, this.grey); toGrey(u.uHaze.value, this.grey); toGrey(u.uCloud.value, this.grey); // (the grey surround: SOUL-ALCHEMY.md 4.3)
    u.uNight.value = k; this.fog.copy(u.uHaze.value);
    toGrey(this.motes.material.color.setHex(0xfff0d8).lerp(this.draught, 0.3), this.grey);
  }
  /** The press view's grey surround: on, the sky, the haze and the fog ease to grey (0.8 s); off, back (0.5 s); `now` snaps it. */
  surround(on, now = false) { this.greyTo = on ? 1 : 0; if (now) { this.grey = this.greyTo; this.set({}); } }

  update(raw = 1 / 60, camera = null) {
    this.t += raw; this.u.uT.value = this.t;
    if (this.grey !== this.greyTo) { const k = this.greyTo > this.grey ? raw / SURROUND.in : -raw / SURROUND.out; this.grey = THREE.MathUtils.clamp(this.grey + k, Math.min(this.grey, this.greyTo), Math.max(this.grey, this.greyTo)); this.set({}); } // (linear in time, so the sweep can time it)
    if (camera) { this.dome.position.copy(camera.position); }
    const P = this.moteG.attributes.position, c = camera?.position;
    for (let i = 0; i < P.count; i++) {
      let x = P.getX(i) + Math.sin(this.t * 0.3 + this.seed[i]) * raw * 0.4, y = P.getY(i) + raw * 0.15, z = P.getZ(i) + Math.cos(this.t * 0.25 + this.seed[i]) * raw * 0.4;
      if (c) { const w = (v, o, s) => (v - o > s ? v - 2 * s : v - o < -s ? v + 2 * s : v); x = w(x, c.x, 30); y = w(y, c.y, 20); z = w(z, c.z, 30); } // (they wrap round the eye: always some near)
      P.setXYZ(i, x, y, z);
    }
    P.needsUpdate = true;
  }

  dispose() { this.group.parent?.remove(this.group); this.dome.geometry.dispose(); this.dome.material.dispose(); this.moteG.dispose(); this.motes.material.map.dispose(); this.motes.material.dispose(); }
}

function softDot() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}
