// ---------------------------------------------------------------------------------------
// TRACKING, THE GOD HAND'S MATTER, MIRACLES AND REJECTION (docs/plans/GODHAND.md 3 to 5, 10): the rules that hear the hand move the
// island's matter (godhand/matterarts.js), call a miracle or an epic down (godhand/miracles.js) and the island answer it
// (godhand/rejection.js), and keep their counts. Only the Courier's acts count (`by`). tracking/rules.js calls it. Words are
// placeholders for Espada's.
//
//   godRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { MIRACLES, EPICS, GOD_POWERS, POWER_EVENTS } from '../../progress/godpowers.js';

// the domains' other powers, counted alike (`god.power.<id>`); what each says, where it says anything (placeholders for Espada's)
const POWER_SAYS = { portal: 'A portal opens, and its twin.', fold: 'The ground folds over.', setfast: 'It sets fast.', totem: 'A totem holds the weather.', herd: 'They walk where you drew.', take: 'You take it in hand.', muster: 'Clay hands come up to carry.', ward: 'A ward is written.', stamp: 'The ground is pressed again.' };


const LEVEL_SAYS = [ // (the Dissonance Level, 0 to 5)
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
  on('god.sculpt', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.sculpt'); L.inc(`god.sculpt.${e.shape}`); L.hi('god.sculpt.volume', Math.round(e.volume || 0));
    log.say('god', { pillar: 'You raise a pillar of clay.', arch: 'You raise an arch of clay.', ramp: 'You raise a ramp of clay.' }[e.shape] || 'You raise clay.', { key: 'gsc', throttle: 1 });
  });
  for (const id of POWER_EVENTS) on(`god.${id}`, (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.power'); L.inc(`god.power.${id}`);
    if (POWER_SAYS[id]) log.say('god', POWER_SAYS[id], { key: `gp.${id}`, throttle: 2 });
    if (L.first(`god.power.${id}`)) log.say('record', `Logged: your first ${GOD_POWERS[id].label}.`);
  });
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
  on('god.dissonance', (e) => {
    if (e.level > 0) L.hi('god.dissonance.level', e.level);
    log.say(e.level ? 'warn' : 'god', LEVEL_SAYS[e.level] || LEVEL_SAYS[0], { key: 'gdis', throttle: 2 });
  });
  on('god.rejection.beaten', (e) => {
    if (e.by !== 'courier') return;
    L.inc('god.rejection.beaten');
    log.say('god', 'You put down the island\'s answer. It lets you be, for now.');
  });
}
