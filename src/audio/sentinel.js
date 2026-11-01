// ---------------------------------------------------------------------------------------
// A SENTINEL HEARD (placeholders: Petra's mind is in build, docs/GLOSSARY.md "a sentinel"): the island's own antibody, sent by rejection
// to find what warps it and put it right. It guards, never hunts, so it sounds like a bell-keeper, not a predator: low, patient, clay.
//   WAKE   (sentinel.wake) the ground's low hum swelling into one struck clay bell, a fifth under it
//   SEEK   (sentinel.seek) a soft two-note call, the second a step higher: asking where (spaced; it fires as it searches)
//   MEND   (sentinel.mend { by }) the call answered: the bell again, then a settling major third, the island eased; quieter if the mend
//          is the environment's own
//
// Prior art: Shadow of the Colossus's colossi waking (the low swell before the shape moves), the temple bells of Okami's restorations.
//
//   sfx.sentinelWake() .sentinelSeek() .sentinelMend(by)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const ROOT = 43; // (G2: under the island's music, out of the way of a cue's melody)

export class SentinelSounds {
  sentinelWake() {
    if (!this.ok() || !this.allow('sentinelWake', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.7);
    this.noise(t, 1.2, { type: 'lowpass', f0: 120, f1: 260, gain: 0.35, attack: 0.8, dest: d }); // (the ground's hum)
    this.tone(t, 1.3, { f0: hz(ROOT), f1: hz(ROOT) * 1.01, type: 'triangle', gain: 0.18, dest: d });
    this.godBell?.(t + 1.1, 2.5, hz(ROOT + 24), 0.08, d); this.godBell?.(t + 1.1, 2.5, hz(ROOT + 17), 0.04, d); // (the clay bell, a fifth under)
  }
  sentinelSeek() {
    if (!this.ok() || !this.allow('sentinelSeek', 0.25)) return;
    const t = this.ctx.currentTime, d = this.out(0.9, 0.6);
    [0, 2].forEach((st, i) => this.tone(t + i * 0.32, 0.5, { f0: hz(ROOT + 24 + st), type: 'triangle', gain: 0.05, dest: d })); // (where?)
  }
  sentinelMend(by = 'creature') {
    if (!this.ok() || !this.allow('sentinelMend', 1)) return;
    const t = this.ctx.currentTime, d = this.out(by === 'environment' ? 0.25 : 0.45, 0.7);
    this.godBell?.(t, 2.5, hz(ROOT + 24), 0.07, d);
    [0, 4].forEach((st, i) => this.tone(t + 0.5 + i * 0.25, 1.2, { f0: hz(ROOT + 24 + st), type: 'triangle', gain: 0.045, dest: d })); // (eased)
  }
}
