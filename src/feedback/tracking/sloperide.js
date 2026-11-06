// ---------------------------------------------------------------------------------------
// TRACKING, THE SLOPE RIDE (courier/skiff/sloperide.js; docs/ref/WAVE-RIDING.md section 3): the Solar Skiff furled on a downslope, ridden
// as a snowboard. Said in a few plain lines, only where it matters: the ride's first line (how the keys answer), a clean or sketchy
// landing after a real air, a long butter. Nothing counted here: the ledger's keys and any achievements are Dovina's (her handoff,
// docs/handoffs/dovina/2026-11-06-from-calissa-slope.md). The words are placeholders for Espada's.
//
//   skiff.slope { on, by }   skiff.slope.land { grade: 'clean' | 'sketchy' | 'bail', yaw, pitch, by }   skiff.butter { end, on, seconds, by }
//   skiff.edge.skid { k, side, speed, by } (the look's only: never said)
//
//   slopeRideRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function slopeRideRules({ on, log }) {
  on('skiff.slope', (e) => { if (e.by === 'courier' && e.on) log.say('skiff', 'Riding the slope furled. A and D set the edge; W or S alone presses the nose or the tail; A or D held while you crouch winds a spin.', { key: 'slope.on', throttle: 60 }); });
  on('skiff.slope.land', (e) => {
    if (e.by !== 'courier') return;
    if (e.grade === 'clean') log.say('skiff', 'Clean landing.', { key: 'slope.land', throttle: 8 });
    else if (e.grade === 'sketchy') log.say('skiff', 'Sketchy landing. Land with the slope.', { key: 'slope.land', throttle: 8 });
  });
  on('skiff.butter', (e) => { if (e.by === 'courier' && !e.on && e.seconds >= 1) log.say('skiff', e.end === 'nose' ? 'Nose butter.' : 'Tail butter.', { key: 'slope.butter', throttle: 12 }); });
}
