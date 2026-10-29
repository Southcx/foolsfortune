// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S SOUNDS (docs/plans/OPEN-SEA.md; the cue is music/opensea.js): the free helm under way, and the voyage's moments.
//   THE HELM  a wash under the hull and wind in the rig, both rising with the ship's speed (helm.speed, 0 to full sail's 15 m/s), a
//             timber creak now and then; started on boarding, ended on mooring or when the sea stops answering (read every 50 ms); in a
//             front's square the squall's rain and far thunder, and the nearest herd's call (audio/seasafari.js: read `squall`, `herd`)
//   THE CHART a square charted (a quill's scratch and a harp's three notes up), a find (a bell, fuller by its tier), a fix (the compass
//             needle settling: two notes falling into place; a failed sky a dull wobble), a drift (a slow bend down: the current took you)
//   THE PORT  docking (the rope's thud, the ship's bell twice), a report paid (a coin a find, up a step each), the tow (a low horn and
//             a chain), low fuel (two hollow knocks of an empty cask)
//   THE ISLET mooring (a rope and a creak), boarding (boots on planks), a secret taken (a small call up the chord), the puzzles: a pair's
//             half (one note asking), a pair (its answer), a line-up (the ring closing), a stele (stone grinding, a low hum)
// Each says what happened in the ear only; the log says it in words (feedback/tracking/).
//
// Prior art: The Legend of Zelda: The Wind Waker (the sail's wind, the treasure chart's chime, the ship's bell at a port); Sunless
// Sea (the hull's creak and the engine's thrum as the only company); Sea of Thieves (the rope, the bell, the planks underfoot).
//
//   sfx.openSeaHelmStart(read) / .openSeaHelmEnd()   read() -> { k: 0..1 speed, squall: 0..1, herd: { id, pos } | null, cam } or null (ends)
//   sfx.openSeaCharted() .openSeaFind(tier) .openSeaFix(ok) .openSeaDrift() .openSeaDock() .openSeaReport(i, tier) .openSeaTow()
//   sfx.openSeaFuelLow() .openSeaMoor() .openSeaBoard() .openSeaSecret() .openSeaPairHalf() .openSeaPair() .openSeaLineup() .openSeaStele()
// ---------------------------------------------------------------------------------------

import { CALL_REACH } from './seasafari.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const HELM_TICKS = 72000; // (the helm's loop reads at most an hour of real time, then lets go: casebook 253)

export class OpenSeaSounds {
  openSeaHelmStart(read = () => null) {
    if (this._helm || !this.ok()) return;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0.0001; g.connect(this.loopBus || this.out(1, 0.2));
    const wash = c.createBufferSource(); wash.buffer = this.noiseBuf; wash.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; const washG = c.createGain(); washG.gain.value = 0;
    wash.connect(lp).connect(washG).connect(g);
    const wind = c.createBufferSource(); wind.buffer = this.noiseBuf; wind.loop = true; wind.playbackRate.value = 0.7;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.value = 900; const windG = c.createGain(); windG.gain.value = 0;
    wind.connect(bp).connect(windG).connect(g);
    const rain = c.createBufferSource(); rain.buffer = this.noiseBuf; rain.loop = true; rain.playbackRate.value = 1.3;
    const rf = c.createBiquadFilter(); rf.type = 'bandpass'; rf.Q.value = 0.5; rf.frequency.value = 2400; const rainG = c.createGain(); rainG.gain.value = 0;
    rain.connect(rf).connect(rainG).connect(g);
    wash.start(); wind.start(); rain.start();
    const H = this._helm = { g, wash, wind, rain, lp, bp, washG, windG, rainG, gone: 0, ticks: 0, creak: c.currentTime + 3, call: c.currentTime + 4, thunder: c.currentTime + 8 };
    H.timer = setInterval(() => {
      const r = read(), t = c.currentTime;
      if (++H.ticks > HELM_TICKS) { this.openSeaHelmEnd(); return; }
      H.gone = r ? 0 : H.gone + 1; if (H.gone > 6) { this.openSeaHelmEnd(); return; }
      if (!r) return;
      const k = Math.max(0, Math.min(1, r.k || 0)), swell = 0.5 + 0.5 * Math.sin(t * 0.9); // (the swell lifting the wash a pulse at a time)
      g.gain.setTargetAtTime(0.5, t, 0.3);
      washG.gain.setTargetAtTime(0.05 + 0.25 * k * (0.7 + 0.3 * swell), t, 0.2); lp.frequency.setTargetAtTime(260 + 1300 * k, t, 0.3);
      windG.gain.setTargetAtTime(0.03 + 0.1 * k, t, 0.4); bp.frequency.setTargetAtTime(700 + 900 * k + 200 * Math.sin(t * 0.37), t, 0.5);
      if (t > H.creak && this.ok()) { H.creak = t + 4 + Math.random() * 6; this.openSeaCreak(t, 0.12 + 0.1 * k); }
      const q = r.squall || 0; // (the squall: rain on the deck, the wind in the rig up, thunder far off now and then)
      H.rainG.gain.setTargetAtTime(0.14 * q, t, 1.2); if (q) windG.gain.setTargetAtTime(0.1 + 0.12 * k, t, 0.6);
      if (q && t > H.thunder && this.ok()) { H.thunder = t + 9 + Math.random() * 14; this.noise(t, 2.2, { type: 'lowpass', f0: 700, f1: 90, gain: 0.25, attack: 0.25, dest: this.out(0.6, 0.6) }); }
      if (r.herd && t > H.call) { H.call = t + 5 + Math.random() * 7; const at = r.herd.pos; this.voiceAt?.(() => at, { listener: () => r.cam, tag: 'egregore', gain: 0.9, near: CALL_REACH.near, far: CALL_REACH.far })?.egregoreCall(r.herd.id); }
    }, 50);
  }
  openSeaHelmEnd() {
    const H = this._helm; if (!H) return; this._helm = null; clearInterval(H.timer);
    const t = this.ctx.currentTime; H.g.gain.cancelScheduledValues(t); H.g.gain.setValueAtTime(H.g.gain.value, t); H.g.gain.setTargetAtTime(0.0001, t, 0.6);
    setTimeout(() => { for (const s of [H.wash, H.wind, H.rain]) try { s.stop(); } catch { /* gone */ } H.g.disconnect(); }, 4000);
  }
  /** A timber's groan: the hull working in the swell. */
  openSeaCreak(t, v = 0.15) {
    const d = this.out(v, 0.3), f = 90 + Math.random() * 60;
    this.tone(t, 0.5, { f0: f, f1: f * 1.35, type: 'sawtooth', gain: 0.05, dest: d });
    this.noise(t, 0.45, { type: 'bandpass', f0: f * 6, f1: f * 8, q: 8, gain: 0.25, attack: 0.1, dest: d });
  }

  openSeaCharted() {
    if (!this.ok() || !this.allow('openSeaCharted', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.45, true);
    this.noise(t, 0.18, { type: 'highpass', f0: 3500, f1: 6000, gain: 0.18, attack: 0.03, dest: d }); // (the quill)
    [64, 71, 76].forEach((m, i) => this.tone(t + 0.12 + i * 0.09, 0.7, { f0: hz(m), type: 'triangle', gain: 0.18, dest: d }));
  }
  openSeaFind(tier = 1) {
    if (!this.ok() || !this.allow('openSeaFind', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.26 + 0.04 * tier, 0.55, true), n = Math.max(1, Math.min(4, tier));
    [76, 83, 88, 91].slice(0, n + 1).forEach((m, i) => { this.tone(t + i * 0.07, 1.2, { f0: hz(m), gain: 0.16, dest: d }); this.tone(t + i * 0.07, 0.5, { f0: hz(m) * 2.76, gain: 0.03, dest: d }); });
  }
  openSeaFix(ok = true) {
    if (!this.ok() || !this.allow('openSeaFix', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.24, 0.4, true);
    if (!ok) { this.tone(t, 0.8, { f0: 300, f1: 260, type: 'triangle', gain: 0.1, dest: d }); this.tone(t, 0.8, { f0: 306, f1: 250, type: 'triangle', gain: 0.08, dest: d }); return; }
    this.noise(t, 0.05, { type: 'bandpass', f0: 4000, q: 4, gain: 0.2, dest: d }); // (the needle's jewel)
    this.tone(t + 0.04, 0.3, { f0: hz(81), f1: hz(79), gain: 0.14, dest: d }); this.tone(t + 0.24, 0.9, { f0: hz(76), gain: 0.16, dest: d }); // (swinging, then still)
  }
  openSeaDrift() {
    if (!this.ok() || !this.allow('openSeaDrift', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.6);
    this.tone(t, 1.6, { f0: hz(64), f1: hz(61), type: 'sine', gain: 0.16, dest: d }); this.tone(t, 1.6, { f0: hz(71), f1: hz(67), type: 'sine', gain: 0.08, dest: d });
    this.noise(t, 1.4, { type: 'lowpass', f0: 600, f1: 250, gain: 0.25, attack: 0.4, dest: d });
  }
  openSeaDock() {
    if (!this.ok() || !this.allow('openSeaDock', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.5);
    this.tone(t, 0.18, { f0: 110, f1: 60, gain: 0.4, dest: d }); this.noise(t, 0.12, { type: 'lowpass', f0: 900, gain: 0.3, dest: d }); // (the rope's thud)
    [0.35, 0.75].forEach((x) => [1, 2.4, 3.9].forEach((r, j) => this.tone(t + x, 1.4, { f0: 660 * r, gain: 0.08 / (j + 1), dest: d }))); // (the ship's bell, twice)
  }
  /** A report paid at a dock: a coin, the `i`th up a step (counted by the cue, at most 8 steps), a brighter one for a higher tier. */
  openSeaReport(i = 0, tier = 1) {
    if (!this.ok() || !this.allow('openSeaReport', 12)) return;
    const t = this.ctx.currentTime + Math.min(8, i) * 0.11, d = this.out(0.22, 0.3, true), m = 79 + [0, 2, 4, 7, 9, 12, 14, 16, 19][Math.min(8, i)];
    this.tone(t, 0.25, { f0: hz(m), type: 'triangle', gain: 0.12 + 0.03 * Math.min(3, tier), dest: d }); this.noise(t, 0.02, { type: 'highpass', f0: 6000, gain: 0.2, dest: d });
  }
  openSeaTow() {
    if (!this.ok() || !this.allow('openSeaTow', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.36, 0.6);
    this.tone(t, 1.8, { f0: 98, type: 'sawtooth', gain: 0.06, dest: d }); this.tone(t, 1.8, { f0: 98.6, type: 'sawtooth', gain: 0.05, dest: d }); // (the tug's horn)
    for (let i = 0; i < 6; i++) this.noise(t + 1.9 + i * 0.07, 0.03, { type: 'bandpass', f0: 2500 + Math.random() * 1500, q: 5, gain: 0.25, dest: d }); // (the chain)
  }
  openSeaFuelLow() {
    if (!this.ok() || !this.allow('openSeaFuelLow', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4);
    [0, 0.28].forEach((x) => { this.tone(t + x, 0.3, { f0: 130, f1: 95, gain: 0.35, dest: d }); this.noise(t + x, 0.08, { type: 'bandpass', f0: 400, q: 2, gain: 0.25, dest: d }); });
  }
  openSeaMoor() {
    if (!this.ok() || !this.allow('openSeaMoor', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.4);
    this.noise(t, 0.25, { type: 'bandpass', f0: 1200, f1: 500, q: 1.5, gain: 0.25, dest: d }); // (the line run out)
    this.tone(t + 0.25, 0.15, { f0: 120, f1: 70, gain: 0.3, dest: d }); this.openSeaCreak(t + 0.4, 0.2);
  }
  openSeaBoard() {
    if (!this.ok() || !this.allow('openSeaBoard', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.3);
    [0, 0.2, 0.38].forEach((x) => { this.tone(t + x, 0.08, { f0: 160, f1: 110, gain: 0.3, dest: d }); this.noise(t + x, 0.04, { type: 'lowpass', f0: 1200, gain: 0.2, dest: d }); });
  }
  openSeaSecret() {
    if (!this.ok() || !this.allow('openSeaSecret', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6, true);
    [64, 68, 71, 76, 80].forEach((m, i) => this.tone(t + i * 0.08, 0.9 - i * 0.08, { f0: hz(m + 12), type: 'triangle', gain: 0.1, dest: d })); // (E major's arpeggio: Wonder's)
    this.noise(t + 0.3, 1, { type: 'highpass', f0: 7000, gain: 0.06, attack: 0.1, dest: d });
  }
  openSeaPairHalf() {
    if (!this.ok() || !this.allow('openSeaPairHalf', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.7, true); this.tone(t, 1.6, { f0: hz(76), gain: 0.12, dest: d }); this.tone(t + 0.4, 1.2, { f0: hz(83), gain: 0.06, dest: d }); // (a fifth, asking)
  }
  openSeaPair() {
    if (!this.ok() || !this.allow('openSeaPair', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.7, true); [76, 83, 88].forEach((m, i) => this.tone(t + i * 0.12, 1.6, { f0: hz(m), gain: 0.12, dest: d })); // (answered: home)
  }
  openSeaLineup() {
    if (!this.ok() || !this.allow('openSeaLineup', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.7, true);
    this.riser(t, 0.6, { f0: 330, f1: 660, type: 'triangle', gain: 0.05, dest: d });
    [64, 71, 76, 79, 83].forEach((m) => this.tone(t + 0.6, 2, { f0: hz(m), gain: 0.07, dest: d })); // (the ring closed)
  }
  openSeaStele() {
    if (!this.ok() || !this.allow('openSeaStele', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.noise(t, 0.6, { type: 'bandpass', f0: 300, f1: 180, q: 3, gain: 0.35, attack: 0.05, dest: d }); // (stone on stone)
    this.tone(t + 0.3, 2, { f0: hz(40), gain: 0.2, dest: d }); this.tone(t + 0.3, 2, { f0: hz(47), gain: 0.1, dest: d });
  }
}
