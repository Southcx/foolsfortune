// ---------------------------------------------------------------------------------------
// TRACKING, THE MIMICRY PUZZLES (progress/mimicry.js, world/mimicry/mimicry.js; docs/plans/MIMICRY.md): their ledger and their log
// lines. A solve books its count, its best stars, the power it copied cleanly (`god.mimic.<power>`: a power's third way to be learned,
// progress/skills.js), a perfect copy, the game day's puzzle; the log says what the stone asks, the turn, a solve with its stars, and a
// copy left short. Placeholder words, Espada's to word.
//
//   mimicryRules({ on, L, log })   (tracking/rules.js calls it)
//   events read: mimic.open { puzzle, label, line, mode, site }, mimic.turn, mimic.solve { puzzle, label, mode, match, stars, strokes,
//   par, made, powers, first, day }, mimic.leave { match }
// ---------------------------------------------------------------------------------------
import { MIMIC } from '../../progress/mimicry.js';

const MODE_LINE = { mimic: 'Watch the hand work the ground, then make it again.', match: 'Make the ground as the outline shows. The steps are yours to find.', undo: 'Put the ground back as the outline shows.' };
const STARS = ['', '★☆☆', '★★☆', '★★★'];

export function mimicryRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  on('mimic.open', (e) => { if (e.by !== 'courier') return; L.inc('god.mimic.opened'); say('system', `${e.label}: ${e.line} ${MODE_LINE[e.mode] || ''}`, 'mimic.open'); });
  on('mimic.turn', (e) => { if (e.by === 'courier') say('system', 'Your turn.', 'mimic.turn'); });
  on('mimic.solve', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.mimic.solved'); L.inc(`god.mimic.solved.${e.puzzle}`); L.hi(`god.mimic.stars.${e.puzzle}`, e.stars);
    if (e.stars >= 3) L.inc('god.mimic.perfect');
    if (e.mode !== 'mimic') L.inc(`god.mimic.${e.mode}`); // (MATCH and UNDO: the steps read, never shown)
    if (e.stars >= 2) for (const p of e.powers || []) L.inc(`god.mimic.${p}`); // (a clean copy of a power: its mimic way)
    if (e.day != null) { L.inc('god.mimic.day'); L.hi('god.mimic.day.stars', e.stars); }
    const why = e.stars < 3 ? (e.strokes > e.par ? ` ${e.strokes} strokes for its ${e.par}.` : e.made > MIMIC.made ? ' Some of it was made from nothing.' : ' Not quite the ground it asked.') : '';
    say('record', `${e.label}: copied, ${STARS[e.stars]} (${Math.round(e.match * 100)}%).${why}`, 'mimic.solve');
  });
  on('mimic.leave', (e) => { if (e.by === 'courier') say('info', `Left at ${Math.round((e.match || 0) * 100)}%. The stone keeps the puzzle for you.`, 'mimic.leave'); });
}
