// ---------------------------------------------------------------------------------------
// THE SETTINGS WINDOW (docs/plans/MOBILE.md 9, M1): the player's own preferences (core/settings.js `game.settings`, its rows and
// Espada's words) as a System window in the Clay dress (ui/brineframe.js under ui/goalswindow.js clayDress), summoned before the world
// from the top bar's gear on touch (and `game.settingsWindow.open()` anywhere). A row a setting: its label, its one line, and its
// control, every one a 44 px target in 14 px type or more:
//   a slider   a glazed groove, its fill in the window colour, a clay knob riding it, the value as a count; a finger drags anywhere on it
//   a choice   glazed chips side by side, the chosen one lit gold (a choice's own line under it where it has one: Auto's)
//   a switch   a clay toggle, its pip slid to the gold end when on
//   an action  a button; a tap asks the row's confirm in place (its words, YES and NO), and runs only on YES; dimmed where it cannot
//              run yet (the layout's reset waits on the layout editor: `settings.available`)
//   the touch layout   the window's own row on touch (above the settings' rows): EDIT opens the touch layout editor in its place
//              (ui/touchlayouteditor.js); the window stays open under it (the game held as for any window) and comes back when it closes
// What a setting does is the settings' own (game.settings.set); this window only draws and asks. No stock control: the range input,
// the select and the checkbox are all drawn here.
//
// Prior art: Celeste's and Hades' options pages (a label, a line, the control, nothing else), Apple's settings rows (a footnote line
// under each), the house's goals window and turn card for the dress (ui/goalswindow.js, ui/turncard.js).
//
//   game.settingsWindow = new SettingsWindow(game)   .open()   .close()   .toggle()   .isOpen   .editLayout()   SETTINGS_WINDOW
// ---------------------------------------------------------------------------------------
import { brineFrame, GOLD, COUNT_FACE } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { FONT } from './theme.js';
import { sfx } from '../audio/sfx.js';
import { TouchLayoutEditor } from './touchlayouteditor.js';

/** The window's numbers: CSS px a frame dot, its width at most, a target's least height, the type's least size. */
export const SETTINGS_WINDOW = { d: 2, w: 520, target: 44, type: 14, title: 'SETTINGS',
  layout: { label: 'Touch layout', line: 'Move the buttons and the stick, and size the buttons.', edit: 'EDIT' } }; // (the layout row's words: placeholders, Espada's)

const T = SETTINGS_WINDOW;
const CSS = `
.sw-veil{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(14,6,3,.55);
  padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
.sw-veil[hidden]{display:none}
.sw-win{--d:${T.d}px;width:min(${T.w}px,100%);max-height:100%;display:flex;flex-direction:column;color:#efe6d2;font-family:${FONT.sys};font-size:${T.type + 1}px}
.sw-win .bf-body{display:flex;flex-direction:column;min-height:0;max-height:calc(100vh - 32px)}
${clayDress('.sw-win.clay')}
.sw-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 6px}
.sw-title{font-family:${FONT.title};font-weight:700;font-size:18px;letter-spacing:.16em}
.sw-x{min-width:${T.target}px;min-height:${T.target}px;display:flex;align-items:center;justify-content:center;font-family:${COUNT_FACE};font-size:22px;cursor:pointer;
  border-radius:8px;background:linear-gradient(180deg,#6a3a26,#3e2016);box-shadow:inset 0 1px 0 rgba(255,226,196,.2),0 2px 0 #1c0d08}
.sw-rows{overflow-y:auto;padding:0 14px 12px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.sw-row{padding:10px 0}
.sw-row+.sw-row{border-top:2px solid rgba(30,12,6,.45);box-shadow:inset 0 2px 0 rgba(255,226,196,.08)}
.sw-label{font-family:${FONT.title};font-weight:700;font-size:16px;letter-spacing:.06em;display:flex;justify-content:space-between;align-items:baseline}
.sw-val{font-family:${COUNT_FACE};font-size:16px;letter-spacing:.04em;font-variant-numeric:tabular-nums;color:${GOLD}}
.sw-line{font-size:${T.type}px;line-height:1.3;opacity:.82;margin:2px 0 8px}
.sw-track{position:relative;height:${T.target}px;cursor:pointer;touch-action:none}
.sw-groove{position:absolute;left:12px;right:12px;top:50%;height:10px;margin-top:-5px;border-radius:5px;background:#2a140c;
  box-shadow:inset 0 2px 0 rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.12)}
.sw-fill{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 55%),rgb(var(--jtop,104,50,32));filter:brightness(1.9) saturate(1.2)}
.sw-knob{position:absolute;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#f2c49a,#a8664a 55%,#5c3020);box-shadow:0 2px 0 #1c0d08,0 0 0 2px rgba(255,236,214,.25)}
.sw-chips{display:flex;gap:6px;flex-wrap:wrap}
.sw-chip,.sw-btn{min-height:${T.target}px;min-width:${T.target}px;padding:0 14px;display:flex;align-items:center;justify-content:center;cursor:pointer;
  font-family:${FONT.title};font-weight:700;font-size:15px;letter-spacing:.06em;border-radius:8px;
  background:linear-gradient(180deg,#6a3a26,#3e2016);box-shadow:inset 0 1px 0 rgba(255,226,196,.2),0 2px 0 #1c0d08}
.sw-chip.on{color:#2a140c;background:linear-gradient(180deg,#ffe9a8,${GOLD} 60%,#b98a2e)}
.sw-btn.dim{opacity:.4;cursor:default}
.sw-btn.yes{color:#2a140c;background:linear-gradient(180deg,#ffe9a8,${GOLD} 60%,#b98a2e)}
.sw-ask{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sw-ask span{font-size:${T.type}px;flex:1 1 180px}
.sw-switch{position:relative;width:76px;height:${T.target}px;cursor:pointer;border-radius:22px;background:#2a140c;box-shadow:inset 0 2px 0 rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.12)}
.sw-switch i{position:absolute;top:6px;left:6px;width:32px;height:32px;border-radius:50%;transition:left .18s;
  background:radial-gradient(circle at 35% 30%,#f2c49a,#a8664a 55%,#5c3020);box-shadow:0 2px 0 #1c0d08}
.sw-switch.on{background:linear-gradient(180deg,#b98a2e,#6e4e14)}
.sw-switch.on i{left:38px;background:radial-gradient(circle at 35% 30%,#fff2c4,${GOLD} 55%,#8a6418)}
`;

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmt = (r, v) => (r.max <= 3 ? (+v).toFixed(2) : String(Math.round(v)));

export class SettingsWindow {
  constructor(game) {
    this.game = game; this.root = null; this.isOpen = false;
    this.onKey = (e) => {
      if (!this.isOpen || e.code !== 'Escape') return;
      e.preventDefault(); e.stopPropagation();
      const E = this.game.touchLayoutEditor; if (E?.isOpen) E.close(false); else this.close(); // (Escape leaves the editor first: nothing kept)
    };
  }

  build() {
    if (this.root || typeof document === 'undefined') return;
    const s = document.createElement('style'); s.setAttribute('data-settingswindow', ''); s.textContent = CSS; document.head.appendChild(s);
    const root = (this.root = make('div', 'sw-veil')); root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'settings');
    const win = (this.win = make('div', 'sw-win clay')); root.append(win);
    const f = (this.frame = brineFrame(win));
    const head = make('div', 'sw-head'), x = make('div', 'sw-x', '✕');
    head.append(make('div', 'sw-title', T.title), x); x.onclick = () => this.close();
    this.rows = make('div', 'sw-rows');
    f.body.append(head, this.rows);
    root.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target === root) this.close(); });
    for (const ev of ['touchstart', 'mousedown', 'wheel']) root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); // (nothing under it is touched)
    document.body.appendChild(root);
  }

  /** The rows drawn again from the settings as they stand. */
  draw() {
    const S = this.game.settings; this.rows.textContent = '';
    if (this.game.hudLayout?.touch) { // (the touch layout editor: only where there is a touch layout to edit)
      const W = T.layout, row = make('div', 'sw-row'), label = make('div', 'sw-label'), box = make('div', 'sw-ask'), b = make('div', 'sw-btn', W.edit);
      label.append(make('span', null, W.label)); b.dataset.layoutEdit = ''; b.onclick = () => this.editLayout(); box.append(b);
      row.append(label, make('div', 'sw-line', W.line), box); this.rows.append(row);
    }
    if (!S) { this.rows.append(make('div', 'sw-line', 'No settings here.')); return; }
    for (const r of S.rows) {
      const row = make('div', 'sw-row'), label = make('div', 'sw-label'), name = make('span', null, r.label);
      label.append(name); row.append(label, make('div', 'sw-line', r.line || ''));
      if (r.kind === 'slider') row.append(this.slider(r, label));
      else if (r.kind === 'choice') row.append(this.choice(r, row));
      else if (r.kind === 'switch') row.append(this.switchRow(r));
      else if (r.kind === 'action') row.append(this.action(r));
      this.rows.append(row);
    }
  }

  slider(r, label) {
    const S = this.game.settings, track = make('div', 'sw-track'), groove = make('div', 'sw-groove'), fill = make('div', 'sw-fill'), knob = make('div', 'sw-knob'), val = make('span', 'sw-val');
    groove.append(fill, knob); track.append(groove); label.append(val);
    const show = () => { const v = S.get(r.id) ?? r.min, k = (v - r.min) / (r.max - r.min); fill.style.width = `${k * 100}%`; knob.style.left = `${k * 100}%`; val.textContent = fmt(r, v); };
    const at = (e) => { const b = groove.getBoundingClientRect(), k = Math.min(1, Math.max(0, (e.clientX - b.left) / Math.max(1, b.width))); S.set(r.id, r.min + k * (r.max - r.min)); show(); };
    let held = null;
    track.addEventListener('pointerdown', (e) => { held = e.pointerId; track.setPointerCapture?.(e.pointerId); at(e); });
    track.addEventListener('pointermove', (e) => { if (e.pointerId === held) at(e); });
    for (const ev of ['pointerup', 'pointercancel']) track.addEventListener(ev, (e) => { if (e.pointerId === held) { held = null; sfx.click?.(); } });
    show();
    return track;
  }

  choice(r, row) {
    const S = this.game.settings, chips = make('div', 'sw-chips'), own = make('div', 'sw-line');
    const show = () => { const v = S.get(r.id); [...chips.children].forEach((c) => c.classList.toggle('on', c.dataset.v === String(v))); own.textContent = r.lines?.[v] || ''; own.hidden = !own.textContent; };
    for (const [v, word] of r.choices) { const c = make('div', 'sw-chip', word); c.dataset.v = String(v); c.onclick = () => { if (S.set(r.id, v)) { sfx.menuMove?.(); show(); } }; chips.append(c); }
    const wrap = make('div'); wrap.append(chips, own); show();
    return wrap;
  }

  switchRow(r) {
    const S = this.game.settings, sw = make('div', 'sw-switch'); sw.append(make('i'));
    sw.setAttribute('role', 'switch');
    const show = () => { const on = !!S.get(r.id); sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on)); };
    sw.onclick = () => { S.set(r.id, !S.get(r.id)); sfx.menuMove?.(); show(); };
    show(); return sw;
  }

  action(r) {
    const S = this.game.settings, box = make('div', 'sw-ask'), can = S.available(r.id);
    const plain = () => {
      box.textContent = '';
      const b = make('div', `sw-btn${can ? '' : ' dim'}`, r.label.toUpperCase()); box.append(b);
      if (can) b.onclick = () => (r.confirm ? ask() : run());
    };
    const ask = () => {
      box.textContent = '';
      const yes = make('div', 'sw-btn yes', 'YES'), no = make('div', 'sw-btn', 'NO');
      box.append(make('span', null, r.confirm), yes, no);
      yes.onclick = run; no.onclick = () => { sfx.menuBack?.(); plain(); };
    };
    const run = () => { S.run(r.id); sfx.menuOk?.(); plain(); };
    plain(); return box;
  }

  open() {
    this.build(); if (!this.root || this.isOpen) return;
    this.isOpen = true; this.draw(); this.root.hidden = false; this.frame.layout?.();
    addEventListener('keydown', this.onKey, true);
    document.exitPointerLock?.();
    sfx.menuOpen?.();
  }
  /** The touch layout editor opened in the window's place; the window back when it closes. */
  editLayout() {
    const E = (this.game.touchLayoutEditor ||= new TouchLayoutEditor(this.game));
    if (!this.root) return false;
    this.root.hidden = true;
    const ok = E.open(() => { if (this.isOpen) { this.root.hidden = false; this.draw(); } });
    if (!ok) this.root.hidden = false;
    return ok;
  }
  close() {
    if (!this.isOpen) return;
    if (this.game.touchLayoutEditor?.isOpen) this.game.touchLayoutEditor.close(false);
    this.isOpen = false; this.root.hidden = true;
    removeEventListener('keydown', this.onKey, true);
    sfx.menuBack?.();
  }
  toggle() { if (this.isOpen) this.close(); else this.open(); }
}
