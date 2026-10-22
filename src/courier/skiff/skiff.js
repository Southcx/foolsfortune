// ---------------------------------------------------------------------------------------
// THE SOLAR SKIFF (Solar Skiffing), after the King of Red Lions in The Wind Waker, with a little acrobatics on top.
//
// How Wind Waker sails, and what was taken (see also courier/skiff/boat.js and wake.js):
//   - The boat is driven by the wind alone. A tailwind is fastest; against the wind it is slow and
//     hard; and you can raise the sail or put it away, so the boat can sit still. (Wind Waker HD's
//     "Swift Sail" turns the wind to where you face; here the wind is fixed and shown by an arrow in the
//     world beside the stern, as in the game.)
//   - The sail is a thing you manage: hoisted with a pull (A in the game), and "sail pumping", lowering
//     and raising it again, gives a burst of speed each time (about 70 units against 55 for plain sailing).
//   - The boom swings to leeward, wider the more the wind is behind you; the sail bellies and luffs.
//   - The wake: crisp white bubbles at the bow and a V of white lines and a paler band behind.
//
//   W (hold)  hoist the sail; it stays up. How far up is how much you sail: half up is half speed
//   S (hold)  let it down, and brake. Hoist again quickly and it is a PUMP: a burst of speed
//   A / D     steer (the board can turn on the spot, and carves at speed)
//   Space     hold to crouch the springs, release to hop. In the air A / D spin the whole skiff, rider and
//             all: land a whole turn square for a boost (skiff.ollie { geyser, by }: the hop, or a geyser caught crouched)
//   Q / E     held on the sand at speed: the CARVE, left or right, the board slides and loads in three tiers (A / D tighten or widen
//             it); let go, it runs out with a push by tier (its own keys, not Space: the owner, 2026-10-14, a hop began unwanted carves) (skiff.carve.charge { tier }, skiff.carve { tier }: MK8's mini-turbo; docs/plans/SKIFF-RACING.md)
//   Space     let go just after leaving a crest or a kicker: a LATE POP, higher (skiff.pop { late }: MK8's ramp trick, SSX's pop)
//   Space     held in the air (after a hop, or off a crest; or opened by the Raceway's glide lip): GLIDE, the oars spread as wings, flown
//             as a hang glider: W dives, S flares, Q / E bank and the flight turns with them, A / D still spin (skiff.glide { by }; a Movement Art:
//             skiffGlide; BotW's paraglider, Wind Waker's Deku Leaf, MK8's glider)
//   LMB / RMB held in the air: a GRAB, the nose or the tail (both: the double), the board tweaked under you; let go before you land and
//             it is a trick, worth more the longer held; still held as you land, a wobble and nothing for it (skiff.grab { grab, seconds },
//             skiff.grab.late: SSX's grabs, Tony Hawk's)
//   a sun plate (the Raceway's): a flare's push, free, as strong as the sun (skiff.plate { plate, power }); every trick links into THE
//             TRICK COMBO (courier/skiff/combo.js), banked into free flares; a landing down a slope keeps the fall's speed (skiff.land.slope)
//   Shift     solar flare: the emblem blazes and top speed and acceleration jump, for Lachryma
//   C         a BANKED FLARE (the trick combo's: courier/skiff/combo.js), spent whole: one stock, a push at once (Mario Kart's mushroom:
//             the owner, v204); on a rail too, where W / S still work the sail and Shift still flares
//   Q / E     in the air (not gliding): steer the flight a little, more while flaring (the owner, v198: "boosting in midair doesn't give
//             you any course correction")
//   landing on a rail: along it a 50-50 (the plain grind), across it (spun a quarter turn into it) a BOARDSLIDE, a trick (Tony Hawk's)
//   LMB / RMB double-clicked on a rail: a GRIND TRICK (nose grind, tail slide): the board tweaked on the rail, its metres worth half
//             again in the combo, the balance livelier (skiff.grind.trick { trick })
//   Y         on foot: SUMMON the board (it rises out of the sand under them, the mast telescopes up, they hop on: 2.2 s);
//             riding: RECALL it (they step down and it shrinks into the raised hand). The psygun is stowed while you ride.
//   F         riding slowly: DISMOUNT (they step off and the board is left PARKED, hovering where it was); at a parked board: MOUNT
//   a crash   15 m/s lost into a wall or a ruin head-on (a glancing scrape slides), the board landed more than 70 degrees off its travel,
//             or a sheer drop (40 m/s into the sand along its normal) BAILS them (SKIFF-RACING.md 3): thrown off backward, the
//             board left parked where it slides to a stop; the body thrown as a ragdoll (courier/anim/ragdoll.js) and faded into the get-up
//             (skiff.bail { why, speed, by }; each thump of the tumble skiff.tumble { speed, by }, for its sound)
//
// The rider and the skiff are one rigid unit: one quaternion (heading, then the sand's slope, then
// lean and spin) turns the skiff and, through character.js, the rider standing on it; the rider is
// animated with the Courier's own skiff clips (courier/skiff/rider.js), blended by what the board does.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../moves/techs.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { Skiff, SKIFF } from './boat.js';
import { Wake } from '../../world/ground/wake.js';
import { Rider } from './rider.js';
import { rootOf } from '../../tools/moveset.js';
import { Ragdoll } from '../anim/ragdoll.js';
import { Grind, GRIND } from './grind.js';
import { SkiffCombo, COMBO } from './combo.js';
import { BoardRules, SCORCH } from './boardrules.js';

const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _m4 = new THREE.Matrix4(), _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3(), _g3 = new THREE.Vector3(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qC = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), qFace = new THREE.Quaternion().setFromAxisAngle(UP, -Math.PI / 2);
const clamp = THREE.MathUtils.clamp, damp = THREE.MathUtils.damp;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// the phases that are not the ride: their clip, their length (s); the deck rides this far over the sand (hover 0.5 + 0.1)
const PHASE = { summon: ['Skiff_Summon', 2.2], mount: ['Skiff_Mount', 0.96], dismount: ['Skiff_Dismount', 0.83], recall: ['Skiff_Recall', 0.96], bail: ['Skiff_Bail', 1.3], getup: ['getUp', 1.5] };
// the board's own clip in each phase (its partner of the rider's: courier/skiff/boatpose.js); getting up, it idles where it slid to
const BOAT_CLIP = { summon: 'Skiff_Summon', mount: 'Skiff_Mount', dismount: 'Skiff_Dismount', recall: 'Skiff_Recall', bail: 'Skiff_Bail', getup: 'Skiff_RideIdle' };
// the bail's rule (docs/plans/SKIFF-RACING.md section 3): you bail when something stops you head-on, or the board lands pointing somewhere
// else than it is going; a fall alone never bails while the board lands square, short of a sheer drop. m/s lost into a wall; radians off
// square (wobble, broadside); m/s into the sand along its normal (hard, the bail); never under `min` m/s nor `grace` s into the ride
const BAIL = { wall: 15, wobble: 0.52, broadside: 1.22, hard: 16, land: 40, min: 8, grace: 0.5 };
const RAG = { throw: 0.7, lift: 3, blend: 0.35 }; // (a bail: of the board's speed the body keeps, m/s up, s from the ragdoll back to the get-up clip)
// the glide as a hang glider (SKIFF-RACING.md 4): pitch (rad, nose down +) trimmed, dived (W), flared (S), eased at `ease` a second; drag
// x v^2 and the bank's x |steer| v; the bank's turn (rad/s); under `stall` m/s it sinks `stallSink` m/s for each m/s short
const GLIDE = { boost: 7, boostTurn: 1.7, trim: 0.2, dive: 0.45, flare: 0.22, ease: 4, drag: 0.008, bankDrag: 0.04, turn: 1.2, stall: 9, stallSink: 0.9 }; // (trim: 5 to 1 at 24 m/s, a race's glide, never a float over the course; a dive, 1.3 to 1)
// the carve (SKIFF-RACING.md 2): from `min` m/s; its tiers at real seconds held; each tier's push (m/s on the aim), its length (s), its
// kick now (m/s); the turn's multiplier; the grip it leaves
const CARVE = { min: 10, tiers: [0.48, 1.04, 1.76], add: [5, 8, 12], dur: [0.7, 1.0, 1.3], kick: [1.5, 2.5, 4], turn: 1.25, grip: 0.3 }; // (tiers a fifth sooner since v198, the owner: "snaking" wants the first sparks quick)
const PLATE = { add: 10, dur: 1.2, kick: 4 }; // (a sun plate's push: as a carve's best, a little longer)
// a late pop: real seconds after leaving a crest it is taken, and of a hop's height; let go in the first `perfect` of them it is a perfect
// pop, higher (`perfectUp`; skiff.pop { perfect }: the owner's "let me know when I nailed it"); let go up to `miss` it was late (skiff.pop.miss)
const POP = { window: 0.22, up: 0.7, perfect: 0.08, perfectUp: 0.95, miss: 0.5 };
// a grab: its tweak of the board (rad: the nose down, the tail down, the double rolled), how long a grab counts at most (real s), the
// double's worth; a landing down a slope keeps this share of the fall's speed along it, and is a trick from `trick` m/s of it
const GRAB = { tweak: 0.3, cap: 3, double: 1.5 };
const SLOPE = { keep: 0.8, max: 8, trick: 2 };
// the pushes stack (Crash Team Racing's reserves): another while one runs adds its length, to `cap` real seconds
const TURBO = { cap: 4 };
// air control (not gliding): Q / E turn the flight (rad/s), more while flaring; a grind trick's double click (real s between presses)
const AIR = { turn: 0.8, flare: 2.2, thrust: 6 }; // (v204: the owner, "boosting midair helps little to course correct": 0.45 / 1.3 and no thrust before)
const GRIND_TRICK = { click: 0.3, points: 120, worth: 1.5, drift: 1.4 };
// how the board lands on a rail sets the grind (Tony Hawk's; the owner, v204): across it (the board turned between `slide` and pi - `slide`
// rad off its travel along the rail), a BOARDSLIDE, a trick of its own; any nearer along it, a 50-50, the plain grind
const GRIND_LAND = { slide: 1.05 };
// a banked flare, spent whole (the owner, v204: "like a mushroom in Mario Kart"): C spends one full stock as a push at once
const MUSHROOM = { add: 12, dur: 1.4, kick: 5 };
// the rail: the sail's hoist and the flare work on it too (the owner, v204); the flare's and a banked flare's push along it (m/s^2, m/s)
const RAIL_BOOST = { flare: 9, banked: 8 };
const SAIL_SEE = 0.5; // (the sail's screen-door fade under way: half its dots, so the track shows through)
// how much of the wind's push the sail uses, by cos(angle between the heading and where the wind goes): 1 dead downwind .. -1 into it
const POLAR = [[-1, 0.28], [-0.6, 0.42], [-0.2, 0.7], [0.2, 0.92], [0.7, 1.0], [1, 1.0]];
const polar = (c) => {
  for (let i = 1; i < POLAR.length; i++) if (c <= POLAR[i][0]) { const [a, b] = [POLAR[i - 1], POLAR[i]]; return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); }
  return 1;
};

export class Skiffing extends Tech {
  constructor(mgr) {
    super(mgr, 'skiff');
    this.overrides = 1;
    this.blendIn = 9;
    this.want = false;
    this.heading = 0;
    this.v = new THREE.Vector3(); // horizontal velocity
    this.air = false;
    this.L = 0; // how far the sail is hoisted
    this.hoistDir = 0; this.pumpReady = true; this.pumpFresh = true;
    this.steer = 0; this.roll = 0; this.spin = 0; this.spinRest = 0; this.charge = 0; this.spaceWas = false;
    this.boomSign = 1; this.boom = 0.6; this.fill = 0;
    this.boosting = 0; this.speed = 0; this.airT = 0; this.landDip = 0;
    this.mouseIdle = 0;
    this.n = UP.clone(); this.nS = UP.clone();
    this.time = 0; this.animT = 0;
    this.airW = 0; this.brakeW = 0; this.hoistW = 0;
    this.unit = null; // the rigid frame the rider is placed in: { pos, quat }
    this.poses = null;
    const game = mgr.game;
    this.skiff = new Skiff(game.scene); // (the owner's model, parsed on first use: courier/skiff/boat.js load)
    this.wake = new Wake(game.scene, game.fx);
    this.grind = new Grind(this); // (the board on a rail, the skiff alone: courier/skiff/grind.js)
    this.combo = new SkiffCombo(this); // (tricks linked into a chain, banked into free flares: courier/skiff/combo.js)
    this.rules = new BoardRules(this); // (the pool as the hull, the scorch, the manual, snaking, the shoulder, aftertouch, near misses: boardrules.js)
    this.grab = null; // { kind: 'nose' | 'tail' | 'double', t }: a grab held in the air
    this.phase = 'ride'; this.phaseT = 0; this.next = null;
    this.parked = null; // { pos, heading }: the board left hovering, to be mounted again (F) or replaced by a summon (Y)
    this.board = { pos: new THREE.Vector3(), heading: 0, v: new THREE.Vector3() }; // (where the board is when the rider is not on it)
    this.rider = { pos: new THREE.Vector3(), yaw: 0, dy: 0 }; // (where the rider is when not on the board: bailing, getting up)
    this.popT = null; this.landT = null; this.flaring = false; this.furling = false;
  }
  /** F at a parked board (game.interact is made after the techs: offered the first frame it is there), and the geyser heard. */
  offer() {
    if (!this.heard && this.game.events) { // (a geyser caught with the springs crouched is an ollie off it: Dovina's skiff.ollie.geyser)
      this.heard = true;
      this.game.events.on('geyser.launch', () => { if (this.active && this.charge > 0.2) this.game.events.emit('skiff.ollie', { geyser: true, by: 'courier' }); });
    }
    if (this.offered || !this.game.interact) return;
    this.offered = true;
    this.game.interact.add('skiff', () => { const k = this.parked, P = this.P; if (!k || this.active) return null; const d = Math.hypot(k.pos.x - P.pos.x, k.pos.z - P.pos.z); return d < 2.8 ? { pos: new THREE.Vector3(k.pos.x, k.pos.y + 1.1, k.pos.z), d } : null; });
  }

  /** The sand under the board: the Raceway's while the Courier is there (world/raceway/raceway.js: it answers as the Dunes do), else the Dunes'. */
  get dunes() { const R = this.game.raceway; return R?.active ? R : this.game.dunes; }
  /** Both hands are on the sheet: the psygun is stowed and cannot be fired while riding. */
  get handsBusy() { return true; }
  get blocksFire() { return true; }
  get riding() { return this.active; }

  mount() { this.want = true; }
  stow() { this.want = false; if (this.active) this.stowNow = true; }

  canStart() {
    const P = this.P;
    if (!this.dunes.active) { this.want = false; return false; } // (out of the Dunes the skiff is put away: back in them, no ride unasked, SWEEPS group 4)
    if (P.mantle || P.freeze) return false;
    if (P.peekLatch('KeyY')) { P.latch('KeyY'); this.next = 'summon'; return true; }
    if (this.parked && this.game.interact?.cur?.id === 'skiff' && P.peekLatch('KeyF')) { P.latch('KeyF'); this.next = 'mount'; return true; }
    if (this.want) { this.next = 'ride'; return true; } // (the overture's mount(): on at once)
    return false;
  }

  start() {
    const P = this.P;
    P.endCore?.();
    P.setShape('stand');
    this.phase = this.next || 'ride'; this.phaseT = 0; this.next = null; this.want = false; this.stowNow = false;
    this.safe = (this.safe || new THREE.Vector3()).copy(P.pos); // (the last place the capsule stood clear: where it is put back if a phase ends it inside something)
    if (this.phase === 'summon') { // (the board rises with its rider's spot under their feet, if there is room; they face its bow)
      this.heading = P.bodyYaw + Math.PI / 2; this.parked = null;
      _v2.set(Math.sin(this.heading), 0, Math.cos(this.heading)).multiplyScalar(-SKIFF.rider.z).add(P.pos);
      if (this.clearAt(_v2.x, P.pos.y, _v2.z)) P.pos.copy(_v2);
    }
    else if (this.phase === 'mount') { this.heading = this.parked.heading; this.board.pos.copy(P.pos); this.mountFrom = P.pos.clone(); }
    else this.heading = P.yaw;
    this.hPrev = this.heading; this.spinPrev = 0; this.rollPrev = 0;
    this.v.set(P.vel.x, 0, P.vel.z);
    if (this.phase !== 'ride') this.v.multiplyScalar(0.2);
    this.air = this.phase === 'ride'; this.spin = 0; this.spinRest = 0; this.airT = 0;
    this.L = this.phase === 'ride' && this.v.length() > 6 ? 0.6 : 0; // (mounted on the move, the sail is already out; from a stand it is furled)
    this.hoistDir = 0; this.pumpReady = true; this.pumpFresh = true; this.steer = 0; this.roll = 0;
    this.rideT = 0; this.grind.offR = null; this.carve = null; this.grab = null; this.combo.drop('off'); this.autoGlide = false; this.gliding = false; this.turbo = 0; this.kickV = 0; this.launchT = 9; this.lastPlate = null;
    this.nS.copy(UP);
    this.animT = 0; this.popT = null; this.landT = null; this.rider.dy = 0;
    this.skiff.load(this.game); this.skiff.visible = true; // (the model is asked for on the way into the Dunes, tick; a ride begun before it is parsed rides an undrawn board)
    this.wake.clear();
    this.game.hud.el.cross && (this.game.hud.el.cross.style.display = 'none'); // (no gun, no reticle)
    this.sfxLoop = sfx.skiffLoop?.();
    this.game.events?.emit('skiff.start', { by: 'courier' });
    if (this.phase === 'summon' || this.phase === 'mount') this.game.events?.emit(`skiff.${this.phase}`, { by: 'courier' });
  }

  end() {
    this.rag?.stop(); this.ragWant = null;
    const P0 = this.P; if (this.safe && P0.embedded?.()) P0.pos.copy(this.safe); // (a phase never leaves them inside the barrier or a ruin)
    if (!this.parked) this.skiff.visible = false;
    this.wake.clear();
    this.unit = null;
    this.game.hud.el.cross && (this.game.hud.el.cross.style.display = '');
    this.sfxLoop?.stop(); this.sfxLoop = null;
    const P = this.P;
    if (this.phase === 'ride') { P.vel.x = this.v.x * 0.5; P.vel.z = this.v.z * 0.5; }
    this.skiff.fold(1); this.skiff.group.scale.setScalar(1);
    this.phase = 'ride';
  }

  /** Into another phase (the rider's clip plays it; the board does what the phase says). */
  enter(phase) {
    const P = this.P, g = this.game;
    this.phase = phase; this.phaseT = 0;
    const qr = _q1.setFromAxisAngle(UP, this.heading).multiply(qFace);
    if (phase === 'dismount' || phase === 'bail') {
      this.board.pos.copy(P.pos); this.board.heading = this.heading; this.board.v.copy(this.v).multiplyScalar(phase === 'bail' ? 0.6 : 0);
      this.rider.pos.set(0, SKIFF.deck, SKIFF.rider.z).applyAxisAngle(UP, this.heading).add(P.pos); this.rider.q = qr.clone(); this.rider.dy = 0;
      if (!this.clearAt(this.rider.pos.x, P.pos.y, this.rider.pos.z)) this.rider.pos.set(P.pos.x, this.rider.pos.y, P.pos.z); // (against a wall: where the board's middle is)
    }
    if (phase === 'getup') { // (the get-up's first hips laid onto where the bail left the hips: the same body, now on the sand)
      const C = g.character.clips, hb = C.clips.Skiff_Bail, gu = C.clips.getUp, e = hb.n - 1;
      if (this.rag?.active) { const h = this.rag.hips; if (h && this.clearAt(h.x, this.P.pos.y, h.z)) this.rider.pos.set(h.x, this.rider.pos.y, h.z); } // (the body lies where the ragdoll left it)
      else if (hb && gu) {
        const r = this.rider.pos, x = r.x, z = r.z;
        _v2.set(hb.p[e * 3] - gu.p[0], 0, hb.p[e * 3 + 2] - gu.p[2]).applyQuaternion(this.rider.q);
        if (this.clearAt(x + _v2.x, this.P.pos.y, z + _v2.z)) r.add(_v2); // (the body lies where it fell, unless that is in a wall)
      }
    }
    if (phase === 'bail') { this.parked = null; P.shake = Math.max(P.shake, 0.4); sfx.thunk?.(1.4, 3); this.ragWant = this.v.clone().multiplyScalar(RAG.throw).setY(Math.max(0, P.vel.y) + RAG.lift); } // (thrown: the ragdoll, from the next pose: afterPose)
  }

  /** Is the capsule clear standing at (x, y, z)? (a phase never sets them down inside a wall: the barrier, a ruin) */
  clearAt(x, y, z) {
    const P = this.P, sx = P.pos.x, sy = P.pos.y, sz = P.pos.z;
    P.pos.set(x, y, z); const ok = !P.embedded?.(); P.pos.set(sx, sy, sz);
    return ok;
  }

  /** Set the capsule down at (x, y, z) if it is clear there (else it stays); and remember the clear place. */
  setPos(x, y, z) { if (this.clearAt(x, y, z)) { this.P.pos.set(x, y, z); this.safe?.copy(this.P.pos); } }

  /** The speed for the record (tracking.js `speed.skiff.max`), four times a real second with the most since: every step's one filled
   *  the bus's 300 in five seconds and an agent lost every other event (QA-A, 2026-10-22). */
  tickOut(dt) {
    this.tickTop = Math.max(this.tickTop || 0, this.speed); this.tickT = (this.tickT || 0) + dt;
    if (this.tickT < 0.25) return;
    this.game.events?.emit('skiff.tick', { speed: this.tickTop }); this.tickT = 0; this.tickTop = 0;
  }

  /** A crash: thrown off. */
  bail(why) {
    if (this.phase !== 'ride') return;
    this.combo.drop('bail'); this.grab = null; if (why !== 'wrecked') this.rules.hit('bail', 1);
    this.game.events?.emit('skiff.bail', { why, speed: +this.v.length().toFixed(1), by: 'courier' });
    this.enter('bail');
  }

  /** The phases that are not the ride (fixed step): true while the tech goes on. */
  stepPhase(dt) {
    const P = this.P, D = this.dunes, g = this.game, t = (this.phaseT += dt), [, len] = PHASE[this.phase];
    const sand = D.rideHeight(P.pos.x, P.pos.z), hover = this.cfg.hover + 0.1;
    this.v.multiplyScalar(Math.exp(-6 * dt)); P.vel.x = this.v.x; P.vel.z = this.v.z;
    if (this.phase === 'recall') this.L = Math.max(0, this.L - dt / 0.15); // (the sail down before the mast folds: the board's Skiff_Recall, frame 5)
    else if (this.phase !== 'summon' && this.phase !== 'mount') this.L = Math.max(0, this.L - dt / this.cfg.furlTime); // (stepped off or thrown off: it is let down, and parks furled)
    if (this.phase === 'summon' || this.phase === 'mount') {
      let x = P.pos.x, z = P.pos.z;
      if (this.phase === 'mount') { const k = smooth(0, 0.35, t); x = this.mountFrom.x + (this.parked.pos.x - this.mountFrom.x) * k; z = this.mountFrom.z + (this.parked.pos.z - this.mountFrom.z) * k; }
      const rise = this.phase === 'summon' ? smooth(0.85, 1.35, t) : smooth(0.25, 0.6, t);
      this.setPos(x, D.rideHeight(x, z) + hover * rise, z); P.vel.y = 0;
      if (t >= len) { this.phase = 'ride'; this.parked = null; this.air = false; this.phaseT = 0; }
    } else if (this.phase === 'recall') {
      this.rider.dy = hover * smooth(0.1, 0.55, t); P.vel.y = 0;
      if (t >= len) { this.setPos(P.pos.x, sand, P.pos.z); P.vel.x = this.v.x * 2; P.vel.z = this.v.z * 2; P.bodyYaw = this.heading - Math.PI / 2; g.events?.emit('skiff.recall', { by: 'courier' }); return false; }
    } else if (this.phase === 'dismount') {
      this.rider.dy = hover * smooth(0.35, 0.8, t); P.vel.y = 0;
      if (t >= len) {
        const e = rootOf(g.character.clips, 'Skiff_Dismount')?.end;
        this.parked = { pos: this.board.pos.clone(), heading: this.board.heading, boom: this.boom };
        _v3.copy(this.rider.pos); if (e) _v3.add(_v.set(e.x, 0, e.z).applyQuaternion(this.rider.q));
        _v3.y = D.rideHeight(_v3.x, _v3.z);
        if (this.clearAt(_v3.x, _v3.y, _v3.z)) P.pos.copy(_v3); // (stepped off into a wall: they stay where they stood)
        P.vel.set(0, 0, 0); P.bodyYaw = P.yaw = this.heading - Math.PI / 2;
        g.events?.emit('skiff.park', { by: 'courier' });
        return false;
      }
    } else if (this.phase === 'bail' || this.phase === 'getup') {
      // the board slides on to a stop, upright; the rider is thrown off where they were and lies there, then gets up
      const b = this.board; b.v.multiplyScalar(Math.exp(-2.5 * dt)); b.pos.addScaledVector(b.v, dt); b.pos.y = D.rideHeight(b.pos.x, b.pos.z) + hover;
      this.rider.dy = hover * smooth(0.12, 0.45, this.phase === 'bail' ? t : 9);
      if (this.phase === 'bail') this.rules.aftertouch(dt, P.input); // (aftertouch: the thrown body steered, Burnout's)
      if (this.rag?.active) { this.rag.step(dt); if (this.phase === 'bail') { const h = this.rag.hips; if (h && this.clearAt(h.x, P.pos.y, h.z)) this.rider.pos.set(h.x, this.rider.pos.y, h.z); } } // (the capsule goes where the body tumbles)
      { const y = D.rideHeight(this.rider.pos.x, this.rider.pos.z); if (this.clearAt(this.rider.pos.x, y, this.rider.pos.z)) P.pos.set(this.rider.pos.x, y, this.rider.pos.z); else this.rider.pos.set(P.pos.x, this.rider.pos.y, P.pos.z); } P.vel.set(0, 0, 0);
      const done = this.phase === 'getup' ? t >= len : t >= len && !g.character.clips.clips.getUp;
      if (this.phase === 'bail' && t >= len && !done) this.enter('getup');
      if (done) { this.parked = { pos: b.pos.clone(), heading: b.heading, boom: this.boom }; P.bodyYaw = P.yaw = this.heading - Math.PI / 2; return false; }
    }
    P.move(dt);
    P.grounded = this.phase !== 'summon' || t > 1.35;
    return true;
  }

  // ------------------------------------------------------------------ the ride (fixed step)
  update(dt) {
    const g = this.game, P = this.P, c = this.cfg, inp = P.input, D = this.dunes, W = D.wind, CD = D.condition; // (CD: the Raceway's hour and weather, conditions.js)
    if (!D.active || this.stowNow) { this.want = false; return false; }
    if (this.phase !== 'ride') return this.stepPhase(dt);
    if (P.latch('KeyY')) { if (!this.air) this.enter('recall'); else return false; return this.stepPhase(dt); } // (in the air there is no stepping down: it is simply stowed)
    if (P.latch('KeyF') && !this.air && this.v.length() < 6) { this.enter('dismount'); return this.stepPhase(dt); }
    // (what the frame interpolates from: the body is drawn between the last step and this one, like the camera is)
    this.hPrev = this.heading; this.spinPrev = this.spin; this.rollPrev = this.roll;
    this.rideT = (this.rideT || 0) + dt; this.rules.step(dt);
    if (this.grind.on) return this.grindStep(dt);
    const held = !!this.hold; // (a race's countdown: the board is held on the line, the sail free to be readied: world/raceway/race.js)
    let steerIn = held ? 0 : (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    if (this.spinLock) { if (steerIn === 0 || !this.air) this.spinLock = false; else steerIn = 0; } // (A / D held from a grind's balance spin nothing once off the rail, until let go: the owner's v204 bail off a rail)
    const keyW = inp.isDown('KeyW'), keyS = inp.isDown('KeyS');
    const flare = !held && (inp.isDown('ShiftLeft') || inp.isDown('ShiftRight')); // (Shift: the pool's flare; C spends a banked flare whole: mushroom())
    if (!held && inp.isDown('KeyC') && !this.cWas) this.mushroom(); this.cWas = inp.isDown('KeyC');
    const sp2 = !held && inp.isDown('Space');
    this.steer = damp(this.steer, steerIn, 10, dt);
    const bankIn = held ? 0 : (inp.isDown('KeyE') ? 1 : 0) - (inp.isDown('KeyQ') ? 1 : 0); // (the glider's bank: Q left, E right, as A / D steer, so A / D stay the spin)
    this.bank = damp(this.bank || 0, bankIn, 6, dt);
    // ---- the glide (Space held in the air, with the art; or opened by the course's glide lip: MK8's glider ramp). W and S are the
    // glider's pitch while it flies, never the sail's
    const glideWas = this.gliding;
    if (this.air && D.glideAt?.(P.pos)) this.autoGlide = true;
    this.gliding = this.air && ((sp2 && this.airT > 0.12 && (g.system?.allows?.('skiffGlide') ?? true)) || !!this.autoGlide);
    if (this.gliding && !glideWas) { // (into the glide with the speed it has: the path's speed, the path's pitch)
 this.gV = Math.hypot(this.v.length(), P.vel.y); this.pitch = clamp(Math.atan2(-P.vel.y, Math.max(0.1, this.v.length())), -0.5, 0.9);
      g.events?.emit('skiff.glide', { by: 'courier' }); // (the wind under the wings is the skiff's loop: sfxLoop.set's glide, Wanda's)
    }
    const manualOn = this.rules.manual(dt, inp, !this.air && !held && !this.carve, steerIn); // (W and S together with a combo live: the manual, boardrules.js)
    const hoistKey = keyW && !this.gliding && !manualOn, furlKey = keyS && !this.gliding && !manualOn;
    if (!this.air && !held) this.rules.shoulder(dt, inp);

    // ---- the sail: hoisted with W, lowered with S (which also brakes); it stays where you leave it
    const wasL = this.L;
    if (furlKey) this.L = Math.max(0, this.L - dt / c.furlTime);
    else if (hoistKey) this.L = Math.min(1, this.L + dt / c.hoistTime);
    this.hoistDir = Math.sign(this.L - wasL);
    // ---- pumping: run it back up from nearly down and it kicks, as in Wind Waker
    let pump = 0;
    if (this.L < 0.4) this.pumpReady = true;
    if (this.L >= 0.999 && wasL < 0.999) {
      if (this.pumpReady && this.pumpFresh) { pump = c.pump; this.pumpReady = false; sfx.hoist?.(); g.events?.emit('skiff.pump', { by: 'courier'}); }
      this.pumpFresh = false;
    }
    if (this.L < 0.5) this.pumpFresh = true;

    const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const r = _v2.set(-Math.cos(this.heading), 0, Math.sin(this.heading)); // (to the boat's right)
    let vf = this.v.dot(f), vl = this.v.dot(r);
    const wgo = _v3.set(W.dir.x, 0, W.dir.y); // where the wind goes
    const windF = polar(wgo.dot(f)) * W.gust; // (cos 1: running before it)

    // ---- speed: the sail sets where the boat settles; it gets there by the sail's pull, coasts down otherwise
    this.boosting = Math.max(0, this.boosting - dt * 2.2);
    this.turbo = Math.max(0, (this.turbo || 0) - dt);
    let target = c.cruise * this.L * windF * this.rules.mult('top') * (this.rules.luffing ? SCORCH.pace : 1), accel = c.accel * (0.45 + 0.55 * this.L) * this.rules.mult('accel'); // (the garage's parts; a scorched sail luffs)
    this.flaring = false; this.furling = furlKey && (this.L > 0.001 || vf > 2);
    if (this.rules.flare(dt, flare) && flare && g.lachryma.drain(c.boostCost * dt, 'skiff') > 0) { target = Math.max(target, c.cruise * 0.55) * c.boostMult; accel = c.boostAccel; this.boosting = 1; this.flaring = true; }
    else if (this.boosting > 0.05) { target *= 1 + (c.boostMult - 1) * this.boosting; accel = c.boostAccel * 0.6; }
    if (this.turbo > 0) { target = Math.max(target, c.cruise * 0.6) + this.turboAdd; accel = Math.max(accel, c.boostAccel); this.boosting = Math.max(this.boosting, 0.6); } // (a carve's, a sun plate's, a solar start's push: free of Lachryma)
    if (vf < target) vf = Math.min(target, vf + accel * dt);
    else vf = Math.max(target, vf - (c.coast + 0.012 * vf * vf) * (CD?.coast ?? 1) * this.rules.mult('coast') * dt); // (the tune's coast: SKIFF-TUNING.md 2.2)
    if (furlKey && vf > 0 && !this.air) vf = Math.max(0, vf - c.brake * dt); // (the brake is the sand's: in the air S lets the sail down and nothing more, the owner's "W and S kill the momentum")
    vf += pump + (this.kickV || 0); this.kickV = 0;
    if (target === 0 && vf < 0.15 && !this.air) vf = 0;
    if (this.air) vf *= Math.exp(-0.015 * dt);
    vl *= Math.exp(-c.grip * dt * (this.air ? 0.1 : (this.carve ? CARVE.grip : 1) * (CD?.grip ?? 1) * this.rules.mult('grip'))); // (a carve lets the board slide out; wet sand holds less)
    if (CD?.shove && !held) vl += CD.shove * (W.gust - 1) * wgo.dot(r) * dt; // (a squall's gust shoves the board across the wind)
    if (Math.abs(vl) < 0.02 && !this.air) vl = 0;
    if (held) { vf = 0; vl = 0; }

    // ---- slopes: gravity along the ground
    const gy = D.rideHeight(P.pos.x, P.pos.z); // (the sand, or the oasis's water over it: the skiff skims the pond)
    const wet = gy > D.heightAt(P.pos.x, P.pos.z) + 0.01 && !this.air && !(D.decks?.length && P.pos.y > gy + 2); // (skimming water: a lake, a ford, the cavern's pool, the oasis)
    if (wet) this.n.copy(UP); else D.normalAt(P.pos.x, P.pos.z, this.n);
    if (wet !== !!this.onWater) { this.onWater = wet; g.events?.emit('skiff.water', { on: wet, speed: +this.v.length().toFixed(1), by: 'courier' }); } // (onto the water and off it: its splash and wake are Calissa's, its sound Wanda's)
    if (!this.air && !held) {
      const gt = _v3.set(0, -T.physics.gravity, 0);
      gt.addScaledVector(this.n, -gt.dot(this.n));
      vf += gt.dot(f) * c.slopeGain * dt;
      vl += gt.dot(r) * c.slopeGain * dt * 0.5;
    }
    this.v.set(0, 0, 0).addScaledVector(f, vf).addScaledVector(r, vl);

    // ---- the sun plates (the Raceway's): a flare's push, free
    const plate = D.plateAt?.(P.pos);
    if (plate?.lane && !held) this.rules.refill(dt, plate, plate !== this.lastPlate); // (a vein lane: the pool refilled, F-Zero's pit)
    else if (plate && plate !== this.lastPlate && !held) { const pw = plate.power ?? 1; if (pw > 0.05) this.kick(PLATE.add * pw, PLATE.dur * pw, PLATE.kick * pw); g.events?.emit('skiff.plate', { plate: plate.index, power: +pw.toFixed(2), by: 'courier' }); } // (as strong as the sun: dead at night, conditions.js)
    this.lastPlate = plate;

    // ---- steering: it turns on the spot, and carves once it is moving (less so the faster it goes)
    const sp0 = this.v.length(), speedFrac = clamp(sp0 / c.maxSpeed, 0, 1);
    // the carve: Q or E held on the sand at speed (its side): the board slides, loads in tiers, and let go it runs out with a push (MK8's
    // mini-turbo, Sonic Riders' drift). Its own keys: on Space it shared the hop, and a hop in a turn began a carve (the owner, 2026-10-14)
    const carveIn = this.air ? 0 : bankIn; // (Q / E bank the glider in the air; on the sand they carve)
    if (!this.carve && carveIn !== 0 && sp0 > CARVE.min) this.carve = { dir: carveIn, t: 0, tier: 0, rate: this.rules.carveStart(carveIn) }; // (rate: snaking's)
    if (this.carve && (this.air || sp0 < CARVE.min * 0.6)) this.carve = null; // (off a crest, or slowed to a crawl: it is lost)
    let steerEff = this.steer;
    if (this.carve) {
      const C = this.carve; C.t += dt * (steerIn === -C.dir ? 0.5 : 1) * (CD?.carve ?? 1) * (C.rate || 1) * this.rules.mult('carveRate'); // (steered out of it, it loads at half; on wet sand sooner)
      const tier = CARVE.tiers.filter((t) => C.t >= t).length;
      if (tier > C.tier) { C.tier = tier; g.events?.emit('skiff.carve.charge', { tier, by: 'courier' }); }
      steerEff = C.dir * (CARVE.turn + 0.45 * steerIn * C.dir);
    }
    const rate = c.turn * this.rules.mult('turn') * (0.35 + 0.65 * clamp(sp0 / 7, 0, 1)) * (1 - 0.4 * speedFrac) * (this.air ? 0.3 : 1);
    if (this.gliding) {
      // the hang glider: Q / E bank it round (the flight turns with it), W dives, S flares, and A / D still spin it (a trick in the glide);
      // along its path gravity by the pitch, less drag; under STALL it sinks (docs/plans/SKIFF-RACING.md section 4)
      const pitchAim = GLIDE.trim + (keyW ? GLIDE.dive : 0) - (keyS ? GLIDE.flare : 0);
      this.pitch = damp(this.pitch, pitchAim, GLIDE.ease, dt);
      const thrust = this.boosting > 0.3 || this.turbo > 0 ? GLIDE.boost : 0; // (a flare or a push in the glide drives it on and turns it harder: the owner's v204 "course correct")
      const V = (this.gV = Math.max(0, this.gV + (c.gravity * Math.sin(this.pitch) + thrust - GLIDE.drag * this.gV * this.gV - GLIDE.bankDrag * Math.abs(this.bank) * this.gV) * dt));
      this.heading -= this.bank * GLIDE.turn * (thrust ? GLIDE.boostTurn : 1) * clamp(V / 10, 0.3, 1) * dt;
      this.spin += -this.steer * 8 * dt;
      const fg = _v3.set(Math.sin(this.heading), 0, Math.cos(this.heading));
      this.v.copy(fg).multiplyScalar(V * Math.cos(this.pitch));
      P.vel.y = -V * Math.sin(this.pitch) - Math.max(0, GLIDE.stall - V) * GLIDE.stallSink;
    } else {
      const h0 = this.heading;
      this.heading -= steerEff * rate * dt;
      if (this.air) {
        this.v.applyAxisAngle(UP, this.heading - h0); this.spin += -this.steer * 8 * dt; // (a turn in the air carries the flight with it: no speed thrown away on landing)
        if (bankIn) { const a = -bankIn * AIR.turn * (this.boosting > 0.3 ? AIR.flare / AIR.turn : 1) * dt; this.heading += a; this.v.applyAxisAngle(UP, a); } // (air control: the flight steered, more while flaring)
        if (this.boosting > 0.3) this.v.addScaledVector(_v3.set(Math.sin(this.heading), 0, Math.cos(this.heading)), AIR.thrust * dt); // (a flare in the air pushes the way you now face)
      }
    }

    // ---- hop: hold Space to crouch the springs (a tap is a hop), let go to launch; a carve let go pops out with its push; and a hop let
    // go just after leaving a crest is a LATE POP, higher (MK8's ramp trick, SSX's pop)
    if (sp2 && !this.air) this.charge = Math.min(1, this.charge + dt / c.hopTime);
    if (this.carve && carveIn !== this.carve.dir) { // (its key let go: it runs out with its push, on the sand)
      const C = this.carve; this.carve = null; this.rules.carveRelease(C.dir);
      if (C.tier > 0) { this.kick(CARVE.add[C.tier - 1], CARVE.dur[C.tier - 1], CARVE.kick[C.tier - 1]); g.events?.emit('skiff.carve', { tier: C.tier, by: 'courier' }); this.combo.add('carve', COMBO.points.carve[C.tier - 1]); }
    }
    if (!sp2 && this.spaceWas && !this.air) {
      P.vel.y = c.hop + c.hopCharge * this.charge;
      this.v.addScaledVector(f, 1.2 + 2 * this.charge);
      this.air = true; this.spin = 0; this.airT = 0; this.popT = 0; this.launchT = 9;
      sfx.airJump();
      g.events?.emit('skiff.hop', { by: 'courier' });
      g.events?.emit('skiff.ollie', { geyser: false, by: 'courier' });
    } else if (!sp2 && this.spaceWas && this.air && this.launchT < POP.window && !this.gliding) {
      const perfect = this.launchT < POP.perfect; // (let go in its first moment: the nailed pop, the owner's ask)
      P.vel.y = Math.max(P.vel.y, 0) + c.hop * (perfect ? POP.perfectUp : POP.up) + c.hopCharge * this.charge * 0.5; this.v.addScaledVector(f, perfect ? 2.5 : 1.5); this.launchT = 9; this.popT = 0;
      g.events?.emit('skiff.pop', { late: true, perfect, by: 'courier' }); // (its sound is Wanda's: audio/raceway.js; its mark Calissa's: vfx/racewaylooks.js, the sun's glyph struck in Lachryma)
      g.events?.emit('skiff.ollie', { geyser: false, by: 'courier' });
      this.combo.add('pop', perfect ? COMBO.points.perfect : COMBO.points.pop);
    } else if (!sp2 && this.spaceWas && this.air && this.launchT < POP.miss && !this.gliding && this.launchT !== 9) g.events?.emit('skiff.pop.miss', { late: +this.launchT.toFixed(2), by: 'courier' }); // (let go too late: said, so the timing can be learned)
    // ---- grabs: LMB the nose, RMB the tail, both the double, held in the air; let go before landing, a trick by the time held
    if (this.air && !held) {
      const nose = inp.isDown('Mouse0'), tail = inp.isDown('Mouse2');
      if (nose || tail) { const kind = nose && tail ? 'double' : nose ? 'nose' : 'tail'; if (!this.grab) this.grab = { kind, t: 0 }; else if (kind === 'double') this.grab.kind = 'double'; this.grab.t += dt; }
      else if (this.grab) {
        const G = this.grab, secs = Math.min(GRAB.cap, G.t); this.grab = null;
        if (secs > 0.15) { g.events?.emit('skiff.grab', { grab: G.kind, seconds: +secs.toFixed(2), by: 'courier' }); this.combo.add('grab', (COMBO.points.grab * secs + (secs >= 0.6 ? COMBO.points.tweak : 0)) * (G.kind === 'double' ? GRAB.double : 1)); }
      }
    }
    if (!sp2) this.charge = Math.max(0, this.charge - dt * 4);
    this.spaceWas = sp2;

    // ---- height: hover over the sand, follow it with a little lag (that is what makes a crest a launch)
    const want = gy + c.hover * this.rules.mult('hover') + 0.1;
    const gap = P.pos.y - want;
    const vyT = -(this.n.x * this.v.x + this.n.z * this.v.z) / Math.max(0.2, this.n.y);
    if (!this.air) {
      P.vel.y = damp(P.vel.y, vyT, c.follow * this.rules.mult('follow'), dt) - gap * 60 * dt;
      if (gap > 0.85 || (gap > 0.25 && P.vel.y > vyT + 5)) { this.air = true; this.spin = 0; this.airT = 0; this.launchT = 0; } // (off a crest or a kicker: a late pop's window opens)
    } else {
      if (!this.gliding) P.vel.y -= c.gravity * dt;
      this.airT += dt; this.launchT = (this.launchT ?? 9) + dt; if (this.popT != null) this.popT += dt;
      if (gap <= 0.12 && P.vel.y <= 0.5) this.land(vyT);
    }
    if (this.v.length() > c.maxSpeed) this.v.setLength(c.maxSpeed);
    if (held) this.v.set(0, 0, 0);
    P.vel.x = this.v.x; P.vel.z = this.v.z;

    // ---- go (walls and ruins stop it). What it lost into them is the blow: a glancing scrape keeps the slide, head-on bails
    const before = P.pos.clone(), vIn = this.v.clone();
    P.move(dt);
    const moved = _v3.set((P.pos.x - before.x) / dt, 0, (P.pos.z - before.z) / dt);
    const lost = Math.hypot(vIn.x - moved.x, vIn.z - moved.z);
    if (lost > 4 && vIn.length() > 3 && this.rules.hit('wall', lost - 4)) return this.stepPhase(dt); // (the hull: a wall drains the pool; empty, it wrecks)
    if (vIn.length() > 3 && lost > 0.25 * vIn.length()) {
      if (lost > BAIL.wall && this.canBail()) { this.bail('wall'); return this.stepPhase(dt); }
      if (lost > 8) { sfx.thunk?.(1.2, 3); g.fx?.impact?.(P.pos.clone().setY(P.pos.y), UP, { sparks: 8, dust: 12 }); P.shake = Math.max(P.shake, 0.25); }
      this.v.copy(moved).multiplyScalar(0.95);
    }
    const gy2 = D.rideHeight(P.pos.x, P.pos.z);
    if (P.pos.y < gy2 + 0.35) { P.pos.y = gy2 + 0.35; if (P.vel.y < 0) P.vel.y = 0; }
    P.grounded = !this.air;
    P.bodyYaw = this.heading;
    if (this.safe && !P.embedded?.()) this.safe.copy(P.pos);
    if (D.rails?.length && this.air && !this.grind.on && this.grind.tryLock(D.rails, P.pos, this.v, P.vel.y)) { // (the keel fin onto a rail: no button)
      const yo = wrap(this.spin + this.spinRest), off = Math.abs(yo), across = off > GRIND_LAND.slide && off < Math.PI - GRIND_LAND.slide; // (the board's yaw off its travel, which runs along the rail)
      this.air = false; this.gliding = false; this.autoGlide = false; this.carve = null; this.spin = 0; this.spinRest = 0;
      this.grindTrick = across ? 'board' : null; this.grind.style = across ? GRIND_TRICK.drift : 1; this.slideSide = Math.sign(yo) || 1;
      g.events?.emit('skiff.grind.trick', { trick: across ? 'boardslide' : 'fiftyfifty', landed: true, by: 'courier' }); if (across) this.combo.add('grindtrick', GRIND_TRICK.points);
    }

    // ---- the camera swings round behind where the board goes, unless you are looking about
    if (P.input.dx || P.input.dy) this.mouseIdle = 0; else this.mouseIdle += dt;
    if (this.mouseIdle > 0.5 && this.v.length() > 4) P.yaw += wrap(this.heading - P.yaw) * Math.min(1, dt * 3);

    this.speed = this.v.length();
    // (the lean: into the turn, and out of a slide; roll about the boat's own long axis)
    const wantRoll = clamp(steerEff * 0.12 * clamp(this.speed / 12, 0.15, 1), -0.15, 0.15) + (this.air ? (this.gliding ? clamp(this.bank * 0.35, -0.35, 0.35) : 0) : clamp(-vl * 0.03, -0.2, 0.2)); // (a quarter of the lean it had: the rider's carve and the board's own Skiff_RideTurnL/R (8 degrees) lean the rest; the glider banks into its turn, as the board leans into one on the sand: it leaned out, the owner's "reversed", 2026-10-14)
    this.roll = damp(this.roll, wantRoll, 9, dt);
    if (this.sfxLoop) this.sfxLoop.set(clamp(this.speed / c.maxSpeed, 0, 1), this.boosting, this.air ? 1 : 0, this.gliding);
    this.combo.step(dt, this.air || !!this.carve || this.grind.on || this.rules.manualOn); this.rules.nearMiss(dt); // (the chain lives in the air, on a rail, in a carve; on the sand its link runs down)
    this.tickOut(dt);
    return true;
  }

  /** On a rail (grind.js): its line carries the board; A / D answer the balance, Space pops off, the sail's wind along it pushes. */
  grindStep(dt) {
    const g = this.game, P = this.P, inp = P.input, D = this.dunes, W = D.wind, c = this.cfg;
    const steerIn = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0), sp = inp.isDown('Space');
    this.steer = damp(this.steer, steerIn, 10, dt);
    // a grind trick: LMB or RMB clicked twice quick on the rail (nose grind, tail slide); the trick's metres count more, its balance livelier
    // (the grind it began as is how it landed: a 50-50 along the rail, a boardslide across it)
    const tnow = this.rideT || 0;
    for (const [btn, kind] of [['Mouse0', 'nose'], ['Mouse2', 'tail']]) {
      const down = inp.isDown(btn), was = (this.btnWas ||= {})[btn]; this.btnWas[btn] = down;
      if (!down || was) continue;
      const last = (this.btnAt ||= {})[btn] ?? -9; this.btnAt[btn] = tnow;
      if (tnow - last >= GRIND_TRICK.click) continue;
      this.btnAt[btn] = -9;
      if (this.grindTrick !== kind) { this.grindTrick = kind; this.grind.style = GRIND_TRICK.drift; g.events?.emit('skiff.grind.trick', { trick: kind === 'nose' ? 'nosegrind' : 'tailslide', by: 'courier' }); this.combo.add('grindtrick', GRIND_TRICK.points); }
    }
    // the sail and the flare on the rail (the owner, v204): W / S hoist and lower it; Shift flares from the pool, C spends a banked flare
    if (inp.isDown('KeyW')) this.L = Math.min(1, this.L + dt / c.hoistTime); else if (inp.isDown('KeyS')) this.L = Math.max(0, this.L - dt / c.furlTime);
    this.flaring = false; this.boosting = Math.max(0, this.boosting - dt * 2.2);
    if ((inp.isDown('ShiftLeft') || inp.isDown('ShiftRight')) && this.rules.flare(dt, true) && g.lachryma.drain(c.boostCost * dt, 'skiff') > 0 && this.grind.V < c.maxSpeed * c.boostMult) { this.grind.V += RAIL_BOOST.flare * dt; this.flaring = true; this.boosting = 1; }
    else this.rules.flare(dt, false);
    if (inp.isDown('KeyC') && !this.cWas && this.combo.stocks >= 1) { this.combo.stocks -= 1; this.grind.V += RAIL_BOOST.banked; this.boosting = 1; g.events?.emit('skiff.flare.banked', { rail: true, left: Math.floor(this.combo.stocks), by: 'courier' }); }
    this.cWas = inp.isDown('KeyC');
    const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading)), push = this.L * Math.max(0, W.dir.x * f.x + W.dir.y * f.z) * W.gust;
    const R = this.grind.step(dt, { steer: this.steer, hopUp: !sp && this.spaceWas, sailPush: push });
    this.spaceWas = sp;
    if (!R) return true;
    this.hPrev = this.heading; this.heading = R.heading;
    P.pos.copy(R.pos); this.v.copy(R.vel); P.vel.set(R.vel.x, R.vy, R.vel.z);
    this.roll = damp(this.roll, clamp(R.lean * 0.35, -0.4, 0.4), 12, dt);
    (this.railUp ||= new THREE.Vector3()).copy(R.up); (this.railFwd ||= new THREE.Vector3()).copy(R.fwd); // (the unit stands on the rail: tick)
    this.speed = this.v.length(); P.grounded = !R.done; P.bodyYaw = this.heading;
    if (R.done) {
      this.air = true; this.airT = 0; this.spin = 0; this.spinRest = 0; this.launchT = 9; this.popT = this.grind.why === 'hop' ? 0 : null;
      this.steer = 0; this.spinLock = steerIn !== 0; // (the balance's A / D, still held, must not spin the board once off: the owner's v204 bail)
      if (this.grind.why === 'hop') { sfx.airJump(); g.events?.emit('skiff.hop', { by: 'courier' }); }
      if (R.metres >= GRIND.trick) this.combo.add('grind', R.metres * COMBO.points.grind * (this.grindTrick ? GRIND_TRICK.worth : 1)); // (a grind is a trick: its metres into the combo, more in a grind trick)
      this.grindTrick = null; this.grind.style = 1;
    }
    if (P.input.dx || P.input.dy) this.mouseIdle = 0; else this.mouseIdle += dt;
    if (this.mouseIdle > 0.5) P.yaw += wrap(this.heading - P.yaw) * Math.min(1, dt * 3);
    if (this.sfxLoop) this.sfxLoop.set(clamp(this.speed / c.maxSpeed, 0, 1), this.boosting, 0, false);
    this.tickOut(dt);
    return true;
  }

  /** C: a banked flare spent whole, a push at once (Mario Kart's mushroom; the owner, v204). */
  mushroom() {
    const C = this.combo; if (!C || C.stocks < 1) return false;
    C.stocks -= 1; this.kick(MUSHROOM.add, MUSHROOM.dur, MUSHROOM.kick); this.boosting = 1;
    this.game.events?.emit('skiff.flare.banked', { rail: false, left: Math.floor(C.stocks), by: 'courier' });
    return true;
  }

  /** A push free of Lachryma (a carve let go, a sun plate, a solar start): `add` m/s on the sail's aim for `dur` real seconds, and `kick` now. */
  kick(add, dur, kick = 0) { this.turboAdd = this.turbo > 0 ? Math.max(this.turboAdd || 0, add) : add; this.turbo = this.turbo > 0 ? Math.min(TURBO.cap, this.turbo + dur) : dur; this.kickV = (this.kickV || 0) + kick; } // (another while one runs stacks its length: CTR's reserves)
  /** No bail under BAIL.min m/s, nor in the first half second on the board. */
  canBail() { return this.v.length() > BAIL.min && (this.rideT || 0) > BAIL.grace; }

  land(vyT) {
    const P = this.P, g = this.game;
    // into the sand along its normal: what the hover takes (a steep landing hill takes a fall gently; R8: never the bare fall)
    const impact = (vyT - P.vel.y) * Math.max(0.2, this.n.y), fall = Math.max(0, -P.vel.y);
    this.air = false; this.gliding = false; this.autoGlide = false; this.popT = null; this.landT = 0; this.launchT = 9;
    P.vel.y = vyT * 0.6;
    this.landDip = clamp(impact / 9, 0.25, 1);
    if (impact > 3) { sfx.thunk?.(0.6, 3); g.fx?.impact?.(P.pos.clone().setY(P.pos.y - 0.6), UP, { sparks: 0, dust: 12 }); }
    // the board's facing against its travel: a spin within a quarter turn of whole is a TRICK (square); 30 to 70 degrees off is a WOBBLE;
    // more is broadside, a BAIL (docs/plans/SKIFF-RACING.md section 3)
    const TAU = Math.PI * 2, near = Math.round(this.spin / TAU), off = Math.abs(this.spin - near * TAU);
    const square = Math.abs(near) >= 1 && off < 0.9;
    this.spinRest = this.spin - near * TAU;
    this.spin = 0;
    const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    if (this.grab) { // (still grabbing as it lands: the grab counts for nothing, and the board wobbles: let go first)
      this.grab = null; this.v.multiplyScalar(0.8); g.events?.emit('skiff.grab.late', { by: 'courier' }); this.combo.bank();
    }
    if (square) {
      this.v.addScaledVector(f, 3 + 2 * Math.abs(near));
      g.events?.emit('skiff.trick', { turns: Math.abs(near), by: 'courier' });
      this.combo.add('spin', COMBO.points.spin * Math.abs(near)); // (tricks feed the combo, banked into free flares: SSX's boost, Sonic Riders' air)
      sfx.parry?.();
    } else if (off > BAIL.broadside && this.canBail()) { this.bail('sideways'); return; }
    else if (off > BAIL.wobble * this.rules.mult('wobble')) { this.v.multiplyScalar(0.7); this.spinRest = 0; g.events?.emit('skiff.wobble', { spin: +off.toFixed(2), by: 'courier' }); this.combo.bank(); }
    // down a slope, the fall is kept along it (a landing in the transition: Kirby Air Ride's slope boost, every board game's landing): the
    // share of the fall the slope turns forward, as speed; landed on the flat it is all taken by the hover
    if (off <= BAIL.wobble) {
      const down = this.n.x * f.x + this.n.z * f.z, gain = Math.min(SLOPE.max, fall * Math.max(0, down) * SLOPE.keep);
      if (gain > 0.5) this.v.addScaledVector(f, gain);
      if (gain >= SLOPE.trick) { g.events?.emit('skiff.land.slope', { gain: +gain.toFixed(1), by: 'courier' }); this.combo.add('slope', COMBO.points.slope); }
    }
    // a hard landing slows it; only a sheer drop onto the flat throws them
    if (impact > BAIL.land && this.canBail()) { this.bail('land'); return; }
    if (impact > BAIL.hard && this.rules.hit('land', impact - BAIL.hard)) return;
    if (impact > BAIL.hard) { this.v.multiplyScalar(Math.max(0.55, 1 - 0.02 * (impact - BAIL.hard))); P.shake = Math.max(P.shake, 0.3); g.events?.emit('skiff.landhard', { impact: +impact.toFixed(1), by: 'courier' }); }
  }

  faceYaw() { return this.heading; }

  // ------------------------------------------------------------------ per frame: one frame for skiff and rider
  tick(dt) {
    const P = this.P, D = this.dunes;
    this.time += dt; this.offer();
    if (!this.skiff.loading && (this.dunes?.active || this.game.overture?.active)) this.skiff.load(this.game); // (parsed on the way into the Dunes, or as the trailer begins, which mounts it 16 s in: never for a session that does not go; only the drawing waits on it, never the simulation, which a replay plays again the same)
    if (!this.active) { this.drawParked(); return; }
    this.animT += dt;
    if (this.landT != null && (this.landT += dt) > 0.5) this.landT = null;
    this.landDip = Math.max(0, this.landDip - dt * 2.8);
    this.spinRest = damp(this.spinRest, 0, 14, dt);
    // the sand under it (smoothed, so the skiff settles onto a slope rather than snapping to each facet)
    this.nS.lerp(this.air ? UP : this.n, 1 - Math.exp(-dt * (this.air ? 3 : 10))).normalize();
    const pos = P.renderPos;
    // (heading, spin and roll change in the 60 Hz step; the skiff and the rider are drawn between steps, the way the camera and the wake are)
    const al = this.game.alpha ?? 1;
    const hv0 = this.hPrev + wrap(this.heading - this.hPrev) * al, hv = hv0, rv = this.rollPrev + (this.roll - this.rollPrev) * al;
    const sv = this.spinPrev + (this.spin - this.spinPrev) * al + this.spinRest;
    // ---- the wind and the sail: boom to leeward, wider with the wind behind; it fills or it luffs
    const W = D.wind, wgo = _v.set(W.dir.x, 0, W.dir.y);
    const f = _v2.set(Math.sin(hv0), 0, Math.cos(hv0));
    const lateral = wgo.dot(_v3.set(-f.z, 0, f.x)); // (+: the wind pushes to the boat's right)
    if (Math.abs(lateral) > 0.12) this.boomSign = lateral > 0 ? 1 : -1;
    const cosA = clamp(wgo.dot(f), -1, 1), ang = Math.acos(cosA); // 0: running before it, pi: into it
    const out = THREE.MathUtils.lerp(1.3, 0.2, ang / Math.PI) * (0.55 + 0.45 * this.L);
    this.boom = damp(this.boom, this.boomSign * out, 5, dt);
    const fill = clamp((polar(cosA) - 0.3) / 0.7, 0, 1);
    this.fill = damp(this.fill, this.L * (this.L > 0.7 ? 1 : 0.6) * (0.25 + 0.75 * fill), 4, dt);
    this.wingK = damp(this.wingK || 0, this.gliding && this.phase === 'ride' ? 1 : 0, 8, dt); // (the oars out as wings while gliding)
    this.skiff.set({ sail: this.L, side: -Math.sign(this.boom || 1), fill: this.fill, boom: this.boom, glow: this.boosting, t: this.time, speed: this.speed, wings: this.wingK });
    // the sail screened to see through while riding under way (render/outline.js's screen-door fade, the sail's own: the way ahead stays in view)
    if (this.skiff.sailFade) this.skiff.sailFade.fade.value = damp(this.skiff.sailFade.fade.value, this.phase === 'ride' && this.speed > 4 ? SAIL_SEE : 1, 6, dt);
    // ---- one quaternion for the whole unit: heading, then the slope, then the lean and the pitch, with the spin about its own up
    // (heading, spin and roll change in the 60 Hz step; the skiff and the rider are drawn between steps, the way the camera and the wake are)
    this.slideYaw = damp(this.slideYaw || 0, this.grind.on && this.grindTrick === 'board' ? (this.slideSide || 1) * Math.PI / 2 : 0, 14, dt); // (a boardslide: the board across the rail)
    qA.setFromAxisAngle(UP, hv + sv + this.slideYaw);
    qB.setFromUnitVectors(UP, this.nS);
    const unitQ = qB.multiply(qA);
    if (this.grind.on && this.railUp) { // (on a coaster rail: stood on the rail's up, along its tangent, through banks and loops: grind.js)
      const zf = _g1.copy(this.railFwd), yu = _g2.copy(this.railUp).addScaledVector(zf, -this.railUp.dot(zf)).normalize(), xr = _g3.crossVectors(yu, zf).normalize();
      unitQ.setFromRotationMatrix(_m4.makeBasis(xr, yu, zf));
    }
    qC.setFromAxisAngle(Z, rv + Math.sin(this.time * 30) * 0.02 * this.landDip);
    unitQ.multiply(qC);
    qC.setFromAxisAngle(X, this.air && !this.grind.on ? -clamp(P.vel.y * 0.035, -0.45, 0.45) : 0);
    unitQ.multiply(qC);
    // a grab's tweak (a placeholder for the rider's grab, Calissa's: the board itself pitched nose or tail down, rolled for the double); a
    // grind trick's too (nose grind: the nose down on the rail; tail slide: the tail)
    const tw = this.grab || (this.grind.on && this.grindTrick ? { kind: this.grindTrick } : null);
    this.tweak = damp(this.tweak || 0, tw && this.phase === 'ride' ? 1 : 0, 12, dt);
    if (this.tweak > 0.01) { const kd = tw?.kind ?? this.tweakKind; this.tweakKind = kd; if (kd !== 'board') { qC.setFromAxisAngle(kd === 'double' ? Z : X, GRAB.tweak * this.tweak * (kd === 'tail' ? -1 : 1)); unitQ.multiply(qC); } } // (a boardslide rides flat, turned across)
    // (no bob of the group's own: the board's clips bob the hull, and the rider's the body on it, together)
    const ph = this.phase, pt = this.phaseT, off = ph === 'dismount' || ph === 'bail' || ph === 'getup';
    const G = this.skiff.group;
    if (off) { G.position.copy(this.board.pos); G.quaternion.setFromAxisAngle(UP, this.board.heading); }
    else if (ph === 'mount' && this.parked) { G.position.copy(this.parked.pos); G.quaternion.setFromAxisAngle(UP, this.parked.heading); } // (the board waits where it was left: the rider comes to it)
    else { G.position.set(pos.x, pos.y, pos.z); G.quaternion.copy(unitQ); }
    // the summon (up out of the sand, the doors, the mast telescoping, the boom) and the recall (the fold, and the flight into the raised
    // right hand) are the board's own clips; in the recall it comes down with the rider stepping off, so its root lands in their hand
    if (ph === 'recall') G.position.y -= this.rider.dy;
    G.visible = this.skiff.ready && !(ph === 'recall' && pt > 0.8);
    G.updateMatrixWorld(true);
    // the rider stands on the deck, facing out over the starboard side: a rigid child of the unit (unless thrown off it, or stepping down)
    this.unit = this.unit || { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    if (ph === 'bail' || ph === 'getup') { this.unit.pos.copy(this.rider.pos).setY(this.rider.pos.y - this.rider.dy); this.unit.quat.copy(this.rider.q); }
    else if (ph === 'dismount') { this.unit.pos.copy(this.rider.pos).setY(this.rider.pos.y - this.rider.dy); this.unit.quat.copy(this.rider.q); }
    else if (ph === 'mount') { // (from where they stood onto the deck's spot, as the step carries them to the board and up: stepPhase)
      this.unit.pos.set(0, SKIFF.deck, SKIFF.rider.z * smooth(0, 0.35, pt)).applyQuaternion(G.quaternion).add(pos);
      this.unit.quat.copy(G.quaternion).multiply(qFace);
    } else {
      this.unit.pos.set(0, SKIFF.deck, SKIFF.rider.z).applyQuaternion(ph === 'ride' ? unitQ : G.quaternion).add(G.position);
      if (ph !== 'recall') this.unit.pos.y -= this.rider.dy; // (in the recall the group came down with them already)
      this.unit.quat.copy(ph === 'ride' ? unitQ : G.quaternion).multiply(qFace);
    }
    // the pennant at the masthead (the wind, shown), and the wake from the bow (on water it gives way to the water's own: vfx/skiffwaterlook.js)
    const right = _v3.set(-f.z, 0, f.x);
    this.skiff.placePennant(W.dir, W.speed / 10, this.time);
    const bow = _v.copy(pos).addScaledVector(f, SKIFF.half + 0.2);
    if (ph === 'ride') this.wake.update(dt, { bow, fwd: f, right, speed: this.speed, air: this.air || this.onWater, glow: this.boosting, ground: (x, z) => D.rideHeight(x, z) });
    else this.wake.update(dt, { bow, fwd: f, right, speed: 0, air: true, glow: 0, ground: (x, z) => D.rideHeight(x, z) });
    this.skiff.ground = D.rideHeight(G.position.x, G.position.z) - G.position.y; // (the sand under the board, in its frame: the summon's sigil lies on it)
    this.poseBoat(); // (posed again after the rider in the ride: animate)
  }

  /** The board's own clip for this phase (or the ride's, by the rider's last weights), then the code's word on it (boat.js). */
  poseBoat() {
    const R = this.rider.R;
    if (this.phase !== 'ride') this.skiff.posePhase(BOAT_CLIP[this.phase], this.phase === 'getup' ? this.time : this.phaseT);
    else if (R) this.skiff.pose(R, { t: this.animT, speed: this.speed, steer: this.steer, L: this.L });
    else this.skiff.posePhase('Skiff_RideIdle', this.animT);
  }

  /** Not ridden: the board left parked hovers where it was, its sail down, ready to be mounted (F) or replaced by a summon (Y). */
  drawParked() {
    const k = this.parked, G = this.skiff.group;
    if (!k || !this.dunes.active) { if (this.skiff.group.visible) this.skiff.visible = false; return; }
    this.skiff.visible = true; this.skiff.rope.visible = false;
    k.pos.y = this.dunes.rideHeight(k.pos.x, k.pos.z) + this.cfg.hover + 0.1;
    G.position.copy(k.pos); G.quaternion.setFromAxisAngle(UP, k.heading); G.scale.setScalar(1); // (its bob is its idle clip's)
    this.skiff.set({ sail: 0, side: 1, fill: 0, boom: k.boom ?? 0.3, glow: 0, t: this.time, speed: 0 });
    G.updateMatrixWorld(true);
    this.skiff.placePennant(this.dunes.wind.dir, this.dunes.wind.speed / 10, this.time);
    this.skiff.posePhase('Skiff_RideIdle', this.time);
  }

  // ------------------------------------------------------------------ the rider (the Courier's own skiff clips: rider.js)
  animate(ch, base, dt) {
    this.rider.R ||= new Rider(ch);
    const R = this.rider.R;
    if (this.phase === 'ride') {
      R.ride(base, this.w, { t: this.animT, speed: this.speed, steer: this.steer, L: this.L, hoistDir: this.hoistDir, furling: this.furling, flaring: this.flaring, charge: this.charge, air: this.air, popT: this.popT, landT: this.landT, glide: this.wingK || 0, grab: this.grab, grindTrick: this.grind.on ? this.grindTrick || 'fifty' : null }, dt);
      if (this.active) this.poseBoat(); // (the board's clips by the rider's weights of this very frame)
      return;
    }
    const [clip] = PHASE[this.phase];
    R.phase(base, clip, this.phaseT, this.w);
  }

  hands(ch) { if (this.phase === 'ride') this.rider.R?.grabs.reach(ch, this); } // (a grab's hands on the rail: grabreach.js)

  /** Once the body is posed: the sheet runs from the boom's end to the rider's high hand (while they ride). */
  afterPose(ch) {
    // the bail's ragdoll: begun from this frame's pose, all of the body while thrown, faded into the get-up clip (courier/anim/ragdoll.js)
    if (this.active && (this.phase === 'bail' || this.phase === 'getup')) {
      if (this.ragWant) { (this.rag ||= new Ragdoll(this.game)).start(ch, this.ragWant, { floor: (x, z) => this.dunes?.heightAt?.(x, z) ?? null, onTouch: (speed) => this.game.events?.emit('skiff.tumble', { speed: +speed.toFixed(1), by: 'courier' }) }); this.ragWant = null; }
      if (this.rag?.active) {
        const w = this.phase === 'bail' ? 1 : 1 - smooth(0, RAG.blend, this.phaseT);
        if (w > 0.001) this.rag.apply(ch, w); else this.rag.stop();
      }
    }
    if (this.w < 0.05 || !this.active) return;
    const on = this.phase === 'ride' || (this.phase === 'summon' && this.phaseT > 1.8) || (this.phase === 'mount' && this.phaseT > 0.6);
    this.skiff.rope.visible = on;
    if (on) this.skiff.drawRope(this.game.scene, ch.arm.L.hand.getWorldPosition(_v));
  }

  camera(fp, pivot) {
    if (!this.active || this.w < 0.05) return;
    // stand off further than on foot: the sail wants room
    _v.set(Math.sin(this.P.yaw), 0, Math.cos(this.P.yaw));
    pivot.addScaledVector(_v, (clamp((this.speed || 0) * 0.04, 0, 1.2) - 3.8) * this.w);
    pivot.y += 1.5 * this.w;
  }

  label() { if (this.phase !== 'ride') return this.phase.toUpperCase(); return `SAIL ${Math.round(this.L * 100)}% · ${Math.round((this.speed || 0) * 3.6)} km/h${this.boosting > 0.3 ? ' · FLARE' : ''}${this.combo.stocks >= 0.01 ? ` · BANKED ${this.combo.stocks.toFixed(1)}` : ''}`; }
}
