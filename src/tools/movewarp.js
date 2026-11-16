// ---------------------------------------------------------------------------------------
// A MOVE'S TIME WARP AND ITS CANCEL FRAME (plain names; docs/plans/SONDELASS-FEEL.md 3B and 3D): two opt-in fields on a combo engine
// move (tools/moveset.js's A MOVE), read by the engine and by the frame table (tools/movephases.js). A row without them plays exactly as
// before (casebook 210: a new option never moves the default).
//
//   warp: { skip, in, out, back, blend }   THE TIME WARP: a monotonic, smooth (C1) map from the move's own time (game seconds since its
//       begin, `c.mt`) to its clip's time (`c.t`). The clip stays whole and interpolated; only its clock bends:
//         skip   clip s of the windup skipped at entry (the move begins at `from + skip`)
//         in     the windup's rate (clip s a game s) up to the strike's start, eased into the row's `rate` over `blend` clip s before it
//         rate   (the row's own) through the strike, as before
//         out    the rate just after the strike: the follow-through stretched (< 1 runs slow, so the blade lingers at the end of its
//                arc; no frame is ever frozen), eased in over `blend` clip s past the strike's end and back up to `back`
//         back   the rate the follow-through has returned to by the clip's end (default the row's rate)
//       The strike is the row's typed `strike` or the measured one (melee.js), as begin() has it. Every reader of the clip keeps one clock
//       (casebook 184): the engine keeps `c.t` as clip time read off `c.mt` each frame, so the pose, the strike window and its sweep, the
//       parts, the legs, the hips' travel, the ribbon and the fade all read the warped clip time; only the move's spans (its launch's
//       length, its travel's speed) ask here in move time.
//   cancel: { hit, whiff }   THE CANCEL FRAME as row data (move s, the same clock as a row's `time`): the first moment the next blow,
//       the free recovery cut, the jump and the guard may take the move over (Melee's IASA); `hit` once the blow has struck anything
//       (the on-hit cancel), `whiff` while it has not. Never before the strike's end plus a frame: the active frames are never skipped.
//       A press in the startup or the active frames is held for it (never lost to the buffer's 0.35 s); a press in the recovery more
//       than PAID_AHEAD before it is the paid cut as today, one nearer waits for it (paying Lachryma to save four frames is a trap).
//   TRACKING through the startup: a warped move turns toward what it goes to (the lock's point, else the magnet's pick at its begin) at
//       TRACK.rate until its strike begins, then holds; an upper move's step in (its lunge) is turned with it, a whole-body move's travel
//       reads the facing live.
//
// Prior art: Melee's IASA frames and Marth's Dancing Blade, whose next slash is taken only from a window late in the one before
// (SmashWiki); Devil May Cry's on-hit cancels and DMC5's rule that a cancel never skips the active frames (docs/ref/combat/
// DEVIL-MAY-CRY.md, "What to take"); the musou games' tracking through a windup (MUSOU.md); the time remapping of mocap in animation
// (a retime curve over a clip, Maya's and Blender's time warp: the motion kept, only its clock bent, fast in and slow out as a key
// animator times a hit's anticipation short and its follow-through long).
//
//   warpOf(def, track, dur) -> W | null   W { start, end, total (move s), m0, m1 (the strike's start and end in move s), clip(m), move(t) }
//   cancelAt(c) -> move s | null    cancelOpen(c) -> bool    paidWaits(c) -> bool (a press now should wait for the cancel, not pay)
//   trackStartup(M, c, dt)    jumpCancel(M, c) -> bool (the jump took the move over, from its cancel frame)
// A data-and-maths module but for trackStartup and jumpCancel, which are handed the engine (no import of it: moveset.js imports this).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const STEP = 1 / 600; // (clip s: the warp's table, integrated this fine)
export const WARP_FRAME = 1 / 60; // (the cancel frame never opens before the strike's end plus one 60 Hz frame)
export const PAID_AHEAD = 0.07; // (move s: a recovery press this near the cancel frame waits for it, free)
export const TRACK = { rate: 12 }; // (rad a game s through the startup: 690 degrees a second, a quarter turn in 8 frames)
const smooth = (a, b, x) => { if (b <= a) return x >= b ? 1 : 0; const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** Move `def`'s time warp (its `warp` row read against its strike: `def.strike` or the measured `track.strike`; `dur` its clip's length),
 *  cached on the def per strike; null for a row with none. */
export function warpOf(def, track, dur) {
  const w = def?.warp; if (!w) return null;
  const s = def.strike || track?.strike; if (!s) return null;
  if (def.warpW?.s === s && def.warpW.dur === dur) return def.warpW;
  const rate = def.rate || 1, from = def.from || 0, end = def.to ?? dur, B = w.blend ?? 0.03;
  const start = Math.min(end, from + (w.skip || 0)), s0 = Math.min(end, Math.max(start, s[0])), s1 = Math.min(end, Math.max(s0, s[1]));
  const rin = w.in ?? rate, rout = w.out ?? rate, back = w.back ?? rate;
  const r = (t) => {
    if (t < s0) return rin + (rate - rin) * smooth(s0 - B, s0, t);
    if (t <= s1) return rate;
    return rate + (rout + (back - rout) * smooth(s1 + B, end, t) - rate) * smooth(s1, s1 + B, t);
  };
  const n = Math.max(1, Math.ceil((end - start) / STEP)), h = (end - start) / n, M = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) M[i + 1] = M[i] + h / Math.max(0.05, r(start + (i + 0.5) * h)); // (midpoint rule; the rate is > 0, so it only rises)
  const move = (t) => { const x = Math.min(n, Math.max(0, (t - start) / h)), i = Math.min(n - 1, Math.floor(x)); return M[i] + (M[i + 1] - M[i]) * (x - i); };
  const clip = (m) => {
    if (m <= 0) return start; if (m >= M[n]) return end;
    let lo = 0, hi = n; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (M[mid] <= m) lo = mid; else hi = mid; }
    return start + (lo + (m - M[lo]) / (M[lo + 1] - M[lo])) * h;
  };
  return (def.warpW = { s, dur, start, end, total: M[n], m0: move(s0), m1: move(s1), clip, move });
}

/** The cancel frame of move `c` (move s), the on-hit one once it has struck anything; never before its strike's end and a frame. */
export function cancelAt(c) {
  const K = c?.def.cancel || {}, W = c?.W; if (!W) return null; // (a warp with no cancel row opens at its strike's end)
  const T = c.tally, struck = !!T && T.hit + T.creature + T.idle > 0;
  return Math.max(W.m1 + WARP_FRAME, (struck ? K.hit ?? K.whiff : K.whiff ?? K.hit) ?? 0);
}
/** Move `c` is past its cancel frame. */
export function cancelOpen(c) { const k = cancelAt(c); return k != null && c.mt >= k && c.phase !== 'fall'; }
/** A press made now in move `c`'s recovery waits for its cancel frame rather than paying (it is PAID_AHEAD or nearer). */
export function paidWaits(c) { const k = cancelAt(c); return k != null && k - c.mt <= PAID_AHEAD; }

/** Through its startup, move `c` turns toward what it goes to at TRACK.rate (the lock's point, else the magnet's pick at begin), and
 *  stops once its strike begins; an upper move's step in turns with it, a whole-body move's launch faces the new way. */
export function trackStartup(M, c, dt) {
  if (!c.W || c.mt >= c.W.m0 || !(dt > 0)) return;
  const g = M.game, P = M.P, at = (c.aimAt ||= new THREE.Vector3());
  if (g.lock?.active && g.lock.point(at)) { /* the lock's point */ } else if (!posOf(c.aim, at)) return;
  const dx = at.x - P.pos.x, dz = at.z - P.pos.z; if (dx * dx + dz * dz < 0.04) return;
  const want = Math.atan2(dx, dz) - (c.def.aim || 0), d = wrap(want - c.yaw), turn = Math.max(-TRACK.rate * dt, Math.min(TRACK.rate * dt, d));
  if (Math.abs(turn) < 1e-5) return;
  c.yaw += turn; P.bodyYaw = c.yaw;
  if (c.def.body === 'whole') { const L = P.techs?.get('launch'); if (L?.o?.tag === c.tag) L.o.yaw = c.yaw; return; }
  if (P.grounded) { const cs = Math.cos(turn), sn = Math.sin(turn), x = P.vel.x, z = P.vel.z; P.vel.x = x * cs + z * sn; P.vel.z = -x * sn + z * cs; } // (the lunge's step turned with the body: +yaw about Y)
}
/** Where the magnet's pick is now (melee.js targets' kinds), written into `out`; false when it is gone. */
function posOf(m, out) {
  const e = m?.ent; if (!e || e.alive === false) return false;
  if (m.kind === 'creature' && e.center) { e.center(out); return true; }
  if (m.kind === 'pot' && e.body?.translation) { const t = e.body.translation(); out.set(t.x, t.y, t.z); return true; }
  const p = e.pos || m.pos; if (!p) return false; out.copy(p); return true;
}

/** From move `c`'s cancel frame, a jump press takes it over: the move let go free, the core's jump given the press (a whole-body move's
 *  launch ends with it, so the core has the step back). True when it did. */
export function jumpCancel(M, c) {
  const P = M.P;
  if (!c.W || !P.peekLatch?.('Space') || !cancelOpen(c)) return false;
  M.finish();
  if (c.def.body === 'whole') { P.jumpHeldLast = false; P.jumpBuf = Math.max(P.jumpBuf || 0, 0.12); } // (the launch had the step: the press goes to the core now)
  return true;
}
