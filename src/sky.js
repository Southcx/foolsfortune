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
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import skyB64 from './assets/sky.webp?b64';

export const SKY_GLSL = `
vec2 skyUv(vec3 d) { return vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); }
`;

export class Sky {
  constructor(game) {
    this.game = game;
    this.texture = null;
    this.env = null;
    this.horizon = new THREE.Color(0xd1b184);
    this.zenith = new THREE.Color(0x49322a);
    this.GLSL = SKY_GLSL;
    this.px = null; this.W = 0; this.H = 0;
  }

  async load() {
    const tex = await new THREE.TextureLoader().loadAsync(`data:image/webp;base64,${skyB64}`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; // (no mipmaps: the atan seam would show as a line)
    this.texture = tex;
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
    return new THREE.ShaderMaterial({
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

  /** The dome's material: the painting, with the sun laid over it. */
  domeMaterial(sunDir) {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSky: { value: this.texture }, uSun: { value: sunDir.clone().normalize() }, uTime: { value: 0 } },
      vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uSun; uniform float uTime; uniform sampler2D uSky;
${SKY_GLSL}
void main() {
  vec3 d = normalize(vD);
  vec3 c = texture2D(uSky, skyUv(d)).rgb;
  float sd = max(dot(d, normalize(uSun)), 0.0);
  c += vec3(1.0, 0.78, 0.46) * (pow(sd, 1400.0) * 5.0 + pow(sd, 60.0) * 0.35 + pow(sd, 7.0) * 0.14);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
    });
  }
}
