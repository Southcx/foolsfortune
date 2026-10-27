// ---------------------------------------------------------------------------------------
// THE SEA SERPENT'S SOUNDS (the open sea's hunter: creatures/seaserpent/, world/opensea/seafight.js; Petra's events; its hunt's music is
// music/opensea.js's hunt section). A great sea snake of crude, Marlin class: heard before it is seen.
//   ITS RISE    it turns on you: a low call like a ship's horn bent down, the surface tearing as its back breaks it
//   ITS TELLS   each move's windup in its own sound, so the ear knows what is coming: the ram (water drawn up into a wall, a rising
//               rush), the spit (a gurgle building in the throat), the coil (scales grinding, the body tightening), the dive (a great
//               breath in, then the hush)
//   ITS MOVES   the ram breaking the surface (a crash of crude), the spit (a wet glob thrown), the coil closing on the hull (timbers
//               groaning; a miss, a slap of water), the dive (a plunge and the hiss of the foam)
//   STRUCK      the head: a meaty thud and a shriek; the coil: a clank off its scales. Freed: the line of it snapping loose. Down: a
//               long falling moan and the sea closing over it
//   THE HULL    the ship hit (a timber's crack and a splinter, darker the fewer it can bear); broken (a keel's crack), the tow after
// Prior art: Monster Hunter's monsters (a roar to begin, each attack's own tell), Sea of Thieves' Megalodon and Kraken (the sea's own
// voice before the body), Jaws' two notes (danger heard before it is seen: a semitone's lean).
//
//   sfx.seaSerpentRise() .seaSerpentWind(move) .seaSerpentMove(move, hit) .seaSerpentHit(part) .seaSerpentFree() .seaSerpentDown()
//   sfx.seaHullHit(left) .seaHullBroken()
// ---------------------------------------------------------------------------------------

export class SeaSerpentSounds {
  seaSerpentRise() {
    if (!this.ok() || !this.allow('seaSerpentRise', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.6);
    [55, 58.3].forEach((f) => this.tone(t, 2.4, { f0: f * 1.5, f1: f, type: 'sawtooth', gain: 0.07, dest: d })); // (the call, bent down: its two voices a semitone's lean)
    this.noise(t + 0.4, 1.6, { type: 'lowpass', f0: 400, f1: 2400, gain: 0.4, attack: 0.3, dest: d }); // (the surface tearing)
    this.tone(t + 0.4, 1.4, { f0: 60, f1: 35, gain: 0.5, dest: d });
  }
  /** A move's windup, its own tell: ram, spit, coil or dive. */
  seaSerpentWind(move = 'ram') {
    if (!this.ok() || !this.allow('seaSerpentWind', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.45);
    if (move === 'ram') { this.noise(t, 1.1, { type: 'bandpass', f0: 200, f1: 1600, q: 0.9, gain: 0.35, attack: 0.9, dest: d }); this.tone(t, 1.1, { f0: 50, f1: 90, gain: 0.3, dest: d }); }
    else if (move === 'spit') { for (let i = 0; i < 8; i++) this.tone(t + i * 0.09, 0.08, { f0: 120 + i * 30 + Math.random() * 40, f1: 300 + i * 40, gain: 0.15, dest: d }); this.noise(t, 0.8, { type: 'bandpass', f0: 500, f1: 1200, q: 3, gain: 0.15, attack: 0.5, dest: d }); }
    else if (move === 'coil') { for (let i = 0; i < 6; i++) this.noise(t + i * 0.13, 0.11, { type: 'bandpass', f0: 900 + i * 120, q: 6, gain: 0.25, attack: 0.03, dest: d }); this.tone(t, 0.9, { f0: 80, f1: 120, type: 'sawtooth', gain: 0.05, dest: d }); }
    else { this.noise(t, 0.9, { type: 'bandpass', f0: 1800, f1: 500, q: 1, gain: 0.3, attack: 0.6, dest: d }); } // (the dive: a breath drawn in)
  }
  /** The move itself: `hit` true when it found the hull. */
  seaSerpentMove(move = 'ram', hit = false) {
    if (!this.ok() || !this.allow('seaSerpentMove', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.48, 0.5);
    if (move === 'ram') { this.noise(t, 0.9, { type: 'lowpass', f0: 3000, f1: 400, gain: 0.55, dest: d }); this.tone(t, 0.6, { f0: 90, f1: 40, gain: 0.55, dest: d }); }
    else if (move === 'spit') { this.noise(t, 0.12, { type: 'bandpass', f0: 700, f1: 300, q: 2, gain: 0.4, dest: d }); this.tone(t, 0.2, { f0: 220, f1: 90, gain: 0.25, dest: d }); }
    else if (move === 'coil') { if (hit) { this.tone(t, 1.2, { f0: 70, f1: 50, type: 'sawtooth', gain: 0.07, dest: d }); for (let i = 0; i < 5; i++) this.noise(t + 0.1 + i * 0.18, 0.15, { type: 'bandpass', f0: 300 + Math.random() * 300, q: 8, gain: 0.3, dest: d }); } else this.noise(t, 0.4, { type: 'lowpass', f0: 1500, f1: 500, gain: 0.35, dest: d }); }
    else { this.noise(t, 0.5, { type: 'lowpass', f0: 2000, f1: 300, gain: 0.45, dest: d }); this.noise(t + 0.3, 1.4, { type: 'highpass', f0: 3000, f1: 1500, gain: 0.12, attack: 0.1, dest: d }); }
  }
  seaSerpentHit(part = 'head') {
    if (!this.ok() || !this.allow('seaSerpentHit', 8) || !this.hitOk()) return; // (hitOk: a phone hears a blow once, core.js)
    const t = this.ctx.currentTime, d = this.out(0.34, 0.3);
    if (part === 'coil') { this.noise(t, 0.04, { type: 'bandpass', f0: 2800, q: 5, gain: 0.4, dest: d }); this.tone(t, 0.12, { f0: 900, f1: 1200, type: 'triangle', gain: 0.06, dest: d }); }
    else { this.tone(t, 0.2, { f0: 110, f1: 60, gain: 0.45, dest: d }); this.tone(t + 0.04, 0.35, { f0: 700, f1: 1400, type: 'sawtooth', gain: 0.04, dest: d }); }
  }
  seaSerpentFree() {
    if (!this.ok() || !this.allow('seaSerpentFree', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.4);
    this.noise(t, 0.08, { type: 'bandpass', f0: 1800, f1: 4000, q: 1.5, gain: 0.35, dest: d }); this.noise(t + 0.05, 0.6, { type: 'lowpass', f0: 1200, f1: 400, gain: 0.3, dest: d });
  }
  seaSerpentDown() {
    if (!this.ok() || !this.allow('seaSerpentDown', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.7);
    [58.3, 55].forEach((f) => this.tone(t, 3, { f0: f * 2, f1: f * 0.7, type: 'sawtooth', gain: 0.06, dest: d })); // (the call, falling away)
    this.noise(t + 1.2, 2.4, { type: 'lowpass', f0: 1200, f1: 150, gain: 0.4, attack: 0.4, dest: d }); // (the sea closing over it)
  }
  /** The ship struck: `left` the hits it can still bear (fewer, darker). */
  seaHullHit(left = 3) {
    if (!this.ok() || !this.allow('seaHullHit', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.42, 0.35), dark = Math.max(0, Math.min(1, 1 - left / 6));
    this.noise(t, 0.05, { type: 'highpass', f0: 1800, gain: 0.5, dest: d }); this.tone(t, 0.3, { f0: 160 - 60 * dark, f1: 60, gain: 0.45, dest: d });
    for (let i = 0; i < 3; i++) this.noise(t + 0.05 + i * 0.04, 0.02, { type: 'bandpass', f0: 2500 + i * 700, q: 4, gain: 0.2, dest: d }); // (the splinters)
  }
  seaHullBroken() {
    if (!this.ok() || !this.allow('seaHullBroken', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.5);
    this.noise(t, 0.4, { type: 'lowpass', f0: 2200, f1: 300, gain: 0.55, dest: d }); this.tone(t, 0.9, { f0: 70, f1: 30, gain: 0.55, dest: d });
    this.tone(t + 0.2, 1.4, { f0: 140, f1: 110, type: 'sawtooth', gain: 0.05, dest: d }); // (the keel's long groan)
  }
}
