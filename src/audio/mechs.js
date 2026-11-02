// ---------------------------------------------------------------------------------------
// THE MECH'S MOUNT, THE CITY AND THE RING HEARD (docs/plans/MECHS.md; Calissa's vfx/mechs/mount.js, Dovina's world/hangar/city.js and
// ringbout.js). A giant's weight is in the low end and the room's tail; the clay band's brass is kept for the ring's crowd.
//   MOUNT   (mech.mount { beat, n }) the Pneuka Jar seated in the frame, Calissa's five beats: `lift` a hydraulic sigh off the walkway;
//           `turn` a thread's clack a half turn (n 1..3, each a step down); `lock` the Jar seated, a heavy latch and its ring; `wake` the
//           neuralese running across the shell, the Shrine Gate's way (a shimmer of little chirps climbing); `power` the eyes lit: the
//           generator spun up and a bloom
//   CITY    (city.break { cells, chunks }) masonry giving way, bigger by the cells broken, a rattle a chunk thrown; (city.felled { topple })
//           a building coming down: its groan, the floors pancaking, the dust's long roar (a topple heavier); (city.land { k, on }) a
//           chunk landing by its blow: on the ground or a roof a thud and grit, on a mech a steel clang, on the giant a straw-and-scaffold
//           thump
//   RING    the boxing ring, Punch-Out's grammar at a robot's scale: `bout.enter` and `bout.round` the bell (two rings, one), a tell before
//           a rival's blow by its tell (TELL, the move's own: the ear learns it as the eye does), `bout.strike` its blow landing on you
//           (answered: a whiff past), `bout.punch` yours (landed by k; blocked a dull clank; a counter brighter; the star's punch the
//           biggest), `bout.star` a star gained (a twinkle) or spent, `bout.hearts` winded (a dry wheeze of the frame), `bout.down` a
//           frame down and the crowd, `bout.count` the count (a bell tick a number, rising), `bout.up` back up, `bout.joint` a joint
//           strained (a creak) or snapped (a crack), `bout.over` the bell rung out (won: the crowd and a brass button; lost: one low bell)
//
// Prior art: Punch-Out!! (the tells' own sounds, the bell, the ref's count, the crowd), Pacific Rim's and Evangelion's weight (a launch's
// hydraulics, a step's sub), the Shrine Gate's wake for the neuralese (audio/shrines.js's suzu), Rock 'Em Sock 'Em's spring.
//
//   sfx.mechMount(beat, n) .cityBreak(cells, chunks) .cityFelled(topple) .cityLand(k, on) .boutBell(n) .boutTell(tell) .boutStrike(answered, k)
//      .boutPunch(e) .boutStar(stars) .boutWinded() .boutDown(who) .boutCount(n) .boutUp() .boutJoint(to) .boutOver(winner)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
/** A rival's tells (ring.js's moves' `tell`), each its own cue for the ear. */
const TELL = {
  shoulder: { f: 1760, n: 1 },       // (a jab's shoulder dip: one tink)
  cock: { f: 1320, n: 2 },           // (a hook drawn back: two)
  crouch: { f: 990, n: 1, rise: 1 }, // (an uppercut's crouch: a tink sliding up)
  beckon: { f: 660, n: 3, slow: 1 }, // (a taunt: three slow)
  hops: { f: 880, n: 3 },            // (a charge's three hops)
  blink: { f: 2640, n: 1 },          // (the champion's blink: one high)
};
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { 'mount.lift': 1.3, 'mount.turn': 3.2, 'mount.lock': 1.35, 'mount.wake': 2.6, 'mount.power': 1.45, city: 1, felled: 0.62, land: 1.25, bell: 1.45, tell: 2.6,
  strike: 1.95, punch: 4.3, star: 3.2, winded: 3.5, down: 1, up: 2, count: 5.5, 'joint.strain': 10, 'joint.snap': 1.4, won: 1.6, lost: 2 };

export class MechSounds {
  mechOut(key, gain, verb, ui = false) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb, ui)); setTimeout(() => d.disconnect(), 9000); return d; }
  /** The ring's bell: a struck brass bell, `n` rings. */
  mechBell(t, n, d, g = 0.1) { for (let i = 0; i < n; i++) { const at = t + i * 0.32; [1, 2.4, 3.9, 5.4].forEach((r, j) => this.tone(at, 1.4 / (1 + j * 0.6), { f0: 1046 * r, gain: g / (1 + j * 1.5), dest: d })); this.noise(at, 0.01, { type: 'highpass', f0: 5000, gain: g * 2, dest: d }); } }
  /** The house: a crowd's roar, `g` its size, `dur` how long. */
  mechCrowd(t, dur, g, d) { this.noise(t, dur, { type: 'bandpass', f0: 900, f1: 700, q: 0.6, gain: g, attack: dur * 0.2, dest: d }); this.noise(t, dur * 0.8, { type: 'bandpass', f0: 2200, q: 1.2, gain: g * 0.4, attack: dur * 0.15, dest: d }); }
  /** A steel blow: a clang's body and its ring. */
  mechClang(t, k, d, f = 180) { this.tone(t, 0.3 + 0.3 * k, { f0: f, f1: f * 0.6, gain: 0.3 + 0.3 * k, dest: d }); [2.7, 4.3, 6.1].forEach((r, i) => this.tone(t, 0.5 / (1 + i), { f0: f * r, gain: 0.05 * k / (1 + i), dest: d })); this.noise(t, 0.06, { type: 'bandpass', f0: 2400, q: 1, gain: 0.3 + 0.3 * k, dest: d }); }

  mechMount(beat = 'lift', n = 1) {
    if (!this.ok() || !this.allow(`mechMount.${beat}`, 6)) return;
    const t = this.ctx.currentTime, d = this.mechOut(`mount.${beat}`, 0.4, 0.6);
    switch (beat) {
      case 'lift': this.noise(t, 0.5, { type: 'bandpass', f0: 1800, f1: 900, q: 1, gain: 0.3, attack: 0.05, dest: d }); this.tone(t, 0.5, { f0: 90, f1: 130, gain: 0.15, dest: d }); break; // (the hydraulic sigh)
      case 'turn': { const s = Math.round(num(n, 1, 1, 6)); this.noise(t, 0.03, { type: 'bandpass', f0: 1400 - s * 120, q: 4, gain: 0.45, dest: d }); this.tone(t, 0.12, { f0: hz(55 - s * 2), type: 'triangle', gain: 0.2, dest: d }); break; } // (a half turn of the thread)
      case 'lock': this.mechClang(t, 0.8, d, 120); this.noise(t + 0.05, 0.04, { type: 'highpass', f0: 3000, gain: 0.3, dest: d }); break; // (the latch home)
      case 'wake': for (let i = 0; i < 12; i++) { const at = t + i * 0.08, f = hz(84 + [0, 2, 4, 7, 9][i % 5] + 12 * Math.floor(i / 5)); this.tone(at, 0.25, { f0: f, gain: 0.03, dest: d }); } this.noise(t, 1, { type: 'highpass', f0: 6000, gain: 0.05, attack: 0.5, dest: d }); break; // (the traces running out, as the Shrine Gate wakes)
      case 'power': this.tone(t, 1.4, { f0: 60, f1: 240, type: 'sawtooth', gain: 0.06, dest: d }); this.tone(t, 1.4, { f0: 120, f1: 480, gain: 0.08, dest: d }); [0, 7, 12].forEach((s) => this.tone(t + 1.1, 1.2, { f0: hz(57 + s), gain: 0.06, dest: d })); this.noise(t + 1.1, 0.4, { type: 'lowpass', f0: 2500, f1: 300, gain: 0.25, dest: d }); break; // (spun up, and the eyes lit)
      default:
    }
  }
  cityBreak(cells = 1, chunks = 0) {
    if (!this.ok() || !this.allow('cityBreak', 8)) return;
    const c = num(cells, 1, 1, 400), k = Math.min(1, Math.sqrt(c / 60)), t = this.ctx.currentTime, d = this.mechOut('city', 0.45, 0.8);
    this.noise(t, 0.06, { type: 'bandpass', f0: 1600, q: 1, gain: 0.3 + 0.4 * k, dest: d }); this.tone(t, 0.4 + 0.5 * k, { f0: 90, f1: 40, gain: 0.2 + 0.3 * k, dest: d }); // (the masonry cracking)
    this.noise(t + 0.04, 0.3 + 0.8 * k, { type: 'lowpass', f0: 2400, f1: 500, gain: 0.15 + 0.2 * k, attack: 0.03, dest: d }); // (the rubble running)
    for (let i = 0; i < Math.min(6, Math.round(num(chunks, 0, 0, 20))); i++) this.noise(t + 0.08 + Math.random() * 0.4, 0.05, { type: 'bandpass', f0: 600 + Math.random() * 900, q: 2, gain: 0.2, dest: d }); // (a chunk thrown)
  }
  cityFelled(topple = false) {
    if (!this.ok() || !this.allow('cityFelled', 1)) return;
    const t = this.ctx.currentTime, d = this.mechOut('felled', 0.5, 0.9), big = topple ? 1.4 : 1;
    this.noise(t, 1.2, { type: 'bandpass', f0: 260, f1: 160, q: 3, gain: 0.25, attack: 0.6, dest: d }); this.tone(t, 1.2, { f0: 50, f1: 38, type: 'sawtooth', gain: 0.03, dest: d }); // (its groan)
    for (let i = 0; i < 5; i++) { const at = t + 1 + i * 0.18 * big; this.tone(at, 0.6, { f0: 70 - i * 5, f1: 32, gain: 0.3 * big, dest: d }); this.noise(at, 0.12, { type: 'lowpass', f0: 1400, gain: 0.3, dest: d }); } // (the floors pancaking)
    this.noise(t + 1.3, 3 * big, { type: 'lowpass', f0: 900, f1: 150, gain: 0.25 * big, attack: 0.3, dest: d }); // (the dust's roar)
  }
  cityLand(k = 0.5, on = 'ground') {
    if (!this.ok() || !this.allow('cityLand', 8)) return;
    const s = num(k, 0.5, 0, 3), w = Math.min(1, s), t = this.ctx.currentTime, d = this.mechOut('land', 0.4, 0.8);
    if (on === 'mech') { this.mechClang(t, w, d, 150); return; }
    if (on === 'giant') { this.noise(t, 0.3, { type: 'highpass', f0: 2500, gain: 0.3 * w, dest: d }); this.tone(t, 0.4, { f0: 110, f1: 60, gain: 0.3 * w, dest: d }); this.noise(t + 0.03, 0.08, { type: 'bandpass', f0: 700, q: 3, gain: 0.25 * w, dest: d }); return; } // (straw and scaffold)
    this.tone(t, 0.3 + 0.5 * w, { f0: 80, f1: 34, gain: 0.25 + 0.3 * w, dest: d }); this.noise(t, 0.2 + 0.4 * w, { type: 'lowpass', f0: 1800, f1: 400, gain: 0.2 + 0.2 * w, dest: d }); // (the thud and its grit)
  }
  boutBell(n = 1) {
    if (!this.ok() || !this.allow('boutBell', 2)) return;
    const t = this.ctx.currentTime, d = this.mechOut('bell', 0.35, 0.5);
    this.mechBell(t, Math.round(num(n, 1, 1, 3)), d);
    if (n > 1) this.mechCrowd(t, 1.8, 0.12, d);
  }
  boutTell(tell = 'shoulder') {
    if (!this.ok() || !this.allow('boutTell', 6)) return;
    const T = TELL[tell] ?? TELL.shoulder, t = this.ctx.currentTime, d = this.mechOut('tell', 0.3, 0.3, true);
    for (let i = 0; i < T.n; i++) { const at = t + i * (T.slow ? 0.3 : 0.12); this.tone(at, 0.15, { f0: T.f, f1: T.rise ? T.f * 1.5 : T.f, type: 'triangle', gain: 0.1, dest: d }); this.tone(at, 0.08, { f0: T.f * 2, gain: 0.03, dest: d }); }
  }
  boutStrike(answered = false, k = 0.5) {
    if (!this.ok() || !this.allow('boutStrike', 8)) return;
    const w = num(k, 0.5, 0, 2), t = this.ctx.currentTime, d = this.mechOut('strike', 0.4, 0.4);
    if (answered) { this.noise(t, 0.25, { type: 'bandpass', f0: 2000, f1: 600, q: 1.2, gain: 0.8, dest: d }); return; } // (a whiff past)
    this.mechClang(t, Math.min(1, w), d, 110); this.tone(t, 0.4, { f0: 60, f1: 35, gain: 0.3 * Math.min(1, w), dest: d }); // (its blow on you)
  }
  boutPunch(e = {}) {
    if (!this.ok() || !this.allow('boutPunch', 10)) return;
    const t = this.ctx.currentTime, d = this.mechOut('punch', 0.4, 0.45), k = Math.min(1.5, num(e.k, 0.5, 0, 3));
    if (e.blocked) { this.tone(t, 0.15, { f0: 140, f1: 100, type: 'triangle', gain: 0.3, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 900, gain: 0.3, dest: d }); return; } // (the guard's dull clank)
    this.noise(t, 0.12, { type: 'bandpass', f0: e.high ? 1800 : 1200, f1: 400, q: 0.8, gain: 0.25, dest: d }); // (the swing)
    this.mechClang(t + 0.05, Math.min(1, 0.4 + k * 0.5), d, e.high ? 220 : 170);
    if (e.counter) this.tone(t + 0.05, 0.3, { f0: 2093, gain: 0.05, dest: d }); // (a counter's glint)
    if (e.star) { this.tone(t + 0.05, 0.9, { f0: 55, f1: 30, gain: 0.5, dest: d }); this.mechCrowd(t + 0.1, 1.2, 0.15, d); } // (the star's punch)
  }
  boutStar(stars = 0) {
    if (!this.ok()) return;
    const s = Math.round(num(stars, 0, 0, 3)), was = this.mechStars ?? 0; this.mechStars = s;
    const t = this.ctx.currentTime, d = this.mechOut('star', 0.3, 0.4, true);
    if (s > was) [0, 4, 7].forEach((m, i) => this.tone(t + i * 0.05, 0.4, { f0: hz(88 + m + (s - 1) * 2), gain: 0.05, dest: d })); // (a star gained)
    else if (s < was) this.tone(t, 0.3, { f0: hz(84), f1: hz(76), type: 'triangle', gain: 0.04, dest: d }); // (lost, or spent)
  }
  boutWinded() {
    if (!this.ok() || !this.allow('boutWinded', 1)) return;
    const t = this.ctx.currentTime, d = this.mechOut('winded', 0.35, 0.3);
    for (let i = 0; i < 2; i++) this.noise(t + i * 0.45, 0.35, { type: 'bandpass', f0: 700, f1: 400, q: 2, gain: 0.25, attack: 0.1, dest: d }); // (the frame's dry wheeze)
  }
  boutDown(who = 'foe') {
    if (!this.ok() || !this.allow('boutDown', 1)) return;
    const t = this.ctx.currentTime, d = this.mechOut('down', 0.45, 0.8);
    this.mechClang(t, 1, d, 90); this.tone(t, 1, { f0: 50, f1: 28, gain: 0.5, dest: d }); this.noise(t + 0.05, 0.8, { type: 'lowpass', f0: 1200, f1: 200, gain: 0.3, dest: d }); // (a frame down on the mat)
    this.mechCrowd(t + 0.2, 2.2, who === 'foe' ? 0.22 : 0.12, d);
  }
  boutCount(n = 1) {
    if (!this.ok() || !this.allow('boutCount', 4)) return;
    const c = Math.round(num(n, 1, 1, 10)), t = this.ctx.currentTime, d = this.mechOut('count', 0.3, 0.3, true);
    this.tone(t, 0.25, { f0: hz(72 + c), type: 'triangle', gain: 0.1, dest: d }); this.noise(t, 0.015, { type: 'bandpass', f0: 3000, q: 3, gain: 0.25, dest: d }); // (the ref's tick, rising a number)
  }
  boutUp() {
    if (!this.ok() || !this.allow('boutUp', 1)) return;
    const t = this.ctx.currentTime, d = this.mechOut('up', 0.4, 0.6);
    this.noise(t, 0.6, { type: 'bandpass', f0: 1200, f1: 700, q: 1, gain: 0.2, attack: 0.1, dest: d }); this.tone(t, 0.6, { f0: 80, f1: 140, gain: 0.15, dest: d }); // (hydraulics up off the mat)
    this.mechCrowd(t + 0.3, 1.2, 0.1, d);
  }
  boutJoint(to = 'fractured') {
    if (!this.ok() || !this.allow('boutJoint', 4)) return;
    const t = this.ctx.currentTime, d = this.mechOut(to === 'snapped' ? 'joint.snap' : 'joint.strain', 0.4, 0.4);
    if (to === 'snapped') { this.noise(t, 0.05, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); this.mechClang(t, 0.7, d, 260); return; } // (a joint snapped)
    for (let i = 0; i < 5; i++) this.noise(t + i * 0.04, 0.03, { type: 'bandpass', f0: 500 + i * 120, q: 8, gain: 0.3, dest: d }); // (a joint strained: steel creaking)
  }
  boutOver(winner = 'me') {
    if (!this.ok() || !this.allow('boutOver', 1)) return;
    this.mechStars = 0;
    const t = this.ctx.currentTime, d = this.mechOut(winner === 'me' ? 'won' : 'lost', 0.4, 0.6);
    if (winner === 'me') { this.mechBell(t, 3, d); this.mechCrowd(t + 0.3, 3, 0.25, d); [0, 4, 7, 12].forEach((s, i) => this.tone(t + 1 + i * 0.12, 0.5 + (i === 3 ? 0.8 : 0), { f0: hz(60 + s), type: 'sawtooth', gain: 0.025, dest: d })); return; } // (the bell rung out, the house up and a brass button)
    this.mechBell(t, 1, d, 0.07); this.tone(t + 0.3, 1.6, { f0: hz(48), f1: hz(47), gain: 0.08, dest: d }); // (one low bell)
  }
}
