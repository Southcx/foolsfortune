// A sound bank of the one mixer (audio/sfx.js): the catch (docs/plans/SPIRIT-GARDEN.md, 5a): a Figment bound, by the Lockheart's
// summoning coffin or drawn into the Pneuka Jar by the god hand. A sting over whatever is playing: the Answer (G A B D E, the game's
// motif of a thing done) rung fast on glass in the key of the music, then the vessel closing: the coffin's lid (a low wooden clunk)
// or the Jar's stopper (a cork's pop and a ring of glass); a little air over it. It waits for the music's next beat, so it lands in time.
// Prior art: Pokemon's catch jingle (a short fanfare after the ball clicks shut), Zelda's item-get (the game's motif as the reward).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const ANSWER = [67, 69, 71, 74, 76]; // (G A B D E: music/motifs.js ANSWER)

export class CatchSounds {
  /** A Figment bound (`spirit.bind { from }`): 'lockheart' (the coffin) or 'hand' (the Jar). `grid`: game.music.grid(), for the key and the beat. */
  catchSting(from = 'hand', grid = null) {
    if (!this.ok() || !this.allow('catchSting', 2)) return;
    const now = this.ctx.currentTime, spb = grid?.spb || 0.4, t = grid?.spb ? grid.t0 + Math.ceil((now - grid.t0) / spb - 1e-6) * spb : now;
    const up = grid ? (((grid.root ?? 64) - 64) % 12 + 12) % 12 : 0, step = Math.min(0.09, spb / 4), d = this.out(0.2, 0.6);
    if (from === 'lockheart') { this.tone(t, 0.25, { f0: 140, f1: 70, type: 'triangle', gain: 0.6, dest: d }); this.noise(t, 0.08, { f0: 900, f1: 300, gain: 0.5, dest: d }); } // (the coffin's lid)
    else { this.noise(t, 0.04, { type: 'bandpass', f0: 1800, q: 4, gain: 0.7, dest: d }); this.tone(t + 0.01, 0.6, { f0: hz(100), type: 'sine', gain: 0.18, dest: d }); } // (the Jar's stopper, its glass)
    ANSWER.forEach((m, k) => { const s = t + 0.06 + k * step, f = hz(m + 12 + up), last = k === ANSWER.length - 1;
      this.tone(s, last ? 0.9 : 0.22, { f0: f, type: 'sine', gain: last ? 0.5 : 0.38, dest: d }); this.tone(s, last ? 0.5 : 0.12, { f0: f * 2.01, type: 'sine', gain: 0.12, dest: d }); });
    this.noise(t + 0.06 + 4 * step, 0.7, { type: 'highpass', f0: 7000, gain: 0.08, attack: 0.05, dest: d }); // (the air of it)
  }
}
