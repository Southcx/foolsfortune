// ---------------------------------------------------------------------------------------
// THE MIGRATIONS: what keeps the open sea worth sailing once it is charted (docs/plans/OPEN-SEA.md section 13; the call left open in
// section 9, taken in the owner's "get ambitious" round of 2026-10-22). Each game day the sea's Egregores gather in a few places: a HERD,
// one species in one square for that game day, drawn from the day and the sea's seed (the same day lays the same herds for everyone in
// it). Margarite's dock posts them on its board (Letty Marque's, the bounties' board: the rumour of where they are); the Sight can be
// calibrated to one. A herd photographed pays its fee once (a share of a hunt of its class: a photograph, not a kill), on top of what the
// plate pays as a plate; it goes at the game day's end, met or not, and nothing is lost by missing one.
//
// Prior art: Monster Hunter's investigations (a posted, timed target), Animal Crossing's daily visitors and Pokemon GO's nests (the same
// day's spawns for everyone, migrating on a clock), Pokemon Snap's professor (paid for the picture), Red Dead Redemption 2's legendary
// animals told by rumour.
//
//   MIGRATION   herdsOf(grid, day, seed) -> [{ id, square, cls, n }]   herdFee(cls) -> cubes
//   RUMOUR   rumourOf(grid, day, seed) -> { id, square, cls, bounty } | null: the game day's one named beast on the board (OPEN-SEA.md 14.8;
//   Calissa's proposal, 2026-10-27: "a rumour each game day bringing a named Egregore to one square"), its kill paid a bounty once over its own pay
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { EGREGORES } from './safari.js';
import { seeded } from '../../core/rng.js';

/** How many herds a game day, how big (bodies), and what one pays: `share` of a hunt of its class (ECON.hunt). Measured against the aim
 *  in scripts/opensea.mjs: a sailor who works the board earns about 0.4x the aim after the sea is charted, less than fishing, more than
 *  nothing (OPEN-SEA.md 13). */
export const MIGRATION = { herds: 4, size: [3, 7], share: 0.5, hostile: false };

/** The herds of a game day on a sea: species by their weight, each in a square its `lives` allow (any hour: a herd is gathered all
 *  day), never two in one square. Hostile species never herd (`MIGRATION.hostile`): a herd is to be watched, not fought. */
export function herdsOf(grid, day = 0, seed = 1) {
  const r = seeded((seed * 7919 + day * 104729) >>> 0), out = [], used = new Set();
  const pool = Object.entries(EGREGORES).filter(([, E]) => MIGRATION.hostile || E.disposition !== 'hostile');
  const total = pool.reduce((n, [, E]) => n + E.weight, 0);
  for (let tries = 0; out.length < MIGRATION.herds && tries < 40; tries++) {
    let x = r() * total, pick = pool[0];
    for (const p of pool) { x -= p[1].weight; if (x <= 0) { pick = p; break; } }
    const [id, E] = pick, L = E.lives;
    const ok = grid.squares.filter((sq) => sq.off >= L.off && (!L.law || Math.sign(sq.law) === L.law || sq.law === 0) && E.cls <= sq.cls + 1 && !used.has(sq.id));
    if (!ok.length) continue;
    const sq = ok[Math.floor(r() * ok.length)]; used.add(sq.id);
    out.push({ id, square: sq.id, cls: E.cls, n: MIGRATION.size[0] + Math.floor(r() * (MIGRATION.size[1] - MIGRATION.size[0] + 1)) });
  }
  return out;
}

/** What a herd photographed pays, once: a share of a hunt of its class (ECON.hunt minutes at the aim). */
export const herdFee = (cls = 0) => Math.round(MIGRATION.share * ECON.hunt.minutes[Math.max(0, Math.min(4, cls))] * ECON.perMinute);

/** The rumour (OPEN-SEA.md 14.8): one fighting beast a game day posted on the dock's board in one square it lives in, its kill there that
 *  game day paid `bounty` x its own kill's pay at a whole hull, once (Letty's marque: the bounty board's first posting). Only beasts the
 *  sea can raise yet (`ids`: the sea serpent; the others join as their runtime lands); a legend `legend` game days in a hundred. */
export const RUMOUR = { ids: ['seaSerpent'], bounty: 1, legend: 0 };

export function rumourOf(grid, day = 0, seed = 1) {
  const r = seeded((seed * 6271 + day * 15485863) >>> 0), ids = RUMOUR.ids.filter((id) => EGREGORES[id]); if (!ids.length) return null;
  const id = ids[Math.floor(r() * ids.length)], E = EGREGORES[id], L = E.lives;
  const ok = grid.squares.filter((sq) => sq.off >= L.off && (!L.law || Math.sign(sq.law) === L.law || sq.law === 0) && E.cls <= sq.cls + 1);
  if (!ok.length) return null;
  return { id, square: ok[Math.floor(r() * ok.length)].id, cls: E.cls };
}
