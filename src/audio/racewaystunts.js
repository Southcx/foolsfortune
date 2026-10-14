// A sound bank of the one mixer (audio/sfx.js): the Raceway's knocks and stunts, round six (docs/plans/SKIFF-RACING.md section 12;
// courier/skiff/ and world/raceway/, Dovina's events through audio/cues.js). Pitched things in E, the Raceway cue's key.
//   HULL      skiff.hull { damage, left }: the hull knocked, as hard as the damage; under 20 left, a low warning pip after it
//   WRECK     skiff.wreck: the board broken: a crunch, planks splintering, the sail's cloth tearing
//   REFILL    skiff.refill (each moment on a vein lane): a held Lachrymite shimmer rising as it fills, gone 0.4 real s after the last
//   SCORCH    skiff.scorch: the sail scorching: a hiss and a luff's flap
//   MANUAL    skiff.manual { seconds, fell }: the tail's scrape let go (longer for a longer balance), a thud if it fell
//   SHOULDER  skiff.shoulder: the side slam, a body blow;   NEAR MISS  skiff.nearmiss: Burnout's whoosh past
//   GAP       skiff.gap { points }: a named jump landed, a three-note fanfare up the triad, brighter for more points
//   BUOY      skiff.buoy { hit, power }: struck, a bell as high as its power; missed, a dull knock
//   POT       race.pot: a clay pot smashed (the clay folk's earthenware); TAUNT  race.taunt: the nemesis clapperjar's clap as it passes
// Prior art: Burnout's near miss and takedown crunch, Tony Hawk's manual scrape and named gaps, Wave Race 64's buoys (a ding passed, a
// thunk missed), the classic synthesis (noise bursts for wood breaking, a band-passed sweep for a whoosh).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class RacewayStuntSounds {
  skiffHull(damage = 10, left = 100) {
    if (!this.ok() || !this.allow('skiffHull', 8)) return;
    const k = Math.min(1, damage / 30), t = this.ctx.currentTime, d = this.out(0.5, 0.2);
    this.tone(t, 0.18, { f0: 150, f1: 70, type: 'triangle', gain: 0.25 + 0.35 * k, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: 900, q: 1.5, gain: 0.2 + 0.3 * k, dest: d });
    if (left < 20) [0.25, 0.45].forEach((s) => this.tone(t + s, 0.1, { f0: hz(64), type: 'square', gain: 0.05, dest: this.out(0.3, 0, true) })); // (the pool running low)
  }
  skiffWreck() {
    if (!this.ok() || !this.allow('skiffWreck', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.4);
    this.tone(t, 0.35, { f0: 120, f1: 40, gain: 0.6, dest: d }); this.noise(t, 0.5, { f0: 3000, f1: 300, gain: 0.5, dest: d });
    for (let i = 0; i < 10; i++) this.noise(t + 0.04 + i * 0.035 + Math.random() * 0.03, 0.03, { type: 'bandpass', f0: 1200 + Math.random() * 2500, q: 4, gain: 0.25, dest: d });
    this.noise(t + 0.15, 0.4, { type: 'bandpass', f0: 2500, f1: 1200, q: 2, gain: 0.2, dest: d }); // (the sail tearing)
  }
  skiffRefill() {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime;
    let R = this._refill;
    if (!R) {
      const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.loopBus || this.out(1, 0.5)); g.gain.setTargetAtTime(0.04, t, 0.1);
      const os = [83, 88, 95].map((m, i) => { const o = c.createOscillator(); o.frequency.value = hz(m); o.detune.value = i * 4; o.connect(g); o.start(); return o; });
      R = this._refill = { g, os, up: 0 };
    }
    R.up = Math.min(12, R.up + 0.05); R.os.forEach((o, i) => o.detune.setTargetAtTime(R.up * 100 + i * 4, t, 0.2)); // (rising as it fills)
    clearTimeout(R.quiet); R.quiet = setTimeout(() => { if (this._refill !== R) return; this._refill = null; R.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.15); setTimeout(() => { R.os.forEach((o) => { try { o.stop(); } catch { /* gone */ } }); R.g.disconnect(); }, 900); }, 400);
  }
  skiffScorch() {
    if (!this.ok() || !this.allow('skiffScorch', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.noise(t, 0.6, { type: 'highpass', f0: 3000, f1: 1500, gain: 0.2, dest: d });
    for (let i = 0; i < 4; i++) this.noise(t + 0.1 + i * 0.07, 0.05, { type: 'bandpass', f0: 600, q: 1.2, gain: 0.2, dest: d }); // (the luff's flap)
  }
  skiffManual(seconds = 1, fell = false) {
    if (!this.ok() || !this.allow('skiffManual', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2), len = Math.min(1.2, 0.2 + seconds * 0.3);
    this.noise(t, len, { type: 'bandpass', f0: 1800, f1: 900, q: 3, gain: 0.15, dest: d });
    if (fell) this.tone(t + len, 0.15, { f0: 120, f1: 60, gain: 0.35, dest: d });
  }
  skiffShoulder() {
    if (!this.ok() || !this.allow('skiffShoulder', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.2);
    this.tone(t, 0.2, { f0: 100, f1: 50, gain: 0.5, dest: d }); this.noise(t, 0.12, { f0: 1500, f1: 400, gain: 0.35, dest: d });
  }
  skiffNearMiss() {
    if (!this.ok() || !this.allow('skiffNearMiss', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.noise(t, 0.4, { type: 'bandpass', f0: 600, f1: 2600, q: 2, gain: 0.25, attack: 0.15, dest: d });
    this.tone(t, 0.4, { f0: 300, f1: 180, type: 'sawtooth', gain: 0.03, dest: d }); // (Doppler: it falls as it passes)
  }
  skiffGap(points = 100) {
    if (!this.ok() || !this.allow('skiffGap', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.45, true), up = points >= 500 ? 12 : 0;
    [76, 80, 83].forEach((m, k) => this.tone(t + k * 0.09, 0.45, { f0: hz(m + up), type: 'triangle', gain: 0.1, dest: d }));
  }
  skiffBuoy(hit = true, power = 0.5) {
    if (!this.ok() || !this.allow('skiffBuoy', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5);
    if (!hit) { this.tone(t, 0.15, { f0: 180, f1: 140, type: 'triangle', gain: 0.2, dest: d }); return; }
    const m = 76 + [0, 2, 4, 7, 9, 12][Math.max(0, Math.min(5, Math.round(power * 5)))];
    [1, 2.76].forEach((r, i) => this.tone(t, 1 / (1 + i), { f0: hz(m) * r, gain: i ? 0.03 : 0.11, dest: d }));
  }
  racePot() {
    if (!this.ok() || !this.allow('racePot', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.25);
    this.tone(t, 0.08, { f0: 520 + Math.random() * 200, f1: 300, type: 'triangle', gain: 0.25, dest: d });
    for (let i = 0; i < 6; i++) this.noise(t + Math.random() * 0.15, 0.03, { type: 'bandpass', f0: 1500 + Math.random() * 3000, q: 3, gain: 0.25, dest: d }); // (the sherds)
  }
  raceTaunt() {
    if (!this.ok() || !this.allow('raceTaunt', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.3);
    [0, 0.14].forEach((s) => { this.noise(t + s, 0.04, { type: 'bandpass', f0: 1400, q: 2, gain: 0.35, dest: d }); this.tone(t + s, 0.05, { f0: 700, f1: 500, type: 'triangle', gain: 0.15, dest: d }); }); // (two clay claps)
  }
}
