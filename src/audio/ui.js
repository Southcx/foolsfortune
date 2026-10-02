// A sound bank of the one mixer (audio.js): the menus (ui/theme.js) and the System's chime.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class UiSounds {
  click() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0);
    this.tone(t, 0.03, { f0: 2200, f1: 1800, type: 'square', gain: 0.1, dest: d });
  }

  // the menus' four sounds (ui/theme.js), after the JRPG's: a dry tick as the glove moves, a bright two-note confirm, a falling
  // back, and a soft unfolding as a window opens. Short (the confirm is under 50 ms to its peak) and quiet: they are heard a lot.
  menuMove() {
    if (!this.ok() || !this.allow('menuMove', 30)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.05);
    this.tone(t, 0.035, { f0: 1760, f1: 1700, type: 'triangle', gain: 0.35, dest: d });
  }

  menuOk() {
    if (!this.ok() || !this.allow('menuOk', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.15);
    this.tone(t, 0.05, { f0: 1319, type: 'triangle', gain: 0.4, dest: d });
    this.tone(t + 0.045, 0.09, { f0: 1976, type: 'triangle', gain: 0.35, dest: d });
  }

  menuBack() {
    if (!this.ok() || !this.allow('menuBack', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.1);
    this.tone(t, 0.05, { f0: 1175, type: 'triangle', gain: 0.35, dest: d });
    this.tone(t + 0.045, 0.08, { f0: 784, type: 'triangle', gain: 0.3, dest: d });
  }

  menuOpen() {
    if (!this.ok() || !this.allow('menuOpen', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.35);
    this.noise(t, 0.12, { type: 'bandpass', f0: 900, f1: 3200, q: 1.2, gain: 0.5, attack: 0.03, dest: d });
    this.tone(t + 0.02, 0.16, { f0: 988, f1: 1480, type: 'sine', gain: 0.25, dest: d });
  }

  // the System: a little two-note chime, a bright one over a low one
  systemUnlock() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const d = this.out(0.5, 0.35);
    this.tone(t, 0.5, { f0: 392, f1: 392, type: 'triangle', gain: 0.22, dest: d });
    this.tone(t + 0.12, 0.7, { f0: 587, f1: 587, type: 'triangle', gain: 0.22, dest: d });
    this.tone(t + 0.26, 0.9, { f0: 784, f1: 784, type: 'sine', gain: 0.2, dest: d });
  }
}
