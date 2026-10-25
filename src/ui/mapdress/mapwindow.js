// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS: THE WINDOW (board v1, panels B1, C and D; Dovina's MAP.md 2 and 3). The map (M) as a System window in the Clay dress
// (ui/brineframe.js under ui/goalswindow.js clayDress), built on opening and removed on closing:
//   THE HEAD     no "MAP": the title is where you are (the area's name, or the island's), the path above it (THE ISLAND > THE DUNES >
//                THE GNOMON FLATS) or the island's one line; ISLAND (back to the island level) on an area's page; CLOSE as the house's
//                close mark with its key in the device's words under it (M; nothing on touch). Always on screen.
//   THE SKETCH   one canvas in a recessed box: the island level (island.js) or an area's page (areapage.js), drawn by the map's engine
//                (Petra's: feedback/cartography.js), which sizes the canvas to `box()` at the device ratio and owns its input.
//   THE SIDE     an area's checklist (checklist.js); none on the island level.
//   FLOORS       inside a building only: a stack of floors (F2, F1, B1) at the sketch's right edge, yours lit.
//   LAYOUTS      desk: a framed window, the sketch left and the checklist right. A phone upright: the whole glass, the sketch above
//                and the checklist a sheet below. A phone on its side: the whole glass, the sketch left, the checklist right. Every
//                press 44 px or more, type 14 px or more (the settings window's rule).
//
// Prior art: Final Fantasy XII's map (the area's name as the title, the region a level up), Metroid Prime's floor stack, the house's
// settings window (ui/settingswindow.js) for the dress and its close mark; Apple's 44 pt targets.
//
//   const w = mapWindow({ host?, words?, closeKey?, onIsland, onClose, onFloor })
//   w.open()   w.close()   w.isOpen   w.island({ title, sub })   w.area({ title, path, floors, rows, line, game })
//   w.canvas   w.box() -> { w, h } (CSS px)   w.layout -> 'desk' | 'portrait' | 'landscape'   w.onResize = fn   w.dispose()
// ---------------------------------------------------------------------------------------
import { brineFrame, GOLD, COUNT_FACE } from '../brineframe.js';
import { clayDress } from '../goalswindow.js';
import { FONT } from '../theme.js';
import { checklist } from './checklist.js';
import { disposeAreaPage } from './areapage.js';

/** The window's numbers and words (placeholders, Espada's): a press's least size, the type's least size, the desk's frame. */
export const MAP_WINDOW = { target: 44, type: 14, deskW: 1180, deskH: 760, side: 300, phone: 700, low: 560,
  words: { island: 'ISLAND', close: '✕', sep: ' ▸ ' } };

const T = MAP_WINDOW;
const CSS = `
.mdw-veil{position:fixed;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(14,6,3,.62);box-sizing:border-box;
  padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
.mdw-veil.desk{padding:24px}
.mdw-win{--d:2px;display:flex;flex-direction:column;color:#efe6d2;font-family:${FONT.sys};font-size:${T.type + 1}px;width:100%;height:100%}
.mdw-veil.desk .mdw-win{width:min(${T.deskW}px,100%);height:min(${T.deskH}px,100%)}
.mdw-win .bf-body{display:flex;flex-direction:column;height:100%;box-sizing:border-box;min-height:0;padding:8px 10px 10px}
${clayDress('.mdw-win.clay')}
.mdw-head{display:flex;align-items:center;gap:8px;padding:2px 2px 8px;flex:none}
.mdw-titles{flex:1;min-width:0}
.mdw-path{font-size:${T.type}px;letter-spacing:.06em;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mdw-title{font-family:${FONT.title};font-weight:700;font-size:21px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mdw-veil.portrait .mdw-title,.mdw-veil.landscape .mdw-title{font-size:18px;letter-spacing:.06em}
.mdw-btn,.mdw-x{min-width:${T.target}px;min-height:${T.target}px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;flex:none;
  border:0;color:#efe6d2;border-radius:8px;background:linear-gradient(180deg,#6a3a26,#3e2016);box-shadow:inset 0 1px 0 rgba(255,226,196,.2),0 2px 0 #1c0d08}
.mdw-btn{padding:0 14px;font-family:${FONT.title};font-weight:700;font-size:15px;letter-spacing:.1em}
.mdw-btn[hidden]{display:none}
.mdw-x{font-family:${COUNT_FACE};font-size:22px;line-height:1}
.mdw-x small{font-family:${FONT.sys};font-size:${T.type}px;opacity:.7;line-height:1}
.mdw-btn:hover,.mdw-x:hover{background:linear-gradient(180deg,#7a4630,#4e2a1c)}
.mdw-main{flex:1;min-height:0;display:flex;gap:10px}
.mdw-veil.portrait .mdw-main{flex-direction:column}
.mdw-sketch{position:relative;flex:1;min-width:0;min-height:0;border-radius:4px;overflow:hidden;background:#2a140c;
  box-shadow:inset 0 2px 0 rgba(0,0,0,.6),inset 0 0 0 2px rgba(20,8,4,.8),0 1px 0 rgba(255,226,196,.12)}
.mdw-sketch canvas{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;display:block}
.mdw-side{width:${T.side}px;flex:none;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:2px 4px 4px;box-sizing:border-box}
.mdw-veil.landscape .mdw-side{width:min(${T.side}px,42%)}
.mdw-veil.portrait .mdw-side{width:auto;height:44%;padding-top:6px;border-top:2px solid rgba(30,12,6,.5)}
.mdw-veil.island .mdw-side{display:none}
.mdw-floors{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px}
.mdw-floors[hidden]{display:none}
.mdw-floor{min-width:${T.target}px;min-height:${T.target}px;border:0;border-radius:6px;cursor:pointer;font-family:${COUNT_FACE};font-size:18px;color:#2a1810;
  background:linear-gradient(180deg,#efe0c2,#cdb08a);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 2px 0 #3e2016,0 0 0 1px #2a140c}
.mdw-floor.here{background:linear-gradient(180deg,#ffe9a8,${GOLD} 60%,#b98a2e);box-shadow:0 2px 0 #3e2016,0 0 0 1px #2a140c,0 0 10px rgba(255,211,106,.55)}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-mapwindow', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** Which layout a screen takes: a phone upright, a phone on its side, or the desk. */
export function mapLayout(w = innerWidth, h = innerHeight) {
  if (h > w && w < T.phone) return 'portrait';
  if (h < T.low) return 'landscape';
  return 'desk';
}

/** The map's window (built on open, removed on close). */
export function mapWindow({ host = null, words = null, closeKey = 'M', onIsland = null, onClose = null, onFloor = null } = {}) {
  const W = { ...T.words, ...words };
  let root = null, win = null, frame = null, els = null, ro = null, mode = 'island', last = null;
  const api = {
    isOpen: false, canvas: null, layout: 'desk', onResize: null,
    open() {
      if (api.isOpen || typeof document === 'undefined') return api;
      style();
      root = make('div', 'mdw-veil'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'map');
      win = make('div', 'mdw-win clay'); root.append(win);
      frame = brineFrame(win);
      const head = make('div', 'mdw-head'), titles = make('div', 'mdw-titles'), path = make('div', 'mdw-path'), title = make('div', 'mdw-title');
      const back = make('button', 'mdw-btn', W.island), x = make('button', 'mdw-x');
      back.type = x.type = 'button'; x.setAttribute('aria-label', 'close'); x.append(make('span', null, W.close));
      if (closeKey) x.append(make('small', null, closeKey));
      back.onclick = () => onIsland?.(); x.onclick = () => { api.close(); onClose?.(); };
      titles.append(path, title); head.append(titles, back, x);
      const main = make('div', 'mdw-main'), sketch = make('div', 'mdw-sketch'), side = make('div', 'mdw-side'), floors = make('div', 'mdw-floors');
      const canvas = make('canvas'); sketch.append(canvas, floors); main.append(sketch, side);
      frame.body.append(head, main);
      for (const ev of ['pointerdown', 'touchstart', 'mousedown', 'wheel']) root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); // (nothing under it is touched)
      els = { path, title, back, x, sketch, side, floors };
      api.canvas = canvas;
      (host || document.body).appendChild(root);
      const fit = () => { api.layout = mapLayout(); root.className = `mdw-veil ${api.layout} ${mode}`; };
      fit();
      ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { fit(); api.onResize?.(api.box()); }) : null;
      ro?.observe(sketch); addEventListener('resize', fit);
      api._fit = fit; api.isOpen = true;
      if (last) (last.kind === 'island' ? api.island(last.d) : api.area(last.d));
      return api;
    },
    close() {
      if (!api.isOpen) return;
      api.isOpen = false; ro?.disconnect(); ro = null; removeEventListener('resize', api._fit);
      if (api.canvas) api.canvas.width = api.canvas.height = 0;
      root?.remove(); root = win = frame = els = null; api.canvas = null;
      disposeAreaPage();
    },
    /** The island level: its title and its one line. */
    island(d = {}) {
      last = { kind: 'island', d }; mode = 'island'; if (!api.isOpen) return api;
      api._fit();
      els.path.textContent = d.sub || ''; els.path.hidden = !d.sub; els.title.textContent = d.title || '';
      els.back.hidden = true; els.side.textContent = ''; els.floors.hidden = true;
      return api;
    },
    /** An area's page: its title, the path to it, its floors (inside a building), its checklist rows and line. */
    area(d = {}) {
      last = { kind: 'area', d }; mode = 'area'; if (!api.isOpen) return api;
      api._fit();
      els.path.textContent = (d.path || []).join(W.sep); els.path.hidden = !d.path?.length; els.title.textContent = d.title || '';
      els.back.hidden = false;
      checklist(els.side, d.rows ?? null, { line: d.line, game: d.game, words: d.words });
      els.floors.textContent = ''; els.floors.hidden = !d.floors?.length;
      for (const f of d.floors || []) {
        const b = make('button', `mdw-floor${f.here ? ' here' : ''}`, f.label); b.type = 'button';
        b.onclick = () => onFloor?.(f.id); els.floors.append(b);
      }
      return api;
    },
    /** The sketch's box in CSS px (the engine sizes the canvas to it at the device ratio, capped at 2). */
    box() { const r = els?.sketch.getBoundingClientRect(); return { w: Math.round(r?.width || 0), h: Math.round(r?.height || 0) }; },
    dispose() { api.close(); last = null; },
  };
  return api;
}
