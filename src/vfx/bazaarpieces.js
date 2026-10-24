// ---------------------------------------------------------------------------------------
// THE BAZAAR'S PIECES (docs/plans/CASINO.md section 9; Dovina's handoff of 2026-10-15, items 3 to 5): the bodies of what is played at
// Raku's tables, each a template of triangles on the one atlas (vfx/bazaarfaces.js), and the batch that draws them all as one mesh.
//   - A CARD of the house deck: its face and the back, back to back, a hair apart.
//   - THE DICE: the standard set as real polyhedra (d4 tetrahedron, d6 cube, d8 octahedron, d10 the pentagonal trapezohedron, d12
//     dodecahedron, d20 icosahedron), each face mapped onto its cell, opposite faces summing to one more than the sides; `dieRest(sides,
//     value, yaw)` is the turn that lays a die on the cloth with that value up (the d4: that vertex up), and how high its middle sits.
//   - A CHIP (Raku's three values and the gold token), a ZODIAC TILE, the dealer's CUP, a CLOTH (felt, gold border, sigil).
//   - THE BATCH (`PieceBatch`): every piece of a table is an entry (a template, a matrix, a material slot); each frame the batch writes
//     them into one geometry with a group per slot (the paper, the glaze, the lit), so a table is three draw calls however many pieces,
//     and a click is a ray against that one mesh, its triangle telling which piece.
// Materials: one stock MeshStandardMaterial with a map (the kind the Throwing Room's kit and the ostraca already draw with, front side,
// opaque, no vertex colours, no instancing: its program), three instances told apart only by uniforms (roughness, metalness, emissive).
//
// Prior art: three.js's PolyhedronGeometry (the solids' vertices), the d10's trapezohedron worked from its planarity (apex height =
// ring height x (1 + cos 36°) / (1 - cos 36°)), Chessex's numbering, Tabletop Simulator's and Hearthstone's pieces drawn as one batch.
//
// GROWN 2026-10-15 (casino clarity pass, brief sections 2 and 5): SIZE TIERS (`TIER`, `tierScale`: XL 1.25x, L 1.0x, M 0.8x, S 0.6x of
// PIECE, by how much a piece matters to the mechanics: the thing you decide on is biggest), DIM TWINS (a trailing `dim` flag on a card,
// die or tile: the sunk twin cell, for what may not be touched now), and the SEAT PIECES: a seat token (its colour's shape standing up
// on a foot, never a flat round disk, so it is never read as one of Raku's chips) and a seat rim (a thin flat band in the seat colour
// under what a seat owns). The seat looks are vfx/seatlook.js's.
//   bazaarMaterials() -> { paper, glaze, lit }   cardTpl(i, w, h, dim)   dieTpl(sides, skin: '6', 'atk6', 'ash', k, dim)   dieRest(sides, value, yaw, out, k) -> lift   dieFace(sides, value) -> { n, up }
//   dieFaces(sides) -> [{ poly, m, n, value }] (the solid's faces, radius 1, no atlas)
//   chipTpl(kind, k)   tileTpl(n, state, k, dim)   cupTpl(r, h)   clothTpl(id, r)
//   TIER   tierScale(tier) -> k   new PieceBatch(materials)  .clear()  .add(tpl, matrix, slot, id)
//   .write()  .pick(raycaster) -> id   .mesh
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bazaarAtlas, CARD_BACK, D4_FACES, D4_CORNERS } from './bazaarfaces.js';

/** The sizes (metres: a table's pieces read from a seat's camera, so bigger than life by about three). */
export const PIECE = { card: { w: 0.2, h: 0.325, gap: 0.003 }, die: 0.072, chip: { r: 0.042, h: 0.011, segs: 14 }, tile: { w: 0.11, h: 0.165, d: 0.03 } };
/** The size tiers (brief section 2): a piece's scale by its importance. XL the thing you decide on, L the default, M a label's worth, S a hint's. */
export const TIER = { XL: 1.25, L: 1, M: 0.8, S: 0.6 };
/** A tier's scale (an unknown tier is L). */
export const tierScale = (tier) => TIER[tier] ?? 1;

let MATS = null;
/** The three materials (one program: their parameters are the stock map material's; only uniforms differ). */
export function bazaarMaterials() {
  if (MATS) return MATS;
  const tex = bazaarAtlas().tex, mk = (o) => new THREE.MeshStandardMaterial({ map: tex, ...o });
  MATS = { paper: mk({ name: 'bazaar-paper', roughness: 0.72, metalness: 0 }), glaze: mk({ name: 'bazaar-glaze', roughness: 0.22, metalness: 0.08 }),
    lit: mk({ name: 'bazaar-lit', roughness: 0.4, metalness: 0.05, emissive: 0x6a4a10, emissiveIntensity: 1 }) };
  return MATS;
}

// ------------------------------------------------------------------ templates: { pos, nrm, uv } (Float32Arrays, triangles)
function builder() {
  const pos = [], nrm = [], uv = [];
  return { tri(a, b, c, n, ua, ub, uc) { pos.push(...a, ...b, ...c); nrm.push(...n, ...n, ...n); uv.push(...ua, ...ub, ...uc); },
    quad(a, b, c, d, n, r) { const [u0, v0, u1, v1] = r; this.tri(a, b, c, n, [u0, v0], [u1, v0], [u1, v1]); this.tri(a, c, d, n, [u0, v0], [u1, v1], [u0, v1]); },
    done() { return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), uv: new Float32Array(uv), tris: pos.length / 9 }; } };
}
const TPL = new Map();
const memo = (key, make) => { let t = TPL.get(key); if (!t) TPL.set(key, (t = make())); return t; };

/** A card: face `i` up (+z), the back behind; its middle at the origin, its top at +y. */
export function cardTpl(i, w = PIECE.card.w, h = PIECE.card.h, dim = false) {
  return memo(`card:${i}:${w}:${h}:${dim}`, () => {
    const A = bazaarAtlas(), b = builder(), x = w / 2, y = h / 2, z = PIECE.card.gap / 2;
    b.quad([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], [0, 0, 1], A.card(i, dim));
    b.quad([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], [0, 0, -1], A.card(CARD_BACK, dim));
    return b.done();
  });
}

/** The solids' faces as polygons (outward, counter-clockwise from outside), each with its normal. */
function solid(sides) {
  if (sides === 4) { const V = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => new THREE.Vector3(...v).normalize()); return { V, faces: D4_FACES.map((f) => f.map((k) => V[k])) }; }
  if (sides === 10) {
    const c = Math.cos(Math.PI / 5), z = 0.1, H = (z * (1 + c)) / (1 - c), ring = [];
    for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5; ring.push(new THREE.Vector3(Math.cos(a), k % 2 ? -z : z, Math.sin(a))); }
    const T = new THREE.Vector3(0, H, 0), B = new THREE.Vector3(0, -H, 0), faces = [];
    for (let k = 0; k < 10; k += 2) faces.push([T, ring[(k + 2) % 10], ring[k + 1], ring[k]]); // (the upper kites: two raised corners by the apex, a lowered one at the tip)
    for (let k = 1; k < 10; k += 2) faces.push([B, ring[k], ring[(k + 1) % 10], ring[(k + 2) % 10]]); // (the lower, the other way about)
    const s = 1.05 / H; return { faces: faces.map((f) => f.map((v) => v.clone().multiplyScalar(s))) };
  }
  const geo = sides === 6 ? new THREE.BoxGeometry(1.15, 1.15, 1.15).toNonIndexed() : new ({ 8: THREE.OctahedronGeometry, 12: THREE.DodecahedronGeometry, 20: THREE.IcosahedronGeometry })[sides](1, 0);
  const p = geo.attributes.position, groups = new Map();
  for (let t = 0; t < p.count; t += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, t), b = new THREE.Vector3().fromBufferAttribute(p, t + 1), c = new THREE.Vector3().fromBufferAttribute(p, t + 2);
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize(), key = `${Math.round(n.x * 50)},${Math.round(n.y * 50)},${Math.round(n.z * 50)}`;
    let gr = groups.get(key); if (!gr) groups.set(key, (gr = { n, vs: [] }));
    for (const v of [a, b, c]) if (!gr.vs.some((w) => w.distanceToSquared(v) < 1e-4)) gr.vs.push(v);
  }
  geo.dispose();
  const faces = [...groups.values()].map(({ n, vs }) => { const m = vs.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(vs.length), e1 = vs[0].clone().sub(m).normalize(), e2 = n.clone().cross(e1); return vs.slice().sort((u, w) => Math.atan2(u.clone().sub(m).dot(e2), u.clone().sub(m).dot(e1)) - Math.atan2(w.clone().sub(m).dot(e2), w.clone().sub(m).dot(e1))); });
  return { faces };
}
const DIE = new Map();
/** A die's faces in their numbering: [{ poly, m, n, value }] (opposite faces sum to sides + 1; the d4's face f is opposite vertex f), radius 1;
 *  the solids every die of the game is cut from (the stones' dice on the vessel too: vfx/vesseldice.js). */
export function dieFaces(sides) {
  let D = DIE.get(sides); if (D) return D;
  const { faces, V } = solid(sides), out = faces.map((poly) => { const m = poly.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(poly.length); return { poly, m, n: poly[1].clone().sub(poly[0]).cross(poly[2].clone().sub(poly[0])).normalize() }; });
  if (sides === 4) out.forEach((f, k) => { f.value = k + 1; f.up = V[k]; });
  else { let next = 1; for (const f of out) { if (f.value) continue; const o = out.find((g) => !g.value && g !== f && g.n.dot(f.n) < -0.99); f.value = next; if (o) o.value = sides + 1 - next; next++; } }
  DIE.set(sides, (D = out)); return D;
}
/** A die of `sides` in a skin ('4', 'atk6', ...: bazaarfaces.js DIE_SKINS), radius PIECE.die. */
export function dieTpl(sides, skin = String(sides), k = 1, dim = false) {
  return memo(`die:${skin}:${sides}:${k}:${dim}`, () => { // (the spent skin is one cell for every size: keyed by both)
    const A = bazaarAtlas(), b = builder(), R = PIECE.die * k, F = dieFaces(sides);
    for (const f of F) {
      const [u0, v0, u1, v1] = A.die(skin, f.value - 1, dim), cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, hu = (u1 - u0) / 2, hv = (v1 - v0) / 2;
      const P = f.poly.map((v) => v.clone().multiplyScalar(R).toArray());
      let U;
      if (sides === 4) U = D4_CORNERS.map(([x, y]) => [u0 + x * (u1 - u0), v1 - y * (v1 - v0)]);
      else {
        const e1 = f.poly[0].clone().sub(f.m).normalize(), e2 = f.n.clone().cross(e1), rad = Math.max(...f.poly.map((v) => v.distanceTo(f.m)));
        U = f.poly.map((v) => { const d = v.clone().sub(f.m); return [cu + (d.dot(e2) / rad) * hu * 0.98, cv - (d.dot(e1) / rad) * hv * 0.98]; }); // (the face's first vertex at the cell's foot: its numeral upright toward the face's top)
      }
      for (let k = 1; k < P.length - 1; k++) b.tri(P[0], P[k], P[k + 1], f.n.toArray(), U[0], U[k], U[k + 1]);
    }
    return b.done();
  });
}
/** Where `value` is read on a die, in its template's frame: `n` the way the face looks out (the d4: its vertex), `up` the way its numeral
 *  stands on the face (from its foot vertex, as dieTpl maps it; null on the d4, read at the vertex). Both unit vectors, fresh. */
export function dieFace(sides, value) {
  const F = dieFaces(sides), f = F.find((x) => x.value === value) || F[0];
  if (sides === 4) return { n: f.up.clone().normalize(), up: null };
  return { n: f.n.clone(), up: f.m.clone().sub(f.poly[0]).projectOnPlane(f.n).normalize() };
}
const _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _qy = new THREE.Quaternion(), _v = new THREE.Vector3();
/** The turn that rests a die with `value` read on top (the d4: its vertex up), turned `yaw` about the vertical; returns the height its
 *  middle sits above the cloth. */
export function dieRest(sides, value, yaw, out = new THREE.Quaternion(), k = 1) {
  const F = dieFaces(sides), f = F.find((x) => x.value === value) || F[0];
  if (sides === 4) _q.setFromUnitVectors(_v.copy(f.up).normalize(), _up); else _q.setFromUnitVectors(f.n, _up);
  out.copy(_qy.setFromAxisAngle(_up, yaw)).multiply(_q);
  let low = 0; for (const g of F) for (const v of g.poly) low = Math.min(low, _v.copy(v).multiplyScalar(PIECE.die * k).applyQuaternion(out).y);
  return -low;
}

/** A chip: a short cylinder, its edge striped and its top the value's face; its foot at y 0. */
export function chipTpl(kind, k = 1) {
  return memo(`chip:${kind}:${k}`, () => {
    const A = bazaarAtlas(), b = builder(), { segs } = PIECE.chip, r = PIECE.chip.r * k, h = PIECE.chip.h * k, [t0, tv0, t1, tv1] = A.chip(kind, 'top'), [e0, ev0, e1, ev1] = A.chip(kind, 'edge');
    for (let k = 0; k < segs; k++) {
      const a0 = (k / segs) * Math.PI * 2, a1 = ((k + 1) / segs) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), am = (a0 + a1) / 2;
      const ua = e0 + ((k % 4) / 4) * (e1 - e0), ub = e0 + (((k % 4) + 1) / 4) * (e1 - e0);
      b.quad([r * c0, 0, r * s0], [r * c1, 0, r * s1], [r * c1, h, r * s1], [r * c0, h, r * s0], [Math.cos(am), 0, Math.sin(am)], [ua, ev0, ub, ev1]);
      const cu = (t0 + t1) / 2, cv = (tv0 + tv1) / 2, hu = (t1 - t0) / 2, hv = (tv1 - tv0) / 2;
      b.tri([0, h, 0], [r * c1, h, r * s1], [r * c0, h, r * s0], [0, 1, 0], [cu, cv], [cu + c1 * hu, cv - s1 * hv], [cu + c0 * hu, cv - s0 * hv]);
    }
    return b.done();
  });
}

/** A Zodiac tile standing: its face (`state` 'open' | 'locked') toward +z, the back behind, its foot at y 0. */
export function tileTpl(n, state = 'open', k = 1, dim = false) {
  return memo(`tile:${n}:${state}:${k}:${dim}`, () => {
    const A = bazaarAtlas(), b = builder(), w = PIECE.tile.w * k, h = PIECE.tile.h * k, d = PIECE.tile.d * k, x = w / 2, z = d / 2, side = A.tile(n, 'back', dim), rim = [side[0], side[1], side[0] + (side[2] - side[0]) * 0.1, side[3]];
    b.quad([-x, 0, z], [x, 0, z], [x, h, z], [-x, h, z], [0, 0, 1], A.tile(n, state, dim));
    b.quad([x, 0, -z], [-x, 0, -z], [-x, h, -z], [x, h, -z], [0, 0, -1], side);
    b.quad([-x, h, z], [x, h, z], [x, h, -z], [-x, h, -z], [0, 1, 0], rim);
    b.quad([x, 0, z], [x, 0, -z], [x, h, -z], [x, h, z], [1, 0, 0], rim);
    b.quad([-x, 0, -z], [-x, 0, z], [-x, h, z], [-x, h, -z], [-1, 0, 0], rim);
    return b.done();
  });
}

/** The dealer's cup, upturned over a hidden die (or upright, `open`): a truncated cone, its foot at y 0. */
export function cupTpl(r = 0.075, h = 0.11, open = false) {
  return memo(`cup:${r}:${h}:${open}`, () => {
    const A = bazaarAtlas(), b = builder(), [u0, v0, u1, v1] = A.cup(), segs = 16, rb = open ? r * 0.8 : r, rt = open ? r : r * 0.8;
    for (let k = 0; k < segs; k++) {
      const a0 = (k / segs) * Math.PI * 2, a1 = ((k + 1) / segs) * Math.PI * 2, am = (a0 + a1) / 2, s = (rb - rt) / h;
      const n = new THREE.Vector3(Math.cos(am), s, Math.sin(am)).normalize().toArray(), ua = u0 + (k / segs) * (u1 - u0), ub = u0 + ((k + 1) / segs) * (u1 - u0);
      b.quad([rb * Math.cos(a0), 0, rb * Math.sin(a0)], [rb * Math.cos(a1), 0, rb * Math.sin(a1)], [rt * Math.cos(a1), h, rt * Math.sin(a1)], [rt * Math.cos(a0), h, rt * Math.sin(a0)], n, [ua, v0, ub, v1]);
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
      if (!open) b.tri([0, h, 0], [rt * Math.cos(a1), h, rt * Math.sin(a1)], [rt * Math.cos(a0), h, rt * Math.sin(a0)], [0, 1, 0], [cu, cv], [cu, v1], [cu, v1]);
      else { const ri = rb * 0.92; b.quad([rb * Math.cos(a0), 0.006, rb * Math.sin(a0)], [ri * Math.cos(a0), 0.006, ri * Math.sin(a0)], [ri * Math.cos(a1), 0.006, ri * Math.sin(a1)], [rb * Math.cos(a1), 0.006, rb * Math.sin(a1)], [0, 1, 0], [u0, v0, u0, v0]); }
    }
    return b.done();
  });
}

/** A table's cloth: a disk of radius `r` facing up at y 0, its cell (felt, gold border, the game's sigil) laid square on it. */
export function clothTpl(id, r) {
  return memo(`cloth:${id}:${r}`, () => {
    const A = bazaarAtlas(), b = builder(), [u0, v0, u1, v1] = A.cloth(id), cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, hu = (u1 - u0) / 2, hv = (v1 - v0) / 2, segs = 48;
    for (let k = 0; k < segs; k++) {
      const a0 = (k / segs) * Math.PI * 2, a1 = ((k + 1) / segs) * Math.PI * 2;
      b.tri([0, 0, 0], [r * Math.cos(a1), 0, r * Math.sin(a1)], [r * Math.cos(a0), 0, r * Math.sin(a0)], [0, 1, 0], [cu, cv], [cu + Math.cos(a1) * hu * 0.995, cv - Math.sin(a1) * hv * 0.995], [cu + Math.cos(a0) * hu * 0.995, cv - Math.sin(a0) * hv * 0.995]);
    }
    return b.done();
  });
}

// ------------------------------------------------------------------ the batch
const _m3 = new THREE.Matrix3(), _p = new THREE.Vector3(), _n = new THREE.Vector3();
/** Every piece of a table as one mesh: entries written each frame into one geometry, a group a material slot (0 paper, 1 glaze, 2 lit). */
export class PieceBatch {
  constructor(mats) {
    this.mats = mats; this.list = []; this.cap = 0; this.ranges = [];
    this.geo = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geo, [mats.paper, mats.glaze, mats.lit]);
    this.mesh.frustumCulled = false; this.mesh.receiveShadow = true; this.mesh.castShadow = false; this.mesh.matrixAutoUpdate = true;
    this.grow(2048);
  }
  grow(n) {
    this.cap = n; const mk = (k) => new THREE.BufferAttribute(new Float32Array(n * k), k).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', mk(3)); this.geo.setAttribute('normal', mk(3)); this.geo.setAttribute('uv', mk(2));
  }
  clear() { this.list.length = 0; }
  /** A piece: its template, its matrix (the table's own frame; kept by reference, so moving it moves the piece), its slot, its id. */
  add(tpl, matrix, slot, id) { this.list.push({ tpl, matrix, slot, id }); }
  /** Everything into the geometry, the paper's first, the glaze's, the lit's (a group each). */
  write() {
    const L = this.list, total = L.reduce((s, e) => s + e.tpl.tris * 3, 0);
    if (total > this.cap) this.grow(Math.ceil(total * 1.5));
    const P = this.geo.attributes.position, N = this.geo.attributes.normal, U = this.geo.attributes.uv;
    let v = 0; this.geo.clearGroups(); this.ranges.length = 0;
    for (let slot = 0; slot < 3; slot++) {
      const start = v;
      for (const e of L) {
        if (e.slot !== slot) continue;
        const t = e.tpl, m = e.matrix; _m3.getNormalMatrix(m);
        this.ranges.push(v / 3, e.id);
        for (let i = 0; i < t.tris * 3; i++, v++) {
          _p.fromArray(t.pos, i * 3).applyMatrix4(m); P.array[v * 3] = _p.x; P.array[v * 3 + 1] = _p.y; P.array[v * 3 + 2] = _p.z;
          _n.fromArray(t.nrm, i * 3).applyMatrix3(_m3).normalize(); N.array[v * 3] = _n.x; N.array[v * 3 + 1] = _n.y; N.array[v * 3 + 2] = _n.z;
          U.array[v * 2] = t.uv[i * 2]; U.array[v * 2 + 1] = t.uv[i * 2 + 1];
        }
      }
      if (v > start) this.geo.addGroup(start, v - start, slot);
    }
    this.geo.setDrawRange(0, v);
    for (const a of [P, N, U]) { a.needsUpdate = true; a.clearUpdateRanges?.(); a.addUpdateRange?.(0, v * a.itemSize); }
    this.geo.boundingSphere ||= new THREE.Sphere(new THREE.Vector3(), 4);
  }
  /** The id of the piece a ray meets first (or null). */
  pick(ray) {
    const hit = ray.intersectObject(this.mesh, false)[0]; if (!hit) return null;
    const f = hit.faceIndex, R = this.ranges; let id = null;
    for (let k = 0; k < R.length; k += 2) { if (R[k] > f) break; id = R[k + 1]; }
    return id;
  }
}
