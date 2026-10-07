// ---------------------------------------------------------------------------------------
// TRACKING, THE HELD TOOLS' STRINGS: what the combo engine (tools/moveset.js) plays for the Crucibelle's toll string, the Lockheart's
// flail and the Veritome's book bash, counted for the ledger (the counts are Dovina's to rule on: docs/handoffs/dovina/), and said once
// the first time (a placeholder sentence each, Espada's to replace: docs/handoffs/espada/). Each toll is still counted by its own rule
// (`crucibelle.toll`, tracking.js); these are the strings' own moves and what the flail and the book strike.
//
//   crucibelle.swing { n, move }        a move of the toll string begun (n: its place in the string, 0..3; move: toll | t1 | t2 | t3)
//   lockheart.swing { n, move }          a blow of the flail begun (f1..f3)        lockheart.hit { what, combo, move }   what it struck
//   veritome.swing { n, move }           a swing of the book bash (b1, b2)         veritome.hit { what, combo, move }    what it struck
//
//   heldStrikeRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function heldStrikeRules({ on, L, log }) {
  on('crucibelle.swing', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`bell.string.${e.move}`);
    if (e.n >= 3 && L.first('bell.string')) log.say('record', 'Logged: your first full toll string, brought down overhead.');
  });
  on('lockheart.swing', (e) => {
    if (e.by !== 'courier') return;
    L.inc('lockheart.swing'); L.inc(`lockheart.swing.${e.move}`);
    if (L.first('lockheart.flail')) log.say('record', 'Logged: your first swing of the coffin on its chain.');
  });
  on('lockheart.hit', (e) => { if (e.by !== 'courier') return; L.inc('lockheart.hit'); L.inc(`lockheart.hit.${e.what}`); });
  on('veritome.swing', (e) => {
    if (e.by !== 'courier') return;
    L.inc('veritome.swing'); L.inc(`veritome.swing.${e.move}`);
    if (L.first('veritome.bash')) log.say('record', 'Logged: your first book bash.');
  });
  on('veritome.hit', (e) => { if (e.by !== 'courier') return; L.inc('veritome.hit'); L.inc(`veritome.hit.${e.what}`); });
}
