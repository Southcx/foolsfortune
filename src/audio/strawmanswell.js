// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL HEARD (Dovina's world/strawmanwell/, docs/plans/STRAWMANS-WELL.md; her handoff of 2026-10-31): the toy theatre inside
// Strawman's head, its boards wood and its room a hall (the zone's acoustic carries every sound here). A stage is a turn on the boards,
// so what is heard is the theatre's: the curtain, the house, the band in the pit.
//   A STAGE ENTERED  (well.stage.enter) the curtain drawn: a cloth's swish and a woodblock's two knocks (the kabuki's ki)
//   A STAGE CLEARED  (well.stage.clear { rank }) the pit band's sting by rank: SS and S a fanfare up to the octave under a cymbal and the
//                    house's applause, S's a step shorter; A a bright tag; B and C a plain "ta-da"; D a kind shrug down and up (it still
//                    counts: a clear is a clear)
//   THE KO           (well.dummy.ko) the house roaring: a crowd's swell, its claps, and the blast line's far pop (Smash's star KO)
//   A TROPHY         (well.dummy.trophy) a home run: the bat's crack, a long whistle up and a bell where it lands
//   THE PIT          (well.pit.death) the quick retry: one tiny wooden tick and a blip, under everything (it fires a lot)
//   THE FLOOD        (well.flood.fill) the basin full: a glug rising to a held chord
//   THE ARENA        (well.fighter.hit / .ko / .stock) a hit by its weight on the impact frame, a shield's clink and a powershield's
//                    ping; a KO the house's roar; a stock lost a falling whistle and the house's sigh (the last, a falling three)
//
// Prior art: Sonic the Hedgehog's act clear and its tally, Super Meat Boy's instant retry (a sound you stop hearing), Super Smash Bros.'
// KO roar and Home-Run Contest, a theatre's curtain and the hyoshigi's knocks before it.
//
//   sfx.wellEnter() .wellClear(rank) .wellKo() .wellTrophy() .wellPit() .wellFlood() .arenaHit(move, damage, result, percent)
//   .arenaKo() .arenaStock(left)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const KEY = 65; // (F: the wings' key, music/wings.js)
/** A rank's sting: how far up the fanfare climbs, and whether the house claps. */
const RANK = { SS: { climb: 5, claps: 18, crash: true }, S: { climb: 4, claps: 12, crash: true }, A: { climb: 3, claps: 6 }, B: { climb: 2, claps: 0 }, C: { climb: 2, claps: 0 }, D: { climb: 0, claps: 0 } };

export class StrawmansWellSounds {
  wellEnter() {
    if (!this.ok() || !this.allow('wellEnter', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.5);
    this.noise(t, 0.7, { type: 'bandpass', f0: 900, f1: 2600, q: 0.7, gain: 0.25, attack: 0.15, dest: d }); // (the curtain drawn)
    [0, 0.16].forEach((dt) => this.noise(t + 0.5 + dt, 0.03, { type: 'bandpass', f0: 1900, q: 5, gain: 0.7, dest: d })); // (the woodblock's knocks)
  }
  wellClear(rank = 'B') {
    if (!this.ok() || !this.allow('wellClear', 1)) return;
    const R = RANK[rank] ?? RANK.B, t = this.ctx.currentTime, d = this.out(0.3, 0.7, true);
    const brass = (at, m, len, g = 0.03) => { this.tone(at, len, { f0: hz(m), type: 'sawtooth', gain: g, dest: d }); this.tone(at, len, { f0: hz(m) * 1.004, type: 'triangle', gain: g, dest: d }); };
    if (!R.climb) { // (D: a kind shrug, down and back up)
      brass(t, KEY + 7, 0.25, 0.11); brass(t + 0.3, KEY + 6, 0.25, 0.11); brass(t + 0.6, KEY + 7, 0.6, 0.1);
      return;
    }
    const steps = [0, 4, 7, 12, 16, 19].slice(0, R.climb + 1);
    steps.forEach((st, i) => brass(t + i * 0.09, KEY + st, i === steps.length - 1 ? 1.1 : 0.14)); // (the run up)
    const end = t + (steps.length - 1) * 0.09;
    [0, 4, 7].forEach((st) => this.tone(end, 1.1, { f0: hz(KEY + 12 + st), type: 'triangle', gain: 0.03, dest: d })); // (the chord held)
    this.tone(end, 0.4, { f0: 90, f1: 55, gain: 0.25, dest: d }); // (the kick under it)
    if (R.crash) this.noise(end, 1.4, { type: 'highpass', f0: 5000, gain: 0.12, dest: d }); // (the cymbal)
    for (let i = 0; i < R.claps; i++) this.noise(end + 0.1 + Math.random() * (0.4 + R.claps * 0.05), 0.03, { type: 'bandpass', f0: 900 + Math.random() * 900, q: 1.5, gain: 0.18, dest: d }); // (the house's applause)
  }
  wellKo() {
    if (!this.ok() || !this.allow('wellKo', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.8);
    this.noise(t, 0.12, { type: 'highpass', f0: 3000, gain: 0.2, dest: d }); this.tone(t, 0.3, { f0: hz(96), f1: hz(84), gain: 0.04, dest: d }); // (the blast line's far pop: a star going out)
    this.noise(t + 0.05, 1.8, { type: 'bandpass', f0: 700, f1: 1100, q: 0.6, gain: 0.3, attack: 0.25, dest: d }); // (the house roaring)
    this.noise(t + 0.05, 1.5, { type: 'bandpass', f0: 2200, q: 0.9, gain: 0.12, attack: 0.3, dest: d }); // (its cheer)
    for (let i = 0; i < 14; i++) this.noise(t + 0.3 + Math.random() * 1.2, 0.03, { type: 'bandpass', f0: 1000 + Math.random() * 800, q: 1.5, gain: 0.15, dest: d }); // (claps)
  }
  wellTrophy() {
    if (!this.ok() || !this.allow('wellTrophy', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.75, 0.8);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1500, q: 2, gain: 0.7, dest: d }); this.tone(t, 0.08, { f0: 400, f1: 200, type: 'triangle', gain: 0.2, dest: d }); // (the bat's crack)
    this.tone(t + 0.05, 1.1, { f0: hz(72), f1: hz(96), gain: 0.04, dest: d }); // (the long whistle up)
    this.godBell?.(t + 1.15, 2, hz(KEY + 24), 0.08, d); // (where it lands)
  }
  wellPit() {
    if (!this.ok() || !this.allow('wellPit', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.1);
    this.noise(t, 0.015, { type: 'bandpass', f0: 2400, q: 5, gain: 0.9, dest: d }); this.tone(t + 0.02, 0.05, { f0: hz(KEY + 19), gain: 0.1, dest: d }); // (a tick and a blip: again)
  }
  wellFlood() {
    if (!this.ok() || !this.allow('wellFlood', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.7);
    for (let i = 0; i < 5; i++) this.tone(t + i * 0.08, 0.1, { f0: 180 + i * 60, f1: 260 + i * 70, gain: 0.12, dest: d }); // (the glug rising)
    [0, 7, 12, 16].forEach((st) => this.tone(t + 0.45, 1.6, { f0: hz(KEY + 12 + st), gain: 0.035, dest: d })); // (full)
  }

  /** The Arena: a hit on its impact frame, by weight (Dovina's light under 6, heavy under 13, a finisher past), a shield's or a
   *  powershield's answer, a throw's thud; louder as the struck one's percent climbs (Smash's crowd-pleasing crack at high percent). */
  arenaHit(move, damage = 6, result = 'hit', percent = 0) {
    if (!this.ok() || !this.allow('arenaHit', 20) || !this.hitOk?.()) return;
    const t = this.ctx.currentTime, d = this.ctx.createGain(); d.gain.value = 2.4; d.connect(this.out(0.4, 0.3)); setTimeout(() => d.disconnect(), 2000);
    if (result === 'miss') return;
    if (result === 'shield') { this.noise(t, 0.06, { type: 'bandpass', f0: 1800, q: 3, gain: 0.35, dest: d }); this.tone(t, 0.25, { f0: 620, f1: 560, gain: 0.05, dest: d }); return; } // (a dull glass clink)
    if (result === 'power') { [88, 95].forEach((m, i) => this.tone(t + i * 0.04, 0.4, { f0: hz(m), gain: 0.06, dest: d })); this.noise(t, 0.05, { type: 'highpass', f0: 6000, gain: 0.2, dest: d }); return; } // (a bright ping: perfect)
    const w = damage < 6 ? 0 : damage < 13 ? 1 : 2, hot = Math.min(1, percent / 150), thrown = /throw$/.test(move || '');
    this.noise(t, 0.04 + w * 0.03, { type: 'bandpass', f0: thrown ? 600 : 1600 - w * 400, q: 1.2, gain: 0.45 + w * 0.12, dest: d }); // (the smack)
    this.tone(t, 0.1 + w * 0.08, { f0: 200 - w * 50, f1: 70 - w * 15, type: 'triangle', gain: 0.25 + w * 0.08, dest: d }); // (the body)
    if (w === 2) { this.tone(t, 0.5, { f0: 75, f1: 32, gain: 0.25, dest: d }); this.noise(t + 0.02, 0.25, { type: 'highpass', f0: 3500, gain: 0.15 + hot * 0.15, dest: d }); } // (a finisher's crack)
    if (move === 'nspecial') this.tone(t, 0.12, { f0: 1500, f1: 600, type: 'square', gain: 0.02, dest: d }); // (the shot's zap)
  }
  /** A foe knocked past the blast line: the house roaring over a star-KO's far pop. */
  arenaKo() { this.wellKo(); }
  /** One of your stocks lost: a falling whistle into a soft thud, the house's sigh. */
  arenaStock(left = 0) {
    if (!this.ok() || !this.allow('arenaStock', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.6);
    this.tone(t, 0.6, { f0: hz(88), f1: hz(70), gain: 0.05, dest: d }); this.tone(t + 0.55, 0.3, { f0: 110, f1: 60, type: 'triangle', gain: 0.25, dest: d });
    this.noise(t + 0.6, 0.9, { type: 'bandpass', f0: 500, f1: 350, q: 0.8, gain: 0.12, attack: 0.2, dest: d }); // (the house's "aww")
    if (!left) [0, -1, -5].forEach((st, i) => this.tone(t + 1 + i * 0.2, 0.5, { f0: hz(KEY + 12 + st), type: 'triangle', gain: 0.05, dest: d })); // (the last: a falling three)
  }
}
