// A sound bank of the one mixer (audio/sfx.js): the Dreamvane, the Crucibelle, the Lockheart (tools/).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//
// Prior art: the partials of a struck glass and of a singing bowl (inharmonic, two close modes beating: the "wah"); the tuning fork's
// pure fundamental and its high clang mode (about 6.25 times up) that dies within a breath; Skyward Sword's dowsing (a ping that
// quickens and rises as you near what you seek); Minnaert's bubble (a sine rising as it dies) for liquid drawn up a throat; the
// flapper of a prize wheel against its pins; a lock's ratchet and a hinge's creak (a resonance dragged across a band).
const PENTA = [88, 91, 93, 95, 98]; // (E6 G6 A6 B6 D7: crystals ring in the game's pentatonic, so many make a chord)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class ToolSounds {
  /** A crystal struck or rising: a glass's partials (1, 2.32, 4.25, 6.63), two of them a hair apart so the note breathes, and a tick. */
  chime(v = 1) {
    if (!this.ok() || !this.allow('chime', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.3 * v, 0.9), f = hz(PENTA[Math.floor(Math.random() * PENTA.length)]);
    for (const [r, a, len] of [[1, 0.32, 2.4], [1.004, 0.18, 2.1], [2.32, 0.1, 1.2], [4.25, 0.05, 0.6], [6.63, 0.025, 0.3]]) {
      this.tone(t, len, { f0: f * r, f1: f * r * 0.999, gain: a, dest: d });
    }
    this.noise(t, 0.012, { type: 'highpass', f0: 6000, gain: 0.25, dest: d });
  }

  /** The tuning fork: a pure A that lasts (about seven seconds), its clang (6.25 up) gone in a breath, a slow beat as it rings. While
   *  a crystal's reference is ringing (crystalRef) the fork is struck at that note instead: the fork IS the reference, not an A against it. */
  fork(v = 1) {
    if (!this.ok() || !this.allow('fork', 3)) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.3 * v, 0.6);
    const R = this.refPitch, f0 = R && t < R.until ? hz(R.midi) : 440;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.34, t + 0.004);
    g.gain.setTargetAtTime(0.0001, t + 0.01, 2.2); g.connect(d);
    const trem = c.createGain(); trem.gain.value = 0.85; const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 1.6; lg.gain.value = 0.15;
    l.connect(lg).connect(trem.gain); trem.connect(g);
    const o = c.createOscillator(); o.frequency.value = f0; o.connect(trem);
    o.start(t); o.stop(t + 7.5); l.start(t); l.stop(t + 7.5);
    this.tone(t, 0.18, { f0: f0 * 6.25, f1: f0 * 6.24, gain: 0.12, dest: d }); // (the clang)
    this.noise(t, 0.02, { type: 'bandpass', f0: 3500, q: 2, gain: 0.3, dest: d }); // (the strike)
  }

  /** The dowsing ping: a short rising blip, higher and brighter the nearer (k 0..1); the Dreamvane sets the rate. */
  dowse(k = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.16 + 0.12 * k, 0.35), f = 560 * Math.pow(2, k * 1.3);
    this.tone(t, 0.12, { f0: f * 0.94, f1: f, type: 'sine', gain: 0.45, dest: d });
    this.tone(t, 0.08, { f0: f * 2, f1: f * 2.02, type: 'sine', gain: 0.08 + 0.14 * k, dest: d });
  }

  /** The Lockheart drinking Lachryma: liquid drawn up a narrow throat (a gurgle, two bubbles, a thin whistle rising with k). */
  hoover(k = 1) {
    if (!this.ok() || !this.allow('hoover', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.24 * (0.5 + 0.5 * k), 0.4);
    this.noise(t, 0.18, { type: 'bandpass', f0: 380 + 500 * k, f1: 900 + 900 * k, q: 4, gain: 0.6, attack: 0.03, dest: d });
    for (const [dt, f] of [[0.02, 700 + Math.random() * 300], [0.09, 950 + Math.random() * 400]]) {
      this.tone(t + dt, 0.06, { f0: f, f1: f * 1.8, gain: 0.22, dest: d });
    }
    this.tone(t, 0.2, { f0: 1500 + 1200 * k, f1: 1700 + 1400 * k, gain: 0.03 + 0.04 * k, dest: d });
  }

  /** The roulette's flapper past a pin: a hard little clack, brighter the faster it still turns (k), a wooden knock under it. */
  wheelTick(k = 1) {
    if (!this.ok() || !this.allow('wheel', 30)) return;
    const t = this.ctx.currentTime, d = this.out(0.22 + 0.1 * (1 - k), 0.2);
    this.noise(t, 0.025, { type: 'bandpass', f0: 2400 + 1800 * k, q: 5, gain: 0.8, dest: d });
    this.tone(t, 0.04, { f0: 900 + 500 * k, f1: 700, type: 'triangle', gain: 0.16, dest: d });
    this.tone(t, 0.06, { f0: 240, f1: 180, type: 'sine', gain: 0.2 * (1.2 - k), dest: d });
  }

  /** A little brass coffin: opening, the key turns (three ratchet clicks), the hinge creaks up and the lid rings; shutting, the lid
   *  falls with a brass clank and the key turns back. */
  coffin(open = true) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.5);
    const key = (t0) => [0, 0.07, 0.13].forEach((dt, i) => this.noise(t0 + dt, 0.02, { type: 'bandpass', f0: 4200 - i * 400, q: 9, gain: 0.7, dest: d }));
    const ring = (t0, g) => { for (const [r, a] of [[1, 1], [2.71, 0.5], [5.2, 0.25], [8.3, 0.12]]) this.tone(t0, 0.9 / Math.sqrt(r), { f0: 640 * r, f1: 638 * r, gain: g * a, dest: d }); };
    if (open) {
      key(t);
      this.noise(t + 0.22, 0.45, { type: 'bandpass', f0: 900, f1: 1900, q: 14, gain: 0.35, attack: 0.08, dest: d }); // (the hinge)
      ring(t + 0.62, 0.1);
    } else {
      this.tone(t, 0.16, { f0: 150, f1: 90, type: 'triangle', gain: 0.5, dest: d });
      ring(t, 0.16);
      key(t + 0.3);
    }
  }

  /** The survey's swing (dreamvane.survey, as the heel goes up): air rising past the head of the vane, the fork's tines humming. */
  surveySwing() {
    if (!this.ok() || !this.allow('surveySwing', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4);
    this.noise(t, 0.45, { type: 'bandpass', f0: 500, f1: 1800, q: 1.4, gain: 0.5, attack: 0.25, dest: d });
    this.tone(t + 0.1, 0.45, { f0: 440, f1: 880, gain: 0.06, dest: d });
  }

  /** The world coming back after the Opening (lockheart.ultimate.end): time unstuck (a tape spinning up), a rush of air, a low boom. */
  ultimateEnd() {
    if (!this.ok() || !this.allow('ultimateEnd', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.5);
    this.noise(t, 0.5, { type: 'bandpass', f0: 200, f1: 4000, q: 1.2, gain: 0.5, attack: 0.4, dest: d });
    this.tone(t, 0.5, { f0: 40, f1: 160, type: 'sawtooth', gain: 0.06, dest: d });
    this.tone(t + 0.45, 0.6, { f0: 70, f1: 38, gain: 0.5, dest: d });
  }
}
