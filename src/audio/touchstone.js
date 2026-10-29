// ---------------------------------------------------------------------------------------
// THE TOUCHSTONE'S SOUNDS (the Assay's standard trials, Petra's world/touchstone/; APTITUDE.md): the sounds a trial measures with, and
// the room's few moments. A trial's sounds are instruments before they are music, so they are kept plain and fixed:
//   THE PITCH PAIR  (trialTone) one timbre for every tone, a sine with two soft harmonics in a fixed ratio (so the only difference
//                   between the two is the pitch asked about), 20 ms raised ramps (no click at the edges), dry (no reverb to smear it),
//                   the frequency exact; started on the audio clock, never by the frame
//   THE BEAT        (trialClick, trialBeat) a woodblock's tick with its onset in the first millisecond, every click the same (no accent
//                   to lean on), scheduled ahead on the audio clock; trialBeat hands back when the first click is heard, in
//                   performance.now()'s milliseconds, read from the context's output timestamp (its latency counted), so taps are
//                   judged against what was heard and not against what was scheduled
//   THE ROOM        a trial begun (assay.trial.start): a low stone hum and a struck bowl; ended with its record (assay.trial.end):
//                   the bowl again and a fifth over it; stopped short (assay.trial.stop): one muffled knock. The room entered
//                   (touchstone.enter): the stone's hum, alone
// Go / No-Go and the reaction box stay silent: they measure the eye, and a sound would cue the hand.
//
// Prior art: audiometry's and psychoacoustics' two-interval forced choice (fixed timbre, raised-cosine gating, a dry tone), the
// sensorimotor synchronisation literature's metronome (Repp 2005: identical clicks, onsets measured as heard), the Web Audio
// spec's getOutputTimestamp for mapping the audio clock to performance time.
//
//   sfx.trialTone(hz, len, at)   sfx.trialClick(at)   sfx.trialBeat(n, period, lead) -> ms (performance.now of the first click heard)
//   sfx.trialStart() .trialEnd() .trialStop() .touchstoneEnter()
// ---------------------------------------------------------------------------------------

const RAMP = 0.02; // (s: the tones' raised ramps)
const HARM = [[1, 1], [2, 0.18], [3, 0.06]]; // (the pitch pair's one timbre: partial, level)

export class TouchstoneSounds {
  /** One tone of a pitch trial: `hz` exact, `len` real s, starting `at` s from now on the audio clock. */
  trialTone(hz, len = 0.45, at = 0, level = 0.2) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + at, g = c.createGain();
    g.gain.value = 0; // (no other event may share a curve's span: the first curve holds its last value until the second)
    g.gain.setValueCurveAtTime(new Float32Array([0, 0.15, 0.5, 0.85, 1].map((k) => k * level)), t, RAMP);
    g.gain.setValueCurveAtTime(new Float32Array([1, 0.85, 0.5, 0.15, 0].map((k) => k * level)), t + len - RAMP, RAMP);
    g.connect(this.out(1, 0, true)); // (dry)
    for (const [p, a] of HARM) {
      const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = hz * p; og.gain.value = a / 1.24;
      o.connect(og).connect(g); o.start(t); o.stop(t + len + 0.02);
    }
  }
  /** One click of the beat `at` s from now: a woodblock's tick, its onset sharp. */
  trialClick(at = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + at, d = this.out(0.6, 0, true);
    this.noise(t, 0.012, { type: 'bandpass', f0: 2200, q: 3, gain: 0.7, dest: d });
    this.tone(t, 0.04, { f0: 1700, f1: 1500, type: 'triangle', gain: 0.25, dest: d });
  }
  /** A beat of `n` clicks `period` s apart, the first `lead` s from now; returns when the first is heard (performance.now ms). */
  trialBeat(n, period, lead = 0.6) {
    if (!this.ok()) return performance.now() + lead * 1000;
    const c = this.ctx, t0 = c.currentTime + lead;
    for (let k = 0; k < n; k++) this.trialClick(lead + k * period);
    const ts = c.getOutputTimestamp?.();
    if (ts && ts.performanceTime > 0) return ts.performanceTime + (t0 - ts.contextTime) * 1000;
    return performance.now() + (lead + (c.outputLatency || c.baseLatency || 0)) * 1000;
  }

  /** The stone's hum and a struck bowl: a trial begun. */
  trialStart() {
    if (!this.ok() || !this.allow('trialStart', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.6, true);
    this.tone(t, 1.6, { f0: 82.4, type: 'triangle', gain: 0.12, dest: d });
    this.godBell?.(t + 0.1, 2.2, 329.6, 0.1, d);
  }
  /** A trial ended with its record: the bowl, and a fifth over it. */
  trialEnd() {
    if (!this.ok() || !this.allow('trialEnd', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6, true);
    this.godBell?.(t, 2.2, 329.6, 0.1, d); this.godBell?.(t + 0.25, 2.4, 493.9, 0.09, d);
  }
  /** A trial stopped short: one muffled knock. */
  trialStop() {
    if (!this.ok() || !this.allow('trialStop', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3, true);
    this.noise(t, 0.08, { type: 'lowpass', f0: 500, gain: 0.4, dest: d }); this.tone(t, 0.2, { f0: 110, f1: 80, type: 'triangle', gain: 0.2, dest: d });
  }
  /** The Touchstone entered: the stone's hum, alone. */
  touchstoneEnter() {
    if (!this.ok() || !this.allow('touchstoneEnter', 0.2)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.8);
    this.tone(t, 3, { f0: 82.4, type: 'triangle', gain: 0.15, dest: d }); this.tone(t + 0.3, 2.6, { f0: 123.5, gain: 0.06, dest: d });
  }
}
