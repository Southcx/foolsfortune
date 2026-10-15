// A sound bank of the one mixer (audio/sfx.js): Raku's bazaar, its cage and its tables (world/bazaar/, progress/casino/, Dovina's; the
// events through audio/cues.js). Pitched things in F, the bazaar cue's key.
//   ENTER   bazaar.enter: the doors: a shop bell and the hall's murmur swelling for a moment
//   CHIPS   casino.chips: bought, chips clicked into a stack; cashed, cubes poured out
//   SIT     casino.sit: the chair drawn and the stake slid onto the felt
//   PLAY    casino.play { what }: flip, a card snapped over and a bell for its arcanum; steal, a sly slide down; fate (the Fate Clause), a
//           gong and a dark chord; four, four rising knocks; death (the round reset), a reversed swell into a low drum; hand (a Querent hand
//           won), a run up the triad; lock, a latch; upgrade (Zodiac), a twinkle rising
//   RESULT  casino.result { won }: won, coins and a bright chord; lost, a soft fall of three notes (never a sad trombone: the house is kind)
// Prior art: casino foley (chips are ceramic clicks, cards a papery snap), the Gold Saucer's jingles, Persona's Velvet Room for the arcana.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clicks = (s, t, n, d, gap = 0.04) => { for (let i = 0; i < n; i++) { const f = 2600 + Math.random() * 1400; s.tone(t + i * gap + Math.random() * 0.01, 0.03, { f0: f, f1: f * 0.9, type: 'triangle', gain: 0.07, dest: d }); s.noise(t + i * gap, 0.01, { type: 'highpass', f0: 5000, gain: 0.05, dest: d }); } };

export class CasinoSounds {
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
      case 'hand': [77, 81, 84, 89].forEach((m, k) => this.tone(t + k * 0.07, 0.5, { f0: hz(m), gain: 0.09, dest: d })); break;
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
