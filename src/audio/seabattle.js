// ---------------------------------------------------------------------------------------
// THE SHIP'S FIGHT AT THE HELM (the open sea: world/opensea/seafight.js and seamounts.js, Petra's events; the hunter's own sounds are
// audio/seaserpent.js). The ship answering back:
//   A BROADSIDE   sea.broadside { side, guns }: the guns of one side going off in a ripple from bow to stern, each a low thump and a crack,
//                 panned to that side, landing on the cue's next sixteenth (Rez), so a volley is a fill in the hunt's gallop. Its heard
//                 moment is told as `sea.report { at, side }` (`at`: real s until it is heard) for the muzzles' flash (Calissa's).
//   NOT READY     sea.broadside.dry: a match snapped on an empty touch-hole, a hiss
//   A MOUNT       sea.mount { tool, ok }: each worn tool's own voice at sea: the Lockheart's harpoon (a chain paid out, a bite), the
//                 Crucibelle's foghorn (an instrument: a low horn on the cue's root and fifth, out over the water), the Dreamvane's sonar (a
//                 ping and its echo off something far), the Soul Brush's fire paint (a wet throw catching); anything else a light release.
//                 Refused (no charges, the pool, not ready): a dull click.
//   MENDED        sea.mend { hull, of }: a few mallet knocks on a timber, brighter the whole the hull is
// On a phone a broadside fires at most six of its guns (PHONE: the audio thread's budget, audio/core.js).
// Prior art: Sea of Thieves' cannons (each gun heard down the hull), Assassin's Creed IV's broadsides, Wind Waker's cannon on the beat
// of nothing; Rez's quantise for the landing.
//
//   sfx.seaBroadside(side, guns, grid) -> at   .seaBroadsideDry()   .seaMount(tool, ok, grid)   .seaMend(hull, of)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class SeaBattleSounds {
  /** One side's guns, rippling bow to stern from the cue's next sixteenth; returns real s until it is heard (or null if it does not sound). */
  seaBroadside(side = 1, guns = 4, grid = null) {
    if (!this.ok() || !this.allow('seaBroadside', 2)) return null;
    const c = this.ctx, t = this.onSixteenth ? this.onSixteenth(grid) : c.currentTime, n = Math.max(1, Math.min(this.phone ? 6 : 12, guns | 0));
    const p = c.createStereoPanner(); p.pan.value = Math.sign(side || 1) * 0.55;
    const d = this.out(0.5, 0.55); p.connect(d);
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.055 + Math.random() * 0.012;
      this.tone(at, 0.45, { f0: 95 - k * 2, f1: 38, gain: 0.55, dest: p }); // (the thump)
      this.noise(at, 0.09, { type: 'bandpass', f0: 1600, f1: 500, q: 0.8, gain: 0.42, dest: p }); // (the crack)
    }
    this.noise(t + 0.08, 1.2 + n * 0.05, { type: 'lowpass', f0: 900, f1: 180, gain: 0.18, attack: 0.05, dest: p }); // (the rumble rolling off the water)
    setTimeout(() => p.disconnect(), (t - c.currentTime + 2.5) * 1000);
    return Math.max(0, t - c.currentTime);
  }
  seaBroadsideDry() {
    if (!this.ok() || !this.allow('seaBroadsideDry', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.15);
    this.noise(t, 0.02, { type: 'highpass', f0: 3000, gain: 0.4, dest: d }); this.noise(t + 0.03, 0.35, { type: 'highpass', f0: 5000, f1: 7000, gain: 0.08, attack: 0.02, dest: d });
  }
  /** A worn tool used at sea (`ok` false: refused). The foghorn plays in the cue's key (`grid`: game.music.grid()). */
  seaMount(tool = '', ok = true, grid = null) {
    if (!this.ok() || !this.allow(`seaMount.${tool}`, ok ? 3 : 2)) return;
    const t = this.ctx.currentTime;
    if (!ok) { const d = this.out(0.18, 0.1); this.tone(t, 0.06, { f0: 180, f1: 140, type: 'square', gain: 0.12, dest: d }); return; }
    if (tool === 'lockheart') {
      const d = this.out(0.36, 0.3);
      for (let k = 0; k < 9; k++) this.noise(t + k * 0.03, 0.02, { type: 'bandpass', f0: 2600 + (k % 3) * 400, q: 6, gain: 0.22, dest: d }); // (the chain paid out)
      this.tone(t + 0.32, 0.25, { f0: 140, f1: 60, gain: 0.45, dest: d }); this.noise(t + 0.32, 0.06, { type: 'bandpass', f0: 900, q: 2, gain: 0.3, dest: d }); // (the bite)
    } else if (tool === 'crucibelle') {
      const root = (grid?.root ?? 52) % 12 + 36, d = this.out(0.3, 0.8); // (the horn low: the cue's root two octaves down, and its fifth)
      for (const [m, g] of [[root, 0.08], [root + 7, 0.05], [root + 12, 0.025]]) { this.riser(t, 0.25, { f0: hz(m) * 0.94, f1: hz(m), gain: g, q: 2, dest: d }); this.tone(t + 0.25, 1.9, { f0: hz(m), f1: hz(m) * 0.985, type: 'sawtooth', gain: g * 0.7, dest: d }); }
    } else if (tool === 'dreamvane') {
      const d = this.out(0.22, 0.9);
      this.tone(t, 0.5, { f0: 1480, f1: 1460, gain: 0.25, dest: d }); this.tone(t + 0.75, 0.4, { f0: 1480, f1: 1450, gain: 0.07, dest: d }); // (the ping and its echo off something far)
    } else if (tool === 'soulbrush') {
      const d = this.out(0.3, 0.35);
      this.noise(t, 0.25, { type: 'lowpass', f0: 1800, f1: 600, gain: 0.35, dest: d }); this.noise(t + 0.18, 0.7, { type: 'bandpass', f0: 700, f1: 1500, q: 0.7, gain: 0.2, attack: 0.08, dest: d }); // (thrown wet, catching)
    } else {
      const d = this.out(0.22, 0.3); this.noise(t, 0.12, { type: 'bandpass', f0: 1200, f1: 2400, q: 1, gain: 0.25, dest: d });
    }
  }
  /** The hull mended (`hull` of `of` hits it can bear): mallet knocks, brighter the whole it is. */
  seaMend(hull = 3, of = 6) {
    if (!this.ok() || !this.allow('seaMend', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3), k = Math.max(0, Math.min(1, hull / Math.max(1, of)));
    for (let i = 0; i < 3; i++) { this.tone(t + i * 0.18, 0.12, { f0: 300 + 140 * k + i * 30, f1: 180, type: 'triangle', gain: 0.3, dest: d }); this.noise(t + i * 0.18, 0.02, { type: 'bandpass', f0: 1800, q: 3, gain: 0.2, dest: d }); }
  }
}
