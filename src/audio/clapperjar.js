// ---------------------------------------------------------------------------------------
// THE ABERRANT CLAPPERJAR'S DUEL HEARD (Dovina's ABERRANTS.md 5.2, progress/duel/secrets.js `clapback`, foeskills.js). Its clap is a
// layer of the duel's cue on the beat (music/duel.js `mirth`): the ear is the tell. These are its moments over that, in fired clay
// (a clapperjar is earthenware: two hollow pots knocked together), never a sound that names the secret.
//   KEPT     (secret.step { id: 'clapback', kept, streak }) a drag let go on its clap: it claps back, softly, a call answered (two quiet
//            clay claps a beat apart, a step brighter a streak); off its clap, nothing
//   HALF     (secret.half { id: 'clapback' }) it notices: a hard double clap, a little ragged, and a wobble in its clay
//   APART    (duel.secret { id: 'clapback' }) it claps itself to pieces: claps running faster and faster, the clay cracking, a last clap
//            and its pieces raining down, a laugh of the marimba
//   SHUFFLE  (foe.skill 'shuffle', after its cut-in) gems tossed in the air and swapped: a riffle of clicks and a shaker's toss
//   OFFBEAT  (foe.skill 'syncopate' { off }) its clap moved: a woodblock's two knocks, the second on the "and" (back: on the beat)
//   ENCORE   (power { power: 'encore' }, yours once learned) the house calling for more: a clay clap and a short rising whistle
//
// Prior art: Rhythm Heaven's call-and-response claps, Parappa's teacher answering a line kept, the busker's crowd clapping along, the
// clapperjars' own knock in the world (audio/world.js's clay).
//
//   sfx.duelClapBack(kept, streak) .duelClapHalf() .duelClapApart() .duelShuffle(n) .duelSyncopate(off) .duelEncore()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { kept: 1.4, half: 1.75, apart: 0.44, shuffle: 2.8, offbeat: 1.55, encore: 6.8 };

export class ClapperDuelSounds {
  clapOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb, true)); setTimeout(() => d.disconnect(), 6000); return d; }
  /** Two hollow pots knocked: a clay clap, `f` its body. */
  clayClap(t, f, g, d) { this.noise(t, 0.03, { type: 'bandpass', f0: f * 4, q: 2, gain: g, dest: d }); this.tone(t, 0.09, { f0: f, f1: f * 0.85, type: 'triangle', gain: g * 0.5, dest: d }); }
  clapSpb() { const c = this.musicGrid?.(); return c?.spb > 0 ? c.spb : 60 / 132; }

  duelClapBack(kept = false, streak = 0) {
    if (!kept || !this.ok() || !this.allow('duelClapBack', 3)) return;
    const t = this.ctx.currentTime, d = this.clapOut('kept', 0.3, 0.35), spb = this.clapSpb(), up = Math.min(3, Math.max(1, streak | 0)) * 2;
    [0, 1].forEach((i) => this.clayClap(t + spb * (0.5 + i), 330 + up * 20, 0.25 - i * 0.07, d)); // (a call answered, softly, on the next two "and"s)
  }
  duelClapHalf() {
    if (!this.ok() || !this.allow('duelClapHalf', 1)) return;
    const t = this.ctx.currentTime, d = this.clapOut('half', 0.35, 0.4);
    this.clayClap(t, 300, 0.45, d); this.clayClap(t + 0.09, 320, 0.4, d); // (a hard double clap, ragged)
    this.tone(t + 0.15, 0.5, { f0: 260, f1: 240, type: 'triangle', gain: 0.06, dest: d }); this.tone(t + 0.15, 0.5, { f0: 263, f1: 236, type: 'triangle', gain: 0.05, dest: d }); // (a wobble in its clay)
  }
  duelClapApart() {
    if (!this.ok() || !this.allow('duelClapApart', 0.5)) return;
    const t = this.ctx.currentTime, d = this.clapOut('apart', 0.4, 0.6);
    let at = t; for (let i = 0; i < 14; i++) { this.clayClap(at, 300 + i * 12, 0.3, d); at += Math.max(0.04, 0.3 * Math.pow(0.82, i)); } // (faster and faster)
    this.noise(at, 0.06, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); this.tone(at, 0.4, { f0: 180, f1: 70, gain: 0.3, dest: d }); // (the last clap: the clay cracks)
    for (let i = 0; i < 9; i++) this.noise(at + 0.08 + Math.random() * 0.6, 0.02, { type: 'bandpass', f0: 1500 + Math.random() * 2500, q: 3, gain: 0.2, dest: d }); // (its pieces raining down)
    [0, 4, 7, 12, 16].forEach((s, i) => this.tone(at + 0.5 + i * 0.07, 0.2, { f0: hz(72 + s), type: 'triangle', gain: 0.05, dest: d })); // (Mirth's laugh, up the marimba)
  }
  duelShuffle(n = 6) {
    if (!this.ok() || !this.allow('duelShuffle', 2)) return;
    const t = this.ctx.currentTime, d = this.clapOut('shuffle', 0.3, 0.35), c = Math.max(2, Math.min(8, n | 0));
    this.noise(t, 0.25, { type: 'bandpass', f0: 5000, q: 1, gain: 0.2, attack: 0.05, dest: d }); // (the toss)
    for (let i = 0; i < c; i++) this.tone(t + 0.25 + i * 0.05, 0.06, { f0: hz(79 + [0, 4, 2, 7, 5, 9, 7, 12][i]), type: 'triangle', gain: 0.06, dest: d }); // (each gem caught where it lands)
  }
  duelSyncopate(off = true) {
    if (!this.ok() || !this.allow('duelSyncopate', 2)) return;
    const t = this.ctx.currentTime, d = this.clapOut('offbeat', 0.3, 0.3), spb = this.clapSpb();
    const knock = (at, f) => { this.noise(at, 0.02, { type: 'bandpass', f0: f * 3, q: 4, gain: 0.35, dest: d }); this.tone(at, 0.06, { f0: f, type: 'triangle', gain: 0.15, dest: d }); };
    knock(t, 620); knock(t + spb * (off ? 0.5 : 1), off ? 700 : 560); // (the second knock on the "and", or back on the beat)
  }
  duelEncore() {
    if (!this.ok() || !this.allow('duelEncore', 1)) return;
    const t = this.ctx.currentTime, d = this.clapOut('encore', 0.3, 0.4);
    this.clayClap(t, 340, 0.35, d); this.tone(t + 0.08, 0.35, { f0: 1200, f1: 2400, gain: 0.05, dest: d }); // (a clap and a rising whistle: once more)
  }
}
