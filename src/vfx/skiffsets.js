// ---------------------------------------------------------------------------------------
// A SKIFF SET (the owner, 2026-10-24: "I feel like some of these cosmetics should be designed as a full set"): one look carried across
// every slot of the Solar Skiff's paint (Dovina's catalogue, progress/skiffpaint.js PAINT, worn as `game.skiffPaint.worn`): the hull
// painting (vfx/skiffhulls.js), the sail's dye, pattern and cut, the trail, the ribbon, the pennant (its colour) and its length (its shape), and the
// hull wrap. (The card back is not a paint kind, so a set carries none.) Six, each named plainly for what it is: Kintsugi, Driftwood, Celadon, Matsuri, Racing, Obsidian.
//
// A slot's choice is a list tried in order, the first the catalogue has winning: the set's own piece first (a pattern, trail, pennant or
// wrap other builders are adding this round), then the nearest piece that exists now. A slot whose kind the catalogue does not have yet
// is skipped. Owning a set, or its pieces, is Dovina's (progress/skiffpaint.js SET_RULES); this is the look's
// table and a tester's way to wear one whole (`/skiffset <id>`, DEBUG only), each slot put on through the catalogue's own setter
// (`game.skiffPaint.choose`), so a slot shut or too dear is refused as it would be at the race board.
//
// Prior art: Destiny's armour sets and ornaments and Monster Hunter's layered sets (one look across every slot, worn whole or piece by
// piece); Rocket League's themed bundles (body, decal, wheels, boost, trail and topper made as one); Splatoon's brand sets; Mario Kart 8's
// kart, wheels and glider combinations named as one.
//
//   SKIFF_SETS [{ id, label, line, slots: { hull, dye, pattern, cut, trail, ribbon, pennant, length, wrap } }]   SKIFF_SET_SLOTS
//   setOf(id)   applySkiffSet(game, id, { previewHull }) -> { set, worn, skipped, refused } | null   skiffSetCommands(game)  (/skiffset)
// ---------------------------------------------------------------------------------------
// TODO: import SET_RULES[id].pieces from progress/skiffpaint.js (Dovina's ask) once it reaches the default branch.
import { PAINT } from '../progress/skiffpaint.js';
import { SKIFF_HULLS } from './skiffhulls.js';
import { skiffPaintPreview } from './skiffpaintlook.js';

/** The slots, in the order a set is put on (the hull first: the rest are judged against it). */
export const SKIFF_SET_SLOTS = ['hull', 'dye', 'pattern', 'cut', 'trail', 'ribbon', 'pennant', 'length', 'wrap'];

const L = (...ids) => ids; // (a slot's choices, the set's own first)
export const SKIFF_SETS = [
  { id: 'kintsugi', label: 'Kintsugi', line: 'Black lacquer mended with gold: the break worn as the beauty.',
    slots: { hull: L('urushi'), dye: L('cloth'), pattern: L('kintsugi', 'kiln'), cut: L('junk'), trail: L('ink', 'glaze'), ribbon: L('comet', 'on'), length: L('swallowtail'), pennant: L('gold'), wrap: L('kintsugi') } },
  { id: 'driftwood', label: 'Driftwood', line: 'A board the sea gave back: silvered grain, salt-white cloth, a weathered flag.',
    slots: { hull: L('driftwood'), dye: L('glaze.nuka', 'cloth'), pattern: L('solid'), cut: L('lateen'), trail: L('frost', 'own'), ribbon: L('off'), length: L('prayer'), pennant: L('gold'), wrap: L('pinstripes') } },
  { id: 'celadon', label: 'Celadon', line: 'A pale green glaze, crazed, under a sail frosted in Wonder.',
    slots: { hull: L('celadon'), dye: L('wonder'), pattern: L('motif'), cut: L('stock'), trail: L('frost', 'lachryma'), ribbon: L('helix', 'on'), length: L('short'), pennant: L('wonder'), wrap: L('pinstripes') } },
  { id: 'matsuri', label: 'Matsuri', line: 'A festival float on the sand: vermilion and gold, a carp flying, petals behind.',
    slots: { hull: L('festival'), dye: L('fury'), pattern: L('waves', 'stripe'), cut: L('stock'), trail: L('petals', 'glaze'), ribbon: L('suits', 'on'), length: L('carp'), pennant: L('gold'), wrap: L('flames') } },
  { id: 'racing', label: 'Racing', line: 'Varnished teak and brass, a checkered sail and a roundel: built to win a cup.',
    slots: { hull: L('teak'), dye: L('mirth'), pattern: L('checker', 'chevron'), cut: L('stock'), trail: L('embers', 'lachryma'), ribbon: L('comet', 'on'), length: L('swallowtail'), pennant: L('gold'), wrap: L('roundel') } },
  { id: 'obsidian', label: 'Obsidian', line: 'Bone over black glass, a sail of Dread charted with stars, starlight in its wake.',
    slots: { hull: L('obsidian'), dye: L('glaze.kuroraku', 'dread'), pattern: L('constellations', 'motif'), cut: L('crabclaw'), trail: L('starlight', 'lachryma'), ribbon: L('helix', 'on'), length: L('long'), pennant: L('dread'), wrap: L('pinstripes') } },
];
export const setOf = (id) => SKIFF_SETS.find((s) => s.id === id) || null;

/** The catalogue's choices of a kind (the dyes with your glazes, as the race board lists them), or null if it has no such kind. */
function rowsOf(game, kind) { return kind === 'dye' ? (game.skiffPaint?.dyes?.() ?? PAINT.dye) : PAINT[kind] ?? null; }

/** Wear a set whole: each slot through `game.skiffPaint.choose` (the first of its choices the catalogue has); a kind it lacks skipped. With
 *  `previewHull`, a hull painting the catalogue has no kind for yet is worn as the race board's preview is (a look, never chosen). */
export function applySkiffSet(game, id, { previewHull = false } = {}) {
  const set = setOf(id), P = game?.skiffPaint; if (!set || !P) return null;
  const worn = [], skipped = [], refused = [];
  for (const kind of SKIFF_SET_SLOTS) {
    const want = set.slots[kind] || [];
    const rows = rowsOf(game, kind);
    if (!rows) {
      if (kind === 'hull' && previewHull && SKIFF_HULLS[want[0]]) { skiffPaintPreview(game, 'hull', want[0]); worn.push(`hull:${want[0]}`); }
      else skipped.push(kind);
      continue;
    }
    const pick = want.find((w) => rows.some((r) => r.id === w));
    if (!pick) { skipped.push(kind); continue; }
    if (P.worn[kind] === pick || P.choose(kind, pick)) worn.push(`${kind}:${pick}`); else refused.push(`${kind}:${pick}`);
  }
  return { set: set.id, worn, skipped, refused };
}

/** `/skiffset <id>` on the chat line (DEBUG): the Courier's board wears a set whole; what it wore said by `skiff.set` (tracking/race.js). */
export function skiffSetCommands(game) {
  const ids = SKIFF_SETS.map((s) => s.id);
  game.chat?.add?.('skiffset', { debug: true, help: `the Solar Skiff wears a set whole (DEBUG): /skiffset ${ids.join(' | ')}`, run: ([k]) => {
    const id = String(k || '').toLowerCase();
    if (!setOf(id)) { game.log?.say('warn', `There is no skiff set ${k || ''}: ${ids.join(', ')}.`, { key: 'skiffset.no', throttle: 1 }); return; }
    const r = applySkiffSet(game, id, { previewHull: true });
    game.events?.emit('skiff.set', { set: id, label: setOf(id).label, worn: r.worn.length, skipped: r.skipped, refused: r.refused, by: 'courier' });
  } });
}
