// ---------------------------------------------------------------------------------------
// THE TABLE TIP: the side box that opens when the pointer rests on any piece at Raku's tables, inert ones included (the brief's section 2f).
// Its parts, in order: the label (a table's own name or a piece's: no genre labels at Raku's tables, the owner, 2026-10-15), one line of effect (its keywords bold and its numbers in colour, ui/keywords.js),
// the stat chips (a label and a value, the value in the fixed meaning colour: score ivory, money gold, loss ash), and the keywords the piece
// is, each with its icon and what it means. A keyword in the line is bold on its own; a keyword listed in `keywords` is explained below
// the line, so a new player learns it where it is used. The words are the table view's (the owner's exception: 2026-10-15). The info is the
// coach's per piece id, and this module draws it: it decides no rule and reads no game state.
//
// It is the keywords' tip (ui/keywords.js) for a piece: the same lacquer, the same bold and the same icons, placed by the pointer, flipped
// off the screen's edge, and never taking the pointer (pointer-events none), so a hover can never stick.
//
// Prior art: Slay the Spire's side box (a card's keyword explained beside it, the reading order label, text, keywords), Hearthstone's
// keyword glossary panel, and the Xbox Accessibility Guidelines 101 and 103 (readable text, a number's meaning also in its word).
//
//   tableTip({ label, line, stats, keywords }) -> el     a visible box (div.tt-box) for one piece's info, placed by the caller
//                                                         stats: [{ label, value, kind: 'score'|'money'|'loss'|'count' }]
//                                                         keywords: ['stun', ...] (ids of ui/keywords.js) or [{ label, means }]
//   showTableTip(info, x, y)                             the one tip (made once, in the body); x, y in client pixels
//   hideTableTip()
//   DEMO_TIP                                             a sample (Nebula Bluff's words) with two keywords, for the stub
// ---------------------------------------------------------------------------------------
import { keyworded, installKeywords, KEYWORDS } from './keywords.js';
import { iconEl } from './icons/icons.js';

const CSS = `
.tt-tip { position: fixed; z-index: 75; display: none; box-sizing: border-box; width: max-content; pointer-events: none; }
.tt-tip.on { display: block; }
.tt-box { box-sizing: border-box; width: max-content; max-width: min(34vh, 92vw); pointer-events: none;
  padding: .7em .9em .8em; border-radius: 6px; color: #f6ead8; font: 500 max(12px, 1.3vh) / 1.35 var(--f-ui, sans-serif);
  background: linear-gradient(180deg, #3a2a46 0%, #17111f 100%); border: 1px solid rgba(246, 234, 216, .32);
  box-shadow: 0 0 0 1px #0a060e, 0 8px 18px rgba(0, 0, 0, .6); text-shadow: 1px 1px 0 rgba(8, 3, 1, .6); }
.tt-head { font: 800 max(16px, 2.6vh) / 1.1 var(--f-ui, sans-serif); letter-spacing: .05em; color: #f6ead8; margin-bottom: .35em; }
.tt-line { font: 500 max(12px, 1.5vh) / 1.35 var(--f-ui, sans-serif); color: #efe2d4; }
.tt-line .cnum { color: #ffd98a; font-weight: 800; }
.tt-stats { display: flex; flex-wrap: wrap; gap: .4em; margin-top: .55em; }
.tt-chip { display: inline-flex; align-items: baseline; gap: .35em; padding: .18em .45em; border-radius: 4px; background: rgba(246, 234, 216, .08);
  border: 1px solid rgba(246, 234, 216, .18); }
.tt-chip .tt-l { font: 600 max(11px, 1.2vh) / 1 var(--f-ui, sans-serif); color: #cdbfb4; }
.tt-chip .tt-v { font: 800 max(14px, 1.9vh) / 1 var(--f-ui, sans-serif); color: #f6ead8; }
.tt-chip .tt-v.money { color: #ffd98a; }
.tt-chip .tt-v.loss { color: #a8a29b; }
.tt-kws { margin-top: .6em; padding-top: .5em; border-top: 1px solid rgba(246, 234, 216, .18); display: grid; gap: .3em; }
.tt-kw { font: 500 max(11px, 1.25vh) / 1.3 var(--f-ui, sans-serif); color: #d9ccc0; }
.tt-kw .kw { font-weight: 800; color: #ffd98a; }
`;

let installed = false, tip = null;
/** Its CSS and its host element, once: the one shared tip, hidden until showTableTip places it. */
function install() {
  if (installed || typeof document === 'undefined') return;
  installed = true; installKeywords();
  const st = document.createElement('style'); st.id = 'ttcss'; st.textContent = CSS; document.head.appendChild(st);
  tip = document.createElement('div'); tip.className = 'tt-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
}

/** A keyword listed for a piece, its icon and bold word, and what it means. A ui/keywords.js id gets its icon; an inline one is a word alone. */
function keywordRow(k) {
  const row = document.createElement('div'); row.className = 'tt-kw';
  if (typeof k === 'string' && KEYWORDS[k]) {
    const word = document.createElement('b'); word.className = 'kw';
    word.append(iconEl(KEYWORDS[k].icon, { px: 1 }), KEYWORDS[k].label);
    row.append(word, ' ', KEYWORDS[k].means);
  } else {
    const word = document.createElement('b'); word.className = 'kw'; word.textContent = k.label;
    row.append(word, ' ', k.means || '');
  }
  return row;
}

/** A visible box for one piece's info: the label, the line, the stat chips, the keywords explained. The caller places it. */
export function tableTip({ label = '', line = '', stats = [], keywords = [] } = {}) {
  install();
  const el = document.createElement('div');
  el.className = 'tt-box';
  const head = document.createElement('div'); head.className = 'tt-head'; head.textContent = label;
  el.append(head);
  if (line) { const l = document.createElement('div'); l.className = 'tt-line'; l.append(keyworded(line)); el.append(l); }
  if (stats.length) {
    const row = document.createElement('div'); row.className = 'tt-stats';
    for (const s of stats) {
      const chip = document.createElement('span'); chip.className = 'tt-chip';
      const l = document.createElement('span'); l.className = 'tt-l'; l.textContent = s.label;
      const v = document.createElement('span'); v.className = `tt-v${s.kind === 'money' ? ' money' : s.kind === 'loss' ? ' loss' : ''}`;
      v.textContent = String(s.value);
      chip.append(l, v); row.append(chip);
    }
    el.append(row);
  }
  if (keywords.length) {
    const box = document.createElement('div'); box.className = 'tt-kws';
    for (const k of keywords) box.append(keywordRow(k));
    el.append(box);
  }
  return el;
}

/** The one tip, filled and shown beside (x, y): right and below the pointer, flipped to the left or up where the viewport ends. */
export function showTableTip(info, x, y) {
  install();
  if (!tip) return;
  tip.replaceChildren(tableTip(info));
  tip.classList.add('on');
  const w = tip.offsetWidth, h = tip.offsetHeight, pad = 14;
  const left = x + pad + w > innerWidth ? x - pad - w : x + pad;
  const top = y + pad + h > innerHeight ? y - pad - h : y + pad;
  tip.style.left = `${Math.max(4, Math.round(left))}px`;
  tip.style.top = `${Math.max(4, Math.round(top))}px`;
}

/** The tip goes away (a piece left, the seat left, a view drawn again). */
export function hideTableTip() { tip?.classList.remove('on'); }

/** A sample for the stub: Nebula Bluff's words, with two keywords explained (a game's own, in the coach's words; no Parry, no Seal). */
export const DEMO_TIP = {
  label: 'Nebula Bluff',
  line: 'Claim what your hand is worth. Others can Call your bluff, or back down.',
  stats: [{ label: 'YOUR HAND', value: 49 }, { label: 'DICE', value: 4, kind: 'count' }, { label: 'POT', value: 18, kind: 'money' }],
  keywords: [
    { label: 'Claim', means: 'Say what your dice are worth. A claim you cannot make good costs you dice.' },
    { label: 'Call', means: 'Say the claimant is lying. Their cups lift and the dice are counted.' },
  ],
};
