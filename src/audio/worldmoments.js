// ---------------------------------------------------------------------------------------
// THE WORLD'S SMALL MOMENTS: sounds for events nothing else answered yet, each short and kept under the mix, heard through audio/cues.js.
//   THE ROD        angle.brace: the rod's butt pressed into the hip (a cork grip's creak, the blank taking the load); angle.crank: a
//                  heavy reel's gear thrown in (a clunk, then a few slow teeth grinding); angle.retrieve.fast: the reel spun up (a
//                  whirr climbing, its pawl ticking faster). Onsets only: the reel's own ticks and the line's song stay audio/angling.js's
//                  and audio/anglingsong.js's
//   THE STOW       angle.landed: the lift over, the fish slid into the Pneuka Box (a wet slap) and its Lachryma dripping off (a plink a
//                  bauble or two, at most four)
//   THE JELLY      jelly.fetch: a slip jelly bringing you Lachryma, pleased with itself (a wet blurt and a chirp up a sixth). Its
//                  notice, eat and fish already sound where they happen (its cry's squelch, its gulp: creatures/jelly/slipjelly.js)
//   THE WISP       wisp.drink: a Lantern Wisp drinking a blot at night: a slurp drawn down, its flame guttering, and its glass ringing
//                  a tritone wrong (the Wisp's own glass: audio/wisp.js wispGlass)
//   THE MIRAGE     mirage.raise: smoke rising into a shape, a shimmer of two voices beating; mirage.fade: the shimmer sinking, a
//                  breath of smoke let go
//   THE FLOURISH   gun.flourish: the psygun twirled round the finger before it is put away: two turns of air, the cylinder's pawl
//                  ticking as it free-spins, and the gun caught home with a click
//   A STUN BUILT   stun.build: frequent, so barely there: one soft tick, rising with the meter (a stun's own sting is audio/damage.js
//                  stunSting, so a tick that fills the meter is skipped)
//   A MACRO WORN   reprogram.wear: what you wrote into a mind wearing off: a stepped square tone falling, bits crackling, a low sigh
//   THE KILN       kiln.open: the latch, the heavy door dragged, the heat breathing out; kiln.close: dragged back, a thud, the latch
//   THE BEAM       balance.start: a held breath, very quiet
//   A CAP          pool.cap: a cap lowering the pool's max: a glass ceiling's dull clink, lower the more is held; lifted, a lighter
//                  clink up
//   A DOMAIN       domain.level: a domain of the psyche a level up: a run up to its own bell (a degree of the pentatonic a domain,
//                  in DOMAIN_ORDER), on the music's next sixteenth and in its key
//   THE SKY READ   sky.read: the vane turned to the wind (an airy swish), then the forecast as notes, one a block: a feeling's place
//                  on the scale its valence (Wonder high, Dread low), its strength its loudness, fair a soft open note
//   THE SIGHT      sight.calibrate: the Sight's needle swinging, wobbling and settling with a click; let go (from 'off'), its pivot
//                  loosening into a spin
// Prior art: a fly reel's click-and-pawl and a baitcaster's gear (the real things), Red Dead Redemption 2's gun spin, Thief's and
// Metal Gear's decoys (a lure heard as well as seen), Zelda's dungeon doors (weight in the drag and the thud), OSRS's level-up jingle
// (a skill a tune) and Persona's stat-up chime, a ship's compass card settling, Fallout's and Dishonored's glitches as a stepped fall.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.riser`, `this.allow`: audio/core.js;
// `this.onSixteenth`: audio/rail.js), and tolerates missing arguments.
//
//   sfx.rodBrace() .rodCrank() .fastRetrieve() .fishStowed(baubles) .jellyFetch(dist) .wispDrink(dist) .mirageRaise(secs) .mirageFade()
//   sfx.gunFlourish() .stunBuildTick(meter, depth) .reprogramWear(macro) .kilnDoorOpen() .kilnDoorClose() .balanceBreath()
//   sfx.poolCapClink(share, regions) .domainLevelUp(domain, level, grid) .skyReadNotes(blocks, grid) .sightCalibrate(from)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const num = (x, d, lo = -Infinity, hi = Infinity) => (Number.isFinite(+x) && x !== null && x !== '' ? Math.max(lo, Math.min(hi, +x)) : d);
const roll = (dist) => 1 / (0.5 + num(dist, 5, 0, 200) * 0.1); // (the jelly's and the Wisp's roll-off: audio/jelly.js)
const DOMAIN_STEP = { ouranurgy: 0, manifestation: 2, divination: 4, psychokinesis: 7, possession: 9, alteration: 12, spellscription: 14 }; // (DOMAIN_ORDER up the pentatonic)
const SKY_STEP = { wonder: 14, mirth: 12, desire: 7, fury: 4, gall: 2, grief: 0, dread: -3 }; // (valence as height: progress/weather.js VALENCE)
const CAP = { share: 0 }; // (the share last heard: lowered or lifted)
/** The music's next sixteenth (audio/rail.js onSixteenth), or now with no music or a grid it cannot read. */
const gridT = (s, grid) => { const now = s.ctx.currentTime, v = s.onSixteenth && grid?.spb > 0 ? s.onSixteenth(grid) : now; return Number.isFinite(v) && v >= now ? v : now; };

export class WorldMomentSounds {
  // ---------------------------------------------------------------- the rod (onsets: the reel's ticks are audio/angling.js's)
  rodBrace() {
    if (!this.ok() || !this.allow('rodBrace', 1.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.2);
    this.noise(t, 0.22, { type: 'bandpass', f0: 650, f1: 900, q: 4, gain: 0.35, attack: 0.04, dest: d }); // (the cork grip's creak)
    this.noise(t + 0.05, 0.12, { type: 'bandpass', f0: 2200, f1: 1600, q: 6, gain: 0.12, dest: d }); // (a squeak against the hip)
    this.tone(t, 0.4, { f0: 92, f1: 70, type: 'sawtooth', gain: 0.05, dest: d }); // (the blank taking the load)
  }
  rodCrank() {
    if (!this.ok() || !this.allow('rodCrank', 1.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.2);
    this.tone(t, 0.1, { f0: 150, f1: 80, gain: 0.4, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 1500, gain: 0.3, dest: d }); // (the gear thrown in)
    for (let i = 0; i < 6; i++) this.noise(t + 0.09 + i * 0.075, 0.03, { type: 'bandpass', f0: 950 + i * 70, q: 5, gain: 0.22 - i * 0.02, dest: d }); // (slow heavy teeth)
    this.tone(t + 0.08, 0.5, { f0: 55, f1: 62, type: 'sawtooth', gain: 0.05, dest: d }); // (the grind's growl)
  }
  fastRetrieve() {
    if (!this.ok() || !this.allow('fastRetrieve', 1.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0.15);
    this.riser(t, 0.35, { f0: 120, f1: 520, type: 'sawtooth', gain: 0.12, q: 3, dest: d }); // (the spool spun up)
    for (let i = 0, x = 0, gap = 0.06; i < 12 && x < 0.42; i++, x += gap, gap = Math.max(0.015, gap * 0.78)) this.noise(t + x, 0.008, { type: 'bandpass', f0: 4200, q: 6, gain: 0.18, dest: d }); // (the pawl, faster)
  }
  /** The lift over: the fish into the Box, `baubles` of its Lachryma dripping off. */
  fishStowed(baubles = 2) {
    if (!this.ok() || !this.allow('fishStowed', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.3), n = Math.round(num(baubles, 2, 1, 4));
    this.noise(t, 0.12, { type: 'lowpass', f0: 1500, f1: 300, gain: 0.45, dest: d }); this.tone(t, 0.12, { f0: 180, f1: 90, gain: 0.3, dest: d }); // (the wet slap)
    for (let i = 0; i < n; i++) { const f = 1200 + Math.random() * 600; this.tone(t + 0.14 + i * 0.07, 0.07, { f0: f * 1.4, f1: f, gain: 0.08, dest: d }); } // (the drips)
  }

  // ---------------------------------------------------------------- creatures
  /** A slip jelly bringing you Lachryma, pleased with itself. */
  jellyFetch(dist = 3) {
    if (!this.ok() || !this.allow('jellyFetch', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3 * roll(dist), 0.3);
    this.tone(t, 0.14, { f0: 300, f1: 620, gain: 0.35, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: 500, f1: 1200, q: 3, gain: 0.25, dest: d }); // (the blurt)
    [659, 1109].forEach((f, i) => this.tone(t + 0.12 + i * 0.08, 0.16, { f0: f, f1: f * 1.02, type: 'triangle', gain: 0.1, dest: d })); // (the chirp up a sixth)
  }
  /** A Lantern Wisp drinking a blot `dist` metres away: the slurp, the flame guttering, its glass ringing wrong. */
  wispDrink(dist = 10) {
    const m = num(dist, 10, 0, 999);
    if (m > 45 || !this.ok() || !this.allow('wispDrink', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.36 * roll(m), 0.55);
    for (let i = 0; i < 3; i++) { const at = t + i * 0.16; this.noise(at, 0.15, { type: 'bandpass', f0: 1400 - i * 200, f1: 320, q: 3, gain: 0.3, dest: d }); this.tone(at, 0.13, { f0: 520 - i * 60, f1: 150, gain: 0.12, dest: d }); } // (the slurp)
    for (let i = 0; i < 6; i++) this.noise(t + 0.5 + i * (0.05 + Math.random() * 0.05), 0.04, { type: 'bandpass', f0: 700 + Math.random() * 900, q: 1.2, gain: 0.25 - i * 0.03, dest: d }); // (the flame guttering)
    if (this.wispGlass) { this.wispGlass(t + 0.6, hz(82), 0.07, 1.3, d); this.wispGlass(t + 0.6, hz(76) * 1.012, 0.06, 1.3, d); } // (a tritone, beating: wrong)
    else this.tone(t + 0.6, 1.2, { f0: hz(82), f1: hz(81), gain: 0.06, dest: d });
  }

  // ---------------------------------------------------------------- the Crucibelle's mirage (the song's chime is crucibelle.js's)
  /** A mirage put up for `secs` (longer, a little fuller). */
  mirageRaise(secs = 7) {
    if (!this.ok() || !this.allow('mirageRaise', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.24, 0.7), k = num(secs, 7, 1, 30) / 7;
    this.noise(t, 0.9, { type: 'bandpass', f0: 300, f1: 1500, q: 1, gain: 0.22, attack: 0.4, dest: d }); // (smoke rising into a shape)
    [hz(74), hz(74) * 1.008, hz(81)].forEach((f) => this.riser(t, 0.7, { f0: f * 0.94, f1: f, type: 'sine', gain: 0.05 * Math.min(1.3, 0.8 + 0.2 * k), dest: d })); // (two voices beating, a fifth over)
    for (let i = 0; i < 5; i++) this.tone(t + 0.3 + Math.random() * 0.6, 0.12, { f0: 2400 + Math.random() * 1800, gain: 0.02, dest: d }); // (the shimmer's glints)
  }
  mirageFade() {
    if (!this.ok() || !this.allow('mirageFade', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.7);
    [hz(81), hz(81) * 1.01].forEach((f) => this.tone(t, 0.8, { f0: f, f1: f * 0.7, gain: 0.05, dest: d })); // (the shimmer sinking)
    this.noise(t, 0.7, { type: 'bandpass', f0: 1200, f1: 300, q: 0.9, gain: 0.2, attack: 0.05, dest: d }); // (the smoke let go)
  }

  // ---------------------------------------------------------------- the psygun's flourish (gunmoves.js FLOURISH: 1.1 s, two turns from 0.14 to 0.86)
  gunFlourish() {
    if (!this.ok() || !this.allow('gunFlourish', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.25), turn = 0.36;
    for (let i = 0; i < 2; i++) this.noise(t + 0.14 + i * turn, turn, { type: 'bandpass', f0: 600 + i * 250, f1: 1800 + i * 300, q: 1.4, gain: 0.18, attack: turn * 0.5, dest: d }); // (a turn of air each)
    for (let i = 0, x = 0.16, gap = 0.035; i < 16 && x < 0.86; i++, x += gap, gap *= 1.09) this.noise(t + x, 0.007, { type: 'bandpass', f0: 3600, q: 6, gain: 0.12, dest: d }); // (the pawl as the cylinder free-spins)
    this.noise(t + 0.9, 0.02, { type: 'bandpass', f0: 2800, q: 5, gain: 0.4, dest: d }); this.noise(t + 0.94, 0.015, { type: 'bandpass', f0: 3800, q: 6, gain: 0.3, dest: d }); // (click home)
    this.tone(t + 0.9, 0.08, { f0: 240, f1: 150, gain: 0.2, dest: d }); // (caught in the hand)
  }

  // ---------------------------------------------------------------- a stun built, a macro worn
  /** A stun's meter filled to `meter` (0..1); `depth` above 0 when it deepens one already down. */
  stunBuildTick(meter = 0.5, depth = 0) {
    const k = num(meter, 0.5, 0, 1);
    if (k >= 1 || !this.ok() || !this.allow('stunBuildTick', 8) || !this.hitOk()) return; // (hitOk: a phone hears a blow once, core.js) // (a full meter is the sting's: audio/damage.js)
    const t = this.ctx.currentTime, d = this.out(0.07, 0.15), f = (num(depth, 0, 0, 3) > 0 ? 420 : 600) * Math.pow(2, k * 1.5);
    this.tone(t, 0.035, { f0: f, f1: f * 1.04, type: 'triangle', gain: 0.25, dest: d });
    this.noise(t, 0.006, { type: 'highpass', f0: 5000, gain: 0.1, dest: d });
  }
  /** What you wrote into a mind (`macro`'s id) wearing off. */
  reprogramWear(macro = '') {
    if (!this.ok() || !this.allow('reprogramWear', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.3);
    for (let i = 0; i < 6; i++) { const f = 880 * Math.pow(0.76, i) * (1 + (Math.random() - 0.5) * 0.06); this.tone(t + i * 0.045, 0.04, { f0: f, type: 'square', gain: 0.06, dest: d }); } // (a stepped fall)
    for (let i = 0; i < 5; i++) this.noise(t + Math.random() * 0.3, 0.01, { type: 'bandpass', f0: 2500 + Math.random() * 4000, q: 4, gain: 0.15, dest: d }); // (bits crackling)
    this.tone(t + 0.28, 0.4, { f0: 110, f1: 55, gain: 0.2, dest: d }); // (the sigh as the old mind comes back)
  }

  // ---------------------------------------------------------------- the kiln's door (the firing is audio/shop.js kilnFire)
  kilnDoorOpen() {
    if (!this.ok() || !this.allow('kilnDoor', 1.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.45);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1800, q: 4, gain: 0.3, dest: d }); this.tone(t, 0.08, { f0: 300, f1: 200, type: 'triangle', gain: 0.12, dest: d }); // (the latch)
    this.noise(t + 0.08, 0.6, { type: 'bandpass', f0: 200, f1: 500, q: 2, gain: 0.3, attack: 0.15, dest: d }); // (the heavy door dragged)
    this.noise(t + 0.3, 1.0, { type: 'lowpass', f0: 300, f1: 1200, gain: 0.22, attack: 0.3, dest: d }); this.tone(t + 0.3, 1.0, { f0: 70, f1: 64, gain: 0.18, dest: d }); // (the heat breathing out)
  }
  kilnDoorClose() {
    if (!this.ok() || !this.allow('kilnDoor', 1.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.45);
    this.noise(t, 0.4, { type: 'bandpass', f0: 500, f1: 200, q: 2, gain: 0.28, attack: 0.08, dest: d }); // (dragged back)
    this.tone(t + 0.4, 0.3, { f0: 110, f1: 45, gain: 0.45, dest: d }); this.noise(t + 0.4, 0.15, { type: 'lowpass', f0: 900, f1: 200, gain: 0.35, dest: d }); // (the thud)
    this.noise(t + 0.55, 0.04, { type: 'bandpass', f0: 2000, q: 4, gain: 0.25, dest: d }); // (the latch)
  }

  // ---------------------------------------------------------------- the beam, a cap, a domain, the sky, the Sight
  balanceBreath() {
    if (!this.ok() || !this.allow('balanceBreath', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.08, 0.2);
    this.noise(t, 0.45, { type: 'bandpass', f0: 800, f1: 1600, q: 1.5, gain: 0.3, attack: 0.35, dest: d }); // (a breath drawn and held)
  }
  /** A cap on the pool: `share` of its max held (0..1), by `regions` cracked. Lowered, a dull clink down; lifted, a lighter one up. */
  poolCapClink(share = 0, regions = 0) {
    const k = num(share, 0, 0, 1), was = CAP.share; CAP.share = k;
    if (Math.abs(k - was) < 0.001 || !this.ok() || !this.allow('poolCapClink', 4)) return;
    const t = this.ctx.currentTime + 0.12, d = this.out(0.2, 0.3, true), down = k > was, f = (down ? 1100 : 1500) * Math.pow(0.82, num(regions, 1, 0, 6) * (down ? 1 : 0.5)); // (after the crack's own sound)
    [1, 2.32, 4.25].forEach((r, i) => this.tone(t, (down ? 0.22 : 0.4) / (1 + i), { f0: f * r, f1: f * r * (down ? 0.99 : 1.01), gain: (down ? 0.1 : 0.08) / (1 + i * 1.5), dest: d })); // (the glass ceiling)
    if (down) this.tone(t, 0.12, { f0: 160, f1: 110, gain: 0.15, dest: d }); // (dull: it sits on the column)
    else this.tone(t + 0.08, 0.3, { f0: f * 1.5, gain: 0.04, dest: d });
  }
  /** A domain of the psyche (`domain`, DOMAIN_ORDER's id) reaching `level`: a run up to its bell, on the music's next sixteenth. */
  domainLevelUp(domain = 'ouranurgy', level = 2, grid = null) {
    const key = String(domain ?? 'ouranurgy');
    if (!this.ok() || !this.allow(`domainLevelUp.${key}`, 1)) return;
    const now = this.ctx.currentTime, t = gridT(this, grid), d = this.out(0.3, 0.55, true);
    const up = grid?.root != null && Number.isFinite(+grid.root) ? ((((grid.root - 64) % 12) + 12) % 12) : 0, root = 76 + up + (DOMAIN_STEP[key] ?? 0);
    [-12, -5, 0].forEach((s, i) => this.tone(t + i * 0.07, 0.14, { f0: hz(root + s - 12), type: 'triangle', gain: 0.12, dest: d })); // (the run up)
    const at = t + 0.21, big = Math.round(num(level, 2, 1, 99)) % 10 === 0;
    this.tone(at, 1.4, { f0: hz(root), gain: 0.12, dest: d }); this.tone(at, 0.6, { f0: hz(root) * 2.76, gain: 0.025, dest: d }); // (its bell)
    this.tone(at, 1.0, { f0: hz(root - 12), type: 'triangle', gain: 0.07, dest: d });
    if (big) { this.tone(at + 0.12, 1.4, { f0: hz(root + 7), gain: 0.07, dest: d }); this.noise(at, 1.0, { type: 'highpass', f0: 7000, gain: 0.05, attack: 0.1, dest: d }); } // (a tenth level: a fifth over, a shimmer)
  }
  /** The sky read: the vane turned to the wind, then each forecast block (`{ aspect, strength }`) a note, at most four. */
  skyReadNotes(blocks = [], grid = null) {
    if (!this.ok() || !this.allow('skyReadNotes', 1)) return;
    const list = Array.isArray(blocks) ? blocks.slice(0, 4) : [], now = this.ctx.currentTime, d = this.out(0.24, 0.6);
    this.noise(now, 0.5, { type: 'bandpass', f0: 500, f1: 2400, q: 1.2, gain: 0.2, attack: 0.2, dest: d }); // (the vane turned to the wind)
    const up = grid?.root != null && Number.isFinite(+grid.root) ? ((((grid.root - 64) % 12) + 12) % 12) : 0;
    const step = grid?.spb > 0 ? Math.max(0.1, Math.min(0.3, grid.spb / 2)) : 0.16;
    const t0 = Math.max(now + 0.35, gridT(this, grid));
    list.forEach((b, i) => {
      const asp = b && SKY_STEP[b.aspect] != null ? b.aspect : null, s = num(b?.strength, 0.5, 0, 1), at = t0 + i * step;
      if (!asp) { this.tone(at, 0.4, { f0: hz(72 + up + 9), gain: 0.05, dest: d }); return; } // (fair: a soft open note)
      const f = hz(72 + up + SKY_STEP[asp]);
      this.tone(at, 0.45, { f0: f, type: 'triangle', gain: 0.06 + 0.1 * s, dest: d }); this.tone(at, 0.25, { f0: f * 2, gain: 0.02 + 0.03 * s, dest: d });
    });
  }
  /** The Sight's needle calibrated (`from`: 'place', 'kind', 'home'), or let go ('off'). */
  sightCalibrate(from = 'place') {
    if (!this.ok() || !this.allow('sightCalibrate', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.3, true);
    if (from === 'off') { // (the pivot loosening into a spin)
      this.noise(t, 0.04, { type: 'bandpass', f0: 2400, q: 5, gain: 0.25, dest: d });
      for (let i = 0, x = 0.05, gap = 0.09; i < 10 && x < 0.6; i++, x += gap, gap = Math.max(0.03, gap * 0.8)) this.noise(t + x, 0.006, { type: 'bandpass', f0: 4200, q: 7, gain: 0.1, dest: d });
      this.tone(t + 0.05, 0.6, { f0: 700, f1: 420, gain: 0.03, dest: d });
      return;
    }
    const wobbles = from === 'kind' ? 4 : 3; // (hunting a creature: it hunts a little longer)
    this.noise(t, 0.25, { type: 'bandpass', f0: 800, f1: 2200, q: 1.6, gain: 0.18, attack: 0.05, dest: d }); // (the swing)
    for (let i = 0; i < wobbles; i++) this.tone(t + 0.12 + i * 0.07, 0.07, { f0: 900 + (i % 2 ? -60 : 60) / (1 + i), gain: 0.04 / (1 + i * 0.5), dest: d }); // (the wobble dying)
    const at = t + 0.14 + wobbles * 0.07;
    this.noise(at, 0.012, { type: 'bandpass', f0: 3200, q: 6, gain: 0.35, dest: d }); // (settled: the click)
    this.tone(at, 0.5, { f0: hz(93), gain: 0.04, dest: d }); this.tone(at, 0.25, { f0: hz(93) * 2.76, gain: 0.01, dest: d }); // (the brass's ping)
  }
}
