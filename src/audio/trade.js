// ---------------------------------------------------------------------------------------
// THE TRADE'S AND THE THRESHOLDS' SOUNDS: moments that said themselves only in the log until now (their events through audio/cues.js).
// Each sounds what happened, never a second sound for a click a window already makes (ui/theme.js's menuOk under every button).
//   AT SEA AND AT THE PIER (progress/voyage.js, world/emocean/stage.js)
//     cast off        emocean.hop: the mooring rope slipping off its bollard, the ship's bell struck once (a bigger hull, a lower bell),
//                     the sail filling under it
//     a continue      emocean.continue: the arcade's coin dropped in the slot (two bright notes), then the hull made good (a quick
//                     climb up the triad)
//     a route found   emocean.found: a new island divined: a foghorn far off and a bell answering it a fifth up (land ho), a beat
//                     behind the reading's own end (audio/seachart.js readingEnd)
//     a route map     rutter.get: the book's boards shut, the quill's last strokes, a chop pressed, its note as high as the rank
//   ARRIVING (world/opensea/opensea.js, world/raceway/raceway.js, world/bazaar/bazaar.js; under the seam, while the music changes cue)
//     the open sea    opensea.enter: two gulls and a halyard's clink on the mast, light
//     the Raceway     raceway.enter: the wind over the sand and a sun plate's gold ping far off, in E (the Raceway cue's key)
//     out of Raku's   bazaar.leave: the door's bell rung going (bazaarEnter's turned round) and the hall's murmur falling away
//   THE BELT AND THE LOADOUT (tools/belt.js through the Pneuka Box's reading table; tools/sondelass/loadoutchosen.js)
//     a tool set      tool.equip: its card set down on the cloth (the main laid square, the sub slid across it first), a soft bell
//                     when the two make another pair's card
//     a move slotted  loadout.set: a blade's notch, the move fitted; a slot emptied, the move lifted out
//   THE VERITOME (tools/veritome/ui.js)
//     plates thrown   photo.discard: paper crumpled (more plates, a longer crumple) and tossed
//   THE THROWING ROOM (world/testroom/): a range officer's shot timer, measured and never earned, so nothing here rings like a reward
//     a drill begun   drill.start: beep, beep, beeep (the shot timer's start)
//     a drill done    drill.end: the end buzzer, then the hits read out as up to five short beeps (none when nothing was fired)
//     a drill left    drill.left: two flat beeps falling (the drill called off)
//     the lectern     statusbench.light: a lamp's switch and its beep (none lit low, each in turn three up, one lit the middle)
//     a status read   statusbench.status: a meter's two chirps, the first pitched by the status, the second as long as it holds
//     the paint range paintrange.read: three beeps, 3, 6 and 9 m, each higher the more of its ring is covered, a dull tick if bare
//   THE SPIRIT GARDEN (progress/garden.js, world/garden/): in the garden cue's key and on its next sixteenth (`st`: gardenState,
//     audio/garden.js), as the garden's tending is
//     a slot worked   garden.slot: a workbench's knock and two notes up a fourth (cleared: one note down)
//     a slot given    garden.grant: bells up the triad to the octave (a bed's a degree lower than a slot's)
//     a feature moved garden.move: a slide and a knock, its note as high as the adjacency bonus there, a shimmer on a spirit vein
//     a track carved  garden.track: a stick drawn through the ground, then a run up the scale as long as the track
//     the view        garden.view: a breath of air (up to the overhead view, down to the first person); the press's view is the
//                     press's own (alchemy.open / alchemy.close), so it is skipped
//     the bead        alchemy.enter: the soul bead entering an attribute's spread at the press: a glass ping, its degree the
//                     attribute's; into a tile's heart, its fifth and its octave over it. Leaving every spread is silent
// Prior art: Sea of Thieves (the bell, the rope, the sail), a competition shot timer (IPSC's start beeps and the range's buzzer), the
// arcade's coin (Metal Slug's continue), Animal Crossing's paper and chair foley, Rez's quantise for the garden's (audio/garden.js).
//
//   sfx.tradeCastOff(ship) .tradeContinue() .tradeRouteFound() .tradeRouteMap(rank)
//   sfx.arriveOpenSea() .arriveRaceway() .bazaarLeave()
//   sfx.beltToolSet(as, pair) .meleeLoadoutSlot(filled) .veritomePlateDiscard(n)
//   sfx.rangeDrillStart() .rangeDrillEnd(acc) .rangeDrillLeft() .rangeBenchLamp(light) .rangeStatusChirp(status, dur) .rangePaintRead(three, six, nine)
//   sfx.gardenSlotSet(st, on) .gardenGrant(st, kind) .gardenFeatureMove(st, mult, vein) .gardenTrackCarve(st, metres) .gardenViewTurn(view)
//   sfx.alchemyEnter(st, attribute, heart)
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const num = (x, d = 0) => (Number.isFinite(+x) && x !== null && x !== '' ? +x : d);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const SCALE = [0, 2, 4, 7, 9]; // (the garden cue's scale when it gives none)
const BELL = { sloop: 76, frigate: 74, tanker: 71, destroyer: 69, galleon: 67 }; // (the ship's bell: a bigger hull, a lower one)
const RANK = { S: 7, A: 4, B: 2, C: 0, D: -3 }; // (a route map's chop, semitones over its root)
const STATUSES = ['stun', 'halt', 'slow', 'sleep', 'calm', 'melt', 'doubt', 'charm', 'blind', 'confusion', 'soaked']; // (the status bench's eleven)
const ATTRIBUTES = ['willpower', 'focus', 'charisma', 'perception', 'dexterity', 'visualization', 'resilience']; // (progress/alchemy.js's order)

/** A note of the garden cue's scale: degree `k` above its root, `oct` octaves up (audio/garden.js gardenNote's rule). */
function gardenMidi(st, k, oct = 1) {
  const s = st?.scale?.length ? st.scale : SCALE, n = ((k % s.length) + s.length) % s.length;
  return clamp(num(st?.grid?.root, 64), 36, 84) + 12 * (oct - 1 + Math.floor(k / s.length)) + clamp(num(s[n], 0), 0, 12);
}
/** A bell: its fundamental and two inharmonic partials. */
function bell(s, t, f, dur, gain, dest) {
  for (const [r, a] of [[1, 1], [2.76, 0.3], [5.4, 0.12]]) s.tone(t, dur / r, { f0: f * r, gain: gain * a, dest });
}
/** A short beep of the shot timer's kind (a square through a gentle low-pass would be a node more: a triangle and its octave). */
function beep(s, t, f, dur, gain, dest) {
  s.tone(t, dur, { f0: f, type: 'square', gain: gain * 0.25, dest });
  s.tone(t, dur, { f0: f * 2, gain: gain * 0.2, dest });
}

export class TradeSounds {
  // ---------------------------------------------------------------- the trade at sea
  /** Cast off from a pier on `ship` (sloop .. galleon). */
  tradeCastOff(ship = 'sloop') {
    if (!this.ok() || !this.allow('tradeCastOff', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.noise(t, 0.35, { type: 'bandpass', f0: 1400, f1: 500, q: 1.4, gain: 0.35, attack: 0.04, dest: d }); // (the rope off the bollard)
    this.tone(t + 0.3, 0.12, { f0: 140, f1: 90, gain: 0.3, dest: d }); // (its splash against the hull)
    bell(this, t + 0.45, hz(BELL[ship] ?? 76), 2.2, 0.16, d);
    this.noise(t + 0.6, 1.6, { type: 'lowpass', f0: 500, f1: 1400, gain: 0.18, attack: 0.9, dest: d }); // (the sail filling)
  }
  /** A continue paid: the coin in the slot, then the hull made good. */
  tradeContinue() {
    if (!this.ok() || !this.allow('tradeContinue', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.24, 0.35, true);
    this.tone(t, 0.07, { f0: hz(83), gain: 0.25, dest: d }); this.tone(t + 0.07, 0.5, { f0: hz(88), gain: 0.25, dest: d }); // (the coin)
    this.noise(t + 0.02, 0.05, { type: 'bandpass', f0: 4200, q: 6, gain: 0.2, dest: d });
    [0, 4, 7, 12].forEach((s, i) => this.tone(t + 0.35 + i * 0.06, 0.35, { f0: hz(64 + s), type: 'triangle', gain: 0.18, dest: d })); // (made good)
  }
  /** A new island found by a reckoning: the far horn, the bell's answer a fifth up. */
  tradeRouteFound() {
    if (!this.ok() || !this.allow('tradeRouteFound', 0.5)) return;
    const t = this.ctx.currentTime + 0.4, d = this.out(0.3, 0.75, true); // (a beat behind the reading's own end)
    [hz(40), hz(40) * 1.003].forEach((f) => this.tone(t, 1.6, { f0: f, f1: f * 0.98, type: 'sawtooth', gain: 0.05, dest: d }));
    this.tone(t, 1.6, { f0: hz(52), gain: 0.18, dest: d });
    bell(this, t + 0.9, hz(71), 2.4, 0.12, d); bell(this, t + 1.15, hz(78), 2.6, 0.1, d);
  }
  /** A route map made at a crossing's end, its `rank` 'S' .. 'D'. */
  tradeRouteMap(rank = 'B') {
    if (!this.ok() || !this.allow('tradeRouteMap', 1)) return;
    const t = this.ctx.currentTime + 0.2, d = this.out(0.24, 0.4, true), up = RANK[String(rank).toUpperCase()] ?? 0;
    for (let i = 0; i < 3; i++) this.noise(t + i * 0.09, 0.07, { type: 'bandpass', f0: 3800 + i * 300, f1: 2600, q: 3, gain: 0.12, attack: 0.01, dest: d }); // (the quill)
    this.noise(t + 0.34, 0.08, { type: 'lowpass', f0: 900, gain: 0.35, dest: d }); this.tone(t + 0.34, 0.16, { f0: 180, f1: 90, gain: 0.3, dest: d }); // (the boards shut)
    this.tone(t + 0.6, 0.06, { f0: 120, f1: 80, gain: 0.3, dest: d }); // (the chop pressed)
    this.tone(t + 0.62, 0.9, { f0: hz(72 + up), gain: 0.1, dest: d }); this.tone(t + 0.62, 0.35, { f0: hz(72 + up) * 2.76, gain: 0.02, dest: d });
  }

  // ---------------------------------------------------------------- arriving
  /** On the open sea's quay: gulls and a halyard's clink. */
  arriveOpenSea() {
    if (!this.ok() || !this.allow('arriveOpenSea', 0.2)) return;
    const t = this.ctx.currentTime + 0.3, d = this.out(0.16, 0.6);
    for (const [dt, f] of [[0, 1900], [0.18, 2200], [0.7, 1700]]) { this.tone(t + dt, 0.14, { f0: f, f1: f * 0.7, gain: 0.12, dest: d }); this.tone(t + dt + 0.14, 0.12, { f0: f * 0.75, f1: f * 0.9, gain: 0.08, dest: d }); }
    for (const dt of [0.4, 0.55]) this.noise(t + dt, 0.04, { type: 'bandpass', f0: 4200, q: 9, gain: 0.25, dest: d }); // (the halyard on the mast)
  }
  /** At the Raceway's hub: wind over the sand, a sun plate's ping far off. */
  arriveRaceway() {
    if (!this.ok() || !this.allow('arriveRaceway', 0.2)) return;
    const t = this.ctx.currentTime + 0.3, d = this.out(0.16, 0.7);
    this.noise(t, 1.6, { type: 'bandpass', f0: 700, f1: 1700, q: 0.8, gain: 0.25, attack: 0.6, dest: d });
    for (const [dt, m] of [[0.5, 76], [0.62, 83]]) { this.tone(t + dt, 1, { f0: hz(m), gain: 0.06, dest: d }); this.tone(t + dt, 0.3, { f0: hz(m) * 2.76, gain: 0.015, dest: d }); }
  }
  /** Out of Raku's bazaar: its door's bell going, the murmur falling away. */
  bazaarLeave() {
    if (!this.ok() || !this.allow('bazaarLeave', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.5);
    for (const f of [500, 1100, 2400]) this.noise(t, 1.2, { type: 'bandpass', f0: f, f1: f * 0.7, q: 1.5, gain: 0.05, attack: 0.02, dest: d });
    [[0, 89], [0.14, 84]].forEach(([dt, m]) => { this.tone(t + dt, 1, { f0: hz(m), gain: 0.07, dest: d }); this.tone(t + dt, 0.5, { f0: hz(m) * 2.4, gain: 0.025, dest: d }); });
  }

  // ---------------------------------------------------------------- the belt, the loadout, the Veritome
  /** A tool set on the belt `as` 'main' or 'sub'; `pair` the pair's card's number when the two make one (null when none). */
  beltToolSet(as = 'main', pair = null) {
    if (!this.ok() || !this.allow('beltToolSet', 6)) { this._beltPair = pair ?? null; return; }
    const t = this.ctx.currentTime, d = this.out(0.16, 0.3, true), sub = as === 'sub', at = t + (sub ? 0.11 : 0);
    if (sub) this.noise(t, 0.12, { type: 'bandpass', f0: 1500, f1: 3200, q: 1.2, gain: 0.25, attack: 0.03, dest: d }); // (slid across the main)
    this.noise(at, 0.03, { type: 'bandpass', f0: sub ? 2200 : 2700, q: 3, gain: 0.5, dest: d }); // (the card's snap)
    this.tone(at, 0.09, { f0: sub ? 170 : 210, f1: 120, gain: 0.3, dest: d }); // (the cloth under it)
    const was = this._beltPair; this._beltPair = pair ?? null;
    if (pair != null && pair !== was) bell(this, at + 0.12, hz(79), 1.3, 0.07, d); // (a new pair's card: only when the two make another)
  }
  /** A move fitted into a slot of the melee loadout (`filled`), or a slot emptied. */
  meleeLoadoutSlot(filled = true) {
    if (!this.ok() || !this.allow('meleeLoadoutSlot', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.3, true);
    if (filled) {
      this.noise(t, 0.025, { type: 'bandpass', f0: 3600, q: 10, gain: 0.45, dest: d }); // (the notch)
      this.tone(t, 0.25, { f0: 1480, f1: 1420, type: 'triangle', gain: 0.08, dest: d }); this.tone(t + 0.03, 0.06, { f0: 260, f1: 180, gain: 0.25, dest: d });
    } else {
      this.noise(t, 0.12, { type: 'bandpass', f0: 1200, f1: 2600, q: 1.5, gain: 0.2, attack: 0.04, dest: d }); // (lifted out)
      this.tone(t + 0.05, 0.12, { f0: 900, f1: 640, type: 'triangle', gain: 0.06, dest: d });
    }
  }
  /** `n` plates thrown away from the Veritome's memory: paper crumpled and tossed. */
  veritomePlateDiscard(n = 1) {
    if (!this.ok() || !this.allow('veritomePlateDiscard', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0.25, true), k = clamp(Math.round(6 + num(n, 1) * 2), 6, 16);
    for (let i = 0; i < k; i++) this.noise(t + (i / k) * 0.32 + Math.random() * 0.02, 0.018 + Math.random() * 0.02, { type: 'bandpass', f0: 1600 + Math.random() * 3600, q: 2.5, gain: 0.3, dest: d });
    this.noise(t + 0.45, 0.07, { type: 'lowpass', f0: 700, gain: 0.25, dest: d }); // (tossed)
  }

  // ---------------------------------------------------------------- the Throwing Room
  /** A drill begun: the shot timer's start. */
  rangeDrillStart() {
    if (!this.ok() || !this.allow('rangeDrillStart', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.25);
    beep(this, t, 1000, 0.08, 1, d); beep(this, t + 0.25, 1000, 0.08, 1, d); beep(this, t + 0.5, 1500, 0.3, 1, d);
  }
  /** A drill done: the end buzzer, then `acc` (hits over shots, 0..1) read out as up to five beeps; none when unknown. */
  rangeDrillEnd(acc) {
    if (!this.ok() || !this.allow('rangeDrillEnd', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.25);
    this.tone(t, 0.45, { f0: 220, type: 'sawtooth', gain: 0.06, dest: d }); this.tone(t, 0.45, { f0: 223, type: 'square', gain: 0.03, dest: d });
    if (acc == null || !Number.isFinite(+acc)) return;
    const k = Math.round(clamp(+acc, 0, 1) * 5);
    for (let i = 0; i < k; i++) beep(this, t + 0.65 + i * 0.12, 1200, 0.05, 0.8, d);
    if (!k) this.tone(t + 0.65, 0.12, { f0: 300, f1: 260, type: 'triangle', gain: 0.12, dest: d }); // (nothing on target: a dull tick)
  }
  /** A drill called off by leaving the room. */
  rangeDrillLeft() {
    if (!this.ok() || !this.allow('rangeDrillLeft', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0.2);
    beep(this, t, 600, 0.12, 0.9, d); beep(this, t + 0.18, 420, 0.2, 0.9, d);
  }
  /** The status bench's lectern: `light` a status, 'each' or 'none'. */
  rangeBenchLamp(light = 'none') {
    if (!this.ok() || !this.allow('rangeBenchLamp', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.25);
    this.noise(t, 0.012, { type: 'highpass', f0: 3000, gain: 0.4, dest: d }); // (the switch)
    if (light === 'none' || !light) beep(this, t + 0.05, 500, 0.12, 0.8, d);
    else if (light === 'each') [800, 1000, 1200].forEach((f, i) => beep(this, t + 0.05 + i * 0.08, f, 0.05, 0.8, d));
    else beep(this, t + 0.05, 900, 0.1, 0.8, d);
  }
  /** A roly-poly's status read the first time in a visit: two chirps, the second as long as `dur` (real seconds) holds. */
  rangeStatusChirp(status = 'stun', dur = 2) {
    if (!this.ok() || !this.allow('rangeStatusChirp', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.13, 0.2), i = Math.max(0, STATUSES.indexOf(status));
    const m = 76 + SCALE[i % 5] + 12 * Math.floor(i / 5), len = 0.04 + clamp(num(dur, 2), 0, 10) * 0.025;
    beep(this, t, hz(m), 0.04, 0.7, d); beep(this, t + 0.08, hz(m), len, 0.5, d);
  }
  /** The paint range read: each ring's covered share (0..1) at 3, 6 and 9 m, a beep each. */
  rangePaintRead(three = 0, six = 0, nine = 0) {
    if (!this.ok() || !this.allow('rangePaintRead', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.13, 0.2);
    [three, six, nine].forEach((x, i) => {
      const k = clamp(num(x, 0), 0, 1), at = t + i * 0.14;
      if (k < 0.02) this.tone(at, 0.05, { f0: 280, f1: 240, type: 'triangle', gain: 0.15, dest: d }); // (bare)
      else beep(this, at, 700 * Math.pow(2, k), 0.07, 0.6 + 0.4 * k, d);
    });
  }

  // ---------------------------------------------------------------- the Spirit Garden
  /** A mastered encounter set to work a garden slot (`on`), or the slot cleared. */
  gardenSlotSet(st = null, on = true) {
    if (!this.ok() || !this.allow('gardenSlotSet', 3)) return;
    const t = this.onSixteenth ? this.onSixteenth(st?.grid) : this.ctx.currentTime, s = num(st?.grid?.spb, 0.65) / 4, d = this.out(0.2, 0.4);
    this.tone(t, 0.08, { f0: 240, f1: 170, gain: 0.3, dest: d }); this.noise(t, 0.04, { type: 'bandpass', f0: 1800, q: 2, gain: 0.25, dest: d }); // (the bench's knock)
    const notes = on ? [0, 3] : [2]; // (up a fourth: degrees 0 and 3 of the pentatonic; cleared, one note under)
    notes.forEach((k, i) => this.tone(t + s * (i + 1), 0.45, { f0: hz(gardenMidi(st, on ? k : -1, 2)), type: 'triangle', gain: 0.16, dest: d }));
  }
  /** One more garden slot or bed given by a feature placed (`kind` 'slot' | 'bed'). */
  gardenGrant(st = null, kind = 'slot') {
    if (!this.ok() || !this.allow('gardenGrant', 1)) return;
    const t = this.onSixteenth ? this.onSixteenth(st?.grid) : this.ctx.currentTime, s = num(st?.grid?.spb, 0.65) / 4, d = this.out(0.26, 0.6, true), from = kind === 'bed' ? 0 : 1;
    [0, 2, 4, 5].forEach((k, i) => bell(this, t + i * s, hz(gardenMidi(st, from + k, 3)), 1.4, 0.07, d));
  }
  /** A placed feature moved to another plot: `mult` its adjacency bonus there (1 none .. about 2), `vein` on a spirit vein. */
  gardenFeatureMove(st = null, mult = 1, vein = false) {
    if (!this.ok() || !this.allow('gardenFeatureMove', 4)) return;
    const t = this.onSixteenth ? this.onSixteenth(st?.grid) : this.ctx.currentTime, s = num(st?.grid?.spb, 0.65) / 4, d = this.out(0.18, 0.4);
    this.noise(t, 0.14, { type: 'bandpass', f0: 800, f1: 500, q: 1.2, gain: 0.25, attack: 0.03, dest: d }); // (the slide)
    this.tone(t + 0.12, 0.1, { f0: 150, f1: 80, gain: 0.3, dest: d }); // (set down)
    const k = clamp(Math.round((num(mult, 1) - 1) * 4), 0, 4);
    this.tone(t + s * 2, 0.45, { f0: hz(gardenMidi(st, k, 2)), type: 'triangle', gain: 0.15, dest: d });
    if (vein) for (const r of [2, 3]) this.tone(t + s * 3, 0.6, { f0: hz(gardenMidi(st, k, 3)) * r * 0.5, gain: 0.03, dest: d }); // (the vein's shimmer)
  }
  /** A spirits' race track carved round a planetoid, `metres` round. */
  gardenTrackCarve(st = null, metres = 100) {
    if (!this.ok() || !this.allow('gardenTrackCarve', 1)) return;
    const t = this.onSixteenth ? this.onSixteenth(st?.grid) : this.ctx.currentTime, s = num(st?.grid?.spb, 0.65) / 4, d = this.out(0.22, 0.45);
    this.noise(t, 0.6, { type: 'bandpass', f0: 600, f1: 1300, q: 2, gain: 0.22, attack: 0.1, dest: d }); // (the stick through the ground)
    const n = clamp(Math.round(num(metres, 100) / 40), 3, 7);
    for (let i = 0; i < n; i++) this.tone(t + s * (2 + i), 0.4, { f0: hz(gardenMidi(st, i, 2)), type: 'triangle', gain: 0.13, dest: d });
  }
  /** The garden's camera turned to `view` ('overhead' | 'first' | 'behind'); the press's view, and the way back from it, are the press's. */
  gardenViewTurn(view = 'behind') {
    const was = this._gardenView; this._gardenView = view;
    if (view === 'press' || was === 'press' || !this.ok() || !this.allow('gardenViewTurn', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.08, 0.3, true), [f0, f1] = view === 'overhead' ? [400, 1600] : view === 'first' ? [1600, 500] : [900, 700];
    this.noise(t, 0.3, { type: 'bandpass', f0, f1, q: 1, gain: 0.3, attack: 0.1, dest: d });
  }
  /** The soul bead into an attribute's spread at the press (`attribute` its id), or into its tile's `heart`; null (out of all): silent. */
  alchemyEnter(st = null, attribute = null, heart = false) {
    if (!attribute || !this.ok() || !this.allow('alchemyEnter', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.5, true), k = Math.max(0, ATTRIBUTES.indexOf(attribute)), f = hz(gardenMidi(st, k, 3));
    this.tone(t, 0.7, { f0: f, gain: 0.1, dest: d }); this.tone(t, 0.25, { f0: f * 2.76, gain: 0.02, dest: d }); // (the glass)
    if (heart) { this.tone(t + 0.06, 1, { f0: hz(gardenMidi(st, k + 2, 3)), gain: 0.07, dest: d }); this.tone(t + 0.12, 1.2, { f0: f * 2, gain: 0.05, dest: d }); }
  }
}
