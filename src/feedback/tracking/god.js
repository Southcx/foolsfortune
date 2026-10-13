// ---------------------------------------------------------------------------------------
// TRACKING, THE GOD HAND'S MATTER, MIRACLES AND REJECTION (docs/plans/GODHAND.md 3 to 5, 10): the rules that hear the hand move the
// island's matter (godhand/matterarts.js), call a miracle or an epic down (godhand/miracles.js) and the island answer it
// (godhand/rejection.js), and keep their counts. Only the Courier's acts count (`by`). tracking/rules.js calls it. Words are
// placeholders for Espada's.
//
//   godRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { MIRACLES, EPICS } from '../../progress/godpowers.js';

const STEP_SAYS = [
  'The island settles.',
  'The island stirs against you.',
  'The island pushes back.',
  'The island turns on you.',
  'The island will not have you.',
  'The island rises against you whole.',
];

export function godRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  const matter = (verb, says) => on(`god.${verb}`, (e) => {
    if (e.by !== 'courier') return;
    const m = Math.round(e.moved || 0), made = Math.round(e.made || 0);
    L.inc(`god.${verb}`); if (m) L.inc('god.moved', m); if (made) L.inc('god.made', made);
    if (says) log.say('god', says(e), { key: `gm.${verb}`, throttle: 3 });
  });
  matter('scoop'); matter('pour');
  matter('shape', () => 'The ground moves under your hand.');
  matter('carve', () => 'You cut a channel.');
  on('god.miracle', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.miracle'); L.inc(`god.miracle.${e.feeling}`); L.hi('god.miracle.score', Math.round((e.score || 0) * 100));
    log.say('god', `You call down ${MIRACLES[e.feeling]?.label || 'a miracle'}.`, { key: 'gmir', throttle: 1 });
    first('god.miracle', 'Logged: your first miracle.');
  });
  on('god.epic', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.epic'); L.inc(`god.epic.${e.epic}`);
    log.say('god', `${EPICS[e.epic]?.label || 'An epic miracle'}. Your Pneuka Jar pays for it.`);
    if (e.epic === 'prophecy') log.say('god', 'You see the next raid coming, and it comes later.');
  });
  on('god.rejection', (e) => {
    if (e.step > 0) L.hi('god.rejection.step', e.step);
    log.say(e.step ? 'warn' : 'god', STEP_SAYS[e.step] || STEP_SAYS[0], { key: 'grej', throttle: 2 });
  });
  on('god.rejection.beaten', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.rejection.beaten');
    log.say('god', 'You put down the island\'s answer. It lets you be, for now.');
  });
}
