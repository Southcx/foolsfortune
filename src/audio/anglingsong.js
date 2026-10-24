// ---------------------------------------------------------------------------------------
// THE LINE'S SONG AND THE LIFT'S STING (docs/plans/ANGLING.md 2; the fight: tools/sondelass/angling/fight.js; the lift: Calissa's
// angling/catchlift.js).
//   THE LINE'S SONG  while a fish is on, the line sounds as a real string does: its pitch rises with the root of its tension (Mersenne's
//                    law), a thrum when slack, a tone in the sweet band, a whine near the snap (a resonance climbing over it, a high
//                    partial opening past a tension of 1). In the band the pitch settles onto the nearest note of the scale the music
//                    plays in (music/player.js scale), so a fight held well is in key; out of it the note slides free, off the key. A
//                    run pays out line against the drag's click, a click a span of line given.
//   THE LIFT         the fish held up to the camera (Animal Crossing's lift): a pickup and a bright chord on the music's next beat, in
//                    its key, bells over it. A first catch adds the Answer (music/motifs.js) rung over the chord; a record a rising
//                    octave and a cymbal's swell; a legend a low brass and a drum under it all. A quick lift (skipped) is the chord alone.
// Prior art: Animal Crossing's catch (the fish held up, the jingle on the picture), Mersenne's laws of a vibrating string, a reel's
// drag ratchet, Red Dead Redemption 2's line (its sound tightening toward the snap).
//
//   sfx.lineSongStart(read) / .lineSongEnd()   read() -> { tension 0..1.3, dist m, root, scale } or null (ends)
//   sfx.angleLift({ first, record, legend, quick }, grid)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const midi = (f) => 69 + 12 * Math.log2(f / 440);
const BAND = [0.34, 0.78]; // (fight.js BAND: where the fish tires)
const SONG_TICKS = 36000; // (the song's loop reads at most half an hour of real time, then lets go: casebook 253)
const CLICK_M = 0.35; // (line given between two of the drag's clicks, m)

/** The nearest note to `m` (midi) whose step above `root` is in `scale` (five semitones). */
function inKey(m, root, scale) {
  let best = m, bd = 99;
  for (let o = -1; o <= 1; o++) for (const s of scale) {
    const n = Math.round((m - root - s) / 12) * 12 + root + s + o * 12, dd = Math.abs(n - m);
    if (dd < bd) { bd = dd; best = n; }
  }
  return best;
}

export class AnglingSongSounds {
  lineSongStart(read = () => null) {
    if (this._song || !this.ok()) return;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0.0001; g.connect(this.loopBus || this.out(1, 0.2));
    const str = c.createOscillator(); str.type = 'sawtooth';
    const thrum = c.createOscillator(); thrum.type = 'sine';
    const whine = c.createOscillator(); whine.type = 'sine';
    const res = c.createBiquadFilter(); res.type = 'bandpass'; res.Q.value = 4;
    const strG = c.createGain(); strG.gain.value = 0; const thrumG = c.createGain(); thrumG.gain.value = 0; const whineG = c.createGain(); whineG.gain.value = 0;
    const vib = c.createOscillator(), vibG = c.createGain(); vib.frequency.value = 5.2; vibG.gain.value = 0;
    vib.connect(vibG); vibG.connect(str.detune); vibG.connect(whine.detune); // (the fish's pull, a tremor in the line)
    str.connect(res).connect(strG).connect(g); thrum.connect(thrumG).connect(g); whine.connect(whineG).connect(g);
    for (const o of [str, thrum, whine, vib]) o.start();
    const S = this._song = { g, oscs: [str, thrum, whine, vib], gone: 0, ticks: 0, dist: null };
    S.timer = setInterval(() => {
      if (++S.ticks > SONG_TICKS) { this.lineSongEnd(); return; }
      const r = read(), t = c.currentTime;
      S.gone = r ? 0 : S.gone + 1; if (S.gone > 3) { this.lineSongEnd(); return; }
      if (!r) return;
      const T = Math.max(0, Math.min(1.3, r.tension || 0)), over = Math.max(0, T - 1) / 0.3;
      let m = midi(98 * Math.sqrt(Math.max(0.02, T) / 0.05)); // (Mersenne: the pitch as the root of the tension)
      const band = T > BAND[0] && T < BAND[1];
      if (band && r.scale?.length) m = inKey(m, r.root ?? 64, r.scale);
      const f = hz(m);
      str.frequency.setTargetAtTime(f, t, band ? 0.06 : 0.03); thrum.frequency.setTargetAtTime(f / 2, t, 0.06); whine.frequency.setTargetAtTime(f * 4, t, 0.03);
      res.frequency.setTargetAtTime(f * (2 + 5 * Math.min(1, T)), t, 0.05); res.Q.setTargetAtTime(3 + 9 * over, t, 0.1);
      g.gain.setTargetAtTime(T < 0.04 ? 0.0001 : 0.5, t, 0.15);
      thrumG.gain.setTargetAtTime(0.12 * Math.max(0, 1 - T / 0.5), t, 0.08); // (slack: a thrum)
      strG.gain.setTargetAtTime(0.05 + 0.1 * Math.min(1, T), t, 0.08);
      whineG.gain.setTargetAtTime(0.05 * over, t, 0.05); // (near the snap: the whine)
      vibG.gain.setTargetAtTime(6 + 30 * over, t, 0.1);
      if (S.dist == null || r.dist < S.dist) S.dist = r.dist;
      else if (r.dist - S.dist > CLICK_M) { S.dist = r.dist; this.dragClick(T); }
    }, 50);
  }
  lineSongEnd() {
    const S = this._song; if (!S) return; this._song = null; clearInterval(S.timer);
    const t = this.ctx.currentTime; S.g.gain.cancelScheduledValues(t); S.g.gain.setValueAtTime(S.g.gain.value, t); S.g.gain.setTargetAtTime(0.0001, t, 0.08);
    setTimeout(() => { for (const o of S.oscs) try { o.stop(); } catch { /* gone */ } S.g.disconnect(); }, 1500);
  }
  /** The drag giving line: one click of the ratchet, harder under load. */
  dragClick(k = 0.5) {
    if (!this.ok() || !this.allow('dragClick', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.12 + 0.12 * Math.min(1, k), 0.05);
    this.noise(t, 0.012, { type: 'bandpass', f0: 3400 + 600 * Math.random(), q: 6, gain: 0.5, dest: d });
    this.tone(t, 0.02, { f0: 1100, f1: 700, type: 'square', gain: 0.04, dest: d });
  }
  /** The fish held up to the camera (`angle.lift`). `grid`: game.music.grid(), for the key and the beat. */
  angleLift({ first = false, record = false, legend = false, quick = false } = {}, grid = null) {
    if (!this.ok() || !this.allow('angleLift', 1)) return;
    const now = this.ctx.currentTime, spb = grid?.spb || 0.4, t = grid?.spb ? grid.t0 + Math.ceil((now - grid.t0) / spb - 1e-6) * spb : now;
    const up = grid ? (((grid.root ?? 64) - 64) % 12 + 12) % 12 : 0, root = 72 + up, d = this.out(0.3, 0.6, true);
    const at = quick ? t : t + Math.min(0.12, spb / 3);
    if (!quick) [root - 5, root - 1].forEach((m, i) => this.tone(t + i * Math.min(0.06, spb / 6), 0.1, { f0: hz(m), type: 'triangle', gain: 0.18, dest: d })); // (the pickup: ta-)
    [0, 4, 7, 12].forEach((s) => { this.tone(at, quick ? 0.5 : 1.1, { f0: hz(root + s), type: 'triangle', gain: 0.12, dest: d }); this.tone(at, 0.6, { f0: hz(root + s + 12) * 1.002, gain: 0.04, dest: d }); }); // (-daa)
    this.tone(at, 1.4, { f0: hz(root + 24), gain: 0.06, dest: d }); this.tone(at, 0.6, { f0: hz(root + 24) * 2.76, gain: 0.015, dest: d }); // (the bell over it)
    this.noise(at, 0.6, { type: 'highpass', f0: 8000, gain: 0.05, attack: 0.02, dest: d });
    if (quick) return;
    const step = Math.min(0.08, spb / 4);
    if (first) [67, 69, 71, 74, 76].forEach((m, k) => this.tone(at + 0.25 + k * step, k === 4 ? 1.2 : 0.25, { f0: hz(m + 12 + up), gain: k === 4 ? 0.1 : 0.07, dest: d })); // (the Answer: a first)
    if (record) { [12, 16, 19, 24].forEach((s, k) => this.tone(at + 0.3 + k * step, 0.5, { f0: hz(root + s), type: 'triangle', gain: 0.07, dest: d })); this.noise(at, 1.2, { type: 'highpass', f0: 5000, gain: 0.08, attack: 0.9, dest: d }); }
    if (legend) { this.tone(at, 1.6, { f0: hz(root - 24), type: 'sawtooth', gain: 0.05, dest: d }); this.tone(at, 1.6, { f0: hz(root - 17), type: 'sawtooth', gain: 0.04, dest: d }); this.tone(at, 0.5, { f0: 80, f1: 45, gain: 0.5, dest: d }); }
  }
}
