// (Every sound here goes out with `ui`: straight to main, never under the fog.)
// A sound bank of the one mixer (audio/sfx.js): the menus (ui/theme.js) and the System's chime.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class UiSounds {
  click() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0, true);
    this.tone(t, 0.03, { f0: 2200, f1: 1800, type: 'square', gain: 0.1, dest: d });
  }

  // the menus' four sounds (ui/theme.js), after the JRPG's: a dry tick as the glove moves, a bright two-note confirm, a falling
  // back, and a soft unfolding as a window opens. Short (the confirm is under 50 ms to its peak) and quiet: they are heard a lot.
  menuMove() {
    if (!this.ok() || !this.allow('menuMove', 30)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.05, true);
    this.tone(t, 0.035, { f0: 1760, f1: 1700, type: 'triangle', gain: 0.35, dest: d });
  }

  menuOk() {
    if (!this.ok() || !this.allow('menuOk', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.15, true);
    this.tone(t, 0.05, { f0: 1319, type: 'triangle', gain: 0.4, dest: d });
    this.tone(t + 0.045, 0.09, { f0: 1976, type: 'triangle', gain: 0.35, dest: d });
  }

  menuBack() {
    if (!this.ok() || !this.allow('menuBack', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.1, true);
    this.tone(t, 0.05, { f0: 1175, type: 'triangle', gain: 0.35, dest: d });
    this.tone(t + 0.045, 0.08, { f0: 784, type: 'triangle', gain: 0.3, dest: d });
  }

  menuOpen() {
    if (!this.ok() || !this.allow('menuOpen', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.35, true);
    this.noise(t, 0.12, { type: 'bandpass', f0: 900, f1: 3200, q: 1.2, gain: 0.5, attack: 0.03, dest: d });
    this.tone(t + 0.02, 0.16, { f0: 988, f1: 1480, type: 'sine', gain: 0.25, dest: d });
  }

  // the System: a little two-note chime, a bright one over a low one
  systemUnlock() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const d = this.out(0.5, 0.35, true);
    this.tone(t, 0.5, { f0: 392, f1: 392, type: 'triangle', gain: 0.22, dest: d });
    this.tone(t + 0.12, 0.7, { f0: 587, f1: 587, type: 'triangle', gain: 0.22, dest: d });
    this.tone(t + 0.26, 0.9, { f0: 784, f1: 784, type: 'sine', gain: 0.2, dest: d });
  }

  // the goals (Dovina's progress/goals.js: three achievements a game day): the gold check stamped in the goals window (Calissa's) and a
  // step of the Answer (G A B D E, music/motifs.js) for each goal done, the first three notes one a slot; all three done, the Answer
  // whole in bells over a shimmer. A game day's three laid: a soft chime of three, the System's.
  goalDone(slot = 0, all = false) {
    if (!this.ok() || !this.allow('goalDone', 3)) return;
    const t = this.ctx.currentTime, d = this.out(all ? 0.36 : 0.28, 0.45, true), hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    this.tone(t, 0.09, { f0: 180, f1: 90, gain: 0.3, dest: d }); this.noise(t, 0.04, { type: 'bandpass', f0: 1800, q: 1.5, gain: 0.2, dest: d }); // (the stamp)
    if (!all) { const m = [67, 69, 71][Math.max(0, Math.min(2, slot))]; [m, m + 12].forEach((n, j) => this.tone(t + 0.06 + j * 0.09, 0.6, { f0: hz(n), type: 'triangle', gain: 0.12, dest: d })); return; }
    [67, 69, 71, 74, 76].forEach((m, j) => { this.tone(t + 0.06 + j * 0.08, 1.1, { f0: hz(m + 12), gain: 0.13, dest: d }); this.tone(t + 0.06 + j * 0.08, 0.4, { f0: hz(m + 12) * 2.76, gain: 0.02, dest: d }); });
    this.noise(t + 0.4, 1.4, { type: 'highpass', f0: 7000, gain: 0.07, attack: 0.15, dest: d });
  }
  goalsSet() {
    if (!this.ok() || !this.allow('goalsSet', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.5, true);
    [76, 83, 88].forEach((m, j) => this.tone(t + j * 0.14, 0.8, { f0: 440 * Math.pow(2, (m - 69) / 12), gain: 0.08, dest: d }));
  }
}
