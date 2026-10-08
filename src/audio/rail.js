// A sound bank of the one mixer (audio/sfx.js): the crossing's rail shooter (docs/plans/RAIL.md), played along with its music, as Rez is.
//   RAILLOCK   the lock-on sweep's tone: one a paint, rising a degree of E minor each (the first lock E5, the eighth E6), a bright ping
//              with a tick, so a full sweep of eight plays the scale up an octave
//   RAILDOWN   a down: a pop of noise and a tuned ping on the E minor chord, deeper and longer for a greater class (a Guppy's a tick,
//              a Leviathan's a bell and a boom)
//   RAILSURFACE the ship crossing the crude's surface (the Umbral form's dive, the Astral form's breach: RAIL-OVERHAUL.md): a deep plop and
//              a burst of bubbles going down; spray and a rush of air coming up
// Both wait for the next sixteenth of the music playing (`grid`: game.music.grid()), so a crossing's shooting is part of its cue, and
// both are in its key (a leg of the crossing has its own: music/legs.js); with no music they sound at once, in E. Heard through audio/cues.js: `rail.lock { n }`, `rail.down { cls }` (Petra's rail emits them).
// Prior art: Rez (Mizuguchi, 2001: every shot and lock quantised to the music, the lock tones a rising scale), RayStorm's lock-on.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SCALE = [76, 78, 79, 81, 83, 84, 86, 88]; // (E minor from E5: a degree a lock, eight to the octave)
const DOWN = { 0: [88, 0.08, 0.5], 1: [83, 0.12, 0.6], 2: [79, 0.2, 0.8], 3: [76, 0.35, 1], 4: [64, 0.9, 1.4] }; // (class: the ping, its length, its weight)

export class RailSounds {
  /** The next sixteenth note of the music (`grid`: game.music.grid()), or now when nothing plays: Rez's quantise. */
  onSixteenth(grid) {
    const now = this.ctx.currentTime;
    if (!grid?.spb) return now;
    const step = grid.spb / 4;
    return grid.t0 + Math.ceil((now - grid.t0) / step - 1e-6) * step;
  }
  /** Semitones from E to the music's key, the short way (-6..5). */
  railKey(grid) { return grid?.root != null ? ((((grid.root - 64) % 12) + 18) % 12) - 6 : 0; }
  railLock(n = 0, grid = null) {
    if (!this.ok() || !this.allow('railLock', 24)) return;
    const t = this.onSixteenth(grid), m = SCALE[Math.max(0, Math.min(7, n))] + this.railKey(grid), d = this.out(0.22, 0.35);
    this.tone(t, 0.14, { f0: hz(m), type: 'sine', gain: 0.8, dest: d });
    this.tone(t, 0.08, { f0: hz(m + 12), type: 'triangle', gain: 0.25, dest: d });
    this.noise(t, 0.01, { type: 'highpass', f0: 6000, gain: 0.3, dest: d }); // (the tick of the paint)
  }
  railDown(cls = 0, grid = null) {
    if (!this.ok() || !this.allow('railDown', 16)) return;
    const t = this.onSixteenth(grid), [m0, len, w] = DOWN[Math.max(0, Math.min(4, cls))] || DOWN[0], m = m0 + this.railKey(grid), d = this.out(0.3 * w, 0.5);
    this.noise(t, 0.05 + len * 0.3, { type: 'bandpass', f0: 3000 / w, f1: 600 / w, q: 1.2, gain: 0.7, dest: d }); // (the pop)
    this.tone(t, len, { f0: hz(m), f1: hz(m) * 0.995, type: 'sine', gain: 0.5, dest: d }); // (the ping, on the chord)
    if (cls >= 2) this.tone(t, len * 0.8, { f0: 140 / w, f1: 45, gain: 0.5 * w, dest: d }); // (a body for the great)
  }
  /** The surface crossed: `down` true diving under (the Umbral form), false breaching above (the Astral). */
  railSurface(down = true) {
    if (!this.ok() || !this.allow('railSurface', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    if (down) {
      this.tone(t, 0.25, { f0: 220, f1: 60, type: 'sine', gain: 0.6, dest: d }); // (the plop)
      this.noise(t, 0.35, { type: 'lowpass', f0: 1800, f1: 300, gain: 0.5, dest: d });
      for (let k = 0; k < 7; k++) this.tone(t + 0.08 + k * 0.05, 0.06, { f0: 500 + k * 90, f1: 900 + k * 120, type: 'sine', gain: 0.12, dest: d }); // (bubbles)
    } else {
      this.noise(t, 0.5, { type: 'highpass', f0: 1200, f1: 4000, gain: 0.55, attack: 0.03, dest: d }); // (the spray)
      this.noise(t, 0.7, { type: 'bandpass', f0: 400, f1: 2400, q: 0.7, gain: 0.4, attack: 0.08, dest: d }); // (the air rushing)
      this.tone(t, 0.18, { f0: 90, f1: 160, type: 'sine', gain: 0.35, dest: d });
    }
  }
}
