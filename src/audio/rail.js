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

// a foe kind's tell (RAIL-MODULES.md 3; the roster of 6), each from `now` to the shot at `land`, ending on it. The blocker fires nothing.
const TELL_VOICE = {
  plain: (s, now, land, len, d) => { s.noise(now, len, { type: 'bandpass', f0: 400, f1: 1800, q: 2, gain: 0.08, attack: len * 0.9, dest: d }); s.noise(land - 0.015, 0.015, { type: 'bandpass', f0: 3000, q: 6, gain: 0.3, dest: d }); },
  school: (s, now, land, len, d) => { for (let k = 0; k < 4; k++) s.tone(now + (k / 4) * len, 0.05, { f0: 300 + k * 120, f1: 500 + k * 160, gain: 0.05, dest: d }); s.tone(land - 0.02, 0.05, { f0: 700, f1: 1100, gain: 0.08, dest: d }); }, // (bubbles gathering in the mouth, a plip)
  darter: (s, now, land, len, d) => { s.tone(now, len, { f0: 900, f1: 2400, type: 'triangle', gain: 0.04, dest: d }); s.noise(land - 0.01, 0.012, { type: 'highpass', f0: 4000, gain: 0.25, dest: d }); }, // (a thin whistle drawn up)
  swooper: (s, now, land, len, d, form) => { const hi = form !== 'umbral'; s.riser(now, len, { f0: hi ? 880 : 140, f1: hi ? 1760 : 280, type: hi ? 'sine' : 'sawtooth', gain: hi ? 0.04 : 0.05, q: hi ? 0 : 6, dest: d }); }, // (its form heard: bright astral, dark umbral)
  heavy: (s, now, land, len, d) => { s.noise(now, len * 0.6, { type: 'lowpass', f0: 300, f1: 900, gain: 0.25, attack: len * 0.5, dest: d }); s.noise(now + len * 0.6, 0.03, { type: 'bandpass', f0: 1200, q: 5, gain: 0.3, dest: d }); s.tone(now + len * 0.62, 0.1, { f0: 220, f1: 160, type: 'triangle', gain: 0.12, dest: d }); }, // (a deep breath drawn, the breech clanked shut)
  turret: (s, now, land, len, d) => { for (let k = 0, n = 8; k < n; k++) s.noise(now + (k / n) * len, 0.03, { type: 'bandpass', f0: 160 + k * 25, q: 3, gain: 0.08 + k * 0.02, dest: d }); }, // (a drum roll building)
  rammer: (s, now, land, len, d) => { s.riser(now, len, { f0: 60, f1: 180, type: 'sawtooth', gain: 0.12, q: 4, dest: d }); s.noise(land - 0.04, 0.2, { type: 'bandpass', f0: 600, f1: 2000, q: 1.2, gain: 0.25, dest: d }); }, // (the engine's glow aft rising, then the charge's whoosh)
  sniper: (s, now, land, len, d) => { s.tone(now, len, { f0: 2093, f1: 2100, gain: 0.025, dest: d }); s.tone(now, len, { f0: 2093 * 1.006, gain: 0.02, dest: d }); for (let k = 0; k < 4; k++) s.noise(land - len + (k + 1) * len / 4 - 0.01, 0.01, { type: 'bandpass', f0: 3500, q: 9, gain: 0.25, dest: d }); }, // (the warning line held thin and beating, a tick a beat, the last on the beam)
  ambusher: (s, now, land, len, d) => { s.noise(now, len, { type: 'bandpass', f0: 2500, f1: 500, q: 1, gain: 0.12, attack: len * 0.95, dest: d }); s.tone(land - 0.02, 0.08, { f0: 330, f1: 200, type: 'square', gain: 0.06, dest: d }); }, // (a reversed swell from behind)
  mine: (s, now, land, len, d) => { for (let k = 0, x = 0, gap = len / 3; k < 12 && x < len - 0.02; k++, x += gap, gap = Math.max(0.04, gap * 0.6)) s.tone(now + x, 0.03, { f0: 1760, gain: 0.05, dest: d }); s.tone(land - 0.01, 0.05, { f0: 2349, gain: 0.08, dest: d }); }, // (beeping faster to its burst)
  escort: (s, now, land, len, d) => { [0, 0.06].forEach((x, k) => s.tone(land - 0.1 + x, 0.05, { f0: k ? 990 : 660, type: 'triangle', gain: 0.07, dest: d })); }, // (a slow aimed single: a polite two-note click on the shot)
  carrier: (s, now, land, len, d) => { s.noise(now, Math.min(0.15, len), { type: 'lowpass', f0: 500, gain: 0.2, dest: d }); s.noise(now + 0.1, Math.max(0.05, len - 0.1), { type: 'bandpass', f0: 1200, f1: 3000, q: 1.5, gain: 0.06, attack: 0.1, dest: d }); }, // (a port opening and its throat filling)
  sweeper: (s, now, land, len, d) => { s.riser(now, len, { f0: 300, f1: 900, type: 'sawtooth', gain: 0.05, q: 8, dest: d }); s.tone(land - 0.02, 0.4, { f0: 900, f1: 600, type: 'sawtooth', gain: 0.04, dest: d }); }, // (the beam's emitter charging, then lit)
  gunship: (s, now, land, len, d) => { for (let k = 0, x = 0, gap = 0.09; k < 64 && x < len - 0.02; k++, x += gap, gap = Math.max(0.025, gap * 0.82)) s.noise(now + x, 0.02, { type: 'bandpass', f0: 1400, q: 4, gain: 0.12, dest: d }); s.tone(now, len, { f0: 110, f1: 220, type: 'sawtooth', gain: 0.04, dest: d }); }, // (barrels spinning up)
  brig: (s, now, land, len, d) => { s.noise(now, 0.05, { type: 'lowpass', f0: 600, gain: 0.3, dest: d }); s.tone(now, 0.08, { f0: 120, f1: 90, gain: 0.2, dest: d }); s.noise(now + 0.06, Math.max(0.05, len - 0.06), { type: 'highpass', f0: 3500, gain: 0.05, dest: d }); }, // (the gunport lid thrown open, the fuse hissing)
};

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
  /** A foe's tell before its shot (RAIL-MODULES.md 3): heard from now until the shot's beat, landing on it as heard (music/clock.js
   *  `C`, the shot at `bar`/`beat`), in its kind's own voice (TELL_VOICE); an outlined shot always a bell rising to it (half a bar:
   *  answer it with the parry). With no clock it lasts a beat at 160 bpm. */
  railTell(C, bar, beat = 0, outlined = false, kind = null, form = null) {
    if (!this.ok() || !this.allow('railTell', 16)) return;
    const c = this.ctx, now = c.currentTime, u = C?.untilHeard ? C.untilHeard(bar, beat) : 0.375, land = now + Math.max(0.05, u - (C?.latency || 0));
    const len = land - now, d = this.out(outlined ? 0.26 : 0.2, 0.3);
    if (outlined) { this.riser(now, len, { f0: 660, f1: 1320, type: 'triangle', gain: 0.05, dest: d }); [1, 2.76].forEach((r, j) => this.tone(land - 0.02, 0.3, { f0: 1320 * r, gain: j ? 0.01 : 0.03, dest: d })); return; }
    (TELL_VOICE[kind] || TELL_VOICE.plain)(this, now, land, len, d, form);
  }
  /** The mast folding into the hull and standing again (Calissa's: on a form flip and a barrel roll): a ratchet of telescoping sections
   *  down, the canvas furled with a whump, then the snap of it set again; `dur` real s from fold to stand. */
  mastFold(dur = 0.6) {
    if (!this.ok() || !this.allow('mastFold', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.2), half = Math.max(0.12, dur / 2);
    for (let i = 0; i < 4; i++) this.tone(t + i * (half / 5), 0.04, { f0: 1500 - i * 220, type: 'square', gain: 0.05, dest: d });
    this.noise(t + half * 0.7, 0.12, { type: 'lowpass', f0: 900, f1: 300, gain: 0.25, dest: d }); // (the canvas furled)
    for (let i = 0; i < 3; i++) this.tone(t + half + i * (half / 4), 0.04, { f0: 900 + i * 260, type: 'square', gain: 0.05, dest: d });
    this.noise(t + dur, 0.06, { type: 'bandpass', f0: 1800, q: 1.2, gain: 0.3, dest: d }); // (the snap of the sail set again)
  }

}
