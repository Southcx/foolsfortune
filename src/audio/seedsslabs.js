// ---------------------------------------------------------------------------------------
// THE GARDEN'S GROWTH HEARD (docs/plans/SEEDS-SLABS-SCANS.md 4; Petra's events from progress/seeds.js, progress/slabs.js, world/scanner.js):
// a seed planted and fed until it grows a size, a slab carved at the bench a verb at a time, the spirit out, a code read. The carving is the
// part played most, so it is heard as the stone: each verb its tool's own way into it, each stratum its own stone under it.
//   A SEED     planted (seed.plant): a soft press into the soil and two rising notes (an inner moonlet's higher and smaller); fed
//              (seed.feed): cubes chink, a material rustles, the hand's matter pours; a size grown (seed.grow): a slow swell and a
//              bloom chord, lower and wider each size up
//   A SLAB     made (slab.make): stone condensing round its plate, a dull set and a fine crackle (from a scan, the code's chirp first)
//   THE BENCH  one use (slab.use { verb, stratum }): brush a whisk, pick a chip, blast a pop and a crumble, slice a long scrape, hoover a
//              draw, toll the Crucibelle's bell heard through the stone, silhouette a paper's shimmer; on the stratum, loose sand hisses,
//              firm clay thuds, hard sandstone knocks bright, and the fossil (the Lachrymite) answers in glass; a crack (cracked): a sharp
//              snap falling away; a cell broken through (broke): a little crumble
//   THE DIG    set (slab.carve): the spirit's chime, darker for each crack; a flawless one rings as a struck bowl with its fifth and octave
//   A SCAN     read (scan.read): a scanner's two-note chirp; a sealed code a stamp under it; read again today, one low blip
//
// Prior art: Animal Crossing's fossil dig (a thunk for every shovel stroke), the ASMR of real fossil prep (a brush's whisk, an air scribe's
// chatter), a supermarket scanner's beep, Pokemon's evolution swell for a size grown.
//
//   sfx.seedPlant(inner) .seedFeed(from) .seedGrow(size) .slabMake(from) .slabUse(verb, stratum, cracked, broke) .slabCarve(flawless, cracked)
//   sfx.scanRead(sealed, again)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SIZE = { moonlet: 0, small: 1, medium: 2, large: 3 };
/** Each stratum's stone as heard (0 the fossil, 1 loose, 2 firm, 3 hard): the band its grains sit in and the knock under them. */
const STONE = [
  { f: 5200, q: 6, knock: 1500, type: 'sine' },     // (the fossil: Lachrymite, glass)
  { f: 3200, q: 0.8, knock: 0, type: null },         // (loose: sand, a hiss)
  { f: 900, q: 1.4, knock: 140, type: 'triangle' },  // (firm: clay, a thud)
  { f: 2200, q: 2.5, knock: 420, type: 'triangle' }, // (hard: sandstone, a bright knock)
];

export class GardenGrowthSounds {
  seedPlant(inner = false) {
    if (!this.ok() || !this.allow('seedPlant', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4), up = inner ? 12 : 0;
    this.noise(t, 0.12, { type: 'lowpass', f0: 600, gain: 0.4, dest: d }); this.tone(t, 0.18, { f0: 120, f1: 80, type: 'triangle', gain: 0.25, dest: d });
    [72, 79].forEach((m, i) => this.tone(t + 0.12 + i * 0.1, 0.5, { f0: hz(m + up), gain: inner ? 0.07 : 0.1, dest: d }));
  }
  seedFeed(from = 'cubes') {
    if (!this.ok() || !this.allow('seedFeed', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.4);
    if (from === 'cubes') for (let i = 0; i < 4; i++) this.tone(t + i * 0.05, 0.12, { f0: 2400 + Math.random() * 1200, gain: 0.1, dest: d }); // (cubes chink)
    else if (from === 'matter') this.noise(t, 0.6, { type: 'bandpass', f0: 2600, f1: 1400, q: 0.9, gain: 0.4, attack: 0.08, dest: d }); // (the hand's matter poured)
    else this.noise(t, 0.35, { type: 'bandpass', f0: 1800, q: 1.2, gain: 0.4, attack: 0.05, dest: d }); // (a material's rustle)
    this.tone(t + 0.15, 0.4, { f0: hz(79), gain: 0.04, dest: d }); // (taken in)
  }
  seedGrow(size = 'small') {
    if (!this.ok() || !this.allow('seedGrow', 0.5)) return;
    const t = this.ctx.currentTime, k = SIZE[size] ?? 1, d = this.out(0.35, 0.8), r = 60 - 5 * k;
    this.noise(t, 1.4, { type: 'bandpass', f0: 300, f1: 2400, q: 0.8, gain: 0.12, attack: 1.0, dest: d }); // (the swell)
    [0, 7, 12, 16, 19].slice(0, 3 + Math.min(2, k)).forEach((st, i) => this.tone(t + 1.0 + i * 0.05, 2.2, { f0: hz(r + st), type: i ? 'sine' : 'triangle', gain: 0.07, dest: d })); // (the bloom, wider a size)
  }
  slabMake(from = 'plate') {
    if (!this.ok() || !this.allow('slabMake', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4), at = from === 'scan' ? 0.18 : 0;
    if (from === 'scan') this.scanChirp(t, d);
    this.tone(t + at, 0.3, { f0: 150, f1: 90, type: 'triangle', gain: 0.3, dest: d }); this.noise(t + at, 0.1, { type: 'lowpass', f0: 700, gain: 0.35, dest: d }); // (the stone sets)
    for (let i = 0; i < 8; i++) this.noise(t + at + 0.05 + Math.random() * 0.4, 0.015, { type: 'bandpass', f0: 3000 + Math.random() * 3000, q: 5, gain: 0.12, dest: d }); // (its crackle)
  }
  /** One use at the bench: the verb's way into the stone, on the stratum it met; a crack, a cell broken through. */
  slabUse(verb, stratum = 2, cracked = false, broke = false) {
    if (!this.ok() || !this.allow(`slabUse.${verb}`, 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3), S = STONE[stratum] ?? STONE[2];
    const grit = (at, dur, gain, f = S.f) => this.noise(at, dur, { type: 'bandpass', f0: f, q: S.q, gain, dest: d });
    const knock = (at, gain) => { if (S.type) this.tone(at, 0.12, { f0: S.knock, f1: S.knock * 0.7, type: S.type, gain, dest: d }); };
    switch (verb) {
      case 'brush': grit(t, 0.3, 0.12, S.f * 1.3); break; // (a whisk)
      case 'pick': grit(t, 0.03, 0.4); knock(t, 0.2); this.tone(t, 0.08, { f0: 3400, gain: 0.04, dest: d }); break; // (a chip off)
      case 'blast': this.noise(t, 0.06, { type: 'lowpass', f0: 1600, gain: 0.5, dest: d }); knock(t, 0.25); for (let i = 0; i < 6; i++) grit(t + 0.05 + Math.random() * 0.3, 0.04, 0.2); break; // (a pop, the crust crumbling)
      case 'slice': this.noise(t, 0.9, { type: 'bandpass', f0: S.f * 0.8, f1: S.f * 1.2, q: 2, gain: 0.5, attack: 0.05, dest: d }); break; // (a layer scraped off flat)
      case 'hoover': this.noise(t, 0.55, { type: 'bandpass', f0: 500, f1: 1800, q: 1.5, gain: 0.25, attack: 0.1, dest: d }); grit(t + 0.2, 0.3, 0.1); break; // (the draw)
      case 'toll': this.godBell?.(t, 1.4, hz(64), 0.08, d); this.tone(t, 1.2, { f0: hz(64), gain: 0.04, dest: d }); if (!stratum) this.tone(t + 0.3, 1.0, { f0: hz(88), gain: 0.05, dest: d }); break; // (the bell through stone; the fossil rings back)
      case 'silhouette': this.noise(t, 0.4, { type: 'highpass', f0: 6000, gain: 0.06, attack: 0.1, dest: d }); this.tone(t + 0.1, 0.5, { f0: hz(84), gain: 0.03, dest: d }); break; // (the plate held up)
      default: grit(t, 0.1, 0.2);
    }
    if (broke) for (let i = 0; i < 3; i++) grit(t + 0.08 + i * 0.05, 0.04, 0.14, S.f * 0.7); // (a cell broken through)
    if (cracked) { const c = t + 0.04; this.noise(c, 0.03, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); this.tone(c, 0.35, { f0: hz(88), f1: hz(76), gain: 0.07, dest: d }); } // (the fossil cracked: a snap falling away)
  }
  slabCarve(flawless = false, cracked = 0) {
    if (!this.ok() || !this.allow('slabCarve', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.8);
    if (flawless) { this.godBell?.(t, 3, hz(72), 0.12, d); this.godBell?.(t + 0.08, 2.6, hz(79), 0.08, d); this.godBell?.(t + 0.16, 2.4, hz(84), 0.06, d); return; } // (a struck bowl, its fifth and octave)
    const dark = Math.min(3, cracked || 0);
    [76, 79, 84].forEach((m, i) => this.tone(t + i * 0.08, 1.2, { f0: hz(m - dark * 2), type: i ? 'sine' : 'triangle', gain: 0.07 - dark * 0.01, dest: d })); // (the spirit out, darker a crack)
  }
  scanChirp(t, d) { [2700, 3400].forEach((f, i) => this.tone(t + i * 0.07, 0.06, { f0: f, type: 'square', gain: 0.025, dest: d })); }
  scanRead(sealed = false, again = false) {
    if (!this.ok() || !this.allow('scanRead', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.2, true);
    if (again) { this.tone(t, 0.12, { f0: 600, type: 'square', gain: 0.02, dest: d }); return; } // (read today already)
    this.scanChirp(t, d);
    if (sealed) { this.noise(t + 0.18, 0.06, { type: 'lowpass', f0: 800, gain: 0.4, dest: d }); this.tone(t + 0.18, 0.2, { f0: 110, f1: 70, type: 'triangle', gain: 0.25, dest: d }); } // (a seal's stamp)
  }
}
