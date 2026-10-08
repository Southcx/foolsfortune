// ---------------------------------------------------------------------------------------
// THE OSTRACA: neuralese words dug up, each glossed into the Crib Sheet when found (the owner's direction, 2026-10-08: the Crib Sheet
// glosses more words for the player who explores; archaeology the motif. Espada's lore: docs/LORE.md, "Digging for words: the ostraca").
// An ostracon is a potsherd carrying one word beside a picture of what it does; a stele is a rarer stone carrying three words and one
// sentence, at the end of a harder path. A find glosses; it never teaches a Function (those are learned by seeing a mind do it).
// Data and pure functions: where they lie, how many, the Dunemaw's deck; Petra places them, the tracking rule counts them.
//
// Prior art: La-Mulana's tablets read with its glyph reader, Heaven's Vault's inscriptions, Chants of Sennaar's deduced glossary, the
// Rosetta Stone (a bilingual), Spelunky's hidden rooms, and comprehensible input (Krashen): a word met in context sticks.
//
//   OSTRACA = { total, places: { where: { n, how } } }   STELAE = [{ id, where, words }]   WORD_SPLIT(functionIds) -> { ostraca, stelae }
//   DUNEMAW_DECK = { size, chance, certainWithin }   glossed(ledger, functionIds) -> [word ids]   CRIB
// ---------------------------------------------------------------------------------------

/** How many lie where, and how each is found (a find is once and for good: the island's paper does not grow back). */
export const OSTRACA = {
  total: 18,
  places: {
    dunes:   { n: 8, how: 'buried: the Dreamvane\'s survey shows a glint, the pick lifts it (the fossils\' dig)' },
    dunemaw: { n: 6, how: 'in a floor\'s forgotten pots, from a deck (below): broken open, one may hold a sherd with writing' },
    ruins:   { n: 2, how: 'in plain sight on the ruins\' columns, for the one who reads walls' },
    workshop:{ n: 2, how: 'set into the workshop\'s old walls, under the plaster: found by striking the right patch' },
  },
};

/** The stelae: three words each that no ostracon carries, and one sentence (Espada's), so a whole Crib Sheet needs both. */
export const STELAE = [
  { id: 'stele.sealed', where: "the ruins' sealed room in the Dunes (a door the fork's ring opens: the Dreamvane, tuned)", words: 3 },
  { id: 'stele.ring', where: 'the great cavern\'s upper ring, above the bowl (reached during or after the fight)', words: 3 },
];

/** Which words go on ostraca and which on the stelae: the first `OSTRACA.total` Functions in their order (the commoner, the earlier
 *  learned), the last six on the stelae (the rarest). Pass the Function ids in their canonical order (veritome/mind/functions.js). */
export function WORD_SPLIT(ids = []) {
  const n = OSTRACA.total;
  return { ostraca: ids.slice(0, n), stelae: STELAE.map((s, i) => ids.slice(n + i * s.words, n + (i + 1) * s.words)) };
}

/** The Great Dunemaw's share: a run's floors each give a chance of the next ostracon in its deck, and a run of `certainWithin` floors
 *  without one makes the next certain (a deck: the 1-in-N made certain within N; the glossary's word). */
export const DUNEMAW_DECK = { size: 6, chance: 0.25, certainWithin: 8 };

/** The words glossed so far, from the ledger: an ostracon found counts `ostracon.<word>`, a stele read `stele.<id>` (its words). */
export function glossed(L, ids = []) {
  const split = WORD_SPLIT(ids), out = split.ostraca.filter((w) => (L?.get(`ostracon.${w}`) || 0) > 0);
  STELAE.forEach((s, i) => { if ((L?.get(s.id) || 0) > 0) out.push(...split.stelae[i]); });
  return out;
}

/** THE CRIB SHEET (the knack, Espada's name, the owner's): it shows the English gloss beside each word that is glossed; opened by an
 *  achievement like every Art, three ways (any one): 100 macros spoken (the patient), a five-Function macro held at the first try (the
 *  skilled), six ostraca found (the explorer). Its reach grows only by digging: a word not glossed shows no gloss. */
export const CRIB = { macros: 100, heldFive: 1, ostraca: 6 };
