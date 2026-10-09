// ---------------------------------------------------------------------------------------
// THE AMBIENCE (game.ambience): what the weather and the time of day sound like where the Courier stands (docs/plans/WEATHER.md; the weather is
// Dovina's: game.weather, progress/weather.js). Each weather is a generative sound bed, never a loop (drops and gusts drawn as they fall,
// so a spell of twenty real minutes does not wear), scaled by its strength and crossfaded over seconds:
//   WONDER (the aurora)          near-silence: a glass shimmer very high in drifting fifths, the faint crackle heard under real auroras
//   MIRTH (the fox's wedding)    a sunshower: sparse bright drops on glaze, each ringing in the major pentatonic, warm air under them
//   DESIRE (the wanting wind)    a sirocco: hot wind in uneven gusts (a random walk, never a steady pump), sand hissing at the peaks
//   GRIEF (the long rain)        rain on clay: a dull dense patter on terracotta, the rain's hush, gutters dripping
//   DREAD (the pall)             fog: the world's sounds muffled (sfx.setFog), thunder rolling far off, real minutes apart (felt, never a crack)
//   FURY (the hail)              hail on clay and glaze: hard ticks that bounce once, now and then a glazed pot pinging; under it a hot low
//                                pressure that swells and leans (a random walk, as the sirocco's gusts); never thunder (thunder is dread's)
//   GALL (the miasma)            flies coming and going (a buzz that wanders near and away), a sour wet hum (the root and the flat second
//                                beating, in the music's key), a slow drip (docs/plans/GALL-AND-FURY.md section 11)
// The time of day: birds at dawn; at night insects, and a faint chord in the air where Lachryma glows. Under a roof the mood is there but
// nothing falls: the rain and the wind are heard muffled through it, the sky's own sounds not at all; down a Well (deep) the Well's music
// is the place's mood and the sound beds rest. An agate sky (a second mood under the first: progress/weather.js) plays both sound beds by
// their shares. Under the title, the pause menu, the Codex, the Index, the map and the workbench everything rests (and the fog lifts).
// On the rail, the ship's Umbral form (game.emocean.form === 'umbral') puts the world and the music under the crude (sfx.setUnder,
// game.music.setUnder) and the crossing of the surface splashes (sfx.railSurface).
// The held and dropped tones (the glass, the glow, the sunshower, the far bell) are keyed to what is playing (game.music.grid().root). And the mood and the night are handed to the music (music/player.js setMood, setNight).
//
// Prior art: generative ambience (Brian Eno's systems; the rain of Red Dead Redemption 2 and Breath of the Wild, drawn drop by drop),
// the classic synthesis of rain (filtered noise plus impulses) and wind (noise through a band-pass whose centre wanders), thunder as a
// low rumble that arrives late (distance), the dawn chorus, and night insects (pulse trains around 4 to 5 kHz); hail as impulses with a
// bounce (Andy Farnell's Designing Sound, rain and hail), a fly as a sawtooth buzz through a wing's band-pass with its pitch and level
// drifting (Doppler and distance), a drip as a sine swept up (the bubble's resonance rising as it closes: Minnaert).
//
//   game.ambience = new Ambience(game)   (listens for weather.now, weather.change, day.phase; reads game.weather.here(pos) twice a second)
// ---------------------------------------------------------------------------------------
import { sfx } from './sfx.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MIRTH = [88, 90, 92, 95, 97, 100]; // (E6 major pentatonic: the sunshower's drops, moved to the music's key)
const TICK = 0.25, AHEAD = TICK; // (real seconds between ticks; drops are laid out over exactly one tick, so the rates are as written)

export class Ambience {
  constructor(game) {
    this.game = game;
    this.want = { aspect: null, strength: 0, exposure: 'open', phase: 'day' };
    this.next = { thunder: 0, bell: 0, drip: 0 };
    for (const e of ['weather.now', 'weather.change']) game.events?.on(e, (w) => Object.assign(this.want, { aspect: w.aspect, strength: w.strength ?? 0, second: w.second || null, secondStrength: w.secondStrength ?? (w.second ? (w.strength ?? 0) * 0.5 : 0), cancelled: w.cancelled || null, exposure: w.exposure || 'open' }));
    game.events?.on('day.phase', (d) => { this.want.phase = d.phase; });
    this.timer = setInterval(() => this.tick(), TICK * 1000);
    this.sent = new Map(); // (the last value set on each parameter: nothing is set again unless it moved)
    this.polled = 0;
  }

  /** The buses, built once the sound is awake: a sound-bed bus through a roof (a low-pass) into the effects. */
  build() {
    const c = sfx.ctx;
    this.bus = c.createGain(); this.bus.gain.value = 1;
    this.roof = c.createBiquadFilter(); this.roof.type = 'lowpass'; this.roof.frequency.value = 18000; this.roof.Q.value = 0.5;
    this.bus.connect(this.roof).connect(sfx.master);
    const loop = (filters) => { const s = c.createBufferSource(); s.buffer = sfx.noiseBuf; s.loop = true; const g = c.createGain(); g.gain.value = 0; let n = s; for (const f of filters) { n.connect(f); n = f; } n.connect(g).connect(this.bus); s.start(); return { id: `n${this.ids = (this.ids || 0) + 1}`, src: s, g, f: filters }; };
    const filt = (type, f, q = 0.7) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    this.rain = loop([filt('bandpass', 1600, 0.5), filt('lowpass', 4500)]); // (grief's hush; mirth's lighter one)
    this.wind = loop([filt('bandpass', 500, 1.2)]); // (the sirocco: its centre and its level wander)
    this.sand = loop([filt('highpass', 5000)]);
    this.pall = loop([filt('lowpass', 300, 0.5)]); // (the fog's hush: a breath of low air, so the pall is a presence before its thunder)
    this.heat = loop([filt('lowpass', 140, 0.9), filt('highpass', 35)]); // (fury's hot low pressure: its level leans with the gust's walk)
    const tones = (notes, type = 'sine') => { const g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const os = notes.map((m) => { const o = c.createOscillator(); o.type = type; o.frequency.value = hz(m); o.connect(g); o.start(); return o; }); return { id: `n${this.ids = (this.ids || 0) + 1}`, g, os }; };
    this.glass = tones([88, 95, 100]); // (the aurora: E6, B6, E7)
    this.glow = tones([52, 59, 64]); // (Lachryma glowing at night: E3, B3, E4)
    this.sour = tones([40, 41], 'triangle'); // (gall's hum: E2 and F2 a half step apart, beating; moved to the music's key)
    this.gust = 0.5; this.gustV = 0; this.windF = 500;
  }

  /** A menu or a screen is over the game (the title, the pause menu, the Codex, the Index, the map, the workbench): the world rests. */
  menusUp() {
    const g = this.game, ov = typeof document !== 'undefined' ? document.getElementById('overlay') : null;
    return !!(g.title?.active || g.codex?.open || g.workbench?.open || g.indexMenu?.open || g.cartography?.open || (ov && ov.style.display !== 'none' && !window.__game?.manual));
  }
  /** Set a parameter only when its value has moved (a tick that changes nothing touches nothing). */
  ease(key, param, v, tau, t) { const was = this.sent.get(key); if (was !== undefined && Math.abs(was - v) < 1e-4) return; this.sent.set(key, v); param.setTargetAtTime(v, t, tau); }

  tick() {
    if (!sfx.ok?.()) return;
    if (!this.bus) this.build();
    const g = this.game, W = this.want, c = sfx.ctx, t = c.currentTime;
    const under = !!(g.emocean?.stage?.active && g.emocean.form === 'umbral'); // (the rail's Umbral form: everything heard through the crude)
    if (under !== !!this.under) { sfx.railSurface?.(under); this.under = under; sfx.setUnder?.(under); g.music?.setUnder?.(under); }
    const quiet = this.menusUp();
    this.ease('bus', this.bus.gain, quiet ? 0 : 1, 0.25, t);
    if (quiet) { if (this.fog) { this.fog = 0; sfx.setFog?.(0); } if (this.moodSent !== 'quiet') { this.moodSent = 'quiet'; g.music?.setMood?.(null, 0); } return; }
    const root = g.music?.grid?.()?.root ?? 64, key = ((((root - 64) % 12) + 18) % 12) - 6; // (semitones from E to the music's key, -6..5)
    this.key = key;
    if ((this.polled -= 0.25) <= 0 && g.weather?.here && g.player?.pos) { // (twice a second: walking under a roof changes the exposure without an event)
      this.polled = 0.5;
      const w = g.weather.here(g.player.pos); Object.assign(W, { aspect: w.aspect, strength: w.strength ?? 0, second: w.second || null, secondStrength: w.secondStrength ?? 0, cancelled: w.cancelled || null, exposure: w.exposure || 'open' });
      if (w.dayPhase) W.phase = w.dayPhase;
    }
    const deep = W.exposure === 'deep', roofed = W.exposure === 'roofed', k = deep ? 0 : W.strength || 0, A = deep ? null : W.aspect;
    const night = W.phase === 'night', open = !roofed && !deep;
    const B = deep ? null : W.second, k2 = B ? W.secondStrength || 0 : 0, w = (a) => (A === a ? k : 0) + (B === a ? k2 : 0); // (an agate: both sound beds by their shares)
    this.ease('roof', this.roof.frequency, roofed ? 650 : 18000, 0.4, t);
    const set = (node, v) => this.ease(node.id, node.g.gain, v, 1.5, t);
    set(this.rain, (0.1 * w('grief') + 0.025 * w('mirth')) * (roofed ? 1.6 : 1));
    this.ease('rainf', this.rain.f[0].frequency, w('mirth') > w('grief') ? 3800 : 1600, 1, t);
    // the sirocco's gusts: a random walk, so it never pumps at a steady rate
    this.gustV = 0.85 * this.gustV + (Math.random() - 0.5) * 0.12; this.gust = Math.max(0.15, Math.min(1, this.gust + this.gustV));
    this.windF = Math.max(250, Math.min(1400, this.windF + (Math.random() - 0.5) * 60 + (this.gust - 0.5) * 20));
    if (w('desire')) this.wind.f[0].frequency.setTargetAtTime(this.windF, t, 0.3);
    set(this.wind, 0.16 * w('desire') * this.gust); set(this.sand, open ? 0.025 * w('desire') * this.gust * this.gust : 0);
    set(this.pall, 0.05 * w('dread') * (open ? 1 : 0.5));
    set(this.heat, 0.09 * w('fury') * (0.5 + 0.5 * this.gust) * (open ? 1 : 0.6));
    set(this.sour, 0.006 * w('gall') * (open ? 1 : 0.5));
    if (w('gall')) this.sour.os.forEach((o, i) => o.detune.setTargetAtTime(key * 100 + (i ? Math.sin(t * 0.07) * 14 : 0), t, 2)); // (the flat second souring and back)
    set(this.glass, (open ? 0.005 : 0.001) * w('wonder'));
    if (w('wonder')) this.glass.os.forEach((o, i) => o.detune.setTargetAtTime(key * 100 + Math.sin(t * (0.05 + i * 0.013)) * 9, t, 2)); // (the fifths drifting, in the music's key)
    this.glow.os.forEach((o, i) => this.ease(`glow${i}`, o.detune, key * 100, 0.5, t));
    set(this.glow, night && open ? 0.004 : 0);
    const fog = (open ? 0.75 : 0.35) * w('dread'); if (Math.abs(fog - (this.fog ?? -1)) > 1e-3) { this.fog = fog; sfx.setFog?.(fog); }
    this.drops(w, roofed, open, night, t, !A);
    const mood = `${A}:${k.toFixed(2)}:${B}:${k2.toFixed(2)}:${deep ? '' : W.cancelled}`;
    if (mood !== this.moodSent) { this.moodSent = mood; g.music?.setMood?.(A, k, B, k2, deep ? null : W.cancelled); }
    if (night !== this.nightSent) { this.nightSent = night; g.music?.setNight?.(night); }
  }

  /** Thunder far off: a long low roll on a looping noise (the mixer's burst is only two real seconds long), swelling and dying away. */
  thunder(t, dur, v) {
    const c = sfx.ctx, src = c.createBufferSource(); src.buffer = sfx.noiseBuf; src.loop = true; src.playbackRate.value = 0.6;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(70, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 1.4); g.gain.setTargetAtTime(0.0001, t + 1.6, (dur - 1.6) / 3); // (a slow tail: the roll dies away over the whole of it)
    src.connect(lp).connect(g).connect(this.bus); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.1);
  }

  /** A fly passing: a buzz through a wing's band-pass, its pitch and level wandering as it comes near and goes (gall's). */
  fly(t, dur, k) {
    const c = sfx.ctx, o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain(), f = 170 + Math.random() * 70;
    o.type = 'sawtooth'; bp.type = 'bandpass'; bp.frequency.value = 1100 + Math.random() * 600; bp.Q.value = 1.4;
    o.frequency.setValueAtTime(f, t); for (let s = 0.3; s < dur; s += 0.3) o.frequency.linearRampToValueAtTime(f * (0.9 + Math.random() * 0.2), t + s); // (its wings' pitch wandering: near and away)
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.012 * k, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.004 * k, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(bp).connect(g).connect(this.bus); o.start(t); o.stop(t + dur + 0.05);
  }

  /** What falls and calls in the next moment: drops, crackle, thunder, a far bell, insects, birds. */
  drops(w, roofed, open, night, t, calm) {
    const d = this.bus, n = (rate) => { let m = 0, r = rate * AHEAD; while (r > 0) { if (Math.random() < Math.min(1, r)) m++; r -= 1; } return m; };
    const at = () => t + 0.05 + Math.random() * AHEAD;
    if (w('grief')) for (let i = n(28 * w('grief')); i--;) { const s = at(), f = 260 + Math.random() * 380; sfx.tone(s, 0.035, { f0: f, f1: f * 0.8, type: 'triangle', gain: 0.05 * (roofed ? 0.6 : 1), dest: d }); sfx.noise(s, 0.012, { type: 'bandpass', f0: 2200 + Math.random() * 1500, q: 2, gain: 0.04, dest: d }); }
    if (Math.random() < 0.6 * AHEAD * w('grief')) { const s = at(), f = 700 + Math.random() * 300; sfx.tone(s, 0.07, { f0: f, f1: f * 1.8, gain: 0.04, dest: d }); } // (a gutter)
    if (w('mirth')) for (let i = n(4 * w('mirth')); i--;) { const s = at(), f = hz(MIRTH[Math.floor(Math.random() * MIRTH.length)] + (this.key || 0)); sfx.tone(s, 0.3, { f0: f, f1: f, gain: 0.035, dest: d }); sfx.tone(s, 0.12, { f0: f * 2.76, f1: f * 2.76, gain: 0.01, dest: d }); }
    if (w('wonder') && open) for (let i = n(1.5 * w('wonder')); i--;) sfx.noise(at(), 0.006, { type: 'highpass', f0: 6000, gain: 0.03, dest: d });
    const kf = w('fury'); // (hail: a hard tick and its bounce; on a roof the ticks are thuds through it, the roof's low-pass)
    if (kf) for (let i = n(18 * kf); i--;) { const s = at(), f = 1400 + Math.random() * 1800, v = (0.04 + Math.random() * 0.03) * (roofed ? 1.4 : 1);
      sfx.tone(s, 0.018, { f0: f, f1: f * 0.5, type: 'triangle', gain: v, dest: d }); sfx.noise(s, 0.008, { type: 'highpass', f0: 3500, gain: v * 0.7, dest: d });
      if (Math.random() < 0.6) sfx.tone(s + 0.06 + Math.random() * 0.06, 0.012, { f0: f * 1.1, f1: f * 0.6, type: 'triangle', gain: v * 0.4, dest: d }); }
    if (kf && open && Math.random() < 0.8 * AHEAD * kf) { const s = at(), f = hz(83 + (this.key || 0) + [0, 3, 6, 7][Math.floor(Math.random() * 4)]); sfx.tone(s, 0.4, { f0: f, f1: f, gain: 0.02, dest: d }); sfx.tone(s, 0.2, { f0: f * 2.32, f1: f * 2.32, gain: 0.008, dest: d }); } // (a glazed pot struck: a ping in fury's mode)
    const kg = w('gall');
    if (kg && Math.random() < 0.35 * AHEAD * kg * (open ? 1 : 0.5)) this.fly(at(), 2 + Math.random() * 4, kg);
    if (kg && t > (this.next.drip || 0)) { if (this.next.drip) { const s = t + 0.05, f = 700 + Math.random() * 400; sfx.tone(s, 0.07, { f0: f, f1: f * 2.2, gain: 0.035, dest: d }); sfx.tone(s + 0.004, 0.02, { f0: 240, f1: 120, gain: 0.03, dest: d }); } this.next.drip = t + 1.6 + Math.random() * 3; }
    if (!kg) this.next.drip = 0;
    const kd = w('dread');
    if (kd && t > this.next.thunder) { // (far off: a long low roll, one to three real minutes apart; felt under the music, never a crack)
      if (this.next.thunder) this.thunder(t + 0.1, 5 + 2 * kd, 0.22 * kd * (open ? 1 : 0.5));
      this.next.thunder = t + 60 + Math.random() * 120;
    }
    if (kd && open && t > this.next.bell) { if (this.next.bell) { const f = hz(64 + (this.key || 0) + [0, 1, 7][Math.floor(Math.random() * 3)]); sfx.tone(t + 0.1, 2.5, { f0: f, f1: f * 0.995, gain: 0.015, dest: d }); } this.next.bell = t + 45 + Math.random() * 80; }
    if (!kd) this.next.thunder = this.next.bell = 0;
    if (night && open) for (let i = n(2.5); i--;) { const s = at(), f = 4300 + Math.random() * 500; for (let p = 0; p < 3; p++) sfx.tone(s + p * 0.035, 0.02, { f0: f, f1: f, gain: 0.006, dest: d }); }
    if (this.want.phase === 'dawn' && open && calm) for (let i = n(0.6); i--;) { const s = at(), f = 2400 + Math.random() * 900; sfx.tone(s, 0.12, { f0: f, f1: f * 1.35, gain: 0.012, dest: d }); }
  }
}
