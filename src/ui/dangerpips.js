// ---------------------------------------------------------------------------------------
// A WELL'S DANGER MARK (Dovina's handoff of 2026-10-23; FIRST-HOUR.md 6, the owner: "we should give Wells a mark or something"): the class of
// the FOE that keeps a Well's last floor, as pips beside its row at the Index, read before the row's name. It warns and never gates: every
// room stays open. A world mark in the Clay dress, no words: each pip a little fired roundel, a vermilion bead sunk in a dark clay ring
// (the danger's colour, the seal's ink), the number of them the class (the Great Slip Jelly, class 2: two). A screen reader is told the
// class (aria-label), the eye only the pips.
//
// Prior art: Monster Hunter's quest stars (a hunt's danger as a row of marks before its name), Dark Souls' and Elden Ring's bell
// glyphs and Hollow Knight's map pins (a mark that warns, never a lock), Zelda's heart-count labels on a shrine's door.
//
//   dangerPips(cls) -> <span class="dpips"> (1..5 pips; null for 0)   the row (feedback/indexmenu.js, Petra's) puts it after the key tag
// ---------------------------------------------------------------------------------------

const CSS = `
.dpips{display:inline-flex;gap:3px;align-items:center;margin:0 6px 0 2px;vertical-align:middle}
.dpips i{width:9px;height:9px;border-radius:50%;display:block;
  background:radial-gradient(circle at 42% 38%,#ff8a6a 0 18%,#e0442a 30%,#8a1e10 62%,#2a140c 66%);
  box-shadow:0 0 0 1px #2a140c,inset 0 -1px 0 rgba(0,0,0,.45),0 1px 0 rgba(255,226,196,.18)}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-dangerpips', ''); s.textContent = CSS; document.head.appendChild(s);
}

/** The FOE's class as pips (1..5), or null when there is none. */
export function dangerPips(cls) {
  const n = Math.max(0, Math.min(5, Math.round(cls || 0)));
  if (!n || typeof document === 'undefined') return null;
  style();
  const e = document.createElement('span'); e.className = 'dpips'; e.setAttribute('aria-label', `danger: class ${n}`);
  for (let i = 0; i < n; i++) e.appendChild(document.createElement('i'));
  return e;
}
