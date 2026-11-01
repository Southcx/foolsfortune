// ---------------------------------------------------------------------------------------
// THE FIGHTER'S HOLDS (docs/plans/FIGHTER.md 4; platformfighter.js GRAB, LEDGE): what one fighter does holding another, and holding on.
//   the grab     out on frames 7 to 8 of 30 (the box: moves.js GRAB_BOX; who it closes on is fighter/hits.js's); it holds
//                floor(76 + 1.6 x %) frames, each of the held one's mashes 6 fewer; LMB a pummel (3%, staled), a direction a throw
//                (forward, back, up, down: weight-blind, let go on the throw's own frame); held out, both let go and pushed apart
//   the ledge    caught falling (or by the hook's tether), turned to the stage, 7 frames to catch and 30 intangible after, the air
//                jumps given back; hung 11 real s at most (8 at 100% and over); let go (S, or away) locked out of it 29 frames; four
//                getups (climb: W or toward the stage; jump: Space; roll: Shift; attack: LMB or E), slower at 100% and over, intangible
//                most of the way, the ledge free for another the moment one begins
//
// Prior art: Melee's decomp (ftCo_Catch*, ftCo_Throw*, ftCo_Cliff*: the catch box off the ledge's corner, the hang, the getups by
// percent), SmashWiki's Grab release and Ledge pages; Super Smash Bros. Brawl's tether to the ledge (Link's Clawshot, the Sondelass's
// hook here).
//
//   startGrab(F)   connectGrab(F, V)   grabStep holdStep pummelStep throwStep heldStep releaseStep (kernel.js's states)
//   tryLedge(F, ledges, tether?) -> bool   ledgeStep ledgeUpStep   (a ledge: { x, y, out: -1 left | +1 right, by: the fighter hanging })
// ---------------------------------------------------------------------------------------
import { GRAB, LEDGE, DODGE, grabHold, hitlag, stale } from '../../../progress/platformfighter.js';
import { KIT, BODY, dirOf, pickThrow } from './moves.js';
import { go, traction, hitOf, noteStale, moveOf } from './fighterstate.js';
import { takeHit } from './kernelhurt.js';

const side = (I) => (Math.abs(I.x) > KIT.stick ? Math.sign(I.x) : 0);
const place = (F, x, y, grounded = false) => { F.x = x; F.y = y; F.vx = 0; F.vy = 0; F.mo.mode = 'place'; F.mo.grounded = grounded; };

// ---------------------------------------------------------------------------------------------------------------- the grab
export function startGrab(F) { go(F, 'grab'); F.grabbing = false; }
export function grabStep(F) {
  traction(F); F.mo.mode = 'vel';
  F.grabbing = F.f >= GRAB.active[0] && F.f <= GRAB.active[1];
  if (F.f >= GRAB.total) { F.grabbing = false; go(F, 'idle'); }
}
/** F's grab closes on V. */
export function connectGrab(F, V) {
  if (V.ledge) { V.ledge.by = null; V.ledge = null; }
  if (V.victim) { const H = V.victim; V.victim = null; H.holder = null; go(H, 'idle'); }
  go(F, 'hold'); F.victim = V; F.holdN = grabHold(V.percent); F.grabbing = false; F.vx = 0;
  go(V, 'held'); V.holder = F; V.face = -F.face; V.launch = null; V.hl = 0; V.tumble = false; V.fastfall = false; V.vx = 0; V.vy = 0;
  F.env.verb(F, 'grab');
}
export function holdStep(F, I) {
  const V = F.victim; F.mo.mode = 'hold'; F.vx = 0; F.vy = 0;
  if (!V || V.holder !== F) { F.victim = null; return go(F, 'idle'); }
  if (--F.holdN <= 0) return releaseGrab(F, V);
  if (I.atkP && F.f > 3) return go(F, 'pummel');
  const d = I.dirP ? dirOf({ x: I.dirP[0], y: I.dirP[1] }, F) : null;
  if (d) { go(F, 'throw'); F.m = pickThrow(d); F.env.verb(F, 'throw'); }
}
export function pummelStep(F) {
  const V = F.victim; F.mo.mode = 'hold';
  if (!V || V.holder !== F) { F.victim = null; return go(F, 'idle'); }
  F.holdN--;
  if (F.f === KIT.pummelAt) { // (no knockback: the percent, a little hitlag on both, staled as any hit)
    const d = Math.round(stale(GRAB.pummel.damage, F.stale, 'pummel') * 10) / 10;
    V.percent = Math.min(999, V.percent + d); V.hl = V.hlFull = F.hl = F.hlFull = hitlag(d);
    noteStale(F, 'pummel'); F.env.verb(F, 'pummel');
    F.env.struck?.(F, V, { move: 'pummel', damage: d }, 'hit');
  }
  if (F.f >= GRAB.pummel.total) { const n = F.holdN; go(F, 'hold'); F.holdN = n; }
}
export function throwStep(F) {
  const V = F.victim, m = moveOf(F.m); F.mo.mode = 'hold';
  if (V && V.holder === F && F.f >= m.startup) { // (let go on the throw's own frame, weight-blind)
    V.holder = null; F.victim = null; V.st = 'idle'; // (out of the hold, so the throw's blow is taken by the body)
    const hit = hitOf(F, F.m), res = takeHit(V, F, hit);
    if (res !== 'miss') { noteStale(F, F.m); F.env.struck?.(F, V, hit, res); }
  }
  if (F.f >= (m?.total ?? 30)) { F.m = null; go(F, 'idle'); }
}
/** Held: kept at the holder's hands, mashing out. */
export function heldStep(V, I) {
  const H = V.holder;
  if (!H || H.victim !== V || !['hold', 'pummel', 'throw'].includes(H.st)) { V.holder = null; return go(V, V.grounded ? 'idle' : 'air'); }
  if (I.mash) H.holdN -= GRAB.mash;
  place(V, H.x + H.face * (H.r + V.r + 0.08), H.y, H.grounded);
}
function releaseGrab(F, V) {
  F.victim = null; V.holder = null;
  go(F, 'release'); F.relN = KIT.grabRelease; F.vx = -F.face * KIT.grabPush;
  go(V, 'release'); V.relN = KIT.grabRelease; V.vx = F.face * KIT.grabPush;
}
export function releaseStep(F) { traction(F); F.mo.mode = 'vel'; if (F.f >= F.relN) go(F, F.grounded ? 'idle' : 'air'); }

// ---------------------------------------------------------------------------------------------------------------- the ledge
/** Catch a ledge if one is in reach (falling, or the hook's tether reaching it ahead), free, and the regrab lockout over. */
export function tryLedge(F, ledges, tether = false) {
  if (F.regrab > 0 || F.grounded || (!tether && F.vy > 0)) return false;
  const [n0, n1, y0, y1] = KIT.catchBox;
  for (const L of ledges) {
    if (L.by && L.by !== F) continue;
    const out = (F.x - L.x) * L.out, dy = F.y + F.h - L.y;
    const ok = tether ? out >= -0.2 && out <= KIT.tether && F.face === -L.out && Math.abs(F.y + F.h * 0.6 - L.y) < 1.4
      : out >= -n0 && out <= n1 && dy >= y0 && dy <= y1;
    if (ok) { catchLedge(F, L); return true; }
  }
  return false;
}
function catchLedge(F, L) {
  go(F, 'ledge'); F.ledge = L; L.by = F; F.face = -L.out; F.intan = LEDGE.catch + LEDGE.intangible;
  F.airJumps = F.stats.airJumps; F.fastfall = false; F.tumble = false; F.reflecting = false;
  F.hangX = L.x + L.out * (F.r + 0.05); F.hangY = L.y - F.h * 0.92;
  place(F, F.hangX, F.hangY);
  F.env.verb(F, 'ledgeGrab');
}
export function ledgeStep(F, I) {
  const L = F.ledge; if (!L) return go(F, 'air');
  place(F, F.hangX, F.hangY);
  if (F.f <= LEDGE.catch) return;
  const over = F.percent >= 100 ? 1 : 0, sx = side(I);
  if (F.f > LEDGE.maxHang[over] * 60 || I.downP || (I.tapX && I.tapX === L.out)) { // (let go: S, away, or hung too long)
    L.by = null; F.ledge = null; go(F, 'air'); F.regrab = LEDGE.regrab; F.vx = L.out * 0.4; F.vy = 0; F.grounded = false; F.mo.mode = 'free';
    return;
  }
  const kind = I.jumpP ? 'jump' : I.shieldP ? 'roll' : I.atkP || I.smashP ? 'attack' : (I.dirP && I.dirP[1] > 0) || (I.tapX && I.tapX === -L.out) || (sx === -L.out && F.f > 30) ? 'climb' : null;
  if (!kind) return;
  go(F, 'ledgeup'); F.upKind = kind; F.ledge = L; L.by = null;
  F.upN = kind === 'jump' ? KIT.ledgeJump : LEDGE.getup[kind][over];
  F.intan = Math.round(F.upN * KIT.getupIntan);
  F.fromX = F.x; F.fromY = F.y;
  F.toX = L.x - L.out * (kind === 'roll' ? 0.5 + DODGE.roll.distance : 0.6) * (F.h / BODY); F.toY = L.y + 0.02;
  if (kind === 'attack') { F.m = 'ledgeAttack'; F.hits = new Set(); }
  F.env.verb(F, 'ledgeGetup');
}
export function ledgeUpStep(F) {
  const L = F.ledge, n = F.upN, moving = F.upKind === 'jump' ? n : Math.max(2, Math.round(n * KIT.ledgeUp));
  const k = Math.min(1, F.f / moving), up = Math.min(1, k * 2), across = Math.max(0, k * 2 - 1); // (up over the edge first, then onto it)
  const x = F.upKind === 'jump' ? F.fromX + (F.toX - F.fromX) * up * 0.3 : F.fromX + (F.toX - F.fromX) * across;
  place(F, x, F.fromY + (F.toY - F.fromY) * up, up >= 1);
  if (F.upKind === 'attack') { const a = Math.round(n * KIT.ledgeAttackAt); F.active = F.f >= a && F.f <= a + 3; }
  if (F.upKind === 'jump' && F.f >= n) { // (over the edge and away, as a jump)
    F.ledge = null; go(F, 'air'); F.vy = F.stats.jumpVelocity; F.vx = -(L?.out ?? F.face) * F.stats.walkSpeed * 0.5; F.grounded = false;
    F.mo.mode = 'vel'; F.mo.takeoff = true; return;
  }
  if (F.f >= n) { F.ledge = null; F.active = false; F.m = null; F.grounded = true; go(F, 'idle'); F.mo.grounded = true; }
}
