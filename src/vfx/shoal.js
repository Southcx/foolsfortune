// ---------------------------------------------------------------------------------------
// THE SHOAL'S LOOK (the crossing's set piece; the owner, 2026-10-07 and 2026-10-08: "massive boid swarms of hundreds of entities";
// docs/plans/RAIL-OVERHAUL.md sections 5 and 6; docs/GLOSSARY.md: the shoal, its glints, the Conductor, the bait ball, the frenzy).
// Petra's boids move the glints (300 to 800 of them); this draws them, in one instanced draw.
//
//   THE GLINTS     a level of detail in the vertex shader, so the school is one draw however far it reaches:
//                    near: a slim fish of ink with a pale belly and mirror flanks, a forked tail and a dorsal fin, swimming by a wave
//                      that runs down its body (each fish on its own beat; quicker in a dash)
//                    far:  a two-triangle spark, a diamond along its heading, never under 2 px at the 480 lines (render/present.js)
//                    between, the fish shrinks into its spark over a band of distance that each glint crosses at its own place, so
//                    the change runs through a school as a ripple and never pops (CLAUDE.md: no aliasing crawl)
//   THE SHEEN      the flanks are mirrors: what they show is the storm's light (gold-white high, pale violet low) or the black crude, by
//                  where the reflection points. So a fish swimming level, seen from above, is dark; rolled onto its side it flashes.
//                  The light comes from things actually moving (CLAUDE.md), and the silver turn below is only that physics
//   THE SILVER TURN a strike group rolls onto its side a quarter-bar before it strikes (`roll` 1): the flank turns to the sky
//   THE FRENZY     a dash (`dash` 1) stretches the fish and draws its spark behind it as a streak of light: a strike reads as a line
//   THE BALL       `ball(centre, radius)`: the bait ball read as one turning mass: deeper inside it a glint is darker (each fish shades
//                  the next, as in a real ball), and a slow wave of rolling sweeps round it, so a band of silver turns with the school
//   THE MIND'S EDGE a thin labradorite rim at each fish's silhouette, and the schiller in its dark back (vfx/labradorite.js): what fights is
//                  drawn in line and glow. `glow(k)` lights the whole school from within in the Mind's colours (the silhouette's light)
//   THE CONDUCTOR  the shoal's caller: twice the size, its own steady glow of Lachryma along its flank and in its eye, breathing slowly
//   THE BOIL       over the bait ball the crude boils: small rings where glints break it, froth as lace, and silver turning under it
//
// Prior art: the sardine run (the bait ball, the flash of a school turning, the dark heart of a ball), Abzû's thousands of fish moved
// by formula and drawn instanced (its GDC talk: "The Art of Abzû", 2017), Ecco the Dolphin's schools, the level-of-detail impostor of
// every crowd renderer (a far body drawn as a card), the "shimmering" waves that run through fish schools and giant honeybee swarms
// (Kastberger et al., PLoS ONE 2008), and Sunshine's Blooper goo boiling on the surface.
//
//   const S = new ShoalLook({ max })   S.group   S.count = n   S.set(i, pos, quat, roll 0..1, dash 0..1)   S.conductor(pos, quat, alive)
//   S.ball(centre, radius, k = 1)   S.glow(k 0..1)   S.light({ dir, hi, lo })   S.lod(near, far)   S.boil(pos, radius, k 0..1, sea)   S.update(rawDt)
//   S._s  the scale each glint is set with (1 = life size, a 0.67 m fish; the rail draws them at 2)
// `set` packs: index i is the i-th glint drawn this frame (0 .. count-1), not a member's id; `dash` is optional (0).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';

/** The rings of the body: [z, half width, half height] (a slim fish along +Z, its nose at 0.3, its tail stock at -0.21). */
const BODY = [[0.24, 0.032, 0.048], [0.14, 0.052, 0.082], [0.02, 0.048, 0.078], [-0.1, 0.034, 0.054], [-0.18, 0.016, 0.03]];
const SIDES = 6, NOSE = 0.3, STOCK = -0.21;

/** A glint's mesh: the body (indexed), the fins (both faces), and, if `spark`, the four corners of the far spark. */
function fishGeometry({ spark = true } = {}) {
  const P = [], N = [], B = [], S = [], idx = [];
  const push = (p, n, sp = 0) => { P.push(...p); N.push(...n); B.push(THREE.MathUtils.clamp(-p[2] / 0.37, 0, 1)); S.push(sp); return P.length / 3 - 1; };
  // the body: an ellipse at each ring (a vertex at the back and the belly), closed by the nose and the tail stock
  const nose = push([0, 0, NOSE], [0, 0, 1]);
  const ring = BODY.map(([z, w, h]) => Array.from({ length: SIDES }, (_, k) => {
    const a = Math.PI / 6 + (k * 2 * Math.PI) / SIDES, c = Math.cos(a), s = Math.sin(a);
    return push([c * w, s * h, z], new THREE.Vector3(c / w, s / h, 0).normalize().toArray());
  }));
  const tail = push([0, 0, STOCK], [0, 0, -1]);
  for (let k = 0; k < SIDES; k++) {
    const k1 = (k + 1) % SIDES;
    idx.push(nose, ring[0][k], ring[0][k1]);
    for (let r = 0; r < ring.length - 1; r++) idx.push(ring[r][k], ring[r + 1][k], ring[r + 1][k1], ring[r][k], ring[r + 1][k1], ring[r][k1]);
    idx.push(ring[ring.length - 1][k], tail, ring[ring.length - 1][k1]);
  }
  // the fins: the forked tail and the dorsal, each drawn from both sides (a flat fin culled on one face was a fish with half a tail)
  const fin = (tri) => { for (const s of [1, -1]) { const v = tri.map((p) => push(p, [s, 0, 0])); if (s > 0) idx.push(v[0], v[1], v[2]); else idx.push(v[0], v[2], v[1]); } };
  fin([[0, 0, -0.19], [0, 0.13, -0.37], [0, 0.015, -0.29]]); fin([[0, 0, -0.19], [0, -0.015, -0.29], [0, -0.13, -0.37]]);
  fin([[0, 0.075, 0.08], [0, 0.135, -0.01], [0, 0.06, -0.07]]);
  if (spark) { // (the far spark: four corners, x across and y along the heading, placed in the screen by the vertex shader)
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => push([x, y, 0], [0, 0, 1], 1));
    idx.push(c[0], c[1], c[2], c[0], c[2], c[3]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aBack', new THREE.Float32BufferAttribute(B, 1)); g.setAttribute('aSpark', new THREE.Float32BufferAttribute(S, 1));
  g.setIndex(idx);
  return g;
}

const FISH_V = /* glsl */`attribute float aBack, aSpark, aRoll, aPh, aDash;
uniform float uT; uniform vec2 uRes, uLod; uniform vec4 uBall; uniform float uBallK;
varying vec3 vN; varying vec3 vW; varying float vBelly; varying float vBack; varying float vSpark; varying vec2 vQ; varying float vSheen; varying float vShade; varying float vDash; varying float vPh;
uniform vec3 uSun;
float gHash(float x) { return fract(sin(x * 91.7 + 3.1) * 43758.5); }
void main() {
  mat4 M = modelMatrix * instanceMatrix;
  vec3 C = (M * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float scl = length(M[0].xyz);
  float d = distance(cameraPosition, C);
  // the band where the fish becomes its spark, each glint at its own place in it (so the change ripples through a school)
  float j = gHash(aPh * 17.0), lo = uLod.x * scl * (0.8 + 0.4 * j), hi = uLod.y * scl * (0.8 + 0.4 * j);
  float sparkK = smoothstep(lo, hi, d), fishK = 1.0 - smoothstep(0.5, 1.0, sparkK), sparkG = smoothstep(0.0, 0.5, sparkK); // (the spark grows while the fish is whole, then the fish shrinks into it: the school never thins mid-band)
  // the ball: deeper in it, darker; a slow wave of rolling sweeps round it, so a band of silver turns with the school
  vec3 rb = C - uBall.xyz; float inBall = uBallK * (1.0 - smoothstep(uBall.w * 1.1, uBall.w * 1.6, length(rb)));
  float band = pow(0.5 + 0.5 * sin(atan(rb.z, rb.x) - uT * 1.4 + rb.y * 0.25), 6.0);
  vShade = mix(1.0, 0.35 + 0.65 * smoothstep(0.2, 0.95, length(rb) / max(uBall.w, 0.01)), inBall);
  float roll = clamp(aRoll + 0.6 * band * inBall, 0.0, 1.0) * 1.5708, cr = cos(roll), sr = sin(roll);
  vDash = aDash; vSpark = aSpark; vPh = aPh; vBack = smoothstep(0.035, 0.065, position.y); vBelly = smoothstep(0.0, -0.05, position.y); vQ = position.xy;
  // the flank's sheen for the spark: the fish's side, rolled, mirrored against the storm's light (it twinkles as the fish turns)
  vec3 side = normalize(mat3(M) * vec3(cr, sr, 0.0)), V = normalize(cameraPosition - C);
  vSheen = pow(max(dot(reflect(-V, side), uSun), 0.0), 3.0) + 0.45 * smoothstep(-0.2, 0.8, reflect(-V, side).y);
  if (aSpark < 0.5) {
    // the fish: a wave down its body (carangiform: the tail most), quicker in a dash; rolled; shrunk into its spark far off
    vec3 p = position; float beat = 13.0 + 10.0 * aDash;
    p.x += sin(uT * beat + aPh * 6.2832 - p.z * 9.0) * 0.055 * (0.12 + aBack * aBack);
    p.z *= 1.0 + 0.35 * aDash;
    p = vec3(p.x * cr - p.y * sr, p.x * sr + p.y * cr, p.z) * fishK;
    vec3 n = vec3(normal.x * cr - normal.y * sr, normal.x * sr + normal.y * cr, normal.z);
    vec4 w = M * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(M) * n);
    gl_Position = projectionMatrix * viewMatrix * w;
  } else {
    // the spark: a diamond along the heading as the screen sees it, at least 2 px; in a dash it streaks behind (a comet)
    vW = C; vN = V;
    vec4 cc = projectionMatrix * viewMatrix * vec4(C, 1.0);
    vec4 cf = projectionMatrix * viewMatrix * vec4(C + normalize(mat3(M) * vec3(0.0, 0.0, 1.0)) * 0.34 * scl, 1.0);
    vec2 dpx = (cf.xy / cf.w - cc.xy / cc.w) * uRes * 0.5; float len = length(dpx);
    vec2 ax = len > 1e-3 ? dpx / len : vec2(0.0, 1.0), ac = vec2(ax.y, -ax.x); // (across, turned so the quad keeps its winding: the other way it faced away and was culled)
    float front = max(len, 1.25) * sparkG, back = front + aDash * (len * 5.0 + 6.0);
    float half_ = max(len * (0.3 - 0.18 * aDash), 1.25) * max(sparkG, aDash); // (at least 2.5 px across; a dash's streak is a thin line)
    vec2 off = ac * position.x * half_ + ax * (position.y > 0.0 ? front : -back);
    gl_Position = cc + vec4(off * 2.0 / uRes * cc.w, 0.0, 0.0);
  }
}`;
const FISH_F = /* glsl */`uniform vec3 uSun, uHi, uLo; uniform float uGlow;
varying vec3 vN; varying vec3 vW; varying float vBelly; varying float vBack; varying float vSpark; varying vec2 vQ; varying float vSheen; varying float vShade; varying float vDash; varying float vPh;
${LAB_GLSL}
void main() {
  vec3 V = normalize(cameraPosition - vW);
  if (vSpark > 0.5) {
    if (abs(vQ.x) + abs(vQ.y) > 1.0) discard; // (the diamond; stretched behind, a comet)
    float ph = labPhase(vW, V) + vPh * 0.35;
    vec3 c = mix(labInk(ph, 0.6) + vec3(0.04), mix(uLo, uHi, 0.6) * 1.1, clamp(vSheen, 0.0, 1.0)) * vShade;
    c = mix(c, labradorite(0.22 + 0.2 * sin(6.2832 * (ph * 0.5 + vPh * 0.15))) * 2.0, uGlow * 0.8);
    c = mix(c, uHi * 1.7, vDash * (0.6 + 0.4 * (1.0 - abs(vQ.x))));
    gl_FragColor = vec4(c, 1.0);
  } else {
    vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float ph = labPhase(vW, V) + vPh * 0.35;
    vec3 belly = vec3(0.3, 0.29, 0.34);
    vec3 c = mix(vec3(0.05, 0.05, 0.07), belly, vBelly * 0.6);
    c = mix(c, labInk(ph, 0.5), vBack); // (the back: dark, with the Mind's schiller in it, as a mackerel's is blue-green)
    // the mirror flank: the storm's light where the reflection points up, the black crude where it points down
    vec3 R = reflect(-V, N);
    vec3 sky = R.y > 0.0 ? mix(uLo, uHi, smoothstep(0.05, 0.75, R.y)) : vec3(0.025, 0.02, 0.035);
    float flank = (1.0 - vBack) * (1.0 - vBelly * 0.5); // (the back is not a mirror: a fish is countershaded)
    c = mix(c, sky * 0.8 + uHi * pow(max(dot(R, uSun), 0.0), 40.0) * 1.5, flank * 0.6);
    c += labSoft(ph) * pow(1.0 - ndv, 3.0) * 0.35; // (the Mind's edge: a labradorite rim)
    c = mix(c, labradorite(0.22 + 0.2 * sin(6.2832 * (ph * 0.5 + vPh * 0.15))) * (1.4 + 0.6 * pow(1.0 - ndv, 2.0)), uGlow * 0.75); // (the school lit from within, in the stone's blues: violet to peacock)
    c = mix(c, uHi * 1.4, vDash * 0.25);
    gl_FragColor = vec4(c * vShade, 1.0);
  }
  #include <colorspace_fragment>
}`;

const BOIL_F = /* glsl */`uniform float uK, uT; varying vec2 vU;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
void main() {
  vec2 p = vU * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
  float rings = 0.0;                                                                                // (a glint breaking the surface: a small ring, spreading and gone)
  for (int i = 0; i < 12; i++) { float fi = float(i), cyc = floor(uT * 0.9 + fi * 0.29), ph = fract(uT * 0.9 + fi * 0.29);
    vec2 c = (vec2(h(vec2(fi, cyc)), h(vec2(fi + 9.0, cyc))) * 2.0 - 1.0) * 0.75;
    rings += (1.0 - smoothstep(0.004, 0.012, abs(length(p - c) - 0.02 - ph * 0.16))) * (1.0 - ph) * step(0.04, ph); }
  float froth = (1.0 - smoothstep(0.0, 0.035, abs(n(p * 16.0 + vec2(uT * 0.5, -uT * 0.35)) - 0.5))) * (1.0 - r) * (1.0 - r); // (the churn's froth as lace, as foam on a sea is: thickest over the ball's heart)
  float shine = step(0.996, h(floor(p * 110.0) + floor(uT * 10.0))) * (1.0 - r);                 // (silver turning just under it, catching the sky)
  float fall = uK * (1.0 - smoothstep(0.65, 1.0, r));
  gl_FragColor = vec4(vec3(0.42, 0.4, 0.46) * (rings + froth * 0.6) + vec3(0.7, 0.72, 0.8) * shine, fall * clamp(rings * 0.6 + froth * 0.35 + shine, 0.0, 1.0));
}`;

/** The storm's light by default: gold-white from high, pale violet low (Calissa's one look: the storm above, the crude below). Linear. */
const STORM = { dir: new THREE.Vector3(0.25, 0.85, 0.45).normalize(), hi: new THREE.Color(0.95, 0.8, 0.55), lo: new THREE.Color(0.16, 0.13, 0.26) };

export class ShoalLook {
  constructor({ max = 192 } = {}) {
    this.max = max;
    this.group = new THREE.Group(); this.group.name = 'shoal';
    this.u = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(854, 480) }, uLod: { value: new THREE.Vector2(26, 46) }, // (the band, in metres a unit of scale: at the rail's 2, 52 to 92 m)
      uBall: { value: new THREE.Vector4(0, -1e5, 0, 1) }, uBallK: { value: 0 },
      uSun: { value: STORM.dir.clone() }, uHi: { value: STORM.hi.clone() }, uLo: { value: STORM.lo.clone() }, uMindT: mindTime, uGlow: { value: 0 },
    };
    const geo = fishGeometry();
    this.roll = new Float32Array(max); this.dash = new Float32Array(max); this.ph = new Float32Array(max).map(() => Math.random());
    geo.setAttribute('aRoll', new THREE.InstancedBufferAttribute(this.roll, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aDash', new THREE.InstancedBufferAttribute(this.dash, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(this.ph, 1));
    this.fish = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ name: 'shoal-glints', uniforms: this.u, vertexShader: FISH_V, fragmentShader: FISH_F }), max);
    this.fish.count = 0; this.fish.frustumCulled = false; this.fish.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(this.fish);
    const _v = new THREE.Vector2();
    this.fish.onBeforeRender = (r) => { const rt = r.getRenderTarget(); if (rt) this.u.uRes.value.set(rt.width, rt.height); else this.u.uRes.value.copy(r.getDrawingBufferSize(_v)); }; // (the spark's 2 px are the target's pixels: the 480 lines)
    // the Conductor: one glint twice the size, its flank and eye lit with Lachryma
    this.conductorMat = new THREE.MeshStandardMaterial({ name: 'shoal-conductor', color: 0x0d0b12, roughness: 0.3, emissive: 0x6ad2c0, emissiveIntensity: 0.6 });
    this.conductorM = new THREE.Mesh(fishGeometry({ spark: false }), this.conductorMat); this.conductorM.scale.setScalar(2); this.conductorM.visible = false; this.group.add(this.conductorM);
    // the boil over the ball
    this.bu = { uK: { value: 0 }, uT: this.u.uT };
    this.boilM = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 20, 20).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ name: 'shoal-boil', uniforms: this.bu, vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: BOIL_F, transparent: true, depthWrite: false }));
    this.boilM.frustumCulled = false; this.boilM.visible = false; this.boilM.renderOrder = 3; this.group.add(this.boilM);
    this._m = new THREE.Matrix4(); this._s = new THREE.Vector3(1, 1, 1);
  }

  get count() { return this.fish.count; }
  set count(n) { this.fish.count = Math.min(n, this.max); }
  /** Glint i: where it is, which way it faces (+Z its nose), how far it has rolled onto its side (0..1: the silver turn), and how hard it
   *  dashes (0..1: the frenzy's strike, a streak behind it). */
  set(i, pos, quat, roll = 0, dash = 0) { if (i >= this.max) return; this.fish.setMatrixAt(i, this._m.compose(pos, quat, this._s)); this.roll[i] = roll; this.dash[i] = dash; }
  conductor(pos, quat, alive = true) { this.conductorM.visible = alive; if (alive) { this.conductorM.position.copy(pos); this.conductorM.quaternion.copy(quat); } }
  /** The bait ball as one mass: its centre and radius (world), k 0..1 how much it reads as one (0: each glint on its own). */
  ball(centre, radius, k = 1) { this.u.uBall.value.set(centre.x, centre.y, centre.z, radius); this.u.uBallK.value = k; }
  /** The storm's light on the flanks: dir (toward the light), hi (high sky), lo (low sky), as THREE.Color or hex. */
  light({ dir, hi, lo } = {}) { if (dir) this.u.uSun.value.copy(dir).normalize(); if (hi != null) this.u.uHi.value.set(hi); if (lo != null) this.u.uLo.value.set(lo); }
  /** The school lit from within (0..1): every glint in the Mind's labradorite light, so a shape made of them reads against the storm's
   *  sky and the black crude alike (the silhouette: Child of Eden's whale of light). */
  glow(k) { this.u.uGlow.value = k; }
  /** Where a fish becomes its spark: from `near` to `far` metres, for a glint of scale 1 (scaled with it). */
  lod(near, far) { this.u.uLod.value.set(near, far); }
  /** The surface over the ball, boiling (k 0..1), laid on the sea's swells (sea: { heightAt(x, z) }, or flat at pos.y). */
  boil(pos, radius, k, sea = null) {
    const M = this.boilM; M.visible = k > 0.01; this.bu.uK.value = k; if (!M.visible) return;
    M.position.set(pos.x, 0, pos.z); M.scale.set(radius, 1, radius);
    const P = M.geometry.attributes.position, B = (this._b ||= Float32Array.from(P.array));
    for (let i = 0; i < P.count; i++) { const x = pos.x + B[i * 3] * radius, z = pos.z + B[i * 3 + 2] * radius; P.setY(i, (sea?.heightAt?.(x, z) ?? pos.y) + 0.06); }
    P.needsUpdate = true;
  }

  update(raw = 1 / 60) {
    this.u.uT.value += raw; mindTick();
    const A = this.fish.geometry.attributes, n = Math.max(1, this.fish.count);
    this.fish.instanceMatrix.clearUpdateRanges(); this.fish.instanceMatrix.addUpdateRange(0, n * 16); this.fish.instanceMatrix.needsUpdate = true; // (only the glints drawn this frame go up)
    for (const a of [A.aRoll, A.aDash]) { a.clearUpdateRanges(); a.addUpdateRange(0, n); a.needsUpdate = true; }
    this.conductorMat.emissiveIntensity = 0.45 + 0.25 * Math.sin(this.u.uT.value * 1.6); // (its glow breathes, slowly)
  }

  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); }
}
