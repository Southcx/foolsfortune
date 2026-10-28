// ---------------------------------------------------------------------------------------
// A FOE SKILL SEEN (docs/plans/PUZZLE-DUELS.md 24.5; South, 2026-10-28, through Petra: "tap one of the aberrant's countdown badges and you
// get a tooltip, but only for a foe skill you have seen happen in a duel. Observation first"): what the Courier knows of the aberrants'
// foe skills (foeskills.js), kept as knowledge, never as a count. A skill is seen once you have watched any aberrant use it in any duel,
// a practice duel too (Strawman's Hurl is the first most will meet, and the practice duel counts nothing in the ledger: knowledge is not
// the ledger's), or once Scan (the duel's Divination power, duel/powers.js) has read it on a countdown. Until then its badge shows only its
// countdown and a ?; after, its label and its line (FOE_SKILLS[skill].line).
//
// Prior art: Pokemon's Pokedex (a move known once it has been used on you), the Souls games' item text earned by finding the item, Into
// the Breach's attack previews only for enemies you have met, the house's own familiarity (progress/familiarity.js: what a tag may show
// grows with what you have seen).
//
//   game.foeSeen = new FoeSeen(game)   .seen(skill) -> bool   .how(skill) -> 'watched' | 'scanned' | null   .see(skill, how)
//   save section `foeSeen` (scope player: reset with every build, as all progress is)   events: duel.seen { skill, how, by: 'courier' } (once a skill)
//   listens: duel.foe { skill } (watched), duel.power { power: 'scan', skill } (scanned)
// ---------------------------------------------------------------------------------------
import { FOE_SKILLS } from './duel/foeskills.js';

export class FoeSeen {
  constructor(game) {
    this.game = game; this.known = {};
    game.save?.section('foeSeen', { scope: 'player', version: 1, dump: () => ({ ...this.known }),
      load: (d) => { this.known = { ...(d || {}) }; }, reset: () => { this.known = {}; } });
    game.events?.on?.('duel.foe', (e) => this.see(e?.skill, 'watched')); // (practice duels too: seeing is knowledge, not a count)
    game.events?.on?.('duel.power', (e) => { if (e?.power === 'scan' && e.skill) this.see(e.skill, 'scanned'); });
  }
  seen(skill) { return !!this.known[skill]; }
  how(skill) { return this.known[skill] || null; }
  /** A skill seen: watched (it happened to you) outranks scanned (read ahead). Said once, on the bus, for the view and the log. */
  see(skill, how = 'watched') {
    if (!FOE_SKILLS[skill]) return;
    const was = this.known[skill]; if (was === 'watched' || was === how) return;
    this.known[skill] = how; this.game.save?.dirty?.('foeSeen');
    if (!was) this.game.events?.emit('duel.seen', { skill, how, by: 'courier' });
  }
}
