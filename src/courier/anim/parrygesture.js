// ---------------------------------------------------------------------------------------
// A PARRY GESTURE: the Courier's body answering V with a tool in the hands (courier/parries.js; event `parry.try`), one found clip a
// tool, a stretch of it played over whatever plays. The answer itself (the window, what is sent back, drunk or shattered) is parry.js's
// and has already happened by the press; this is its body. The kick and the cutlass have their own (courier/moves/kick.js, the
// cutlass's deflect), and the lent Gulp on R is the lend gesture's (anim/lendgesture.js), so neither is here. docs/plans/PARRY-CLIPS.md.
//
// Two ways a row plays. A tool that has its own gesture layer (the Veritome, the Crucibelle, the Lockheart: tools/toolbody.js
// Gestures) is handed its row (`via: 'tool'`): its clip then plays inside the tool's layer, with the tool's crossfade, its legs while
// standing and its off-the-body correction. The others (the psygun, the Soul Brush, the Dreamvane) play here, over the stance, the air
// and any tech, after the lend gesture: the LendGesture's own player (a stretch at a rate, in over IN, out over its tail), on the main
// hand's arm (`free`: authored on the right, mirrored when the main is in the left) or the upper body; never the legs or the pelvis
// (hipW 0: casebook rule 43; the core movement is the gold standard). A row may
//   - hold (`holdAt`, clip s): the clip kept at that frame while its hold is asked (the Dreamvane's guard while V is held and spinning)
//   - be additive (`add`, a gain): the clip's motion against its own `from` frame laid on what plays (the psygun's kick over the aim,
//     so the aim's pitch is kept; gain 2, the shot's own recoil doubled, as the plan says)
//
// Every clip is one the Courier already has (CLAUDE.md, an existing clip wherever practicable): the suite's (Gun_Shoot, Brush_Combo1,
// Tome_Flash, Bell_Toll, Lock_Open) and UAL Standard's Sword_Block (`block`). Each stretch chosen by the hands' path measured headless
// over the clip (the palms against the pelvis, their speed at 30 Hz: 2026-11-03), so the strike lands inside the 0.25 real s window.
//
// Prior art: the lend gesture here and its masked layers (Unreal's layered blend per bone, Unity's avatar masks); additive recoil over an
// aim (every shooter's aim offset plus an additive fire montage); each tool's parry's own (Bloodborne's gun parry, the bat, Fatal
// Frame's last-instant shot, a staff's guard, Hi-Fi Rush's parry on the beat, the coffin's mouth opened as Kirby's).
//
//   PARRY_GESTURES[key] -> a lend gesture's row (anim/lendgesture.js) + holdAt?, add?   | { via: 'tool', clip, from, to?, rate, fadeOut }
//   parryRowOf(game, tool) -> its key   installParryGestures(game, character)   (character.parryGesture: new ParryGesture(ch))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LendGesture } from './lendgesture.js';
import { WINDOW, PARRIES } from '../parries.js';

/** One gesture a tool's parry. Lengths in real s = (to - from) / rate. Hands measured against the pelvis (+z ahead, +x their left). */
export const PARRY_GESTURES = {
  // The gun parry (stagger: a point-blank shot): Gun_Shoot's kick, additive over the aim, doubled. Its hand still to 0.20 s, thrown up
  // 0.11 m and back 0.09 m by 0.33 s (2.5 m/s at 0.27), home by 0.55; from 0.2 at 1.3x the kick is 0.05 real s after the press; 0.31 real s
  psygun: { clip: 'Gun_Shoot', from: 0.2, to: 0.6, rate: 1.3, out: 0.12, mask: 'arm', free: true, add: 2 },
  // The bat (return): the Soul Brush's own first club swing, flat across the body from the right: the right palm from 0.30 m behind the
  // pelvis at 0.33 s through 0.54 m before it at 0.40 (18.6 m/s, the swing's fastest) to the left at 0.47; from 0.28 at 1.25x the
  // contact is 0.10 real s after the press, the brush's own grip; 0.27 real s
  'soulbrush.return': { clip: 'Brush_Combo1', from: 0.28, to: 0.62, rate: 1.25, out: 0.12, mask: 'upper' },
  // The soak (mop): Sword_Block's guard on the brush arm, the tuft out before the chest: the right palm 0.62 m ahead and 0.31 m up by
  // 0.13 s (5.8 m/s), held there to 0.55; the left keeps the brush's own grip on the haft; from 0.06, set 0.06 real s after; 0.44 real s
  'soulbrush.soak': { clip: 'block', from: 0.06, to: 0.62, rate: 1.25, out: 0.12, mask: 'arm', free: true },
  // The twirl (turn): the same guard, the crook held out before them while V is held and the spin goes on (parries.js `spinning`,
  // Lachryma a real second); the crook's own spin about its grip is the held tool's, asked of its owner (docs/handoffs/petra/)
  dreamvane: { clip: 'block', from: 0.06, to: 0.75, rate: 1.2, out: 0.15, mask: 'arm', free: true, holdAt: 0.4 },
  // The shutter (a blow winding up): the Flash's thrust, the open book snapped out at the threat in both hands: the palms from 0.34 m
  // ahead at 0.20 s to 0.61 at 0.27 (4.7 m/s), held to 0.47, down by 0.67; from 0.2 at 1.3x out 0.05 real s after the press
  veritome: { via: 'tool', clip: 'Tome_Flash', from: 0.2, rate: 1.3, fadeOut: 0.15 },
  // The toll (shatter): the toll's own, its wind-up skipped: the bell hand from behind the shoulder at 0.20 s round to 0.63 m before the
  // pelvis by 0.33 (14.3 m/s at 0.27, the strike); from 0.2 at 1.2x the strike is 0.06 real s after the press, as the ring goes out
  crucibelle: { via: 'tool', clip: 'Bell_Toll', from: 0.2, rate: 1.2, fadeOut: 0.15 },
  // The gulp: the coffin lifted to the mouth and opened: the coffin hand from the hip (0.18 m up) at 0.27 s to 0.63 m up and 0.41 m
  // ahead by 0.40 (8.1 m/s at 0.33), held, the lid hand already high; from 0.22 at 1.5x it is up 0.12 real s after the press and kept
  // through the window; 0.35 real s
  lockheart: { via: 'tool', clip: 'Lock_Open', from: 0.22, to: 0.75, rate: 1.5, fadeOut: 0.15 },
};

/** The row for a tool's parry now: `<tool>.<how>` where its answer changes with it (the Soul Brush's: the mop soaks, paint returns, as
 *  parries.js says it), else the tool's. */
export function parryRowOf(game, tool) {
  const how = PARRIES[tool]?.how, now = typeof how === 'function' ? how(game) : how;
  return PARRY_GESTURES[`${tool}.${now}`] ? `${tool}.${now}` : PARRY_GESTURES[tool] ? tool : null;
}

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qd = new THREE.Quaternion(), _qi = new THREE.Quaternion();

export class ParryGesture extends LendGesture {
  constructor(ch) { super(ch, PARRY_GESTURES); this.held = null; this.zero = this.C.pose(); this.zeroRaw = this.C.pose(); }

  /** Play a row on the main hand (`hand`: 'R' | 'L'); `held()` keeps a row with `holdAt` at that frame while it says so. */
  play(key, hand = 'R', held = null) {
    const wasAdd = !!this.g?.add;
    if (!super.play(key, hand)) return false;
    if (wasAdd || this.g.add) this.prevW = 0; // (an additive pose is no pose to fade out from, nor into)
    this.held = this.g.holdAt != null ? held : null;
    if (this.g.add) { // (the additive row's reference: its own first frame, mirrored with it)
      if (this.g.mirror) this.ch.mirrorPose(this.C.sample(this.g.clip, this.g.from, this.zeroRaw, false), this.zero);
      else this.C.sample(this.g.clip, this.g.from, this.zero, false);
    }
    return true;
  }

  pose(dt, base) {
    const g = this.g;
    if (g?.holdAt != null && this.held?.()) { const hT = (g.holdAt - g.from) / g.rate; if (this.t >= hT - dt) this.t = Math.max(0, hT - dt); } // (held: the frame kept, the weight full)
    else if (g) this.held = null; // (let go once: it plays on out)
    if (!g?.add) return super.pose(dt, base);
    // additive: the clip's motion from its first frame, `add` times over, laid on what plays under the mask
    this.t += dt;
    if (this.t >= this.len) { this.g = null; this.active = null; return; }
    const C = this.C, w = this.weight(), m = this.maskOf(g);
    if (g.mirror) this.ch.mirrorPose(C.sample(g.clip, g.from + this.t * g.rate, this.raw, false), this.pose_);
    else C.sample(g.clip, g.from + this.t * g.rate, this.pose_, false);
    if (w <= 0.001) return;
    for (let b = 0, i = 0; b < C.nb; b++, i += 4) {
      const k = w * m[b]; if (k <= 0) continue;
      _qd.fromArray(this.zero.q, i).invert().multiply(_qb.fromArray(this.pose_.q, i)); // (the motion since the first frame)
      _qb.copy(_qd); for (let n = 1; n < g.add; n++) _qb.multiply(_qd); // (`add` times over)
      _qa.fromArray(base.q, i).multiply(_qi.identity().slerp(_qb, k)).toArray(base.q, i);
    }
  }
}

/** The parry's body on `parry.try` (courier/parries.js): the lent Gulp is the lend gesture's (tool.lend), so it is left alone. */
export function installParryGestures(game, character) {
  game.events.on('parry.try', (e) => {
    if (e.lent || (e.by ?? 'courier') !== 'courier') return;
    const key = parryRowOf(game, e.tool), row = key && PARRY_GESTURES[key];
    if (!row) return;
    if (row.via === 'tool') { const { clip, from, to, rate, fadeOut } = row; game.techs?.get?.(e.tool)?.gesture?.(clip, { from, to, rate, fadeOut }); return; }
    const P = game.parries, input = game.input;
    character.parryGesture?.play(key, game.belt?.mainHand || 'R', () => !!input?.isDown('KeyV') && (P?.spinning || (P?.t ?? WINDOW) < WINDOW));
  });
}
