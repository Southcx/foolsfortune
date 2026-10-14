// A sound bank of the one mixer (audio/sfx.js): the Raceway's time trial and the Solar Skiff's racing moves (docs/plans/SKIFF-RACING.md;
// world/raceway/race.js and courier/skiff/skiff.js, their events through audio/cues.js). Everything pitched is in E, the Raceway cue's key.
//   COUNT   race.count { n }: a beep for 3, 2, 1 (B, the dominant: a question); race.go: E an octave up, a chord under it (the answer)
//   SOLAR   race.solarstart: the sail run up on GO: a sunburst, E major spread fast up three octaves over a rush of air
//   CARVE   skiff.carve.charge { tier }: a step of the triad for each tier charged (E, G#, B), a rising hum under; skiff.carve { tier }:
//           let go, a whoosh as long and bright as its tier, the tier's note on top
//   PLATE   skiff.plate: a sun plate run over: a gold ping (E and B) and a boost's rush;   POP  skiff.pop: a spring off the lip
//   GATE    race.gate { split }: a chime; ahead of your best lap a fourth up, behind it a step down, no best yet the root
//   LAP     race.lap { best }: two notes at the line, and a run up the triad when it is a new best (best: true)
//   GRIND   skiff.grind: the board locked on a rail, a held scrape (metal on metal: noise through a ringing band, a hum under it, a
//           spark now and then) until skiff.grind.end { metres, why }: let go clean ('hop', 'end') with a ring of the rail as long as the grind,
//           or dropped off ('fell', 'stall') in a stutter
//   RING    skiff.ring { ring }: a sun ring flown through, each one a step higher up E's pentatonic (a run of rings plays a scale)
//   BACK    race.back: R, set back at the last gate: the run rewound (a reversed swell and a click into place)
//   GRAB    skiff.grab { grab, seconds }: let go, a snap and the board's note (nose high, tail low, a double both), longer held, brighter;
//           skiff.grab.late: landed still holding, a wobble   POP  skiff.pop { perfect }: a perfect pop rings a bright ping over the spring;
//           skiff.pop.miss: a flat thud   SLOPE  skiff.land.slope { gain }: the fall kept as speed, a swell as big as the gain
//   COMBO   skiff.combo { n, mult }: each trick linked a tick a step higher up E's pentatonic; skiff.combo.bank { mult }: banked, a run
//           up the triad and a bell for each step of the multiplier; skiff.combo.drop: dropped, the run falling in the minor
//   CAVERN  while `game.raceway.line === 'cavern'` (a roofed stone gorge) the room's reverb is sent up: everything rings off stone;
//           raceway.branch: through it whole, an echoed chime
//   WET     race.start { aspect }: a race in rain (mirth's sunshower, grief's long rain) puts wet sand's hiss under the board, as fast
//           as it rides, until the race ends;   a dark plate (skiff.plate { power: 0 }, night): a dull clunk, no push
//   WATER   skiff.water { on, speed }: onto water a slap and spray as hard as it rides; off it the hull shedding drips
//   RIVALS  race.bump { impact }: hulls knocking, as hard as the impact; race.takedown: a rival wrecked (Burnout's crunch: a slam, the
//           hull splintering, a breath of slow air); race.place { place }: gaining a place a step up, losing one a step down;
//           skiff.grind.trick: a flick of the board on the rail, a click and the rail ringing a step up
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
    this.noise(t, 0.9, { type: 'bandpass', f0: 600, f1: 2800, q: 0.8, gain: 0.18, attack: 0.08, dest: d });
  }
  carveCharge(tier = 1) {
    if (!this.ok() || !this.allow('carveCharge', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.25), m = TRIAD[Math.max(0, Math.min(2, tier - 1))];
    this.tone(t, 0.25, { f0: hz(m), type: 'triangle', gain: 0.12, dest: d }); this.tone(t, 0.3, { f0: hz(m - 24), f1: hz(m - 22), type: 'sawtooth', gain: 0.03, dest: d });
  }
  carveRelease(tier = 1) {
    if (!this.ok() || !this.allow('carveRelease', 6)) return;
    const k = Math.max(1, Math.min(3, tier)), t = this.ctx.currentTime, d = this.out(0.45, 0.3);
    this.noise(t, 0.35 + 0.2 * k, { type: 'bandpass', f0: 500, f1: 1500 + 1200 * k, q: 0.9, gain: 0.12 + 0.05 * k, attack: 0.03, dest: d });
    this.tone(t, 0.4, { f0: hz(TRIAD[k - 1] + 12), gain: 0.08, dest: d });
  }
  skiffPlate(power = 1) {
    if (!this.ok() || !this.allow('skiffPlate', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.35);
    if (!power) { this.tone(t, 0.2, { f0: 150, f1: 110, type: 'triangle', gain: 0.3, dest: d }); this.noise(t, 0.08, { f0: 600, f1: 200, gain: 0.25, dest: d }); return; } // (a dark plate: a clunk)
    this.tone(t, 0.5, { f0: hz(88), gain: 0.12, dest: d }); this.tone(t + 0.04, 0.5, { f0: hz(95), gain: 0.08, dest: d });
    this.noise(t, 0.5, { type: 'bandpass', f0: 800, f1: 2200, q: 0.8, gain: 0.12, attack: 0.03, dest: d });
  }
  skiffPop(perfect = false) {
    if (!this.ok() || !this.allow('skiffPop', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.tone(t, 0.16, { f0: 220, f1: 520, type: 'triangle', gain: 0.25, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: 2500, q: 2, gain: 0.25, dest: d });
    if (perfect) { this.tone(t + 0.04, 0.5, { f0: hz(95), gain: 0.1, dest: d }); this.tone(t + 0.04, 0.3, { f0: hz(107), gain: 0.04, dest: d }); }
  }
  skiffPopMiss() {
    if (!this.ok() || !this.allow('skiffPopMiss', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.15); this.tone(t, 0.12, { f0: 160, f1: 120, type: 'triangle', gain: 0.22, dest: d });
  }
  skiffGrab(grab = 'nose', seconds = 0.3) {
    if (!this.ok() || !this.allow('skiffGrab', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.3), up = Math.min(7, Math.floor(seconds * 4));
    this.noise(t, 0.04, { type: 'bandpass', f0: 3000, q: 4, gain: 0.35, dest: d });
    for (const m of grab === 'double' ? [76, 83] : [grab === 'tail' ? 71 : 83]) this.tone(t + 0.02, 0.35, { f0: hz(m + up), type: 'triangle', gain: 0.1, dest: d });
  }
  skiffGrabLate() {
    if (!this.ok() || !this.allow('skiffGrabLate', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.2), o = this.ctx.createOscillator(), g = this.ctx.createGain(), l = this.ctx.createOscillator(), lg = this.ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 180; l.frequency.value = 9; lg.gain.value = 30; l.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g).connect(d); o.start(t); l.start(t); o.stop(t + 0.55); l.stop(t + 0.55);
    this.noise(t, 0.3, { type: 'bandpass', f0: 1200, f1: 500, q: 1, gain: 0.25, dest: d });
  }
  skiffLandSlope(gain = 2) {
    if (!this.ok() || !this.allow('skiffLandSlope', 4)) return;
    const k = Math.min(1, gain / 8), t = this.ctx.currentTime, d = this.out(0.4, 0.3);
    this.noise(t, 0.5 + 0.4 * k, { type: 'bandpass', f0: 400, f1: 1600 + 2000 * k, q: 0.8, gain: 0.1 + 0.1 * k, attack: 0.08, dest: d });
  }
  skiffCombo(n = 1) {
    if (!this.ok() || !this.allow('skiffCombo', 10)) return;
    const P = [0, 2, 4, 7, 9], k = Math.max(0, (n | 0) - 1), m = 76 + P[k % 5] + 12 * Math.min(1, Math.floor(k / 5)), t = this.ctx.currentTime, d = this.out(0.25, 0.3, true);
    this.tone(t, 0.18, { f0: hz(m), type: 'triangle', gain: 0.09, dest: d });
  }
  skiffComboBank(mult = 1) {
    if (!this.ok() || !this.allow('skiffComboBank', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.45, true);
    [76, 80, 83, 88].forEach((m, k) => this.tone(t + k * 0.06, 0.5, { f0: hz(m), gain: 0.09, dest: d }));
    for (let k = 0; k < Math.min(4, Math.max(1, Math.round(mult))); k++) this.tone(t + 0.3 + k * 0.12, 0.9, { f0: hz(100 + [0, 4, 7, 12][k]), gain: 0.06, dest: d });
  }
  skiffComboDrop() {
    if (!this.ok() || !this.allow('skiffComboDrop', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3, true);
    [83, 79, 76, 71].forEach((m, k) => this.tone(t + k * 0.08, 0.3, { f0: hz(m), type: 'triangle', gain: 0.07, dest: d }));
  }
  racewayBranch() {
    if (!this.ok() || !this.allow('racewayBranch', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.9, true);
    [0, 0.25, 0.5].forEach((s, k) => this.tone(t + s, 0.7, { f0: hz(88), gain: 0.1 * Math.pow(0.5, k), dest: d })); // (its echo off the gorge)
  }
  /** The race's ground: wet sand's hiss under the board in rain (race.start's aspect), as fast as it rides; off when the race ends. */
  raceWet(on) {
    const W = this._wet;
    if (!on) { if (!W) return; this._wet = null; clearInterval(W.timer); W.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3); setTimeout(() => { try { W.s.stop(); } catch { /* gone */ } W.g.disconnect(); }, 1500); return; }
    if (W || !this.ok()) return;
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500; const g = c.createGain(); g.gain.value = 0.0001;
    s.connect(hp).connect(g).connect(this.loopBus || this.out(1, 0.1)); s.start();
    this._wet = { s, g, timer: setInterval(() => g.gain.setTargetAtTime(0.12 * (this._skiffK || 0), c.currentTime, 0.15), 100) };
  }
  /** Inside the cavern (a roofed stone gorge): the room's reverb sent up, so everything rings off stone. */
  setCavern(on) {
    if (!this.verbSend || !!on === !!this._cavern) return; this._cavern = !!on;
    this.verbSend.gain.setTargetAtTime(on ? 0.6 : 0.22, this.ctx.currentTime, 0.4);
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
  skiffGrind() {
    if (!this.ok()) return;
    this.skiffGrindEnd(null);
    const c = this.ctx, t = c.currentTime, g = c.createGain(), d = this.out(0.5, 0.25);
    g.gain.value = 0.0001; g.gain.setTargetAtTime(1, t, 0.03); g.connect(this.loopBus || d);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
    const ng = c.createGain(); ng.gain.value = 0.22; s.connect(bp).connect(ng).connect(g); s.start();
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 82; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; const og = c.createGain(); og.gain.value = 0.05;
    o.connect(lp).connect(og).connect(g); o.start();
    const G = this._grind = { g, s, o, bp, t0: t, timer: setInterval(() => { if (this.ok() && Math.random() < 0.6) this.noise(c.currentTime, 0.015, { type: 'highpass', f0: 5000, gain: 0.25, dest: g }); bp.frequency.setTargetAtTime(2000 + Math.random() * 900, c.currentTime, 0.05); }, 90) };
    G.cap = setTimeout(() => this.skiffGrindEnd('end'), 20000); // (never left running if its end is lost)
  }
  skiffGrindEnd(why = 'end', metres = 0) {
    const G = this._grind; if (!G) return; this._grind = null; clearInterval(G.timer); clearTimeout(G.cap);
    const c = this.ctx, t = c.currentTime; G.g.gain.cancelScheduledValues(t); G.g.gain.setTargetAtTime(0.0001, t, why === 'fell' || why === 'stall' ? 0.02 : 0.06);
    setTimeout(() => { try { G.s.stop(); G.o.stop(); } catch { /* gone */ } G.g.disconnect(); }, 600);
    if (!why || !this.ok()) return;
    const d = this.out(0.35, 0.4);
    if (why === 'fell' || why === 'stall') for (let i = 0; i < 3; i++) this.noise(t + i * 0.05, 0.03, { type: 'bandpass', f0: 1800 - i * 400, q: 3, gain: 0.3, dest: d });
    else { const ring = Math.min(1.6, 0.4 + (metres || 0) / 40); [1, 2.71].forEach((r, i) => this.tone(t, ring / (1 + i), { f0: hz(76) * r, gain: i ? 0.03 : 0.08, dest: d })); }
  }
  skiffRing(ring = 0) {
    if (!this.ok() || !this.allow('skiffRing', 8)) return;
    const P = [0, 2, 4, 7, 9], k = Math.max(0, ring | 0), m = 76 + P[k % 5] + 12 * Math.floor(k / 5) % 24, t = this.ctx.currentTime, d = this.out(0.3, 0.5, true);
    this.tone(t, 0.6, { f0: hz(m), gain: 0.12, dest: d }); this.tone(t, 0.4, { f0: hz(m + 12), gain: 0.04, dest: d }); this.noise(t, 0.3, { type: 'highpass', f0: 6000, gain: 0.08, dest: d });
  }
  raceBack() {
    if (!this.ok() || !this.allow('raceBack', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.3);
    this.noise(t, 0.45, { type: 'bandpass', f0: 3000, f1: 400, q: 1, gain: 0.35, attack: 0.4, dest: d }); this.tone(t + 0.45, 0.06, { f0: 1400, f1: 900, type: 'triangle', gain: 0.2, dest: d });
  }
  skiffWater(on = true, speed = 10) {
    if (!this.ok() || !this.allow('skiffWater', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.25), k = Math.min(1, speed / 18);
    if (on) { this.noise(t, 0.4, { f0: 3000, f1: 600, gain: 0.25 + 0.2 * k, dest: d }); this.tone(t, 0.12, { f0: 160, f1: 90, gain: 0.25, dest: d }); }
    else for (let i = 0; i < 5; i++) { const s = t + 0.05 + Math.random() * 0.6, f = 800 + Math.random() * 600; this.tone(s, 0.05, { f0: f, f1: f * 1.8, gain: 0.05, dest: d }); }
  }
  skiffGrindTrick() {
    if (!this.ok() || !this.allow('skiffGrindTrick', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.3);
    this.noise(t, 0.03, { type: 'bandpass', f0: 3500, q: 5, gain: 0.3, dest: d }); [1, 2.71].forEach((r, i) => this.tone(t + 0.02, 0.5 / (1 + i), { f0: hz(81) * r, gain: i ? 0.03 : 0.08, dest: d }));
  }
  raceBump(impact = 3) {
    if (!this.ok() || !this.allow('raceBump', 6)) return;
    const k = Math.min(1, impact / 10), t = this.ctx.currentTime, d = this.out(0.5, 0.2);
    this.tone(t, 0.15, { f0: 140, f1: 80, type: 'triangle', gain: 0.25 + 0.3 * k, dest: d }); this.noise(t, 0.08, { type: 'bandpass', f0: 1200, q: 1.5, gain: 0.2 + 0.3 * k, dest: d });
  }
  raceTakedown() {
    if (!this.ok() || !this.allow('raceTakedown', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.4);
    this.tone(t, 0.3, { f0: 110, f1: 40, gain: 0.6, dest: d }); this.noise(t, 0.4, { f0: 3000, f1: 300, gain: 0.5, dest: d });
    for (let i = 0; i < 8; i++) this.noise(t + 0.05 + i * 0.04 + Math.random() * 0.03, 0.03, { type: 'bandpass', f0: 1500 + Math.random() * 2500, q: 4, gain: 0.25, dest: d }); // (the hull splintering)
    this.noise(t + 0.2, 1, { type: 'bandpass', f0: 1200, f1: 300, q: 0.7, gain: 0.1, attack: 0.3, dest: d }); // (slow air)
  }
  racePlace(place = 1) {
    if (!this.ok()) return;
    const was = this._place; this._place = place; if (was == null || was === place) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3, true), up = place < was;
    [up ? [76, 81] : [76, 74]].flat().forEach((m, k) => this.tone(t + k * 0.08, 0.3, { f0: hz(m), type: 'triangle', gain: 0.09, dest: d }));
  }
  raceFinish(medal = null) {
    if (!this.ok()) return;
    const n = { gold: 3, silver: 2, bronze: 1 }[medal] || 0, t = this.ctx.currentTime + 0.6, d = this.out(0.3, 0.6, true);
    for (let k = 0; k < n; k++) [1, 2.76].forEach((r, i) => this.tone(t + k * 0.35, 1.4, { f0: hz(88 + [0, 4, 7][k]) * r, gain: i ? 0.03 : 0.1, dest: d }));
  }
}
