// A sound bank of the one mixer (audio.js): treasure: cubes, chests by tier, the colour roulette, the Tithe, the prismatic chest's rave.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class TreasureSounds {
  /** A cube taken: a glassy tick that climbs a pentatonic scale with each one taken in a row (Mario's coins, Zelda's rupees). */
  cubeGet(combo = 0) {
    if (!this.ok() || !this.allow('cubeGet', 40)) return;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const semis = combo < scale.length ? scale[combo] : 24 + Math.min(12, combo - scale.length + 1);
    const f = 784 * Math.pow(2, semis / 12);
    const t = this.ctx.currentTime, d = this.out(0.14, 0.5);
    this.tone(t, 0.16, { f0: f, f1: f, type: 'sine', gain: 0.5, dest: d });
    this.tone(t, 0.08, { f0: f * 2.02, f1: f * 2, type: 'sine', gain: 0.16, dest: d });
    this.noise(t, 0.012, { type: 'highpass', f0: 6500, gain: 0.2, dest: d });
  }

  /** A cube on stone: a small hard glass click. */
  cubeClack(speed = 2, dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.3, 0.05 + speed * 0.03) / (0.5 + dist * 0.12), 0.35);
    const f = 2400 + Math.random() * 2400;
    this.tone(t, 0.05, { f0: f, f1: f * 0.9, type: 'square', gain: 0.1, dest: d });
    this.noise(t, 0.03, { type: 'bandpass', f0: f * 0.8, q: 6, gain: 0.8, dest: d });
  }

  /** A cube leaving the chest: a pop that climbs as the fountain runs (k 0..1). */
  cubePop(k = 0) {
    if (!this.ok() || !this.allow('cubePop', 34)) return;
    const t = this.ctx.currentTime, d = this.out(0.13, 0.4), f = 520 * Math.pow(2, k * 2.2);
    this.tone(t, 0.07, { f0: f * 1.3, f1: f, type: 'triangle', gain: 0.6, dest: d });
    this.noise(t, 0.02, { type: 'bandpass', f0: 3000, q: 3, gain: 0.3, dest: d });
  }

  /** The chest gathers itself: a wooden knock that tightens (k 0..1). */
  chestKnock(k = 0) {
    if (!this.ok() || !this.allow('knock', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.4);
    this.tone(t, 0.12, { f0: 150 + 120 * k, f1: 70 + 40 * k, gain: 0.8, dest: d });
    this.noise(t, 0.05, { type: 'bandpass', f0: 700 + 600 * k, q: 2, gain: 0.5, dest: d });
  }

  /** The build-up: a riser sized to the tier it is building toward. */
  chestCharge(dur = 1.2, tier = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.5);
    this.riser(t, dur, { f0: 80, f1: 260 + tier * 220, type: 'sawtooth', gain: 0.08 + tier * 0.02, q: 2, dest: d });
    this.riser(t, dur, { f0: 220, f1: 880 + tier * 440, type: 'sine', gain: 0.1, dest: d });
    this.noise(t, dur, { type: 'bandpass', f0: 500, f1: 5000 + tier * 1500, q: 1.2, gain: 0.25, attack: dur * 0.9, dest: d });
  }

  /** One step of the colour roulette: a bell on the colour it landed on (i: which colour, 0..4). */
  chestTick(i = 0) {
    if (!this.ok() || !this.allow('roulette', 9)) return;
    const f = [262, 330, 392, 523, 784][Math.max(0, Math.min(4, i))];
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.tone(t, 0.32, { f0: f, f1: f, type: 'sine', gain: 0.4, dest: d });
    this.tone(t, 0.18, { f0: f * 2.76, f1: f * 2.76, type: 'sine', gain: 0.1, dest: d });
    this.tone(t, 0.05, { f0: 900, f1: 300, gain: 0.35, dest: d });
  }

  /** The lid goes, sized to its tier. */
  chestBurst(tier = 0) {
    if (!this.ok()) return;
    tier = Math.max(0, Math.min(4, Math.round(tier)));
    const t = this.ctx.currentTime, d = this.out(0.6 + 0.1 * tier, 0.9);
    this.noise(t, 0.3 + 0.1 * tier, { type: 'highpass', f0: 5000, f1: 600, gain: 0.9, dest: d });
    this.tone(t, 0.3, { f0: 130, f1: 38, gain: 1.1, dest: d });
    this.noise(t, 0.06, { type: 'bandpass', f0: 900, q: 1.4, gain: 0.7, dest: d }); // (the wood)
    const rows = [[1], [1, 1.5], [1, 1.25, 1.5, 2], [1, 1.19, 1.5, 1.78, 2, 2.38], [1, 1.25, 1.5, 1.88, 2, 2.5, 3, 3.76]][tier];
    rows.forEach((r, i) => {
      this.tone(t + 0.02 + i * 0.03, 0.9 + 0.35 * tier, { f0: 392 * r, f1: 392 * r, type: i % 2 ? 'sine' : 'triangle', gain: 0.16, dest: d });
      if (tier >= 3) this.tone(t + 0.02 + i * 0.03, 1.4, { f0: 392 * r * 1.006, f1: 392 * r * 1.006, type: 'sawtooth', gain: 0.02, dest: d });
    });
    const n = 3 + tier * 4;
    for (let i = 0; i < n; i++) this.tone(t + 0.05 + Math.random() * 0.6, 0.2, { f0: 1600 + Math.random() * 3600, f1: 1500 + Math.random() * 3000, type: 'sine', gain: 0.07, dest: d });
  }

  /** What comes out of the chest, held up: a bell figure that climbs, longer for the higher tiers. */
  curioReveal(tier = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.9);
    const notes = [523, 659, 784, 988, 1175, 1318, 1568];
    const n = 3 + tier;
    for (let i = 0; i < n; i++) {
      this.tone(t + i * 0.09, 0.9, { f0: notes[i], f1: notes[i], type: 'sine', gain: 0.2, dest: d });
      this.tone(t + i * 0.09, 0.4, { f0: notes[i] * 2.76, f1: notes[i] * 2.76, type: 'sine', gain: 0.05, dest: d });
    }
    if (tier >= 3) this.tone(t + n * 0.09, 2.2, { f0: 261, f1: 261, type: 'triangle', gain: 0.12, dest: d });
  }

  /** Cubes into the Tithe: a coin in a slot, and something deep taking note. */
  tithe() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.6);
    for (let i = 0; i < 4; i++) this.tone(t + i * 0.05, 0.1, { f0: 2600 - i * 200, f1: 2000 - i * 200, type: 'square', gain: 0.05, dest: d });
    this.noise(t, 0.05, { type: 'bandpass', f0: 3500, q: 6, gain: 0.5, dest: d });
    this.tone(t + 0.24, 0.5, { f0: 92, f1: 55, gain: 0.7, dest: d });
  }

  /** A chest that lands hard. */
  chestLand(size = 1) {
    if (!this.ok()) return;
    size = Math.max(0.3, size);
    const t = this.ctx.currentTime, d = this.out(0.7, 0.5);
    this.tone(t, 0.25, { f0: 110 / Math.sqrt(size), f1: 40, gain: 1, dest: d });
    this.noise(t, 0.1, { type: 'lowpass', f0: 1500, f1: 200, gain: 0.7, dest: d });
    this.noise(t + 0.02, 0.05, { type: 'bandpass', f0: 2600, q: 5, gain: 0.3, dest: d });
  }

  /**
   * The prismatic chest's music: four on the floor at 124 bpm, an offbeat bass, claps, hats and a square-wave arpeggio, the bass and
   * arpeggio ducked on every kick. Scheduled a little ahead of the clock (the usual WebAudio metronome), from a two-bar figure that
   * repeats. Returns { stop(fade), t0, spb, phase() } so that the lights can keep the beat, or null when there is no audio.
   */
  raveLoop(bpm = 124) {
    if (!this.ok()) return null;
    const ctx = this.ctx, spb = 60 / bpm, s16 = spb / 4;
    const bus = ctx.createGain(); bus.gain.value = 0.0001; bus.connect(this.master);
    bus.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.2);
    const send = ctx.createGain(); send.gain.value = 0.25; bus.connect(send).connect(this.verbSend);
    const duck = ctx.createGain(); duck.connect(bus);
    const NOTE = (n) => 55 * Math.pow(2, n / 12);
    const bassLine = [0, 0, 3, 0, 5, 0, 3, -2]; // (A, A, C, A, D, A, C, G: per offbeat eighth)
    const arpNotes = [12, 15, 19, 24, 19, 15, 12, 7];
    const t0 = ctx.currentTime + 0.06;
    let next = t0, step = 0, alive = true;
    const kick = (t) => {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(1, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(e).connect(bus); o.start(t); o.stop(t + 0.3);
      duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(0.18, t); duck.gain.linearRampToValueAtTime(1, t + s16 * 3.2);
    };
    const clap = (t) => { for (let i = 0; i < 3; i++) this.noise(t + i * 0.011, 0.09, { type: 'bandpass', f0: 1500, q: 1.3, gain: 0.5, dest: bus }); };
    const hat = (t, open) => this.noise(t, open ? 0.16 : 0.035, { type: 'highpass', f0: 8500, f1: 7000, gain: open ? 0.22 : 0.16, dest: bus });
    const bass = (t, n) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), e = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = NOTE(n); f.type = 'lowpass'; f.Q.value = 5;
      f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(140, t + s16 * 1.8);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.5, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + s16 * 1.9);
      o.connect(f).connect(e).connect(duck); o.start(t); o.stop(t + s16 * 2);
    };
    const arp = (t, n, k) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), e = ctx.createGain();
      o.type = 'square'; o.frequency.value = NOTE(n); f.type = 'lowpass'; f.Q.value = 3; f.frequency.value = 900 + 2600 * k;
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.09, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + s16 * 0.9);
      o.connect(f).connect(e).connect(duck); o.start(t); o.stop(t + s16);
    };
    const run = () => {
      while (alive && next < ctx.currentTime + 0.25) {
        const s = step % 16, bar = Math.floor(step / 16);
        if (s % 4 === 0) kick(next);
        if (s === 4 || s === 12) clap(next);
        if (s % 4 === 2) bass(next, bassLine[(bar * 4 + (s >> 2)) % bassLine.length]);
        if (s % 2 === 1) hat(next, s % 4 === 3 && s !== 15);
        if (bar >= 1 && s % 2 === 0) arp(next, arpNotes[(s >> 1) % arpNotes.length], Math.min(1, (step - 16) / 48));
        next += s16; step++;
      }
    };
    run();
    const id = setInterval(run, 25);
    return {
      t0, spb,
      /** the beat, and how far into it (audio time: a light that keeps this keeps the kick) */
      phase: () => (ctx.currentTime - t0) / spb,
      stop: (fade = 0.35) => {
        alive = false; clearInterval(id);
        bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3);
        setTimeout(() => { try { bus.disconnect(); send.disconnect(); duck.disconnect(); } catch { /* already gone */ } }, fade * 1000 + 400);
      },
    };
  }
}
