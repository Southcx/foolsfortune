// ---------------------------------------------------------------------------------------
// THE WELL'S KIT: one floor of a Well, built from its plan (welllayout.js) and taken down again whole. A Well drifts daily
// (wellSeed(well, day): progress/econ/islands.js), so its floors are not part of the static level merged at boot (level.js): each is
// built when the Courier arrives on it and disposed of when they leave it (one group, one fixed body, so nothing is left behind).
//
// Since the Dunemaw was made big (docs/plans/DUNEMAW.md): 5 by 5 cells of 14 m in two tiers 6 m apart, halls of 2 by 2 cells open to
// the dark, slope cells of sand between the tiers, the floor swirled about its centre (a swirl turns and shears by as much: walls are cut
// into pieces of at most 3.5 m, each laid between its two swirled ends; the sand and the ceilings are grids of swirled points), sand in
// every room (wellsand.js) as one trimesh collider and one merged mesh for the floor (no slab under it: the sand is the floor), walls
// taller by the sand they hold, and sandfalls on side passages (wellshift.js). Rooms hold one of a few templates (plain, pillars, a
// ledge to mantle onto, plinths), Mystery Dungeon's and Tartarus's way of making a small kit read as many floors. The way in (a pale pool:
// the way up, back out of the Well) and the way down (a dark one, turning) are pools of Lachryma on the sand.
//
// Dressed in the Great Dunemaw's kit (vfx/dunemawkit.js: bismuth walls, its sand `K.sand` when it has one) and its pool (vfx/dunemaw.js):
// Calissa's.
//
//   layoutFloor(seed, floor) (welllayout.js)
//   buildFloor(game, layout, origin, floor) -> { group, cells, path, arrive: { pos, yaw }, up, down, sandfalls, door(c, r, side), open(c, r, side), cellAt(x, z),
//     ground(x, z, top?), update(dt), dispose() }       (origin: the grid's north-west corner, at the upper tier's floor)
//   GRID (cells a side), CELL (metres a cell), WALL_H
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../../render/outline.js';
import { dunemawKit } from '../../vfx/dunemawkit.js';
import { DunemawMouth } from '../../vfx/dunemaw.js';
import { layoutFloor, swirl, GRID, CELL, WALL_H, DOOR, DOOR_H, SIDES, OPP } from './welllayout.js';
import { roomSand, BASE } from './wellsand.js';
import { Sandfalls } from './wellshift.js';

export { layoutFloor, GRID, CELL, WALL_H };
const WT = 0.5, SLAB = 0.5, PIECE = 3.5, HALF = (GRID * CELL) / 2;
/** How much taller a floor's walls stand than WALL_H, for the sand banked against them (wellsand.js: drifts to 1.2, 1.8 and 2.2 m, dunes
 *  on top): the wall above the highest sand stays out of a hang's reach (core/config.js hang.maxTop 2.95), as it was on bare floors. */
const LIFT = [1.5, 2.5, 3];
const UP = new THREE.Vector3(0, 1, 0);

/** One floor, built at `origin` (the north-west corner of the grid, at the upper tier's floor level). */
export function buildFloor(game, layout, origin, floor = 1) {
  const W = game.physics.world, body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const group = new THREE.Group(); group.name = `well-floor-${floor}`; group.userData.zone = 'well';
  const WH = WALL_H + (LIFT[floor - 1] ?? LIFT[LIFT.length - 1]); // (this floor's walls, sand allowed for)
  const deep = (floor - 1) / 2, tint = (hex, k = 1) => new THREE.Color(hex).lerp(new THREE.Color(0x3a2350), deep * 0.55 * k).getHex();
  const sets = { floor: [], wall: [], ceil: [], deco: [] }, sandGeos = [];
  const C = { x: origin.x + HALF, z: origin.z + HALF }, Y = origin.y, sw = swirl(layout.twist), unsw = swirl(layout.twist, { back: true }), bend = layout.twist > 0;
  const cellAt = new Map(layout.cells.map((k) => [`${k.c},${k.r}`, k]));
  const get = (c, r) => cellAt.get(`${c},${r}`);
  const mid = (cell) => ({ x: (cell.c + 0.5) * CELL - HALF, z: (cell.r + 0.5) * CELL - HALF }); // (grid metres from the floor's centre)
  /** A point of the plan (grid metres from the centre) where it stands in the world, and the angle turned there. */
  const place = (gx, gz) => { const p = sw(gx, gz); return { x: C.x + p.x, z: C.z + p.z, a: p.a }; };
  /** A box of the plan, cut into pieces of at most 3.5 m along its length, each laid between the two swirled ends of its own stretch: the
   *  swirl turns and shears (by as much as it turns), so a piece follows the bent line it stands on and its neighbours meet it end to end. */
  const box = (gx, cy, gz, sx, sy, sz, set = 'wall', collide = true) => {
    const alongX = sx >= sz, L = alongX ? sx : sz, Wd = alongX ? sz : sx, n = bend ? Math.max(1, Math.ceil(L / PIECE)) : 1;
    for (let i = 0; i < n; i++) {
      const t0 = -L / 2 + (i * L) / n, t1 = t0 + L / n;
      const p0 = place(gx + (alongX ? t0 : 0), gz + (alongX ? 0 : t0)), p1 = place(gx + (alongX ? t1 : 0), gz + (alongX ? 0 : t1));
      const dx = p1.x - p0.x, dz = p1.z - p0.z, len = Math.hypot(dx, dz) + (n > 1 ? 0.1 : 0), mx = (p0.x + p1.x) / 2, mz = (p0.z + p1.z) / 2;
      const th = alongX ? Math.atan2(-dz, dx) : Math.atan2(dx, dz); // (rotateY: the box's long axis onto the chord)
      const g = new THREE.BoxGeometry(alongX ? len : Wd, sy, alongX ? Wd : len).toNonIndexed();
      g.deleteAttribute('uv'); g.rotateY(th); g.translate(mx, cy, mz); sets[set].push(g);
      if (collide) W.createCollider(RAPIER.ColliderDesc.cuboid((alongX ? len : Wd) / 2, sy / 2, (alongX ? Wd : len) / 2).setTranslation(mx, cy, mz)
        .setRotation(new THREE.Quaternion().setFromAxisAngle(UP, th)).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
    }
  };
  /** A sheet of the plan (a ceiling, the sand): a grid of points over a rectangle, each swirled, its height from `y(gx, gz)`; drawn in `set`
   *  (or returned) and made a trimesh collider of the same triangles. */
  const sheet = (gx, gz, size, n, y, flip = false) => {
    const pos = new Float32Array(n * n * 3), idx = new Uint32Array((n - 1) * (n - 1) * 6), h0 = -size / 2, st = size / (n - 1);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const lx = h0 + i * st, lz = h0 + j * st, p = place(gx + lx, gz + lz), k = (j * n + i) * 3; pos[k] = p.x; pos[k + 1] = y(lx, lz); pos[k + 2] = p.z; }
    let q = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, d = a + n, e = d + 1; if (flip) idx.set([a, b, d, b, e, d], q); else idx.set([a, d, b, b, d, e], q); q += 6; }
    W.createCollider(RAPIER.ColliderDesc.trimesh(pos, idx).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    return g.toNonIndexed();
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
  };
  // ---- the cells: their floors, ceilings, walls, what stands in them, and a lamp
  const lit = new Set();
  for (const cell of layout.cells) {
    const m = mid(cell), y = Y + level(cell);
    if (cell.hall == null) sets.ceil.push(sheet(m.x, m.z, CELL, 5, () => Y + top(cell), true)); // (seen from below; a hall is open to the dark. No floor: the sand is the floor)
    wall(cell, 'n'); wall(cell, 'w');
    if (!get(cell.c + 1, cell.r)) wall(cell, 'e');
    if (!get(cell.c, cell.r + 1)) wall(cell, 's');
    const t = cell.tpl;
    if (t === 'pillars') for (const [ox, oz] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]) box(m.x + ox, y + WH / 2, m.z + oz, 1.1, WH, 1.1, 'deco');
    else if (t === 'ledge') box(m.x, y + 0.6, m.z - CELL / 2 + 2.2, CELL - 5, 1.2, 3.4, 'deco'); // (one mantle up: the core movement's step)
    else if (t === 'plinths') for (const [ox, oz, h] of [[-3, 0, 0.9], [3, 1.5, 1.6], [0, -3.5, 0.5]]) box(m.x + ox, y + h / 2, m.z + oz, 2, h, 2, 'deco');
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
  const sandOf = new Map();
  for (const room of rooms) {
    const { m, size, cell } = room, doors = [], pools = [];
    for (const k of room.cells) {
      const km = mid(k);
      for (const s of k.doors) { const [dx, dz] = SIDES[s], o = get(k.c + dx, k.r + dz); if (o && o.hall != null && o.hall === k.hall) continue; doors.push({ x: km.x - m.x + (dx * CELL) / 2, z: km.z - m.z + (dz * CELL) / 2 }); }
      if (k === layout.start || k === layout.exit) pools.push({ x: km.x - m.x, z: km.z - m.z });
    }
    const sl = cell.slope, ramp = sl ? { from: sl.from, hFrom: sl.fromLevel - cell.level, hTo: sl.toLevel - cell.level } : null;
    const S = roomSand({ seed: (layout.seed ^ Math.imul(floor, 0x9e3779b1) ^ Math.imul(cell.c * 7 + cell.r + 1, 0x85ebca6b)) >>> 0, floor, size, doors, pools, ramp });
    const yb = Y + cell.level;
    sandGeos.push(sheet(m.x, m.z, S.size, S.n, (lx, lz) => yb + S.at(lx, lz)));
    for (const k of room.cells) sandOf.set(k, { S, m, yb });
  }
  // ---- what is drawn: one mesh a set (the kit's materials, shared by every floor), and one of sand
  const K = (game.dunemawKit ||= (() => { const k = dunemawKit({ env: game.sky?.env }); for (const mm of [k.wall, k.floor, k.trim, k.sand].filter(Boolean)) mm.userData.shared = true; return k; })());
  const COL = { floor: tint(PALETTE.floor), wall: tint(PALETTE.wall), ceil: tint(PALETTE.deep, 0.5), deco: tint(PALETTE.mid) };
  for (const [set, geos] of Object.entries(sets)) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos, false); for (const g of geos) g.dispose();
    const mesh = new THREE.Mesh(merged, set === 'floor' ? K.floor : set === 'ceil' ? K.trim : set === 'wall' || set === 'deco' ? K.wall : game.level.mat(COL[set]));
    mesh.receiveShadow = true; mesh.castShadow = set === 'deco';
    if (set === 'wall' || set === 'deco') addOutline(mesh); // (the floor lies under the sand; the ceiling is seen from below only)
    group.add(mesh);
  }
  const sandMat = K.sand || (game.wellSandMat ||= Object.assign(new THREE.MeshStandardMaterial({ color: 0xc9a473, roughness: 1, name: 'well-sand-standin' }), { userData: { shared: true } }));
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
  const down = floor < 3 ? pool(layout.exit, 'down') : null;
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
  const cells = layout.cells.map((k) => { const p = onSand(k); return { x: p.x, z: p.z, y: Y + k.level, c: k.c, r: k.r, role: k.role, hall: k.hall ?? null, slope: !!k.slope, doors: [...k.doors] }; });
  return {
    group, arrive, up, down, floor, cells, door, ground, sandfalls: falls.list, onSand: (c, r, lx, lz) => onSand(get(c, r), lx, lz),
    /** The cell a point of the world stands in (the swirl undone), or null off the plan. */
    cellAt: (x, z) => { const g = unsw(x - C.x, z - C.z), c = Math.floor((g.x + HALF) / CELL), r = Math.floor((g.z + HALF) / CELL); const k = get(c, r); return k ? cells.find((o) => o.c === k.c && o.r === k.r) : null; },
    /** Is this doorway passable now (no sandfall in it, or its sandfall open)? */
    open: (c, r, side) => (fallAt.get(`${c},${r},${side}`)?.state ?? 'open') === 'open',
    /** The guaranteed path's cells in order, on the sand (the flythrough's: Calissa's), from the way in to the way down. */
    path: layout.path.map((k) => onSand(k)),
    update(dt) {
      t += dt; down?.mouth.update(t, 1); up.rim.material.opacity = 0.6 + 0.15 * Math.sin(t * 1.3);
      falls.update(dt, game.player?.pos);
    },
    dispose() {
      game.scene.remove(group);
      falls.dispose();
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => { if (!mm.userData?.shared) mm.dispose(); }); }); // (the kit's materials are every floor's)
      W.removeRigidBody(body); // (and every collider on it)
    },
  };
}

/** A hall's middle (grid metres from the floor's centre): the corner its four cells share. */
function hallMid(h) { return { x: (h.c + 1) * CELL - HALF, z: (h.r + 1) * CELL - HALF }; }

