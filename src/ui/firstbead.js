// ---------------------------------------------------------------------------------------
// THE FIRST TODAY'S BEAD (docs/plans/GAPS.md G46; COLLECTION-LOG.md 6): at the Index, a room where a module's first of the game day is
// still to take (Dovina's `game.firstToday.left()`, progress/firsttoday.js) wears a small gold bead beside its key tag, breathing; a room
// with none left wears nothing. A world mark in the Clay dress, no words: the bead a drop of gold glaze in a dark clay ring (the gold the
// house's reward colour, the danger pips' vermilion its neighbour), one bead however many of its modules are left. A screen reader and
// the pointer's hover are told which (aria-label and title, in the module's own label: the System's words, FIRST_TODAY's).
// Which modules a room holds is this table (`FIRST_ROOMS`): the room the Index sends you to where that module's thing is done.
//
// Prior art: Destiny's and FFXIV's daily-bonus pips on a duty's row (a mark that says "today's bonus is still here"), Animal Crossing's
// Nook Miles+ dot, the Index's own danger pips (ui/dangerpips.js) for the grammar.
//
//   firstBead(game, roomId) -> <span class="fbead"> | null   FIRST_ROOMS { roomId: [module ids] }   the row (feedback/indexmenu.js,
//   Petra's) puts it after the key tag, as the danger pips: `game.firstBead?.(room.id)`
// ---------------------------------------------------------------------------------------
import { FIRST_TODAY } from '../progress/firsttoday.js';

/** The Index's rooms (world/rooms.js ids) and the modules whose first is taken there. The duel and the Spirit Garden have no room of
 *  their own at the Index (an aberrant is met anywhere; the garden is entered at a Shrine), so no row wears theirs. */
export const FIRST_ROOMS = {
  dunes: ['dunes', 'angling'], // (the crystals, and the Weir's fish)
  shore: ['crossing'],         // (the jetty's pier, where a crossing casts off)
  opensea: ['opensea'], raceway: ['raceway'], bazaar: ['bazaar'],
  dunemaw: ['well'],
  siege: ['godhand'], sandbox: ['godhand'], // (a miracle, wherever the hand is taken: its two rooms)
};

const CSS = `
.fbead{display:inline-block;width:8px;height:8px;margin:0 4px 0 1px;border-radius:50%;vertical-align:middle;flex:none;
  background:radial-gradient(circle at 40% 35%,#fff6d0 0 16%,#ffd36a 34%,#b07a1e 64%,#2a140c 68%);
  box-shadow:0 0 0 1px #2a140c,0 0 6px rgba(255,211,106,.55);animation:fbead 2.4s ease-in-out infinite}
@keyframes fbead{0%,100%{box-shadow:0 0 0 1px #2a140c,0 0 3px rgba(255,211,106,.35)}50%{box-shadow:0 0 0 1px #2a140c,0 0 9px rgba(255,211,106,.8)}}
@media (prefers-reduced-motion: reduce){.fbead{animation:none}}
`;
let styled = false;
function style() { if (styled || typeof document === 'undefined') return; styled = true; const s = document.createElement('style'); s.setAttribute('data-firstbead', ''); s.textContent = CSS; document.head.appendChild(s); }

/** The bead for a room with a first still to take today, or null. */
export function firstBead(game, roomId) {
  const mods = FIRST_ROOMS[roomId], F = game?.firstToday; if (!mods || !F?.left || typeof document === 'undefined') return null;
  const left = new Set(F.left()), here = mods.filter((m) => left.has(m)); if (!here.length) return null;
  style();
  const e = document.createElement('span'); e.className = 'fbead';
  const said = here.map((m) => FIRST_TODAY.modules[m]?.label || m).join(', ');
  e.setAttribute('aria-label', `first today: ${said}`); e.title = said;
  return e;
}
