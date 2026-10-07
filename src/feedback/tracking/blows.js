// ---------------------------------------------------------------------------------------
// TRACKING, BLOWS OF THE HANDS: the unarmed V's moves (courier/moves/kick.js, on the combo engine) and the psygun's own (the pistol whip,
// fanning the hammer, the flourish: tools/psygun/gunmoves.js). Counted for the ledger (Dovina's to rule on); nothing said in the log: the
// kick's own line ("Your kick strikes ...") and the combo engine's firsts (tracking/combo.js) already speak for them.
//
//   fist.hit { what, combo, move }   one blow of the unarmed V landed (what: 'pot' | 'clapper' | 'thing' | a creature's kind)
//   gun.move { n, move }             the psygun's whip or fan begun        gun.hit { what, combo, move }   the whip landed
//   gun.flourish { by }              the psygun spun round a finger before it is put away after a fight
//
//   blowRules({ on, L })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function blowRules({ on, L }) {
  on('fist.hit', (e) => { L.inc('fist.hit'); L.inc(`fist.hit.${e.what}`); if (e.move) L.inc(`fist.${e.move}.hit`); });
  on('gun.move', (e) => { L.inc('gun.move'); L.inc(`gun.move.${e.move}`); });
  on('gun.hit', (e) => { L.inc('gun.hit'); L.inc(`gun.hit.${e.what}`); });
  on('gun.flourish', (e) => { if (e.by === 'courier') L.inc('gun.flourish'); });
}
