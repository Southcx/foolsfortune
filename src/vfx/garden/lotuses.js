// ---------------------------------------------------------------------------------------
// THE LAKE LOTUSES: the garden's rating made a thing in the world (GARDEN-COZY.md D6). Five places spaced round the Dantian's lake,
// each a lily pad on the water; as the rating rises (the event `garden.rating { lotuses }`, 0 to 5, said by world/garden/decorlayer.js)
// a lotus rises out of its pad and opens over about two real seconds, its three rings of petals unfolding outward, pink-white
// shading to rose at the tips, a gold seed pod in its heart. At night (mood.day low) the petals and the pod take a warm glow. A world
// mark: no words, no number; the rating is never shown, only this. The five are ONE InstancedMesh (one draw, one program): a
// merged geometry of pad, petals and pod, each vertex carrying its part, its petal's hinge and axis and its open angle, and each
// instance an `aOpen` 0..1 that the vertex shader unfolds (the same program for every lotus; the MeshStandardMaterial's, patched).
// Nothing is allocated per frame, and the open states are re-sent only on a frame a lotus is moving.
//
// Prior art: Monet's water lilies (pads and blooms laid on a still sheet), the lotus pond of a Japanese temple garden (a few blooms,
// never a carpet; Hasu-ike), Animal Crossing's island rating (Isabelle's stars) made a thing in the world instead of a number, and
// Journey's scarf-in-light for the glow that says "this was earned".
//
//   const L = new LakeLotuses(realm)   L.set(n 0..5)   L.update(rawDt)   L.place() (again after the lake changes; set() does it)   L.dispose()   (adds itself to realm.site.group; L.mesh)
//   lotusesParked() -> a Group of the same mesh far off, for the warm-up (a program compiles at first sight, not first use)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The numbers: the lake's cap (rad, as planetoid.js draws it), where the five stand (rad from the crown, round it), the open time. */
export const LOTUS = { lakeAngle: 0.32, ring: [0.15, 0.2, 0.13, 0.19, 0.16], turn: 2.4, openSecs: 2.0, padR: 0.7, lift: 0.07, count: 5 };

// the vertex layout (per vertex): aPart 0 pad, 1 petal, 2 pod; aHinge the petal's foot; aAxis the axis it opens about; aAng how far it opens (rad)
const PETAL_RINGS = [{ n: 8, len: 0.52, w: 0.17, open: 1.45, rad: 0.07, lean: 0.12, tip: [1, 0.78, 0.86], root: [1, 0.97, 0.94] }, { n: 6, len: 0.44, w: 0.15, open: 0.95, rad: 0.05, lean: 0.1, tip: [1, 0.7, 0.8], root: [1, 0.95, 0.9] }, { n: 5, len: 0.34, w: 0.13, open: 0.5, rad: 0.03, lean: 0.06, tip: [1, 0.62, 0.74], root: [1, 0.93, 0.8] }];
const PAD_IN = [0.17, 0.4, 0.2], PAD_OUT = [0.3, 0.55, 0.24], POD = [0.95, 0.78, 0.3];

function buildGeometry() {
  const pos = [], nor = [], col = [], part = [], hinge = [], axis = [], ang = [];
  const tri = (p, q, r, c, k, h, a, an) => { // (a triangle with one normal; c: three colours; k: part)
    const u = new THREE.Vector3().subVectors(q, p), v = new THREE.Vector3().subVectors(r, p), n = u.cross(v).normalize();
    [p, q, r].forEach((x, i) => { pos.push(x.x, x.y, x.z); nor.push(n.x, n.y, n.z); col.push(...c[i]); part.push(k); hinge.push(h.x, h.y, h.z); axis.push(a.x, a.y, a.z); ang.push(an); });
  };
  const Z = new THREE.Vector3();
  // the pad: a disc of 20 wedges cupped at its rim, one wedge missing (a lily pad's notch), dark at the stem
  const PN = 20, P = LOTUS.padR, padAt = (i, rr) => { const t = (i / PN) * Math.PI * 2 + 0.25; return new THREE.Vector3(Math.cos(t) * P * rr, 0.03 * rr * rr, Math.sin(t) * P * rr); };
  for (let i = 1; i < PN; i++) { const a = padAt(i, 1), b = padAt(i + 1, 1), m1 = padAt(i, 0.55), m2 = padAt(i + 1, 0.55);
    tri(Z, m2, m1, [PAD_IN, PAD_IN, PAD_IN], 0, Z, Z, 0); tri(m1, m2, b, [PAD_IN, PAD_IN, PAD_OUT], 0, Z, Z, 0); tri(m1, b, a, [PAD_IN, PAD_OUT, PAD_OUT], 0, Z, Z, 0); }
  // petals: each a four-row strip (foot to tip) three across, cupped, built closed (upright, leaning in a little) and opened by the shader
  PETAL_RINGS.forEach((R, ri) => {
    for (let k = 0; k < R.n; k++) {
      const th = (k / R.n) * Math.PI * 2 + ri * 0.4, r = new THREE.Vector3(Math.cos(th), 0, Math.sin(th)), t = new THREE.Vector3(-r.z, 0, r.x);
      const foot = r.clone().multiplyScalar(R.rad).setY(0.02), axisV = new THREE.Vector3(0, 1, 0).cross(r).normalize(); // (y x r: a positive turn tilts the petal outward)
      const rows = 4, grid = [];
      for (let j = 0; j < rows; j++) {
        const s = j / (rows - 1), wd = R.w * Math.sin(Math.PI * Math.pow(s, 0.75) * 0.97 + 0.12) * 0.5, up = R.len * s, inn = -R.lean * Math.sin(s * Math.PI * 0.5) * (1 + 0.5 * s);
        const row = []; for (const x of [-1, 0, 1]) row.push(foot.clone().addScaledVector(r, inn + (x === 0 ? 0.015 * s : -0.01 * s * (1 - Math.abs(x) * 0.2))).addScaledVector(t, x * wd).setY(0.02 + up));
        grid.push(row);
      }
      const colAt = (j) => { const s = j / (rows - 1); return R.root.map((v, i) => v + (R.tip[i] - v) * Math.pow(s, 1.4)); };
      for (let j = 0; j < rows - 1; j++) for (let x = 0; x < 2; x++) {
        const a = grid[j][x], b = grid[j][x + 1], c = grid[j + 1][x], d = grid[j + 1][x + 1], c0 = colAt(j), c1 = colAt(j + 1);
        tri(a, b, c, [c0, c0, c1], 1, foot, axisV, R.open); tri(b, d, c, [c0, c1, c1], 1, foot, axisV, R.open);
      }
    }
  });
  // the pod: a small cone-capped drum in the heart, gold; it rises with the lotus
  const pr = 0.075, ph = 0.1, pn = 8;
  for (let i = 0; i < pn; i++) { const a0 = (i / pn) * Math.PI * 2, a1 = ((i + 1) / pn) * Math.PI * 2;
    const b0 = new THREE.Vector3(Math.cos(a0) * pr, 0.02, Math.sin(a0) * pr), b1 = new THREE.Vector3(Math.cos(a1) * pr, 0.02, Math.sin(a1) * pr), t0 = b0.clone().setY(0.02 + ph).multiplyScalar(0.8).setY(0.02 + ph), t1 = b1.clone().setY(0.02 + ph).multiplyScalar(0.8).setY(0.02 + ph), top = new THREE.Vector3(0, 0.02 + ph + 0.02, 0), cc = [POD, POD, POD];
    tri(b0, b1, t0, cc, 2, Z, Z, 0); tri(b1, t1, t0, cc, 2, Z, Z, 0); tri(t0, t1, top, cc, 2, Z, Z, 0); }
  const g = new THREE.BufferGeometry(), F = (a, n) => new THREE.Float32BufferAttribute(a, n);
  g.setAttribute('position', F(pos, 3)); g.setAttribute('normal', F(nor, 3)); g.setAttribute('color', F(col, 3)); g.setAttribute('aPart', F(part, 1));
  g.setAttribute('aHinge', F(hinge, 3)); g.setAttribute('aAxis', F(axis, 3)); g.setAttribute('aAng', F(ang, 1)); g.computeBoundingSphere(); return g;
}

/** The material: a standard one, its vertex stage unfolding each lotus by its instance's `aOpen`, its emissive the warm night glow. One program. */
function buildMaterial(uni) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, emissive: new THREE.Color(0xff9a6a), name: 'garden-lotuses' });
  m.customProgramCacheKey = () => 'garden-lotuses-v1';
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = uni.uGlow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      attribute float aPart; attribute vec3 aHinge; attribute vec3 aAxis; attribute float aAng; attribute float aOpen;
      uniform float uGlow; varying float vGlow;
      vec3 rod(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
      float ease(float o) { return o * o * (3.0 - 2.0 * o); }`)
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      float eo = ease(aOpen);
      if (aPart > 0.5 && aPart < 1.5) objectNormal = rod(objectNormal, aAxis, aAng * eo);`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vGlow = 0.0;
      if (aPart > 0.5) {
        if (aPart < 1.5) transformed = aHinge + rod(transformed - aHinge, aAxis, aAng * eo);
        transformed *= 0.25 + 0.75 * eo; transformed.y += (eo - 1.0) * 0.22; // (a bud rising out of the water, opening as it comes)
        vGlow = eo * uGlow;
      }
      if (aPart > 0.5 && aOpen < 0.002) transformed = vec3(0.0, -2.0, 0.0);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n varying float vGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vGlow;');
  };
  return m;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _d = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function makeMesh() {
  const uni = { uGlow: { value: 0.1 } }, geo = buildGeometry(), mat = buildMaterial(uni);
  const mesh = new THREE.InstancedMesh(geo, mat, LOTUS.count); mesh.name = 'garden-lotuses'; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true;
  const open = new THREE.InstancedBufferAttribute(new Float32Array(LOTUS.count), 1); open.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aOpen', open);
  mesh.userData = { uni, open };
  return mesh;
}

export class LakeLotuses {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.n = 0; this.state = new Float32Array(LOTUS.count); this.moving = false;
    this.mesh = makeMesh(); this.uni = this.mesh.userData.uni; this.openAttr = this.mesh.userData.open;
    this.place(); realm.site.group.add(this.mesh);
  }
  /** The five places: on the lake as it is drawn. The Dantian's lake is a level cap of sphere (planetoid.js: 0.32 rad round the crown, at
   *  1.004 of the planet's radius) that shows wherever the ground dips under it, so a place is wet where the ground is at least a pad's
   *  depth below that level all round the pad. The first stands in the middling water, each next the farthest from those chosen, so
   *  any count reads balanced. Said again by `place()` after the ground is sculpted. With no such ground, the crown's ring. */
  place() {
    const P = this.R.site.by.dantian, up = new THREE.Vector3(0, 1, 0), cand = [], pad = 0.05, deep = 0.09, level = (P.look?.R ?? P.r) * 1.004;
    const at = (pol, az, out) => out.set(Math.cos(az) * Math.sin(pol), Math.cos(pol), Math.sin(az) * Math.sin(pol)).normalize();
    for (const pol of [0.1, 0.14, 0.18, 0.22, 0.26]) for (let a = 0; a < 28; a++) {
      const az = (a / 28) * Math.PI * 2 + pol * 3, d = at(pol, az, new THREE.Vector3()); let depth = level - P.radiusAt(d), ok = depth >= deep;
      for (let k = 0; ok && k < 4; k++) { const e = at(pol + Math.cos(k * 1.571) * pad, az + Math.sin(k * 1.571) * pad / Math.max(0.1, Math.sin(pol)), _d); ok = level - P.radiusAt(e) >= deep * 0.6; }
      if (ok) cand.push({ d, depth });
    }
    const pick = [];
    if (cand.length >= LOTUS.count) {
      cand.sort((x, y) => x.depth - y.depth); pick.push(cand.splice(cand.length >> 1, 1)[0]);
      while (pick.length < LOTUS.count) { let best = -1, bi = 0; cand.forEach((c, i) => { const m = Math.min(...pick.map((p) => p.d.distanceTo(c.d))); if (m > best) { best = m; bi = i; } }); pick.push(cand.splice(bi, 1)[0]); }
    }
    this.found = pick.length; // (how many places are on real water: 5, or 0 for the fallback ring)
    for (let i = 0; i < LOTUS.count; i++) {
      const az = i * 2.513 + 0.5, d = pick[i] ? pick[i].d : at(LOTUS.ring[i], az, new THREE.Vector3());
      _p.copy(P.c).addScaledVector(d, level + LOTUS.lift); _q.setFromUnitVectors(UP, d).multiply(new THREE.Quaternion().setFromAxisAngle(up, i * 1.7));
      _s.setScalar(0.9 + 0.12 * ((i * 37) % 5) / 4);
      this.mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  /** How many are open (0..5): the rating's `lotuses`. They open in order, one after another, each over about two real seconds. */
  set(n) { this.n = Math.max(0, Math.min(LOTUS.count, Math.round(n || 0))); this.moving = true; this.place(); }
  update(raw = 1 / 60) {
    const mood = this.game.gardenMood?.now, day = mood ? mood.day : 1;
    this.uni.uGlow.value = 0.08 + 0.95 * (1 - sm(0.05, 0.6, day)); // (a faint warmth by day, the lantern-glow by night)
    if (!this.moving) return;
    let any = false; const st = this.state, step = raw / LOTUS.openSecs;
    for (let i = 0; i < LOTUS.count; i++) {
      const target = i < this.n ? 1 : 0;
      if (st[i] === target) continue; any = true;
      st[i] = target > st[i] ? Math.min(target, st[i] + step) : Math.max(target, st[i] - step * 1.5);
      this.openAttr.array[i] = st[i];
    }
    this.openAttr.needsUpdate = true; if (!any) this.moving = false;
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh.dispose?.(); }
}

/** The mesh parked far off for the warm-up (main.js compiles what the realm's `parked()` returns): the same geometry and program, all open. */
export function lotusesParked() {
  const g = new THREE.Group(), mesh = makeMesh(); mesh.userData.open.array.fill(1); mesh.userData.open.needsUpdate = true;
  for (let i = 0; i < LOTUS.count; i++) mesh.setMatrixAt(i, _m.makeTranslation(0, -400, 0));
  g.add(mesh); g.name = 'garden-lotuses-parked'; return g;
}
