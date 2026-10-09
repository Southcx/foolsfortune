// A sound bank of the one mixer (audio/sfx.js): the Mycelium of the Spirit Garden (docs/plans/MYCELIUM.md): the spore beds, Myggdrasil
// the world mushroom, and the keepsake pots.
//   A BED AT WORK  each strain by its feeling and its verb, heard near a working bed (sporeBed, a phrase every few real seconds):
//                  the lichen (wonder, graft): two glass tones drawing together into one; koji (mirth, ferment): a warm slow bubbling;
//                  the inkcap (desire, print): ink dripping, a stamp; the oyster (grief, rot): a soft crumble and a sigh; witches' butter
//                  (dread, dissolve): a jelly's wobble sinking
//   ITS HARVEST    the strain's chord plucked, and a sparkle up when a graft went a tier up (spore.harvest)
//   MYGGDRASIL     its tincture as a drone (myggDrone, while near): a low E and its fifth, and the colour note of the feeling nearest
//                  the tincture's hue (wonder's raised fourth, mirth's major third, desire's major sixth, grief's minor third, dread's flat
//                  second), as bright as the tincture is saturated; fed (a root's long draw); the dawn's fruiting (a cascade of soft
//                  pops climbing, one a fruit, and the dawn's chord); a cap opening (a swell and a bell, higher a cap: the ten sephiroth
//                  from the Kingdom to the Crown are ten steps of the scale); a card hung (paper, a knock, the card's chime)
//   A KEEPSAKE POT a line of its released spirit's song, sung in syllables on the Answer in its feeling's mode (keepsakeSong: once as it
//                  is fired, then while you stand by it)
// Prior art: the drone of a tanpura (a tree that is always sounding), Spiritfarer's Everdoor (a spirit given a place to stay), the
// Chao's song (audio/spirits.js: the same throat), and the Kabbalists' tree (ten bodies climbing).
//   sfx.sporeBed(feeling, dist)   sfx.myggDrone({ h, s } | null, dist) every frame while near (fades by itself 0.5 real seconds after
//   the last call)   sfx.keepsakeSong({ feeling, pitch }, dist)   the rest through audio/cues.js: spore.harvest, myggdrasil.feed,
//   .fruit, .girth, .hang, keepsake.pot
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
import { COLOR } from '../progress/weather.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const FEELINGS = ['wonder', 'mirth', 'desire', 'grief', 'dread']; // (the five strains' feelings: a spirit kind sings in one of these)
const HUED = [...FEELINGS, 'fury', 'gall']; // (a tincture can lean to any of the seven)
const MODE = { wonder: [0, 4, 6, 7, 11], mirth: [0, 2, 4, 7, 9], desire: [0, 2, 3, 7, 9], grief: [0, 3, 5, 7, 10], dread: [0, 1, 5, 7, 8], fury: [0, 3, 6, 7, 10], gall: [0, 1, 4, 7, 8] }; // (music/mood.js MODES)
const COLOUR_NOTE = { wonder: 6, mirth: 4, desire: 9, grief: 3, dread: 1, fury: 6, gall: 1 }; // (each mode's own note against E)
const hueOf = (hex) => { const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255, M = Math.max(r, g, b), d = M - Math.min(r, g, b);
  if (!d) return 0; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const HUE = Object.fromEntries(HUED.filter((f) => COLOR[f] != null).map((f) => [f, hueOf(COLOR[f])]));
/** The feeling whose hue is nearest a colour's (the tincture's). */
export function feelingOfHue(h) { let best = 'grief', d = 1e9; for (const f of Object.keys(HUE)) { const x = Math.abs(((h - HUE[f] + 540) % 360) - 180); if (x < d) { d = x; best = f; } } return best; }
/** A stable small number from an id (a card's, a spirit kind's). */
const hashOf = (x) => (typeof x === 'number' ? x : [...String(x)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7));
/** A spirit kind's feeling when the event carries none: the same kind always sings in the same one. */
export const feelingOfKind = (kind) => FEELINGS[hashOf(kind || 'spirit') % 5];
const near = (dist) => Math.min(1, 1.2 / (0.4 + Math.max(0, dist) * 0.15));

export class MyceliumSounds {
  sporeBed(feeling = 'grief', dist = 3) {
    if (!this.ok() || !this.allow(`sporeBed.${feeling}`, 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.25 * near(dist), 0.4);
    if (feeling === 'wonder') { this.tone(t, 1.6, { f0: hz(71), f1: hz(76), gain: 0.3, dest: d }); this.tone(t, 1.6, { f0: hz(81), f1: hz(76), type: 'triangle', gain: 0.2, dest: d }); }
    else if (feeling === 'mirth') for (let k = 0; k < 5; k++) { const a = t + k * 0.28 + Math.random() * 0.1; this.tone(a, 0.12, { f0: 160 + Math.random() * 60, f1: 260 + Math.random() * 80, gain: 0.3, dest: d }); }
    else if (feeling === 'desire') { [0, 0.45, 0.8].forEach((a, k) => this.tone(t + a, 0.15, { f0: hz(81 - k * 3), f1: hz(76 - k * 3), gain: 0.25, dest: d })); this.noise(t + 1.1, 0.06, { type: 'lowpass', f0: 900, gain: 0.4, dest: d }); }
    else if (feeling === 'grief') { this.noise(t, 0.9, { type: 'lowpass', f0: 700, f1: 250, gain: 0.25, attack: 0.2, dest: d }); this.tone(t + 0.3, 1.2, { f0: hz(67), f1: hz(64), gain: 0.12, dest: d }); }
    else { this.tone(t, 1.4, { f0: 110, f1: 70, gain: 0.35, dest: d }); this.tone(t, 1.4, { f0: 117, f1: 74, gain: 0.2, dest: d }); } // (dread: two near tones beating, sinking)
  }
  sporeHarvest(feeling = 'grief', up = false) {
    if (!this.ok() || !this.allow('sporeHarvest', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5), m = MODE[feeling] || MODE.grief;
    [0, 2, 4].forEach((k, i) => this.tone(t + i * 0.06, 0.9, { f0: hz(64 + m[k]), type: 'triangle', gain: 0.25, dest: d })); // (the strain's chord, plucked)
    this.noise(t, 0.08, { type: 'bandpass', f0: 1800, q: 2, gain: 0.25, dest: d });
    if (up) [76, 79, 83, 88].forEach((n, i) => this.tone(t + 0.25 + i * 0.07, 0.4, { f0: hz(n), gain: 0.14, dest: d })); // (a tier up)
  }

  myggDrone(tincture = null, dist = 10) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, feeling = tincture ? feelingOfHue(tincture.h) : 'grief', sat = tincture?.s ?? 0.3;
    let D = this._mygg;
    if (!D) {
      const g = c.createGain(); g.gain.value = 0.0001; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; g.connect(lp).connect(this.out(0.5, 0.6));
      const mk = (m, type, v) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = hz(m); og.gain.value = v; o.connect(og).connect(g); o.start(); return o; };
      D = this._mygg = { g, lp, root: mk(40, 'sawtooth', 0.12), fifth: mk(47, 'triangle', 0.2), colour: mk(52 + COLOUR_NOTE[feeling], 'sine', 0.22), feeling };
    }
    if (D.feeling !== feeling) { D.feeling = feeling; D.colour.frequency.setTargetAtTime(hz(52 + COLOUR_NOTE[feeling]), t, 0.6); } // (the colour note glides to the new feeling)
    D.g.gain.setTargetAtTime(0.5 * near(dist / 3), t, 0.4);
    D.lp.frequency.setTargetAtTime(500 + 2500 * Math.max(0, Math.min(1, sat)), t, 0.5); // (a saturated tincture rings brighter)
    clearTimeout(D.quiet); D.quiet = setTimeout(() => this.myggDroneStop(), 500);
  }
  myggDroneStop() {
    const D = this._mygg; if (!D) return;
    this._mygg = null; clearTimeout(D.quiet);
    const t = this.ctx.currentTime; D.g.gain.setTargetAtTime(0.0001, t, 0.5);
    setTimeout(() => { for (const o of [D.root, D.fifth, D.colour]) try { o.stop(); } catch { /* gone */ } D.g.disconnect(); }, 3000);
  }
  myggFeed() {
    if (!this.ok() || !this.allow('myggFeed', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.5);
    this.tone(t, 0.9, { f0: 90, f1: 55, gain: 0.4, dest: d }); // (the root's long draw)
    this.noise(t, 0.7, { type: 'lowpass', f0: 600, f1: 200, gain: 0.3, attack: 0.15, dest: d });
  }
  myggFruit(n = 3) {
    if (!this.ok() || !this.allow('myggFruit', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.6), steps = [64, 66, 68, 71, 73, 76, 78, 80, 83, 85];
    for (let k = 0; k < Math.min(10, Math.max(1, n)); k++) { const a = t + 0.4 + k * 0.16; this.tone(a, 0.25, { f0: hz(steps[k] - 12), f1: hz(steps[k] - 12) * 1.5, gain: 0.22, dest: d }); this.tone(a, 0.6, { f0: hz(steps[k]), type: 'triangle', gain: 0.12, dest: d }); } // (a pop and its note, climbing)
    [52, 59, 64, 68].forEach((m) => this.tone(t, 3, { f0: hz(m), gain: 0.08, dest: d })); // (the dawn's chord, E major)
  }
  myggCap(caps = 1) {
    if (!this.ok() || !this.allow('myggCap', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.8), steps = [52, 55, 57, 59, 62, 64, 67, 69, 71, 74], m = steps[Math.max(0, Math.min(9, caps - 1))];
    this.noise(t, 1.6, { type: 'bandpass', f0: 200, f1: 1600, q: 0.8, gain: 0.35, attack: 1, dest: d }); // (the cap swelling open)
    for (const [r, a] of [[1, 0.35], [2.76, 0.12], [5.4, 0.05]]) this.tone(t + 1.2, 3, { f0: hz(m) * r, gain: a, dest: d }); // (a bell: higher a cap, the Kingdom to the Crown)
  }
  myggHang(arcana = 0) {
    if (!this.ok() || !this.allow('myggHang', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5), steps = [64, 66, 67, 69, 71, 72, 74];
    this.noise(t, 0.2, { type: 'highpass', f0: 2500, gain: 0.25, dest: d }); // (the card's paper)
    this.tone(t + 0.2, 0.08, { f0: 300, f1: 180, type: 'triangle', gain: 0.35, dest: d }); // (a knock on the branch)
    const k = hashOf(arcana) % 22, n = steps[k % 7] + 12 * Math.floor(k / 7);
    this.tone(t + 0.3, 1.5, { f0: hz(n), gain: 0.18, dest: d }); this.tone(t + 0.3, 1.5, { f0: hz(n) * 2.01, gain: 0.05, dest: d }); // (its chime: a step of the scale a card)
  }
  keepsakeSong({ feeling = 'mirth', pitch = 1 } = {}, dist = 2) {
    if (!this.ok() || !this.allow('keepsakeSong', 0.15)) return;
    const t = this.ctx.currentTime, d = this.out(0.5 * near(dist), 0.6), m = MODE[feeling] || MODE.mirth, f = 520 * pitch;
    const line = [[0, 0, 0.3], [0.3, 1, 0.3], [0.6, 2, 0.3], [0.9, 3, 0.3], [1.2, 4, 0.8]]; // (the Answer's climb, a degree a syllable)
    line.forEach(([a, k, dur], i) => { const r = Math.pow(2, m[k] / 12); this.syllable?.(t + a, dur, f * r, f * r * (i === 4 ? 1.02 : 1), ['a', 'o', 'a', 'o', 'u'][i], 0.4, d); });
  }
}
