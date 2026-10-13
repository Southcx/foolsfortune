// ---------------------------------------------------------------------------------------
// A DATA BUG (working name): an aberrant or stray Figment, and a blotling, drawn wrong on purpose, as .hack's data-bugged monsters
// were (the owner, 2026-10-13: "Aberrant Figments CAN be scary": an ominous aura that says "this one is bad news"). Two parts:
//
//   THE ERROR   ONE still silhouette error a creature, chosen by its id and the seed, never a strobe:
//                 'limb'   a block of its body torn out of its socket and set a hand-width off (corrupted.js's TEAR, without motion:
//                          baked once into the creature's own copy of its mesh, so it keeps its own material, its melt and its squash)
//                 'slide'  a band of its skin slid round it: the band's shape turned a third of a radian and its shading left where it
//                          was (a texture slid off its UVs; a mesh with a map has its band's UVs slid a few texels instead)
//                 'cast'   a magenta cast over its own colour, laid each frame over what its body set
//   THE AURA    dark and slow: a low halo of crude-black and a low red round it, breathing over three real seconds, its vertices
//               snapped to a coarse screen grid (the PS1's wobble) and its colour crushed to 15 bits through a 4x4 Bayer dither. The PS1
//               tricks are on the aura alone: the broken data shows its era, the world never does (no whole-screen filter).
//
// A drain mends it (.hack's data drain repairs a data bug): `mend(c)` gives the mesh back and the aura goes. The drain's set-down
// (a drained creature a step paler) rides the same per-frame tint: `drained(c)`.
//
// Nothing in creatures/ marks anything: it finds its creatures itself, a few times a real second, in game.creatures.list by the flags
// the world already sets (`c.aberrant`: world/ground/stains.js's blotling; `c.stray`, for when one is set). No new program but the
// aura's (compiled in the warm-up: DataDrain.prewarm).
//
// Prior art: .hack//Infection's data bugs (limbs off their sockets, textures slid, a garish cast: wrongness as a still, legible
// error), the PS1's vertex snapping and 15-bit dithered framebuffer (the threejs-psx-shader and godot-psx-shader write-ups), and
// AIDA's black bubbles in .hack//G.U. (corruption as a dark material round a body).
//
//   const b = new DataBugs(game)   b.update(rawDt)   b.mend(c)   b.drained(c)   b.prewarm() -> park   b.dress(c, kind?)  (a contact sheet)
//   BUG_KINDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const BUG_KINDS = ['limb', 'slide', 'cast'];
const CAST = new THREE.Color(1.0, 0.58, 0.88), CAST_GLOW = new THREE.Color(0.05, 0.0, 0.035); // (a sick cast, not a sweet's pink)
const DRAINED_STEP = new THREE.Color(0.9, 0.94, 1.05); // (a step paler: the sand's warmth taken down toward grey)
const MAX_STEPS = 2;

const VERT = /* glsl */`
uniform float uT; uniform vec2 uGrid;
varying vec3 vN, vV, vL;
void main() {
  vec3 p = position;
  float n = sin(p.x * 3.1 + uT * 0.5) * sin(p.y * 2.3 - uT * 0.4) * sin(p.z * 2.7 + uT * 0.45);
  p += normal * n * 0.09;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz; vL = position;
  vec4 cp = projectionMatrix * mv;
  cp.xy = floor(cp.xy / cp.w * uGrid + 0.5) / uGrid * cp.w; // (the PS1's wobble: the vertex snapped to a coarse grid of the screen)
  gl_Position = cp;
}`;
const FRAG = /* glsl */`
uniform float uT, uK; uniform vec3 uDark, uRed;
varying vec3 vN, vV, vL;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float bayer4(vec2 p) { // (the 4x4 ordered dither, 0..1)
  vec2 q = mod(floor(p), 4.0);
  float a = mod(q.x, 2.0), b = mod(q.y, 2.0), c = floor(q.x / 2.0), d = floor(q.y / 2.0);
  return (8.0 * mod(a + b, 2.0) + 4.0 * b + 2.0 * mod(c + d, 2.0) + d + 0.5) / 16.0;
}
void main() {
  vec3 N = normalize(vN), V = normalize(vV);
  float rim = 1.0 - abs(dot(N, V)), h = clamp(vL.y * 0.5 + 0.5, 0.0, 1.0);
  float smoke = n3(vL * 2.4 + vec3(0.0, -uT * 0.3, 0.0)) * 0.65 + n3(vL * 5.1 + vec3(uT * 0.1, -uT * 0.5, 0.0)) * 0.35;
  float breathe = 0.82 + 0.18 * sin(uT * 2.094); // (three real seconds a breath: slow, never a flicker)
  float a = (0.3 + 0.7 * smoothstep(0.0, 0.75, rim)) * (0.55 + 0.45 * smoke) * (1.0 - 0.6 * h) * breathe * uK; // (heavy at the foot, a smoke going up)
  a = clamp(a * 1.45, 0.0, 1.0) * (1.0 - smoothstep(0.7, 0.98, rim)); // (its edge gone to smoke, not a glass wall)
  vec3 col = mix(uDark, uRed, clamp(smoke * smoke * 2.2 * (1.2 - h) - 0.1, 0.0, 1.0));
  // 15-bit colour: five bits a channel after the ordered dither; the alpha in four steps the same way (the PS1's screen door)
  float d = bayer4(gl_FragCoord.xy);
  col = floor(col * 31.0 + d) / 31.0;
  a = floor(a * 4.0 + d) / 4.0;
  if (a <= 0.0) discard;
  gl_FragColor = vec4(col, a);
}`;

let MAT = null, GEO = null;
function auraMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({
    name: 'databug-aura', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { uT: { value: 0 }, uK: { value: 1 }, uGrid: { value: new THREE.Vector2(80, 60) }, uDark: { value: new THREE.Color(0x0b0709) }, uRed: { value: new THREE.Color(0x7a0c16) } },
  });
  return MAT;
}
const auraGeo = () => (GEO ||= new THREE.IcosahedronGeometry(1, 2));

/** The creature's chosen error, by its id and the session's seed: the same creature, the same error. */
export function bugKindOf(c, seed = 1) {
  const h = Math.imul((c.id ?? 7) + 0x9e37, 2654435761) ^ Math.imul(seed | 0, 40503);
  return BUG_KINDS[((h >>> 0) % 977) % 3];
}

/** The mesh a body is mostly drawn with (its most vertices). */
function mainMesh(c) {
  let best = null;
  (c.root || c.body)?.traverse?.((o) => { if (o.isMesh && o.geometry?.attributes?.position && (!best || o.geometry.attributes.position.count > best.geometry.attributes.position.count)) best = o; });
  return c.body?.isMesh ? c.body : best;
}

/** The error baked into the creature's own copy of its geometry (the shared one never touched). */
function bakeError(mesh, kind, seed) {
  const src = mesh.geometry, g = src.index ? src.toNonIndexed() : src.clone();
  g.computeBoundingBox();
  const bb = g.boundingBox, H = bb.max.y - bb.min.y, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  const P = g.attributes.position.array, UV = g.attributes.uv?.array, hasMap = !!(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.map;
  const rnd = (k) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  const ang0 = rnd(1) * Math.PI * 2, ox = Math.sin(ang0), oz = Math.cos(ang0);
  const y0 = bb.min.y + H * (kind === 'limb' ? 0.5 + 0.12 * rnd(2) : 0.36 + 0.12 * rnd(2)), y1 = y0 + H * (kind === 'limb' ? 0.3 : 0.2);
  const turn = (rnd(3) < 0.5 ? -1 : 1) * 0.55, cs = Math.cos(turn), sn = Math.sin(turn);
  for (let t = 0; t < P.length; t += 9) {
    const x = (P[t] + P[t + 3] + P[t + 6]) / 3, y = (P[t + 1] + P[t + 4] + P[t + 7]) / 3, z = (P[t + 2] + P[t + 5] + P[t + 8]) / 3;
    if (y < y0 || y > y1) continue;
    if (kind === 'limb') { // (a block on one side, its socket left empty)
      let da = Math.atan2(x - cx, z - cz) - ang0; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > 0.85) continue;
      for (let v = 0; v < 9; v += 3) { P[t + v] += ox * 0.15 - oz * 0.06; P[t + v + 1] += 0.05; P[t + v + 2] += oz * 0.15 + ox * 0.06; }
    } else if (hasMap && UV) { // (its texture slid a few texels)
      const u = (t / 3) * 2; for (let v = 0; v < 6; v += 2) UV[u + v] += 0.04;
    } else { // (its shape turned about its axis, its shading left behind: the skin slid round it)
      for (let v = 0; v < 9; v += 3) { const px = P[t + v] - cx, pz = P[t + v + 2] - cz; P[t + v] = cx + px * cs - pz * sn; P[t + v + 2] = cz + px * sn + pz * cs; }
    }
  }
  g.attributes.position.needsUpdate = true; if (UV) g.attributes.uv.needsUpdate = true;
  g.computeBoundingSphere();
  return g;
}

export class DataBugs {
  constructor(game) {
    this.game = game; this.bugs = new Map(); this.tints = new Map(); this.scanT = 0; this.t = 0;
    this.group = new THREE.Group(); this.group.name = 'databugs'; this.group.userData.zoneFree = true;
    game.scene?.add(this.group);
  }

  /** Mark a creature a data bug (found by the scan; or by hand, `kind` forced, for a contact sheet). */
  dress(c, kind = bugKindOf(c, this.game.seed ?? 1)) {
    if (this.bugs.has(c)) this.undress(c);
    const B = { kind, mesh: null, geo0: null, geo: null, aura: null, k: 0 };
    const mesh = mainMesh(c);
    if (kind === 'cast' && !c.mat?.color) B.kind = kind = 'limb'; // (a cast needs a body colour of its own to lay it over)
    if (kind !== 'cast' && mesh) { B.mesh = mesh; B.geo0 = mesh.geometry; B.geo = bakeError(mesh, kind, (c.id ?? 1) * 3.7 + (this.game.seed ?? 1)); mesh.geometry = B.geo; }
    if (kind === 'cast') this.tint(c).cast = true;
    const a = new THREE.Mesh(auraGeo(), auraMaterial());
    a.name = 'databug-aura'; a.frustumCulled = false; a.renderOrder = 6; a.userData.moodExempt = true;
    a.onBeforeRender = (r, s, cam, geo, mat) => { mat.uniforms.uK.value = B.k; mat.uniformsNeedUpdate = true; };
    this.group.add(a); B.aura = a;
    this.bugs.set(c, B);
    return B;
  }

  undress(c) {
    const B = this.bugs.get(c); if (!B) return;
    if (B.mesh && B.mesh.geometry === B.geo) B.mesh.geometry = B.geo0;
    B.geo?.dispose(); B.aura?.parent?.remove(B.aura);
    const T = this.tints.get(c); if (T) T.cast = false;
    this.bugs.delete(c);
  }

  /** A drain mends it: the body given back its own mesh, the aura gone, and it is never marked again. */
  mend(c) { if (!c) return; c.dataBugMended = true; this.undress(c); }

  /** The drain's set-down: a step paler (two at most). */
  drained(c) { const T = this.tint(c); T.steps = Math.min(MAX_STEPS, T.steps + 1); }

  tint(c) { let T = this.tints.get(c); if (!T) this.tints.set(c, (T = { cast: false, steps: 0, wrote: new THREE.Color(-1, -1, -1), glow: new THREE.Color(-1, -1, -1) })); return T; }

  update(raw) {
    const g = this.game, list = g.creatures?.list || [];
    this.t = (this.t + raw) % 600; if (MAT) MAT.uniforms.uT.value = this.t;
    if ((this.scanT -= raw) <= 0) { // (a few times a real second: who is a data bug now, and who is gone)
      this.scanT = 0.25;
      for (const c of list) if ((c.aberrant || c.stray) && !c.dataBugMended && !c.spirit && !this.bugs.has(c)) this.dress(c);
      for (const c of [...this.bugs.keys()]) if (!list.includes(c)) this.undress(c);
      for (const c of [...this.tints.keys()]) if (!list.includes(c)) this.tints.delete(c);
    }
    const drain = g.dataDrain?.run?.target;
    for (const [c, B] of this.bugs) {
      const shown = c.alive !== false && c.root?.visible !== false;
      B.k = THREE.MathUtils.damp(B.k, shown && drain !== c ? 1 : 0, shown ? 1.2 : 6, raw); // (it gathers slowly, and goes at once)
      const a = B.aura; a.visible = B.k > 0.01;
      if (!a.visible) continue;
      const r = (c.radius || 0.5) * 1.9, h = (c.height || 1) * 0.72;
      a.position.set(c.pos.x, c.pos.y + (c.height || 1) * 0.45, c.pos.z); a.scale.set(r, h, r);
    }
    // the tints over what the body set this frame (each only once: a body that set nothing this frame is left as it was)
    for (const [c, T] of this.tints) {
      const m = c.mat; if (!m?.color) continue;
      if (!m.color.equals(T.wrote)) {
        if (T.cast) m.color.multiply(CAST);
        for (let i = 0; i < T.steps; i++) m.color.multiply(DRAINED_STEP);
        T.wrote.copy(m.color);
      }
      if (T.cast && m.emissive && !m.emissive.equals(T.glow)) { m.emissive.add(CAST_GLOW); T.glow.copy(m.emissive); }
    }
  }

  /** For the boot's warm-up: one aura shown 50 m under the world, so its program compiles with the rest. */
  prewarm() {
    const a = new THREE.Mesh(auraGeo(), auraMaterial()); a.position.set(0, -50, 0); a.frustumCulled = false; this.group.add(a);
    return () => this.group.remove(a);
  }
}
