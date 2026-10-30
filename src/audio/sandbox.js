// ---------------------------------------------------------------------------------------
// THE SANDBOX AND THE THROWN HIT HEARD (Dovina's docs/plans/SANDBOX.md; Petra's world/impacts.js and world/sandbox/): a loose thing the
// hand throws or a foot kicks striking a creature anywhere, and the god hand's physics hall at play.
//   THE THROWN HIT  (impact.hit { energy, heavy }) a thud by the energy carried: a sting's slap at 40 J, the body's thump climbing,
//                   from 250 J a heavy crunch with a sub drop; a strike (impact.strike { n }) three or more struck by one throw, a
//                   rising run of bowling-pin knocks, one a body
//   THE PITCH       a kick (sandbox.kick) a leather thock; a goal (sandbox.goal { dist }) the net's swish and a cheer of clapperjar
//                   claps, longer for a long shot; keepy-uppy (sandbox.juggle { n }) a soft tap rising a step each touch
//   THE YARD        restocked at the rack (sandbox.rack) crates stacked down; the pen (sandbox.pen) a gate's latch; the ground put
//                   back (sandbox.ground) sand smoothed under a wash; the hall entered (sandbox.enter) its wide room's hum
//
// Prior art: Dawn of Mana's physics (a thrown crate's weight in its sound), Rocket League's goal horn and the ball's thock, bowling's
// strike, Half-Life 2's gravity gun clatter.
//
//   sfx.impactHit(energy, heavy) .impactStrike(n) .sandboxKick() .sandboxGoal(dist) .sandboxJuggle(n) .sandboxRack() .sandboxPen()
//   .sandboxGround() .sandboxEnter()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const HIT = { sting: 40, heavy: 250 }; // (J: Dovina's IMPACT, a sting at 40, heavy from 250)

export class SandboxSounds {
  impactHit(energy = 60, heavy = false) {
    if (!this.ok() || !this.allow('impactHit', 10) || !this.hitOk?.()) return;
    const t = this.ctx.currentTime, k = Math.min(1, Math.max(0, (energy - HIT.sting) / (HIT.heavy - HIT.sting))), d = this.out(0.3 + 0.1 * k, 0.3);
    this.noise(t, 0.05 + 0.05 * k, { type: 'lowpass', f0: 2400 - 1400 * k, gain: 0.35 + 0.05 * k, dest: d }); // (the slap, darker as it weighs)
    this.tone(t, 0.12 + 0.12 * k, { f0: 220 - 120 * k, f1: 90 - 40 * k, type: 'triangle', gain: 0.2 + 0.05 * k, dest: d }); // (the body's thump)
    if (heavy) { this.tone(t, 0.45, { f0: 70, f1: 32, gain: 0.15, dest: d }); for (let i = 0; i < 5; i++) this.noise(t + 0.03 + Math.random() * 0.15, 0.03, { type: 'bandpass', f0: 900 + Math.random() * 1500, q: 3, gain: 0.2, dest: d }); } // (heavy: a crunch, a drop)
  }
  impactStrike(n = 3) {
    if (!this.ok() || !this.allow('impactStrike', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5);
    for (let i = 0; i < Math.min(n, 8); i++) { const at = t + i * 0.07; this.noise(at, 0.03, { type: 'bandpass', f0: 1500 + i * 150, q: 3, gain: 0.3, dest: d }); this.tone(at, 0.15, { f0: hz(72 + i * 2), type: 'triangle', gain: 0.06, dest: d }); } // (pins going down, one a body)
    this.tone(t + Math.min(n, 8) * 0.07, 0.8, { f0: hz(84), gain: 0.06, dest: d }); this.tone(t + Math.min(n, 8) * 0.07, 0.8, { f0: hz(91), gain: 0.05, dest: d }); // (the strike)
  }
  sandboxKick() {
    if (!this.ok() || !this.allow('sandboxKick', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3);
    this.noise(t, 0.04, { type: 'bandpass', f0: 700, q: 1.5, gain: 0.5, dest: d }); this.tone(t, 0.1, { f0: 160, f1: 90, type: 'triangle', gain: 0.3, dest: d }); // (the leather's thock)
  }
  sandboxGoal(dist = 10) {
    if (!this.ok() || !this.allow('sandboxGoal', 1)) return;
    const t = this.ctx.currentTime, long = Math.min(1, Math.max(0, (dist - 10) / 30)), d = this.out(0.4, 0.6);
    this.noise(t, 0.5, { type: 'bandpass', f0: 2500, f1: 1200, q: 0.8, gain: 0.3, attack: 0.03, dest: d }); // (the net's swish)
    const claps = 6 + Math.round(10 * long);
    for (let i = 0; i < claps; i++) this.noise(t + 0.25 + i * 0.07 + Math.random() * 0.03, 0.03, { type: 'bandpass', f0: 1100 + Math.random() * 500, q: 1.5, gain: 0.2, dest: d }); // (clapperjars clapping)
    [0, 4, 7, 12].forEach((st, i) => this.tone(t + 0.2 + i * 0.07, 0.6 + long, { f0: hz(72 + st), type: 'triangle', gain: 0.06, dest: d }));
  }
  sandboxJuggle(n = 1) {
    if (!this.ok() || !this.allow('sandboxJuggle', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.3), step = [0, 2, 4, 7, 9][(n - 1) % 5] + 12 * Math.floor(((n - 1) % 15) / 5);
    this.noise(t, 0.03, { type: 'bandpass', f0: 900, q: 1.5, gain: 0.7, dest: d }); this.tone(t, 0.2, { f0: hz(67 + step), type: 'triangle', gain: 0.14, dest: d }); // (a tap, a step up)
  }
  sandboxRack() {
    if (!this.ok() || !this.allow('sandboxRack', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4);
    for (let i = 0; i < 4; i++) { this.noise(t + i * 0.12, 0.05, { type: 'lowpass', f0: 1100, gain: 0.3, dest: d }); this.tone(t + i * 0.12, 0.1, { f0: 140 - i * 10, type: 'triangle', gain: 0.18, dest: d }); } // (crates stacked down)
  }
  sandboxPen() {
    if (!this.ok() || !this.allow('sandboxPen', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3);
    this.noise(t, 0.04, { type: 'bandpass', f0: 2200, q: 3, gain: 0.3, dest: d }); this.tone(t + 0.05, 0.12, { f0: 520, f1: 420, type: 'triangle', gain: 0.1, dest: d }); // (the gate's latch)
  }
  sandboxGround() {
    if (!this.ok() || !this.allow('sandboxGround', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.noise(t, 1.2, { type: 'bandpass', f0: 3000, f1: 900, q: 0.7, gain: 0.18, attack: 0.3, dest: d }); // (the sand smoothed under a wash)
    this.tone(t + 0.8, 1.0, { f0: hz(72), gain: 0.04, dest: d }); this.tone(t + 0.9, 1.0, { f0: hz(79), gain: 0.035, dest: d });
  }
  sandboxEnter() {
    if (!this.ok() || !this.allow('sandboxEnter', 0.2)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.9);
    this.tone(t, 2.5, { f0: 98, type: 'triangle', gain: 0.08, dest: d }); this.tone(t + 0.2, 2.2, { f0: 147, gain: 0.04, dest: d }); // (the hall's wide hum)
  }
}
