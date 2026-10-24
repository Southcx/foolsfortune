// ---------------------------------------------------------------------------------------
// WHAT OPENS A CARD BACK (Calissa's twelve backs, 2026-10-24: vfx/cardbackset.js, ui/cardbackchoice.js `game.cardBacks`): one row a back,
// a predicate over the ledger (never a flag), and the hint the picker shows while it is shut. A deck's own back is always open; a back
// opened is open for both decks (the house deck at Raku's tables, the Major Arcana). A look only: no back changes a number.
// Each back is opened by the thing it pictures: a suit by its tool's craft (Wands the garden in bloom, Cups the cast line, Swords the
// trial's blade-work, Pentacles the chests), an island's dress by reaching it (Clay a second firing, Nacre the first crossing, Glass three,
// Brine the open sea), a season by living it in the Spirit Garden.
//
// Prior art: Hearthstone's card backs (each earned by a season or a deed, none a power), Balatro's decks unlocked by play, the house's own
// skiff paint (progress/skiffpaint.js: a look opened by a thing done, never a number).
//
//   CARD_BACKS[id] = { opens(L), hint }   cardBackOpen(id, L) -> bool   game.cardBackOpen(id) (main.js; the picker's `OPEN_WHEN` reads it: ui/cardbackchoice.js)
// ---------------------------------------------------------------------------------------

const G = (L, k) => Math.max(L?.get?.(k) || 0, L?.best?.(k) || 0);
const did = (k, n = 1) => (L) => G(L, k) >= n;

export const CARD_BACKS = {
  wands: { opens: did('garden.bloom'), hint: 'Tend a planetoid into bloom.' },
  cups: { opens: did('angle.cast', 100), hint: 'Cast the lure 100 times.' },
  swords: { opens: did('trial.medal.silver'), hint: 'Finish the lantern trial in silver time.' },
  pentacles: { opens: did('chest.open', 25), hint: 'Open 25 chests.' },
  clay: { opens: did('firing', 2), hint: 'Pass a tribulation (your second firing).' },
  nacre: { opens: did('emocean.hop'), hint: 'Sail to another Island of Ego.' },
  glass: { opens: did('emocean.hop', 3), hint: 'Sail three crossings.' },
  brine: { opens: did('sea.chart', 5), hint: 'Chart 5 squares of the open sea.' },
  spring: { opens: did('garden.bloom.most', 3), hint: 'Have three planetoids in bloom at once.' },
  summer: { opens: did('garden.season.summer'), hint: 'See summer come to your Spirit Garden.' },
  autumn: { opens: did('garden.season.autumn'), hint: 'See autumn come to your Spirit Garden.' },
  winter: { opens: did('garden.season.winter'), hint: 'See winter come to your Spirit Garden.' },
};

/** Whether a back is open on this ledger (an id with no row: never; the deck's own back is the picker's, always open). */
export const cardBackOpen = (id, L) => !!CARD_BACKS[id]?.opens(L);
