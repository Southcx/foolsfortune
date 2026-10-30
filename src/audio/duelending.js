// ---------------------------------------------------------------------------------------
// THE DUEL'S BUILD AND ENDINGS HEARD (Calissa's vfx/duelview/assembly.js, aberrantdrain.js, aberrants/strawmanend.js; her handoff of
// 2026-10-30): the tsuitate building itself at every open, a won PvE duel's aberrant drained into the Pneuka Jar, and Strawman's
// practice end. Called as optional hooks by the view at its own beats, so each sound lands on its frame.
//   THE BUILD   (duelAssemble(beat, i)) 'post' a clay post driven up out of the ground (yours, then the foe's, panned to its side);
//               'clack' a rail slid home (the top, then the foot, a tone lower); 'crystal' the panes crystallising, a rising glass
//               shimmer; 'feet' the frame landing on them, a low thump; 'etch' the grid scribed in, a fast run of scratches; 'line' the
//               seam lit, a bright fifth; 'done' deals the board (duelSeed, audio/duelcasts.js), so the seeding never guesses its time
//   THE DRAIN   (duelDrainBreak, duelDrainBeam, duelGulp) the hex shell forming round what is left, a rising crackle, bursting at 0.4 s
//               in a glass smash; the beam from the Jar's mouth, a held rising hum with data ticking down it until the gulp; the gulp,
//               a deep swallow and a bright sated chime
//   STRAWMAN    (strawmanStrain .. strawmanClap) the burlap straining, stitches popping and straw bursting out, the needle's whir as it
//               runs the seams, each stitch a little tug pulled tight (climbing as the seam closes), a bow (a creak and a cloth flap),
//               two claps
//
// Prior art: .hack//Infection's Data Drain (the shell, the beam, the swallow), Mega Man's boss-death fanfare held to the frame,
// a stage set being built in a Gainax transformation sequence (each piece its own clack), Rhythm Heaven's claps.
//
//   sfx.duelAssemble(beat, i) .duelDrainBreak() .duelDrainBeam() .duelGulp()
//   sfx.strawmanStrain() .strawmanPop() .strawmanNeedle() .strawmanStitch({ i, of }) .strawmanBow() .strawmanClap({ n })
// ---------------------------------------------------------------------------------------
import { duelRoot } from './puzzleduel.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** The beam's hum: held until the gulp; let go on its own after this many real s if the gulp never comes (a skip). */
const BEAM_MAX = 2.2;

export class DuelEndingSounds {
  duelAssemble(beat, i = 0) {
    if (beat === 'done') { this.duelSeed?.(); return; } // (the board dealt as the build ends: Calissa's 'done', 0.05 s before the deal)
    if (!this.ok()) return;
    const t = this.ctx.currentTime, r = duelRoot(this), d = this.duelOut?.(0.3, 0.4) ?? this.out(0.3, 0.4, true);
    switch (beat) {
      case 'post': {
        const p = this.ctx.createStereoPanner(); p.pan.value = i ? 0.6 : -0.6; p.connect(d); setTimeout(() => p.disconnect(), 2000);
        this.noise(t, 0.35, { type: 'bandpass', f0: 300, f1: 900, q: 1.2, gain: 0.3, attack: 0.12, dest: p }); this.tone(t + 0.3, 0.18, { f0: 130, f1: 90, type: 'triangle', gain: 0.25, dest: p }); break; // (a clay post driven up)
      }
      case 'clack': this.noise(t, 0.03, { type: 'bandpass', f0: 1800 - i * 400, q: 3, gain: 0.45, dest: d }); this.tone(t, 0.1, { f0: hz(r + 12 - i * 5), type: 'triangle', gain: 0.12, dest: d }); break; // (a rail home)
      case 'crystal': for (let k = 0; k < 7; k++) this.tone(t + k * 0.05, 0.4, { f0: hz(r + 24 + [0, 2, 4, 7, 9, 12, 14][k]), gain: 0.08, dest: d }); break; // (the panes crystallising)
      case 'feet': this.tone(t, 0.3, { f0: 80, f1: 45, gain: 0.45, dest: d }); this.noise(t, 0.08, { type: 'lowpass', f0: 500, gain: 0.35, dest: d }); break; // (the frame on its feet)
      case 'etch': for (let k = 0; k < 10; k++) this.noise(t + k * 0.055, 0.03, { type: 'bandpass', f0: 4200 + (k % 3) * 600, q: 6, gain: 0.35, dest: d }); break; // (the grid scribed)
      case 'line': [0, 7, 12].forEach((st) => this.tone(t, 0.8, { f0: hz(r + 12 + st), type: 'triangle', gain: 0.05, dest: d })); this.noise(t, 0.4, { type: 'highpass', f0: 5000, gain: 0.06, dest: d }); break; // (the seam lit)
    }
  }
  /** The hex shell forming round what is left of the aberrant, and bursting at 0.4 s. */
  duelDrainBreak() {
    if (!this.ok() || !this.allow('duelDrainBreak', 0.5)) return;
    const t = this.ctx.currentTime, d = this.duelOut?.(0.14, 0.6) ?? this.out(0.14, 0.6, true);
    for (let k = 0; k < 10; k++) this.noise(t + k * 0.035, 0.02, { type: 'bandpass', f0: 2000 + k * 300, q: 6, gain: 0.08 + k * 0.01, dest: d }); // (the shell forming)
    const b = t + 0.4; this.noise(b, 0.1, { type: 'highpass', f0: 2500, gain: 0.2, dest: d });
    for (let k = 0; k < 12; k++) this.noise(b + 0.02 + Math.random() * 0.4, 0.02, { type: 'bandpass', f0: 3000 + Math.random() * 5000, q: 8, gain: 0.07, dest: d }); // (its shards)
    this.tone(b, 0.6, { f0: 90, f1: 40, gain: 0.2, dest: d });
  }
  /** The beam from the Jar's mouth to the foe: a hum rising as the data runs down it, held until the gulp. */
  duelDrainBeam() {
    const c = this.ctx; if (!this.ok() || this._drainBeam) return;
    const t = c.currentTime, r = duelRoot(this), d = this.duelOut?.(1, 0.5) ?? this.out(1, 0.5, true);
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'sine'; f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(3500, t + 1.3);
    o.frequency.setValueAtTime(hz(r - 12), t); o.frequency.exponentialRampToValueAtTime(hz(r), t + 1.3); o2.frequency.setValueAtTime(hz(r + 7), t); o2.frequency.exponentialRampToValueAtTime(hz(r + 19), t + 1.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.15);
    o.connect(f); o2.connect(f); f.connect(g).connect(d); o.start(t); o2.start(t);
    for (let k = 0; k < 16; k++) this.noise(t + 0.1 + k * 0.08, 0.015, { type: 'bandpass', f0: 5000 - k * 150, q: 5, gain: 0.06, dest: d }); // (data ticking down the beam)
    const B = this._drainBeam = { o, o2, g };
    B.timer = setTimeout(() => this.drainBeamEnd(), BEAM_MAX * 1000);
  }
  drainBeamEnd() {
    const B = this._drainBeam; if (!B) return; this._drainBeam = null; clearTimeout(B.timer);
    const t = this.ctx.currentTime; B.g.gain.setTargetAtTime(0.0001, t, 0.05);
    setTimeout(() => { try { B.o.stop(); B.o2.stop(); } catch { /* gone */ } B.g.disconnect(); }, 400);
  }
  /** The swallow: a deep gulp and a sated chime. */
  duelGulp() {
    this.drainBeamEnd();
    if (!this.ok() || !this.allow('duelGulp', 0.5)) return;
    const t = this.ctx.currentTime, r = duelRoot(this), d = this.duelOut?.(0.4, 0.6) ?? this.out(0.4, 0.6, true);
    this.tone(t, 0.35, { f0: 220, f1: 60, gain: 0.45, dest: d }); this.noise(t, 0.2, { type: 'lowpass', f0: 600, f1: 200, gain: 0.3, dest: d }); // (the gulp)
    [0, 4, 7, 12].forEach((st, i) => this.tone(t + 0.25 + i * 0.05, 1.2, { f0: hz(r + 12 + st), type: 'triangle', gain: 0.05, dest: d })); // (sated)
  }

  strawmanStrain() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3);
    this.noise(t, 0.6, { type: 'bandpass', f0: 600, f1: 1400, q: 3, gain: 0.15, attack: 0.4, dest: d }); // (the burlap straining)
  }
  strawmanPop() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.3);
    for (let k = 0; k < 5; k++) this.noise(t + k * 0.04, 0.02, { type: 'bandpass', f0: 2500, q: 4, gain: 0.3, dest: d }); // (stitches popping)
    this.noise(t + 0.1, 0.6, { type: 'bandpass', f0: 3500, f1: 1500, q: 0.8, gain: 0.2, dest: d }); // (straw bursting out)
  }
  strawmanNeedle() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.2);
    this.tone(t, 1.0, { f0: 1800, f1: 2400, type: 'square', gain: 0.006, dest: d }); this.noise(t, 1.0, { type: 'bandpass', f0: 4000, q: 4, gain: 0.04, dest: d }); // (the needle's whir)
  }
  strawmanStitch({ i = 0, of = 8 } = {}) {
    if (!this.ok() || !this.allow('strawmanStitch', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.2), u = of > 1 ? i / (of - 1) : 1;
    this.noise(t, 0.04, { type: 'bandpass', f0: 1200 + 1600 * u, q: 3, gain: 0.7, dest: d }); this.tone(t + 0.02, 0.06, { f0: hz(72 + Math.round(u * 12)), gain: 0.12, dest: d }); // (a stitch pulled tight, climbing as the seam closes)
  }
  strawmanBow() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.3);
    this.tone(t, 0.4, { f0: 160, f1: 120, type: 'sawtooth', gain: 0.02, dest: d }); this.noise(t + 0.2, 0.2, { type: 'lowpass', f0: 1500, gain: 0.15, dest: d }); // (a creak, a cloth flap)
  }
  strawmanClap({ n = 1 } = {}) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4);
    this.noise(t, 0.04, { type: 'bandpass', f0: 1100 + n * 150, q: 1.5, gain: 0.9, dest: d }); // (a clap of burlap hands)
  }
}
