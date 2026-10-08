// ---------------------------------------------------------------------------------------
// THE CHOICE CARD: one choosable thing shown so a player who has never seen the game can say in two seconds what it does, how to use
// it and what it costs (docs/plans/CLARITY.md sections 1 and 4). Every window may use it in place of the row of a glyph, a title and a
// grey sentence (feedback/indexmenu.js's rooms). Its parts, always in this order:
//   1. the icon (ui/icons/: pixel art, scaled by a whole number; palette-swapped to grey while locked)
//   2. the label, big (the genre word: `name`)
//   3. one line of effect (`does`: verb first; its keywords marked and its numbers in colour: ui/keywords.js)
//   4. the stat chips: a small icon, a number, a unit (range m, angle °, energy, charges ×n, cooldown s, duration s; real seconds only)
//   5. the key ([1], [LMB], or the Passive keyword)
//   6. the state (EQUIPPED with a tick, READY, LOCKED with a padlock and its one opening line), a word beside every colour
// The detail (the lore name and the whole text) shows only on hover, on keyboard focus, or while the card is held.
//
// Two more ways to show a choice: COMPARE (a card against what it would replace: an arrow on each chip that changes, solid for better
// and hollow for worse, green and red, the old number on hover: Monster Hunter's) and THE SLOT ROW (a loadout's slots in a bar, each
// with what fills it and the key that fires it: Gradius' power-up bar). All of it in the window colour (ui/theme.js), keyboard and
// mouse alike: Enter or Space picks, the arrows move between the cards of a list, a held press shows the detail.
//
// Data in: a row with Dovina's fields (`name`, `does`, `lore`, `detail`, `cost`, `charges`, `cooldown` in real seconds, `duration` in
// real seconds, `range` m, `angle` degrees, `always`) and the card's own (`icon` an icon id, `key` a string or a list of them or
// 'passive', `state` 'equipped' | 'ready' | 'locked', `opens` the locked card's line). A table in bars is turned to seconds before it
// comes here (ui/mountcards.js). The words on the card are the row's: the state's three words are placeholders for Espada's.
//
// Prior art: Hades' boon cards (an icon, a name, one line, the number in colour), Slay the Spire's keywords, Breath of the Wild's item
// and rune screens (an icon, one line, the button), Gradius' power-up bar, Monster Hunter's equipment compare, and the Xbox
// Accessibility Guidelines (101 text size and contrast, 103 never colour alone, 107 input: every action by keyboard too).
//
//   new ChoiceCard(row, { onPick, base }) -> .el   .set(row)   .compareTo(base | null)
//   choiceCard(row, opts) -> element                 cardList(cards, { cols }) -> element (the arrows move between them)
//   slotRow({ slots, filled: [row | null], always: row?, onPick(i) }) -> element      STATE_WORDS (placeholders)      installChoiceCards()
// ---------------------------------------------------------------------------------------
import { iconEl, hasIcon } from './icons/icons.js';
import { keyworded, keywordEl, installKeywords } from './keywords.js';

/** The state's words (placeholders for Espada's). */
export const STATE_WORDS = { equipped: 'EQUIPPED', ready: 'READY', locked: 'LOCKED', always: 'ALWAYS MOUNTED', empty: 'EMPTY' };
/** The chips, in the order they are shown: the row's field, its icon, its unit, and which way is better. */
const CHIPS = [
  { k: 'range', icon: 'chip.range', fmt: (v) => `${fix(v)}`, unit: 'm', word: 'Range', up: true },
  { k: 'angle', icon: 'chip.angle', fmt: (v) => `${fix(v)}°`, unit: '', word: 'Angle', up: true },
  { k: 'cost', icon: 'chip.energy', fmt: (v) => `${fix(v)}`, unit: '', word: 'Energy', up: false },
  { k: 'charges', icon: 'chip.charges', fmt: (v) => `×${fix(v)}`, unit: '', word: 'Charges', up: true },
  { k: 'cooldown', icon: 'chip.cooldown', fmt: (v) => `${fix(v)}`, unit: 's', word: 'Cooldown', up: false },
  { k: 'duration', icon: 'chip.duration', fmt: (v) => `${fix(v)}`, unit: 's', word: 'Duration', up: true },
];
const fix = (v) => String(+(+v).toFixed(1));

const CSS = `
.ccards { display: grid; grid-template-columns: repeat(var(--cc-cols, 2), minmax(0, 1fr)); gap: 6px; }
@media (max-width: 600px) { .ccards { grid-template-columns: 1fr; } }
.cc { position: relative; display: grid; grid-template-columns: auto 1fr auto; gap: 2px 9px; align-items: start; padding: 7px 8px 7px 7px; box-sizing: border-box;
  border: 1px solid rgba(255,230,200,.22); border-radius: 4px; background: linear-gradient(180deg, rgba(var(--jbot, 34,15,9), .55), rgba(var(--jbot, 34,15,9), .8));
  box-shadow: inset 0 1px 0 rgba(255,240,220,.06); color: #f6ead8; cursor: var(--jcur-pointer, pointer); outline: none; text-align: left; font: 500 12px/1.3 var(--f-ui, sans-serif); }
.cc:hover, .cc.sel, .cc:focus-visible { border-color: var(--jhi, #f1d2b0); background: linear-gradient(180deg, rgba(var(--jsel, 196,106,69), .32), rgba(var(--jbot, 34,15,9), .8)); }
.cc.equipped { border-color: #ffd98a; box-shadow: inset 0 0 0 1px rgba(255,217,138,.35), inset 0 1px 0 rgba(255,240,220,.1); }
.cc.locked { cursor: default; border-style: dashed; background: rgba(var(--jbot, 34,15,9), .5); }
.cc.locked .cc-name, .cc.locked .cc-does, .cc.locked .cc-chips { opacity: .55; }
.cc .cc-ic { grid-row: 1 / span 3; line-height: 0; padding: 1px; border-radius: 3px; background: rgba(0,0,0,.28); box-shadow: inset 0 0 0 1px rgba(255,230,200,.12); }
.cc .uicon { image-rendering: pixelated; display: inline-block; vertical-align: middle; }
.cc .cc-name { font: 700 15px/1.15 var(--f-title, serif); letter-spacing: .07em; color: #fff3df; text-transform: uppercase; }
.cc .cc-does { color: #f3e2cc; min-height: 1.3em; }
.cc .cc-chips { display: flex; flex-wrap: wrap; gap: 3px 5px; margin-top: 2px; }
.cc .chip { display: inline-flex; align-items: center; gap: 3px; padding: 1px 5px 1px 3px; border-radius: 9px; background: rgba(0,0,0,.32); box-shadow: inset 0 0 0 1px rgba(255,217,138,.22);
  font: 800 11px/1.25 var(--f-ui, sans-serif); color: #ffd98a; white-space: nowrap; }
.cc .chip small { font-weight: 600; font-size: 10px; color: #f3e2cc; opacity: .85; }
.cc .chip.better { box-shadow: inset 0 0 0 1px rgba(98,211,110,.6); } .cc .chip.worse { box-shadow: inset 0 0 0 1px rgba(224,88,78,.6); }
.cc .chip.gone { opacity: .55; text-decoration: line-through; }
.cc .cc-side { grid-row: 1 / span 3; grid-column: 3; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.cc kbd, .slotrow kbd { display: inline-block; min-width: 14px; padding: 0 4px; border-radius: 3px; text-align: center; font: 800 11px/16px var(--f-ui, sans-serif); color: #2a140d;
  background: linear-gradient(180deg, #fff3df, #e2c49c); box-shadow: 0 2px 0 #7a4a2e, inset 0 -1px 0 rgba(0,0,0,.2); text-shadow: none; }
.cc kbd.none { background: rgba(0,0,0,.25); box-shadow: none; border: 1px dashed rgba(255,230,200,.55); line-height: 14px; }
.cc .cc-keys { display: flex; gap: 3px; }
.cc .cc-state { display: inline-flex; align-items: center; gap: 3px; font: 800 9px/1 var(--f-ui, sans-serif); letter-spacing: .12em; color: #f3e2cc; opacity: .85; white-space: nowrap; }
.cc.equipped .cc-state { color: #ffd98a; opacity: 1; }
.cc .cc-opens { grid-column: 2 / span 2; margin-top: 3px; color: #f3e2cc; font-size: 11px; }
.cc .cc-detail { display: none; position: absolute; left: -1px; right: -1px; top: calc(100% - 2px); z-index: 5; padding: 6px 9px 7px; box-sizing: border-box;
  background: linear-gradient(180deg, rgba(var(--jtop, 104,50,32), .98), rgba(var(--jbot, 34,15,9), .98)); border: 1px solid var(--jhi, #f1d2b0); border-top: none; border-radius: 0 0 4px 4px;
  box-shadow: 0 8px 18px rgba(0,0,0,.5); font-size: 11.5px; color: #f6ead8; }
.cc .cc-detail em { font-family: var(--f-lore, serif); font-style: italic; font-size: 1.12em; color: #fff1dc; }
.cc:hover .cc-detail, .cc:focus-visible .cc-detail, .cc.held .cc-detail { display: block; }
.cc.up .cc-detail { top: auto; bottom: calc(100% - 2px); border-top: 1px solid var(--jhi, #f1d2b0); border-bottom: none; border-radius: 4px 4px 0 0; box-shadow: 0 -8px 18px rgba(0,0,0,.5); }
.slotrow { display: flex; gap: 3px; flex-wrap: wrap; align-items: stretch; }
.slotrow .sl { display: grid; justify-items: center; align-content: start; gap: 3px; min-width: 66px; padding: 5px 6px 6px; box-sizing: border-box; border-radius: 4px;
  border: 1px solid rgba(255,217,138,.45); background: linear-gradient(180deg, rgba(var(--jsel, 196,106,69), .25), rgba(var(--jbot, 34,15,9), .8)); color: #fff3df;
  font: 700 10px/1.1 var(--f-title, serif); letter-spacing: .08em; text-transform: uppercase; text-align: center; cursor: var(--jcur-pointer, pointer); outline: none; }
.slotrow .sl:hover, .slotrow .sl:focus-visible { border-color: var(--jhi, #f1d2b0); }
.slotrow .sl.always { border-color: rgba(255,230,200,.3); background: rgba(var(--jbot, 34,15,9), .6); cursor: default; }
.slotrow .sl.empty { border-style: dashed; border-color: rgba(255,230,200,.35); background: rgba(0,0,0,.18); color: #f3e2cc; }
.slotrow .sl .hole { width: 32px; height: 32px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(255,230,200,.25); background: rgba(0,0,0,.3); }
.slotrow .sl .uicon { image-rendering: pixelated; }
`;
let installed = false;
/** The card's rules, once (and the keywords' with them). */
export function installChoiceCards() {
  if (installed || typeof document === 'undefined') return; installed = true;
  installKeywords();
  const st = document.createElement('style'); st.id = 'cccss'; st.textContent = CSS; document.head.appendChild(st);
}

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
/** The key's caps: one or more keys, the Passive keyword, or an empty cap for a thing not yet in a slot. */
function keyCaps(key) {
  const box = make('span', 'cc-keys');
  if (key === 'passive') { box.append(keywordEl('passive')); return box; }
  const keys = key == null ? [null] : [].concat(key);
  for (const k of keys) { const c = make('kbd', k == null ? 'none' : '', k == null ? '\u00a0' : k); if (k == null) c.title = 'not in a slot'; box.append(c); }
  return box;
}

export class ChoiceCard {
  constructor(row, { onPick = null, base = null } = {}) {
    installChoiceCards();
    this.onPick = onPick; this.base = base;
    const el = (this.el = make('div', 'cc'));
    el.tabIndex = 0; el.setAttribute('role', 'button'); el._card = this;
    el.addEventListener('click', () => { if (this.swallow) { this.swallow = false; return; } this.pick(); });
    el.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') { this.pick(); e.preventDefault(); e.stopPropagation(); } });
    el.addEventListener('focus', () => { el.classList.add('sel'); this.place(); }); el.addEventListener('blur', () => el.classList.remove('sel'));
    el.addEventListener('pointerenter', () => this.place());
    // held: a press kept down shows the detail (and is not a pick)
    el.addEventListener('pointerdown', () => { clearTimeout(this.hold); this.hold = setTimeout(() => { el.classList.add('held'); this.swallow = true; this.place(); }, 420); });
    const up = () => { clearTimeout(this.hold); el.classList.remove('held'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', () => { up(); this.swallow = false; });
    this.set(row);
  }

  pick() { if (this.row?.state === 'locked') return; this.onPick?.(this.row, this); }

  /** The detail opens below the card, or above it where the window's scrolling edge would cut it (the last row of a list). */
  place() {
    requestAnimationFrame(() => {
      const el = this.el, d = el.querySelector('.cc-detail'); if (!d || !el.isConnected) return;
      el.classList.remove('up');
      let edge = innerHeight;
      for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') { edge = Math.min(edge, p.getBoundingClientRect().bottom); break; } }
      if (d.getBoundingClientRect().bottom > edge - 2) el.classList.add('up');
    });
  }

  /** Draw the card for a row (again, when it changes). */
  set(row) {
    this.row = row || {};
    const r = this.row, el = this.el, state = r.state || 'ready', locked = state === 'locked';
    el.className = `cc ${state}`; el.innerHTML = '';
    el.setAttribute('aria-disabled', locked ? 'true' : 'false');
    el.setAttribute('aria-pressed', state === 'equipped' ? 'true' : 'false');
    // 1. the icon
    const ic = make('div', 'cc-ic');
    ic.append(hasIcon(r.icon) ? iconEl(r.icon, { pal: locked ? 'grey' : 'gold', px: 2 }) : make('span', 'uicon'));
    // 2. the label; 3. the line
    const name = make('div', 'cc-name', r.name || r.id || '');
    const does = make('div', 'cc-does'); does.append(keyworded(r.does || ''));
    // 4. the chips
    const chips = make('div', 'cc-chips');
    for (const C of CHIPS) {
      const v = r[C.k], b = this.base?.[C.k];
      if (v == null && b == null) continue;
      const chip = make('span', 'chip');
      if (v == null) { chip.classList.add('gone'); chip.title = `${C.word}: none (was ${C.fmt(b)}${C.unit ? ` ${C.unit}` : ''})`; chip.append(iconEl(C.icon, { px: 1 }), C.fmt(b)); if (C.unit) chip.append(make('small', '', C.unit)); chips.append(chip); continue; }
      chip.title = `${C.word}: ${C.fmt(v)}${C.unit ? ` ${C.unit}` : ''}`;
      chip.append(iconEl(C.icon, { px: 1 }), C.fmt(v));
      if (C.unit) chip.append(make('small', '', C.unit));
      if (this.base && b == null) chip.title += ' (new: the other has none)';
      else if (this.base && b !== v) {
        const rise = v > b, better = rise === C.up;
        chip.classList.add(better ? 'better' : 'worse');
        chip.append(iconEl(`chip.${rise ? 'up' : 'down'}${better ? '' : 'Hollow'}`, { pal: better ? 'better' : 'worse', px: 1 }));
        chip.title += ` (was ${C.fmt(b)}${C.unit ? ` ${C.unit}` : ''}: ${better ? 'better' : 'worse'})`;
      }
      chips.append(chip);
    }
    // 5. the key; 6. the state
    const side = make('div', 'cc-side');
    side.append(keyCaps(r.key));
    const st = make('span', 'cc-state');
    if (state === 'equipped') st.append(iconEl('chip.check', { px: 1 }));
    if (locked) st.append(iconEl('chip.lock', { pal: 'grey', px: 1 }));
    st.append(r.always ? STATE_WORDS.always : STATE_WORDS[state] || state.toUpperCase());
    side.append(st);
    el.append(ic, name, side, does, chips);
    if (locked && r.opens) el.append(make('div', 'cc-opens', r.opens));
    // the detail: only on hover, focus or a held press
    if (r.lore || r.detail) {
      const d = make('div', 'cc-detail');
      if (r.lore) { d.append(make('em', '', r.lore)); if (r.detail) d.append(' · '); }
      if (r.detail) d.append(r.detail);
      el.append(d);
    }
    el.setAttribute('aria-label', [r.name, r.does, r.always ? STATE_WORDS.always : STATE_WORDS[state]].filter(Boolean).join('. '));
    return this;
  }

  /** Compare against what it would replace (a row), or stop comparing (null). */
  compareTo(base) { this.base = base; return this.set(this.row); }
}

/** One card as an element. */
export const choiceCard = (row, opts) => new ChoiceCard(row, opts).el;

/** A list of cards in the window's grid; the arrow keys move between them (up and down by the row). */
export function cardList(cards, { cols = 2 } = {}) {
  installChoiceCards();
  const box = make('div', 'ccards'); box.style.setProperty('--cc-cols', cols);
  for (const c of cards) box.append(c.el || c);
  box.addEventListener('keydown', (e) => {
    const all = [...box.querySelectorAll(':scope > .cc')], i = all.indexOf(document.activeElement); if (i < 0) return;
    const per = Math.max(1, all.filter((c) => c.offsetTop === all[0].offsetTop).length);
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: per, ArrowUp: -per }[e.code]; if (!step) return;
    all[Math.max(0, Math.min(all.length - 1, i + step))].focus(); e.preventDefault(); e.stopPropagation();
  });
  return box;
}

/** A loadout's slots as a bar (Gradius): the one always fitted first, then each slot with what fills it and the key that fires it. */
export function slotRow({ slots = 2, filled = [], always = null, onPick = null } = {}) {
  installChoiceCards();
  const box = make('div', 'slotrow');
  const sock = (row, key, i) => {
    const s = make('div', `sl${row ? '' : ' empty'}${i < 0 ? ' always' : ''}`);
    s.append(row && hasIcon(row.icon) ? iconEl(row.icon, { px: 2 }) : make('span', 'hole'), make('span', '', row ? row.name : STATE_WORDS.empty), keyCaps(key));
    s.title = row ? [row.name, row.does].join(': ') : STATE_WORDS.empty;
    if (i >= 0) {
      s.tabIndex = 0; s.setAttribute('role', 'button');
      const go = () => onPick?.(i, row); s.addEventListener('click', go);
      s.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') { go(); e.preventDefault(); e.stopPropagation(); } });
    }
    box.append(s);
  };
  if (always) sock(always, [].concat(always.key || 'LMB')[0], -1);
  for (let i = 0; i < slots; i++) sock(filled[i] || null, String(i + 1), i);
  return box;
}
