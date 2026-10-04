// A sound bank of the one mixer (audio/sfx.js): what a blow is made of (the five damage types, progress/combat/types.js), laid over the
// sound of the hit itself (which says the tool and the material), as Calissa's damage looks are laid over its sparks (vfx/library.js,
// 'damage.<type>'). The line from law to chaos is heard as the line from clean to smeared: the lawful are short, tuned and still (a
// pitch that does not move, an attack and nothing after); the chaotic are long, bent and never at rest (pitches that slide, a filter that
// wanders, a doubled image). And a mind tipping toward Prismatic (`prismatic`) is all five at once, pulling apart.
//   IMPACT     lawful, physical: a struck clay body, a thud and a dry crack, one pitch, no tail
//   EGO        lawful, mental: a glass bell in a fifth, exact and cold, ringing a moment and stopping
//   INFLUENCE  neutral, social: a warm third that swells and spreads (a ripple's tremolo, left to right), no edge
//   ILLUSION   chaotic, perceptual: a shimmer that bends up and down at once, glints at random, the whole thing heard twice
//   DELIRIUM   chaotic, entropic: a resonant smear sliding drunkenly down, a wobble, bubbles bursting
// (Called as sfx.damage(type, k) where the blow is struck, beside vfx.hit's `type`, once creatures.strike carries one: SYSTEMS.md B1.)
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//
// Prior art: Destiny's damage types (each element its own sound as well as its colour: Arc crackles, Void hums, Solar burns),
// Pokemon's type hit sounds, the "clean to dirty" axis of a sound designer's palette (a sine is order, filtered noise is entropy),
// and the owner's Law-Chaos line (docs/DESIGN.md, section 10).
const LIFT = { influence: 2, illusion: 1.4, delirium: 1.4 }; // (the soft ones brought up to sit as loud as the struck ones)

export class DamageSounds {
  /** A blow's type, over its hit: type is impact, ego, influence, illusion or delirium; k (0..1) how hard. */
  damage(type = 'impact', k = 1, { pan = 0 } = {}) {
    if (!this.ok() || !this.allow(`damage.${type}`, 12)) return;
    const c = this.ctx, t = c.currentTime, v = 0.5 + 0.5 * Math.min(1, k), d = this.out(0.28 * v * (LIFT[type] || 1), type === 'impact' ? 0.15 : 0.45);
    let dest = d;
    if (pan) { const p = c.createStereoPanner(); p.pan.value = pan; p.connect(d); dest = p; }
    if (type === 'impact') {
      this.tone(t, 0.12, { f0: 180, f1: 70, type: 'sine', gain: 0.7, dest });
      this.noise(t, 0.035, { type: 'bandpass', f0: 2800, q: 1.5, gain: 0.6, dest });
      this.tone(t, 0.05, { f0: 620, f1: 610, type: 'square', gain: 0.06, dest });
    } else if (type === 'ego') {
      for (const [f, a] of [[1319, 0.22], [1976, 0.16], [3956, 0.04]]) this.tone(t, 0.45, { f0: f, f1: f, gain: a, dest });
      this.noise(t, 0.01, { type: 'highpass', f0: 7000, gain: 0.3, dest });
    } else if (type === 'influence') {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = 7; tg.gain.value = 0.35; trem.connect(tg).connect(g.gain); trem.start(t); trem.stop(t + 0.75);
      const sp = c.createStereoPanner(); sp.pan.setValueAtTime(-0.5, t); sp.pan.linearRampToValueAtTime(0.5, t + 0.6); g.connect(sp).connect(dest);
      for (const [f, a] of [[659, 0.2], [831, 0.16], [988, 0.08]]) this.tone(t, 0.75, { f0: f, f1: f, gain: a, dest: g });
    } else if (type === 'illusion') {
      for (const late of [0, 0.07]) { // (heard twice: the doubled image)
        const a = late ? 0.5 : 1;
        this.tone(t + late, 0.5, { f0: 1100, f1: 1650, gain: 0.12 * a, dest });
        this.tone(t + late, 0.5, { f0: 1650, f1: 1100, gain: 0.12 * a, dest });
      }
      for (let i = 0; i < 6; i++) { const f = 2500 + Math.random() * 4000; this.tone(t + Math.random() * 0.4, 0.06, { f0: f, f1: f * 1.02, gain: 0.07, dest }); }
    } else if (type === 'delirium') {
      this.noise(t, 0.7, { type: 'bandpass', f0: 1400, f1: 260, q: 9, gain: 0.7, attack: 0.02, dest });
      const o = c.createOscillator(), g = c.createGain(), w = c.createOscillator(), wg = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.7);
      w.frequency.value = 5.5; wg.gain.value = 25; w.connect(wg).connect(o.frequency); // (the wobble)
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      o.connect(g).connect(dest); o.start(t); o.stop(t + 0.8); w.start(t); w.stop(t + 0.8);
      for (let i = 0; i < 4; i++) { const tt = t + 0.1 + Math.random() * 0.5, f = 500 + Math.random() * 600; this.tone(tt, 0.07, { f0: f, f1: f * 2, gain: 0.12, dest }); } // (bubbles)
    }
  }

  /** A mind tipping toward Prismatic (k 0..1: how far): the five at once, a chord whose voices drift apart as k rises, climbing. */
  prismatic(k = 0.5) {
    if (!this.ok() || !this.allow('prismatic', 2)) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.55, 0.6), spread = 0.004 + 0.03 * Math.min(1, k);
    [64, 67, 71, 74, 78].forEach((m, i) => { // (E minor ninth: the game's key, one voice a type)
      const f = 440 * Math.pow(2, (m + 12 - 69) / 12), p = c.createStereoPanner(); p.pan.value = (i - 2) * 0.35; p.connect(d);
      this.tone(t + i * 0.04, 1.2, { f0: f * (1 - spread * (i - 2)), f1: f * (1 + spread * (i - 2)) * (1 + 0.06 * k), gain: 0.07, dest: p });
    });
    this.noise(t, 1, { type: 'bandpass', f0: 3000, f1: 8000, q: 4, gain: 0.08 + 0.1 * k, attack: 0.4, dest: d });
  }
}
