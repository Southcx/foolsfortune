// ---------------------------------------------------------------------------------------
// THE GREAT DUNEMAW: the Well in the Dunes (the slice's E1: docs/plans/SLICE.md). Out on the sand a MOUTH turns, a dark pool ringed in
// stone that the Dreamvane can dowse (a signature of kind 'well'); F at it and the Courier goes down into the Well, three FLOORS laid
// out that day from wellSeed('dunemaw', today()) (world/well/wellkit.js). On every floor there are two pools: the way up, which takes
// them back out to the mouth with what they found, and the way down, deeper. Shattered in the Well, they come to again at the mouth
// and the run's haul is lost (the purse is not touched: courier/vessel/death.js asks reformAt()). One floor is built at a time, in a
// zone of its own far from everything (render/zones.js 'well'), and taken down when they leave it.
//
// Prior art: Persona 3's Tartarus (floors from a seed, an access point back to the entrance on every floor: going deeper is a choice
// made again and again), Spelunky's room grid (wellkit.js), the Mystery Dungeon games (the stairs as the floor's one goal), and the
// daily dungeon of an MMO (the same Well for everyone that day: core/calendar.js).
//
// Below, every room but the first holds slip jellies (stand-ins for the Egregores, the owner's ruling), one more each floor down, and
// the last floor's way out is kept by a FOE (a jelly of class 2: creatures/jelly/slipjelly.js). Once every jelly on a floor is burst,
// something is left where they were: a MATERIAL of one of the seven kinds (progress/econ/materials.js), a tier up one floor in four
// (a deck, econ/deck.js) and a tier up for the FOE's floor. What they find is the HAUL: it comes home only up the way up, with the
// run's pay (wellPay by the deepest floor and the FOEs, times the Well's yield at its FILL: a Well drawn on gives less and fills again
// with rest, econ/islands.js) and, if they charted four fifths of the floors they walked (the map's 'well' layer, cleared each floor:
// the floors share their ground), a COGITOMAP of the Well as it is that day (its worth: cogitomapWorth).
//
// Events (each with `by`): well.enter { well, seed, day }, well.floor { well, floor, charted: null }, well.charted { well, floor,
// charted } (leaving a floor), well.foe { well, floor, cls }, well.find { well, floor, item, tier }, well.leave { well, floors, foes,
// pay, charted, shattered, fill }, cogitomap.get { well, charted, worth } (SLICE.md's contract). game.well.active and .floor are what
// the music listens to (music/choose.js, Wanda's).
//
//   game.well = new Dunemaw(game)   .update(dt)   .enter()   .down()   .up()   .active   .floor   .killY   .reformAt() -> { pos, yaw }
//   .nearest(P) -> { pos, d, ref: 'mouth' | 'up' | 'down' } | null   (the interact source, main.js)   .toArrival()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUNE } from '../dunes/dunes.js';
import { layoutFloor, buildFloor, GRID, CELL } from './wellkit.js';
import { wellSeed, wellPay, wellYield, drawWell, cogitomapWorth } from '../../progress/econ/islands.js';
import { makeMaterial, KIND_IDS } from '../../progress/econ/materials.js';
import { deckDraw } from '../../progress/econ/deck.js';
import { seeded } from '../../core/rng.js';
import { today, now as calNow } from '../../core/calendar.js';
import { zoneOf } from '../../render/zones.js';
import { mergeStatic } from '../../render/merge.js';
import { DunemawMouth } from '../../vfx/dunemaw.js';

export const WELL_ID = 'dunemaw';
/** Where the floors are built: far west of the basement and far below the Dunes (its own zone, render/zones.js, and its own map layer,
 *  feedback/cartography.js: both decided by height). The grid's north-west corner. */
export const WELL_AT = new THREE.Vector3(-1300 - (GRID * CELL) / 2, -900, -(GRID * CELL) / 2);
/** The mouth, in the dunes' local frame (metres from the centre): out past the oasis, to the north-west. */
const MOUTH_LOCAL = { x: -150, z: -120 };
const FLOORS = 3, REACH = 2.4;
const MAP_AT = 0.8, RARE = 4; // (a Cogitomap at four fifths charted; a material a tier up one floor in four)

export class Dunemaw {
  constructor(game) {
    this.game = game;
    this.run = null; // { seed, day, floor, deepest, foes, fill, charted: [per floor], haul: [{ id, data }], cleared: Set }
    this.cur = null; // the floor standing (wellkit.buildFloor)
    this.mobs = []; // the jellies on it
    this.t = 0;
    this.fills = {}; // { [well]: { fill, at } }: the world's, kept (core/save.js)
    game.save?.section('wells', { scope: 'world', version: 1, dump: () => this.fills, load: (d) => { this.fills = d && typeof d === 'object' ? d : {}; }, reset: () => { this.fills = {}; } });
    this.buildMouth();
  }

  get active() { return !!this.run; }
  get floor() { return this.run?.floor ?? 0; }
  /** Below this the Well has no bottom (main.js sets the player's killY from it while a run is on). */
  get killY() { return WELL_AT.y - 30; }

  // ------------------------------------------------------------------ the mouth
  buildMouth() {
    const g = this.game, D = g.dunes, x = DUNE.x + MOUTH_LOCAL.x, z = DUNE.z + MOUTH_LOCAL.z, y = D.heightAt(x, z);
    this.mouthPos = new THREE.Vector3(x, y, z);
    const grp = new THREE.Group(); grp.position.copy(this.mouthPos); grp.name = 'dunemaw-mouth';
    const stone = g.level.mat(0x6b4a3a);
    for (let i = 0; i < 12; i++) { // (a ring of fallen stones round it: the town's, once)
      const a = (i / 12) * Math.PI * 2, h = 0.5 + ((i * 7) % 5) * 0.18;
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.1, h, 0.8), stone);
      s.position.set(Math.cos(a) * 3.6, h / 2 - 0.15, Math.sin(a) * 3.6); s.rotation.y = -a + 0.2 * Math.sin(i * 3.1);
      grp.add(s);
    }
    // (a placeholder landmark until Calissa's: three standing stones round it, tall enough to be seen over the dunes from the oasis, none
    // between the mouth and the way back to the oasis; solid, so they are walked round)
    const home = Math.atan2(-MOUTH_LOCAL.x, -MOUTH_LOCAL.z);
    for (const [da, h, r] of [[2.2, 9, 6.5], [3.4, 7, 7], [4.4, 6, 6.2]]) {
      const a = home + da, sx = x + Math.sin(a) * r, sz = z + Math.cos(a) * r, sy = D.heightAt(sx, sz);
      g.level.box([sx, sy + h / 2 - 1, sz], [1.4, h, 1.0], 0x6b4a3a, { rotY: a + 0.3 });
    }
    // (and a placeholder beam over it, in the spire's manner (world/dunes/dunes.js) but violet and lower: a place to sail toward)
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3, 160, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x9a6bff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.set(x, y + 80, z); beam.name = 'dunemaw-beam';
    g.scene.add(beam); this.beam = beam;
    // the pool itself (Calissa's: vfx/dunemaw.js): black Lachryma swallowing the sand, the labradorite's arms turning in, the sand drawn in
    // round it (the maw); it darkens what it covers. Motes of the dunes are drawn into it while it is in view.
    this.maw = new DunemawMouth({ radius: 3 }); this.maw.group.name = 'dunemaw-pool';
    grp.add(this.maw.group);
    const lamp = new THREE.PointLight(0x9a6bff, 10, 14, 1.4); lamp.position.set(0, 1.2, 0); grp.add(lamp);
    mergeStatic(grp); // (the stones are one draw: the pool and its rim are named, and turn)
    g.scene.add(grp);
    this.mouth = grp;
    // what the Dreamvane hears of it: a Well is loud (crystals are 4 to 13)
    g.signatures?.add({ pos: this.mouthPos.clone().setY(y + 0.5), strength: 16, kind: 'well', ref: this });
  }

  /** Where they stand when they come back up: on the sand beside the mouth, facing away from it. */
  mouthSpot() {
    const D = this.game.dunes, a = Math.atan2(-MOUTH_LOCAL.x, -MOUTH_LOCAL.z); // (toward the oasis)
    const x = this.mouthPos.x + Math.sin(a) * 5, z = this.mouthPos.z + Math.cos(a) * 5;
    return { pos: new THREE.Vector3(x, D.heightAt(x, z) + 0.05, z), yaw: a };
  }

  // ------------------------------------------------------------------ the run
  enter() {
    if (this.run || this.game.death?.active) return false;
    const day = today(), seed = wellSeed(WELL_ID, day);
    this.run = { seed, day, floor: 0, deepest: 0, foes: 0, fill: this.draw(), charted: [], haul: [], cleared: new Set() };
    this.game.events?.emit('well.enter', { well: WELL_ID, seed, day, by: 'courier' });
    this.goTo(1);
    return true;
  }
  down() { if (this.run && this.run.floor < FLOORS && this.cur?.down) this.goTo(this.run.floor + 1); }
  up() { if (this.run) this.leave(false); }

  goTo(n) {
    const g = this.game, R = this.run;
    this.offFloor();
    this.cur = buildFloor(g, layoutFloor(R.seed, n), WELL_AT, n);
    g.cartography?.clear('well'); // (every floor stands on the same ground: the map shows the one they are on)
    this.populate(n);
    R.floor = n; R.deepest = Math.max(R.deepest, n);
    this.moving = 2; // (a couple of frames for the teleport to land before the zone check below)
    g.player.killY = this.killY; // (now, not next frame: the floor is far above the dunes' killY, the mouth far below the Well's)
    g.course.teleport(this.cur.arrive.pos, this.cur.arrive.yaw, { keepPool: true });
    g.events?.emit('well.floor', { well: WELL_ID, floor: n, charted: null, by: 'courier' });
  }

  /** The Well's fill as they go in (it fills again with the hours since the last run, econ/islands.js drawWell), and this run drawn from it. */
  draw() {
    const now = calNow(), was = this.fills[WELL_ID], fill = was ? drawWell(was.fill, 0, (now - was.at) / 3600000) : 1;
    this.fills[WELL_ID] = { fill: drawWell(fill, 1, 0), at: now }; this.game.save?.dirty('wells');
    return fill;
  }

  /** The floor's jellies: in every room but the first, one more each floor down, and the FOE at the bottom's far end. */
  populate(n) {
    const g = this.game, J = g.jellies, F = this.cur; if (!J) return;
    const r = seeded((this.run.seed ^ Math.imul(n, 0x85ebca6b)) >>> 0), rooms = F.cells.filter((c) => c.role !== 'start');
    for (let i = rooms.length - 1; i > 0; i--) { const j = r.int(i + 1); [rooms[i], rooms[j]] = [rooms[j], rooms[i]]; }
    const at = (c) => new THREE.Vector3(c.x, WELL_AT.y, c.z + (c.role === 'exit' ? 3 : 0)); // (off the pool)
    for (const c of rooms.slice(0, 1 + n)) this.mobs.push(J.spawn(at(c), { once: true }));
    const end = rooms.find((c) => c.role === 'exit');
    if (n === FLOORS && end) this.mobs.push(J.spawn(at(end).setX(end.x - 3), { once: true, cls: 2 }));
  }

  /** Off the floor they are on: how much of it they charted (well.charted), and the floor and its jellies taken down. */
  offFloor() {
    const g = this.game, F = this.cur, R = this.run; if (!F) return;
    const h = CELL / 2, share = g.cartography?.share('well', F.cells.map((c) => ({ x0: c.x - h, z0: c.z - h, x1: c.x + h, z1: c.z + h }))) ?? 0;
    if (R) { R.charted[F.floor - 1] = Math.max(R.charted[F.floor - 1] || 0, share); g.events?.emit('well.charted', { well: WELL_ID, floor: F.floor, charted: +share.toFixed(2), by: 'courier' }); }
    for (const c of this.mobs) g.jellies?.dispose(c);
    this.mobs = [];
    F.dispose(); this.cur = null;
  }

  /** The floor's jellies, watched: a FOE burst by the Courier is counted; when the last is down, the floor gives up its material. */
  watch() {
    const g = this.game, R = this.run, n = R.floor;
    let up = 0;
    for (const c of this.mobs) {
      if (c.alive) { up++; continue; }
      if (c.counted) continue;
      c.counted = true;
      if (c.cls && c.downBy === 'courier') { R.foes++; g.events?.emit('well.foe', { well: WELL_ID, floor: n, cls: c.cls, by: 'courier' }); }
    }
    if (up || !this.mobs.length || R.cleared.has(n)) return;
    R.cleared.add(n);
    const r = seeded((R.seed ^ Math.imul(n + 7, 0x27d4eb2d)) >>> 0), kind = r.pick(KIND_IDS), foe = this.mobs.some((c) => c.cls && c.downBy === 'courier');
    const tier = Math.min(4, n - 1 + (deckDraw(g.ledger, 'well.rare', RARE, r()) ? 1 : 0) + (foe ? 1 : 0)), item = `mat.${kind}`;
    R.haul.push({ id: item, data: makeMaterial(kind, (R.seed + n) >>> 0, tier) });
    g.events?.emit('well.find', { well: WELL_ID, floor: n, item, tier, by: 'courier' });
  }

  /** Out of the Well: up the way up (shattered false: what it pays and the haul, for leave() to hand over), or lost (shattered true). */
  end(shattered) {
    const g = this.game, R = this.run; if (!R) return null;
    this.offFloor();
    const charted = R.deepest ? R.charted.reduce((a, b) => a + (b || 0), 0) / R.deepest : 0;
    const pay = shattered ? 0 : Math.round(wellPay(R.deepest, R.foes) * wellYield(R.fill));
    g.events?.emit('well.leave', { well: WELL_ID, floors: R.deepest, foes: R.foes, pay, charted: +charted.toFixed(2), shattered, fill: +R.fill.toFixed(2), by: 'courier' });
    this.run = null;
    g.player.killY = DUNE.y - 90; // (back to the dunes' floor of the world, before the next step: see goTo)
    return shattered ? null : { R, pay, charted };
  }
  leave(shattered) {
    const out = this.end(shattered), g = this.game, s = this.mouthSpot();
    g.course.teleport(s.pos, s.yaw, { keepPool: true });
    if (!out) return;
    // (handed over on the sand, not below: a full box drops what it cannot hold at their feet)
    const { R, pay, charted } = out;
    if (pay > 0) g.cubes?.earn(pay, 'well');
    for (const h of R.haul) g.pneuka?.add(h.id, 'well', 0, h.data);
    if (charted >= MAP_AT) {
      const worth = cogitomapWorth(pay, charted, 0);
      g.pneuka?.add('cogitomap', 'well', 0, { well: WELL_ID, seed: R.seed, day: R.day, charted: +charted.toFixed(2), pay, worth, at: calNow() });
      g.events?.emit('cogitomap.get', { well: WELL_ID, charted: +charted.toFixed(2), worth, by: 'courier' });
    }
  }
  /** Shattered in the Well: the run is lost and they come to again at the mouth (courier/vessel/death.js). */
  reformAt() { if (!this.run) return null; this.end(true); return this.mouthSpot(); }
  /** Back to where this floor began (the Tab panel's respawn, a fall). */
  toArrival() { if (this.cur) { this.moving = 2; this.game.course.teleport(this.cur.arrive.pos, this.cur.arrive.yaw, { keepPool: true }); } }

  /** A route across the floor through its doorways (the agents': agent/agent.js): the doorways' middles, room by room, then the place.
   *  Breadth-first over the rooms (nine at most). */
  route(from, to) {
    const F = this.cur; if (!F) return [to.clone()];
    const cellAt = (p) => F.cells.find((c) => Math.abs(p.x - c.x) <= CELL / 2 && Math.abs(p.z - c.z) <= CELL / 2);
    const a = cellAt(from), b = cellAt(to);
    if (!a || !b || a === b) return [to.clone()];
    const STEP = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }, key = (c) => `${c.c},${c.r}`, prev = new Map([[key(a), null]]), q = [a];
    while (q.length) {
      const c = q.shift(); if (c === b) break;
      for (const d of c.doors) { const n = F.cells.find((k) => k.c === c.c + STEP[d][0] && k.r === c.r + STEP[d][1]); if (n && !prev.has(key(n))) { prev.set(key(n), c); q.push(n); } }
    }
    if (!prev.has(key(b))) return [to.clone()];
    const chain = []; for (let c = b; c; c = prev.get(key(c))) chain.unshift(c);
    const out = [];
    for (let i = 1; i < chain.length; i++) out.push(new THREE.Vector3((chain[i - 1].x + chain[i].x) / 2, WELL_AT.y, (chain[i - 1].z + chain[i].z) / 2));
    out.push(to.clone());
    return out;
  }

  /** The interact source: the mouth from outside, the pools inside. */
  nearest(P) {
    const pick = (pos, ref) => { const d = Math.hypot(pos.x - P.pos.x, pos.z - P.pos.z); return d < REACH && Math.abs(P.pos.y - pos.y) < 2 ? { pos: pos.clone().setY(pos.y + 1.4), d, ref } : null; };
    if (!this.run) return pick(this.mouthPos, 'mouth');
    if (!this.cur) return null;
    return (this.cur.down && pick(this.cur.down.pos, 'down')) || pick(this.cur.up.pos, 'up');
  }

  update(dt) {
    const g = this.game, P = g.player;
    this.t += dt;
    if (this.mouth.visible) {
      this.maw.update(this.t, 1);
      const near = P.pos.distanceTo(this.mouthPos) < 70;
      if (near && !this.motes?.alive) this.motes = g.vfx?.play('dunemaw.motes', { pos: this.mouthPos.clone() });
      else if (!near && this.motes) { this.motes.stop?.(); this.motes = null; }
    }
    this.cur?.update(dt);
    if (this.run && this.cur) this.watch();
    // F at the mouth or a pool
    const it = g.interact?.cur;
    if (it?.id === 'well' && P.peekLatch?.('KeyF') && !g.god?.controlling) {
      P.latch('KeyF');
      if (it.ref === 'mouth') this.enter(); else if (it.ref === 'down') this.down(); else this.up();
    }
    // somewhere else while a run is on (a teleport, the stress test, a fall the floor did not catch): the run is over and nothing is kept
    if (this.moving > 0) this.moving--;
    else if (this.run && !g.death?.active && zoneOf(P.pos) !== 'well') this.end(true);
  }
}

/** (The greybox pool's spiral, kept for reference; the pool is vfx/dunemaw.js now.) */
export function spiralTexture() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), grd = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, '#05020a'); grd.addColorStop(0.7, '#1a0f2a'); grd.addColorStop(1, '#3a2350');
  x.fillStyle = grd; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(154,107,255,0.35)'; x.lineWidth = 3;
  for (let arm = 0; arm < 3; arm++) {
    x.beginPath();
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = arm * (Math.PI * 2 / 3) + t * Math.PI * 2.2, r = t * S * 0.48; x.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r); }
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
