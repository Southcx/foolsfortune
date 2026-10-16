// A sound bank of the one mixer (audio/sfx.js): the Raceway's ways to race, round six (docs/plans/SKIFF-RACING.md section 12): the
// flyover, a restart and a rewind, the licence tests, the cups, City Trial and the wager, and the antlion's chase's stings (its pursuit
// layer is the cue's: music/raceway.js). Through audio/cues.js; pitched things in E.
//   FLYOVER   race.flyover: a wide breath of air as the camera sweeps the course;   RESTART  race.restart: a click and a swell back
//   REWIND    race.rewind { seconds }: a tape spun back (a falling, warbling tone and hiss) as long as it rewinds
//   LICENCE   licence.fail: two notes falling a tritone;   CUP  cup.race: a fanfare's opening; cup.finish { place }: a podium chord
//   CITY      citytrial.start: a horn; citytrial.clock { left }: a tick in the last ten real seconds, higher as it runs out;
//             citytrial.patch: a pickup's chime; citytrial.stadium: a crowd's roar swelling
//   WAGER     wager.place: coins stacked;   wager.settle { won }: coins poured (won) or a purse snapped shut (lost)
//   ESCAPE    race.escape.wake: the sand groaning, a low rumble rising; race.escape.caught: the maw's snap (the chase's layer is the cue)
// Prior art: Forza's and Gran Turismo's rewind (the tape sound), Kirby Air Ride's City Trial (the stadium's roar), GT's licence
// fail, Mario Kart's podium, a cassette spun back by hand.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class RacewayModeSounds {
  raceFlyover() { if (!this.ok() || !this.allow('raceFlyover', 1)) return; const t = this.ctx.currentTime; this.noise(t, 3, { type: 'bandpass', f0: 300, f1: 1200, q: 0.6, gain: 0.12, attack: 1, dest: this.out(0.4, 0.5) }); }
  raceRestart() {
    if (!this.ok() || !this.allow('raceRestart', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.3, true); this.noise(t, 0.02, { type: 'bandpass', f0: 3000, q: 5, gain: 0.3, dest: d });
    this.noise(t + 0.05, 0.6, { type: 'bandpass', f0: 400, f1: 2000, q: 0.8, gain: 0.2, attack: 0.4, dest: d });
  }
  raceRewind(seconds = 2) {
    if (!this.ok() || !this.allow('raceRewind', 2)) return;
    const len = Math.max(0.4, Math.min(1.5, seconds * 0.3)), t = this.ctx.currentTime, d = this.out(0.35, 0.2), c = this.ctx;
    const o = c.createOscillator(), g = c.createGain(), w = c.createOscillator(), wg = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(220, t + len);
    w.frequency.value = 11; wg.gain.value = 60; w.connect(wg).connect(o.frequency); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.05); g.gain.linearRampToValueAtTime(0.0001, t + len);
    o.connect(lp).connect(g).connect(d); o.start(t); w.start(t); o.stop(t + len + 0.05); w.stop(t + len + 0.05);
    this.noise(t, len, { type: 'highpass', f0: 4000, gain: 0.08, dest: d }); // (the tape's hiss)
  }
  licenceFail() { if (!this.ok()) return; const t = this.ctx.currentTime, d = this.out(0.3, 0.3, true); [[76, 0], [70, 0.2]].forEach(([m, s]) => this.tone(t + s, 0.45, { f0: hz(m), type: 'triangle', gain: 0.1, dest: d })); }
  cupRace() { if (!this.ok()) return; const t = this.ctx.currentTime, d = this.out(0.35, 0.4, true); [64, 71, 76].forEach((m, k) => this.tone(t + k * 0.12, 0.5, { f0: hz(m), type: 'square', gain: 0.05, dest: d })); }
  cupFinish(place = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5, true), chord = place === 1 ? [64, 68, 71, 76] : place <= 3 ? [64, 68, 71] : [64, 67, 71]; // (a podium major; off it, minor)
    chord.forEach((m, k) => this.tone(t + k * 0.05, 1.4, { f0: hz(m), type: 'triangle', gain: 0.07, dest: d }));
  }
  cityTrialStart() { if (!this.ok()) return; const t = this.ctx.currentTime, d = this.out(0.4, 0.4); [64, 71].forEach((m) => this.tone(t, 0.8, { f0: hz(m - 12), type: 'sawtooth', gain: 0.05, dest: d })); }
  cityTrialClock(left = 30) {
    if (left > 10 || !this.ok() || !this.allow('cityTrialClock', 2)) return;
    const t = this.ctx.currentTime; this.tone(t, 0.05, { f0: hz(76 + Math.max(0, 10 - Math.ceil(left))), type: 'square', gain: 0.05, dest: this.out(0.3, 0, true) });
  }
  cityTrialPatch() { if (!this.ok() || !this.allow('cityTrialPatch', 6)) return; const t = this.ctx.currentTime, d = this.out(0.3, 0.3, true); [83, 88].forEach((m, k) => this.tone(t + k * 0.06, 0.3, { f0: hz(m), gain: 0.09, dest: d })); }
  cityTrialStadium() {
    if (!this.ok()) return; const t = this.ctx.currentTime, d = this.out(0.4, 0.6);
    for (const f of [500, 1100, 2400]) this.noise(t, 3, { type: 'bandpass', f0: f, q: 1.5, gain: 0.12, attack: 1.2, dest: d }); // (a crowd's roar)
  }
  wagerPlace() { if (!this.ok()) return; const t = this.ctx.currentTime, d = this.out(0.3, 0.2, true); for (let i = 0; i < 4; i++) this.tone(t + i * 0.05, 0.06, { f0: 2400 + i * 150, gain: 0.05, dest: d }); }
  wagerSettle(won = true) {
    if (!this.ok()) return; const t = this.ctx.currentTime, d = this.out(0.3, 0.3, true);
    if (won) for (let i = 0; i < 10; i++) this.tone(t + i * 0.035, 0.08, { f0: 2000 + Math.random() * 1500, gain: 0.04, dest: d });
    else this.tone(t, 0.08, { f0: 300, f1: 200, type: 'triangle', gain: 0.15, dest: d });
  }
  escapeWake() { if (!this.ok() || !this.allow('escapeWake', 1)) return; const t = this.ctx.currentTime, d = this.out(0.6, 0.4); this.noise(t, 2, { f0: 120, f1: 300, gain: 0.4, attack: 1, dest: d }); this.tone(t, 2, { f0: 36, f1: 44, type: 'sawtooth', gain: 0.08, dest: d }); }
  escapeCaught() {
    if (!this.ok() || !this.allow('escapeCaught', 1)) return; const t = this.ctx.currentTime, d = this.out(0.6, 0.4);
    this.tone(t, 0.25, { f0: 90, f1: 35, gain: 0.7, dest: d }); this.noise(t, 0.4, { f0: 2000, f1: 200, gain: 0.5, dest: d }); this.noise(t + 0.2, 1.2, { f0: 600, f1: 150, gain: 0.25, dest: d }); // (the maw's snap, the sand pouring in)
  }
}
