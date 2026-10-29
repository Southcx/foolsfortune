// ---------------------------------------------------------------------------------------
// THE SHOAL'S SILHOUETTE HEARD (Calissa's SilhouetteEye, vfx; Petra's events from world/emocean/shoal.js, named 2026-10-29): the
// school drawing itself up into one great shape, its eye opening, the eye burning while it is locked, and the eye shattering.
//   FORM     (rail.shoal.form { k }) at k 0 a swell of the school's rush rising over about two real seconds, a low chord gathering
//            under it; at k 1 the shape whole: the chord landing
//   EYE      (rail.shoal.eye { open }) the eye opening: a slow glassy bloom, once as it first passes half open
//   LOCK     (rail.shoal.lock { on, k }) a held tone while the eye is locked, rising and brightening with the burn k; never a sting
//   SHATTER  (rail.shoal.shatter) glass breaking and the school scattering into the crude, a fall of small splashes
//
// Prior art: Rez's boss forms assembling out of particles (a chord built as the shape builds), Panzer Dragoon's lock-on hum, Star
// Fox's shattering cores.
//
//   sfx.shoalForm(k) .shoalEye(open) .shoalLock(on, k) .shoalShatter()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CHORD = [40, 47, 52, 55]; // (E minor, low: the shape gathering)

export class ShoalSilhouetteSounds {
  shoalForm(k = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.8);
    if (k <= 0.01) {
      if (!this.allow('shoalForm', 0.3)) return;
      this.noise(t, 2.2, { type: 'bandpass', f0: 400, f1: 2400, q: 1, gain: 0.25, attack: 1.6, dest: d }); // (the school's rush drawn up)
      CHORD.forEach((m, i) => this.tone(t + 0.3 * i, 2.2 - 0.3 * i, { f0: hz(m), type: i ? 'sine' : 'triangle', gain: 0.05, dest: d }));
    } else if (k >= 0.99 && this.allow('shoalWhole', 0.3)) CHORD.concat([64]).forEach((m) => this.tone(t, 1.8, { f0: hz(m), type: 'triangle', gain: 0.07, dest: d })); // (whole)
  }
  shoalEye(open = 0) {
    const was = this._shoalEye ?? 0; this._shoalEye = open;
    if (!(was < 0.5 && open >= 0.5) || !this.ok()) return; // (once, as it passes half open)
    const t = this.ctx.currentTime, d = this.out(0.3, 0.9);
    this.noise(t, 1.2, { type: 'bandpass', f0: 3000, f1: 6000, q: 6, gain: 0.16, attack: 0.5, dest: d });
    [83, 88].forEach((m, i) => this.tone(t + 0.2 * i, 1.4, { f0: hz(m), gain: 0.1, dest: d })); // (a glassy bloom)
  }
  shoalLock(on = false, k = 0) {
    const c = this.ctx; if (!c) return;
    let L = this._shoalLock;
    if (on && !L && this.ok()) {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth'; o2.type = 'sine'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0.0001;
      o.connect(f); o2.connect(f); f.connect(g).connect(this.out(1, 0.4));
      o.start(); o2.start(); L = this._shoalLock = { o, o2, g, f };
      g.gain.setTargetAtTime(0.05, c.currentTime, 0.15);
    }
    if (!L) return;
    const t = c.currentTime;
    if (!on) { this._shoalLock = null; L.g.gain.setTargetAtTime(0.0001, t, 0.12); setTimeout(() => { try { L.o.stop(); L.o2.stop(); } catch { /* gone */ } L.g.disconnect(); }, 800); return; }
    const u = Math.max(0, Math.min(1, k || 0)); // (the burn: the tone rising a fifth and brightening)
    L.o.frequency.setTargetAtTime(hz(52) * Math.pow(1.5, u), t, 0.1); L.o2.frequency.setTargetAtTime(hz(64) * Math.pow(1.5, u), t, 0.1);
    L.f.frequency.setTargetAtTime(600 + 2400 * u, t, 0.1); L.g.gain.setTargetAtTime(0.05 + 0.05 * u, t, 0.1);
  }
  shoalShatter() {
    this.shoalLock(false);
    if (!this.ok() || !this.allow('shoalShatter', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.55, 0.7);
    this.noise(t, 0.08, { type: 'highpass', f0: 3000, gain: 0.18, dest: d }); // (the glass)
    for (let i = 0; i < 14; i++) this.noise(t + 0.05 + Math.random() * 0.5, 0.02, { type: 'bandpass', f0: 3000 + Math.random() * 5000, q: 8, gain: 0.12, dest: d }); // (shards)
    for (let i = 0; i < 12; i++) this.noise(t + 0.4 + Math.random() * 1.4, 0.08, { type: 'bandpass', f0: 600 + Math.random() * 800, q: 3, gain: 0.15, dest: d }); // (the school falling into the crude)
    this.tone(t, 1.5, { f0: hz(40), f1: hz(28), type: 'triangle', gain: 0.15, dest: d });
  }
}
