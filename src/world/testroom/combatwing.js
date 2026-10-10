// ---------------------------------------------------------------------------------------
// THE COMBAT WING: the Throwing Room's hall for fighting (the owner, 2026-10-10: "expand the Throwing Room to be our ultimate test suite
// for combat actions, Figment Attack Telegraphs, Projectile Parry, Status application explanation; the works ... Expand level geometry as
// needed!"; docs/plans/COMBAT-LAB.md). Through an arcade where the room's south wall stood: a hall 20 by 30.5 m and 9 m high (room
// overhead for the juggle pen), part of the Throwing Room's zone (render/zonemap.js), so it measures and never pays as the room does.
//
//   THE SPARRING CIRCLE        Strawman in the middle of a clay ring bounded by straw; its frame meter set in the clay, its mirror on the
//                              west wall, its lectern (the string and the tempo)
//   THE FIGMENT TELEGRAPH FLOOR a clear screed of grey slip where a caster throws each Figment attack telegraph's shape in turn
//   THE PARRY RANGE            a lane from a pitcher on its plinth, stand marks at 4, 8 and 12 m and two at 8 m off the line
//   THE STATUS BENCH           eleven little roly-polies on a long bench, each status's glyph on a plaque under it
//   THE JUGGLE PEN             a fenced square of sand under the hall's full height, for the launcher and the air string
//
// This is the place and its bodies: floors, walls, roof, lamps (plain PointLights, lent by the light budget), each station's floor,
// its lectern and its stand-ins, all static (level.box and addGeo, merged by colour). The mechanics are not built here (what each needs:
// COMBAT-LAB.md); the looks are vfx/combatwingkit.js. Nothing in the core movement changes: the bales and the tiles are flat and have no
// collider; the fence, the bench, the plinths and the lecterns are solid.
//
// Prior art: Apex Legends' firing range grown into a training wing (one place, many stations), a fighting game's training stage (the
// dummy, the frame meter, the tempo), FFXIV's striking dummies and its trial arenas (an open floor for every marker), the batting cage.
//
//   buildCombatWing(level)   (from buildTestRoom: the arcade in the room's south wall, then the hall and its stations; TR.wing the measures)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { TR } from './layout.js';
import { WING_COLOR, STATUS_BENCH_ORDER, lecternParts, strawRoly, parryPitcher, telegraphCaster, markTiles, statusPlaques } from '../../vfx/combatwingkit.js';
import { mirrorPane } from '../../vfx/sparringmirror.js';

const flat = { outline: false, collide: false, shadow: false };
const shell = { outline: false, shadow: false };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);

/** Parts built in a local frame ([{ geo, color, outline }]), set down at (x, y, z) turned by yaw, merged into the level. */
function put(level, parts, x, z, yaw = 0, y = 0) {
  _m.compose(new THREE.Vector3(x, y, z), _q.setFromAxisAngle(_up, yaw), new THREE.Vector3(1, 1, 1));
  for (const p of parts) level.addGeo(p.geo.clone().applyMatrix4(_m), p.color, p.outline, false);
}
/** A solid box that is not drawn (a stand-in's body to walk into). */
function solid(level, [x, y, z], [hx, hy, hz], yaw = 0) {
  const q = new THREE.Quaternion().setFromAxisAngle(_up, yaw);
  level.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setRotation(q).setCollisionGroups(GROUPS.static).setFriction(0.9), level.fixedBody);
}
/** The way a lectern at (x, z) turns so its reader looks across it at (fx, fz): its front (local +z) away from what it serves. */
const lecternYaw = ([x, z], [fx, fz]) => Math.atan2(x - fx, z - fz);
/** A tile's turn so its chevron (local +x) points from (x, z) toward (tx, tz). */
const toward = (x, z, tx, tz) => Math.atan2(-(tz - z), tx - x);

/** The room's south wall as an arcade: a header over four bays, piers at the ends, the room's own posts the columns between. */
function buildArcade(level) {
  const C = PALETTE, A = TR.wing.arcade, zc = TR.z0 - 0.25, h = TR.h, H = TR.wing.h;
  level.box([(TR.x0 + TR.x1) / 2, (A.header + h) / 2, zc], [TR.x1 - TR.x0, h - A.header, 0.5], C.wall, shell);
  for (const [a, b] of A.piers) level.box([(a + b) / 2, A.header / 2, zc], [b - a, A.header, 0.5], C.wall, shell);
  for (let x = TR.x0 + 4; x < TR.x1; x += 5) { // (the room's posts, x 14.5 to 29.5: the wall behind each, and its twin on the hall's side to the roof)
    if (!A.piers.some(([a, b]) => x > a && x < b)) level.box([x, A.header / 2, zc], [0.45, A.header, 0.5], C.dark, { shadow: false });
    level.box([x, H / 2, zc - 0.45], [0.45, H, 0.4], C.dark, { shadow: false });
  }
  const [w0, w1] = [A.piers[0][1], A.piers[1][0]]; // (a lintel under the header, proud of both faces)
  level.box([(w0 + w1) / 2, A.header - 0.1, zc], [w1 - w0, 0.3, 0.7], C.dark, { shadow: false });
  for (const [a, b] of [[TR.x0 + 0.04, A.piers[0][1]], [A.piers[1][0], TR.x1 - 0.12]]) level.box([(a + b) / 2, 0.55, TR.z0 + 0.06], [b - a, 1.1, 0.12], C.dark, flat); // (the room's wainscot, kept on the piers)
}

/** The hall: floor and planks, walls, the band over the room's roof, the roof, beams and posts, the wainscot, the lamps. */
function buildHall(level) {
  const C = PALETTE, W = TR.wing, { x0, x1, z0, h, inner } = W, cx = (x0 + x1) / 2, n0 = TR.z0 - 0.5, zm = (z0 + n0) / 2, len = n0 - z0;
  level.box([cx, -0.25, (z0 + TR.z0) / 2], [x1 - x0, 0.5, TR.z0 - z0], C.floor, { outline: false }); // (meeting the room's floor at its edge: one plane, no overlap)
  for (let z = TR.z0 - 2; z > z0; z -= 2) level.box([cx, 0.005, z], [x1 - x0, 0.01, 0.06], C.deep, flat);
  level.box([(x0 + inner) / 2, h / 2, (z0 - 0.5 + n0) / 2], [inner - x0, h, n0 - (z0 - 0.5)], C.wall, shell); // (west: beside the Workshop's corner, never on its wall)
  level.box([x1 + 0.25, h / 2, (z0 - 0.5 + n0) / 2], [0.5, h, n0 - (z0 - 0.5)], C.wall, shell);
  level.box([cx + 0.25, h / 2, z0 - 0.25], [x1 - x0 + 0.5, h, 0.5], C.wall, shell);
  level.box([cx + 0.25, (TR.h + 0.5 + h) / 2, TR.z0 - 0.25], [x1 - x0 + 0.5, h - TR.h - 0.5, 0.5], C.wall, shell); // (the band standing on the room's roof's edge)
  level.box([cx + 0.25, h + 0.25, (z0 - 0.5 + TR.z0) / 2], [x1 - x0 + 0.5, 0.5, TR.z0 - (z0 - 0.5)], C.deep, shell);
  for (let x = TR.x0 + 4; x < x1; x += 5) { level.box([x, h - 0.3, zm], [0.35, 0.4, len], C.dark, { shadow: false }); level.box([x, h / 2, z0 + 0.2], [0.45, h, 0.4], C.dark, { shadow: false }); }
  const zx = -19.5; // (a beam across, between the stations, on posts in the side walls)
  level.box([(inner + x1) / 2, h - 0.75, zx], [x1 - inner, 0.4, 0.45], C.dark, { shadow: false });
  for (const x of [inner + 0.2, x1 - 0.2]) level.box([x, h / 2, zx], [0.4, h, 0.45], C.dark, { shadow: false });
  for (const [x, z, sx, sz] of [[inner + 0.06, zm, 0.12, len], [x1 - 0.06, zm, 0.12, len], [(inner + x1) / 2, z0 + 0.06, x1 - inner - 0.24, 0.12]]) level.box([x, 0.55, z], [sx, 1.1, sz], C.dark, flat);
  for (const [x, z] of [[W.circle.x, W.circle.z], [25.4, -12.6], [15.5, -27.5], [27, -28.5]]) { const L = new THREE.PointLight(0xffc89a, 20, 18, 1.5); L.position.set(x, h - 1.2, z); level.scene.add(L); }
}

/** Each station's floor, its lectern and its stand-ins. Returns the dressed marks (tiles, glyph plaques, the mirror's glass) to add. */
function buildStations(level) {
  const C = PALETTE, K = WING_COLOR, W = TR.wing, tiles = [], glyphs = [], dressed = [];
  // THE SPARRING CIRCLE: the clay disc, its bales (twenty, the four at the quarters set out), the frame meter before Strawman
  const S = W.circle;
  level.addGeo(new THREE.CylinderGeometry(S.r, S.r, 0.02, 48).translate(S.x, 0.022, S.z), C.mid, false, false);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2, r = S.r + 0.16 + (i % 5 ? 0 : 0.25);
    const bx = S.x + Math.sin(a) * r, bz = S.z + Math.cos(a) * r, tx = Math.cos(a), tz = -Math.sin(a); // (along the bale: the circle's tangent)
    level.box([bx, 0.05, bz], [1.0, 0.14, 0.3], K.straw, { rotY: a, collide: false, shadow: false, outline: false });
    for (const s of [-0.28, 0.28]) level.box([bx + tx * s, 0.05, bz + tz * s], [0.05, 0.15, 0.31], K.cord, { rotY: a, collide: false, shadow: false, outline: false }); // (its two cords)
  }
  const Fm = S.meter, pitch = Fm.len / Fm.tiles;
  level.box([S.x, 0.034, Fm.z], [Fm.len + 0.12, 0.004, 0.42], K.oxblood, flat);
  for (let i = 0; i < Fm.tiles; i++) level.box([S.x - Fm.len / 2 + pitch * (i + 0.5), 0.036, Fm.z], [pitch - 0.03, 0.008, 0.3], K.slate, flat);
  // its mirror on the west wall (a frame of the dark wood; the glass reflects while the Courier is inside the bales: vfx/sparringmirror.js)
  const Mi = W.mirror, fx = W.inner + 0.19, frame = { shadow: false, collide: false };
  for (const y of [Mi.y1 + 0.06, Mi.y0 - 0.06]) level.box([fx, y, Mi.z], [0.14, 0.12, Mi.len + 0.24], C.dark, frame);
  for (const s of [-1, 1]) level.box([fx, (Mi.y0 + Mi.y1) / 2, Mi.z + s * (Mi.len / 2 + 0.06)], [0.14, Mi.y1 - Mi.y0, 0.12], C.dark, frame);
  const glass = mirrorPane(Mi.len, Mi.y1 - Mi.y0); glass.position.set(W.inner + 0.16, (Mi.y0 + Mi.y1) / 2, Mi.z); dressed.push(glass);
  // THE FIGMENT TELEGRAPH FLOOR: the screed, its oxblood border, the caster, the mark the Courier stands on
  const F = W.telegraphFloor, fcx = (F.x0 + F.x1) / 2, fcz = (F.z0 + F.z1) / 2, bw = 0.1;
  level.box([fcx, 0.017, fcz], [F.x1 - F.x0, 0.01, F.z1 - F.z0], K.screed, flat); // (grey stoneware slip: neutral, so every damage type's colour reads true on it; cream washed the marks' light fill out)
  for (const z of [F.z1 + bw / 2, F.z0 - bw / 2]) level.box([fcx, 0.018, z], [F.x1 - F.x0 + 2 * bw, 0.012, bw], K.oxblood, flat);
  for (const x of [F.x0 - bw / 2, F.x1 + bw / 2]) level.box([x, 0.018, fcz], [bw, 0.012, F.z1 - F.z0], K.oxblood, flat);
  put(level, telegraphCaster(), F.caster[0], F.caster[1], 0); solid(level, [F.caster[0], 0.95, F.caster[1]], [0.75, 0.95, 0.75]);
  tiles.push({ x: F.mark[0], z: F.mark[1], yaw: toward(F.mark[0], F.mark[1], F.caster[0], F.caster[1]), y: 0.03 });
  // THE STATUS BENCH: a long bench on the west wall, eleven roly-polies on it facing the room, a glyph plaque on its front under each
  const B = W.statusBench, blen = B.z1 - B.z0, bmid = (B.z0 + B.z1) / 2, bd = 0.8;
  level.box([B.x, B.h - 0.04, bmid], [bd, 0.08, blen], C.wood, { shadow: false });
  for (let k = 0; k <= 6; k++) for (const s of [-1, 1]) level.box([B.x + s * (bd / 2 - 0.12), (B.h - 0.08) / 2, B.z0 + 0.15 + (k * (blen - 0.3)) / 6], [0.1, B.h - 0.08, 0.1], C.dark, { shadow: false });
  level.box([B.x, 0.2, bmid], [bd - 0.3, 0.05, blen - 0.3], C.dark, { collide: false, shadow: false });
  STATUS_BENCH_ORDER.slice(0, B.n).forEach((status, i) => {
    const z = B.z1 - 0.6 - (i * (blen - 1.2)) / (B.n - 1);
    put(level, strawRoly(), B.x, z, Math.PI / 2, B.h);
    glyphs.push({ x: B.x + bd / 2 + 0.012, z, yaw: Math.PI / 2, y: B.h - 0.22, status });
  });
  // THE JUGGLE PEN: sand, a fence of posts and two rails (solid: what is juggled stays in), its gate on the north side
  const P = W.jugglePen, post = (x, z) => level.box([x, 0.475, z], [0.12, 0.95, 0.12], C.dark, { shadow: false });
  const rail = (xa, za, xb, zb) => { for (const y of [0.5, 0.88]) level.box([(xa + xb) / 2, y, (za + zb) / 2], [Math.max(0.06, Math.abs(xb - xa)), 0.08, Math.max(0.06, Math.abs(zb - za))], C.wood, { shadow: false }); };
  level.box([(P.x0 + P.x1) / 2, 0.021, (P.z0 + P.z1) / 2], [P.x1 - P.x0, 0.018, P.z1 - P.z0], K.sand, flat);
  const span = (a, b) => { const n = Math.max(1, Math.round((b - a) / 1.65)); return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n); };
  for (const x of span(P.x0, P.x1)) post(x, P.z0);
  for (const z of span(P.z0, P.z1).slice(1)) { post(P.x0, z); post(P.x1, z); }
  for (const x of [...span(P.x0, P.gate[0]).slice(1), ...span(P.gate[1], P.x1).slice(0, -1)]) post(x, P.z1);
  rail(P.x0, P.z0, P.x1, P.z0); rail(P.x0, P.z0, P.x0, P.z1); rail(P.x1, P.z0, P.x1, P.z1); rail(P.x0, P.z1, P.gate[0], P.z1); rail(P.gate[1], P.z1, P.x1, P.z1);
  // THE PARRY RANGE: the pitcher on its plinth, a lane up the line, the stand marks with their tallies (one, two, three: how far)
  const R = W.parryRange, [px, pz] = R.pitcher, far = Math.max(...R.marks.map((m) => m[1])) + 0.6;
  level.box([px, 0.02, (pz + 0.6 + far) / 2], [0.9, 0.01, far - (pz + 0.6)], C.deep, flat);
  put(level, parryPitcher(), px, pz, 0); solid(level, [px, 0.95, pz], [0.6, 0.95, 0.6]);
  for (const [x, z, n] of R.marks) {
    tiles.push({ x, z, yaw: toward(x, z, px, pz), y: 0.032 });
    for (let k = 0; k < n; k++) { const tz = z + (k - (n - 1) / 2) * 0.15; level.box([x + 0.62, 0.029, tz], [0.29, 0.006, 0.1], K.oxblood, flat); level.box([x + 0.62, 0.033, tz], [0.23, 0.004, 0.06], K.slip, flat); }
  }
  // THE LECTERNS: one a station, its reader looking across it at what it serves (stand-ins: their pages are not built)
  for (const L of [{ at: S.lectern, face: S.face }, { at: F.lectern, face: F.face }, { at: B.lectern, face: B.face }, { at: P.lectern, face: P.face }, { at: R.lectern, face: R.face }]) {
    const yaw = lecternYaw(L.at, L.face);
    put(level, lecternParts(), L.at[0], L.at[1], yaw); solid(level, [L.at[0], 0.55, L.at[1]], [0.3, 0.55, 0.25], yaw);
  }
  dressed.push(markTiles(tiles), statusPlaques(glyphs));
  return dressed;
}

/** The arcade, the hall and its stations (from buildTestRoom, in place of the room's south wall). */
export function buildCombatWing(level) {
  buildArcade(level);
  buildHall(level);
  const group = new THREE.Group(); group.name = 'combat-wing'; group.userData.zone = 'testroom';
  for (const m of buildStations(level)) group.add(m);
  level.scene.add(group);
  return group;
}
