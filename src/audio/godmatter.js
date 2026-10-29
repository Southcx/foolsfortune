// ---------------------------------------------------------------------------------------
// THE MATTER'S SOUNDS (the god hand's four God Arts that move the island's matter, godhand/matterarts.js; GODHAND.md section 3),
// heard through audio/cues.js on each stroke's event, bigger with what it moved (m³):
//   SCOOP   sand running up into the hand: a falling hiss of grains, a soft weight settling in the palm
//   POUR    the matter let go: a stream of grains falling and a heap slumping where it lands
//   SHAPE   clay pressed and drawn: a wet squelch and the ground's low groan as it rises or sinks
//   CARVE   a channel gouged: a scrape along the stroke, its spoil thrown up the banks in little falls
//   SCULPT  a creation raised (god.sculpt { shape, volume }): clay slapped up and pressed, then its shape's own end: a pillar's
//           thunk, an arch's two feet set down and its keystone's knock, a ramp's long slide
// What was made from nothing (`made`) adds a faint shimmer: Lachryma paying for it.
//
// Prior art: From Dust (sand carried under the hand and let fall), Populous's ground rising and sinking, a potter's wheel (clay slapped
// and pressed), Black & White's hand moving earth.
//
//   sfx.godScoop(moved, made) .godPour(moved) .godShape(moved, made) .godCarve(moved) .godSculpt(shape, volume, made)
// ---------------------------------------------------------------------------------------

/** 0..1 from the cubic metres a stroke moved: a handful barely heard, a big haul full. */
const sizeOf = (m3) => Math.min(1, Math.sqrt(Math.max(0, m3 || 0) / 40));

export class GodMatterSounds {
  /** Lachryma paying for matter made from nothing: a faint shimmer over the stroke. */
  godMadeShimmer(t, d, made) {
    if (!(made > 0.05)) return;
    this.noise(t, 0.6, { type: 'highpass', f0: 6000, f1: 9000, gain: 0.04 + 0.04 * sizeOf(made), attack: 0.1, dest: d });
  }
  godScoop(moved = 1, made = 0) {
    if (!this.ok() || !this.allow('godScoop', 3)) return;
    const t = this.ctx.currentTime, k = sizeOf(moved), d = this.out(0.25 + 0.2 * k, 0.3);
    this.noise(t, 0.4 + 0.5 * k, { type: 'bandpass', f0: 4200, f1: 1800, q: 1.2, gain: 0.18 + 0.2 * k, attack: 0.05, dest: d }); // (grains running up)
    this.noise(t + 0.35 + 0.4 * k, 0.15, { type: 'lowpass', f0: 500, gain: 0.25, dest: d }); // (settled in the palm)
    this.godMadeShimmer(t, d, made);
  }
  godPour(moved = 1) {
    if (!this.ok() || !this.allow('godPour', 3)) return;
    const t = this.ctx.currentTime, k = sizeOf(moved), d = this.out(0.25 + 0.2 * k, 0.3), dur = 0.6 + 0.9 * k;
    this.noise(t, dur, { type: 'bandpass', f0: 2600, f1: 1400, q: 0.9, gain: 0.16 + 0.18 * k, attack: 0.1, dest: d }); // (the stream)
    for (let i = 0; i < 3; i++) this.noise(t + dur * (0.5 + i * 0.2), 0.25, { type: 'lowpass', f0: 700 - i * 150, gain: 0.15 + 0.1 * k, dest: d }); // (the heap slumping)
  }
  godShape(moved = 1, made = 0) {
    if (!this.ok() || !this.allow('godShape', 3)) return;
    const t = this.ctx.currentTime, k = sizeOf(moved), d = this.out(0.3 + 0.2 * k, 0.35);
    this.noise(t, 0.3, { type: 'bandpass', f0: 600, f1: 1100, q: 3, gain: 0.3, attack: 0.04, dest: d }); // (the wet squelch)
    this.tone(t + 0.05, 0.6 + 0.6 * k, { f0: 70 + 20 * k, f1: 50, type: 'triangle', gain: 0.12 + 0.12 * k, dest: d }); // (the ground's groan)
    this.godMadeShimmer(t, d, made);
  }
  godCarve(moved = 1) {
    if (!this.ok() || !this.allow('godCarve', 3)) return;
    const t = this.ctx.currentTime, k = sizeOf(moved), d = this.out(0.3 + 0.2 * k, 0.3);
    this.noise(t, 0.5 + 0.3 * k, { type: 'bandpass', f0: 1500, f1: 900, q: 2, gain: 0.25 + 0.15 * k, attack: 0.03, dest: d }); // (the gouge)
    for (let i = 0; i < 4; i++) this.noise(t + 0.2 + i * 0.15 + Math.random() * 0.05, 0.12, { type: 'bandpass', f0: 2500, f1: 1200, q: 1, gain: 0.1, dest: d }); // (the spoil falling)
  }
  godSculpt(shape = 'pillar', volume = 4, made = 0) {
    if (!this.ok() || !this.allow('godSculpt', 2)) return;
    const t = this.ctx.currentTime, k = sizeOf(volume), d = this.out(0.35 + 0.2 * k, 0.4);
    for (let i = 0; i < 3; i++) { this.noise(t + i * 0.12, 0.08, { type: 'bandpass', f0: 700, q: 2, gain: 0.3, dest: d }); this.tone(t + i * 0.12, 0.1, { f0: 160, f1: 110, type: 'triangle', gain: 0.15, dest: d }); } // (clay slapped up)
    const at = t + 0.45;
    if (shape === 'arch') { this.tone(at, 0.3, { f0: 90, f1: 60, type: 'triangle', gain: 0.3, dest: d }); this.tone(at + 0.2, 0.3, { f0: 85, f1: 55, type: 'triangle', gain: 0.3, dest: d }); this.noise(at + 0.45, 0.04, { type: 'bandpass', f0: 1200, q: 3, gain: 0.35, dest: d }); }
    else if (shape === 'ramp') this.noise(at, 0.9, { type: 'lowpass', f0: 300, f1: 900, q: 1, gain: 0.3, attack: 0.2, dest: d });
    else this.tone(at, 0.35, { f0: 110, f1: 65, type: 'triangle', gain: 0.35, dest: d }); // (a pillar's thunk)
    this.godMadeShimmer(t, d, made);
  }
}
