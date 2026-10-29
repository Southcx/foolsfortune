// ---------------------------------------------------------------------------------------
// THE PUZZLE DUEL'S BIG MOMENTS (PUZZLE-DUELS.md 23 and the round of 2026-10-28, South's): the stings under the aberrant's cut-ins and
// the casts of the seven duel powers. A bank of the one mixer (audio/sfx.js); the duel's other sounds are audio/puzzleduel.js.
//   A CUT-IN'S STING   duelCutIn(skill): the JRPG frame across the screen (Calissa's, played before the cast), heard as a blade of air sweeping it in and an
//                      orchestra hit in the foe's dark below the cue's key, each skill its own chord (Hurl a diminished stab, Petrify a
//                      cluster over glass, Seal a tritone on an anvil, Sap a stab bent down, Reclaim a bare fifth hammered, Kindle a
//                      Lydian flare, bright and wrong), then a
//                      reversed cymbal's tail through its hold, into the skill's own sound (puzzleduel.js, on foe.skill after it)
//   THE LIMIT BREAK    duelCutIn('desperate'): the largest: a swell under the dimming screen, the frame's slam (a sub's drop, taiko, crash), a minor
//                      cluster held by voices and brass, a stutter of the data showing through, a ring left a bar
//   A DUEL POWER       duelPower(domain): each power its god power's sound in small (audio/godpowers.js: the ear already knows the
//                      domain's family) and a glass note in the duel's key as it touches the board: Ouranurgy's two pings trading
//                      sides (Swap), Manifestation's totem rising (Raise), Divination's read (Scan), Psychokinesis's slab lifted and set
//                      (Lift), Possession's herding whistle (Herd), Alteration's transmute (Transmute), Spellscription's ward in small (a
//                      brush round, a bell on the key: the miracle's weather)
//   ITS FEELING        manifest / transmute / herd { colour }: that gem's note struck twice (duelPowerColour); miracle: the colour's bell (a Tune's)
//   THE TURN'S STING   turn { side } (duelTurnCutIn): the turn's change cut in as a skill's is, smaller: yours the Answer's step up on
//                      bright brass, the aberrant's the Five falling, minor to diminished, in its dark
//   NOTED              duel.seen (a foe skill learned the first time): a page's flick, two soft notes up to the key (duelSeen)
// Heard as the view plays them (duelEvent, puzzleduel.js), at the cut-in's start: foe.skill (its slam CUT_IN_LEAD after, held
// CUT_IN_HOLD, the skill's own sound when its cast begins) and foe.desperate (the limit break: a swell, the slam 1.1 s in), and a power's
// cast (`power` { power, domain }, Dovina's DUEL_POWERS, PUZZLE-DUELS.md 24).
// Prior art: Final Fantasy's limit breaks and the Persona series' all-out cut-ins (the frame, the stab, the held beat), Puzzle & Dragons'
// enemy skill stings, the orchestra hit as the genre's punctuation (Fairlight's ORCH5).
//
//   sfx.duelCutIn(skill)   sfx.duelPower(domain, e)
// ---------------------------------------------------------------------------------------
import { duelRoot, FEELING_STEP } from './puzzleduel.js';

/** Real s from the event to the cut-in's slam (Calissa's label: 0.12 a skill's; 1.1 the limit break's, after its swell). */
export const CUT_IN_LEAD = { skill: 0.12, desperate: 1.1 };
/** Real s each cut-in holds after its slam (Calissa's vfx/duelview/cutin.js: a skill's 0.62; the limit break's to its end at 1.75), then 0.16 out. */
export const CUT_IN_HOLD = { skill: 0.62, desperate: 0.65 };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** Each cut-in's chord, semitones over the foe's root (two octaves under the duel's key). */
const STAB = { hurl: [0, 3, 6, 9], petrify: [0, 1, 2, 13], seal: [0, 6, 12], sap: [0, 3, 7], reclaim: [0, 7, 12], kindle: [0, 4, 6, 11], desperate: [0, 1, 3, 7, 13] };

export class DuelCastSounds {
  /** The sting under a foe skill's cut-in (`desperate`: the limit break, the largest). */
  duelCutIn(skill = 'hurl') {
    if (!this.ok() || !this.allow('duelCutIn', 1.5)) return 0;
    const big = skill === 'desperate', lead = big ? CUT_IN_LEAD.desperate : CUT_IN_LEAD.skill, t = this.ctx.currentTime + lead, r = duelRoot(this) - 36, chord = STAB[skill] || STAB.hurl;
    const d = this.duelOut?.(big ? 0.42 : 0.42, big ? 0.9 : 0.6, 0.3) ?? this.out(0.42, 0.6, true);
    if (big) { this.riser(t - lead, lead, { f0: 200, f1: 3200, type: 'sawtooth', gain: 0.06, q: 1.5, dest: d }); this.noise(t - lead, lead, { type: 'highpass', f0: 900, f1: 6000, gain: 0.14, attack: lead * 0.8, dest: d }); } // (the limit break's swell into the flash)
    this.noise(t - lead, lead + 0.04, { type: 'bandpass', f0: 900, f1: 5000, q: 0.9, gain: big ? 0.35 : 0.25, attack: 0.1, dest: d }); // (the frame sweeping across: a blade of air)
    this.tone(t, big ? 1.4 : 0.6, { f0: big ? 70 : 90, f1: 32, gain: big ? 0.8 : 0.5, dest: d }); this.noise(t, 0.08, { type: 'lowpass', f0: 2500, gain: big ? 0.6 : 0.4, dest: d }); // (the slam)
    const ring = (big ? CUT_IN_HOLD.desperate : CUT_IN_HOLD.skill) + 0.25; // (rung through the hold and out)
    for (const st of chord) { const f = hz(r + 24 + st); this.tone(t, ring, { f0: f, type: 'sawtooth', gain: big ? 0.045 : 0.035, dest: d }); this.tone(t, ring * 0.6, { f0: f * 2, type: 'square', gain: 0.012, dest: d }); } // (the orchestra hit: brass and strings in one)
    if (skill === 'seal') this.tone(t, 1.2, { f0: 1180, gain: 0.05, dest: d }); // (the anvil's ring)
    if (skill === 'petrify') for (let k = 0; k < 4; k++) this.tone(t + 0.05 + k * 0.05, 0.3, { f0: hz(r + 60 + k * 2), gain: 0.02, dest: d }); // (glass over the cluster)
    if (skill === 'sap') this.tone(t + 0.1, 0.7, { f0: hz(r + 31), f1: hz(r + 19), type: 'sawtooth', gain: 0.03, dest: d }); // (bent down)
    if (big) {
      for (const st of [0, 7, 13]) this.tone(t, ring, { f0: hz(r + 36 + st), gain: 0.03, dest: d }); // (the voices held over it)
      for (let k = 0; k < 6; k++) this.noise(t + 0.4 + k * 0.045, 0.025, { type: 'bandpass', f0: 3000 + (k % 3) * 1500, q: 4, gain: 0.18, dest: d }); // (a stutter: the data showing through)
      this.noise(t + 0.02, ring, { type: 'highpass', f0: 5000, f1: 2500, gain: 0.1, dest: d }); // (the crash's long wash)
    }
    this.noise(t + ring * 0.5, ring * 0.5, { type: 'highpass', f0: 3000, f1: 8000, gain: 0.06, attack: ring * 0.45, dest: d }); // (the reversed cymbal into the skill's own sound)
    return lead;
  }
  /** The turn's change as a cut-in's sting (South, via Dovina 2026-10-29; Calissa's frame): yours the Answer's first notes leaping up a
   *  bright brass stab on the key, the aberrant's the Five's two falling in its dark below; a blade of air into each, lighter than a
   *  foe skill's (a turn comes every few real seconds, a skill every few turns). */
  duelTurnCutIn(side = 0) {
    if (!this.ok() || !this.allow('duelTurnCutIn', 2)) return;
    const foe = side === 1, lead = CUT_IN_LEAD.skill, t = this.ctx.currentTime + lead, r = duelRoot(this) - (foe ? 24 : 12);
    const d = this.duelOut?.(foe ? 0.36 : 0.3, 0.5, foe ? 0.3 : -0.3) ?? this.out(0.3, 0.5, true);
    this.noise(t - lead, lead + 0.03, { type: 'bandpass', f0: foe ? 3000 : 900, f1: foe ? 700 : 4000, q: 0.9, gain: 0.18, attack: 0.06, dest: d }); // (the frame across: rising for yours, falling for its)
    this.tone(t, 0.25, { f0: foe ? 80 : 120, f1: foe ? 40 : 70, gain: foe ? 0.45 : 0.3, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 2200, gain: 0.25, dest: d }); // (the slam, small)
    const notes = foe ? [[0, 4, [0, 3, 7]], [0.16, 0, [0, 3, 6]]] : [[0, 0, [0, 4, 7]], [0.12, 2, [0, 5, 9]]]; // (yours: I then up a step, G to A; its: the Five's E falling to the root, minor then diminished)
    for (const [dt, up, chord] of notes) for (const st of chord) { const f = hz(r + 12 + up + st); this.tone(t + dt, 0.45, { f0: f, type: 'sawtooth', gain: foe ? 0.03 : 0.025, dest: d }); this.tone(t + dt, 0.25, { f0: f * 2, type: foe ? 'square' : 'triangle', gain: 0.01, dest: d }); }
    if (!foe) this.tone(t + 0.12, 0.6, { f0: hz(r + 36 + 4), gain: 0.03, dest: d }); // (a glint on top: your hope)
  }
  /** The feeling a Manifest raised or a Transmute turned to: its gem's note in the duel's key, struck twice, a step apart in time. */
  duelPowerColour(colour, side = 0) {
    if (!this.ok() || !this.allow('duelPowerColour', 3)) return;
    const t = this.ctx.currentTime + 0.35, d = this.duelOut?.(0.24, 0.5, side === 1 ? 0.3 : -0.3) ?? this.out(0.24, 0.5, true), m = duelRoot(this) + 12 + (FEELING_STEP[colour] ?? 0);
    [0, 0.12].forEach((dt, k) => [1, 2.76].forEach((q, j) => this.tone(t + dt, 0.5, { f0: hz(m + k * 12) * q, gain: j ? 0.008 : 0.045, dest: d })));
  }
  /** A foe skill learned for the first time (`duel.seen`): a quiet "noted", a page's flick and two soft notes rising to the key. */
  duelSeen() {
    if (!this.ok() || !this.allow('duelSeen', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0.5, true), r = duelRoot(this);
    this.noise(t, 0.08, { type: 'bandpass', f0: 2600, f1: 1800, q: 1.2, gain: 0.1, dest: d });
    this.tone(t + 0.06, 0.3, { f0: hz(r + 7), type: 'triangle', gain: 0.05, dest: d }); this.tone(t + 0.18, 0.5, { f0: hz(r + 12), type: 'triangle', gain: 0.05, dest: d });
  }
  /** A duel power cast (one per domain): its god power's family in small, then a glass note in the duel's key on the board. */
  duelPower(domain = '', e = {}) {
    if (!this.ok() || !this.allow(`duelPower.${domain}`, 2)) return;
    const t = this.ctx.currentTime, root = duelRoot(this), grid = this.musicGrid?.();
    switch (domain) {
      case 'ouranurgy': { const d = this.duelOut?.(0.3, 0.5) ?? this.out(0.3, 0.5, true); // (Swap: two pings a fifth apart, trading sides)
        for (const [m, a, b] of [[root + 12, -0.6, 0.6], [root + 19, 0.6, -0.6]]) { const p = this.ctx.createStereoPanner(); p.pan.setValueAtTime(a, t); p.pan.linearRampToValueAtTime(b, t + 0.35); p.connect(d); this.tone(t, 0.5, { f0: hz(m), gain: 0.07, dest: p }); setTimeout(() => p.disconnect(), 1200); }
        this.godPortalPass?.('thing'); break; }
      case 'manifestation': this.godTotem?.(e.colour || e.feeling || 'wonder', true, grid); break; // (Raise: the totem rising, its chord in the feeling)
      case 'divination': this.godRead?.(e.n ?? 1); break; // (Scan: the read's ping)
      case 'psychokinesis': this.godSlab?.(1, false); setTimeout(() => this.godSlab?.(1, true), 380); break; // (Lift: torn up, set down shifted)
      case 'possession': this.godHerd?.(e.n ?? 3, true); break; // (Herd: the whistle and soft feet)
      case 'alteration': this.godTransmute?.(e.to || e.colour || null, 3, true); break; // (Transmute: one thing turning into another)
      case 'spellscription': { const d = this.duelOut?.(0.9, 0.7) ?? this.out(0.9, 0.7, true); // (the miracle: the ward's brush stroke round, and its bell on the key, smaller than the hand's)
        this.noise(t, 0.5, { type: 'bandpass', f0: 700, f1: 1600, q: 1, gain: 0.18, attack: 0.08, dest: d }); this.godBell?.(t + 0.45, 1.6, hz(root), 0.06, d); break; }
      default: break;
    }
    const lift = { possession: 3, divination: 2.5 }[domain] ?? 1, d = this.duelOut?.(0.2 * lift, 0.5) ?? this.out(0.2 * lift, 0.5, true); // (levelled by meter: the herd's whistle and the read's ping are light, so the board answers them louder) (the board answering: a glass note on the key's fifth, a beat later)
    [1, 2.76].forEach((q, j) => this.tone(t + 0.3, 0.6, { f0: hz(root + 19) * q, gain: j ? 0.008 : 0.04, dest: d }));
  }
}
