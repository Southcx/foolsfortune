// ---------------------------------------------------------------------------------------
// TRACKING, THE SURF RIDE (plain names, South's ask 2026-11-06; courier/skiff/surf.js, docs/ref/WAVE-RIDING.md 2): the wave pool's turns,
// airs, tube time and the submarine said in the log's plain voice. Nothing is counted here: the ledger and its achievements are Dovina's
// (asked in docs/handoffs/dovina/2026-11-06-from-calissa-surf.md). A wipeout's line is the bail's (tracking/moves.js BAIL_SAYS: lip,
// closeout). The words are placeholders for Espada's.
//
//   skiff.surf { on }   skiff.surf.turn { kind }   skiff.tube.exit { seconds, made }   skiff.submarine   skiff.surf.drag { on, side }   (each with `by`)
//
//   surfRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const TURN_SAYS = { bottom: 'Bottom turn.', top: 'Top turn.', snap: 'Snap off the lip.', cutback: 'Cutback to the pocket.', floater: 'Floater over the lip.', air: 'Air off the lip.', crest: 'Trick off the swell: a push.' };

export function surfRules({ on, log }) {
  on('skiff.surf', (e) => { if (e.by === 'courier' && e.on) log.say('skiff', 'You ride onto the wave pool.', { key: 'surf.on', throttle: 30 }); });
  on('skiff.surf.turn', (e) => { if (e.by === 'courier' && TURN_SAYS[e.kind]) log.say('skiff', TURN_SAYS[e.kind], { key: `surf.${e.kind}`, throttle: 1.5 }); });
  on('skiff.tube.exit', (e) => {
    if (e.by !== 'courier' || !(e.seconds >= 0.5)) return;
    log.say('skiff', e.made ? `You come out of the barrel: ${e.seconds.toFixed(1)} s.` : `Out of the barrel: ${e.seconds.toFixed(1)} s.`, { key: 'surf.tube', throttle: 1 });
  });
  on('skiff.surf.drag', (e) => { if (e.by === 'courier' && e.on) log.say('skiff', 'Your hand in the face of the wave.', { key: 'surf.drag', throttle: 20 }); });
  on('skiff.submarine', (e) => { if (e.by === 'courier') log.say('skiff', 'Under the swell, and out again.', { key: 'surf.sub', throttle: 3 }); });
}
