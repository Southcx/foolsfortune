// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE VERITOME'S PHOTOGRAPH (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8), with the Veritome in
// hand, at the shutter (tools/veritome/veritome.js asks `photo(report)` with the plate's live subjects):
//   9  Illumined Page  Soul Brush sub: a plate with a sigil in it (a thing the brush has written on) writes that sigil on everything else
//                      in the plate that can take it, where a photograph alone would undo the writing (the truth of a thing)
//   12 Held Plate      Lockheart sub: the creatures in the plate are held still in time a moment (halt)
// The numbers are placeholders with their reasons (Petra's), until Dovina's rows (progress/toolpairs.js SPECIAL_PLAY) take their place.
//
// Prior art: Fatal Frame's Camera Obscura (a photograph that holds a ghost), Pokémon Snap, the illuminated manuscript (what is drawn on
// the page is made so), Ōkami's brush gods copying a stroke onto the world.
//
//   plateSpecials(PS) -> part { photo(report) -> true when it wrote (the plate does not undo the writing then) }   PLATE_PLAY
// ---------------------------------------------------------------------------------------
import { inscribe, inscribed } from '../soulbrush/inscribe.js';

/** The placeholders, each against a number the game already has. */
export const PLATE_PLAY = {
  // Held Plate: a moment of 1.2 real s (the Flash's stun 0.75 and half again); three subjects at most (a good plate's crowd)
  held: { n: 12, hold: 1.2, most: 3 },
  page: { n: 9 },
};

export function plateSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  return {
    photo(report) {
      const subs = report?.subjects || [];
      if (PS.live(P().held.n)) {
        const H = P().held; let n = 0;
        for (const s of subs) { const c = s.ref; if (n >= H.most || c?.type !== 'creature' || !c.alive || c.ally) continue; g.creatures?.apply(c, 'halt', H.hold, 1, 'courier'); n++; }
        if (n) PS.said(H.n, { n });
      }
      if (!PS.live(P().page.n)) return false;
      const sigils = [...new Set(subs.flatMap((s) => (s.ref ? inscribed(s.ref) : [])))];
      if (!sigils.length) return false;
      let wrote = 0;
      for (const s of subs) { if (!s.ref || inscribed(s.ref).length) continue; for (const prop of sigils) if (inscribe(g, s.ref, prop)) { wrote++; break; } } // (one sigil a thing: the first it can take)
      if (wrote) PS.said(P().page.n, { n: wrote });
      return true; // (a sigil in the plate: written on, not undone)
    },
  };
}
