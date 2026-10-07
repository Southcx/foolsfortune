// ---------------------------------------------------------------------------------------
// THE PNEUKA BOX'S WINDOW (P): what the Courier carries, and what they wear. Left, the box: fifty-six slots, eight across (four on a narrow screen). Right,
// the equipment: the one lure on the line, and the tools worn in their places on their body (two across the back, one at each hip, one at
// the neck: a click takes one off into the box; a tool in the box is worn with a click). While the Veritome is held open, the Book opens beside the box as the bank: the curios kept there, stacked,
// each taken out with a click, and STORE ALL to empty the box into it.
//
// How it is used, as OSRS's inventory is: a LEFT CLICK does the obvious thing (with the Book open, store it; otherwise tie a curio
// on the line), a RIGHT CLICK lists everything that can be done (Tie on, Store, Drop, Examine), a slot can be DRAGGED onto another
// to swap them, and the line at the top says what a click would do before it is clicked. Examine writes to the log, as OSRS's does
// to the chat (the log is the only text feedback: tracking.js).
//
// Prior art: Old School RuneScape's inventory and equipment tabs (the 4 x 7 grid, left click / right click menus, "Use X -> Y" in the
// hover line, worn items in their places), its bank (Deposit inventory), and the Codex's own look in this game.
// ---------------------------------------------------------------------------------------
import { SLOTS, FITTINGS } from './box.js';
import { oddsOf, rates, OUTCOMES, HEARTS } from '../tools/lockheart/table.js';
import { itemOf } from './items.js';
import { itemIcon } from './icons.js';
import { CARDS, CARD, WORTH } from '../tools/veritome/cards.js';
import { lureList, tasteOf, BARE } from '../tools/sondelass/angling/lures.js';
import { PLACES } from '../tools/belt.js';
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
#pneuka .x { cursor: var(--jcur-pointer, pointer); padding: 2px 8px; border: 1px solid rgba(255,178,122,.35); border-radius: 3px; font-size: 11px; letter-spacing: .1em; }
#pneuka .x:hover { background: rgba(var(--jsel),.35); }
#pneuka .hover { height: 18px; font-size: 12px; margin: 0 0 8px; color: #fff1dc; }
#pneuka .hover b { color: #ffd98a; font-weight: normal; }
#pneuka .cols { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
#pneuka .pane { background: rgba(14,6,4,.55); border: 1px solid rgba(255,178,122,.22); border-radius: 4px; padding: 10px; }
#pneuka .pane h4 { margin: 0 0 8px; font-size: 10px; letter-spacing: .22em; color: #e7c46a; font-weight: normal; display: flex; justify-content: space-between; gap: 12px; }
#pneuka .grid { display: grid; grid-template-columns: repeat(8, 52px); gap: 5px; }
@media (max-width: 560px) { #pneuka .grid { grid-template-columns: repeat(4, 52px); } }
#pneuka .bank .grid { grid-template-columns: repeat(5, 52px); }
#pneuka .slot { width: 52px; height: 52px; box-sizing: border-box; border: 1px solid rgba(255,178,122,.18); border-radius: 4px; background: rgba(40,18,10,.75); position: relative; cursor: var(--jcur-pointer, pointer); }
#pneuka .slot:hover { border-color: rgba(255,210,150,.75); background: rgba(80,36,20,.8); }
#pneuka .slot.drag { opacity: .4; } #pneuka .slot.over { border-color: #ffd98a; }
#pneuka .slot img { position: absolute; inset: 3px; width: calc(100% - 6px); height: calc(100% - 6px); pointer-events: none; }
#pneuka .slot .n { position: absolute; left: 3px; top: 1px; font-size: 11px; color: #ffef7a; text-shadow: 1px 1px 0 #000; pointer-events: none; }
#pneuka .slot .g { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; pointer-events: none; }
#pneuka .slot.empty { cursor: default; }
#pneuka .equip { width: 250px; }
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
#pneuka .bank { width: 310px; } #pneuka .bank p { font-size: 12px; opacity: .75; line-height: 1.45; margin: 4px 0; }
#pneuka button { font: inherit; font-size: 11px; letter-spacing: .1em; color: #fff1dc; background: rgba(120,50,30,.6); border: 1px solid rgba(255,178,122,.45); padding: 4px 10px; border-radius: 3px; cursor: var(--jcur-pointer, pointer); }
#pneuka button:hover { background: rgba(var(--jsel),.55); } #pneuka button:disabled { opacity: .4; cursor: default; }
#pneuka footer { margin-top: 10px; font-size: 10px; letter-spacing: .08em; opacity: .55; }
#pneuka .menu { position: fixed; z-index: 10; background: #1a0c07; border: 1px solid rgba(255,178,122,.6); font-size: 12px; min-width: 150px; box-shadow: 0 6px 18px rgba(0,0,0,.6); }
#pneuka .menu div { padding: 4px 10px; cursor: var(--jcur-pointer, pointer); } #pneuka .menu div:hover { background: rgba(var(--jsel),.45); }
#pneuka .menu .h { color: #e7c46a; cursor: default; font-size: 10px; letter-spacing: .14em; border-bottom: 1px solid rgba(255,178,122,.25); } #pneuka .menu .h:hover { background: none; }
#pneuka .menu b { color: #ffd98a; font-weight: normal; }
`;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

export class PneukaUI {
  constructor(game) {
    this.game = game;
    this.open = false;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.root = el('div'); this.root.id = 'pneuka';
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close(); this.hideMenu(); });
    addEventListener('keydown', (e) => { // (Esc closes it, and only it: the pause menu does not open under it, as the Codex's: GARDEN-SWEEP #9)
      if (!this.open || e.repeat || e.code !== 'Escape' || /^(TEXTAREA|INPUT)$/.test(e.target?.tagName)) return;
      e.preventDefault(); e.stopImmediatePropagation(); this.close();
    }, true);
    document.body.appendChild(this.root);
  }
  get box() { return this.game.pneuka; }
  toggle() { this.open ? this.close() : this.show(); }
  show() { this.open = true; this.root.classList.add('open'); document.exitPointerLock?.(); this.render(); this.game.events?.emit('pneuka.open', {}); }
  close() { this.open = false; this.root.classList.remove('open'); this.hideMenu(); this.onClose?.(); }

  // ---------------------------------------------------------------- what a click on a thing would do
  actions(slot) {
    const box = this.box, s = box.slots[slot], it = s && itemOf(s.id);
    if (!it) return [];
    const out = [];
    if (it.kind === 'tool') out.push({ label: 'Wear', run: () => box.wear(slot) });
    if (box.bankOpen && it.card) out.push({ label: 'Store', run: () => box.store(slot) });
    if (it.lure) out.push({ label: 'Tie on', run: () => box.tieOn(slot) });
    const F = Object.values(FITTINGS).find((f) => f.kind === it.kind);
    if (F) out.push({ label: F.put, run: () => box.fitOn(slot) });
    if (it.id === 'mat.shard' && this.game.lockheart) out.push({ label: 'Feed to the Lockheart', run: () => box.feed(slot) });
    if (it.kind === 'whistle') out.push({ label: 'Blow', run: () => { if (this.game.well?.escape()) this.close(); } }); // (the Wake Whistle: world/well/dunemaw.js)
    out.push({ label: 'Drop', run: () => box.drop(slot) });
    out.push({ label: 'Examine', run: () => box.examine(s.id) });
    return out;
  }
  bankActions(card) {
    const box = this.box, B = box.book, A = CARD[card];
    const out = [{ label: 'Take out', run: () => box.withdraw(card) }];
    if (B.spares(card) > 0) out.push({ label: `Condense a spare (${WORTH[A.rank]} cubes)`, run: () => B.condense(card) });
    out.push({ label: 'Examine', run: () => box.examine(card) });
    return out;
  }
  say(html) { if (this.hoverEl) this.hoverEl.innerHTML = html; }
  menu(e, name, acts) {
    this.hideMenu();
    const m = (this.menuEl = el('div', 'menu'));
    m.appendChild(el('div', 'h', 'CHOOSE OPTION'));
    for (const a of acts) { const d = el('div', '', `${a.label} <b>${name}</b>`); d.onclick = (ev) => { ev.stopPropagation(); this.hideMenu(); a.run(); this.render(); }; m.appendChild(d); }
    const c = el('div', '', 'Cancel'); c.onclick = (ev) => { ev.stopPropagation(); this.hideMenu(); }; m.appendChild(c);
    m.style.left = `${Math.min(innerWidth - 170, e.clientX - 20)}px`; m.style.top = `${Math.min(innerHeight - 30 - acts.length * 26, e.clientY - 8)}px`;
    this.root.appendChild(m);
  }
  hideMenu() { this.menuEl?.remove(); this.menuEl = null; }

  // ---------------------------------------------------------------- the window
  render() {
    if (!this.open) return;
    const g = this.game, box = this.box;
    this.root.innerHTML = '';
    const px = el('div', 'px');
    const head = el('header');
    head.appendChild(el('h2', '', 'THE PNEUKA BOX'));
    head.appendChild(el('span', 'sub', `what the Courier carries · ${box.used} / ${SLOTS} · P to close`));
    const x = el('div', 'x', 'CLOSE'); x.onclick = () => this.close(); head.appendChild(x);
    px.appendChild(head);
    this.hoverEl = el('div', 'hover', '&nbsp;');
    px.appendChild(this.hoverEl);
    const cols = el('div', 'cols');
    cols.appendChild(this.bankPane());
    cols.appendChild(this.invPane());
    cols.appendChild(this.equipPane());
    px.appendChild(cols);
    px.appendChild(el('footer', '', 'left click: the first action · right click: all of them · drag a thing onto another slot to swap · F picks up what lies on the ground'));
    this.root.appendChild(px);
  }

  icon(id) { const it = itemOf(id); return it ? `<img src="${itemIcon(this.game, id)}" alt="">` : ''; }

  invPane() {
    const box = this.box, pane = el('div', 'pane inv');
    pane.appendChild(el('h4', '', `<span>IN THE BOX</span><span>${box.free} free</span>`));
    const grid = el('div', 'grid');
    box.slots.forEach((s, i) => {
      const it = s && itemOf(s.id), d = el('div', `slot${it ? '' : ' empty'}`, it ? `${this.icon(s.id)}${s.n > 1 ? `<span class="n">${s.n}</span>` : ''}` : '');
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
    const g = this.game, box = this.box, pane = el('div', 'pane equip');
    pane.appendChild(el('h4', '', '<span>WORN</span><span>the line · the fittings · the tools</span>'));
    // the lure on the Sondelass' line: one, or a bare hook
    const cur = box.lure ? itemOf(box.lure) : null;
    const lure = (box.lure && lureList(g.ledger, box).find((l) => l.id === box.lure)) || BARE;
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
    // the fittings of the tools after (the bell's instrument, the Lockheart's coffin and keys), if they have those tools at all
    for (const [socket, F] of Object.entries(FITTINGS)) {
      if (F.hidden || (!F.place && !box.held(`tool.${F.tool}`) && !g.belt?.isWorn(F.tool))) continue;
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
    if (S && (g.belt?.isWorn('psygun') || box.held('tool.psygun'))) {
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
    // the tools: worn in the places on their body (tools/belt.js); the rest are in the box
    pane.appendChild(el('h4', '', '<span>THE TOOLS</span><span>worn · drawn with its key</span>'));
    const belt = el('div', 'belt'), B = g.belt, inHand = B?.inHand;
    const WHERE = { back: 'across the back', hip: 'at the hip', neck: 'at the neck' };
    for (const [place, n] of Object.entries(PLACES)) {
      const there = B ? B.inPlace(place) : [];
      for (let i = 0; i < n; i++) {
        const t = there[i];
        // (the Lockheart is named for the coffin it is: the plain one, the gambler's, the shepherd's)
        const name = t?.id === 'lockheart' ? (itemOf(box.fitted('heart')[0])?.name || t.name) : t?.name;
        const d = el('div', t ? (t === inHand ? 'on' : '') : 'none', t ? `<span>${name}</span><s>${WHERE[place]} · ${t.key.replace('Key', '')}</s>` : `<span>· · ·</span><s>a place ${WHERE[place]}</s>`);
        if (t) {
          d.style.cursor = 'var(--jcur-pointer, pointer)';
          d.onmouseenter = () => this.say(`Take off <b>${t.name}</b> (into the box)`);
          d.onmouseleave = () => this.say('&nbsp;');
          d.onclick = () => { box.takeOff(t.id); this.render(); };
        }
        belt.appendChild(d);
      }
    }
    pane.appendChild(belt);
    return pane;
  }

  bankPane() {
    const box = this.box, B = box.book, pane = el('div', 'pane bank');
    pane.appendChild(el('h4', '', `<span>THE VERITOME · THE BANK</span><span>${box.bankOpen ? 'open' : 'shut'}</span>`));
    if (!B) return pane;
    if (!box.bankOpen) {
      pane.appendChild(el('p', '', 'The Veritome is shut. Draw it (J), then open the box (P): the Book opens beside it, and things can be stored in it for good, or taken out.'));
      pane.appendChild(el('p', '', `In the Book now: ${CARDS.filter((c) => c.form === 'item' && B.has(c.id)).reduce((a, c) => a + B.count(c.id), 0)} curios, ${B.filled} pages filled of ${CARDS.length}.`));
      return pane;
    }
    const btns = el('div'); btns.style.marginBottom = '8px';
    const all = el('button', '', 'STORE ALL'); all.disabled = !box.used; all.onclick = () => { box.storeAll(); this.render(); };
    btns.appendChild(all);
    pane.appendChild(btns);
    const grid = el('div', 'grid'), held = CARDS.filter((c) => c.form === 'item' && B.has(c.id));
    for (const A of held) {
      const it = itemOf(A.id), d = el('div', 'slot', `${this.icon(A.id)}<span class="n">${B.count(A.id)}</span>`);
      d.title = '';
      d.onmouseenter = () => this.say(`Take out <b>${A.name}</b> · ${B.count(A.id)} of ${A.limit} · rank ${A.rank}`);
      d.onmouseleave = () => this.say('&nbsp;');
      d.onclick = () => { box.withdraw(A.id); this.render(); };
      d.oncontextmenu = (e) => { e.preventDefault(); this.menu(e, it?.name || A.name, this.bankActions(A.id)); };
      grid.appendChild(d);
    }
    if (!held.length) pane.appendChild(el('p', '', 'Nothing kept here yet. Click a thing in the box to store it.'));
    pane.appendChild(grid);
    pane.appendChild(el('p', '', `Cards without an item form (the Arcana, the creatures) are in the Codex (B), VERITOME.`));
    return pane;
  }
}
