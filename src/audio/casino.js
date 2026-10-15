// A sound bank of the one mixer (audio/sfx.js): Raku's bazaar, its cage and its tables (world/bazaar/, progress/casino/, Dovina's; the
// events through audio/cues.js). Pitched things in F, the bazaar cue's key.
//   ENTER   bazaar.enter: the doors: a shop bell and the hall's murmur swelling for a moment
//   CHIPS   casino.chips: bought, chips clicked into a stack; cashed, cubes poured out
//   SIT     casino.sit: the chair drawn and the stake slid onto the felt
//   PLAY    casino.play { what }: flip, a card snapped over and a bell for its arcanum; steal, a sly slide down; fate (the Fate Clause), a
//           gong and a dark chord; four, four rising knocks; death (the round reset), a reversed swell into a low drum; hand (a Querent hand
//           won), a run up the triad; lock, a latch; upgrade (Zodiac), a twinkle rising
//   COUNT   casino.play { what: 'hand', steps, tier } (docs/plans/CASINO-CLARITY.md 8): the hand counted in its parts, Balatro's way: the
//           base set down, a tick a note higher up F major's scale for each `+`, a slam (a low hit and a fifth over it) for each `x`, the
//           reel's whirr and its stop, then the tier's flourish (1 a chime; 2 the triad rung; 3 the room's: a gong, a run and the hall's
//           roar). Paced by COUNT_PACE until Calissa's count-up emits its own steps; casinoTick/Mult/Reel/Flourish are hers to call.
//   NOVA    casino.play { what: 'nova' }: a Supernova: a sucked-in swell, then the boom and a bright ring
//   CALL    casino.play { what: 'callout', bluff }: caught (a bluff), a snap and a sly laugh of falling notes; true (the claim held), a
//           firm two-note seal; reveal, the reel's stop
//   HOWTO   casino.howto: a soft page turned
//   RESULT  casino.result { won }: won, coins and a bright chord; lost, a soft fall of three notes (never a sad trombone: the house is kind)
// Prior art: casino foley (chips are ceramic clicks, cards a papery snap), the Gold Saucer's jingles, Persona's Velvet Room for the arcana.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clicks = (s, t, n, d, gap = 0.04) => { for (let i = 0; i < n; i++) { const f = 2600 + Math.random() * 1400; s.tone(t + i * gap + Math.random() * 0.01, 0.03, { f0: f, f1: f * 0.9, type: 'triangle', gain: 0.07, dest: d }); s.noise(t + i * gap, 0.01, { type: 'highpass', f0: 5000, gain: 0.05, dest: d }); } };

const SCALE = [0, 2, 4, 5, 7, 9, 11]; // (F major: a tick's step up it)
const stepNote = (k) => 77 + SCALE[k % 7] + 12 * Math.floor(k / 7);
/** The count-up's pace in real seconds (Calissa's to match: the same numbers drive her boxes). */
export const COUNT_PACE = { base: 0.35, plus: 0.16, x: 0.32, reel: 0.9, hold: 0.2 };

export class CasinoSounds {
  /** One `+` step's tick, the kth (a note higher each). */
  casinoTick(k = 0, at = 0) {
    if (!this.ok()) return;
    const t = Math.max(this.ctx.currentTime, at), d = this.out(0.35, 0.25, true);
    this.tone(t, 0.12, { f0: hz(stepNote(k)), type: 'triangle', gain: 0.1, dest: d }); clicks(this, t, 1, d);
  }
  /** One `x` step's slam (n the multiplier: bigger hits harder). */
  casinoMult(n = 2, at = 0) {
    if (!this.ok()) return;
    const t = Math.max(this.ctx.currentTime, at), d = this.out(0.4, 0.35, true), k = Math.min(1, Math.log2(Math.max(2, n)) / 3);
    this.tone(t, 0.3, { f0: 110, f1: 55, gain: 0.3 + 0.15 * k, dest: d }); this.noise(t, 0.08, { type: 'lowpass', f0: 1500, gain: 0.2 + 0.1 * k, dest: d });
    [65, 72].forEach((m) => this.tone(t + 0.02, 0.5, { f0: hz(m), type: 'sawtooth', gain: 0.03 + 0.02 * k, dest: d }));
  }
  /** The reel: a whirr of clicks slowing over dur, and its stop. */
  casinoReel(dur = COUNT_PACE.reel, at = 0) {
    if (!this.ok()) return;
    const t = Math.max(this.ctx.currentTime, at), d = this.out(0.3, 0.2, true);
    for (let x = 0, gap = 0.025; x < dur; x += gap, gap *= 1.08) this.noise(t + x, 0.012, { type: 'bandpass', f0: 3200, q: 4, gain: 0.06, dest: d });
    this.noise(t + dur, 0.03, { type: 'bandpass', f0: 1800, q: 3, gain: 0.25, dest: d }); this.tone(t + dur, 0.15, { f0: 600, f1: 400, type: 'triangle', gain: 0.12, dest: d });
  }
  /** The tier's flourish: 1 a chime, 2 the triad rung, 3 the room's. */
  casinoFlourish(tier = 1, at = 0) {
    if (!this.ok()) return;
    const t = Math.max(this.ctx.currentTime, at), d = this.out(0.4, 0.55, true);
    if (tier <= 1) { [1, 2.76].forEach((r, i) => this.tone(t, 1, { f0: hz(89) * r, gain: i ? 0.03 : 0.08, dest: d })); return; }
    [77, 81, 84, 89].forEach((m) => this.tone(t, 1.6, { f0: hz(m), type: 'triangle', gain: 0.06, dest: d }));
    if (tier < 3) return;
    this.tone(t, 3, { f0: 87, f1: 85, gain: 0.3, dest: d }); this.tone(t, 3, { f0: 87 * 2.4, gain: 0.07, dest: d });
    [77, 81, 84, 89, 93, 96, 101].forEach((m, k) => this.tone(t + 0.15 + k * 0.06, 0.8, { f0: hz(m), gain: 0.06, dest: d }));
    for (const f of [400, 900, 2000]) this.noise(t + 0.3, 2.5, { type: 'bandpass', f0: f, q: 1.2, gain: 0.07, attack: 0.4, dest: d }); // (the hall's roar)
  }
  /** Querent's hand counted from its steps at COUNT_PACE: the base, the ticks, the slams, the reel, the flourish. */
  casinoCount(steps = [], tier = 1) {
    if (!this.ok() || !this.allow('casinoCount', 1)) return;
    const P = COUNT_PACE, d = this.out(0.35, 0.3, true); let t = this.ctx.currentTime, k = 0;
    this.tone(t, 0.2, { f0: hz(53), type: 'triangle', gain: 0.15, dest: d }); clicks(this, t, 3, d); t += P.base;
    for (const s of steps) {
      if (s.op === '+') { this.casinoTick(k++, t); t += P.plus; }
      else if (s.op === 'x') { this.casinoMult(s.n, t); t += P.x; }
    }
    this.casinoReel(P.reel, t); this.casinoFlourish(tier, t + P.reel + P.hold);
  }
  casinoNova() {
    if (!this.ok() || !this.allow('casinoNova', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.6, true);
    this.noise(t, 0.7, { type: 'bandpass', f0: 4000, f1: 300, q: 0.8, gain: 0.15, attack: 0.65, dest: d });
    this.tone(t + 0.7, 1.5, { f0: 70, f1: 30, gain: 0.5, dest: d }); this.noise(t + 0.7, 0.6, { type: 'lowpass', f0: 900, f1: 200, gain: 0.35, dest: d });
    [89, 96, 101].forEach((m) => this.tone(t + 0.75, 2, { f0: hz(m), gain: 0.04, dest: d }));
  }
  /** A bluff called: caught (it was one) or true (the claim held). */
  casinoCall(caught = false) {
    if (!this.ok() || !this.allow('casinoCall', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.35, true);
    this.noise(t, 0.03, { type: 'bandpass', f0: 2500, q: 2, gain: 0.3, dest: d });
    if (caught) [84, 81, 79, 76].forEach((m, k) => this.tone(t + 0.1 + k * 0.08, 0.15, { f0: hz(m), type: 'square', gain: 0.03, dest: d }));
    else [60, 65].forEach((m, k) => this.tone(t + 0.1 + k * 0.18, 0.5, { f0: hz(m), type: 'triangle', gain: 0.14, dest: d }));
  }
  casinoPage() {
    if (!this.ok() || !this.allow('casinoPage', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.2, true);
    this.noise(t, 0.22, { type: 'bandpass', f0: 2500, f1: 4500, q: 0.7, gain: 0.06, attack: 0.08, dest: d });
  }
  bazaarEnter() {
    if (!this.ok() || !this.allow('bazaarEnter', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5);
    [1, 2.4].forEach((r) => this.tone(t, 1.2, { f0: hz(89) * r, gain: r > 1 ? 0.03 : 0.08, dest: d }));
    for (const f of [500, 1100, 2400]) this.noise(t + 0.2, 2, { type: 'bandpass', f0: f, q: 1.5, gain: 0.05, attack: 0.6, dest: d });
  }
  casinoChips(cash = false) {
    if (!this.ok() || !this.allow('casinoChips', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.2, true);
    if (cash) for (let i = 0; i < 9; i++) this.tone(t + i * 0.035, 0.07, { f0: 1900 + Math.random() * 1600, gain: 0.04, dest: d }); else clicks(this, t, 5, d);
  }
  casinoSit() {
    if (!this.ok() || !this.allow('casinoSit', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.2);
    this.noise(t, 0.25, { type: 'bandpass', f0: 400, f1: 250, q: 1.5, gain: 0.15, dest: d }); this.noise(t + 0.3, 0.2, { type: 'bandpass', f0: 2000, q: 1, gain: 0.08, dest: d }); clicks(this, t + 0.45, 2, d);
  }
  casinoPlay(what = 'flip') {
    if (!this.ok() || !this.allow(`casinoPlay.${what}`, 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.4, true);
    switch (what) {
      case 'flip': this.noise(t, 0.04, { type: 'bandpass', f0: 3000, q: 1, gain: 0.25, dest: d }); [1, 2.76].forEach((r, i) => this.tone(t + 0.05, 0.9, { f0: hz(84) * r, gain: i ? 0.03 : 0.08, dest: d })); break;
      case 'steal': this.tone(t, 0.4, { f0: hz(84), f1: hz(72), type: 'triangle', gain: 0.1, dest: d }); break;
      case 'fate': this.tone(t, 2, { f0: 98, f1: 96, gain: 0.25, dest: d }); this.tone(t, 2, { f0: 98 * 2.4, gain: 0.06, dest: d }); [53, 56, 60].forEach((m) => this.tone(t + 0.1, 1.5, { f0: hz(m), type: 'triangle', gain: 0.05, dest: d })); break;
      case 'four': [0, 1, 2, 3].forEach((k) => this.tone(t + k * 0.12, 0.08, { f0: hz(65 + [0, 4, 7, 12][k]), type: 'triangle', gain: 0.12, dest: d })); break;
      case 'death': this.noise(t, 0.6, { type: 'bandpass', f0: 300, f1: 2500, q: 0.8, gain: 0.2, attack: 0.55, dest: d }); this.tone(t + 0.6, 0.4, { f0: 80, f1: 50, gain: 0.4, dest: d }); break;
      case 'hand': [77, 81, 84, 89].forEach((m, k) => this.tone(t + k * 0.07, 0.5, { f0: hz(m), gain: 0.09, dest: d })); break; // (a hand without steps)
      case 'reveal': this.casinoReel(0.5); break;
      case 'lock': this.noise(t, 0.02, { type: 'bandpass', f0: 2500, q: 5, gain: 0.3, dest: d }); this.tone(t + 0.03, 0.06, { f0: 900, f1: 700, type: 'triangle', gain: 0.12, dest: d }); break;
      case 'upgrade': [89, 93, 96, 101].forEach((m, k) => this.tone(t + k * 0.05, 0.4, { f0: hz(m), gain: 0.06, dest: d })); break;
      default: clicks(this, t, 2, d);
    }
  }
  casinoResult(won = false) {
    if (!this.ok() || !this.allow('casinoResult', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.45, true);
    if (won) { for (let i = 0; i < 12; i++) this.tone(t + i * 0.03, 0.08, { f0: 2000 + Math.random() * 1500, gain: 0.04, dest: d }); [65, 69, 72, 77].forEach((m) => this.tone(t + 0.1, 1.2, { f0: hz(m), type: 'triangle', gain: 0.07, dest: d })); }
    else [77, 74, 70].forEach((m, k) => this.tone(t + k * 0.15, 0.4, { f0: hz(m), type: 'triangle', gain: 0.07, dest: d }));
  }
}
