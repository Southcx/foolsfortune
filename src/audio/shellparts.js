// A sound bank of the one mixer (audio/sfx.js): the caster shells by their parts (docs/plans/CASTER-SHELLS.md). A shell is a recipe, a
// CARRIER (how it flies), PAYLOADS (what it does where it lands) and a FIELD (what it leaves), so its sound is the same recipe: a hundred
// shells from about forty sounds, never a hundred one-offs. A shell's tier (1..4) is how loud and how deep its parts are.
//   carriers (at the muzzle)   bolt a crack, lob a tube's thunk, bounce a spring, seek a rising chirp, beam a whine (the charge's own),
//                              cone a wide whoosh, deploy a latch, swarm a flock of chirps, call a radio's two pips (and the fall's
//                              whistle when it comes), steer an engine catching, self a breath drawn in
//   payloads (where it lands)  blast, type (the damage type's own: audio/damage.js), status, pull, pin, cut, paint, crude, charm, decoy,
//                              summon, split, chain, morph, time, space, mass, feel (the feeling's three notes: audio/vessel.js), dispel,
//                              world
//   fields (held while left)   pool, cloud, wall, dome, column, zone, rift: a loop each, stopped by the handle it returns
// And the moments the plan gives music: Stage Fright's crowd murmuring (66), Lullaby's music-box notes in the scale (68).
// Prior art: Ratchet & Clank's weapons (each a voice you know blind: the RYNO's volley), Splatoon's ink (the splat, the swim), the
// classic synthesis of each (noise and a pitch drop for a crack, a band-pass sweep for a whoosh, beating sines for a force field's hum).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//   sfx.shellFire(carrier, tier)   sfx.shellFall(seconds, tier) (the call's whistle down)   sfx.shellHit(payloads, { tier, type, feeling })
//   sfx.shellField(field, tier) -> { stop() }   sfx.crowdMurmur(seconds)   sfx.lullabyNote(scale, root)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const k_ = (tier) => 0.55 + 0.15 * Math.max(1, Math.min(4, tier || 1)); // (a tier's weight: I 0.7 .. IV 1.15)

const FIRE = {
  bolt(t, d, k) { this.noise(t, 0.08, { type: 'highpass', f0: 2500, gain: 0.7 * k, dest: d }); this.tone(t, 0.12, { f0: 520, f1: 140, type: 'triangle', gain: 0.4 * k, dest: d }); },
  lob(t, d, k) { this.tone(t, 0.18, { f0: 180, f1: 90, gain: 0.6 * k, dest: d }); this.noise(t, 0.15, { f0: 900, f1: 300, gain: 0.35 * k, dest: d }); },
  bounce(t, d, k) { this.tone(t, 0.2, { f0: 280, f1: 520, type: 'triangle', gain: 0.35 * k, dest: d }); this.tone(t + 0.06, 0.12, { f0: 520, f1: 380, type: 'triangle', gain: 0.18 * k, dest: d }); },
  seek(t, d, k) { this.tone(t, 0.3, { f0: 600, f1: 1500, gain: 0.25 * k, dest: d }); this.tone(t + 0.02, 0.28, { f0: 606, f1: 1520, gain: 0.15 * k, dest: d }); },
  beam(t, d, k) { this.tone(t, 0.35, { f0: 300, f1: 900, type: 'sawtooth', gain: 0.12 * k, dest: d }); this.noise(t, 0.3, { type: 'bandpass', f0: 3000, q: 3, gain: 0.25 * k, dest: d }); },
  cone(t, d, k) { this.noise(t, 0.32, { type: 'bandpass', f0: 400, f1: 1600, q: 0.8, gain: 0.7 * k, attack: 0.02, dest: d }); },
  deploy(t, d, k) { this.tone(t, 0.08, { f0: 160, f1: 110, type: 'triangle', gain: 0.5 * k, dest: d }); this.noise(t + 0.09, 0.02, { type: 'bandpass', f0: 3200, q: 6, gain: 0.5 * k, dest: d }); },
  swarm(t, d, k) { for (let i = 0; i < 6; i++) { const f = 900 + Math.random() * 900; this.tone(t + i * 0.035, 0.09, { f0: f, f1: f * 1.6, gain: 0.08 * k, dest: d }); } },
  call(t, d, k) { [0, 0.12].forEach((s, i) => this.tone(t + s, 0.08, { f0: i ? 1320 : 990, type: 'square', gain: 0.06 * k, dest: d })); },
  steer(t, d, k) { this.tone(t, 0.5, { f0: 60, f1: 140, type: 'sawtooth', gain: 0.12 * k, dest: d }); this.noise(t, 0.5, { f0: 300, f1: 1200, gain: 0.3 * k, attack: 0.1, dest: d }); },
  self(t, d, k) { this.noise(t, 0.4, { type: 'bandpass', f0: 2400, f1: 500, q: 1, gain: 0.4 * k, attack: 0.3, dest: d }); },
};

const HIT = {
  blast(t, d, k) { this.noise(t, 0.6 * k, { f0: 1200, f1: 120, gain: 0.9 * k, dest: d }); this.tone(t, 0.4, { f0: 90, f1: 38, gain: 0.8 * k, dest: d }); },
  status(t, d, k) { this.tone(t, 0.3, { f0: hz(83), f1: hz(83), gain: 0.12 * k, dest: d }); this.tone(t + 0.05, 0.3, { f0: hz(90), gain: 0.08 * k, dest: d }); },
  pull(t, d, k) { this.noise(t, 0.7, { type: 'bandpass', f0: 1600, f1: 180, q: 2, gain: 0.5 * k, dest: d }); this.tone(t, 0.7, { f0: 220, f1: 55, gain: 0.3 * k, dest: d }); },
  pin(t, d, k) { this.tone(t, 0.25, { f0: 900, f1: 700, type: 'triangle', gain: 0.25 * k, dest: d }); this.tone(t, 0.18, { f0: 110, f1: 70, gain: 0.4 * k, dest: d }); },
  cut(t, d, k) { this.noise(t, 0.12, { type: 'highpass', f0: 5000, gain: 0.5 * k, dest: d }); this.tone(t, 0.25, { f0: 2200, f1: 3300, gain: 0.12 * k, dest: d }); },
  paint(t, d, k) { this.noise(t, 0.18, { f0: 1400, f1: 400, gain: 0.6 * k, dest: d }); for (let i = 0; i < 3; i++) this.tone(t + 0.04 + i * 0.05, 0.05, { f0: 400 + i * 180, f1: 900 + i * 200, gain: 0.08 * k, dest: d }); },
  crude(t, d, k) { this.tone(t, 0.3, { f0: 140, f1: 80, gain: 0.45 * k, dest: d }); this.tone(t + 0.1, 0.2, { f0: 220, f1: 300, gain: 0.12 * k, dest: d }); this.noise(t, 0.25, { f0: 600, f1: 200, gain: 0.3 * k, dest: d }); },
  charm(t, d, k) { [76, 80, 83].forEach((m, i) => this.tone(t + i * 0.08, 0.5, { f0: hz(m), gain: 0.12 * k, dest: d })); },
  decoy(t, d, k) { this.noise(t, 0.04, { type: 'bandpass', f0: 1800, q: 4, gain: 0.5 * k, dest: d }); this.tone(t + 0.04, 0.4, { f0: 900, f1: 1400, type: 'triangle', gain: 0.1 * k, dest: d }); },
  summon(t, d, k) { this.noise(t, 0.6, { type: 'highpass', f0: 3000, f1: 8000, gain: 0.2 * k, attack: 0.3, dest: d }); [64, 71, 76].forEach((m, i) => this.tone(t + 0.2 + i * 0.1, 0.6, { f0: hz(m), gain: 0.1 * k, dest: d })); },
  split(t, d, k) { for (let i = 0; i < 4; i++) this.noise(t + i * 0.05, 0.05, { type: 'bandpass', f0: 1200 + Math.random() * 1500, q: 2, gain: 0.45 * k, dest: d }); },
  chain(t, d, k) { for (let i = 0; i < 3; i++) { const s = t + i * 0.07; this.tone(s, 0.06, { f0: 1800 + Math.random() * 600, f1: 600, type: 'sawtooth', gain: 0.12 * k, dest: d }); this.noise(s, 0.05, { type: 'highpass', f0: 4000, gain: 0.3 * k, dest: d }); } },
  morph(t, d, k) { this.tone(t, 0.35, { f0: 300, f1: 900, type: 'triangle', gain: 0.25 * k, dest: d }); this.noise(t + 0.25, 0.2, { f0: 2000, f1: 500, gain: 0.35 * k, dest: d }); },
  time(t, d, k) { this.tone(t, 0.9, { f0: 880, f1: 110, gain: 0.18 * k, dest: d }); this.tone(t, 0.9, { f0: 1320, f1: 165, type: 'triangle', gain: 0.06 * k, dest: d }); },
  space(t, d, k) { this.noise(t, 0.4, { type: 'bandpass', f0: 300, f1: 3000, q: 1.5, gain: 0.45 * k, attack: 0.3, dest: d }); this.tone(t + 0.38, 0.1, { f0: 1200, f1: 600, gain: 0.15 * k, dest: d }); },
  mass(t, d, k) { this.tone(t, 0.6, { f0: 70, f1: 30, gain: 0.8 * k, dest: d }); this.noise(t, 0.3, { f0: 300, f1: 80, gain: 0.4 * k, dest: d }); },
  dispel(t, d, k) { this.noise(t, 0.4, { type: 'highpass', f0: 1500, f1: 9000, gain: 0.3 * k, attack: 0.35, dest: d }); this.tone(t + 0.38, 0.6, { f0: hz(100), gain: 0.1 * k, dest: d }); },
  world(t, d, k) { this.noise(t, 0.5, { type: 'bandpass', f0: 500, f1: 250, q: 1, gain: 0.5 * k, dest: d }); this.tone(t + 0.45, 0.2, { f0: 120, f1: 80, gain: 0.5 * k, dest: d }); },
};

// a field's loop: noise through a filter, or tones that beat, swelling in and out
const FIELD = {
  pool: { noise: ['lowpass', 500], bubbles: true, v: 0.05 }, cloud: { noise: ['bandpass', 2400], v: 0.05 }, wall: { tones: [110, 110.8, 220], v: 0.03 },
  dome: { tones: [165, 166, 330, 495], v: 0.025 }, column: { noise: ['bandpass', 900], rise: true, v: 0.05 }, zone: { tones: [880, 884, 1320], v: 0.012 },
  rift: { tones: [55, 57, 82.5], noise: ['lowpass', 250], v: 0.04 },
};

export class ShellPartSounds {
  /** A shell fired: its carrier's sound at the muzzle. */
  shellFire(carrier = 'bolt', tier = 1) {
    const f = FIRE[carrier]; if (!f || !this.ok() || !this.allow(`shellFire.${carrier}`, 12)) return;
    f.call(this, this.ctx.currentTime, this.out(0.5, 0.3), k_(tier));
  }
  /** The call's fall: a whistle coming down over `seconds`, landing with nothing (the payload's own sound lands it). */
  shellFall(seconds = 1.5, tier = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, k = k_(tier); this.tone(t, seconds, { f0: 2600, f1: 500, gain: 0.08 * k, dest: this.out(0.4, 0.4) });
  }
  /** A shell landed: each payload's sound at once (a type's through audio/damage.js, a feeling's through audio/vessel.js). */
  shellHit(payloads = ['blast'], { tier = 1, type = null, feeling = null } = {}) {
    if (!this.ok() || !this.allow('shellHit', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.55, 0.35), k = k_(tier);
    for (const p of [].concat(payloads)) {
      if (p === 'type') this.damage?.(type || 'impact', Math.min(1, k * 0.8));
      else if (p === 'feel') this.feelingDrink?.(feeling);
      else HIT[p]?.call(this, t, d, k);
    }
  }
  /** A field left where it landed: its loop, until its handle is stopped. */
  shellField(field = 'pool', tier = 1) {
    const F = FIELD[field]; if (!F || !this.ok()) return { stop() {} };
    const c = this.ctx, t = c.currentTime, g = c.createGain(), v = F.v * k_(tier), nodes = [];
    g.gain.value = 0.0001; g.connect(this.loopBus || this.out(1, 0.4)); g.gain.setTargetAtTime(v, t, 0.3);
    if (F.noise) { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const f = c.createBiquadFilter(); f.type = F.noise[0]; f.frequency.value = F.noise[1]; f.Q.value = 1.2;
      if (F.rise) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 0.3; lg.gain.value = 400; l.connect(lg).connect(f.frequency); l.start(); nodes.push(l); }
      s.connect(f).connect(g); s.start(); nodes.push(s); }
    for (const f0 of F.tones || []) { const o = c.createOscillator(); o.frequency.value = f0; o.connect(g); o.start(); nodes.push(o); }
    const bub = F.bubbles ? setInterval(() => { if (this.ok() && Math.random() < 0.5) { const s = c.currentTime, f = 300 + Math.random() * 400; this.tone(s, 0.06, { f0: f, f1: f * 1.8, gain: v * 1.5, dest: g }); } }, 220) : null;
    return { stop: () => { clearInterval(bub); const s = c.currentTime; g.gain.cancelScheduledValues(s); g.gain.setTargetAtTime(0.0001, s, 0.25); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch { /* gone */ } }); g.disconnect(); }, 1500); } };
  }

  /** Stage Fright (66): a crowd murmuring, many voices' vowels in noise, swelling and dying over `seconds`. */
  crowdMurmur(seconds = 4) {
    if (!this.ok() || !this.allow('crowdMurmur', 0.5)) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.5, 0.5);
    for (const [f, q] of [[500, 4], [1100, 5], [2400, 6]]) for (let v = 0; v < 3; v++) { // (three formants, three voices on each: a room of talk)
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * (0.85 + Math.random() * 0.3); bp.Q.value = q;
      const g = c.createGain(); g.gain.value = 0; const am = c.createOscillator(), ag = c.createGain(); am.frequency.value = 2 + Math.random() * 3; ag.gain.value = 0.04; am.connect(ag).connect(g.gain);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + seconds * 0.3); g.gain.linearRampToValueAtTime(0, t + seconds);
      s.connect(bp).connect(g).connect(d); s.start(t, Math.random()); am.start(t); s.stop(t + seconds + 0.1); am.stop(t + seconds + 0.1);
    }
  }
  /** Lullaby (68): a music box's note from the scale (`game.music.scale()`, five semitones), over `root` (a MIDI note). */
  lullabyNote(scale = [0, 3, 5, 7, 10], root = 64) {
    if (!this.ok() || !this.allow('lullabyNote', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6), m = root + 24 + scale[Math.floor(Math.random() * scale.length)], f = hz(m);
    this.tone(t, 1.2, { f0: f, gain: 0.14, dest: d }); this.tone(t, 0.4, { f0: f * 3.01, gain: 0.03, dest: d }); this.noise(t, 0.01, { type: 'highpass', f0: 6000, gain: 0.1, dest: d });
  }
}
