// ---------------------------------------------------------------------------------------
// THE CUTLASS: the Sondelass's melee form, and everything a blade needs to be a good one. Its strokes are the Courier's own suite
// (Sond_*), run by the shared combo engine (tools/moveset.js, the grammar every tool keeps):
//
//   LMB         THE NORMALS: the melee loadout's string (as chosen in the loadout editor and kept, loadoutchosen.js; the default,
//               sondelassloadout.js: c1 .. c4, four strokes, the fourth the whole body's, a leap and a cut), walked slot by slot, the
//               last looping to the first; after a pause at the first, a THRUST and its follow; after a pause at the second, the three
//               wide arcs of the JRPG string
//   hold LMB    the CHARGE: the blade drawn back while held, the charged slash on release
//   S + LMB     the LAUNCHER: tapped, what it cuts goes up to the blade; held, up they go on an arc of their own, 3.92 m, and it with
//               them if it can be lifted (Devil May Cry's High Time); LMB in the air: two cuts that keep it at the blade, then the PLUNGE,
//               the blade driven down with a blast round them on the ground
//   a press in a blow's recovery: THE PAID CUT (tools/moveset.js): Lachryma paid, the next move at once; RMB the special, V the guard
//   sprinting   LMB: the DASH SLASH (its own 2.3 m, carried)
//   R           the TIDECUTTER: the special, a leaping wave of a cut (12 Lachryma)
//   RMB         THE SPECIALS (the owner, 2026-10-11: "LMB as a 'normal' attack button and RMB as a 'special' attack button, so moves
//               like the current Stinger don't get disrupted"): on the press, at once, the loadout's special: tapped, the tap's slot (the
//               STINGER by default: a committed thrust, eight metres in a quarter of a second, the suite's thrust held out, everything in
//               the line pierced and thrown; courier/moves/launch.js carries them past the core's speed cap); with W, the forward slot;
//               with S, the back slot (an empty one is the tap's). Inside a blow's strike the press waits (RMB_BUFFER) for the free way.
//   crouched, RMB   THE IAIDO ("crouched" is player.crouching: grounded and low, never C held): the charge's pose (the blade along the
//               belt, its point trailing past the left hip, the off hand at the guard, the body coiled: courier/anim/stances.js
//               cutlassIaido); held through the charge (IAIDO.charge), BLADE MODE (blade.js): time all but stops, the mouse turns a line
//               of light through the target, LMB cuts along it; let go before, THE DRAW CUT: one fast rising cut forward, from the pose.
//               Not crouched, RMB never enters blade mode.
//   E           THE BLINK CANCELS ANY MOVE (the owner, 2026-10-11): a stroke (tools/moveset.js blinkCancel(), the string's place kept), the
//               stinger, the iaido's charge, blade mode.
//   MMB         lock on (lockon.js): the camera and the body hold the target, strokes and the stinger go toward it, A/D strafe it.
//   V (hold)    GUARD: the blade comes up (Sond_Block). Pressed in time (the first 0.28 s), a projectile that arrives is PARRIED
//               (Sond_Parry): sent back where they look (parry.js, the rule the kick shares); later, it is only turned aside. LMB with
//               the guard up is the COUNTER: the spin slash, and the guard drops.
//
// Prior art, and what was taken:
//  - Every third-person action game's light combo (Zelda's, Dark Souls' R1 string): a buffered press inside the chain window
//    continues, a late one starts over, and each stroke steps you a little way toward what you are cutting (here, toward the lock).
//  - Monster Hunter: the hit window is a slice of the clip, not the whole of it, and the blade is tested along its length every frame
//    in that slice (a swept segment, not a point) so a fast swing cannot skip through something.
//  - Devil May Cry's Stinger (a lunge that pierces and stays committed), Soul Calibur's and DMC's weapon trails (a ribbon between
//    two sockets, sampled per frame and spline-smoothed), and the hit-stop every fighting game uses (a few frames of nearly nothing
//    at the moment of contact, which is most of what makes a hit feel heavy: game.time.pulse).
//  - Zelda: Twilight Princess' lock-on and Sekiro's deflect for the guard's timing (see lockon.js and parry.js).
//  - God Hand's specials on their own button (the Technique Roulette's), the normals' Combo Tree on the other (the melee loadout); the
//    iaido: battojutsu's draw from the hip, Ghost of Tsushima's standoff and Sekiro's crouched draw (the charge held low, let go into one
//    cut), Metal Gear Rising's Blade Mode entered from it.
// The blade is tested against breakables and clapperjars by distance from the blade's segment (they are few and near); each is hit
// once per stroke.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { BLADE_LEN } from './model.js';
import { Trail } from '../../vfx/trail.js';
import { BladeMode } from './blade.js';
import { deflect, guard } from '../../courier/parry.js';
import { Moveset, rootOf, shedSpeed } from '../moveset.js';
import { Afterimages } from '../../vfx/afterimage.js';
import { SONDELASS_MOVES, SONDELASS_LOADOUT } from './sondelassloadout.js';
import { SondelassLoadout } from './loadoutchosen.js';
import { stream } from '../../core/rng.js';
const fxRand = stream('tools/sondelass/cutlass.fx'); // (the look's chance: the afterimages' hue)

// The strikes are the Courier's own suite (melee.glb's Sond_*), played by the shared combo engine (tools/moveset.js): the moves below
// are its table. Clip seconds throughout; when the blade can hurt is not typed here: it is measured from the clip (melee.js).
// (The string's normals, c1 .. c4, and the specials RMB holds are the melee loadout's: sondelassloadout.js, its catalogue played by the
// engine. What follows is the fixed grammar.)
const MOVES = {
  // the pause strings: after the first stroke, a thrust and its follow; after the second, the three wide arcs (the JRPG string)
  t1: { rule: 'pause1', clip: 'Sond_Thrust', rate: 1.1, chain: [0.2, 0.7], to: 0.8, fade: 0.3, hit: { power: 1.5, dmg: 1.3, push: 4 }, lunge: 4, arc: 'raise' },
  // (t2 holds the thrust out 0.13-0.70 and stabs three times, its speed's peaks at 0.21, 0.53, 0.66: a typed strike, a hit at each;
  // its push 7 to 2, or the first stab threw what it struck out of the other two's reach; its row's stagger holds it. The blade is held
  // 40-90 degrees to their left all the while, never across the front, so it never struck what was straight ahead: aimed at 55)
  t2: { rule: 'thrust2', clip: 'Sond_ThrustCombo', body: 'whole', root: 'xz', strike: [0.13, 0.7], parts: [0.13, 0.45, 0.6], aim: 0.95, hit: { power: 1.8, dmg: 1.6, push: 2 }, heat: 0.7, arc: 'raise' },
  // (j1 and j2 chain once their arcs finish, 0.51 and 0.64: a quick press no longer cuts the arc short)
  j1: { rule: 'pause1', clip: 'Sond_JrpgCombo1', rate: 1.1, chain: [0.53, 0.85], to: 0.95, fade: 0.3, hit: { power: 1.3, dmg: 1.2 }, lunge: 2.6, arc: 'r2l' },
  j2: { rule: 'pause2', clip: 'Sond_JrpgCombo2', rate: 1.1, chain: [0.66, 0.95], to: 1.05, fade: 0.3, hit: { power: 1.4, dmg: 1.3 }, lunge: 2.6, arc: 'l2r' },
  j3: { rule: 'pause3', clip: 'Sond_JrpgCombo3', body: 'whole', hit: { power: 2.2, dmg: 2.0, push: 7, lift: 3 }, heat: 1, arc: 'over' },
  // S + LMB: the launcher lifts them (its own 0.92 m) and what it strikes. Tapped, lift 5.5 (an apex of 1.55 m about as a1 cuts, the
  // Courier on the clip's own rise); held to its strike (High Time, tools/moveset.js), they rise on an arc of their own to the owner's
  // "about 2.2x their own height", 2.2 x 1.78 m = 3.92 m to the feet, whatever was struck (2026-10-11: riding what it launched, the rise
  // broke on Strawman), and what it struck is lifted 9.2 to meet the blade: a slip jelly's base tops out at 9.2^2 / (2 x 9.81) = 4.31 m,
  // its centre 1.2 m over their top, where the air blows ride it (1.3 m under its centre). An air blow never slows its rise (a lift is a
  // floor: moveset.js). LMB in the air: two cuts that hold it near the blade, sinking (lift 1.2: 0.3 m down in the 0.4 s to the next,
  // where 2 held it level and the string hung; push 0.5, not 1.5 and 2, which carried the two of them sideways at 3.8 m/s into the
  // nearest wall), the Courier's own hang x0.3 (6.3 m/s², was 0.12) where nothing is ridden; and the plunge, its wind-up at 1.25x to
  // 0.26 clip s (the chop's end, was 0.32 at 1x) and its fall 30 m/s (was 26), whose landing ring strikes only what is near the ground,
  // its lift gone (what it threw overhead flew 9 m). The owner (2026-10-11): "a little too floaty"; measured: docs/plans/SONDELASS-STRINGS.md
  up: { rule: 'launcher', clip: 'Sond_Launcher', body: 'whole', root: 'xyz', chain: [0.3, 1.08], hit: { power: 1.4, dmg: 1.1, lift: 5.5, push: 1 }, high: { lift: 9.2 }, arc: 'over' },
  a1: { rule: 'air1', clip: 'Sond_AirCombo1', body: 'whole', gravity: 0.3, chain: [0.22, 0.8], hit: { power: 1.2, dmg: 1.0, lift: 1.2, push: 0.5 }, arc: 'r2l' },
  // (a2's somersault turns the blade in an upright circle 37-49 degrees to their left, never across the front: aim turns them that far
  // off the target, so the circle's front passes through it; measured from the clip, melee.js)
  a2: { rule: 'air2', clip: 'Sond_AirCombo2', body: 'whole', gravity: 0.3, chain: [0.36, 1.0], aim: 0.73, hit: { power: 1.3, dmg: 1.1, lift: 1.2, push: 0.5 }, arc: 'l2r', heat: 0.5 },
  a3: { rule: 'plunge', clip: 'Sond_AirPlunge', body: 'whole', rate: 1.25, plunge: { hold: 0.26, speed: 30 }, ring: 2.6, hit: { power: 2.2, dmg: 2.0, push: 2, lift: 0 }, ringHit: { power: 2.2, dmg: 2.0, push: 7, lift: 0 }, heat: 1, arc: 'over' }, // (its chop keeps what it cut near, to fall beside them; the ring's push clears the ground)
  // a running slash (LMB while sprinting), the charged slash (hold LMB), the counter from the guard, and the special (R)
  dash: { rule: 'dash', clip: 'Sond_DashSlash', body: 'whole', root: 'xz', hit: { power: 1.9, dmg: 1.8, push: 8 }, heat: 0.8, arc: 'r2l' },
  hold: { clip: 'Sond_ChargeHold' },
  burst: { rule: 'charge', clip: 'Sond_ChargeRelease', body: 'whole', root: 'xz', hit: { power: 1.6, dmg: 1.6, push: 9 }, heat: 1, arc: 'r2l' },
  spin: { rule: 'counter', clip: 'Sond_SpinSlash', body: 'whole', hit: { power: 1.4, dmg: 1.2, push: 6 }, heat: 0.6, arc: 'r2l' },
  tide: { rule: 'special', clip: 'Sond_SpecialTidecutter', body: 'whole', cost: 12, ringAt: 1.86, ring: 4.2, hit: { power: 3, dmg: 3, push: 12, lift: 4 }, heat: 1, arc: 'over' },
  // crouched, RMB let go before the charge is full: THE IAIDO'S DRAW CUT. The suite's rising cut (c2's clip, low left to high right: the
  // sweep a blade drawn from the left hip makes) from 0.22 s, its strike begun, at 1.4x, begun from the iaido's pose (begin's `join`;
  // from 0.1, the join swept the blade 7 cm through the crouched left thigh, from 0.18 1.5 cm: the pose audit, 2026-10-11). No row of its own yet (progress/combat/moves.js is Dovina's): k x 1.1 = 1.54 a hit,
  // between c3's 1.4 and c4's 2.0; about 0.6 real s a cut with the shortest charge, 2.5 power a second, the string's 2.7 or under
  iai: { clip: 'Sond_Combo2', from: 0.22, rate: 1.4, to: 0.9, fade: 0.3, hit: { power: 1.1, dmg: 1.4, push: 3 }, lunge: 4.5, heat: 0.7, arc: 'l2r', legs: false }, // (the crouch's legs kept: the clip's stood them up mid-cut)
};
const STRINGS = { pause: [{ at: 0, to: ['t1', 't2'] }, { at: 1, to: ['j1', 'j2', 'j3'] }], launcher: 'up', air: ['a1', 'a2', 'a3'], dash: 'dash', charge: { hold: 'hold', release: 'burst' }, special: 'tide' };
const REACH = BLADE_LEN * 0.55 + 0.35; // (beyond the measured tip of a hand-held thing: the cutlass's blade, and some forgiveness)
const STING = SONDELASS_MOVES.stinger.sting; // (the stinger's numbers are its catalogue row's)
// THE IAIDO: `charge` real s held to blade mode (the owner's "charge-up", about half a second); the pose eased in over `in` and out over
// `out` real s; the off hand at the guard, `left` m along the tool from the blade hand
const IAIDO = { charge: 0.5, in: 0.08, out: 0.1, left: 0.16 }; // (left: at 0.2, on the guard itself, the hand sat 3 cm into the crouched thigh)
const PARRY_WIN = 0.28, RMB_BUFFER = 0.35; // (an RMB press inside a strike waits this long, real s, for the free way)
const DMG = 62;
const _up = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3();

/** Distance from point p to the segment ab. */
function segDist(a, b, p) {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 > 0 ? THREE.MathUtils.clamp(_c.subVectors(p, a).dot(_d) / l2, 0, 1) : 0;
  return _c.copy(a).addScaledVector(_d, t).distanceTo(p);
}

export class Cutlass {
  constructor(tool) {
    this.tool = tool;
    const g = tool.game;
    this.trail = g.vfx?.swing('swing.cutlass', { tint: 0xffb27a, tip: 0xfff1dc }) || new Trail(g.scene, { life: 0.3, max: 48, color: 0xffb27a, tip: 0xfff1dc, fade: 1.5 }); // (its look: vfx/library.js)
    this.ghosts = new Afterimages(g, { opacity: 0.3, life: 0.4 }); // (the stinger's and the paid cut's: Blink Dash's one afterimage, vfx/afterimage.js)
    this.loadout = g.sondelassLoadout ||= new SondelassLoadout(g); // (the melee loadout chosen in the loadout editor and kept in the save, checked: loadoutchosen.js)
    this.moves = new Moveset(tool, {
      id: 'cutlass', rules: 'sondelass', moves: MOVES, strings: STRINGS, reach: REACH, pot: DMG, k: 1.4, cause: 'sliced', events: { swing: 'cut.swing', hit: 'cut.hit' },
      trail: this.trail, segment: (a, b) => this.tool.model.bladeSegment(a, b), ghosts: this.ghosts,
      catalogue: SONDELASS_MOVES, loadout: () => this.loadout?.get() || SONDELASS_LOADOUT, wraps: { stinger: (row, { paid }) => this.stinger(paid) }, // (the loadout chosen, checked against the catalogue and what is open; the default where none is: MELEE-LOADOUT.md phase 3)
      drawn: () => this.tool.drawT > 0.02 && this.tool.form === 'cutlass', onBlinkCancel: () => this.blinkCancel(),
    });
    this.blade = new BladeMode(this);
    this.rmb = null; // an RMB press waiting for the free way: { want: 'tap' | 'forward' | 'back' | 'iaido', t }
    this.iai = null; this.iaiW = 0; // the iaido's charge ({ t: real s held, full }), and its pose's weight
    this.stinging = false; this.stCool = 0; this.stHit = new Set(); this.stPrev = new THREE.Vector3(); this.stDir = new THREE.Vector3(0, 0, 1); this.ghostT = 0;
    this.guardOn = false; this.guardT = 0; this.guardW = 0; this.parryT = 9;
  }
  get busy() { return this.moves.busy || this.stinging || this.blade.active || this.guardOn || !!this.iai; }
  get playing() { return this.moves.playing || this.blade.active || this.blade.k > 0.05 || this.guardW > 0.02 || this.parryT < 0.9 || this.iaiW > 0.01; }
  /** The off hand on the hilt (sondelass.js hands(): the light IK): while the iaido's pose shows, 0..1. */
  get leftHand() { const b = this.blade; return this.moves.cur || b.swing > 0 ? 0 : Math.max(this.iaiW, b.active ? 1 : Math.min(1, b.k)); } // (and while blade mode holds the iaido's pose: whole, never dipping as the charge hands over to it)
  /** Where along the tool the off hand takes it (m from the blade hand: at the guard). */
  get leftAt() { return IAIDO.left; }
  get game() { return this.tool.game; }
  get combo() { return this.moves.combo; }

  cancel() {
    this.moves.closeBlow(this.stBlow); // (the stinger's blow before the stow ends the run: tools/moveset.js)
    this.moves.cancel(); this.rmb = null; this.iai = null; this.iaiW = 0; this.guardOn = false; this.ghosts.clear();
    this.blade.exit('stow');
    this.game.lock?.release('stow');
    this.trail.gap();
    this.tool.P.guarding = false;
  }

  // ---------------------------------------------------------------- aim
  /** Where a thrust goes: toward the lock, or where they are looking. */
  aimDir(out, flat = true) {
    const g = this.game, P = this.tool.P;
    if (g.lock?.active) {
      const at = g.lock.point(_e);
      out.copy(at).sub(_a.set(P.pos.x, P.pos.y + 0.9, P.pos.z));
      if (flat) out.setY(THREE.MathUtils.clamp(out.y, -1, 1) * 0.3);
      if (out.lengthSq() > 1e-4) return out.normalize();
    }
    P.lookDir(out);
    if (flat) out.y = THREE.MathUtils.clamp(out.y, -0.1, 0.25);
    return out.normalize();
  }

  // ---------------------------------------------------------------- strokes: the moveset reads LMB (and R); the cutlass keeps RMB and V
  update(dt, inp) {
    const P = this.tool.P, g = this.game, raw = g.rawDt || dt;
    this.stCool -= dt; this.parryT += dt;
    this.iaiW = this.iai ? Math.min(1, this.iaiW + raw / IAIDO.in) : Math.max(0, this.iaiW - raw / IAIDO.out);
    // E in blade mode: the world comes back up for the blink at once (at a twentieth of its speed its fixed step, and so the blink, waits
    // up to a third of a real second); the blink's own `move.blink` does the rest (blinkCancel())
    if (this.blade.active && inp.wasPressed('KeyE') && this.blinkReady()) this.blade.exit('blink');
    // the blade is read in real seconds: what the world is doing does not change how fast they cut
    if (this.blade.active || this.blade.k > 0 || this.blade.queue.length) { this.blade.update(dt, inp); if (this.blade.active) return; }
    if (inp.wasPressed('Mouse1')) g.lock.toggle();
    // LMB with the guard up: the counter (the spin), and the guard drops
    if (this.guardOn && inp.wasPressed('Mouse0') && !this.moves.busy) { this.guardOn = false; this.tool.P.guarding = false; this.moves.begin('spin', 'counter'); }
    this.guardUpdate(dt, inp);
    this.specials(inp, raw);
    if (this.iai) { this.iaido(inp, raw); return; } // (the charge holds the hands: no stroke while it coils)
    if (this.stinging) return;
    this.moves.update(dt, inp, { allow: P.techs.active?.id !== 'swim' && !this.guardOn });
  }

  /** RMB: THE SPECIALS. On the press, at once: the loadout's slot (tapped, the tap's; with W, the forward; with S, the back; an empty one
   *  the tap's: tools/moveset.js special()). In a blow's recovery, at once for the paid cut (its own cost with it, or neither); inside a
   *  strike, or the stinger cooling, the press waits RMB_BUFFER for the free way. Crouched (player.crouching), the press is the iaido. */
  specials(inp, raw) {
    const P = this.tool.P, M = this.moves;
    if (inp.wasPressed('Mouse2') && !this.stinging && !this.guardOn && !this.blade.active && !this.iai) {
      const want = P.crouching ? 'iaido' : inp.isDown('KeyW') ? 'forward' : inp.isDown('KeyS') ? 'back' : 'tap';
      if (M.recovering() && (want === 'iaido' || this.stCool <= 0) && M.cut(want === 'iaido' ? 0 : M.costOf(M.specialOf(want)))) { this.go(want, true); return; }
      this.rmb = { want, t: RMB_BUFFER };
    }
    const r = this.rmb;
    if (!r) return;
    r.t -= raw;
    if (r.want === 'iaido' && !P.crouching) this.rmb = null; // (stood up while it waited: the iaido is the crouch's)
    else if (!this.busy && (r.want === 'iaido' || this.stCool <= 0)) { this.rmb = null; this.go(r.want, false); }
    else if (r.t <= 0) this.rmb = null;
  }

  /** What an RMB press goes into: the iaido's charge, or the special a slot holds (`paid`: a paid cut goes into it). */
  go(want, paid) {
    if (want === 'iaido') { this.iai = { t: 0, full: false }; return; }
    this.moves.special(want, { paid });
  }

  /** THE IAIDO, while RMB is held crouched: the charge's pose; held through IAIDO.charge, blade mode as it always was; let go, the draw
   *  cut. Off the ground (a jump, a fall) it is let go with nothing drawn. */
  iaido(inp, raw) {
    const I = this.iai, P = this.tool.P;
    if (!P.grounded) { this.iai = null; return; }
    I.t += raw;
    this.moves.holding(I.t); // (a held charge: the string's window waits, for at most 2 real s of it: tools/moveset.js)
    if (!inp.isDown('Mouse2')) { this.iai = null; this.drawCut(); return; }
    if (I.t >= IAIDO.charge && !I.full) {
      I.full = true;
      if (this.blade.canEnter()) { this.iai = null; this.blade.enter(); }
      else { sfx.fizzle?.(); this.game.hud?.lachrymaPulse?.(false); } // (the pool cannot hold the world still: the pose is held; let go, it is the draw cut)
    }
  }

  /** THE DRAW CUT: one fast rising cut forward (MOVES.iai), begun from the pose on show (the stance under the iaido's, by its weight). */
  drawCut() {
    const C = this.game.character.clips, pose = (this._jp ||= C.pose());
    if (this.tool.track) this.tool.track.sample(pose); else C.sample(this.tool.idleClip, 0, pose, false);
    C.blend(pose, C.sample('stance:cutlassIaido', 0, (this._ip ||= C.pose()), false), this.iaiW);
    this.moves.begin('iai', 'iaido', 0, pose);
  }

  /** The blink cancel's own half (the moveset's blinkCancel() has let the stroke go): the stinger, the iaido's charge and blade mode go too. */
  blinkCancel() {
    this.rmb = null; this.iai = null;
    if (this.blade.active) this.blade.exit('blink');
    if (this.stinging) { const L = this.tool.P.techs.get('launch'); if (L?.active && L.o?.tag === 'stinger') { L.o.onEnd = null; L.o.time = 0; } this.stinging = false; this.trail.gap(); this.moves.closeBlow(this.stBlow); }
  }

  /** Whether E would blink now (read, never driven: the blink is the Courier's, courier/moves/blink.js). */
  blinkReady() { const b = this.tool.P.techs.get('blink'); return !!b && b.usable() && b.charges > 0; }

  /** What a hit does to the world: the sound, the shake, the flash of the cut, and the stop (a beat of nearly nothing). */
  impact(dmg, a, b, stop = true) {
    const g = this.game, P = this.tool.P;
    sfx.cutHit(dmg);
    P.shake = Math.max(P.shake, 0.12 * dmg);
    g.fx.slash?.(a.clone(), b.clone(), _up);
    if (stop) g.time.pulse('hit', 0.07, 0.035 + 0.03 * dmg, { release: 0.12 });
  }

  // ---------------------------------------------------------------- the stinger
  stinger(cut = false) {
    const P = this.tool.P, g = this.game, launch = P.techs.get('launch');
    if (!launch || (P.techs.active && !(cut && P.techs.active === launch))) return false; // (a paid cut from a whole-body blow: its launch goes straight into the thrust's)
    if (!g.lachryma.spend(STING.cost, 'stinger')) return false;
    const dir = this.aimDir(new THREE.Vector3());
    // toward the lock: no farther than the target (they stop a blade's length short of it)
    let speed = STING.speed, time = STING.dash;
    if (g.lock?.active) { g.lock.point(_e); const d = Math.max(1.2, _e.distanceTo(P.pos) - 1.4); time = THREE.MathUtils.clamp(d / speed, 0.1, STING.dash); }
    this.stBlow = this.moves.ownBlow('stinger'); // (a blow of its own: move.blow when the lunge is over, tools/moveset.js)
    this.stinging = true; this.stStopped = false; this.stHit.clear(); this.stDir.copy(dir); this.stPrev.copy(P.pos); this.ghostT = 0.06; // (the first afterimage waits: at the start it would sit on the body)
    this.stCool = STING.cool;
    this.trail.gap();
    sfx.stinger();
    g.events?.emit('cut.stinger', { locked: !!g.lock?.active });
    P.fovPunch = Math.max(P.fovPunch || 0, 9);
    this.tool.track?.play(this.tool.idleClip, 0, 0.1);
    const root = rootOf(g.character.clips, 'Sond_Thrust');
    // (the suite's thrust: its wind-up in a blink, the point held out for the whole lunge, then the way back; its own step taken out of the hips)
    const map = (tt) => (tt < 0.07 ? (tt / 0.07) * 0.17 : tt < STING.dash + 0.04 ? 0.17 + ((tt - 0.07) / (STING.dash - 0.03)) * 0.07 : 0.24 + (tt - STING.dash - 0.04) * 1.6);
    launch.go(dir.clone().multiplyScalar(speed), {
      time, gravity: 0.12, drag: 0, tag: 'stinger', yaw: Math.atan2(dir.x, dir.z), endSpeed: 6,
      clip: 'Sond_Thrust',
      clipMap: map,
      poseFix: root ? (pose) => { root.at(map(launch.clipT), _p); pose.p[0] -= _p.x; pose.p[2] -= _p.z; } : null,
      onStep: (dt) => this.stingStep(dt),
      onEnd: () => { shedSpeed(P.vel, 6); this.stinging = false; this.trail.gap(); this.moves.closeBlow(this.stBlow); }, // (its exit speed however it ends: a blink cutting in read 30 m/s as its own, rule 195)
      cuttable: true, // (the blink may cut in at any frame: courier/moves/techs.js; onEnd above lets it go)
    });
    const lt = P.techs.get('launch'); if (lt) lt.blendIn = 30;
    return true;
  }

  /** Each fixed step of the thrust: everything within reach of the path is pierced. */
  stingStep(dt) {
    const g = this.game, P = this.tool.P, dir = this.stDir;
    const from = _a.copy(this.stPrev).setY(this.stPrev.y + 1.0);
    const to = _b.copy(P.pos).setY(P.pos.y + 1.0).addScaledVector(dir, STING.reach);
    this.stPrev.copy(P.pos);
    let struck = 0;
    for (const ent of [...g.breakables.items]) {
      if (!ent.alive || this.stHit.has(ent) || ent.def?.trial) continue;
      const t = ent.body.translation();
      _p.set(t.x, t.y + ent.P.height * 0.45, t.z);
      if (segDist(from, to, _p) > STING.radius * 0.5 + ent.P.rMax) continue;
      this.stHit.add(ent); struck++;
      g.breakables.damage(ent, DMG * STING.dmg, _p.clone(), dir.clone(), STING.power); this.moves.markBlow(this.stBlow, 'pot', ent);
      this.impact(STING.dmg, _c.copy(_p).addScaledVector(dir, -0.7), _e.copy(_p).addScaledVector(dir, 0.7), false);
      g.events?.emit('cut.hit', { what: 'pot', combo: 'stinger' });
    }
    for (const c of [...g.clappers.list]) {
      if (!c.alive || this.stHit.has(c)) continue;
      _p.copy(c.pos).y += 0.35;
      if (segDist(from, to, _p) > STING.radius) continue;
      this.stHit.add(c); struck++;
      g.clappers.hit(c, _p.clone(), dir.clone(), STING.power, 'sliced'); this.moves.markBlow(this.stBlow, 'clapper', c);
      this.impact(STING.dmg, _c.copy(_p).addScaledVector(dir, -0.7), _e.copy(_p).addScaledVector(dir, 0.7), false);
      g.events?.emit('cut.hit', { what: 'clapper', combo: 'stinger' });
    }
    for (const c of g.creatures?.near(_c.copy(from).lerp(to, 0.5), from.distanceTo(to) * 0.5 + 1) || []) {
      if (this.stHit.has(c)) continue;
      c.center(_p);
      if (segDist(from, to, _p) > STING.radius + c.radius) continue;
      this.stHit.add(c); struck++;
      g.creatures.strike(c, _p.clone(), dir.clone(), 2.2 * STING.power, 'sliced'); this.moves.markBlow(this.stBlow, 'creature', c);
      g.events?.emit('cut.hit', { what: c.kind, combo: 'stinger' });
    }
    // (a thrust goes THROUGH: one light check at its first contact, never a stop per thing pierced, which would stall the lunge)
    if (struck && !this.stStopped) { this.stStopped = true; g.time.pulse('stinger', 0.35, 0.035, { release: 0.08 }); }
    // afterimages: the body left behind at intervals, fading
    this.ghostT -= dt;
    if (this.ghostT <= 0) { this.ghostT = 0.045; this.afterimage(); }
  }

  afterimage() { this.ghosts.leave({ ph: fxRand() }); } // (Blink Dash's: the film's hues walked as it fades; it was a flat orange)

  // ---------------------------------------------------------------- the guard
  guardUpdate(dt, inp) {
    const P = this.tool.P, g = this.game;
    if (inp.wasPressed('KeyV') && this.moves.recovering() && !this.stinging) this.moves.cut(); // (the guard at once from a blow's recovery: the paid cut)
    const want = inp.isDown('KeyV') && !this.moves.busy && !this.stinging && !this.iai;
    if (want && !this.guardOn) { this.guardOn = true; this.guardT = 0; sfx.guardUp?.(); g.events?.emit('guard.up', {}); }
    else if (!want && this.guardOn) this.guardOn = false;
    this.guardW = THREE.MathUtils.damp(this.guardW, this.guardOn ? 1 : 0, 16, dt);
    P.guarding = this.guardOn;
    if (!this.guardOn) return;
    this.guardT += dt;
    P.bodyYaw = P.yaw;
    // in front of them, at the blade
    const f = P.lookDir(_a).setY(0).normalize();
    const at = _b.set(P.pos.x, P.pos.y + 1.1, P.pos.z).addScaledVector(f, 0.8);
    if (this.guardT <= PARRY_WIN) {
      if (deflect(g, { at, radius: 2.2, speedMin: 3, outMin: 13, assist: 0.5, iframes: 0.4, tool: 'cutlass' })) { this.guardT = PARRY_WIN + 1; this.parryT = 0; g.lachryma.gain?.(2, 'parry'); }
    } else if (guard(g, { at, radius: 1.8, tool: 'cutlass' })) g.lachryma.drain?.(3, 'guard');
  }

  // ---------------------------------------------------------------- what is drawn
  /** After the tool has been placed for the frame: the blade's ribbon, and the afterimages' fade. */
  afterHands(dt) {
    const m = this.tool.model, c = this.moves.cur;
    if (this.stinging && m.bladeOut > 0.5) { m.bladeSegment(_a, _b); this.trail.push(_a, _b); this.trail.update(dt); }
    else if (m.bladeOut > 0.5) this.moves.afterHands(dt);
    else { this.trail.gap(); this.trail.update(dt); }
    const hot = c && (c.def.heat || 0) > 0.6;
    if (!c?.paid || this.stinging) this.trail.setColors(this.stinging ? 0xffe0b0 : hot ? 0xff7a4a : 0xffb27a, this.stinging ? 0xffffff : 0xfff1dc); // (a paid blow's: the engine's, the film)
    if (this.stinging) this.trail.power = 1.5; // (the finishers and the stinger shed more)
    this.ghosts.update(dt);
  }

  /** The first-person arc for what is playing: { arc, u } (tools/viewmodel.js). */
  fpArc() {
    if (this.blade.active) return this.blade.swing > 0 ? { arc: this.blade.swingKind % 2 ? 'l2r' : 'r2l', u: 1 - this.blade.swing } : { arc: 'raise', u: 0.4 };
    if (this.guardW > 0.02) return { arc: 'raise', u: 0.5 * this.guardW };
    if (this.iaiW > 0.02 && !this.moves.cur) return { arc: 'l2r', u: 0 }; // (the iaido: the blade held where the draw begins)
    return this.moves.fpArc();
  }

  /** The clip layer: { pose, w } while a stroke, the guard, a parry or a blade-mode cut is playing. */
  pose(C, out) {
    const b = this.blade;
    if (b.active || b.k > 0.05) {
      if (b.swing > 0) { const B = b.swingKind % 2 === 1; C.sample(B ? 'Sond_Combo2' : 'Sond_Combo1', 0.05 + (1 - b.swing) * (B ? 0.3 : 0.26), out, false); return { pose: out, w: 1 }; }
      // (blade mode's stance is the iaido's own: the blade still at the hip, the cut waiting. It was the suite's charge held at 0.4 s, blended
      //  in from the iaido's pose: the hilt cut 8 cm into the crouched right thigh, and the blend swept the blade through it: the pose audit)
      if (C.clips['stance:cutlassIaido']) { C.sample('stance:cutlassIaido', 0, out, false); return { pose: out, w: Math.min(1, b.k + this.iaiW) }; }
      C.sample('Sond_ChargeHold', 0.4, out, false);
      return { pose: out, w: 0.85 * b.k };
    }
    if (this.parryT < 0.9) { C.sample('Sond_Parry', 0.12 + this.parryT, out, false); return { pose: out, w: 1 - THREE.MathUtils.smoothstep(this.parryT, 0.6, 0.9) }; } // (the deflect: the suite's parry, struck through)
    if (this.guardW > 0.02) { C.sample('Sond_Block', 0.4, out, false); return { pose: out, w: this.guardW }; }
    if (this.iaiW > 0.01 && !this.moves.cur) { C.sample('stance:cutlassIaido', 0, out, false); return { pose: out, w: this.iaiW }; } // (the iaido's charge)
    return this.moves.pose(C, out);
  }
}
