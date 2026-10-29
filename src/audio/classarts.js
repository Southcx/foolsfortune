// ---------------------------------------------------------------------------------------
// THE CLASS ARTS' SOUNDS (CLASS-ARTS.md; Petra's runtime courier/classarts/, wave 1: the Fool and the four Knights), heard through
// audio/cues.js on `art.use`, `art.fire`, `art.end`, `vessel.ward` and `move.waterwalk`. An action is heard as the deed it is,
// a reaction as a small answer under what the body is already doing; an accented art (the class read now lifts it) adds a high
// glint over its sound.
//   BEGINNER'S LUCK  used: a coin flipped and spinning; spent on a roll (fire): two dice rattled and a chime as the better is kept
//   RUNNING ON EMPTY fire: a hollow breath as the pool runs dry and a bright open fifth (it costs nothing now); end: the fifth sighing down
//   ONRUSH           used: a short horn's call over the blink's own whoosh (the knight's charge)
//   MOMENTUM         fire: the sprint's weight landing in the blow, a deep thwack and a gong's bloom
//   WATER WALK       used: a liquid shimmer rising; taking the surface (move.waterwalk): a plip and a held glassy hum
//   GALLANT          fire: a parry repaid, three bright notes climbing
//   RIPOSTE RUSH     used: a blade scraped along a blade, then the strike's ring, over the blink
//   EDGE             fire: a keen ting
//   BULWARK          used: a shield planted, a heavy thunk and a low ring; end: the brace let go, a clank
//   STEADFAST        (vessel.ward; its own art.fire is the same moment and stays silent) a blow turned aside: a dull thud on stone
//                    and a bell's warm hum
//
// Prior art: Final Fantasy Tactics' ability chimes (a reaction's small fanfare), Dark Souls' buff hums, Hades' boon pickups (each god
// its own colour of sound), a herald's horn for a charge.
//
//   sfx.artUse(art, accented) .artFire(art) .artEnd(art) .artWard() .artWaterwalk()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class ClassArtSounds {
  /** The accent's glint: a high partial over an accented art. */
  artGlint(t, d) { this.tone(t + 0.05, 0.5, { f0: hz(100), gain: 0.04, dest: d }); this.tone(t + 0.05, 0.25, { f0: hz(100) * 2.76, gain: 0.01, dest: d }); }

  artUse(art, accented = false) {
    if (!this.ok() || !this.allow(`artUse.${art}`, 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.4);
    switch (art) {
      case 'beginnersLuck':
        this.tone(t, 0.06, { f0: hz(93), gain: 0.15, dest: d }); this.tone(t, 0.25, { f0: hz(93) * 2.76, gain: 0.04, dest: d }); // (the flick)
        for (let i = 0; i < 7; i++) this.tone(t + 0.08 + i * 0.07, 0.05, { f0: hz(88 + (i % 2) * 3), gain: 0.06 - i * 0.006, dest: d }); // (spinning)
        break;
      case 'charge':
        [[64, 0], [71, 0.1], [76, 0.2]].forEach(([m, dt]) => this.tone(t + dt, dt === 0.2 ? 0.4 : 0.12, { f0: hz(m), type: 'sawtooth', gain: 0.15, dest: d })); // (a horn's call)
        break;
      case 'wade':
        this.noise(t, 0.6, { type: 'bandpass', f0: 1200, f1: 4000, q: 4, gain: 0.15, attack: 0.1, dest: d });
        [76, 83, 88].forEach((m, i) => this.tone(t + 0.1 * i, 0.6, { f0: hz(m), gain: 0.1, dest: d })); // (a liquid shimmer rising)
        break;
      case 'ripostRush':
        this.noise(t, 0.18, { type: 'bandpass', f0: 3500, f1: 6500, q: 5, gain: 0.45, dest: d }); // (blade along blade)
        this.tone(t + 0.2, 0.5, { f0: 1760, gain: 0.08, dest: d }); this.tone(t + 0.2, 0.3, { f0: 1760 * 2.76, gain: 0.03, dest: d }); // (the strike's ring)
        break;
      case 'bulwark':
        this.noise(t, 0.12, { type: 'lowpass', f0: 600, gain: 0.5, dest: d }); this.tone(t, 0.25, { f0: 110, f1: 70, type: 'triangle', gain: 0.35, dest: d }); // (planted)
        this.tone(t + 0.02, 1.2, { f0: 220, gain: 0.06, dest: d }); this.tone(t + 0.02, 0.8, { f0: 220 * 2.76, gain: 0.02, dest: d }); // (its low ring)
        break;
      default: this.tone(t, 0.3, { f0: hz(81), gain: 0.06, dest: d }); // (an art not voiced yet: a plain chime)
    }
    if (accented) this.artGlint(t, d);
  }
  artFire(art) {
    if (art === 'steadfast' || !this.ok() || !this.allow(`artFire.${art}`, 3)) return; // (Steadfast: vessel.ward's sound)
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4);
    switch (art) {
      case 'beginnersLuck':
        for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) this.noise(t + k * 0.18 + i * 0.05, 0.015, { type: 'bandpass', f0: 1800 + k * 300, q: 3, gain: 0.4, dest: d }); // (two dice)
        this.tone(t + 0.45, 0.7, { f0: hz(88), gain: 0.13, dest: d }); this.tone(t + 0.55, 0.8, { f0: hz(95), gain: 0.11, dest: d }); // (the better kept)
        break;
      case 'zero':
        this.noise(t, 0.5, { type: 'bandpass', f0: 500, f1: 250, q: 1, gain: 0.2, dest: d }); // (the hollow breath)
        [64, 71].forEach((m) => this.tone(t + 0.3, 1.2, { f0: hz(m + 12), type: 'triangle', gain: 0.12, dest: d })); // (an open fifth: free)
        break;
      case 'momentum':
        this.tone(t, 0.3, { f0: 90, f1: 50, type: 'triangle', gain: 0.4, dest: d }); this.noise(t, 0.06, { type: 'lowpass', f0: 900, gain: 0.4, dest: d });
        this.tone(t + 0.02, 1.4, { f0: 147, gain: 0.08, dest: d }); this.tone(t + 0.02, 1, { f0: 147 * 2.76, gain: 0.03, dest: d }); // (a gong's bloom)
        break;
      case 'gallant': [83, 88, 95].forEach((m, i) => this.tone(t + i * 0.06, 0.4, { f0: hz(m), type: 'triangle', gain: 0.13, dest: d })); break;
      case 'edge': this.tone(t, 0.35, { f0: hz(98), gain: 0.13, dest: d }); this.tone(t, 0.15, { f0: hz(98) * 2.76, gain: 0.04, dest: d }); break;
      default: this.tone(t, 0.3, { f0: hz(86), gain: 0.05, dest: d });
    }
  }
  artEnd(art) {
    if (!this.ok() || !this.allow(`artEnd.${art}`, 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.4);
    if (art === 'zero') [64, 71].forEach((m) => this.tone(t, 0.8, { f0: hz(m + 12), f1: hz(m + 7), type: 'triangle', gain: 0.07, dest: d })); // (the fifth sighing down)
    else if (art === 'bulwark') { this.noise(t, 0.05, { type: 'bandpass', f0: 1800, q: 3, gain: 0.25, dest: d }); this.tone(t, 0.15, { f0: 330, f1: 260, type: 'triangle', gain: 0.1, dest: d }); } // (the brace let go)
  }
  /** Steadfast turning a blow aside (vessel.ward): a dull thud on stone, a bell's warm hum. */
  artWard() {
    if (!this.ok() || !this.allow('artWard', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5);
    this.noise(t, 0.08, { type: 'lowpass', f0: 500, gain: 0.45, dest: d }); this.tone(t, 0.2, { f0: 100, f1: 70, type: 'triangle', gain: 0.25, dest: d });
    this.tone(t + 0.03, 1.4, { f0: hz(64), gain: 0.08, dest: d }); this.tone(t + 0.03, 0.8, { f0: hz(64) * 2.76, gain: 0.02, dest: d });
  }
  /** Water Walk taking the surface (move.waterwalk): a plip, a held glassy hum. */
  artWaterwalk() {
    if (!this.ok() || !this.allow('artWaterwalk', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.6);
    this.tone(t, 0.08, { f0: 1400, f1: 700, gain: 0.2, dest: d });
    this.tone(t + 0.05, 1.5, { f0: hz(88), gain: 0.035, dest: d }); this.tone(t + 0.05, 1.5, { f0: hz(95), gain: 0.02, dest: d });
  }
}
