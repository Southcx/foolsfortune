// ---------------------------------------------------------------------------------------
// STAINS: spilled crude on the ground (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4.5). A pool of Lachryma soaked into
// the ground where a cask broke or a bottle cracked, graded by the feeling of the crude it was. Left alone it grows a stage a game day,
// three stages, and at the third something stirs in it; the Soul Brush's mop drinks it back.
//
//   THE POOL      ink with its oil film, its rim wet and darker where it soaks in, a ring of the feeling's colour where the film
//                 thins at the edge (the grade: mirth's gold, wonder's blue, desire's orange, grief's pale blue, dread's green)
//   STAGE 1       a small irregular pool, a few drops flung round it
//   STAGE 2       spread wider, fingers reaching out along the ground, satellite pools
//   STAGE 3       wide and deep: its middle darker and BREATHING (slow bubbles that rise, swell and break: a Figment is gathering)
//   THE MOP       `amount` falls as the brush drinks it: the pool shrinks back from its edge, its fingers first
//
// Prior art: Super Mario Sunshine's graffiti goop (Bowser Jr.'s paint: a puddle on the ground that grows, hurts and is hosed away, and
// whose colour says its kind), Splatoon's ink on the ground (a flat pool with a glossy rim, drawn as a decal), and the oil slick's film.
//
// A SLICK (vfx/slicks.js: crude thrown or welled up in a fight, no feeling) is drawn by the same program: `uSlick` 1 takes the stain's
// shape without fingers or stages and colours it along the oxidation ramp (`uOx`, vfx/oxidation.js slickColour): one program for both,
// and the stain the warm-up parks (main.js) keeps it compiled.
//
//   const S = new Stain({ feeling, seed })   S.group (a flat disc, stood 1.5 cm off the ground: the casebook's rule 1)   S.drape(heightAt)
//   S.set({ stage: 0..3 (eased: it grows), amount: 0..1 (what the mop has left) })   S.update(rawDt)   S.dispose()
//   stainUniforms({ ... }) -> the uniforms   stainMaterial(uniforms) -> the one program's material (a slick's too)   STAIN_R (the disc's radius)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from './weather.js';
import { OXIDATION_GLSL } from './oxidation.js';

const R = 2.2; // (the disc's radius, metres: a stage 3 stain fills it)
const V = /* glsl */`varying vec2 vP; varying vec3 vW; void main() { vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const F = /* glsl */`uniform float uStage, uAmount, uT, uSeed, uSlick, uOx; uniform vec3 uGrade; varying vec2 vP; varying vec3 vW;
${OXIDATION_GLSL}
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.0) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + 1.0), f.x), f.y); }
float fbm(vec2 p) { return vn(p) * 0.55 + vn(p * 2.1 + 3.1) * 0.3 + vn(p * 4.3 + 7.7) * 0.15; }
vec3 film(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
void main() {
  vec2 p = vP; float r = length(p); vec2 dir = p / max(r, 1e-4);                             // (the bearing as a direction: no seam, no star)
  float stage = mix(uStage, 2.0, uSlick);                                                  // (a slick: its flung drops, never a stage)
  float size = mix(0.35 + 0.42 * uStage, 1.45 * (1.0 - 0.3 * smoothstep(0.7, 1.0, uOx)), uSlick) * mix(0.25, 1.0, uAmount); // (its reach: by stage, or a slick soaking in from its rim; and what is left of it)
  float fingers = smoothstep(1.2, 2.4, uStage) * 0.55 * pow(vn(dir * 2.6 + uSeed * 9.0), 3.0) * (1.0 - uSlick); // (stage 2: fingers out along the ground)
  float edge = size * (0.8 + 0.35 * fbm(dir * 1.9 + uSeed * 5.0 + p * 0.5) + fingers);
  float d = r - edge;                                                                      // (inside: negative)
  // satellite pools and flung drops round it
  float sat = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i); vec2 c = vec2(cos(fi * 2.4 + uSeed * 6.0), sin(fi * 2.4 + uSeed * 6.0)) * size * (1.15 + 0.35 * h21(vec2(fi, 3.0)));
    float rr = size * (0.06 + 0.12 * h21(vec2(fi, 9.0))) * (fi < 2.0 + 2.0 * stage ? 1.0 : 0.0);
    sat = max(sat, 1.0 - smoothstep(rr * 0.75, rr, length(p - c)));
  }
  float body = max(1.0 - smoothstep(-0.02, 0.02, d), sat);
  if (body < 0.01) discard;
  float depth = clamp(-d / max(size, 0.01), 0.0, 1.0);                                     // (0 at the rim, toward 1 in the middle)
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - abs(V.y), 4.0);
  vec3 ink = vec3(0.006, 0.005, 0.01);
  vec3 c = ink + film(fbm(p * 1.4 + uT * 0.01) * 1.5 + fres + uSeed) * (0.02 + 0.12 * fres);   // (the film: brightest at a grazing look)
  float ring = (1.0 - smoothstep(0.0, 0.12, depth)) * body;                                // (the thin edge: the feeling shows where the film thins)
  if (uSlick > 0.5) { // (a slick: crude with no feeling, along the oxidation ramp; a black mirror while fresh, then the film, then the sheen)
    float pool = 1.0 - smoothstep(-0.02, 0.02, d), f2 = pow(1.0 - abs(V.y), 2.0);   // (the pool itself, not its flung drops: only it has the rim's band)
    float h = fbm(p * 0.8 + uSeed * 3.0) + 0.35 * fbm(p * 2.3 + uSeed * 7.0 + uT * 0.01); // (the film's thickness)
    vec3 sc = slickColour(uOx, f2, h, fwidth(h), ring * pool);
    gl_FragColor = vec4(sc, body * (1.0 - smoothstep(0.82, 1.0, uOx)));
    #include <colorspace_fragment>
    return;
  }
  c = mix(c, uGrade * 0.55, ring * 0.65);
  // stage 3: the middle breathes (bubbles rise, swell and break, slowly)
  float st3 = smoothstep(2.4, 3.0, uStage) * uAmount;
  if (st3 > 0.0) {
    vec2 q = p / max(size, 0.01) * 3.0; vec2 id = floor(q); vec2 f = fract(q) - 0.5;
    float ph = fract(uT * (0.15 + 0.1 * h21(id)) + h21(id + 5.0)), b = 0.18 + 0.2 * ph;
    float bub = (1.0 - smoothstep(b - 0.04, b, length(f))) * smoothstep(0.0, 0.2, ph) * (1.0 - smoothstep(0.85, 1.0, ph)) * step(0.55, h21(id + 9.0));
    c += film(ph + h21(id)) * bub * 0.12 * st3 * smoothstep(0.2, 0.5, depth);
    c = mix(c, uGrade * 0.12, 0.25 * st3 * (0.5 + 0.5 * sin(uT * 0.8)) * smoothstep(0.3, 0.8, depth)); // (a slow glow from under it)
  }
  gl_FragColor = vec4(c, body); // (opaque inside: the scene is linear, and a tenth of the sand through it would grey it)
  #include <colorspace_fragment>
}`;

/** A stain's (or a slick's) uniforms: `slick` 1 draws it as a slick, `ox` its place on the oxidation ramp (0 fresh .. 1 gone). */
export const stainUniforms = ({ feeling = 'grief', seed = Math.random(), slick = 0, ox = 0 } = {}) => ({
  uStage: { value: 0 }, uAmount: { value: 1 }, uT: { value: 0 }, uSeed: { value: seed }, uGrade: { value: new THREE.Color(COLOR[feeling] ?? COLOR.grief) },
  uSlick: { value: slick }, uOx: { value: ox },
});
/** The one program blots and slicks are drawn with (the same source and settings: three.js gives every one of these the same program). */
export const stainMaterial = (u) => new THREE.ShaderMaterial({ name: 'stain', uniforms: u, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
export const STAIN_R = R;

export class Stain {
  constructor({ feeling = 'grief', seed = Math.random() } = {}) {
    this.u = stainUniforms({ feeling, seed });
    const geo = new THREE.PlaneGeometry(2 * R, 2 * R, 22, 22); // (in its own xy, which the shader reads; the mesh is laid flat, and may drape)
    this.mesh = new THREE.Mesh(geo, stainMaterial(this.u));
    this.mesh.rotation.x = -Math.PI / 2; this.mesh.position.y = 0.015; this.mesh.renderOrder = 1; // (1.5 cm off the ground: the casebook's rule 1)
    this.group = new THREE.Group(); this.group.name = 'stain'; this.group.add(this.mesh);
    this.stage = 0; this.target = 0;
  }

  /** Lie on uneven ground: each vertex lifted to the ground under it (heightAt(x, z) in world metres), 1.5 cm over it. Call once placed. */
  drape(heightAt) {
    this.group.updateMatrixWorld(true);
    const pos = this.mesh.geometry.attributes.position, m = this.mesh.matrixWorld, _w = new THREE.Vector3(), base = this.group.position.y;
    for (let i = 0; i < pos.count; i++) {
      _w.set(pos.getX(i), pos.getY(i), 0).applyMatrix4(m);
      pos.setZ(i, heightAt(_w.x, _w.z) - base); // (the mesh is turned flat: its local z is the world's up)
    }
    pos.needsUpdate = true; this.mesh.geometry.computeBoundingSphere();
  }

  /** stage: 0..3 (it grows to it over a few real seconds); amount: what is left of it, 0..1 (the mop). */
  set({ stage = this.target, amount = this.u.uAmount.value } = {}) { this.target = stage; this.u.uAmount.value = THREE.MathUtils.clamp(amount, 0, 1); }

  update(raw = 1 / 60) {
    this.u.uT.value += raw;
    this.stage += (this.target - this.stage) * (1 - Math.exp(-raw * 0.8)); // (a stain spreads; it never jumps a stage)
    this.u.uStage.value = this.stage;
    this.group.visible = this.u.uAmount.value > 0.01;
  }

  dispose() { this.group.parent?.remove(this.group); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
