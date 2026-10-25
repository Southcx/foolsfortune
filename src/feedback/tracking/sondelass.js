// ---------------------------------------------------------------------------------------
// TRACKING, THE SONDELASS: the tool drawn, its three forms, the cutlass's string, Blade Mode, Zandatsu, the lock-on, the guard and the
// grappling hook; and the blade against a mind. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as
// tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   sondelassRules({ on, L, log, where })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural, KIND } from './lineformat.js';

export function sondelassRules({ on, L, log, where }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // the Sondelass against a mind (tools/sondelass/blade.js)
  on('blade.resist', (e) => { L.inc('blade.resisted'); log.say('battle', `The ${KIND(e.kind)} turns your blade aside${e.why === 'uncuttable' ? ': it cannot be cut' : ': stun it first'}.`, { key: 'bres', throttle: 2 }); });
  on('creature.zandatsu', (e) => { L.inc('zandatsu.creature'); L.inc(`zandatsu.${e.kind}`); log.say('battle', `You take the ${KIND(e.kind)} apart. It comes undone into Lachryma.`, {}); });
  // ---- the Sondelass: the tool, the cutlass, the grapnel (src/tools/sondelass/sondelass.js)
  on('sondelass.draw', () => { L.inc('sondelass.draw'); log.say('info', 'You draw the Sondelass.', { key: 'sdraw', throttle: 2 }); });
  on('sondelass.stow', () => L.inc('sondelass.stow'));
  on('sondelass.form', (e) => {
    L.inc(`sondelass.form.${e.form}`);
    log.say('info', e.form === 'rod' ? 'The Sondelass telescopes out into a rod.' : e.form === 'hook' ? 'The Sondelass shortens, and a grappling hook seats at its tip.' : 'The Sondelass draws in, and a blade slides from its tip.', { key: 'sform', throttle: 0.6 });
    first(`sondelass.${e.form}`, `Logged: your first time using the Sondelass as a ${e.form === 'hook' ? 'grappling hook' : e.form}.`);
  });
  on('cut.swing', (e) => { L.inc('cut.swing'); if (e.n >= 2) { L.inc('cut.combo'); log.say('battle', 'You finish a three-hit string.', { key: 'combo', throttle: 1.5 }); } });
  on('cut.stinger', (e) => { L.inc('cut.stinger'); L.inc('cut.swing'); if (e.locked) L.inc('cut.stinger.locked'); first('cut.stinger', 'Logged: your first Stinger.'); log.say('battle', 'You drive the Stinger.', { key: 'sting', throttle: 1.5 }); });
  on('blade.enter', () => { L.inc('blade.enter'); first('blade', 'Logged: your first time in Blade Mode.'); log.say('battle', 'The world slows to the edge of your blade.', { key: 'blade', throttle: 4 }); });
  on('blade.cut', (e) => { L.inc('blade.cut'); if (e.pieces) L.inc('blade.pieces', e.pieces); });
  on('blade.zandatsu', () => { L.inc('blade.zandatsu'); first('zandatsu', 'Logged: your first zandatsu.'); log.say('battle', 'Zandatsu: you cut the clapperjar apart and take its core.', { key: 'zan', throttle: 2 }); });
  on('blade.exit', (e) => { L.hi('blade.cuts.best', e.cuts); });
  on('lock.on', (e) => { if (e.auto) return; L.inc('lock.on'); first('lock', 'Logged: your first lock-on.'); }); // (the touch lock's own is the game's aim assist, never yours: courier/lockon.js)
  on('guard.up', () => L.inc('guard.up'));
  on('guard.block', (e) => { L.inc(e.tool === 'dreamvane' ? 'guard.twirl' : 'guard.block'); // (the cutlass's guard only: the twirl is the Dreamvane's, SWEEPS.md tools 5)
    log.say('battle', e.tool === 'dreamvane' ? 'You turn the shot aside on your spinning crook.' : 'You turn the shot aside on your blade.', { key: 'gblock', win: 1 }); });
  on('cut.hit', (e) => {
    L.inc('cut.hit'); L.inc(`cut.hit.${e.what}`);
    const w = e.what === 'clapper' ? 'clapperjar' : e.what === 'slipjelly' ? 'slip jelly' : e.what === 'pot' || e.what === 'breakable' ? 'pot' : 'creature'; // (a creature by its own word, never a pot: T51)
    log.say('battle', `You slash the ${w}.`, { key: `cut.${w}`, win: 0.9, fmt: (n) => `You slash ${plural(n, w)}.` });
  });
  on('hook.fire', (e) => { L.inc('hook.fire'); L.inc(`hook.${e.kind}`); if (e.kind === 'miss') log.say('info', 'The grappling hook finds nothing.', { key: 'hmiss', throttle: 2 }); });
  const hooked = (w) => (w === 'clapper' ? 'clapperjar' : w === 'breakable' ? 'pot' : w === 'slipjelly' ? 'slip jelly' : 'prop');
  on('hook.pull', (e) => { L.inc('hook.pull'); L.inc(`hook.pull.${e.what}`); L.hi('hook.pull.dist', e.dist); log.say('battle', `You bring the ${hooked(e.what)} to you.`, { key: 'hpull', win: 1.2 }); });
  on('hook.fling', (e) => { L.inc('hook.fling'); L.hi('hook.fling.speed', e.speed); log.say('battle', `You let go, and the ${hooked(e.what)} flies.`, { key: 'hfling', win: 1.2 }); });
  on('hook.creature', (e) => { L.inc('hook.creature'); L.inc(`hook.creature.${e.kind}`); log.say('battle', `The grappling hook bites into the ${hooked(e.kind)}. It reels.`, { key: 'hcre', win: 1.2 }); });
  on('grapple.attach', (e) => {
    L.inc('grapple.attach'); L.inc(`grapple.attach.${e.kind}`);
    log.say('move', e.kind === 'anchor' ? 'The grappling hook bites. The line goes taut.' : `The grappling hook bites into ${e.what === 'clapper' ? 'a clapperjar' : e.what === 'breakable' ? 'a pot' : 'something loose'}.`, { key: 'gatt', throttle: 1.2 });
  });
  on('grapple.release', (e) => {
    L.inc(`grapple.release.${e.how}`);
    if (e.how === 'tap' || e.how === 'snag' || e.how === 'far') log.say('move', e.how === 'snag' ? 'The line catches on a corner and comes away.' : e.how === 'far' ? 'The line runs out and comes away.' : 'You let go of the line.', { key: 'grel', throttle: 1.2 });
  });
  on('grapple.swing', (e) => {
    if (e.phase !== 'end') return;
    L.inc('grapple.swing.n'); L.inc('grapple.swing.time', e.dur || 0); L.hi('grapple.swing.peak', e.peak, { at: where() });
  });
  on('grapple.fling', (e) => { L.inc('grapple.fling'); L.hi('grapple.fling.speed', e.speed); });
  on('zip.start', (e) => { L.inc('zip.start'); L.inc('zip.dist', e.dist); L.hi('zip.longest', e.dist); });
  on('zip.end', (e) => {
    L.inc(`zip.${e.how}`);
    if (e.how === 'arrive') log.say('move', 'The line draws you to the anchor.', { key: 'zip', throttle: 1.5 });
    else log.say('move', 'You leap from the line.', { key: 'zip', throttle: 1.5 });
  });
}
