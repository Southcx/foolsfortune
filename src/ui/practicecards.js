// ---------------------------------------------------------------------------------------
// THE PRACTICE CARDS (RAIL-STANDARDS.md 5): the pier's PRACTICE row as choice cards (ui/choicecard.js), one a leg's type sailed before
// (legs.js practiceOf). Each card shows the leg before it says it: its picture is the leg's strip, its four phases (open, build, peak,
// release) at their widths in bars, each in the view it is flown in (CHASE, ABOVE, SIDE, FREE, ASTERN), and under it the strength as
// four pips to click (1 to 4, each a class stronger for every foe: legs.js schedule's `strength`). A pip sails at once; Enter or a click
// on the card sails at the strength last lit (1 at first). The words are placeholders for Espada's.
//
// Prior art: Star Fox 64's Training (one leg, nothing at stake), Rez's Direct Assault level select (a stage as its strip of areas),
// Hades' Pact of Punishment (a heat in pips, clicked up and down), the choice card's own rules (CLARITY.md: a label, one line, shown first).
//
//   practiceCards(types, { legs, onSail(type, strength), strength }) -> element (a cardList; empty types: null)
// ---------------------------------------------------------------------------------------
import { ChoiceCard, cardList } from './choicecard.js';

const VIEW_WORD = { chase: 'CHASE', above: 'ABOVE', side: 'SIDE', free: 'FREE', astern: 'ASTERN' };
const PHASES = ['open', 'build', 'peak', 'release'];
const NAMES = { shoal: 'The shoal', wreckers: 'The Wreckers', leviathan: 'Old Nobody', eyewall: 'The eyewall', graveyard: 'The graveyard', maelstrom: 'The maelstrom', bounty: 'A bounty', calm: 'A calm' };
const MAX = 4;

const CSS = `
.pcard-media{grid-column:1/-1;margin-top:calc(2*var(--d,1px))}
.pcard-strip{display:flex;gap:2px;height:calc(14*var(--d,1px));margin-top:calc(3*var(--d,1px))}
.pcard-strip i{display:flex;align-items:center;justify-content:center;font-style:normal;font-family:'Jersey 15',monospace;font-size:calc(10*var(--d,1px));
  letter-spacing:.08em;color:rgba(239,230,210,.85);background:rgba(239,230,210,.1);box-shadow:inset 0 0 0 1px rgba(239,230,210,.22);overflow:hidden;white-space:nowrap}
.pcard-strip i.peak{background:rgba(255,211,106,.2);box-shadow:inset 0 0 0 1px rgba(255,211,106,.55);color:#ffd36a}
.pcard-str{display:flex;align-items:center;gap:calc(4*var(--d,1px));margin-top:calc(4*var(--d,1px));font-family:'Jersey 15',monospace;font-size:calc(11*var(--d,1px));letter-spacing:.12em}
.pcard-str b{font-weight:400;opacity:.7;margin-right:calc(2*var(--d,1px))}
.pcard-str u{text-decoration:none;cursor:pointer;display:inline-flex;align-items:flex-end;justify-content:center;width:calc(14*var(--d,1px));height:calc(16*var(--d,1px));
  box-shadow:inset 0 0 0 1px rgba(239,230,210,.4);background:rgba(8,6,4,.55);color:rgba(239,230,210,.75);padding-bottom:1px}
.pcard-str u.on{background:linear-gradient(0deg,rgba(255,211,106,.85) var(--fill),rgba(8,6,4,.55) var(--fill));color:#17110a;box-shadow:inset 0 0 0 1px #ffd36a}
.pcard-str u:hover,.pcard-str u:focus-visible{box-shadow:inset 0 0 0 2px #ffd36a;outline:none}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-practicecards', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** The leg's strip: its phases at their widths in bars, each in its view's word (the peak in gold: where the boss stands). */
function strip(L) {
  const s = make('div', 'pcard-strip'), total = PHASES.reduce((a, p) => a + (L.phases?.[p] || 0), 0) || 1;
  for (const p of PHASES) {
    const bars = L.phases?.[p] || 0; if (!bars) continue;
    const i = make('i', p === 'peak' ? 'peak' : '', VIEW_WORD[L.views?.[p]] || '');
    i.style.flex = `${bars / total} 1 0`; i.title = `${p}: ${bars} bars, ${VIEW_WORD[L.views?.[p]] || 'the view'}`;
    s.append(i);
  }
  return s;
}

export function practiceCards(types, { legs = {}, onSail = null, strength = 1 } = {}) {
  if (!types?.length || typeof document === 'undefined') return null;
  style();
  const lit = {};
  const cards = types.map((type) => {
    const L = legs[type] || {};
    lit[type] = Math.max(1, Math.min(MAX, strength | 0));
    const row = {
      id: `practice.${type}`, name: NAMES[type] || type, icon: 'mount.psygun',
      does: 'Sail this leg alone, back to this pier. Nothing counted.',
      detail: `${L.bars || '?'} bars. Each strength makes every foe a class stronger.`,
      key: 'Enter', state: 'ready',
      media: () => {
        const box = make('div', 'pcard-media'); box.append(strip(L));
        const st = make('div', 'pcard-str'); st.append(make('b', '', 'STRENGTH'));
        const pips = [];
        for (let n = 1; n <= MAX; n++) {
          const u = make('u', '', String(n)); u.tabIndex = 0; u.title = `Strength ${n}: sail now`;
          u.style.setProperty('--fill', `${(n / MAX) * 100}%`);
          const go = (e) => { e.stopPropagation(); e.preventDefault(); lit[type] = n; onSail?.(type, n); };
          u.addEventListener('click', go);
          u.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') go(e); });
          u.addEventListener('pointerenter', () => pips.forEach((p, i) => p.classList.toggle('on', i < n)));
          u.addEventListener('pointerleave', () => pips.forEach((p, i) => p.classList.toggle('on', i < lit[type])));
          pips.push(u); st.append(u);
        }
        pips.forEach((p, i) => p.classList.toggle('on', i < lit[type]));
        box.append(st);
        return box;
      },
    };
    return new ChoiceCard(row, { onPick: () => onSail?.(type, lit[type]) });
  });
  return cardList(cards);
}
