// ---------------------------------------------------------------------------------------
// THE TOP BAR'S LOOK: the keys with no place on glass given a home (docs/plans/MOBILE.md 4.7: the windows as small icons along the top,
// out of the thumbs' way; the pause a button, 6.2), in the HUD layout's `areas.topBar`. In Anagami's dress (Clay):
//   THE SHELF  a strip of unglazed earthenware pressed with a cord-marked band (Jōmon ware's rope impressions, as the goals window's,
//              ui/goalswindow.js), its ends rounded, lying under the tiles.
//   THE TILES  44 px glazed tiles (the least: Apple's and Google's target), a glyph each and no word: CODEX, PNEUKA BOX, MAP, SETTINGS,
//              CHAT, TOP VIEW in the Spirit Garden only (MOBILE.md 8.2), and PAUSE apart at the end. A tile whose window is open is lit.
//   A TAP      let go on the tile it went down on: `game.events.emit('touch.open', { what, by })`, then `game.touchShell?.open?.(what)`
//              (Petra's shell wires what each opens: `what` is codex, box, map, settings, chat, overhead or pause), then `onOpen(what)`.
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
  ids: ['codex', 'box', 'map', 'settings', 'chat', 'overhead'],
  garden: new Set(['overhead']),
  open: {
    codex: (g) => !!g.codex?.open, box: (g) => !!g.pneukaUI?.open, map: (g) => !!g.cartography?.open, chat: (g) => !!g.log?.typing,
    overhead: (g) => !!(g.realm?.active && g.realm?.camera?.view === 'overhead'), pause: () => { const o = document.getElementById('overlay'); return !!o && o.style.display !== 'none'; },
  },
  gap: 6, pauseGap: 14,
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
    this.game = game; this.onOpen = null; this.tiles = new Map(); this.shown = false; this.ids = [];
    this.shelf = shelf();
    for (const id of [...TOP_BAR.ids, 'pause']) this.tiles.set(id, new TouchTile(`top.${id}`, { size: TILE.small, glyph: id, word: null, onPress: (_, down, inside) => { if (!down && inside) this.open(id); } }));
  }

  /** A window asked for: said on the bus, handed to the shell, and to the listener. */
  open(what) {
    const g = this.game;
    g.events?.emit?.('touch.open', { what, by: 'courier' });
    try { g.touchShell?.open?.(what); } catch (e) { console.warn('touchShell.open', e); }
    try { this.onOpen?.(what); } catch (e) { console.warn('topBar.onOpen', e); }
  }

  /** Lay the shelf and its tiles in the top bar's area, centred, PAUSE apart at the end. */
  relayout() {
    const A = placeOf(this.game).areas.topBar, s = TILE.small, n = this.ids.length;
    const W = n * s + (n - 1) * TOP_BAR.gap + TOP_BAR.pauseGap + s + 16, H = s + TILE.foot + 8;
    const x0 = A.x + (A.w - W) / 2, y0 = A.y + (A.h - H) / 2;
    Object.assign(this.shelf.style, { transform: `translate(${Math.round(x0)}px, ${Math.round(y0)}px)`, width: `${Math.round(W)}px`, height: `${Math.round(H)}px` });
    this.shelf.style.setProperty('--h', `${H}px`);
    let x = x0 + 8;
    for (const id of this.ids) { this.tiles.get(`${id}`).place(x, y0 + 4, s); x += s + TOP_BAR.gap; }
    this.tiles.get('pause').place(x - TOP_BAR.gap + TOP_BAR.pauseGap, y0 + 4, s);
  }

  update(now, on) {
    const g = this.game, ids = TOP_BAR.ids.filter((id) => !TOP_BAR.garden.has(id) || g.realm?.active);
    if (ids.join() !== this.ids.join()) { this.ids = ids; this.relayout(); for (const id of TOP_BAR.ids) if (!ids.includes(id)) this.tiles.get(id).set({ hidden: true }); this.shown = !on; }
    if (!!on !== this.shown) {
      this.shown = !!on; this.shelf.classList.toggle('off', !on);
      for (const id of [...this.ids, 'pause']) this.tiles.get(id).set({ hidden: !on });
    }
    if (!on) return;
    for (const id of [...this.ids, 'pause']) { const t = this.tiles.get(id); let lit = false; try { lit = !!TOP_BAR.open[id]?.(g); } catch { /* not there */ } t.set({ lit: lit || t.state.pressed }); t.update(now); }
  }
}
