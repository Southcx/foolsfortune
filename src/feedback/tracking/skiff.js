// ---------------------------------------------------------------------------------------
// TRACKING, THE SOLAR SKIFF'S PHASES: the board summoned, mounted, left parked, recalled, and the bail (courier/skiff/skiff.js: the
// Courier's own skiff clips, 2026-10-07). Counted for the ledger; a parking said in a line. The bail's count and line are Dovina's
// (tracking/moves.js); here only its kinds and its speed. The ride's own rules (start, pump, hop, trick, wobble) are skiffSailingRules, below. The
// words are placeholders for Espada's.
//
//   skiff.summon {by}   skiff.mount {by}   skiff.park {by}   skiff.recall {by}   skiff.bail { why: 'wall' | 'sideways' | 'land', speed, by }
//
//   skiffRules({ on, L, log })   (feedback/tracking/rules.js calls it)
//   skiffSailingRules({ on, L, log, where, track })
// ---------------------------------------------------------------------------------------
import { fx } from './lineformat.js';

export function skiffRules({ on, L, log }) {
  for (const k of ['summon', 'mount', 'recall']) on(`skiff.${k}`, (e) => { if (e.by === 'courier') L.inc(`skiff.${k}`); });
  on('skiff.park', (e) => { if (e.by !== 'courier') return; L.inc('skiff.park'); log.say('info', 'Solar Skiff parked where you stepped off.', { key: 'skiff.park', throttle: 20 }); });
  on('skiff.bail', (e) => { if (e.by === 'courier') { L.inc(`skiff.bail.${e.why}`); L.hi('skiff.bail.speed', e.speed || 0); } });
}

export function skiffSailingRules({ on, L, log, where, track }) {
  // ---- the Solar Skiff
  on('dunes.barrier', () => L.inc('dunes.barrier')); // (the edge of the sea touched: counted, not said)
  on('cleave.cut', (e) => { L.inc('cleave.cut'); if (e.what === 'ruin') L.inc('cleave.ruin'); });
  on('skiff.start', () => { L.inc('skiff.start'); log.say('skiff', 'Solar Skiff unfurled.', { key: 'sst', throttle: 3 }); });
  on('skiff.pump', () => L.inc('skiff.pump'));
  on('skiff.hop', () => L.inc('skiff.hop'));
  on('skiff.tick', (e) => { const r = L.hi('speed.skiff.max', e.speed, { at: where() }); track.note('speed.skiff.max', r, `New top skiffing speed: ${fx(e.speed, 1)} m/s.`, 14, e.speed); });
  on('skiff.trick', (e) => {
    const n = Math.round(e.turns);
    L.inc('skiff.trick'); L.inc('skiff.spins', n); L.hi('skiff.spin.best', n);
    log.say('skiff', n >= 3 ? `Triple spin landed.` : n === 2 ? 'Double spin landed.' : 'Spin landed.', { key: 'spin', win: 1 });
  });
  on('skiff.wobble', () => { L.inc('skiff.wobble'); log.say('warn', 'Balance lost.', { key: 'wob', throttle: 3 }); });
}
