// ---------------------------------------------------------------------------------------
// THE PNEUKA BOX'S WINDOW (P): what the Courier carries, and what they wear, summoned into a world slowed to a tenth (PNEUKA-BOX.md 5, the
// pick: the reading table). Left, THE READING (pneuka/loadout.js on Calissa's ui/readingtable.js): the main upright, the sub crossed, the pair's
// card above, the five tools not worn fanned below, and under it what is fitted to the main and the sub (the lure, the instrument, the
// coffin's keys and odds, the bottle, the psygun's chambers), each taken off with a click. Right, the pocket: fifty-six slots, eight across;
// and the Book as the bank, open at a Shrine or with the Veritome open as the main: the curios kept there, stacked, each taken out with a
// click, and STORE ALL to empty the box into it.
//
// How it is used, as OSRS's inventory is: a LEFT CLICK does the obvious thing (with the Book open, store it; otherwise tie a curio
// on the line), a RIGHT CLICK lists everything that can be done (Tie on, Store, Drop, Examine), a slot can be DRAGGED onto another
// to swap them, and the line at the top says what a click would do before it is clicked. Examine writes to the log, as OSRS's does
// to the chat (the log is the only text feedback: tracking.js).
//
// Prior art: Old School RuneScape's inventory (the grid, left click / right click menus, "Use X -> Y" in the hover line), its bank (Deposit
// inventory); the reading's own in ui/readingtable.js and pneuka/loadout.js.
// ---------------------------------------------------------------------------------------
import { SLOTS, FITTINGS, STORAGE, STORAGE_SHUT } from './box.js';
import { oddsOf, rates, OUTCOMES, HEARTS } from '../tools/lockheart/table.js';
import { itemOf } from './items.js';
import { itemIcon } from './icons.js';
import { lureList, tasteOf, BARE } from '../tools/sondelass/angling/lures.js';
import { RT_CLASSES } from '../ui/readingtable.js';
import { Loadout } from './loadout.js';
import { Reading } from './reading.js';
import { Underside, UNDERSIDE_CSS } from './underside.js';
import { SUITS } from '../progress/spreads.js';
import { ASPECTS } from '../tools/sondelass/angling/species.js';
import { SHELL_TYPES } from '../tools/psygun/shells.js';

const CSS = `
#pneuka { position: fixed; inset: 0; z-index: 9; display: none; align-items: center; justify-content: center; background: rgba(20,9,6,.6); cursor: default; user-select: none; }
#pneuka.open { display: flex; }
#pneuka .px { background: #2a140d; border: 1px solid rgba(255,178,122,.5); box-shadow: 0 10px 40px rgba(0,0,0,.6), inset 0 0 0 3px rgba(60,28,18,.9); padding: 16px 18px 12px; color: #f6e2c8;
  font-family: inherit; max-width: calc(100% - 24px); max-height: calc(100% - 24px); overflow: auto; box-sizing: border-box; }
#pneuka header { display: flex; align-items: baseline; gap: 14px; margin-bottom: 6px; }
#pneuka h2 { margin: 0; font-size: 18px; letter-spacing: .22em; color: var(--accent, #ffb27a); font-weight: normal; }
#pneuka header .sub { opacity: .6; font-size: 11px; letter-spacing: .08em; flex: 1; }
#pneuka.bare > .px { display: none !important; }
#pneuka .x { cursor: var(--jcur-pointer, pointer); padding: 2px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; font-size: 11px; letter-spacing: .1em; }
#pneuka .x:hover { background: rgba(var(--jsel),.35); }
#pneuka .hover { height: 18px; font-size: 12px; margin: 0 0 8px; color: #fff1dc; }
#pneuka .hover b { color: #ffd98a; font-weight: normal; }
#pneuka .cols { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
#pneuka .pane:not(.rt-book):not(.rt-pane) { background: rgba(14,6,4,.55); border: 1px solid rgba(255,178,122,.22); border-radius: 4px; padding: 10px; }
#pneuka .pane h4 { margin: 0 0 8px; font-size: 10px; letter-spacing: .22em; color: #e7c46a; font-weight: normal; display: flex; justify-content: space-between; gap: 12px; }
#pneuka .grid { display: grid; grid-template-columns: repeat(8, 52px); gap: 5px; }
#pneuka .bank .grid { grid-template-columns: repeat(5, 52px); }
#pneuka .slot { width: 52px; height: 52px; box-sizing: border-box; position: relative; cursor: var(--jcur-pointer, pointer); }
#pneuka .slot:not(.rt-slot) { border: 1px solid rgba(255,178,122,.18); border-radius: 4px; background: rgba(40,18,10,.75); } /* (the pocket's slots wear the reading table's dress: RT_CLASSES) */
#pneuka .slot:not(.rt-slot):hover { border-color: rgba(255,210,150,.75); background: rgba(80,36,20,.8); }
#pneuka .slot.sp-lit { box-shadow: inset 0 0 0 1px rgba(255,217,138,.35); } #pneuka .slot.sp-dark { box-shadow: inset 0 0 0 1px #5a2a1a; opacity: .8; } /* (lit by the spread: SPREADS.md; Calissa dresses the glow) */
#pneuka .slot.sp-counts { box-shadow: inset 0 0 0 2px #ffd98a, 0 0 8px rgba(255,217,138,.6); }
#pneuka .slot.drag { opacity: .4; } #pneuka .slot.over { border-color: #ffd98a; }
#pneuka .slot img { position: absolute; inset: 3px; width: calc(100% - 6px); height: calc(100% - 6px); pointer-events: none; }
#pneuka .slot .n { position: absolute; left: 3px; top: 1px; font-size: 11px; color: #ffef7a; text-shadow: 1px 1px 0 #000; pointer-events: none; }
#pneuka .slot .g { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; pointer-events: none; }
#pneuka .slot.empty { cursor: default; }
#pneuka .equip { width: 560px; }
#pneuka .px.fit { max-width: none; max-height: none; overflow: visible; transform-origin: center; }
#pneuka .px.fit .cols { flex-wrap: nowrap; }
#pneuka .reading { display: flex; flex-direction: column; gap: 10px; }
#pneuka .side { display: flex; flex-direction: column; gap: 12px; }
#pneuka .lure { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
#pneuka .lure .slot { width: 64px; height: 64px; }
#pneuka .lure .t { font-size: 12px; line-height: 1.35; }
#pneuka .lure .t s { text-decoration: none; opacity: .65; font-size: 10px; letter-spacing: .1em; display: block; }
#pneuka .taste { display: grid; grid-template-columns: 54px 1fr; gap: 2px 6px; font-size: 9px; letter-spacing: .08em; margin: 4px 0 8px; align-items: center; }
#pneuka .taste i { display: block; height: 5px; border-radius: 2px; background: currentColor; }
#pneuka .belt { display: grid; grid-template-columns: 1fr; gap: 4px; }
#pneuka .belt div { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 6px; border: 1px solid rgba(255,178,122,.15); border-radius: 3px; background: rgba(40,18,10,.5); }
#pneuka .belt div.on { border-color: #ffd98a; } #pneuka .belt div.none { opacity: .35; }
#pneuka .belt s { text-decoration: none; opacity: .6; }
#pneuka .fits { display: flex; gap: 6px; align-items: center; margin: 2px 0 8px; }
#pneuka .fits .slot { width: 44px; height: 44px; }
#pneuka .fits .t { font-size: 11px; line-height: 1.3; margin-left: 4px; }
#pneuka .fits .t s { text-decoration: none; opacity: .65; font-size: 9px; letter-spacing: .1em; display: block; }
#pneuka .odds { display: flex; height: 8px; border-radius: 2px; overflow: hidden; margin: 2px 0 2px; border: 1px solid rgba(255,178,122,.25); }
#pneuka .odds i { display: block; height: 100%; }
#pneuka .oddsl { font-size: 9px; letter-spacing: .06em; opacity: .8; margin-bottom: 8px; line-height: 1.4; }
#pneuka .bank { width: 434px; box-sizing: border-box; } #pneuka .bank p { font-size: 12px; opacity: .75; line-height: 1.45; margin: 4px 0; }
#pneuka button { font: inherit; font-size: 11px; letter-spacing: .1em; color: #fff1dc; background: rgba(120,50,30,.6); border: 1px solid rgba(255,178,122,.45); padding: 4px 10px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#pneuka button:hover { background: rgba(var(--jsel),.55); } #pneuka button:disabled { opacity: .4; cursor: default; }
#pneuka footer { margin-top: 10px; font-size: 10px; letter-spacing: .08em; opacity: .55; }
#pneuka .menu { position: fixed; z-index: 10; background: #1a0c07; border: 1px solid rgba(255,178,122,.6); font-size: 12px; min-width: 150px; box-shadow: 0 6px 18px rgba(0,0,0,.6); box-sizing: border-box; max-height: calc(100vh - 16px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }
#pneuka .menu .h { position: sticky; top: 0; background: #1a0c07; }
#pneuka .menu div { padding: 4px 10px; cursor: var(--jcur-pointer, pointer); } #pneuka .menu div:hover { background: rgba(var(--jsel),.45); }
#pneuka .menu .h { color: #e7c46a; cursor: default; font-size: 10px; letter-spacing: .14em; border-bottom: 1px solid rgba(255,178,122,.25); } #pneuka .menu .h:hover { background: none; }
#pneuka .menu b { color: #ffd98a; font-weight: normal; }
`;
const SLOW = 0.1; // (the world at a tenth while the box is open: PNEUKA-BOX.md 5)
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

export class PneukaUI {
  constructor(game) {
    this.game = game;
    this.open = false;
    this.loadout = new Loadout(game, () => this.render());
    this.reading = new Reading(game); // (the window's hand on the laid spread, game.laidSpread: SPREADS.md)
    this.underside = new Underside(game, this.reading, () => this.render());
    const st = document.createElement('style'); st.textContent = CSS + UNDERSIDE_CSS; document.head.appendChild(st);
    this.root = el('div'); this.root.id = 'pneuka';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('click', (e) => { if (e.target === this.root && !(this.underside.slim && this.underside.atView(e.clientX, e.clientY, 0))) { if (!this.underside.slim) this.close(); } this.hideMenu(); });
    // the reading view (the Box turned over, its scene behind the window): a right-click reverses the card under it, a drop lays one
    this.root.addEventListener('contextmenu', (e) => { if (e.target === this.root && this.underside.slim) this.underside.atView(e.clientX, e.clientY, 2, null); });
    this.root.addEventListener('dragover', (e) => { if (this.underside.slim) e.preventDefault(); });
    this.root.addEventListener('drop', (e) => { const d = e.dataTransfer?.getData('text/plain') || ''; if (this.underside.slim && d.startsWith('card:')) { e.preventDefault(); this.underside.atView(e.clientX, e.clientY, 0, d.slice(5)); } });
    addEventListener('keydown', (e) => { // (Esc closes it, and only it: the pause menu does not open under it, as the Codex's: GARDEN-SWEEP #9)
      if (!this.open || e.repeat || /^(TEXTAREA|INPUT)$/.test(e.target?.tagName)) return;
      if (e.code === 'KeyF') { e.preventDefault(); e.stopImmediatePropagation(); this.flip(); return; } // (F turns the Box over: Petra's key, SPREADS.md 5.1)
      if (e.code === 'KeyH' && this.underside.slim) { e.preventDefault(); e.stopImmediatePropagation(); this.root.classList.toggle('bare'); return; } // (H hides the window over the reading view for a clean shot, the owner's glamour shots; the arrows still turn the camera)
      if (e.code !== 'Escape') return;
      e.preventDefault(); e.stopImmediatePropagation(); this.close();
    }, true);
    document.body.appendChild(this.root);
    addEventListener('resize', () => { if (this.open) this.fit(); });
  }
  get box() { return this.game.pneuka; }
  toggle() { this.open ? this.close() : this.show(); }
  /** The Box turned over (the spread's side) or back (the pocket's). */
  flip() { this.root.classList.remove('bare'); this.reading.flip(); this.underside.held = null; this.render(); }
  show() { this.open = true; this.root.classList.add('open'); document.exitPointerLock?.(); this.game.time?.slow('pneuka', SLOW); this.render(); this.game.events?.emit('pneuka.open', {}); }
  close() { this.root.classList.remove('bare'); if (this.reading.flipped) this.reading.flip(false); this.underside.held = null; this.open = false; this.root.classList.remove('open'); this.game.time?.free('pneuka'); this.hideMenu(); this.onClose?.(); }

  // ---------------------------------------------------------------- what a click on a thing would do
  actions(slot) {
    const box = this.box, s = box.slots[slot], it = s && itemOf(s.id);
    if (!it) return [];
    const out = [];
    if (it.kind === 'psygun') out.push({ label: 'Carry', run: () => box.carryPsygun(slot) }); // (a psygun's variant: the tools themselves are on the reading)
    if (box.storageOpen) out.push({ label: 'Store', run: () => box.store(slot) }); // (any thing stores: the storage at a Shrine, SPREADS.md 6)
    if (it.lure) out.push({ label: 'Tie on', run: () => box.tieOn(slot) });
    const F = Object.values(FITTINGS).find((f) => f.kind === it.kind);
    if (F) out.push({ label: F.put, run: () => box.fitOn(slot) });
    if (it.id === 'mat.shard' && this.game.lockheart) out.push({ label: 'Feed to the Lockheart', run: () => box.feed(slot) });
    if (it.kind === 'whistle') out.push({ label: 'Blow', run: () => { if (this.game.well?.escape()) this.close(); } }); // (the Wake Whistle: world/well/dunemaw.js)
    out.push({ label: 'Drop', run: () => box.drop(slot) });
    out.push({ label: 'Examine', run: () => box.examine(s.id) });
    return out;
  }
  storageActions(i) {
    const box = this.box, o = box.storage[i];
    return o ? [{ label: 'Take out', run: () => box.withdraw(i) }, { label: 'Examine', run: () => box.examine(o.id) }] : [];
  }
  say(html) { if (this.hoverEl) this.hoverEl.innerHTML = html; }
  menu(e, name, acts) {
    this.hideMenu();
    const m = (this.menuEl = el('div', 'menu'));
    m.appendChild(el('div', 'h', 'CHOOSE OPTION'));
    for (const a of acts) { const d = el('div', '', `${a.label} <b>${name}</b>`); d.onclick = (ev) => { ev.stopPropagation(); this.hideMenu(); a.run(); this.render(); }; m.appendChild(d); }
    const c = el('div', '', 'Cancel'); c.onclick = (ev) => { ev.stopPropagation(); this.hideMenu(); }; m.appendChild(c);
    m.onwheel = (ev) => ev.stopPropagation(); // (a long list scrolls itself: the hundred caster shells; the wheel is not the game's)
    this.root.appendChild(m);
    // (kept on the screen: placed at the click, then pulled back in by its measured size; taller than the screen, it scrolls)
    const k = m.getBoundingClientRect().height / Math.max(1, m.offsetHeight); // (the window's own scale, if it is drawn scaled)
    m.style.maxHeight = `${(innerHeight - 16) / (k || 1)}px`;
    const r = m.getBoundingClientRect();
    m.style.left = `${Math.max(8, Math.min(innerWidth - r.width - 8, e.clientX - 20))}px`;
    m.style.top = `${Math.max(8, Math.min(innerHeight - r.height - 8, e.clientY - 8))}px`;
  }
  hideMenu() { this.menuEl?.remove(); this.menuEl = null; }

  // ---------------------------------------------------------------- the window
  render() {
    if (!this.open) return;
    const g = this.game, box = this.box;
    this.root.innerHTML = '';
    const px = el('div', `px fit ${RT_CLASSES.window}`);
    const head = el('header');
    head.appendChild(el('h2', '', 'THE PNEUKA BOX'));
    const cls = this.reading.cls();
    head.appendChild(el('span', 'sub', `what the Courier carries · ${box.used} / ${SLOTS}${cls?.label ? ` · you read as ${cls.label}` : ''} · ${this.underside.slim ? 'H hides this · ' : ''}P to close`));
    const f = el('div', 'x', this.reading.flipped ? 'FLIP BACK · F' : 'FLIP · F'); f.onclick = () => this.flip(); head.appendChild(f);
    const x = el('div', 'x', 'CLOSE'); x.onclick = () => this.close(); head.appendChild(x);
    px.appendChild(head);
    this.hoverEl = el('div', 'hover', '&nbsp;');
    px.appendChild(this.hoverEl);
    this.root.classList.toggle('view', this.underside.slim); // (the reading view behind: the window falls away to a bar)
    if (this.reading.flipped) { // (the underside: the spread, laid on the cloth; the pocket is on the other side)
      this.underside.mount(px);
      if (!this.underside.slim) px.appendChild(el('footer', '', 'F turns the Box back · pick a card, then a place · a laid card: click to take it back, right-click to reverse it'));
      this.root.appendChild(px);
      this.fit();
      return;
    }
    const cols = el('div', 'cols'), reading = el('div', 'reading'), side = el('div', 'side');
    this.loadout.mount(reading);
    reading.appendChild(this.equipPane());
    side.appendChild(this.invPane());
    side.appendChild(this.storagePane());
    cols.appendChild(reading); cols.appendChild(side);
    px.appendChild(cols);
    px.appendChild(el('footer', '', 'F turns the Box over (the spread) · X draws and stows the main · R: the sub · a tool below: click for the sub, shift for the main, or drag it onto a place · in the pocket: left click the first action, right click all of them, drag to swap · F picks up what lies on the ground'));
    this.root.appendChild(px);
    this.loadout.draw(); // (the reading draws once it is in the page)
    this.fit();
  }
  /** The window drawn whole at its own size, scaled down to the screen when the screen is smaller (never up): the reading and the
   *  pocket side by side, as the reading table is drawn (a menu placed over it reads the scale back: menu()). */
  fit() {
    const px = this.root.querySelector('.px'); if (!px) return;
    px.style.transform = '';
    const k = Math.min(1, (innerWidth - 24) / Math.max(1, px.offsetWidth), (innerHeight - 24) / Math.max(1, px.offsetHeight));
    const centre = this.root.classList.contains('view') ? 'translateX(-50%) ' : ''; // (the bar over the reading view, centred at the bottom)
    px.style.transform = `${centre}${k < 1 ? `scale(${k.toFixed(3)})` : ''}`.trim();
  }

  icon(id) { const it = itemOf(id); return it ? `<img src="${itemIcon(this.game, id)}" alt="">` : ''; }

  invPane() {
    const box = this.box, pane = el('div', 'pane inv');
    const cells = this.reading.cells(), counted = new Map(this.reading.counted().map((c) => [c.i, c])), sums = this.reading.sums();
    const lit = SUITS.filter((s) => sums[s] > 0).map((s) => `${s[0].toUpperCase()}${s.slice(1)} ${Math.round(sums[s] * 10) / 10}`).join(' · ');
    pane.appendChild(el('h4', '', `<span>IN THE BOX</span><span>${lit ? `${lit} · ` : ''}${box.free} free</span>`));
    const grid = el('div', `grid ${RT_CLASSES.tray}`);
    box.slots.forEach((s, i) => {
      const it = s && itemOf(s.id), cell = cells[i], hit = counted.get(i);
      const d = el('div', `slot ${RT_CLASSES.slot}${it ? '' : ' empty'}${cell?.dark ? ' sp-dark' : SUITS.some((k) => cell?.[k] > 0) || cell?.wild ? ' sp-lit' : ''}${hit ? ` sp-counts sp-${hit.suit}` : ''}`, it ? `${this.icon(s.id)}${s.n > 1 ? `<span class="n">${s.n}</span>` : ''}` : '');
      if (it) {
        d.draggable = true;
        const acts = () => this.actions(i);
        d.onmouseenter = () => { const a = acts(); this.say(`${a[0].label} <b>${it.name}</b>${a.length > 1 ? ` / ${a.length - 1} more option${a.length > 2 ? 's' : ''}` : ''}`); };
        d.onclick = () => { acts()[0]?.run(); this.render(); };
        d.oncontextmenu = (e) => { e.preventDefault(); this.menu(e, it.name, acts()); };
        d.ondragstart = (e) => { e.dataTransfer.setData('text/plain', String(i)); d.classList.add('drag'); };
        d.ondragend = () => d.classList.remove('drag');
      }
      d.ondragover = (e) => { e.preventDefault(); d.classList.add('over'); };
      d.ondragleave = () => d.classList.remove('over');
      d.ondrop = (e) => { e.preventDefault(); const from = +e.dataTransfer.getData('text/plain'); if (Number.isFinite(from)) { box.swap(from, i); this.render(); } };
      d.onmouseleave = () => this.say('&nbsp;');
      grid.appendChild(d);
    });
    pane.appendChild(grid);
    return pane;
  }

  equipPane() {
    const g = this.game, box = this.box, pane = el('div', `pane equip ${RT_CLASSES.pane}`);
    pane.appendChild(el('h4', '', '<span>FITTED</span><span>to the main and the sub</span>'));
    // the lure on the Sondelass' line: one, or a bare hook (shown while the Sondelass is the main or the sub)
    const cur = box.lure ? itemOf(box.lure) : null;
    const lure = (box.lure && lureList(g.ledger, box).find((l) => l.id === box.lure)) || BARE;
    if (g.belt?.isWorn('sondelass')) {
      const row = el('div', 'lure');
      const s = el('div', `slot${cur ? '' : ' empty'}`, cur ? this.icon(box.lure) : '');
      s.onmouseenter = () => this.say(cur ? `Untie <b>${cur.name}</b> (into the box)` : 'Nothing is tied on. Click a lure (or a curio) in the box to tie it on.');
      s.onmouseleave = () => this.say('&nbsp;');
      s.onclick = () => { if (cur) { box.untie(); this.render(); } };
      s.oncontextmenu = (e) => { e.preventDefault(); if (cur) this.menu(e, cur.name, [{ label: 'Untie', run: () => box.untie() }, { label: 'Examine', run: () => box.examine(box.lure) }]); };
      row.appendChild(s);
      row.appendChild(el('div', 't', `<s>THE LURE · ON THE SONDELASS' LINE</s>${cur ? cur.name : lure.name}<s style="margin-top:3px">${!cur ? 'tie one on from the box' : cur.kind === 'curio' ? 'a curio: its life is its taste' : 'one of the made lures'}</s>`));
      pane.appendChild(row);
      const taste = tasteOf(lure), tg = el('div', 'taste');
      ASPECTS.forEach((a, k) => { tg.appendChild(el('span', '', a.name)); tg.appendChild(el('span', '', `<i style="width:${Math.round(Math.min(1, taste[k] / 1.6) * 100)}%;color:${hex(a.color)}"></i>`)); });
      pane.appendChild(tg);
    }
    // the fittings of the tools after (the bell's instrument, the Lockheart's coffin and keys), if they have those tools at all
    for (const [socket, F] of Object.entries(FITTINGS)) {
      if (F.hidden || (!F.place && !g.belt?.isWorn(F.tool))) continue; // (fitted to the main or the sub; the rest wait on their own tool)
      const cur = box.fitted(socket), row = el('div', 'fits');
      for (let i = 0; i < F.max; i++) {
        const id = cur[i], it = id && itemOf(id), d = el('div', `slot${it ? '' : ' empty'}`, it ? this.icon(id) : '');
        d.onmouseenter = () => this.say(it ? `Take <b>${it.name}</b> off (into the box)` : `${F.put}: click one in the box.`);
        d.onmouseleave = () => this.say('&nbsp;');
        d.onclick = () => { if (it) { box.fitOff(socket, i); this.render(); } };
        d.oncontextmenu = (e) => { e.preventDefault(); if (it) this.menu(e, it.name, [{ label: 'Take off', run: () => box.fitOff(socket, i) }, { label: 'Examine', run: () => box.examine(id) }]); };
        row.appendChild(d);
      }
      const names = cur.map((id) => itemOf(id)?.name).filter(Boolean);
      row.appendChild(el('div', 't', `<s>${F.label}</s>${names.length ? names.join(' · ') : F.none}`));
      pane.appendChild(row);
      if (socket === 'keys') {
        // the odds the Lockheart has now: its coffin with these keys, in order (tools/lockheart/table.js)
        const heart = box.fitted('heart')[0];
        if (heart) {
          const { table, mods } = oddsOf(heart, cur), R = rates(table), bar = el('div', 'odds');
          for (const r of R) { const i = el('i'); i.style.width = `${(r.p * 100).toFixed(2)}%`; i.style.background = hex(OUTCOMES[r.id].color); i.title = OUTCOMES[r.id].label; bar.appendChild(i); }
          pane.appendChild(bar);
          const extra = [mods.spins > 1 ? `${mods.spins} spins` : '', mods.reach > 1 ? `reach x${mods.reach}` : '', mods.echo ? `echo x${mods.echo}` : ''].filter(Boolean).join(' · ');
          pane.appendChild(el('div', 'oddsl', `${R.slice().reverse().map((r) => `<b style="color:${hex(OUTCOMES[r.id].color)}">${OUTCOMES[r.id].label}</b> ${r.p >= 0.1 ? Math.round(r.p * 100) : (r.p * 100).toFixed(1)}%`).join(' · ')}${extra ? ` · ${extra}` : ''} · it opens full at ${HEARTS[heart].fill}`));
        }
      }
    }
    // the psygun's chambers (tools/psygun/kinds.js): which caster shells it carries, and how many of each it holds; a click on a chamber turns
    // it to the next shell not chambered, a right click lists them all
    const S = g.shells;
    if (S && g.belt?.isWorn('psygun')) {
      const row = el('div', 'fits');
      S.chambers.forEach((id, i) => {
        const T0 = SHELL_TYPES.find((t) => t.id === id), d = el('div', 'slot', `${this.icon(`shell.${id}`)}<span class="n">${i + 1}</span>`);
        d.onmouseenter = () => this.say(`Chamber ${i + 1}: <b>${T0.no} ${T0.name}</b>, ${S.counts[id]} of ${S.max(id)} · click: the next shell · right click: choose`);
        d.onmouseleave = () => this.say('&nbsp;');
        const free = () => SHELL_TYPES.filter((t) => !S.chambers.includes(t.id));
        d.onclick = () => { const f = free(); if (f.length) { const k = SHELL_TYPES.indexOf(T0); const next = f.find((t) => SHELL_TYPES.indexOf(t) > k) || f[0]; S.chamber(i, next.id); this.render(); } };
        d.oncontextmenu = (e) => { e.preventDefault(); this.menu(e, '', SHELL_TYPES.map((t) => ({ label: `${t.no} ${t.name}${S.chambers.includes(t.id) ? ' (chambered)' : ''}`, run: () => S.chamber(i, t.id) }))); };
        row.appendChild(d);
      });
      row.appendChild(el('div', 't', `<s>${S.gun.name} · ${S.gun.chambers} CHAMBERS</s>${S.types.map((t) => t.no.replace('TYPE-', '')).join(' · ')}`));
      pane.appendChild(row);
    }
    return pane;
  }

  /** The storage (Petra's box.storage, SPREADS.md 6): kept for good at a Shrine's STORAGE row, beside the box; shut elsewhere. */
  storagePane() {
    const box = this.box, pane = el('div', `pane bank ${RT_CLASSES.book}`), list = box.storage || [];
    pane.appendChild(el('h4', '', `<span>THE STORAGE</span><span>${box.storageOpen ? `${list.length} / ${STORAGE}` : 'shut'}</span>`));
    if (!box.storageOpen) {
      pane.appendChild(el('p', '', `${STORAGE_SHUT} ${list.length ? `It keeps ${list.length} ${list.length === 1 ? 'stack' : 'stacks'} now.` : ''}`));
      return pane;
    }
    const btns = el('div'); btns.style.marginBottom = '8px';
    const all = el('button', '', 'STORE ALL'); all.disabled = !box.used; all.onclick = () => { box.storeAll(); this.render(); };
    btns.appendChild(all);
    pane.appendChild(btns);
    const grid = el('div', 'grid');
    list.forEach((o, i) => {
      const it = itemOf(o.id), d = el('div', 'slot', `${this.icon(o.id)}${o.n > 1 ? `<span class="n">${o.n}</span>` : ''}`);
      d.onmouseenter = () => this.say(`Take out <b>${it?.name || o.id}</b>${o.n > 1 ? ` · ${o.n}` : ''}`);
      d.onmouseleave = () => this.say('&nbsp;');
      d.onclick = () => { box.withdraw(i); this.render(); };
      d.oncontextmenu = (e) => { e.preventDefault(); this.menu(e, it?.name || o.id, this.storageActions(i)); };
      grid.appendChild(d);
    });
    if (!list.length) pane.appendChild(el('p', '', 'Nothing kept here yet. Click a thing in the box to store it.'));
    pane.appendChild(grid);
    return pane;
  }
}
