// ---------------------------------------------------------------------------------------
// THE CALENDAR: what day it is, for everything that drifts daily (a Well's layout, wellSeed; an island's demand; a route's reckoning:
// progress/econ/). One day is one UTC calendar day, so the world turns over at the same moment for every player, the way an MMO's daily
// reset does (FFXIV's daily duty roulette, Destiny's daily reset) and a Wanderer's world does by the real clock (Animal Crossing). It is
// one function on purpose: if a day is ever to mean something else (a day of play), it changes here and nowhere else.
//
//   today() -> integer day number (days since 1970-01-01, UTC)     dayOf(ms) -> the same for a given time
// ---------------------------------------------------------------------------------------
const DAY_MS = 86400000;

export const dayOf = (ms) => Math.floor(ms / DAY_MS);
export const today = () => dayOf(Date.now());
