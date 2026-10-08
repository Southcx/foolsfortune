// ---------------------------------------------------------------------------------------
// THE AMBIENT GEOMETRY: the Mind's shapes the rail runs through (the owner, 2026-10-08: "ambient geometric obstacles... the Emocean is a
// non-linear space"; docs/plans/RAIL-OVERHAUL.md section 5; docs/GLOSSARY.md: the ambient geometry). The Emocean is the inside of a mind
// under weather, and these are its furniture, drawn in the Mind's language: labradorite (vfx/labradorite.js) and Rez's wireframes.
//
//   RAIL RINGS      glowing wire tori to thread: labradorite lines, a dark glass between them; `pass()` (or a segment through it,
//                   `crossed(a, b)`) lights one in the storm's gold, and a bead of light runs round it from then on. One instanced draw
//   FOLDING LATTICES wire sheets that fold and unfold like origami as the rail passes: the Miura-ori (one degree of freedom, so the
//                   whole sheet folds as one: flat at 0, a compact stack at 1), its creases as lines and its facets as faint glass
//   MONOLITHS       black labradorite slabs (2001's 1 : 4 : 9) rising out of the crude: ink with the schiller at a grazing angle, the oil
//                   film's colours, a thin glowing edge, and the crude sheeting off them as they rise (a wet, glossier band above the
//                   waterline that sinks as they stand). One instanced draw
//   THE FOLDED SEA  `ceiling(on)`: the crude's surface folds up from the horizon like a page turning, and lies overhead, mirrored, the
//                   same shader as the sea below (vfx/crudesea.js: one program): Inception's street, a ceiling of black crude
//
// Motion is low frequency (a ring's slow turn, a slab's sway, a lattice's fold over seconds): CLAUDE.md, no aliasing crawl. Every line
// is at least 2 px at the 480 lines (fwidth), and a grid finer than that fades to its average glow instead of shimmering.
// The stone's colour (labPhase) is each piece's own: its local position at its size, plus its seed. Never the world's: the rail carries
// the school (and a ring, a slab) through the world at 26 m/s, and a phase pinned to the world cycled the colours a few times a second.
//
// One look family, one program: the rings, the lattices, the monoliths (and the shoal's silhouette eye, vfx/shoalsilhouette.js) share a
// ShaderMaterial source (`mindGeoMaterial(kind)`), its kind a uniform; every mesh is an InstancedMesh (a lattice is one of one), all
// transparent and two-sided, so the variants differ only in blending and uniforms. The folded sea adds none (crude-sea-3's).
//
// THE STORM'S HOOK: the storm warp opts these in when it is built. Every material made here goes through `warpWith`: the storm's
// `warpMaterial(material)` is applied to all made so far and all made after, EXCEPT what is shot at: the silhouette's eye, its ring and its
// shards (`warped: false`) are drawn where they are (the storm bends the world, never the danger, in its word); `keepTrue`, given
// to `warpWith`, is applied to those instead (the storm's `keepTrue`, and `deepMaterial` so the program is the warped ones'). The vertex
// shaders end in three's own `#include <project_vertex>` (with `transformed` the object-space position), so a warp written for three's
// materials (a replace of that chunk) bends these unchanged; the folded sea is a MeshStandardMaterial like the sea's.
//
// Prior art: Rez's wireframe tunnels and rings (Area 1's "network"), Child of Eden's light, 2001's monolith (its proportions, 1 : 4 : 9),
// Koryo Miura's map fold (Miura-ori, the fold of the Space Flyer Unit's solar array; its geometry after Schenk and Guest, "Geometry of
// Miura-folded metamaterials", PNAS 2013), Inception's folding street (the city turned up and over the viewer), Star Fox's rings to
// fly through, and the fwidth-wide line of every anti-aliased wireframe shader (the "barycentric wireframe" of Bærentzen et al., 2006).
//
//   const G = new RailGeometry({ env, seaY, warp })   scene.add(G.group)   G.update(dt, { t, camera })   (all handles, and the folded sea)
//   G.ring(pos, quat, r) -> { pass(), crossed(a, b) -> bool, set({ lit }), update(dt), dispose() }   (its axis: the quat's +Z)
//   G.lattice(pos, quat, size, { cells, fold }) -> { set({ fold 0..1 }), fold, update(dt), dispose() }   (the sheet in the quat's XY)
//   G.monolith(pos, { width, height, depth, yaw, rise }) -> { set({ rise 0..1 }), update(dt), dispose() }   (pos.y: the crude's level)
//   G.ceiling(on, { height, ahead, forward }) -> { k, update(dt, t, camPos), dispose() }   (the folded sea: one at a time)
//   G.warp(warpMaterial, { keepTrue })   warpWith(warpMaterial, { keepTrue })   (the storm's opt-in)   mindGeoMaterial(kind, opts)   G.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';
import { CrudeSea } from './crudesea.js';

// ---------------------------------------------------------------- the one program
const GEO_V = /* glsl */`attribute float aLit; attribute float aSeed;
varying vec3 vW; varying vec3 vView; varying vec2 vUv; varying vec3 vObj; varying vec3 vNw; varying float vLit; varying float vSeed; varying vec3 vP;
void main() {
  vec3 transformed = position;
  vUv = uv; vObj = position; vLit = aLit; vSeed = aSeed;
  vP = position * vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); // (the stone's phase is the piece's own, at its size: never the world's, which the rail carries things through at 26 m/s)
  vec4 w = modelMatrix * instanceMatrix * vec4(transformed, 1.0); vW = w.xyz; vView = cameraPosition - w.xyz;
  vNw = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  #include <project_vertex>
}`;
const GEO_F = /* glsl */`uniform float uKind, uLine, uBright, uOpacity, uSeaY, uT, uBurn, uCrack, uOpen; uniform vec2 uGrid; uniform vec3 uHi, uLo;
varying vec3 vW; varying vec3 vView; varying vec2 vUv; varying vec3 vObj; varying vec3 vNw; varying float vLit; varying float vSeed; varying vec3 vP;
${LAB_GLSL}
vec3 geoFilm(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
// lines along one axis of a uv grid: how near (in pixels) a line is, as coverage; a grid finer than ~3 px fades to its average glow
float geoLines(float u, float n) {
  if (n <= 0.0) return 0.0;
  float g = u * n, fw = max(fwidth(g), 1e-5), d = abs(fract(g - 0.5) - 0.5) / fw;
  float l = 1.0 - smoothstep(uLine * 0.5 - 0.5, uLine * 0.5 + 0.5, d);
  return mix(clamp(uLine * fw, 0.0, 1.0) * 0.8, l, 1.0 - smoothstep(0.2, 0.45, fw));
}
float geoHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main() {
  vec3 V = normalize(vView);
  vec3 N = normalize(vNw) * (gl_FrontFacing ? 1.0 : -1.0);
  if (uKind < 0.5) {
    // WIRE (the rings, the lattices): labradorite lines; lit, the storm's gold, and a bead of light running round
    float line = max(geoLines(vUv.x, uGrid.x), geoLines(vUv.y, uGrid.y));
    vec3 Nf = normalize(cross(dFdx(vW), dFdy(vW))); float face = abs(dot(Nf, V));
    float ph = labPhase(vP, V) + vSeed * 0.2;
    vec3 c = labradorite(0.22 + 0.2 * sin(6.2832 * ph)) * 1.3 * uBright; // (the stone's blues, violet to peacock: the gold is kept for a lit one)
    float bead = exp(-40.0 * pow(fract(vUv.x - uT * 0.35 + vSeed) - 0.5, 2.0)) * vLit;
    c = mix(c, uHi * 2.2, vLit * 0.75) + uHi * bead * 3.0;
    vec3 glass = labInk(ph, 0.25 + 0.4 * (1.0 - face)); // (between the lines, dark glass: it reads on the storm's bright sky and the crude alike)
    gl_FragColor = vec4(mix(glass, c, line), (line + (0.14 + 0.12 * (1.0 - face)) * (1.0 - line)) * uOpacity);
  } else if (uKind < 1.5) {
    // SLAB (the monoliths): black labradorite, the oil film at the turn of it, the storm's light on its top, a thin glowing edge,
    // and the crude sheeting off it above the waterline (the wet band sinks as the slab stands: vLit is how far it has risen)
    float ndv = abs(dot(N, V)), rim = pow(1.0 - ndv, 1.6), fres = pow(1.0 - ndv, 3.0);
    float ph = labPhase(vP, V) + vSeed * 0.3 + 0.25 * dot(N, vec3(0.3, 0.8, 0.5));
    vec3 c = labInk(ph, 0.1 + 0.75 * rim);
    vec3 R = reflect(-V, N);
    c += (R.y > 0.0 ? mix(uLo, uHi, smoothstep(0.0, 0.8, R.y)) : vec3(0.01)) * (0.04 + 0.3 * fres);
    c += uHi * 0.05 * max(N.y, 0.0);
    float h = vW.y - uSeaY, wet = (1.0 - smoothstep(0.0, 1.5 + 9.0 * (1.0 - vLit), h)) * step(-0.5, h);
    float drip = smoothstep(0.55, 0.95, fract(sin(floor(vUv.x * 14.0 + vSeed * 31.0) * 12.9898) * 43758.5)) * (1.0 - smoothstep(0.0, 4.0 + 10.0 * (1.0 - vLit), h));
    wet = max(wet, drip * 0.8);
    c *= 1.0 - 0.45 * wet;
    c += geoFilm(0.15 + fres * 0.6 + vW.y * 0.015 + ph * 0.5) * (fres * 0.16 + wet * 0.07);
    vec2 e = min(vUv, 1.0 - vUv) / max(fwidth(vUv), vec2(1e-5));
    c += labSoft(ph) * (1.0 - smoothstep(0.5, 1.5, min(e.x, e.y))) * 0.5 * uBright;
    gl_FragColor = vec4(c, 1.0);
  } else {
    // LENS (the shoal's silhouette eye): ink with the schiller in its iris, a slit pupil that watches the eye, lids that open, cracks
    // that glow as it is hurt, and the burn of a lock: gold-white from the pupil out, throbbing slowly (a ramp, never a flash)
    vec3 Nv = normalize((viewMatrix * vec4(N, 0.0)).xyz);
    float ndv = clamp(Nv.z, 0.0, 1.0), rim = pow(1.0 - ndv, 2.0);
    if (abs(Nv.y) > uOpen * 1.02 && Nv.z > 0.0) { gl_FragColor = vec4(labInk(labPhase(vP, V), 0.2 + 0.6 * rim) + labSoft(0.1) * rim * 0.4, 1.0); return; } // (the lid)
    float ang = atan(Nv.y, Nv.x), r = length(Nv.xy);
    float iris = smoothstep(0.82, 0.74, r), fibre = 0.6 + 0.4 * sin(ang * 22.0 + sin(ang * 5.0) * 2.0);
    float burn = uBurn * (0.85 + 0.15 * sin(uT * 4.0));
    vec3 c = labInk(labPhase(vP, V), 0.15 + 0.5 * rim);
    c = mix(c, labSoft(labPhase(vP, V) * 2.0 + r) * (0.6 + 0.6 * fibre), iris * 0.9);
    c = mix(c, mix(vec3(0.9, 0.42, 0.2), uHi, r) * 1.5 * fibre, iris * burn * 0.7);
    float slit = (1.0 - smoothstep(0.05 + 0.1 * burn, 0.08 + 0.12 * burn, abs(Nv.x))) * step(r, 0.62);
    c = mix(c, uHi * (0.2 + 3.0 * burn), slit);
    c += uHi * 2.5 * burn * smoothstep(0.35 * (1.0 - burn), 0.0, r);
    vec3 q = vObj * 3.0, f = fract(q) - 0.5; float cr = min(min(abs(f.x), abs(f.y)), abs(f.z)) * 2.0;
    float crack = (1.0 - smoothstep(0.02, 0.08, cr)) * step(geoHash(floor(q)), uCrack);
    c += uHi * crack * 2.2;
    c += labSoft(labPhase(vP, V)) * rim * 0.5 * uBright;
    gl_FragColor = vec4(c, 1.0);
  }
  #include <colorspace_fragment>
}`;

const KIND = { wire: 0, slab: 1, lens: 2 };
const STORM_HI = new THREE.Color(0.95, 0.8, 0.55), STORM_LO = new THREE.Color(0.16, 0.13, 0.26); // (the storm's light, as vfx/shoal.js has it)
const GEO_T = { value: 0 };
const made = new Set(), kept = new Set(); let WARP = null, TRUE = null;

/** The storm's opt-in: `warpMaterial(material)` applied to every material of the ambient geometry, now and from now on. What is shot at
 *  (the silhouette's eye) is made `warped: false` and never goes to `fn`; `keepTrue(material)`, if given, goes to it instead (the storm's
 *  `keepTrue` after its `deepMaterial`, so it keeps the warped ones' program): the storm bends the world, never what is shot at. */
export function warpWith(fn, { keepTrue = null } = {}) { WARP = fn; TRUE = keepTrue; if (fn) for (const m of made) fn(m); if (keepTrue) for (const m of kept) keepTrue(m); }
const track = (m, warped = true) => { const set = warped ? made : kept; set.add(m); (warped ? WARP : TRUE)?.(m); const d = m.dispose.bind(m); m.dispose = () => { set.delete(m); d(); }; return m; };

/** A material of the Mind's geometry: 'wire' (lines over dark glass), 'slab' (a monolith's stone), 'lens' (the silhouette's eye). One program.
 *  `warped: false` for what is shot at (the eye, its ring and its shards): the storm never bends it (see `warpWith`). */
export function mindGeoMaterial(kind = 'wire', { grid = [1, 1], line = 2, bright = 1, opacity = 1, seaY = 0, warped = true } = {}) {
  const wire = kind === 'wire';
  return track(new THREE.ShaderMaterial({
    name: 'mind-geometry',
    uniforms: {
      uKind: { value: KIND[kind] ?? 0 }, uGrid: { value: new THREE.Vector2(...grid) }, uLine: { value: line }, uBright: { value: bright }, uOpacity: { value: opacity },
      uSeaY: { value: seaY }, uT: GEO_T, uBurn: { value: 0 }, uCrack: { value: 0 }, uOpen: { value: 1 }, uMindT: mindTime,
      uHi: { value: STORM_HI.clone() }, uLo: { value: STORM_LO.clone() },
    },
    vertexShader: GEO_V, fragmentShader: GEO_F,
    transparent: true, side: THREE.DoubleSide, depthWrite: !wire, fog: false, // (normal blending for all: a line of colour reads on a bright sky, where an added one fades)
  }), warped);
}

/** An InstancedMesh of the family, with its two per-instance numbers (lit, seed). */
export function mindGeoMesh(geometry, material, max = 1) {
  const lit = new Float32Array(max), seed = new Float32Array(max).map(() => Math.random());
  geometry.setAttribute('aLit', new THREE.InstancedBufferAttribute(lit, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
  const m = new THREE.InstancedMesh(geometry, material, max); m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.userData.lit = lit; m.userData.zoneFree = true;
  return m;
}

// ---------------------------------------------------------------- the Miura-ori
const GAMMA = (60 * Math.PI) / 180; // (the parallelogram's angle: Miura's own sheets sit between 55 and 70 degrees)
/** The folded sheet's vertex (i, j) for panels a by b, folded to theta (0 flat .. pi/2 a flat stack): Schenk and Guest's unit cell. */
function miura(i, j, a, b, theta, out) {
  const ct = Math.cos(theta), st = Math.sin(theta), tg = Math.tan(GAMMA), q = Math.sqrt(1 + ct * ct * tg * tg);
  const H = a * st * Math.sin(GAMMA), S = (b * ct * tg) / q, L = a * Math.sqrt(1 - st * st * Math.sin(GAMMA) ** 2), V = b / q;
  return out.set(i * S, j * L + (i % 2 ? V : 0), j % 2 ? H : 0);
}
/** A lattice's sheet: panels of their own (so each has its corners' uv for its crease lines), folded on the CPU when the fold changes. */
function latticeGeometry(m, n) {
  const g = new THREE.BufferGeometry(), count = m * n * 6;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3).fill(0).map((_, k) => (k % 3 === 2 ? 1 : 0)), 3));
  const uv = new Float32Array(count * 2), C = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
  for (let p = 0; p < m * n; p++) for (let k = 0; k < 6; k++) uv.set(C[k], (p * 6 + k) * 2);
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _e = new THREE.Euler();
const ease = (x, to, rate, dt) => x + (to - x) * (1 - Math.exp(-rate * dt));

export class RailGeometry {
  constructor({ env = null, seaY = 0, maxRings = 64, maxMonoliths = 48, warp = null, keepTrue = null } = {}) {
    this.env = env; this.seaY = seaY; this.t = 0;
    this.group = new THREE.Group(); this.group.name = 'rail-geometry'; this.group.userData.zoneFree = true;
    if (warp) warpWith(warp, { keepTrue });
    // the rings: one instanced draw (a torus a metre round, scaled to its r; 24 ribs and 6 lines along it)
    this.ringMat = mindGeoMaterial('wire', { grid: [24, 6], bright: 1.1 });
    this.rings = mindGeoMesh(new THREE.TorusGeometry(1, 0.045, 6, 72), this.ringMat, maxRings); this.group.add(this.rings);
    this.ringList = [];
    // the monoliths: one instanced draw (a box standing on its base, scaled to each slab)
    this.slabMat = mindGeoMaterial('slab', { seaY });
    this.slabs = mindGeoMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.slabMat, maxMonoliths); this.group.add(this.slabs);
    this.slabList = [];
    this.latticeMat = mindGeoMaterial('wire', { grid: [1, 1], bright: 1.0, opacity: 0.9 });
    this.lattices = new Set(); this.sky = null;
  }

  /** The storm's opt-in (the same as warpWith: for every Mind geometry material but what is shot at). */
  warp(fn, { keepTrue = null } = {}) { warpWith(fn, { keepTrue }); }

  // ---------------------------------------------------------------- rail rings
  ring(pos, quat = new THREE.Quaternion(), r = 6) {
    const G = this, R = this.rings, i = this.ringList.length;
    if (i >= R.instanceMatrix.count) return null;
    const h = {
      i, pos: pos.clone(), quat: quat.clone(), r, lit: 0, litTo: 0, spin: 0, ph: Math.random() * 6.28,
      pass() { this.litTo = 1; },
      set({ lit } = {}) { if (lit != null) this.litTo = lit; },
      /** Did the segment a -> b pass through the ring (its plane, inside r)? If so, it is lit. */
      crossed(a, b) {
        const n = _v.set(0, 0, 1).applyQuaternion(this.quat), da = _w.subVectors(a, this.pos).dot(n), db = _s.subVectors(b, this.pos).dot(n);
        if (da * db > 0 || da === db) return false;
        const k = da / (da - db), hit = _w.lerpVectors(a, b, k).sub(this.pos);
        if (hit.length() > this.r) return false;
        this.pass(); return true;
      },
      update(dt) { // (a slow turn about its axis and a breath of its radius: low frequency, the Mind idling)
        this.spin += dt * 0.15; this.lit = ease(this.lit, this.litTo, 3, dt);
        _q.setFromAxisAngle(_v.set(0, 0, 1), this.spin).premultiply(this.quat);
        const s = this.r * (1 + 0.02 * Math.sin(G.t * 0.8 + this.ph));
        R.setMatrixAt(this.i, _m.compose(this.pos, _q, _s.set(s, s, s))); R.userData.lit[this.i] = this.lit;
      },
      dispose() { G.drop(G.ringList, R, this); },
    };
    this.ringList.push(h); R.count = this.ringList.length; h.update(0);
    return h;
  }

  // ---------------------------------------------------------------- folding lattices
  lattice(pos, quat = new THREE.Quaternion(), size = 16, { cells = 10, fold = 0 } = {}) {
    const G = this, m = cells, n = cells, geo = latticeGeometry(m, n), mesh = mindGeoMesh(geo, this.latticeMat, 1);
    mesh.count = 1; mesh.setMatrixAt(0, _m.identity()); mesh.position.copy(pos); mesh.quaternion.copy(quat); this.group.add(mesh);
    const a = size / n, b = size / (m * Math.sin(GAMMA)); // (flat, the sheet is `size` both ways)
    const P = geo.attributes.position, A = [], c = new THREE.Vector3();
    const h = {
      mesh, fold: -1, foldTo: fold, k: fold, size,
      set({ fold: f } = {}) { if (f != null) this.foldTo = THREE.MathUtils.clamp(f, 0, 1); },
      update(dt) {
        this.k = ease(this.k, this.foldTo, 1.2, dt); // (an origami fold takes its time: over a couple of real seconds)
        mesh.userData.lit[0] = 0.15 * this.k;
        if (Math.abs(this.k - this.fold) < 1e-4) return;
        this.fold = this.k; const th = this.k * Math.PI * 0.46;
        for (let i = 0; i <= m; i++) { A[i] ||= []; for (let j = 0; j <= n; j++) A[i][j] = miura(i, j, a, b, th, A[i][j] || new THREE.Vector3()); }
        c.copy(A[m][n]).add(A[0][0]).multiplyScalar(0.5).setZ((A[0][1].z) * 0.5); // (centred on its middle)
        let o = 0; const put = (v) => { P.array[o++] = v.x - c.x; P.array[o++] = v.y - c.y; P.array[o++] = v.z - c.z; };
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { const p0 = A[i][j], p1 = A[i + 1][j], p2 = A[i + 1][j + 1], p3 = A[i][j + 1]; put(p0); put(p1); put(p2); put(p0); put(p2); put(p3); }
        P.needsUpdate = true;
      },
      dispose() { G.lattices.delete(this); G.group.remove(mesh); geo.dispose(); },
    };
    this.lattices.add(h); h.update(1);
    return h;
  }

  // ---------------------------------------------------------------- monoliths
  monolith(pos, { height = 16, width = height * 4 / 9, depth = height / 9, yaw = Math.random() * Math.PI, rise = 1 } = {}) { // (2001's 1 : 4 : 9)
    const G = this, S = this.slabs, i = this.slabList.length;
    if (i >= S.instanceMatrix.count) return null;
    const h = {
      i, pos: pos.clone(), w: width, h: height, d: depth, yaw, k: 0, riseTo: rise, ph: Math.random() * 6.28,
      set({ rise: r } = {}) { if (r != null) this.riseTo = THREE.MathUtils.clamp(r, 0, 1); },
      update(dt) { // (crude is heavy: a slab takes a few real seconds to stand, and sways a degree in the swell once it does)
        this.k = ease(this.k, this.riseTo, 0.7, dt);
        const k = this.k * this.k * (3 - 2 * this.k), y = this.pos.y - this.h * (1 - 0.72 * k) - 1.5 * (1 - k);
        _q.setFromEuler(_e.set(0.016 * Math.sin(G.t * 0.4 + this.ph), this.yaw, 0.016 * Math.sin(G.t * 0.33 + this.ph * 1.7)));
        S.setMatrixAt(this.i, _m.compose(_v.set(this.pos.x, y, this.pos.z), _q, _s.set(this.w, this.h, this.d))); S.userData.lit[this.i] = k;
      },
      dispose() { G.drop(G.slabList, S, this); },
    };
    this.slabList.push(h); S.count = this.slabList.length; h.update(0);
    return h;
  }

  // ---------------------------------------------------------------- the folded sea
  /** The crude folded overhead (on) or laid back down past the horizon (off). The hinge is `ahead` metres before the eye along
   *  `forward`; the sheet turns up and over it like a page and lies `height` metres over the sea, mirrored (its swells hang down). */
  ceiling(on = true, { height = 48, ahead = 240, forward = new THREE.Vector3(0, 0, 1) } = {}) {
    if (!this.sky) {
      const W = 900, cells = 150, geo = new THREE.PlaneGeometry(W, W, cells, cells).rotateX(-Math.PI / 2).translate(0, 0, W / 2);
      const sea = new CrudeSea({ env: this.env, geometry: geo, y: 0 }); sea.set({ film: 1.6, calm: 0.2 }); // (seen from under, its film carries it; more and its far cells band)
      const pivot = new THREE.Group(); pivot.rotation.order = 'YXZ'; pivot.add(sea.mesh); pivot.visible = false; pivot.userData.zoneFree = true;
      sea.mesh.userData.zoneFree = true; sea.mesh.receiveShadow = false; this.group.add(pivot); WARP?.(sea.mat); made.add(sea.mat);
      const G = this, cell = W / cells;
      this.sky = {
        sea, pivot, k: 0, on: false, height, ahead, forward: forward.clone().setY(0).normalize(), W,
        update(dt, t = G.t, camPos = null) {
          this.k = ease(this.k, this.on ? 1 : 0, 0.9, dt); // (a page turned over two bars or so)
          pivot.visible = this.k > 0.002; if (!pivot.visible) return;
          const k = this.k * this.k * (3 - 2 * this.k), f = this.forward, at = camPos || _w.set(0, G.seaY, 0);
          const reach = THREE.MathUtils.lerp(this.ahead, this.W * 0.5, THREE.MathUtils.smoothstep(k, 0.75, 1)); // (laid over, the hinge goes out past the fog so the sheet spans the eye)
          pivot.position.set(Math.round(at.x / cell) * cell + f.x * reach, G.seaY + this.height * 0.5, Math.round(at.z / cell) * cell + f.z * reach);
          pivot.rotation.set(-Math.PI * k, Math.atan2(f.x, f.z), 0); sea.mesh.position.set(0, -this.height * 0.5, 0);
          sea.update(t);
        },
        dispose() { G.group.remove(pivot); made.delete(sea.mat); sea.dispose(); G.sky = null; },
      };
    }
    Object.assign(this.sky, { on, height, ahead }); this.sky.forward.copy(forward).setY(0).normalize();
    return this.sky;
  }

  // ---------------------------------------------------------------- every frame
  update(dt, { t, camera } = {}) {
    this.t = t ?? this.t + dt; GEO_T.value = this.t; mindTick();
    for (const h of this.ringList) h.update(dt);
    for (const h of this.slabList) h.update(dt);
    for (const h of this.lattices) h.update(dt);
    this.sky?.update(dt, this.t, camera?.position);
    for (const M of [this.rings, this.slabs]) { M.instanceMatrix.needsUpdate = true; M.geometry.attributes.aLit.needsUpdate = true; }
    for (const h of this.lattices) h.mesh.geometry.attributes.aLit.needsUpdate = true;
  }

  /** A handle gone from an instanced list: the last one moves into its place. */
  drop(list, mesh, h) {
    const i = list.indexOf(h); if (i < 0) return;
    const last = list.pop();
    if (last !== h) { list[i] = last; last.i = i; last.update(0); }
    mesh.count = list.length;
  }

  dispose() {
    this.sky?.dispose(); for (const h of [...this.lattices]) h.dispose();
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { o.geometry?.dispose(); });
    for (const m of [this.ringMat, this.slabMat, this.latticeMat]) m.dispose();
  }
}
