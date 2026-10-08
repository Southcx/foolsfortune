// ---------------------------------------------------------------------------------------
// THE CARDS: the catalogue of everything the Veritome can hold. The Veritome is the Courier's inventory, and a card is how a thing is
// kept in it: this is Greed Island's Book (Hunter x Hunter), made formal at the scale of a prototype.
//
//  - DESIGNATED PAGES. Every kind of card has a numbered page of its own (000 onward), grouped in SECTIONS: the Major Arcana (truths
//    photographed), the Curios (things found in chests), the Creatures (portraits good enough to be a card, as Wind Waker's Carlov
//    makes a figurine of whoever is in a good pictograph). A page with its card in it is FILLED; the Book's completion is its pages.
//  - RANK (SS, S, A to H) is how hard a card is to come by; LIMIT is how many copies of it the Book may hold (the page, and spares).
//  - FORM. A card with an item form ('item') is a thing kept: it is STORED from the Pneuka Box (pneuka/box.js) and TAKEN OUT into it
//    again, the Book being the bank. A card with no item form is a picture of something known (an Arcana, a creature): it is only
//    ever a card.
//  - WORTH: what a spare copy condenses into, in Lachryma cubes (Greed Island's shops buy cards; here the Book condenses them).
//
// New sections go on the end of the numbering (the .hack-style "offline MMO" layers to come will add theirs), so a page's number is
// stable once given.
//
//   CARDS (in page order)   CARD[id]   SECTIONS   RANKS   WORTH[rank]   cardArt(id, w, h, { back }) -> canvas (drawn once, cached)
// ---------------------------------------------------------------------------------------
import { ARCANA, EMBLEM } from './arcana.js';
import { ECON } from '../../progress/econ/table.js';
import { CURIOS, TIERS as CHEST_TIERS } from '../../world/treasure/treasure.js';
import { CREATURES } from './bestiary.js';

export const RANKS = ['SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const WORTH = ECON.condense; // (progress/econ/table.js: the rebalance of R38 cut it to about a quarter at the top)
export const FREE_SLOTS = 20;

const CURIO_RANK = ['F', 'D', 'B', 'A', 'S'], CURIO_LIMIT = [3, 3, 2, 1, 1];
const FISH_RANK = ['G', 'E', 'D', 'B', 'A', 'SS'], FISH_LIMIT = [3, 3, 3, 2, 1, 1];

export const SECTIONS = [
  { id: 'arcana', name: 'THE MAJOR ARCANA', blurb: 'Truths of the workshop, photographed. Each page is a riddle until its sitting is caught on a plate and appraised.' },
  { id: 'curio', name: 'CURIOS', blurb: 'Things with a life behind them, found in chests. A curio goes into the Pneuka Box (P); stored in the Veritome it is a card here.' },
  { id: 'creature', name: 'CREATURES', blurb: 'A portrait good enough to be a card: a creature as the main subject of a photograph of three stars or more.' },
];

export const CARDS = [];
const add = (c) => { CARDS.push({ ...c, num: CARDS.length, page: String(CARDS.length).padStart(3, '0') }); };
for (const a of ARCANA) add({ id: `arcana.${a.id}`, section: 'arcana', key: a.id, name: a.name, rank: a.rank, limit: a.limit, form: 'none', roman: a.roman, hint: a.hint, lore: a.lore, sitting: a.sitting });
for (const c of CURIOS) add({ id: `curio.${c.id}`, section: 'curio', key: c.id, name: c.name, rank: CURIO_RANK[c.tier], limit: CURIO_LIMIT[c.tier], form: 'item', tier: c.tier, glyph: c.glyph, hint: `found in ${CHEST_TIERS[c.tier].name} chests`, lore: c.blurb });
for (const [id, C] of Object.entries(CREATURES)) {
  const fish = !!C.fish;
  add({ id: `creature.${id}`, section: 'creature', key: id, name: C.name, rank: fish ? FISH_RANK[C.tier] : 'G', limit: fish ? FISH_LIMIT[C.tier] : 3, form: 'none', glyph: C.glyph, fish: C.fish || null,
    hint: fish ? 'a fish, photographed well, in the water or clear of it' : 'a clapperjar, the main subject of a good photograph', lore: C.blurb });
}
export const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const cardsOf = (section) => CARDS.filter((c) => c.section === section);

// ---- the art ------------------------------------------------------------------------------------
const FIELD = { arcana: ['#2b2050', '#14102a'], curio: ['#3a2216', '#1c0f09'], creature: ['#163028', '#0b1813'] };
const CACHE = new Map();

/** A card face (a canvas, w x h), drawn once and kept. `back`: the Book's back instead (an empty page). */
export function cardArt(id, w = 120, h = 200, { back = false } = {}) {
  const key = `${id}|${w}|${h}|${back}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), A = CARD[id];
  const gold = '#e7c46a';
  const [f0, f1] = FIELD[A?.section] || FIELD.arcana;
  const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, f0); grad.addColorStop(1, f1);
  g.fillStyle = grad; roundRect(g, 1, 1, w - 2, h - 2, w * 0.07); g.fill();
  g.strokeStyle = gold; g.lineWidth = Math.max(1.5, w * 0.025); roundRect(g, w * 0.05, w * 0.05, w * 0.9, h - w * 0.1, w * 0.05); g.stroke();
  g.lineWidth = 1; roundRect(g, w * 0.09, w * 0.09, w * 0.82, h - w * 0.18, w * 0.04); g.stroke();
  g.fillStyle = gold; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (back || !A) {
    // the back: the Veritome's own cover (a clock, a compass rose, the lens)
    const cx = w / 2, cy = h / 2, R = w * 0.3;
    g.lineWidth = w * 0.02;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
    g.beginPath(); g.moveTo(cx, cy - R * 0.7); g.lineTo(cx + R * 0.12, cy); g.lineTo(cx, cy + R * 0.7); g.lineTo(cx - R * 0.12, cy); g.closePath(); g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    CACHE.set(key, c); return c;
  }
  // the head: a numeral, a page number, or the rank
  g.font = `${Math.round(w * 0.13)}px Georgia, 'Times New Roman', serif`;
  g.fillText(A.roman ?? A.page, w / 2, w * 0.2);
  const S = w * 0.7, ox = (w - S) / 2, oy = h * 0.3;
  g.save(); g.translate(ox, oy); g.scale(S, S);
  g.strokeStyle = gold; g.fillStyle = gold; g.lineWidth = 0.035; g.lineCap = 'round'; g.lineJoin = 'round';
  if (A.section === 'arcana') (EMBLEM[A.key] || (() => {}))(g);
  else if (A.section === 'curio') { g.font = '0.62px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = hexOf(CHEST_TIERS[A.tier].rgb); g.fillText(A.glyph, 0.5, 0.5); g.strokeStyle = gold; C(g, 0.5, 0.5, 0.44); }
  else if (A.fish) fishEmblem(g, CREATURES[A.key]);
  else jarEmblem(g);
  g.restore();
  // the rank at the foot
  g.fillStyle = gold; g.font = `${Math.round(w * 0.12)}px Georgia, serif`;
  g.fillText(A.rank, w / 2, h - w * 0.2);
  CACHE.set(key, c);
  return c;
}

const hexOf = (n) => `#${n.toString(16).padStart(6, '0')}`;
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const C = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
function jarEmblem(g) {
  // a clapperjar: the round body, the neck, the lid ajar, two eyes
  g.beginPath(); g.ellipse(0.5, 0.62, 0.27, 0.25, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(0.36, 0.42); g.lineTo(0.38, 0.32); g.lineTo(0.62, 0.32); g.lineTo(0.64, 0.42); g.stroke();
  g.save(); g.translate(0.5, 0.28); g.rotate(-0.35); g.beginPath(); g.ellipse(0, -0.02, 0.16, 0.05, 0, 0, Math.PI * 2); g.stroke(); g.restore();
  for (const x of [0.42, 0.58]) { g.beginPath(); g.arc(x, 0.58, 0.03, 0, Math.PI * 2); g.fill(); }
}
function fishEmblem(g, Cr) {
  // a fish: a lens-shaped body and a forked tail, in the species' own colour
  g.save(); g.strokeStyle = '#e7c46a';
  g.beginPath(); g.moveTo(0.12, 0.5); g.quadraticCurveTo(0.45, 0.22, 0.72, 0.5); g.quadraticCurveTo(0.45, 0.78, 0.12, 0.5); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(0.72, 0.5); g.lineTo(0.92, 0.36); g.lineTo(0.86, 0.5); g.lineTo(0.92, 0.64); g.closePath(); g.stroke();
  g.beginPath(); g.arc(0.26, 0.47, 0.025, 0, Math.PI * 2); g.fill();
  if (Cr?.legend) { for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.arc(0.45 + Math.cos(a) * 0.36, 0.5 + Math.sin(a) * 0.36, 0.02, 0, Math.PI * 2); g.fill(); } }
  g.restore();
}
