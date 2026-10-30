// ---------------------------------------------------------------------------------------
// TRACKING, A PAIR'S SPECIAL IN PLAY: the log's line and the ledger's count when a pair's special plays (tools/pairspecials.js), the
// Courier's only. The opening is Dovina's (tracking/pairworn.js). Placeholder words, Espada's to word (CLARITY.md: the label, then what it did).
//
//   pairSpecialsPlayRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const DID = {
  19: 'your Flash marks the creature, and your next rounds home in on it.',
  6: 'the toll runs down your hooked line and stuns what it holds.',
  17: 'your fork lays a trail of paint as it flies.',
  3: "the hoover drinks paint off the ground into your brush's bottle.",
};

export function pairSpecialsPlayRules({ on, L, log }) {
  on('pair.special', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`pair.${e.pair}.special`);
    log.say('system', `${e.special}: ${DID[e.pair] || 'your pair works as one.'}`, { key: `pair.special.${e.pair}`, throttle: 2 });
  });
}
