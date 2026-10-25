// ---------------------------------------------------------------------------------------
// THE FLOURISHES' PRINTS: the footprint a step leaves when the Courier wears a footprint flourish (vfx/flourishes.js): a blossom, a
// kiln-ash scorch, a glowing cell of the Comb that fades, a paw, a puddle of the body glaze. One pool of laid quads in one draw, each
// print written once when it is laid (where, which way, its size and colour, its life) and its whole life worked out in the shader
// (popping down, holding, fading; a puddle drying smaller, a Comb cell's glow dying first), so a print costs its writing and nothing
// after. Each lies on the surface it was laid on (its normal, from the blob shadow's ray: vfx/blobshadow.js `below`), turned to the
// way the Courier was going, the left foot's mirrored. The stock print is the ground's own (the trail map in sand, the paint map in
// paint: world/ground/); this pool lays its prints over it, never instead of it.
//
// THE ONE PROGRAM the flourishes add (built at boot, before the warm-up: its mesh is shown for the compile and hidden once idle).
// Premultiplied blending, so one program draws a print that lies (alpha), one that glows (added light) and anything between
// (`glow`, a print's share of light).
//
// Prior art: the decal footprints of every console game with snow or mud (the UE4 write-ups, Red Dead Redemption 2's prints laid on
// the ground's normal), Okami's flowers blooming in Amaterasu's steps (the blossom), the stateless GPU particle (Latta 2004) that
// vfx/sprites.js already is, and the instanced ring buffer of decals (Doom 2016's: a fixed pool, the oldest overwritten).
//
//   const P = new FlourishPrints(game, { max })   P.lay({ pos, n, yaw, kind, size, color, alpha, glow, life, mirror })   P.update(raw)
//   P.clear()   PRINT_CELLS (kind -> atlas cell)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';
import { tierScale } from './tierscale.js';

/** The prints' atlas, 4 x 2 cells of 128 px, drawn in colour (a print's tint multiplies it). */
export const PRINT_CELLS = { blossom: 0, scorch: 1, comb: 2, comb2: 3, paw: 4, puddle: 5 };
const CELL = 128;

function printAtlas() {
  // (a baked canvas at the tier's size, half on a phone: render/bakedcanvas.js, vfx/tierscale.js)
  const t = bakedCanvasTexture((g) => {
    let seed = 31; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cell = (i, draw) => { g.save(); g.translate((i % 4) * CELL + CELL / 2, Math.floor(i / 4) * CELL + CELL / 2); draw(CELL / 2); g.restore(); };
    const hex = (x, y, rr, rot = 0) => { g.beginPath(); for (let k = 0; k < 6; k++) { const a = rot + (k / 6) * Math.PI * 2; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
    // a blossom: five petals, notched at the tip as a cherry's are, round a gold heart
    cell(PRINT_CELLS.blossom, (R) => {
      for (let k = 0; k < 5; k++) {
        g.save(); g.rotate((k / 5) * Math.PI * 2);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(R * 0.5, -R * 0.25, R * 0.42, -R * 0.82, R * 0.1, -R * 0.84); g.lineTo(0, -R * 0.72); g.lineTo(-R * 0.1, -R * 0.84); g.bezierCurveTo(-R * 0.42, -R * 0.82, -R * 0.5, -R * 0.25, 0, 0); g.fill();
        g.strokeStyle = 'rgba(230,150,175,0.8)'; g.lineWidth = R * 0.03; g.beginPath(); g.moveTo(0, -R * 0.12); g.lineTo(0, -R * 0.55); g.stroke();
        g.restore();
      }
      g.fillStyle = '#ffd76a'; g.beginPath(); g.arc(0, 0, R * 0.16, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c8783a'; for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * R * 0.24, Math.sin(a) * R * 0.24, R * 0.035, 0, Math.PI * 2); g.fill(); }
    });
    // a kiln-ash scorch: a charred sole, its splash of soot, and embers still in it
    cell(PRINT_CELLS.scorch, (R) => {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.8);
      gr.addColorStop(0, 'rgba(26,18,14,0.95)'); gr.addColorStop(0.55, 'rgba(40,30,24,0.8)'); gr.addColorStop(1, 'rgba(90,80,72,0)');
      g.save(); g.scale(0.62, 1); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 0.8, 0, Math.PI * 2); g.fill(); g.restore();
      g.fillStyle = 'rgba(40,30,24,0.6)';
      for (let k = 0; k < 14; k++) { const a = r() * Math.PI * 2, d = R * (0.45 + r() * 0.4), w = R * (0.02 + r() * 0.03); g.beginPath(); g.ellipse(Math.cos(a) * d * 0.62, Math.sin(a) * d, w * 2.2, w, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(200,190,180,0.55)'; for (let k = 0; k < 20; k++) { const a = r() * Math.PI * 2, d = R * (0.3 + r() * 0.5); g.beginPath(); g.arc(Math.cos(a) * d * 0.62, Math.sin(a) * d, R * 0.025, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(255,140,60,0.95)'; for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2, d = R * r() * 0.35; g.beginPath(); g.arc(Math.cos(a) * d * 0.62, Math.sin(a) * d, R * (0.025 + r() * 0.03), 0, Math.PI * 2); g.fill(); }
    });
    // two cells of the Comb (the neuralese stamp script on hex cells): a ring of seven, some filled, read as a mark of the System's
    for (const [i, on] of [[PRINT_CELLS.comb, [1, 1, 0, 1, 0, 1, 0]], [PRINT_CELLS.comb2, [0, 1, 1, 0, 1, 0, 1]]]) cell(i, (R) => {
      g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = R * 0.06; hex(0, 0, R * 0.9, Math.PI / 6); g.stroke();
      const rr = R * 0.25;
      [[0, 0], [0, -2], [1.73, -1], [1.73, 1], [0, 2], [-1.73, 1], [-1.73, -1]].forEach(([x, y], k) => {
        hex(x * rr * 0.96, y * rr * 0.96, rr * 0.82, 0);
        if (on[k]) g.fill(); else { g.lineWidth = R * 0.035; g.stroke(); }
      });
    });
    // a paw: the heel pad and four toes, pressed in
    cell(PRINT_CELLS.paw, (R) => {
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath(); g.moveTo(0, R * 0.05); g.bezierCurveTo(R * 0.42, R * 0.02, R * 0.48, R * 0.62, 0, R * 0.62); g.bezierCurveTo(-R * 0.48, R * 0.62, -R * 0.42, R * 0.02, 0, R * 0.05); g.fill();
      for (const [x, y, s] of [[-0.42, -0.16, 0.15], [-0.15, -0.5, 0.16], [0.15, -0.5, 0.16], [0.42, -0.16, 0.15]]) { g.beginPath(); g.ellipse(R * x, R * y, R * s * 0.85, R * s * 1.15, x * 0.6, 0, Math.PI * 2); g.fill(); }
    });
    // a puddle of glaze: an uneven pool, its wet lip lighter, a highlight on it
    cell(PRINT_CELLS.puddle, (R) => {
      g.fillStyle = 'rgba(200,200,200,1)'; g.beginPath();
      for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, rr = R * (0.62 + 0.18 * Math.sin(a * 3 + 0.7) + 0.08 * Math.sin(a * 5)); g.lineTo(Math.cos(a) * rr * 0.8, Math.sin(a) * rr); }
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = R * 0.05; g.stroke();
      g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.ellipse(-R * 0.18, -R * 0.25, R * 0.14, R * 0.06, -0.6, 0, Math.PI * 2); g.fill();
    });
  }, CELL * 4, CELL * 2, { scale: tierScale() });
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  return t;
}

const VERT = /* glsl */`
attribute vec4 aA;   // x y z born
attribute vec4 aB;   // yaw size (negative: mirrored) life cell
attribute vec4 aC;   // rgb alpha
attribute vec4 aD;   // normal xyz, glow
uniform float uTime;
varying vec2 vUv; varying vec4 vCol; varying float vGlow, vK;
void main() {
  float age = uTime - aA.w, life = aB.z;
  if (age < 0.0 || age >= life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vCol = vec4(0.0); vUv = vec2(0.0); vGlow = 0.0; vK = 0.0; return; }
  float t = age / life;
  vec3 n = normalize(aD.xyz), f = vec3(sin(aB.x), 0.0, cos(aB.x));
  f = normalize(f - n * dot(f, n) + vec3(1e-4, 0.0, 0.0)); vec3 s = cross(f, n);
  float pop = 0.7 + 0.3 * min(1.0, age / 0.12);                   // (pressed down to its size)
  float dry = aB.w == 5.0 ? 1.0 - 0.35 * t : 1.0;                    // (a puddle dries smaller)
  vec2 q = position.xy * vec2(aB.y, abs(aB.y)) * pop * dry;       // (a mirrored print flips across, never end to end)
  vec3 p = aA.xyz + n * 0.018 + s * q.x + f * q.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  float cell = aB.w;
  vUv = (vec2(mod(cell, 4.0), 1.0 - floor(cell / 4.0)) + vec2(uv.x, uv.y)) / vec2(4.0, 2.0);
  vK = min(1.0, age / 0.05) * (1.0 - smoothstep(0.55, 1.0, t));
  vGlow = aD.w * (1.0 - smoothstep(0.0, 0.8, t)) * (1.0 + 0.8 * exp(-age * 4.0)); // (a glow dies before the mark does, brightest as it is laid)
  vCol = aC;
}`;
const FRAG = /* glsl */`
uniform sampler2D uMap;
varying vec2 vUv; varying vec4 vCol; varying float vGlow, vK;
void main() {
  vec4 tx = texture2D(uMap, vUv);
  float a = tx.a * vCol.a * vK;
  if (a < 0.004) discard;
  vec3 c = tx.rgb * vCol.rgb;
  float lit = clamp(vGlow, 0.0, 1.0);
  gl_FragColor = vec4(c * a * (1.0 + vGlow), a * (1.0 - lit)); // (premultiplied: a glowing share adds its light, the rest lies over the ground)
}`;
const NAMES = ['aA', 'aB', 'aC', 'aD'];
const _c = new THREE.Color();

export class FlourishPrints {
  constructor(game, { max = 160 } = {}) {
    this.game = game; this.max = max; this.head = 0; this.time = 0; this.until = 0; this.used = 1;
    const base = new THREE.PlaneGeometry(1, 1), geo = (this.geo = new THREE.InstancedBufferGeometry());
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    this.attr = {};
    for (const n of NAMES) { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, a); this.attr[n] = a; }
    this.attr.aA.array.fill(-1e9);
    geo.instanceCount = 1; // (one dead print for the warm-up's compile: it is folded away in the vertex shader)
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.mat = new THREE.ShaderMaterial({
      name: 'flourish-prints', uniforms: { uMap: { value: printAtlas() }, uTime: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.name = 'flourish-prints'; this.mesh.frustumCulled = false; this.mesh.renderOrder = 2;
    this.mesh.userData.moodExempt = true; this.mesh.userData.zoneFree = true; // (the prints lie where they were laid, wherever the camera is)
    game.scene?.add(this.mesh); // (shown for the warm-up's compile; hidden by its first update while nothing lies)
    this.lo = Infinity; this.hi = -1;
  }

  /** Lay one print. `n` the surface's normal (up by default), `yaw` the way it faces, `mirror` the left foot's. */
  lay({ pos, n = null, yaw = 0, kind = 'blossom', size = 0.3, color = 0xffffff, alpha = 1, glow = 0, life = 6, mirror = false }) {
    const i = this.head; this.head = (this.head + 1) % this.max;
    const j = i * 4, A = this.attr.aA.array, B = this.attr.aB.array, C = this.attr.aC.array, D = this.attr.aD.array;
    A[j] = pos.x; A[j + 1] = pos.y; A[j + 2] = pos.z; A[j + 3] = this.time;
    B[j] = yaw; B[j + 1] = mirror ? -size : size; B[j + 2] = life; B[j + 3] = PRINT_CELLS[kind] ?? 0;
    _c.set(color); C[j] = _c.r; C[j + 1] = _c.g; C[j + 2] = _c.b; C[j + 3] = alpha;
    D[j] = n?.x ?? 0; D[j + 1] = n?.y ?? 1; D[j + 2] = n?.z ?? 0; D[j + 3] = glow;
    if (i < this.lo) this.lo = i;
    if (i > this.hi) this.hi = i;
    if (i + 1 > this.used) this.used = i + 1;
    this.until = Math.max(this.until, this.time + life);
  }

  /** Every print gone at once (a change of place: what lay there is left behind). */
  clear() {
    if (this.until <= this.time) return;
    this.attr.aA.array.fill(-1e9); this.until = 0;
    this.lo = 0; this.hi = this.max - 1;
  }

  update(raw) {
    this.time += raw;
    this.mat.uniforms.uTime.value = this.time;
    this.mesh.visible = this.time < this.until;
    this.geo.instanceCount = this.used;
    if (this.hi < 0) return;
    for (const a of Object.values(this.attr)) { a.addUpdateRange(this.lo * 4, (this.hi - this.lo + 1) * 4); a.needsUpdate = true; }
    this.lo = Infinity; this.hi = -1;
  }
}
