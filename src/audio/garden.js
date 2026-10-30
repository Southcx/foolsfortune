// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S SOUND (docs/plans/GARDEN-COZY.md B1 to B5, Wanda's; the cue is music/garden.js, which keeps B6, the seasons, and
// B3's tuning of the cue itself). One loop while you are in the Inner Realm, reading the garden every tenth of a real second:
//   B1 THE GARDEN'S OWN BED, made of what you placed and where you stand: the air (stiller in summer, a cold wind in winter), water near a
//      pond (a brook's run and a drop now and then), birds by daylight in spring and summer, bees by the beds in summer, leaves turning
//      over in autumn, crickets by night (more by the lanterns and the beds), rain on leaves while it rains (waterworks.rain()).
//   B3 THE BRIAR, heard as roughness (Plomp and Levelt: two tones about a quarter of a critical band apart grate; under about 20 Hz they
//      beat): the wind's whistle split into two voices that drift apart as the planetoid you are on goes to briar (harmony.briarK), a
//      cicada's rasp, thorny plucks with a tritone in them. A calm planetoid's whistle is one voice; tending pulls the two back together
//      and you hear the beating slow and stop. A modifier with its source in sight (the thorns), never a rule of the garden changed.
//   B4 THE SPIRITS HUM ALONG: a spirit near you and fond of you (bond) hums a few notes of the cue's scale in its small throat
//      (audio/spirits.js syllable) now and then; one worn out or still a stranger hums them out of tune, a quarter-tone flat.
//   B5 WHAT SOUNDS WHERE IT STANDS (decor's sound set, progress/decor.js): a wind chime tinkling in the scale as the wind takes it, a
//      music box playing the tune's turn, a gramophone's crackle and a few bars of a lounge; each heard by its distance from you and
//      only near it (New Horizons' music players).
//   B2 TENDING AS MUSIC (one call an act, from audio/cues.js): each lands on the garden cue's next sixteenth in its key (Rez's quantise,
//      as the rail's shots): a watering a run down the scale, a planting a knock and a note, a harvest a step up a crop and the Answer
//      for a full bed, a feature placed, the ground painted, a planetoid bought, an upgrade, coming in and going out, the spirits'
//      races and spars, the press at the Athanor and its firing.
// Every tending sound teaches the scale it is in without saying so: your chores become the tune's notes.
//
// Prior art: Animal Crossing: New Horizons (each island's own bed of breeze, insects and water; placed music players heard where they
// stand), Stardew Valley's seasonal soundscapes between the songs, Harvest Moon: A Wonderful Life's homely acoustic seasons, Rez (the
// act on the beat, in the key), Plomp and Levelt (1965) on sensory dissonance, as the SFU Sonic Studio handbook sets it out.
//
//   gardenState(game) -> snapshot | null     sfx.gardenStart(read) / .gardenEnd()     read() -> gardenState(game)
//   sfx.gardenWater() .gardenPlant() .gardenHarvest(n) .gardenPlace() .gardenPaint() .gardenUpgrade() .gardenCollect()
//   sfx.gardenEnter() .gardenLeave() .gardenRaceStart() .gardenRace() .gardenBump() .gardenPress() .gardenFire(trueFiring)
// ---------------------------------------------------------------------------------------
import { phaseAt } from '../progress/weather.js';
import { seasonOf } from '../progress/seasons.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TICKS = 36000; // (the loop reads at most an hour of real time, then lets go: casebook 253)
const ANSWER = [0, 1, 2, 3, 4]; // (the Answer's climb, a degree a note: music/motifs.js, in whichever mode the garden is in)
const SOUNDING = { windChime: 1, musicBox: 1, gramophone: 1 };
const DEFAULT_SCALE = [0, 2, 4, 7, 9];

/** What the garden's sound reads, from the game (null outside the Inner Realm): distances from your Pneuka Jar to what is placed. */
export function gardenState(g) {
  const R = g.realm; if (!R?.active || !R.jarBody?.pos) return null;
  const J = R.jarBody.pos, nearest = (list) => list.reduce((m, p) => Math.min(m, p.distanceTo(J)), Infinity);
  const plots = R.plots?.plots || [], feat = (id) => plots.filter((p) => p.placed?.feature === id).map((p) => p.pos);
  const sounds = (g.decorLayer?.spots || []).filter((s) => SOUNDING[s.id]).map((s) => ({ id: s.id, d: s.pos.distanceTo(J) }));
  const spirits = (R.spirits || []).map((s) => ({ d: s.body?.pos?.distanceTo(J) ?? Infinity, bond: s.e?.sp?.bond ?? 0, fatigue: s.e?.sp?.fatigue ?? 0, feeling: s.e?.feeling || s.e?.aspect || 'mirth' }));
  let season = 'summer'; try { season = seasonOf().id; } catch { /* the calendar not up yet */ }
  return { pond: nearest(feat('pond')), lantern: nearest(feat('lantern')), bed: nearest((R.site?.features || []).filter((f) => f.kind === 'bed').map((f) => f.pos)),
    sounds, spirits, phase: phaseAt(), season, briar: g.harmony?.briarK?.() ?? 0, rain: R.waterworks?.rain?.() ?? 0, grid: g.music?.grid?.(), scale: g.music?.scale?.() || DEFAULT_SCALE };
}
const near = (d, r = 6) => (Number.isFinite(d) ? Math.max(0, 1 - d / r) : 0);

export class GardenSounds {
  /** A note of the garden cue's scale: degree `k` (any integer) above the cue's root, `oct` octaves up. */
  gardenNote(st, k, oct = 1) { const s = st?.scale || DEFAULT_SCALE, n = ((k % s.length) + s.length) % s.length; return (st?.grid?.root ?? 64) + 12 * (oct - 1 + Math.floor(k / s.length)) + s[n]; }
  /** A noise bed that loops, its gain and filter set as the loop reads. */
  gardenBed(type, f, q, dest, rate = 1) {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true; src.playbackRate.value = rate;
    const flt = c.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q; const g = c.createGain(); g.gain.value = 0;
    src.connect(flt).connect(g).connect(dest); src.start(); return { src, flt, g };
  }

  // ---- B1, B3, B4, B5: the loop ----
  gardenStart(read = () => null) {
    if (this._garden || !this.ok()) return;
    const c = this.ctx, bus = c.createGain(); bus.gain.value = 0.0001; bus.connect(this.loopBus || this.out(1, 0.3));
    const air = this.gardenBed('bandpass', 700, 0.8, bus, 0.6), brook = this.gardenBed('lowpass', 900, 0.7, bus, 1.1), leaves = this.gardenBed('highpass', 3500, 0.7, bus, 0.9), rain = this.gardenBed('highpass', 2200, 0.5, bus, 1.3);
    // the briar's whistle: two sines a hair apart (their beating is the roughness), and a cicada's rasp (noise chopped at 40 Hz)
    const wa = c.createOscillator(), wb = c.createOscillator(), wg = c.createGain(); wg.gain.value = 0; wa.connect(wg); wb.connect(wg); wg.connect(bus); wa.start(); wb.start();
    const cic = this.gardenBed('bandpass', 5200, 4, bus, 1), chop = c.createOscillator(), chopG = c.createGain(); chop.frequency.value = 42; chopG.gain.value = 0; chop.connect(chopG).connect(cic.g.gain); chop.start();
    const G = this._garden = { bus, air, brook, leaves, rain, wa, wb, wg, cic, chop, chopG, gone: 0, ticks: 0, next: { bird: 0, drop: 0, cricket: 0, pluck: 0, hum: 0, chime: 0, box: 0, gram: 0, bee: 0 } };
    G.timer = setInterval(() => {
      const st = read(), t = c.currentTime;
      if (++G.ticks > TICKS) { this.gardenEnd(); return; }
      if (st) G.seen = true; G.gone = st ? 0 : G.gone + 1; if (G.gone > (G.seen ? 10 : 80)) { this.gardenEnd(); return; } // (the realm may not be up yet as the seam crosses: 8 real s to arrive, then 1 s gone ends it)
      if (!st || !this.ok()) return;
      this.gardenTick(G, st, t);
    }, 100);
  }
  gardenTick(G, st, t) {
    const S = st.season, night = st.phase === 'night', day = st.phase === 'day' || st.phase === 'dawn', rain = Math.min(1, st.rain || 0), br = Math.min(1, st.briar || 0);
    const set = (p, v, tc = 0.6) => p.setTargetAtTime(v, t, tc), N = G.next;
    set(G.bus.gain, 0.55, 1.2);
    // the air: stiller in summer, a cold wind in winter, gusting slowly
    const gust = 0.6 + 0.4 * Math.sin(t * 0.21) * Math.sin(t * 0.07);
    set(G.air.g.gain, (S === 'winter' ? 0.09 : S === 'summer' ? 0.03 : 0.05) * gust); set(G.air.flt.frequency, (S === 'winter' ? 900 : 600) + 300 * gust);
    // water by a pond, leaves in autumn (and a little in any wind), rain on leaves
    set(G.brook.g.gain, 0.12 * near(st.pond, 9)); set(G.leaves.g.gain, (S === 'autumn' ? 0.05 : 0.012) * gust); set(G.rain.g.gain, 0.12 * rain);
    // B3: the briar's whistle (one voice when calm, two a quarter of a critical band apart at full briar: about 30 Hz at 1.3 kHz) and the cicada
    const f = 1320; G.wa.frequency.setTargetAtTime(f, t, 0.5); G.wb.frequency.setTargetAtTime(f + 1.5 + 32 * br, t, 1.2); // (the beating slows and stops as it calms)
    set(G.wg.gain, 0.006 + 0.03 * br * gust); set(G.chopG.gain, 0.05 * br * (day ? 1 : 0.4)); set(G.cic.g.gain, 0.0001);
    // the moments drawn as they fall (each from its own clock, so none piles up)
    if (day && !rain && (S === 'spring' || S === 'summer') && t > N.bird) { N.bird = t + 2 + Math.random() * 5; this.gardenBird(t, S === 'spring' ? 0.06 : 0.04); }
    if (S === 'summer' && day && near(st.bed, 7) > 0 && t > N.bee) { N.bee = t + 3 + Math.random() * 4; this.gardenBee(t, 0.05 * near(st.bed, 7)); }
    if (near(st.pond, 9) > 0 && t > N.drop) { N.drop = t + 1 + Math.random() * 3; this.tone(t, 0.08, { f0: 900 + Math.random() * 700, f1: 1800, gain: 0.04 * near(st.pond, 9), dest: this.out(0.4, 0.4) }); }
    if (night && t > N.cricket) { const k = 0.5 + 0.5 * Math.max(near(st.lantern, 8), near(st.bed, 8)); N.cricket = t + 0.9 + Math.random() * 1.4; this.gardenCricket(t, 0.035 * k); }
    if (br > 0.25 && t > N.pluck) { N.pluck = t + 4 + Math.random() * 6 / br; this.gardenThorn(t, st, 0.05 + 0.08 * br); }
    // B4: a spirit near you hums along; a fond one in tune, a tired or strange one a quarter-tone flat
    const sp = st.spirits.filter((s) => s.d < 6).sort((a, b) => a.d - b.d)[0];
    if (sp && t > N.hum) { N.hum = t + 6 + Math.random() * 8; this.gardenHum(t, st, sp); }
    // B5: what sounds where it stands, nearest of each kind
    for (const id of ['windChime', 'musicBox', 'gramophone']) {
      const s = st.sounds.filter((x) => x.id === id).sort((a, b) => a.d - b.d)[0], k = s ? near(s.d, id === 'gramophone' ? 14 : 10) : 0;
      if (!k) continue;
      if (id === 'windChime' && t > N.chime) { N.chime = t + 0.6 + Math.random() * 2.4 / gust; this.gardenChime(t, st, 0.05 * k); }
      if (id === 'musicBox' && t > N.box) { N.box = t + 9; this.gardenMusicBox(t, st, 0.09 * k); }
      if (id === 'gramophone' && t > N.gram) { N.gram = t + 11; this.gardenGramophone(t, st, 0.08 * k); }
    }
  }
  gardenEnd() {
    const G = this._garden; if (!G) return; this._garden = null; clearInterval(G.timer);
    const t = this.ctx.currentTime; G.bus.gain.cancelScheduledValues(t); G.bus.gain.setValueAtTime(G.bus.gain.value, t); G.bus.gain.setTargetAtTime(0.0001, t, 0.5);
    setTimeout(() => { for (const s of [G.air.src, G.brook.src, G.leaves.src, G.rain.src, G.cic.src, G.wa, G.wb, G.chop]) try { s.stop(); } catch { /* gone */ } G.bus.disconnect(); }, 3500);
  }
  gardenBird(t, v) {
    const d = this.out(v, 0.45), f = 2600 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 3), p = this.ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; p.connect(d);
    for (let i = 0; i < n; i++) this.tone(t + i * 0.11, 0.08, { f0: f * (1 + 0.1 * (i % 2)), f1: f * (1.25 - 0.05 * i), gain: 0.5, dest: p });
  }
  gardenBee(t, v) { const d = this.out(v, 0.2); this.tone(t, 1.6, { f0: 210 + Math.random() * 40, f1: 230, type: 'sawtooth', gain: 0.12, dest: d }); }
  gardenCricket(t, v) { const d = this.out(v, 0.35), f = 4300 + Math.random() * 300; for (let i = 0; i < 3; i++) this.tone(t + i * 0.045, 0.03, { f0: f, gain: 0.5, dest: d }); }
  /** A thorn's pluck: short and bright, its note and the tritone over it (the briar's own interval). */
  gardenThorn(t, st, v) {
    const d = this.out(v, 0.35), m = this.gardenNote(st, Math.floor(Math.random() * 5), 1);
    this.tone(t, 0.14, { f0: hz(m), type: 'triangle', gain: 0.4, dest: d }); this.tone(t + 0.02, 0.12, { f0: hz(m + 6), type: 'triangle', gain: 0.25, dest: d });
    this.noise(t, 0.015, { type: 'highpass', f0: 5000, gain: 0.3, dest: d });
  }
  /** A spirit humming three notes of the scale in its small throat; `sp.bond` under 25 or `sp.fatigue` past 70: a quarter-tone flat. */
  gardenHum(t, st, sp) {
    if (!this.syllable) return;
    const off = sp.bond < 25 || sp.fatigue > 70 ? -0.5 : 0, d = this.out(Math.min(0.35, 0.6 / (0.6 + sp.d * 0.2)), 0.4), k0 = Math.floor(Math.random() * 3);
    [k0, k0 + 1, k0 + 2].forEach((k, i) => { const f = hz(this.gardenNote(st, k, 2) + off); this.syllable(t + i * 0.32, 0.3, f, f * (off ? 0.985 : 1), i === 2 ? 'o' : 'u', 0.18, d); });
  }
  gardenChime(t, st, v) {
    const d = this.out(v, 0.6), m = this.gardenNote(st, Math.floor(Math.random() * 10), 3);
    this.tone(t, 1.8, { f0: hz(m), gain: 0.5, dest: d }); this.tone(t, 0.6, { f0: hz(m) * 2.76, gain: 0.08, dest: d });
  }
  /** A music box turning the Answer, slowly. */
  gardenMusicBox(t, st, v) {
    const d = this.out(v, 0.5); ANSWER.forEach((k, i) => this.tone(t + i * 0.42, 0.9, { f0: hz(this.gardenNote(st, k, 3)), type: 'triangle', gain: 0.4, dest: d }));
  }
  /** A gramophone: the needle's crackle and a few warm notes of a lounge, through a horn's narrow band. */
  gardenGramophone(t, st, v) {
    const c = this.ctx, bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.9; bp.connect(this.out(v, 0.3));
    for (let i = 0; i < 18; i++) this.noise(t + Math.random() * 6, 0.006, { type: 'highpass', f0: 3000, gain: 0.25, dest: bp });
    [0, 2, 4, 3, 1, 0].forEach((k, i) => this.tone(t + 0.5 + i * 0.6, 0.7, { f0: hz(this.gardenNote(st, k, 2)), type: 'sawtooth', gain: 0.06, dest: bp }));
    [0, 4].forEach((k, i) => this.tone(t + 0.5 + i * 1.8, 1.7, { f0: hz(this.gardenNote(st, k, 0)), type: 'triangle', gain: 0.12, dest: bp }));
  }

  // ---- B2: tending, each on the cue's next sixteenth in its key ----
  gardenAt(st) { return this.onSixteenth ? this.onSixteenth(st?.grid) : this.ctx.currentTime; }
  gardenStep(st) { return (st?.grid?.spb ?? 0.65) / 4; }
  gardenPluck(t, m, v, d) { this.tone(t, 0.5, { f0: hz(m), type: 'triangle', gain: v, dest: d }); this.tone(t, 0.18, { f0: hz(m) * 2, gain: v * 0.25, dest: d }); }
  gardenWater(st) {
    if (!this.ok() || !this.allow('gardenWater', 2)) return;
    const t = this.gardenAt(st), s = this.gardenStep(st), d = this.out(0.22, 0.45);
    [4, 3, 2, 1].forEach((k, i) => this.gardenPluck(t + i * s, this.gardenNote(st, k, 2), 0.16, d)); // (a run down the scale)
    this.noise(t, s * 4, { type: 'bandpass', f0: 2400, f1: 1200, q: 1.2, gain: 0.12, attack: 0.03, dest: d }); // (the water falling)
  }
  gardenPlant(st) {
    if (!this.ok() || !this.allow('gardenPlant', 4)) return;
    const t = this.gardenAt(st), d = this.out(0.24, 0.35);
    this.noise(t, 0.08, { type: 'lowpass', f0: 600, gain: 0.35, dest: d }); this.tone(t, 0.1, { f0: 140, f1: 80, gain: 0.3, dest: d }); // (the soil pressed)
    this.gardenPluck(t + this.gardenStep(st), this.gardenNote(st, (this._plant = ((this._plant ?? -1) + 1) % 5), 2), 0.18, d); // (a note, the next up each planting)
  }
  /** A bed harvested: a pop and a step up the scale a crop (at most 8), and the Answer over it for a full bed (3 or more). */
  gardenHarvest(st, n = 1) {
    if (!this.ok() || !this.allow('gardenHarvest', 3)) return;
    const t = this.gardenAt(st), s = this.gardenStep(st), d = this.out(0.26, 0.4), m = Math.max(1, Math.min(8, n));
    for (let i = 0; i < m; i++) { this.noise(t + i * s, 0.03, { type: 'bandpass', f0: 1400, q: 3, gain: 0.3, dest: d }); this.gardenPluck(t + i * s, this.gardenNote(st, i, 2), 0.16, d); }
    if (n >= 3) ANSWER.forEach((k, i) => this.tone(t + (m + 1) * s + i * s * 2, 0.9, { f0: hz(this.gardenNote(st, k, 3)), gain: 0.1, dest: d }));
  }
  gardenCollect(st) { if (!this.ok() || !this.allow('gardenCollect', 4)) return; const t = this.gardenAt(st), d = this.out(0.22, 0.4); [0, 2].forEach((k, i) => this.gardenPluck(t + i * this.gardenStep(st), this.gardenNote(st, k, 3), 0.14, d)); }
  gardenPlace(st) {
    if (!this.ok() || !this.allow('gardenPlace', 3)) return;
    const t = this.gardenAt(st), d = this.out(0.28, 0.4);
    this.tone(t, 0.16, { f0: 110, f1: 60, gain: 0.4, dest: d }); this.noise(t, 0.1, { type: 'lowpass', f0: 1200, gain: 0.3, dest: d }); // (set down)
    [0, 2, 4].forEach((k) => this.gardenPluck(t + this.gardenStep(st), this.gardenNote(st, k, 2), 0.1, d)); // (its chord)
  }
  gardenPaint(st) { if (!this.ok() || !this.allow('gardenPaint', 3)) return; const t = this.gardenAt(st), d = this.out(0.18, 0.4); this.noise(t, 0.3, { type: 'bandpass', f0: 1800, f1: 900, q: 1, gain: 0.25, attack: 0.05, dest: d }); this.gardenPluck(t + this.gardenStep(st) * 2, this.gardenNote(st, 3, 2), 0.1, d); }
  gardenUpgrade(st) { if (!this.ok() || !this.allow('gardenUpgrade', 1)) return; const t = this.gardenAt(st), d = this.out(0.26, 0.5, true); [0, 2, 4, 5].forEach((k, i) => this.gardenPluck(t + i * this.gardenStep(st), this.gardenNote(st, k, 2), 0.13, d)); }
  /** Coming into the Inner Realm (a harp's sweep up, the Jar's air opening) and going out (the sweep down). */
  gardenEnter() { if (!this.ok() || !this.allow('gardenEnter', 1)) return; const t = this.ctx.currentTime, d = this.out(0.24, 0.6, true); [64, 68, 71, 76, 80, 83].forEach((m, i) => this.tone(t + i * 0.06, 1.2, { f0: hz(m), type: 'triangle', gain: 0.1, dest: d })); this.noise(t, 1, { type: 'bandpass', f0: 600, f1: 2400, q: 0.8, gain: 0.08, attack: 0.3, dest: d }); }
  gardenLeave() { if (!this.ok() || !this.allow('gardenLeave', 1)) return; const t = this.ctx.currentTime, d = this.out(0.22, 0.6, true); [83, 80, 76, 71, 68, 64].forEach((m, i) => this.tone(t + i * 0.06, 1, { f0: hz(m), type: 'triangle', gain: 0.09, dest: d })); }
  gardenRaceStart() { if (!this.ok() || !this.allow('gardenRaceStart', 1)) return; const t = this.ctx.currentTime, d = this.out(0.26, 0.3); this.tone(t, 0.25, { f0: 2400, f1: 2600, type: 'square', gain: 0.05, dest: d }); this.tone(t + 0.3, 0.45, { f0: 2400, f1: 2700, type: 'square', gain: 0.06, dest: d }); } // (the starter's whistle)
  gardenRace(st) { if (!this.ok() || !this.allow('gardenRace', 1)) return; const t = this.gardenAt(st), d = this.out(0.28, 0.5, true); [0, 2, 4, 5].forEach((k, i) => this.gardenPluck(t + i * this.gardenStep(st) * 1.5, this.gardenNote(st, k, 2), 0.14, d)); }
  gardenBump() { if (!this.ok() || !this.allow('gardenBump', 6)) return; const t = this.ctx.currentTime, d = this.out(0.22, 0.2); this.tone(t, 0.12, { f0: 260, f1: 140, gain: 0.35, dest: d }); } // (a soft bonk)
  gardenPress() { if (!this.ok() || !this.allow('gardenPress', 2)) return; const t = this.ctx.currentTime, d = this.out(0.26, 0.35); this.noise(t, 0.5, { type: 'bandpass', f0: 400, f1: 250, q: 3, gain: 0.3, attack: 0.1, dest: d }); this.tone(t, 0.4, { f0: 90, f1: 70, type: 'sawtooth', gain: 0.04, dest: d }); }
  gardenFire(st, trueFiring = false) {
    if (!this.ok() || !this.allow('gardenFire', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.6, true);
    this.noise(t, 0.6, { type: 'lowpass', f0: 500, f1: 2500, gain: 0.35, attack: 0.15, dest: d }); // (the kiln's breath)
    (trueFiring ? [0, 2, 4, 7] : [0, 4]).forEach((k, i) => this.tone(t + 0.4 + i * 0.12, 1.4, { f0: hz(this.gardenNote(st, k, 3)), gain: 0.1, dest: d }));
  }
}
