// ---------------------------------------------------------------------------------------
// THE AMBIENCE (game.ambience): what the weather and the hour sound like where the Courier stands (docs/plans/WEATHER.md; the weather is
// Dovina's: game.weather, progress/weather.js). Each weather is a generative bed, never a loop (drops and gusts drawn as they fall, so a
// spell of twenty minutes does not wear), scaled by its strength and crossfaded over seconds:
//   WONDER (the aurora)          near-silence: a glass shimmer very high in drifting fifths, the faint crackle heard under real auroras
//   MIRTH (the fox's wedding)    a sunshower: sparse bright drops on glaze, each ringing in the major pentatonic, warm air under them
//   DESIRE (the wanting wind)    a sirocco: hot wind in uneven gusts (a random walk, never a steady pump), sand hissing at the peaks
//   GRIEF (the long rain)        rain on clay: a dull dense patter on terracotta, the rain's hush, gutters dripping
//   DREAD (the pall)             fog: the world's sounds muffled (sfx.setFog), thunder rolling far off minutes apart (felt, never a crack)
// The hour: birds at dawn; at night insects, and a faint chord in the air where Lachryma glows. Under a roof the mood is there but
// nothing falls: the rain and the wind are heard muffled through it, the sky's own sounds not at all; down a Well (deep) the Well's music
// is the place's mood and the beds rest. And the mood and the night are handed to the music (music/player.js setMood, setNight).
//
// Prior art: generative ambience (Brian Eno's systems; the rain of Red Dead Redemption 2 and Breath of the Wild, drawn drop by drop),
// the classic synthesis of rain (filtered noise plus impulses) and wind (noise through a band-pass whose centre wanders), thunder as a
// low rumble that arrives late (distance), the dawn chorus, and night insects (pulse trains around 4 to 5 kHz).
//
//   game.ambience = new Ambience(game)   (listens for weather.now, weather.change, day.phase; reads game.weather.here(pos) twice a second)
// ---------------------------------------------------------------------------------------
import { sfx } from './sfx.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MIRTH = [88, 90, 92, 95, 97, 100]; // (E6 major pentatonic: the sunshower's drops)
const AHEAD = 0.3; // (seconds of drops laid out ahead at each tick)

export class Ambience {
  constructor(game) {
    this.game = game;
    this.want = { aspect: null, strength: 0, exposure: 'open', phase: 'day' };
    this.next = { thunder: 0, bell: 0 };
    for (const e of ['weather.now', 'weather.change']) game.events?.on(e, (w) => Object.assign(this.want, { aspect: w.aspect, strength: w.strength ?? 0, exposure: w.exposure || 'open' }));
    game.events?.on('day.phase', (d) => { this.want.phase = d.phase; });
    this.timer = setInterval(() => this.tick(), 250);
    this.polled = 0;
  }

  /** The buses, built once the sound is awake: a bed bus through a roof (a low-pass) into the effects. */
  build() {
    const c = sfx.ctx;
    this.bus = c.createGain(); this.bus.gain.value = 1;
    this.roof = c.createBiquadFilter(); this.roof.type = 'lowpass'; this.roof.frequency.value = 18000; this.roof.Q.value = 0.5;
    this.bus.connect(this.roof).connect(sfx.master);
    const loop = (filters) => { const s = c.createBufferSource(); s.buffer = sfx.noiseBuf; s.loop = true; const g = c.createGain(); g.gain.value = 0; let n = s; for (const f of filters) { n.connect(f); n = f; } n.connect(g).connect(this.bus); s.start(); return { src: s, g, f: filters }; };
    const filt = (type, f, q = 0.7) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    this.rain = loop([filt('bandpass', 1600, 0.5), filt('lowpass', 4500)]); // (grief's hush; mirth's lighter one)
    this.wind = loop([filt('bandpass', 500, 1.2)]); // (the sirocco: its centre and its level wander)
    this.sand = loop([filt('highpass', 5000)]);
    this.pall = loop([filt('lowpass', 300, 0.5)]); // (the fog's hush: a breath of low air, so the pall is a presence before its thunder)
    const tones = (notes, type = 'sine') => { const g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const os = notes.map((m) => { const o = c.createOscillator(); o.type = type; o.frequency.value = hz(m); o.connect(g); o.start(); return o; }); return { g, os }; };
    this.glass = tones([88, 95, 100]); // (the aurora: E6, B6, E7)
    this.glow = tones([52, 59, 64]); // (Lachryma glowing at night: E3, B3, E4)
    this.gust = 0.5; this.gustV = 0; this.windF = 500;
  }

  tick() {
    if (!sfx.ok?.()) return;
    if (!this.bus) this.build();
    const g = this.game, W = this.want, c = sfx.ctx, t = c.currentTime;
    if ((this.polled -= 0.25) <= 0 && g.weather?.here && g.player?.pos) { // (twice a second: walking under a roof changes the exposure without an event)
      this.polled = 0.5;
      const w = g.weather.here(g.player.pos); Object.assign(W, { aspect: w.aspect, strength: w.strength ?? 0, exposure: w.exposure || 'open' });
      if (w.dayPhase) W.phase = w.dayPhase;
    }
    const deep = W.exposure === 'deep', roofed = W.exposure === 'roofed', k = deep ? 0 : W.strength || 0, A = deep ? null : W.aspect;
    const night = W.phase === 'night', open = !roofed && !deep;
    this.roof.frequency.setTargetAtTime(roofed ? 650 : 18000, t, 0.4);
    const set = (node, v) => node.g.gain.setTargetAtTime(v, t, 1.5);
    set(this.rain, (A === 'grief' ? 0.1 * k : A === 'mirth' ? 0.025 * k : 0) * (roofed ? 1.6 : 1));
    this.rain.f[0].frequency.setTargetAtTime(A === 'mirth' ? 3800 : 1600, t, 1);
    // the sirocco's gusts: a random walk, so it never pumps at a steady rate
    this.gustV = 0.85 * this.gustV + (Math.random() - 0.5) * 0.12; this.gust = Math.max(0.15, Math.min(1, this.gust + this.gustV));
    this.windF = Math.max(250, Math.min(1400, this.windF + (Math.random() - 0.5) * 60 + (this.gust - 0.5) * 20));
    this.wind.f[0].frequency.setTargetAtTime(this.windF, t, 0.3);
    set(this.wind, A === 'desire' ? 0.16 * k * this.gust : 0); set(this.sand, A === 'desire' && open ? 0.025 * k * this.gust * this.gust : 0);
    set(this.pall, A === 'dread' ? 0.05 * k * (open ? 1 : 0.5) : 0);
    set(this.glass, A === 'wonder' ? (open ? 0.005 : 0.001) * k : 0);
    this.glass.os.forEach((o, i) => o.detune.setTargetAtTime(Math.sin(t * (0.05 + i * 0.013)) * 9, t, 2)); // (the fifths drifting)
    set(this.glow, night && open ? 0.004 : 0);
    sfx.setFog?.(A === 'dread' ? (open ? 0.75 : 0.35) * k : 0);
    this.drops(A, k, roofed, open, night, t);
    g.music?.setMood?.(A, k); g.music?.setNight?.(night);
  }

  /** What falls and calls in the next moment: drops, crackle, thunder, a far bell, insects, birds. */
  drops(A, k, roofed, open, night, t) {
    const d = this.bus, n = (rate) => { let m = 0, r = rate * AHEAD; while (r > 0) { if (Math.random() < Math.min(1, r)) m++; r -= 1; } return m; };
    const at = () => t + 0.05 + Math.random() * AHEAD;
    if (A === 'grief') for (let i = n(28 * k); i--;) { const s = at(), f = 260 + Math.random() * 380; sfx.tone(s, 0.035, { f0: f, f1: f * 0.8, type: 'triangle', gain: 0.05 * (roofed ? 0.6 : 1), dest: d }); sfx.noise(s, 0.012, { type: 'bandpass', f0: 2200 + Math.random() * 1500, q: 2, gain: 0.04, dest: d }); }
    if (A === 'grief' && Math.random() < 0.6 * AHEAD * k) { const s = at(), f = 700 + Math.random() * 300; sfx.tone(s, 0.07, { f0: f, f1: f * 1.8, gain: 0.04, dest: d }); } // (a gutter)
    if (A === 'mirth') for (let i = n(4 * k); i--;) { const s = at(), f = hz(MIRTH[Math.floor(Math.random() * MIRTH.length)]); sfx.tone(s, 0.3, { f0: f, f1: f, gain: 0.035, dest: d }); sfx.tone(s, 0.12, { f0: f * 2.76, f1: f * 2.76, gain: 0.01, dest: d }); }
    if (A === 'wonder' && open) for (let i = n(1.5 * k); i--;) sfx.noise(at(), 0.006, { type: 'highpass', f0: 6000, gain: 0.03, dest: d });
    if (A === 'dread' && t > this.next.thunder) { // (far off: a long low roll, minutes apart; felt under the music, never a crack)
      if (this.next.thunder) sfx.noise(t + 0.1, 5 + 2 * k, { type: 'lowpass', f0: 180, f1: 70, q: 0.6, gain: 0.22 * k * (open ? 1 : 0.5), attack: 1.4, dest: d });
      this.next.thunder = t + 60 + Math.random() * 120;
    }
    if (A === 'dread' && open && t > this.next.bell) { if (this.next.bell) { const f = hz(64 + [0, 1, 7][Math.floor(Math.random() * 3)]); sfx.tone(t + 0.1, 2.5, { f0: f, f1: f * 0.995, gain: 0.015, dest: d }); } this.next.bell = t + 45 + Math.random() * 80; }
    if (A !== 'dread') this.next.thunder = this.next.bell = 0;
    if (night && open) for (let i = n(2.5); i--;) { const s = at(), f = 4300 + Math.random() * 500; for (let p = 0; p < 3; p++) sfx.tone(s + p * 0.035, 0.02, { f0: f, f1: f, gain: 0.006, dest: d }); }
    if (this.want.phase === 'dawn' && open && !A) for (let i = n(0.6); i--;) { const s = at(), f = 2400 + Math.random() * 900; sfx.tone(s, 0.12, { f0: f, f1: f * 1.35, gain: 0.012, dest: d }); }
  }
}
