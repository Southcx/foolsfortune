// ---------------------------------------------------------------------------------------
// TRACKING, THE POOL: what the ledger keeps of the Courier's Lachryma and what the log says of it (the pool has its own listeners,
// courier/lachryma.js: spend, gain, denied, empty, full, overflow). Moved out of tracking.js whole, with one rule added: the pool
// crossing below a quarter is said (QA-A, 2026-10-22: "the pool drains in silence until it is gone"; the first word on it came at
// empty). Prior art: Dark Souls' and Monster Hunter's stamina bar flashing low, and Zelda's low-heart beep, said here in the log.
//
//   poolRules(ctx)   ledger: lach.spent, lach.spent.<tag>, lach.spend.count, lach.gain, lach.gain.<source>, lach.denied, lach.empty,
//                    lach.low, lach.full, lach.overflow
// ---------------------------------------------------------------------------------------

/** The pool's low line: below this fraction of its max, crossing down, at most once in `throttle` real seconds. */
export const POOL_LOW = { frac: 0.25, throttle: 45 };

export function poolRules({ L, log, g }) {
  const P = g.lachryma; if (!P) return;
  let sum = 0, at = -Infinity;
  P.on('spend', (e) => {
    L.inc('lach.spent', e.amount); L.inc(`lach.spent.${e.tag}`, e.amount); L.inc('lach.spend.count');
    const max = P.max || 100, low = max * POOL_LOW.frac;
    if (e.value > 0 && e.value < low && e.value + e.amount >= low) {
      L.inc('lach.low');
      log.say('warn', `Your pool is low: ${Math.round(e.value)} of ${Math.round(max)}. Stop spending and it fills again.`, { key: 'llow', throttle: POOL_LOW.throttle });
    }
  });
  P.on('gain', (e) => {
    L.inc('lach.gain', e.amount); L.inc(`lach.gain.${e.source}`, e.amount);
    if (e.source === 'regen') return;
    sum = (at > L.play - 2.5 ? sum : 0) + e.amount; at = L.play; // (folded into one line)
    log.say('gain', `You absorb ${Math.round(sum)} Lachryma.`, { key: 'lgain', win: 2.5, fmt: () => `You absorb ${Math.round(sum)} Lachryma.` });
  });
  P.on('denied', () => { L.inc('lach.denied'); log.say('warn', 'You do not have enough Lachryma.', { key: 'lden', throttle: 2.5 }); });
  P.on('empty', () => { L.inc('lach.empty'); log.say('warn', L.get('lach.empty') > 1 ? 'Your pool is empty.' : `Your pool is empty. It fills again on its own once you stop spending: ${(P.regenRate * (P.product?.((m) => m.regenMult) ?? 1)).toFixed(1)} a second, starting ${P.regenDelay.toFixed(1)} real seconds after.`, { key: 'lemp', throttle: 8 }); }); // (the first time, how it comes back: FIRST-HOUR.md 3)
  P.on('full', () => L.inc('lach.full'));
  P.on('overflow', (e) => L.inc('lach.overflow', e.amount));
}
