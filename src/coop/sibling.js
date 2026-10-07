// ---------------------------------------------------------------------------------------
// A SIBLING: another Courier in your world with a mind of its own, one for each division (docs/plans/COOP.md C6; the glossary). It is
// the Courier's own body (`courier/player.js`, the core movement) and rig (`courier/character.js`, the same clips and corrections),
// driven by a mind that presses keys on a virtual keyboard instead of a person's (`VirtualKeys`), so it walks, sprints, jumps and climbs
// exactly as the Courier does. What it may do to the world beyond moving waits on Dovina's rulings (COOP.md): until then it is silent
// to the bus (no events, so nothing it does counts toward the Courier's records), quiet (its body's sounds are a silent set until Wanda
// gives it its own), solid only to the world (its own collision group: nothing that listens for the Courier hears it), and every
// blow passes through it. Its rig has its own fade and dissolve and is never hidden by the first-person view.
//
// Prior art: the Kingdom Hearts party, and the companion built from the player's own controller (Halo's co-op Arbiter, Sonic's Tails
// driven by a second pad): one body, two drivers.
//
//   const S = new Sibling(game, { id, color, glaze, rig, slot, of })   S.fixed(dt, ctx)   S.update(dt, alpha)   S.order   S.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Player } from '../courier/player.js';
import { GROUPS } from '../core/physics.js';
import { T } from '../core/config.js';
import { Follow } from './follow.js';
import { DEFAULT_LOOK } from '../courier/vessel/glazes.js';

const SILENT = new Proxy({}, { get: () => () => {} }); // (every sound the body would make, made by no one)
const _gd = new THREE.Vector3(0, -1, 0);

/** The keys a mind presses: what the Courier's body reads from a keyboard (isDown, wasPressed, the look's dx and dy). */
export class VirtualKeys {
  constructor() { this.down = new Set(); this.pressed = new Set(); this.taps = new Set(); this.dx = 0; this.dy = 0; }
  isDown(code) { return this.down.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  hold(code, on) { if (on) { if (!this.down.has(code)) this.pressed.add(code); this.down.add(code); } else this.down.delete(code); }
  /** Down for one fixed step, then let go (a jump). */
  tap(code) { this.hold(code, true); this.taps.add(code); }
  /** After the fixed step: the taps are let go. */
  step() { for (const c of this.taps) this.down.delete(c); this.taps.clear(); }
  /** After the frame: a press is an edge once. */
  frame() { this.pressed.clear(); }
  release() { this.down.clear(); this.pressed.clear(); this.taps.clear(); }
}

export class Sibling {
  constructor(game, { id, color, glaze, rig, slot = 0, of = 1 }) {
    this.game = game; this.id = id; this.color = color; this.order = 'follow';
    this.keys = new VirtualKeys();
    const B = (this.body = new Player(game.physics, new THREE.PerspectiveCamera(), this.keys));
    B.sfx = SILENT; B.isPlayer = false; B.kind = 'sibling';
    B.collider.setCollisionGroups(GROUPS.sibling);
    game.physics.register(B.collider, { type: 'sibling', sibling: this });
    this.rig = rig; rig.gun.visible = false; rig.gunOff = true; rig.root.name = `Sibling-${id}`;
    game.vessel?.dress(rig, { ...DEFAULT_LOOK, body: glaze, mask: glaze }, { own: true }); // (a placeholder glaze of its suit, on the Courier's own finish shaders: the look is Calissa's to give)
    this.follow = new Follow(B, this.keys, { slot, of });
    this.lastHeading = null; this.leader = null;
    B.respawn = () => { if (this.leader) this.follow.warp(this.leader); }; // (fallen out of the world: back to its leader, never to the workshop's spawn)
  }

  /** Where it stands and how it is placed in the world (feet). */
  get pos() { return this.body.pos; }
  setSlot(slot, of) { this.follow.slot = slot; this.follow.of = of; }
  warp(leader) { this.follow.warp(leader); }

  /** The fixed step: the mind presses its keys, the body moves as the Courier's does. */
  fixed(dt, ctx) {
    this.leader = ctx.leader;
    this.body.killY = ctx.leader.killY; // (the place's floor is set on the Courier's body: world/places.js; a sibling stands in the same place)
    this.follow.think(dt, { ...ctx, order: this.order });
    this.body.fixedUpdate(dt, { adsT: 0, wantsFire: false });
    this.keys.step();
  }

  /** The frame: the body turns and is drawn between steps, the rig poses it (what main.js gives the Courier's rig, without a tool). */
  update(dt, alpha) {
    const B = this.body, R = this.rig;
    B.updateBody(dt, false);
    B.renderPos.lerpVectors(B.prevPos, B.pos, alpha);
    const turnRate = dt > 0 && Math.hypot(B.vel.x, B.vel.z) > 1 ? Math.atan2(Math.sin(B.bodyYaw - (this.lastHeading ?? B.bodyYaw)), Math.cos(B.bodyYaw - (this.lastHeading ?? B.bodyYaw))) / dt : 0;
    this.lastHeading = B.bodyYaw;
    R.animate(dt, {
      pos: B.renderPos, yaw: B.bodyYaw, velocity: B.vel, vy: B.vel.y, turnRate,
      airJump: B.airJumpPulse ? (B.airJumpPulse = false, true) : false,
      ground: this.groundAt ||= (x, z, yTop) => { const hit = B.physics.raycast({ x, y: yTop, z }, _gd, 1.4, B.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic()); return hit && hit.normal.y > 0.6 ? hit.point.y : null; },
      grounded: B.grounded, groundN: B.grounded ? B.groundNormal() : null, groundVel: B.groundVel,
      wall: B.wallBlend, slide: B.slideBlend, mantle: B.mantleBlend, mantleT: B.mantle ? B.mantle.t : 1, dash: B.dashBlend, crouch: B.crouchBlend,
      aimPitch: 0, aimYawOffset: 0, combat: 0, upper: 0, gunHand: 0, reload: -1,
      walkSpeed: T.movement.walkSpeed, sprintSpeed: T.movement.sprintSpeed, recoil: 0, adsT: 0, landed: B.landed, techs: null,
    });
    B.landedOut = B.landed; B.landed = 0;
    this.keys.frame();
  }

  dispose() {
    const P = this.game.physics;
    P.removeBody(this.body.body); P.world.removeCharacterController(this.body.ctrl);
    this.rig.root.parent?.remove(this.rig.root);
    this.rig.root.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); } });
  }
}
