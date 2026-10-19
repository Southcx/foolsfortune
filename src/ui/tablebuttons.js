// ---------------------------------------------------------------------------------------
// THE ACTION BAR: the table's buttons for the moves that have no piece to click (Stand, Lock, Upgrade, Claim N, Call, Fold, Done), at the
// bottom middle of a seat at Raku's tables (docs/plans/CASINO-CLARITY.md section 2f). Each button is a lacquer plate, shaped as the coach
// shapes a move (progress/casino/coach/index.js): its key (1 to 9, the keyboard's own pick), its label ("STAND", "CALL"), its amount printed
// big as a chip ("−6", "+3"), its one line under the label, and its preview under that in the tone's colour with the tone's mark
// (✔ good, ⚠ risk, ✖ bad), so a player who has never sat down reads what each button does and what it would bring without a hover.
// `size` ('big' | 'small') scales the plate. The house's pick (`best`) glints gold, a hint and never a nag; the film is not used here.
// The words and numbers are the table view's exception to the no-text rule (the owner, 2026-10-15), and the outcome the button starts is
// still the event's, not this bar's.
//
// Colours: the lacquer and its ink (the schiller's ink, #17111f), the score ivory, the loss ash (the ceremony's fixed kinds), a cinnabar
// for a risk. No seat colours and no suit colours: a move is not a seat's, and a suit's colour is only on a card's face.
//
// Prior art: Slay the Spire's end-turn and energy row (one big plate, its cost in the corner), the poker client's action bar (Fold, Call,
// Raise, each with its amount on the button, the fold dimmed), Balatro's Play and Discard buttons (the number on the button), Yahtzee's
// score preview (a would-be value shown before it is taken), and the Xbox Accessibility Guidelines 101 and 103 (text a player can read,
// and colour never the only cue: the sign, the chip's shape, the key cap and the tone's mark carry it too).
//
//   actionBar(moves, onPick, { onHover })  -> el     moves: the coach's: [{ id, label, line?, amount?, preview?, tone?, best?, size? }]
//       el.set(moves)                                 rebuild the buttons (a new turn)
//       el.dispose()                                  remove the 1..9 keyboard listener (call when the seat is left)
//   formatAmount(amount) -> string                    a number as "+3" / "−6" (U+2212), a string as given
//   installTableButtons()                             its CSS, once (actionBar does it)
// ---------------------------------------------------------------------------------------
import { keyworded, installKeywords } from './keywords.js';

const MINUS = '−';
const MAX_MOVES = 9; // keys 1 to 9 pick; a tenth move has no key and is not shown (the coach keeps the list to the table's own verbs)
const TONE_MARK = { good: '✔', risk: '⚠', bad: '✖' };
const TONE_WORD = { good: 'helps you', risk: 'a gamble', bad: 'costs you' };

/** A number as a sign and its size ("+3", "−6"); a string is printed as it is, its hyphen made a minus. */
export function formatAmount(amount) {
  if (amount == null || amount === '') return '';
  if (typeof amount === 'number') return amount > 0 ? `+${amount}` : amount < 0 ? `${MINUS}${-amount}` : '0';
  return String(amount).replace(/^-/, MINUS);
}
/** The chip's meaning colour: a cost (negative) is ash, a gain or a plain number is ivory (the ceremony's fixed kinds). */
const chipKind = (amount) => (typeof amount === 'number' && amount < 0 ? 'loss' : 'score');

const CSS = `
.tb-bar { position: fixed; left: 50%; bottom: 3.2vh; transform: translateX(-50%); display: flex; gap: 1.1vh; align-items: stretch;
  pointer-events: none; font-family: var(--f-ui, sans-serif); max-width: 96vw; }
.tb-btn { position: relative; isolation: isolate; pointer-events: auto; cursor: pointer; display: grid; grid-template-columns: auto auto auto; column-gap: .6em; align-items: center; width: max-content; min-width: 18vh; max-width: 34vh; padding: .75em 1em .8em;
  border: 1px solid rgba(246, 234, 216, .26); border-radius: 6px; color: #f6ead8; text-align: left; box-sizing: border-box;
  background: linear-gradient(180deg, #3a2a46 0%, #1d1426 100%); box-shadow: 0 0 0 1px #0a060e, 0 4px 10px rgba(0, 0, 0, .5);
  font: inherit; outline: none; --tone: #f6ead8; }
.tb-btn.big { min-width: 22vh; }
.tb-btn.big .tb-label { font-size: max(17px, 3.2vh); }
.tb-btn.small { min-width: 13vh; padding: .5em .7em .55em; }
.tb-btn.small .tb-label { font-size: max(12px, 2.1vh); }
.tb-bar.many .tb-btn { min-width: 0; max-width: 18vh; padding: .5em .6em .55em; column-gap: .4em; }
.tb-bar.many .tb-label { font-size: max(12px, 2vh); }
.tb-bar.many .tb-line { max-width: 16vh; font-size: max(11px, 1.15vh); }
.tb-btn.small .tb-amt { font-size: max(15px, 2.4vh); }
.tb-btn:hover, .tb-btn:focus-visible { border-color: rgba(246, 234, 216, .6); }
.tb-btn:focus-visible { box-shadow: 0 0 0 2px #f6ead8, 0 4px 10px rgba(0, 0, 0, .5); }
.tb-btn:active { transform: translateY(1px); }
.tb-btn.good { --tone: #f6ead8; }
.tb-btn.risk { --tone: #ff9f5a; }
.tb-btn.bad { --tone: #a8a29b; }
.tb-key { grid-column: 1; grid-row: 1; align-self: center; justify-self: start; font: 800 max(12px, 1.6vh) / 1 var(--f-ui, sans-serif); color: #17111f; background: #d9c9b0;
  border-radius: 3px; padding: .18em .4em; box-shadow: 0 2px 0 #7a6a55; }
.tb-label { grid-column: 2; grid-row: 1; font: 800 max(15px, 2.8vh) / 1.05 var(--f-ui, sans-serif); letter-spacing: .04em; white-space: nowrap; }
.tb-line { grid-column: 1 / 4; max-width: 26vh; margin-top: .35em; font: 500 max(12px, 1.3vh) / 1.3 var(--f-ui, sans-serif); color: #d8c8d8; }
.tb-prev { grid-column: 1 / 4; margin-top: .4em; font: 700 max(12px, 1.5vh) / 1.2 var(--f-ui, sans-serif); color: var(--tone); }
.tb-mark { display: inline-block; min-width: 1.1em; margin-right: .3em; font-weight: 800; }
.tb-amt { grid-row: 1; grid-column: 3; justify-self: end; font: 800 max(20px, 3.15vh) / 1 var(--f-ui, sans-serif); padding: .14em .32em;
  border-radius: 4px; color: #17111f; background: #f6ead8; }
.tb-amt.loss { background: #8c8680; color: #17111f; }
.tb-btn.best { border-color: #ffd98a; box-shadow: 0 0 0 1px #ffd98a, 0 4px 10px rgba(0, 0, 0, .5); }
.tb-btn.best::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: 5px; pointer-events: none;
  background: linear-gradient(100deg, rgba(255, 217, 138, 0) 40%, rgba(255, 236, 178, .55) 50%, rgba(255, 217, 138, 0) 60%) no-repeat;
  background-size: 300% 100%; background-position: 120% 0; animation: tb-glint 3.6s ease-in-out infinite; }
@keyframes tb-glint { 0%, 45% { background-position: 120% 0; } 100% { background-position: -20% 0; } }
@media (prefers-reduced-motion: reduce) { .tb-btn.best::before { animation: none; display: none; } }
`;

let installed = false;
/** Its CSS, once (and the keyword rules, which a line's keywords need). */
export function installTableButtons() {
  if (installed || typeof document === 'undefined') return;
  installed = true; installKeywords();
  const st = document.createElement('style'); st.id = 'tbcss'; st.textContent = CSS; document.head.appendChild(st);
}

/** One move's plate: key, label, amount, line, and the preview with its tone's mark, in the tone's colour. */
function buildButton(move, index, onPick, onHover) {
  const tone = TONE_MARK[move.tone] ? move.tone : null;
  const hasPreview = move.preview != null && move.preview !== '';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = ['tb-btn', tone, move.best ? 'best' : null, move.size === 'small' ? 'small' : 'big'].filter(Boolean).join(' ');
  b.dataset.move = String(move.id);
  b.setAttribute('aria-keyshortcuts', String(index + 1));
  const key = document.createElement('span'); key.className = 'tb-key'; key.textContent = String(index + 1);
  const label = document.createElement('span'); label.className = 'tb-label'; label.textContent = move.label;
  b.append(key, label);
  if (move.amount != null && move.amount !== '') {
    const amt = document.createElement('span');
    amt.className = `tb-amt ${chipKind(move.amount)}`;
    amt.textContent = formatAmount(move.amount);
    b.append(amt);
  }
  if (move.line) {
    const line = document.createElement('span'); line.className = 'tb-line';
    line.append(keyworded(move.line));
    b.append(line);
  }
  if (tone || hasPreview) {
    const row = document.createElement('span'); row.className = 'tb-prev';
    if (tone) { const mark = document.createElement('span'); mark.className = 'tb-mark'; mark.textContent = TONE_MARK[tone]; row.append(mark); }
    if (hasPreview) row.append(String(move.preview));
    b.append(row);
  }
  const words = [move.label, move.line, hasPreview ? String(move.preview) : null, tone ? TONE_WORD[tone] : null,
    move.best ? "the house's pick" : null].filter(Boolean);
  b.setAttribute('aria-label', words.join('. '));
  b.addEventListener('click', () => onPick(move.id));
  const show = (on) => onHover?.(on ? move : null);
  b.addEventListener('pointerenter', () => show(true));
  b.addEventListener('pointerleave', () => show(false));
  b.addEventListener('focus', () => show(true));
  b.addEventListener('blur', () => show(false));
  return b;
}

/** The action bar: the moves as plates in a row, keyed 1 to 9. onPick(id) when one is chosen (by click, or its key). */
export function actionBar(moves = [], onPick = () => {}, { onHover = null } = {}) {
  installTableButtons();
  const bar = document.createElement('div');
  bar.className = 'tb-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Actions');

  let list = [];
  const build = (next) => {
    list = next.slice(0, MAX_MOVES);
    bar.classList.toggle('many', list.length > 5); // (six to nine on one row: Nebula's claims, Call and Fold; the plates narrow, nothing wraps)
    bar.replaceChildren(...list.map((m, i) => buildButton(m, i, (id) => onPick(id), onHover)));
  };
  const onKey = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; // the chat line takes the digits as text
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > list.length) return;
    e.preventDefault();
    onPick(list[n - 1].id);
  };
  window.addEventListener('keydown', onKey);
  bar.set = (next) => build(next || []);
  bar.dispose = () => { window.removeEventListener('keydown', onKey); onHover?.(null); };
  build(moves);
  return bar;
}

