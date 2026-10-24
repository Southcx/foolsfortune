// ---------------------------------------------------------------------------------------
// THE DUNEMAW'S, STRAWMAN'S AND THE DUNES' SOUNDS (the owner agreed the set: "Dunemaw, Dunes and Strawman sounds"). Sand is a grainy
// hiss and a pour; the Well is deep and resonant (a hollow throat, a long room); crude is thick and oily (low glugs, slow bubbles).
//   THE GREAT DUNEMAW (world/well/dunemaw.js, wellshift.js, finds.js, raid.js)
//     GOING DOWN     the sand giving way at the mouth: a pour falling into a deep hollow and the Well's throat ringing (under the pool's
//                    own gulp, audio/world.js poolDown, which sounds on the same step)
//     A SANDFALL     a floor's door: a trickle of grains as its warning, the pour as it falls (a wide hiss over a rumble), the last of it
//                    running out as it opens; quieter the further the door
//     THE SHIFT      the floor moving round a warped find: stone grinding on stone, sand sliding, a low tritone's groan
//     A FIND         a floor cleared gives up its material: sand parting and a chime up the key, one note more a tier, on the music's grid;
//                    an artifact taken (a glazed shard lifted: a ceramic ting); a warped one bends out of tune (the shift is coming); a
//                    pot's find, a small glint under the cubes' own sounds
//     THE CAVERN     the great cavern opening: a vast low swell, wind through a hollow, one far drip
//     CHARTED        a floor's charting kept as you leave it: a quill's scratch and a soft note, higher the more was charted
//     A COGITOMAP    brought home: paper unrolled and a chord, fuller the more was charted
//     THE WAY UP     the Wake Whistle blown: a clay whistle's breathy call held over the channel and the Well's hum rising under it;
//                    a blow that breaks the breath cuts it off
//     ASTRAY         taken back to where the floor began: a pull drawn backward and a soft arrival
//     A FOE DOWN     a deep boom from below and the sand settling; the Great Slip Jelly's end rings the whole cavern (a chord), and
//                    reprogrammed it rises instead of falling
//     A CAST         the Great Slip Jelly readying a cast (the cast bar: FFXIV's): a low bowl's ring, then the cast's own tell stretched
//                    over its windup, so the ear knows the answer: a parry's rising hiss ending in a glint, a ring's swelling rumble, the
//                    gaze's beating glass, the raidwide's long swell, the floor's sand rush, the brood's gurgling call, the cascade's
//                    breath drawn in, the enrage's maw
//     ITS MOMENTS    the mirror (its gaze turned back: a glass ring), sinking into the slip, a brood fed to it, the sherds splitting,
//                    the sherds mending (a warning, rising), Sodden and dry, swallowed (the enrage's close)
//     A WIPE         the Dunemaw taking you back to the Lip Stone: a falling pall of sand and a low minor drone
//   STRAWMAN'S ATTACK STRINGS (world/testroom/strawmanstrings.js; Strawman, the stitched straw dummy at the sparring circle)
//     A STRING       picked at the lectern: the doll shaken awake (straw rustling, its ball knocking twice); none, it settles
//     A WINDUP       its tell before a blow, one a move, readable: burlap creaking as a sleeve rises and straw rustling, then the
//                    sleeve's swish on the strike's own time (the jab short and tight, the swing broad, the chop's two sleeves slow
//                    and heavy, the spin sweep's ball rolling and two swishes, the hat-butt's felt flap). The delayed swing creaks as
//                    the swing does, then holds its breath: the swish comes late, with the blow
//     A STRIKE       landed: a padded shove (it never hurts); cleared by a jump: the sweep passing under the feet
//     PARRIED        the sleeve broken off (its swish cut): dry straw crunching and the doll wobbling on its ball
//     THE TEMPO      (DEBUG) a tape slowing or speeding to the new tempo, its ticks at that pace
//   THE DUNES
//     A GEYSER       a slip geyser launching (world/dunes/geysers.js; the Raceway's too): an oily gout and its spray
//     A BLOT         spilled (a thick splat; onto a blot, a second glug joining it), giving up a blotling (slow bubbles swelling, a
//                    glop tearing free, an aberrant's wrong warble), washed whole (the mop's last pull and a clean shine; drunk by a
//                    Lantern Wisp, only the slurp)
//     A VANTAGE      a lookout's view reached: a soft breath and a high glint, kept small (Wonder's awakening may sound with it)
//     AN OSTRACON    a sherd taken: a clay tick and its word's own note (the word's letters pick it)
//     A STELE        read: a low stone hum and its three words as a sentence of notes
//     THE PLASTER    knocked off the workshop's wall: a dry crack, chips falling, dust
//     THE SEALED ROOM its slab sinking into the sand after the fork's ring: a stone grind, the sand pouring, a settling thump, the
//                    room's air answering
// Prior art: Journey's sand (the hiss and pour of every dune), Monster Hunter's and FFXIV's tells (each attack its own sound before
// it lands; the cast bar's start), Punch-Out!!'s readable telegraphs, Zelda's secret jingle and its bombable walls, PowerWash
// Simulator's clean "ding", Spelunky's idol (a treasure that sounds wrong before the room changes), Breath of the Wild's Korok-like
// small glints kept under the music.
//
//   sfx.wellEnter() .wellSandfall(state, dist) .wellFloorShift() .wellFind(tier, grid) .wellFindTake(kind, warped, grid) .wellCavern()
//   sfx.wellCharted(share) .wellCogitomap(charted, grid) .wellEscapeStart(held) .wellAstray() .wellFoeDown(how, floor)
//   sfx.wellFoeCast(cast, windup) .wellFoeMoment(what) .wellFoeWipe()
//   sfx.strawString(id) .strawWindup(move, blow, eta, scale) .strawStrike(landed, cleared) .strawParried() .strawTempo(k)
//   sfx.dunesGeyserLaunch() .blotSpill(lachryma, joined) .blotSpawn() .blotWash(stage, by) .vantageReach(grid) .ostraconFind(word, grid)
//   sfx.steleRead(words, grid) .plasterBreak() .sealedOpen()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]; // (the major pentatonic up from the music's root: finds and words land in key)
const rootOf = (grid) => grid?.root ?? 64; // (the music's key: E when nothing plays)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** The note a word's letters pick (an ostracon's, a stele's): the same word always the same step. */
const wordStep = (w) => { let n = 0; for (const c of String(w || '')) n = (n * 31 + c.charCodeAt(0)) >>> 0; return PENT[n % 6]; };

/** Strawman's moves as heard: the tell's creak (seconds at 1x, its pitch), the swish (seconds, its sweep, its weight), and a second
 *  swish's lag (the spin sweep's other sleeve). The delayed swing's creak is the swing's: only the swish's time gives it away. */
const STRAW = { // (the one-two: its jab, then its swing)
  swing:        { creak: 0.7, f: 700, swish: 0.2, f0: 600, f1: 2600, w: 1 },
  delayedSwing: { creak: 0.7, f: 700, swish: 0.2, f0: 600, f1: 2600, w: 1 },
  jab:          { creak: 0.4, f: 1100, swish: 0.11, f0: 1400, f1: 3600, w: 0.7 },
  overheadChop: { creak: 1.0, f: 520, swish: 0.26, f0: 2200, f1: 400, w: 1.4, two: true },
  spinSweep:    { creak: 0.65, f: 420, swish: 0.17, f0: 500, f1: 1900, w: 1, again: 0.15, ball: true },
  hatButt:      { creak: 0.5, f: 900, swish: 0.12, f0: 900, f1: 300, w: 0.8, felt: true },
};

export class DunemawSounds {
  // ------------------------------------------------------------------ the Great Dunemaw
  /** Going down the mouth on the sand: the sand giving way into a deep hollow, the Well's throat ringing. */
  wellEnter() {
    if (!this.ok() || !this.allow('wellEnter', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.8);
    this.noise(t, 1.5, { type: 'lowpass', f0: 2400, f1: 160, q: 1.4, gain: 0.45, attack: 0.04, dest: d }); // (the sand giving way)
    this.noise(t, 0.9, { type: 'highpass', f0: 4200, f1: 1800, gain: 0.12, attack: 0.02, dest: d }); // (its grains)
    this.tone(t + 0.05, 1.2, { f0: 72, f1: 34, gain: 0.45, dest: d }); // (the drop)
    [55, 82.4].forEach((f, i) => this.tone(t + 0.25, 2.2 - i * 0.5, { f0: f, f1: f * 0.98, gain: 0.14 - i * 0.05, dest: d })); // (the throat's ring: a fifth)
  }
  /** A floor's sandfall changing state ('warn' the trickle, 'falling' the pour, 'open' the last of it), `dist` metres off. */
  wellSandfall(state = 'falling', dist = 10) {
    if (!this.ok() || !this.allow(`wellSandfall.${state}`, 2)) return;
    const k = 1 / (1 + Math.max(0, dist) * 0.09); if (k < 0.08) return;
    const t = this.ctx.currentTime;
    if (state === 'warn') {
      const d = this.out(0.16 * k, 0.4);
      this.noise(t, 1.4, { type: 'bandpass', f0: 3200, f1: 2400, q: 1.2, gain: 0.25, attack: 0.5, dest: d }); // (a thread of grains)
      for (let i = 0; i < 9; i++) this.noise(t + 0.1 + i * 0.13 + Math.random() * 0.06, 0.012, { type: 'bandpass', f0: 2600 + Math.random() * 2400, q: 6, gain: 0.3, dest: d }); // (pebbles ticking)
    } else if (state === 'falling') {
      const d = this.out(0.26 * k, 0.6);
      this.noise(t, 2.6, { type: 'bandpass', f0: 1400, f1: 900, q: 0.6, gain: 0.5, attack: 0.35, dest: d }); // (the pour)
      this.noise(t + 0.1, 2.4, { type: 'lowpass', f0: 420, f1: 140, q: 1, gain: 0.5, attack: 0.4, dest: d }); // (its weight landing)
      this.tone(t + 0.2, 0.9, { f0: 80, f1: 52, gain: 0.25, dest: d });
    } else {
      const d = this.out(0.12 * k, 0.4);
      this.noise(t, 0.9, { type: 'bandpass', f0: 1600, f1: 4200, q: 0.9, gain: 0.3, attack: 0.02, dest: d }); // (the last of it running out)
    }
  }
  /** The floor shifting round a warped find: stone grinding, sand sliding, a low tritone's groan. */
  wellFloorShift() {
    if (!this.ok() || !this.allow('wellFloorShift', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.7);
    for (let i = 0; i < 7; i++) this.noise(t + i * 0.3 + Math.random() * 0.1, 0.4, { type: 'bandpass', f0: 180 + Math.random() * 160, q: 3, gain: 0.45, attack: 0.08, dest: d }); // (stone on stone)
    this.noise(t + 0.2, 2.4, { type: 'bandpass', f0: 1300, f1: 450, q: 0.7, gain: 0.3, attack: 0.5, dest: d }); // (sand sliding)
    [41.2, 58.3].forEach((f) => this.tone(t, 2.8, { f0: f, f1: f * 0.94, type: 'sawtooth', gain: 0.06, dest: d })); // (the groan: a tritone)
    this.tone(t, 2.2, { f0: 48, f1: 36, gain: 0.35, dest: d });
  }
  /** A floor cleared gives up its material of `tier` (0..4): sand parting and a chime up the key, a note more a tier, on the grid. */
  wellFind(tier = 0, grid = null) {
    if (!this.ok() || !this.allow('wellFind', 1)) return;
    const t = this.onSixteenth?.(grid) ?? this.ctx.currentTime, d = this.out(0.26, 0.6), root = rootOf(grid) + 12, n = 2 + clamp(tier | 0, 0, 4);
    this.noise(this.ctx.currentTime, 0.5, { type: 'bandpass', f0: 900, f1: 3600, q: 0.8, gain: 0.25, attack: 0.1, dest: d }); // (the sand parting)
    for (let i = 0; i < n; i++) { const f = hz(root + PENT[i]); this.tone(t + i * 0.07, 0.9 - i * 0.06, { f0: f, gain: 0.12, dest: d }); this.tone(t + i * 0.07, 0.3, { f0: f * 2.76, gain: 0.025, dest: d }); }
    if (tier >= 3) this.tone(t + n * 0.07, 1.4, { f0: hz(root + PENT[n]), type: 'triangle', gain: 0.08, dest: d }); // (a rare one rings on)
  }
  /** A find taken: an artifact (a glazed shard lifted from the sand), `warped` bent out of tune; a pot's, a small glint. */
  wellFindTake(kind = 'artifact', warped = false, grid = null) {
    if (!this.ok() || !this.allow('wellFindTake', 4)) return;
    const t = this.ctx.currentTime, root = rootOf(grid) + 24;
    if (kind === 'pot') { const d = this.out(0.1, 0.4); this.tone(t, 0.25, { f0: hz(root + 7), gain: 0.1, dest: d }); return; }
    const d = this.out(0.28, 0.55);
    this.noise(t, 0.3, { type: 'bandpass', f0: 2000, f1: 4500, q: 1, gain: 0.15, attack: 0.03, dest: d }); // (sand sifting off it)
    this.tone(t + 0.04, 0.6, { f0: hz(root), gain: 0.14, dest: d }); this.tone(t + 0.04, 0.25, { f0: hz(root) * 2.76, gain: 0.04, dest: d }); // (the ceramic ting)
    this.tone(t + 0.14, 0.7, { f0: hz(root + 7), gain: 0.1, dest: d });
    if (warped) { // (out of tune, sinking: the floor will move)
      [0, 1].forEach((s) => this.tone(t + 0.25, 1.3, { f0: hz(root + 6 + s), f1: hz(root - 6 + s), type: 'triangle', gain: 0.06, dest: d }));
      this.riser(t + 0.2, 0.8, { f0: 90, f1: 140, type: 'sawtooth', gain: 0.05, q: 2, dest: d });
    }
  }
  /** Down into the great cavern: a vast low swell, wind through a hollow, one far drip. */
  wellCavern() {
    if (!this.ok() || !this.allow('wellCavern', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.9);
    this.riser(t, 2.4, { f0: 38, f1: 55, type: 'sine', gain: 0.5, dest: d }); // (the space opening)
    this.noise(t + 0.3, 3, { type: 'bandpass', f0: 320, f1: 260, q: 4, gain: 0.35, attack: 1.2, dest: d }); // (wind in the hollow)
    this.tone(t + 2.6, 0.12, { f0: 1900, f1: 1500, gain: 0.1, dest: d }); // (a far drip)
    this.tone(t + 2.6, 2, { f0: 55, f1: 54, gain: 0.2, dest: d });
  }
  /** A floor's charting kept as you leave it (`share` 0..1): a quill's scratch and a soft note, higher the more was charted. */
  wellCharted(share = 0) {
    if (!this.ok() || !this.allow('wellCharted', 2) || !(share > 0)) return;
    const t = this.ctx.currentTime, d = this.out(0.12, 0.4, true);
    for (let i = 0; i < 3; i++) this.noise(t + i * 0.07, 0.05, { type: 'bandpass', f0: 3500 + i * 500, f1: 2800, q: 3, gain: 0.25, dest: d }); // (the quill)
    this.tone(t + 0.22, 0.6, { f0: hz(64 + PENT[Math.round(clamp(share, 0, 1) * 5)]), type: 'triangle', gain: 0.12, dest: d });
  }
  /** A Cogitomap brought home (`charted` 0..1): paper unrolled and a chord, fuller the more was charted. */
  wellCogitomap(charted = 0.5, grid = null) {
    if (!this.ok() || !this.allow('wellCogitomap', 1)) return;
    const now = this.ctx.currentTime, d = this.out(0.28, 0.6), root = rootOf(grid);
    this.noise(now, 0.55, { type: 'bandpass', f0: 1200, f1: 4200, q: 1.2, gain: 0.22, attack: 0.05, dest: d }); // (the paper unrolling)
    for (let i = 0; i < 6; i++) this.noise(now + 0.05 + i * 0.07, 0.015, { type: 'highpass', f0: 3500, gain: 0.15, dest: d }); // (its crinkle)
    const t = Math.max(now + 0.45, this.onSixteenth?.(grid) ?? now), n = 2 + Math.round(clamp(charted, 0, 1) * 3);
    [0, 7, 12, 16, 19].slice(0, n).forEach((s, i) => this.tone(t + i * 0.05, 1.5, { f0: hz(root + s), type: i ? 'sine' : 'triangle', gain: 0.09, dest: d }));
  }
  /** The Wake Whistle blown: a clay whistle's breathy call over the channel and the Well's hum rising; `held()` false (a blow broke the
   *  breath, the run over) cuts it off. */
  wellEscapeStart(held = null) {
    if (!this.ok() || !this.allow('wellEscapeStart', 1)) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.3, 0.6), f = hz(76);
    this.dunemawBreathNote(t, 0.35, f, 0.16, d); // (the whistle's first note)
    this.dunemawBreathNote(t + 0.35, 1.15, f * 1.5, 0.18, d); // (a fifth up, held)
    this.riser(t, 1.5, { f0: 50, f1: 100, type: 'sine', gain: 0.3, dest: d }); // (the Well's hum rising under it)
    this.noise(t + 0.6, 0.9, { type: 'bandpass', f0: 600, f1: 2400, q: 0.8, gain: 0.15, attack: 0.7, dest: d }); // (the way up opening)
    if (typeof held === 'function') {
      let n = 0; const check = () => { if (++n > 16) return; if (!held()) { d.gain.setTargetAtTime(0.0001, c.currentTime, 0.03); return; } setTimeout(check, 100); };
      setTimeout(check, 100);
    }
  }
  /** A clay whistle's note: a sine with a breath's vibrato and the breath itself (the Wake Whistle's; an ocarina's). */
  dunemawBreathNote(t, dur, f, gain, dest) {
    const c = this.ctx, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), env = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    lfo.frequency.value = 5.5; lg.gain.value = f * 0.008; lfo.connect(lg).connect(o.frequency);
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(gain, t + 0.05); env.gain.setValueAtTime(gain, t + dur * 0.8); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env).connect(dest); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    this.noise(t, dur, { type: 'bandpass', f0: f * 2, q: 2, gain: gain * 0.7, attack: 0.05, dest }); // (the breath)
  }
  /** Taken back to where the floor began: a pull drawn backward and a soft arrival. */
  wellAstray() {
    if (!this.ok() || !this.allow('wellAstray', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.6);
    this.noise(t, 0.6, { type: 'bandpass', f0: 300, f1: 2400, q: 1.2, gain: 0.3, attack: 0.5, dest: d }); // (drawn backward)
    this.tone(t, 0.6, { f0: 260, f1: 520, type: 'triangle', gain: 0.06, dest: d });
    this.tone(t + 0.62, 0.3, { f0: 110, f1: 60, gain: 0.3, dest: d }); this.noise(t + 0.62, 0.3, { type: 'lowpass', f0: 1400, f1: 300, gain: 0.25, dest: d }); // (set down on the sand)
  }
  /** A FOE down: a floor's (`how` none), a boom from below and the sand settling; the Great Slip Jelly's end (`how` 'burst'), the
   *  cavern rung as a chord; reprogrammed ('reprogram'), the chord rising, no boom. */
  wellFoeDown(how = null, floor = 1) {
    if (!this.ok() || !this.allow('wellFoeDown', 1)) return;
    const t = this.ctx.currentTime, great = how === 'burst' || how === 'reprogram', d = this.out(great ? 0.45 : 0.32, 0.8);
    if (how !== 'reprogram') {
      this.tone(t, 1.8, { f0: 62, f1: 36, gain: 0.5, dest: d }); this.tone(t, 1.2, { f0: 93, f1: 70, gain: 0.2, dest: d }); // (the boom)
      this.noise(t + 0.15, 2, { type: 'lowpass', f0: 1800, f1: 120, gain: 0.3, attack: 0.1, dest: d }); // (the sand settling)
    }
    if (great) {
      const up = how === 'reprogram', at = t + (up ? 0.1 : 0.5);
      [40, 47, 52, 56, 59].forEach((m, i) => this.tone(at + i * 0.09, 3 - i * 0.2, { f0: hz(m + (up ? 12 : 0)), f1: hz(m + (up ? 12 : 0)) * (up ? 1.003 : 0.997), gain: 0.08, dest: d })); // (the cavern ringing: E major)
      if (up) this.noise(t, 1.6, { type: 'highpass', f0: 5000, f1: 8000, gain: 0.06, attack: 0.6, dest: d }); // (the glass of a mind rewritten)
    } else this.tone(t + 0.3, 1.2, { f0: hz(52 + Math.min(2, floor) * 2), gain: 0.06, dest: d }); // (the floor's own note, a step a floor)
  }
  /** The Great Slip Jelly readying `cast` over `windup` real seconds: the bowl's ring, then the cast's tell stretched over its windup. */
  wellFoeCast(cast = 'crownBash', windup = 2) {
    if (!this.ok() || !this.allow('wellFoeCast', 3)) return;
    const t = this.ctx.currentTime, w = clamp(windup || 1, 0.5, 5), d = this.out(0.3, 0.6);
    this.tone(t, 1.4, { f0: 98, f1: 97, gain: 0.22, dest: d }); this.tone(t, 0.6, { f0: 98 * 2.76, gain: 0.04, dest: d }); // (the cast bar: a low bowl's ring)
    switch (cast) {
      case 'crownBash': // (parry it: a rising hiss, a glint where the window opens)
        this.noise(t, w, { type: 'bandpass', f0: 500, f1: 3200, q: 1.4, gain: 0.25, attack: w * 0.9, dest: d });
        this.tone(t + w - 0.08, 0.2, { f0: 2640, gain: 0.08, dest: d }); break;
      case 'crownGlare': // (look away: glass beating)
        [1320, 1327].forEach((f) => this.tone(t, w, { f0: f, f1: f * 1.06, gain: 0.04, dest: d }));
        this.riser(t, w, { f0: 660, f1: 990, type: 'triangle', gain: 0.04, dest: d }); break;
      case 'slipNova': // (the raidwide: a long swell to the flash, guard at it)
        this.riser(t, w, { f0: 45, f1: 180, type: 'sawtooth', gain: 0.12, q: 3, dest: d });
        this.noise(t, w, { type: 'lowpass', f0: 200, f1: 2600, gain: 0.25, attack: w * 0.95, dest: d }); break;
      case 'sinkingSands': case 'overflow': // (the floor going: a sand rush rising)
        this.noise(t, w, { type: 'bandpass', f0: 700, f1: 1800, q: 0.6, gain: 0.35, attack: w * 0.7, dest: d });
        this.tone(t, w, { f0: 50, f1: 40, gain: 0.25, dest: d }); break;
      case 'broodCall': case 'calving': // (the brood called, the body splitting: a gurgling call)
        for (let i = 0; i < 9; i++) { const f = 110 + Math.random() * 140; this.tone(t + 0.2 + (i * w * 0.8) / 9, 0.12, { f0: f, f1: f * 1.8, gain: 0.14, dest: d }); }
        this.tone(t + 0.2, w * 0.8, { f0: 140, f1: 90, type: 'triangle', gain: 0.06, dest: d }); break;
      case 'brineCascade': // (get behind it: the maw drawing breath)
        this.noise(t, w, { type: 'bandpass', f0: 2200, f1: 400, q: 1.2, gain: 0.3, attack: w * 0.85, dest: d });
        this.tone(t, w, { f0: 70, f1: 110, gain: 0.25, dest: d }); break;
      case 'swallow': // (the enrage: the Dunemaw's maw opening)
        this.riser(t, w, { f0: 30, f1: 90, type: 'sawtooth', gain: 0.18, q: 2, dest: d });
        this.noise(t, w, { type: 'lowpass', f0: 150, f1: 3000, q: 1.5, gain: 0.4, attack: w * 0.9, dest: d });
        [41.2, 43.65].forEach((f) => this.tone(t, w + 1, { f0: f, f1: f * 0.9, gain: 0.18, dest: d })); break;
      default: // (the rings, the line, the rain, the slam: get out: a swelling rumble of the slip)
        this.noise(t, w, { type: 'lowpass', f0: 220, f1: 900, q: 2, gain: 0.35, attack: w * 0.8, dest: d });
        this.tone(t, w, { f0: 55, f1: 80, gain: 0.2, dest: d });
    }
  }
  /** One of the fight's moments: mirror, sink, feed, sherds, mend, sodden, dry, swallowed (the crack has the clay's own shatter). */
  wellFoeMoment(what = '') {
    if (!this.ok() || !this.allow(`wellFoeMoment.${what}`, 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    switch (what) {
      case 'mirror': // (its gaze turned back on it by the lens: glass ringing, then a stun's drop)
        [1760, 2217, 2637].forEach((f, i) => this.tone(t + i * 0.03, 1, { f0: f, gain: 0.07, dest: d }));
        this.tone(t + 0.1, 0.6, { f0: 440, f1: 220, type: 'triangle', gain: 0.08, dest: d }); break;
      case 'sink': // (into the slip, crowned: a great gulp and bubbles)
        this.tone(t, 0.9, { f0: 120, f1: 35, gain: 0.5, dest: d }); this.noise(t, 1.4, { type: 'lowpass', f0: 1600, f1: 120, q: 2, gain: 0.4, dest: d });
        for (let i = 0; i < 6; i++) this.tone(t + 0.4 + i * 0.15, 0.1, { f0: 160 + Math.random() * 100, f1: 320, gain: 0.12, dest: d }); break;
      case 'feed': // (a brood reaching it: a slurp and a plate growing back)
        this.tone(t, 0.25, { f0: 180, f1: 420, gain: 0.25, dest: d }); this.noise(t, 0.3, { type: 'bandpass', f0: 600, f1: 1400, q: 3, gain: 0.25, dest: d });
        this.tone(t + 0.22, 0.4, { f0: 330, f1: 495, type: 'triangle', gain: 0.06, dest: d }); break;
      case 'sherds': // (split into four: a crack and four knocks down the scale)
        this.noise(t, 0.08, { type: 'highpass', f0: 2000, gain: 0.4, dest: d });
        [0, 3, 7, 10].forEach((s, i) => this.tone(t + 0.1 + i * 0.12, 0.3, { f0: hz(62 - s), f1: hz(62 - s) * 0.7, gain: 0.25, dest: d })); break;
      case 'mend': // (the sherds re-merging and healing it: a warning, rising)
        this.riser(t, 0.9, { f0: 110, f1: 330, type: 'triangle', gain: 0.12, dest: d }); this.noise(t, 0.9, { type: 'bandpass', f0: 400, f1: 1200, q: 2, gain: 0.25, attack: 0.7, dest: d }); break;
      case 'sodden': // (soaked: a heavy wet drop, the world dulled)
        this.noise(t, 0.4, { type: 'lowpass', f0: 900, f1: 200, gain: 0.45, dest: d }); this.tone(t, 0.5, { f0: 140, f1: 70, gain: 0.3, dest: d });
        for (let i = 0; i < 3; i++) this.tone(t + 0.3 + i * 0.22, 0.08, { f0: 700 - i * 80, f1: 400, gain: 0.08, dest: d }); break;
      case 'dry': // (Sodden gone: a light exhale)
        this.noise(t, 0.5, { type: 'bandpass', f0: 1500, f1: 3500, q: 1, gain: 0.16, attack: 0.15, dest: d }); break;
      case 'swallowed': // (the enrage's close: the maw shutting over everything)
        this.noise(t, 2.2, { type: 'lowpass', f0: 3000, f1: 60, q: 1.2, gain: 0.55, dest: d }); this.tone(t, 2.4, { f0: 70, f1: 25, gain: 0.55, dest: d }); break;
      default:
    }
  }
  /** A wipe in the great cavern: the Dunemaw taking you back to the Lip Stone, a pall of sand falling and a low minor drone. */
  wellFoeWipe() {
    if (!this.ok() || !this.allow('wellFoeWipe', 0.5)) return;
    const t = this.ctx.currentTime + 0.35, d = this.out(0.26, 0.8); // (after the shatter's own sound)
    this.noise(t, 3, { type: 'lowpass', f0: 2200, f1: 90, q: 0.8, gain: 0.35, attack: 0.3, dest: d }); // (the sand's pall)
    [40, 43, 47].forEach((m, i) => this.tone(t + i * 0.15, 3.2 - i * 0.3, { f0: hz(m), f1: hz(m) * 0.985, gain: 0.08, dest: d })); // (E minor, sinking)
  }

  // ------------------------------------------------------------------ Strawman's attack strings
  /** A string picked at the lectern (`id` null: none): the doll shaken awake, or settling. */
  strawString(id = null) {
    if (!this.ok() || !this.allow('strawString', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.3);
    if (!id) { this.noise(t, 0.5, { type: 'bandpass', f0: 3000, f1: 1200, q: 1, gain: 0.25, attack: 0.05, dest: d }); return; } // (it settles)
    for (let i = 0; i < 4; i++) this.noise(t + i * 0.09, 0.08, { type: 'highpass', f0: 3200 + i * 300, gain: 0.3, attack: 0.01, dest: d }); // (straw shaken)
    [0.42, 0.56].forEach((at) => { this.tone(t + at, 0.09, { f0: 420, f1: 300, type: 'triangle', gain: 0.25, dest: d }); this.noise(t + at, 0.02, { type: 'bandpass', f0: 1500, q: 4, gain: 0.3, dest: d }); }); // (its ball knocking twice: ready)
  }
  /** Strawman's tell before a blow of `move`: burlap creaking and straw rustling as a sleeve rises, then the sleeve's swish on the
   *  strike's own time, `eta` sim seconds ahead at the world's time `scale` (the tempo). The delayed swing creaks as the swing does and
   *  holds its breath: its swish comes late. A parry cuts the swish (strawParried). */
  strawWindup(move = 'swing', blow = 0, eta = 0.9, scale = 1) {
    if (!this.ok() || !this.allow('strawWindup', 6)) return;
    const M = STRAW[move === 'oneTwo' ? (blow ? 'swing' : 'jab') : move] || STRAW.swing, s = Math.max(0.2, scale || 1), t = this.ctx.currentTime, real = Math.max(0.1, (eta || 0.5) / s);
    const d = this.out(0.24, 0.3), creak = Math.min(M.creak / s, real - 0.06);
    const ticks = Math.max(3, Math.round(creak * 14));
    for (let i = 0; i < ticks; i++) { const u = i / ticks; this.noise(t + u * creak, 0.03, { type: 'bandpass', f0: M.f * (1 + u * 0.5) + Math.random() * 80, q: 9, gain: 0.3 + 0.2 * u, dest: d }); } // (the burlap creaking, quickening)
    if (M.two) for (let i = 0; i < ticks; i++) this.noise(t + 0.03 + (i / ticks) * creak, 0.03, { type: 'bandpass', f0: M.f * 1.3, q: 9, gain: 0.22, dest: d }); // (the other sleeve)
    this.noise(t, creak, { type: 'highpass', f0: 4000, gain: 0.12, attack: creak * 0.6, dest: d }); // (straw rustling)
    if (M.ball) this.tone(t, creak, { f0: 70, f1: 110, type: 'triangle', gain: 0.12, dest: d }); // (leaning back on its ball)
    if (M.felt) this.noise(t + creak * 0.4, 0.1, { type: 'lowpass', f0: 700, gain: 0.3, dest: d }); // (the hat tipping back: a felt flap)
    // the swish, on its own gain so a parry can cut it
    const sw = this.out(0.3 * M.w, 0.25), len = M.swish / s, at = t + Math.max(creak, real - len * 0.7);
    this._strawSwish = sw;
    this.noise(at, len, { type: 'bandpass', f0: M.f0, f1: M.f1, q: 1.6, gain: 0.5, attack: len * 0.6, dest: sw });
    if (M.again) this.noise(at + M.again / s, len, { type: 'bandpass', f0: M.f0, f1: M.f1, q: 1.6, gain: 0.45, attack: len * 0.6, dest: sw });
    if (M.w > 1.2) this.tone(at, len * 1.5, { f0: 140, f1: 80, gain: 0.25, dest: sw }); // (the chop's weight)
  }
  /** A blow struck: `landed` a padded shove (never harm); `cleared` the sweep passing under a jump. */
  strawStrike(landed = false, cleared = false) {
    if (!this.ok() || !this.allow('strawStrike', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.25);
    if (landed) { this.tone(t, 0.16, { f0: 130, f1: 70, gain: 0.45, dest: d }); this.noise(t, 0.12, { type: 'lowpass', f0: 1200, f1: 300, gain: 0.35, dest: d }); }
    else if (cleared) { this.noise(t, 0.3, { type: 'lowpass', f0: 600, f1: 1800, gain: 0.25, attack: 0.1, dest: d }); this.tone(t + 0.1, 0.15, { f0: 1320, gain: 0.06, dest: d }); }
  }
  /** A blow parried: its swish cut, dry straw crunching and the doll wobbling back on its ball. */
  strawParried() {
    if (!this.ok() || !this.allow('strawParried', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.24, 0.3);
    if (this._strawSwish) { this._strawSwish.gain.setTargetAtTime(0.0001, t, 0.015); this._strawSwish = null; }
    for (let i = 0; i < 5; i++) this.noise(t + i * 0.025, 0.04, { type: 'bandpass', f0: 2200 + Math.random() * 2400, q: 3, gain: 0.3, dest: d }); // (straw crunching)
    [190, 160, 182, 165].forEach((f, i) => this.tone(t + 0.08 + i * 0.13, 0.14, { f0: f, f1: f * 0.92, type: 'triangle', gain: 0.18 * (1 - i * 0.2), dest: d })); // (the wobble on its ball)
  }
  /** (DEBUG) The sparring tempo set to `k` (1, 0.5, 0.25): a tape slowing or speeding to it, its ticks at that pace. */
  strawTempo(k = 1) {
    if (!this.ok() || !this.allow('strawTempo', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.2, true), f = 520 * Math.sqrt(clamp(k, 0.25, 1));
    this.tone(t, 0.3, { f0: k < 1 ? 520 : 260, f1: f, type: 'triangle', gain: 0.3, dest: d });
    for (let i = 0; i < 3; i++) this.noise(t + 0.3 + (i * 0.14) / clamp(k, 0.25, 1), 0.01, { type: 'highpass', f0: 4000, gain: 0.3, dest: d });
  }

  // ------------------------------------------------------------------ the Dunes
  /** A slip geyser launching (the Dunes', the Raceway's): an oily gout of crude and its spray. */
  dunesGeyserLaunch() {
    if (!this.ok() || !this.allow('dunesGeyserLaunch', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.42, 0.5);
    this.tone(t, 0.4, { f0: 110, f1: 45, gain: 0.55, dest: d }); this.noise(t, 0.5, { type: 'lowpass', f0: 600, f1: 180, q: 2, gain: 0.5, dest: d }); // (the gout)
    for (let i = 0; i < 6; i++) { const f = 70 + Math.random() * 90; this.tone(t + 0.1 + i * 0.07, 0.12, { f0: f, f1: f * 1.7, gain: 0.18, dest: d }); } // (thick bubbles)
    this.noise(t + 0.08, 1.1, { type: 'bandpass', f0: 1200, f1: 3500, q: 0.7, gain: 0.25, attack: 0.15, dest: d }); // (the spray)
  }
  /** Crude spilled (`lachryma` its amount): a thick splat; `joined` onto a blot of its field, a second glug merging. */
  blotSpill(lachryma = 10, joined = false) {
    if (!this.ok() || !this.allow('blotSpill', 4)) return;
    const t = this.ctx.currentTime, k = clamp(0.4 + (lachryma || 0) / 40, 0.4, 1), d = this.out(0.26 * k, 0.3);
    this.noise(t, 0.28, { type: 'lowpass', f0: 1000, f1: 200, q: 1.5, gain: 0.5, dest: d }); this.tone(t, 0.25, { f0: 170, f1: 60, gain: 0.4, dest: d }); // (the splat)
    if (joined) this.tone(t + 0.2, 0.3, { f0: 90, f1: 140, gain: 0.25, dest: d }); // (the glug as it joins)
  }
  /** A full-grown blot giving up its blotling: slow bubbles swelling, a glop tearing free, an aberrant's wrong warble. */
  blotSpawn() {
    if (!this.ok() || !this.allow('blotSpawn', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.5);
    for (let i = 0; i < 8; i++) { const u = i / 8, f = 60 + Math.random() * 60 + u * 80; this.tone(t + u * u * 1.1, 0.16, { f0: f, f1: f * 2, gain: 0.12 + 0.1 * u, dest: d }); } // (the bubbles, quickening)
    this.noise(t + 1.15, 0.35, { type: 'lowpass', f0: 1400, f1: 250, q: 2, gain: 0.45, dest: d }); this.tone(t + 1.15, 0.4, { f0: 150, f1: 55, gain: 0.4, dest: d }); // (the glop tearing free)
    [0, 6].forEach((s) => this.tone(t + 1.4, 0.5, { f0: hz(72 + s), f1: hz(70 + s), type: 'triangle', gain: 0.04, dest: d })); // (the aberrant's warble: a tritone)
  }
  /** A blot washed whole (`stage` 0..3 its size): the mop's last pull and a clean shine; drunk by a creature (`by`), only the slurp. */
  blotWash(stage = 0, by = 'courier') {
    if (!this.ok() || !this.allow('blotWash', 3)) return;
    const t = this.ctx.currentTime, low = 1 - clamp(stage, 0, 3) * 0.12, d = this.out(0.26, 0.45);
    this.noise(t, 0.3, { type: 'bandpass', f0: 600 * low, f1: 2600 * low, q: 2, gain: 0.35, attack: 0.1, dest: d }); // (the last pull)
    this.tone(t + 0.05, 0.22, { f0: 200 * low, f1: 520 * low, gain: 0.2, dest: d }); // (the slurp)
    if (by !== 'courier') return;
    [88, 93].forEach((m, i) => { this.tone(t + 0.3 + i * 0.08, 0.6, { f0: hz(m), gain: 0.06, dest: d }); this.tone(t + 0.3 + i * 0.08, 0.2, { f0: hz(m) * 2.76, gain: 0.015, dest: d }); }); // (clean: the shine)
  }
  /** A vantage's view reached: a soft breath and a high glint, small (Wonder's awakening may sound with it). */
  vantageReach(grid = null) {
    if (!this.ok() || !this.allow('vantageReach', 0.5)) return;
    const now = this.ctx.currentTime, d = this.out(0.16, 0.85), root = rootOf(grid) + 36;
    this.noise(now, 1.8, { type: 'bandpass', f0: 700, f1: 1100, q: 0.9, gain: 0.25, attack: 0.7, dest: d }); // (the breath taken in)
    const t = Math.max(now + 0.6, this.onSixteenth?.(grid) ?? now);
    this.tone(t, 1.4, { f0: hz(root), gain: 0.06, dest: d }); this.tone(t + 0.09, 1.6, { f0: hz(root + 7), gain: 0.045, dest: d }); // (the glint)
  }
  /** An ostracon taken: a clay tick, and its `word`'s own note (its letters pick the step) in the music's key. */
  ostraconFind(word = '', grid = null) {
    if (!this.ok() || !this.allow('ostraconFind', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.55), m = rootOf(grid) + 24 + wordStep(word);
    this.noise(t, 0.04, { type: 'bandpass', f0: 2400, q: 5, gain: 0.35, dest: d }); this.tone(t, 0.08, { f0: 1500, f1: 1100, type: 'triangle', gain: 0.1, dest: d }); // (the sherd's clay)
    const at = Math.max(t + 0.12, this.onSixteenth?.(grid) ?? t);
    this.tone(at, 0.9, { f0: hz(m), gain: 0.1, dest: d }); this.tone(at + 0.1, 1.1, { f0: hz(m + 12), gain: 0.04, dest: d }); // (the word's note)
  }
  /** A stele read: a low stone hum and its `words` as a sentence of notes (up to three: rising, the last falling home). */
  steleRead(words = [], grid = null) {
    if (!this.ok() || !this.allow('steleRead', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.7), root = rootOf(grid);
    this.tone(t, 2.2, { f0: hz(root - 24), f1: hz(root - 24) * 0.99, gain: 0.25, dest: d }); this.tone(t, 2, { f0: hz(root - 17), gain: 0.08, dest: d }); // (the stone's hum: a fifth)
    this.noise(t, 0.6, { type: 'bandpass', f0: 300, f1: 180, q: 3, gain: 0.2, dest: d });
    const ws = (Array.isArray(words) && words.length ? words : ['', '', '']).slice(0, 3);
    ws.forEach((w, i) => { const m = root + 12 + wordStep(w) + (i === ws.length - 1 ? 0 : 5); this.tone(t + 0.4 + i * 0.32, 0.9, { f0: hz(m), type: 'triangle', gain: 0.08, dest: d }); });
  }
  /** A plaster patch knocked off the workshop's wall: a dry crack, chips falling, dust. */
  plasterBreak() {
    if (!this.ok() || !this.allow('plasterBreak', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4);
    this.noise(t, 0.04, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); this.noise(t, 0.1, { type: 'bandpass', f0: 1600, q: 2, gain: 0.35, dest: d }); // (the crack)
    for (let i = 0; i < 9; i++) this.noise(t + 0.15 + i * 0.05 + Math.random() * 0.04, 0.02, { type: 'bandpass', f0: 2000 + Math.random() * 3000, q: 5, gain: 0.25 - i * 0.02, dest: d }); // (chips landing)
    this.noise(t + 0.1, 1.1, { type: 'lowpass', f0: 1800, f1: 600, gain: 0.12, attack: 0.2, dest: d }); // (the dust)
  }
  /** The sealed room's slab sinking into the sand after the fork's ring: a stone grind, the sand pouring, a settling thump, the room's
   *  air answering the fork. */
  sealedOpen() {
    if (!this.ok() || !this.allow('sealedOpen', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.36, 0.7);
    this.noise(t, 2.4, { type: 'bandpass', f0: 220, f1: 120, q: 3, gain: 0.45, attack: 0.3, dest: d }); // (the slab grinding down)
    this.noise(t + 0.2, 2.4, { type: 'bandpass', f0: 1500, f1: 900, q: 0.7, gain: 0.25, attack: 0.6, dest: d }); // (sand pouring in round it)
    this.tone(t + 2.3, 0.6, { f0: 75, f1: 40, gain: 0.45, dest: d }); this.noise(t + 2.3, 0.4, { type: 'lowpass', f0: 900, f1: 200, gain: 0.3, dest: d }); // (settled)
    [76, 83, 88].forEach((m, i) => this.tone(t + 2.5 + i * 0.12, 1.6, { f0: hz(m), gain: 0.04, dest: d })); // (the room's air answering the fork)
  }
}
