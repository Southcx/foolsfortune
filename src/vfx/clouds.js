// ---------------------------------------------------------------------------------------
// CLOUDS: a layer of cloud drifting across the painted sky, downwind. The painting (sky.js) is still; this is the one thing in the sky
// that moves, and it moves the honest way the era moved a sky: a noise texture scrolled across a layer between the eye and the dome.
//
// The layer is carried on a low-poly shell nested just inside the dome (it follows the camera, as the dome does), but it is not mapped
// like a globe: each pixel looks up the texture where its view ray meets a flat ceiling overhead (uv = dir.xz / dir.y, the classic
// sky-plane mapping), so the clouds shrink into perspective toward the horizon instead of pinching at a pole, and thin out before they
// reach it. Two octaves of the same tileable noise at different scales and speeds give shape that changes as it drifts; the coverage is
// a soft threshold, the lit side warm where it faces the sun. Nothing flickers: it only slides, slowly.
//
// Prior art: the scrolled cloud layers of Final Fantasy X, Ico and Wind Waker (a texture moved across a dome, under a painted or
// gradient sky), and the sky-plane projection of the flight-sim and demo-scene tradition.
//
//   const c = new CloudLayer(scene, { sun: dir })    c.update(dt, camera.position, windDir (Vector2), windSpeed)    c.visible = bool
//   c.grade({ expo, mul, cover, opacity })   the hour and the weather (vfx/weather.js): an empty grade is the layer as built
//   c.over(dir, colour)   the layer as drawn now laid over a colour (linear, in place), from the noise in memory: what a mark that must
//   read against the sky is drawn on (vfx/wirecompass.js)
// The layer bends with the storm over the crossing (vfx/stormwarp.js warpMaterial: the ceiling that folds); elsewhere the bend is nothing.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { warpMaterial } from './stormwarp.js';

/** A tileable value-noise fbm, as a small repeating texture (made once). */
function noiseTexture(size = 128, period = 8) {
  const hash = (x, y) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = (t) => t * t * (3 - 2 * t);
  const vn = (x, y, p) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy);
    const w = (a) => ((a % p) + p) % p;
    const a = hash(w(ix), w(iy)), b = hash(w(ix + 1), w(iy)), c = hash(w(ix), w(iy + 1)), d = hash(w(ix + 1), w(iy + 1));
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let s = 0, amp = 0.5, f = 1, norm = 0;
    for (let o = 0; o < 5; o++) { s += amp * vn((x / size) * period * f, (y / size) * period * f, period * f); norm += amp; amp *= 0.5; f *= 2; }
    const v = Math.round((s / norm) * 255), i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

export class CloudLayer {
  constructor(scene, { radius = 760, sun = new THREE.Vector3(0, 1, 0), lit = 0xfff0dc, shade = 0xc49a92, cover = 0.52, opacity = 0.8 } = {}) {
    this.offset = new THREE.Vector2();
    this.uniforms = {
      uNoise: { value: noiseTexture() }, uOff: { value: this.offset }, uSun: { value: sun.clone().normalize() },
      uLit: { value: new THREE.Color(lit) }, uShade: { value: new THREE.Color(shade) }, uCover: { value: cover }, uOpacity: { value: opacity },
    };
    this.base = { lit: this.uniforms.uLit.value.clone(), shade: this.uniforms.uShade.value.clone(), cover, opacity };
    const mat = new THREE.ShaderMaterial({ name: 'clouds',
      uniforms: this.uniforms, transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
      vertexShader: 'varying vec3 vD; void main() { vD = position; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9998; }',
      fragmentShader: `varying vec3 vD;
uniform sampler2D uNoise; uniform vec2 uOff; uniform vec3 uSun; uniform vec3 uLit; uniform vec3 uShade; uniform float uCover; uniform float uOpacity;
void main() {
  vec3 d = normalize(vD);
  if (d.y < 0.015) discard;
  vec2 uv = d.xz / (d.y + 0.1) * 0.22;                          // where the ray meets a flat ceiling of cloud
  float n = texture2D(uNoise, uv + uOff).r * 0.7 + texture2D(uNoise, uv * 2.7 - uOff * 1.6 + 0.37).r * 0.3;
  float a = smoothstep(uCover, uCover + 0.2, n);
  a *= smoothstep(0.015, 0.22, d.y);                             // thinning toward the horizon
  float sd = max(dot(d, uSun), 0.0);
  vec3 c = mix(uShade, uLit, smoothstep(uCover + 0.05, uCover + 0.3, n) * 0.7 + 0.3 * sd);
  c += vec3(1.0, 0.8, 0.55) * pow(sd, 10.0) * 0.35;              // the edges round the sun catch it
  gl_FragColor = vec4(c, a * uOpacity);
  #include <colorspace_fragment>
}`,
    });
    warpMaterial(mat); // (the storm folds the ceiling: vfx/stormwarp.js)
    // (a low-poly shell, the top of a sphere: the mapping is in the shader, so the shape only has to cover the sky)
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -9;
    this.mesh.userData.zoneFree = true;
    scene.add(this.mesh);
  }

  /** The hour and the weather on the layer: its light (an exposure and a multiply), how much of the sky it covers, how thick. */
  grade({ expo = 1, mul = null, cover = this.base.cover, opacity = this.base.opacity } = {}) {
    const U = this.uniforms, B = this.base;
    U.uLit.value.copy(B.lit).multiplyScalar(expo); U.uShade.value.copy(B.shade).multiplyScalar(expo);
    if (mul) { U.uLit.value.multiply(mul); U.uShade.value.multiply(mul); }
    U.uCover.value = cover; U.uOpacity.value = opacity;
  }

  /** The layer over a direction as the shader draws it now (its ceiling's mapping, two octaves, its cover, light and opacity), laid
   *  over `c` (linear) in place. */
  over(d, c) {
    if (!this.mesh.visible || d.y < 0.015) return c;
    const U = this.uniforms, o = this.offset, k = 0.22 / (d.y + 0.1), u = d.x * k, v = d.z * k, cover = U.uCover.value;
    const n = this.noiseAt(u + o.x, v + o.y) * 0.7 + this.noiseAt(u * 2.7 - o.x * 1.6 + 0.37, v * 2.7 - o.y * 1.6 + 0.37) * 0.3;
    const a = THREE.MathUtils.smoothstep(n, cover, cover + 0.2) * THREE.MathUtils.smoothstep(d.y, 0.015, 0.22) * U.uOpacity.value;
    if (a <= 0) return c;
    const sd = Math.max(0, d.dot(U.uSun.value)), glow = Math.pow(sd, 10) * 0.35;
    _c.copy(U.uShade.value).lerp(U.uLit.value, THREE.MathUtils.smoothstep(n, cover + 0.05, cover + 0.3) * 0.7 + 0.3 * sd);
    _c.r += glow; _c.g += 0.8 * glow; _c.b += 0.55 * glow;
    return c.lerp(_c, a);
  }
  /** The noise texture at (u, v), bilinear and repeating, 0..1 (the texture's own level 0: a little sharper than the GPU's mips far off). */
  noiseAt(u, v) {
    const img = this.uniforms.uNoise.value.image, N = img.width, D = img.data;
    const x = (u - Math.floor(u)) * N - 0.5, y = (v - Math.floor(v)) * N - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const at = (i, j) => D[((((j % N) + N) % N) * N + (((i % N) + N) % N)) * 4] / 255;
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
  }

  set visible(v) { this.mesh.visible = v; }
  get visible() { return this.mesh.visible; }

  /** Drift downwind (the layer is far up: it crosses the sky in minutes, not seconds). */
  update(dt, camPos, windDir, windSpeed) {
    this.mesh.position.copy(camPos);
    const k = windSpeed * 0.00022 * dt;
    this.offset.x += windDir.x * k; this.offset.y += windDir.y * k;
    this.offset.x %= 1; this.offset.y %= 1;
  }
}
const _c = new THREE.Color();
