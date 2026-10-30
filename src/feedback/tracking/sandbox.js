// ---------------------------------------------------------------------------------------
// TRACKING, THE SANDBOX AND THE THROWN HIT (progress/sandbox.js; world/sandbox/sandbox.js; world/impacts.js; docs/plans/SANDBOX.md): their
// ledger and log lines. A thrown hit anywhere is counted (the Courier's only: the environment's never), its best energy kept, a strike
// said; the Sandbox's lecterns say what they did, a goal and a juggle's count are said and kept. Placeholder words, Espada's to word.
//
//   sandboxRules({ on, L, log })   (tracking/rules.js calls it)
//   events read: impact.hit { power, heavy, energy, speed, creature, by }, impact.strike { n, by }, sandbox.rack, sandbox.pen,
//   sandbox.ground, sandbox.kick, sandbox.goal { dist }, sandbox.juggle { n }
// ---------------------------------------------------------------------------------------

export function sandboxRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  on('impact.hit', (e) => {
    if (e.by !== 'courier') return;
    L.inc('impact.hit'); if (e.heavy) L.inc('impact.heavy'); L.hi('impact.energy.best', e.energy || 0); L.hi('impact.speed.best', e.speed || 0);
    if (L.first('impact.hit.first')) say('info', 'A thrown thing struck home. Whatever it hits panics, and gives up more Lachryma.', 'impact.first');
  });
  on('impact.strike', (e) => { if (e.by !== 'courier') return; L.inc('impact.strike'); L.hi('impact.strike.best', e.n || 0); say('record', `A strike: ${e.n} struck with one throw.`, 'impact.strike'); });
  on('sandbox.rack', (e) => { if (e.by === 'courier') say('info', 'The yard is restocked: crates, bricks and pots.', 'sb.rack', 2); });
  on('sandbox.pen', (e) => { if (e.by === 'courier') say('info', 'Three slip jellies well up in the pen. They are for practice: nothing they do is counted.', 'sb.pen', 2); });
  on('sandbox.ground', (e) => { if (e.by === 'courier') say('info', 'The ground is put back as it was.', 'sb.ground', 2); });
  on('sandbox.kick', (e) => { if (e.by === 'courier') L.inc('sandbox.kick'); });
  on('sandbox.goal', (e) => {
    if (e.by !== 'courier') return;
    L.inc('sandbox.goal'); L.hi('sandbox.goal.far', Math.round(e.dist || 0));
    say('record', e.dist >= 20 ? `Goal, from ${Math.round(e.dist)} m!` : 'Goal!', 'sb.goal', 0.5);
  });
  on('sandbox.juggle', (e) => {
    if (e.by !== 'courier') return;
    const best = L.best?.('sandbox.juggle.best') || 0; L.hi('sandbox.juggle.best', e.n || 0);
    if (e.n >= 3) say(e.n > best ? 'record' : 'info', `${e.n} kicks without a bounce${e.n > best ? ', your best' : ''}.`, 'sb.juggle', 0.5);
  });
}
