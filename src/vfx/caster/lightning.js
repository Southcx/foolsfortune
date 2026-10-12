// ---------------------------------------------------------------------------------------
// LIGHTNING (S3 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a procedural bolt, branching, alive. The whole Storm family
// (31 to 40): the Tesla Node's white-blue arcs from its clay insulator, the Chain Bolt's jumps, Ball Lightning's tendrils feeling for
// targets, the Thunderhead's strike, the Faraday Cage's box of standing arcs, the Capacitor's pillar, Twelve's blast; and the Barrier's
// arcs over its glass (77).
//
// A bolt is grown by MIDPOINT DISPLACEMENT (each segment split, its middle pushed aside at random, half as far each level down: the
// fractal jag a real leader has), with BRANCHES forking off the trunk toward the end, thinner and tapering to nothing. Every path (one
// from -> to) is drawn as ribbons facing the camera, all in ONE mesh of this copy's own: a cage's twelve edges are one draw. The ribbon's
// width is the larger of its width in metres and a pixel floor, so a far bolt is a line a pixel and a half wide and never breaks into
// dashes (CLAUDE.md, no aliasing crawl). Across it, a white-hot CORE in a GLOW of the bolt's colour (white-blue, Ball Lightning's
// violet, Twelve's gold), over the light-brighter-than-white of the frame so the PS2 glow blooms it (render/glow.js).
//
// It is alive without strobing: the shape is grown again `rate` times a real second (an arc's crawl), each branch's brightness wanders
// on a smooth noise between three quarters and full, and nothing flashes the screen (a strike that should, asks the effect library's
// flash, which is capped: vfx/vfx.js). A path that moves (a creature running) carries its bolt with it between regrowths.
//
// Prior art: Ratchet & Clank's Tesla Claw and Up Your Arsenal's Shock Blaster (white-blue arcs that crawl as they lick), the midpoint-
// displacement lightning of the demoscene and Unity's LightningBolt (Jeff Johnson's), Real Lightning: lightning's stepped leader
// branches downward and the return stroke re-lights the same channel (so a strike holds its trunk for its few flickers).
//
//   const Z = create({ from, to | paths: [[from, to], ...], levels, jag, branches, width, minPx, glow, tint, core, rate, k })   scene.add(Z.object)
//   Z.set({ from, to | paths, tint, core, width, k, ... })   Z.strike() (grow it again now)   Z.update(dt)   Z.dispose()
//   vfxLayer(game, handle, layer, color)   the effect library's `caster` layer: { shader: 'lightning', length, branches, rate }, from
//                                          the context's `from` to `to` (or from its place along its direction)
//   prewarm(scene) -> park()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ownUniforms, viewSize, NOISE_GLSL, GROUND_Y } from './casterkit.js';

const VERT = /* glsl */`
attribute vec3 aPrev, aNext; attribute float aSide, aTaper, aW, aSeed;
uniform vec2 uRes; uniform float uWidth, uMinPx, uGlow;
varying float vS, vW, vSeed;
void main() {
  mat4 vp = projectionMatrix * viewMatrix;
  vec4 c = vp * modelMatrix * vec4(position, 1.0), cp = vp * modelMatrix * vec4(aPrev, 1.0), cn = vp * modelMatrix * vec4(aNext, 1.0);
  vec2 d = (cn.xy / max(cn.w, 1e-3) - cp.xy / max(cp.w, 1e-3)) * uRes;
  d = length(d) < 1e-4 ? vec2(1.0, 0.0) : normalize(d);
  float worldPx = uWidth * aW * projectionMatrix[1][1] * uRes.y * 0.5 / max(c.w, 1e-3); // (its width in metres, as pixels at this depth)
  float px = max(worldPx, uMinPx) * aTaper * uGlow; // (the half width with the glow round the core)
  c.xy += vec2(-d.y, d.x) * px / uRes * 2.0 * c.w * aSide;
  vS = aSide; vW = aW; vSeed = aSeed;
  gl_Position = c;
}`;
const FRAG = /* glsl */`
uniform float uK, uTime, uGlow;
uniform vec3 uTint, uCore;
varying float vS, vW, vSeed;
${NOISE_GLSL}
void main() {
  float s = abs(vS), cf = 1.0 / uGlow; // (the core's share of the ribbon)
  float core = 1.0 - smoothstep(cf * 0.45, cf, s), glow = pow(1.0 - s, 2.4);
  float wander = 0.78 + 0.22 * vnoise(vec3(uTime * 7.0, vSeed * 31.7, 0.0)); // (each branch's brightness wanders smoothly: alive, never a strobe)
  vec3 c = (uCore * core * 2.6 + uTint * glow * 1.3) * wander * uK * (0.55 + 0.45 * vW);
  gl_FragColor = vec4(c, 1.0);
}`;

let MAT = null;
function material() {
  return (MAT ||= new THREE.ShaderMaterial({
    name: 'caster-lightning', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
    uniforms: { uRes: { value: new THREE.Vector2(854, 480) }, uWidth: { value: 0.05 }, uMinPx: { value: 0.9 }, uGlow: { value: 4 }, uK: { value: 1 }, uTime: { value: 0 }, uTint: { value: new THREE.Color() }, uCore: { value: new THREE.Color() } },
  }));
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3();
/** A jagged line from a to b: `levels` of midpoint displacement, each pushed up to `jag` of its length aside. Returned as [t, offset]
 *  pairs (t along a -> b, offset in metres), so the bolt follows its ends when they move. */
function grow(a, b, levels, jag, rnd) {
  const len = _d.subVectors(b, a).length() || 1e-3, dir = _d.clone().divideScalar(len);
  let pts = [[0, new THREE.Vector3()], [1, new THREE.Vector3()]], amp = jag * len;
  for (let l = 0; l < levels; l++) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [t0, o0] = pts[i - 1], [t1, o1] = pts[i];
      _p.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5); _p.addScaledVector(dir, -_p.dot(dir)); // (aside: across the line, never along it)
      if (_p.lengthSq() < 1e-8) _p.set(1, 0, 0);
      next.push([(t0 + t1) / 2, o0.clone().add(o1).multiplyScalar(0.5).addScaledVector(_p.normalize(), (rnd() - 0.5) * 2 * amp)], pts[i]);
    }
    pts = next; amp *= 0.55;
  }
  return pts;
}
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Lightning {
  constructor({ from, to, paths, levels = 5, jag = 0.2, branches = 3, width = 0.05, minPx = 0.9, glow = 4, tint = 0x9cc8ff, core = 0xffffff, rate = 14, k = 1, seed = (Math.random() * 1e9) | 0 } = {}) {
    this.paths = (paths || [[from || new THREE.Vector3(), to || new THREE.Vector3(0, 3, 0)]]).map(([a, b]) => [a.clone(), b.clone()]);
    this.levels = levels; this.jag = jag; this.branches = branches; this.rate = rate; this.rnd = mulberry(seed); this.acc = 0;
    this.u = { uRes: { value: new THREE.Vector2(854, 480) }, uWidth: { value: width }, uMinPx: { value: minPx }, uGlow: { value: glow }, uK: { value: k }, uTime: { value: 0 }, uTint: { value: new THREE.Color(tint) }, uCore: { value: new THREE.Color(core) } };
    this.geo = new THREE.BufferGeometry();
    const mat = material();
    this.object = new THREE.Mesh(this.geo, mat);
    this.object.name = 'caster-lightning'; this.object.frustumCulled = false; this.object.renderOrder = 9; this.object.userData.moodExempt = true;
    ownUniforms(this.object, mat, this.u);
    this.object.userData.beforeDraw = (renderer) => viewSize(renderer, this.u.uRes.value);
    this.strike();
  }
  get k() { return this.u.uK.value; }
  /** Room for every point: each path's trunk and its branches, two vertices a point. */
  alloc() {
    const trunk = (1 << this.levels) + 1, twig = (1 << Math.max(1, this.levels - 2)) + 1, per = trunk + this.branches * twig, n = per * this.paths.length * 2;
    if (this.cap >= n) return;
    this.cap = n;
    const A = (k) => new THREE.BufferAttribute(new Float32Array(n * k), k).setUsage(THREE.DynamicDrawUsage);
    for (const [name, k] of [['position', 3], ['aPrev', 3], ['aNext', 3], ['aSide', 1], ['aTaper', 1], ['aW', 1], ['aSeed', 1]]) this.geo.setAttribute(name, A(k));
    this.geo.setIndex(new THREE.BufferAttribute(new Uint32Array(n * 3), 1).setUsage(THREE.DynamicDrawUsage));
  }
  /** Grow every path again now (a new shape; the same ends). */
  strike() {
    this.alloc();
    const r = this.rnd;
    this.lines = this.paths.map(([a, b]) => {
      const trunk = grow(a, b, this.levels, this.jag, r), twigs = [];
      for (let i = 0; i < this.branches; i++) {
        const j = Math.floor(trunk.length * (0.25 + 0.65 * r())), len = a.distanceTo(b) * (0.12 + 0.28 * r()) * (1 - j / trunk.length * 0.4);
        const dir = _d.subVectors(b, a).normalize().add(_p.randomDirection().multiplyScalar(0.9)).normalize().multiplyScalar(len);
        twigs.push({ root: j, dir: dir.clone(), pts: grow(new THREE.Vector3(), dir, Math.max(1, this.levels - 2), this.jag * 1.3, r), seed: r() });
      }
      return { trunk, twigs, seed: r() };
    });
    this.write();
    return this;
  }
  /** The points in the world now (the ends may have moved since it grew), into the ribbons. */
  write() {
    const G = this.geo, P = G.attributes.position.array, Pr = G.attributes.aPrev.array, Nx = G.attributes.aNext.array, S = G.attributes.aSide.array, Tp = G.attributes.aTaper.array, W = G.attributes.aW.array, Sd = G.attributes.aSeed.array, I = G.index.array;
    let v = 0, ix = 0;
    const strip = (pts, w, seed, taper) => {
      const n = pts.length, base = v;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[Math.max(0, i - 1)], s = pts[Math.min(n - 1, i + 1)], tp = taper ? Math.max(0.15, 1 - i / (n - 1)) : 1 - 0.25 * (i / (n - 1));
        for (const side of [-1, 1]) {
          P.set([p.x, p.y, p.z], v * 3); Pr.set([q.x, q.y, q.z], v * 3); Nx.set([s.x, s.y, s.z], v * 3);
          S[v] = side; Tp[v] = tp; W[v] = w; Sd[v] = seed; v++;
        }
        if (i < n - 1) { const b = base + i * 2; I.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], ix); ix += 6; }
      }
    };
    this.paths.forEach(([a, b], k) => {
      const L = this.lines[k], at = ([t, o]) => new THREE.Vector3().lerpVectors(a, b, t).add(o);
      const trunk = L.trunk.map(at);
      strip(trunk, 1, L.seed, false);
      for (const tw of L.twigs) { const root = trunk[tw.root], end = _b.copy(root).add(tw.dir); strip(tw.pts.map(([t, o]) => new THREE.Vector3().lerpVectors(root, end, t).add(o)), 0.45, tw.seed, true); }
    });
    for (const name of ['position', 'aPrev', 'aNext', 'aSide', 'aTaper', 'aW', 'aSeed']) G.attributes[name].needsUpdate = true;
    G.index.needsUpdate = true; G.setDrawRange(0, ix);
  }
  set(p = {}) {
    const u = this.u;
    for (const [key, name] of [['k', 'uK'], ['width', 'uWidth'], ['minPx', 'uMinPx'], ['glow', 'uGlow']]) if (p[key] !== undefined) u[name].value = p[key];
    if (p.tint !== undefined) u.uTint.value.set(p.tint);
    if (p.core !== undefined) u.uCore.value.set(p.core);
    for (const key of ['levels', 'jag', 'branches', 'rate']) if (p[key] !== undefined) this[key] = p[key];
    let regrow = p.levels !== undefined || p.branches !== undefined || p.jag !== undefined;
    if (p.paths) { regrow ||= p.paths.length !== this.paths.length; this.paths = p.paths.map(([a, b]) => [a.clone(), b.clone()]); }
    else if (p.from && p.to) { this.paths[0][0].copy(p.from); this.paths[0][1].copy(p.to); }
    if (regrow) this.strike(); else if (p.paths || p.from) this.write();
    return this;
  }
  update(dt) {
    this.u.uTime.value = (this.u.uTime.value + dt) % 600;
    if (this.rate > 0) { this.acc += dt * this.rate; if (this.acc >= 1) { this.acc %= 1; this.strike(); } }
    this.object.visible = this.u.uK.value > 0.002;
  }
  dispose() { this.object.parent?.remove(this.object); this.object.onBeforeRender = () => {}; this.geo.dispose(); }
}
export const create = (opts) => new Lightning(opts);

/** The effect library's layer (vfx/vfx.js `caster`): a bolt from the context's `from` to `to`, or from its place along its direction. */
export function vfxLayer(game, h, L, color) {
  const ends = (h) => (h.ctx.from && h.ctx.to ? [h.ctx.from, h.ctx.to] : [h.pos, _a.copy(h.pos).addScaledVector(h.dir, (L.length ?? 4) * (h.ctx.scale ?? 1))]);
  const [a, b] = ends(h);
  const Z = new Lightning({ from: a, to: b, levels: L.levels, jag: L.jag, branches: L.branches, width: L.width, glow: L.glow, rate: L.rate, tint: color(L.tint ?? 0x9cc8ff, h.ctx), core: color(L.core ?? 'white', h.ctx), k: 0 });
  game.scene.add(Z.object);
  return {
    group: Z.object, effect: Z,
    frame(h, t, k, raw) { const [a, b] = ends(h); Z.set({ from: a, to: b, k }); Z.update(raw); },
    dispose: () => Z.dispose(),
  };
}

export function prewarm(scene) {
  const Z = new Lightning({ from: new THREE.Vector3(0, GROUND_Y, 0), to: new THREE.Vector3(0, GROUND_Y + 1, 0), levels: 2, branches: 0 }); scene.add(Z.object);
  return () => Z.dispose();
}
