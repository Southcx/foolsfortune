// ---------------------------------------------------------------------------------------
// TRACKING, THE SOLAR SKIFF'S PHASES: the board summoned, mounted, left parked, recalled, and the bail (courier/skiff/skiff.js: the
// Courier's own skiff clips, 2026-10-07). Counted for the ledger; a parking said in a line. The bail's count and line are Dovina's
// (tracking/moves.js); here only its kinds and its speed. The ride's own rules (start, pump, hop, trick, wobble) stay in tracking.js. The
// words are placeholders for Espada's.
//
//   skiff.summon {by}   skiff.mount {by}   skiff.park {by}   skiff.recall {by}   skiff.bail { why: 'wall' | 'land' | 'crooked', speed, by }
//
//   skiffRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function skiffRules({ on, L, log }) {
  for (const k of ['summon', 'mount', 'recall']) on(`skiff.${k}`, (e) => { if (e.by === 'courier') L.inc(`skiff.${k}`); });
  on('skiff.park', (e) => { if (e.by !== 'courier') return; L.inc('skiff.park'); log.say('info', 'You leave the Solar Skiff hovering. F to step back on.', { key: 'skiff.park', throttle: 20 }); });
  on('skiff.bail', (e) => { if (e.by === 'courier') { L.inc(`skiff.bail.${e.why}`); L.hi('skiff.bail.speed', e.speed || 0); } });
}
