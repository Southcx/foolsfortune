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
//   plateSpecials(PS) -> part { lend(tool), inscribed(e), photo(report) -> true when it wrote }; each act said with its place
//   (pair.special, pair.hit: tools/pairspecials.js) for its look (vfx/pairspeciallooks.js)
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
        const held = [];
        for (const s of subs) { const c = s.ref; if (c?.type !== 'creature' || !c.alive || c.ally) continue; g.creatures?.apply(c, 'halt', H.halt, 1, 'courier'); held.push(c); }
        if (held.length) { heldUntil = PS.now + H.cool; PS.said(H.n, { n: held.length, target: held[0], others: held.slice(1), dur: H.halt }); }
      }
      const I = P().illuminedPage;
      if (!page || PS.now > page.until || !sigil || !PS.live(I.n)) return false;
      const V = g.techs?.get?.('veritome'), at = (s) => V?.posOf?.(s) ?? s.ref?.pos ?? null; // (where a subject stands, as the Veritome reads it)
      const wrote = []; this.writing = true;
      try { for (const s of subs) { const p = at(s); if (s.ref && s.ref.type !== 'creature' && (p?.distanceTo(Pl) ?? Infinity) <= I.reach && inscribe(g, s.ref, sigil, (PROPS[sigil]?.dur ?? 12) * I.power)) wrote.push(p.clone()); } } finally { this.writing = false; }
      if (!wrote.length) return false; // (nothing it could write in reach: a plain plate, the page kept for the next)
      page = null;
      PS.said(I.n, { n: wrote.length, at: wrote[0] }); // (its look writes the sigil on the first; the hit on each other)
      for (const p of wrote.slice(1)) PS.hit(I.n, { at: p });
      return true; // (a plate of the page: written, not undone)
    },
  };
}
