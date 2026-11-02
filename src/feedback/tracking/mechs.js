// ---------------------------------------------------------------------------------------
// TRACKING, MECHS (docs/plans/MECHS.md 7): the ledger's counts and the log's lines for a mech piloted and a giant fought (the rules
// progress/mechs/, the hangar world/hangar/). Plain words, Espada's to word (CLARITY.md); the game says "you" and "your Pneuka Jar".
//
// Ledger: mech.seal, mech.launch, mech.unseal, mech.fail, mech.fail.<why>, mech.step.beat, mech.boost, mech.berserk, mech.barrier,
// mech.region.break, giant.stagger, giant.down, giant.down.<id>, giant.down.weapon.<w>, giant.down.leg.<type>, giant.down.offcable;
// hi mech.sync (a percent), hi mech.sync.run (real s held at IN_STEP or more).
// v2 (MECHS.md 9): mech.step, mech.jump, mech.blow, mech.blow.head, mech.crit, mech.stagger.both (a giant staggered by both arms inside
// a real second), mech.technique.<id>, mech.through, mech.pound.fell, mech.drop.high, mech.roof, mech.destroy.cells / .chunks /
// .buildings / .topple, mech.prop.grab.<prop>, mech.prop.hit, mech.prop.spin3, mech.prop.throw, mech.javelin.giant, mech.shield.broke,
// mech.limb.own, mech.joint.snap.<who>, giant.down.weapon.rubble (by giant.down), the boxing ring's mech.bout, mech.bout.won,
// mech.bout.won.<rival>, mech.bout.how.<how>, mech.bout.perfect, mech.bout.chargebreak, mech.bout.stars (hi).
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
  // ---- v2: techniques, the toy city, props, joints (MECHS.md 9) ----
  let lastArm = { L: -9, R: -9 };
  on('mech.step', (e) => { if (mine(e)) L.inc('mech.step'); });
  on('mech.jump', (e) => { if (mine(e)) L.inc('mech.jump'); });
  on('mech.hit', (e) => {
    if (!mine(e) || e.blocked) return; L.inc('mech.blow'); if (e.region === 'head') L.inc('mech.blow.head'); if (e.crit) L.inc('mech.crit');
    const now = performance.now() / 1000; if (e.arm) lastArm[e.arm] = now;
    if (e.staggered && Math.abs(lastArm.L - lastArm.R) <= 1 && now - Math.min(lastArm.L, lastArm.R) <= 1.2) L.inc('mech.stagger.both');
  });
  on('mech.technique', (e) => {
    if (!mine(e)) return; L.inc(`mech.technique.${e.id}`);
    if (e.through) L.inc('mech.through'); if (e.fell && e.id === 'groundPound') L.inc('mech.pound.fell'); if (e.id === 'elbowDrop' && (e.height || 0) >= 30) L.inc('mech.drop.high');
  });
  on('mech.roof', (e) => { if (mine(e)) L.inc('mech.roof'); });
  on('city.break', (e) => { if (!mine(e)) return; L.inc('mech.destroy.cells', e.cells || 0); if (e.chunks) L.inc('mech.destroy.chunks', e.chunks); });
  on('city.felled', (e) => {
    if (!mine(e)) return; L.inc('mech.destroy.buildings'); if (e.topple) L.inc('mech.destroy.topple');
    log.say('gain', e.topple ? `The ${(e.label || 'building').toLowerCase()} comes down in one.` : `The ${(e.label || 'building').toLowerCase()} comes down.`, { key: 'city.felled', throttle: 1.5 });
  });
  on('mech.grab', (e) => { if (mine(e)) L.inc(`mech.prop.grab.${e.prop}`); });
  on('mech.prop.hit', (e) => { if (!mine(e)) return; L.inc('mech.prop.hit'); if ((e.n || 0) >= 3) L.inc('mech.prop.spin3'); if (e.prop === 'limb' && e.own) L.inc('mech.limb.own'); });
  on('mech.prop.throw', (e) => { if (!mine(e)) return; L.inc('mech.prop.throw'); if (e.javelin && e.hit === 'giant') L.inc('mech.javelin.giant'); if (e.prop === 'limb' && e.own && e.hit === 'giant') L.inc('mech.limb.own'); });
  on('mech.prop.break', (e) => { if (mine(e) && e.shield) L.inc('mech.shield.broke'); });
  on('mech.joint', (e) => {
    if (e.to !== 'snapped') return; if (e.who !== 'mech' && e.by === 'courier') L.inc(`mech.joint.snap.${e.who}`);
    const part = { neck: 'head', shoulderL: 'left arm', shoulderR: 'right arm', elbowL: 'left forearm', elbowR: 'right forearm', hipL: 'left leg', hipR: 'right leg', backMount: 'back unit' }[e.joint] || 'part';
    log.say(e.who === 'mech' ? 'warn' : 'gain', e.who === 'mech' ? `Your mech's ${part} tears off.` : `The ${(e.label || e.who).toLowerCase()}'s ${part} tears off.`, { key: `mech.joint.${e.who}.${e.joint}`, throttle: 1 });
  });
  // ---- the ring (ring.js events, carried by the runtime with `by` and the rival's id) ----
  on('bout.enter', (e) => { if (mine(e)) log.say('info', `You square up to the ${(e.label || 'rival').toLowerCase()}.`, { key: 'bout.enter', throttle: 2 }); });
  on('bout.star', (e) => { if (mine(e) && e.stars) L.hi('mech.bout.stars', e.stars); });
  on('bout.punch', (e) => { if (mine(e) && e.broke) L.inc('mech.bout.chargebreak'); });
  on('bout.down', (e) => { log.say(e.who === 'me' ? 'warn' : 'gain', e.who === 'me' ? 'You are down.' : `The ${(e.label || 'rival').toLowerCase()} is down.`, { key: 'bout.down', throttle: 1 }); });
  on('bout.round', (e) => log.say('info', `Round ${e.round}.`, { key: 'bout.round', throttle: 2 }));
  on('bout.over', (e) => {
    if (e.practice) return; L.inc('mech.bout');
    const HOW = { ko: 'by knockout', tko: 'by a technical knockout', head: 'with its head knocked clean off', arms: 'with both its arms torn off', decision: 'on points' };
    if (e.winner === 'me') { L.inc('mech.bout.won'); L.inc(`mech.bout.won.${e.rival}`); L.inc(`mech.bout.how.${e.how}`); if (e.perfect) L.inc('mech.bout.perfect'); }
    log.say(e.winner === 'me' ? 'gain' : 'warn', e.winner === 'me' ? `You beat the ${(e.label || 'rival').toLowerCase()} ${HOW[e.how] || ''}.`.replace(' .', '.') : e.how === 'head' ? 'Your mech\'s head pops off its neck. The bout is lost.' : `The ${(e.label || 'rival').toLowerCase()} beats you ${HOW[e.how] || ''}.`.replace(' .', '.'), { key: 'bout.over', throttle: 2 });
  });
  on('giant.down', (e) => {
    if (!mine(e)) return;
    L.inc('giant.down'); L.inc(`giant.down.${e.id}`);
    if (e.weapon) L.inc(`giant.down.weapon.${e.weapon}`);
    if (e.leg) L.inc(`giant.down.leg.${e.leg}`);
    if (!cable) L.inc('giant.down.offcable');
    log.say('gain', `The ${(giantOf(e.id)?.label || 'giant').toLowerCase()} falls.`, { key: 'giant.down', throttle: 2 });
  });
}
