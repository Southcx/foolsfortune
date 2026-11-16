// ---------------------------------------------------------------------------------------
// A MOVE'S PHASES: a combo engine move (tools/moveset.js's A MOVE) read as frame data, in 60 Hz frames of game time: its STARTUP (the
// frames from its begin before its first active frame), its ACTIVE frames (the strike window, measured from the clip by melee.js
// measureSwing, a typed `strike` winning as in the engine's begin()), its RECOVERY (the strike's end to the move's end) and its TOTAL,
// and THE CANCEL FRAME as the engine has it today (plain name, docs/plans/SONDELASS-FEEL.md 3A): the frame the next blow of a string may
// begin, the later of its chain window's opening (`chain[0]`) and its row's `time` (the rate the raids are sized to: moveset.js
// chainOpen), or, on a string's last blow, the dash and the charge's release (the free recovery cut), the later of its strike's end and
// its row's time; capped at the move's end (a window that opens later is never reached: the move is over, and the next press is an
// opener). A multi-hit row lists each hit's first active frame (`parts`, or its strike split evenly by its row's `hits`, as sweep()
// splits it). A warped move (tools/movewarp.js: `warp`, `cancel`) is read on its warped clock: its frames are the move time its clip
// times map to, and its cancel frame is its row's, `cancel` the whiff's and `cancelHit` the on-hit one (`warped` true). It measures
// only: nothing here changes how a move plays.
//
// Prior art: Melee's frame data (SmashWiki: startup, active frames, end lag, and IASA, the first frame anything may interrupt a move,
// which the cancel frame stands in for here); the frame data displays of the fighting games (Street Fighter's training mode, Tekken's
// frame meter, Guilty Gear's: startup, active and recovery as three coloured runs on one bar).
//
//   movePhases(def, { track, rule, dur, way, fps }) -> { from, rate, startup, active, recovery, total, cancel, cancelShare, hits,
//                                                       lateCancel, strike, end, warped, cancelHit, hitShare }   (pure: the numbers it is handed)
//   phasesOf(M, id, { way }) -> the same, for move `id` of Moveset M (its def, its row by M.rule(), its clip's length, its swing
//                                measured as begin() measures it), or null
//   way: 'chain' (a next blow follows: the chain window), 'free' (the free recovery cut), null (none: a special, a hold); by default
//        'chain' where the move has a `chain`, else null
// ---------------------------------------------------------------------------------------
import { measureSwing } from './melee.js';
import { warpOf, WARP_FRAME } from './movewarp.js';

export const PHASE_FPS = 60;

/** A move's phases from the numbers the engine reads: `def` its move, `track` its measured swing (melee.js), `rule` its row (moves.js,
 *  or its own `stats`), `dur` its clip's length (clip s). */
export function movePhases(def, { track, rule = null, dur = 1, way, fps = PHASE_FPS } = {}) {
  const from = def.from || 0, rate = def.rate || 1, end = def.to ?? dur;
  const s = def.strike || track?.strike || null, W = warpOf(def, s ? { strike: s } : track, dur);
  const frame = W ? (t) => Math.round(W.move(t) * fps) : (t) => Math.round(((t - from) / rate) * fps); // (clip s to the frames of game time since the move began: its warped clock where it has one)
  const total = Math.max(1, frame(end));
  const e0 = s ? Math.max(0, Math.min(total, frame(s[0]))) : total, e1 = s ? Math.max(e0, Math.min(total, frame(s[1]))) : total;
  const n = rule?.hits || 1;
  const hits = !s ? [] : def.parts ? def.parts.map((p) => Math.max(0, frame(p)) + 1) : Array.from({ length: n }, (_, i) => Math.max(0, frame(s[0] + (i * (s[1] - s[0])) / n)) + 1); // (Melee's numbering: the first active frame is startup + 1)
  way = way === undefined ? (def.chain ? 'chain' : null) : way;
  const soon = Math.round((rule?.time ?? 0) * fps);
  let cancel = null, lateCancel = false;
  let cancelHit = null;
  if (W && way) { const k = (v) => Math.round(Math.max(W.m1 + WARP_FRAME, v ?? 0) * fps), K = def.cancel || {}; cancel = k(K.whiff ?? K.hit); cancelHit = k(K.hit ?? K.whiff); } // (movewarp.js cancelAt)
  else if (way === 'chain' && def.chain) cancel = Math.max(frame(def.chain[0]), soon);
  else if (way === 'free' && s) cancel = Math.max(e1 + 1, soon); // (its strike past: c.t > strike[1])
  if (cancel != null && cancel > total) { cancel = total; lateCancel = true; }
  if (cancelHit != null && cancelHit > total) cancelHit = total;
  return { from, rate, startup: e0, active: e1 - e0, recovery: total - e1, total, cancel, cancelShare: cancel == null ? null : cancel / total, hits, lateCancel, strike: s, end, warped: !!W, cancelHit, hitShare: cancelHit == null ? null : cancelHit / total };
}

/** Move `id` of Moveset `M` as frame data: its def and row as the engine reads them (M.def, M.rule: the row of moves.js wins over the
 *  play's own `stats`), its swing measured as begin() measures it (the same cache: melee.js measureSwing, `tip` and `limb` the move's,
 *  else the tool's, else 0.9 and the right hand), its clip's length the engine's (M.dur). */
export function phasesOf(M, id, { way } = {}) {
  const def = M?.def(id), ch = M?.game?.character;
  if (!def || !ch?.clips.clips[def.clip]) return null;
  const track = def.track || measureSwing(ch, def.clip, { tip: def.tip ?? M.S.tip ?? 0.9, limb: def.limb ?? M.S.limb ?? 'R' });
  return movePhases(def, { track, rule: M.rule(def), dur: M.dur(def), way });
}
