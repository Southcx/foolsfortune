// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS' SOUNDS (Petra's tools/pairspecials.js, wave 1; TOOLS-TOGETHER.md 8): a main and sub's special heard as the two
// tools speaking at once, on `pair.special { pair }` and `pair.mark { kind }`:
//   THE MARK        (19, the psygun and the Veritome) the lent Flash's shutter and a target tone locking on: two notes pinged a fifth
//                   apart; the mark taken (pair.mark) a rising lock-on chirp
//   RUNG LINE       (6, the Sondelass and the Crucibelle) the toll rung down the hook's line: a bell struck and its ring running away
//                   along the wire, a twang at the far end
//   PAINTED LURE    (17, the Dreamvane and the Soul Brush) the fork's whistle in flight and a brush's wet strokes laid under it
//   COFFIN'S MOP    (3, the Lockheart and the Soul Brush) the hoover's draw with paint slurped up into it, gurgling
//
// Prior art: Kingdom Hearts' team attacks (two members' sounds fused), Devil May Cry's style-switch stings.
//
//   sfx.pairSpecial(pair) .pairMark(kind)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class PairSpecialSounds {
  pairSpecial(pair) {
    if (!this.ok() || !this.allow(`pairSpecial.${pair}`, 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.5);
    switch (pair) {
      case 19: // (The Mark)
        this.noise(t, 0.04, { type: 'highpass', f0: 3000, gain: 0.35, dest: d });
        this.tone(t + 0.05, 0.3, { f0: hz(88), gain: 0.12, dest: d }); this.tone(t + 0.15, 0.4, { f0: hz(95), gain: 0.1, dest: d });
        break;
      case 6: // (Rung Line)
        this.godBell?.(t, 1.4, hz(64), 0.15, d);
        for (let i = 0; i < 6; i++) this.tone(t + 0.05 + i * 0.06, 0.2, { f0: hz(76) * (1 - i * 0.03), gain: 0.06 - i * 0.008, dest: d }); // (running down the wire)
        this.tone(t + 0.45, 0.4, { f0: 196, f1: 180, type: 'sawtooth', gain: 0.04, dest: d }); // (the twang at the far end)
        break;
      case 17: // (Painted Lure)
        this.tone(t, 0.6, { f0: 1800, f1: 1100, gain: 0.12, dest: d }); // (the fork's whistle)
        for (let i = 0; i < 5; i++) this.noise(t + 0.1 + i * 0.1, 0.09, { type: 'bandpass', f0: 900 + i * 80, q: 2, gain: 0.6, attack: 0.02, dest: d }); // (wet strokes)
        break;
      case 3: // (Coffin's Mop)
        this.noise(t, 0.8, { type: 'bandpass', f0: 400, f1: 1600, q: 1.5, gain: 0.6, attack: 0.1, dest: d }); // (the draw)
        for (let i = 0; i < 6; i++) this.noise(t + 0.2 + i * 0.1 + Math.random() * 0.04, 0.06, { type: 'bandpass', f0: 300 + Math.random() * 400, q: 4, gain: 0.8, dest: d }); // (gurgling)
        break;
      default: this.tone(t, 0.4, { f0: hz(83), gain: 0.08, dest: d });
    }
  }
  /** A creature marked by The Mark (pair.mark): a rising lock-on chirp. */
  pairMark() {
    if (!this.ok() || !this.allow('pairMark', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3);
    [83, 88, 95].forEach((m, i) => this.tone(t + i * 0.04, 0.12, { f0: hz(m), type: 'square', gain: 0.09, dest: d }));
  }
}
