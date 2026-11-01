// ---------------------------------------------------------------------------------------
// A SHRINE HEARD, AND THE WAKE FROM A WELL (Petra's world/shrines.js and world/well/dunemaw.js). A Shrine is where you rest, are made whole,
// travel from and go into the Spirit Garden: its voice is a temple bowl (a singing bowl's beating partials) and the suzu, the shrine bell's
// cluster of little bells shaken on its rope. The wake is the Wake Whistle's other half: the whistle's own breath is heard as it is blown
// (`wellEscapeStart`, audio/dunemaw.js); when the channel holds and you are taken out, the clay whistle cracks and the surface opens over you.
//   FIND     (shrine.find { shrine }) the bowl struck once, low, and the suzu answering up the pentatonic: you have found a place to rest
//   REST     (shrine.rest { shrine }) a long breath let out, the bowl rubbed into its hum, the pool filling like water poured into a jar
//            (a band of noise rising as the jar's air shortens), then the hum settled on a held fifth
//   TRAVEL   (shrine.travel { from, to }) the suzu shaken, a glide away under the seam, and the bowl struck where you are set down
//   STORAGE  (shrine.storage { shrine }) the storehouse's heavy wooden door slid aside and its knock home
//   WAKE     (well.leave { how: 'escape' }) the whistle cracking in the hand (fired clay's snap, a shard's ring), the cavern's air drawn
//            up and away, and the open sky over the Dunes: wind and a bright open chord
//
// Prior art: the Tibetan singing bowl (its two beating modes) and the Shinto suzu; Breath of the Wild's shrine chime (a place that is
// yours to rest in); Dark Souls' bonfire (the rest heard as the breath going out of you); Tarkov's extract (the way out heard at once).
//
//   sfx.shrineFind() .shrineRest() .shrineTravel() .shrineStorage() .wellWake()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const BOWL = 57; // (A3: the bowl's fundamental, under every cue's melody)
const SUZU = [84, 86, 88, 91, 93, 96]; // (the suzu's little bells up the pentatonic)
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { find: 1.9, rest: 2.8, travel: 1, storage: 0.8, wake: 1.6 };

export class ShrineSounds {
  shrineOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 9000); return d; }
  /** The bowl: its two near modes beating against each other, and its high partials, struck (or rubbed: `rub` the swell's length). */
  shrineBowl(t, dur, g, d, rub = 0) {
    const f = hz(BOWL);
    [[1, 1], [1.006, 0.8], [2.71, 0.3], [2.725, 0.25], [5.15, 0.08]].forEach(([r, k]) => {
      const c = this.ctx, o = c.createOscillator(), e = c.createGain();
      o.type = 'sine'; o.frequency.value = f * r;
      e.gain.setValueAtTime(0.0001, t);
      if (rub > 0) e.gain.exponentialRampToValueAtTime(g * k, t + rub); else e.gain.exponentialRampToValueAtTime(g * k, t + 0.006);
      e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(e).connect(d); o.start(t); o.stop(t + dur + 0.05);
    });
    if (!rub) this.noise(t, 0.02, { type: 'bandpass', f0: 1800, q: 2, gain: g * 1.5, dest: d }); // (the striker's knock)
  }
  /** The suzu shaken: `n` little bells in a ragged cluster. */
  shrineSuzu(t, n, g, d) {
    for (let i = 0; i < n; i++) {
      const at = t + i * 0.035 + Math.random() * 0.03, f = hz(SUZU[(i * 2 + (Math.random() * 2 | 0)) % SUZU.length]);
      this.tone(at, 0.4, { f0: f, gain: g, dest: d }); this.tone(at, 0.15, { f0: f * 2.4, gain: g * 0.3, dest: d });
      this.noise(at, 0.01, { type: 'highpass', f0: 6000, gain: g * 2, dest: d }); // (the pellet inside)
    }
  }

  shrineFind() {
    if (!this.ok() || !this.allow('shrineFind', 0.5)) return;
    const t = this.ctx.currentTime, d = this.shrineOut('find', 0.35, 0.8);
    this.shrineBowl(t, 3.2, 0.1, d);
    this.shrineSuzu(t + 0.5, 6, 0.03, d);
  }
  shrineRest() {
    if (!this.ok() || !this.allow('shrineRest', 0.3)) return;
    const t = this.ctx.currentTime, d = this.shrineOut('rest', 0.35, 0.8);
    this.noise(t, 1.2, { type: 'bandpass', f0: 900, f1: 400, q: 0.8, gain: 0.2, attack: 0.3, dest: d }); // (the breath let out)
    this.shrineBowl(t + 0.4, 3.6, 0.07, d, 1.2); // (the bowl rubbed into its hum)
    this.noise(t + 0.6, 1.6, { type: 'bandpass', f0: 500, f1: 2600, q: 6, gain: 0.25, attack: 0.2, dest: d }); // (poured into the jar: the air's note rising as it fills)
    this.tone(t + 2.2, 2, { f0: hz(BOWL + 7), gain: 0.04, dest: d }); this.tone(t + 2.2, 2, { f0: hz(BOWL + 12), gain: 0.025, dest: d }); // (settled on a fifth)
  }
  shrineTravel() {
    if (!this.ok() || !this.allow('shrineTravel', 0.5)) return;
    const t = this.ctx.currentTime, d = this.shrineOut('travel', 0.35, 0.7);
    this.shrineSuzu(t, 5, 0.03, d);
    this.noise(t + 0.15, 0.8, { type: 'bandpass', f0: 2400, f1: 500, q: 1, gain: 0.2, attack: 0.25, dest: d }); // (drawn away under the seam)
    this.shrineBowl(t + 0.95, 2.4, 0.08, d); // (set down before its stone)
  }
  shrineStorage() {
    if (!this.ok() || !this.allow('shrineStorage', 1)) return;
    const t = this.ctx.currentTime, d = this.shrineOut('storage', 0.35, 0.35);
    this.noise(t, 0.45, { type: 'lowpass', f0: 700, f1: 400, gain: 0.35, attack: 0.08, dest: d }); // (the heavy door sliding in its groove)
    for (let i = 0; i < 4; i++) this.noise(t + 0.05 + i * 0.09, 0.02, { type: 'bandpass', f0: 600 + Math.random() * 300, q: 3, gain: 0.15, dest: d }); // (its runner catching)
    this.tone(t + 0.48, 0.12, { f0: 180, f1: 120, type: 'triangle', gain: 0.25, dest: d }); this.noise(t + 0.48, 0.04, { type: 'bandpass', f0: 1100, q: 2, gain: 0.3, dest: d }); // (home against its post)
  }
  wellWake() {
    if (!this.ok() || !this.allow('wellWake', 0.5)) return;
    const t = this.ctx.currentTime, d = this.shrineOut('wake', 0.4, 0.7);
    this.noise(t, 0.03, { type: 'bandpass', f0: 3200, q: 2, gain: 0.5, dest: d }); [1, 2.3, 4.1].forEach((r, i) => this.tone(t, 0.25 / (1 + i), { f0: 1300 * r, gain: 0.05 / (1 + i), dest: d })); // (the whistle cracking: fired clay's snap)
    for (let i = 0; i < 4; i++) this.noise(t + 0.05 + i * 0.05 + Math.random() * 0.03, 0.015, { type: 'highpass', f0: 4000, gain: 0.2, dest: d }); // (its pieces)
    this.noise(t + 0.1, 1.1, { type: 'bandpass', f0: 200, f1: 1800, q: 0.7, gain: 0.3, attack: 0.6, dest: d }); // (the cavern's air drawn up)
    this.noise(t + 1.1, 2.2, { type: 'lowpass', f0: 1200, f1: 600, gain: 0.18, attack: 0.3, dest: d }); // (the open wind over the Dunes)
    [0, 7, 12, 16].forEach((s, i) => this.tone(t + 1.1 + i * 0.06, 2, { f0: hz(69 + s), type: i ? 'sine' : 'triangle', gain: 0.05, dest: d })); // (the sky open over you)
  }
}
