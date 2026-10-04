// A sound bank of the one mixer (audio/sfx.js): the Courier's vessel, damaged and mended (courier/vessel/damage.js). They are fired clay, glazed:
// a blow cracks their glaze where it lands, and the cracks fill with gold as they heal (kintsugi).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//
// Prior art: a glazed pot cracking (a sharp report, then the crazing ticking on through the glaze: the raku "ping" of the shop's
// kiln, louder), the mask as the voice's own place (close and high), kintsugi's gold (a warm rising shimmer, not a fanfare).
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
  }
}
