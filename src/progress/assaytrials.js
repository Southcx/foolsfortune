// ---------------------------------------------------------------------------------------
// THE STANDARD TRIALS: the Touchstone's tests as data (docs/plans/APTITUDE.md 9 step 4, 10.3 and 10.4; Petra's ask, 2026-10-29: "its
// tests as data: what is measured, and its units"). A standard trial is announced as one and run in the Touchstone, the one room with
// nothing else in it, so the conditions are fixed and the streak is only yours. The room and its stimuli are Petra's (and Calissa's
// look, Wanda's sounds); what each trial shows, how many times, and how its answers become a number is here, as pure functions the
// room and the bot check (scripts/assaybot.mjs) both call.
//
// Each trial reads into an aptitude of `aptitude.js` (its `into`), as a sample with `{ trial: id }`, so the Assay shows the trial's
// number beside the passive one and never mixes the two.
//
// Prior art: psychophysics' staircases (Levitt 1971: 3-down-1-up converges on the 79.4% point; the threshold as the geometric mean of
// the last reversals), signal detection theory's d' (with the log-linear correction, Hautus 1995), the Go/No-Go task, synchronised
// tapping (Repp 2005: the asynchrony's spread), the simple reaction time box (anticipations under 100 ms dropped), the Human Benchmark
// site (absolute units, your own history).
//
//   TRIALS[id] = { label, into, unit, better, kind, ...its numbers, line }
//   staircase(spec) -> { level, next(correct), done, reversals, threshold() }   (a pitch's cents, a colour's distance)
//   dPrime({ hits, misses, fas, crs }) -> number   reactionMs(list) -> median   asynchronySd(list) -> ms
//   scoreTrial(id, record) -> { value, unit, n, ok }   (the room hands over what happened; the number back)
// ---------------------------------------------------------------------------------------

export const TRIALS = {
  // the rail's lights in the Touchstone's dark: press on a plain one, hold on an outlined one (the rail's own rule: an outlined shot is
  // answered only by the parry). Inhibition, read as d' (how well the two are told apart), the hits' reaction time beside it.
  gonogo: { label: 'Go / No-Go', into: 'inhibition', unit: "d'", better: 'high', kind: 'detect',
    trials: 60, noGo: 0.25, gap: [0.8, 1.6], window: 0.6, line: 'Press on a plain light, hold on an outlined one.' },
  // two crystal tones in turn, which is higher (two-alternative forced choice): the cents between them stepped by the staircase
  pitch: { label: 'Pitch threshold', into: 'pitch', unit: 'cents', better: 'low', kind: 'staircase',
    start: 100, step: 1.41, floor: 1, ceil: 400, reversals: 10, keep: 6, choices: 2, line: 'Two crystals sound in turn: say which is higher.' },
  // three tiles at the press, one a shade off (the odd one out, three alternatives): the distance in Oklab x 100 (deltaE OK)
  colour: { label: 'Colour threshold', into: 'colour', unit: 'deltaE (Oklab x 100)', better: 'low', kind: 'staircase',
    start: 12, step: 1.41, floor: 0.2, ceil: 40, reversals: 10, keep: 6, choices: 3, line: 'Three tiles: pick the one that is not like the others.' },
  // tap along to the bell at 100 beats a real minute: the spread of your taps round the beat, the first 4 taps dropped (finding the beat)
  rhythm: { label: 'Tapping', into: 'timing', unit: 'ms of spread', better: 'low', kind: 'tap',
    bpm: 100, taps: 40, settle: 4, line: 'Tap along with the bell.' },
  // a windup flashes after a wait you cannot guess (1 to 3 real s): parry it. Simple reaction time, its median; under 100 ms is a guess
  react: { label: 'Reaction', into: 'react', unit: 'ms', better: 'low', kind: 'react',
    trials: 20, wait: [1, 3], guess: 100, line: 'A windup flashes: answer it as soon as you see it.' },
};

/** A 3-down-1-up staircase on a ratio scale: three right in a row make it harder (level / step), one wrong easier (level x step); it
 *  ends after `reversals` turns and reads the geometric mean of the last `keep` (the 79.4% point of your psychometric curve). */
export function staircase(T) {
  const S = { level: T.start, run: 0, dir: 0, turns: [], done: false };
  S.next = (correct) => {
    if (S.done) return S.level;
    let move = 0;
    if (correct) { if (++S.run >= 3) { S.run = 0; move = -1; } } else { S.run = 0; move = 1; }
    if (move) {
      if (S.dir && move !== S.dir) S.turns.push(S.level);
      S.dir = move;
      S.level = Math.min(T.ceil, Math.max(T.floor, move < 0 ? S.level / T.step : S.level * T.step));
      if (S.turns.length >= T.reversals) S.done = true;
    }
    return S.level;
  };
  S.threshold = () => { const t = S.turns.slice(-T.keep); return t.length ? Math.exp(t.reduce((a, v) => a + Math.log(v), 0) / t.length) : null; };
  Object.defineProperty(S, 'reversals', { get: () => S.turns.length });
  return S;
}

/** The inverse of the standard normal's cumulative (Acklam's rational approximation, |error| < 1.2e-9). */
function zOf(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - lo) return -zOf(1 - p);
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
export const zScore = zOf;

/** d' with the log-linear correction (half a trial added to each cell), so a perfect run reads a finite number. */
export function dPrime({ hits = 0, misses = 0, fas = 0, crs = 0 }) {
  const H = (hits + 0.5) / (hits + misses + 1), F = (fas + 0.5) / (fas + crs + 1);
  return zOf(H) - zOf(F);
}
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** A reaction box's median, its guesses (under `guess` ms) dropped. */
export const reactionMs = (list, guess = TRIALS.react.guess) => median(list.filter((v) => v >= guess));
/** Tapping's spread: the standard deviation of the asynchronies (ms), the settling taps dropped; the mean (the device's latency) ignored. */
export function asynchronySd(list, settle = TRIALS.rhythm.settle) {
  const a = list.slice(settle); if (a.length < 2) return null;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1));
}

/** A trial's number from what the room recorded: `{ answers: [bool] }` for a staircase (in order), `{ hits, misses, fas, crs }` for
 *  Go / No-Go, `{ times: [ms] }` for the reaction box, `{ async: [ms] }` for tapping. `ok` is false if the run is too short to count. */
export function scoreTrial(id, rec) {
  const T = TRIALS[id]; if (!T) return null;
  const out = (value, n, ok) => ({ value: value == null ? null : +value.toFixed(T.kind === 'detect' ? 2 : 1), unit: T.unit, n, ok: ok && value != null });
  if (T.kind === 'staircase') { const S = staircase(T); for (const a of rec.answers || []) S.next(!!a); return out(S.threshold(), (rec.answers || []).length, S.done); }
  if (T.kind === 'detect') { const n = (rec.hits || 0) + (rec.misses || 0) + (rec.fas || 0) + (rec.crs || 0); return out(dPrime(rec), n, n >= T.trials * 0.8); }
  if (T.kind === 'react') { const t = (rec.times || []).filter((v) => v >= T.guess); return out(reactionMs(rec.times || []), t.length, t.length >= T.trials * 0.6); }
  if (T.kind === 'tap') { const a = rec.async || []; return out(asynchronySd(a), a.length, a.length >= T.taps * 0.8); }
  return null;
}
