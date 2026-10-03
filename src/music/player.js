// ---------------------------------------------------------------------------------------
// THE MUSIC: a score (music/dunes.js) played live by a small band of synthesized instruments, scheduled a little ahead of the audio
// clock (the WebAudio metronome, as the rave's loop is). Nothing is recorded: every note is built when it is played.
//
//   RHODES   two-operator FM (a sine modulating a sine at the same pitch, its index decaying, plus a high "tine" partial for the
//            attack), the way the DX7's electric pianos are made; panned slowly side to side
//   VIBES    a sine and its fourth partial, with the motor's tremolo
//   NEY      the desert's reed flute: a soft triangle, breath noise at the second partial, a scoop up into each note, a late vibrato
//   BASS     an upright: a triangle and a sine through a closing low-pass, a thump at the start
//   PAD      two detuned saws, high and quiet, through a slowly breathing low-pass: the sky
//   KIT      a brush sweep on two and four, a ride cymbal (inharmonic squares, high-passed) in the swing pattern, a darbuka (doum, tek)
//            and a finger cymbal
// Everything goes through a long reverb and a dotted-eighth echo (the lead), into the music bus, under the sound effects.
//
// Prior art: Chowning's FM synthesis and the DX7's E.PIANO; Chris Wilson's "A Tale of Two Clocks" (lookahead scheduling); the TR-808's
// cymbal (six detuned square waves, filtered); swing as a long-short eighth (about 2:1).
//
//   const m = new MusicPlayer(sfx)   m.follow(score | null) (per frame)   m.play(score)   m.stop(fade)   m.duck(seconds, to = 0.35)   m.setOn(on)
// ---------------------------------------------------------------------------------------
import { Arranger } from './arranger.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const KEY = 'foolsfortune.music.v1';

export class MusicPlayer {
  constructor(sfx) {
    this.sfx = sfx;
    this.score = null; this.alive = false; this.volume = 0.32;
    this.on = true;
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) this.on = !!s.on; } catch { /* default: on */ }
    // the scores that build and drop (the main theme) are played by the arranger (music/arranger.js); this player keeps the Dunes'
    this.arr = new Arranger(sfx);
    this.arr.onEnd = (sc) => { if (this.pick === sc) this.pick = null; }; // (a jingle chosen in the sound test plays once)
    this.pick = null; // (a track chosen in the sound test, played over whatever the place would play, until stopped)
  }
  setOn(on) { this.on = on; try { localStorage.setItem(KEY, JSON.stringify({ on })); } catch { /* this session */ } if (!on) { this.stop(1); this.arr.stop(1); } }
  /** What is playing now (either player's score), or null. */
  get current() { return this.arr.alive ? this.arr.score : this.alive ? this.score : null; }
  /** Per frame: the theme for where they are (or none), started and stopped with a fade. */
  follow(score) {
    score = this.pick || score;
    if (this.arr.finished && this.arr.finished !== score) this.arr.finished = null;
    if (this.on && score?.arrange) { if (this.alive) this.stop(1.2); this.arr.follow(score); return; }
    this.arr.follow(null);
    const want = this.on && score;
    if (want && (!this.alive || this.score !== score)) { if (this.alive) this.stop(1.5); else this.play(score); }
    else if (!want && this.alive) this.stop(2.5);
  }
  /** The beat to play along with (the Crucibelle plays in time and in tune with what is playing: moves/crucibelle.js): a bar's start
   *  on the audio clock, seconds a beat, beats a bar, and the key (the root's MIDI note: every theme here is a minor pentatonic one, or
   *  near enough; E flat unless the score says). Null when nothing plays. */
  grid() {
    const A = this.arr;
    if (A.alive && !A.ended && A.score) { const sec = A.score.sections[A.section]; return { t0: A.next, spb: A.spb, beats: sec?.beats || A.score.beats || 4, root: A.score.root ?? 63, swing: 0.5 }; }
    if (this.alive && this.score) return { t0: this.next, spb: this.spb, beats: 4, root: this.score.root ?? 63, swing: this.score.swing ?? 0.5 };
    return null;
  }
  get ctx() { return this.sfx.ctx; }
  get playing() { return this.alive; }

  build() {
    const ctx = this.ctx;
    this.bus = ctx.createGain(); this.bus.gain.value = 0.0001;
    this.duckG = ctx.createGain();
    const warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 9000; warm.Q.value = 0.4;
    this.bus.connect(this.duckG).connect(warm).connect(this.sfx.master);
    // a long, dark hall
    this.verb = ctx.createConvolver(); this.verb.buffer = this.sfx.impulse(3.6, 2.4);
    this.verbIn = ctx.createGain(); this.verbIn.gain.value = 0.55;
    const vlp = ctx.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 4500;
    this.verbIn.connect(vlp).connect(this.verb).connect(this.bus);
    // the lead's echo: a dotted eighth, ping-ponged, darkening as it repeats
    this.echoIn = ctx.createGain(); this.echoIn.gain.value = 0.3;
    const dl = ctx.createDelay(2), dr = ctx.createDelay(2), fb = ctx.createGain(), elp = ctx.createBiquadFilter();
    const spb = 60 / (this.score?.bpm || 84);
    dl.delayTime.value = spb * 0.75; dr.delayTime.value = spb * 0.75; fb.gain.value = 0.38; elp.type = 'lowpass'; elp.frequency.value = 2600;
    const pl = ctx.createStereoPanner(), pr = ctx.createStereoPanner(); pl.pan.value = -0.6; pr.pan.value = 0.6;
    this.echoIn.connect(dl); dl.connect(pl).connect(this.bus); dl.connect(dr); dr.connect(pr).connect(this.bus); dr.connect(elp).connect(fb).connect(dl);
    pl.connect(this.verbIn);
    // the Rhodes' slow auto-pan
    this.rhodesPan = ctx.createStereoPanner(); this.rhodesPan.connect(this.bus); this.rhodesPan.connect(this.verbIn);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.35; lg.gain.value = 0.45; lfo.connect(lg).connect(this.rhodesPan.pan); lfo.start();
    this.nodes = [lfo];
  }

  play(score) {
    if (!this.sfx.ok?.() || this.alive) return false;
    this.score = score; this.build();
    const ctx = this.ctx;
    this.bus.gain.setTargetAtTime(this.volume, ctx.currentTime, 1.2);
    this.alive = true;
    this.spb = 60 / score.bpm;
    this.next = ctx.currentTime + 0.15; this.section = 0; this.bar = 0;
    this.timer = setInterval(() => this.run(), 50);
    this.run();
    return true;
  }
  stop(fade = 2) {
    if (!this.alive) return;
    this.alive = false; clearInterval(this.timer);
    const ctx = this.ctx, bus = this.bus, nodes = this.nodes;
    bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3);
    setTimeout(() => { try { for (const n of nodes) n.stop(); bus.disconnect(); } catch { /* gone */ } }, fade * 1000 + 600);
  }
  setVolume(v) { this.volume = v; if (this.alive) this.bus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.3); }
  /** Lower the music for a while (the System is speaking). */
  duck(sec = 2, to = 0.35) {
    this.arr.duck(sec);
    if (!this.alive) return;
    const t = this.ctx.currentTime, g = this.duckG.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(to, t, 0.08); g.setTargetAtTime(1, t + sec, 0.5);
  }

  // ---------------------------------------------------------------- the conductor: a bar at a time, ahead of the clock
  run() {
    if (!this.alive) return;
    const ctx = this.ctx, S = this.score;
    // (a tab left in the background comes back late: start again from the next bar rather than play the missed ones at once)
    if (this.next < ctx.currentTime - 0.2) this.next = ctx.currentTime + 0.1;
    while (this.next < ctx.currentTime + 0.6) {
      const sec = S.sections[this.section];
      this.playBar(sec, this.bar, this.next);
      this.next += this.spb * 4;
      if (++this.bar >= sec.chords.length) { this.bar = 0; this.section++; if (this.section >= S.sections.length) this.section = S.loopFrom; }
    }
  }
  /** A beat position in the bar (x.5 swung) to a time. */
  at(t0, beat) { const b = Math.floor(beat), f = beat - b; return t0 + (b + (f === 0.5 ? this.score.swing : f)) * this.spb; }
  hum(t) { return t + (Math.random() - 0.5) * 0.012; }

  playBar(sec, bar, t0) {
    const S = this.score, ch = S.chords[sec.chords[bar]], next = S.chords[sec.chords[(bar + 1) % sec.chords.length]], band = sec.band, spb = this.spb;
    // the finger cymbal opens each section
    if (bar === 0 && band.zill) this.zill(t0, 0.5 * band.zill);
    // the pad: the chord's upper notes, held the bar
    if (band.pad) for (const n of ch.pad) this.pad(t0, spb * 4.1, n, 0.05 * band.pad);
    // the Rhodes: a comping figure (or whole notes in the intro)
    if (band.rhodes) {
      const fig = sec.id === 'intro' ? [[0, 4]] : S.comp[(bar + this.section) % S.comp.length];
      for (const [b, len] of fig) ch.v.forEach((n, i) => this.rhodes(this.hum(this.at(t0, b)) + i * 0.008, len * spb, n, (0.11 + Math.random() * 0.03) * band.rhodes));
    }
    // the bass
    this.bassBar(sec.bass, ch, next, t0);
    // the kit
    if (band.ride) for (const [b, v] of [[0, 1], [1, 0.8], [1.5, 0.55], [2, 0.9], [3, 0.8], [3.5, 0.55]]) this.ride(this.hum(this.at(t0, b)), 0.07 * v * band.ride);
    if (band.brush) for (const b of [1, 3]) this.brush(this.at(t0, b) - 0.03, 0.16 * band.brush);
    if (band.darbuka) {
      this.doum(this.at(t0, 0), 0.32 * band.darbuka);
      for (const [b, v] of [[1.5, 0.5], [2.5, 0.7], [3.5, 0.4]]) if (Math.random() < 0.8) this.tek(this.hum(this.at(t0, b)), 0.12 * v * band.darbuka);
      if (bar % 2 === 1) this.doum(this.at(t0, 2.5), 0.2 * band.darbuka);
    }
    // the melody
    const mel = sec.mel?.[bar];
    if (mel) for (const [b, len, n] of mel) (sec.lead === 'ney' ? this.ney : this.vibes).call(this, this.hum(this.at(t0, b)), len * spb, n, 0.2);
  }

  bassBar(feel, ch, next, t0) {
    const spb = this.spb, R = ch.r, F = ch.f;
    if (feel === 'pedal') { this.bass(t0, spb * 3.6, R, 0.5); return; }
    if (feel === 'two') { // (the two-feel: the root, a push to the fifth, an approach to the next root)
      this.bass(this.at(t0, 0), spb * 1.5, R, 0.55);
      this.bass(this.at(t0, 1.5), spb * 0.4, R + 12, 0.25);
      this.bass(this.at(t0, 2), spb * 1.4, F, 0.45);
      this.bass(this.at(t0, 3.5), spb * 0.45, next.r + (Math.random() < 0.5 ? -1 : 1), 0.3);
      return;
    }
    // walking: root, a chord tone, the fifth, a step into the next root
    const line = [R, R + (Math.random() < 0.5 ? 3 : 4), F, next.r + (next.r > R ? -1 : 1)];
    line.forEach((n, i) => this.bass(this.hum(t0 + i * spb), spb * 0.9, n, i === 0 ? 0.5 : 0.38));
  }

  // ---------------------------------------------------------------- the instruments
  env(t, a, peak, d, dest, release = 0) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + release);
    g.connect(dest); return g;
  }
  osc(type, f, t, end, dest) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(t); o.stop(end); return o; }

  rhodes(t, len, n, vel) {
    const ctx = this.ctx, f = hz(n), d = Math.min(3, len + 0.6);
    const out = this.env(t, 0.006, vel, d, this.rhodesPan);
    const car = this.osc('sine', f, t, t + d + 0.1, out);
    const mod = ctx.createOscillator(), mg = ctx.createGain(); mod.frequency.value = f;
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.25, t + 0.9);
    mod.connect(mg).connect(car.frequency); mod.start(t); mod.stop(t + d + 0.1);
    const tine = this.env(t, 0.002, vel * 0.18, 0.12, this.rhodesPan);
    this.osc('sine', f * 7.1, t, t + 0.2, tine);
  }
  vibes(t, len, n, vel) {
    const ctx = this.ctx, f = hz(n), d = Math.max(1.2, len + 1.2);
    const trem = ctx.createGain(); trem.connect(this.bus); trem.connect(this.verbIn); trem.connect(this.echoIn);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 0.25; lfo.connect(lg).connect(trem.gain); lfo.start(t); lfo.stop(t + d + 0.2);
    const a = this.env(t, 0.003, vel, d, trem), b = this.env(t, 0.002, vel * 0.22, 0.35, trem);
    this.osc('sine', f, t, t + d + 0.1, a); this.osc('sine', f * 4, t, t + 0.5, b);
  }
  ney(t, len, n, vel) {
    const ctx = this.ctx, f = hz(n), d = len + 0.15;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.8, t + 0.12);
    g.gain.setValueAtTime(vel * 0.8, t + Math.max(0.13, d - 0.18)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.25);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f * 4;
    g.connect(lp); lp.connect(this.bus); lp.connect(this.verbIn); lp.connect(this.echoIn);
    const o = this.osc('triangle', f, t, t + d + 0.3, g);
    o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.09); // (the scoop up into the note)
    if (len > 0.6) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.6, len * 0.5)); v.connect(vg).connect(o.frequency); v.start(t); v.stop(t + d + 0.3); }
    // breath
    const src = ctx.createBufferSource(); src.buffer = this.sfx.noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 4;
    const bg = this.env(t, 0.05, vel * 0.35, d, lp);
    src.connect(bp).connect(bg); src.start(t, Math.random()); src.stop(t + d + 0.3);
  }
  bass(t, len, n, vel) {
    const ctx = this.ctx, f = hz(n);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.25);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.12);
    lp.connect(g).connect(this.bus);
    const o = this.osc('triangle', f, t, t + len + 0.2, lp); this.osc('sine', f, t, t + len + 0.2, lp);
    o.frequency.setValueAtTime(f * 1.02, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
  }
  pad(t, len, n, vel) {
    const ctx = this.ctx, f = hz(n);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1700, t + len * 0.5); lp.frequency.linearRampToValueAtTime(800, t + len);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 1.2);
    g.gain.setValueAtTime(vel, t + len - 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 1.4);
    lp.connect(g); g.connect(this.verbIn); g.connect(this.bus);
    for (const det of [-7, 6]) { const o = this.osc('sawtooth', f, t, t + len + 1.5, lp); o.detune.value = det; }
  }
  noiseHit(t, dur, type, f, q, vel, dest = this.bus, attack = 0.002) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.sfx.noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = this.env(t, attack, vel, dur, dest);
    src.connect(fl).connect(g); src.start(t, Math.random() * 1.5); src.stop(t + attack + dur + 0.05);
    return g;
  }
  ride(t, vel) {
    const ctx = this.ctx, hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500;
    const g = this.env(t, 0.002, vel, 0.55, this.bus); hp.connect(g); g.connect(this.verbIn);
    for (const r of [1, 1.342, 1.2312, 1.6532, 1.9523, 2.1523]) this.osc('square', 320 * r, t, t + 0.6, hp);
  }
  brush(t, vel) { this.noiseHit(t, 0.22, 'bandpass', 3200, 0.7, vel, this.bus, 0.06); }
  doum(t, vel) {
    const o = this.ctx.createOscillator(), g = this.env(t, 0.003, vel, 0.32, this.bus);
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.2); o.connect(g); o.start(t); o.stop(t + 0.4);
  }
  tek(t, vel) { this.noiseHit(t, 0.05, 'bandpass', 2400, 2.5, vel); const g = this.env(t, 0.001, vel * 0.8, 0.06, this.bus); this.osc('sine', 820, t, t + 0.1, g); }
  zill(t, vel) {
    const g = this.env(t, 0.002, vel * 0.08, 2.6, this.bus); g.connect(this.verbIn); g.connect(this.echoIn);
    for (const f of [2210, 3105, 5330, 6870]) this.osc('sine', f, t, t + 2.8, g);
  }
}
