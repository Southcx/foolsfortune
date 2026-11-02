// ---------------------------------------------------------------------------------------
// THE ARC'S FACES WHILE SEALED IN A MECH (docs/plans/MECHS.md 4.9; the arc's `mech` context, Petra's ui/touch/arc.js): what each slot's tile
// shows, its glyph read from the frame worn (the arms' weapons, the back unit: PARTS, progress/mechs/parts.js), so a tile says what the
// arm holds before the word says which arm. The glyphs are ui/icons/touchmechart.js's; the words placeholders, Espada's to rule.
//   A  the left arm's weapon (L ARM)      D  the right arm's (R ARM)       B  BOOST (the thruster)     C  the jump (the house's own)
//   E  PRESS (the barrier pressed)        F  UNIT (the back unit worn)     BELT  CABLE (tapped) and EXIT (held)
//
// Prior art: Armored Core's HUD (each arm's weapon icon over its button), the house's tool faces (ui/touch/actioncontext.js ACTION_TILES).
//
//   mechFace(game) -> { A, B, C, D, E, F }   MECH_BELT [{ id, glyph, word }]   weaponGlyph(partId)
// ---------------------------------------------------------------------------------------
import { PARTS } from '../../progress/mechs/parts.js';

/** A weapon's glyph by the tool it is at the frame's scale (the fist has none). */
const BY_TOOL = { psygun: 'mkblaster', sondelass: 'mkblade' };
/** A back unit's glyph by its part (none worn: the plain pack). */
const BY_BACK = { missiles: 'mkmissiles', shield: 'mkshield' };

export const weaponGlyph = (id) => { const P = id ? PARTS[id] : null; return !P ? 'mkfist' : BY_TOOL[P.tool] || (id === 'fist' ? 'mkfist' : 'mkblaster'); };

/** BELT's two: tapped the cable, held the cable or stepping out (X). */
export const MECH_BELT = [{ id: 'use', glyph: 'mkcable', word: 'CABLE' }, { id: 'tool', glyph: 'mkexit', word: 'EXIT' }];

/** The six slots' faces for the frame worn now. */
export function mechFace(g) {
  const sel = g?.hangar?.state?.sel || {};
  return {
    A: { glyph: weaponGlyph(sel.weaponL), word: 'L ARM' }, B: { glyph: 'mkboost', word: 'BOOST' }, C: { glyph: 'jump', word: null },
    D: { glyph: weaponGlyph(sel.weaponR), word: 'R ARM' }, E: { glyph: 'mkpress', word: 'PRESS' }, F: { glyph: BY_BACK[sel.back] || 'mkunit', word: 'UNIT' },
  };
}
