// ---------------------------------------------------------------------------
// The index: the console in the hub. Stand at it, press F, and pick a room; one teleport per room
// (the rooms' own stations are checkpoints: R takes you back to the last one). Under the rooms, the
// calibration numbers: the live movement values and the measured chains every space is sized from
// (the same ones as the hub's metrics board). Like the Codex it pauses the game while it's open.
// It also opens on a PAGE of its own: the Throwing Room's console shows its page (the drills, their bests, Strawman) in it.
//   menu.show()   menu.showPage(name, render(im, el), { title, sub, aside })   menu.close()   (aside: 'left' | 'right', the page set in a column to that side, no veil, the world left in view)
// ---------------------------------------------------------------------------
import { sfx } from '../audio/sfx.js';


const CSS = `
#indexmenu { position: fixed; inset: 0; z-index: 9; display: none; align-items: center; justify-content: center; background: rgba(20,9,6,.78); cursor: default; user-select: none; }
#indexmenu.open { display: flex; }
#indexmenu .im { width: min(720px, calc(100% - 24px)); max-height: calc(100% - 24px); overflow: auto; box-sizing: border-box; background: #2a140d; border: 1px solid rgba(255,178,122,.5);
  box-shadow: 0 0 0 4px rgba(28,13,8,.7), 0 20px 60px rgba(0,0,0,.6); padding: 18px 22px 16px; }
#indexmenu header { display: flex; align-items: baseline; gap: 14px; margin-bottom: 12px; }
#indexmenu h2 { margin: 0; font-size: 20px; letter-spacing: .22em; color: var(--accent); font-weight: normal; }
#indexmenu header .sub { opacity: .65; font-size: 12px; letter-spacing: .08em; flex: 1; }
#indexmenu .x { cursor: var(--jcur-pointer, pointer); padding: 2px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; font-size: 12px; letter-spacing: .1em; }
#indexmenu .x:hover { background: rgba(var(--jsel),.35); }
#indexmenu[data-aside] { background: none; }
#indexmenu[data-aside] .im { width: min(340px, calc(100% - 24px)); }
#indexmenu[data-aside="left"] { justify-content: flex-start; padding-left: 12px; }
#indexmenu[data-aside="right"] { justify-content: flex-end; padding-right: 12px; }
#indexmenu[data-aside] .rooms { grid-template-columns: 1fr; }
#indexmenu[data-aside] header { flex-wrap: wrap; row-gap: 4px; }
#indexmenu[data-aside] h2 { flex: 1; white-space: nowrap; font-size: 18px; }
#indexmenu[data-aside] header .sub { order: 3; flex: 1 0 100%; }
#indexmenu .grp { font-size: 11px; letter-spacing: .28em; color: var(--accent); margin: 14px 0 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,178,122,.2); }
#indexmenu .rooms { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
@media (max-width: 560px) { #indexmenu .rooms { grid-template-columns: 1fr; } }
#indexmenu .room { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border: 1px solid rgba(255,178,122,.25); border-radius: 4px; cursor: var(--jcur-pointer, pointer); background: rgba(28,13,8,.35); }
#indexmenu .room:hover, #indexmenu .room.sel { border-color: var(--accent); background: rgba(var(--jsel),.3); }
#indexmenu .room .n { font-size: 18px; width: 34px; text-align: center; color: var(--accent); }
#indexmenu .room b { display: block; font-weight: normal; letter-spacing: .08em; font-size: 13px; }
#indexmenu .room s { text-decoration: none; display: block; font-size: 10px; opacity: .65; }
#indexmenu .cal { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 18px; font-size: 11px; }
@media (max-width: 560px) { #indexmenu .cal { grid-template-columns: 1fr; } }
#indexmenu .cal div { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px dotted rgba(255,178,122,.15); padding: 2px 0; }
#indexmenu .cal span { opacity: .7; }
#indexmenu .cal b { font-weight: normal; color: #fff1dc; white-space: nowrap; }
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class IndexMenu {
  /** rooms: [{ id, tag, name, blurb, group }], go(id) teleports, calibration() -> { live: [[k, v]], chains: [[k, v]] }. */
  constructor(game, rooms, go, calibration = null) {
    this.calibration = calibration;
    this.game = game;
    this.rooms = rooms;
    this.go = go;
    this.open = false;
    this.sel = 0;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    this.root = el('div');
    this.root.id = 'indexmenu';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); });
    document.body.appendChild(this.root);
    addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.repeat) { e.preventDefault(); return; } // (a held key is one press: W held picked a room, SWEEPS group 1)
      game.input?.spend?.(e.code); // (a key the window takes is the window's: F that closes a page does not open it again, B that picks the Braid does not open the Codex)
      if (this.page) { if (e.code === 'KeyF' || e.code === 'Escape') { this.close(); e.preventDefault(); e.stopImmediatePropagation(); } return; } // (a page: its own clicks; its Esc is spent here, so the pause menu does not open under it: GARDEN-SWEEP #9)
      if (e.code === 'ArrowDown' || e.code === 'ArrowRight') { this.sel = (this.sel + 1) % this.rooms.length; this.render(); e.preventDefault(); }
      else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { this.sel = (this.sel + this.rooms.length - 1) % this.rooms.length; this.render(); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'Space') { this.pick(this.sel); e.preventDefault(); }
      else if (e.code === 'KeyF' || e.code === 'Escape') { this.close(); e.preventDefault(); e.stopImmediatePropagation(); }
      else { const i = this.rooms.findIndex((r) => r.code === e.code); if (i >= 0) this.pick(i); }
    });
  }

  show() {
    this.open = true;
    this.root.classList.add('open');
    document.exitPointerLock?.();
    this.render();
    sfx.lockOn?.(2);
  }

  /** The same window on a page of its own (the Throwing Room's console: world/testroom/drills.js page(im, el)), the calibration under it. */
  showPage(name, render, { title = null, sub = null, aside = null } = {}) { this.page = { name, render, title, sub, aside }; this.show(); } // (title/sub: a page that is not the index's own, a Shrine's)

  close() {
    if (!this.open) return;
    this.open = false;
    this.page = null;
    this.root.classList.remove('open');
    this.onClose?.();
  }

  pick(i) {
    const r = this.rooms[i];
    if (!r) return;
    this.close();
    this.go(r.id);
  }

  render() {
    const r = this.root;
    r.innerHTML = '';
    if (this.page?.aside) r.dataset.aside = this.page.aside; else delete r.dataset.aside; // (a page set aside: a column to one side, the world beside it unveiled)
    const im = el('div', 'im');
    r.appendChild(im);
    const head = el('header');
    head.appendChild(el('h2', '', this.page ? this.page.title || `INDEX · ${this.page.name.toUpperCase()}` : 'INDEX'));
    head.appendChild(el('span', 'sub', this.page ? this.page.sub || 'click to begin · F closes' : 'click a room, or its key (or arrows + Enter) · F closes'));
    const x = el('div', 'x', 'CLOSE');
    x.onclick = () => this.close();
    head.appendChild(x);
    im.appendChild(head);
    let group = null, grid = null;
    if (this.page) this.page.render(im, el);
    else this.rooms.forEach((room, i) => {
      if (room.group !== group) { group = room.group; im.appendChild(el('div', 'grp', group)); grid = el('div', 'rooms'); im.appendChild(grid); }
      const row = el('div', `room${i === this.sel ? ' sel' : ''}`, `<span class="n">${room.tag}</span><span><b>${room.name}</b><s>${room.blurb}</s></span>`);
      row.onclick = () => this.pick(i);
      row.onmouseenter = () => { this.sel = i; };
      grid.appendChild(row);
    });
    const cal = !this.page && this.calibration?.(); // (the basement's numbers belong under its list of rooms only, never under a page: GARDEN-SWEEP #3)
    if (cal) {
      for (const [title, rows] of [['CALIBRATION · LIVE (from the tuning panel)', cal.live], ['CALIBRATION · MEASURED CHAINS (default tuning)', cal.chains]]) {
        im.appendChild(el('div', 'grp', title));
        const g = el('div', 'cal');
        for (const [k, v] of rows) g.appendChild(el('div', '', `<span>${k}</span><b>${v}</b>`));
        im.appendChild(g);
      }
    }
  }
}
