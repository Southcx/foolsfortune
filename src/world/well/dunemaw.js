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
// Events (each with `by`): well.enter { well, seed, day }, well.floor { well, floor, charted }, well.leave { well, floors, foes, pay,
// charted, shattered, fill } (SLICE.md's contract). game.well.active and .floor are what the music listens to (music/choose.js, Wanda's).
//
//   game.well = new Dunemaw(game)   .update(dt)   .enter()   .down()   .up()   .active   .floor   .killY   .reformAt() -> { pos, yaw }
//   .nearest(P) -> { pos, d, ref: 'mouth' | 'up' | 'down' } | null   (the interact source, main.js)   .toArrival()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUNE } from '../dunes/dunes.js';
import { layoutFloor, buildFloor, GRID, CELL } from './wellkit.js';
import { wellSeed } from '../../progress/econ/islands.js';
import { today } from '../../core/calendar.js';
import { zoneOf } from '../../render/zones.js';
import { mergeStatic } from '../../render/merge.js';

export const WELL_ID = 'dunemaw';
/** Where the floors are built: far west of the basement and far below the Dunes (its own zone, render/zones.js, and its own map layer,
 *  feedback/cartography.js: both decided by height). The grid's north-west corner. */
export const WELL_AT = new THREE.Vector3(-1300 - (GRID * CELL) / 2, -900, -(GRID * CELL) / 2);
/** The mouth, in the dunes' local frame (metres from the centre): out past the oasis, to the north-west. */
const MOUTH_LOCAL = { x: -150, z: -120 };
const FLOORS = 3, REACH = 2.4;

export class Dunemaw {
  constructor(game) {
    this.game = game;
    this.run = null; // { seed, day, floor, deepest, foes, pay, shattered }
    this.cur = null; // the floor standing (wellkit.buildFloor)
    this.t = 0;
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
    this.pool = new THREE.Mesh(new THREE.CircleGeometry(3, 40), new THREE.MeshBasicMaterial({ map: spiralTexture(), color: 0xffffff, transparent: true, opacity: 0.96 }));
    this.pool.rotation.x = -Math.PI / 2; this.pool.position.y = 0.08; this.pool.name = 'dunemaw-pool';
    this.rim = new THREE.Mesh(new THREE.RingGeometry(2.95, 3.35, 40), new THREE.MeshBasicMaterial({ color: 0x9a6bff, transparent: true, opacity: 0.6 }));
    this.rim.rotation.x = -Math.PI / 2; this.rim.position.y = 0.06; this.rim.name = 'dunemaw-rim';
    grp.add(this.pool, this.rim);
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
    this.run = { seed, day, floor: 0, deepest: 0, foes: 0, pay: 0 };
    this.game.events?.emit('well.enter', { well: WELL_ID, seed, day, by: 'courier' });
    this.goTo(1);
    return true;
  }
  down() { if (this.run && this.run.floor < FLOORS && this.cur?.down) this.goTo(this.run.floor + 1); }
  up() { if (this.run) this.leave(false); }

  goTo(n) {
    const g = this.game, R = this.run;
    this.cur?.dispose();
    this.cur = buildFloor(g, layoutFloor(R.seed, n), WELL_AT, n);
    R.floor = n; R.deepest = Math.max(R.deepest, n);
    this.moving = 2; // (a couple of frames for the teleport to land before the zone check below)
    g.player.killY = this.killY; // (now, not next frame: the floor is far above the dunes' killY, the mouth far below the Well's)
    g.course.teleport(this.cur.arrive.pos, this.cur.arrive.yaw, { keepPool: true });
    g.events?.emit('well.floor', { well: WELL_ID, floor: n, charted: 0, by: 'courier' });
  }

  /** Out of the Well: up the way up (shattered false, the haul kept), or lost (shattered true: nothing is taken home). */
  end(shattered) {
    const R = this.run; if (!R) return;
    this.game.events?.emit('well.leave', { well: WELL_ID, floors: R.deepest, foes: R.foes, pay: shattered ? 0 : R.pay, charted: 0, shattered, fill: 1, by: 'courier' });
    this.cur?.dispose(); this.cur = null;
    this.run = null;
    this.game.player.killY = DUNE.y - 90; // (back to the dunes' floor of the world, before the next step: see goTo)
  }
  leave(shattered) {
    this.end(shattered);
    const s = this.mouthSpot();
    this.game.course.teleport(s.pos, s.yaw, { keepPool: true });
  }
  /** Shattered in the Well: the run is lost and they come to again at the mouth (courier/vessel/death.js). */
  reformAt() { if (!this.run) return null; this.end(true); return this.mouthSpot(); }
  /** Back to where this floor began (the Tab panel's respawn, a fall). */
  toArrival() { if (this.cur) { this.moving = 2; this.game.course.teleport(this.cur.arrive.pos, this.cur.arrive.yaw, { keepPool: true }); } }

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
    if (this.mouth.visible) { this.pool.rotation.z = -this.t * 0.5; this.rim.material.opacity = 0.5 + 0.15 * Math.sin(this.t * 1.7); }
    this.cur?.update(dt);
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

/** The mouth's pool: dark arms turning in on themselves (the pool turns; the texture does not scroll). */
function spiralTexture() {
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
