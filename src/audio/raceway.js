// A sound bank of the one mixer (audio/sfx.js): the Raceway's time trial and the Solar Skiff's racing moves (docs/plans/SKIFF-RACING.md;
// world/raceway/race.js and courier/skiff/skiff.js, their events through audio/cues.js). Everything pitched is in E, the Raceway cue's key.
//   COUNT   race.count { n }: a beep for 3, 2, 1 (B, the dominant: a question); race.go: E an octave up, a chord under it (the answer)
//   SOLAR   race.solarstart: the sail run up on GO: a sunburst, E major spread fast up three octaves over a rush of air
//   CARVE   skiff.carve.charge { tier }: a step of the triad for each tier charged (E, G#, B), a rising hum under; skiff.carve { tier }:
//           let go, a whoosh as long and bright as its tier, the tier's note on top
//   PLATE   skiff.plate: a sun plate run over: a gold ping (E and B) and a boost's rush;   POP  skiff.pop: a spring off the lip
//   GATE    race.gate { split }: a chime; ahead of your best lap a fourth up, behind it a step down, no best yet the root
//   LAP     race.lap { seconds, best }: two notes at the line, and a run up the triad when it is a new best
//   LAND    skiff.landhard: the hull slapping the sand, a thud and grit;   FINISH  race.finish { medal }: a bell a step of the medal
// Prior art: Mario Kart's countdown (three low beeps, one high: the most learned countdown there is) and its rocket start; SSX's and
// Wave Race's boost whooshes; Trackmania's checkpoint chime that says ahead or behind before you read the split.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TRIAD = [76, 80, 83]; // (E5 G#5 B5)

export class RacewaySounds {
  raceCount(n = 3) {
    if (!this.ok() || !this.allow('raceCount', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.2, true);
    this.tone(t, 0.22, { f0: hz(71), type: 'square', gain: 0.1, dest: d }); this.tone(t, 0.22, { f0: hz(83), gain: 0.06, dest: d });
  }
  raceGo() {
    if (!this.ok() || !this.allow('raceGo', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.3, true);
    this.tone(t, 0.6, { f0: hz(88), type: 'square', gain: 0.1, dest: d }); [64, 68, 71, 76].forEach((m) => this.tone(t, 0.7, { f0: hz(m), type: 'triangle', gain: 0.08, dest: d }));
  }
  raceSolarStart() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.5);
    [64, 68, 71, 76, 80, 83, 88, 92, 95, 100].forEach((m, k) => this.tone(t + k * 0.03, 0.8, { f0: hz(m), gain: 0.07, dest: d }));
    this.noise(t, 0.9, { type: 'bandpass', f0: 600, f1: 4000, q: 0.8, gain: 0.5, attack: 0.05, dest: d });
  }
  carveCharge(tier = 1) {
    if (!this.ok() || !this.allow('carveCharge', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.25), m = TRIAD[Math.max(0, Math.min(2, tier - 1))];
    this.tone(t, 0.25, { f0: hz(m), type: 'triangle', gain: 0.12, dest: d }); this.tone(t, 0.3, { f0: hz(m - 24), f1: hz(m - 22), type: 'sawtooth', gain: 0.03, dest: d });
  }
  carveRelease(tier = 1) {
    if (!this.ok() || !this.allow('carveRelease', 6)) return;
    const k = Math.max(1, Math.min(3, tier)), t = this.ctx.currentTime, d = this.out(0.45, 0.3);
    this.noise(t, 0.35 + 0.2 * k, { type: 'bandpass', f0: 500, f1: 1500 + 1200 * k, q: 0.9, gain: 0.35 + 0.15 * k, attack: 0.01, dest: d });
    this.tone(t, 0.4, { f0: hz(TRIAD[k - 1] + 12), gain: 0.08, dest: d });
  }
  skiffPlate() {
    if (!this.ok() || !this.allow('skiffPlate', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.35);
    this.tone(t, 0.5, { f0: hz(88), gain: 0.12, dest: d }); this.tone(t + 0.04, 0.5, { f0: hz(95), gain: 0.08, dest: d });
    this.noise(t, 0.5, { type: 'bandpass', f0: 800, f1: 3000, q: 0.8, gain: 0.35, dest: d });
  }
  skiffPop() {
    if (!this.ok() || !this.allow('skiffPop', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.tone(t, 0.16, { f0: 220, f1: 520, type: 'triangle', gain: 0.25, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: 2500, q: 2, gain: 0.25, dest: d });
  }
  raceGate(split = null) {
    if (!this.ok() || !this.allow('raceGate', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.45, true), m = split == null ? 76 : split <= 0 ? 81 : 74; // (ahead a fourth up, behind a step down)
    this.tone(t, 0.5, { f0: hz(m), gain: 0.12, dest: d }); this.tone(t, 0.3, { f0: hz(m) * 2.01, gain: 0.04, dest: d });
  }
  raceLap(best = false) {
    if (!this.ok() || !this.allow('raceLap', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.45, true);
    [71, 76].forEach((m, k) => this.tone(t + k * 0.12, 0.5, { f0: hz(m), type: 'triangle', gain: 0.12, dest: d }));
    if (best) [76, 80, 83, 88].forEach((m, k) => this.tone(t + 0.3 + k * 0.07, 0.6, { f0: hz(m + 12), gain: 0.08, dest: d })); // (a new best: the run up the triad)
  }
  skiffLandHard() {
    if (!this.ok() || !this.allow('skiffLandHard', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.2);
    this.tone(t, 0.2, { f0: 110, f1: 55, gain: 0.5, dest: d }); this.noise(t, 0.25, { f0: 1800, f1: 300, gain: 0.45, dest: d });
  }
  raceFinish(medal = null) {
    if (!this.ok()) return;
    const n = { gold: 3, silver: 2, bronze: 1 }[medal] || 0, t = this.ctx.currentTime + 0.6, d = this.out(0.3, 0.6, true);
    for (let k = 0; k < n; k++) [1, 2.76].forEach((r, i) => this.tone(t + k * 0.35, 1.4, { f0: hz(88 + [0, 4, 7][k]) * r, gain: i ? 0.03 : 0.1, dest: d }));
  }
}
