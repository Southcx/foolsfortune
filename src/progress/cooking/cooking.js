// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, KEPT: what the Courier has learned at the hearth (each move's practice, the dishes' recipes and best grades), the dough
// proofing on the game clock, and the draught a served dish holds (docs/plans/SPIRIT-COOKING.md 7, 9). One save section, `cooking`.
//
// A served dish lays the one draught there is (game.draught, courier/mind.js; the press reads its lead feeling: progress/alchemy.js
// walk), at its strength, and holds it its real seconds: while the hold lasts the mind's fade is slowed to match (`fadeK`, asked by
// courier/mind.js beside a class art's Afterglow). A drink in a weather after a meal replaces the draught, as any drink does: one draught
// at a time (Stardew's one buff), and the hold ends with it. Seasoning goes to the move's own attribute (Focus for a band held, Dexterity
// for a rhythm kept, Perception for a taste read right), through Soul Alchemy's one gate (alchemy.season: at most 10 a game hour a source).
//
// Prior art: Stardew Valley (one buff, the next replacing it), Breath of the Wild (a recipe kept once made), Cooking Mama (practice
// shown, never lost), Soul Alchemy's swatch (practice widens the band).
//
//   game.cooking = new Cooking(game)   .practice(move)   .learn(dish, grade)   .known   .best(dishId)   .serve(result)   .fadeK()
//   .proofing { addin, knead, n, t0 }   .startProof(addin, knead, n)   .proofValue()   .serve(res, { n, auto })   .eat(slot)   .lay(draught)
// Long step: .startLong(info) .tend(mode) .longValue() .takeLong()   Recipes found: .teach(family, addin, via) .receive(giver) .checkSlabs(L) .mend(slab, picks) (recipes.js)
// Events (with `by`): cook.long { family, move }, cook.taste { giver, dish, label, fresh }, cook.slab { slab, state: found, tried, mended, dish }, cook.move { move, score, hit, ruined, dish }, cook.serve { dish, label, grade, feeling, strength, hold, first, true, n, kept, auto },
//   cook.dubious { dish, n }, cook.proof { addin }, cook.learn { dish, label }, cook.eat { dish, label, grade, feeling, strength, hold }
// A batch's servings and the auto-cook: progress/cooking/batch.js (a serving is a thing in the Pneuka Box, `dish.<dish>.<grade>`).
// ---------------------------------------------------------------------------------------
import { MOVES, practiceFrom } from './moves.js';
import { gradeById, dishFor } from './dishes.js';
import { fermentValue } from './plays.js';
import { GIFTS, slabOf, slabsOpen, mendSlab } from './recipes.js';
import { servingId, servingOf, serveAt } from './batch.js';
import { now as calNow, DAY_MS } from '../../core/calendar.js';
const GAME_HOUR = DAY_MS / 24;
import { DRAUGHT } from '../stones.js';

const ATTR = { focus: 'focus', dexterity: 'dexterity', perception: 'perception' };

export class Cooking {
  constructor(game) {
    this.game = game; this.reset();
    game.save?.section('cooking', { scope: 'player', version: 1,
      dump: () => ({ practice: this.s.practice, known: this.s.known, proof: this.s.proof, hold: this.s.hold, long: this.s.long, slabs: this.s.slabs }),
      load: (d) => { this.reset(); if (d && typeof d === 'object') { Object.assign(this.s.practice, d.practice || {}); Object.assign(this.s.known, d.known || {}); this.s.proof = d.proof || null; this.s.hold = d.hold || null; this.s.long = d.long || null; Object.assign(this.s.slabs, d.slabs || {}); } },
      reset: () => this.reset() });
  }
  reset() { this.s = { practice: {}, known: {}, proof: null, hold: null, long: null, slabs: {} }; }
  dirty() { this.game.save?.dirty('cooking'); }
  emit(n, p) { this.game.events?.emit(n, { ...p, by: 'courier' }); }

  practice(move) { return this.s.practice[move] || 0; }
  get known() { return this.s.known; }
  best(dish) { return this.s.known[dish]?.best || null; }

  /** One move done: its practice grows (more for a good one), its attribute is seasoned, the ledger hears it. */
  moved(move, r, dish) {
    const M = MOVES[move]; if (!M) return;
    this.s.practice[move] = Math.min(100, this.practice(move) + practiceFrom(r.ruined ? 0 : r.score));
    if (!r.ruined && r.score >= 0.6) this.game.alchemy?.season?.(ATTR[M.attr] || 'focus', 2 + 3 * r.score, `cook.${move}`);
    this.emit('cook.move', { move, score: r.score, hit: !!r.hit, ruined: !!r.ruined, dish });
    this.dirty();
  }
  /** The taste read right before the adjustment: Perception's seasoning. */
  tasted(right) { if (right) this.game.alchemy?.season?.('perception', 4, 'cook.taste'); }

  /** A dish served (dishes.js serve's result, or batch.js serveAt's for an auto-cook): its recipe kept, its best kept, its draught laid.
   *  `n` servings (a batch: progress/cooking/batch.js), the first served at once and the rest put in the Pneuka Box as servings; `auto`
   *  an auto-cook (no practice, no best raised, never TRUE). On the ledger a batch is one cook whatever its n. */
  serve(res, { n = 1, auto = false } = {}) {
    const id = res.dish.id, prev = this.s.known[id], first = !prev;
    const G = gradeById(res.grade), order = ['dubious', 'fair', 'good', 'great', 'perfect', 'true'];
    if (G.id === 'dubious') { this.game.lachryma?.gain?.(2, 'cook'); this.emit('cook.dubious', { dish: id, n }); this.dirty(); return res; } // (a little Lachryma back: the comedy's cheap fix; no recipe kept; a batch's add-ins spent with it)
    this.s.known[id] = { label: res.dish.label, best: prev && order.indexOf(prev.best) >= order.indexOf(G.id) ? prev.best : G.id, n: (prev?.n || 0) + 1, trues: (prev?.trues || 0) + (G.id === 'true' ? 1 : 0) };
    if (first) this.emit('cook.learn', { dish: id, label: res.dish.label });
    this.lay(res.draught);
    let kept = 0; // (the batch's rest, into the Box: a thing that will not fit falls at your feet, box.add)
    if (n > 1) { const sid = servingId(id, G.id); for (let i = 1; i < n; i++) { this.game.pneuka?.add(sid, 'cook'); kept++; } }
    const D = res.draught;
    this.emit('cook.serve', { dish: id, label: res.dish.label, grade: G.id, feeling: D?.feeling || null, strength: D?.strength || 0, hold: D?.hold || 0, first, true: G.id === 'true', n, kept, auto });
    this.dirty();
    return res;
  }
  /** A draught laid and held (one at a time: it replaces whatever draught is held, a drink's or a dish's). */
  lay(D) {
    if (!D) return;
    this.game.draught = { [D.feeling]: D.strength };
    this.s.hold = { feeling: D.feeling, strength: D.strength, until: performance.now() / 1000 + D.hold, hold: D.hold };
  }
  /** A serving from a batch eaten out of the Pneuka Box (its slot): its draught laid, replacing the one held. */
  eat(slot) {
    const box = this.game.pneuka, S = servingOf(box?.slots?.[slot]?.id); if (!S) return false;
    box.take(slot);
    const res = serveAt(S.family, S.addin, S.grade), D = res.draught; this.lay(D);
    this.emit('cook.eat', { dish: S.dish, label: S.label, grade: S.grade, feeling: D?.feeling || null, strength: D?.strength || 0, hold: D?.hold || 0 });
    this.dirty();
    return true;
  }

  /** The mind's fade while a dish's draught holds: what makes its strength last its hold, not a drink's real minute (1 otherwise). */
  fadeK() {
    const H = this.s.hold; if (!H) return 1;
    const d = this.game.draught || {}, lead = Object.keys(d).sort((a, b) => d[b] - d[a])[0];
    if (lead !== H.feeling || performance.now() / 1000 > H.until + 1) { this.s.hold = null; this.dirty(); return 1; } // (a drink replaced it, or it ran out)
    return Math.min(1, (H.strength / H.hold) / DRAUGHT.fadePerSec);
  }

  // ------------------------------------------------------------------ the proof, on the game clock
  /** Dough set to proof at the hearth (after the knead): its add-in and the knead's score kept with it. */
  startProof(addin, knead, n = 1) { this.s.proof = { addin, knead, n, t0: calNow() }; this.emit('cook.proof', { addin }); this.dirty(); }
  /** How far it has risen, 0..1 on the proof's scale (MOVES.proof: 0.5 doubled in its `rate` game hours). */
  proofValue() { const p = this.s.proof; if (!p) return 0; return Math.max(0, (calNow() - p.t0) / GAME_HOUR) * MOVES.proof.rate * 0.5; }
  takeProof() { const p = this.s.proof; this.s.proof = null; this.dirty(); return p; }
  get proofing() { return this.s.proof; }

  // ------------------------------------------------------------------ a long step on the game clock (the ferment; plays.js fermentValue)
  /** A long move set going (`info`: family, addin, n, idx, scores, hits). Its warmth starts steady; `tend` changes it. */
  startLong(info, at = calNow()) { this.s.long = { ...info, t0: at, segs: [], mode: 'steady', since: at }; this.emit('cook.long', { family: info.family, move: info.move }); this.dirty(); return this.s.long; }
  get long() { return this.s.long; }
  /** The warmth set (a mode of the move: cool, steady or warm), the time so far closed into its segments. */
  tend(mode, at = calNow()) {
    const Lg = this.s.long, M = MOVES[Lg?.move]; if (!Lg || !M?.modes?.[mode]) return false;
    Lg.segs.push([Math.max(0, (at - Lg.since) / GAME_HOUR), M.modes[Lg.mode].mult]); Lg.mode = mode; Lg.since = at; this.dirty(); return true;
  }
  /** How far the long move has come now (its closed segments and the open one). */
  longValue(at = calNow()) {
    const Lg = this.s.long, M = MOVES[Lg?.move]; if (!Lg || !M) return 0;
    return fermentValue([...Lg.segs, [Math.max(0, (at - Lg.since) / GAME_HOUR), M.modes[Lg.mode].mult]], M.rate);
  }
  takeLong() { const Lg = this.s.long; this.s.long = null; this.dirty(); return Lg; }

  // ------------------------------------------------------------------ recipes found by tasting and by repair (recipes.js)
  /** A recipe kept without cooking it (taught, or mended): a known dish with no best yet. False when already known. */
  teach(family, addin, via) {
    const D = dishFor(family, addin); if (!D || this.s.known[D.id]) return false;
    this.s.known[D.id] = { label: D.label, best: null, n: 0, trues: 0, via };
    this.emit('cook.learn', { dish: D.id, label: D.label, via }); this.dirty(); return true;
  }
  /** A dish one of the folk or a spirit gave you to taste (recipes.js GIFTS): its recipe kept. */
  receive(giver) {
    const G = GIFTS[giver]; if (!G) return null;
    const D = dishFor(G.family, G.addin), fresh = this.teach(G.family, G.addin, 'tasting');
    this.emit('cook.taste', { giver, dish: D.id, label: D.label, fresh });
    return { dish: D, fresh, line: G.line };
  }
  /** The slabs that have turned up for the ledger `L`, each told once (`cook.slab` found); the ids found so far. */
  checkSlabs(L) {
    for (const id of slabsOpen(L)) if (!this.s.slabs[id]) { this.s.slabs[id] = 'found'; const S = slabOf(id); this.emit('cook.slab', { slab: id, state: 'found', dish: dishFor(S.family, S.addin).id }); this.dirty(); }
    return Object.keys(this.s.slabs);
  }
  slabState(id) { return this.s.slabs[id] || null; }
  /** A slab mended with a move for each blank: whole, the recipe is kept (via repair); otherwise how many are right, and nothing is lost. */
  mend(id, picks) {
    const S = slabOf(id); if (!S || this.s.slabs[id] !== 'found') return null;
    const r = mendSlab(S, picks), D = dishFor(S.family, S.addin);
    if (r.ok) { this.s.slabs[id] = 'mended'; this.teach(S.family, S.addin, 'repair'); this.emit('cook.slab', { slab: id, state: 'mended', dish: D.id, label: D.label }); this.dirty(); }
    else this.emit('cook.slab', { slab: id, state: 'tried', dish: D.id, right: r.right, total: r.total });
    return r;
  }
}
