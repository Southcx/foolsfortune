// ---------------------------------------------------------------------------
// ROOMS: the rooms the Index lists and the teleports that send the Courier to them.
//
// The table (id, key, tag, name, blurb, group, spawn) the Index's menu draws, where each room's Courier is set down (the hub, the lab,
// the mill, the siege, the Dunes and what lies off their spawn), and the one door `goRoom(course, id)` that picks the teleport. The
// teleport itself is `Course.teleport` (world/basement/course.js); `Course` keeps a method for each door below, for its callers.
//
// Prior art: a level select as data (Mega Man's stage select, Crash Bandicoot's warp room): one table, one function that reads it.
//
//   indexRooms() -> [room]   roomSpawns() -> { millSpawn, weirSpawn, siegeSpawn, hubSpawn, labSpawn }   goRoom(course, id)
//   toLab / toDunes / toWeir / toDunemaw / toShore / toSiege / toMill (course)
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { FOE } from '../progress/combat/dunemaw.js';
import { SIEGE_SPAWN } from './basement/siege.js';
import { WEIR_SPAWN } from '../tools/sondelass/angling/weir.js';
import { BASE_Y } from './basement/basement.js';

/** The rooms the Index's menu lists. */
export function indexRooms() {
  // the rooms the menu lists (the course's eight stations and the lab's five wings are one room each: R and the rings inside them do
  // the rest)
  return [
    { id: 'workshop', code: 'KeyK', tag: 'K', name: 'THE WORKSHOP', blurb: 'back up to the kiln, the folk and the pots, where you woke', group: 'THE HUB', spawn: 'workshop' }, // (the basement's way up: QA-C found none but a Shrine's page)
    { id: 'course', code: 'Digit1', tag: '1', name: 'THE COURSE', blurb: 'one loop, eight stations: run · mantle · gaps · wallrun · zigzag · climb · speed · low · splits and laps', group: 'THE HUB', cp: 0 },
    { id: 'lab', code: 'KeyL', tag: 'L', name: 'THE MOVEMENT LAB', blurb: 'one hall, five wings: the hands · the rigging · the techs · the clockwork mill · the kiln stack', group: 'THE HUB', spawn: 'lab' },
    { id: 'braid', code: 'KeyB', tag: 'B', name: 'THE BRAID', blurb: 'three lines over a pit: beams, bars, blinks · change at any junction', group: 'LAP CIRCUITS', spawn: 'circuit' },
    { id: 'millrace', code: 'KeyC', tag: 'C', name: 'THE MILL RACE', blurb: 'the mill in one loop: cogs, a fork, the ferris wheel, the steam', group: 'LAP CIRCUITS', spawn: 'circuit', circuit: 'mill' },
    { id: 'spindle', code: 'KeyP', tag: 'P', name: 'THE SPINDLE', blurb: 'up through a chain of skills, down a long chute', group: 'LAP CIRCUITS', spawn: 'circuit' },
    { id: 'touchstone', code: 'KeyT', tag: 'T', name: 'THE TOUCHSTONE', blurb: 'the Assay\'s quiet room: five standard trials, one at each plinth', group: 'THE HUB', spawn: 'touchstone' },
    { id: 'sandbox', code: 'KeyN', tag: 'N', name: 'THE SANDBOX', blurb: 'the hand\'s physics room: a yard of loose things, a pen to try powers on, a pitch and a ball', group: 'THE HAND', spawn: 'sandbox' },
    { id: 'strawmanwell', code: 'KeyH', tag: 'H', name: "STRAWMAN'S WELL", blurb: 'the 2D platformer\'s test bench, side-on: the wings and six stages of verbs (run, climb, stomp, brawl, machine, flood)', group: 'THE HAND', spawn: 'strawmanwell' },
    { id: 'siege', code: 'KeyS', tag: 'S', name: 'THE SIEGE', blurb: 'the hand\'s arena: raids come here, and only here', group: 'THE HAND', spawn: 'siege' },
    { id: 'dunes', code: 'KeyD', tag: 'D', name: 'THE DUNES', blurb: 'an oasis in a sand sea: Solar Skiffing (Y) · the Weir\'s pools and the Sondelass\'s rod · the gate to Raku\'s bazaar', group: 'THE OPEN', spawn: 'dunes' },
    { id: 'shore', code: 'KeyE', tag: 'E', name: 'THE SHORE', blurb: 'due east of the oasis the sand runs down to the Emocean: the jetty, and the sea to the horizon', group: 'THE OPEN', spawn: 'shore' },
    { id: 'opensea', code: 'KeyO', tag: 'O', name: 'THE OPEN SEA', blurb: 'the Emocean off the lanes: sail at a free helm, chart squares, land on islets, report finds at a dock', group: 'THE OPEN', spawn: 'opensea' },
    { id: 'raceway', code: 'KeyR', tag: 'R', name: 'THE RACEWAY', blurb: 'the Solar Skiff\'s test circuit: three laps against the clock, F at the start\'s pillar · the sandfall drop', group: 'THE OPEN', spawn: 'raceway' },
    { id: 'bazaar', code: 'KeyG', tag: 'G', name: "RAKU'S BAZAAR", blurb: 'the casino under the dome: Querent, Zodiac, Event Horizon · chips at Raku\'s cage', group: 'THE OPEN', spawn: 'bazaar' },
    { id: 'dunemaw', code: 'KeyW', tag: 'W', name: 'THE GREAT DUNEMAW', blurb: 'the Well in the sand, north-west of the oasis: F at its mouth goes down', group: 'THE OPEN', spawn: 'dunemaw', danger: FOE.cls }, // (its FOE's class as the Index row's pips: ui/dangerpips.js)
  ];
}

/** Where the Courier is set down in the rooms that have a fixed spawn. */
export function roomSpawns() {
  return {
    millSpawn: { v: new THREE.Vector3(39, BASE_Y, -47.2), yaw: Math.PI / 2 },
    weirSpawn: { v: new THREE.Vector3(...WEIR_SPAWN.pos), yaw: WEIR_SPAWN.yaw }, // (the Weir is the dunes' oasis now)
    siegeSpawn: { v: new THREE.Vector3(SIEGE_SPAWN.pos[0], BASE_Y + SIEGE_SPAWN.pos[1], SIEGE_SPAWN.pos[2]), yaw: SIEGE_SPAWN.yaw },
    hubSpawn: { v: new THREE.Vector3(0, BASE_Y, -10), yaw: 0 },
    labSpawn: { v: new THREE.Vector3(0, BASE_Y, -38), yaw: Math.PI },
  };
}

export function goRoom(c, id) {
  const r = c.rooms.find((x) => x.id === id);
  if (!r) return;
  c.game.circuits?.leave();
  if (r.spawn === 'circuit') { c.game.circuits.enter(r.circuit || r.id); return; }
  if (r.spawn === 'debug') { c.game.debugChests?.go(r.kit); return; } // (the Index's DEBUG rows: debug/debugchest.js)
  if (r.spawn === 'workshop') { c.teleport(c.game.player.spawn, 0); c.running = false; c.current = -1; c.lapT = null; sfx.geyser(); }
  else if (r.spawn === 'lab') toLab(c);
  else if (r.spawn === 'mill') toMill(c);
  else if (r.spawn === 'dunes') toDunes(c);
  else if (r.spawn === 'siege') toSiege(c);
  else if (r.spawn === 'weir') toWeir(c);
  else if (r.spawn === 'dunemaw') toDunemaw(c);
  else if (r.spawn === 'shore') toShore(c);
  else if (r.spawn === 'touchstone') { c.game.touchstone?.arrive(); c.running = false; c.current = -1; c.lapT = null; sfx.geyser(); }
  else if (r.spawn === 'sandbox') { c.game.sandbox?.arrive(); c.running = false; c.current = -1; c.lapT = null; sfx.geyser(); }
  else if (r.spawn === 'strawmanwell') { c.game.strawmanWell?.arrive(); c.running = false; c.current = -1; c.lapT = null; sfx.geyser(); }
  else if (r.spawn === 'bazaar') { c.game.bazaar?.arrive(); c.running = false; c.current = -1; c.lapT = null; }
  else if (r.spawn === 'opensea') { c.game.opensea?.arrive(); c.running = false; c.current = -1; c.lapT = null; }
  else if (r.spawn === 'raceway') { c.game.raceway?.arrive(); c.running = false; c.current = -1; c.lapT = null; sfx.geyser(); }
  else c.goTo(r.cp, 'geyser');
}

export function toLab(c) {
  c.teleport(c.labSpawn.v, c.labSpawn.yaw);
  c.running = false;
  c.current = -1;
  c.lapT = null;
  sfx.geyser();
}

/** The open layer: the sand sea. You arrive on foot at the oasis, by the pier (Y brings the Solar Skiff). */
export function toDunes(c) {
  const D = c.game.dunes;
  c.game.player.killY = D.center.y - 90; // (before the next step: it is far below the world's end)
  c.teleport(D.spawnPoint(), 0);
  c.running = false;
  c.current = -1;
  c.lapT = null;
  sfx.geyser();
}

/** The Weir is the dunes' oasis: the same arrival. */
export function toWeir(c) { toDunes(c); }
/** The open layer, set down beside the Great Dunemaw's mouth, facing it (world/well/dunemaw.js). */
export function toDunemaw(c) {
  toDunes(c);
  const W = c.game.well; if (!W?.mouthPos) return;
  const at = W.mouthSpot(); c.teleport(at.pos, at.yaw + Math.PI);
}

/** The open layer, set down on the beach at the jetty's foot, facing the sea (world/dunes/beach.js). */
export function toShore(c) {
  toDunes(c);
  const at = c.game.dunes.beach?.landing(); if (at) c.teleport(at.pos, at.yaw);
}

export function toSiege(c) {
  c.teleport(c.siegeSpawn.v, c.siegeSpawn.yaw);
  c.running = false;
  c.current = -1;
  c.lapT = null;
  sfx.geyser();
}

export function toMill(c) {
  c.teleport(c.millSpawn.v, c.millSpawn.yaw);
  c.running = false;
  c.current = -1;
  c.lapT = null;
  sfx.geyser();
}
