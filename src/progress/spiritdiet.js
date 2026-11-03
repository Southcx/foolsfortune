// ---------------------------------------------------------------------------------------
// WHAT A SPIRIT TAKES IN BESIDE ITS MEALS: the tree's fruit, and the water of its own feeling (docs/plans/MYCELIUM.md 5, SPIRIT-GARDEN.md
// 11; GAPS.md G154 and G235). Spirits are fed by what the game drops (progress/spirits.js `feed`); these are the two other things that
// feed them, each a modifier with a source you can see.
//
// - FRUIT (G154): a fruit of Myggdrasil's crown (a material marked `fruit`, mycelium.js `fruit`, picked by myggdrasil.js) fed to a
//   spirit does three things at once. Its body drifts toward the fruit's colour (`tint`, a share of the way a fruit, kept on the sheet:
//   `sp.tint = { h, s, n }`, Calissa's to draw); its stat of the fruit's feeling follows the colour (the meal's own kind already raises
//   one; the fruit's colour decides when the two differ); and the kind of spirit likes one feeling's fruit and dislikes the feeling that
//   overcomes it (`tasteOf`, from its kind, the same every load): a liked fruit gives half again its stat, a disliked one half of it,
//   and the spirit's body says which (`spirit.taste`; no number, no line: Monster Rancher's and Rune Factory's likes shown by the body).
// - WATER (G235): a spirit that stands drinking water of its own feeling gains `WATERS.drink` points a game hour in that feeling's stat,
//   as a feed, never past the stat's cap (spirits.js MAX). The water a spirit stands at is the world's (`diet.waterOf(entry)`).
//
// Prior art: the Chao Garden (a body takes the colour of what it ate, stats follow the fruit), Monster Rancher's likes and dislikes and
// Rune Factory's gifts, Spiritfarer's food a passenger loves or hates.
//
//   DIET (the numbers)   tasteOf(kind) -> { likes, dislikes }   feelingOfHue(h) -> feeling   fruitMeal(sp, kind, meal) -> { feeling, taste, delta, tint }
//   drinkGain(sp, water, hours) -> points   game.spiritDiet = new SpiritDiet(game)   .waterOf = (entry) => feeling | null (the world's)   .update()
//   events read: spirit.feed { fruit, hue, sat, gain, stat }   events: spirit.taste { spirit, kind, taste, feeling }, spirit.tint { spirit, kind, h, s },
//   spirit.drink { spirit, kind, feeling, gain }   (all with `by`)
// ---------------------------------------------------------------------------------------
import { STATS, MAX } from './spirits.js';
import { WATERS } from './realm.js';
import { FEELING_HUE } from './mycelium.js';
import { pullStep } from './econ/materials.js';
import * as calendar from '../core/calendar.js';

/** The numbers: a liked fruit's stat x`like`, a disliked one's x`dislike`; a fruit moves the body's colour `tint` of the way, and it
 *  (the first fruit moves it from the spirit's own feeling's hue). */
export const DIET = { like: 1.5, dislike: 0.5, tint: 0.25 };
const FEELINGS = Object.keys(STATS); // wonder, mirth, desire, grief, dread
const OVERCOMES = { wonder: 'desire', desire: 'dread', dread: 'mirth', mirth: 'grief', grief: 'wonder' }; // (SPIRIT-GARDEN.md 1: wood over earth ...)
const overcomer = (f) => Object.keys(OVERCOMES).find((k) => OVERCOMES[k] === f);

/** The feeling whose hue a colour is nearest (the wheel, the five feelings' hues). */
export function feelingOfHue(h) {
  let best = FEELINGS[0], d = Infinity;
  for (const f of FEELINGS) { const dd = Math.abs(((h - FEELING_HUE[f] + 540) % 360) - 180); if (dd < d) { d = dd; best = f; } }
  return best;
}
/** What a kind of spirit likes and dislikes among the five feelings' fruit (from its kind; the dislike is the feeling that overcomes the like). */
export function tasteOf(kind = '') {
  const h = [...String(kind)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11), likes = FEELINGS[h % FEELINGS.length];
  return { likes, dislikes: overcomer(likes) };
}

/** A fruit eaten (pure): `meal` = { hue, sat, gain }, `gain` the points the meal's own kind raised (spirit.feed's). Returns the feeling
 *  of the colour, whether the kind likes or dislikes it, the points the fruit is worth to that feeling's stat (`want`) and the body's new tint. */
export function fruitMeal(sp = {}, kind = '', meal = {}) {
  const feeling = feelingOfHue(meal.hue ?? 0), T = tasteOf(kind), taste = feeling === T.likes ? 'likes' : feeling === T.dislikes ? 'dislikes' : null;
  const base = Math.max(0, Math.round(meal.gain || 0)), k = taste === 'likes' ? DIET.like : taste === 'dislikes' ? DIET.dislike : 1;
  const from = sp.tint ? { h: sp.tint.h, s: sp.tint.s } : { h: FEELING_HUE[sp.feeling] ?? 0, s: 0.6 };
  const c = pullStep(from, { h: meal.hue ?? 0, s: meal.sat ?? 0.6 }, DIET.tint, 0);
  return { feeling, taste, want: Math.round(base * k), tint: { h: +c.h.toFixed(1), s: +c.s.toFixed(3), n: (sp.tint?.n || 0) + 1 } };
}
/** Points drunk in `hours` game hours from water of a feeling: WATERS.drink an hour, only the spirit's own feeling's. */
export const drinkGain = (sp = {}, water = null, hours = 1) => (water && water === sp.feeling ? WATERS.drink * hours : 0);

const GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24;

export class SpiritDiet {
  constructor(game) {
    this.game = game; this.waterOf = null; this.last = null;
    game.events?.on?.('spirit.feed', (ev) => { if (ev.by === 'courier' && ev.fruit) this.eat(ev); });
  }
  /** The entry a spirit.feed names (by name, else the unnamed one of its kind). */
  entryOf(ev) { return (this.game.bound?.list || []).find((e) => e.sp && (ev.spirit ? e.name === ev.spirit : !e.name && e.kind === ev.kind)) || null; }
  /** A fruit fed: the stat follows the colour, the likes and dislikes bend it, the body takes the tint. */
  eat(ev) {
    const e = this.entryOf(ev); if (!e) return null;
    const S = e.sp, r = fruitMeal(S, e.kind, { hue: ev.hue, sat: ev.sat, gain: ev.gain, stat: ev.stat });
    // the meal's own kind raised `ev.stat` by `gain` already; the colour's feeling decides which stat the fruit is for
    const base = Math.max(0, Math.round(ev.gain || 0));
    if (ev.stat && ev.stat !== r.feeling && STATS[ev.stat] && S.stats[ev.stat] != null) S.stats[ev.stat] = Math.max(0, S.stats[ev.stat] - base);
    if (S.stats[r.feeling] != null) S.stats[r.feeling] = Math.max(0, Math.min(MAX, S.stats[r.feeling] + r.want - (ev.stat === r.feeling ? base : 0)));
    S.tint = r.tint;
    this.game.save?.dirty('bound');
    const out = { spirit: e.name || null, kind: e.kind, feeling: r.feeling };
    if (r.taste) this.game.events?.emit('spirit.taste', { ...out, taste: r.taste, by: 'courier' });
    this.game.events?.emit('spirit.tint', { ...out, h: r.tint.h, s: r.tint.s, by: 'courier' });
    return r;
  }
  /** A spirit drinking: `hours` game hours of water of `water` (the world calls it as a spirit stands in its own feeling's water). */
  drink(e, water, hours = 1) {
    const S = e?.sp, g = drinkGain(S, water, hours); if (!g || S.stats[S.feeling] == null) return 0;
    const was = S.stats[S.feeling]; S.stats[S.feeling] = Math.min(MAX, was + g); const got = S.stats[S.feeling] - was;
    if (got > 0) { this.game.save?.dirty('bound'); this.game.events?.emit('spirit.drink', { spirit: e.name || null, kind: e.kind, feeling: S.feeling, gain: got, by: 'courier' }); }
    return got;
  }
  /** Once a game hour, every raised spirit in water of its own feeling drinks (the world says where each stands: `waterOf`). */
  update() {
    if (!this.waterOf) return;
    const now = calendar.now(), h = Math.floor(now / GAME_HOUR); if (this.last == null) this.last = h;
    const n = Math.min(24, h - this.last); if (n <= 0) return; this.last = h;
    for (const e of this.game.bound?.list || []) if (e.sp) this.drink(e, this.waterOf(e), n);
  }
}
