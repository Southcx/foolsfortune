// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, BATCH AND AUTO-COOK: the two conveniences a dish earns once it is known by the hand (docs/plans/SPIRIT-COOKING.md
// 2.8, 9, 15; GAPS G228). Neither is ever a better dish than the hand's: skill skips grind, grind closes the gap (DESIGN.md 22).
//
//  - BATCH: cook up to ten of one dish at once, opened for that dish by three TRUE cooks of it (every move at its heart: dishes.js
//    gradeOf). You play the dish once; every serving is that one cook's grade, so a batch can only equal the hand cook it is. It costs the
//    add-in times n (the pantry's staples are free, as for one); n fish for a fish dish. One serving is served at once (its draught laid,
//    as a single dish is); the rest go into the Pneuka Box as servings (kind `dish`, ten to a slot), each eaten later for its own draught.
//    The draught never stacks: eating one replaces the draught held, as a drink or a single dish does (Stardew's one buff). On the ledger
//    a batch is ONE cook (one `cook.serve`, one `cook.true` at most), so batching never grinds a count or an achievement faster.
//  - AUTO-COOK: the dish made with no minigame, at one grade below your best for it, never above PERFECT (TRUE is the hand's alone), and
//    never if that would be DUBIOUS. A knack (`autoCook`, Dovina's row in progress/knacks.js): an assist, earned, switched off at will.
//    Per dish it opens by a count way (5 cooks of it) or a feat way (one TRUE of it). It takes the add-in as a hand cook does, gives no
//    practice and no seasoning (the hand did not cook), is instant (the proof's game hour skipped: the knack's whole point), and may be
//    batched where the batch is open. It counts one `cook.serve` and `cook.auto`; it can never raise a dish's best.
//
// Numbers, with their reasons: ten (the plan's "up to 10", Fantasy Life's batch; a slot of servings holds ten so a whole batch's rest
// fits one slot); three TRUE (a dish mastered, not lucked: three hearts in every move); auto one grade below (the plan's line; Monster
// Hunter's auto-cook gives the plain steak, never the well-done); 5 cooks (OSRS's make-X needs the recipe made by hand first; five is a
// few game hours of bread at the hearth's pace).
//
// Prior art: Stardew Valley's kitchen (one dish a cook, no batch: the chore this refuses), Breath of the Wild (one meal a cook, five
// ingredients at most), Atelier's synthesis quantity (a recipe's yield raised once known), Monster Hunter's canteen and the BBQ spit's
// auto (a cooked steak, never the perfect one, with no timing), Old School RuneScape's make-X (n of a thing in one choice, its timers).
//
//   BATCH { max, trues }   AUTO { cooks, trues, below, ceiling }   batchOpen(dish, L)   batchMax(dish, L, have)   autoCookOf(dish, L) -> grade id | null
//   servingId(dish, grade) -> 'dish.<family>.<addin>.<grade>'   servingOf(id) -> { family, addin, dish, grade } | null   servingItem(id) -> an ITEMS entry (items.js itemOf)
//   serveAt(family, addin, grade) -> served (the dish at a grade, no minigame: dishes.js serve's shape)   costOf(addin, n) -> { [id]: n }
//   (L: the ledger, progress/stats.js: get, best. A dish is its id, dishes.js dishFor: '<family>.<addin | plain>'.)
// ---------------------------------------------------------------------------------------
import { FAMILIES, GRADES, gradeById, dishFor, dishDraught } from './dishes.js';
import { tasteOf, isFish } from './flavour.js';

/** A batch: at most ten servings, opened for a dish by three TRUE cooks of it. */
export const BATCH = { max: 10, trues: 3 };
/** Auto-cook: opened for a dish by 5 cooks of it or one TRUE; one grade below your best for it, never above PERFECT. */
export const AUTO = { cooks: 5, trues: 1, below: 1, ceiling: 'perfect' };

const ORDER = GRADES.map((G) => G.id); // dubious, fair, good, great, perfect, true (tracking/cooking.js's `cook.grade` and `cook.best.<dish>` index)
const G = (L, k) => Math.max(L?.get?.(k) || 0, L?.best?.(k) || 0);

/** The batch is open for this dish: three TRUE cooks of it. */
export const batchOpen = (dish, L) => G(L, `cook.true.${dish}`) >= BATCH.trues;
/** How many you may cook at once: one until the batch is open, then up to ten, and no more than the add-ins you hold (`have`: Infinity for a plain dish). */
export const batchMax = (dish, L, have = Infinity) => (batchOpen(dish, L) ? Math.max(1, Math.min(BATCH.max, have)) : 1);

/** Your best for a dish on the ledger, as its index in GRADES (0 none). A TRUE kept on the ledger counts even before `cook.best` was kept. */
export const bestIndexOf = (dish, L) => Math.max(G(L, `cook.best.${dish}`), G(L, `cook.true.${dish}`) > 0 ? ORDER.indexOf('true') : 0);
/** The grade auto-cook would make this dish at, or null (not yet earned for it, or one below your best would be dubious). */
export function autoCookOf(dish, L) {
  if (G(L, `cook.dish.${dish}`) < AUTO.cooks && G(L, `cook.true.${dish}`) < AUTO.trues) return null;
  const i = Math.min(bestIndexOf(dish, L) - AUTO.below, ORDER.indexOf(AUTO.ceiling));
  return i >= ORDER.indexOf('fair') ? ORDER[i] : null;
}

/** What n of a dish costs from the Pneuka Box: its add-in n times (a fish dish n fish); the pantry is free. */
export const costOf = (addin, n = 1) => (addin ? { [isFish(addin) ? addin : `ing.${addin}`]: n } : {});

/** The dish served at a grade with no minigame (an auto-cook, or a serving from a batch eaten later): dishes.js serve's shape and
 *  numbers, its taste the base and the add-in, no adjustment (the adjustment's lift is already in the grade). */
export function serveAt(family, addin, grade) {
  const dish = dishFor(family, addin), F = FAMILIES[family], Gr = gradeById(grade);
  if (!dish || (F?.needsFish && !isFish(addin))) return { dish, grade: 'dubious', taste: null, draught: null };
  const t = tasteOf([...(F?.base || []), ...(addin ? [addin] : [])]);
  return { dish, grade: Gr.id, taste: t, draught: dishDraught(t, Gr) };
}

// ------------------------------------------------------------------ a serving as a thing in the Pneuka Box
/** A serving's thing id: its dish and grade (a stack is one dish at one grade). */
export const servingId = (dish, grade) => `dish.${dish}.${grade}`;
/** A serving's id read back: its family, add-in (null for plain), dish id and grade; null when it is not one. */
export function servingOf(id) {
  const m = /^dish\.([a-z]+)\.(.+)\.([a-z]+)$/.exec(String(id)); if (!m) return null;
  const [, family, add, grade] = m, addin = add === 'plain' ? null : add;
  if (!FAMILIES[family] || !ORDER.includes(grade) || grade === 'dubious') return null;
  const D = dishFor(family, addin); return D ? { family, addin, dish: D.id, label: D.label, grade } : null;
}
const SERVINGS = new Map();
/** A serving's ITEMS entry, made once on asking (pneuka/items.js itemOf falls back here: dishes are too many to list, and the id says all). */
export function servingItem(id) {
  if (SERVINGS.has(id)) return SERVINGS.get(id);
  const S = servingOf(id), it = S && { id, kind: 'dish', key: S.dish, name: `${S.label} · ${gradeById(S.grade).label}`, glyph: '◒', color: 0xd8a860, tier: 0,
    examine: `A serving of ${S.label.toLowerCase()}, cooked ${S.grade}. Eat it for its draught; it replaces the one you hold.`, card: null, lure: false, stack: BATCH.max };
  SERVINGS.set(id, it || null); return it || null;
}
