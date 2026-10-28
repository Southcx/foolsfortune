// ---------------------------------------------------------------------------------------
// THE GARDEN BACKDROP (docs/plans/ABERRANTS.md 7; South, 2026-10-28: "the Courier/pneuka jar's Zone of Influence should be a
// representation of their Spirit Garden"): what your half of a puzzle duel's backdrop draws, read from your Spirit Garden as it stands.
// The Spirit Garden lives inside your Pneuka Jar, and in a duel you stand as the Jar. So when two minds clash, the world you bring is
// the one you grew: its season and hour, how calm or overgrown it is, the sets you placed, the spirits bound to you. The aberrant's half
// is its feeling's weather; yours is your garden. A new save's garden is bare, so its backdrop is the deep and the film as before
// (`bare`), and it fills as the garden does.
//
// A look only (DESIGN.md 22: base change bad): nothing in the garden changes a duel's rules. This module only gathers; Calissa's view
// draws it (vfx/duelview/domains.js), Wanda may score it.
//
// Prior art: Jujutsu Kaisen's Domain Expansion (a sorcerer's inner world made the battlefield), Kingdom Hearts' Station of Awakening (the
// heart as a stained-glass floor of what you carry), Persona's Velvet Room (a room that is a mind), Animal Crossing's town tune and flag
// (your place carried as your sign).
//
//   gardenBackdropOf(game) (also `game.gardenBackdrop()`, boot/progress.js) -> { bare, season, phase, harmony: { mean, briarK, bloom, briar }, sets: [{ set, n }], pieces: [{ id, n }],
//     spirits: [{ kind, feeling }], planetoids }   GARDEN_BACKDROP (how many of each it keeps)
// ---------------------------------------------------------------------------------------
import { seasonOf } from './seasons.js';
import { phaseAt } from './weather.js';
import { DECOR } from './decor.js';
import { formOf } from './spirits.js';

/** sets / pieces / spirits: the most of each the backdrop keeps (the most placed first; the spirits in the order bound). */
export const GARDEN_BACKDROP = { sets: 3, pieces: 6, spirits: 4 };

const top = (counts, n, key) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, c]) => ({ [key]: k, n: c }));

/** Your Spirit Garden as your half of a duel's backdrop, read now (call it at the duel's open: it does not change during one). */
export function gardenBackdropOf(game) {
  const H = game?.harmony, placed = game?.decor?.s?.placed || [], bound = game?.bound?.list || [];
  const planets = H?.list?.() || [], hs = planets.map((p) => H.of?.(p.planetoid)).filter((h) => typeof h === 'number');
  const mean = hs.length ? hs.reduce((a, b) => a + b, 0) / hs.length : 0.5;
  const sets = {}, pieces = {};
  for (const [id] of placed) { const set = DECOR[id]?.set; pieces[id] = (pieces[id] || 0) + 1; if (set) sets[set] = (sets[set] || 0) + 1; }
  const spirits = bound.slice(0, GARDEN_BACKDROP.spirits).map((e) => ({ kind: e.kind, feeling: e.feeling || (e.sp ? formOf(e.sp)?.feeling : null) || null }));
  return {
    bare: !placed.length && !bound.length,
    season: seasonOf().id, phase: phaseAt(),
    harmony: { mean: +mean.toFixed(2), briarK: +(H?.briarK?.() ?? 0).toFixed(2), bloom: planets.filter((p) => p.band === 'bloom').length, briar: planets.filter((p) => p.band === 'briar').length },
    sets: top(sets, GARDEN_BACKDROP.sets, 'set'), pieces: top(pieces, GARDEN_BACKDROP.pieces, 'id'),
    spirits, planetoids: planets.length,
  };
}
