// ---------------------------------------------------------------------------------------
// THE CALENDAR: what day it is, for everything that drifts daily (a Well's layout, wellSeed; an island's demand; a route's reckoning:
// progress/econ/). One game day is an hour of real time (DESIGN.md section 17: a day must be tasted in a sitting), on the wall clock
// scaled, so the world still turns while you are away and turns over at the same moment for every player, the way an MMO's daily reset
// does (FFXIV's, Destiny's), only hourly. It is one function on purpose: a day means what DAY_MS says, here and nowhere else.
//
//   today() -> integer game-day number (hours since 1970-01-01, UTC)     dayOf(ms) -> the same for a given time     DAY_MS
//   now() -> the calendar's milliseconds      setClock(fn) (the replay pins it: debug/replay.js, so a replay watched later sees its own day)
// ---------------------------------------------------------------------------------------
export const DAY_MS = 3600000; // (one game day: an hour of real time)

export const dayOf = (ms) => Math.floor(ms / DAY_MS);
let clock = () => Date.now();
export const setClock = (fn) => { clock = fn; };
export const now = () => clock();
export const today = () => dayOf(clock());
