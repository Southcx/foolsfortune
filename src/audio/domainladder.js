// ---------------------------------------------------------------------------------------
// A DOMAIN'S LADDER HEARD (Dovina's progress/domainladder.js and courier/domainarts/depth.js). The level-up is a run up to the domain's
// bell (audio/worldmoments.js domainLevelUp); a milestone is that bell answered by the whole chord, so a ten feels like a landing, not
// another step. Each kind of row a ten holds has its own colour over the chord, so the ear knows what opened before the log says it:
//   MILESTONE  (domain.milestone { domain, level, rows }) after the level-up's bell, on the music's next sixteenth: the domain's chord
//              (root, third, fifth, octave) swept up as a harp; then by its rows' kinds:
//                rung    four quick steps climbing under it (a ladder's rungs)
//                power   a deep struck gong under the chord
//                trait   the chord's top note struck again and tuned up into place
//                epic    a timpani roll swelling into the chord and a held choir of detuned voices
//                summit  (99) all of it, longer, the octave above added and a shimmer held
//   TRAIT      (domain.trait.learn { trait, art, domain }) a rung made stronger: its bell struck flat and tuned up a semitone into the
//              note, then struck again true a fifth over (a string brought up to pitch)
//   BORROW     (borrow.use { kind }) a creature's move thrown through your hand: Possession's tether (a low hum drawn tight) under the
//              creature's own voice: the Lantern Wisp's flame thrown (its cast without the draw-in), a slip jelly's glop, anything else
//              a plain thrown breath
//   FUSE       (domain.art.end { art: 'fuse', n }) what you put on it going off at once: n pops, each higher, into one bloom
//   SEAL       (domain.art.fire { art: 'sealCreature', broke }) a blow broken off by the seal: a chain snapping on a struck ward
//   RELAY      (domain.art.fire { art: 'relay', links }) the chain of blows: a clack a link, climbing
// The domain's pitch is the level-up's own (DOMAIN_STEP up the pentatonic, shifted to the cue's root), so a milestone answers its bell.
//
// Prior art: Old School RuneScape's level-up jingles (a skill's own fanfare, bigger at 99), FFXIV's job quest's ding, Final Fantasy's
// harp sweep (the crystal prelude's arpeggio), Zelda's item-get for the epic's swell.
//
//   sfx.ladderMilestone(domain, level, rows, grid) .ladderTrait(domain) .borrowUse(kind) .fuseBurst(n) .sealBreak() .relayChain(links)
// ---------------------------------------------------------------------------------------
import { milestoneAt } from '../progress/domainladder.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const DOMAIN_STEP = { ouranurgy: 0, manifestation: 2, divination: 4, psychokinesis: 7, possession: 9, alteration: 12, spellscription: 14 }; // (worldmoments.js's: the level-up's bell)
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { milestone: 1.9, trait: 1.6, borrow: 1, fuse: 1, seal: 2.5, relay: 1.5 };

export class DomainLadderSounds {
  ladderOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb, true)); setTimeout(() => d.disconnect(), 8000); return d; }
  /** The domain's root, as the level-up's bell is pitched. */
  ladderRoot(domain, grid) {
    const up = grid?.root != null && Number.isFinite(+grid.root) ? ((((grid.root - 64) % 12) + 12) % 12) : 0;
    return 76 + up + (DOMAIN_STEP[domain] ?? 0);
  }
  ladderAt(grid) { const now = this.ctx.currentTime, v = this.onSixteenth && grid?.spb > 0 ? this.onSixteenth(grid) : now; return Number.isFinite(v) && v >= now ? v : now; }
  /** A bell: its fundamental and two inharmonic partials. */
  ladderBell(t, f, dur, g, d) { this.tone(t, dur, { f0: f, gain: g, dest: d }); this.tone(t, dur * 0.5, { f0: f * 2.76, gain: g * 0.22, dest: d }); this.tone(t, dur * 0.3, { f0: f * 5.4, gain: g * 0.08, dest: d }); }

  ladderMilestone(domain = 'ouranurgy', level = 10, rows = null, grid = null) {
    const key = String(domain ?? 'ouranurgy');
    if (!this.ok() || !this.allow(`ladderMilestone.${key}`, 0.5)) return;
    const lv = Math.round(num(level, 10, 1, 99)), summit = lv >= 99;
    let kinds;
    try { kinds = new Set(milestoneAt(key, lv).map((r) => r.kind)); } catch { kinds = new Set(); }
    if (!kinds.size && Array.isArray(rows) && rows.length) kinds.add('rung');
    if (summit) kinds = new Set(['rung', 'power', 'trait', 'epic', 'summit']);
    const root = this.ladderRoot(key, grid), t = this.ladderAt(grid) + 0.55, d = this.ladderOut('milestone', 0.32, 0.65); // (after the level-up's bell, at +0.21)
    const span = summit ? 2.6 : 1.8;
    if (kinds.has('epic')) { // (a timpani roll swelling in)
      for (let i = 0; i < 14; i++) this.tone(t - 0.5 + i * 0.035, 0.12, { f0: hz(root - 24), f1: hz(root - 24) * 0.97, type: 'triangle', gain: 0.03 + i * 0.006, dest: d });
    }
    if (kinds.has('rung')) [-12, -9, -5, -3].forEach((s, i) => this.tone(t - 0.28 + i * 0.07, 0.1, { f0: hz(root + s), type: 'triangle', gain: 0.07, dest: d })); // (the rungs climbed)
    const chord = summit ? [0, 4, 7, 12, 16, 19, 24] : [0, 4, 7, 12, 16];
    chord.forEach((s, i) => { // (the harp's sweep)
      const at = t + i * 0.045, f = hz(root + s - 12);
      this.tone(at, span - i * 0.12, { f0: f, type: 'triangle', gain: 0.06, dest: d }); this.tone(at, 0.4, { f0: f * 2, gain: 0.015, dest: d });
    });
    this.ladderBell(t + chord.length * 0.045, hz(root), span, 0.09, d); // (the bell answered)
    if (kinds.has('power')) { this.tone(t, span, { f0: hz(root - 24), f1: hz(root - 24) * 0.99, gain: 0.08, dest: d }); this.tone(t, span * 0.6, { f0: hz(root - 24) * 2.4, gain: 0.03, dest: d }); this.noise(t, 0.08, { type: 'lowpass', f0: 500, gain: 0.25, dest: d }); } // (a gong struck)
    if (kinds.has('trait')) { const at = t + 0.5, f = hz(root + 12); this.tone(at, 0.5, { f0: f * 0.97, f1: f, gain: 0.05, dest: d }); this.ladderBell(at + 0.3, f, 0.9, 0.04, d); } // (the top note tuned into place)
    if (kinds.has('epic')) [0, 7, 12].forEach((s) => [-0.12, 0.12].forEach((c) => this.tone(t + 0.2, span, { f0: hz(root + s - 12 + c), type: 'sawtooth', gain: 0.008, dest: d }))); // (the held choir)
    if (summit) this.noise(t, span, { type: 'highpass', f0: 7000, gain: 0.06, attack: 0.4, dest: d }); // (the shimmer held)
  }
  ladderTrait(domain = 'ouranurgy') {
    const key = String(domain ?? 'ouranurgy');
    if (!this.ok() || !this.allow(`ladderTrait.${key}`, 1)) return;
    const t = this.ctx.currentTime, d = this.ladderOut('trait', 0.3, 0.55), root = this.ladderRoot(key, null), f = hz(root);
    this.tone(t, 0.55, { f0: f * Math.pow(2, -1 / 12), f1: f, gain: 0.09, dest: d }); this.tone(t, 0.3, { f0: f * 2.76 * 0.944, f1: f * 2.76, gain: 0.02, dest: d }); // (struck flat, brought up)
    this.ladderBell(t + 0.5, f * 1.5, 1.2, 0.08, d); this.ladderBell(t + 0.5, f, 1.2, 0.05, d); // (true, a fifth over)
  }
  borrowUse(kind = '') {
    if (!this.ok() || !this.allow('borrowUse', 4)) return;
    const t = this.ctx.currentTime, d = this.ladderOut('borrow', 0.35, 0.35), k = String(kind ?? '');
    this.tone(t, 0.3, { f0: 110, f1: 165, type: 'triangle', gain: 0.1, dest: d }); this.tone(t, 0.3, { f0: 111.5, f1: 167, type: 'triangle', gain: 0.06, dest: d }); // (Possession's tether drawn tight: a beating hum)
    if (k === 'wisp') { // (its flame thrown, as its own cast without the draw-in)
      this.noise(t + 0.05, 0.25, { f0: 1500, f1: 300, gain: 0.5, dest: d }); this.tone(t + 0.05, 0.2, { f0: 140, f1: 70, gain: 0.3, dest: d });
      for (let i = 0; i < 5; i++) this.noise(t + 0.07 + Math.random() * 0.25, 0.01, { type: 'highpass', f0: 4000, gain: 0.22, dest: d });
    } else if (k === 'jelly' || k === 'greatjelly') { // (a glop flung)
      this.tone(t + 0.05, 0.18, { f0: 260, f1: 90, gain: 0.25, dest: d }); this.noise(t + 0.05, 0.15, { type: 'lowpass', f0: 900, f1: 300, gain: 0.35, dest: d });
    } else this.noise(t + 0.05, 0.3, { type: 'bandpass', f0: 2000, f1: 500, q: 1.2, gain: 0.9, dest: d }); // (a plain thrown breath)
  }
  fuseBurst(n = 1) {
    const c = Math.round(num(n, 1, 0, 5)); if (!c) return;
    if (!this.ok() || !this.allow('fuseBurst', 2)) return;
    const t = this.ctx.currentTime, d = this.ladderOut('fuse', 0.4, 0.4);
    for (let i = 0; i < c; i++) { const at = t + i * 0.06; this.noise(at, 0.04, { type: 'bandpass', f0: 1200 + i * 500, q: 2, gain: 0.3, dest: d }); this.tone(at, 0.08, { f0: hz(72 + i * 4), gain: 0.05, dest: d }); } // (each status going off)
    const at = t + c * 0.06; this.noise(at, 0.5, { type: 'lowpass', f0: 3000, f1: 400, gain: 0.22 + 0.02 * c, dest: d }); this.tone(at, 0.4, { f0: 120, f1: 50, gain: 0.15 + 0.015 * c, dest: d }); // (one bloom)
  }
  sealBreak() {
    if (!this.ok() || !this.allow('sealBreak', 3)) return;
    const t = this.ctx.currentTime, d = this.ladderOut('seal', 0.35, 0.45);
    [1, 2.7, 5.1].forEach((r, i) => this.tone(t, 0.5 / (1 + i), { f0: 980 * r, gain: 0.06 / (1 + i), dest: d })); // (the ward struck)
    this.noise(t, 0.03, { type: 'highpass', f0: 4500, gain: 0.45, dest: d }); for (let i = 1; i < 4; i++) this.noise(t + i * 0.035, 0.012, { type: 'bandpass', f0: 3200 - i * 400, q: 6, gain: 0.25, dest: d }); // (the chain snapping)
  }
  relayChain(links = 1) {
    const c = Math.round(num(links, 1, 1, 8));
    if (!this.ok() || !this.allow('relayChain', 3)) return;
    const t = this.ctx.currentTime, d = this.ladderOut('relay', 0.35, 0.3);
    for (let i = 0; i < c; i++) { const at = t + i * 0.07; this.noise(at, 0.02, { type: 'bandpass', f0: 1800 + i * 300, q: 4, gain: 1.6 / Math.sqrt(c), dest: d }); this.tone(at, 0.09, { f0: hz(67 + i * 2), type: 'triangle', gain: 0.3 / Math.sqrt(c), dest: d }); } // (a clack a link, climbing)
  }
}
