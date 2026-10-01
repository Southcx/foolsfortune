// ---------------------------------------------------------------------------------------
// TRACKING: the quiet part. Every event the game already reports (events.js) and a light per-frame sampler feed the
// ledger (stats.js), and the few that a player would want to be told about become a line in the log (gamelog.js), in
// the plain third-person voice of an MMO's combat log. Nothing in the game calls the log to celebrate; things happen,
// they are counted here, and this is the one place that decides what is said about them. Achievements
// (achievements.js) are predicates over the numbers kept here, so a new one never needs a new hook.
//
// Prior art: Old School RuneScape's hiscores and collection log (a counter per thing, a best per thing with the time
// it was set, a first-seen slot per thing), Final Fantasy XIV's achievement counters (one number behind each
// achievement, kept whether or not it is ever asked for) and Final Fantasy XI's log (one sentence per event, the
// colour saying what kind).
//
// Keys (dotted, so they group; see the README's table):
//   time.*      seconds        time.state.<sprint|slide|air|...>, time.tech.<id>, time.area.<workshop|basement|dunes>, time.god, time.surf
//   dist.*      metres         dist.total, dist.state.<..>, dist.surf, dist.swim, dist.up, dist.down
//   move.*      counts         move.jump, move.airjump, move.walljump, move.dash, move.slide, move.wallrun, move.mantle, move.land, move.roll ...
//   break.*     counts         break.total, break.kind.<kind>, break.cause.<cause>
//   clapper.*   counts         clapper.down, clapper.cause.<cause>
//   shot.*      counts         shot.fired, shot.hit, shot.charged, shot.air, shell.fire.<id>
//   lach.*      amounts        lach.spent, lach.spent.<tag>, lach.gain, lach.gain.<source>, lach.denied, lach.empty
//   god.*       counts         god.enter, god.grab, god.throw, god.sunder, god.cuts, god.manifest, god.raid, god.wave
//   surf.*      counts         surf.start, surf.pump, surf.hop, surf.trick, surf.spins, surf.wobble
//   circuit.<id>.*             runs, finish, clean, fall, gates, medal.<gold|silver|bronze>
//   records (hi/lo)            speed.max, speed.surf.max, air.longest, fall.max, slam.height, chain.max, ...
// ---------------------------------------------------------------------------------------
import { sfx } from './audio.js';
import { BY_ID } from './system/skills.js';
import { BY_SPECIES, ASPECTS } from './angling/species.js';
import { TIERS, CURIO_BY_ID, TITHE, hex } from './treasure.js';

const fx = (v, d = 2) => Number(v).toFixed(d);
import { ARCANA_BY_ID } from './veritome/arcana.js';
import { SUBJECTS } from './veritome/subjects.js';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

const CLAP_LINE = {
  shot: 'The clapperjar is defeated.', sliced: 'The clapperjar is cleaved in two.', cooked: 'The clapperjar is baked to a crisp.',
  splat: 'The clapperjar splats.', well: 'The clapperjar is crushed.', explosion: 'The clapperjar is blown apart.',
  charged: 'The clapperjar is vaporised.', ricochet: 'The clapperjar is defeated by a banked shot.', homing: 'The clapperjar is hunted down.',
  bashed: 'The clapperjar is bashed to pieces.', slam: 'The clapperjar is flattened.', brushed: 'The clapperjar is unwritten.', rend: 'The clapperjar is rent in two.',
  bolt: 'The clapperjar is struck by lightning.', plunged: 'The clapperjar is driven into the ground.',
  captured: 'The clapperjar is captured in a photograph.', judged: 'The raider is judged, and unwritten.',
};
const BRUSH_LINE = {
  still: (n) => `Your brush holds ${n === 1 ? 'it' : plural(n, 'thing')} still.`,
  bounce: (n) => `Your brush makes ${n === 1 ? 'it' : plural(n, 'thing')} spring.`,
  mend: (n) => `Your brush makes ${plural(n, 'thing')} whole.`,
  ember: (n) => `Your brush sets ${n === 1 ? 'an ember' : `${n} embers`} smouldering.`,
  gale: (n) => (n ? `A gale answers your brush and scatters ${plural(n, 'thing')}.` : 'A gale answers your brush.'),
  bolt: (n) => (n ? `Lightning answers your brush and stuns ${plural(n, 'clapperjar')}.` : 'Lightning answers your brush.'),
  light: (n) => (n ? `Your brush makes ${n === 1 ? 'it' : plural(n, 'thing')} light.` : 'Your brush lifts you.'),
  heavy: (n) => (n ? `Your brush makes ${n === 1 ? 'it' : plural(n, 'thing')} heavy.` : 'Your brush drives you down.'),
  solace: (n) => (n > 1 ? `${n} clapperjars forget themselves and dance.` : n ? 'A clapperjar forgets itself and dances.' : 'The vessel is soothed.'),
  wash: () => 'You lay slip across the world.',
};
const BRUSH_NAME = { still: 'Still', bounce: 'Bounce', mend: 'Mend', ember: 'Ember', gale: 'Gale', bolt: 'Bolt', light: 'Light', heavy: 'Heavy', solace: 'Solace', wash: 'wash' };
const MEDAL = { GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze' };

export class Tracking {
  constructor(game) {
    this.game = game;
    this.L = game.ledger;
    this.log = game.log;
    this.state = ''; this.stateT = 0;
    this.prev = null;
    this.air = { t: 0, from: 0, peak: 0, on: false };
    this.chain = { n: 0, t: -9 };
    this.pending = new Map(); // record announcements waiting for a lull
    this.roomT = 0;
    this.last = { shots: 0, hits: 0 };
    this._lg = 0; this._lgT = -9;
    this.listen();
  }

  // ---------------------------------------------------------------- what is said about a record, once it settles
  note(key, res, text, min = 0, v = 0) {
    if (res === 'beat' && v >= min) this.pending.set(key, { text, t: 2.2 });
    else if (this.pending.has(key) && res) this.pending.get(key).text = text;
  }

  // ---------------------------------------------------------------- events
  listen() {
    const g = this.game, ev = g.events, L = this.L, log = this.log;
    const on = (n, f) => ev.on(n, f);
    const first = (key, text) => { if (L.first(key)) log.say('record', text); };

    // ---- breaking
    on('break', (e) => {
      if (e.target) { L.inc('target.break'); return; }
      // (whose doing it was: only the Courier's are the Courier's records; the rest are said as what they were)
      if (e.by && e.by !== 'courier') {
        L.inc(`break.by.${e.by}`);
        const who = e.by === 'clapperjar' ? 'A clapperjar shatters' : null;
        if (who) log.say('other', `${who} the ${e.kind}.`, { key: `brc.${e.kind}`, win: 0.9, fmt: (n) => `${who} ${plural(n, e.kind)}.` });
        else log.say('other', `The ${e.kind} breaks.`, { key: `bre.${e.kind}`, win: 0.9, fmt: (n) => n > 1 ? `${plural(n, e.kind)[0].toUpperCase()}${plural(n, e.kind).slice(1)} break.` : `The ${e.kind} breaks.` });
        return;
      }
      L.inc('break.total'); L.inc(`break.kind.${e.kind}`); L.inc(`break.cause.${e.cause || 'shot'}`);
      const c = this.chain;
      c.n = e.t - c.t < 0.45 ? c.n + 1 : 1; c.t = e.t;
      if (c.n >= 2) { const r = L.hi('chain.max', c.n, { at: this.where() }); if (r === 'beat' && c.n >= 6) this.pending.set('chain.max', { text: `Your longest chain is now ${c.n}.`, t: 1.2 }); }
      if (c.n >= 3) log.say('battle', `You chain ${c.n} breaks.`, { key: 'chain', win: 0.6, fmt: () => `You chain ${this.chain.n} breaks.` });
      else log.say('battle', `You shatter the ${e.kind}.`, { key: `br.${e.kind}`, win: 0.9, fmt: (n) => `You shatter ${plural(n, e.kind)}.` });
      first(`kind.${e.kind}`, `Logged: your first ${e.kind} broken.`);
    });
    on('room.cleared', () => {
      L.inc('room.cleared');
      const r = L.lo('room.clear.time', this.roomT, { at: this.where() });
      log.say('explore', `Every pot in the workshop is broken (${clock(this.roomT)}${r === 'beat' || r === 'new' ? ', a best' : ''}). Press T to set the room again.`);
    });
    on('room.reset', () => { this.roomT = 0; L.inc('room.reset'); });
    on('clapper.down', (e) => {
      L.inc('clapper.down'); L.inc(`clapper.cause.${e.cause}`);
      if (e.raider) L.inc('clapper.raider');
      const c = this.chain;
      c.n = e.t - c.t < 0.45 ? c.n + 1 : 1; c.t = e.t;
      if (c.n >= 2) L.hi('chain.max', c.n, { at: this.where() });
      log.say('battle', CLAP_LINE[e.cause] || CLAP_LINE.shot, { key: 'clap', win: 1.2, fmt: (n) => `${n} clapperjars are defeated.` });
      first(`clapper.${e.cause}`, `Logged: a clapperjar ${e.cause === 'shot' ? 'shot down' : `taken by ${e.cause}`} for the first time.`);
    });

    // ---- the gun and its shells
    on('shot', (e) => { L.inc('shot.fired'); if (e.charged) L.inc('shot.charged'); if (e.air) L.inc('shot.air'); });
    on('weapon.charged', () => L.inc('shot.fullcharge'));
    on('shell.fire', (e) => { L.inc(`shell.fire.${e.id}`); L.inc('shell.fire'); if (e.air) L.inc('shell.air'); first(`shell.${e.id}`, `Logged: your first ${e.id} shell.`); });
    on('shell.dry', () => L.inc('shell.dry'));
    on('shell.refill', (e) => { L.inc('shell.refill'); L.inc('shell.received', e.got); log.say('gain', `You receive ${plural(e.got, 'shell')}.`, { key: 'refill', win: 4 }); });
    on('shell.slice', (e) => { L.inc('shell.slice.cuts', e.cuts); L.hi('shell.slice.best', e.cuts); if (e.cuts >= 3) log.say('battle', `Your cleave cuts through ${e.cuts} things.`); });
    on('shell.mark', (e) => { L.inc('shell.mark.targets', e.n); L.hi('shell.mark.best', e.n); log.say('battle', `You mark ${plural(e.n, 'target')}.`, { key: 'mark', win: 1 }); });
    on('shell.bank', (e) => { L.inc('shell.bank'); L.hi('shell.bank.best', e.bounces); log.say('battle', `Your bank shot ricochets ${e.bounces} times before it lands.`); });
    on('target.hit', (e) => {
      L.inc('target.hit');
      if (e.drop > 5) L.hi('target.drop', e.drop);
      if (e.moving) L.inc('target.moving');
      if (e.drop > 5 || e.moving) log.say('battle', `You strike the target${e.drop > 5 ? ` from ${Math.round(e.drop)} m up` : ''}${e.moving ? ' as it moves' : ''}.`, { key: 'tgt', win: 0.5 });
    });
    on('slip.splat', () => L.inc('slip.splat'));

    // ---- lachryma (the pool has its own listeners)
    const P = g.lachryma;
    if (P) {
      P.on('spend', (e) => { L.inc('lach.spent', e.amount); L.inc(`lach.spent.${e.tag}`, e.amount); L.inc('lach.spend.count'); });
      P.on('gain', (e) => {
        L.inc('lach.gain', e.amount); L.inc(`lach.gain.${e.source}`, e.amount);
        if (e.source === 'regen') return;
        const sum = (this._lg = (this._lgT > L.play - 2.5 ? this._lg : 0) + e.amount); this._lgT = L.play; // (folded into one line)
        log.say('gain', `You absorb ${Math.round(sum)} lachryma.`, { key: 'lgain', win: 2.5, fmt: () => `You absorb ${Math.round(this._lg)} lachryma.` });
      });
      P.on('denied', () => { L.inc('lach.denied'); log.say('warn', 'You do not have enough lachryma.', { key: 'lden', throttle: 2.5 }); });
      P.on('empty', () => { L.inc('lach.empty'); log.say('warn', 'Your lachryma is depleted.', { key: 'lemp', throttle: 8 }); });
      P.on('full', () => L.inc('lach.full'));
      P.on('overflow', (e) => L.inc('lach.overflow', e.amount));
    }

    // ---- ground movement (the player reports these)
    on('jump', (e) => { L.inc('move.jump'); L.inc(`move.jump.${e.kind}`); if (e.kind === 'air') L.inc('move.airjump'); if (e.kind === 'wall') L.inc('move.walljump'); });
    on('dash', (e) => { L.inc('move.dash'); L.hi('dash.speed', e.speed); });
    on('slide.start', () => L.inc('move.slide'));
    on('slide.end', (e) => { L.inc('slide.time', e.dur); L.inc('slide.dist', e.dist || 0); L.hi('slide.longest', e.dist || 0); L.hi('slide.longest.time', e.dur); });
    on('wallrun.start', () => L.inc('move.wallrun'));
    on('wallrun.end', (e) => { L.inc('wallrun.dist', e.dist || 0); L.hi('wallrun.longest', e.dist || 0); L.hi('wallrun.longest.time', e.dur); });
    on('mantle', (e) => { L.inc('move.mantle'); L.hi('mantle.height', e.height); });
    on('land', (e) => {
      L.inc('move.land');
      const drop = e.drop || 0;
      if (drop > 0.5) { const r = L.hi('fall.max', drop, { at: this.where() }); this.note('fall.max', r, `Your longest fall is now ${Math.round(drop)} m.`, 12, drop); }
      if (drop >= 10) log.say('move', `You land from a ${Math.round(drop)} m fall.`, { key: 'land', win: 1 });
      if (e.air > 0.3) { const r = L.hi('air.longest', e.air, { at: this.where() }); this.note('air.longest', r, `Your longest airtime is now ${fx(e.air, 1)} s.`, 2.5, e.air); }
    });
    on('dodge', (e) => { L.inc('move.roll'); if (e.mitigated) { L.inc('roll.fall'); L.hi('roll.fall.height', e.fall || 0); log.say('move', 'You roll out of the fall.', { key: 'roll', win: 1.5 }); } });
    on('impulse', (e) => { L.inc(`impulse.${e.why}`); });
    on('respawn', (e) => { L.inc('respawn'); L.inc(`respawn.${e.why}`); });
    on('guard', (e) => L.inc(`guard.${e.kind}`));
    on('mover.leave', (e) => { L.inc('move.mover.leave'); L.hi('mover.leave.speed', e.speed); });
    on('mover.push', () => L.inc('mover.push'));
    on('updraft.enter', () => L.inc('updraft.enter'));

    // ---- the movement arts
    on('tech.start', (e) => { L.inc(`tech.start.${e.id}`); first(`tech.${e.id}`, `Logged: your first use of ${BY_ID[e.id]?.name || e.id}.`); });
    on('tech.end', (e) => { L.inc(`time.tech.${e.id}`, e.dur || 0); L.hi(`tech.longest.${e.id}`, e.dur || 0); });
    on('blink', () => L.inc('move.blink'));
    on('slam.impact', (e) => {
      L.inc('move.slam'); if (e.target) L.inc('slam.target');
      const r = L.hi('slam.height', e.height, { at: this.where() });
      this.note('slam.height', r, `Your highest slam is now ${e.height.toFixed(0)} m.`, 12, e.height);
      if (!e.target && e.height > 6) log.say('move', `You slam into the ground from ${e.height.toFixed(0)} m.`, { key: 'slam', win: 1.2 });
      else if (e.target) log.say('battle', 'Your slam strikes the target.', { key: 'slamt', win: 1.2 });
    });
    on('stomp', (e) => { L.inc('move.stomp'); L.inc(`stomp.${e.what}`); log.say('move', `You stomp on the ${e.what}.`, { key: 'stomp', win: 1.5, fmt: (n) => `You stomp on the ${e.what} (×${n}).` }); });
    on('kick.swing', () => L.inc('kick.swing'));
    on('kick', (e) => { L.inc('kick.hit', e.hits); L.hi('kick.best', e.hits); if (e.hits >= 2) log.say('battle', `Your kick strikes ${e.hits} targets.`, { key: 'kick', win: 1 }); });
    on('parry', (e) => { L.inc('move.parry'); L.hi('parry.speed', e.speed); log.say('battle', 'You parry the shot.', { key: 'parry', win: 1 }); });
    on('recoil.jump', (e) => { L.inc('move.recoil'); if (e.charged) L.inc('recoil.charged'); L.hi('recoil.up', e.up); });
    for (const k of ['hang.start', 'hang.pullup', 'latch.start', 'pole.start', 'grate.start', 'balance.start', 'push.start', 'carry.lift', 'carry.put']) on(k, () => L.inc(`move.${k}`));
    on('push.move', (e) => L.inc('push.dist', e.dist));
    on('throw', (e) => { L.inc('move.throw'); L.hi('throw.speed', e.speed); });
    on('throw.hit', (e) => { L.inc('throw.hit'); L.inc(`throw.hit.${e.kind}`); });
    on('lob.fire', () => L.inc('lob.fire'));
    on('lob.dodged', () => { L.inc('lob.dodged'); log.say('move', 'You dodge the incoming lob.', { key: 'lob', win: 2 }); });
    on('lob.hit', () => { L.inc('lob.hit'); log.say('hurt', 'You are struck by a lob.', { key: 'lobh', win: 2 }); });
    on('groove.open', () => L.inc('cast.groove'));
    on('anchor', () => L.inc('cast.anchor'));
    on('hatch', () => { L.inc('cast.hatch'); log.say('art', 'You hatch a clapperjar.', { key: 'hatch', win: 1.5 }); });
    on('befriend', (e) => { L.inc('cast.befriend'); if (!e.born) log.say('art', 'The clapperjar is turned to your side.', { key: 'turn', win: 1.5 }); });

    // ---- the Solar Skiff
    on('dunes.barrier', () => L.inc('dunes.barrier')); // (the edge of the sea touched: counted, not said)
    on('cleave.cut', (e) => { L.inc('cleave.cut'); if (e.what === 'ruin') L.inc('cleave.ruin'); });
    on('surf.start', () => { L.inc('surf.start'); log.say('surf', 'The Solar Skiff unfurls.', { key: 'sst', throttle: 3 }); });
    on('surf.pump', () => L.inc('surf.pump'));
    on('surf.hop', () => L.inc('surf.hop'));
    on('surf.tick', (e) => { const r = L.hi('speed.surf.max', e.speed, { at: this.where() }); this.note('speed.surf.max', r, `Your top skiffing speed is now ${fx(e.speed, 1)} m/s.`, 14, e.speed); });
    on('surf.trick', (e) => {
      const n = Math.round(e.turns);
      L.inc('surf.trick'); L.inc('surf.spins', n); L.hi('surf.spin.best', n);
      log.say('surf', n >= 3 ? `You land a triple spin.` : n === 2 ? 'You land a double spin.' : 'You land a spin.', { key: 'spin', win: 1 });
    });
    on('surf.wobble', () => { L.inc('surf.wobble'); log.say('warn', 'You lose your balance on the board.', { key: 'wob', throttle: 3 }); });

    // ---- the hand
    on('god.enter', () => { L.inc('god.enter'); log.say('god', 'You take the hand.'); });
    on('god.exit', () => { L.inc('god.exit'); log.say('god', 'You return to the Courier.'); });
    on('god.grab', (e) => { L.inc('god.grab'); if (e.clapper) L.inc('god.grab.clapper'); });
    on('god.throw', (e) => { L.inc('god.throw'); L.hi('god.throw.speed', e.speed); });
    on('god.select', (e) => L.inc(`god.select.${e.id}`));
    on('god.sunder', (e) => { L.inc('god.sunder'); L.inc('god.cuts', e.cuts); L.hi('god.cuts.best', e.cuts); log.say('god', e.cuts ? `Your blade cleaves ${plural(e.cuts, 'clapperjar')}.` : 'The blade finds nothing.', { key: 'sund', win: 1 }); });
    on('god.manifest', (e) => { L.inc('god.manifest'); L.hi('god.manifest.len', e.len); log.say('god', 'You raise a wall of clay.', { key: 'mani', win: 1.5 }); });
    on('god.raid', (e) => { L.inc('god.raid'); L.hi('god.wave.max', e.wave); log.say('god', `Raid, wave ${e.wave}: ${plural(e.n, 'clapperjar')} approach.`); });
    on('god.wave', (e) => { L.inc('god.wave'); log.say('god', `Wave ${e.wave} is cleared.`); });
    on('vessel.hit', (e) => { L.inc('vessel.hit'); L.inc('vessel.damage', e.amount || 0); L.inc(`vessel.hit.${e.kind}`); });
    on('vessel.shatter', () => { L.inc('vessel.shatter'); log.say('hurt', 'The vessel shatters!'); });
    on('vessel.reforge', () => { L.inc('vessel.reforge'); log.say('god', 'The vessel is reforged.'); });

    // ---- maps
    on('map.pulse', (e) => { L.inc('map.pulse'); if (e.god) L.inc('map.pulse.god'); });
    on('map.surveyed', (e) => { L.inc('map.cells', e.gained); if (e.gained > 0) log.say('explore', `Your survey charts ${plural(e.gained, 'new area')}.`, { key: 'sv', win: 2 }); });
    on('map.room', (e) => { L.inc('map.room'); if (L.first(`room.${e.id}`)) log.say('explore', `You have charted ${e.place}.`); });

    // ---- the basement course, circuits, the trial
    on('course.station', (e) => { L.inc('course.station'); L.first(`station.${e.room}`); log.say('circuit', `You take up ${e.title} (${e.room}).`, { key: 'stn', win: 1 }); });
    on('course.split', (e) => {
      L.inc('course.split'); L.lo(`course.room.${e.room}`, e.time);
      log.say('circuit', `${e.room}: ${fx(e.time)} s${e.pb ? ' (a best)' : e.best ? ` (best ${fx(e.best)} s)` : ''}.`);
    });
    on('course.lap', (e) => { L.inc('course.lap'); const r = L.lo('course.lap.time', e.time); log.say('circuit', `Lap complete: ${fx(e.time)} s${e.pb || r === 'beat' ? ' — a new best' : ''}.`); });
    on('course.reset', () => L.inc('course.reset'));
    on('course.gate', (e) => { L.inc('course.gate'); L.hi('course.gate.speed', e.speed); log.say('circuit', `Speed gate: ${fx(e.speed, 1)} m/s.`, { key: 'gate', win: 0.8 }); });
    on('circuit.enter', (e) => { L.inc(`circuit.${e.id}.enter`); L.inc('circuit.enter'); log.say('circuit', `You enter ${e.title}.`); });
    on('circuit.gate', (e) => {
      L.inc('circuit.gate');
      log.say('circuit', `${e.label}: ${fx(e.time)} s${e.delta != null ? ` (${e.delta >= 0 ? '+' : '−'}${fx(Math.abs(e.delta))})` : ''}${e.slow ? ' Too slow, +1 s.' : ''}`);
      if (e.slow) L.inc('circuit.slow');
    });
    on('circuit.fall', (e) => { L.inc('circuit.fall'); L.inc(`circuit.${e.id}.fall`); log.say('warn', 'You fall. +3 s.'); });
    on('circuit.finish', (e) => {
      const id = e.id;
      L.inc('circuit.finish'); L.inc(`circuit.${id}.finish`);
      if (e.clean) { L.inc('circuit.clean'); L.inc(`circuit.${id}.clean`); }
      const m = MEDAL[e.medal]; if (m) { L.inc(`circuit.medal.${m}`); L.inc(`circuit.${id}.medal.${m}`); }
      if (m === 'gold' && e.clean) L.inc('circuit.goldclean');
      const r = L.lo(`circuit.${id}.time`, e.time, { clean: e.clean });
      if (e.clean) L.lo(`circuit.${id}.time.clean`, e.time);
      log.say('circuit', `${e.title} complete: ${fx(e.time)} s${m ? ` (${m})` : ''}${e.clean ? ', clean' : ''}${e.pb || r === 'beat' ? '. A new personal best!' : '.'}`);
    });
    on('trial.start', () => { L.inc('trial.start'); log.say('circuit', 'The trial begins.'); });
    on('trial.jar', (e) => {
      L.inc('trial.jar'); if (e.quick) L.inc('trial.quick');
      log.say('circuit', `Lantern ${e.n}/${e.of} (${clock(e.time)})${e.quick ? '. Quick double, −1 s' : ''}.`, { key: 'tj', win: 0.2 });
    });
    on('trial.finish', (e) => {
      L.inc('trial.finish'); const m = MEDAL[e.medal]; if (m) L.inc(`trial.medal.${m}`);
      const r = L.lo('trial.time', e.time);
      log.say('circuit', `Trial complete: ${clock(e.time)}${m ? ` (${m})` : ''}${e.pb || r === 'beat' ? '. A new personal best!' : '.'}`);
    });


    // ---- the Veritome: photographs, the Book, the cards (src/moves/veritome.js, src/veritome/)
    const CARD = (id) => ARCANA_BY_ID[id]?.name.replace(/^THE /, 'The ').toLowerCase().replace(/(^|\s)\w/g, (m) => m.toUpperCase()) || id;
    on('veritome.draw', () => { L.inc('veritome.draw'); log.say('info', 'You open the Veritome.', { key: 'vdraw', throttle: 2 }); });
    on('veritome.lens', () => L.inc('veritome.lens'));
    on('photo.take', (e) => {
      L.inc('photo.take'); L.inc(`photo.kind.${e.kind}`); L.inc(`photo.stars.${e.stars}`); L.hi('photo.stars.best', e.stars); L.hi('photo.kinds.best', e.kinds);
      first('photo', 'Logged: your first photograph.');
      if (e.fatal === 'held') { L.inc('photo.held'); log.say('battle', 'The photograph holds the clapperjar to what is real.', { key: 'phheld', throttle: 1 }); }
      if (e.fatal === 'captured') { L.inc('photo.captured'); first('photo.captured', 'Logged: a clapperjar taken whole at the shutter chance.'); }
      if (e.unwritten) { L.inc('photo.unwritten', e.unwritten); log.say('info', `The photograph shows ${e.unwritten === 1 ? 'a thing' : `${e.unwritten} things`} as they truly are.`, { key: 'phtrue', throttle: 1 }); }
      const what = e.kind === 'nothing' ? null : e.kind === 'sky' ? 'the open sky' : e.kind === 'sun' ? 'the sun' : (SUBJECTS[e.kind]?.name ? `${'aeiou'.includes(SUBJECTS[e.kind].name[0]) ? 'an' : 'a'} ${SUBJECTS[e.kind].name}` : e.kind);
      log.say('info', what ? `You photograph ${what} (${'★'.repeat(e.stars || 1)}).` : 'You photograph nothing in particular.', { key: 'photo', throttle: 0.4 });
    });
    on('card.get', (e) => {
      L.inc('card.get'); L.inc(`card.got.${e.card}`); if (e.page) L.inc('card.pages');
      log.say('gain', e.page ? `${CARD(e.card)} is bound into the Book (rank ${e.rank}).` : `A copy of ${CARD(e.card)} is bound into the Book.`, { key: `cget.${e.card}`, throttle: 1 });
      if (e.page) first(`card.${e.card}`, `Logged: ${CARD(e.card)}, page ${ARCANA_BY_ID[e.card].roman}.`);
    });
    on('card.drift', (e) => log.say('info', `Another ${CARD(e.card)}; the Book has no room for it, and it drifts away.`, { key: `cdrift.${e.card}`, throttle: 4 }));
    on('card.draw', (e) => { L.inc('card.draw'); log.say('info', `You draw ${CARD(e.card)}.`, { key: 'cdraw', throttle: 0.3 }); });
    on('card.redraw', (e) => { L.inc('card.redraw'); log.say('info', `You draw again: ${CARD(e.card)}.`, { key: 'cdraw', throttle: 0.3 }); });
    on('card.gain', (e) => { L.inc('card.gain'); log.say('info', `Gain: ${CARD(e.card)} is taken from the Book into your hand.`, { key: 'cgain', throttle: 0.3 }); });
    on('card.play', (e) => {
      L.inc('card.play'); L.inc(`card.play.${e.card}`); L.inc(`card.seal.${e.seal}`);
      first('card.play', 'Logged: your first card played.');
      log.say('battle', `You play ${CARD(e.card)}. ${ARCANA_BY_ID[e.card]?.effect || ''}`, { key: 'cplay', throttle: 0.2 });
    });
    on('card.echo', (e) => log.say('battle', `The wheel turns to ${CARD(e.card)}.`, { key: 'cecho', throttle: 0.2 }));
    on('card.fade', (e) => log.say('other', `${CARD(e.card)} fades.`, { key: `cfade.${e.card}`, throttle: 1 }));
    on('card.luck', (e) => { L.inc('card.luck'); log.say('gain', `Fortune turns: the chest comes up ${e.tier}.`, { key: 'cluck', throttle: 1 }); });
    on('card.astrodyne', (e) => { L.inc('card.astrodyne'); L.inc(`card.astrodyne.${e.kinds}`); log.say('battle', e.kinds >= 3 ? 'Astrodyne: three seals, and the mind blazes.' : e.kinds === 2 ? 'Astrodyne: two seals, and the mind quickens.' : 'Astrodyne: the clasp is spent.', { key: 'cdyne', throttle: 0.5 }); });

    // ---- the Soul Brush: the club, the brush slide, the Celestial Brush, the sigils (src/moves/soulbrush.js, src/brush/)
    on('brush.draw', () => { L.inc('brush.draw'); log.say('info', 'You draw the Soul Brush.', { key: 'bdraw', throttle: 2 }); });
    on('brush.stow', () => L.inc('brush.stow'));
    on('brush.swing', (e) => { L.inc('brush.swing'); if (e.slam) L.inc(e.air ? 'brush.slam.dive' : 'brush.slam.swing'); });
    on('brush.flick', () => L.inc('brush.flick'));
    on('brush.hit', (e) => {
      L.inc('brush.hit'); L.inc(`brush.hit.${e.what}`);
      if (e.stun) L.inc('brush.stun');
      if (e.bat) { L.inc('brush.bat'); log.say('battle', 'You bat the clapperjar away.', { key: 'bbat', win: 1, fmt: (n) => `You bat ${plural(n, 'clapperjar')} away.` }); }
      else if (e.what === 'pot') log.say('battle', 'You club the pot.', { key: 'bpot', win: 0.9, fmt: (n) => `You club ${plural(n, 'pot')}.` });
    });
    on('brush.slam', (e) => {
      L.inc('brush.slam'); L.hi('brush.slam.power', e.power); if (e.air) L.inc('brush.slam.air');
      if (e.big) { first('brush.slam', 'Logged: your first brush slam.'); log.say('battle', e.air ? 'You come down with the brush, and the ground answers.' : 'You bring the brush down.', { key: 'bslam', throttle: 1.5 }); }
    });
    on('brush.slide', (e) => {
      if (e.phase !== 'end') return;
      L.inc('brush.slide'); L.inc('brush.slide.dist', e.dist); L.hi('brush.slide.best', e.dist, { at: this.where() });
      first('brush.slide', 'Logged: your first brush slide.');
      if (e.dist >= 8) log.say('move', `You paint ${Math.round(e.dist)} m of slip behind you.`, { key: 'bslide', throttle: 2 });
    });
    on('brush.canvas', (e) => {
      if (!e.open) { L.hi('brush.drawings.best', e.drawings); return; }
      L.inc('brush.canvas');
      first('brush.canvas', 'Logged: your first time at the Celestial Brush.');
      log.say('info', 'The world stills, and becomes paper.', { key: 'bcanvas', throttle: 6 });
    });
    on('brush.read', (e) => { L.inc('brush.read'); L.inc(`brush.read.${e.technique}`); if (e.strokes > 1) L.inc('brush.read.multi'); });
    on('brush.miss', () => L.inc('brush.miss'));
    on('inscribe', (e) => { L.inc('inscribe'); L.inc(`inscribe.${e.prop}`); });
    on('brush.glyph', (e) => {
      L.inc(`brush.tech.${e.technique}`); L.inc('brush.tech');
      if (e.technique !== 'wash') first(`brush.tech.${e.technique}`, `Logged: your first ${BRUSH_NAME[e.technique]}.`);
      const line = BRUSH_LINE[e.technique];
      if (line) log.say('battle', line(e.n), { key: `bt.${e.technique}`, throttle: 0.8 });
    });
    on('sigil.pop', (e) => {
      L.inc('sigil.pop', e.popped); L.inc(`sigil.pop.${e.sigil}`, e.popped);
      if (e.cleared) { L.inc('sigil.cleared', e.cleared); L.hi('sigil.cleared.best', e.cleared); first('sigil.cleared', 'Logged: your first clapperjar unwritten.'); }
      log.say('battle', e.cleared ? `You unwrite ${plural(e.cleared, 'clapperjar')}.` : `Your mark lifts ${plural(e.popped, 'sigil')}.`, { key: 'sigil', win: 0.6 });
    });

    // ---- the Sondelass: the tool, the cutlass, the grapnel (src/moves/sondelass.js)
    on('sondelass.draw', () => { L.inc('sondelass.draw'); log.say('info', 'You draw the Sondelass.', { key: 'sdraw', throttle: 2 }); });
    on('sondelass.stow', () => L.inc('sondelass.stow'));
    on('sondelass.form', (e) => {
      L.inc(`sondelass.form.${e.form}`);
      log.say('info', e.form === 'rod' ? 'The Sondelass telescopes out into a rod.' : e.form === 'hook' ? 'The Sondelass shortens, and a grapnel seats at its tip.' : 'The Sondelass draws in, and a blade slides from its tip.', { key: 'sform', throttle: 0.6 });
      first(`sondelass.${e.form}`, `Logged: your first time using the Sondelass as a ${e.form === 'hook' ? 'grapnel' : e.form}.`);
    });
    on('cut.swing', (e) => { L.inc('cut.swing'); if (e.n >= 2) { L.inc('cut.combo'); log.say('battle', 'You finish a three-stroke combination.', { key: 'combo', throttle: 1.5 }); } });
    on('cut.stinger', (e) => { L.inc('cut.stinger'); L.inc('cut.swing'); if (e.locked) L.inc('cut.stinger.locked'); first('cut.stinger', 'Logged: your first Stinger.'); log.say('battle', 'You drive the Stinger.', { key: 'sting', throttle: 1.5 }); });
    on('blade.enter', () => { L.inc('blade.enter'); first('blade', 'Logged: your first time in Blade Mode.'); log.say('battle', 'The world slows to the edge of your blade.', { key: 'blade', throttle: 4 }); });
    on('blade.cut', (e) => { L.inc('blade.cut'); if (e.pieces) L.inc('blade.pieces', e.pieces); });
    on('blade.zandatsu', () => { L.inc('blade.zandatsu'); first('zandatsu', 'Logged: your first zandatsu.'); log.say('battle', 'Zandatsu: you cut the clapperjar apart and take its core.', { key: 'zan', throttle: 2 }); });
    on('blade.exit', (e) => { L.hi('blade.cuts.best', e.cuts); });
    on('lock.on', () => { L.inc('lock.on'); first('lock', 'Logged: your first lock-on.'); });
    on('guard.up', () => L.inc('guard.up'));
    on('guard.block', () => { L.inc('guard.block'); log.say('battle', 'You turn the shot aside on your blade.', { key: 'gblock', win: 1 }); });
    on('cut.hit', (e) => {
      L.inc('cut.hit'); L.inc(`cut.hit.${e.what}`);
      const w = e.what === 'clapper' ? 'clapperjar' : 'pot';
      log.say('battle', `You slash the ${w}.`, { key: `cut.${w}`, win: 0.9, fmt: (n) => `You slash ${plural(n, w)}.` });
    });
    on('hook.fire', (e) => { L.inc('hook.fire'); L.inc(`hook.${e.kind}`); if (e.kind === 'miss') log.say('info', 'The grapnel finds nothing.', { key: 'hmiss', throttle: 2 }); });
    on('hook.pull', (e) => { L.inc('hook.pull'); L.inc(`hook.pull.${e.what}`); L.hi('hook.pull.dist', e.dist); log.say('battle', `You bring the ${e.what === 'clapper' ? 'clapperjar' : e.what === 'breakable' ? 'pot' : 'prop'} to you.`, { key: 'hpull', win: 1.2 }); });
    on('hook.fling', (e) => { L.inc('hook.fling'); L.hi('hook.fling.speed', e.speed); log.say('battle', `You let go, and the ${e.what === 'clapper' ? 'clapperjar' : e.what === 'breakable' ? 'pot' : 'prop'} flies.`, { key: 'hfling', win: 1.2 }); });
    on('grapple.attach', (e) => {
      L.inc('grapple.attach'); L.inc(`grapple.attach.${e.kind}`);
      log.say('move', e.kind === 'anchor' ? 'The grapnel bites. The line goes taut.' : `The grapnel bites into ${e.what === 'clapper' ? 'a clapperjar' : e.what === 'breakable' ? 'a pot' : 'something loose'}.`, { key: 'gatt', throttle: 1.2 });
    });
    on('grapple.release', (e) => {
      L.inc(`grapple.release.${e.how}`);
      if (e.how === 'tap' || e.how === 'snag' || e.how === 'far') log.say('move', e.how === 'snag' ? 'The line catches on a corner and comes away.' : e.how === 'far' ? 'The line runs out and comes away.' : 'You let go of the line.', { key: 'grel', throttle: 1.2 });
    });
    on('grapple.swing', (e) => {
      if (e.phase !== 'end') return;
      L.inc('grapple.swing.n'); L.inc('grapple.swing.time', e.t); L.hi('grapple.swing.peak', e.peak, { at: this.where() });
    });
    on('grapple.fling', (e) => { L.inc('grapple.fling'); L.hi('grapple.fling.speed', e.speed); });
    on('zip.start', (e) => { L.inc('zip.start'); L.inc('zip.dist', e.dist); L.hi('zip.longest', e.dist); });
    on('zip.end', (e) => {
      L.inc(`zip.${e.how}`);
      if (e.how === 'arrive') log.say('move', 'The line draws you to the anchor.', { key: 'zip', throttle: 1.5 });
      else log.say('move', 'You leap from the line.', { key: 'zip', throttle: 1.5 });
    });

    // ---- angling (src/angling/): the counts, and the FFXI/FFXIV-style lines of a fishing log
    const asp = (id) => ASPECTS.find((a) => a.id === id)?.name.toLowerCase() || id;
    on('angle.charge', () => L.inc('angle.charge'));
    on('angle.cast', (e) => {
      L.inc('angle.cast'); L.inc(`angle.cast.${e.aspect}`); if (e.water) L.inc('angle.cast.water'); if (e.lure) { L.inc(`angle.lure.${e.lure}`); if (e.lure.startsWith('curio.')) L.inc('angle.lure.curio'); } L.hi('angle.cast.dist', e.dist, { at: this.where() });
      log.say('angle', e.water ? `You cast your lure. It carries a mask of ${asp(e.aspect)}.` : 'You cast your lure. It lands on dry ground.', { key: 'cast', throttle: 0.5 });
    });
    on('lure.land', (e) => L.inc(e.water ? 'lure.land.water' : 'lure.land.ground'));
    on('angle.retrieve', () => { L.inc('angle.retrieve'); log.say('angle', 'You reel in the lure.', { key: 'ret', throttle: 1 }); });
    on('angle.twitch', () => { L.inc('angle.twitch'); log.say('angle', 'You twitch the lure.', { key: 'twitch', win: 4, fmt: (n) => `You twitch the lure (×${n}).` }); });
    on('angle.sound', (e) => { L.inc('angle.sound'); log.say('angle', e.stirred ? `You send a sounding into the water. ${e.stirred === 1 ? 'Something stirs.' : 'Things stir.'}` : 'You send a sounding into the water.', { key: 'sound', throttle: 2 }); });
    on('angle.lure', () => L.inc('angle.lure.change'));
    on('angle.nibble', (e) => { L.inc('angle.nibble'); log.say('angle', 'Something nibbles at the lure.', { key: 'nib', win: 5, fmt: () => 'Something nibbles at the lure.' }); });
    on('angle.bite', (e) => {
      L.inc('angle.bite'); L.inc(`angle.bite.${e.kind}`);
      log.say('angle', e.kind === 'gulp' ? 'Something takes the lure!!!' : e.kind === 'tug' ? 'Something tugs at your line!!' : 'You feel a light tug!');
    });
    on('angle.hookset', (e) => {
      L.inc('angle.hookset'); L.inc(`angle.hookset.${e.quality}`);
      log.say('angle', e.quality === 'perfect' ? 'You set the hook perfectly!' : e.quality === 'early' ? 'You set the hook, a little early.' : 'You set the hook, just in time.');
    });
    on('angle.miss', () => { L.inc('angle.miss'); log.say('warn', 'The lure comes away bare. Whatever it was has gone.'); });
    on('angle.reveal', () => L.inc('angle.reveal'));
    on('angle.notice', () => L.inc('angle.notice'));
    on('angle.warn', () => log.say('warn', 'The line trembles: something surfaces and shudders. Brace!', { key: 'awarn', throttle: 4 }));
    on('angle.thrash', () => L.inc('angle.thrash'));
    on('angle.bolt', () => { L.inc('angle.bolt'); log.say('angle', 'It bolts at the last moment!', { key: 'bolt', throttle: 3 }); });
    on('angle.breach', () => { L.inc('angle.breach'); log.say('god', 'The water tears open: something enormous breaches!', { key: 'breach', throttle: 4 }); });
    on('angle.spent', () => log.say('angle', 'It has stopped fighting.', { key: 'spent', throttle: 3 }));
    on('angle.mindgone', () => { L.inc('angle.mindgone'); log.say('warn', 'Your mind slips from the lure. The line goes slack.'); });
    on('angle.escape', (e) => {
      L.inc('angle.escape'); L.inc(`angle.escape.${e.why}`);
      if (e.species) L.inc(`fish.lost.${e.species}`);
      if (e.why === 'snap') log.say('hurt', 'The line snaps!');
      else if (e.why === 'spool') log.say('hurt', 'The line runs out and parts!');
      else if (e.why === 'slip') log.say('warn', 'The hook slips free. It is gone.');
      else if (e.why === 'stow') log.say('warn', 'You put the rod away. The line goes slack.');
      if (e.dur > 25) L.hi('fish.fight.longestlost', e.dur);
    });
    on('angle.catch', (e) => {
      const sp = BY_SPECIES[e.species];
      L.inc('fish.total'); L.inc(`fish.sp.${e.species}`); L.inc(`fish.cls.${e.cls}`); L.inc(`fish.aspect.${e.aspect}`); L.inc(`fish.tide.${e.tide}`); L.inc(`fish.hookset.${e.quality}`);
      L.inc('fish.kg', e.kg); L.inc('fish.cm', e.cm); L.inc('fish.fight.time', e.dur); L.inc(`fish.tier.${sp.tier}`);
      if (e.brace) L.inc('fish.braced'); if (e.peak < 0.9 && e.slackMax < 0.6) L.inc('fish.clean'); if (e.ans >= 0.8) L.inc('fish.wellread'); if (e.gave < 0.05) L.inc('fish.nogive');
      if (e.thrashes) L.inc('fish.thrashes', e.thrashes); if (e.legend) L.inc('fish.legend');
      const r = L.hi(`fish.cm.${e.species}`, e.cm, { at: e.tide }); L.hi(`fish.kg.${e.species}`, e.kg);
      L.hi('fish.fight.longest', e.dur); L.lo('fish.fight.shortest', e.dur); L.hi('fish.depth.max', e.depth); L.hi('fish.kg.max', e.kg); L.hi('fish.cm.max', e.cm);
      const cm = e.cm >= 100 ? `${(e.cm / 100).toFixed(2)} m` : `${e.cm.toFixed(1)} cm`;
      const art = sp.name.startsWith('The ') ? '' : /^[AEIOU]/i.test(sp.name) ? 'an ' : 'a ';
      log.say('angle', `You land ${art}${sp.name}! (${cm}, ${e.kg.toFixed(2)} kg)`);
      if (e.cls === 'giant') log.say('angle', `It is a giant of its kind.`);
      else if (e.cls === 'large') log.say('angle', `A fine, large one.`);
      if (e.first) log.say('record', `Logged: your first ${sp.name}. ${sp.blurb}`);
      else if (r === 'beat' || r === 'small') log.say('record', `A new record for the ${sp.name}: ${cm}.`);
      if (e.legend) log.say('god', 'The Drowned Lachryma comes apart in your hands, and the workshop is a little quieter.');
    });
    on('angle.mooch', (e) => { L.inc('angle.mooch'); L.inc(`angle.mooch.${e.echo}`); log.say('angle', `The lure carries an echo of ${BY_SPECIES[e.echo].name}.`); });
    on('angle.landed', (e) => L.inc('fish.lachryma', e.baubles));
    on('angle.tide', (e) => { L.inc('angle.tide'); L.inc(`angle.tide.${e.phase}`); if (e.near) log.say('angle', `The tide is ${e.phase === 'low' ? 'at its lowest' : e.phase === 'high' ? 'at the full' : e.phase}.`); });
    on('angle.legend', () => log.say('god', 'Something vast turns over in the Well.'));


    // ---- treasure (src/chests.js, ceremony.js, cubes.js): chests in five tiers, the cubes they hold, the curios, the Tithe
    // (the tier's colour is the line's colour: what kind of thing it was is read before the words are)
    const tone = (t) => hex(t === 4 ? 0xfff2c8 : TIERS[t].rgb);
    on('chest.open', (e) => {
      const t = TIERS[e.tier];
      L.inc('chest.open'); L.inc(`chest.open.${t.id}`); if (e.sealed) L.inc('chest.open.sealed'); if (e.kind === 'near') L.inc('chest.near');
      L.hi('chest.cubes.max', e.cubes, { at: this.where() });
      if (e.id && !L.has(`chest.${e.id}`)) L.first(`chest.${e.id}`);
      log.say('loot', e.sealed ? `The sealed chest was ${an(t.name)} chest!` : `You open the ${t.name} chest.`, { tone: tone(e.tier) });
      log.say('loot', `It holds ${plural(e.cubes, 'Lachryma cube')}.`, { tone: '#ffd98a' });
      if (e.sealed && e.kind === 'near') log.say('loot', 'So close to something better.', { tone: '#c9b48a' });
      if (e.tier === 4) log.say('ach', 'The lights go out. The chest has a great deal to say.', {});
    });
    on('cube.earn', (e) => { L.inc(`cube.src.${e.why}`, e.n); });
    on('cube.spend', (e) => { L.inc(`cube.use.${e.why}`, e.n); });
    on('cube.spill', (e) => { L.inc(`cube.spill.${e.from}`, e.n); if (e.from === 'zandatsu') log.say('loot', `The core condenses into ${plural(e.n, 'Lachryma cube')}.`, { key: 'zcube', win: 1.2, fmt: () => 'The cores condense into cubes.' }); });
    on('curio.get', (e) => {
      const c = CURIO_BY_ID[e.id], t = TIERS[c.tier];
      if (e.dupe) { L.inc('curio.dupe'); log.say('loot', `You already have the ${c.name}. It condenses into cubes.`, { tone: tone(c.tier) }); return; }
      L.inc('curio.total'); L.inc(`curio.tier.${t.id}`);
      log.say('loot', `You obtain the ${c.name}!`, { tone: tone(c.tier) });
      if (L.first(`curio.first.${e.id}`)) log.say('record', `Logged: the ${c.name}. ${c.blurb}`);
    });
    on('tithe.pull', () => { L.inc('tithe.count'); log.say('loot', `You feed the Tithe ${plural(TITHE.cost, 'cube')}. A sealed chest falls onto the dais.`, { tone: '#d6c8ff' }); });
    on('chest.drop', (e) => { L.inc('chest.drop'); if (e.from === 'catch') log.say('loot', 'A chest falls out of the air.', { tone: tone(e.tier) }); });
    on('rave.start', () => L.inc('rave.count'));

    // ---- the System: what has been learned
    on('system.unlock', (e) => {
      if (g.system?.lab) return; // (Lab mode has everything: nothing to say)
      const a = BY_ID[e.ability];
      L.inc(e.variant ? 'art.variant' : a.realm === 'god' ? 'art.god' : 'art.move');
      log.say('art', e.variant ? `You learn the ${e.title} variant of ${a.name}. (B: the Codex)` : `You learn ${a.realm === 'god' ? 'the god art' : 'the art of'} ${e.title}. (B: the Codex)`);
      sfx.systemUnlock?.();
    });
  }

  // ---------------------------------------------------------------- helpers
  where() {
    const g = this.game;
    if (g.dunes?.active) return 'the dunes';
    if (g.circuits?.active) return g.circuits.run?.def?.name || 'a circuit';
    if (g.course?.inBasement?.()) return 'the basement';
    return 'the workshop';
  }

  moveState() {
    const g = this.game, P = g.player;
    if (g.god?.controlling) return 'god';
    const t = g.techs?.active?.id;
    if (t) return t;
    if (P.wallrun) return 'wallrun';
    if (P.sliding) return 'slide';
    if (P.mantle) return 'mantle';
    if (P.dashT > 0) return 'dash';
    if (!P.grounded) return 'air';
    if (P.crouching) return 'crouch';
    const sp = Math.hypot(P.vel.x, P.vel.z);
    if (sp < 0.3) return 'idle';
    return P.sprinting ? 'sprint' : P.walking ? 'walk' : 'run';
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.game, L = this.L, P = g.player;
    this.roomT += dt;
    const s = this.moveState();
    L.inc(`time.state.${s}`, dt);
    L.inc(`time.area.${this.where().replace('the ', '').replace(/^a /, '')}`, dt);
    if (g.god?.controlling) L.inc('time.god', dt);
    if (g.techs?.active?.id === 'surfer') L.inc('time.surf', dt);
    if (g.circuits?.active) L.inc('time.circuit', dt);
    const so = g.techs?.get('sondelass');
    if (g.techs?.get('soulbrush')?.toolOut) L.inc('time.soulbrush', dt);
    if (g.techs?.get('veritome')?.toolOut) L.inc('time.veritome', dt);
    if (so?.toolOut) { L.inc('time.sondelass', dt); if (so.form === 'rod') L.inc('time.rod', dt); if (so.angler?.state && so.angler.state !== 'idle') L.inc('time.angling', dt); if (so.angler?.state === 'fight') L.inc('time.fight', dt); }
    if (s !== this.state) { if (this.state && s !== 'idle') L.inc(`enter.${s}`); this.state = s; }

    // distance and speed (a jump of more than a few metres in a frame is a teleport, not travel)
    const at = g.god?.controlling ? null : P.pos;
    if (at) {
      if (this.prev) {
        const dx = at.x - this.prev.x, dz = at.z - this.prev.z, dy = at.y - this.prev.y, d = Math.hypot(dx, dz);
        if (d < 3 && Math.abs(dy) < 3) {
          L.inc('dist.total', d); L.inc(`dist.state.${s}`, d);
          if (dy > 0.001) L.inc('dist.up', dy); else if (dy < -0.001) L.inc('dist.down', -dy);
        }
      }
      (this.prev ||= at.clone()).copy(at);
      const sp = Math.hypot(P.vel.x, P.vel.z);
      if (sp > 5 && s !== 'surfer' && s !== 'grapple' && s !== 'launch' && !P.platform) { const r = L.hi('speed.max', sp, { at: this.where() }); this.note('speed.max', r, `Your top speed is now ${fx(sp, 1)} m/s.`, 10, sp); }
      L.hi('speed.any.max', Math.hypot(P.vel.x, P.vel.z, P.vel.y));
    } else this.prev = null;

    // shots and hits (the weapon keeps its own counts)
    const w = g.weapon;
    if (w) {
      if (w.hits > this.last.hits) L.inc('shot.hit', w.hits - this.last.hits);
      this.last.hits = w.hits; this.last.shots = w.shots;
    }

    // announcements that waited for a lull
    for (const [k, p] of this.pending) { p.t -= dt; if (p.t <= 0) { this.log.say('record', p.text, { key: `rec.${k}`, throttle: 6 }); this.pending.delete(k); } }
  }
}
