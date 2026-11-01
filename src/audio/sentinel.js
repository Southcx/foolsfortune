// ---------------------------------------------------------------------------------------
// A SENTINEL HEARD (Petra's runtime, creatures/sentinel/; Calissa's body, vfx/sentinelbody.js: a shield-bearer haniwa of the island's
// fired clay risen out of a mound of its sand). It guards and never hunts, so it is heard as a keeper, slow and patient, never a
// predator's snarl. A haniwa is hollow, open at the eyes and mouth: its voice is the wind in that hollow, a vessel flute (an ocarina's
// breathy round tone), and every blow it takes or gives rings its terracotta body.
//   WAKE    (sentinel.wake { ground }) sand pouring off as it rises, then its voice: one breathed note climbing a fifth
//   SEEK    (sentinel.seek) its call: two breathed notes, the second a step higher (where?)
//   STEP    (sentinel.step { at }) a heavy hollow foot on the ground: a thud with a pot's ring inside it, the sand's grit, left and right
//           a little apart in pitch
//   WINDUP  (sentinel.windup { at }) the shield drawn up: clay grinding on clay and the hollow's breath rising, 0.75 real s to the slam
//   SLAM    (sentinel.cast) the shield brought down: a deep thud, the ground's crack and a burst of sand
//   CRACK   (sentinel.crack { hp }) a blow on fired clay: a terracotta tick, the crack running, sharper and longer as its hp falls (of 9)
//   FALL    (sentinel.fall { at }) crumbling where it fell: shards tumbling, sand pouring, its voice going out on a falling breath
//   MEND    (sentinel.mend { ground, last }) the warp worn back into the island: the ground smoothed (clay's wet slap, sand's hiss), and its
//           voice settling on a major third; the last mend a longer, lower close
//   SINK    (sentinel.burst { cause }) its work done ('settled') a slow sink into the sand and a held note; with nothing mended ('driven')
//           the same, the note bent down; any other cause is its fall, already heard
// Every body moment is heard from where it stands (`at`, through sfx.voiceAt: audio/positional.js); the slam and the sink, which carry no
// place, from where it last stepped.
//
// Prior art: the ocarina and the vessel flutes of the Americas and the Jōmon (the haniwa's own hollow mouths), Shadow of the Colossus's
// colossi (slow, heavy, sorrowful rather than angry), Zelda's Guardians' footfalls and Ico's stone sentinels.
//
//   sfx.sentinelWake(ground) .sentinelSeek() .sentinelStep() .sentinelWindup() .sentinelSlam() .sentinelCrack(hp) .sentinelFall()
//   .sentinelMend(ground, last) .sentinelSink(cause)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const ROOT = 67; // (G4: the vessel flute's voice, a fifth over the duel's G and out of a cue's melody's way)
const HP = 9; // (Petra's SENTINEL.hp)
/** Each moment's level, set by ear against the parry's clang: its footfalls a gesture under everything, its slam and fall the loudest. */
const LEVEL = { step: 1.6, windup: 2.9, slam: 1.2, crack: 1, fall: 1.1, wake: 1, seek: 1.9, mend: 2.5, sink: 1 };

export class SentinelSounds {
  /** out() scaled by a LEVEL row through its own gain node (the positional voice's route goes through out() too). */
  sentinelOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 5000); return d; }
  /** Its voice: a vessel flute's note (a near-sine with its breath), gliding from f0 to f1. */
  sentinelBreath(t, dur, f0, f1, g, d) {
    this.tone(t, dur, { f0, f1, gain: g, dest: d }); this.tone(t, dur * 0.8, { f0: f0 * 2.01, f1: f1 * 2.01, gain: g * 0.08, dest: d }); // (round, almost pure)
    this.noise(t, dur, { type: 'bandpass', f0: f0 * 2, f1: f1 * 2, q: 4, gain: g * 1.6, attack: Math.min(0.15, dur * 0.3), dest: d }); // (the breath through the hollow)
  }
  /** A hollow fired-clay body struck: a thud with its ring (a pot's few partials). */
  sentinelRing(t, f, g, d) { [1, 2.32, 4.1].forEach((p, i) => this.tone(t, 0.35 / (i + 1), { f0: f * p, f1: f * p * 0.98, type: 'triangle', gain: g / (i + 1.5), dest: d })); }

  sentinelWake() {
    if (!this.ok() || !this.allow('sentinelWake', 0.5)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('wake', 0.5, 0.7);
    this.noise(t, 1.4, { type: 'bandpass', f0: 2200, f1: 900, q: 0.7, gain: 0.3, attack: 0.3, dest: d }); // (sand pouring off it)
    this.tone(t, 1.2, { f0: 60, f1: 48, gain: 0.2, dest: d }); // (the mound giving way)
    this.sentinelBreath(t + 1, 1.4, hz(ROOT), hz(ROOT + 7), 0.06, d); // (its voice, climbing a fifth)
  }
  sentinelSeek() {
    if (!this.ok() || !this.allow('sentinelSeek', 0.25)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('seek', 0.5, 0.7);
    this.sentinelBreath(t, 0.45, hz(ROOT + 7), hz(ROOT + 7), 0.05, d); this.sentinelBreath(t + 0.5, 0.6, hz(ROOT + 9), hz(ROOT + 9), 0.05, d); // (where?)
  }
  sentinelStep() {
    if (!this.ok() || !this.allow('sentinelStep', 4)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('step', 0.4, 0.3), side = (this._sentStep = !this._sentStep) ? 1 : 0.92;
    this.tone(t, 0.18, { f0: 110 * side, f1: 55 * side, gain: 0.3, dest: d }); // (the weight)
    this.sentinelRing(t, 180 * side, 0.06, d); // (hollow inside)
    this.noise(t, 0.12, { type: 'bandpass', f0: 1600, q: 1, gain: 0.18, dest: d }); // (the sand's grit)
  }
  sentinelWindup() {
    if (!this.ok() || !this.allow('sentinelWindup', 1)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('windup', 0.4, 0.4);
    this.noise(t, 0.7, { type: 'bandpass', f0: 500, f1: 900, q: 3, gain: 0.25, attack: 0.1, dest: d }); // (clay grinding on clay)
    this.sentinelBreath(t, 0.75, hz(ROOT - 5), hz(ROOT + 2), 0.04, d); // (the hollow's breath drawn in)
  }
  sentinelSlam() {
    if (!this.ok() || !this.allow('sentinelSlam', 1)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('slam', 0.6, 0.6);
    this.tone(t, 0.5, { f0: 90, f1: 32, gain: 0.5, dest: d }); this.sentinelRing(t, 140, 0.1, d); // (the shield down, its clay ringing)
    this.noise(t, 0.08, { type: 'bandpass', f0: 1200, q: 1.5, gain: 0.6, dest: d }); // (the ground's crack)
    this.noise(t + 0.03, 0.7, { type: 'lowpass', f0: 2500, f1: 600, gain: 0.3, dest: d }); // (the sand thrown up)
  }
  sentinelCrack(hp = HP) {
    if (!this.ok() || !this.allow('sentinelCrack', 6)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('crack', 0.45, 0.4), k = 1 - Math.max(0, Math.min(1, hp / HP)); // (k: 0 fresh .. 1 near gone)
    this.noise(t, 0.02, { type: 'bandpass', f0: 3000, q: 3, gain: 0.3 + 0.15 * k, dest: d }); this.sentinelRing(t, 300 - 80 * k, 0.07, d); // (the tick on terracotta)
    const runs = 2 + Math.round(5 * k);
    for (let i = 0; i < runs; i++) this.noise(t + 0.03 + i * 0.03 + Math.random() * 0.02, 0.015, { type: 'highpass', f0: 3500 + Math.random() * 2000, gain: 0.12 + 0.08 * k, dest: d }); // (the crack running)
  }
  sentinelFall() {
    if (!this.ok() || !this.allow('sentinelFall', 0.5)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('fall', 0.55, 0.6);
    for (let i = 0; i < 9; i++) { const at = t + i * 0.09 + Math.random() * 0.05; this.sentinelRing(at, 220 + Math.random() * 200, 0.05, d); this.noise(at, 0.03, { type: 'bandpass', f0: 1800, q: 2, gain: 0.25, dest: d }); } // (shards tumbling)
    this.noise(t + 0.2, 1.6, { type: 'bandpass', f0: 1800, f1: 700, q: 0.7, gain: 0.25, attack: 0.2, dest: d }); // (sand pouring)
    this.sentinelBreath(t + 0.3, 1.6, hz(ROOT + 5), hz(ROOT - 7), 0.05, d); // (its voice going out)
  }
  sentinelMend(ground = 'clay', last = false) {
    if (!this.ok() || !this.allow('sentinelMend', 1)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('mend', 0.45, 0.7);
    if (ground === 'sand') this.noise(t, 0.6, { type: 'highpass', f0: 2500, f1: 1500, gain: 0.25, attack: 0.1, dest: d }); // (sand smoothed)
    else { this.noise(t, 0.12, { type: 'lowpass', f0: 900, gain: 0.4, dest: d }); this.noise(t + 0.15, 0.3, { type: 'lowpass', f0: 600, f1: 300, gain: 0.25, dest: d }); } // (clay slapped and smoothed)
    const lo = last ? -5 : 0;
    this.sentinelBreath(t + 0.35, last ? 1.6 : 0.9, hz(ROOT + lo), hz(ROOT + lo), 0.045, d); this.sentinelBreath(t + 0.35 + (last ? 0.9 : 0.5), last ? 1.8 : 1, hz(ROOT + lo + 4), hz(ROOT + lo + 4), 0.045, d); // (settled on a third)
  }
  sentinelSink(cause = 'settled') {
    if (cause !== 'settled' && cause !== 'driven') return; // (a blow's end is its fall, heard on sentinel.fall)
    if (!this.ok() || !this.allow('sentinelSink', 0.5)) return;
    const t = this.ctx.currentTime, d = this.sentinelOut('sink', 0.4, 0.7);
    this.noise(t, 1.8, { type: 'lowpass', f0: 1400, f1: 400, gain: 0.25, attack: 0.4, dest: d }); // (sinking into the sand)
    this.sentinelBreath(t + 0.2, 1.8, hz(ROOT), cause === 'driven' ? hz(ROOT - 3) : hz(ROOT), 0.045, d); // (held; bent down when nothing was mended)
  }
}
