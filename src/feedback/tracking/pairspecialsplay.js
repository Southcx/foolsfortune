// ---------------------------------------------------------------------------------------
// TRACKING, A PAIR'S SPECIAL IN PLAY: the log's line and the ledger's count when a pair's special plays (tools/pairspecials.js), the
// Courier's only. The opening is Dovina's (tracking/pairworn.js). Placeholder words, Espada's to word (CLARITY.md: the label, then what it did).
//
//   pairSpecialsPlayRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const DID = {
  1: 'your shot drags what it hit to you.',
  2: 'the Flash and the dowse together show every hidden signature near you.',
  3: "the hoover drinks paint off the ground into your brush's bottle.",
  4: "your shots land on the bell's beat, and each one staggers.",
  5: 'the toll reads every creature it reached, and you know each one better.',
  6: 'the toll runs down your hooked line and stuns what it holds.',
  7: 'you hook to your fork and are flung through the air.',
  8: 'your blows calm instead of hurt.',
  9: 'the sigil you photographed is written on what you photographed.',
  10: 'the wheel of odds turns the weather where you stand for a game hour.',
  11: 'your blow on the weak point you photographed lands as the right kind.',
  12: 'your photograph holds the creature still for a moment.',
  13: "the downed creature's Lachryma goes straight into your coffin.",
  14: 'paint laid on the beat mends your cracks.',
  15: 'your shot chains two creatures together where they stand.',
  16: 'a bolt comes down where your fork stuck.',
  17: 'your fork lays a trail of paint as it flies.',
  18: 'a singing decoy rises where your fork landed, and creatures go to it.',
  19: 'your Flash marks the creature, and your next rounds home in on it.',
  20: 'the toll opens your coffin, and all it drank bursts out as a wave.',
  21: 'your shot paints where it lands and mends what it passes.',
};

export function pairSpecialsPlayRules({ on, L, log }) {
  on('pair.special', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`pair.${e.pair}.special`);
    // (said once in 12 real s a special: several play once a blow, a round or a toll, and the line says what it does, not each time)
    log.say('system', `${e.special}: ${DID[e.pair] || 'your pair works as one.'}`, { key: `pair.special.${e.pair}`, throttle: 12 });
  });
  // a Rite's toll read a creature: counted toward knowing its kind as a down is (progress/familiarity.js)
  on('pair.read', (e) => { if (e.by === 'courier' && e.kind) L.inc(`creature.${e.kind}.read`); });
}
