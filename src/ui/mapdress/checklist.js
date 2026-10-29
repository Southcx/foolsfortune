// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS: AN AREA'S CHECKLIST (Dovina's AREAS.md 6 and MAP.md 4; board v1, panel C). Beside an area's sketch, in the Clay dress:
//   THE HERO     FOUND HERE and the area's one number, its rows summed, N of M; gold when whole.
//   A ROW        one a kind the area holds, in Dovina's order (`AREA_PAGE[area].rows`, labels `CHECKLIST_ROWS[kind].label`, progress/areas.js):
//                LABEL ······ N of M, and a slot a thing under it, blank until found (a 0 of M row is all blanks, never hidden; a kind
//                the area holds none of has no row: the caller leaves it out). Past SLOTS_MAX things the slots become one groove.
//                Gold when whole.
//   ROOMS        the rooms row opens its room list on a press: a charted room by name with the Sight's TRACK (ui/calibratebutton.js,
//                kept as it is, raised to 44 px here); one not yet charted as "???".
//   THE LINE     the one line to come back for, under the rows (`AREA_PAGE[area].line`).
//   BEFORE       rows null (not yet entered): the hero says "???" and nothing else.
// DOM only; every press 44 px or more, type 14 px or more. Rebuilt whole on each call (the caller calls it when a count changes); the
// room list's open state is kept on the element across rebuilds.
//
// Prior art: Spyro's and Banjo-Kazooie's N of M with the total shown, Xenoblade's Collectopedia (blank slots), Ys VIII's map
// completion, Hollow Knight (a place named once charted), Breath of the Wild's Sheikah Sensor (TRACK).
//
//   checklist(el, rows, { line, game, words }) -> el     rows: [{ kind, label, n, m, rooms?: [{ id, name, charted, place }] }] | null
//   CHECKLIST_LOOK
// ---------------------------------------------------------------------------------------
import { calibrateButton } from '../calibratebutton.js';
import { GOLD, COUNT_FACE } from '../brineframe.js';
import { FONT } from '../theme.js';

export const CHECKLIST_LOOK = { slotsMax: 12, target: 44, type: 14,
  words: { found: 'FOUND HERE', of: 'of', unknown: '???', rooms: 'rooms' } }; // (Espada's words, 2026-10-27)

const C = CHECKLIST_LOOK;
const CSS = `
.mdc{display:flex;flex-direction:column;gap:2px;color:#efe6d2;font-family:${FONT.sys};font-size:${C.type}px}
.mdc-hero{display:flex;align-items:baseline;gap:8px;padding:4px 2px 8px;border-bottom:2px solid rgba(30,12,6,.45);box-shadow:0 2px 0 rgba(255,226,196,.08)}
.mdc-hero span{flex:1;font-family:${FONT.title};font-weight:700;font-size:15px;letter-spacing:.14em}
.mdc-hero b{font-family:${COUNT_FACE};font-weight:400;font-size:40px;line-height:.9}
.mdc-hero i{font-style:normal;font-family:${COUNT_FACE};font-size:20px;opacity:.85}
.mdc-hero.whole b,.mdc-hero.whole i{color:${GOLD}}
.mdc-row{display:block;width:100%;min-height:${C.target}px;padding:6px 2px 7px;border:0;background:none;color:inherit;font:inherit;text-align:left;box-sizing:border-box}
.mdc-row+.mdc-row,.mdc-rooms+.mdc-row{border-top:2px solid rgba(30,12,6,.35)}
button.mdc-row{cursor:pointer;border-radius:6px}
button.mdc-row:hover{background:rgba(255,226,196,.06)}
.mdc-head{display:flex;align-items:baseline;gap:6px}
.mdc-label{font-family:${FONT.title};font-weight:700;font-size:${C.type}px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mdc-lead{flex:1 1 auto;min-width:10px;height:4px;align-self:center;background:radial-gradient(circle,rgba(239,230,210,.4) 0 1px,transparent 1.4px) 0 50%/5px 4px repeat-x}
.mdc-count{font-family:${COUNT_FACE};font-size:18px;white-space:nowrap;font-variant-numeric:tabular-nums}
.mdc-caret{font-family:${COUNT_FACE};font-size:16px;width:14px;transition:transform .15s}
.mdc-row.open .mdc-caret{transform:rotate(90deg)}
.mdc-slots{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}
.mdc-slot{width:12px;height:12px;border-radius:2px;background:#2a140c;box-shadow:inset 0 1px 0 rgba(0,0,0,.6),0 1px 0 rgba(255,226,196,.12)}
.mdc-slot.got{background:linear-gradient(180deg,rgba(255,255,255,.4),transparent 55%),rgb(var(--jtop,104,50,32));filter:brightness(2) saturate(1.2);box-shadow:0 1px 0 #1c0d08}
.mdc-groove{position:relative;height:10px;margin-top:6px;border-radius:5px;background:#2a140c;box-shadow:inset 0 2px 0 rgba(0,0,0,.6)}
.mdc-groove i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 55%),rgb(var(--jtop,104,50,32));filter:brightness(2) saturate(1.2)}
.mdc-row.whole .mdc-count,.mdc-row.whole .mdc-label{color:${GOLD}}
.mdc-row.whole .mdc-slot.got,.mdc-row.whole .mdc-groove i{background:linear-gradient(180deg,#fff2c4,${GOLD} 60%,#b98a2e);filter:none}
.mdc-rooms{display:none;padding:0 0 6px 18px}
.mdc-rooms.open{display:block}
.mdc-room{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:${C.target}px;font-family:${FONT.title};font-weight:700;font-size:${C.type}px;letter-spacing:.06em;text-transform:uppercase}
.mdc-room.unknown{font-family:${COUNT_FACE};font-weight:400;font-size:18px;opacity:.6}
.mdc .sightcal{min-height:${C.target}px;min-width:${C.target}px;padding:0 12px 0 8px;font-size:${C.type}px;border-radius:22px}
.mdc .sightcal svg{width:20px;height:20px}
.mdc-line{display:flex;gap:8px;align-items:flex-start;margin-top:8px;padding-top:8px;border-top:2px solid rgba(30,12,6,.45);font-family:${FONT.lore};font-style:italic;font-size:15px;line-height:1.3;opacity:.9}
.mdc-line svg{flex:none;width:18px;height:18px;margin-top:1px}
.mdc-none{font-family:${COUNT_FACE};font-size:28px;opacity:.7;padding:10px 2px}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-mapchecklist', ''); s.textContent = CSS; document.head.appendChild(s);
}
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const CLOCK = '<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.5" fill="none" stroke="#efe6d2" stroke-width="1.5"/><path d="M9 4.5V9l3 2" fill="none" stroke="#ffd36a" stroke-width="1.6" stroke-linecap="round"/></svg>';

/** One row: its head (label, leader, N of M) and its slots or groove. */
function rowOf(r, W, tag) {
  const n = Math.max(0, r.n || 0), m = Math.max(0, r.m || 0), row = make(tag, 'mdc-row'), head = make('div', 'mdc-head');
  if (m && n >= m) row.classList.add('whole');
  if (tag === 'button') { row.type = 'button'; head.append(make('span', 'mdc-caret', '▸')); }
  head.append(make('span', 'mdc-label', r.label), make('span', 'mdc-lead'), make('span', 'mdc-count', `${n} ${W.of} ${m}`));
  row.append(head);
  if (m <= C.slotsMax) { const s = make('div', 'mdc-slots'); for (let i = 0; i < m; i++) s.append(make('i', `mdc-slot${i < n ? ' got' : ''}`)); row.append(s); }
  else { const g = make('div', 'mdc-groove'), f = make('i'); f.style.width = `${Math.round(100 * Math.min(1, n / m))}%`; g.append(f); row.append(g); }
  return row;
}

/** An area's checklist built into `el` (emptied first). */
export function checklist(el, rows, { line = '', game = null, words = null } = {}) {
  style();
  const W = { ...C.words, ...words };
  el.textContent = ''; el.classList.add('mdc');
  const hero = make('div', 'mdc-hero'); hero.append(make('span', null, W.found));
  if (!rows) { hero.append(make('b', null, W.unknown)); el.append(hero); return el; }
  const N = rows.reduce((s, r) => s + Math.min(r.n || 0, r.m || 0), 0), M = rows.reduce((s, r) => s + (r.m || 0), 0);
  hero.append(make('b', null, String(N)), make('i', null, `${W.of} ${M}`)); if (M && N >= M) hero.classList.add('whole');
  el.append(hero);
  for (const r of rows) {
    const list = r.rooms;
    const row = rowOf(r, W, list ? 'button' : 'div'); el.append(row);
    if (!list) continue;
    const box = make('div', 'mdc-rooms'), open = el.dataset.roomsOpen === '1';
    row.classList.toggle('open', open); box.classList.toggle('open', open);
    row.setAttribute('aria-expanded', String(open));
    row.addEventListener('click', () => {
      const now = !box.classList.contains('open'); el.dataset.roomsOpen = now ? '1' : '0';
      box.classList.toggle('open', now); row.classList.toggle('open', now); row.setAttribute('aria-expanded', String(now));
    });
    for (const q of list) {
      const e = make('div', `mdc-room${q.charted ? '' : ' unknown'}`, q.charted ? q.name : W.unknown);
      if (q.charted && q.place) calibrateButton(e, { place: q.place }, game);
      box.append(e);
    }
    el.append(box);
  }
  if (line) { const l = make('div', 'mdc-line'); l.innerHTML = CLOCK; l.append(make('span', null, line)); el.append(l); }
  return el;
}
