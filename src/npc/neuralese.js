// ---------------------------------------------------------------------------------------
// NEURALESE, THE LEXICON: the English of every neuralese word (the Functions of tools/veritome/mind/functions.js), what the Crib Sheet
// shows beside a word once it is glossed, the pictures on the ostraca (the potsherds the town that was wrote on, each one word beside a
// painted picture of what it does) and the stelae's sentences (docs/LORE.md, "Digging for words: the ostraca"). Data only; the words are Espada's. The dig and the item are
// Petra's, where they lie and which words Dovina's (progress/ostraca.js), the look Calissa's (vfx/ostracon.js: Attic black-figure).
//
// A word is glossed three ways: it is a Function the player has learned (seen a mind do it), it is in the realm's name they chose, or
// an ostracon of it has been found. Without the Crib Sheet a word stands bare; with it, its gloss stands beside it.
//
// Prior art: the Rosetta Stone (one text in two scripts, read by the one you know), Greek ostraca (sherds as free paper: votes,
// receipts, a pupil's lines), La-Mulana's tablets read with its glyph reader, Chants of Sennaar's glossary filled by deduction.
//
//   LEXICON[WORD] = { gloss, place }   (place: the gloss said as a place would be, for a realm's name)
//   OSTRACON_PICTURES[WORD] -> what its ostracon shows    STELE_TEXT[stele id] = { words, text, gloss }    glossOf(word)
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

// what each word's ostracon shows (Calissa's black-figure scene), for every word, so any split of the words onto ostraca has a picture
export const OSTRACON_PICTURES = {
  SIVA: 'a jelly drinking at a pool', LUNO: 'a jelly lying in shade', GRAV: 'a jelly nosing the sand',
  PEXA: 'a jelly in the shallows, a fish caught', KITH: 'three jellies huddled together', ROMI: 'two jellies bouncing',
  HEMA: 'a jelly going in at a doorway', FETA: 'a jelly carrying a bauble to a figure', TALO: 'a jelly behind a walking figure',
  STIL: 'a jelly upright, its motion lines stopped', EZA: 'a jelly lying open beside a figure', HUSA: 'a jelly curled up under a crescent moon',
  MELU: 'a jelly spread flat as a puddle', SHAI: 'a jelly running from a raised hand', MOR: 'a jelly bowed over a burst one',
  RIVA: 'two jellies butting heads', AMI: 'a jelly and a figure the same shape, side by side', DIPSA: 'a jelly with its mouth open at a dry pool',
  GULA: 'a jelly with its mouth open at an empty bowl', VOYD: 'a figure fading out of a jelly\'s eye', LON: 'a long line of footprints',
  DEO: 'a jelly sinking deep into water',
};

// the two stelae's sentences: each carries its three new words among words already known, so a sentence teaches them by context
// (comprehensible input). The sealed room's is the town's rule; the upper ring's, above the bowl, is its last word to its kin.
export const STELE_TEXT = {
  'stele.sealed': { words: ['DIPSA', 'GULA', 'VOYD'], text: 'DIPSA SIVA. GULA GRAV. VOYD STIL.', gloss: 'Thirst: drink. Hunger: forage. To forget: be still.' },
  'stele.ring': { words: ['AMI', 'LON', 'DEO'], text: 'AMI KITH. HEMA LON. MOR DEO.', gloss: 'You are kin. Home is long. Grief runs deep.' },
};

export const glossOf = (word) => LEXICON[String(word).toUpperCase()]?.gloss ?? null;
