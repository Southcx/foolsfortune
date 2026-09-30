// ---------------------------------------------------------------------------------------
// LURES: what is on the end of the line, as things the Courier owns. Every lure has a TASTE: how strongly it carries each of the five
// aspects of the mind (dread, wonder, grief, hunger, mirth: species.js), and a fish is drawn to it by how well that taste matches its
// own (each species' `aff`). That is the PASSIVE lure: it works by being what it is, cast and left.
//
// The ACTIVE lure is the Courier's own doing: every sounding (the psychic ping, MMB) pushes the aspect chosen with 4 to 8 into the lure
// for a while, on top of its own taste (it fades over some seconds), and the wave of it stirs EVERY fish in that water, more the nearer
// it passes (falloff with distance), whatever it was doing. A ping burns Lachryma, and so does reeling: the cost is the choice.
//
// Any CURIO the Courier owns can be tied on too. A curio is an object that has had a life, and it carries the feelings of it: its
// taste is written below from what it is (a knot no one could undo is grief and dread; a bell always a little flat of the last time is
// mirth and grief), and the rarer it is the stronger it pulls. Curios are never lost with a line: the mind lets go, the thing comes home.
//
// Prior art: Final Fantasy XIV's baits and mooching (each fish has its baits, and a catch is itself a bait), Animal Crossing's and
// Stardew Valley's bait and tackle (a lure changes what comes, not whether the game is fair), and Dredge's aberrant catches (what you
// fish with says something about you).
//
//   LURES   lureList(ledger) -> the lures owned now (made ones, then curios)   tasteOf(lure, boost) -> [5]   attraction(taste, sp) -> 0..~1.3
// ---------------------------------------------------------------------------------------
import { CURIOS, CURIO_BY_ID } from '../treasure.js';

// (dread, wonder, grief, hunger, mirth)
export const LURES = [
  { id: 'bob',   name: 'CLAY BOB',     glyph: '●', taste: [0.3, 0.3, 0.3, 0.3, 0.3], blurb: 'A pellet of the workshop\'s own clay. A little of everything; nothing much of anything.' },
  { id: 'eye',   name: 'BLACK EYE',    glyph: '◐', taste: [0.95, 0.15, 0.35, 0.2, 0.0], blurb: 'A glazed bead, black all the way through. It looks back.' },
  { id: 'fly',   name: 'STAR FLY',     glyph: '✦', taste: [0.05, 0.95, 0.2, 0.1, 0.4], blurb: 'Gold thread on a hook, tied to look like something seen once through a telescope.' },
  { id: 'tear',  name: 'TEAR BEAD',    glyph: '☂', taste: [0.25, 0.1, 0.95, 0.1, 0.0], blurb: 'Fired from the clay of a broken jar that someone kept anyway.' },
  { id: 'spoon', name: 'EMBER SPOON',  glyph: '◍', taste: [0.1, 0.2, 0.05, 0.95, 0.35], blurb: 'A bent spoon still warm from the kiln. Everything down there is hungry.' },
  { id: 'bell',  name: 'TIN CHIME',    glyph: '♪', taste: [0.0, 0.4, 0.05, 0.25, 0.95], blurb: 'A chime the size of a fingernail. It rings under water, very small.' },
];

// what each curio remembers (its taste); the tier sets how strongly it pulls
const CURIO_TASTE = {
  whelk: [0.2, 0.6, 0.5, 0.1, 0.3], shaker: [0.1, 0.2, 0.3, 0.7, 0.2], keepsake: [0.5, 0.1, 0.8, 0.1, 0.0], barnacle: [0.1, 0.2, 0.4, 0.3, 0.5],
  gull: [0.1, 0.8, 0.3, 0.1, 0.4], compass: [0.4, 0.7, 0.2, 0.3, 0.1], bell: [0.1, 0.3, 0.6, 0.1, 0.7], sconce: [0.2, 0.6, 0.5, 0.2, 0.2],
  pearl: [0.3, 0.5, 0.4, 0.6, 0.1], astrolabe: [0.3, 0.9, 0.2, 0.2, 0.1], ammonite: [0.4, 0.5, 0.8, 0.1, 0.0], amulet: [0.7, 0.1, 0.6, 0.2, 0.0],
  skull: [0.9, 0.1, 0.3, 0.6, 0.2], regalia: [0.1, 0.5, 0.2, 0.4, 0.8], hourglass: [0.6, 0.6, 0.7, 0.1, 0.1], storm: [0.8, 0.5, 0.1, 0.7, 0.3],
  lodestone: [0.7, 0.7, 0.7, 0.7, 0.7], orb: [0.6, 0.8, 0.4, 0.6, 0.6], bloom: [0.3, 0.9, 0.6, 0.2, 0.7], koi: [0.4, 0.9, 0.3, 0.8, 0.6],
};
const TIER_PULL = [1.1, 1.2, 1.3, 1.45, 1.6];

/** The lures the Courier has now: the six made ones, then every curio held (a curio's lure is the curio itself). */
export function lureList(ledger) {
  const out = [...LURES];
  for (const c of CURIOS) if (ledger?.get(`curio.${c.id}`) > 0) out.push({ id: `curio.${c.id}`, name: c.name.toUpperCase(), glyph: c.glyph, taste: CURIO_TASTE[c.id] || [0.4, 0.4, 0.4, 0.4, 0.4], pull: TIER_PULL[c.tier], curio: c.id, blurb: c.blurb });
  return out;
}
export const lureById = (id, ledger) => lureList(ledger).find((l) => l.id === id) || LURES[0];
export const isCurio = (id) => id?.startsWith('curio.') && !!CURIO_BY_ID[id.slice(6)];

/** A lure's taste now: its own, and what the soundings have pushed into it (boost: [5], fading). */
export function tasteOf(lure, boost = null, out = [0, 0, 0, 0, 0]) {
  const k = lure?.pull ?? 1;
  for (let i = 0; i < 5; i++) out[i] = Math.min(1.6, (lure?.taste?.[i] ?? 0.3) * k + (boost ? boost[i] : 0));
  return out;
}

/** How much a species wants a taste: its best match counts most, the whole of it a little (0 .. ~1.3). */
export function attraction(taste, sp) {
  let best = 0, sum = 0, w = 0;
  for (let i = 0; i < 5; i++) { const m = taste[i] * sp.aff[i]; best = Math.max(best, m); sum += m; w += taste[i]; }
  return best * 0.7 + (w > 0 ? sum / w : 0) * 0.3;
}
