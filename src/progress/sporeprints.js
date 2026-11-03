// ---------------------------------------------------------------------------------------
// WILD SPORE PRINTS (docs/plans/MYCELIUM.md section 3, "the strains held"; GAPS.md G155): spores are found where a fungus grows wild,
// in the Dunes and on the damp floors of the Great Dunemaw, as well as grown from Myggdrasil's branches. A print found for a strain you
// do not hold teaches it (`SporeBeds.learn`); one found for a strain you hold is a material of that strain's feeling's colour, a small
// gift. Which prints are out on a game day is seeded by the day, the same for everyone; each is taken once a game day. A found print is
// a pickup in the world (F or USE): its places and look are Petra's and Calissa's (docs/handoffs/petra/2026-11-03-from-dovina-garden-life.md).
//
// - WHERE: `where` an area of the Dunes (progress/areas.js: weir, shore, ridges, flats, ruins) or `well` with the floors (1 to 3) it can
//   grow on; the Great Dunemaw's floors 2 and 3 are damp (data: `DAMP`), the first and the open sand are dry. A print on a damp floor is
//   likelier (`odds` x `DAMP.k` there, to 1).
// - WHAT: the lichen on the ridges (wonder), koji at the Weir (mirth), the inkcap among the ruins (desire), the oyster and the
//   witches' butter on the damp floors (grief, dread). The first two strains come with the first bed (sporebeds.js SPORE.first); wild
//   prints are the road to the rest that needs no card hung.
//
// Prior art: Stardew Valley's forage that shows by season and place, Animal Crossing's mushrooms on the island by season, Monster
// Hunter's gathering points that come back, a mycologist's field find.
//
//   WILD_PRINTS[id] = { strain, where, floors?, odds, does }   DAMP   printsOut(day) -> [id]   game.sporePrints = new SporePrints(game)
//   .out(here?) -> [id]   .take(id, here?) -> { ok, why?, first, strain }   events: spore.print { print, strain, first, gift, by }
// ---------------------------------------------------------------------------------------
import { today } from '../core/calendar.js';
import { FEELING_HUE, kindOfHue } from './mycelium.js';
import { makeMaterial } from './econ/materials.js';

export const WILD_PRINTS = {
  ridgeLichen: { strain: 'wonder', where: 'ridges', odds: 0.5, does: 'lichen grey on a ridge crystal' },
  weirKoji: { strain: 'mirth', where: 'weir', odds: 0.5, does: 'koji bloom on a damp jetty post' },
  ruinInkcap: { strain: 'desire', where: 'ruins', odds: 0.45, does: 'inkcaps among the ruin stones' },
  dampOyster: { strain: 'grief', where: 'well', floors: [2, 3], odds: 0.4, does: 'oyster shelves on a streaming wall' },
  dampButter: { strain: 'dread', where: 'well', floors: [2, 3], odds: 0.4, does: "witches' butter in a floor's wet dark" },
};
/** The Great Dunemaw's damp floors, and how much likelier a print is on one. */
export const DAMP = { floors: [2, 3], k: 1.5 };

const hashDay = (day, id) => { let h = 2166136261 ^ day; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 15; return (Math.imul(h, 2246822519) >>> 0) / 4294967296; };
/** The prints out on a game day (the same for everyone), the damp floors' likelier. `damp`: a print on a damp floor. */
export function printsOut(day = today()) {
  return Object.keys(WILD_PRINTS).filter((id) => {
    const P = WILD_PRINTS[id], k = P.where === 'well' && P.floors.every((f) => DAMP.floors.includes(f)) ? DAMP.k : 1;
    return hashDay(day, id) < Math.min(1, P.odds * k);
  });
}

const fresh = () => ({ taken: {} });

export class SporePrints {
  constructor(game) {
    this.game = game; this.s = fresh();
    game.save?.section('sporePrints', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
  }
  /** The prints out and not yet taken today, those of `here` ({ where, floor }) if said, else all. */
  out(here = null) {
    const day = today();
    return printsOut(day).filter((id) => this.s.taken[id] !== day && (!here || (WILD_PRINTS[id].where === here.where && (!WILD_PRINTS[id].floors || WILD_PRINTS[id].floors.includes(here.floor)))));
  }
  /** Take one: a strain you do not hold is learned, one you hold gives a small material of its colour. */
  take(id, here = null) {
    const P = WILD_PRINTS[id], day = today();
    if (!P) return { ok: false, why: 'There is no such print.' };
    if (!this.out(here).includes(id)) return { ok: false, why: 'There is nothing to take there.' };
    const beds = this.game.sporeBeds, first = !beds?.strains?.[P.strain]; let gift = null;
    this.s.taken[id] = day; this.game.save?.dirty('sporePrints');
    if (first) beds?.learn(P.strain);
    else { const kind = kindOfHue(FEELING_HUE[P.strain]), seed = Math.floor(hashDay(day, id + 'm') * 1e9); this.game.pneuka?.add(`mat.${kind}`, 'print', 0, makeMaterial(kind, seed, 0)); gift = kind; }
    this.game.events?.emit('spore.print', { print: id, strain: P.strain, first, gift, by: 'courier' });
    return { ok: true, first, strain: P.strain };
  }
}
