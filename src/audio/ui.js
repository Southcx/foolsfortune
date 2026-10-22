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

  // the chatroom (co-op as our chatroom: a division's line in the log, Petra's round of 2026-10-22): a short motif a division, so the ear
  // knows who spoke before the eye reads it (as a phone's ring a person); each its suit's matter:
  //   petra   pentacles, the stonemason: two stones knocked, a fifth down (marimba-dry, low)
  //   dovina  the trumps, the gambler: a die's rattle and a coin's two notes up
  //   wanda   wands, the bandleader: a quick brass call up the chord, a grace note into it
  //   calissa cups, the glazer: a glass rim rung, rising, with its shimmer
  //   espada  swords, the librarian: a blade's ring drawn and a high bell over it (the sharpest sword is wit)
  //   a guest or the owner: a soft bell, two notes, the Answer's first step
  chatMotif(who = 'guest') {
    if (!this.ok() || !this.allow(`chatMotif.${who}`, 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.35, true), hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    if (who === 'petra') [[57, 0], [50, 0.11]].forEach(([m, x]) => { this.tone(t + x, 0.12, { f0: hz(m), f1: hz(m) * 0.98, type: 'triangle', gain: 0.35, dest: d }); this.noise(t + x, 0.02, { type: 'bandpass', f0: 1800, q: 2, gain: 0.25, dest: d }); });
    else if (who === 'dovina') { for (let i = 0; i < 4; i++) this.noise(t + i * 0.035, 0.015, { type: 'bandpass', f0: 2500 + i * 400, q: 4, gain: 0.25, dest: d }); [79, 86].forEach((m, i) => this.tone(t + 0.16 + i * 0.08, 0.3, { f0: hz(m), type: 'triangle', gain: 0.14, dest: d })); }
    else if (who === 'wanda') [[75, 0, 0.03], [76, 0.03, 0.08], [80, 0.11, 0.08], [83, 0.19, 0.22]].forEach(([m, x, l]) => { this.tone(t + x, l + 0.05, { f0: hz(m), type: 'sawtooth', gain: 0.05, dest: d }); this.tone(t + x, l + 0.05, { f0: hz(m) * 1.004, type: 'square', gain: 0.025, dest: d }); });
    else if (who === 'calissa') { this.tone(t, 0.9, { f0: hz(88), f1: hz(90), gain: 0.12, dest: d }); this.tone(t, 0.6, { f0: hz(88) * 2.32, gain: 0.03, dest: d }); this.noise(t + 0.05, 0.5, { type: 'highpass', f0: 8000, gain: 0.04, attack: 0.1, dest: d }); }
    else if (who === 'espada') { this.noise(t, 0.18, { type: 'bandpass', f0: 5000, f1: 8000, q: 6, gain: 0.2, dest: d }); this.tone(t + 0.12, 0.7, { f0: hz(93), gain: 0.08, dest: d }); }
    else [67, 69].forEach((m, i) => this.tone(t + i * 0.12, 0.6, { f0: hz(m + 12), gain: 0.08, dest: d }));
  }
  /** A guest come into your world: in the Spirit Garden, a knock at the torii and the Jar's two hops landing, the Answer's opening
   *  under it; elsewhere a door's chime. `gone`: the same falling (they have gone home). */
  guestArrive(inGarden = false, gone = false) {
    if (!this.ok() || !this.allow('guestArrive', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.5, true), hz = (m) => 440 * Math.pow(2, (m - 69) / 12), seq = gone ? [74, 71, 69, 67] : [67, 69, 71, 74];
    if (inGarden && !gone) { [0, 0.16].forEach((x) => this.noise(t + x, 0.05, { type: 'lowpass', f0: 900, gain: 0.35, dest: d })); [0.4, 0.62].forEach((x, i) => this.tone(t + x, 0.12, { f0: 220 + i * 40, f1: 140, gain: 0.25, dest: d })); }
    const t2 = t + (inGarden && !gone ? 0.75 : 0); seq.forEach((m, i) => this.tone(t2 + i * 0.13, 0.9, { f0: hz(m + 12), type: 'triangle', gain: 0.1, dest: d }));
  }
}
