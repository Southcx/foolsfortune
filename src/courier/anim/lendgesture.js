// ---------------------------------------------------------------------------------------
// A LEND GESTURE: the Courier's body doing the sub tool's one verb, lent on R (tools/belt.js, tools/lend.js; event `tool.lend`), laid
// over whatever plays: the main's stance with any tool in hand or none, the run, the air. Only the upper body or one arm is taken, never
// the legs or the pelvis (hipW 0: casebook rule 43), and never the control: the verb has already gone off by its own code, and this is
// its body. One clip a verb, a stretch of it played at a rate, in quick (IN real s) and out over its tail; a new lend while one plays
// takes over from the pose it is in (a crossfade: the old gesture's last pose fades as the new one comes in).
//
// Every clip is one the Courier already has (CLAUDE.md, an existing clip wherever practicable): the suite's (Gun_QuickDraw,
// Brush_Flick, Tome_Flash, Vane_Combo2, Skiff_Summon) and UAL Standard's (OverhandThrow as `throw`, Punch_Cross as `punchCross`); a row
// with `mirror` plays the clip mirrored (character.js mirrorPose: the other arm's motion on this one). Each stretch chosen by the hand's
// path measured headless over the clip (the palm against the hips, the shoulder and the head bone), never by eye.
//
// Prior art: additive and masked upper-body layers over locomotion (Unreal's layered blend per bone, Unity's avatar masks); the off-hand
// quick act over a held weapon (NieR: Automata's pod commands, Elden Ring's off-hand, Devil May Cry 5's Devil Breaker); the hit reacts'
// layer here (anim/hurt.js), whose pattern this follows.
//
//   LEND_GESTURES[tool] -> { clip, from, to, rate, out, mask: 'arm' (the right arm) | 'armL' (the left) | 'upper', mirror?, free? }   (from /
//                          to: s in the clip; rate: x real time; out: the real s it fades over at the end; mirror: the clip mirrored; free:
//                          authored on the right arm and played on whichever hand the main leaves free, mirrored onto the left)
//   const lend = new LendGesture(ch)   lend.play(tool, freeHand = 'L') -> true if the tool has a gesture   lend.pose(dt, base)
//   lend.active -> tool | null   (freeHand: game.belt.freeHand, tools/belt.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** One gesture a sub tool's verb (SUB_GIFTS in progress/toolpairs.js). Lengths in real s = (to - from) / rate. */
export const LEND_GESTURES = {
  // Snap shot: the draw's last stretch to the aim (held from 0.37 s in the clip, so at the aim 0.09 real s after the press: the round
  // waits for it, LENT_MODELS), then let go back to the stance; 0.23 real s. (From 0.08 the hand crossed the face for 0.2 s first.)
  psygun: { clip: 'Gun_QuickDraw', from: 0.26, to: 0.53, rate: 1.2, out: 0.12, mask: 'arm' },
  // Grapple: an overhand throw from the wound-up arm, so the release (0.37 s in the clip) comes 0.1 real s after the press; 0.43 real s
  sondelass: { clip: 'throw', from: 0.24, to: 0.76, rate: 1.2, out: 0.18, mask: 'arm' }, // (the right arm alone: the upper mask flung the left arm wide, 2026-10-23's look)
  // Flick: the Soul Brush's own flick of the right hand, the whole of it, quickened; 0.48 real s
  soulbrush: { clip: 'Brush_Flick', from: 0, to: 0.63, rate: 1.3, out: 0.18, mask: 'arm' },
  // Flash: the right hand up to the face as the Flash goes off (raised by 0.3 s in the clip), held, then down; 0.5 real s
  veritome: { clip: 'Tome_Flash', from: 0.14, to: 0.64, rate: 1, out: 0.18, mask: 'arm' },
  // Lure throw: the Dreamvane's own overhead chop (Vane_Combo2), its left arm mirrored onto the right: the hand up and back over the right
  // shoulder to the vane's heel (0.37 s in the clip: 0.10 m behind the shoulder, 0.42 m above it), then thrown forward and down to the
  // chest (forward of the shoulder by 0.47 m at 0.57 s); behind at 0.12 real s, forward by 0.19; 0.36 real s
  dreamvane: { clip: 'Vane_Combo2', from: 0.2, to: 0.7, rate: 1.4, out: 0.14, mask: 'arm', mirror: true },
  // Toll (free: the bell hangs at the left hip, the owner's ruling of 2026-10-06, so with the main in the right hand this plays mirrored
  // on the left arm, down to the bell; with the Lockheart as the main, in the left, it stays on the right). As authored: the right hand
  // raised before the chest and brought down to strike at the right hip (the Solar Skiff's summon, Skiff_Summon: from 0.73 m over the
  // pelvis at 0.5 s to 0.19 m at 0.7 s, at 3.5 m/s at its fastest), at the hip 0.13 real s after the press and held there; 0.3 real s
  crucibelle: { clip: 'Skiff_Summon', from: 0.5, to: 0.95, rate: 1.5, out: 0.12, mask: 'arm', free: true },
  // Gulp: the left hand (the free one: the main is in the right) brought in to the mouth, the cross's guard (UAL's Punch_Cross, the left
  // fist at the chin: its palm 0.07..0.10 m over the head bone and 0.17..0.19 m before it, at the lips, the face's front there being
  // 0.17..0.22 m out), there by 0.07 real s and held through the parry's 0.25 real s window; 0.34 real s
  // (free: with the main in the left hand, the right hand comes to the mouth, mirrored)
  lockheart: { clip: 'punchCross', from: 0.17, to: 0.58, rate: 1.2, out: 0.1, mask: 'armL', free: true },
};

const IN = 0.05;
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class LendGesture {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.g = null; this.t = 0; this.len = 0; this.active = null;
    this.pose_ = this.C.pose(); this.raw = this.C.pose(); this.prev = this.C.pose(); this.prevW = 0; this.prevMask = null;
  }

  maskOf(g) { const ch = this.ch; return g.mask === 'upper' ? ch.MASK_UPPER : g.mask === 'armL' ? ch.MASK_ARM.L : ch.MASK_ARM.R; }

  play(tool, freeHand = 'L') {
    let g = LEND_GESTURES[tool];
    if (!g || !this.C.clips[g.clip]) return false;
    if (g.free && freeHand !== (g.mask === 'armL' ? 'L' : 'R')) g = { ...g, mask: freeHand === 'L' ? 'armL' : 'arm', mirror: !g.mirror }; // (the authored arm's motion on the other, the free hand)
    // (a lend over one still playing: its pose as it stands fades out under the new one, over IN)
    if (this.g) { this.prev.copy(this.pose_); this.prevW = this.weight(); this.prevMask = this.maskOf(this.g); }
    this.g = g; this.t = 0; this.len = (g.to - g.from) / g.rate; this.active = tool;
    return true;
  }

  weight() { const g = this.g; return g ? smooth(0, IN, this.t) * (1 - smooth(this.len - g.out, this.len, this.t)) : 0; }

  pose(dt, base) {
    const C = this.C;
    if (this.prevW > 0.001) { C.blend(base, this.prev, this.prevW * (1 - smooth(0, IN, this.t)), this.prevMask, 0); }
    const g = this.g;
    if (!g) return;
    this.t += dt;
    if (this.t >= this.len) { this.g = null; this.active = null; this.prevW = 0; return; }
    if (this.t >= IN) this.prevW = 0;
    const w = this.weight();
    if (g.mirror) this.ch.mirrorPose(C.sample(g.clip, g.from + this.t * g.rate, this.raw, false), this.pose_);
    else C.sample(g.clip, g.from + this.t * g.rate, this.pose_, false);
    if (w > 0.001) C.blend(base, this.pose_, w, this.maskOf(g), 0);
  }
}
