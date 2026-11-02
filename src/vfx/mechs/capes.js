// ---------------------------------------------------------------------------------------
// A MECH'S BACK PIECE (plain name; South, 2026-11-02: "what's the name of the ring of drums around raijin/fujin's cloth? I think we should
// use motifs of that sort of aura ring halo at the shoulders, perhaps add it like a cape slot? Mecha knights with cloth physics?"): a
// look a frame wears at its shoulders and back, any form (the hero, the doll), chosen and kept in the mech's style (slot `cape`,
// vfx/mechs/mechstyle.js). Never over the cradle between the shoulder blades, where the Pneuka Jar screws in: a halo stands behind it
// with the Jar framed in its opening, a cloth hangs from the shoulders either side of it or from a yoke under it. Looks only.
//   renko       the drums' ring (renkō): Raijin's hoop of eight lacquered taiko round the shoulders, turning, a drum roll chasing round
//               it (each head flashing in turn, a ring of the film off it, the lightning jumping on to the next)
//   kohai       the flame halo (kaen kōhai): Fudō Myōō's karura flames, S-curled tongues in two rows, gold over the film, licking up
//               round an open ring framing the shoulders, embers rising
//   kazebukuro  Fūjin's wind bag: a long tube of cloth from shoulder to shoulder billowing up over and behind the helm, banded in the
//               body glaze, its cuffs gilt
//   tenne       the heavenly sash (ten'e, 天衣): a stiffened loop of sash standing behind the helm, its two ends falling from the
//               shoulders, both edged in gold
//   knight      a mecha knight's cape: heavy lined cloth (the trim glaze over the body glaze, a gilt rolled hem) hung from a gold yoke
//               that runs from clasp to clasp under the cradle, to the knees
// The halos are rigid rings close behind the shoulders, in the chest's frame, framing the shoulders and the Jar, alive in the frame's
// time and brighter while the Jar is sealed in (capes/halos.js); the cloths are small verlet grids
// in the world (capes/cloth.js), pinned in the chest's frame and swung by the frame's own motion, kept off the back, the Jar, the
// hips and the thighs by spheres fitted to those parts' own boxes (the pear's hips included). Their numbers are one table (CAPE_CLOTH,
// capes/knobs.js). Drawn in the parts body's programs: the cloth and the sashes in its trim (the trim glaze), the halos in its gold,
// porcelain and trim, and the film's light, so the mount's glazing paints them.
// Prior art: the Wind God and Thunder God screens of Tawaraya Sōtatsu (Kennin-ji, early 17th c.: Raijin's renkō and Fūjin's
// kazebukuro); Fudō Myōō's karura-flame mandorla (kaen kōhai); the ten'e of Buddhist sculpture (the bodhisattvas' and the devas'
// heavenly scarves, looped behind the shoulders and trailing: the Asuka and Nara bronzes, the Dunhuang apsaras); the knights' capes of
// mecha (Escaflowne's Guymelefs, Code Geass's Lancelot and the Knightmares of the Rounds, Gundam's cloaked suits); Jakobsen's verlet
// cloth (2001); the floating helm and its sprung plumes (vfx/mechs/helms.js).
//
//   CAPES[id] = { label }   CAPE_CLOTH   wearCape(body, id | null, scene) -> handle | null (null takes the worn one off)
//   handle.update(dt, seal 0..1)   handle.dispose()   frameOf(body) -> the frame's metrics the pieces are laid out by
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, seg, tube, labTone } from './parts/kit.js';
import { CRADLE } from './parts/cores.js';
import { Cloth } from './capes/cloth.js';
import { HALOS } from './capes/halos.js';
import { CAPE_CLOTH } from './capes/knobs.js';
export { CAPE_CLOTH };

const PI = Math.PI;
export const CAPES = {
  renko: { label: "Raijin's drums" },
  kohai: { label: 'Flame halo' },
  kazebukuro: { label: "Fujin's wind bag" },
  tenne: { label: 'Heavenly sash' },
  knight: { label: "Knight's cape" },
};
/** The heavenly sash's columns across its width (shares of it: a narrow band each side, gilt). */
const SASH = [-0.5, -0.38, 0, 0.38, 0.5];
/** The knight's cape's lining, a vertex tone under the body glaze (a shade deeper than the plates). */
const LINING = 0xb5ada1;
const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const _m = new THREE.Matrix4(), _b = new THREE.Box3(), _v = new THREE.Vector3();

/** The box of a joint's own meshes (or, deep, every mesh under it) in `frame`'s space. */
function boxIn(frame, root, deep = false) {
  const inv = new THREE.Matrix4().copy(frame.matrixWorld).invert(), out = new THREE.Box3();
  const take = (o) => { if (!o.isMesh || !o.geometry?.attributes?.position) return; o.geometry.computeBoundingBox(); _m.multiplyMatrices(inv, o.matrixWorld); out.union(_b.copy(o.geometry.boundingBox).applyMatrix4(_m)); };
  if (deep) root.traverse(take); else for (const o of root.children) take(o);
  return out;
}
/** A box filled with spheres of its smallest half-size, spaced a radius apart (a collider fitted to a part). */
function spheresOf(box, joint, max = 18) {
  if (box.isEmpty()) return [];
  const d = box.getSize(new THREE.Vector3()), r = Math.max(0.2, Math.min(d.x, d.y, d.z) / 2), n = (k) => Math.max(1, Math.min(6, Math.round((k - 2 * r) / r) + 1));
  const nx = n(d.x), ny = n(d.y), nz = n(d.z), out = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (out.length >= max) break;
    const at = (a, b, m, q) => (m === 1 ? (a + b) / 2 : a + r + ((b - a - 2 * r) * q) / (m - 1));
    out.push({ joint, at: new THREE.Vector3(at(box.min.x, box.max.x, nx, i), at(box.min.y, box.max.y, ny, j), at(box.min.z, box.max.z, nz, k)), r });
  }
  return out;
}

/** The frame's metrics, in the chest's frame: the shoulders (half-width, height, the cap's rise), the back's depth by height, the Jar
 *  in its cradle (its centre and reach), the hips, the halo's size and seat, and the colliders. */
export function frameOf(body) {
  const j = body.joints, M = body.core.mounts; body.group.updateMatrixWorld(true);
  const sw = M.shoulder[0], sy = M.shoulder[1];
  const chest = boxIn(j.chest, j.chest), paul = j.pauldronL ? boxIn(j.chest, j.pauldronL, true) : new THREE.Box3();
  const cap = paul.isEmpty() ? 0.35 : Math.max(0.2, paul.max.y - sy);
  const d1 = -M.back[1] - 0.5, d2 = -(M.cradleZ - 0.06);
  const depthAt = (y) => d1 + (d2 - d1) * Math.min(1, Math.max(0, (y - M.back[0]) / (CRADLE.at[0] - M.back[0])));
  const jar = new THREE.Vector3(0, 0.6, 0).applyMatrix4(_m.copy(j.chest.matrixWorld).invert().multiply(j.cradle.matrixWorld));
  const pelvis = boxIn(j.chest, j.pelvis), R = 1.0 + 0.85 * sw, scl = R / 2.6;
  const spheres = [];
  for (const id of ['chest', 'booster', 'generator', 'backMount', 'pelvis', 'hipL', 'hipR', 'kneeL', 'kneeR']) if (j[id]) spheres.push(...spheresOf(boxIn(j[id], j[id]), j[id]));
  if (j.hipBelt) spheres.push(...spheresOf(boxIn(j.hipBelt, j.hipBelt, true), j.hipBelt)); // (a hip piece's plates)
  spheres.push({ joint: j.cradle, at: new THREE.Vector3(0, 0.6, 0), r: 0.72 }); // (the Pneuka Jar in its cradle)
  if (body.helm?.root && j.head) { const hb = boxIn(j.head, body.helm.root, true); if (!hb.isEmpty()) spheres.push({ joint: j.head, at: hb.getCenter(new THREE.Vector3()), r: Math.max(...hb.getSize(_v).toArray()) * 0.42 }); }
  return {
    sw, sy, cap, depthAt, jar, top: chest.max.y, chest, pelvis, hip: body.hip, R, scl, spheres,
    foot: -(L.chestBase + L.waist), // (the pelvis's height in the chest's frame)
  };
}

/** A flat ribbon along a curve (chest frame), its width across in the curve's plane, away from `about`: a stiffened sash; its two
 *  edges handed back (for their gold). */
function ribbon(pts, w, about) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), N = 48, pos = [], idx = [], edges = [[], []];
  for (let i = 0; i <= N; i++) {
    const p = curve.getPoint(i / N), o = new THREE.Vector3(p.x - about[0], p.y - about[1], 0).normalize(), k = w * (0.75 + 0.25 * Math.sin((i / N) * PI));
    pos.push(p.x - o.x * k / 2, p.y - o.y * k / 2, p.z, p.x + o.x * k / 2, p.y + o.y * k / 2, p.z);
    edges[0].push([p.x - o.x * k / 2, p.y - o.y * k / 2, p.z]); edges[1].push([p.x + o.x * k / 2, p.y + o.y * k / 2, p.z]);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return { g, edges };
}
/** A gold knot (a ring round a ball) at a cloth's pin. */
const knot = (S, at, r) => { S.g.ball(r, { at, c: L.gold }, 14, 10); S.g.geo(new THREE.TorusGeometry(r * 1.25, r * 0.28, 8, 20), { at, c: L.bronze }); };

/** The cloth back pieces: their rest grids (chest frame), their pins and colours, and the rigid parts that carry them. */
const DRAPES = {
  knight(fr, S) {
    const K = CAPE_CLOTH.knight, C = K.cols, Rn = K.rows, out = [], hipW = Math.max(fr.pelvis.max.x, -fr.pelvis.min.x);
    const yHigh = fr.sy + fr.cap * 0.55, yLow = CRADLE.at[0] - (CRADLE.boss + 0.55), yB = fr.foot - fr.hip * 0.48;
    const zB = Math.min(fr.pelvis.min.z, fr.chest.min.z) - 0.4, yoke = [];
    for (let c = 0; c < C; c++) {
      const u = (c / (C - 1)) * 2 - 1, a = Math.abs(u), up = smooth((a - 0.3) / 0.62), y = yLow + (yHigh - yLow) * up;
      yoke.push([u * fr.sw * 1.02, y, -fr.depthAt(Math.min(y, CRADLE.at[0])) * (1 - 0.55 * up) - 0.18]);
    }
    for (let r = 0; r < Rn; r++) for (let c = 0; c < C; c++) {
      const v = r / (Rn - 1), u = (c / (C - 1)) * 2 - 1, [x0, y0, z0] = yoke[c];
      out.push([x0 + (u * Math.max(fr.sw * 1.3, hipW * 0.95) - x0) * v ** 0.8, y0 + (yB - y0) * v, z0 + (zB - z0) * Math.min(1, v * 1.6)]);
    }
    tube(S.g, yoke.map(([x, y, z]) => [x, y + 0.05, z]), 0.07 * fr.scl + 0.03, L.gold, 32); // (the yoke's rail, clasp to clasp under the cradle)
    for (const s of [-1, 1]) { const [x, y, z] = yoke[s < 0 ? 0 : C - 1]; S.g.ring(0.26 * fr.scl + 0.08, 0.06 * fr.scl + 0.02, { at: [x, y + 0.08, z + 0.05], c: L.gold }, 24, 6); S.l.ball(0.17 * fr.scl + 0.05, { at: [x, y + 0.12, z + 0.05], sc: [1, 0.6, 1], c: labTone(0.4, 0.2) }, 16, 10); } // (the clasps)
    return [{ ...K, rest: out, pins: [...Array(C).keys()], lining: LINING, colour: (c, r) => (c === 0 || c === C - 1 ? L.trimM : r % 4 === 3 ? L.trimM : L.trimL) }];
  },
  tenne(fr, S) {
    const K = CAPE_CLOTH.tenne, top = fr.sy + fr.cap, k = fr.scl, z0 = -fr.depthAt(fr.sy) * 0.85 - 0.12, zb = fr.jar.z - 0.95 - 0.3 * k;
    const lift = Math.max(fr.top + 1.1 * k, fr.jar.y + 1.1) - top;
    const loop = [[-fr.sw * 0.9, top * 0.97, z0], [-fr.sw * 1.05 - 0.3 * k, top + lift * 0.45, zb * 0.7], [-fr.sw * 0.6, top + lift * 0.9, zb], [0, top + lift, zb], [fr.sw * 0.6, top + lift * 0.9, zb], [fr.sw * 1.05 + 0.3 * k, top + lift * 0.45, zb * 0.7], [fr.sw * 0.9, top * 0.97, z0]];
    const R = ribbon(loop, 0.62 * k + 0.12, [0, top]);
    S.trim.geo(R.g, { c: L.trimL }); // (the stiffened loop behind the helm)
    for (const e of R.edges) tube(S.g, e, 0.025 + 0.015 * k, L.gold, 64); // (its gilt edges)
    const cloths = [], w = 0.5 * k + 0.12, len = top - (fr.foot - fr.hip * 0.72), Rn = K.rows;
    for (const s of [-1, 1]) {
      const ax = s * fr.sw * 0.9, ay = top * 0.97, rest = [];
      knot(S, [ax, ay, z0], 0.13 * k + 0.05);
      for (let r = 0; r < Rn; r++) for (let c = 0; c < K.cols; c++) rest.push([ax + s * 0.15 * r / Rn + SASH[c] * w, ay - (r * len) / (Rn - 1), z0 - 0.25 - r * 0.06]);
      cloths.push({ ...K, rest, pins: [...Array(K.cols).keys()], colour: () => L.trimL, part: (c) => (c === 0 || c === K.cols - 2 ? 2 : 0) }); // (its edges gilt)
    }
    return cloths;
  },
  kazebukuro(fr, S) {
    const K = CAPE_CLOTH.kazebukuro, k = fr.scl, base = fr.sy + fr.cap * 0.6, z0 = -fr.depthAt(fr.sy) * 0.8 - 0.15, zc = fr.jar.z - 1.1 - 0.5 * k;
    const ay = Math.max(fr.top + 1.6 * k, fr.jar.y + 1.4) - base + 0.8 * k, bulge = 0.9 * k + 0.3, rest = [];
    const path = (t) => new THREE.Vector3(-Math.cos(t) * (fr.sw * 0.95 + bulge * Math.sin(t)), base + Math.sin(t) * ay, z0 + Math.sin(t) ** 0.7 * (zc - z0));
    const T = new THREE.Vector3(), N1 = new THREE.Vector3(), N2 = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
    for (let r = 0; r < K.rows; r++) {
      const t = (r / (K.rows - 1)) * PI, p = path(t), rb = (0.1 + 0.62 * Math.sin(t) ** 0.6) * k + 0.08;
      T.subVectors(path(Math.min(PI, t + 0.01)), path(Math.max(0, t - 0.01))).normalize(); N1.crossVectors(Z, T).normalize(); N2.crossVectors(T, N1).normalize();
      for (let c = 0; c < K.cols; c++) { const f = (c / K.cols) * PI * 2; rest.push([p.x + rb * (Math.cos(f) * N1.x + Math.sin(f) * N2.x), p.y + rb * (Math.cos(f) * N1.y + Math.sin(f) * N2.y), p.z + rb * (Math.cos(f) * N1.z + Math.sin(f) * N2.z)]); }
    }
    for (const t of [0, PI]) knot(S, path(t).toArray(), 0.16 * k + 0.06);
    const last = (K.rows - 1) * K.cols, pins = [...Array(K.cols).keys(), ...Array(K.cols).keys()].map((c, i) => (i < K.cols ? c : last + c));
    return [{ ...K, rest, pins, wrap: true, colour: () => L.trimL, part: (c, r) => (r < 1 || r >= K.rows - 2 ? 2 : r % 4 === 2 ? 1 : 0) }]; // (gilt cuffs, banded in the body glaze)
  },
};

/** The back piece `id` worn on `body` (its old one taken off first); null takes it off. */
export function wearCape(body, id, scene) {
  body.cape?.dispose(); body.cape = null;
  if (!id || !CAPES[id] || !body.body || !body.core) return null;
  const fr = frameOf(body), j = body.joints, mats = body.mats, own = [], root = new THREE.Group(); root.name = 'mech-cape';
  j.chest.add(root);
  const halo = HALOS[id]?.(fr, mats, own); if (halo) root.add(halo.group);
  const cloths = [];
  if (DRAPES[id]) {
    const S = seg(), specs = DRAPES[id](fr, S);
    for (const k of ['p', 'trim', 'g', 'l']) if (S[k].pos.length) { const m = new THREE.Mesh(S[k].done(), mats[k]); m.name = `mech-cape.${id}.${k}`; m.castShadow = true; root.add(m); own.push(m); }
    const into = scene || body.game?.scene || body.group.parent || body.group;
    for (const sp of specs) cloths.push(new Cloth({ ...sp, mats: [mats.trim, mats.p, mats.g] }).attach(into));
  }
  const spheres = fr.spheres.map((s) => ({ ...s, c: new THREE.Vector3() }));
  const handle = {
    id, root, cloths, halo,
    update(dt = 1 / 60, seal = 0) {
      halo?.update(dt, seal);
      if (!cloths.length) return;
      let vis = root.visible && !!body.group.parent; for (let o = body.group; o && vis; o = o.parent) if (o.visible === false) vis = false;
      for (const s of spheres) s.c.copy(s.at).applyMatrix4(s.joint.matrixWorld);
      for (const C of cloths) { C.mesh.visible = vis; C.step(dt, j.chest.matrixWorld, spheres); }
    },
    dispose() {
      root.removeFromParent(); for (const m of own) m.geometry.dispose(); halo?.dispose?.(); for (const C of cloths) C.dispose();
    },
  };
  body.cape = handle;
  return handle;
}
