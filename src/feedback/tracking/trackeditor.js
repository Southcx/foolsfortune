// ---------------------------------------------------------------------------------------
// TRACKING, MADE TRACKS AND THEIR TRAPS (docs/plans/TRACK-EDITOR.md): the editor's saves, validations and shares; a made track's races (kept
// apart from the park's: race.made.*, never race.raceway.*, so a made track opens none of the park's medals, wins or parts, and pays no
// cubes: the owner, 2026-10-24); haunted races on any track (race.haunted); the traps' hits by kind and by who held them, on any track;
// the haunt mode's wrecks. The achievements are predicates over
// these (progress/raceachievements.js, the Made Tracks rows).
//
// Prior art: the house's own race tracking (feedback/tracking/race.js); Trackmania's and Mario Maker's counts of tracks made and cleared.
//
//   trackEditorRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const clock = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`; };
const LABEL = { pillars: 'rising pillars', pendulum: 'pendulum', gust: 'gust gate', sinkhole: 'sinkhole', gusher: 'crude gusher', portal: 'portal', turret: 'Wisp turret' };

export function trackEditorRules({ on, L, log }) {
  on('editor.open', () => { L.inc('editor.open'); log.say('skiff', 'The build lot: lay a line, raise its pieces, set its traps.', { key: 'editor.open', throttle: 30 }); });
  on('editor.save', (e) => { L.inc('editor.save'); L.hi('editor.budget.best', e.budget || 0); L.hi('editor.traps.best', e.traps || 0); });
  on('track.validate', (e) => { L.inc('track.validate'); log.say('record', `Validated: your author time is ${clock(e.seconds)}. The track can be shared.`, { key: 'track.validate', throttle: 2 }); });
  on('track.share', () => L.inc('track.share'));
  on('track.load', (e) => { L.inc('track.load'); if (e.from === 'code') L.inc('track.load.code'); });
  on('race.finish', (e) => {
    if (e.mode === 'haunted' && !e.validate) { L.inc('race.haunted'); if (e.place === 1) L.inc('race.haunted.win'); } // (a haunted race on any track: TRACK-EDITOR.md 7)
    if (e.track !== 'made' || e.validate) return;
    L.inc('race.made.finish'); if (e.medal) L.inc(`race.made.${e.medal}`);
    if (e.of > 1 && e.place === 1) L.inc('race.made.win');
    if (e.loaded) L.inc('race.made.shared.finish');
  });
  on('trap.hit', (e) => {
    if (e.by === 'courier' && e.target === 'rival') { L.inc('trap.wreck'); L.inc(`trap.wreck.${e.kind}`); }
    if (e.target === 'courier') { L.inc('trap.taken'); log.say('skiff', e.possessor && e.possessor !== 'you' ? `${e.possessor}'s ${LABEL[e.kind] || 'trap'} catches you.` : `The ${LABEL[e.kind] || 'trap'} catches you.`, { key: `trap.hit.${e.kind}`, throttle: 2 }); }
  });
  on('trap.parry', () => { L.inc('trap.parry'); log.say('skiff', 'You send the flame home: the turret is stunned.', { key: 'trap.parry', throttle: 2 }); });
  on('trap.warp', (e) => { if (e.target !== 'courier') return; L.inc(e.back ? 'trap.warp.back' : 'trap.warp.on'); log.say('skiff', e.back ? 'The portal throws you back.' : 'The portal carries you on.', { key: 'trap.warp', throttle: 2 }); });
  on('haunt.end', (e) => {
    L.inc('haunt.end'); L.hi('haunt.wrecks.best', e.wrecks || 0); if (e.held) L.inc('haunt.held');
    log.say('record', e.held ? `You held them off: no rival finished inside par (${clock(e.par)}). ${e.wrecks} wrecks.` : `${e.winner} broke through in ${clock(e.seconds)}. ${e.wrecks} wrecks.`, { key: 'haunt.end', throttle: 2 });
  });
}
