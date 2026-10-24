// ---------------------------------------------------------------------------------------
// THE TOUCH BAR (docs/plans/MOBILE.md 4: the top bar and the pause button): on a phone, the windows the keyboard opens with a key
// (the Codex, the Pneuka Box, the map, the chat line, the god hand) as a strip of buttons out of the thumbs' way, and a pause button,
// since a phone has no pointer lock to lose. Shown only while the device last touched is touch (`input.device`), and never over the
// title. A button opens its window with the key the keyboard would press, sent as a key event (`keydown`, `keyup`), so a window's own
// key listener hears it as well as the game's reads (the bindings table's `top.*` rows: core/bindings.js). The pause is `game.pause`.
// THE LOOK IS A PLACEHOLDER (plain glyph buttons): Calissa's layout manager and tiles replace it (MOBILE.md 4.2); its words are Espada's.
//
// Prior art: the genre's top-corner menu strip on a phone (Genshin Impact's, Fortnite Mobile's), the pause button every touch game has.
//
//   game.touchBar = new TouchBar(game)   .update() (shown or hidden by the device and the title)   .el   TOUCH_BAR (the buttons)
// ---------------------------------------------------------------------------------------
import { ACTIONS, codeFor } from '../core/bindings.js';

/** The buttons, by their control id in the bindings table, with a placeholder glyph; `pause` is the game's own. */
export const TOUCH_BAR = [
  { id: 'pause', glyph: '❚❚' }, { id: 'top.codex', glyph: 'B' }, { id: 'top.box', glyph: 'P' },
  { id: 'top.map', glyph: 'M' }, { id: 'top.chat', glyph: '✎' }, { id: 'top.godhand', glyph: '✋' },
];
const CSS = `
.tbar { position: fixed; top: max(6px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); display: none; gap: 8px; z-index: 40; }
.tbar button { width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(255,230,200,.35); background: rgba(40,20,14,.55); color: #f3e2cc; font: 600 15px/1 system-ui; touch-action: none; }
.tbar button:active { background: rgba(120,60,30,.7); }
`;

export class TouchBar {
  constructor(game) {
    this.game = game;
    const st = document.createElement('style'); st.setAttribute('data-touchbar', ''); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.className = 'tbar';
    for (const b of TOUCH_BAR) {
      const btn = document.createElement('button'); btn.textContent = b.glyph; btn.dataset.control = b.id;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.press(b.id); });
      el.appendChild(btn);
    }
    document.body.appendChild(el);
    game.events?.on?.('input.device', () => this.update());
    game.events?.on?.('title.enter', () => this.update());
    this.update();
  }
  press(id) {
    const g = this.game;
    if (id === 'pause') return g.pause?.();
    const row = ACTIONS.find((r) => r.touch === id), code = row && codeFor(row);
    if (!code) return;
    const opts = { code, key: code.startsWith('Key') ? code.slice(3).toLowerCase() : code === 'Backquote' ? '`' : code, bubbles: true };
    dispatchEvent(new KeyboardEvent('keydown', opts)); // (as the keyboard would: the window's listener and the game's read alike)
    setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', opts)), 60);
  }
  update() { const g = this.game; this.el.style.display = g.input?.device === 'touch' && !g.title?.active ? 'flex' : 'none'; }
}
