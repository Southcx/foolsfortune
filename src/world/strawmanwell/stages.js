// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S STAGES, THE MOVING ONES: the wings (the hub) and the stages of moving on the plane (docs/plans/STRAWMANS-WELL.md 3:
// The Run 3.1, The Climb 3.2, The Stomp 3.3), each built from the stage kit (stagekit.js) in its lane's metres, its room-side mechanics
// handed to the Well's (mechanics.js), and the house's own climbing kit where it exists (the ladders, the rigging's bars, poles, ropes
// and beams: courier/moves/env.js, rigging.js). Each builder returns what the Well runs it by: its goal flag, its checkpoints, its signs.
// Every stage has the same scaffold: a back flat behind the plane (and the wall run's flat nearer in where the Run asks), its ends
// closed, an unseen wall in front (crates and cubes stay on the boards), lamps. Placeholder looks; words placeholders, Espada's.
//
// Prior art: a test course of one verb a stretch (the basement's course and movement lab, world/basement/), Super Mario Bros. 1-1's
// teach-by-layout (each thing met alone first), Celeste's and Mega Man X's wall-kick shafts.
//
//   scaffold(S, len)   buildWings(well, S) -> { doors, plates }   buildRun / buildClimb / buildStomp(well, S) -> { goal: [x, y], checks: [[x, y]], door: [x, y] }
//   goalFlag(S, x, y) -> { flag }   stageDoor(S, x, y, text) -> { mesh }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR, DEPTH, BACK } from './stagekit.js';
import { WINGS, AT } from './layout.js';
import { STAGES } from '../../progress/strawmanwell.js';
import { StrawmanModel } from '../../vfx/strawman.js';

const FLOOR = -4; // (a floor box's foot, m under its top: the boards read as solid)

/** The back flat, the ends, the unseen front, the catch floor far below and three lamps: every stage's. */
export function scaffold(S, len, { ends = true, top = 28 } = {}) {
  S.box(-16, len + 16, -14, top, COLOR.flat, { dz: -BACK, d: 0.2, outline: false });
  if (ends) for (const x of [-0.6, len + 0.6]) S.box(x - 0.6, x + 0.6, -6, 14, COLOR.wing, { outline: false });
  S.box(-16, len + 16, -14, top, 0, { dz: DEPTH / 2 + 0.1, d: 0.2, hidden: true });
  S.box(-16, len + 16, -16, -14, 0, { hidden: true }); // (a catch floor: a fall is a retry, never the world's end)
  for (const k of [1, 3, 5]) S.lamp((len * k) / 6, 7.5);
}
const floor = (S, x0, x1, top = 0, color = COLOR.boards) => S.box(x0, x1, top + FLOOR, top, color);
const sign = (S, text, x, y, sub = null) => S.label(text, x, y, { dz: -BACK + 0.13, width: 2.6, sub });
/** A slope whose top runs from (xa, ya) to (xb, yb), 2 m thick under it. */
const slope = (S, xa, ya, xb, yb, color = COLOR.slope) => {
  const a = Math.atan2(yb - ya, xb - xa), l = Math.hypot(xb - xa, yb - ya), t = 2, nx = -Math.sin(a) * t / 2, ny = Math.cos(a) * t / 2, mx = (xa + xb) / 2 - nx, my = (ya + yb) / 2 - ny;
  return S.box(mx - l / 2, mx + l / 2, my - t / 2, my + t / 2, color, { rotZ: a });
};

/** The goal: a pin's post and a felt flag at x on the floor at y (its own meshes: the Brawl raises it). */
export function goalFlag(S, x, y) {
  const post = S.box(x - 0.06, x + 0.06, y, y + 3, COLOR.pin, { collide: false, own: true });
  const flag = S.box(x + 0.06, x + 1.1, y + 2.2, y + 2.9, COLOR.mark, { collide: false, own: true, d: 0.05 });
  return { post: post.mesh, flag: flag.mesh };
}
/** A door on the back flat (W or F at it), with its sign over it. */
export function stageDoor(S, x, y, text, sub = null) {
  const { mesh } = S.box(x - 0.8, x + 0.8, y, y + 2.6, COLOR.door, { dz: -BACK + 0.25, d: 0.3, collide: false, own: true });
  const plate = S.label(text, x, y + 3.15, { dz: -BACK + 0.42, width: 2.2, sub });
  return { mesh, plate };
}

// ---------------------------------------------------------------------------------------- the wings
export function buildWings(well, S) {
  const len = S.lane.len;
  scaffold(S, len, { top: 22 });
  floor(S, -1, len + 1);
  S.box(-1, len + 1, 9, 10, COLOR.wing, { outline: false }); // (the fly loft's beam over the wings)
  const doors = { hub: { ...stageDoor(S, WINGS.hub, 0, 'THE HUB', 'back out'), x: WINGS.hub, to: 'hub' } };
  for (const st of STAGES.filter((s) => s.wave === 1)) doors[st.id] = { ...stageDoor(S, WINGS.doors[st.id], 0, st.family.toUpperCase(), null), x: WINGS.doors[st.id], to: st.id };
  const sm = new StrawmanModel(); sm.group.position.copy(S.at(WINGS.strawman, 0, -1.1)); S.add(sm.group); // (centre stage: never a creature, never counted)
  S.label('F AT A DOOR', WINGS.strawman, 3.15, { dz: -BACK + 0.13, width: 2.2 }); // (on the doors' row: the room's name is the place plate's, under the Sight; a sign up at 6.4 stood behind the Sight, Petra's shots, v360)
  return { doors, strawman: sm };
}

// ---------------------------------------------------------------------------------------- The Run (3.1)
export function buildRun(well, S) {
  const M = well.mech, len = S.lane.len;
  scaffold(S, len);
  floor(S, -1, 9); sign(S, 'JUMP', 8, 3.4, 'Space; hold it for more');
  floor(S, 11.5, 15.5); sign(S, 'DOUBLE JUMP', 15, 3.4, 'Space again in the air');
  floor(S, 20, 24); sign(S, 'AIR DASH', 23.5, 3.4, 'Shift in the air');
  floor(S, 33, 49.2);
  S.box(35, 38, 1.45, 9, COLOR.spool); sign(S, 'SLIDE', 34, 4.2, 'C (or S) at a run');
  S.box(40.5, 43, 0.95, 9, COLOR.spool); sign(S, 'CRAWL', 39.5, 4.2, 'C twice: on the belly');
  // the wall kick's shaft: under the overhang, up between two walls (the room's wall kick: mechanics.js)
  S.box(46.2, 47, 2.3, 10, COLOR.pin); S.box(49.2, 58, FLOOR, 5, COLOR.boards); sign(S, 'WALL KICK', 48.1, 7.6, 'Space at a wall, in the air');
  // the wall run: along a flat close behind the plane, over a gap
  S.box(57, 68.5, 5.4, 10.5, COLOR.wing, { dz: -0.95, d: 0.2 }); sign(S, 'WALL RUN', 60, 11.4, 'jump along the flat behind');
  floor(S, 68, 72, 5);
  // thin platforms: a bridge to drop through, a shelf to jump up through
  const thin = (x0, x1, top) => { const { collider } = S.box(x0, x1, top - 0.18, top, COLOR.thin, { d: DEPTH - 0.4 }); M.thin(collider, AT.x + x0, AT.x + x1, AT.y + top); };
  thin(72, 76.5, 5); sign(S, 'THIN FLOOR', 74.2, 8, 'S + Space drops through');
  floor(S, 72, 112);
  thin(77.5, 80.5, 1.9);
  // a slope up and down: a slide down it keeps its speed
  slope(S, 81, 0, 84.5, 2.3); floor(S, 84.5, 85.5, 2.3); slope(S, 85.5, 2.3, 90, 0); sign(S, 'SLOPE', 85, 6, 'slide down it');
  // ice and goo, strips of the boards
  S.box(90.5, 96.5, -0.4, 0.02, COLOR.ice, { friction: 0.05 }); M.strip('ice', AT.x + 90.5, AT.x + 96.5, AT.y + 0.02); sign(S, 'ICE', 93.5, 3.4);
  S.box(97.5, 101.5, -0.4, 0.02, COLOR.goo); M.strip('goo', AT.x + 97.5, AT.x + 101.5, AT.y + 0.02); sign(S, 'GOO', 99.5, 3.4);
  // a spring up to the goal's ledge
  const pad = S.box(102.6, 103.8, 0.02, 0.26, COLOR.spring, { own: true }); M.spring(AT.x + 102.6, AT.x + 103.8, AT.y + 0.26, pad.mesh); sign(S, 'SPRING', 103.2, 3.4);
  S.box(104.6, 112, FLOOR, 5.5, COLOR.boards);
  goalFlag(S, 109, 5.5);
  return { goal: [109, 5.5], door: [111, 5.5], checks: [[2, 0], [21, 0], [34, 0], [50, 5], [69, 5], [86, 2.3], [105.5, 5.5]] };
}

// ---------------------------------------------------------------------------------------- The Climb (3.2)
export function buildClimb(well, S) {
  const g = well.game, len = S.lane.len, z = S.z, X = (x) => AT.x + x, Y = (y) => AT.y + y, out = (well.climbKit = { ladders: [], bars: [], poles: [], beams: [] });
  scaffold(S, len);
  const level = { box: (pos, size, color, o = {}) => well.kit.box(pos, size, color, { ...o, lane: S.lane.id }).collider }; // (the house's builders take the level's box)
  floor(S, -1, 15); floor(S, 23.4, 26); floor(S, 34, 38.4);
  // a ladder up a cliff's face (the house's ladder: courier/moves/env.js), then a vine (the ladder on a thread)
  S.box(5, 8, 0, 4.5, COLOR.spool); sign(S, 'LADDER', 4, 6, 'walk into it, W climbs');
  const lad = g.ladders?.add({ x: X(5), z, y0: Y(0), y1: Y(4.5), n: new THREE.Vector3(-1, 0, 0) }); if (lad) { out.ladders.push(lad); g.ladders.build(level); }
  S.box(11, 14, 0, 5.5, COLOR.spool); sign(S, 'VINE', 10, 7, 'a thread to climb');
  const vine = g.ladders?.add({ x: X(11), z, y0: Y(0), y1: Y(5.5), n: new THREE.Vector3(-1, 0, 0), width: 0.3, built: true });
  if (vine) { out.ladders.push(vine); well.vine = vine; S.box(10.9, 10.98, 0, 5.6, COLOR.thread, { collide: false, d: 0.05 }); for (let y = 0.4; y < 5.4; y += 0.45) S.box(10.86, 11, y, y + 0.08, COLOR.thread, { collide: false, d: 0.12, outline: false }); }
  // monkey bars over a pit (the rigging's bars: the hang)
  if (g.rigging) {
    out.bars.push(g.rigging.addBar([X(14.6), Y(2.75), z], [X(23.8), Y(2.75), z])); sign(S, 'MONKEY BARS', 19, 6, 'jump up to a bar');
    // a balance beam over a pit
    out.beams.push(g.rigging.addBeam(level, [X(26), Y(0), z], [X(34), Y(0), z], { width: 0.32 })); sign(S, 'BALANCE BEAM', 30, 3.6);
    // a pole up to a ledge, then a hanging rope up to the last
    out.poles.push(g.rigging.addPole({ x: X(37), z, y0: Y(0), y1: Y(6.6) })); S.box(38.4, 42, FLOOR, 6, COLOR.boards); sign(S, 'POLE', 36.5, 8.4, 'walk into it, W climbs');
    out.poles.push(g.rigging.addPole({ x: X(45), z, y0: Y(1.2), y1: Y(8.7), rope: true })); sign(S, 'ROPE', 44, 10.4, 'jump to it, W climbs');
  }
  S.box(45.6, 56, FLOOR, 7.6, COLOR.boards);
  goalFlag(S, 52, 7.6);
  return { goal: [52, 7.6], door: [54.5, 7.6], checks: [[2, 0], [24, 0], [35, 0], [39, 6], [47, 7.6]] };
}
/** The Climb's house kit given back: the ladders, bars, poles and beams it lent the registries (their meshes, the bars' and poles' own). */
export function clearClimb(well) {
  const g = well.game, K = well.climbKit; if (!K) return;
  const drop = (list, x) => { const i = list?.indexOf(x); if (i >= 0) list.splice(i, 1); };
  for (const l of K.ladders) drop(g.ladders?.list, l);
  for (const b of K.bars) { drop(g.rigging?.bars, b); b.mesh?.removeFromParent(); b.mesh?.geometry?.dispose(); }
  for (const p of K.poles) { drop(g.rigging?.poles, p); p.group?.removeFromParent(); p.group?.traverse((o) => o.geometry?.dispose()); }
  for (const b of K.beams) g.rigging?.beams.delete(b.col?.handle);
  well.climbKit = null; well.vine = null;
}

// ---------------------------------------------------------------------------------------- The Stomp (3.3)
export function buildStomp(well, S) {
  const M = well.mech, len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y;
  scaffold(S, len);
  floor(S, -1, len + 1);
  sign(S, 'STOMP', 9, 4.4, 'land on a dummy from above');
  for (const [a, b] of [[6, 12], [14, 20]]) M.dummy({ at: S.at((a + b) / 2, 0, 0), x0: X(a), x1: X(b), into: S.group });
  // ? spools to bonk from below, and one hidden among them
  sign(S, 'BONK', 27, 5.6, 'jump into it from below');
  for (const [x, hidden] of [[24.5, false], [26.5, false], [29, true]]) {
    const r = S.box(x - 0.45, x + 0.45, 2.6, 3.5, COLOR.gold, { own: true, d: 0.9 });
    M.spool({ x0: X(x - 0.45), x1: X(x + 0.45), bottom: Y(2.6), top: Y(3.5), z: S.z, mesh: r.mesh, collider: r.collider, hidden, baseY: r.mesh.position.y });
  }
  // a dummy up on a shelf: a stomp from a jump, or the ground pound
  S.box(32, 37, 0, 1.6, COLOR.spool); M.dummy({ at: S.at(34.5, 1.6, 0), x0: X(32.6), x1: X(36.4), into: S.group }); sign(S, 'GROUND POUND', 34.5, 5, 'the Stomp art, if it is yours');
  goalFlag(S, 40, 0);
  return { goal: [40, 0], door: [42.3, 0], checks: [[2, 0], [22, 0]] };
}
