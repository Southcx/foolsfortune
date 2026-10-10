// ---------------------------------------------------------------------------------------
// A SIBLING: another Courier in your world with a mind of its own, one for each division (docs/plans/COOP.md C6; the glossary). It is
// the Courier's own body (`courier/player.js`, the core movement) and rig (`courier/character.js`, the same clips and corrections),
// driven by a mind that presses keys on a virtual keyboard instead of a person's (`VirtualKeys`), so it walks, sprints, jumps and climbs
// exactly as the Courier does. What it does to the world is by Dovina's rulings (COOP.md C6): nothing it does counts toward the
// Courier's records; its body makes the Courier's own sounds from where it stands (Wanda's `sfx.voiceAt`: panned to its side, rolled off
// with distance, gone past 30 m, its own rate limits), footsteps included; it is solid only to the world (its own collision group:
// nothing that listens for the Courier hears it). The Courier's blows reach it (Dovina's v135 ruling, overturning C6's "every blow
// passes through it"): it is a friend in `game.creatures` (friendly fire: a fifth of the damage, no blow past a quarter of its health,
// statuses under tolerance, progress/combat/friendly.js); struck, it flinches; emptied, it shatters and is made whole at its leader's
// side (Calissa's look, vfx/siblingshatter.js: it is held in pieces until then). It wears its division's look (Calissa's,
// vfx/siblinglooks.js). Its rig has its own fade and dissolve and is never hidden by the first-person view.
//
// Prior art: the Kingdom Hearts party, and the companion built from the player's own controller (Halo's co-op Arbiter, Sonic's Tails
// driven by a second pad): one body, two drivers.
//
//   const S = new Sibling(game, { id, color, look, rig, slot, of })   S.fixed(dt, ctx)   S.update(dt, alpha)   S.order   S.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Player } from '../courier/player.js';
import { GROUPS } from '../core/physics.js';
import { T } from '../core/config.js';
import { Follow } from './follow.js';
import { SiblingFight } from './fight.js';
import { SiblingPoint } from './point.js';
import { sfx } from '../audio/sfx.js';
import { tag } from '../core/tags.js';

const _gd = new THREE.Vector3(0, -1, 0), _fl = new THREE.Vector3();
export const SIB = { hp: 8, mendAfter: 4, mend: 0.5, flinch: 3 }; // (a slip jelly's health; sim seconds after a blow before it mends, health a second; m/s a blow pushes)

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
  constructor(game, { id, color, look, rig, slot = 0, of = 1, seen = new WeakSet() }) {
    this.game = game; this.id = id; this.color = color; this.order = 'follow'; this.to = null; // (the order, and where 'go' goes)
    this.keys = new VirtualKeys();
    const B = (this.body = new Player(game.physics, new THREE.PerspectiveCamera(), this.keys));
    B.sfx = sfx.voiceAt(() => this.pos, { listener: () => game.camera, tag: id }); B.isPlayer = false; B.kind = 'sibling';
    B.collider.setCollisionGroups(GROUPS.sibling);
    // what a shot or a blow finds: a friend (creatures.js strike: friendly fire)
    const self = this, c = (this.ent = {
      type: 'creature', kind: 'sibling', sibling: this, id, alive: true, hp: SIB.hp, maxHp: SIB.hp, radius: 0.4, height: 1.8, quietT: 0,
      get pos() { return B.pos; }, get vel() { return B.vel; },
      center: (o) => o.copy(B.pos).setY(B.pos.y + 0.9),
      hurt: (p, dir, dmg, cause, by) => self.hurt(dmg, dir, cause, by),
      knock: (v) => B.vel.add(v),
    });
    tag(c, 'hurtable'); game.creatures?.addFriend(c);
    game.physics.register(B.collider, c);
    this.rig = rig; rig.gun.visible = false; rig.gunOff = true; rig.root.name = `Sibling-${id}`;
    rig.onFootstep = () => B.sfx.footstep?.(); // (the rig's heel strikes, as the Courier's are: main.js)
    game.vessel?.dress(rig, look, { own: true }); // (its division's look, coop/party.js lookOf, on the Courier's own finish shaders)
    this.follow = new Follow(B, this.keys, { slot, of }); this.fight = new SiblingFight(this); this.point = new SiblingPoint(this, seen); // (seen: what the party has pointed at)
    this.lastHeading = null; this.leader = null;
    B.respawn = () => { if (this.leader) this.follow.warp(this.leader); }; // (fallen out of the world: back to its leader, never to the workshop's spawn)
    this.follow.onStuck = (fix) => { // (told to stand where it could not walk: set down there, or back to following, and said: casebook rule 32)
      game.events.emit('sibling.stuck', { sibling: id, order: this.order, fix, by: 'sibling' });
      if (fix === 'gave-up') { this.order = 'follow'; this.to = null; }
    };
  }

  /** Struck by the Courier (friendly fire, already scaled by creatures.strike): it flinches; emptied, it shatters and is made whole beside
   *  its leader, its health full. */
  hurt(dmg, dir, cause, by) {
    const c = this.ent, B = this.body;
    c.hp = Math.max(0, c.hp - dmg); c.quietT = SIB.mendAfter;
    if (dir) B.vel.addScaledVector(_fl.copy(dir).setY(0).normalize(), SIB.flinch);
    const down = c.hp <= 0;
    this.game.events.emit('sibling.hit', { sibling: this.id, cause, hp: +c.hp.toFixed(1), down, by });
    if (down) { c.hp = c.maxHp; if (!this.game.siblingShatter?.begin(this, dir) && this.leader) this.follow.warp(this.leader); } // (it breaks, lies a beat and is drawn back together beside its leader: vfx/siblingshatter.js)
    return true;
  }

  /** Where it stands and how it is placed in the world (feet). */
  get pos() { return this.body.pos; }
  setSlot(slot, of) { this.follow.slot = slot; this.follow.of = of; }
  warp(leader) { this.follow.warp(leader); }

  /** The fixed step: the mind presses its keys, the body moves as the Courier's does. */
  fixed(dt, ctx) {
    this.leader = ctx.leader;
    const held = !!this.game.siblingShatter?.holds(this); this.ent.alive = !held; // (in pieces: nothing to strike, vfx/siblingshatter.js)
    if (held) { this.body.vel.set(0, 0, 0); this.keys.release(); return; } // (and nothing moves it until it is whole)
    const c = this.ent; if ((c.quietT -= dt) <= 0 && c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + SIB.mend * dt); // (mends when left alone)
    this.body.killY = ctx.leader.killY; // (the place's floor is set on the Courier's body: world/places.js; a sibling stands in the same place)
    const goal = this.fight.think(dt, { game: this.game, leader: ctx.leader, order: this.order }); // (something to fight: where to stand, coop/fight.js)
    this.follow.think(dt, goal ? { ...ctx, order: 'engage', to: goal } : { ...ctx, order: this.order === 'fight' ? 'guard' : this.order, to: this.to });
    this.body.fixedUpdate(dt, { adsT: 0, wantsFire: false });
    this.keys.step();
    if (!this.fight.target) this.point.update(dt, this.game); // (between fights: what lies loose, pointed at, never taken: coop/point.js)
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
      walkSpeed: T.movement.walkSpeed, sprintSpeed: T.movement.sprintSpeed, recoil: 0, adsT: 0, landed: B.landed, techs: this.fight, // (the fight's blows: a layer, as a tech's)
    });
    B.landedOut = B.landed; B.landed = 0;
    this.keys.frame();
  }

  dispose() {
    const P = this.game.physics;
    this.ent.alive = false; this.game.creatures?.removeFriend(this.ent);
    P.removeBody(this.body.body); P.world.removeCharacterController(this.body.ctrl);
    this.rig.dispose();
  }
}
