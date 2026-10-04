// A sound bank of the one mixer (audio/sfx.js): the Courier's vessel, damaged and mended (courier/vessel/damage.js). They are fired clay, glazed:
// a blow cracks their glaze where it lands, and the cracks fill with gold as they heal (kintsugi).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//
// And the moments around them (courier/vessel/: the shield, the shatter and the reform, the kiln's MEND), heard through audio/cues.js.
//
// Prior art: a glazed pot cracking (a sharp report, then the crazing ticking on through the glaze: the raku "ping" of the shop's
// kiln, louder), the mask as the voice's own place (close and high), kintsugi's gold (a warm rising shimmer, not a fanfare); a force field taking a hit (Halo's shield's
// ring, its collapse's glassy shower); a reversed cymbal for something drawn back out of the air.
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PLACE = { mask: { f: 1.25, pan: 0 }, torso: { f: 0.8, pan: 0 }, armL: { f: 1.05, pan: -0.5 }, armR: { f: 1.05, pan: 0.5 }, legL: { f: 0.9, pan: -0.3 }, legR: { f: 0.9, pan: 0.3 } };

export class VesselSounds {
  /** A crack where a blow lands (k: how cracked the region is now, 0..1; region: mask, torso, armL, armR, legL, legR). */
  vesselCrack(k = 0.5, region = 'torso') {
    if (!this.ok() || !this.allow('vesselCrack', 10)) return;
    const P = PLACE[region] || PLACE.torso, c = this.ctx, t = c.currentTime, d = this.out(0.3 + 0.25 * Math.min(1, k), 0.35);
    let dest = d;
    if (P.pan) { const pn = c.createStereoPanner(); pn.pan.value = P.pan; pn.connect(d); dest = pn; }
    this.noise(t, 0.06, { type: 'bandpass', f0: 3600 * P.f, f1: 1800 * P.f, q: 2.5, gain: 0.8, dest }); // (the report)
    this.tone(t, 0.14, { f0: 320 * P.f, f1: 190 * P.f, type: 'triangle', gain: 0.35, dest }); // (the body under it)
    const n = 3 + Math.round(5 * Math.min(1, k)); // (the crazing runs on: more of it the worse the crack)
    for (let i = 0; i < n; i++) this.noise(t + 0.05 + Math.pow(i / n, 1.4) * 0.35, 0.012, { type: 'bandpass', f0: (4200 + Math.random() * 3000) * P.f, q: 10, gain: 0.3, dest });
  }

  /** A crack healed: gold run into it, a warm shimmer rising a fourth and settling. */
  vesselMend(region = 'torso') {
    if (!this.ok() || !this.allow('vesselMend', 4)) return;
    const P = PLACE[region] || PLACE.torso, c = this.ctx, t = c.currentTime, d = this.out(0.22, 0.6);
    let dest = d;
    if (P.pan) { const pn = c.createStereoPanner(); pn.pan.value = P.pan; pn.connect(d); dest = pn; }
    for (const [dt, f] of [[0, 1175], [0.12, 1568]]) for (const [r, a] of [[1, 0.2], [2.76, 0.05]]) this.tone(t + dt, 1.1 / r, { f0: f * r * P.f, f1: f * r * P.f, gain: a, dest });
    this.noise(t, 0.5, { type: 'bandpass', f0: 2500, f1: 5200, q: 3, gain: 0.08, attack: 0.15, dest }); // (the gold flowing)
    this.noise(t + 0.1, 1.4, { type: 'highpass', f0: 6500, f1: 9000, gain: 0.03, attack: 0.25, dest }); // (a faint sizzle as the gold cools away: the owner's, kept VERY quiet)
    for (let i = 0; i < 6; i++) this.noise(t + 0.2 + Math.random() * 1.1, 0.006, { type: 'bandpass', f0: 5000 + Math.random() * 3000, q: 6, gain: 0.05, dest });
  }

  /** The shield taking a blow (vessel.shield): the pool pays, a ward of Lachryma rings and settles; higher the fuller it still is. */
  vesselShield(left = 1) {
    if (!this.ok() || !this.allow('vesselShield', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.5), f = 740 * Math.pow(2, Math.max(0, Math.min(1, left)) * 0.6);
    this.noise(t, 0.12, { type: 'bandpass', f0: 5200, f1: 2200, q: 2, gain: 0.45, dest: d }); // (the blow taken on glass)
    for (const [r, a] of [[1, 0.2], [1.5, 0.1], [2.01, 0.06]]) this.tone(t, 0.5, { f0: f * r * 1.03, f1: f * r, gain: a, dest: d }); // (the ward's ring)
    this.tone(t, 0.25, { f0: 120, f1: 80, gain: 0.25, dest: d });
  }
  /** The shield breaking (vessel.shieldbreak): the ward shatters in a shower of glass, its hum dropping out under it. */
  vesselShieldBreak() {
    if (!this.ok() || !this.allow('vesselShieldBreak', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.6);
    this.noise(t, 0.3, { type: 'highpass', f0: 3000, f1: 6000, gain: 0.7, dest: d });
    for (let i = 0; i < 16; i++) { const tt = t + Math.pow(i / 16, 1.6) * 0.7, f = 2600 + Math.random() * 4500; this.tone(tt, 0.12, { f0: f, f1: f * 0.97, gain: 0.08, dest: d }); }
    this.tone(t, 0.9, { f0: 880, f1: 110, gain: 0.16, dest: d }); // (the ward's hum, falling out)
    this.tone(t, 0.3, { f0: 90, f1: 45, gain: 0.45, dest: d });
  }
  /** The Courier shattering (courier.shatter), under the cracks and the burst: a wide low "thoom", and the Tear (F to E) in the hall. */
  courierShatter() {
    if (!this.ok() || !this.allow('courierShatter', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.9);
    this.tone(t, 1.6, { f0: 110, f1: 41, gain: 0.5, dest: d });
    this.noise(t, 1.2, { type: 'lowpass', f0: 900, f1: 120, gain: 0.35, attack: 0.01, dest: d });
    for (const [m, dt] of [[65, 0.25], [64, 0.9]]) for (const o of [-12, 0, 12]) { const f = hz(m + o); this.tone(t + dt, 1.8, { f0: f, f1: f * 0.985, gain: o ? 0.04 : 0.07, dest: d }); }
  }
  /** Made whole (courier.reform): a shimmer drawn backwards out of the air, the wheel's hum turning up, an E major chord settling. */
  courierReform() {
    if (!this.ok() || !this.allow('courierReform', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.8);
    this.noise(t, 1.1, { type: 'bandpass', f0: 600, f1: 7000, q: 3, gain: 0.3, attack: 1.0, dest: d }); // (backwards: swelling, then gone)
    this.tone(t, 1.2, { f0: 82, f1: 165, type: 'triangle', gain: 0.2, dest: d }); // (the wheel)
    [64, 68, 71, 76].forEach((m, i) => { const f = hz(m); for (const [r, a] of [[1, 0.12], [2.76, 0.03]]) this.tone(t + 1.0 + i * 0.06, 2.2 / r, { f0: f * r, f1: f * r, gain: a, dest: d }); });
  }
  /** The kiln's MEND (vessel.refire): every crack filled with gold at once, the mend's shimmer climbing the Answer (G A B D E). */
  vesselRefire() {
    if (!this.ok() || !this.allow('vesselRefire', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.7);
    [67, 69, 71, 74, 76].forEach((m, i) => { const f = hz(m + 12); for (const [r, a] of [[1, 0.16], [2.76, 0.04]]) this.tone(t + 0.6 + i * 0.09, 1.4 / r, { f0: f * r, f1: f * r, gain: a, dest: d }); });
    this.noise(t + 0.5, 1.2, { type: 'bandpass', f0: 2500, f1: 6000, q: 3, gain: 0.1, attack: 0.3, dest: d });
  }
}
