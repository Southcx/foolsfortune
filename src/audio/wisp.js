// A sound bank of the one mixer (audio/sfx.js): the Lantern Wisp (creatures/wisp/lanternwisp.js), a flame kept in a lantern of glass
// that hovers over the Dunes. Its voice is the two things it is: the flame (a breath of fire, a flutter, a gutter) and the glass (a thin
// ring that sings when struck). Heard through audio/cues.js on its events:
//   NOTICE  wisp.notice: the flame flaring up, the glass ringing a fifth (it has seen you)
//   CAST    wisp.cast: the flame drawn in (a rising breath), then the ball thrown (a whump and a crackle)
//   HIT     wisp.hit: the lantern knocked (a glass clink, high) and the flame shaken (a flutter)
//   OUT     wisp.burst: put out: a breath snuffed, the glass's last ring sinking, a curl of smoke's hiss
// Prior art: a candle's flame and a hurricane lamp's glass (the classic synthesis: band-passed noise breathing for fire, inharmonic
// sine partials for struck glass), Dark Souls' wisps and Zelda's Wizzrobe (a caster heard winding up before it throws).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const GLASS = [1, 2.32, 4.25]; // (a thin glass's partials, struck)

export class WispSounds {
  /** Its glass struck: the inharmonic partials of a thin lantern pane at a pitch, decaying. */
  wispGlass(t, f, gain, dur, d) { GLASS.forEach((r, i) => this.tone(t, dur / (1 + i), { f0: f * r, f1: f * r * 0.998, gain: gain / (1 + i * 1.5), dest: d })); }
  wispNotice() {
    if (!this.ok() || !this.allow('wispNotice', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.45);
    this.noise(t, 0.35, { type: 'bandpass', f0: 600, f1: 2200, q: 1.2, gain: 0.35, attack: 0.05, dest: d }); // (the flame flaring)
    this.wispGlass(t + 0.05, hz(88), 0.12, 0.9, d); this.wispGlass(t + 0.17, hz(95), 0.09, 0.9, d); // (a fifth on the glass)
  }
  wispCast() {
    if (!this.ok() || !this.allow('wispCast', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.35);
    this.noise(t, 0.45, { type: 'bandpass', f0: 400, f1: 1800, q: 1.5, gain: 0.4, attack: 0.35, dest: d }); // (the flame drawn in)
    this.tone(t, 0.45, { f0: 180, f1: 360, type: 'triangle', gain: 0.12, dest: d });
    this.noise(t + 0.45, 0.25, { f0: 1500, f1: 300, gain: 0.55, dest: d }); this.tone(t + 0.45, 0.2, { f0: 140, f1: 70, gain: 0.35, dest: d }); // (the ball thrown)
    for (let i = 0; i < 5; i++) this.noise(t + 0.47 + Math.random() * 0.25, 0.01, { type: 'highpass', f0: 4000, gain: 0.25, dest: d }); // (its crackle)
  }
  wispHit() {
    if (!this.ok() || !this.allow('wispHit', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.3), f = hz(84 + Math.floor(Math.random() * 4));
    this.wispGlass(t, f, 0.22, 0.5, d); // (the lantern knocked)
    for (let i = 0; i < 4; i++) this.noise(t + 0.02 + i * 0.045, 0.04, { type: 'bandpass', f0: 900 + Math.random() * 500, q: 2, gain: 0.25, dest: d }); // (the flame shaken)
  }
  wispOut() {
    if (!this.ok() || !this.allow('wispOut', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.5);
    this.noise(t, 0.18, { f0: 2500, f1: 400, gain: 0.5, dest: d }); // (snuffed)
    this.wispGlass(t + 0.05, hz(88), 0.16, 1.6, d);
    this.tone(t + 0.05, 1.6, { f0: hz(88), f1: hz(81), gain: 0.06, dest: d }); // (its last ring sinking)
    this.noise(t + 0.25, 1.2, { type: 'highpass', f0: 5000, f1: 2500, gain: 0.08, attack: 0.3, dest: d }); // (a curl of smoke)
  }
}
