// ---------------------------------------------------------------------------------------
// A BODY'S CONSTITUTION: what each kind of creature is made of, which decides which of the five damage types bite it (docs/plans/
// SUBSTRATE.md F3; South, 2026-11-01: "The damage types were carefully considered based on the types of ways to interact with a hybrid
// physical-psychic body. Feelings and emotions determine behavior, they are downstream of the damage types and status afflictions").
// So a creature's `affinity` (the type its own nature is, which the type chart's trump reads: progress/combat/types.js) comes from its
// body and mind, never from its feeling; its feeling is what it shows after.
//
// The cycle (types.js) is the authority: Impact > Illusion > Ego > Influence > Delirium > Impact. A body of a type is open to the one
// that trumps it:
//   - a body of slip or clay (Impact: force made flesh) comes apart under Delirium, entropy unravelling force (the Lockheart's chaos);
//   - a phantom (Illusion: a light that misleads) is shattered by plain force, Impact;
//   - a self made solid (Ego: a myth that knows what it is) is overwhelmed by a phantom, Illusion;
//   - a social body (Influence: folk that clap and follow) is resisted by a strong self, Ego;
//   - a broken mind (Delirium: an aberrant, data come apart) is set in order by persuasion, Influence (the Crucibelle's toll).
// `body` is how physical it is (0 all mind .. 1 all body): what Divination's tag may show of it, and what a blow's crack or build leans on.
//
// Prior art: Pokemon's type chart (a creature's own type sets its weaknesses), Shin Megami Tensei's affinities (scouting a weakness is the
// play), Persona's One More on a weakness.
//
//   CONSTITUTION { kind: { affinity, body, line } }   constitutionOf(kind, c?) -> row   affinityOf(c) -> type id   typeWeaknessOf(c) -> the type that trumps it
// ---------------------------------------------------------------------------------------
import { TRUMPS } from './types.js';

export const CONSTITUTION = {
  slipjelly: { affinity: 'impact', body: 0.85, line: 'a body of slip: force made flesh' },
  greatjelly:{ affinity: 'impact', body: 0.9, line: 'the Great Slip Jelly: slip grown round a broken urn' }, // (the FOE spawns as a slipjelly (greatjelly.js J.spawn), so it reads that row: the same type; this row is for a kind of its own)
  clutch:    { affinity: 'impact', body: 0.8, line: 'a clutch of slip, not yet minded' },
  rolypoly:  { affinity: 'impact', body: 0.75, line: 'a shell that rolls' },
  dummy:     { affinity: 'impact', body: 1, line: 'straw and stitching' },
  strawman:  { affinity: 'impact', body: 1, line: 'straw and stitching, and Pip\'s care' },
  wisp:      { affinity: 'illusion', body: 0.2, line: 'a mind round a flame: a light that misleads' },
  spirit:    { affinity: 'illusion', body: 0.15, line: 'smoke with a will' },
  clapper:   { affinity: 'influence', body: 0.6, line: 'clay folk: they clap and they follow' },
  sibling:   { affinity: 'influence', body: 0.6, line: 'a Courier, a division\'s voice in clay' },
  beast:     { affinity: 'ego', body: 0.55, line: 'an Egregore: a myth that knows what it is' },
  // the open sea's beasts register by their SEA_BEASTS id (Petra, 2026-11-01): each an Egregore (Ego), its body by how much of it is flesh
  seaSerpent:   { affinity: 'ego', body: 0.7, line: 'the sea serpent: a myth with scales' },
  akhlut:       { affinity: 'ego', body: 0.75, line: 'the akhlut: an orca that walks as a wolf' },
  worldSerpent: { affinity: 'ego', body: 0.6, line: 'Jormungandr: the myth that circles the world' },
  umibozu:      { affinity: 'ego', body: 0.35, line: 'the umibozu: a sea monk, more shadow than flesh' },
  bigSquid:     { affinity: 'ego', body: 0.8, line: 'the kraken: a myth with arms' },
  aberrant:  { affinity: 'delirium', body: null, line: 'a mind come apart: its data showing through' }, // (laid over its kind's body)
};
/** The row for a creature (its kind's; an aberrant takes `aberrant`'s affinity over its own kind's body). */
export function constitutionOf(kind, c = null) {
  const row = CONSTITUTION[kind] || null;
  if (c?.aberrant) return { ...CONSTITUTION.aberrant, body: row?.body ?? 0.5 };
  return row;
}
export const affinityOf = (c) => constitutionOf(c?.kind, c)?.affinity ?? null;
/** The type that bites a creature hardest (the one that trumps its affinity). */
export const typeWeaknessOf = (c) => { const a = affinityOf(c); return a ? Object.keys(TRUMPS).find((t) => TRUMPS[t] === a) : null; };
