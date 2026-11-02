// ---------------------------------------------------------------------------------------
// THE GREAT SLIP JELLY'S FIGHT HEARD (Petra's creatures/jelly/greatjelly.js: the Great Dunemaw's FOE, the Pithos). The impacts that have
// one are the runtime's own (`sfx.slam` on the slam, `sfx.shatter` on the crown's burst and a plate); these are the body and the urn on
// top, so the fight's grammar is in the ear: the urn rings as it cracks, the ram is a scrape you learn, the bare body is wet.
//   WAKE     (foe.wake) the brood stirs: slip sucking off its body as it rises, a deep groan and the urn's dull knock against it
//   SCRAPE   (foe.scrape) the ram's tell, its 1.6 s (FOE.ram.telegraph): the urn's broken edge dragged on stone, quickening, then the
//            launch's lurch on its last beat (the charge goes then)
//   WALL     (foe.wall) the charge into the bowl's wall: a heavy wet thud, the urn's knock and a dazed wobble (it costs it nothing)
//   CRACK    (foe.crack { stage }) the crown's stage passed: fired clay ringing as a crack runs through it, higher and more broken a stage
//   BREAK    (foe.break) the crown burst off (over the shatter): the bare body's wet gasp, then the reel's woozy beat
//   CALL     (foe.call { n }) the brood called: a gurgling call, a chirp answering for each one
//   SLAM     (foe.slam) under the runtime's slam: the slip splashing out in a ring and pattering back down
//   STRIKE   (foe.strike { move }) its body on the Courier: the ram a heavy wet body-blow, the slam and the bash a lighter slap
//   SINK     (foe.sink) bare, under the slip: a deep swallow and its bubbles
//   RISE     (foe.rise) the ring before it comes up, its 1.8 s (FOE.sink.telegraph): the pool's slip welling and a bubbling swell
//   SURFACE  (foe.surface) bursting out of a pool: the slip thrown up and falling (its slam follows, heard as SLAM)
//
// Prior art: Monster Hunter's tells (a monster's scrape before its charge, learned by ear: Diablos's dig, Tigrex's), Shadow of the
// Colossus's weight (each step a room's event), Hollow Knight's Uumuu (a wet body in a dark room), the cracking urns of Okami's pots.
//
//   sfx.foeWake() .foeScrape() .foeWall() .foeCrack(stage) .foeBreak() .foeCall(n) .foeSlam() .foeStrike(move) .foeSink() .foeRise()
//      .foeSurface()
// ---------------------------------------------------------------------------------------
import { FOE } from '../progress/combat/dunemaw.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { wake: 1.1, scrape: 1, wall: 1.7, crack: 2.6, break: 1.6, call: 2, slam: 3.7, strike: 1.7, sink: 1.3, rise: 1.9, surface: 2.7 };

export class GreatJellyFightSounds {
  foeOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 8000); return d; }
  /** The urn's fired clay knocked: a dull body and two inharmonic partials. */
  foeUrn(t, f, dur, g, d) { this.tone(t, dur, { f0: f, f1: f * 0.98, type: 'triangle', gain: g, dest: d }); this.tone(t, dur * 0.5, { f0: f * 2.3, gain: g * 0.35, dest: d }); this.tone(t, dur * 0.3, { f0: f * 4.1, gain: g * 0.12, dest: d }); }
  /** Bubbles up through the slip: `n` of them over `span`. */
  foeBubbles(t, n, span, g, d, lo = 140) { for (let i = 0; i < n; i++) { const at = t + (i / n) * span + Math.random() * 0.06, f = lo + Math.random() * lo; this.tone(at, 0.08, { f0: f, f1: f * 2, gain: g, dest: d }); } }

  foeWake() {
    if (!this.ok() || !this.allow('foeWake', 0.5)) return;
    const t = this.ctx.currentTime, d = this.foeOut('wake', 0.4, 0.8);
    this.noise(t, 1.2, { type: 'lowpass', f0: 500, f1: 1400, gain: 0.3, attack: 0.4, dest: d }); // (slip sucking off it as it rises)
    this.tone(t + 0.2, 1.6, { f0: 48, f1: 62, type: 'sawtooth', gain: 0.05, dest: d }); this.tone(t + 0.2, 1.6, { f0: 49, f1: 63, gain: 0.25, dest: d }); // (the groan)
    this.foeUrn(t + 0.9, 150, 0.5, 0.15, d); // (the urn's dull knock)
    this.foeBubbles(t + 0.1, 8, 1.1, 0.06, d);
  }
  foeScrape() {
    if (!this.ok() || !this.allow('foeScrape', 1)) return;
    const t = this.ctx.currentTime, w = num(FOE.ram?.telegraph, 1.6, 0.5, 4), d = this.foeOut('scrape', 0.4, 0.5);
    const n = Math.max(4, Math.round(w * 5));
    for (let i = 0; i < n; i++) { const u = i / n, at = t + w * Math.pow(u, 0.8); this.noise(at, 0.16 - u * 0.08, { type: 'bandpass', f0: 600 + u * 900, f1: 300 + u * 500, q: 2.5, gain: 0.25 + u * 0.2, attack: 0.02, dest: d }); } // (the broken edge dragged, quickening)
    this.tone(t, w, { f0: 70, f1: 95, gain: 0.12, dest: d }); // (the body loading)
    this.tone(t + w - 0.05, 0.3, { f0: 110, f1: 55, gain: 0.3, dest: d }); this.noise(t + w - 0.05, 0.15, { type: 'lowpass', f0: 900, gain: 0.35, dest: d }); // (the launch's lurch)
  }
  foeWall() {
    if (!this.ok() || !this.allow('foeWall', 2)) return;
    const t = this.ctx.currentTime, d = this.foeOut('wall', 0.45, 0.8);
    this.tone(t, 0.6, { f0: 80, f1: 38, gain: 0.5, dest: d }); this.noise(t, 0.2, { type: 'lowpass', f0: 1200, f1: 300, gain: 0.45, dest: d }); // (the wet thud)
    this.foeUrn(t + 0.02, 170, 0.35, 0.14, d); // (the urn's knock)
    for (let i = 0; i < 4; i++) this.tone(t + 0.3 + i * 0.16, 0.14, { f0: 220 - i * 18, f1: 180 - i * 18, type: 'triangle', gain: 0.05, dest: d }); // (dazed: a wobble)
  }
  foeCrack(stage = 1) {
    if (!this.ok() || !this.allow('foeCrack', 3)) return;
    const s = Math.round(num(stage, 1, 1, 3)), t = this.ctx.currentTime, d = this.foeOut('crack', 0.4, 0.7);
    this.noise(t, 0.04, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); // (the crack's snap)
    for (let i = 0; i < 2 + s * 2; i++) this.noise(t + 0.03 + i * 0.04, 0.02, { type: 'bandpass', f0: 1800 + i * 300, q: 4, gain: 0.25, dest: d }); // (running through it)
    const f = hz(60 + s * 3);
    this.foeUrn(t, f, 1.1 - s * 0.2, 0.18, d); this.tone(t, 0.8, { f0: f * 1.03, gain: 0.06 * s, dest: d }); // (the urn ringing, more broken a stage: its partials beating)
  }
  foeBreak() {
    if (!this.ok() || !this.allow('foeBreak', 1)) return;
    const t = this.ctx.currentTime + 0.15, d = this.foeOut('break', 0.45, 0.8); // (after the shatter's own)
    this.noise(t, 0.6, { type: 'bandpass', f0: 400, f1: 1600, q: 1, gain: 0.3, attack: 0.05, dest: d }); this.tone(t, 0.5, { f0: 140, f1: 260, gain: 0.2, dest: d }); // (the bare body's wet gasp)
    [0, 1].forEach((i) => this.tone(t + 0.6 + i * 0.4, 0.5, { f0: hz(55 - i), f1: hz(52 - i), type: 'triangle', gain: 0.08, dest: d })); // (the reel: woozy, sagging)
  }
  foeCall(n = 1) {
    if (!this.ok() || !this.allow('foeCall', 1)) return;
    const c = Math.round(num(n, 1, 1, 6)), t = this.ctx.currentTime, d = this.foeOut('call', 0.4, 0.6);
    this.tone(t, 0.8, { f0: 130, f1: 90, type: 'triangle', gain: 0.1, dest: d }); this.foeBubbles(t, 7, 0.7, 0.1, d, 110); // (the gurgling call)
    for (let i = 0; i < c; i++) { const at = t + 0.8 + i * 0.12, f = 480 + Math.random() * 120; this.tone(at, 0.12, { f0: f, f1: f * 1.4, type: 'triangle', gain: 0.06, dest: d }); } // (a chirp a brood)
  }
  foeSlam() {
    if (!this.ok() || !this.allow('foeSlam', 2)) return;
    const t = this.ctx.currentTime, d = this.foeOut('slam', 0.4, 0.8);
    this.noise(t, 0.5, { type: 'bandpass', f0: 900, f1: 400, q: 0.8, gain: 0.35, dest: d }); // (the slip thrown out in a ring)
    for (let i = 0; i < 12; i++) this.noise(t + 0.25 + Math.random() * 0.7, 0.03, { type: 'bandpass', f0: 700 + Math.random() * 900, q: 3, gain: 0.12, dest: d }); // (pattering back down)
  }
  foeStrike(move = 'slam') {
    if (!this.ok() || !this.allow('foeStrike', 3)) return;
    const t = this.ctx.currentTime, ram = move === 'ram', d = this.foeOut('strike', 0.4, 0.4);
    this.tone(t, ram ? 0.4 : 0.22, { f0: ram ? 100 : 160, f1: ram ? 45 : 80, gain: ram ? 0.5 : 0.3, dest: d }); // (the body-blow)
    this.noise(t, ram ? 0.25 : 0.12, { type: 'lowpass', f0: ram ? 1400 : 2000, f1: 300, gain: ram ? 0.45 : 0.3, dest: d }); // (wet)
  }
  foeSink() {
    if (!this.ok() || !this.allow('foeSink', 1)) return;
    const t = this.ctx.currentTime, d = this.foeOut('sink', 0.4, 0.7);
    this.tone(t, 0.8, { f0: 110, f1: 32, gain: 0.45, dest: d }); this.noise(t, 1, { type: 'lowpass', f0: 1200, f1: 120, gain: 0.35, dest: d }); // (the swallow)
    this.foeBubbles(t + 0.4, 6, 0.9, 0.09, d);
  }
  foeRise() {
    if (!this.ok() || !this.allow('foeRise', 1)) return;
    const t = this.ctx.currentTime, w = num(FOE.sink?.telegraph, 1.8, 0.5, 4), d = this.foeOut('rise', 0.4, 0.7);
    this.noise(t, w, { type: 'lowpass', f0: 200, f1: 1100, q: 1.5, gain: 0.3, attack: w * 0.85, dest: d }); this.tone(t, w, { f0: 45, f1: 75, gain: 0.2, dest: d }); // (the slip welling)
    for (let i = 0; i < 14; i++) { const u = i / 14, at = t + w * Math.sqrt(u), f = 120 + Math.random() * 150; this.tone(at, 0.07, { f0: f, f1: f * 2, gain: 0.04 + u * 0.08, dest: d }); } // (bubbling, faster to the burst)
  }
  foeSurface() {
    if (!this.ok() || !this.allow('foeSurface', 1)) return;
    const t = this.ctx.currentTime, d = this.foeOut('surface', 0.45, 0.8);
    this.noise(t, 0.4, { type: 'bandpass', f0: 600, f1: 2200, q: 0.7, gain: 0.4, dest: d }); this.tone(t, 0.3, { f0: 90, f1: 180, gain: 0.3, dest: d }); // (bursting out)
    this.noise(t + 0.3, 0.8, { type: 'lowpass', f0: 1600, f1: 500, gain: 0.2, attack: 0.1, dest: d }); // (the slip falling back)
  }
}
