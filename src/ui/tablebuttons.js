// ---------------------------------------------------------------------------------------
// THE ACTION BAR: the table's buttons for the moves that have no piece to click (Stand, Lock, Upgrade, Claim N, Call, Fold, Done), at the
// bottom middle of a seat at Raku's tables (docs/handoffs/dovina/casino-clarity-art-brief.md section 2f). Each button is a lacquer plate:
// its key (1 to 9, the keyboard's own pick), its label (L: "STAND", "CALL BLUFF"), its amount printed big as a chip ("−6", "+3"), and its
// one line under the label (S), so a player who has never sat down reads what each button does without a hover. The suggested move wears
// a walking film edge and a slow breath, never a flash: a hint, not a nag. On hover or keyboard focus a button shows its preview as a
// grey ghost above it (Yahtzee's grey score: "you'd have 41"); the bar also calls onHover(move | null) so the cloth can draw the same
// ghost on the table. The words and numbers are the table view's exception to the no-text rule (the owner, 2026-10-15), and the outcome
// the button starts is still the event's, not this bar's.
//
// Colours are the film's and the felt's: the film from src/vfx/oxidation.js (filmColour, the walk of FILM), the lacquer ink (SCHILLER.ink),
// and the fixed meaning colours of the score ceremony (score ivory, loss ash, a cinnabar mult chip). No seat colours: a move is not a seat's.
//
// Prior art: Slay the Spire's end-turn and energy row (one big plate, its cost in the corner), the poker client's action bar (Fold, Call,
// Raise, each with its amount on the button, the fold dimmed), Balatro's Play and Discard buttons (the number on the button), Yahtzee's
// grey score preview (a would-be value shown ghosted before it is taken), and the Xbox Accessibility Guidelines 101 and 103 (text a player
// can read, and colour never the only cue: the sign, the chip's shape and the key cap carry it too).
//
//   actionBar(moves, onPick, { onHover })  -> el     moves: [{ id, label, line?, amount?, preview?, keyword?, suggested? }]
//       el.set(moves)                                 rebuild the buttons (a new turn)
//       el.dispose()                                  remove the 1..9 keyboard listener (call when the seat is left)
//   formatAmount(amount) -> string                    a number as "+3" / "−6" (U+2212), a string as given
//   installTableButtons()                             its CSS, once (actionBar does it)
//   DEMO_MOVES                                        a four-move sample for the stub (one suggested, one with a preview)
// ---------------------------------------------------------------------------------------
import { filmColour, SCHILLER } from '../vfx/oxidation.js';
import { keyworded, installKeywords } from './keywords.js';

const MINUS = '−';
const MAX_MOVES = 9; // keys 1 to 9 pick; a tenth move has no key and is not shown (the coach keeps the list to the table's own verbs)

/** A number as a sign and its size ("+3", "−6"); a string is printed as it is, its hyphen made a minus. */
export function formatAmount(amount) {
  if (amount == null || amount === '') return '';
  if (typeof amount === 'number') return amount > 0 ? `+${amount}` : amount < 0 ? `${MINUS}${-amount}` : '0';
  return String(amount).replace(/^-/, MINUS);
}
/** The chip's meaning colour: a cost (negative) is ash, a gain or a plain number is ivory (the ceremony's fixed kinds). */
const chipKind = (amount) => (typeof amount === 'number' && amount < 0 ? 'loss' : 'score');

// the film, as CSS: four stops of FILM walked round the ring (sRGB, read from filmColour so the one iridescence is the same)
const filmStops = [0, 0.25, 0.5, 0.75, 1].map((t) => `#${filmColour(t).getHexString()}`).join(', ');
const violet = `#${filmColour(0).getHexString()}`;
const CSS = `
@property --tb-ph { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.tb-bar { position: fixed; left: 50%; bottom: 3.2vh; transform: translateX(-50%); display: flex; gap: 1.1vh; align-items: stretch;
  pointer-events: none; font-family: var(--f-ui, sans-serif); max-width: 96vw; }
.tb-btn { position: relative; isolation: isolate; pointer-events: auto; cursor: pointer; display: grid; grid-template-columns: auto auto auto; column-gap: .6em; align-items: center; width: max-content; min-width: 16vh; max-width: 34vh; padding: .75em 1em .8em;
  border: 1px solid rgba(246, 234, 216, .26); border-radius: 6px; color: #f6ead8; text-align: left; box-sizing: border-box;
  background: linear-gradient(180deg, #3a2a46 0%, #1d1426 100%); box-shadow: 0 0 0 1px #0a060e, 0 4px 10px rgba(0, 0, 0, .5);
  font: inherit; outline: none; }
.tb-btn:hover, .tb-btn:focus-visible { border-color: rgba(246, 234, 216, .6); }
.tb-btn:focus-visible { box-shadow: 0 0 0 2px #f6ead8, 0 4px 10px rgba(0, 0, 0, .5); }
.tb-btn:active { transform: translateY(1px); }
.tb-key { grid-column: 1; grid-row: 1; align-self: center; font: 800 max(12px, 1.6vh) / 1 var(--f-ui, sans-serif); color: #17111f; background: #d9c9b0;
  border-radius: 3px; padding: .18em .4em; box-shadow: 0 2px 0 #7a6a55; }
.tb-label { grid-column: 2; grid-row: 1; font: 800 max(15px, 2.8vh) / 1.05 var(--f-ui, sans-serif); letter-spacing: .04em; white-space: nowrap; }
.tb-line { grid-column: 1 / 4; max-width: 26vh; margin-top: .35em; font: 500 max(12px, 1.3vh) / 1.3 var(--f-ui, sans-serif); color: #d8c8d8; }
.tb-amt { grid-row: 1; grid-column: 3; justify-self: end; font: 800 max(20px, 3.15vh) / 1 var(--f-ui, sans-serif); padding: .14em .32em;
  border-radius: 4px; color: #17111f; background: #f6ead8; }
.tb-amt.loss { background: #8c8680; color: #17111f; }
.tb-ghost { position: absolute; left: 50%; bottom: calc(100% + 1vh); transform: translateX(-50%); white-space: nowrap; pointer-events: none;
  font: 700 max(14px, 2vh) / 1 var(--f-ui, sans-serif); color: rgba(246, 234, 216, .55); border: 1px dashed rgba(246, 234, 216, .4);
  border-radius: 4px; padding: .3em .6em; background: rgba(23, 17, 31, .7); opacity: 0; transition: opacity .12s; }
.tb-btn:hover .tb-ghost, .tb-btn:focus-visible .tb-ghost { opacity: 1; }
.tb-btn.sugg::before { content: ''; position: absolute; inset: -3px; border-radius: 9px; padding: 3px; z-index: -1; pointer-events: none;
  background: conic-gradient(from var(--tb-ph), ${filmStops});
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  animation: tb-walk ${Math.round(1 / SCHILLER.rate)}s linear infinite; }
.tb-btn.sugg { animation: tb-breath 3.2s ease-in-out infinite; }
@keyframes tb-walk { to { --tb-ph: 360deg; } }
@keyframes tb-breath { 0%, 100% { box-shadow: 0 0 0 1px #0a060e, 0 4px 10px rgba(0, 0, 0, .5); }
  50% { box-shadow: 0 0 0 1px #0a060e, 0 0 16px 2px ${violet}66, 0 4px 10px rgba(0, 0, 0, .5); } }
@media (prefers-reduced-motion: reduce) { .tb-btn.sugg, .tb-btn.sugg::before { animation: none; } }
`;

let installed = false;
/** Its CSS, once (and the keyword rules, which a line's keywords need). */
export function installTableButtons() {
  if (installed || typeof document === 'undefined') return;
  installed = true; installKeywords();
  const st = document.createElement('style'); st.id = 'tbcss'; st.textContent = CSS; document.head.appendChild(st);
}

/** One move's plate: key, label, amount, line, and the ghost preview (CSS shows it on hover or focus). */
function buildButton(move, index, onPick, onHover) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `tb-btn${move.suggested ? ' sugg' : ''}`;
  b.dataset.move = move.id;
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
  if (move.preview != null && move.preview !== '') {
    const ghost = document.createElement('span'); ghost.className = 'tb-ghost'; ghost.textContent = String(move.preview);
    b.append(ghost);
  }
  b.setAttribute('aria-label', move.line ? `${move.label}. ${move.line}` : move.label);
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
    bar.replaceChildren(...list.map((m, i) => buildButton(m, i, (id) => onPick(id), onHover)));
  };
  const onKey = (e) => {
    if (!bar.isConnected) { window.removeEventListener('keydown', onKey); return; } // (the seat was left without a dispose)
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

/** A four-move sample for the stub: one suggested (the film edge), one with a preview ghost (Yahtzee's grey), one a cost. */
export const DEMO_MOVES = [
  { id: 'stand', label: 'STAND', line: 'Keep what you have. Your turn ends here.', amount: null },
  { id: 'claim', label: 'CLAIM 46', line: 'Say your dice are worth 46 or more.', amount: -5, preview: 'you would have 41', suggested: true },
  { id: 'call', label: 'CALL LIAR', line: 'They claimed too much. Lift their cups.', amount: -5 },
  { id: 'fold', label: 'FOLD', line: 'Give up one die. Sit out this round.', amount: -1, preview: 'FOLD: 3 DICE LEFT' },
];
