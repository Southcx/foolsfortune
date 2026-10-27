// ---------------------------------------------------------------------------------------
// A SQUARE COMPLETED (docs/plans/OPEN-SEA.md 15.5; South, 2026-10-27, "determine what else we can fold in"): a square of the open sea is
// done when it is charted, every feature in it found (an islet, a monument, a wreck, a phenomenon at its own hour or weather, a seep),
// every islet's secret taken and every wreck salvaged once. Done, it pays once by its class and its chart takes your seal (the map's
// look: Calissa's). The sea's whole is then a grid that fills, square by square, toward the outer rows: a reason to come back at night
// for the phenomenon you missed, and to sail on past the square you have.
//
// What counts is the sea's, never the game day's: the herds and the habits move, so they are the collection log's (collectionlog.js),
// never a square's. Everything is read from the room's own record (the voyage's found and reported, the islets claimed, the wrecks
// salvaged), so a square needs no flag of its own beyond the one that says it was paid.
//
// Prior art: The Legend of Zelda: The Wind Waker's sea chart (each square's chart and its secrets), No Man's Sky's planet survey (100%
// of a system's fauna for a bonus), Ubisoft's synchronised map sections, Hollow Knight's map filled as walked.
//
//   SQUARE { pay: minutes by class }   counts(sq) -> bool (a square with no feature is never 'completed': charting it is all)   squareState(sq, rec) -> { done, have, of, missing: [{ id, kind, why }] }   squarePay(sq) -> cubes
//   rec = { charted: Set, found: Map|Set, reported: Set, claimed: Set, salvaged: { [wreckId]: any } }
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** pay: minutes of play at the aim a square's completion pays once, by its class (0 by the lanes .. 4 the far Chaos rows): about 1.6 a
 *  square, 57 squares with something in them, some 800 cubes over the whole sea, once (ECONOMY.md "the night's folds"). */
export const SQUARE = { pay: [1, 1.5, 2, 3, 4] };

/** Whether a square can be completed: one with a feature in it (a lane's or a port's bare water is only charted). */
export const counts = (sq) => (sq.features?.length ?? 0) > 0;

const had = (rec, id) => rec.found?.has?.(id) || rec.reported?.has?.(id);

/** A square's state: each thing it asks and whether you have it (`why`: what is still wanted of a feature: 'find', 'secret', 'salvage'). */
export function squareState(sq, rec = {}) {
  const missing = []; let of = 1, have = rec.charted?.has?.(sq.id) ? 1 : 0;
  if (!have) missing.push({ id: sq.id, kind: 'square', why: 'chart' });
  for (const f of sq.features || []) {
    of++; if (had(rec, f.id)) have++; else missing.push({ id: f.id, kind: f.kind, why: 'find' });
    if (f.kind === 'islet') { of++; if (rec.claimed?.has?.(f.id)) have++; else missing.push({ id: f.id, kind: f.kind, why: 'secret' }); }
    if (f.kind === 'wreck') { of++; if (rec.salvaged?.[f.id]) have++; else missing.push({ id: f.id, kind: f.kind, why: 'salvage' }); }
  }
  return { done: have === of, have, of, missing };
}

export const squarePay = (sq) => Math.round((SQUARE.pay[Math.max(0, Math.min(4, sq.cls ?? 0))] ?? 1) * ECON.perMinute);
