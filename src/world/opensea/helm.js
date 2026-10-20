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
//   new Helm(room, ship = 'sloop')   .pos .yaw .speed .throttle (0..3) .look   .update(dt, input, current?) -> { full }   .placeAt(pos, yaw)
//   .camera(dt, input)   .hold(player)   .show(on)   THROTTLE (the four speeds, x the cruise)   HELM (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shipLook } from '../../vfx/shipclasses.js';
import { ShipWake } from '../../vfx/rail.js';
import { SHIPS } from '../../progress/rail/ships.js';

/** The throttle's four steps, as a share of cruise. */
export const THROTTLE = [0, 0.5, 1, 1.5];
/** cruise: m a real s (a square of 400 m in 40 s); accel: m/s each real s; turn: rad a real s at cruise; cam: the chase's offset astern
 *  and up and how far ahead it looks; orbit: rad a real s the arrows swing it. */
export const HELM = { cruise: 10, accel: 2.2, turn: 0.42, cam: { back: 15, up: 5.5, ahead: 12 }, orbit: 1.6, pitchMax: 0.5 };

const _f = new THREE.Vector3(), _c = new THREE.Vector3(), _l = new THREE.Vector3();

export class Helm {
  constructor(room, ship = 'sloop') {
    this.room = room; this.game = room.game; this.ship = ship;
    this.look = shipLook(ship, { env: this.game.sky?.env || null });
    this.look.group.userData.zone = 'opensea'; this.game.scene.add(this.look.group);
    this.wake = new ShipWake(this.game);
    this.pos = new THREE.Vector3(); this.yaw = 0; this.speed = 0; this.throttle = 0; this.rudder = 0; this.t = 0;
    this.orbit = 0; this.tilt = 0.25; this.seaT = 0;
  }
  get cruise() { return HELM.cruise * (SHIPS[this.ship]?.speed ?? 1.2) / 1.2; }
  get full() { return this.throttle === 3; }
  placeAt(pos, yaw = 0) { this.pos.copy(pos); this.yaw = yaw; this.speed = 0; this.throttle = 0; this.pose(0); }
  show(on) { this.look.group.visible = on; }

  /** One frame at the helm: the throttle and rudder from the keys, the current's push, the ship moved and posed on the sea. */
  update(dt, input, current = null) {
    if (input.wasPressed('KeyW')) this.throttle = Math.min(3, this.throttle + 1);
    if (input.wasPressed('KeyS')) this.throttle = Math.max(0, this.throttle - 1);
    const steer = (input.isDown('KeyA') ? 1 : 0) - (input.isDown('KeyD') ? 1 : 0);
    this.rudder += (steer - this.rudder) * Math.min(1, dt * 4);
    const target = THROTTLE[this.throttle] * this.cruise;
    this.speed += Math.sign(target - this.speed) * Math.min(Math.abs(target - this.speed), HELM.accel * dt);
    this.yaw += this.rudder * HELM.turn * dt * Math.min(1.4, 0.25 + this.speed / this.cruise);
    _f.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.pos.addScaledVector(_f, this.speed * dt);
    if (current) this.pos.addScaledVector(current, dt);
    this.pose(dt);
    return { full: this.full };
  }

  /** The ship on the drawn sea: its height and its pitch and roll from the water under bow, stern and beam. */
  pose(dt) {
    const g = this.game, sea = g.emocean?.sea, L = this.look.length ?? 7, B = this.look.beam ?? 2.4;
    this.t += dt; this.seaT = g.emocean?.seaT ?? this.t;
    const h = (x, z) => (sea ? sea.heightAt(x, z, this.seaT) : this.pos.y);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const y = h(this.pos.x, this.pos.z), bow = h(this.pos.x + fx * L * 0.5, this.pos.z + fz * L * 0.5), stern = h(this.pos.x - fx * L * 0.5, this.pos.z - fz * L * 0.5);
    const port = h(this.pos.x + fz * B * 0.5, this.pos.z - fx * B * 0.5), star = h(this.pos.x - fz * B * 0.5, this.pos.z + fx * B * 0.5);
    this.pos.y = y;
    const pitch = Math.max(-HELM.pitchMax, Math.min(HELM.pitchMax, Math.atan2(stern - bow, L)));
    const roll = Math.atan2(port - star, B) * 0.6 - this.rudder * Math.min(1, this.speed / this.cruise) * 0.12;
    const G = this.look.group; G.position.copy(this.pos); G.rotation.set(pitch, this.yaw, roll, 'YXZ');
    this.look.set?.({ sail: 0.15 + 0.85 * (this.throttle / 3), heel: roll, side: 1, glow: 0.35, t: this.t });
    if (dt > 0) this.wake.update(dt, { group: G, speed: this.speed, length: L, beam: B }, sea);
  }

  /** The chase camera, swung by the mouse or the arrow keys (the owner's screenshots), through the cinema so it holds while sailing. */
  camera(dt, input) {
    const g = this.game;
    const swing = (input.isDown('ArrowLeft') ? 1 : 0) - (input.isDown('ArrowRight') ? 1 : 0), rise = (input.isDown('ArrowUp') ? 1 : 0) - (input.isDown('ArrowDown') ? 1 : 0);
    this.orbit += swing * HELM.orbit * dt - (input.dx || 0) * 0.004;
    this.tilt = Math.max(-0.1, Math.min(1.1, this.tilt + rise * 0.8 * dt + (input.dy || 0) * 0.003));
    const a = this.yaw + Math.PI + this.orbit, C = HELM.cam;
    _c.set(this.pos.x + Math.sin(a) * C.back * Math.cos(this.tilt), this.pos.y + C.up + Math.sin(this.tilt) * C.back, this.pos.z + Math.cos(a) * C.back * Math.cos(this.tilt));
    _l.set(this.pos.x + Math.sin(this.yaw) * C.ahead, this.pos.y + 1.5, this.pos.z + Math.cos(this.yaw) * C.ahead);
    g.cinema?.shot('opensea', { pos: _c, look: _l, bars: 0, ease: 30 });
  }

  /** The Courier held at the helm (hidden by the room): where the zones, the weather and the sound think they are. */
  hold(P) {
    P.pos.copy(this.pos).setY(this.pos.y + 1.2); P.prevPos?.copy(P.pos); P.renderPos?.copy(P.pos); P.vel?.set(0, 0, 0); P.place?.();
  }
}
