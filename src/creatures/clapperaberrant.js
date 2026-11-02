// ---------------------------------------------------------------------------------------
// AN ABERRANT CLAPPERJAR (Dovina's G1, docs/plans/ABERRANTS.md 5.2; where it happens: world/duel/duelfoes.js `clapperWrong`). The
// clapperjars keep their own module (creatures/clappers.js), outside the creature registry. One gone aberrant joins the registry
// (game.creatures) while it is, so everything that meets an aberrant reaches it as it would any Figment's:
//   - the duel's pull and pocket (world/duel/);
//   - the data bug's look (vfx/databug.js finds aberrants in the list by their flags);
//   - the drain at a won duel (creatures.strike -> its `hurt` -> clappers.hit).
// It leaves the registry when it breaks (clappers.js `hit`). While it is aberrant, a blow in the world rings off it (`hit`'s guard), as
// creatures.js `strike` does for any aberrant.
//
// Prior art: the adapter (Gamma et al.): the clapperjar keeps its own body and mind, given the small creature contract only while it
// needs one, rather than every pot made a creature (the lock-on and the minds would then look through the Workshop's pots).
//
//   goWrongClapper(clappers, c, aspect, shiny) -> c | null
// ---------------------------------------------------------------------------------------
import { tag } from '../core/tags.js';

/** `c` goes aberrant in `aspect` (its board's feeling), shiny or not: the creature contract given, and joined to the registry. */
export function goWrongClapper(clappers, c, aspect, shiny = false) {
  if (!c?.alive || c.aberrant) return null;
  c.aberrant = true; c.dataBugMended = false; c.grade = aspect; c.shiny = shiny; c.name = 'Aberrant clapperjar'; // (Espada's to word)
  c.radius ??= 0.35; c.height ??= 0.9; tag(c, 'hurtable');
  c.hurt ||= (point, dir, dmg, cause) => { clappers.hit(c, point, dir, dmg, cause); return dmg; }; // (the drain's strike breaks it as any blow would)
  clappers.game.creatures?.add(c);
  return c;
}
