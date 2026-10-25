// ---------------------------------------------------------------------------------------
// TRACKING, THE LOG'S WORDS SHARED: the small word-makers the rule files share when they write a line (a count and its noun, an article,
// a clock, a fixed-decimal number) and the three name lookups they put in it (a Veritome card, a thing in the Pneuka Box, a creature's
// kind). Moved out of tracking.js whole, unchanged. Pure: nothing here says or counts.
//
//   plural(n, word)   an(word)   clock(seconds)   fx(number, decimals)   CARD(id)   ITEM(id)   KIND(kind)
// ---------------------------------------------------------------------------------------
import { CARD as VCARD } from '../../tools/veritome/cards.js';
import { itemOf } from '../../pneuka/items.js';

export const fx = (v, d = 2) => Number(v).toFixed(d);
export const plural = (n, w) => `${n} ${n === 1 ? w : `${w.replace(/([^aeiou])y$/, '$1ie')}s`}`; // (slip jellies, not jellys: QA-A)
export const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
export const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
export const CARD = (id) => VCARD[id]?.name || id;
export const ITEM = (id) => itemOf(id)?.name || CARD(id);
export const KIND = (k) => (k === 'slipjelly' ? 'slip jelly' : k === 'clapperjar' ? 'clapperjar' : 'creature');
