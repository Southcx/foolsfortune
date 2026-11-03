// ---------------------------------------------------------------------------------------
// THE SHELF AND THE ENDLESS RUN (G307; docs/plans/TRACK-EDITOR.md 10, W5, 2026-11-03): sharing beyond a code. A SHELF is the tracks you
// keep from others (and your own validated ones to pass on): each stored as its share code (trackdef.js), a few at most, so the save stays
// small. An ENDLESS run rides the shelf's tracks one after another, each a flying lap alone against a pace (the track's reference race for
// one lap, the ruler's: progress/skiffruler.js), three lives and one skip: clear a track and the streak grows, fail it (too slow, or you
// retire) and a life goes; the shelf shuffled once, each track once, so the run ends when the lives do or the shelf is ridden through.
// Pure rules; the world's runner is world/raceway/endless.js, the shelf's keeper is world/raceway/trackshelf.js. A guest riding the
// host's track live is Petra's (the room): this is the asynchronous half, the codes passed round.
//
// Prior art: Super Mario Maker 2's Endless Challenge (lives, a skip, an unseen level each time, the streak) and its course world
// (a shelf of other people's levels), Trackmania's favourites and "track of the day" lists, Spelunky's daily seed (one shuffle, the same for
// all who share the shelf's seed).
//
//   SHELF { cap }   ENDLESS { lives, skips, grade }   shelfAdd(entries, def, code) -> { ok, entries, why? }   shelfDrop(entries, hash) -> entries
//   gradeOf(seconds, par) -> 'gold' | 'silver' | 'bronze' | null   endlessStart(entries, rand) -> run | null
//   endlessCurrent(run) -> entry | null   endlessStep(run, { t: 'finish', grade } | { t: 'fail' } | { t: 'skip' }) -> { run, ended?: why }
// ---------------------------------------------------------------------------------------
import { hashOf } from './trackdef.js';

/** The shelf: tracks at most (a code is some 3,500 characters). */
export const SHELF = { cap: 10 };
/** An endless run: lives, skips, and the grades as shares of the track's one-lap pace (a lap at or under 0.9 of it is gold ...); slower than
 *  `bronze` of it fails the track. */
export const ENDLESS = { lives: 3, skips: 1, grade: { gold: 0.9, silver: 1.05, bronze: 1.3 } };

/** Put a track on the shelf by its code (once a geometry: its hash). Refused when full or a duplicate. */
export function shelfAdd(entries, def, code) {
  const hash = hashOf(def);
  if (entries.some((e) => e.hash === hash)) return { ok: false, entries, why: 'dup' };
  if (entries.length >= SHELF.cap) return { ok: false, entries, why: 'full' };
  return { ok: true, entries: [...entries, { hash, name: def.name || 'Track', code, best: null }] };
}
export const shelfDrop = (entries, hash) => entries.filter((e) => e.hash !== hash);

/** A lap's grade against the one-lap pace; null: too slow, the track is failed. */
export function gradeOf(seconds, par) {
  const k = seconds / Math.max(1e-6, par), G = ENDLESS.grade;
  return k <= G.gold ? 'gold' : k <= G.silver ? 'silver' : k <= G.bronze ? 'bronze' : null;
}

/** Begin a run on the shelf (two tracks at least): the order shuffled once by `rand` (Fisher-Yates). */
export function endlessStart(entries, rand) {
  if (!entries || entries.length < 2 || !rand) return null;
  const order = entries.map((e) => e.hash);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { order, i: 0, lives: ENDLESS.lives, skips: ENDLESS.skips, streak: 0, grades: [], over: false };
}
export const endlessCurrent = (run) => (run && !run.over ? run.order[run.i] : null);

/** One result of the current track. A finish counts the streak and moves on; a fail takes a life (none left: over) and moves on; a skip
 *  moves on if one is left. At the shelf's end the run is over, cleared. */
export function endlessStep(run, ev) {
  if (!run || run.over) return { run, ended: run?.over ? run.why : null };
  const r = { ...run, grades: run.grades.slice() };
  if (ev.t === 'skip') { if (r.skips <= 0) return { run }; r.skips--; }
  else if (ev.t === 'finish' && ev.grade) { r.streak++; r.grades.push(ev.grade); }
  else { r.lives--; if (r.lives <= 0) { r.over = true; r.why = 'lives'; return { run: r, ended: 'lives' }; } }
  r.i++;
  if (r.i >= r.order.length) { r.over = true; r.why = 'cleared'; return { run: r, ended: 'cleared' }; }
  return { run: r };
}
