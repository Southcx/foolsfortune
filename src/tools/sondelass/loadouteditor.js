// ---------------------------------------------------------------------------------------
// THE LOADOUT EDITOR: where the melee loadout is chosen (docs/plans/MELEE-LOADOUT.md section 2 and phase 3; the owner, 2026-10-11:
// "something like the game God Hand for ps2 where you can essentially build out your combo kit yourself"). God Hand's technique list
// beside its Combo Tree: on the left the tree, THE STRING's slots (LMB walks them, the last back to the first; the slots not yet open shown
// closed, with what opens each) and THE SPECIALS' three (RMB tapped, with W, with S); on the right the list, every move of the catalogue
// that fits the slot picked as a choice card (its label, one line, its stats: power, reach, speed and cost; its effect's keyword;
// compare arrows against what the slot holds now; a locked move shown locked, with what opens it in one line, never hidden). Click a
// slot, then a move: it is kept (loadoutchosen.js) and said in the log (`loadout.set`). Generic over the catalogue's rows: whatever
// SONDELASS_MOVES holds is listed; a row's own words and numbers win (loadoutwords.js stands in for the rows that carry none).
//
// Opened in two places, one editor: the sparring circle's lectern (world/testroom/strawmanstrings.js: its page's LOADOUT row opens this
// page in the Index's window, feedback/indexmenu.js showPage; Esc or F closes it, as the lectern's page) and the Codex's SONDELASS
// shelf (feedback/codex/codex.js; Esc, B or F closes it). In the DEBUG save with the lend panel's `moves` lent, every move and all 8
// slots are open, the lent ones wearing the hollow mark (ui/lendpanel.js).
//
// Prior art: God Hand (Clover, 2006): the Combo Tree and the technique list side by side, a slot chosen and then a technique for it;
// Gradius' power-up bar (the slot row), Monster Hunter's equipment compare (the arrows), Hades' boon cards (the choice card), and the
// lectern's own page (strawmanstrings.js) for the window it opens in.
//
//   showLoadoutPage(game) -> bool (the Index's window on the editor's page)   renderLoadoutShelf(codex, cx) (the Codex's shelf)
//   loadoutEditor(game).render(host, { redraw })   (any host: `redraw()` draws the host again after a change)
// ---------------------------------------------------------------------------------------
import { SONDELASS_MOVES } from './sondelassloadout.js';
import { MOVES as RULES } from '../../progress/combat/moves.js';
import { SLOTS, slotsOpen, slotOpening, moveStatus, moveOpening } from './loadoutopen.js';
import { labelOf, lineOf, effectKeyword, numbersOf, SPECIAL_SLOTS, ordinal } from './loadoutwords.js';
import { ChoiceCard, cardList, slotRow } from '../../ui/choicecard.js';
import { lentMark } from '../../ui/lendpanel.js';
import { subFor } from '../../feedback/indexmenu.js';

/** The page's words (placeholders for Espada's; CLARITY.md section 7: a window's title says what you can do there). */
const PAGE = { title: 'BUILD YOUR STRING', sub: 'pick a slot, then a move · Esc or F closes' };
const NONE = '-none';

const CSS = `
.lo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 4px 18px; align-items: start; font-size: 12px; }
@media (max-width: 760px) { .lo { grid-template-columns: 1fr; } }
.lo .lo-h { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 11px; letter-spacing: .26em; color: var(--accent, #ffb27a);
  margin: 10px 0 7px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,178,122,.2); }
.lo .lo-h small { letter-spacing: .06em; font-size: 10.5px; color: #f3e2cc; opacity: .8; text-align: right; }
.lo .lo-string .slotrow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.lo .lo-specials .slotrow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.lo .slotrow .sl { min-width: 0; }
.lo .lo-sum { margin: 9px 0 0; font-size: 11px; color: #f3e2cc; opacity: .85; letter-spacing: .04em; }
.lo .lo-sum b { color: #ffd98a; font-weight: 800; }
.lo .lo-hint { margin: 2px 0 8px; font-size: 12px; color: #f3e2cc; opacity: .85; }
.lo .lo-list { max-height: min(62vh, 560px); overflow: auto; padding: 0 4px 2px 0; }
.lo .lo-list .ccards + .lo-h { margin-top: 14px; }
`;
let styled = false;
const style = () => { if (styled || typeof document === 'undefined') return; styled = true; const st = document.createElement('style'); st.id = 'loadoutcss'; st.textContent = CSS; document.head.appendChild(st); };
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const head = (title, note) => { const h = make('div', 'lo-h', title); if (note) h.append(make('small', '', note)); return h; };

class LoadoutEditor {
  constructor(game) { this.game = game; this.pick = null; } // (the slot picked: { row: 'string', i } | { row: 'special', dir }; null: none yet)
  get kept() { return this.game.sondelassLoadout; }

  /** A row of the catalogue as a choice card's row. `equipped`: it is what the picked slot holds; `key`: the picked slot's key cap. */
  card(row, { equipped = false, key = null } = {}) {
    const st = moveStatus(this.game, row), n = numbersOf(row, RULES.sondelass?.[row.rule]), kw = effectKeyword(row);
    return {
      id: row.id, name: labelOf(row), does: lineOf(row), lore: row.lore || null, detail: row.detail || null,
      power: n.power, reach: n.reach, speed: n.speed, cost: n.cost, keywords: kw ? [kw] : [], icon: kw ? `kw.${kw}` : null,
      key: key || (row.kind === 'special' ? 'RMB' : 'LMB'), state: !st.known ? 'locked' : equipped ? 'equipped' : 'ready',
      opens: st.known ? null : moveOpening(row, SONDELASS_MOVES), lent: this.game.mode === 'debug' && st.known ? st.lent : undefined,
    };
  }
  /** What a slot shows: the move's label and its effect's icon, its lend mark in DEBUG. */
  cell(id) {
    const row = id && SONDELASS_MOVES[id]; if (!row) return null;
    const st = moveStatus(this.game, row), kw = effectKeyword(row);
    return { id, name: labelOf(row), does: lineOf(row), icon: kw ? `kw.${kw}` : null, lent: this.game.mode === 'debug' ? st.lent : undefined };
  }

  render(host, { redraw = () => {} } = {}) {
    style();
    const K = this.kept;
    if (!K) { host.append(make('p', 'lo-hint', 'The Sondelass is not on your belt.')); return; }
    const g = this.game, cur = K.get(), open = slotsOpen(g), p = this.pick;
    const wrap = make('div', 'lo'), tree = make('div', 'lo-tree'), list = make('div', 'lo-list');
    // ---- the tree: the string's slots (open, then closed) and the specials'
    const choose = (pick) => { const keys = !!document.activeElement?.closest?.('.lo .sl'); this.pick = pick; redraw(); if (keys) this.toList(); };
    tree.append(head('THE STRING', `LMB · ${open.n} of ${SLOTS.most} slots open${open.lent ? ' (lent)' : ''}`));
    const closed = [];
    for (let s = open.n + 1; s <= SLOTS.most; s++) closed.push({ opens: slotOpening(s) });
    const sr = make('div', 'lo-string');
    sr.append(slotRow({
      id: 'string', slots: open.n, filled: cur.string.map((id) => this.cell(id)), closed, pickEmpty: true,
      sel: p?.row === 'string' ? p.i : null,
      onPick: (i) => choose({ row: 'string', i: Math.min(i, cur.string.length) }), // (an empty slot fills in order: the string has no holes)
    }));
    if (open.lent) sr.querySelectorAll('.sl').forEach((el, i) => { if (i >= open.earned && i < open.n) el.querySelector('.cc-keys')?.insertAdjacentHTML('afterbegin', lentMark('lent')); }); // (a slot only lent wears the hollow mark by its number)
    tree.append(sr);
    tree.append(this.sum(cur.string));
    tree.append(head('THE SPECIALS', 'RMB · with W · with S'));
    const pr = make('div', 'lo-specials');
    pr.append(slotRow({
      id: 'special', slots: SPECIAL_SLOTS.length, filled: SPECIAL_SLOTS.map((s) => this.cell(cur.specials[s.dir])), keys: SPECIAL_SLOTS.map((s) => s.key),
      pickEmpty: true, sel: p?.row === 'special' ? SPECIAL_SLOTS.findIndex((s) => s.dir === p.dir) : null,
      onPick: (i) => choose({ row: 'special', dir: SPECIAL_SLOTS[i].dir }),
    }));
    tree.append(pr);
    tree.append(make('p', 'lo-hint', 'An empty W or S slot plays the tap\'s special.'));
    // ---- the list: what fits the slot picked (or every move, before one is)
    if (!p) {
      list.append(head('THE MOVES', 'pick a slot to change it'));
      for (const kind of ['normal', 'special']) list.append(cardList(this.rows(kind).map((r) => new ChoiceCard(this.card(r))), { cols: 1 }));
    } else {
      const special = p.row === 'special', kind = special ? 'special' : 'normal', slot = special ? p.dir : p.i + 1;
      const inSlot = special ? cur.specials[p.dir] : cur.string[p.i], base = inSlot && SONDELASS_MOVES[inSlot] ? this.card(SONDELASS_MOVES[inSlot], { equipped: true }) : null;
      const S = SPECIAL_SLOTS.find((s) => s.dir === p.dir);
      list.append(head(special ? 'SPECIALS' : 'NORMALS', special ? `for ${S.said}` : `for slot ${slot}, the ${ordinal(slot)} press`));
      const cards = this.rows(kind).map((r) => {
        const c = new ChoiceCard(this.card(r, { equipped: r.id === inSlot, key: special ? S.key : null }), { onPick: (row) => this.assign(slot, row.id, redraw) }); // (W + RMB's list shows W + RMB, not RMB)
        if (base && r.id !== inSlot && c.row.state !== 'locked') c.compareTo(base);
        return c;
      });
      const clearable = special ? p.dir !== 'tap' : p.i >= K.base.string.length; // (the first four slots and the tap always hold a move)
      if (clearable) cards.push(new ChoiceCard({ id: NONE, name: 'Empty', does: special ? 'Plays the tap\'s special here.' : 'Ends the string before this slot.', key: special ? S.key : 'LMB', state: inSlot ? 'ready' : 'equipped' }, { onPick: () => this.assign(slot, null, redraw) }));
      list.append(cardList(cards, { cols: 1 }));
    }
    wrap.append(tree, list);
    host.append(wrap);
  }

  /** The catalogue's rows of a kind, the ones known first (the catalogue's order kept within each). */
  rows(kind) {
    const all = Object.values(SONDELASS_MOVES).filter((r) => r && r.kind === kind);
    return [...all.filter((r) => moveStatus(this.game, r).known), ...all.filter((r) => !moveStatus(this.game, r).known)];
  }

  /** The string's numbers as a whole: its blows, their power and their time (moves.js: the rule the rows keep, about 2.6 a second). */
  sum(string) {
    let power = 0, time = 0;
    for (const id of string) { const r = SONDELASS_MOVES[id], n = numbersOf(r, RULES.sondelass?.[r?.rule]); power += n.power || 0; time += n.speed || 0; }
    const d = make('div', 'lo-sum');
    d.innerHTML = `A full string: <b>${string.length}</b> blows, <b>${+power.toFixed(1)}</b> power in <b>${+time.toFixed(2)}</b> s${time > 0 ? `, <b>${+(power / time).toFixed(1)}</b> a second` : ''}.`;
    return d;
  }

  /** A move put in the slot picked (null: emptied), kept and said (loadoutchosen.js set()); the picked slot follows a string that closed up. */
  assign(slot, id, redraw) {
    const K = this.kept;
    if (!K?.set(slot, id)) return;
    if (this.pick?.row === 'string') this.pick.i = Math.min(this.pick.i, K.get().string.length);
    redraw();
  }

  /** After a slot is picked (it had the focus: the keys, or a click), the list takes the keys: its equipped card (or its first open one)
   *  is given the focus, after the slot row has given its slot its own back (a frame later). */
  toList() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const box = document.querySelector('.lo .lo-list .ccards'); if (!box) return;
      const c = box.querySelector('.cc.equipped') || box.querySelector('.cc:not(.locked)');
      if (c) { box.classList.add('kbd'); c.focus(); }
    }));
  }
}

const EDITORS = new WeakMap();
/** The game's one editor (it keeps the slot picked between draws). */
export function loadoutEditor(game) { let E = EDITORS.get(game); if (!E) EDITORS.set(game, (E = new LoadoutEditor(game))); return E; }

/** The editor as a page of the Index's window (the sparring circle's lectern's LOADOUT row): Esc or F closes it. */
export function showLoadoutPage(game) {
  const menu = game.indexMenu;
  if (!menu?.showPage) return false;
  const E = loadoutEditor(game);
  menu.showPage('the melee loadout', (im) => { im.style.width = 'min(940px, calc(100% - 24px))'; E.render(im, { redraw: () => menu.render() }); }, PAGE);
  return true;
}

/** The editor as the Codex's SONDELASS shelf. */
export function renderLoadoutShelf(codex, cx) {
  cx.appendChild(make('div', 'shelf', subFor(`THE SONDELASS · ${PAGE.title} · Esc, F or B closes`, codex.game.input?.device))); // (on touch the keys go)
  loadoutEditor(codex.game).render(cx, { redraw: () => codex.render() });
}
