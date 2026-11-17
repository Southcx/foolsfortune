// ---------------------------------------------------------------------------------------
// THE CUTLASS'S TRAIL (plain name; docs/plans/SONDELASS-FEEL.md 3F, "the line, drawn"): what the cutlass's blows leave in the air, the
// tip's own arc drawn as one line. It decides, a frame, what the cutlass's swing (vfx.js `swing('swing.cutlass')`, its look in the
// library) is fed while a blow of the combo engine (tools/moveset.js) plays, in place of the engine's own ribbon window (opt-in: only the
// cutlass asks here; every other tool's ribbon is the engine's, as it was):
//   - ON THE STRIKE'S FRAMES ONLY: from the blow's strike start to its end (its row's `trail`, else its typed or measured strike), never
//     the windup or the recovery (the engine's window padded both ends by 0.04 clip s);
//   - ON THE ONE CLOCK: the move's clip time `c.t`, which on a warped move is the time warp's (tools/movewarp.js; casebook 184: a body and
//     its windup keep one clock), so the line is drawn exactly where the pose is, and holds still while the pose is held (the held way);
//   - CARRIED PAST: for CARRY game s after the strike's end the line runs on with the blade through the follow-through (on a warped move
//     the slowed one), its head drawn in to a point as it goes, so the stroke ends as a brush's does and never stops square;
//   - THINNING TO ITS TAIL: each sample's base drawn in toward the tip as it ages (the trail's `taper`, vfx/trail.js) and faded out by
//     age, never cut while it is still bright;
//   - IN THE BLOW'S COLOUR: the damage type's (DAMAGE_TINT, by the blow's cause) running to a warm white edge; a paid blow's wears the
//     oil film, as the engine's did (featTint: a feat of the Courier's power).
// Looks only: what the blow strikes is the engine's sweep, on the same clock.
//
// Prior art: Marth's sword trail in Melee, drawn only on a blow's active frames (SmashWiki); CEDEC 2026's "sketch the tip's arc first"
// and "the sweep carries past" (docs/ref/combat/MUSOU.md 5); the weapon trails of Soul Calibur and Devil May Cry (a ribbon between two
// sockets, faded by age); a sumi brush stroke's tail, thinning and drying out.
//
//   const line = new CutlassTrail(swing, segment)   line.step(moves, dt)   (once a frame after the tool is placed: cutlass.js afterHands)
//   line.gap()   (the blow is gone: the next push starts a new line)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DAMAGE_TINT } from './library.js';
import { typeOf } from '../progress/combat/types.js';
import { featTint } from './oxidation.js';

/** CARRY: game s the line runs on past the strike's end, its head drawn in to a point (HEAD of the blade's length at the last). EDGE:
 *  the line's hot end. */
export const CUTLASS_TRAIL = { carry: 0.075, head: 0.92, edge: 0xfff6ea };

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c1 = new THREE.Color(), _c2 = new THREE.Color();
const smooth = (x) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

export class CutlassTrail {
  constructor(swing, segment) { this.T = swing; this.segment = segment; this.c = null; this.past = 0; this.lastT = 0; this.tint = null; }

  gap() { this.T?.gap(); }

  /** The blow on show (`moves.cur`), read on its clip clock: the swing pushed on its strike and its carry, a gap otherwise. */
  step(M, dt) {
    const T = this.T; if (!T) return;
    const c = M.cur, s = c && c.def.ribbon !== false && c.phase !== 'fall' ? c.def.trail || c.def.track?.strike : null;
    if (c !== this.c) { this.c = c; this.past = 0; this.lastT = c?.t ?? 0; T.gap(); } // (a new blow: a new line)
    if (!s) { T.gap(); return; }
    const t = c.t, moved = t > this.lastT + 1e-6; this.lastT = t;
    if (t < s[0]) T.gap();
    else if (t <= s[1]) { this.segment(_a, _b); T.push(_a, _b); }
    else if (this.past < CUTLASS_TRAIL.carry) {
      if (moved) this.past += dt; // (a held pose holds the carry too: one clock)
      this.segment(_a, _b); _a.lerp(_b, CUTLASS_TRAIL.head * smooth(this.past / CUTLASS_TRAIL.carry)); T.push(_a, _b);
    } else T.gap();
    T.power = 1 + (c.def.heat || 0) * 1.4;
    if (c.paid) { const u = (c.ph || 0) + t * 0.6; T.setColors(featTint(u, _c1), featTint(u + 0.15, _c2, { bright: 1.6 })); this.tint = null; return; }
    const tint = DAMAGE_TINT[typeOf(c.def.hit?.cause || M.S.cause || 'sliced')] ?? DAMAGE_TINT.impact;
    if (tint !== this.tint) { this.tint = tint; T.setColors(tint, CUTLASS_TRAIL.edge); }
  }
}
