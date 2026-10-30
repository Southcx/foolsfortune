// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE VERITOME'S PHOTOGRAPH (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8; the rules and numbers
// Dovina's, progress/toolpairs.js SPECIAL_PLAY), at the shutter (tools/veritome/veritome.js asks `photo(report)` with the plate's live
// subjects):
//   9  Illumined Page  Soul Brush sub: a plate taken within `window` of the lent Flick writes the brush's last sigil (`brush.inscribe`'s)
//                      on what it holds within `reach`, at `power` of the sigil's own time; that plate undoes no writing
//   12 Held Plate      Lockheart sub: a plate halts the creatures it holds for `halt`, `cool` apart
//
// Prior art: Fatal Frame's Camera Obscura (a photograph that holds a ghost), Pokémon Snap, the illuminated manuscript (what is drawn on
// the page is made so), Ōkami's brush copying a stroke onto the world.
//
//   plateSpecials(PS) -> part { lend(tool), inscribed(e), photo(report) -> true when it wrote }
// ---------------------------------------------------------------------------------------
import { inscribe, PROPS } from '../soulbrush/inscribe.js';

export function plateSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let page = null, sigil = null, heldUntil = -Infinity;
  return {
    lend(tool) { if (tool === 'soulbrush' && PS.live(P().illuminedPage.n)) page = { until: PS.now + P().illuminedPage.window }; },
    /** The brush wrote a sigil (brush.inscribe): the last one is what a plate writes. */
    inscribed(e) { if (e.prop && !this.writing) sigil = e.prop; },
    photo(report) {
      const subs = report?.subjects || [], Pl = g.player.pos;
      const H = P().heldPlate;
      if (PS.live(H.n) && PS.now >= heldUntil) {
        let n = 0;
        for (const s of subs) { const c = s.ref; if (c?.type !== 'creature' || !c.alive || c.ally) continue; g.creatures?.apply(c, 'halt', H.halt, 1, 'courier'); n++; }
        if (n) { heldUntil = PS.now + H.cool; PS.said(H.n, { n }); }
      }
      const I = P().illuminedPage;
      if (!page || PS.now > page.until || !sigil || !PS.live(I.n)) return false;
      page = null;
      let wrote = 0; this.writing = true;
      const V = g.techs?.get?.('veritome'), at = (s) => V?.posOf?.(s) ?? s.ref?.pos ?? null; // (where a subject stands, as the Veritome reads it)
      try { for (const s of subs) if (s.ref && s.ref.type !== 'creature' && (at(s)?.distanceTo(Pl) ?? Infinity) <= I.reach && inscribe(g, s.ref, sigil, (PROPS[sigil]?.dur ?? 12) * I.power)) wrote++; } finally { this.writing = false; }
      PS.said(I.n, { n: wrote });
      return true; // (a plate of the page: written, not undone)
    },
  };
}
