// ---------------------------------------------------------------------------------------
// SPRITES: the particle that has a shape. The old pools (vfx/gpuparticles.js) are soft round dots, which is all a particle could be;
// a hit, a poof, a sparkle or a rune needs a SHAPE (a four-pointed star, a streak, a ring, a puff of smoke, a shard of clay), a turn and
// a spin, a colour that changes over its life, and a spark that STRETCHES along the way it flies. Like the old pools it is stateless on
// the GPU: written once when emitted, its whole life worked out in the vertex shader from those numbers (motion under drag and
// gravity, the closed form), so a burst of a thousand costs the writing and nothing after. It is drawn as instanced camera-facing quads
// (a point sprite cannot turn or stretch).
//
// The shapes live in one atlas, drawn here at startup (4 x 4 cells of 128 px, greyscale with alpha: every use tints its own):
//   soft  core  star4  sparkle  |  streak  ring  ringthin  puff  |  shard  diamond  glint  swirl  |  petal  crescent  chip  bubble
//
// Prior art: the sprite-sheet particle of every sixth-generation action game (Devil May Cry's and Kingdom Hearts' hit stars and
// streaks, Final Fantasy X's glints, Okami's petals, Dark Cloud 2's poofs), velocity-stretched sparks (every engine's "stretched
// billboard" render mode: Unity's, Unreal Cascade's velocity-aligned sprites), colour-over-life (the same engines' gradients), and
// the stateless GPU particle (Latta 2004) the old pools already are.
//
//   const S = new Sprites(scene, { additive })   S.emit({ pos, vel, life, size, sizeEnd, color, colorEnd, alpha, alphaEnd, shape, rot,
//     spin, stretch, drag, gravity, floor, twinkle, grow })   S.update(dt)
//   SHAPES: name -> cell
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SHAPES = { soft: 0, core: 1, star4: 2, sparkle: 3, streak: 4, ring: 5, ringthin: 6, puff: 7, shard: 8, diamond: 9, glint: 10, swirl: 11, petal: 12, crescent: 13, chip: 14, bubble: 15 };

let _atlas = null;
export function atlas() {
  if (_atlas) return _atlas;
  const C = 128, c = document.createElement('canvas'); c.width = c.height = C * 4;
  const g = c.getContext('2d');
  let seed = 9; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const cell = (i, draw) => { g.save(); g.translate((i % 4) * C + C / 2, Math.floor(i / 4) * C + C / 2); draw(C / 2); g.restore(); };
  const radial = (R, stops) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); for (const [t, a] of stops) gr.addColorStop(t, `rgba(255,255,255,${a})`); return gr; };
  const star = (R, n, inner, soft = 0) => { g.beginPath(); for (let k = 0; k < n * 2; k++) { const a = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? R * inner : R; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); if (soft) { g.fillStyle = radial(R * soft, [[0, 0.9], [1, 0]]); g.fillRect(-R, -R, R * 2, R * 2); } };
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  cell(SHAPES.soft, (R) => { g.fillStyle = radial(R, [[0, 1], [0.35, 0.45], [1, 0]]); g.fillRect(-R, -R, R * 2, R * 2); });
  cell(SHAPES.core, (R) => { g.fillStyle = radial(R, [[0, 1], [0.25, 1], [0.45, 0.35], [1, 0]]); g.fillRect(-R, -R, R * 2, R * 2); });
  cell(SHAPES.star4, (R) => { g.fillStyle = '#fff'; star(R * 0.95, 4, 0.16, 0.45); });
  cell(SHAPES.sparkle, (R) => { g.fillStyle = '#fff'; star(R * 0.95, 4, 0.08); g.rotate(Math.PI / 4); star(R * 0.5, 4, 0.12, 0.3); });
  cell(SHAPES.streak, (R) => { const gr = g.createLinearGradient(-R, 0, R, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.9, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, R * 0.98, R * 0.16, 0, 0, Math.PI * 2); g.fill(); });
  cell(SHAPES.ring, (R) => { g.lineWidth = R * 0.16; g.beginPath(); g.arc(0, 0, R * 0.78, 0, Math.PI * 2); g.stroke(); g.lineWidth = R * 0.06; g.globalAlpha = 0.5; g.beginPath(); g.arc(0, 0, R * 0.58, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; });
  cell(SHAPES.ringthin, (R) => { g.lineWidth = R * 0.05; g.beginPath(); g.arc(0, 0, R * 0.9, 0, Math.PI * 2); g.stroke(); });
  cell(SHAPES.puff, (R) => { for (let k = 0; k < 9; k++) { const a = r() * Math.PI * 2, d = r() * R * 0.38, rr = R * (0.3 + r() * 0.3); g.fillStyle = radial(rr, [[0, 0.55], [0.6, 0.35], [1, 0]]); g.save(); g.translate(Math.cos(a) * d, Math.sin(a) * d); g.fillRect(-rr, -rr, rr * 2, rr * 2); g.restore(); } });
  cell(SHAPES.shard, (R) => { g.beginPath(); g.moveTo(0, -R * 0.95); g.lineTo(R * 0.28, -R * 0.1); g.lineTo(R * 0.12, R * 0.9); g.lineTo(-R * 0.22, R * 0.2); g.closePath(); g.fill(); });
  cell(SHAPES.diamond, (R) => { g.beginPath(); g.moveTo(0, -R * 0.9); g.lineTo(R * 0.5, 0); g.lineTo(0, R * 0.9); g.lineTo(-R * 0.5, 0); g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(0, -R * 0.55); g.lineTo(R * 0.25, 0); g.lineTo(0, R * 0.55); g.lineTo(-R * 0.25, 0); g.closePath(); g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; });
  cell(SHAPES.glint, (R) => { for (const [w, a] of [[R * 0.06, 0], [R * 0.035, Math.PI / 2]]) { g.save(); g.rotate(a); const gr = g.createLinearGradient(-R, 0, R, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-R, -w, R * 2, w * 2); g.restore(); } g.fillStyle = radial(R * 0.3, [[0, 1], [1, 0]]); g.fillRect(-R, -R, R * 2, R * 2); });
  cell(SHAPES.swirl, (R) => { g.lineCap = 'round'; for (let k = 0; k < 3; k++) { g.save(); g.rotate((k / 3) * Math.PI * 2); g.lineWidth = R * 0.09; g.beginPath(); for (let u = 0; u <= 1.001; u += 0.05) { const a = u * Math.PI * 1.3, rr = R * (0.12 + 0.78 * u); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.globalAlpha = 0.9; g.stroke(); g.restore(); } g.globalAlpha = 1; });
  cell(SHAPES.petal, (R) => { g.beginPath(); g.moveTo(0, -R * 0.9); g.quadraticCurveTo(R * 0.55, 0, 0, R * 0.9); g.quadraticCurveTo(-R * 0.55, 0, 0, -R * 0.9); g.fill(); });
  cell(SHAPES.crescent, (R) => { g.beginPath(); g.arc(0, 0, R * 0.85, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(R * 0.3, -R * 0.15, R * 0.75, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'source-over'; });
  cell(SHAPES.chip, (R) => { g.beginPath(); const n = 6; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + r() * 0.5, rr = R * (0.45 + r() * 0.45); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); });
  cell(SHAPES.bubble, (R) => { g.lineWidth = R * 0.08; g.beginPath(); g.arc(0, 0, R * 0.8, 0, Math.PI * 2); g.stroke(); g.fillStyle = radial(R * 0.8, [[0, 0.05], [0.8, 0.15], [1, 0.4]]); g.beginPath(); g.arc(0, 0, R * 0.8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-R * 0.3, -R * 0.3, R * 0.14, 0, Math.PI * 2); g.fill(); });
  _atlas = new THREE.CanvasTexture(c);
  _atlas.colorSpace = THREE.NoColorSpace; _atlas.generateMipmaps = true; _atlas.minFilter = THREE.LinearMipmapLinearFilter; _atlas.anisotropy = 2;
  return _atlas;
}

const VERT = /* glsl */`
attribute vec4 aPos;   // x y z born
attribute vec4 aVel;   // vx vy vz life
attribute vec4 aCol0;  // rgb a (born)
attribute vec4 aCol1;  // rgb a (dying)
attribute vec4 aP1;    // size0 size1 drag gravity
attribute vec4 aP2;    // rot0 spin shape stretch
attribute vec4 aP3;    // floor twinkle seed grow (how fast it pops to size: 0 at once)
uniform float uTime;
varying vec4 vColor; varying vec2 vUv;
void main() {
  float age = uTime - aPos.w, life = aVel.w;
  if (age < 0.0 || age >= life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vColor = vec4(0.0); vUv = vec2(0.0); return; }
  float k = aP1.z, g = aP1.w;
  vec3 p, v;
  if (k > 1e-4) {
    float e = exp(-k * age), f = (1.0 - e) / k;
    p.xz = aPos.xz + aVel.xz * f; v.xz = aVel.xz * e;
    p.y = aPos.y + (aVel.y + g / k) * f - g * age / k; v.y = (aVel.y + g / k) * e - g / k;
  } else { p = aPos.xyz + aVel.xyz * age; p.y -= 0.5 * g * age * age; v = aVel.xyz; v.y -= g * age; }
  if (p.y < aP3.x) { p.y = aP3.x; v = vec3(0.0); }
  float t = age / life;
  vec4 c = mix(aCol0, aCol1, t);
  c.a *= min(1.0, t * 14.0 + 0.25);
  vColor = c;
  float s = mix(aP1.x, aP1.y, t);
  if (aP3.w > 0.0) s *= 1.0 - exp(-age * aP3.w);            // (popping out to its size)
  if (aP3.y > 0.0) s *= 0.4 + 0.6 * abs(sin(age * aP3.y + aP3.z)); // (a twinkle: a size that beats, never a blink of the whole screen)
  // the quad, in view space: turned, or stretched along the way it is going on the screen
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec2 q = position.xy * s;
  float stretch = aP2.w;
  if (stretch > 0.0) {
    vec3 vv = mat3(modelViewMatrix) * v;
    float sp = length(vv.xy);
    vec2 dir = sp > 1e-4 ? vv.xy / sp : vec2(1.0, 0.0);
    q.x *= 1.0 + stretch * sp * 0.08; // (longer the faster it goes)
    q = vec2(q.x * dir.x - q.y * dir.y, q.x * dir.y + q.y * dir.x);
  } else {
    float a = aP2.x + aP2.y * age, ca = cos(a), sa = sin(a);
    q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
  }
  mv.xy += q;
  gl_Position = projectionMatrix * mv;
  float cell = aP2.z;
  vUv = (vec2(mod(cell, 4.0), 3.0 - floor(cell / 4.0)) + uv) / 4.0;
}`;
const FRAG = /* glsl */`
uniform sampler2D uAtlas; uniform float uAdd;
varying vec4 vColor; varying vec2 vUv;
void main() {
  float a = texture2D(uAtlas, vUv).a * vColor.a;
  if (a < 0.003) discard;
  gl_FragColor = uAdd > 0.5 ? vec4(vColor.rgb * a, a) : vec4(vColor.rgb, a);
}`;

const NAMES = ['aPos', 'aVel', 'aCol0', 'aCol1', 'aP1', 'aP2', 'aP3'];
const _c0 = new THREE.Color(), _c1 = new THREE.Color();

export class Sprites {
  constructor(scene, { max = 8192, additive = true, renderOrder } = {}) {
    this.max = max; this.head = 0; this.time = 0;
    const base = new THREE.PlaneGeometry(1, 1);
    const g = (this.geo = new THREE.InstancedBufferGeometry());
    g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
    this.attr = {};
    for (const n of NAMES) { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, a); this.attr[n] = a; }
    this.attr.aPos.array.fill(-1e9);
    g.instanceCount = max;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uAtlas: { value: atlas() }, uTime: { value: 0 }, uAdd: { value: additive ? 1 : 0 } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: false,
      blending: additive ? THREE.CustomBlending : THREE.NormalBlending,
      ...(additive ? { blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation } : {}),
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = renderOrder ?? (additive ? 5 : 4);
    this.mesh.userData.moodExempt = true;
    scene.add(this.mesh);
    this.lo = Infinity; this.hi = -1;
  }

  emit(o) {
    const i = this.head; this.head = (this.head + 1) % this.max;
    const j = i * 4, A = this.attr;
    const P = A.aPos.array, V = A.aVel.array, C0 = A.aCol0.array, C1 = A.aCol1.array, X = A.aP1.array, Y = A.aP2.array, Z = A.aP3.array;
    P[j] = o.pos.x; P[j + 1] = o.pos.y; P[j + 2] = o.pos.z; P[j + 3] = this.time + (o.delay || 0);
    V[j] = o.vel?.x || 0; V[j + 1] = o.vel?.y || 0; V[j + 2] = o.vel?.z || 0; V[j + 3] = o.life || 0.6;
    _c0.set(o.color ?? 0xffffff); _c1.set(o.colorEnd ?? o.color ?? 0xffffff);
    C0[j] = _c0.r; C0[j + 1] = _c0.g; C0[j + 2] = _c0.b; C0[j + 3] = o.alpha ?? 1;
    C1[j] = _c1.r; C1[j + 1] = _c1.g; C1[j + 2] = _c1.b; C1[j + 3] = o.alphaEnd ?? 0;
    X[j] = o.size ?? 0.2; X[j + 1] = o.sizeEnd ?? X[j]; X[j + 2] = o.drag ?? 0; X[j + 3] = o.gravity ?? 0;
    Y[j] = o.rot ?? Math.random() * Math.PI * 2; Y[j + 1] = o.spin ?? 0; Y[j + 2] = typeof o.shape === 'string' ? (SHAPES[o.shape] ?? 0) : (o.shape ?? 0); Y[j + 3] = o.stretch ?? 0;
    Z[j] = o.floor ?? -1e9; Z[j + 1] = o.twinkle || 0; Z[j + 2] = Math.random() * 100; Z[j + 3] = o.grow || 0;
    if (i < this.lo) this.lo = i;
    if (i > this.hi) this.hi = i;
  }

  update(dt) {
    this.time += dt;
    this.mat.uniforms.uTime.value = this.time;
    if (this.hi < 0) return;
    for (const a of Object.values(this.attr)) { a.addUpdateRange(this.lo * 4, (this.hi - this.lo + 1) * 4); a.needsUpdate = true; }
    this.lo = Infinity; this.hi = -1;
  }
}
