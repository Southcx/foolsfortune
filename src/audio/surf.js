// ---------------------------------------------------------------------------------------
// THE SURF RIDE AND THE SLOPE HEARD (Calissa's wave pool and slope: courier/skiff/surf.js, sloperide.js; South's ask, 2026-11-06:
// "especially the feeling of going through a wave barrel"). Each voice from a table keyed by the event's own field, never a switch.
//   THE POOL       (skiff.surf { on }) onto the wave pool: its machine's low thrum and the wave's long rumble, held while you ride it
//   THE BARREL     (skiff.tube.enter .. skiff.tube.exit { seconds, made }) inside the tube: the world closing in, a held roar rising the
//                  longer you stay (muffled, low-passed; the cue steps the music back), the lip's hiss passing over as it covers you
//   THE SPIT       (skiff.tube.exit { made: true }) a burst of mist and air past the ears, the roar cut, the world opening back up (a
//                  short tube a smaller spit); caught inside (made false) the roar simply collapses into the foam
//   A PUMP         (skiff.surf.pump { steep }) the rail's slap and a breath, a little louder on a steeper face
//   A TURN         (skiff.surf.turn { kind }) TURN: a carve's fan of spray, a snap's crack, a cutback's long draw, a bottom turn's heavy
//                  rail, a double's two, a floater's skitter over the foam, `air` the lip's release and a whoosh
//   A WIPEOUT      (skiff.bail { why }) WIPE: `lip` the lip landing on you, a heavy crash of water; `closeout` the foam ball's churn
//                  swallowing you; any other why is the skiff's own bail
//   THE DRAG       (skiff.surf.drag { on, side }) the hand laid in the face: a splash as it lands, a held hiss of water past the fingers
//                  while it stalls you (through the barrel too), panned to its side, let go with a flick
//   UNDER          (skiff.submarine) a muffled plunge, the board under, and its burst out 0.7 real s later
//   THE SLOPE      (skiff.edge.skid { k }, skiff.butter { on }, skiff.slope.land { grade }) an edge skidding (a scrape by its bite), a
//                  butter's soft press and its spin, a landing by its grade (LAND: clean a crisp thud, sketchy a scuffed one, bail a
//                  tumble)
//
// Prior art: the Kelly Slater surf games and Surf's Up for the barrel's hush and the spit, Riptide GP's spray, SSX and Steep for an edge
// on snow and a landing by its grade, the real thing: a barrel's roar heard from inside on a GoPro.
//
//   sfx.surfOn(on) .tubeEnter() .tubeExit(seconds, made) .surfPump(steep) .surfTurn(kind) .surfBail(why) .surfSubmarine() .surfDrag(on, side)
//   .edgeSkid(k) .butter(on) .slopeLand(grade)
// ---------------------------------------------------------------------------------------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Each surf turn's spray (surf.js `kind`). */
const TURN = {
  carve:    (s, t, d) => s.noise(t, 0.55, { type: 'bandpass', f0: 2500, f1: 1500, q: 0.8, gain: 0.35, attack: 0.05, dest: d }),
  snap:     (s, t, d) => { s.noise(t, 0.05, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); s.noise(t + 0.03, 0.35, { type: 'bandpass', f0: 3000, f1: 1800, q: 1, gain: 0.35, dest: d }); },
  cutback:  (s, t, d) => s.noise(t, 0.9, { type: 'bandpass', f0: 1800, f1: 2800, q: 0.8, gain: 0.3, attack: 0.2, dest: d }),
  bottom:   (s, t, d) => { s.tone(t, 0.3, { f0: 90, f1: 60, gain: 0.2, dest: d }); s.noise(t, 0.6, { type: 'bandpass', f0: 1200, f1: 2200, q: 0.8, gain: 0.3, attack: 0.1, dest: d }); },
  double:   (s, t, d) => [0, 0.32].forEach((x) => s.noise(t + x, 0.4, { type: 'bandpass', f0: 2600, f1: 1600, q: 0.9, gain: 0.3, attack: 0.04, dest: d })),
  floater:  (s, t, d) => { for (let i = 0; i < 8; i++) s.noise(t + i * 0.07, 0.05, { type: 'bandpass', f0: 2000 + Math.random() * 1500, q: 2, gain: 0.25, dest: d }); },
  air:      (s, t, d) => { s.noise(t, 0.15, { type: 'highpass', f0: 2000, gain: 0.35, dest: d }); s.noise(t + 0.1, 0.6, { type: 'bandpass', f0: 600, f1: 1500, q: 0.7, gain: 0.25, attack: 0.1, dest: d }); },
};
/** Each wipeout's water (skiff.bail's `why`). */
const WIPE = {
  lip:      (s, t, d) => { s.tone(t, 0.6, { f0: 70, f1: 35, gain: 0.5, dest: d }); s.noise(t, 1.4, { type: 'lowpass', f0: 2500, f1: 400, gain: 0.5, dest: d }); },
  closeout: (s, t, d) => { for (let i = 0; i < 6; i++) s.noise(t + i * 0.25, 0.5, { type: 'lowpass', f0: 900, f1: 500, gain: 0.35, attack: 0.1, dest: d }); s.tone(t, 1.6, { f0: 60, f1: 45, gain: 0.25, dest: d }); },
};
/** Each slope landing's grade (sloperide.js `grade`). */
const LAND = {
  clean:   (s, t, d) => { s.noise(t, 0.08, { type: 'lowpass', f0: 1800, gain: 0.4, dest: d }); s.noise(t + 0.02, 0.3, { type: 'bandpass', f0: 3500, q: 1.2, gain: 0.15, dest: d }); },
  sketchy: (s, t, d) => { s.noise(t, 0.1, { type: 'lowpass', f0: 1200, gain: 0.4, dest: d }); s.noise(t + 0.06, 0.4, { type: 'bandpass', f0: 1500, f1: 900, q: 2, gain: 0.2, dest: d }); },
  bail:    (s, t, d) => { for (let i = 0; i < 4; i++) s.noise(t + i * 0.18, 0.15, { type: 'lowpass', f0: 1000, gain: 0.35, dest: d }); s.tone(t, 0.3, { f0: 110, f1: 60, gain: 0.2, dest: d }); },
};
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { pool: 1.2, roar: 0.65, spit: 1.9, caught: 2.5, pump: 4, carve: 1.5, snap: 1.6, cutback: 1.2, bottom: 1.6, double: 1,
  floater: 2, air: 2, lip: 1, closeout: 1.1, under: 1.3, drag: 1, skid: 4.4, butter: 6.5, clean: 4.5, sketchy: 3.4, bail: 1.5 };

export class SurfSounds {
  surfOut(key, gain, verb, held = false) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); if (!held) setTimeout(() => d.disconnect(), 6000); return d; }
  /** A held noise bed (the pool's thrum, the barrel's roar): its filter and level set after, let go by `stop`. */
  surfBed(key, type, f, q, gain) {
    const c = this.ctx, d = this.surfOut(key, 1, 0.5, true), src = c.createBufferSource(), flt = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true; flt.type = type; flt.frequency.value = f; flt.Q.value = q; g.gain.value = 0;
    src.connect(flt).connect(g).connect(d); src.start(); g.gain.setTargetAtTime(gain, c.currentTime, 0.3);
    return { flt, g, d, stop: (fade = 0.3) => { g.gain.setTargetAtTime(0, c.currentTime, fade); setTimeout(() => { try { src.stop(); d.disconnect(); } catch { /* gone */ } }, fade * 6000 + 200); } };
  }

  surfOn(on = true) {
    if (!this.ok()) return;
    if (!on) { this.surfPool?.stop(0.8); this.surfPool = null; this.surfRoar?.stop(0.3); this.surfRoar = null; return; }
    if (this.surfPool) return;
    this.surfPool = this.surfBed('pool', 'lowpass', 220, 0.7, 0.12); // (the machine's thrum and the wave's long rumble)
  }
  tubeEnter() {
    if (!this.ok() || this.surfRoar) return;
    const t = this.ctx.currentTime, d = this.surfOut('roar', 0.3, 0.6);
    this.noise(t, 0.7, { type: 'bandpass', f0: 4000, f1: 1500, q: 0.8, gain: 0.25, attack: 0.1, dest: d }); // (the lip's hiss passing over)
    const R = this.surfBed('roar', 'lowpass', 500, 0.8, 0.12); // (inside: muffled, low)
    R.flt.frequency.setTargetAtTime(900, t, 2); R.g.gain.setTargetAtTime(0.3, t, 1.5); // (rising the longer you stay)
    this.surfRoar = R; this.tubeAt = t;
  }
  tubeExit(seconds = 1, made = true) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, R = this.surfRoar; this.surfRoar = null;
    if (!made) { R?.stop(0.5); const d = this.surfOut('caught', 0.35, 0.6); this.noise(t, 1.2, { type: 'lowpass', f0: 1200, f1: 300, gain: 0.4, dest: d }); return; } // (caught: it collapses into foam)
    R?.stop(0.05); // (the roar cut)
    const k = clamp((+seconds || 0) / 3, 0.3, 1), d = this.surfOut('spit', 0.4, 0.4);
    this.noise(t, 0.6 + k * 0.4, { type: 'bandpass', f0: 1500, f1: 5000, q: 0.6, gain: 0.45 * k, attack: 0.02, dest: d }); // (the spit: mist and air past the ears)
    this.noise(t + 0.15, 1.2, { type: 'highpass', f0: 3000, f1: 6000, gain: 0.12, attack: 0.3, dest: d }); // (the world opening back up)
  }
  surfPump(steep = 0.5) {
    if (!this.ok() || !this.allow('surfPump', 4)) return;
    const t = this.ctx.currentTime, g = 0.7 + clamp(steep, 0, 1) * 0.6, d = this.surfOut('pump', 0.3, 0.3);
    this.noise(t, 0.08, { type: 'bandpass', f0: 900, q: 1.5, gain: 0.35 * g, dest: d }); this.noise(t + 0.06, 0.3, { type: 'bandpass', f0: 2500, f1: 1800, q: 1, gain: 0.15 * g, dest: d }); // (the rail's slap, a breath of spray)
  }
  surfTurn(kind = 'carve') {
    const T = TURN[kind]; if (!T || !this.ok() || !this.allow('surfTurn', 4)) return;
    T(this, this.ctx.currentTime, this.surfOut(kind, 0.35, 0.4));
  }
  surfBail(why = '') {
    const W = WIPE[why]; if (!W || !this.ok() || !this.allow('surfBail', 1)) return;
    this.surfRoar?.stop(0.2); this.surfRoar = null;
    W(this, this.ctx.currentTime, this.surfOut(why, 0.4, 0.6));
  }
  surfSubmarine() {
    if (!this.ok() || !this.allow('surfSubmarine', 1)) return;
    const t = this.ctx.currentTime, d = this.surfOut('under', 0.4, 0.5);
    this.noise(t, 0.4, { type: 'lowpass', f0: 600, f1: 250, gain: 0.45, dest: d }); this.tone(t, 0.3, { f0: 120, f1: 60, gain: 0.2, dest: d }); // (a muffled plunge)
    this.noise(t + 0.7, 0.5, { type: 'bandpass', f0: 800, f1: 3000, q: 0.8, gain: 0.35, dest: d }); // (the burst out)
  }
  surfDrag(on = true, side = 'R') {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime;
    if (!on) { const D = this.surfHand; this.surfHand = null; if (!D) return; D.stop(0.15); this.noise(t, 0.12, { type: 'bandpass', f0: 2500, f1: 1500, q: 1.2, gain: 0.2, dest: this.surfOut('drag', 0.3, 0.3) }); return; } // (the hand let go, a flick of spray)
    if (this.surfHand) return;
    const d = this.surfOut('drag', 0.3, 0.3);
    this.noise(t, 0.15, { type: 'bandpass', f0: 1800, f1: 900, q: 1, gain: 0.3, dest: d }); // (the hand landing in the face)
    const B = this.surfBed('drag', 'bandpass', 1400, 1.2, 0.1); // (water hissing past the fingers)
    try { const p = c.createStereoPanner(); p.pan.value = side === 'L' ? -0.5 : 0.5; B.g.disconnect(); B.g.connect(p).connect(B.d); } catch { /* no panner: centred */ }
    this.surfHand = B;
  }
  edgeSkid(k = 0.5) {
    if (!this.ok() || !this.allow('edgeSkid', 4)) return;
    const t = this.ctx.currentTime, g = clamp(k, 0.2, 1), d = this.surfOut('skid', 0.3, 0.3);
    this.noise(t, 0.35, { type: 'bandpass', f0: 3500, f1: 2500, q: 2.5, gain: 0.3 * g, attack: 0.03, dest: d }); // (the edge biting and skidding)
  }
  butter(on = true) {
    if (!this.ok() || !this.allow('butter', 3)) return;
    const t = this.ctx.currentTime, d = this.surfOut('butter', 0.3, 0.3);
    if (on) { this.noise(t, 0.25, { type: 'lowpass', f0: 1200, gain: 0.25, dest: d }); return; } // (the nose pressed down)
    this.noise(t, 0.4, { type: 'bandpass', f0: 1600, f1: 2400, q: 1.5, gain: 0.2, dest: d }); // (the spin let go)
  }
  slopeLand(grade = 'clean') {
    const L = LAND[grade]; if (!L || !this.ok() || !this.allow('slopeLand', 3)) return;
    L(this, this.ctx.currentTime, this.surfOut(grade, 0.4, 0.4));
  }
}
