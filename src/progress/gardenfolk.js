// ---------------------------------------------------------------------------------------
// FOLK WHO COME BY, DRAWN BY WHAT THE GARDEN SHOWS (docs/plans/GARDEN-COZY.md C4, GAPS.md G115; the wild Figments that settle are
// progress/realm.js VISITORS, and the briar ones among them were G119). The folk's opinion is the garden's rating said in a voice,
// never a number: it comes as a band (`OPINIONS`) and the log says the band in the visitor's words (placeholders for Espada's).
//
// - Pip comes to a garden in bloom (a planetoid over HARMONY.bloom), Saggar to one with pots in it (the Kiln Yard's pieces placed and
//   the keepsake pots fired), Raku to appraise one that has opened lake lotuses, a sibling to a garden you share (the party called).
// - At most one visits a game day, on the first visit that day, the one not seen longest (ties by a seeded draw). A first visit, and
//   one in every `giftEvery`, leaves a gift: a piece of the visitor's own set that has the `visitor` way, one not yet owned
//   (Pip the Tea Path's, Saggar the Kiln Yard's, Raku the Stargazer's: the three sets of no feeling have their visitor way here).
//   Nothing is lost by a garden that draws no one, and nobody is drawn twice a game day.
//
// Prior art: Viva Pinata's visitors who come for what a garden has (and its keeper's rating said by a character), Animal Crossing's
// Isabelle who rates the island in words and never a number, Stardew Valley's villagers who drop in by their own days.
//
//   FOLK[id] = { name, set, why }   OPINIONS   GIFT   opinionOf(lotuses) -> band   drawn(garden) -> [id]   giftFor(id, owns) -> piece id | null
//   pick(garden, seen, day) -> id | null   (pure: scripts/garden-life.mjs)
//   game.gardenFolk = new GardenFolk(game)   .visit() -> { folk, ... } | null   events: garden.folk { folk, why, opinion, gift, visits, day, by }
// ---------------------------------------------------------------------------------------
import { DECOR } from './decor.js';
import { today } from '../core/calendar.js';

/** The folk who come, what draws each, and the set whose visitor pieces each brings. `test(garden)`: is it drawn. */
export const FOLK = {
  pip: { name: 'Pip', set: 'teapath', why: 'bloom', test: (g) => g.bloom >= 1 },
  saggar: { name: 'Mistress Saggar', set: 'kilnyard', why: 'pots', test: (g) => g.pots >= 3 },
  raku: { name: 'Raku', set: 'stargazer', why: 'rating', test: (g) => g.lotuses >= 2 },
  sibling: { name: 'a sibling', set: null, why: 'party', test: (g) => g.siblings >= 1 },
};
export const GIFT = { every: 3 }; // (a first visit gives, then one visit in `every`)
/** The garden's rating said in bands (lake lotuses 0 to 5; GARDEN-COZY.md D4): what a visitor's remark is about, never shown as a number. */
export const OPINIONS = ['bare', 'young', 'fair', 'lovely', 'splendid', 'wondrous'];
export const opinionOf = (lotuses = 0) => OPINIONS[Math.max(0, Math.min(OPINIONS.length - 1, Math.floor(lotuses)))];

/** Who the garden draws now. `g` = { bloom (planetoids in bloom), pots (placed Kiln Yard pieces and keepsake pots), lotuses, siblings }. */
export const drawn = (g = {}) => Object.keys(FOLK).filter((id) => FOLK[id].test(g));

/** The piece a folk would leave: one of its set with the `visitor` way, not yet owned (`owns(id)`). Null for a visitor with no set. */
export function giftFor(id, owns = () => false) {
  const set = FOLK[id]?.set; if (!set) return null;
  return Object.keys(DECOR).find((p) => DECOR[p].set === set && DECOR[p].from.includes('visitor') && !owns(p)) || null;
}

/** The one who comes on a game day: of those drawn, the one seen longest ago (never seen first), ties by the day's seeded draw. `seen[id]` = last day. */
export function pick(g, seen = {}, day = today()) {
  const ids = drawn(g); if (!ids.length) return null;
  const rank = (id) => (seen[id] == null ? -Infinity : seen[id]);
  const least = Math.min(...ids.map(rank)), tied = ids.filter((id) => rank(id) === least);
  return tied[Math.abs(Math.imul(day + 1, 2654435761)) % tied.length];
}

const fresh = () => ({ day: null, seen: {}, n: {} });

export class GardenFolk {
  constructor(game) {
    this.game = game; this.s = fresh();
    game.save?.section('gardenFolk', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    game.events?.on?.('garden.enter', (e) => { if ((e?.by ?? 'courier') === 'courier') this.visit(); });
  }
  /** The garden as the folk see it. */
  garden() {
    const g = this.game, H = g.harmony?.list?.() || [], placed = g.decor?.s?.placed || [];
    const kiln = placed.filter((p) => DECOR[p[0]]?.set === 'kilnyard').length;
    return { bloom: H.filter((p) => p.band === 'bloom').length, pots: kiln + (g.keepsakes?.pots?.length || 0), lotuses: g.ledger?.best?.('garden.lotuses') || 0, siblings: g.party?.list?.length || 0 };
  }
  /** The first visit of a game day: who comes, what they think of the garden, and perhaps a gift. */
  visit() {
    const day = today(); if (this.s.day === day) return null; this.s.day = day;
    const g = this.garden(), id = pick(g, this.s.seen, day);
    this.game.save?.dirty('gardenFolk'); if (!id) return null;
    const visits = (this.s.n[id] = (this.s.n[id] || 0) + 1); this.s.seen[id] = day;
    const gift = (visits - 1) % GIFT.every === 0 ? giftFor(id, (p) => this.game.decor?.owns?.(p)) : null;
    if (gift) this.game.decor?.give?.(gift, 'visitor');
    const out = { folk: id, why: FOLK[id].why, opinion: opinionOf(g.lotuses), gift, visits, day };
    this.game.events?.emit('garden.folk', { ...out, by: 'courier' });
    return out;
  }
}
