// ---------------------------------------------------------------------------------------
// THE PSYGUN'S MOVES: the Courier's own suite (melee.glb's Gun_*) on the gun. Over the aim (character.js keeps aimMid/aimUp/aimDown, which
// the gun's sockets are measured from): a shot's recoil (Gun_Shoot, a short overlay on the arms), the rack (Gun_Reload) and the quick draw
// (Gun_QuickDraw, over the procedural draw's last beat). Moves of its own, on the shared combo engine (tools/moveset.js), the aim giving
// way to them for as long as they play:
//
//   LMB, something close   the PISTOL WHIP: a creature or a clapperjar within 1.6 m in front, and the trigger is a backhand with the gun
//   R                      FANNING THE HAMMER: the gun at the hip, six quick shots slapped off over 1.1 s, wide (8 Lachryma for the six)
//   (after a fight)        the FLOURISH: put away by itself after a fight, the gun is spun round a finger first (Gun_Twirl's gun hand;
//                          its free hand, which rises across the face, is left to the walk), and any input cuts it short
//
// Gun_Idle, the suite's ready, is not used: its arms are the aim's held out, and part-way up they hover (measured, and looked at): out of
// a fight the gun hangs in the hand as it always has. Gun_AimMid/Up/Down are not used either: the gun's sockets are aimMid's.
//
// Prior art, and what was taken:
//  - The western's gunslinger (fanning the hammer, the spin before the holster: Red Dead Redemption's Dead Eye fan, Revolver Ocelot's
//    twirl in Metal Gear Solid), and the pistol whip of every shooter that lets the gun be a club up close (Gears of War, Halo's melee:
//    the same button when something is in reach, a blow instead of a shot).
//  - The additive recoil overlay of the shooters' animation trees (a short clip's motion against its own first frame, laid on the aim
//    pose, never replacing it: character.js).
//
//   const G = new GunMoves(weapon)   G.update(dt, input, { allow })   G.tryWhip()   G.layer -> { pose, w, arm? } | null (character.js;
//   `arm: 'R'`: the gun hand's alone)
//   G.shotW()/G.shotAt() (the recoil overlay's weight and clip time)   G.quickDraw() -> { t, w } | null   G.afterHands(character, player)
//   (the flourish's spin)   G.weight (how much of the arms a move has: the weapon's `combatBlend` gives it up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Moveset } from '../moveset.js';
import { targets } from '../melee.js';
import { GUN_POINTS } from '../../courier/character.js';
import { T } from '../../core/config.js';

// Clip seconds throughout. The whip's blow is measured from the clip on the gun hand (melee.js); numbers are proposals for Dovina: the
// whip strikes a creature at K x power (a shot is 1: a blow at arm's length is worth a little more than a shot, and costs nothing);
// the fan is six shots for 8 Lachryma (six taps are 24), three times as wide.
const MOVES = {
  whip: { clip: 'Gun_PistolWhip', rate: 1.15, to: 0.66, fade: 0.2, lunge: 2.5, limb: 'R', tip: 0.3, hit: { power: 1.4, dmg: 1.2, push: 5, lift: 1.5 }, heat: 0.5 },
  fan: { clip: 'Gun_FanTheHammer', cost: 8, to: 1.1, fade: 0.18 },
};
const K = 0.9, WHIP_REACH = 1.6, WHIP_CONE = 0.7;
const FAN = [0.07, 0.23, 0.4, 0.57, 0.73, 0.9]; // (the left palm's six slaps on the hammer, read from the clip: where the hands meet)
const SHOT = { from: 0.26, dur: 0.3, w: 1 }; // (Gun_Shoot from the frame before its kick (the hands 10 cm up and back at 0.3), over the aim)
const QUICK = [0.18, 0.55]; // (Gun_QuickDraw from the hand at the hip to the aim, over the draw's whip)
const FLOURISH = { dur: 1.1, spin: [0.14, 0.86], turns: 2 }; // (the hand is still at the shoulder from 0.13 to 0.87: the gun turns)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q0 = new THREE.Quaternion();
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class GunMoves {
  constructor(weapon) {
    this.W = weapon;
    this.shotT = 9; this.flourishT = -1; this.fanDue = 0; this.layer = null; this.weight = 0;
    this.moves = new Moveset(this, {
      id: 'psygun', moves: MOVES, strings: { special: 'fan' }, specialKey: 'KeyR', limb: 'R', tip: 0.3, reach: 0.3, k: K, pot: 50, cause: 'bashed',
      events: { swing: 'gun.move', hit: 'gun.hit' }, onUpdate: (c) => this.onUpdate(c),
    });
  }
  get game() { return this.W.game; }
  get P() { return this.W.game.player; }
  get busy() { return this.moves.busy || this.flourishT >= 0; }

  /** Once a frame from Weapon.update: the engine (R is read there), the flourish's clock, and the layer the character will draw. */
  update(dt, input, { allow }) {
    this.shotT += dt;
    // the quick draw: the last beat of a draw (the gun in the hand, whipped up to the aim) follows Gun_QuickDraw's rise (character.js)
    const W = this.W, d = W.drawT, up = d > (this.lastDraw ?? 0) || (W.drawTarget > 0 && d < 1);
    this.drawU = up && d > T.weapon.drawGrab && d < 1 ? smooth(T.weapon.drawGrab, 1, d) : -1;
    this.lastDraw = d;
    this.moves.update(dt, input, { allow });
    if (this.flourishT >= 0) { this.flourishT += dt; if (this.flourishT >= FLOURISH.dur) this.flourishT = -1; }
    const C = this.game.character?.clips;
    if (!C) { this.layer = null; this.weight = 0; return; }
    let L = this.moves.pose(C, (this.buf ||= C.pose()));
    if (!L && this.flourishT >= 0) {
      const t = this.flourishT, w = smooth(0, 0.12, t) * (1 - smooth(FLOURISH.dur - 0.2, FLOURISH.dur, t));
      L = { pose: C.sample('Gun_Twirl', t, this.buf, false), w, arm: 'R' }; // (the gun hand's alone: the clip's free hand rises over the face)
    }
    this.layer = L && L.w > 0.001 ? L : null;
    this.weight = this.layer ? this.layer.w : 0;
  }

  /** LMB with a creature or a clapperjar close in front: the whip instead of the shot (true when it began). */
  tryWhip() {
    if (this.moves.busy || !this.near()) return false;
    this.flourishT = -1;
    return this.moves.begin('whip', 'ground', 0);
  }

  /** Something worth a whip: in reach and in front of where they look. */
  near() {
    const g = this.game, P = this.P, f = P.lookDir(_a).setY(0);
    if (f.lengthSq() < 1e-4) return false;
    f.normalize();
    for (const t of targets(g, P.pos, WHIP_REACH + 1)) {
      if (t.kind !== 'creature' && t.kind !== 'clapper') continue;
      if (t.ent.ally || Math.abs(t.pos.y - P.pos.y - 0.8) > 1.4) continue;
      const dx = t.pos.x - P.pos.x, dz = t.pos.z - P.pos.z, d = Math.hypot(dx, dz);
      if (d - t.r > WHIP_REACH) continue;
      if (d > 0.3 && (dx * f.x + dz * f.z) / d < Math.cos(WHIP_CONE)) continue;
      return true;
    }
    return false;
  }

  /** The fan's shots come due on the slaps (the weapon fires them after the pose, where the muzzle is: Weapon.tryFire). */
  onUpdate(c) {
    if (c.id !== 'fan') return;
    for (const t of FAN) if (c.tPrev < t && c.t >= t) this.fanDue++;
  }

  /** A shot was fired (the recoil overlay starts over, and it was a fight: the flourish may follow when the gun is put away). */
  shot() { this.shotT = 0; this.fought = true; this.flourishT = -1; }
  shotW() { const t = this.shotT; return t >= SHOT.dur ? 0 : SHOT.w * (1 - smooth(SHOT.dur - 0.12, SHOT.dur, t)); } // (no ease in: a kick is a jolt)
  shotAt() { return SHOT.from + this.shotT; }
  /** The quick draw's clip time and weight while a draw whips the gun up (character.js), or null. */
  quickDraw() { const u = this.drawU; return u < 0 ? null : { t: QUICK[0] + (QUICK[1] - QUICK[0]) * u, w: 1 - smooth(0.8, 1, u) }; }

  /** Put away by itself after a fight: the flourish first (true while it plays; the holster waits for it). */
  flourish(player) {
    if (this.flourishT >= 0) return true;
    if (!this.fought || player.fp || this.moves.busy || this.W.drawT < 1 || !this.game.character?.clips.clips.Gun_Twirl) return false;
    this.fought = false; this.flourishT = 0;
    this.game.events?.emit('gun.flourish', { by: 'courier' });
    return true;
  }
  stopFlourish() { this.flourishT = -1; }

  /** After the hands are posed: the flourish spins the gun round the finger in the trigger guard (the hand itself holds still). */
  afterHands(character, player) {
    const t = this.flourishT, [t0, t1] = FLOURISH.spin;
    if (t < 0 || player.fpWeight > 0.5 || !character.gun) return;
    const u = smooth(t0, t1, t), k = smooth(t0 - 0.1, t0, t) * (1 - smooth(t1, t1 + 0.1, t));
    if (k <= 0) return;
    const gun = character.gun, s = character.gunScale;
    const pivot = _a.set(GUN_POINTS.gripR.x + 0.07, GUN_POINTS.gripR.y + 0.07, 0).multiplyScalar(s).applyMatrix4(gun.matrixWorld);
    // (about the body's own side-to-side axis, the barrel first turned square to it: every part of the gun stays as far out from the body
    // as the hand is, and the barrel's circle passes the head at the shoulder's width, never through it)
    const side = _b.set(Math.cos(player.bodyYaw), 0, -Math.sin(player.bodyYaw)), bar = _c.set(1, 0, 0).applyQuaternion(gun.quaternion);
    _q.setFromUnitVectors(bar, _d.copy(bar).addScaledVector(side, -bar.dot(side)).normalize());
    _q.slerp(_q0, 1 - k).premultiply(_q2.setFromAxisAngle(side, u * FLOURISH.turns * Math.PI * 2));
    gun.position.sub(pivot).applyQuaternion(_q).add(pivot);
    gun.quaternion.premultiply(_q);
    gun.updateMatrixWorld(true);
  }

  cancel() { this.moves.cancel(); this.flourishT = -1; this.fanDue = 0; this.layer = null; this.weight = 0; }
}
