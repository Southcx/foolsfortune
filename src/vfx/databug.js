// ---------------------------------------------------------------------------------------
// A DATA BUG (working name): an aberrant or stray Figment, and a blotling, drawn wrong on purpose, as .hack's data-bugged monsters
// were (the owner, 2026-10-13: "Aberrant Figments CAN be scary": an ominous aura that says "this one is bad news"). Two parts:
//
//   THE ERROR   ONE still error a creature, chosen by its id and the seed, never a strobe:
//                 'limb'   a block of its body torn out of its socket and set a hand-width off (corrupted.js's TEAR, without motion:
//                          baked once into the creature's own copy of its mesh, so it keeps its own material, its melt and its squash)
//                 'slide'  a band of its skin slid round it: the band's shape turned a third of a radian and its shading left where it
//                          was (a texture slid off its UVs; a mesh with a map has its band's UVs slid a few texels instead)
//                 'cast'   the body sickened toward grey-violet (#4a3a52), magenta (#d0207a) only in thin veins and one band across
//                          its face, and two hot red eye-glints that blink rarely
//               The moved triangles are snapped to a 3.5 cm grid (the PS1's wobble, frozen, only where the data broke); veins zigzag.
//   THE AURA    no shell: crude-black smoke with a deep red core (#1a0608 to #5a0e14) curling off its lower half and sinking, a dark
//               stain under it that breathes (the scorch decal, darkening: the light round it seems to dim), a few motes drifting the
//               wrong way (down, and up too slowly), and sparse dark streaks falling. One held effect a creature ('databug.aura',
//               written into the effect library from here), on the effect pools: no program of its own.
//
// A drain mends it (.hack's data drain repairs a data bug): `mend(c)` gives the mesh back and the aura goes. The drain's set-down
// (a drained creature a step paler) rides the same per-frame tint: `drained(c)`.
//
// Nothing in creatures/ marks anything: it finds its creatures itself, a few times a real second, in game.creatures.list by the flags
// the world already sets (`c.aberrant`: world/ground/stains.js's blotling; `c.stray`, for when one is set). No new program: the veins
// and the glints wear the drain's page material's parameters (vfx/datadrain.js), the aura is sprites and a decal.
//
// Prior art: .hack//Infection's data bugs (limbs off their sockets, textures slid, a garish cast: wrongness as a still, legible
// error), the PS1's vertex snapping, AIDA's black spots in .hack//G.U. (corruption as a dark stuff round a body), and the red eyes in
// the dark of every horror game since Alone in the Dark.
//
//   const b = new DataBugs(game)   b.update(rawDt)   b.mend(c)   b.drained(c)   b.prewarm() -> park   b.dress(c, kind?)  (a contact sheet)
//   BUG_KINDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LIBRARY } from './library.js';

export const BUG_KINDS = ['limb', 'slide', 'cast'];
const CAST = new THREE.Color(0.34, 0.27, 0.5); // (over the body's sand: toward #4a3a52, grey-violet)
const VEIN = 0xd0207a, GLINT = 0xff2a14, SNAP = 0.035;
const DRAINED_STEP = new THREE.Color(0.9, 0.94, 1.05); // (a step paler: the sand's warmth taken down toward grey)
const MAX_STEPS = 2;

// the aura, as data: a held effect (vfx/vfx.js), scaled by the creature's size; h.k breathes it
if (!LIBRARY['databug.aura']) LIBRARY['databug.aura'] = { layers: [
  { type: 'decal', tex: 'scorch', blend: 'darken', dur: Infinity, scale: 2.6, k: [[0, 1], [1, 1]], tint: 0xa8d2d6, glow: 0.85, offset: [0, 0.04, 0], spin: 0.05 }, // (the ground dimmed under it, redder than it is dark)
  { type: 'sprites', pool: 'alpha', dur: Infinity, rate: 22, shape: 'puff', spawn: 'disc', r: 0.45, offset: [0, 0.25, 0], dir: 'swirl', lift: 0.15, speed: [0.12, 0.3], size: [0.3, 0.5], sizeEnd: 0.8, life: [1.8, 2.6], drag: 0.8, gravity: 0.06, color: [0x1a0608, 0x120406, 0x220709], colorEnd: 0x080203, alpha: 0.85, alphaEnd: 0, spin: [-0.6, 0.6] },
  { type: 'sprites', pool: 'alpha', dur: Infinity, rate: 5, shape: 'puff', spawn: 'disc', r: 0.25, offset: [0, 0.35, 0], dir: 'swirl', lift: 0.05, speed: [0.05, 0.15], size: [0.18, 0.28], sizeEnd: 0.4, life: [1.2, 1.8], drag: 1, color: 0x5a0e14, colorEnd: 0x1a0608, alpha: 0.55, alphaEnd: 0 },
  { type: 'sprites', pool: 'alpha', dur: Infinity, rate: 2.5, shape: 'soft', spawn: 'column', r: 0.8, height: 1.6, dir: 'up', speed: [-0.25, 0.08], size: [0.05, 0.08], sizeEnd: 0.03, life: [2.5, 3.5], gravity: -0.02, color: [0x2a080c, 0x5a0e14], alpha: 0.9, alphaEnd: 0 },
  { type: 'sprites', pool: 'alpha', dur: Infinity, rate: 0.8, shape: 'streak', spawn: 'column', r: 0.6, height: 1.2, offset: [0, 0.6, 0], dir: 'up', speed: [-1.1, -0.6], size: [0.16, 0.26], stretch: 3, life: [0.5, 0.8], color: 0x14050a, alpha: 0.8, alphaEnd: 0 },
] };

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
const snapTri = (P, t) => { for (let v = 0; v < 9; v++) P[t + v] = Math.round(P[t + v] / SNAP) * SNAP; };
const frameOf = (geo) => { geo.computeBoundingBox(); const bb = geo.boundingBox; return { bb, H: bb.max.y - bb.min.y, cx: (bb.min.x + bb.max.x) / 2, cz: (bb.min.z + bb.max.z) / 2 }; };
const seeded = (seed) => (k) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
const centroid = (P, t, o) => (P[t + o] + P[t + 3 + o] + P[t + 6 + o]) / 3;

/** The error baked into the creature's own copy of its geometry (the shared one never touched). */
function bakeError(mesh, kind, seed) {
  const src = mesh.geometry, geo = src.index ? src.toNonIndexed() : src.clone();
  const { bb, H, cx, cz } = frameOf(geo);
  const P = geo.attributes.position.array, UV = geo.attributes.uv?.array, hasMap = !!(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.map;
  const rnd = seeded(seed);
  const ang0 = rnd(1) * Math.PI * 2, ox = Math.sin(ang0), oz = Math.cos(ang0);
  const y0 = bb.min.y + H * (kind === 'limb' ? 0.5 + 0.12 * rnd(2) : 0.36 + 0.12 * rnd(2)), y1 = y0 + H * (kind === 'limb' ? 0.3 : 0.2);
  const turn = (rnd(3) < 0.5 ? -1 : 1) * 0.55, cs = Math.cos(turn), sn = Math.sin(turn);
  for (let t = 0; t < P.length; t += 9) {
    const x = centroid(P, t, 0), y = centroid(P, t, 1), z = centroid(P, t, 2);
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
    snapTri(P, t);
  }
  geo.attributes.position.needsUpdate = true; if (UV) geo.attributes.uv.needsUpdate = true;
  geo.computeBoundingSphere();
  return geo;
}

/** The cast's veins: three thin cracked runs up the body and one band across its face, laid on its surface (found by casting in
 *  from outside), held a little off it so its squash never buries them; and its two eyes, the front, two thirds up. */
function castMarks(mesh, seed) {
  const src = mesh.geometry, { bb, H, cx, cz } = frameOf(src), rnd = seeded(seed);
  const probe = new THREE.Mesh(src, new THREE.MeshBasicMaterial()), ray = new THREE.Raycaster(), far = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 2 + 1;
  const _d = new THREE.Vector3(), _o = new THREE.Vector3();
  const at = (a, h) => { // (the outer surface at an angle round it and a height up it: the point and its normal)
    _d.set(Math.sin(a), 0, Math.cos(a)); _o.set(cx, bb.min.y + h * H, cz).addScaledVector(_d, far);
    ray.set(_o, _d.clone().negate()); const hit = ray.intersectObject(probe, false)[0];
    return hit ? { p: hit.point.clone(), n: (hit.face?.normal?.clone() || _d.clone()).normalize() } : null;
  };
  const out = [], ribbon = (pts, w) => { // (a strip of quads along the points, its width across the surface)
    for (let i = 0; i + 1 < pts.length; i++) {
      const A = pts[i], B = pts[i + 1], t = B.p.clone().sub(A.p).normalize();
      const sa = new THREE.Vector3().crossVectors(A.n, t).normalize().multiplyScalar(w / 2), sb = new THREE.Vector3().crossVectors(B.n, t).normalize().multiplyScalar(w / 2);
      const a0 = A.p.clone().addScaledVector(A.n, 0.02), b0 = B.p.clone().addScaledVector(B.n, 0.02);
      const q = [a0.clone().sub(sa), a0.clone().add(sa), b0.clone().add(sb), b0.clone().sub(sb)];
      for (const k of [0, 1, 2, 0, 2, 3]) out.push(q[k].x, q[k].y, q[k].z);
    }
  };
  for (let k = 0; k < 3; k++) { // the veins: a crack's zigzag, a step every 4 % of its height
    let a = rnd(10 + k) * Math.PI * 2; const pts = [];
    for (let h = 0.08 + 0.1 * rnd(20 + k); h < 0.6; h += 0.04) { a += (rnd(30 + k * 17 + h * 100) - 0.5) * 0.22; const s = at(a, h); if (s) pts.push(s); }
    ribbon(pts, 0.014);
  }
  const band = []; // the band across its face, a little crooked
  for (let a = -0.95; a <= 0.951; a += 0.1) { const s = at(a, 0.6 + (rnd(50 + a * 10) - 0.5) * 0.02); if (s) band.push(s); }
  ribbon(band, 0.028);
  const eyes = [-0.24, 0.24].map((a) => { const s = at(a, 0.7); return s ? s.p.addScaledVector(s.n, 0.05) : new THREE.Vector3(cx + a * 0.4, bb.min.y + 0.7 * H, bb.max.z + 0.05); });
  probe.material.dispose();
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  return { geo, eyes };
}

// (the drain's page material's parameters, vfx/datadrain.js: the same program, warm at boot; blending is the GPU's state, not the program's)
const plain = (color, blending = THREE.NormalBlending) => new THREE.MeshBasicMaterial({ name: 'databug-mark', color, transparent: true, opacity: 1, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide, blending });
let GLINT_GEO = null;
const _q = new THREE.Quaternion();

export class DataBugs {
  constructor(game) {
    this.game = game; this.bugs = new Map(); this.tints = new Map(); this.scanT = 0; this.t = 0;
  }

  /** Mark a creature a data bug (found by the scan; or by hand, `kind` forced, for a contact sheet). */
  dress(c, kind = bugKindOf(c, this.game.seed ?? 1)) {
    if (this.bugs.has(c)) this.undress(c);
    const B = { kind, mesh: null, geo0: null, geo: null, aura: null, marks: [], k: 0, blinkT: 2 + Math.random() * 4, shut: 0 };
    const mesh = mainMesh(c), seed = (c.id ?? 1) * 3.7 + (this.game.seed ?? 1);
    if (kind === 'cast' && !c.mat?.color) B.kind = kind = 'limb'; // (a cast needs a body colour of its own to lay it over)
    if (kind !== 'cast' && mesh) { B.mesh = mesh; B.geo0 = mesh.geometry; B.geo = bakeError(mesh, kind, seed); mesh.geometry = B.geo; }
    if (kind === 'cast') {
      this.tint(c).cast = true;
      if (mesh) {
        const { geo, eyes } = castMarks(mesh, seed), veins = new THREE.Mesh(geo, plain(VEIN));
        veins.name = 'databug-veins'; veins.renderOrder = 3; mesh.add(veins); B.marks.push(veins); B.veinGeo = geo;
        GLINT_GEO ||= new THREE.PlaneGeometry(0.07, 0.032);
        B.eyes = eyes.map((p) => { const e = new THREE.Mesh(GLINT_GEO, plain(GLINT, THREE.AdditiveBlending)); e.name = 'databug-glint'; e.renderOrder = 8; e.position.copy(p); mesh.add(e); B.marks.push(e); return e; });
      }
    }
    B.aura = this.game.vfx?.play?.('databug.aura', { pos: c.pos.clone(), scale: (c.radius || 0.5) / 0.5, follow: (h) => { h.pos.copy(c.pos); h.k = B.k * (0.85 + 0.15 * Math.sin(this.t * 2.094)); return true; } }) || null; // (it breathes every three real seconds)
    this.bugs.set(c, B);
    return B;
  }

  undress(c) {
    const B = this.bugs.get(c); if (!B) return;
    if (B.mesh && B.mesh.geometry === B.geo) B.mesh.geometry = B.geo0;
    B.geo?.dispose(); B.veinGeo?.dispose();
    for (const m of B.marks) { m.parent?.remove(m); m.material.dispose(); }
    B.aura?.stop?.();
    const T = this.tints.get(c); if (T) T.cast = false;
    this.bugs.delete(c);
  }

  /** A drain mends it: the body given back its own mesh, the aura gone, and it is never marked again. */
  mend(c) { if (!c) return; c.dataBugMended = true; this.undress(c); }

  /** The drain's set-down: a step paler (two at most). */
  drained(c) { const T = this.tint(c); T.steps = Math.min(MAX_STEPS, T.steps + 1); }

  tint(c) { let T = this.tints.get(c); if (!T) this.tints.set(c, (T = { cast: false, steps: 0, wrote: new THREE.Color(-1, -1, -1) })); return T; }

  update(raw) {
    const g = this.game, list = g.creatures?.list || [], cam = g.camera;
    this.t = (this.t + raw) % 600;
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
      if (!B.eyes || !cam) continue;
      // the glints: turned to the camera, shut for a beat every few real seconds
      if ((B.blinkT -= raw) <= 0) { B.shut = 0.13; B.blinkT = 3 + Math.random() * 5; }
      B.shut = Math.max(0, B.shut - raw);
      for (const e of B.eyes) {
        e.parent.getWorldQuaternion(_q).invert(); e.quaternion.copy(_q).multiply(cam.quaternion);
        e.scale.set(1, B.shut > 0 ? 0.12 : 1, 1);
      }
    }
    // the tints over what the body set this frame (each only once: a body that set nothing this frame is left as it was)
    for (const [c, T] of this.tints) {
      const m = c.mat; if (!m?.color) continue;
      if (!m.color.equals(T.wrote)) {
        if (T.cast) m.color.multiply(CAST);
        for (let i = 0; i < T.steps; i++) m.color.multiply(DRAINED_STEP);
        T.wrote.copy(m.color);
      }
    }
  }

  /** For the boot's warm-up: nothing of its own to compile (the effect pools, the decal and the page material are warm). */
  prewarm() { return () => {}; }
}
