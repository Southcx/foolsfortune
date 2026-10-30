// ---------------------------------------------------------------------------------------
// THE FREE HELM (docs/plans/OPEN-SEA.md section 3; the owner, 2026-10-20: "Free Helm ... why bother otherwise"): the ship on the open sea,
// steered by you. W and S step the throttle through stop, slow, cruise and full sail (a ship's telegraph: Wind Waker's sail up or down, Sea
// of Thieves' sails raised or lowered, not a held accelerator); A and D put the rudder over, and the ship turns harder the faster it
// goes. It rides the drawn sea (the crude sea's heightAt: what is drawn is what is ridden), pitching and rolling with it, leaves the
// rail's wake (vfx/rail.js ShipWake), and is pushed by the current when you have lost your fix (the voyage's doubt). The camera chases it
// from astern; the mouse or the arrow keys swing it round (the owner asked for the arrows for screenshots). The Courier is sealed in at
// the helm: hidden, held at the ship, its own body and tools idle (main.js's `aboard`).
//
// Prior art: The Legend of Zelda: The Wind Waker's King of Red Lions (sail and rudder, the sea ridden), Sea of Thieves' sloop (sail
// trims and the wheel, momentum), Sid Meier's Pirates! (a few speeds, not a pedal); the rail's chase rig (courier/ship/views.js).
//
//   new Helm(room, ship = 'sloop')   .pos .yaw .speed .throttle (0..3) .look   .update(dt, input, current?, wind?) -> { full }   .placeAt(pos, yaw)
//   .sail (sailOf: the point of sail now, OPEN-SEA.md 14)   .takeBurnK() -> the burn's share over the way since last asked
//   .camera(dt, input)   .hold(player)   .show(on)   .mods (Map: source -> { turn, speed }, what holds the helm)   THROTTLE (the four speeds, x the cruise)   HELM (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shipLook } from '../../vfx/shipclasses.js';
import { ShipWake } from '../../vfx/rail.js';
import { SHIPS } from '../../progress/rail/ships.js';
import { sailOf } from '../../progress/opensea/wind.js';

/** The throttle's four steps, as a share of cruise. */
export const THROTTLE = [0, 0.5, 1, 1.5];
/** cruise: m a real s (a square of 400 m in 40 s); accel: m/s each real s; turn: rad a real s at cruise (0.6: a hard turn at a ram's
 *  first sight clears its ring, world/opensea/seafight.js); cam: the chase's offset astern and up, how far ahead it looks and how far
 *  it leans into a turn (m); orbit: rad a real s the arrows swing it; recentre: after so long untouched (real s) it swings back astern
 *  at this rate (Wind Waker's camera), but not while something hunts the ship (the gun is aimed with the camera). */
export const HELM = { cruise: 10, accel: 2.2, turn: 0.6, cam: { back: 15, up: 5.5, ahead: 12, lean: 5 }, orbit: 1.6, pitchMax: 0.5, recentre: { after: 3, rate: 0.7 } };

const _f = new THREE.Vector3(), _c = new THREE.Vector3(), _l = new THREE.Vector3();

export class Helm {
  constructor(room, ship = 'sloop') {
    this.room = room; this.game = room.game; this.ship = ship;
    this.look = shipLook(ship, { env: this.game.sky?.env || null });
    this.look.group.userData.zone = 'opensea'; this.game.scene.add(this.look.group);
    this.wake = new ShipWake(this.game);
    this.pos = new THREE.Vector3(); this.yaw = 0; this.speed = 0; this.throttle = 0; this.rudder = 0; this.t = 0;
    this.orbit = 0; this.tilt = 0.25; this.seaT = 0;
    this.sail = null; this.burnWay = 0; this.burnSum = 0; // (the wind: wind.js; the burn's share averaged over the way sailed, for the next square's fuel)
    this.mods = new Map(); // (what holds the helm, by its source: { turn, speed } shares; the sea serpent's coil, world/opensea/seafight.js)
  }
  get cruise() { return HELM.cruise * (SHIPS[this.ship]?.speed ?? 1.2) / 1.2 * (this.game.shipParts?.mult('cruise') ?? 1); }
  get full() { return this.throttle === 3; }
  placeAt(pos, yaw = 0) { this.pos.copy(pos); this.yaw = yaw; this.speed = 0; this.throttle = 0; this.pose(0); }
  show(on) { this.look.group.visible = on; }
  /** m from `p` to the hull's footprint on the water, 0 inside it: its length along the heading, its beam across (a 35 m hull is no point:
   *  the ram, the coil and the spit find its side, not its middle). */
  hullDist(p) {
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z, s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const along = Math.abs(dx * s + dz * c) - (this.look?.length ?? 7) / 2, across = Math.abs(dx * c - dz * s) - (this.look?.beam ?? 2.4) / 2;
    return Math.hypot(Math.max(0, along), Math.max(0, across));
  }

  /** One frame at the helm: the throttle and rudder from the keys, the current's push, the ship moved and posed on the sea. */
  update(dt, input, current = null, wind = null) {
    if (input.wasPressed('KeyW')) this.throttle = Math.min(3, this.throttle + 1);
    if (input.wasPressed('KeyS')) this.throttle = Math.max(0, this.throttle - 1);
    const steer = (input.isDown('KeyA') ? 1 : 0) - (input.isDown('KeyD') ? 1 : 0);
    this.rudder += (steer - this.rudder) * Math.min(1, dt * 4);
    let turnK = this.game.shipParts?.mult('turn') ?? 1, wayK = 1; for (const m of this.mods.values()) { turnK *= m.turn ?? 1; wayK *= m.speed ?? 1; }
    const parts = this.game.shipParts; // (the sail, keel and hull worn: progress/opensea/salvage.js)
    this.sail = wind ? sailOf(this.yaw, wind, parts?.rig()) : null; this.wind = wind;
    const target = THROTTLE[this.throttle] * this.cruise * wayK * (this.sail?.speedK ?? 1);
    this.speed += Math.sign(target - this.speed) * Math.min(Math.abs(target - this.speed), HELM.accel * dt);
    this.yaw += this.rudder * HELM.turn * turnK * dt * Math.min(1.4, 0.25 + this.speed / this.cruise);
    _f.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.pos.addScaledVector(_f, this.speed * dt);
    const way = this.speed * dt; this.burnWay += way; this.burnSum += way * (this.sail?.burnK ?? 1);
    if (current) this.pos.addScaledVector(current, dt * (this.game.shipParts?.mult('rip') ?? 1)); // (a keel tracks through a current, or is pushed more)
    this.pose(dt);
    return { full: this.full };
  }

  /** The burn's share over the way sailed since last asked (1 with no way or no wind), and start again: a square's fuel (seatrip.js sailTo). */
  takeBurnK() { const k = this.burnWay > 1 ? this.burnSum / this.burnWay : 1; this.burnWay = 0; this.burnSum = 0; return k; }

  /** The ship on the drawn sea: its height and its pitch and roll from the water under bow, stern and beam. */
  pose(dt) {
    const g = this.game, sea = g.rail?.sea, L = this.look.length ?? 7, B = this.look.beam ?? 2.4;
    this.t += dt; this.seaT = g.rail?.seaT ?? this.t;
    const h = (x, z) => (sea ? sea.heightAt(x, z, this.seaT) : this.pos.y);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const y = h(this.pos.x, this.pos.z), bow = h(this.pos.x + fx * L * 0.5, this.pos.z + fz * L * 0.5), stern = h(this.pos.x - fx * L * 0.5, this.pos.z - fz * L * 0.5);
    const port = h(this.pos.x + fz * B * 0.5, this.pos.z - fx * B * 0.5), star = h(this.pos.x - fz * B * 0.5, this.pos.z + fx * B * 0.5);
    this.pos.y = y;
    const pitch = Math.max(-HELM.pitchMax, Math.min(HELM.pitchMax, Math.atan2(stern - bow, L)));
    const roll = Math.atan2(port - star, B) * 0.6 - this.rudder * Math.min(1, this.speed / this.cruise) * 0.12;
    const G = this.look.group; G.position.copy(this.pos); G.rotation.set(pitch, this.yaw, roll, 'YXZ');
    this.look.set?.({ sail: 0.15 + 0.85 * (this.throttle / 3), fill: this.sail ? this.sail.share : 1, luff: this.sail?.point === 'irons' ? 1 : 0, heel: roll, side: 1, glow: 0.35, t: this.t, ...(this.wind ? { wind: this.wind.to - this.yaw, windK: this.wind.k } : {}) }); // (the wind relative to the hull: Calissa's sails and pennant)
    if (dt > 0) this.wake.update(dt, { group: G, speed: this.speed, length: L, beam: B }, sea);
  }

  /** The chase camera, swung by the mouse or the arrow keys (the owner's screenshots), through the cinema so it holds while sailing. */
  camera(dt, input) {
    const g = this.game;
    const swing = (input.isDown('ArrowLeft') ? 1 : 0) - (input.isDown('ArrowRight') ? 1 : 0), rise = (input.isDown('ArrowUp') ? 1 : 0) - (input.isDown('ArrowDown') ? 1 : 0);
    this.orbit += swing * HELM.orbit * dt - (input.dx || 0) * 0.004;
    this.tilt = Math.max(-0.1, Math.min(1.1, this.tilt + rise * 0.8 * dt + (input.dy || 0) * 0.003));
    this.idle = swing || rise || input.dx || input.dy ? 0 : (this.idle || 0) + dt;
    if (this.idle > HELM.recentre.after && !g.seaFight?.serpent) { // (untouched, it swings back astern: the shortest way round)
      const o = Math.atan2(Math.sin(this.orbit), Math.cos(this.orbit)); this.orbit = o - Math.sign(o) * Math.min(Math.abs(o), HELM.recentre.rate * dt);
    }
    const a = this.yaw + Math.PI + this.orbit, k = Math.sqrt(this.look.scale || 1), C = { back: HELM.cam.back * k, up: HELM.cam.up * k, ahead: HELM.cam.ahead * k, lean: HELM.cam.lean * k }; // (the chase grown with the hull: by the root of its scale, so the 35 m sloop is framed whole without the camera a stern's length away)
    _c.set(this.pos.x + Math.sin(a) * C.back * Math.cos(this.tilt), this.pos.y + C.up + Math.sin(this.tilt) * C.back, this.pos.z + Math.cos(a) * C.back * Math.cos(this.tilt));
    const lean = this.rudder * C.lean * Math.min(1, this.speed / this.cruise); // (it looks a little into the turn)
    _l.set(this.pos.x + Math.sin(this.yaw) * C.ahead + Math.cos(this.yaw) * lean, this.pos.y + (this.look.deckY || 0) + 1.5, this.pos.z + Math.cos(this.yaw) * C.ahead - Math.sin(this.yaw) * lean);
    g.cinema?.shot('opensea', { pos: _c, look: _l, bars: 0, ease: 30 });
  }

  /** The Courier held at the helm (hidden by the room): where the zones, the weather and the sound think they are. */
  hold(P) {
    P.pos.copy(this.pos).setY(this.pos.y + (this.look.deckY || 0) + 1.2); // (on the deck, not in the hull: the hulls at their life size, deckY ~2.3 m) P.prevPos?.copy(P.pos); P.renderPos?.copy(P.pos); P.vel?.set(0, 0, 0); P.place?.();
  }
}
