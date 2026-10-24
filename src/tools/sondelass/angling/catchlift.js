// ---------------------------------------------------------------------------------------
// THE CATCH'S LIFT (docs/plans/ANGLING.md 3, "the catch"; the owner: "a proper 'I CAUGHT A FISH' short cinematic, much like in Animal
// Crossing"): what happens between the fight's end and the rod being the rod again, about LIFT.full real seconds.
//
//   OUT      the fish leaves the water on the line: a splash and a spray of its feeling's Lachryma (vfx/anglingeffects.js
//            `angle.lift.splash`), swung up on the rod's own catch (the suite's Sond_Catch) toward where the hands will be.
//   THE CUT  at LIFT.out the camera cuts close and low in front of the Courier (game.cinema.shot, a cut: its ease is a frame), and
//            under the cut the rod is let go: the Courier holds the fish up in both hands, broadside to the camera, wriggling (its
//            `held` pose: fishmesh.js). `angle.lift` goes out on the bus here, so the sting (Wanda's) lands on the picture.
//   HELD     the lift's arms are the carry's own (UAL's chestOpen, the reaching arm mirrored to both: courier/moves/carry.js
//            twoHanded), risen to the top of their reach; the fish rides the palms' midpoint, and each hand is set on its flank by a
//            light reach (LIFT.grip of the way), never a pose of its own. The camera pushes in a little.
//   BACK     at LIFT.full (or a key pressed after LIFT.skipAfter) it comes apart into what it was made of, the camera cuts back and the
//            rod is in the hand again.
// A second catch of the same species in a row is the quick lift instead (LIFT.quick: out of the water and hung on the line before
// them, no cut, no hands), unless it is a record or a legend. Nothing here writes words: the log's line is angle.catch's (tracking/
// angling.js), the sting is Wanda's on angle.lift.
//
// Prior art, and what was taken: Animal Crossing's catch held up to the camera in both hands, every time, the cut to it and the hold
// (and its quick version: none here for a repeat, a shorter one); Sega Bass Fishing's landing (the fish swung up out of the water on the
// line, a splash off it); Zelda: Twilight Princess's fishing hole (the close, low camera on the catch, the Courier facing it).
//
//   const lift = new CatchLift(angler)   lift.start(fish, { first, record, legend })   lift.update(rawDt, inp) -> true when done
//   lift.pose(C, out) -> pose | null (the upper body's, over the rod's stance)          lift.hands(ch) (sondelass.js, after the pose)
//   lift.finish()   lift.holding (the fish in both hands, the rod let go)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../../../core/physics.js';
import { COLOR } from '../../../progress/weather.js';
import { feelingOf } from './fishmesh.js';
import { stream } from '../../../core/rng.js';
const simRand = stream('tools/sondelass/angling/catchlift'); // (the simulation's chance: core/rng.js, the same twice)

/** Real seconds and metres: the whole lift, the quick one, out of the water, when a key may skip it; the arms' rise (chestOpen's own
 *  seconds, from and to: carry.js LIFT_CLIP's top), the hands' reach onto the fish, the length (m) a small fish is grown to, and the camera (ahead of the Courier, to their side,
 *  above their feet, how far it pushes in, its lens). */
export const LIFT = {
  full: 2.5, quick: 0.8, out: 0.6, quickOut: 0.45, skipAfter: 0.5,
  rise: 0.35, clip: { from: 0.74, to: 0.95 }, grip: 0.6, minLen: 0.45,
  cam: { ahead: 1.75, side: 0.32, up: 0.55, push: 0.22, fov: -4 },
};
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _q = new THREE.Quaternion();
const _pL = new THREE.Vector3(), _pR = new THREE.Vector3(), _g = new THREE.Vector3(), _h = new THREE.Vector3();

export class CatchLift {
  constructor(angler) {
    this.angler = angler; this.game = angler.game;
    this.c = null; // { f, t, from, quick, cut, yaw }
    this.lastSpecies = null;
    this.center = new THREE.Vector3(); this.look = new THREE.Vector3(); this.placed = false;
  }
  get active() { return !!this.c; }
  /** The fish in both hands: the rod let go (sondelass.js hides it, angler.js leftHand lets the reel go). */
  get holding() { return !!this.c && !this.c.quick && this.c.t >= LIFT.out; }

  /** The landing (angler.js land): the fish on the line, out of the water. */
  start(f, info = {}) {
    const g = this.game, P = this.angler.P;
    const quick = (f.sp.id === this.lastSpecies && !info.record && !info.legend) || !!P.fp; // (in first person there is no body to hold it up)
    this.lastSpecies = f.sp.id;
    this.c = { f, t: 0, from: f.pos.clone(), quick, cut: false, yaw: P.bodyYaw ?? P.yaw, info };
    this.placed = false;
    // the splash: where it leaves the water, of the water and of its feeling (the legend's first band)
    const surf = this.angler.weir?.poolAt(f.pos.x, f.pos.z)?.surface ?? f.pos.y;
    const at = _a.set(f.pos.x, surf, f.pos.z), feel = feelingOf(f.sp);
    g.vfx?.play('angle.lift.splash', { pos: at, tint: feel ? COLOR[feel] : f.sp.color, power: 0.7 + Math.min(0.9, f.length * 0.8) });
    this.angler.weir?.ripples?.ring(at.x, at.y, at.z, 2 + f.length * 2, 0xffffff, 1.1);
    g.water?.disturb?.(at.x, at.z, 0.6 + Math.min(0.6, f.length), 'catch', at.y);
  }

  /** Each frame of the catch, on real time. True once it is over. */
  update(raw, inp) {
    const C = this.c; if (!C) return true;
    const g = this.game, P = this.angler.P, f = C.f;
    C.t += raw;
    const end = C.quick ? LIFT.quick : LIFT.full, out = C.quick ? LIFT.quickOut : LIFT.out;
    // (any key after the first half-second skips the rest; the keys are spent so they do not cast, jump or open anything as well)
    if (C.t > LIFT.skipAfter && inp?.pressed?.size) { inp.spend(...inp.pressed); C.t = end; }
    if (C.t < out || C.quick) {
      // out of the water, on the line: drawn up and swung to before them (the rod's own catch is playing)
      const k = smooth(0, out * 0.9, C.t);
      P.bodyYaw += Math.atan2(Math.sin(P.yaw - P.bodyYaw), Math.cos(P.yaw - P.bodyYaw)) * (1 - Math.exp(-raw * 6));
      C.yaw = P.bodyYaw;
      const hold = _b.set(P.pos.x + Math.sin(P.yaw) * 1.6, P.pos.y + 1.7, P.pos.z + Math.cos(P.yaw) * 1.6);
      f.pos.lerpVectors(C.from, hold, k); f.pos.y += Math.sin(Math.PI * k) * 1.2;
      f.heading = -P.yaw + Math.PI / 2 + C.t * 1.1; f.pitch = 0.3 * (1 - k);
      this.place(f, k);
      if (C.quick && !C.lifted && C.t >= out) { C.lifted = true; this.emitLift(true); }
    } else {
      // held up in both hands, facing the camera: they stand still for it
      P.bodyYaw = C.yaw;
      if (!C.cut) this.cut();
      // (the fish's place is the hands', set after the pose: hands(); before the first one, where the lift will bring it)
      if (!this.placed) this.center.copy(this.restCenter(_c));
      f.pos.copy(this.center);
      this.shot(raw, smooth(out, end, C.t));
    }
    f.speed = 0.6; f.state = 'landed'; f.fade = 1;
    f.mesh.swim(raw, 0.3, 0); // (the Weir lets a landed fish be: its wriggle is ours, weir.js)
    if (C.t >= end) { this.finish(); return true; }
    return false;
  }

  /** The fish's body where it is (out of the water: grown a little so a small one reads). */
  place(f, k) {
    const m = f.mesh.group;
    m.position.copy(f.pos); m.rotation.set(0, -f.heading, f.pitch, 'YZX');
    m.scale.setScalar(THREE.MathUtils.lerp(1, this.heldScale(f), k));
    f.mesh.glow(1);
  }
  heldScale(f) { return THREE.MathUtils.clamp(LIFT.minLen / Math.max(0.05, f.length), 1, 1.5); } // (a small one grown to read; a big one as it is)

  /** The Courier's frame: forward and right (their right, as sondelass.js has it) from the yaw they hold still. */
  frame() { const y = this.c.yaw; _f.set(Math.sin(y), 0, Math.cos(y)); _r.set(-Math.cos(y), 0, Math.sin(y)); }
  /** Where the hands will hold it before they have it: chest height, a little ahead. */
  restCenter(out) { this.frame(); const p = this.angler.P.renderPos ?? this.angler.P.pos; return out.copy(p).addScaledVector(_f, 0.42).addScaledVector(UP, 1.12); }

  /** The cut: the rod let go under it, the camera close and low in front of them, and the moment told. */
  cut() {
    const C = this.c, g = this.game;
    C.cut = true;
    g.cinema.free('catch'); g.portrait?.hide(); // (the shot is the fish now, not its window)
    this.look.copy(this.restCenter(_c));
    this.shot(0, 0, true);
    this.emitLift(false);
  }
  emitLift(quick) {
    const C = this.c, f = C.f, i = C.info;
    this.angler.emit('angle.lift', { species: f.sp.id, cm: f.cm, first: !!i.first, record: !!i.record, legend: !!f.sp.legend, quick, by: 'courier' });
  }

  /** The camera: ahead of the Courier and to their side, low, looking up at the fish; it pushes in over the hold. Never through a wall. */
  shot(raw, k, first = false) {
    const g = this.game, P = this.angler.P, Cm = LIFT.cam;
    this.frame();
    const base = P.renderPos ?? P.pos;
    if (!first) this.look.lerp(this.center, 1 - Math.exp(-raw * 10));
    const ahead = Cm.ahead * (1 - Cm.push * k);
    const pos = _a.copy(base).addScaledVector(_f, ahead).addScaledVector(_r, Cm.side).addScaledVector(UP, Cm.up);
    const dir = _b.subVectors(pos, this.look), len = dir.length(); dir.divideScalar(len || 1);
    const hit = g.physics?.raycast(this.look, dir, len + 0.25, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    if (hit) pos.copy(this.look).addScaledVector(dir, Math.max(0.6, hit.distance - 0.25));
    g.cinema.shot('catch.lift', { pos, look: this.look, fov: Cm.fov, roll: 0, bars: 1, ease: 400 }); // (an ease of a frame: a cut)
  }

  /** The upper body over the rod's stance: the rod's own catch out of the water, the carry's two-handed lift once it is held. */
  pose(C, out) {
    const c = this.c; if (!c) return null;
    if (!this.holding) { C.sample('Sond_Catch', Math.min(1.56, c.t), out, false); return out; }
    const ch = this.game.character;
    if (!C.clips.chestOpen || !ch?.mirrorPose) { C.sample('Sond_Catch', 1.56, out, false); return out; }
    const L = LIFT.clip, t = L.from + (L.to - L.from) * smooth(0, LIFT.rise, c.t - LIFT.out);
    if (!this.mirrorR) { const tb = {}; for (const n of C.bones) if (n.endsWith('R') && /^(upper_arm|forearm|hand|f_|thumb)/.test(n)) tb[n] = 1; this.mirrorR = C.mask(tb); this.tmp = C.pose(); }
    // (chestOpen reaches with the left arm: its mirror given to the right, as carry.js twoHanded(..., 'R') does: both hands under it)
    C.sample('chestOpen', t, out, false);
    ch.mirrorPose(out, this.tmp);
    C.blend(out, this.tmp, 1, this.mirrorR);
    return out;
  }

  /** After the pose (sondelass.js hands): the rod and the held lure let go, the fish between the palms, each hand set on its flank. */
  hands(ch) {
    const tool = this.angler.tool, held = this.holding;
    if (tool.heldLure) tool.heldLure.group.visible = !held;
    if (!held) return;
    tool.model.group.visible = false;
    this.angler.line.hide();
    const f = this.c.f, A = ch.arm;
    const pL = _a.copy(A.L.palmPt).applyMatrix4(A.L.hand.matrixWorld), pR = _b.copy(A.R.palmPt).applyMatrix4(A.R.hand.matrixWorld);
    this.frame();
    const s = this.heldScale(f), len = f.length * s;
    // its middle between the palms, a little ahead of them and resting on them (its girth about a fifth of its length)
    const mid = _c.addVectors(pL, pR).multiplyScalar(0.5).addScaledVector(_f, 0.05).addScaledVector(UP, len * 0.06);
    this.center.copy(mid); this.placed = true;
    // broadside to the camera: its length along their right, its flank to the front (nose to their right)
    const m = f.mesh.group;
    m.position.copy(mid); m.rotation.set(0, -Math.atan2(_r.z, _r.x), 0, 'YZX'); m.scale.setScalar(s);
    f.mesh.glow(1);
    // the hands on its flanks, each on its own side of the middle, a light reach from where the lift has them
    const half = THREE.MathUtils.clamp(len * 0.26, 0.09, 0.24);
    const palms = { L: _pL.copy(pL), R: _pR.copy(pR) }; // (copied: the reach below moves the hands)
    for (const sd of ['L', 'R']) {
      const palm = palms[sd], hand = A[sd].hand;
      const side = Math.sign(_g.subVectors(palm, mid).dot(_r)) || (sd === 'R' ? 1 : -1);
      _g.copy(mid).addScaledVector(_r, side * half).addScaledVector(UP, -len * 0.05).sub(palm); // (the palm's way to its grip)
      ch.reachHand(sd, hand.getWorldPosition(_h).add(_g), hand.getWorldQuaternion(_q), LIFT.grip);
    }
  }

  /** It comes apart into what it was made of, into the Pneuka Box, and the rod is the rod again. */
  finish() {
    const C = this.c; if (!C) return;
    this.c = null;
    const a = this.angler, g = this.game, f = C.f;
    if (C.cut) g.cinema.cut('catch.lift'); // (a cut back, as it cut in)
    const n = Math.round(2 + f.sp.lach * 0.18 * (0.6 + f.cm / f.sp.size[1]));
    g.baubles?.spawn(f.pos.clone(), n);
    a.settle('catch');
    const fx = g.fx;
    for (let i = 0; i < 26; i++) fx?.add.emit({ pos: f.pos.clone(), vel: new THREE.Vector3((simRand() - 0.5) * 3, simRand() * 3, (simRand() - 0.5) * 3), life: 1.2, size: 0.12, sizeEnd: 0.01, color: new THREE.Color(f.sp.color), alpha: 0.9, drag: 2, floor: -100 });
    g.glyphs?.pop('star', _a.copy(f.pos).addScaledVector(UP, 0.6), { color: f.sp.color, size: 0.9 + f.sp.tier * 0.12, burst: true, ring: true, life: 1.5 });
    g.pool?.gain?.(0);
    a.weir.remove(f);
    a.caught = null; a.state = 'idle'; a.castPhase = 'none';
    a.release();
    a.line.hide();
    if (a.tool.heldLure) a.tool.heldLure.group.visible = true;
    a.emit('angle.landed', { species: f.sp.id, baubles: n, by: 'courier' });
    g.pneuka?.add(`fish.${f.sp.id}`, 'catch'); // (kept whole, to be sold to Old Grog: progress/shop/catalogue.js)
  }
}
