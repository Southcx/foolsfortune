// ---------------------------------------------------------------------------------------
// THE CROSSING'S SMALL MOMENTS (the rail: Petra's world/emocean/stage.js, courier/ship/ship.js and mounts.js, the set pieces' pirates.js and
// leviathan.js). The rail's lock and down tones are audio/rail.js's; these are the rest of the ship's life, each in the leg's key and,
// where it is the Courier's own shooting, on the next sixteenth (Rez's quantise: onSixteenth, railKey).
//   THE SHIP'S OWN, for the runtime to call in place of the stock sounds it borrows today (a note to Petra: docs/handoffs/petra/):
//     railGun(grid)        the gun on the sixteenth (today sfx.tap(9)): a tight psychic snap, a tick of the key's fifth
//     railVolley(n, grid)  the lances let go (today sfx.seekers): a rising whoosh a lance, fanned up the scale
//     railRoll()           the barrel roll (today sfx.roll): the hull's air torn round, a rope's creak and the mast's whip
//     railRicochet()       a shot sent back or turned (today sfx.ricochet): a bright ping and its zip away
//     railDrink(n, grid)   a plain shot absorbed into the pool (today sfx.absorb): a glassy sip, a degree up the scale a drink
//   ON THE BUS:
//     rail.hit { region, kind }  the hull struck, its region's wood: the bow and stern a hard knock, the beams a planking crack, the
//                         mast a crack and its stays twanging, the helm a bell's dull clank; an outlined shot's with a glass edge
//     rail.dodge          a shot rolled through: a close whoosh past both ears
//     rail.cancel { n }   the shots in the air drunk at a leg's end: a run of sips up the scale, as many as were drunk
//     rail.mend           a breather mends the hull: a hammer's three taps and a settled chord
//     rail.warn { blow }  a set piece's blow told bars ahead: Old Nobody's breach a deep swell, its sounding the sea drawing down; a
//                         pirates' ram (rail.ram) a hull's creak coming on
//     rail.broadside      the brig's guns all at once (over its explosions): the cannon's thunder rolling down its side
//     rail.steal          a boarder off with your casks: barrels rolling and a jeer of a whistle
//     rail.phase          a boss's phase turned: a low brass stab in the key
//     rail.toll { onBeat } the bell mount on the beat: a bright glint over its gong (off the beat, the gong alone)
//     rail.start          casting off: a ship's bell twice and the sails filling
//     rail.volley { downs } the volley's count: a tick a down, rising, after the lances land
//
// Prior art: Rez (every shot on the music), Star Fox 64's barrel roll and its "Do a barrel roll" whoosh, Sid Meier's Pirates! (the
// broadside's roll of thunder down a hull), Sea of Thieves (a hull's wood by where it was struck, a hammer's mending).
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SCALE = [64, 66, 67, 69, 71, 72, 74, 76]; // (E minor, the rail's: a degree a step)
/** The hull's regions (shiphull.js), each its own wood: body Hz, crack band Hz, ring (a stay or a bell). */
const HULL = {
  bow: { f: 150, band: 1400 }, stern: { f: 130, band: 1200 }, port: { f: 110, band: 900 }, starboard: { f: 115, band: 950 },
  mast: { f: 180, band: 2200, stays: true }, helm: { f: 220, band: 1600, bell: true },
};
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { gun: 1.25, volley: 4.1, roll: 1.2, ricochet: 13, drink: 10, hit: 2.6, dodge: 2, cancel: 3.4, mend: 1.6, warn: 1.6, ram: 5, broadside: 0.7, steal: 3.2,
  phase: 8, toll: 5.2, start: 2, count: 3.6 };

export class CrossingSounds {
  crossOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 9000); return d; }

  railGun(grid = null) {
    if (!this.ok() || !this.allow('railGun', 24)) return;
    const t = this.onSixteenth(grid), d = this.crossOut('gun', 0.25, 0.25), m = 71 + this.railKey(grid);
    this.noise(t, 0.025, { type: 'bandpass', f0: 3200, q: 1.5, gain: 0.5, dest: d }); this.tone(t, 0.05, { f0: hz(m), f1: hz(m - 12), type: 'triangle', gain: 0.25, dest: d }); // (the snap, a tick of the fifth)
  }
  railVolley(n = 1, grid = null) {
    if (!this.ok() || !this.allow('railVolley', 4)) return;
    const c = Math.max(1, Math.min(8, n | 0)), t = this.onSixteenth(grid), d = this.crossOut('volley', 0.3, 0.4), k = this.railKey(grid);
    for (let i = 0; i < c; i++) { const at = t + i * 0.035, m = SCALE[i] + 12 + k; this.noise(at, 0.25, { type: 'bandpass', f0: 800, f1: 3500, q: 1.5, gain: 0.25, attack: 0.05, dest: d }); this.tone(at, 0.2, { f0: hz(m), f1: hz(m + 5), gain: 0.04, dest: d }); }
  }
  railRoll() {
    if (!this.ok() || !this.allow('railRoll', 2)) return;
    const t = this.ctx.currentTime, d = this.crossOut('roll', 0.35, 0.4);
    this.noise(t, 0.55, { type: 'bandpass', f0: 500, f1: 2200, q: 0.8, gain: 0.35, attack: 0.15, dest: d }); // (the air torn round)
    for (let i = 0; i < 3; i++) this.noise(t + 0.1 + i * 0.12, 0.05, { type: 'bandpass', f0: 600 + i * 80, q: 8, gain: 0.2, dest: d }); // (the rope's creak)
    this.tone(t + 0.45, 0.15, { f0: 900, f1: 400, type: 'triangle', gain: 0.06, dest: d }); // (the mast's whip)
  }
  railRicochet() {
    if (!this.ok() || !this.allow('railRicochet', 8)) return;
    const t = this.ctx.currentTime, d = this.crossOut('ricochet', 0.3, 0.35);
    this.tone(t, 0.12, { f0: 2637, f1: 2700, gain: 0.08, dest: d }); this.tone(t + 0.02, 0.3, { f0: 2400, f1: 700, type: 'triangle', gain: 0.05, dest: d }); // (a ping, zipping away)
  }
  railDrink(n = 0, grid = null) {
    if (!this.ok() || !this.allow('railDrink', 16)) return;
    const t = this.onSixteenth(grid), d = this.crossOut('drink', 0.25, 0.4), m = SCALE[Math.max(0, Math.min(7, n | 0))] + 12 + this.railKey(grid);
    this.tone(t, 0.15, { f0: hz(m - 5), f1: hz(m), gain: 0.08, dest: d }); this.tone(t, 0.25, { f0: hz(m + 12), gain: 0.02, dest: d }); // (a glassy sip)
  }
  railHullHit(region = 'port', kind = null) {
    if (!this.ok() || !this.allow('railHullHit', 6)) return;
    const H = HULL[region] ?? HULL.port, t = this.ctx.currentTime, d = this.crossOut('hit', 0.4, 0.5);
    this.tone(t, 0.3, { f0: H.f, f1: H.f * 0.6, gain: 0.35, dest: d }); this.noise(t, 0.12, { type: 'bandpass', f0: H.band, q: 1.5, gain: 0.4, dest: d }); // (the wood struck)
    for (let i = 0; i < 4; i++) this.noise(t + 0.03 + i * 0.03, 0.02, { type: 'bandpass', f0: H.band * (1.2 + i * 0.2), q: 4, gain: 0.2, dest: d }); // (planking splitting)
    if (H.stays) [196, 247].forEach((f) => this.tone(t + 0.02, 0.6, { f0: f, f1: f * 0.98, type: 'triangle', gain: 0.05, dest: d })); // (the stays twanging)
    if (H.bell) this.tone(t, 0.8, { f0: 440, gain: 0.04, dest: d }); // (the helm's dull clank)
    if (kind === 'outlined') this.noise(t, 0.05, { type: 'highpass', f0: 5000, gain: 0.3, dest: d }); // (an outlined shot's glass edge)
  }
  railDodge() {
    if (!this.ok() || !this.allow('railDodge', 4)) return;
    const t = this.ctx.currentTime, d = this.crossOut('dodge', 0.3, 0.3), c = this.ctx, p = c.createStereoPanner(); p.pan.setValueAtTime(-0.8, t); p.pan.linearRampToValueAtTime(0.8, t + 0.3); p.connect(d); setTimeout(() => p.disconnect(), 1500);
    this.noise(t, 0.3, { type: 'bandpass', f0: 1200, f1: 3000, q: 1.5, gain: 0.4, attack: 0.12, dest: p }); // (a shot past both ears)
  }
  railCancel(n = 1, grid = null) {
    if (!this.ok() || !this.allow('railCancel', 1)) return;
    const c = Math.max(1, Math.min(12, n | 0)), t = this.onSixteenth(grid), d = this.crossOut('cancel', 0.3, 0.5), k = this.railKey(grid);
    for (let i = 0; i < c; i++) this.tone(t + i * 0.05, 0.25, { f0: hz(SCALE[i % 8] + 12 * (1 + (i >= 8)) + k), gain: 0.05, dest: d }); // (a run of sips up the scale)
  }
  railMend() {
    if (!this.ok() || !this.allow('railMend', 1)) return;
    const t = this.ctx.currentTime, d = this.crossOut('mend', 0.3, 0.5);
    for (let i = 0; i < 3; i++) { const at = t + i * 0.22; this.noise(at, 0.02, { type: 'bandpass', f0: 1800, q: 3, gain: 0.4, dest: d }); this.tone(at, 0.08, { f0: 280, f1: 220, type: 'triangle', gain: 0.15, dest: d }); } // (a hammer's three taps)
    [64, 67, 71].forEach((m) => this.tone(t + 0.75, 1.2, { f0: hz(m), gain: 0.04, dest: d })); // (settled)
  }
  railWarn(blow = 'breach') {
    if (!this.ok() || !this.allow(`railWarn.${blow}`, 1)) return;
    const t = this.ctx.currentTime, d = this.crossOut('warn', 0.4, 0.8);
    if (blow === 'sound') { this.noise(t, 2, { type: 'lowpass', f0: 1200, f1: 150, gain: 0.3, attack: 0.3, dest: d }); this.tone(t, 2, { f0: 70, f1: 40, gain: 0.25, dest: d }); return; } // (the sea drawn down)
    this.tone(t, 1.8, { f0: 40, f1: 70, gain: 0.3, dest: d }); this.noise(t, 1.8, { type: 'lowpass', f0: 200, f1: 900, gain: 0.25, attack: 1.4, dest: d }); // (a deep swell rising)
  }
  railRam() {
    if (!this.ok() || !this.allow('railRam', 1)) return;
    const t = this.ctx.currentTime, d = this.crossOut('ram', 0.4, 0.6);
    for (let i = 0; i < 6; i++) this.noise(t + i * 0.2, 0.15, { type: 'bandpass', f0: 300 + i * 40, q: 6, gain: 0.15 + i * 0.04, dest: d }); // (a hull's creak coming on)
    this.tone(t, 1.3, { f0: 55, f1: 80, type: 'sawtooth', gain: 0.03, dest: d });
  }
  railBroadside(ports = 4) {
    if (!this.ok() || !this.allow('railBroadside', 1)) return;
    const c = Math.max(1, Math.min(8, ports | 0)), t = this.ctx.currentTime, d = this.crossOut('broadside', 0.45, 0.9);
    for (let i = 0; i < c; i++) { const at = t + i * 0.09; this.tone(at, 0.9, { f0: 60 - i * 2, f1: 30, gain: 0.25, dest: d }); } // (the thunder rolling down its side)
    this.noise(t, 1.5 + c * 0.1, { type: 'lowpass', f0: 600, f1: 120, gain: 0.25, attack: 0.05, dest: d });
  }
  railSteal() {
    if (!this.ok() || !this.allow('railSteal', 1)) return;
    const t = this.ctx.currentTime, d = this.crossOut('steal', 0.3, 0.4);
    for (let i = 0; i < 5; i++) this.noise(t + i * 0.09, 0.08, { type: 'lowpass', f0: 500, gain: 0.25, dest: d }); // (barrels rolling off)
    this.tone(t + 0.5, 0.4, { f0: 1400, f1: 900, gain: 0.05, dest: d }); this.tone(t + 0.75, 0.3, { f0: 1100, f1: 1500, gain: 0.05, dest: d }); // (a jeer of a whistle)
  }
  railPhase(grid = null) {
    if (!this.ok() || !this.allow('railPhase', 1)) return;
    const t = this.onSixteenth(grid), d = this.crossOut('phase', 0.35, 0.6), k = this.railKey(grid);
    [40, 47, 52].forEach((m) => this.tone(t, 0.6, { f0: hz(m + k), type: 'sawtooth', gain: 0.03, dest: d })); this.noise(t, 0.08, { type: 'lowpass', f0: 1200, gain: 0.25, dest: d }); // (a low brass stab)
  }
  railTollBeat(onBeat = false) {
    if (!onBeat || !this.ok() || !this.allow('railTollBeat', 2)) return;
    const t = this.ctx.currentTime, d = this.crossOut('toll', 0.3, 0.6);
    [2637, 3520].forEach((f, i) => this.tone(t + i * 0.04, 0.6, { f0: f, gain: 0.04, dest: d })); // (on the beat: a glint over the gong)
  }
  railStart() {
    if (!this.ok() || !this.allow('railStart', 0.5)) return;
    const t = this.ctx.currentTime, d = this.crossOut('start', 0.35, 0.6);
    [0, 0.35].forEach((x) => [1, 2.4, 3.9].forEach((r, j) => this.tone(t + x, 1 / (1 + j), { f0: 880 * r, gain: 0.06 / (1 + j * 1.5), dest: d }))); // (the ship's bell twice)
    this.noise(t + 0.6, 1.2, { type: 'bandpass', f0: 500, f1: 900, q: 0.7, gain: 0.25, attack: 0.4, dest: d }); // (the sails filling)
  }
  railVolleyCount(downs = 0, grid = null) {
    const c = Math.max(0, Math.min(8, downs | 0)); if (!c || !this.ok() || !this.allow('railVolleyCount', 4)) return;
    const t = this.onSixteenth(grid), d = this.crossOut('count', 0.25, 0.3), k = this.railKey(grid);
    for (let i = 0; i < c; i++) this.tone(t + i * 0.06, 0.08, { f0: hz(SCALE[i] + 24 + k), type: 'triangle', gain: 0.05, dest: d }); // (a tick a down, rising)
  }
}
