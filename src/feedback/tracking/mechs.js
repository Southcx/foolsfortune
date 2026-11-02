// ---------------------------------------------------------------------------------------
// TRACKING, MECHS (docs/plans/MECHS.md 7): the ledger's counts and the log's lines for a mech piloted and a giant fought (the rules
// progress/mechs/, the hangar world/hangar/). Plain words, Espada's to word (CLARITY.md); the game says "you" and "your Pneuka Jar".
//
// Ledger: mech.seal, mech.launch, mech.unseal, mech.fail, mech.fail.<why>, mech.step.beat, mech.boost, mech.berserk, mech.barrier,
// mech.region.break, giant.stagger, giant.down, giant.down.<id>, giant.down.weapon.<w>, giant.down.leg.<type>, giant.down.offcable;
// hi mech.sync (a percent), hi mech.sync.run (real s held at IN_STEP or more).
//
// Prior art: Armored Core's mission debrief (what broke, what it cost), Evangelion's sync test readouts (a ratio, a record kept).
//
//   mechRules({ on, L, log })   (tracking/rules.js calls it)   IN_STEP
// ---------------------------------------------------------------------------------------
import { giantOf } from '../../progress/mechs/giants.js';

/** Sync held at or past this counts toward "In Step" (MECHS.md 7). */
export const IN_STEP = 0.9;

export function mechRules({ on, L, log }) {
  let cable = false, run = 0, lastT = null;
  const mine = (e) => e.by === 'courier';
  on('mech.seal', (e) => { if (!mine(e)) return; cable = false; run = 0; L.inc('mech.seal'); log.say('info', "Your Pneuka Jar turns home in the mech's cradle.", { key: 'mech.seal', throttle: 2 }); });
  on('mech.launch', (e) => { if (!mine(e)) return; L.inc('mech.launch'); log.say('info', 'The lift carries the mech up to the proving ground.', { key: 'mech.launch', throttle: 2 }); });
  on('mech.unseal', (e) => { if (!mine(e)) return; L.inc('mech.unseal'); if (e.why !== 'wrecked') log.say('info', 'Your Pneuka Jar lifts out of the mech.', { key: 'mech.unseal', throttle: 2 }); });
  on('mech.fail', (e) => {
    L.inc('mech.fail'); if (e.why) L.inc(`mech.fail.${e.why}`);
    log.say('warn', e.why === 'core' ? "The mech's core breaks. It kneels and throws your Pneuka Jar clear." : "The mech's battery and your pool are spent. It kneels and throws your Pneuka Jar clear.", { key: 'mech.fail', throttle: 2 });
  });
  on('mech.step', (e) => { if (mine(e) && e.beat === 'beat') L.inc('mech.step.beat'); });
  on('mech.boost', (e) => { if (mine(e)) L.inc('mech.boost'); });
  on('mech.cable', (e) => {
    if (!mine(e)) return; cable = !!e.plugged;
    log.say('info', cable ? 'The cable is in: the battery fills.' : 'Off the cable: the battery is all there is.', { key: 'mech.cable', throttle: 1 });
  });
  on('mech.sync', (e) => {
    if (!mine(e)) return;
    L.hi('mech.sync', Math.round((e.v || 0) * 100));
    const now = performance.now() / 1000, dt = lastT == null ? 0 : Math.min(2, now - lastT); lastT = now;
    run = (e.v || 0) >= IN_STEP ? run + dt : 0; L.hi('mech.sync.run', Math.floor(run));
  });
  on('mech.barrier', (e) => { if (mine(e) && e.neutralised) { L.inc('mech.barrier'); log.say('gain', "The giant's barrier falls.", { key: 'mech.barrier', throttle: 2 }); } });
  on('mech.hurt', (e) => { if (e.broke) { L.inc('mech.region.break'); log.say('warn', `The mech's ${e.region === 'armL' ? 'left arm' : e.region === 'armR' ? 'right arm' : e.region} breaks.`, { key: `mech.break.${e.region}`, throttle: 2 }); } });
  on('mech.berserk', () => { L.inc('mech.berserk'); log.say('warn', 'The mech moves on its own.', { key: 'mech.berserk', throttle: 4 }); });
  on('giant.wake', (e) => log.say('info', `The ${(giantOf(e.id)?.label || 'giant').toLowerCase()} stirs.`, { key: 'giant.wake', throttle: 4 }));
  on('giant.stagger', (e) => { if (e.by && !mine(e)) return; L.inc('giant.stagger'); log.say('gain', 'The giant staggers.', { key: 'giant.stagger', throttle: 1.5 }); });
  on('giant.down', (e) => {
    if (!mine(e)) return;
    L.inc('giant.down'); L.inc(`giant.down.${e.id}`);
    if (e.weapon) L.inc(`giant.down.weapon.${e.weapon}`);
    if (e.leg) L.inc(`giant.down.leg.${e.leg}`);
    if (!cable) L.inc('giant.down.offcable');
    log.say('gain', `The ${(giantOf(e.id)?.label || 'giant').toLowerCase()} falls.`, { key: 'giant.down', throttle: 2 });
  });
}
