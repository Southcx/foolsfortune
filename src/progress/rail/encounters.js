// ---------------------------------------------------------------------------------------
// ENCOUNTERS AT SEA: a waypoint that is a rest and an event at once (docs/plans/PASSAGE.md section 13; the owner, 2026-10-08: "I love
// the idea of cinematic encounters at sea like a Rest site hybridized with an Event node"). The ship is mended as at a calm, and a
// short cinematic plays (a sequence: game.cine), ending in a choice with stakes, said in the log and answered in the world (no window
// of words but the dialogue box, when one of the folk speaks). Which encounter resolves on arrival, Slay the Spire's "?" room: its
// portent shows a haven's silhouette, and each encounter's weight rises while it is unseen, so a long voyage meets them all.
//
// Prior art: FTL's events (a choice whose stakes you read from what you carry), Slay the Spire's "?" rooms and rest sites (rest or
// upgrade: one or the other), Sunless Sea's storylets at sea, Skies of Arcadia's discoveries, Wind Waker's sea encounters (the ghost
// ship, the submarines, the merchant on his boat), Outer Wilds' quiet wonders, and the KH2 Gummi routes' set dressing.
//
//   ENCOUNTERS[id] = { weight, mend, needs?, choices: [{ id, does, cost?, gain?, risk?, needs? }] }   pickEncounter(seen, rng, { ghost }) -> id
//   offered(id, ship) -> [choice]   (needs: 'ghost' a run of this sea chart to race, the day's best or a rutter's; 'dive' a ship that
//   dives: PASSAGE.md section 14)
//   (the words, the names and the cinematics are Espada's and Calissa's: these are the mechanics, with working names)
// ---------------------------------------------------------------------------------------
import { SHIPS } from './ships.js';

export const ENCOUNTERS = {
  /** A convoy of ghost ships passing in the fog: follow them (the next two waypoints' portents exact) or loot the last (a fight leg's
   *  worth of casks, and the Wreckers' share up for the rest of the passage). */
  ghostConvoy:  { weight: 1, mend: 3, choices: [{ id: 'follow', does: 'the next two waypoints shown exactly' }, { id: 'loot', does: 'casks of crude, the Wreckers drawn to you', gain: { casks: 2 }, risk: { wreckers: 0.15 } }] },
  /** Letty Marque's cutter alongside: take a posted bounty onto this passage, or sell her the rutter you carry at a premium. */
  lettysCutter: { weight: 1, mend: 3, choices: [{ id: 'bounty', does: 'a bounty waypoint placed ahead' }, { id: 'sell', does: 'a rutter sold at 1.25 its worth' }] },
  /** A whale of light singing under the crude: listen (the reckoning raised for the rest of the passage, a Divination act) or follow it
   *  down (a dive into a hidden Umbral leg: a sloop's dare, refused by a ship that cannot dive). */
  lightWhale:   { weight: 1, mend: 3, choices: [{ id: 'listen', does: 'the reckoning of this passage raised by a quarter' }, { id: 'follow', does: 'a hidden Umbral leg, richer', risk: { leg: 'umbral' }, needs: 'dive' }] },
  /** A stranded Contractor on a raft: take them aboard (fuel spent, a hand for the next leg: they man a mount) or leave them (nothing). */
  castaway:     { weight: 1, mend: 3, choices: [{ id: 'rescue', does: 'a crew hand for the next leg', cost: { fuel: 1 } }, { id: 'leave', does: 'nothing' }] },
  /** The Purser's barge at anchor: trade casks at mid-sea prices, buy fuel, or buy today's rutter of this route. */
  pursersBarge: { weight: 1, mend: 3, choices: [{ id: 'trade', does: 'casks sold and bought at the barge' }, { id: 'rutter', does: 'today\'s rutter of this route, at list' }] },
  /** A mirror-calm where your own best crossing of this route sails beside you as a ghost: race it through the next leg for a rank
   *  bonus, or let it pass. */
  mirrorSea:    { weight: 0.7, mend: 3, needs: 'ghost', choices: [{ id: 'race', does: 'beat your ghost through the next leg: its rank a step up' }, { id: 'pass', does: 'nothing' }] },
  /** A bottle drifting with a paper in it: an ostracon's word, or a note of a waypoint ahead (its portent exact). */
  driftBottle:  { weight: 0.7, mend: 3, choices: [{ id: 'read', does: 'a word glossed, or a portent made exact' }] },
};

/** Which encounter resolves on arrival: weighted, each one's weight doubled for every voyage it has not been met (`seen[id]` is the count of
 *  voyages since; capped at x8), so the sea shows you everything in time (Slay the Spire's "?" odds that rise while unseen). The Glass
 *  only where there is a run of this sea chart to race (`ghost`): a double from another day's sea would sail a different sea. */
export function pickEncounter(seen = {}, rng, { ghost = false } = {}) {
  const ids = Object.keys(ENCOUNTERS).filter((id) => ENCOUNTERS[id].needs !== 'ghost' || ghost), w = ids.map((id) => ENCOUNTERS[id].weight * Math.min(8, Math.pow(2, seen[id] || 0)));
  let x = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i++) { x -= w[i]; if (x <= 0) return ids[i]; }
  return ids[ids.length - 1];
}

/** The choices an encounter offers a ship (a ship that cannot dive is never offered the dive). */
export const offered = (id, ship = 'sloop') => (ENCOUNTERS[id]?.choices || []).filter((c) => c.needs !== 'dive' || SHIPS[ship]?.dive);
