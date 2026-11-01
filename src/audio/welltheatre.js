// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S THEATRE HEARD (South, 2026-11-01: Japanese theatre all through the Well; Calissa's looks and events on her branch):
// kabuki's wood, Noh's hayashi and bunraku's stagehands, played by Calissa's events at the moment her looks land.
//   THE HYOSHIGI   (well.hyoshigi { kind }) two oak clappers struck together: 'open' the ki's accelerating roll as a stage starts (the
//                  curtain running), 'close' two sharp claps at a clear, 'ki' one clack
//   THE TSUKE      (well.tsuke { kind }) the board at stage left beaten with two blocks: 'battari' the double hit on a pose (ba-TTA),
//                  'batabata' a running roll under a dash or a launch
//   THE MIE        (well.mie) a held pose: the tsuke's battari under it and a shout from the house (kakegoe: "Yo!", "Ha!", "Iyo!"),
//                  the voice made of a glottal buzz through vowel formants
//   THE HAYASHI    (well.noh { kind }) 'kotsuzumi' the shoulder drum's soft pon, its pitch bent by the squeeze of the cords, after the
//                  drummer's long "yo-oo"; 'otsuzumi' the hip drum's dry, cracking kan after a sharp "ha!"; 'fue' the nohkan's hishigi,
//                  the piercing overblown shriek that opens a Noh
//   THE KUROGO     (well.kurogo.enter / .leave) stagehands in black: soft tabi footfalls and a cloth's rustle, nearly silent (the joke)
//   THE GHOST DRUM (well.dorodoro) the low taiko roll for a yurei, swelling and gone
//
// Prior art: kabuki's ki (the kyogen-kata's hyoshigi) and tsuke-uchi, the kakegoe of the omukou-san in the gallery, Noh's hayashi (fue,
// kotsuzumi, otsuzumi), the geza's dorodoro; Okami's and Muramasa's use of them in games.
//
//   sfx.wellHyoshigi(kind) .wellTsuke(kind) .wellMie() .wellNoh(kind) .wellKurogo(leaving) .wellDorodoro()
// ---------------------------------------------------------------------------------------

/** The vowels a shout is made of: three formants (Hz) and their gains. */
const VOWEL = { o: [450, 800, 2830], a: [730, 1090, 2440], i: [270, 2290, 3010], u: [300, 870, 2240] };

export class WellTheatreSounds {
  /** One clack of the hyoshigi: hard oak on oak, a bright knock with a short ring. */
  hyoshigiClack(t, d, g = 1) {
    this.noise(t, 0.025, { type: 'bandpass', f0: 2600, q: 3, gain: 1.2 * g, dest: d });
    this.tone(t, 0.07, { f0: 1850, f1: 1780, gain: 0.16 * g, dest: d }); this.tone(t, 0.05, { f0: 3100, gain: 0.06 * g, dest: d });
  }
  wellHyoshigi(kind = 'ki') {
    if (!this.ok() || !this.allow(`wellHyoshigi.${kind}`, 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.5);
    if (kind === 'open') { let at = 0, gap = 0.32; for (let i = 0; i < 22; i++) { this.hyoshigiClack(t + at, d, 0.5 + 0.5 * Math.min(1, i / 14)); at += gap; gap = Math.max(0.045, gap * 0.86); } return; } // (the roll, quickening as the curtain runs)
    if (kind === 'close') { this.hyoshigiClack(t, d, 1.1); this.hyoshigiClack(t + 0.42, d, 1.2); return; } // (two sharp claps)
    this.hyoshigiClack(t + 0.01, d, 1);
  }
  /** One beat of the tsuke: a block slapped flat on the board, a woody crack with the board's boom under it. */
  tsukeHit(t, d, g = 1) {
    this.noise(t, 0.02, { type: 'bandpass', f0: 1500, q: 2, gain: 0.8 * g, dest: d });
    this.tone(t, 0.12, { f0: 240, f1: 160, type: 'triangle', gain: 0.25 * g, dest: d });
  }
  wellTsuke(kind = 'battari') {
    if (!this.ok() || !this.allow(`wellTsuke.${kind}`, 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.4);
    if (kind === 'batabata') { for (let i = 0; i < 9; i++) this.tsukeHit(t + i * 0.075, d, i % 2 ? 0.6 : 0.85); return; } // (the running roll)
    this.tsukeHit(t, d, 0.8); this.tsukeHit(t + 0.13, d, 1.3); // (ba-TTA)
  }
  /** A voice: a glottal buzz at f0 (gliding to f1) through a vowel's formants, its onset another vowel's (y = i into o). */
  shout(t, dur, { f0 = 220, f1 = f0, vowel = 'o', from = null, breath = 0, gain = 0.25, dest } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.05, dur * 0.2)); g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.12);
    const to = VOWEL[vowel], start = from ? VOWEL[from] : to;
    to.forEach((f, k) => {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6 + k * 3;
      bp.frequency.setValueAtTime(start[k], t); bp.frequency.linearRampToValueAtTime(f, t + Math.min(0.12, dur * 0.4));
      const fg = c.createGain(); fg.gain.value = [1, 0.6, 0.25][k]; o.connect(bp).connect(fg).connect(g);
    });
    g.connect(dest); o.start(t); o.stop(t + dur + 0.5); setTimeout(() => g.disconnect(), (dur + 1) * 1000);
    if (breath) this.noise(t, 0.08, { type: 'bandpass', f0: 1400, q: 1, gain: breath, dest }); // (the h's breath)
  }
  wellMie() {
    if (!this.ok() || !this.allow('wellMie', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.6);
    this.tsukeHit(t, d, 0.8); this.tsukeHit(t + 0.13, d, 1.3); // (battari under the pose)
    const pick = Math.floor(Math.random() * 3), at = t + 0.35;
    if (pick === 0) this.shout(at, 0.4, { f0: 190, f1: 150, vowel: 'o', from: 'i', gain: 0.3, dest: d }); // ("Yo!")
    else if (pick === 1) this.shout(at, 0.3, { f0: 210, f1: 170, vowel: 'a', breath: 0.25, gain: 0.3, dest: d }); // ("Ha!")
    else { this.shout(at, 0.18, { f0: 200, vowel: 'i', gain: 0.25, dest: d }); this.shout(at + 0.16, 0.4, { f0: 230, f1: 170, vowel: 'o', from: 'i', gain: 0.3, dest: d }); } // ("I-yo!")
  }
  wellNoh(kind = 'kotsuzumi') {
    if (!this.ok() || !this.allow(`wellNoh.${kind}`, 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.7);
    if (kind === 'fue') { // (the hishigi: the nohkan overblown into a shriek, a breath first)
      this.noise(t, 0.25, { type: 'bandpass', f0: 2500, q: 2, gain: 0.08, attack: 0.15, dest: d });
      this.tone(t + 0.12, 1.1, { f0: 2350, f1: 2900, gain: 0.12, dest: d }); this.tone(t + 0.12, 1.1, { f0: 4700, f1: 5800, gain: 0.025, dest: d });
      this.noise(t + 0.12, 1.0, { type: 'bandpass', f0: 2800, q: 8, gain: 0.05, dest: d });
      return;
    }
    if (kind === 'otsuzumi') { // ("Ha!" then the hip drum's dry crack)
      this.shout(t, 0.25, { f0: 160, f1: 130, vowel: 'a', breath: 0.25, gain: 0.25, dest: d });
      const k = t + 0.32; this.noise(k, 0.03, { type: 'highpass', f0: 2500, gain: 0.3, dest: d }); this.tone(k, 0.09, { f0: 820, f1: 700, type: 'triangle', gain: 0.12, dest: d });
      return;
    }
    // ("Yo-oo" drawn out, then the shoulder drum's pon, its head squeezed so the pitch bends up)
    this.shout(t, 1.0, { f0: 150, f1: 120, vowel: 'o', from: 'i', gain: 0.22, dest: d });
    const p = t + 1.05; this.tone(p, 0.6, { f0: 330, f1: 420, type: 'triangle', gain: 0.25, dest: d }); this.tone(p, 0.35, { f0: 660, f1: 840, gain: 0.05, dest: d });
    this.noise(p, 0.02, { type: 'bandpass', f0: 1200, q: 2, gain: 0.2, dest: d });
  }
  wellKurogo(leaving = false) {
    if (!this.ok() || !this.allow('wellKurogo', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.2);
    for (let i = 0; i < 6; i++) this.noise(t + i * 0.13 + Math.random() * 0.02, 0.05, { type: 'lowpass', f0: 600, gain: 0.18, attack: 0.01, dest: d }); // (tabi on the boards)
    this.noise(t + (leaving ? 0 : 0.2), 0.5, { type: 'bandpass', f0: 2600, f1: 1800, q: 0.7, gain: 0.1, attack: 0.15, dest: d }); // (the black cloth's rustle)
  }
  wellDorodoro() {
    if (!this.ok() || !this.allow('wellDorodoro', 0.3)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.6), n = 40;
    for (let i = 0; i < n; i++) { const k = Math.sin(Math.PI * i / n); this.tone(t + i * 0.07, 0.25, { f0: 62, f1: 48, gain: 0.06 + 0.2 * k, dest: d }); } // (the low taiko roll, swelling and gone)
  }
}
