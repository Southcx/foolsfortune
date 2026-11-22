// ---------------------------------------------------------------------------------------
// THE CHARGE'S GATE (plain name; docs/plans/SONDELASS-FEEL.md 14): a combo engine string's opener (tools/moveset.js) begun with its
// button down is held short of its strike while the button stays down, so holding to charge never swings it first (South, 2026-11-22:
// "holding LMB always causes a single slash attack to trigger before the charging animation starts"). Opt-in on a string:
// `strings.charge.gate` (real s held, from the press, before the gate hands over to the charge's hold; the cutlass's 0.2). A string
// without it plays exactly as before (the Dreamvane's pick: casebook 210).
//
//   the gate      the opener (an upper-body warped move: a whole-body move's launch runs its own clock, so it is never gated) begins on
//                 the press, its windup played on its warped clock (tools/movewarp.js) up to GATE.lead before its strike's first frame,
//                 and waits there while the button is down
//   let go        it plays on from where it waits and strikes on the next frame (so released before it reaches the gate, it strikes on
//                 the frame it always did); its swing's sound, its `swing` event and its step in come then, never on the press
//   held          past `gate` real s, it hands over to the charge's hold (`strings.charge.hold`): its blow never went live, so its tally is
//                 dropped (no move.blow for a cut that never cut), and nothing was announced
//
// Prior art: The Legend of Zelda's spin attack and Dark Souls' charged R2 (the attack is read on the release, the hold is the charge);
// Melee's smash attacks, whose startup freezes on the charge frame while the button is held (SmashWiki, "Smash attack": a held smash
// waits on its charge frame, let go it plays on from there).
//
//   GATE                                   { lead } (move s before the strike's first frame where the opener waits)
//   gated(M, kind, n, def, W, down) -> bool   whether a move begun now is the gated opener
//   chargeGate(M, c, down) -> bool             once a frame while `c.gate`: true when it hands over to the hold
//   announce(M, c, f?, m?, step?)              the swing's step in, its sound and its event (begin()'s, or the gate's on letting go)
// A small module handed the engine (no import of it: moveset.js imports this).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';

export const GATE = { lead: 1 / 240 }; // (a quarter of a 60 Hz frame before the strike: the next frame's step crosses it)
const _b = new THREE.Vector3(), _e = new THREE.Vector3(), _f = new THREE.Vector3();

/** Whether a move begun now (`kind`, `n`, its row `def`, its warp `W`, the string's button `down`) is the gated opener. */
export function gated(M, kind, n, def, W, down) {
  const g = M.S.strings?.charge?.gate;
  return !!g && down && kind === 'ground' && n === 0 && !!W && def.body !== 'whole';
}

/** Once a frame while move `c` waits at the gate: held, its clock kept short of the strike and true once held `gate` real s (it hands
 *  over to the hold); let go, the gate is gone, the swing announced and false. */
export function chargeGate(M, c, down) {
  if (!down) { c.gate = false; M.held = false; announce(M, c); return false; }
  c.gateT = (c.gateT || 0) + (M.game.rawDt ?? 1 / 60);
  const top = Math.max(0, c.W.m0 - GATE.lead);
  if (c.mt > top) { c.mt = top; c.t = c.W.clip(top); }
  if (c.gateT < M.S.strings.charge.gate) return false;
  c.tally = null; // (it never went live: no move.blow for it)
  return true;
}

/** A swing begins in earnest: an upper move's step in (toward the lock, or the magnet's pick `m`, along `f`), the tool's sound and its
 *  swing event. `f` defaults to the move's facing. */
export function announce(M, c, f = null, m = c.aim, step = c.def.body !== 'whole') {
  const g = M.game, P = M.P, def = c.def, kind = c.kind;
  if (!f) { const y = (c.yaw ?? P.bodyYaw) + (def.aim || 0); f = _f.set(Math.sin(y), 0, Math.cos(y)); }
  if (step && def.lunge) {
    let lunge = def.lunge * (P.grounded ? 1 : 0.5);
    if (m) lunge = Math.min(lunge, Math.max(0, m.dist - m.r - 1.0) * 3.2);
    if (g.lock?.active) { g.lock.point(_e); lunge = Math.min(lunge, Math.max(0, _e.distanceTo(P.pos) - 1.3) * 3.2); }
    P.impulse(_b.copy(f).setY(0).normalize().multiplyScalar(lunge), M.S.cause === 'bashed' ? 'brush' : 'cut');
    if (!P.grounded && kind === 'air') P.vel.y = Math.max(P.vel.y, 1);
  }
  if (M.S.sound) M.S.sound(def.heat > 0.5); else if (M.S.sound !== false) sfx.slash?.(def.heat > 0.5); // (the tool's own swing, else the cutlass's slash, called on sfx; false: the tool sounds its own)
  if (kind !== 'charge-hold') g.events?.emit(M.S.events.swing, { n: c.n, move: c.id, by: 'courier' }); // (a hold is not a swing: its release is)
}
