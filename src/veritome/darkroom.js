// ---------------------------------------------------------------------------------------
// THE DARKROOM: where the film is appraised, in a batch, as a step of its own (the Codex's VERITOME shelf, FILM). Shooting is quick
// and thoughtless; appraising is where a photograph turns out to have been worth something. Each plate, in the order it was taken:
//
//  - THE COMPENDIUM keeps the best photograph of every kind of thing (a better one replaces it).
//  - THE BESTIARY learns every fact a creature in it shows (bestiary.js): what it was doing, if that is something not yet known.
//    A creature has to be well in the picture for that (two stars or more): a speck at the edge teaches nothing.
//  - THE BOOK is given a card for every Arcana whose sitting the plate satisfies, and a creature's card when that creature is the
//    main subject of a plate of three stars or more (Wind Waker's figurines: a good enough pictograph is a likeness). In one batch a
//    card is given once, however many plates earn it, so a roll of the same thing is not a stack of the same card.
//
// The darkroom only decides; the Book keeps (book.js) and the events tell the ledger and the log (tracking.js).
//
// Prior art: Pokémon Snap's report (Professor Oak judges the whole roll after the course, shot by shot, and only the best of each
// Pokémon goes in the album), Dark Cloud 2's scoops (a photograph of the right thing becomes an idea when it is looked at), Wind
// Waker's Carlov (a pictograph handed in becomes a figurine for the gallery), and Fatal Frame's film points.
//
//   appraise(game, book, plates) -> { results: [{ plate, kind, stars, entry, facts, cards }], entries, facts, cards }
// ---------------------------------------------------------------------------------------
import { CARDS } from './cards.js';
import { sits } from './photo.js';
import { creatureOf, CREATURES } from './bestiary.js';
import { sfx } from '../audio.js';

/** What a plate is chiefly OF: its main subject's kind, or the sky or the sun. */
export const kindOf = (shot) => shot.subjects[0]?.kind || (shot.sun ? 'sun' : shot.sky ? 'sky' : null);

export function appraise(game, book, plates) {
  const ev = game.events, given = new Set();
  const out = { results: [], entries: 0, facts: 0, cards: 0, best: 0 };
  const arcana = CARDS.filter((c) => c.section === 'arcana');
  for (const plate of plates) {
    const shot = plate.shot, kind = kindOf(shot), r = { plate, kind, stars: shot.stars, entry: false, facts: [], cards: [] };
    // the Compendium
    if (kind) {
      const prev = book.photos[kind], score = shot.subjects[0]?.score ?? 200;
      if (!prev || score > prev.score) { book.photos[kind] = { score, stars: shot.stars, thumb: plate.thumb || prev?.thumb || null, at: plate.t }; r.entry = !prev; if (!prev) out.entries++; }
    }
    // the bestiary
    for (const s of shot.subjects) {
      if (s.stars < 2) continue;
      for (const f of book.bestiary.learn(s)) { r.facts.push(f); out.facts++; ev?.emit('bestiary.fact', { creature: f.creature, fact: f.fact, battle: f.battle }); }
    }
    // the Book: the Arcana whose sittings these are, and a likeness of the main subject
    const earn = (id) => { if (given.has(id)) return; given.add(id); if (book.give(id, 'darkroom')) { r.cards.push(id); out.cards++; } };
    for (const A of arcana) if (sits(shot, A.sitting)) earn(A.id);
    const main = shot.subjects[0], cr = main && creatureOf(main);
    if (cr && CREATURES[cr] && main.stars >= 3) earn(`creature.${cr}`);
    out.best = Math.max(out.best, shot.stars);
    ev?.emit('photo.appraise', { kind: kind || 'nothing', stars: shot.stars, n: shot.subjects.length, kinds: shot.kinds, facts: r.facts.length, cards: r.cards.length, entry: r.entry });
    out.results.push(r);
  }
  book.save();
  // the best-coloured good plate of the roll teaches the kiln a glaze (vessel/vessel.js: one a roll, if it is a colour it does not know)
  const vivid = out.results.filter((r) => r.stars >= 3 && r.plate.swatch).sort((a, b) => b.stars - a.stars)[0];
  if (vivid) game.vessel?.learnFrom(vivid.plate.swatch, vivid.kind || 'thing');
  sfx.develop?.(plates.length);
  ev?.emit('darkroom.develop', { n: plates.length, entries: out.entries, facts: out.facts, cards: out.cards, best: out.best });
  return out;
}
