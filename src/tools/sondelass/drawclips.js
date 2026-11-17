// ---------------------------------------------------------------------------------------
// THE CUTLASS'S DRAW AND STOW (plain names; docs/plans/SONDELASS-FEEL.md 3F): the Sondelass drawn in its cutlass form, and put away from
// it, through the suite's own clips (Sond_Draw, Sond_Sheathe: the owner's, courier_anims_melee.glb), in place of the shared draw's reach
// and whip (tools/draw.js), which every other form and tool keeps. The upper body only, over whatever the legs are doing: the core
// movement never stops for it (the layer is the tool's own, ch.MASK_UPPER, sondelass.js animate).
//   - THE DRAW: the hand goes back to the grip at the small of the back (the holster, where the clip's hand meets it: 0.13 m and 32 to 40
//     degrees off at its 0.23 to 0.29 clip s, measured), takes it, and brings it round into the en garde; the tool rides the holster until
//     GRAB[0] and the hand from GRAB[1], eased between (the clip's hand and the holster are not to the millimetre the same); the blade
//     slides out of the haft as the hand comes forward (`blade`), never on the back. Its last stretch is crossfaded into the cutlass's
//     stance (stance:cutlass, the clip's en garde turned side-on: courier/anim/stances.js).
//   - THE STOW: the blade drawn back in, the hand up and round to the small of the back, the tool set into the holster over SEAT (the hand
//     there within 0.15 m from 0.39 to 0.48 clip s, measured), the hand let go and down to the side, and the layer let go with it.
//   - THE BELT'S CLOCK IS THE CLIP'S: while one plays it sets the Sondelass's drawT (0 to 1 over `drawn`), so the belt's "is a tool out?"
//     (tools/belt.js), the Psygun's wait, the draw's and the holster's sounds and the `sondelass.draw` / `sondelass.stow` events fall on
//     the clip's frames (the stow's on the seat); the dexterity's widening (belt.hands) quickens it as it did the old draw.
// Any reversal (X again mid-clip), a busy pair of hands (a carry), the first person or a press that begins a blow lets the clip go, and the
// shared draw carries on from where drawT stands. Events for the ear: `cutlass.draw { beat: 'grab' }`, `cutlass.sheathe { beat: 'seat' }`.
//
// Prior art: the katana draws and sheathes of Sekiro and Ghost of Tsushima (the blade taken from the belt and brought round in one motion,
// noto as the scabbard takes it back); layered upper-body clips over locomotion (Unreal's layered blend per bone, Unity's avatar masks);
// the weapon swap of Monster Hunter, played on the move.
//
//   const dc = new CutlassDrawClips(tool)   dc.start('draw' | 'sheathe')   dc.stop()   dc.kind -> 'draw' | 'sheathe' | null
//   dc.update(dt) -> drawT   dc.layerW() -> 0..1   dc.pose(C, out) -> { pose, w }   dc.place(holster, hand, out)   dc.bladeOn() -> bool
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Clip s throughout. `from` where it is entered, `rate` x game time, `end` where it is let go; `drawn` [a, b] the stretch the belt's
 *  drawT runs over (0 to 1 drawing, 1 to 0 stowing); `grab` / `seat` the stretch the tool goes from the holster to the hand (from the hand
 *  to the holster); `blade` where the blade comes out (goes in); `out` [a, b] the clip faded into the stance (the draw) or the whole layer
 *  let go (the stow); `in` real s the clip comes in over. */
export const DRAW_CLIPS = {
  draw: { clip: 'Sond_Draw', from: 0.06, rate: 1.5, end: 0.66, drawn: [0.06, 0.42], grab: [0.24, 0.33], blade: 0.31, out: [0.47, 0.66], in: 0.07 },
  sheathe: { clip: 'Sond_Sheathe', from: 0, rate: 1.4, end: 0.8, drawn: [0, 0.44], seat: [0.34, 0.45], blade: 0.16, out: [0.6, 0.8], in: 0.1 },
};

const smooth = (a, b, x) => { const k = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p2 = new THREE.Vector3(), _q2 = new THREE.Quaternion();

export class CutlassDrawClips {
  constructor(tool) { this.tool = tool; this.kind = null; this.t = 0; this.age = 0; this.beat = false; }
  get def() { return this.kind ? DRAW_CLIPS[this.kind] : null; }

  start(kind) {
    const D = DRAW_CLIPS[kind], C = this.tool.game.character?.clips;
    if (!D || !C?.clips[D.clip]) return false; // (the clip not in the pack: the shared draw)
    this.kind = kind; this.t = D.from; this.age = 0; this.beat = false;
    return true;
  }
  stop() { this.kind = null; }

  /** Advance by `dt` game s; the belt's drawT for this frame (null once it is over). */
  update(dt) {
    const D = this.def; if (!D) return null;
    this.t += dt * D.rate; this.age += dt;
    const at = this.kind === 'draw' ? D.grab[1] : D.seat[1];
    if (!this.beat && this.t >= at) { this.beat = true; this.tool.game.events?.emit(`cutlass.${this.kind}`, { beat: this.kind === 'draw' ? 'grab' : 'seat', by: 'courier' }); }
    const k = smooth(D.drawn[0], D.drawn[1], this.t), drawT = this.kind === 'draw' ? k : 1 - k; // (exactly 1 or 0 past `drawn`)
    if (this.t >= D.end) this.kind = null;
    return drawT;
  }

  /** The tool layer's weight while it plays: the draw's comes in over `in`, the stow's goes out over `out`. */
  layerW() {
    const D = this.def; if (!D) return 1;
    return this.kind === 'draw' ? smooth(0, D.in, this.age) : 1 - smooth(D.out[0], D.out[1], this.t);
  }

  /** The clip's pose over the tool's stance, { pose, w }: the draw's whole until it fades into the stance, the stow's in over `in`. */
  pose(C, out) {
    const D = this.def; if (!D) return null;
    C.sample(D.clip, Math.min(this.t, D.end), out, false);
    return { pose: out, w: this.kind === 'draw' ? 1 - smooth(D.out[0], D.out[1], this.t) : smooth(0, D.in, this.age) };
  }

  /** Where the tool is (world matrix into `out`): in the holster, in the hand (handR x its socket), or eased between at the grab or the seat. */
  place(holster, hand, out) {
    const D = this.def; if (!D) return out.copy(hand);
    const k = this.kind === 'draw' ? smooth(D.grab[0], D.grab[1], this.t) : 1 - smooth(D.seat[0], D.seat[1], this.t);
    holster.decompose(_p, _q, _s); hand.decompose(_p2, _q2, _s);
    return out.compose(_p.lerp(_p2, k), _q.slerp(_q2, k), _s);
  }

  /** The blade is out of the haft: drawing, once the hand brings it round; stowing, until the hand turns it to the back. */
  bladeOn() { const D = this.def; return !D || (this.kind === 'draw' ? this.t >= D.blade : this.t < D.blade); }
}
