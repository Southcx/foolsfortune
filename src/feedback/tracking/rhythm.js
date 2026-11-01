// ---------------------------------------------------------------------------------------
// TRACKING, THE RHYTHM MODE: a song played through on the ten keys: start, quit, list, offset, score. Moved out of tracking.js whole, the
// words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an
// event).
//
//   rhythmRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { RATINGS, overall } from '../../ui/rating.js';

export function rhythmRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // the rhythm mode (music/rhythm/rhythm.js): a song played through on the ten keys
  on('rhythm.start', (e) => { L.inc('rhythm.start'); first('rhythm', 'Logged: the rhythm mode. Notes fall toward the line. Press 1 to 0 as each note lands. 1 to 5 play the low notes, 6 to 0 the high. Press Esc to stop.'); });
  on('rhythm.quit', () => L.inc('rhythm.quit')); on('rhythm.list', (e) => log.say('system', `Songs to play: ${e.tracks.join(', ')}.`, {}));
  on('rhythm.offset', (e) => log.say('system', `Rhythm timing offset: ${Math.abs(e.ms)} ms ${e.ms < 0 ? 'earlier' : 'later'}.`, {}));
  on('rhythm.score', (e) => {
    if (e.by !== 'courier') return;
    const pct = Math.round(e.accuracy * 100); L.inc('rhythm.played'); L.inc(`rhythm.played.${e.level}`); if (e.full) L.inc('rhythm.full'); L.hi('rhythm.combo', e.combo); L.hi(`rhythm.best.${e.track}.${e.level}`, pct); L.hi('rhythm.accuracy.best', pct);
    log.say('song', `Played through: ${e.title}. ${pct} percent, ${RATINGS[overall(e.accuracy, e.full)].replace(/[.!]+$/, '')}${e.full ? '. No notes missed' : e.combo > 1 ? `. Best combo: ${e.combo} notes` : ''}.`, {}); // (the set's word: ui/rating.js overall)
  });
}
