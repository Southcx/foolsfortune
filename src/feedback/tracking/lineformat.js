// ---------------------------------------------------------------------------------------
// TRACKING, THE LOG'S WORDS SHARED: the small word-makers the rule files share when they write a line (a count and its noun, an article,
// a clock, a fixed-decimal number) and the three name lookups they put in it (a Veritome card, a thing in the Pneuka Box, a creature's
// kind). Moved out of tracking.js whole, unchanged. Pure: nothing here says or counts.
//
//   plural(n, word)   an(word)   clock(seconds)   fx(number, decimals)   CARD(id)   ITEM(id)   KIND(kind)
//   said(g, text)   a line with {id}s (core/bindings.js) said as the device last touched calls each: a pad or touch with no word for
//   one falls back to the key's, and a line that opens on one is capitalised (Espada's device words, 2026-10-27)
// ---------------------------------------------------------------------------------------
import { CARD as VCARD } from '../../tools/veritome/cards.js';
import { itemOf } from '../../pneuka/items.js';
import { deviceWord } from '../../progress/devicewords.js';

export const said = (g, text) => { const dev = g?.input?.device || 'keyboard', t = String(text).replace(/\{([a-zA-Z0-9]+)\}/g, (m, id) => deviceWord(id, dev) ?? deviceWord(id, 'keyboard') ?? id); return t[0].toUpperCase() + t.slice(1); };
export const fx = (v, d = 2) => Number(v).toFixed(d);
export const plural = (n, w) => `${n} ${n === 1 ? w : `${w.replace(/([^aeiou])y$/, '$1ie')}s`}`; // (slip jellies, not jellys: QA-A)
export const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
export const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
export const CARD = (id) => VCARD[id]?.name || id;
export const ITEM = (id) => itemOf(id)?.name || CARD(id);
export const KIND = (k) => (k === 'slipjelly' ? 'slip jelly' : k === 'clapperjar' ? 'clapperjar' : 'creature');
