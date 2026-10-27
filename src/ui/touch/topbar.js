// ---------------------------------------------------------------------------------------
// THE TOP BAR'S LOOK: the keys with no place on glass given a home (docs/plans/MOBILE.md 4.7: the windows as small icons along the top,
// out of the thumbs' way; the pause a button, 6.2), in the HUD layout's `areas.topBar`. In Anagami's dress (Clay):
//   THE SHELF  a strip of unglazed earthenware pressed with a cord-marked band (Jōmon ware's rope impressions, as the goals window's,
//              ui/goalswindow.js), its ends rounded, lying under the tiles.
//   THE TILES  44 px glazed tiles (the least: Apple's and Google's target), a glyph each and no word: CODEX, PNEUKA BOX, MAP, SETTINGS,
//              CHAT, TOP VIEW in the Spirit Garden only (MOBILE.md 8.2), and PAUSE apart at the end. A tile whose window is open is lit.
//   A TAP      let go on the tile it went down on: `game.events.emit('touch.open', { what, by })`, then `game.touchShell?.open?.(what)`
//              (Petra's shell wires what each opens: `what` is codex, box, map, settings, chat, overhead or pause), then `onOpen(what)`.
//   FOLDED     (the owner, 2026-10-26: "retractable menus", more room) one MENU tab and PAUSE at the area's left end; a tap on MENU opens
//              the row (MENU lit at its head), a window chosen or MENU tapped again folds it, and so do FOLD_S real seconds untouched.
// Hidden off touch; it stays up under a window (it is how a window is closed again).
//
// Prior art: the menu strips of the mobile ports (Genshin Impact's and Honkai's icon row along the top, Pokémon GO's corner ball), the
// pause menu holding them too (MOBILE.md 4.7), the goals window's cord-marked clay (ui/goalswindow.js).
//
//   new TouchTopBar(game)   .update(now, on)   .relayout()   .onOpen = (what) => {}   .tiles (Map)   TOP_BAR (the order, the numbers)
//   shelf() -> a clay shelf element (the art bar lies on one too)
// ---------------------------------------------------------------------------------------
import { TouchTile, TILE } from './tile.js';
import { placeOf } from './areas.js';

/** The windows in order (the glyph is `touch.<id>`), whether each stands only in the garden, and what says it is open; the gap before
 *  PAUSE (CSS px). */
export const TOP_BAR = {
  ids: ['codex', 'box', 'map', 'settings', 'chat', 'overhead', 'skiff', 'godhand', 'survey'],
  // where a tile stands (the rest always): TOP VIEW in the garden; the board on foot or riding; the hand outside the garden; its survey in the hand
  when: {
    overhead: (g) => !!g.realm?.active, skiff: (g) => !g.realm?.active && !g.god?.active && !g.emocean?.stage?.active, godhand: (g) => !g.realm?.active,
    survey: (g) => !!g.god?.active,
  },
  open: {
    codex: (g) => !!g.codex?.open, settings: (g) => !!g.settingsWindow?.isOpen, box: (g) => !!g.pneukaUI?.open, map: (g) => !!g.cartography?.open, chat: (g) => !!g.log?.typing,
    overhead: (g) => !!(g.realm?.active && g.realm?.camera?.view === 'overhead'), godhand: (g) => !!g.god?.active,
    skiff: (g) => { const T = g.player?.techs?.get?.('skiff') || g.techs?.get?.('skiff'); return !!T?.active; }, pause: () => { const o = document.getElementById('overlay'); return !!o && o.style.display !== 'none'; },
  },
  gap: 6, pauseGap: 14, h: 44, fold: 6, // (h: one row's height, the layout's own topBar.h; fold: real seconds an opened row stays untouched)
};

const CSS = `
.ttop{position:fixed;left:0;top:0;z-index:5;pointer-events:none;border-radius:calc(var(--h)/2);
  background:
    linear-gradient(180deg,rgba(255,230,200,.18),transparent 40%,rgba(0,0,0,.35)),
    repeating-linear-gradient(62deg,rgba(168,102,74,.55) 0 2px,rgba(92,48,32,.55) 2px 4px) 0 calc(100% - 8px)/100% 6px no-repeat,
    radial-gradient(circle,rgba(255,236,214,.16) 0 .6px,transparent .8px) 0 0/5px 6px,
    linear-gradient(180deg,#7a4630,#4e2a1c);
  box-shadow:inset 0 2px 3px rgba(0,0,0,.55),inset 0 -1px 0 rgba(255,226,196,.12),0 2px 0 #1c0d08,0 4px 10px rgba(0,0,0,.35)}
.ttop.off{display:none}
`;

/** A clay shelf for a row of tiles (the top bar's, the art bar's), hidden ('off') until laid: set its --h to its height. */
export function shelf() {
  if (!document.querySelector('style[data-touchtopbar]')) { const s = document.createElement('style'); s.setAttribute('data-touchtopbar', ''); s.textContent = CSS; document.head.appendChild(s); }
  const el = document.createElement('div'); el.className = 'ttop off'; document.body.appendChild(el);
  return el;
}

export class TouchTopBar {
  constructor(game) {
    this.game = game; this.onOpen = null; this.tiles = new Map(); this.shown = false; this.ids = []; this.folded = true; this.touched = 0;
    this.shelf = shelf();
    for (const id of [...TOP_BAR.ids, 'pause']) this.tiles.set(id, new TouchTile(`top.${id}`, { size: TILE.small, glyph: id, word: null, onPress: (_, down, inside) => { if (!down && inside) { if (id !== 'pause') this.fold(true); this.open(id); } } }));
    this.tiles.set('menu', new TouchTile('top.menu', { size: TILE.small, glyph: 'menu', word: null, onPress: (_, down, inside) => { if (!down && inside) this.fold(!this.folded); } }));
    this.tiles.set('log', new TouchTile('top.log', { size: TILE.small, glyph: 'chat', word: null, onPress: (_, down, inside) => { const L = game.hudLayout?.touchLog; if (!down && inside && L) { if (game.hudLayout.duelR) L.setSheet(!L.sheet); else L.fold(!L.folded); } } })); // (the log's fold on the bar beside MENU: South, 2026-10-27, it stood alone under the bar)
  }

  /** Folded to the MENU tab (and PAUSE), or the row opened. */
  fold(on) {
    if (this.folded === !!on) return;
    this.folded = !!on; this.touched = performance.now() / 1000;
    for (const id of TOP_BAR.ids) if (on) this.tiles.get(id).set({ hidden: true });
    this.shown = !this.shown; // (laid again, shown again: the next update)
    this.relayout();
  }
  /** What stands now, in order: MENU, the windows while open, PAUSE. */
  get items() { return this.folded ? ['menu', 'log', 'pause'] : ['menu', 'log', ...this.ids, 'pause']; }

  /** A window asked for: said on the bus, handed to the shell, and to the listener. */
  open(what) {
    const g = this.game;
    g.events?.emit?.('touch.open', { what, by: 'courier' });
    if (what === 'settings' && g.settingsWindow) { g.settingsWindow.open(); try { this.onOpen?.(what); } catch (e) { console.warn('topBar.onOpen', e); } return; } // (the window is here: the gear opens it, not the pause menu)
    try { g.touchShell?.open?.(what); } catch (e) { console.warn('touchShell.open', e); }
    try { this.onOpen?.(what); } catch (e) { console.warn('topBar.onOpen', e); }
  }

  /** Lay the shelf and its tiles in the top bar's area: one row centred, PAUSE apart at the end; wrapped into rows from the top where the
   *  area is too narrow for one (upright, beside the Sight). */
  relayout() {
    const A = placeOf(this.game).areas.topBar, s = TILE.small, G = TOP_BAR.gap, items = this.items, n = items.length;
    const one = n * s + (n - 1) * G + (TOP_BAR.pauseGap - G) + 16;
    const per = one <= A.w ? n : Math.max(1, Math.floor((A.w - 16 + G) / (s + G))), rows = Math.ceil(n / per), F = TILE.foot;
    const W = per === n ? one : per * s + (per - 1) * G + 16, H = rows * (s + F) + (rows - 1) * G + 8;
    const all = this.ids.length + 3, full = all * s + (all - 1) * G + (TOP_BAR.pauseGap - G) + 16; // (folded, the tab stands where the opened row's MENU does: the row unfolds from it)
    const x0 = per === n ? A.x + (A.w - (this.folded && full <= A.w ? full : W)) / 2 : A.x, y0 = rows === 1 ? A.y + (Math.min(A.h, TOP_BAR.h) - H) / 2 : A.y;
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(x0)}px, ${Math.round(y0)}px)`, width: `${Math.round(W)}px`, height: `${Math.round(H)}px` });
    this.shelf.style.setProperty('--h', `${Math.min(H, s + F + 8)}px`);
    items.forEach((id, i) => {
      const r = Math.floor(i / per), c = i % per, gapX = per === n && id === 'pause' ? TOP_BAR.pauseGap - G : 0;
      this.tiles.get(id).place(x0 + 8 + c * (s + G) + gapX, y0 + 4 + r * (s + F + G), s);
    });
  }

  update(now, on) {
    const g = this.game, ids = TOP_BAR.ids.filter((id) => { try { return !TOP_BAR.when[id] || TOP_BAR.when[id](g); } catch { return false; } });
    if (ids.join() !== this.ids.join()) { this.ids = ids; this.relayout(); for (const id of TOP_BAR.ids) if (!ids.includes(id)) this.tiles.get(id).set({ hidden: true }); this.shown = !on; }
    if (!!on !== this.shown) {
      this.shown = !!on; this.shelf.classList.toggle('off', !on);
      for (const id of this.items) this.tiles.get(id).set({ hidden: !on });
    }
    if (!on) return;
    if (!this.folded && now - this.touched > TOP_BAR.fold) this.fold(true); // (left open and untouched: folded again)
    for (const id of this.items) {
      const t = this.tiles.get(id); let lit = false; try { lit = id === 'menu' ? !this.folded : id === 'log' ? (g.hudLayout?.duelR ? !!g.hudLayout.touchLog?.sheet : !g.hudLayout?.touchLog?.folded) : !!TOP_BAR.open[id]?.(g); } catch { /* not there */ }
      if (t.state.pressed) this.touched = now;
      t.set({ lit: lit || t.state.pressed }); t.update(now);
    }
  }
}
