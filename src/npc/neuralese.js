// ---------------------------------------------------------------------------------------
// NEURALESE, THE LEXICON: the English of every neuralese word (the Functions of tools/veritome/mind/functions.js), what the Crib Sheet
// shows beside a word once it is glossed, and the OSTRACA: the potsherds the town that was wrote on, each one word beside a painted
// picture of what it does (docs/LORE.md, "Digging for words: the ostraca"). Data only; the words are Espada's. The dig and the item are
// Petra's, where they lie Dovina's, the look Calissa's (vfx/ostracon.js: Attic black-figure).
//
// A word is glossed three ways: it is a Function the player has learned (seen a mind do it), it is in the realm's name they chose, or
// an ostracon of it has been found. Without the Crib Sheet a word stands bare; with it, its gloss stands beside it.
//
// Prior art: the Rosetta Stone (one text in two scripts, read by the one you know), Greek ostraca (sherds as free paper: votes,
// receipts, a pupil's lines), La-Mulana's tablets read with its glyph reader, Chants of Sennaar's glossary filled by deduction.
//
//   LEXICON[WORD] = { gloss, place }   (place: the gloss said as a place would be, for a realm's name)
//   OSTRACA = [{ word, picture }]      glossOf(word) -> 'drink' | null
// ---------------------------------------------------------------------------------------

export const LEXICON = {
  STIL: { gloss: 'still', place: 'stillness' }, EZA: { gloss: 'ease', place: 'ease' }, HUSA: { gloss: 'hush', place: 'hush' },
  MELU: { gloss: 'melt', place: 'melting' }, SIVA: { gloss: 'drink', place: 'drink' }, LUNO: { gloss: 'rest', place: 'rest' },
  GRAV: { gloss: 'forage', place: 'foraging' }, PEXA: { gloss: 'fish', place: 'fishing' }, KITH: { gloss: 'huddle', place: 'kin' },
  ROMI: { gloss: 'play', place: 'play' }, SHAI: { gloss: 'flee', place: 'flight' }, HEMA: { gloss: 'home', place: 'home' },
  MOR: { gloss: 'mourn', place: 'grief' }, FETA: { gloss: 'fetch', place: 'fetching' }, TALO: { gloss: 'follow', place: 'following' },
  AMI: { gloss: 'kin', place: 'kin to you' }, RIVA: { gloss: 'rival', place: 'rivalry' }, DIPSA: { gloss: 'thirst', place: 'thirst' },
  GULA: { gloss: 'hunger', place: 'hunger' }, VOYD: { gloss: 'forget', place: 'forgetting' },
  LON: { gloss: 'long', place: 'long', mod: true }, DEO: { gloss: 'deep', place: 'deep', mod: true },
};

// the first ostraca: the town's orders to its slip, each a word that paints (picture: what Calissa's black-figure scene shows)
export const OSTRACA = [
  { word: 'SIVA', picture: 'a jelly drinking at a pool' },
  { word: 'LUNO', picture: 'a jelly lying in shade' },
  { word: 'GRAV', picture: 'a jelly nosing the sand' },
  { word: 'PEXA', picture: 'a jelly in the shallows, a fish caught' },
  { word: 'KITH', picture: 'three jellies huddled together' },
  { word: 'ROMI', picture: 'two jellies bouncing' },
  { word: 'HEMA', picture: 'a jelly going in at a doorway' },
  { word: 'FETA', picture: 'a jelly carrying a bauble to a figure' },
  { word: 'TALO', picture: 'a jelly behind a walking figure' },
  { word: 'STIL', picture: 'a jelly upright, its motion lines stopped' },
  { word: 'EZA', picture: 'a jelly lying open beside a figure' },
  { word: 'HUSA', picture: 'a jelly curled up under a crescent moon' },
];

export const glossOf = (word) => LEXICON[String(word).toUpperCase()]?.gloss ?? null;
