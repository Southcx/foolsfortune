// ---------------------------------------------------------------------------------------
// A BLOW'S FEEL (plain name): what a melee blow that lands looks like by its WEIGHT CLASS (light, heavy, launcher, finisher), laid
// over the hit creatures.strike already plays (hit.slash.<material>, damage.<type>). Looks only: no timing, no damage, no rule. The
// combo engine's stop (tools/moveset.js impact: the world held a beat, scaled by the blow's dmg) and its shake are the engine's and
// stay as they are; this adds, at the contact:
//   - the spark arc thrown on along the blade's travel, a ring in the damage type's colour (DAMAGE_TINT), more of what the thing is
//     made of on a finisher or a guard break (clay chips; Strawman's straw): the library's `blow.<weight>[.<material>]` and
//     `blow.guardbreak[.<material>]` (vfx/library.js), so the look is tuned there
//   - the swing's ribbon flaring on the frame that connects (vfx.js `sw.flare`: its uniforms, its one program)
//   - a tiny camera kick along the blade on a heavy, a launcher and a finisher (the recoil spring, `P.punchV`, scaled by the setting
//     visual.shake: config.js shakeOf; off, none), once a blow's part
//   - the struck body's flinch: a white flash a frame and a half (`model.flinch()`; Strawman's alone today: no other creature has a
//     hurt flash to ask)
// Built once: any tool on the combo engine asks `land` from its onHit (the cutlass first); a tool's own blow (the stinger) asks `sting`.
//
// Prior art: Street Fighter's hit sparks by strength (light, medium, heavy: a weight a size and a sound), Monster Hunter's hit sparks
// laid along the weapon's path and its part-break burst, Devil May Cry's and Bayonetta's trail flaring on contact, God of War (2018)'s
// camera nudged the way the axe travels rather than shaken at random (its "directional camera shake"), and the fighting games' hurt
// flash on the body struck.
//
//   game.blowFeel = new BlowFeel(game)
//   game.blowFeel.land(tool, kind, ent, at, dir, h, c, { swing, segment })   (a moveset tool's onHit: tools/moveset.js's arguments;
//     `swing` its ribbon (vfx.js swing), `segment(a, b)` its blade's two ends now)
//   game.blowFeel.sting(ent, at, dir, swing)   (the stinger's pierce: a finisher's weight)
//   blowWeight(c, h) -> 'light' | 'heavy' | 'launcher' | 'finisher'   BLOW_WEIGHT[weight] -> { flare, flareDur, kick }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, DEG, shakeOf } from '../core/config.js';
import { materialOf } from './vfx.js';
import { DAMAGE_TINT } from './library.js';
import { typeOf } from '../progress/combat/types.js';

/** A weight's numbers: `flare` the ribbon's extra share on contact and `flareDur` its real s; `kick` the camera's nudge (degrees at
 *  its peak) along the blade. */
export const BLOW_WEIGHT = {
  light: { flare: 0.7, flareDur: 0.08, kick: 0 },
  heavy: { flare: 1.2, flareDur: 0.12, kick: 0.45 },
  launcher: { flare: 1.1, flareDur: 0.12, kick: 0.4 },
  finisher: { flare: 2, flareDur: 0.16, kick: 0.8 },
};
const LINE = 0.35; // (m: half the cut's line through the contact, the spark arc's spawn)

/** A blow's weight class, from what the engine knows of it (`c` its move on show, `h` its hit): the launcher (and any blow that lifts
 *  hard); the finisher (the ground string's last slot, a plunge, a charge let go, a ring, a blow of heat 1); the heavy (heat 0.5 and
 *  over, dmg 1.5 and over, a guard break); else the light. */
export function blowWeight(c, h) {
  const def = c?.def || {}, heat = def.heat ?? 0;
  if (c?.kind === 'launcher' || (h?.lift ?? 0) >= 5) return 'launcher';
  if (c?.last || def.plunge || c?.kind === 'charge' || def.ring || heat >= 1) return 'finisher';
  if (heat >= 0.5 || (h?.dmg ?? 1) >= 1.5 || h?.guardBreak) return 'heavy';
  return 'light';
}

const _d = new THREE.Vector3(), _r = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class BlowFeel {
  constructor(game) {
    this.game = game;
    this.ctx = { pos: null, dir: null, from: null, to: null, tint: 0xffffff, power: 1 }; // (one context, reused: vfx.play copies all but the cut's line)
    // (the cut's line is kept by reference until the effect's first frame: a ring of them, so blows landing in one frame keep their own)
    this.lines = Array.from({ length: 8 }, () => [new THREE.Vector3(), new THREE.Vector3()]); this.li = 0;
    this.kicked = null; this.kickedPart = -1; // (the blow, and its part, the camera last kicked for: once a blow's part)
  }

  /** A moveset blow landed on one thing: its weight's look at `at`, along `dir` (the swing's tangent there). */
  land(tool, kind, ent, at, dir, h, c, { swing, segment } = {}) {
    if (!at || !this.game.vfx) return;
    const w = blowWeight(c, h);
    this.burst(w, kind, ent, at, this.travel(dir, segment), h);
    const W = BLOW_WEIGHT[w];
    swing?.flare?.(W.flare, W.flareDur);
    if (W.kick && (this.kicked !== c || this.kickedPart !== (c?.part ?? 0))) { this.kicked = c; this.kickedPart = c?.part ?? 0; this.kick(_d, W.kick, w === 'launcher'); }
  }

  /** The stinger's pierce: a finisher's look on each thing it goes through, the kick once a thrust (its `stBlow`, or none). */
  sting(ent, at, dir, swing) {
    if (!at || !this.game.vfx) return;
    _d.copy(dir).normalize();
    this.burst('finisher', ent?.type === 'creature' ? 'creature' : '', ent, at, _d, { cause: 'sliced' });
    swing?.flare?.(BLOW_WEIGHT.finisher.flare, BLOW_WEIGHT.finisher.flareDur);
  }

  /** The blade's travel at the contact, into _d: the swing's tangent; with none, along the blade. */
  travel(dir, segment) {
    if (dir && dir.lengthSq() > 1e-6) return _d.copy(dir).normalize();
    if (segment) { segment(_a, _b); return _d.subVectors(_b, _a).normalize(); }
    return _d.set(0, 0, 1);
  }

  /** The library's look for weight `w` at `at`, the sparks running on along `dir`. */
  burst(w, kind, ent, at, dir, h) {
    const g = this.game, ctx = this.ctx;
    const mat = kind === 'creature' || kind === 'clapper' || kind === 'pot' ? materialOf(ent, ent?.kind || kind) : null;
    ctx.pos = at; ctx.dir = dir;
    const [f, t] = this.lines[this.li = (this.li + 1) % this.lines.length];
    ctx.from = f.copy(at).addScaledVector(dir, -LINE); ctx.to = t.copy(at).addScaledVector(dir, LINE);
    ctx.tint = DAMAGE_TINT[typeOf(h?.cause || 'sliced')] ?? DAMAGE_TINT.impact;
    ctx.floor = at.y - 1.5;
    g.vfx.play(mat ? `blow.${w}.${mat}` : `blow.${w}`, ctx);
    if (h?.guardBreak) g.vfx.play(mat ? `blow.guardbreak.${mat}` : 'blow.guardbreak', ctx);
    ent?.model?.flinch?.(); // (the struck body's flash: Strawman's, vfx/strawman.js)
  }

  /** The camera nudged `deg` (at its peak) the way the blade travels, as the view sees it: its sideways part on the yaw, its height on
   *  the pitch (a launcher's up). The recoil's own spring carries it back (courier/player.js addRecoil's sum). */
  kick(dir, deg, up) {
    const P = this.game.player, k = shakeOf();
    if (!P?.punchV || k <= 0) return;
    const side = dir.dot(P.right(_r)), rise = up ? Math.max(0.6, dir.y) : dir.y;
    const n = Math.hypot(side, rise); if (n < 1e-3) return;
    const v = deg * k * DEG * (T.recoil?.recoverSpeed ?? 14) * Math.E / n;
    P.punchV.y += -side * v; // (yaw grows toward the left: the view follows a blade travelling right by turning right)
    P.punchV.x += rise * v;
  }
}
