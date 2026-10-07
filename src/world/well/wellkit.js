// ---------------------------------------------------------------------------------------
// THE WELL'S KIT: one floor of a Well, built from its plan (welllayout.js) and taken down again whole. A Well drifts daily
// (wellSeed(well, day): progress/econ/islands.js), so its floors are not part of the static level merged at boot (level.js): each is
// built when the Courier arrives on it and disposed of when they leave it (one group, one fixed body, so nothing is left behind).
//
// Since the Dunemaw was made big (docs/plans/DUNEMAW.md): 5 by 5 cells of 14 m in two tiers 6 m apart, halls of 2 by 2 cells open to
// the dark, slope cells of sand between the tiers, the floor swirled about its centre (a swirl turns and shears by as much: walls are cut
// into pieces of at most 3.5 m, each laid between its two swirled ends; the sand and the ceilings are grids of swirled points), sand in
// every room (wellsand.js) as one trimesh collider and one merged mesh for the floor (no slab under it: the sand is the floor), walls
// taller by the sand they hold, and sandfalls on side passages (wellshift.js). Since R45 (the owner: "too boxy and sterile", "proper
// archways", "mesh skirts"): the walls and pillars are drawn rough (rock.js: a noisy skin on a box collider, smooth-shaded), every doorway
// is a round ARCH (jambs, a stepped ring and pilasters standing proud of both faces: the Romanesque portal, the archivolt over a door in
// a thick wall), and each room's sand hangs a SKIRT a metre down its edges, the terrain trick for hiding the seams between patches
// (Ulrich's chunked LOD, 2002: a skirt under every chunk's edge). Since R46 (the owner: "expertly designed rooms ... prefab rooms that
// can be chained together") each room is one of a dozen designs (prefabs.js: a processional, the narrows, a cloister, a gallery, a
// shrine, a pylon gate, three halls...), turned to its doorways and paced along the path; the sand lies low round their pieces. The way in (a pale pool:
// the way up, back out of the Well) and the way down (a dark one, turning) are pools of Lachryma on the sand.
//
// Dressed in the Great Dunemaw's kit (vfx/dunemawkit.js: bismuth walls, its sand `K.sand` when it has one) and its pool (vfx/dunemaw.js):
// Calissa's.
//
//   layoutFloor(seed, floor) (welllayout.js)
//   buildFloor(game, layout, origin, floor) -> { group, cells (each with its design `tpl` and `spots`: [{ kind, pos }]), path, arrive: { pos, yaw }, up, down, moveDown(cell), sandfalls, door(c, r, side), open(c, r, side), cellAt(x, z),
//     ground(x, z, top?), update(dt), dispose() }       (origin: the grid's north-west corner, at the upper tier's floor)
//   GRID (cells a side), CELL (metres a cell), WALL_H
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { triplanar, surfaceTexture } from '../../render/triplanar.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../../render/outline.js';
import { dunemawKit } from '../../vfx/dunemawkit.js';
import { DunemawMouth } from '../../vfx/dunemaw.js';
import { layoutFloor, swirl, GRID, CELL, WALL_H, DOOR, DOOR_H, SIDES, OPP } from './welllayout.js';
import { roomSand, BASE } from './wellsand.js';
import { Sandfalls } from './wellshift.js';
import { roughen, segments } from './rock.js';
import { chooseRooms, roomPieces, TALL } from './prefabs.js';
import { seeded } from '../../core/rng.js';

export { layoutFloor, GRID, CELL, WALL_H };
const WT = 0.5, SLAB = 0.5, PIECE = 3.5, HALF = (GRID * CELL) / 2;
/** How much taller a floor's walls stand than WALL_H, for the sand banked against them (wellsand.js: drifts to 1.2, 1.8 and 2.2 m, dunes
 *  on top): the wall above the highest sand stays out of a hang's reach (core/config.js hang.maxTop 2.95), as it was on bare floors. */
const LIFT = [1.5, 2.5, 3];
/** A doorway's arch (metres): the jambs inside the hole, the springing line, the ring's width. The opening is DOOR - 2 jambs wide and
 *  round-headed, its crown at DOOR_H (the hole's top), so the wall's own pieces need not change. */
const ARCH = { jamb: 0.5, spring: DOOR_H - (DOOR / 2 - 0.5), ring: 0.45 };
const SKIRT = 1; // (metres a room's sand hangs down its edges, out of sight under the next room's)
const UP = new THREE.Vector3(0, 1, 0);
// (the sand is one trimesh a room: without this a character catches on the edges between its triangles, and a walk up a slope stalls
// to a crawl every few metres. Rapier, after Bullet's btAdjustInternalEdgeContacts: contacts on an inner edge take the faces' normal)
const TRI_FLAGS = RAPIER.TriMeshFlags?.FIX_INTERNAL_EDGES ?? 0;

/** One floor, built at `origin` (the north-west corner of the grid, at the upper tier's floor level). */
export function buildFloor(game, layout, origin, floor = 1) {
  const W = game.physics.world, body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const group = new THREE.Group(); group.name = `well-floor-${floor}`; group.userData.zone = 'well';
  const WH = WALL_H + (LIFT[floor - 1] ?? LIFT[LIFT.length - 1]); // (this floor's walls, sand allowed for)
  chooseRooms(layout, seeded((layout.seed ^ Math.imul(floor, 0x2c1b3c6d)) >>> 0)); // (each room's design, paced along the path: prefabs.js)
  const deep = (floor - 1) / 2, tint = (hex, k = 1) => new THREE.Color(hex).lerp(new THREE.Color(0x3a2350), deep * 0.55 * k).getHex();
  const sets = { floor: [], wall: [], ceil: [], deco: [], arch: [] }, sandGeos = [];
  const C = { x: origin.x + HALF, z: origin.z + HALF }, Y = origin.y, sw = swirl(layout.twist), unsw = swirl(layout.twist, { back: true }), bend = layout.twist > 0;
  const cellAt = new Map(layout.cells.map((k) => [`${k.c},${k.r}`, k]));
  const get = (c, r) => cellAt.get(`${c},${r}`);
  const mid = (cell) => ({ x: (cell.c + 0.5) * CELL - HALF, z: (cell.r + 0.5) * CELL - HALF }); // (grid metres from the floor's centre)
  /** A point of the plan (grid metres from the centre) where it stands in the world, and the angle turned there. */
  const place = (gx, gz) => { const p = sw(gx, gz); return { x: C.x + p.x, z: C.z + p.z, a: p.a }; };
  /** A box of the plan, cut into pieces of at most 3.5 m along its length, each laid between the two swirled ends of its own stretch: the
   *  swirl turns and shears (by as much as it turns), so a piece follows the bent line it stands on and its neighbours meet it end to end. */
  const box = (gx, cy, gz, sx, sy, sz, set = 'wall', collide = true, rough = set === 'wall' || set === 'deco') => {
    const alongX = sx >= sz, L = alongX ? sx : sz, Wd = alongX ? sz : sx, n = bend ? Math.max(1, Math.ceil(L / PIECE)) : 1;
    for (let i = 0; i < n; i++) {
      const t0 = -L / 2 + (i * L) / n, t1 = t0 + L / n;
      const p0 = place(gx + (alongX ? t0 : 0), gz + (alongX ? 0 : t0)), p1 = place(gx + (alongX ? t1 : 0), gz + (alongX ? 0 : t1));
      const dx = p1.x - p0.x, dz = p1.z - p0.z, len = Math.hypot(dx, dz) + (n > 1 ? 0.1 : 0), mx = (p0.x + p1.x) / 2, mz = (p0.z + p1.z) / 2;
      const th = alongX ? Math.atan2(-dz, dx) : Math.atan2(dx, dz); // (rotateY: the box's long axis onto the chord)
      const bx = alongX ? len : Wd, bz = alongX ? Wd : len;
      const g = (rough ? new THREE.BoxGeometry(bx, sy, bz, segments(bx), segments(sy), segments(bz)) : new THREE.BoxGeometry(bx, sy, bz)).toNonIndexed();
      g.deleteAttribute('uv'); g.rotateY(th); g.translate(mx, cy, mz); if (rough) roughen(g, { seed: floor }); sets[set].push(g);
      if (collide) W.createCollider(RAPIER.ColliderDesc.cuboid((alongX ? len : Wd) / 2, sy / 2, (alongX ? Wd : len) / 2).setTranslation(mx, cy, mz)
        .setRotation(new THREE.Quaternion().setFromAxisAngle(UP, th)).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
    }
  };
  /** A sheet of the plan (a ceiling, the sand): a grid of points over a rectangle, each swirled, its height from `y(gx, gz)`; drawn in `set`
   *  (or returned) and made a trimesh collider of the same triangles. */
  const sheet = (gx, gz, size, n, y, flip = false, skirt = 0) => {
    const pos = new Float32Array(n * n * 3), idx = new Uint32Array((n - 1) * (n - 1) * 6), h0 = -size / 2, st = size / (n - 1);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const lx = h0 + i * st, lz = h0 + j * st, p = place(gx + lx, gz + lz), k = (j * n + i) * 3; pos[k] = p.x; pos[k + 1] = y(lx, lz); pos[k + 2] = p.z; }
    let q = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, d = a + n, e = d + 1; if (flip) idx.set([a, b, d, b, e, d], q); else idx.set([a, d, b, b, d, e], q); q += 6; }
    W.createCollider(RAPIER.ColliderDesc.trimesh(pos, idx, TRI_FLAGS).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    const out = g.toNonIndexed(); g.dispose();
    return skirt ? mergeGeometries([out, skirtOf(pos, n, skirt, place(gx, gz))], false) : out;
  };
  /** A sheet's skirt: a strip hung `depth` down from its edge, each quad turned to face out of the room (drawn only, never collided). */
  const skirtOf = (pos, n, depth, c) => {
    const ring = [];
    for (let i = 0; i < n - 1; i++) ring.push(i); // (north edge, then east, south and west, as sample indices)
    for (let j = 0; j < n - 1; j++) ring.push(j * n + n - 1);
    for (let i = n - 1; i > 0; i--) ring.push((n - 1) * n + i);
    for (let j = n - 1; j > 0; j--) ring.push(j * n);
    const out = new Float32Array(ring.length * 18), v = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
    ring.forEach((k, q) => {
      const a = v(k), b = v(ring[(q + 1) % ring.length]), a2 = [a[0], a[1] - depth, a[2]], b2 = [b[0], b[1] - depth, b[2]];
      // (the quad's facing: (b - a) x down; flipped if it looks into the room rather than out of it)
      const ex = b[0] - a[0], ez = b[2] - a[2], nx = -ez, nz = ex, ox = (a[0] + b[0]) / 2 - c.x, oz = (a[2] + b[2]) / 2 - c.z;
      const tri = nx * ox + nz * oz >= 0 ? [a, a2, b, b, a2, b2] : [a, b, a2, b, b2, a2];
      tri.forEach((p, i) => out.set(p, q * 18 + i * 3));
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); g.computeVertexNormals();
    return g;
  };
  /** The arches' two shapes, extruded once a floor: the FRAME (jambs and spandrels filling the hole round a round-headed opening) and the
   *  RING (the archivolt over it and its pilasters down to the floor, deeper, so it stands proud of both faces of the wall). */
  const archGeo = (() => {
    const r = DOOR / 2 - ARCH.jamb, sp = ARCH.spring, Wd = DOOR / 2 + 0.3, top = DOOR_H + 0.3, R2 = r + ARCH.ring;
    const frame = new THREE.Shape(); frame.moveTo(-Wd, 0); frame.lineTo(-r, 0); frame.lineTo(-r, sp); frame.absarc(0, sp, r, Math.PI, 0, true);
    frame.lineTo(r, 0); frame.lineTo(Wd, 0); frame.lineTo(Wd, top); frame.lineTo(-Wd, top); frame.closePath();
    const ring = new THREE.Shape(); ring.moveTo(-R2, 0); ring.lineTo(-R2, sp); ring.absarc(0, sp, R2, Math.PI, 0, true); ring.lineTo(R2, 0);
    ring.lineTo(r, 0); ring.lineTo(r, sp); ring.absarc(0, sp, r, 0, Math.PI, false); ring.lineTo(-r, 0); ring.closePath();
    const ex = (shape, depth) => { let g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 7 }); if (g.index) g = g.toNonIndexed(); g.deleteAttribute('uv'); g.translate(0, 0, -depth / 2); return g; };
    return { frame: ex(frame, WT + 0.5), ring: ex(ring, WT + 0.9), r, sp };
  })();
  /** A collider box in a doorway's own frame (x along the wall, z through it), turned by `th` about the doorway's middle `pc`. */
  const doorBox = (pc, y0, th, cx, cy, sx, sy, sz) => {
    const c = Math.cos(th), s = Math.sin(th);
    W.createCollider(RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2).setTranslation(pc.x + cx * c, y0 + cy, pc.z - cx * s)
      .setRotation(new THREE.Quaternion().setFromAxisAngle(UP, th)).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
  };
  /** The arch in a doorway whose middle is (gx, gz) of the plan, its sill at y0, in a wall running along x (alongX) or along z. */
  const arch = (gx, gz, y0, alongX) => {
    const p0 = place(gx - (alongX ? 1 : 0), gz - (alongX ? 0 : 1)), p1 = place(gx + (alongX ? 1 : 0), gz + (alongX ? 0 : 1)), pc = place(gx, gz);
    const th = Math.atan2(-(p1.z - p0.z), p1.x - p0.x);
    for (const part of ['frame', 'ring']) { const g = archGeo[part].clone(); g.rotateY(th); g.translate(pc.x, y0, pc.z); sets.arch.push(g); }
    // its colliders: the jambs (and the pilasters before them) from the sill to the crown, and two steps under each spandrel
    const { r, sp } = archGeo, hw = DOOR / 2, d = WT + 0.9;
    for (const k of [-1, 1]) {
      doorBox(pc, y0, th, k * (r + hw) / 2, DOOR_H / 2, hw - r, DOOR_H, d);
      doorBox(pc, y0, th, k * (0.6 * r + hw) / 2, (sp + 0.8 * r + DOOR_H) / 2, hw - 0.6 * r, DOOR_H - sp - 0.8 * r, WT + 0.5);
      doorBox(pc, y0, th, k * (0.9 * r + hw) / 2, (sp + 0.44 * r + DOOR_H) / 2, hw - 0.9 * r, DOOR_H - sp - 0.44 * r, WT + 0.5);
    }
  };
  const level = (cell) => cell.level; // (a slope cell's lower tier)
  const top = (cell) => (cell.slope ? Math.max(cell.slope.fromLevel, cell.slope.toLevel) : cell.level) + WH * (cell.hall != null ? 1.6 : 1);
  /** A wall along one side of a cell, shared with the neighbour there (built once): whole, or with a doorway and what is above and below it. */
  const wall = (cell, side) => {
    const [dx, dz] = SIDES[side], other = get(cell.c + dx, cell.r + dz);
    if (other && cell.hall != null && cell.hall === other.hall) return; // (inside a hall: no wall)
    const m = mid(cell), along = dz !== 0, wx = m.x + (dx * CELL) / 2, wz = m.z + (dz * CELL) / 2, len = CELL + WT;
    const lo = Y + Math.min(level(cell), other ? level(other) : Infinity) - SLAB, hi = Y + Math.max(top(cell), other ? top(other) : -Infinity);
    const piece = (o, l, y0, y1) => { if (y1 - y0 < 0.05) return; const h = y1 - y0, yc = (y0 + y1) / 2; if (along) box(wx + o, yc, wz, l, h, WT); else box(wx, yc, wz + o, WT, h, l); };
    if (!cell.doors.has(side)) { piece(0, len, lo, hi); return; }
    const doorY = Y + layout.levelAt(cell, side), sideLen = (len - DOOR) / 2, off = DOOR / 2 + sideLen / 2;
    piece(-off, sideLen, lo, hi); piece(off, sideLen, lo, hi);
    piece(0, DOOR, lo, doorY); piece(0, DOOR, doorY + DOOR_H, hi);
    arch(wx, wz, doorY, along);
  };
  // ---- the cells: their floors, ceilings, walls, what stands in them, and a lamp
  const lit = new Set();
  for (const cell of layout.cells) {
    const m = mid(cell), y = Y + level(cell);
    if (cell.hall == null) sets.ceil.push(sheet(m.x, m.z, CELL, 5, () => Y + top(cell), true)); // (seen from below; a hall is open to the dark. No floor: the sand is the floor)
    wall(cell, 'n'); wall(cell, 'w');
    if (!get(cell.c + 1, cell.r)) wall(cell, 'e');
    if (!get(cell.c, cell.r + 1)) wall(cell, 's');
    // a lamp in each room (one a hall), dim, warmer near the top of the Well
    const key = cell.hall != null ? `h${cell.hall}` : `${cell.c},${cell.r}`;
    if (lit.has(key)) continue;
    lit.add(key);
    const lm = cell.hall != null ? hallMid(layout.halls[cell.hall]) : m, lp = place(lm.x, lm.z);
    const l = new THREE.PointLight(new THREE.Color(0xffa066).lerp(new THREE.Color(0xa070ff), deep), cell.hall != null ? 20 : 14, CELL * (cell.hall != null ? 2.2 : 1.4), 1.2);
    l.position.set(lp.x, Y + level(cell) + WH - 0.6, lp.z); group.add(l);
    game.lights?.adopt(l); // (a proxy now, not at the budget's next scan: a real light for even one frame recompiles every material in view)
  }
  // ---- the sand: a heightfield a room (a hall is one room), the same samples drawn as one mesh for the floor
  const rooms = [];
  for (const cell of layout.cells) if (cell.hall == null) rooms.push({ cells: [cell], m: mid(cell), size: CELL, cell });
  layout.halls.forEach((h, id) => rooms.push({ cells: layout.cells.filter((k) => k.hall === id), m: hallMid(h), size: 2 * CELL, cell: layout.cells.find((k) => k.hall === id) }));
  const sandOf = new Map(), spotsOf = new Map();
  for (const room of rooms) {
    const { m, size, cell } = room, doors = [], pools = [];
    for (const k of room.cells) {
      const km = mid(k);
      for (const s of k.doors) { const [dx, dz] = SIDES[s], o = get(k.c + dx, k.r + dz); if (o && o.hall != null && o.hall === k.hall) continue; doors.push({ x: km.x - m.x + (dx * CELL) / 2, z: km.z - m.z + (dz * CELL) / 2 }); }
      if (k === layout.start || k === layout.exit) pools.push({ x: km.x - m.x, z: km.z - m.z });
    }
    // the room's design: its pieces (rough, like the walls), where the sand is kept low for them, and its spots
    const hall = cell.hall != null, design = hall ? layout.halls[cell.hall].tpl : cell.tpl;
    const D = roomPieces(design, cell.turn, hall ? doors.map((d) => [d.x, d.z]) : null), y = Y + cell.level, high = top(cell) - cell.level;
    for (const p of D.pieces) { const h = p.h === TALL ? high : p.h; box(m.x + p.x, y + h / 2, m.z + p.z, p.w, h, p.d, 'deco'); }
    const clear = [...D.flat, ...D.pieces.filter((p) => p.kind !== 'pillar').map((p) => ({ x: p.x, z: p.z, r: Math.hypot(p.w, p.d) / 2 + 0.4 }))];
    const sl = cell.slope, ramp = sl ? { from: sl.from, hFrom: sl.fromLevel - cell.level, hTo: sl.toLevel - cell.level } : null;
    const S = roomSand({ seed: (layout.seed ^ Math.imul(floor, 0x9e3779b1) ^ Math.imul(cell.c * 7 + cell.r + 1, 0x85ebca6b)) >>> 0, floor, size, doors, pools, ramp, clear });
    const yb = Y + cell.level;
    sandGeos.push(sheet(m.x, m.z, S.size, S.n, (lx, lz) => yb + S.at(lx, lz), false, SKIRT));
    for (const k of room.cells) sandOf.set(k, { S, m, yb });
    spotsOf.set(cell, D.spots.map((o) => { const p = place(m.x + o.x, m.z + o.z), on = D.pieces.find((q) => Math.abs(q.x - o.x) < q.w / 2 && Math.abs(q.z - o.z) < q.d / 2);
      return { kind: o.kind, pos: new THREE.Vector3(p.x, on ? y + (on.h === TALL ? high : on.h) : yb + S.at(o.x, o.z), p.z) }; })); // (on a piece's top where one stands there)
  }
  // ---- what is drawn: one mesh a set (the kit's materials, shared by every floor), and one of sand
  const K = (game.dunemawKit ||= (() => { const k = dunemawKit({ env: game.sky?.env }); for (const mm of [k.wall, k.floor, k.trim, k.sand].filter(Boolean)) mm.userData.shared = true; return k; })());
  const COL = { floor: tint(PALETTE.floor), wall: tint(PALETTE.wall), ceil: tint(PALETTE.deep, 0.5), deco: tint(PALETTE.mid) };
  for (const [set, geos] of Object.entries(sets)) {
    if (!geos.length) continue;
    let merged = mergeGeometries(geos, false); for (const g of geos) g.dispose();
    if (set === 'wall' || set === 'deco') { // (rock: one skin, its normals smoothed over the seams and the boxes' edges, so a wall reads as cut stone, not as a box)
      merged.deleteAttribute('normal'); const welded = mergeVertices(merged, 1e-3); merged.dispose(); merged = welded; merged.computeVertexNormals();
    }
    const mesh = new THREE.Mesh(merged, set === 'floor' ? K.floor : set === 'ceil' || set === 'arch' ? K.trim : set === 'wall' || set === 'deco' ? K.wall : game.level.mat(COL[set]));
    mesh.receiveShadow = true; mesh.castShadow = set === 'deco' || set === 'arch';
    if (set === 'wall' || set === 'deco' || set === 'arch') addOutline(mesh); // (the floor lies under the sand; the ceiling is seen from below only)
    group.add(mesh);
  }
  const sandMat = K.sand || (game.wellSandMat ||= Object.assign(new THREE.MeshStandardMaterial({ color: 0xc9a473, roughness: 1, name: 'well-sand-standin' }), { userData: { shared: true } }));
  // (the sand's grain from the world: render/triplanar.js, Calissa's CC0 sand on the tops, packed sand on the banks; once per material)
  if (!sandMat.userData.triplanar) triplanar(sandMat, { side: surfaceTexture('sand_packed'), top: surfaceTexture('sand'), scale: 0.3, strength: 0.75 });
  game.paintmap?.patch(sandMat); // (once: the paint on the Dunemaw's sand)
  const sand = new THREE.Mesh(mergeGeometries(sandGeos, false), sandMat); for (const g of sandGeos) g.dispose();
  sand.receiveShadow = true; sand.name = 'well-sand'; group.add(sand);
  // ---- the pools: the way up at the way in, the way down at the end of the path (none on the last floor: the bottom of the Well)
  const onSand = (cell, lx = 0, lz = 0) => {
    const s = sandOf.get(cell), km = mid(cell), gx = km.x + lx, gz = km.z + lz, p = place(gx, gz);
    return new THREE.Vector3(p.x, s.yb + s.S.at(gx - s.m.x, gz - s.m.z), p.z);
  };
  const pool = (cell, kind) => {
    const at = onSand(cell), dark = kind === 'down';
    if (dark) { // (the way down: the Dunemaw again, small: black Lachryma turning, the dark of the floor drawn in round it)
      const mouth = new DunemawMouth({ radius: 1.4, maw: 0x2a1a40 }); mouth.group.position.set(at.x, at.y + 0.02, at.z);
      mouth.mesh.name = 'pool-down'; mouth.maw.name = 'rim-down';
      group.add(mouth.group);
      return { pos: at, mesh: mouth.mesh, rim: mouth.maw, mouth };
    }
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 28), new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.set(at.x, at.y + 0.03, at.z); m.name = `pool-${kind}`;
    const rim = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.75, 28), new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.7 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(at.x, at.y + 0.02, at.z); rim.name = `rim-${kind}`;
    group.add(m, rim);
    return { pos: at, mesh: m, rim };
  };
  const up = pool(layout.start, 'up');
  const down = pool(layout.exit, 'down'); // (on the third floor it goes down into the great cavern: world/well/cavern.js)
  /** A doorway's middle on the floor: where a cell's side meets its neighbour, at the doorway's own tier. */
  const door = (c, r, side) => {
    const cell = get(c, r), km = mid(cell), [dx, dz] = SIDES[side], p = place(km.x + (dx * CELL) / 2, km.z + (dz * CELL) / 2);
    return new THREE.Vector3(p.x, Y + layout.levelAt(cell, side) + BASE, p.z);
  };
  // the arrival: beside the way up, facing a doorway out of the room
  const outSide = [...layout.start.doors][0] || 's', toward = door(layout.start.c, layout.start.r, outSide).sub(up.pos).setY(0).normalize();
  const arrive = { pos: onSand(layout.start, 0, 0).addScaledVector(toward, 2.6).setY(up.pos.y + 0.05), yaw: Math.atan2(toward.x, toward.z) };
  // the sandfalls, in their doorways (wellshift.js)
  const fallLinks = layout.links.filter((l) => l.sandfall);
  const falls = new Sandfalls(game, floor, fallLinks.map((l) => {
    const pos = door(l.a.c, l.a.r, l.side).setY(Y + layout.levelAt(l.a, l.side)), km = mid(l.a), [dx, dz] = SIDES[l.side];
    const wx = km.x + (dx * CELL) / 2, wz = km.z + (dz * CELL) / 2, e0 = place(wx - (dz ? 1 : 0), wz - (dx ? 1 : 0)), e1 = place(wx + (dz ? 1 : 0), wz + (dx ? 1 : 0));
    return { pos, yaw: Math.atan2(-(e1.z - e0.z), e1.x - e0.x), phase: l.sandfall.phase }; // (along the doorway's wall, as bent there)
  }), { body, group });
  const fallAt = new Map(); // (a doorway, from either side, to its sandfall)
  fallLinks.forEach((l, i) => { const [dx, dz] = SIDES[l.side]; fallAt.set(`${l.a.c},${l.a.r},${l.side}`, falls.list[i]); fallAt.set(`${l.a.c + dx},${l.a.r + dz},${OPP[l.side]}`, falls.list[i]); });
  /** The ground under a point: the highest sand or slab there, found by a ray (the agents', the jellies' spawn). */
  const ground = (x, z, from = Y + WH) => {
    const hit = game.physics.raycast?.({ x, y: from, z }, { x: 0, y: -1, z: 0 }, WH * 3);
    return hit ? hit.point.y : null;
  };
  game.scene.add(group);
  let t = 0;
  const cells = layout.cells.map((k) => { const p = onSand(k); return { x: p.x, z: p.z, y: Y + k.level, c: k.c, r: k.r, role: k.role, hall: k.hall ?? null, slope: !!k.slope, doors: [...k.doors],
    tpl: k.hall != null ? layout.halls[k.hall].tpl : k.tpl, spots: spotsOf.get(k) ?? [] }; });
  return {
    group, arrive, up, down, floor, cells, door, ground, sandfalls: falls.list, onSand: (c, r, lx, lz) => onSand(get(c, r), lx, lz),
    /** The cell a point of the world stands in (the swirl undone), or null off the plan. */
    cellAt: (x, z) => { const g = unsw(x - C.x, z - C.z), c = Math.floor((g.x + HALF) / CELL), r = Math.floor((g.z + HALF) / CELL); const k = get(c, r); return k ? cells.find((o) => o.c === k.c && o.r === k.r) : null; },
    /** Is this doorway passable now (no sandfall in it, or its sandfall open)? */
    open: (c, r, side) => (fallAt.get(`${c},${r},${side}`)?.state ?? 'open') === 'open',
    /** The guaranteed path's cells in order, on the sand (the flythrough's: Calissa's), from the way in to the way down. */
    path: layout.path.map((k) => onSand(k)),
    /** The way down moved to another room (a warped artifact taken: world/well/finds.js): its pool and where it is, together. */
    moveDown(cell) { const k = get(cell.c, cell.r), at = onSand(k); down.pos.copy(at); down.mouth.group.position.set(at.x, at.y + 0.02, at.z); },
    update(dt) {
      t += dt; down?.mouth.update(t, 1); up.rim.material.opacity = 0.6 + 0.15 * Math.sin(t * 1.3);
      falls.update(dt, game.player?.pos);
    },
    dispose() {
      game.scene.remove(group); archGeo.frame.dispose(); archGeo.ring.dispose();
      falls.dispose();
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => { if (!mm.userData?.shared) mm.dispose(); }); }); // (the kit's materials are every floor's)
      W.removeRigidBody(body); // (and every collider on it)
    },
  };
}

/** A hall's middle (grid metres from the floor's centre): the corner its four cells share. */
function hallMid(h) { return { x: (h.c + 1) * CELL - HALF, z: (h.r + 1) * CELL - HALF }; }

