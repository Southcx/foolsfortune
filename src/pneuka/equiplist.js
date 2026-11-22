// ---------------------------------------------------------------------------------------
// THE EQUIP LIST (plain name; South, 2026-11-22: "I can't actually swap any equipment from the pneuka box menu ... improve the Pneuka Box
// menu from a UX perspective, following the layouts and style of Phantasy Star Online"): the seven tools as a list in the Pneuka Box's
// window, beside the reading table, so a swap is two clicks or two keys and never a drag.
//   - A row a tool: an [M] or [S] tag on the main and the sub, its name and its genre label. The cursor row is lit as PSO's is (a bar of
//     light across it); hovering a row moves the cursor there.
//   - The panel under it says what the cursor's tool is: its R verb and passive as the sub, and the pair card it would make with the
//     main (as the sub) or with the sub (as the main).
//   - A click on a row opens PSO's small command window by it: EQUIP AS MAIN, EQUIP AS SUB, CANCEL. On the keys: Up and Down move the
//     cursor, Enter opens the command window (Up, Down and Enter choose in it), M and S equip the cursor's tool at once, Backspace backs out.
//   - A swap the belt refuses (the swap rule: a fight, a duel, the sea, a race, a table) is the loadout's own refusal: your seal on the
//     place, the belt's words in the log (pneuka/loadout.js swap).
// It holds nothing: the belt is the state (belt.main, belt.sub), the loadout swaps (Loadout.swap), the pair is progress/toolpairs.js.
//
// Prior art: Phantasy Star Online's item and equip menus (Sega, 2000): a translucent navy window with a pale cyan rim and rounded corners, a
// list with a lit cursor bar (here in the Box's own Clay dress, the house's gold and clay, never PSO's navy: South, 2026-11-22)
// and an E beside what is worn, a description window under it, and a small command window opened by the
// chosen row (Equip, Use, Drop); Final Fantasy's command cursor for the keys.
//
//   const E = new EquipList(game, loadout, onChange)   E.el (mount it)   E.draw()   E.key(e) -> true if it used the key   EQUIP_LIST_CSS
// ---------------------------------------------------------------------------------------
import { pairOf, SUB_GIFTS, TOOL_IDS } from '../progress/toolpairs.js';

/** The tools' names and genre labels (CLARITY.md), as the reading's cards say them. */
const NAME = { psygun: ['Psygun', 'gun'], sondelass: ['Sondelass', 'blade'], soulbrush: ['Soul Brush', 'brush'], veritome: ['Veritome', 'camera'],
  dreamvane: ['Dreamvane', 'dowsing rod'], crucibelle: ['Crucibelle', 'bell'], lockheart: ['Lockheart', 'coffin'] };

export const EQUIP_LIST_CSS = `
#pneuka .eq { --eqg: 231,196,106; --eqc: 255,178,122; width: 434px; box-sizing: border-box; border-radius: 6px; padding: 8px 10px 10px; color: #f6e2c8;
  background: linear-gradient(180deg, rgba(58,28,17,.94), rgba(30,13,8,.94)); border: 1px solid rgba(var(--eqc),.5);
  box-shadow: inset 0 0 0 3px rgba(60,28,18,.9), inset 0 0 18px rgba(var(--eqg),.08); font-size: 12px; position: relative; }
#pneuka .eq h4 { margin: 0 0 6px; font-size: 10px; letter-spacing: .22em; color: #e7c46a; font-weight: normal; display: flex; justify-content: space-between; }
#pneuka .eq h4 s { text-decoration: none; opacity: .6; letter-spacing: .08em; font-size: 10px; color: #f6e2c8; }
#pneuka .eq .row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 6px; height: 22px; padding: 0 8px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); position: relative; border: 1px solid transparent; }
#pneuka .eq .row .tag { font-size: 10px; text-align: center; border-radius: 3px; line-height: 15px; font-family: Georgia, serif; font-weight: 700; }
#pneuka .eq .row .tag.m { background: linear-gradient(180deg, #ffe3a0, #d9a440); color: #2a1a04; box-shadow: inset 0 -1px 0 rgba(0,0,0,.25); }
#pneuka .eq .row .tag.s { background: linear-gradient(180deg, #d8ecdc, #8fb89c); color: #10241a; box-shadow: inset 0 -1px 0 rgba(0,0,0,.25); }
#pneuka .eq .row .lb { opacity: .55; font-size: 10px; letter-spacing: .08em; }
#pneuka .eq .row.cur { background: linear-gradient(90deg, rgba(var(--eqg),.34), rgba(var(--eqg),.05)); border-color: rgba(var(--eqg),.7); }
#pneuka .eq .row.cur::before { content: '\\25B6'; position: absolute; left: -3px; font-size: 9px; color: #ffd98a; }
#pneuka .eq .info { margin-top: 8px; padding: 7px 9px; border-radius: 4px; background: rgba(14,6,4,.55); border: 1px solid rgba(var(--eqc),.22); line-height: 1.5; min-height: 58px; }
#pneuka .eq .info b { color: #ffd98a; font-weight: normal; } #pneuka .eq .info i { font-style: normal; color: #e7c46a; }
#pneuka .eq .keys { margin-top: 6px; font-size: 10px; opacity: .55; letter-spacing: .06em; }
#pneuka .eq .cmd { position: absolute; z-index: 3; min-width: 160px; border-radius: 4px; padding: 4px; background: linear-gradient(180deg, rgba(66,32,19,.98), rgba(36,16,10,.98));
  border: 1px solid rgba(var(--eqg),.75); box-shadow: inset 0 0 0 2px rgba(60,28,18,.9), 0 6px 18px rgba(0,0,0,.6); }
#pneuka .eq .cmd div { padding: 3px 10px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); letter-spacing: .08em; }
#pneuka .eq .cmd div.cur { background: rgba(var(--eqg),.3); color: #fff1dc; } #pneuka .eq .cmd div.off { opacity: .4; }
`;

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class EquipList {
  constructor(game, loadout, onChange = () => {}) {
    this.game = game; this.loadout = loadout; this.onChange = onChange;
    this.cur = 0; this.cmd = null; // (the cursor's row; the command window's cursor while it is open, or null)
    this.el = typeof document === 'undefined' ? null : el('div', 'eq');
  }
  get belt() { return this.game.belt; }
  get id() { return TOOL_IDS[this.cur]; }
  as(id) { return id === this.belt?.main ? 'main' : id === this.belt?.sub ? 'sub' : null; }
  /** The command window's lines for the cursor's tool: each with whether it would do anything. */
  commands() {
    const id = this.id, a = this.as(id);
    const C = [{ label: 'EQUIP AS MAIN', run: () => this.equip('main'), on: a !== 'main' }, { label: 'EQUIP AS SUB', run: () => this.equip('sub'), on: a !== 'sub' && !(a === 'main' && !this.belt?.sub) }];
    if (a === 'sub') C.push({ label: 'REMOVE SUB', run: () => this.unequip(), on: true }); // (a main worn alone: South, 2026-11-22)
    C.push({ label: 'CANCEL', run: () => this.close(), on: true });
    return C;
  }
  equip(as) { this.cmd = null; if (this.as(this.id) === as) { this.draw(); return false; } const ok = this.loadout.swap(this.id, as); this.onChange(); return ok; }
  unequip() { this.cmd = null; const ok = this.belt?.unequipSub?.() ?? false; this.loadout.draw?.(); this.onChange(); this.draw(); return ok; }
  close() { this.cmd = null; this.draw(); }
  move(d) { this.cur = (this.cur + d + TOOL_IDS.length) % TOOL_IDS.length; this.draw(); }

  /** The info window's lines for the cursor's tool. */
  info() {
    const B = this.belt, id = this.id, G = SUB_GIFTS[id] || {}, [name, label] = NAME[id] || [id, ''], a = this.as(id);
    const asSub = id !== B.main ? pairOf(B.main, id) : null, asMain = B.sub && id !== B.sub ? pairOf(id, B.sub) : null;
    const alone = !B.sub && id === B.main ? '<br>Worn alone: no sub, so R lends nothing.' : '';
    return `<b>${name}</b> · ${label}${a ? ` · worn as the <i>${a}</i>` : ''}<br>As the sub, R: <i>${G.verb || '-'}</i>${G.does ? `, ${G.does}` : ''} · passive: ${G.passive || 'none'}<br>`
      + `${asSub ? `With your main: <i>${asSub.card}</i>` : ''}${asSub && asMain ? ' · ' : ''}${asMain ? `as the main with your sub: <i>${asMain.card}</i>` : ''}${alone}`;
  }

  draw() {
    const E = this.el; if (!E || !this.belt) return;
    E.replaceChildren();
    E.appendChild(el('h4', '', '<span>EQUIP</span><s>click a tool, or ↑ ↓ and Enter</s>'));
    TOOL_IDS.forEach((id, i) => {
      const a = this.as(id), [name, label] = NAME[id] || [id, ''];
      const r = el('div', `row${i === this.cur ? ' cur' : ''}`, `<span class="tag ${a === 'main' ? 'm' : a === 'sub' ? 's' : ''}">${a === 'main' ? 'M' : a === 'sub' ? 'S' : ''}</span><span>${name}</span><span class="lb">${label}</span>`);
      r.onmouseenter = () => { if (this.cmd == null && this.cur !== i) { this.cur = i; this.paint(); } }; // (the cursor follows the mouse, the rows kept: a redraw under the mouse eats the click)
      r.onclick = (e) => { e.stopPropagation(); this.cur = i; this.cmd = this.commands().findIndex((c) => c.on); this.draw(); };
      E.appendChild(r);
    });
    E.appendChild(el('div', 'info', this.info()));
    E.appendChild(el('div', 'keys', 'M: equip as main · S: as sub · U: remove the sub · Backspace: cancel'));
    if (this.cmd != null) {
      const w = el('div', 'cmd'), row = E.querySelectorAll('.row')[this.cur];
      this.commands().forEach((c, k) => { const d = el('div', `${k === this.cmd ? 'cur' : ''}${c.on ? '' : ' off'}`, c.label); d.onclick = (e) => { e.stopPropagation(); if (c.on) c.run(); }; d.onmouseenter = () => { this.cmd = k; for (const [j, x] of [...w.children].entries()) x.classList.toggle('cur', j === k); }; w.appendChild(d); });
      w.style.left = '190px'; w.style.top = `${(row?.offsetTop ?? 30) + 22}px`;
      E.appendChild(w);
    }
  }
  /** The cursor and the info redrawn in place (the rows kept under the mouse). */
  paint() {
    const rows = this.el?.querySelectorAll('.row') || [];
    rows.forEach((r, i) => r.classList.toggle('cur', i === this.cur));
    const inf = this.el?.querySelector('.info'); if (inf) inf.innerHTML = this.info();
  }

  /** A key while the Box is open and showing its pocket side: true if the list used it. */
  key(e) {
    if (!this.el?.isConnected) return false;
    const c = e.code;
    if (this.cmd != null) {
      const C = this.commands();
      if (c === 'ArrowUp' || c === 'ArrowDown') { const d = c === 'ArrowUp' ? -1 : 1; let k = this.cmd; for (let n = 0; n < C.length; n++) { k = (k + d + C.length) % C.length; if (C[k].on) break; } this.cmd = k; this.draw(); return true; }
      if (c === 'Enter' || c === 'NumpadEnter') { C[this.cmd]?.run(); return true; }
      if (c === 'Backspace') { this.close(); return true; }
      return false;
    }
    if (c === 'ArrowUp') { this.move(-1); return true; }
    if (c === 'ArrowDown') { this.move(1); return true; }
    if (c === 'Enter' || c === 'NumpadEnter') { this.cmd = this.commands().findIndex((x) => x.on); this.draw(); return true; }
    if (c === 'KeyM') { this.equip('main'); return true; }
    if (c === 'KeyS') { if (this.as(this.id) === 'main' && !this.belt?.sub) return true; this.equip('sub'); return true; }
    if (c === 'KeyU') { this.unequip(); return true; }
    return false;
  }
}
