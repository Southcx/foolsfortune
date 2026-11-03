// ---------------------------------------------------------------------------------------
// A RADIAL (docs/plans/TOUCH-REBUILD.md 3.4): a held tile's choices fanned on an arc beside it, each a tile; a tap on one picks it,
// a tap anywhere else closes it; the held finger slid onto one and lifted picks it too. One for every held pick on touch: the arc's PICK and BELT (ui/touch/arc.js) and the strip's CHAMBER
// and FORM (strip.js), so the two never drift apart. A `sticky` radial stays open after a pick (the Crucibelle's five notes, played
// from it) until a tap outside it.
//
// Prior art: the radial menus of the console shooters' weapon wheels (Ratchet & Clank's, Halo's), Brawl Stars' and Genshin Impact's
// held buttons opening their choices under the thumb; the strip's own first radial (moved here from strip.js).
//
//   openRadial(anchorEl, items [{ id, glyph, word, lit, tint, corner }], { onPick(item), sticky, size, R, from, to }) -> close()
// ---------------------------------------------------------------------------------------
import { TouchTile } from './tile.js';
import { radialBack } from './arcdress.js';

/** Fan `items` round `anchorEl`'s centre between the angles `from` and `to` (radians, y down: PI is left, 1.5 PI up), radius `R` at least; past five choices, two rings. */
export function openRadial(anchorEl, items, { onPick, sticky = false, size = 44, R = 64, from = Math.PI * 0.15, to = Math.PI * 0.85 } = {}) {
  if (!anchorEl || !items?.length) return () => {};
  const b = anchorEl.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, n = items.length;
  // (past five choices, two rings, the first half inside: a single ring wide enough for eight reached the screen's middle at 896 x 414)
  const rings = n > 5 ? 2 : 1, per = Math.ceil(n / rings), span = Math.max(0.5, Math.abs(to - from));
  const r1 = Math.max(R, per > 1 ? (size + 14) * (per - 1) / span : R); // (wide enough that no two choices on a ring touch, corners included: square tiles on a curve)
  let off = null, tiles = [];
  const backs = Array.from({ length: rings }, (_, k) => radialBack(cx, cy, r1 + k * (size + 14), size, from, to)); // (the clay band each ring stands on: ui/touch/arcdress.js)
  let lift = null;
  const close = () => { if (off) document.removeEventListener('pointerdown', off, true); off = null; if (lift) document.removeEventListener('pointerup', lift, true); lift = null; for (const t of tiles) t.el.remove(); tiles = []; for (const b of backs) b.remove(); backs.length = 0; };
  tiles = items.map((it, i) => {
    const ring = Math.floor(i / per), k = i - ring * per, m = Math.min(per, n - ring * per), r = r1 + ring * (size + 14);
    const a = from + (to - from) * (m > 1 ? k / (m - 1) : 0.5);
    const t = new TouchTile(`radial.${it.id}`, { size, glyph: it.glyph ?? null, word: it.word ?? null, corner: it.corner ?? null, tint: it.tint ?? null, fit: true,
      onPress: (_, down, inside) => { if (!down && inside) { onPick?.(it); if (!sticky) close(); } } });
    t.place(cx + Math.cos(a) * r - size / 2, cy + Math.sin(a) * r - size / 2, size); t.set({ hidden: false, lit: !!it.lit }); t.update(performance.now() / 1000);
    return t;
  });
  off = (ev) => { if (!tiles.some((t) => t.el.contains(ev.target)) && !anchorEl.contains(ev.target)) close(); };
  setTimeout(() => { if (tiles.length) document.addEventListener('pointerdown', off, true); }, 0);
  // the held finger let go over a choice picks it (slide and lift, the quick pick's way): the anchor's tile holds that pointer's capture,
  // so the choice's own tile never hears its lift (a tap on a choice is its own tile's, and skipped here; any other lift picks nothing)
  lift = (ev) => {
    const i = tiles.findIndex((t) => { const r = t.el.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; });
    if (i >= 0 && !tiles[i].el.contains(ev.target)) { onPick?.(items[i]); if (!sticky) close(); }
  };
  document.addEventListener('pointerup', lift, true);
  return close;
}
