// ---------------------------------------------------------------------------------------
// TRACKING, THE CRUCIBELLE: the notes, the fever, the toll, the songs, the mirage and the smoke spirits. Moved out of tracking.js whole,
// the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence
// an event).
//
//   crucibelleRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';
import { SONGS } from '../../tools/crucibelle/songs.js';

export function crucibelleRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('crucibelle.note', (e) => { L.inc('bell.note'); if (e.onBeat) L.inc('bell.onbeat'); });
  on('crucibelle.fever', () => { L.inc('bell.fever'); log.say('song', 'Crucibelle fever!', { key: 'fever', throttle: 6 }); });
  on('crucibelle.toll', (e) => { L.inc('bell.toll'); if (e.onBeat) L.inc('bell.toll.onbeat'); });
  on('song.play', (e) => {
    L.inc('song.play'); L.inc(`song.${e.song}`); if (e.fever >= 1) L.inc('song.fever'); L.hi('song.power', Math.round(e.power * 100));
    const S = { reveal: (n) => (n ? `Revealed: ${plural(n, 'hidden thing')}.` : 'Nothing hidden nearby.'), mirage: () => 'Smoke Courier raised where you stood.', rally: (n) => (n ? `${n === 1 ? 'Ally' : `${n} allies`} rallied.` : 'Pool refills faster.'), lull: (n) => (n ? `${plural(n, 'thing')} fall${n === 1 ? 's' : ''} asleep.` : 'Nothing nearby to put to sleep.'), summon: (n) => (n > 1 ? `${n} smoke spirits summoned from the bell.` : 'Smoke spirit summoned from the bell.') };
    log.say('song', `Played ${SONGS[e.song]?.name.toLowerCase().replace(/^the /, 'the ') || e.song}${e.fever >= 1 ? ' in fever' : ''}. ${S[e.song]?.(e.n) || ''}`, {});
  });
  on('mirage.raise', () => L.inc('mirage.raise'));
  on('spirit.summon', (e) => { L.inc('spirit.summon'); L.inc(`spirit.summon.${e.from}`); first('spirit', 'Logged: first spirit. A spirit is your ally for a while. It follows you and fights your foes. Your blows pass through it.'); });
  on('spirit.fade', (e) => { L.inc('spirit.fade'); if (e.cause !== 'faded') log.say('other', 'Smoke spirit destroyed.', { key: 'sfade', throttle: 2 }); });
}
