// ---------------------------------------------------------------------------------------
// THE WELL'S KIT: one floor of a Well, laid out from a seed and built from boxes, then taken down again whole. A Well drifts daily
// (wellSeed(well, day): progress/econ/islands.js), so its floors are not part of the static level merged at boot (level.js): each is
// built when the Courier arrives on it and disposed of when they leave it (one group, one fixed body, so nothing is left behind).
//
// The layout is Spelunky's (Derek Yu, 2008): a grid of rooms with one guaranteed path through it, walked from a room on the top row,
// sideways and down, until it drops out of the bottom row (that room holds the way down); the rooms off the path hang from it as side
// rooms, and a loop is sometimes cut between two neighbours so the floor is not a tree. Each room is one of a few templates (plain,
// pillars, a ledge to mantle onto, plinths), Mystery Dungeon's and Tartarus's way of making a small kit read as many floors. The way in
// (a pale pool: the way up, back out of the Well) and the way down (a dark one, turning) are pools of Lachryma on the floor.
//
// Dressed in the Great Dunemaw's kit (vfx/dunemawkit.js: bismuth walls, a glass floor over Lachryma) and its pool (vfx/dunemaw.js): Calissa's.
//
//   layoutFloor(seed, floor) -> { cells: [{ c, r, role, tpl, doors }], start, exit, links }      (pure: the same seed, the same floor)
//   buildFloor(game, layout, origin, floor) -> { group, cells, arrive: { pos, yaw }, up, down, update(dt), dispose() }
//   GRID (rooms a side), CELL (metres a room), WALL_H
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../../render/outline.js';
import { seeded } from '../../core/rng.js';
import { dunemawKit } from '../../vfx/dunemawkit.js';
import { DunemawMouth } from '../../vfx/dunemaw.js';

export const GRID = 3, CELL = 14, WALL_H = 5.5;
const DOOR = 4, DOOR_H = 4, WT = 0.5, SLAB = 0.5;
const SIDES = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
const key = (c, r) => `${c},${r}`;

/** The floor's plan: which rooms there are, how they join, where the way in and the way down are. */
export function layoutFloor(seed, floor) {
  const R = seeded((seed ^ Math.imul(floor + 1, 0x9e3779b1)) >>> 0);
  const cells = new Map();
  const add = (c, r, role = 'side') => { const k = key(c, r); if (!cells.has(k)) cells.set(k, { c, r, role, tpl: 'plain', doors: new Set() }); return cells.get(k); };
  const link = (a, b) => {
    const side = Object.keys(SIDES).find((s) => a.c + SIDES[s][0] === b.c && a.r + SIDES[s][1] === b.r);
    a.doors.add(side); b.doors.add(OPP[side]);
  };
  // the path: sideways along a row, down now and then (or at a wall), until it drops out of the bottom row
  let c = R.int(GRID), r = 0, dir = R.chance(0.5) ? 1 : -1;
  const start = add(c, r, 'path');
  for (let guard = 0; guard < 4 * GRID * GRID; guard++) {
    const wall = c + dir < 0 || c + dir >= GRID;
    if (wall || R.chance(0.35)) {
      if (r === GRID - 1) break;
      const next = add(c, r + 1, 'path'); link(cells.get(key(c, r)), next); r++; dir = R.chance(0.5) ? 1 : -1;
    } else { const next = add(c + dir, r, 'path'); link(cells.get(key(c, r)), next); c += dir; }
  }
  const exit = cells.get(key(c, r));
  // side rooms off the path (twice over, so one can hang from another), and sometimes a loop between two neighbours
  for (let pass = 0; pass < 2; pass++) {
    for (let cc = 0; cc < GRID; cc++) for (let rr = 0; rr < GRID; rr++) {
      if (cells.has(key(cc, rr)) || !R.chance(0.55)) continue;
      const nbr = Object.values(SIDES).map(([dx, dz]) => cells.get(key(cc + dx, rr + dz))).filter(Boolean);
      if (nbr.length) link(add(cc, rr), R.pick(nbr));
    }
  }
  if (R.chance(0.5)) {
    const list = [...cells.values()];
    for (let i = 0; i < 8; i++) {
      const a = R.pick(list), s = R.pick(Object.keys(SIDES)), b = cells.get(key(a.c + SIDES[s][0], a.r + SIDES[s][1]));
      if (b && !a.doors.has(s)) { link(a, b); break; }
    }
  }
  start.role = 'start'; exit.role = exit === start ? 'start' : 'exit';
  for (const cell of cells.values()) if (cell.role === 'side' || cell.role === 'path') cell.tpl = R.pick(['plain', 'pillars', 'ledge', 'plinths']);
  return { cells: [...cells.values()], start, exit };
}

/** One floor, built at `origin` (the north-west corner of the grid, at floor level). */
export function buildFloor(game, layout, origin, floor = 1) {
  const W = game.physics.world, body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const group = new THREE.Group(); group.name = `well-floor-${floor}`; group.userData.zone = 'well';
  // deeper is darker and more violet (the clay giving way to what is under it)
  const deep = (floor - 1) / 2, tint = (hex, k = 1) => new THREE.Color(hex).lerp(new THREE.Color(0x3a2350), deep * 0.55 * k).getHex();
  const COL = { floor: tint(PALETTE.floor), wall: tint(PALETTE.wall), ceil: tint(PALETTE.deep, 0.5), deco: tint(PALETTE.mid) };
  const sets = { floor: [], wall: [], ceil: [], deco: [] };
  const box = (cx, cy, cz, sx, sy, sz, set = 'wall', collide = true) => {
    const g = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed(); g.translate(cx, cy, cz); g.deleteAttribute('uv'); sets[set].push(g);
    if (collide) W.createCollider(RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2).setTranslation(cx, cy, cz).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
  };
  const at = (cell) => ({ x: origin.x + cell.c * CELL + CELL / 2, z: origin.z + cell.r * CELL + CELL / 2 });
  const has = (c, r) => layout.cells.some((k) => k.c === c && k.r === r);
  const Y = origin.y;
  /** A wall along one side of a room: whole, or with a doorway in its middle and a lintel over it. */
  const wall = (cell, side) => {
    const { x, z } = at(cell), [dx, dz] = SIDES[side], along = dx === 0; // (a north or south wall runs along x)
    const wx = x + dx * CELL / 2, wz = z + dz * CELL / 2, len = CELL + WT, yc = Y + WALL_H / 2;
    const piece = (o, l, h = WALL_H, y = yc) => (along ? box(wx + o, y, wz, l, h, WT) : box(wx, y, wz + o, WT, h, l));
    if (!cell.doors.has(side)) { piece(0, len); return; }
    const sideLen = (len - DOOR) / 2, off = DOOR / 2 + sideLen / 2;
    piece(-off, sideLen); piece(off, sideLen);
    piece(0, DOOR, WALL_H - DOOR_H, Y + DOOR_H + (WALL_H - DOOR_H) / 2);
  };
  for (const cell of layout.cells) {
    const { x, z } = at(cell);
    box(x, Y - SLAB / 2, z, CELL, SLAB, CELL, 'floor');
    box(x, Y + WALL_H + SLAB / 2, z, CELL, SLAB, CELL, 'ceil');
    // north and west always (shared with a neighbour, built once from this side); east and south only on the floor's edge
    wall(cell, 'n'); wall(cell, 'w');
    if (!has(cell.c + 1, cell.r)) wall(cell, 'e');
    if (!has(cell.c, cell.r + 1)) wall(cell, 's');
    // what stands in the room
    const t = cell.tpl;
    if (t === 'pillars') for (const [ox, oz] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]) box(x + ox, Y + WALL_H / 2, z + oz, 1.1, WALL_H, 1.1, 'deco');
    else if (t === 'ledge') box(x, Y + 0.6, z - CELL / 2 + 2.2, CELL - 5, 1.2, 3.4, 'deco'); // (one mantle up: the core movement's step)
    else if (t === 'plinths') for (const [ox, oz, h] of [[-3, 0, 0.9], [3, 1.5, 1.6], [0, -3.5, 0.5]]) box(x + ox, Y + h / 2, z + oz, 2, h, 2, 'deco');
    // a lamp in each room, dim, warmer near the top of the Well
    const l = new THREE.PointLight(new THREE.Color(0xffa066).lerp(new THREE.Color(0xa070ff), deep), 14, CELL * 1.4, 1.2);
    l.position.set(x, Y + WALL_H - 0.6, z); group.add(l);
  }
  for (const [set, geos] of Object.entries(sets)) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos, false); for (const g of geos) g.dispose();
    // the Great Dunemaw's kit (Calissa's: vfx/dunemawkit.js): bismuth walls and pillars whose terraces catch the light, the floor a pane of
    // glass over liquid Lachryma, the ceiling the bismuth's dark metal; one set for every floor (shared: never disposed with a floor)
    const K = (game.dunemawKit ||= (() => { const k = dunemawKit({ env: game.sky?.env }); for (const mm of [k.wall, k.floor, k.trim]) mm.userData.shared = true; return k; })());
    const m = new THREE.Mesh(merged, set === 'floor' ? K.floor : set === 'ceil' ? K.trim : set === 'wall' || set === 'deco' ? K.wall : game.level.mat(COL[set]));
    m.receiveShadow = true; m.castShadow = set === 'deco';
    if (set !== 'ceil') addOutline(m);
    group.add(m);
  }
  // the pools: the way up at the way in, the way down at the end of the path (none on the last floor: the bottom of the Well)
  const pool = (cell, kind) => {
    const { x, z } = at(cell), dark = kind === 'down';
    if (dark) { // (the way down: the Dunemaw again, small: black Lachryma turning, the dark of the floor drawn in round it)
      const mouth = new DunemawMouth({ radius: 1.4, maw: 0x2a1a40 }); mouth.group.position.set(x, Y + 0.02, z);
      mouth.mesh.name = 'pool-down'; mouth.maw.name = 'rim-down';
      group.add(mouth.group);
      return { pos: new THREE.Vector3(x, Y, z), mesh: mouth.mesh, rim: mouth.maw, mouth };
    }
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 28), new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, Y + 0.03, z); m.name = `pool-${kind}`;
    const rim = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.75, 28), new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.7 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(x, Y + 0.02, z); rim.name = `rim-${kind}`;
    group.add(m, rim);
    return { pos: new THREE.Vector3(x, Y, z), mesh: m, rim };
  };
  const up = pool(layout.start, 'up');
  const down = layout.exit !== layout.start && floor < 3 ? pool(layout.exit, 'down') : null;
  // the arrival: beside the way up, facing a doorway out of the room
  const s = at(layout.start), outSide = [...layout.start.doors][0] || 's', [odx, odz] = SIDES[outSide];
  const arrive = { pos: new THREE.Vector3(s.x + odx * 2.6, Y + 0.05, s.z + odz * 2.6), yaw: Math.atan2(odx, odz) };
  game.scene.add(group);
  let t = 0;
  return {
    group, arrive, up, down, floor,
    cells: layout.cells.map((c) => ({ ...at(c), c: c.c, r: c.r, role: c.role })),
    update(dt) { t += dt; down?.mouth.update(t, 1); up.rim.material.opacity = 0.6 + 0.15 * Math.sin(t * 1.3); },
    dispose() {
      game.scene.remove(group);
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => { if (!mm.userData?.shared) mm.dispose(); }); }); // (the kit's materials are every floor's)
      W.removeRigidBody(body); // (and every collider on it)
    },
  };
}

