// ---------------------------------------------------------------------------------------
// TRACKING, THE MOVEMENT ARTS AND THE HELD MOVES: a tech started and ended, the blink and stomp chains, the slam, the kick, the parry
// with every tool, recoil, hangs, throws, lobs, the shell hatch, and the opt-in arts' switches and jets. Moved out of tracking.js whole,
// the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence
// an event).
//
//   movementArtRules({ on, L, log, where, track })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { BY_ID, UNLOGGED_TECHS } from '../../progress/skills.js';

export function movementArtRules({ on, L, log, where, track }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('tech.start', (e) => { L.inc(`tech.start.${e.id}`); if (!UNLOGGED_TECHS.includes(e.id)) first(`tech.${e.id}`, `Logged: your first use of ${BY_ID[e.id]?.name || e.id}.`); });
  on('tech.end', (e) => {
    L.inc(`time.tech.${e.id}`, e.dur || 0); L.hi(`tech.longest.${e.id}`, e.dur || 0);
    if (e.id === 'roll') L.inc('roll.end');
    if (e.id === 'slip') L.inc('time.slip', e.dur || 0);
  });
  // a chain counts once when n of an event fall each within `within` s of the last, then starts over (as the arts' chain goals do)
  const chained = (key, n, within) => (e) => {
    const st = (track._chain[key] ||= { i: 0, t: -99 });
    st.i = e.t - st.t <= within ? st.i + 1 : 1; st.t = e.t;
    if (st.i >= n) { st.i = 0; L.inc(key); }
  };
  track._chain = {};
  const blink2 = chained('chain.blink2', 2, 0.9), stomp3 = chained('chain.stomp3', 3, 4);
  on('move.blink', (e) => { L.inc('move.blink'); blink2(e); });
  on('slam.impact', (e) => {
    L.inc('move.slam'); if (e.target) L.inc('slam.target');
    const r = L.hi('slam.height', e.height, { at: where() });
    track.note('slam.height', r, `Your highest slam is now ${e.height.toFixed(0)} m.`, 12, e.height);
    if (!e.target && e.height > 6) log.say('move', `You slam into the ground from ${e.height.toFixed(0)} m.`, { key: 'slam', win: 1.2 });
    else if (e.target) log.say('battle', 'Your slam strikes the target.', { key: 'slamt', win: 1.2 });
  });
  on('move.stomp', (e) => { L.inc('move.stomp'); stomp3(e); L.inc(`stomp.${e.what}`); log.say('move', `You stomp on the ${e.what}.`, { key: 'stomp', win: 1.5, fmt: (n) => `You stomp on the ${e.what} (×${n}).` }); });
  on('kick.swing', () => L.inc('kick.swing'));
  on('kick.hit', (e) => { L.inc('kick.hit', e.hits); L.hi('kick.best', e.hits); if (e.hits >= 2) log.say('battle', `Your kick strikes ${e.hits} targets.`, { key: 'kick', win: 1 }); });
  // the parry, with every tool (docs/plans/PARRY.md): counted all together and by tool; one line a way (Espada's words to come)
  const PARRY_SAY = {
    return: 'You parry the shot.', turn: 'You turn the shot aside.', soak: 'Your Soul Brush drinks the shot.', gulp: 'The Lockheart swallows the shot.',
    shatter: 'The Crucibelle shatters the shot.', stagger: 'You shoot it down, and its thrower reels.', shutter: 'Your shutter catches the blow.',
  };
  let parryRun = 0; // (parries without a miss: the feat's run, TRAINING.md 6; a miss is an outlined windup run out with you in reach)
  on('parry.missed', () => { L.inc('parry.missed'); parryRun = 0; });
  on('move.parry', (e) => {
    L.inc('move.parry'); if (e.tool) L.inc(`parry.${e.tool}`); if (e.speed) L.hi('parry.speed', e.speed); L.hi('parry.run.best', ++parryRun);
    log.say('battle', e.what === 'blow' && e.how !== 'shutter' ? 'You parry the blow, and it breaks off.' : PARRY_SAY[e.how] || PARRY_SAY.return, { key: 'parry', win: 1 });
  });
  on('recoil.jump', (e) => { L.inc('move.recoil'); if (e.charged) L.inc('recoil.charged'); L.hi('recoil.up', e.up); });
  for (const k of ['hang.start', 'hang.pullup', 'latch.start', 'pole.start', 'grate.start', 'balance.start', 'push.start', 'carry.lift', 'carry.put']) on(k, () => L.inc(`move.${k}`));
  on('push.move', (e) => L.inc('push.dist', e.dist));
  on('move.throw', (e) => { L.inc('move.throw'); L.hi('throw.speed', e.speed); });
  on('throw.hit', (e) => { L.inc('throw.hit'); L.inc(`throw.hit.${e.kind}`); });
  on('lob.fire', () => L.inc('lob.fire'));
  on('lob.dodged', () => { L.inc('lob.dodged'); log.say('move', 'You dodge the incoming lob.', { key: 'lob', win: 2 }); });
  on('lob.hit', () => { L.inc('lob.hit'); log.say('hurt', 'You are struck by a lob.', { key: 'lobh', win: 2 }); });
  on('groove.open', () => L.inc('shell.groove'));
  on('shell.anchor', () => L.inc('shell.anchor'));
  on('shell.hatch', () => { L.inc('shell.hatch'); log.say('art', 'You hatch a clapperjar.', { key: 'hatch', win: 1.5 }); });
  on('shell.befriend', (e) => { L.inc('shell.befriend'); if (!e.born) log.say('art', 'The clapperjar is turned to your side.', { key: 'turn', win: 1.5 }); });
  // the opt-in Movement Arts (the chat line's /art) and the jet arts' moves (courier/moves/jets.js)
  on('art.toggle', (e) => log.say('system', `${e.art.toUpperCase()} is now ${e.on ? 'on' : 'off'}.`));
  on('art.list', (e) => log.say('system', `Opt-in Movement Arts: ${e.arts}. Type /art and a name to switch one.`));
  on('move.hover', () => L.inc('move.hover'));
  on('move.rocket', () => L.inc('move.rocket'));
  on('move.skim', () => L.inc('move.skim'));
}
