// ---------------------------------------------------------------------------------------
// THE ART BAR: the Spirit Garden's arts on glass (docs/plans/MOBILE.md 8.2; Viva Piñata's tool bar), in the HUD layout's `areas.artBar`:
// along the bottom held upright, down the right edge held sideways, on a clay shelf (the top bar's, ui/touch/topbar.js).
//   THE TILES  WALK first (no art up: a tap on the ground goes there, Dovina's `realm.goTo`), then the hand's ten arts in the keys' order
//              (world/garden/hand.js ARTS: GRAB, PULL, PRESS, SMOOTH, FLATTEN, CARVE, ROUGHEN, WATER, PLACE, PAINT; 1 to 9, then 0), then
//              UNDO at the end: glazed tiles (ui/touch/tile.js), a glyph each (`touch.<id>`), wrapped into rows (or columns) when the
//              edge is too short for them, never under 44 px. The art up is lit (its rim in the schiller, its glyph gold).
//   A TAP      picks that art; a tap on the lit one puts it down (WALK). `touch.art { id, by }` and `onArt(id)`; the hand's own art (a
//              key pressed on a hybrid) is mirrored when it changes. UNDO and TURN are plain tiles (they report like the cluster's:
//              ui/touch/presses.js, the driver presses Ctrl+Z and R).
//   BESIDE IT  the size slider while a shaping art or PAINT is up (ui/touch/sizeslider.js), TURN while PLACE, PAINT or WATER is (the next
//              decor turn, ground, feeling), SPRING and DRAIN while WATER is (a toggle each, one at a time: `touch.mod { mod, by }`,
//              `onMod(mod)`; put down when WATER is).
// Shown only on touch and while the Spirit Garden is entered (`game.realm.active`), and stood down under a window.
//
// Prior art: Viva Piñata's tool bar, Townscaper's and Procreate's side tools (a slider and the undo always to hand), the keys' order kept
// so the desk and the phone teach each other (MOBILE.md 8.2).
//
//   new TouchArtBar(game)   .art ('walk' | an ART)   .set(id)   .mod (null | 'spring' | 'drain')   .onArt = (id) => {}   .onMod = (mod) => {}
//   .slider (SizeSlider)   .update(now, on)   .relayout()   ART_BAR (the order, the numbers)
// ---------------------------------------------------------------------------------------
import { ARTS } from '../../world/garden/hand.js';
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';
import { shelf } from './topbar.js';
import { SizeSlider } from './sizeslider.js';

/** The order, what each art brings beside the bar, the tiles' sizes (CSS px: the bar's at most, the side strip's), the gaps. */
export const ART_BAR = {
  ids: ['walk', ...ARTS, 'undo'],
  shaping: new Set(['pull', 'press', 'smooth', 'flatten', 'carve', 'roughen', 'paint']),
  turns: new Set(['place', 'paint', 'water']),
  most: 60, side: 64, gap: 6, pad: 6, slider: 170, round: 14,
};

export class TouchArtBar {
  constructor(game) {
    this.game = game; this.art = 'walk'; this.mod = null; this.onArt = null; this.onMod = null; this.shown = false; this.handArt = null; this.handSize = null;
    this.shelf = shelf();
    this.tiles = new Map();
    for (const id of ART_BAR.ids) this.tiles.set(id, new TouchTile(`art.${id}`, { size: TILE.min, glyph: id, word: null, onPress: (tid, down, inside) => this.tap(id, down, inside) }));
    for (const id of ['turn', 'spring', 'drain']) this.tiles.set(id, new TouchTile(`art.${id}`, { size: ART_BAR.side, glyph: id, onPress: (tid, down, inside) => this.tap(id, down, inside) }));
    this.slider = new SizeSlider(game);
    this.side = [];
  }

  /** Pick an art ('walk' for none), as a tap would but with nothing said: the driver's way to keep the bar in step. */
  set(id) { if (!ART_BAR.ids.includes(id) || id === 'undo' || id === this.art) return; this.art = id; if (id !== 'water') this.mod = null; this.dirty = true; }

  tap(id, down, inside) {
    const g = this.game;
    if (id === 'undo' || id === 'turn') { touchTiles.report(g, `art.${id}`, down); return; }
    if (down || !inside) return;
    if (id === 'spring' || id === 'drain') {
      this.mod = this.mod === id ? null : id; this.dirty = true;
      g.events?.emit?.('touch.mod', { mod: this.mod, by: 'courier' }); try { this.onMod?.(this.mod); } catch (e) { console.warn('artBar.onMod', e); }
      return;
    }
    const next = id === this.art && id !== 'walk' ? 'walk' : id;
    if (next === this.art) return;
    this.set(next);
    g.events?.emit?.('touch.art', { id: next, by: 'courier' }); try { this.onArt?.(next); } catch (e) { console.warn('artBar.onArt', e); }
  }

  /** Lay the bar along its edge (rows held upright, columns held sideways) and the side strip on its inner side. */
  relayout() {
    const P = placeOf(this.game), A = P.areas.artBar, n = ART_BAR.ids.length, G = ART_BAR.gap, pad = ART_BAR.pad, F = TILE.foot;
    const along = P.portrait ? A.w - 2 * pad : A.h - 2 * pad;
    let per = n, s = Math.floor((along - (n - 1) * G) / n);
    if (s < TILE.min) { per = Math.max(1, Math.floor((along + G) / (TILE.min + 4 + G))); s = Math.floor((along - (per - 1) * G) / per); }
    s = Math.max(TILE.min, Math.min(ART_BAR.most, s));
    const lines = Math.ceil(n / per), deep = lines * (s + F) + (lines - 1) * G, len = Math.min(per, n) * s + (Math.min(per, n) - 1) * G;
    let bx, by, bw, bh;
    if (P.portrait) { bw = len + 2 * pad; bh = deep + 2 * pad; bx = A.x + (A.w - bw) / 2; by = A.y + A.h - bh; }
    else { bw = lines * (s + G) - G + 2 * pad; bh = len + F + 2 * pad; bx = A.x + A.w - bw; by = A.y; }
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(bx)}px, ${Math.round(by)}px)`, width: `${Math.round(bw)}px`, height: `${Math.round(bh)}px` });
    this.shelf.style.setProperty('--h', `${ART_BAR.round * 2}px`); // (a tray's corners, not a pill's ends)
    ART_BAR.ids.forEach((id, i) => {
      const line = Math.floor(i / per), at = i % per;
      const x = P.portrait ? bx + pad + at * (s + G) : bx + bw - pad - (line + 1) * s - line * G;
      const y = P.portrait ? by + pad + line * (s + F + G) : by + pad + at * (s + G);
      this.tiles.get(id).place(x, y, s);
    });
    this.bar = { x: bx, y: by, w: bw, h: bh, portrait: P.portrait };
    this.layoutSide();
  }

  /** The side strip: the slider, TURN, SPRING and DRAIN, as the art up wants them, on the bar's inner side at its start. */
  layoutSide() {
    const B = this.bar; if (!B) return;
    const a = this.art, side = [];
    if (ART_BAR.turns.has(a)) side.push('turn');
    if (a === 'water') side.push('spring', 'drain');
    this.side = side;
    const S = ART_BAR.side, G = ART_BAR.gap + 4, slide = ART_BAR.shaping.has(a), F = TILE.foot;
    if (B.portrait) {
      const y = B.y - G - S - F; let x = B.x;
      if (slide) { this.slider.place(x, B.y - G - 44, ART_BAR.slider, false); x += ART_BAR.slider + 52; }
      for (const id of side) { this.tiles.get(id).place(x, y, S); x += S + G; }
    } else {
      const x = B.x - G - S; let y = B.y;
      if (slide) { const L = Math.min(ART_BAR.slider, B.h - (side.length ? S + F + 30 : 24)); this.slider.place(x + (S - 44) / 2, y, L, true); y += L + 24; }
      for (const id of side) { this.tiles.get(id).place(x, y, S); y += S + F + G; }
    }
  }

  update(now, on) {
    const g = this.game, R = g.realm, show = !!on && !!R?.active && !windowOpen(g);
    // the hand's own art and size, mirrored when they change (a key pressed; the driver's set)
    const H = R?.hand;
    if (H && H.art !== this.handArt) { if (this.handArt != null) this.set(H.art); this.handArt = H.art; }
    if (H && H.size !== this.handSize && !this.slider.held) { this.handSize = H.size; this.slider.set(H.size); }
    if (show !== this.shown) {
      this.shown = show; this.shelf.classList.toggle('off', !show);
      if (show) this.relayout();
      for (const id of ART_BAR.ids) this.tiles.get(id).set({ hidden: !show });
      this.dirty = true;
    }
    if (this.dirty && show) { this.dirty = false; this.layoutSide(); }
    for (const id of ['turn', 'spring', 'drain']) this.tiles.get(id).set({ hidden: !show || !this.side.includes(id) });
    this.slider.show(show && ART_BAR.shaping.has(this.art));
    if (!show) return;
    for (const [id, t] of this.tiles) {
      t.set({ lit: id === this.art || id === this.mod || t.state.pressed });
      t.update(now);
    }
  }
}
