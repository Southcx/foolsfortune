// ---------------------------------------------------------------------------------------
// THE GOD HAND'S STRIP: the hand's domains on glass (docs/plans/MOBILE.md 8.4; the art bar's place, ui/hudlayout.js `areas.artBar`):
// seven glazed tiles, one a domain in DOMAIN_LOOK's sign (ui/domainlook.js), in the domains' order; the lit one the selected art's
// domain, gold. A tap is the domain's key (gh.d1 .. gh.d7: again to go through its arts, as the keys do); ALT (gh.alt, held) stands only
// for an art with another way (Hasten stops time, Transmute your feeling, Telekinesis raises); SIGN (gh.sign, held) lets one finger draw
// a miracle's sign. Over the strip, the selected art's name and its blurb in the System's type. The long press's ring is the cursor's
// (the touch driver's RMB at 420 ms): it opens the art wheel where the finger is. Every press goes through touchTiles: the driver's.
//
// Prior art: Black & White's gesture hand and Populous: The Beginning's spell strip (a row of powers, one lit), the art bar beside it
// (ui/touch/artbar.js: its shelf and laying, columns held sideways, rows upright).
//
//   new GodStrip(game)   .update(now, on)   .relayout()   GOD_STRIP
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { shelf } from './topbar.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';
import { DOMAIN_LOOK } from '../domainlook.js';
import { DOMAIN_ORDER } from '../../progress/godpowers.js';
import { FONT } from '../theme.js';

/** The arts with another way (ALT shown), the gaps and margins (CSS px), the label's type. */
export const GOD_STRIP = { alt: new Set(['hasten', 'transmute', 'telekinesis']), gap: 6, pad: 6, most: 60, side: 64, label: 15 };

const CSS = `
.gstrip-line{position:fixed;left:0;top:0;z-index:5;pointer-events:none;font-family:${FONT.sys};font-size:${GOD_STRIP.label}px;line-height:1.25;color:#efe6d2;
  text-shadow:0 1px 0 #1c0d08,0 0 6px rgba(0,0,0,.6);white-space:nowrap}
.gstrip-line b{font-family:${FONT.title};font-weight:700;letter-spacing:.08em;margin-right:.5em}
.gstrip-line.off{display:none}
body.hud-touch #goddomains,body.hud-touch #godarts{display:none!important} /* (the desk's tabs and art row: the strip and its line say them on glass) */
`;

export class GodStrip {
  constructor(game) {
    this.game = game; this.shown = false; this.tiles = new Map(); this.domain = null; this.artId = null;
    if (!document.querySelector('style[data-godstrip]')) { const s = document.createElement('style'); s.setAttribute('data-godstrip', ''); s.textContent = CSS; document.head.appendChild(s); }
    this.shelf = shelf();
    this.line = document.createElement('div'); this.line.className = 'gstrip-line off'; document.body.appendChild(this.line);
    DOMAIN_ORDER.forEach((d, i) => {
      const id = `gh.d${i + 1}`;
      this.tiles.set(id, new TouchTile(id, { size: TILE.min, glyph: DOMAIN_LOOK[d].icon, word: null, onPress: (tid, down) => touchTiles.report(game, id, down) }));
      this.tiles.get(id).iconPal = DOMAIN_LOOK[d].pal; // (unlit, the domain's own palette; lit, gold)
    });
    for (const [id, glyph] of [['gh.alt', 'alt'], ['gh.sign', 'sign']]) this.tiles.set(id, new TouchTile(id, { size: GOD_STRIP.side, glyph, onPress: (tid, down) => touchTiles.report(game, id, down) }));
  }

  /** The seven along the art bar's edge (rows upright, a column sideways); ALT and SIGN on its inner side; the art's line over it. */
  relayout() {
    const P = placeOf(this.game), A = P.areas.artBar, n = DOMAIN_ORDER.length, G = GOD_STRIP.gap, pad = GOD_STRIP.pad, F = TILE.foot;
    const along = P.portrait ? A.w - 2 * pad : A.h - 2 * pad;
    const s = Math.max(TILE.min, Math.min(GOD_STRIP.most, Math.floor((along - (n - 1) * G) / n)));
    const per = Math.max(1, Math.min(n, Math.floor((along + G) / (s + G)))), lines = Math.ceil(n / per), len = per * s + (per - 1) * G, deep = lines * (s + F) + (lines - 1) * G;
    let bx, by, bw, bh;
    if (P.portrait) { bw = len + 2 * pad; bh = deep + 2 * pad; bx = A.x + (A.w - bw) / 2; by = A.y + A.h - bh; }
    else { bw = lines * (s + G) - G + 2 * pad; bh = len + F + 2 * pad; bx = A.x + A.w - bw; by = A.y; }
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(bx)}px, ${Math.round(by)}px)`, width: `${Math.round(bw)}px`, height: `${Math.round(bh)}px` });
    this.shelf.style.setProperty('--h', '28px');
    DOMAIN_ORDER.forEach((d, i) => {
      const line = Math.floor(i / per), at = i % per;
      const x = P.portrait ? bx + pad + at * (s + G) : bx + bw - pad - (line + 1) * s - line * G;
      const y = P.portrait ? by + pad + line * (s + F + G) : by + pad + at * (s + G);
      this.tiles.get(`gh.d${i + 1}`).place(x, y, s);
    });
    // ALT and SIGN on the inner side: above the strip upright, left of it sideways (SIGN nearest the thumb)
    const S = GOD_STRIP.side, G2 = G + 4;
    if (P.portrait) { this.tiles.get('gh.sign').place(bx + bw - S, by - G2 - S - F, S); this.tiles.get('gh.alt').place(bx + bw - 2 * S - G2, by - G2 - S - F, S); }
    else { this.tiles.get('gh.sign').place(bx - G2 - S, by + bh - S - F, S); this.tiles.get('gh.alt').place(bx - G2 - S, by + bh - 2 * (S + F) - G2, S); }
    this.bar = { x: bx, y: by, w: bw, h: bh, portrait: P.portrait };
    this.placeLine();
  }

  /** The art's line: over the strip upright (left of ALT and SIGN), left of the column sideways at its top. */
  placeLine() {
    const B = this.bar; if (!B) return;
    const r = this.line.getBoundingClientRect();
    const x = B.portrait ? B.x : B.x - GOD_STRIP.side - 16 - r.width, y = B.portrait ? B.y - GOD_STRIP.side - 2 * GOD_STRIP.gap - r.height - 12 : B.y;
    this.line.style.transform = `translate(${Math.round(Math.max(8, x))}px, ${Math.round(y)}px)`;
  }

  update(now, on) {
    const g = this.game, H = g.god, show = !!on && !!H?.active && !g.realm?.active && !windowOpen(g);
    if (show !== this.shown) {
      this.shown = show; this.shelf.classList.toggle('off', !show); this.line.classList.toggle('off', !show);
      if (show) this.relayout();
      for (const id of this.tiles.keys()) if (id.startsWith('gh.d')) this.tiles.get(id).set({ hidden: !show });
      this.artId = null;
    }
    if (!show) { for (const id of ['gh.alt', 'gh.sign']) this.tiles.get(id).set({ hidden: true }); return; }
    const art = H.arts?.art;
    if (art && art.id !== this.artId) {
      this.artId = art.id; this.domain = art.domain;
      this.line.innerHTML = `<b>${art.name}</b>${(art.blurb || '').replace(/Shift:/g, 'ALT:')}`; // (the key's word on glass: the tile's)
      this.placeLine();
    }
    this.tiles.get('gh.alt').set({ hidden: !GOD_STRIP.alt.has(art?.id) });
    this.tiles.get('gh.sign').set({ hidden: false });
    DOMAIN_ORDER.forEach((d, i) => { const t = this.tiles.get(`gh.d${i + 1}`); t.set({ lit: d === this.domain || t.state.pressed }); });
    for (const t of this.tiles.values()) t.update(now);
  }
}
