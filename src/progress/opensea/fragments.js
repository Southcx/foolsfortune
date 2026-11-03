// ---------------------------------------------------------------------------------------
// FRAGMENTS: A SHIP'S PART IN PIECES (docs/plans/OPEN-SEA.md 15.6, built; GAPS.md G158): a crate that holds a ship's part now holds a
// FRAGMENT of one, and a quay makes the part once it has `need` of them, for a small fee. Salvage used to roll a whole part at 4% to 35% a
// crate and nothing closed the gap (a common wreck gave a part about once in 25 crates, an unlucky sailor never); a fragment is three
// times as likely (the same expected parts, in pieces), leans toward a part already begun, and so closes it (skill skips grind; grind closes
// the gap: a sailor who hunts the rarer wrecks finishes sooner, one who hauls a common wreck still finishes).
// The beasts' half is forge.js (carves). A forged part never comes as a fragment (`from: 'forge'`).
//
// Prior art: Subnautica's blueprints (a fragment scanned, enough of them unlock the thing, made at a fabricator), Monster Hunter's
// materials-to-gear, Sea of Thieves' commendation pieces.
//
//   FRAGMENTS { need, maker, lean, cap }   fragmentChance(tier) -> 0..cap   fragmentOf(r, ids, owned, held) -> id | null
//   canMake(held, id) -> { ok, have, need, cubes }   makePrice() -> cubes
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { SALVAGE } from './salvagenumbers.js';

/** need: fragments a part is made from; maker: the quay's fee in minutes of play at the aim (a forge's class 2 part is 15: this is the
 *  salvaged part's third, because a crate already cost the sailor a hook and a visit); lean: how much likelier a part already begun is
 *  than one not (the gap-closer); cap: a crate's fragment chance never passes it (a legend's crate is not a sure thing). */
export const FRAGMENTS = { need: 3, maker: 5, lean: 3, cap: 0.9 };

/** A crate's chance of holding a fragment, by the wreck's tier: the old whole-part chance times what a part needs, so the expected parts
 *  a crate gives are what they were. */
export const fragmentChance = (tier) => Math.min(FRAGMENTS.cap, (SALVAGE.part[tier] ?? SALVAGE.part.common) * FRAGMENTS.need);

/** The part a fragment is of: one not yet owned, a begun one `lean` times as likely; null when every part is owned (the crate is cubes). */
export function fragmentOf(r, ids, owned = new Set(), held = {}) {
  const left = ids.filter((id) => !owned.has(id)); if (!left.length) return null;
  const w = left.map((id) => ((held[id] || 0) > 0 ? FRAGMENTS.lean : 1)), sum = w.reduce((a, b) => a + b, 0);
  let x = r() * sum; for (let i = 0; i < left.length; i++) { x -= w[i]; if (x < 0) return left[i]; }
  return left[left.length - 1];
}

export const makePrice = () => Math.round(FRAGMENTS.maker * ECON.perMinute);

/** Whether the part `id` can be made from the fragments `held` (the cubes and the quay are the room's to ask). */
export function canMake(held, id) {
  const have = held?.[id] || 0; return { ok: have >= FRAGMENTS.need, have, need: FRAGMENTS.need, cubes: makePrice() };
}
