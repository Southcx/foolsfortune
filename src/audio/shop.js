// A sound bank of the one mixer (audio.js): the shop. Cubes set down on the counter (one, a few, a heap), a purchase, a refusal, the
// kiln firing a glaze, a shelf restocked.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//
// Prior art: the shops of the era's games (Animal Crossing's register and Nook's "yes, yes", the rupee counter that rolls and
// chimes, Zelda's shop jingle), a glass bead on a wooden board (a hard click over a dull knock), and a real kiln: the gas burner's
// roar that swells as it is turned up, then, cooling, the high "pings" of a glaze crazing (the crackle raku is prized for).
export class ShopSounds {
  /** Cubes set down on the wooden counter: one is a click on a knock, a few a little run of them, a heap (n >= 6) a slide and a settle. */
  shopCubes(n = 1) {
    if (!this.ok() || !this.allow('shopCubes', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3), k = Math.min(24, Math.max(1, n | 0));
    const heap = k >= 6, count = heap ? 14 : k;
    for (let i = 0; i < count; i++) {
      const tt = t + (heap ? Math.pow(i / count, 0.7) * 0.45 : i * 0.075) + Math.random() * 0.012, f = 2600 + Math.random() * 2200;
      this.noise(tt, 0.025, { type: 'bandpass', f0: f, q: 8, gain: heap ? 0.5 : 0.75, dest: d });
      this.tone(tt, 0.05, { f0: f * 1.3, f1: f * 1.2, type: 'sine', gain: 0.07, dest: d });
      this.tone(tt, 0.07, { f0: 260, f1: 190, type: 'sine', gain: heap ? 0.12 : 0.22, dest: d }); // (the counter)
    }
    if (heap) this.noise(t, 0.5, { type: 'bandpass', f0: 3200, f1: 1800, q: 1.5, gain: 0.18, attack: 0.05, dest: d }); // (the slide)
  }

  /** A purchase: the cubes swept off the counter and a bright little bell that says it is done (two notes, up a fourth). */
  shopBuy() {
    if (!this.ok() || !this.allow('shopBuy', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.5);
    this.noise(t, 0.22, { type: 'bandpass', f0: 2600, f1: 4200, q: 2, gain: 0.25, attack: 0.03, dest: d });
    for (const [dt, f] of [[0.12, 1568], [0.24, 2093]]) {
      for (const [r, a] of [[1, 0.4], [2.76, 0.12], [5.4, 0.05]]) this.tone(t + dt, 0.9 / r, { f0: f * r, f1: f * r, gain: a, dest: d });
    }
  }

  /** A refusal: a soft wooden knock and two muted notes falling a minor third (not a buzzer: the shop is polite). */
  shopRefuse() {
    if (!this.ok() || !this.allow('shopRefuse', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.25);
    this.tone(t, 0.12, { f0: 180, f1: 130, type: 'sine', gain: 0.35, dest: d });
    this.noise(t, 0.04, { type: 'bandpass', f0: 900, q: 3, gain: 0.3, dest: d });
    this.tone(t + 0.06, 0.16, { f0: 523, f1: 520, type: 'triangle', gain: 0.18, dest: d });
    this.tone(t + 0.2, 0.25, { f0: 440, f1: 430, type: 'triangle', gain: 0.16, dest: d });
  }

  /** The kiln firing a glaze: the burner's roar swelling for `roar` seconds and dying, then the glaze crazing as it cools (pings). */
  kilnFire(roar = 3) {
    if (!this.ok() || !this.allow('kiln', 0.5)) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.3, 0.5), R = Math.max(1, roar);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.8, t + 0.6);
    g.gain.setValueAtTime(0.8, t + R); g.gain.exponentialRampToValueAtTime(0.0001, t + R + 1.2); g.connect(d);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(900, t + 0.8); lp.Q.value = 0.8;
    const flick = c.createOscillator(), fg = c.createGain(); flick.frequency.value = 7; fg.gain.value = 120; flick.connect(fg).connect(lp.frequency); // (the flame's flutter)
    src.connect(lp).connect(g); src.start(t); src.stop(t + R + 1.3); flick.start(t); flick.stop(t + R + 1.3);
    this.tone(t, R + 1, { f0: 55, f1: 50, type: 'sine', gain: 0.18, dest: d }); // (the burner's body)
    for (let i = 0; i < 9; i++) { // (cooling: the glaze crazes, a ping and then another, further apart)
      const tt = t + R + 1 + Math.pow(i, 1.4) * 0.35 + Math.random() * 0.2, f = 3200 + Math.random() * 2800;
      this.tone(tt, 0.12, { f0: f, f1: f * 0.995, gain: 0.09, dest: d });
      this.noise(tt, 0.01, { type: 'highpass', f0: 6000, gain: 0.15, dest: d });
    }
  }

  /** A shelf restocked: wood drawn out and pushed home, three pots set down on it, a brush of dust. */
  shopRestock() {
    if (!this.ok() || !this.allow('restock', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.35);
    this.noise(t, 0.3, { type: 'bandpass', f0: 600, f1: 900, q: 2, gain: 0.35, attack: 0.05, dest: d });
    for (const [dt, f] of [[0.35, 180], [0.5, 210], [0.62, 160]]) {
      this.tone(t + dt, 0.12, { f0: f * 1.6, f1: f, type: 'triangle', gain: 0.3, dest: d });
      this.noise(t + dt, 0.04, { type: 'bandpass', f0: 2600, q: 6, gain: 0.25, dest: d });
    }
    this.noise(t + 0.75, 0.25, { type: 'highpass', f0: 3000, gain: 0.08, attack: 0.05, dest: d });
  }
}
