// ---------------------------------------------------------------------------------------
// THE SOUNDS THE EVENTS MAKE: a table over the event bus, as tracking.js's is for the log. A feature that wants a sound for something
// it already reports (an event) needs no call of its own: a line here says what it sounds like. (Sounds that are part of an action,
// a swing, a step, stay where the action is.)
//
// Prior art: Wwise's and FMOD's events (the game says what happened, the sound designer decides what it sounds like), and this
// game's own tracking.js.
//
//   hearEvents(game, sfx)   (once, at boot)
// ---------------------------------------------------------------------------------------
const RULES = {
  'film.load': (s) => s.filmWind?.(), // (a fresh roll threaded: veritome/book.js)
  'dreamvane.survey': (s) => s.surveySwing?.(), // (the heel going up; the blow's own sound is cartography's survey)
  'psygun.change': (s) => s.gunSwap?.(), // (shells.js)
  'psygun.chamber': (s) => s.chamberClick?.(),
};

export function hearEvents(game, sfx) {
  for (const [name, fn] of Object.entries(RULES)) game.events.on(name, (e) => fn(sfx, e));
}
