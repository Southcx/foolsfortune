// A sound bank of the one mixer (audio/sfx.js): the psygun's cylinder (its shells drawn as a revolver's cylinder of 1, 3, 5 or 7
// chambers: Calissa's tools' UI, mock round 9, not yet built nor signed off), each sound laid to her board's times in real seconds from
// the press, so the sound and the motion are one thing. A SKETCH: nothing calls these yet; once her board's beats are events, a line in
// audio/cues.js each.
//   DRAW       rising air as it grows whole, a soft tick as the ring lights (0.14)          STOW   falling air (0.4)
//   TURN       a breath (the hair back), the pawl's bright clean click (0.092), a faint brass ring-down
//   AUTO-TURN  a chamber's last shell (the moment to feel): the hammer's hard strike, the spent case tinkling away (and its second ting),
//              the two-tooth recock, the snap's whip with a dry tick a hollow chamber passed, THE click (heavier, brighter), the bead's
//              chime, the reserve re-arming (an intake pitched by tier)
//   SHOT       the recock and the chime         HOLLOW   a turn stopped on an empty chamber: a dead click, wood on steel, no ring
//   DRY        the hammer on nothing and a breath of puff, no chime         OPEN   hung open (every chamber empty): a hinge's swish, the gate's clack
//   RELOAD     from open: the shells seating up the scale, the swing home and its latch, the whirr with a tick a chamber, the landing click
//   PEPPERBOX  the heart: a heavy sliding thunk, a piston's hiss, a lower bigger click
// The shot itself is the psygun's (weapons.js gunshot): the cylinder adds only its mechanism. The chime is in A's pentatonic for now
// (the cue's scale, game.music.scale(), once it is called from where the music is known).
// Prior art: a Colt Single Action's hand, pawl and bolt (a tick a chamber, the bolt dropping home), Hunt: Showdown's and Bloodborne's
// cylinder foley, Ratchet & Clank's weapon-wheel ticks.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PENTA = [0, 2, 4, 7, 9];
const chimeOf = (k) => 81 + PENTA[k % 5] + 12 * Math.floor(k / 5); // (A5 up the pentatonic)

export class PsygunCylinderSounds {
  /** The pawl's click (i a count along a turn: a hair higher each; heavy, THE click of an auto-turn). */
  cylinderClick(i = 0, { at = 0, heavy = false } = {}) {
    if (!this.ok()) return;
    const t = Math.max(this.ctx.currentTime, at), d = this.out(heavy ? 0.42 : 0.3, 0.12), f = 3800 + 120 * Math.min(6, i) + (heavy ? 600 : 0);
    this.noise(t, heavy ? 0.018 : 0.012, { type: 'bandpass', f0: f, q: 10, gain: heavy ? 0.9 : 0.7, dest: d });
    this.tone(t, 0.03, { f0: 1500 + 40 * i, f1: 1100, type: 'triangle', gain: heavy ? 0.12 : 0.07, dest: d });
    if (heavy) this.tone(t, 0.05, { f0: 300, f1: 180, gain: 0.18, dest: d });
  }
  cylinderChime(k = 0, at = 0) {
    if (!this.ok()) return;
    const t = Math.max(this.ctx.currentTime, at), d = this.out(0.22, 0.4);
    [1, 2.76].forEach((r, j) => this.tone(t, 0.45, { f0: hz(chimeOf(k)) * r, gain: j ? 0.01 : 0.04, dest: d }));
  }
  cylinderDraw() {
    if (!this.ok() || !this.allow('cylinderDraw', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.2);
    this.noise(t, 0.14, { type: 'bandpass', f0: 600, f1: 2800, q: 1.2, gain: 0.12, attack: 0.1, dest: d });
    this.cylinderClick(0, { at: t + 0.14 });
  }
  cylinderStow() {
    if (!this.ok() || !this.allow('cylinderStow', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.2);
    this.noise(t, 0.4, { type: 'bandpass', f0: 2600, f1: 500, q: 1.2, gain: 0.1, dest: d });
  }
  /** The wheel turned a chamber by hand. */
  cylinderTurn() {
    if (!this.ok() || !this.allow('cylinderTurn', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.25);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1800, q: 1, gain: 0.06, attack: 0.03, dest: d }); // (the breath: the hair back)
    this.cylinderClick(0, { at: t + 0.092 });
    this.tone(t + 0.092, 0.21, { f0: 1245, gain: 0.015, dest: d }); this.tone(t + 0.092, 0.21, { f0: 1245 * 2.4, gain: 0.006, dest: d }); // (the brass ring-down)
  }
  /** A chamber's last shell spent, the cylinder turning itself: hollow chambers passed, the reserve's tier (1..4). */
  cylinderAutoTurn({ hollow = 0, tier = 1, bead = 0 } = {}) {
    if (!this.ok() || !this.allow('cylinderAutoTurn', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.3);
    this.noise(t, 0.02, { type: 'bandpass', f0: 2200, q: 2, gain: 0.8, dest: d }); this.tone(t, 0.04, { f0: 240, f1: 130, gain: 0.25, dest: d }); // (the hammer)
    [[0.02, 5200], [0.11, 4700], [0.3, 6100]].forEach(([x, f], j) => this.tone(t + x, 0.12, { f0: f, f1: f * 0.97, gain: j === 2 ? 0.012 : 0.02, dest: d })); // (the case tinkling away)
    [0.045, 0.07].forEach((x) => this.noise(t + x, 0.01, { type: 'bandpass', f0: 3000, q: 8, gain: 0.5, dest: d })); // (the two-tooth recock)
    this.noise(t + 0.06, 0.034, { type: 'bandpass', f0: 1200, f1: 4000, q: 1.5, gain: 0.15, dest: d }); // (the snap's whip)
    for (let k = 0; k < Math.min(6, hollow); k++) this.noise(t + 0.062 + k * 0.02, 0.006, { type: 'bandpass', f0: 1500, q: 6, gain: 0.35, dest: d }); // (a hollow chamber passed)
    this.cylinderClick(0, { at: t + 0.094, heavy: true });
    this.cylinderChime(bead, t + 0.1);
    this.noise(t + 0.104, 0.096, { type: 'bandpass', f0: 500 + 250 * tier, f1: 900 + 400 * tier, q: 2, gain: 0.08, attack: 0.06, dest: d }); // (the reserve re-arms)
  }
  /** A shot that leaves shells in the chamber: the recock and the chime. */
  cylinderShot(bead = 0) {
    if (!this.ok() || !this.allow('cylinderShot', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.15);
    [0.08, 0.13].forEach((x) => this.noise(t + x, 0.01, { type: 'bandpass', f0: 3000, q: 8, gain: 0.45, dest: d }));
    this.cylinderChime(bead, t + 0.1);
  }
  /** A turn that stops on an empty chamber. */
  cylinderHollow() {
    if (!this.ok() || !this.allow('cylinderHollow', 10)) return;
    const t = this.ctx.currentTime + 0.13, d = this.out(0.3, 0.08);
    this.noise(t, 0.025, { type: 'bandpass', f0: 900, q: 3, gain: 0.5, dest: d }); this.tone(t, 0.05, { f0: 260, f1: 200, type: 'triangle', gain: 0.1, dest: d });
  }
  /** The trigger on an empty chamber: one dull hammer and a breath of puff (the link's hum drops out 0..0.35: the link's own loop). */
  cylinderDry() {
    if (!this.ok() || !this.allow('cylinderDry', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.08);
    this.noise(t, 0.03, { type: 'lowpass', f0: 1200, gain: 0.5, dest: d }); this.tone(t, 0.05, { f0: 180, f1: 120, gain: 0.15, dest: d });
    this.noise(t + 0.01, 0.15, { type: 'bandpass', f0: 800, q: 0.8, gain: 0.05, dest: d });
  }
  /** Every chamber empty: the cylinder hung open. */
  cylinderOpen() {
    if (!this.ok() || !this.allow('cylinderOpen', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.15);
    this.noise(t + 0.1, 0.24, { type: 'bandpass', f0: 1400, f1: 2400, q: 2, gain: 0.1, dest: d });
    this.noise(t + 0.24, 0.025, { type: 'bandpass', f0: 2000, q: 3, gain: 0.6, dest: d }); this.tone(t + 0.24, 0.06, { f0: 400, f1: 300, type: 'triangle', gain: 0.1, dest: d });
  }
  /** Loaded from open: n shells seat, the swing home, the whirr past the chambers (slots), the landing. */
  cylinderReload(n = 7, slots = 7) {
    if (!this.ok() || !this.allow('cylinderReload', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.2), k = Math.max(1, n);
    for (let j = 0; j < k; j++) { const x = 0.05 + (k > 1 ? (j / (k - 1)) * 0.27 : 0); this.noise(t + x, 0.012, { type: 'bandpass', f0: 3400, q: 6, gain: 0.4, dest: d }); this.cylinderChime(j, t + x); }
    this.noise(t + 0.42, 0.16, { type: 'bandpass', f0: 900, f1: 1800, q: 1.5, gain: 0.08, dest: d });
    this.noise(t + 0.58, 0.03, { type: 'bandpass', f0: 2600, q: 3, gain: 0.7, dest: d }); this.tone(t + 0.58, 0.08, { f0: 520, f1: 360, type: 'square', gain: 0.05, dest: d });
    this.noise(t + 0.46, 0.9, { type: 'bandpass', f0: 2200, f1: 1400, q: 3, gain: 0.04, dest: d });
    const passes = Math.max(1, slots) * 2; // (the whirr twice round)
    for (let j = 0; j < passes; j++) this.cylinderClick(j % 7, { at: t + 0.46 + 0.9 * Math.sqrt(j / passes) });
    this.cylinderClick(0, { at: t + 1.36, heavy: true });
  }
  /** The heart (the Pepperbox's). */
  pepperbox() {
    if (!this.ok() || !this.allow('pepperbox', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.25);
    this.noise(t, 0.25, { type: 'lowpass', f0: 700, f1: 300, gain: 0.3, dest: d }); this.tone(t, 0.25, { f0: 110, f1: 70, gain: 0.25, dest: d });
    this.noise(t + 0.15, 0.2, { type: 'highpass', f0: 4000, gain: 0.08, attack: 0.02, dest: d });
    this.noise(t + 0.3, 0.02, { type: 'bandpass', f0: 2400, q: 6, gain: 0.8, dest: d }); this.tone(t + 0.3, 0.07, { f0: 200, f1: 120, gain: 0.25, dest: d });
  }
}
