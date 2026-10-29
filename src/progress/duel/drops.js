// ---------------------------------------------------------------------------------------
// WHAT AN ABERRANT LEAVES, AND THE SHINY ONE (docs/plans/ABERRANTS.md 10; South, 2026-10-29: "Material drops for aberrant fights is a go.
// Also tell calissa to apply the inverted palette modifier shader on aberrants at a 10% chance. They'll be like our shiny versions"). A
// PvE duel won against an aberrant leaves Soul Alchemy materials (econ/materials.js) on top of what draining the creature already gives:
// its own kinds, rolled from a table by how the duel was won. The Line pays a plain table; the secret, the faster and the cleverer win,
// pays an extra roll on a richer one (DESIGN.md 22: skill skips grind, grind closes the gap); a shiny aberrant (one in ten goes wrong in
// its colours inverted, a look only: Calissa's AberrantInversion) pays one more roll at a rare tier or better. Practice pays nothing.
//
// Sized against the aim (ECON.perMinute; a material's worth is 1 + its tier minutes of play, shop/catalogue.js worthOf): a duel runs
// about 4 real minutes (PUZZLE-DUELS.md 26.9). The Line's 2 rolls average about 3.3 minutes' worth, about the aim for the time; the secret's
// 2 rolls on the richer table about 4.6 in a duel a sixth shorter, about 1.4 times the aim a minute (playing well pays 1.5x: ECON's songs and crystals).
// The shiny's extra roll is a rare one in ten duels: a story, not a living.
//
// Prior art: Old School RuneScape's drop tables (a common table, a rare table rolled on top), Monster Hunter's rewards (more and rarer for
// a capture or a broken part than a plain kill), Pokemon's shiny (a 1-in-N recolour, a look only, worth stopping for), Diablo's
// champion packs (a rarer look, a richer drop).
//
//   DROPS[kind] = { kinds: [material kind ids], line: { rolls, tiers }, secret: { rolls, tiers } }   SHINY = { chance, tier }
//   dropsFor({ kind, how, shiny }, rand) -> [{ kind, tier, seed }]   rollShiny(rand) -> bool (Petra's: where an aberrant goes wrong)
//   AberrantDrops (game.aberrantDrops): on duel.end won (not practice), adds each to the Pneuka Box (from 'duel') and says duel.drop
//   events: duel.drop { creature, how, shiny, items: [{ item, tier }], by: 'courier' }
// ---------------------------------------------------------------------------------------
import { makeMaterial } from '../econ/materials.js';
import { stream } from '../../core/rng.js';

/** Tier odds (0 common .. 4 the rarest), summing to 1: the plain table and the richer (one step up). */
const PLAIN = [0.55, 0.3, 0.12, 0.03, 0];
const RICH = [0.2, 0.42, 0.26, 0.1, 0.02];

export const DROPS = {
  // the Lantern Wisp: a lamp's glass and its idol's dark (arcane relics: lenses; eldritch artefacts: idols)
  wisp: { kinds: ['arcane', 'eldritch'], line: { rolls: 2, tiers: PLAIN }, secret: { rolls: 2, tiers: RICH } },
  // the slip jelly: what it swallowed and kept (provisions) and the pigment of its slime (finery)
  slipjelly: { kinds: ['provision', 'finery'], line: { rolls: 2, tiers: PLAIN }, secret: { rolls: 2, tiers: RICH } },
};
/** The plain table for an aberrant with none of its own: any of the seven kinds. */
const ANY = { kinds: ['eldritch', 'arcane', 'finery', 'mechanism', 'edge', 'art', 'provision'], line: { rolls: 2, tiers: PLAIN }, secret: { rolls: 2, tiers: RICH } };

/** One aberrant in ten goes wrong shiny (its colours inverted); a shiny one adds a roll at `tier` or better. */
export const SHINY = { chance: 0.1, tier: 3 };

const pick = (odds, r) => { let u = r(), t = 0; for (; t < odds.length - 1; t++) { u -= odds[t]; if (u < 0) break; } return t; };

/** What a won duel leaves: `how` 'secret' rolls the richer table; a shiny one adds a roll at SHINY.tier or better. */
export function dropsFor({ kind, how, shiny = false }, rand) {
  const D = DROPS[kind] || ANY, T = how === 'secret' ? D.secret : D.line, out = [];
  const one = (tiers, floor = 0) => out.push({ kind: D.kinds[Math.floor(rand() * D.kinds.length)], tier: Math.max(floor, pick(tiers, rand)), seed: Math.floor(rand() * 1e9) });
  for (let i = 0; i < T.rolls; i++) one(T.tiers);
  if (shiny) one(RICH, SHINY.tier);
  return out;
}

/** Does this aberrant go wrong shiny (Petra's, where a Figment goes wrong: duelfoes.js goWrong, stains.js's blotling)? */
export const rollShiny = (rand) => rand() < SHINY.chance;

const dropRand = stream('progress/duel/drops');

export class AberrantDrops {
  constructor(game) {
    this.game = game;
    game.events?.on?.('duel.end', (e) => queueMicrotask(() => this.leave(e))); // (after the end's own line: the win is said, then what it left)
  }
  /** A duel won (not practice, not fled): its materials into the Pneuka Box, said once as duel.drop. */
  leave(e) {
    if (!e?.won || e.practice || e.how === 'fled' || e.by !== 'courier') return;
    const items = [];
    for (const m of dropsFor({ kind: e.kind, how: e.how, shiny: !!e.shiny }, dropRand)) {
      const item = `mat.${m.kind}`; this.game.pneuka?.add(item, 'duel', 0, makeMaterial(m.kind, m.seed, m.tier)); items.push({ item, tier: m.tier });
    }
    if (items.length) this.game.events?.emit('duel.drop', { creature: e.kind || null, how: e.how, shiny: !!e.shiny, items, by: 'courier' });
  }
}
