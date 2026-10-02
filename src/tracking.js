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
import { CARD as VCARD } from './veritome/cards.js';
import { CREATURES } from './veritome/bestiary.js';
import { FUNCTIONS } from './mind/functions.js';
import { SONGS } from './crucibelle/songs.js';
import { itemOf } from './pneuka/items.js';
import { LURES } from './angling/lures.js';
import { SUBJECTS } from './veritome/subjects.js';
import { EMOTES } from './emotes.js';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

const CLAP_LINE = {
  shot: 'The clapperjar is defeated.', sliced: 'The clapperjar is cleaved in two.', cooked: 'The clapperjar is baked to a crisp.',
  splat: 'The clapperjar splats.', well: 'The clapperjar is crushed.', explosion: 'The clapperjar is blown apart.',
  charged: 'The clapperjar is vaporised.', ricochet: 'The clapperjar is defeated by a banked shot.', homing: 'The clapperjar is hunted down.',
  bashed: 'The clapperjar is bashed to pieces.', slam: 'The clapperjar is flattened.', brushed: 'The clapperjar is unwritten.', rend: 'The clapperjar is rent in two.',
  bolt: 'The clapperjar is struck by lightning.', plunged: 'The clapperjar is driven into the ground.',
  judged: 'The raider is judged, and unwritten.',
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
    on('tech.start', (e) => { L.inc(`tech.start.${e.id}`); if (e.id !== 'emote' && e.id !== 'talk') first(`tech.${e.id}`, `Logged: your first use of ${BY_ID[e.id]?.name || e.id}.`); });
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


    // ---- the Veritome: the film, the darkroom, the bestiary, the Book (src/moves/veritome.js, src/veritome/)
    const CARD = (id) => VCARD[id]?.name || id;
    const subj = (k) => (k === 'nothing' ? null : k === 'sky' ? 'the open sky' : k === 'sun' ? 'the sun' : SUBJECTS[k]?.name ? an(SUBJECTS[k].name) : k);
    on('veritome.draw', () => { L.inc('veritome.draw'); log.say('info', 'You open the Veritome.', { key: 'vdraw', throttle: 2 }); });
    on('veritome.lens', () => L.inc('veritome.lens'));
    on('photo.take', (e) => {
      L.inc('photo.take'); L.inc(`photo.shot.${e.kind}`);
      first('photo', 'Logged: your first photograph. It waits on the film to be appraised (B, the Veritome).');
      if (e.held) { L.inc('photo.held'); if (e.held === 'chance') L.inc('photo.chance'); log.say('battle', e.held === 'chance' ? 'Shutter chance! The photograph holds the clapperjar fast to what is real.' : 'The photograph holds the clapperjar to what is real.', { key: 'phheld', throttle: 1 }); }
      if (e.unwritten) { L.inc('photo.unwritten', e.unwritten); log.say('info', `The photograph shows ${e.unwritten === 1 ? 'a thing' : `${e.unwritten} things`} as they truly are.`, { key: 'phtrue', throttle: 1 }); }
      if (e.left === 0) log.say('info', 'That was the last plate on the roll.', { key: 'filmlast', throttle: 5 });
    });
    on('photo.discard', (e) => L.inc('photo.discard', e.n));
    on('photo.appraise', (e) => {
      L.inc('photo.appraised'); L.inc(`photo.kind.${e.kind}`); L.inc(`photo.stars.${e.stars}`); L.hi('photo.stars.best', e.stars); L.hi('photo.kinds.best', e.kinds);
      if (e.entry && subj(e.kind)) log.say('record', `New in the Compendium: ${subj(e.kind)} (${'★'.repeat(e.stars || 1)}).`);
    });
    on('darkroom.develop', (e) => {
      L.inc('darkroom.batches'); L.hi('darkroom.batch.best', e.n);
      first('darkroom', 'Logged: your first roll appraised.');
      log.say('info', `You appraise ${plural(e.n, 'photograph')}: ${plural(e.entries, 'new entry').replace('entrys', 'entries')}, ${plural(e.facts, 'fact')}, ${plural(e.cards, 'card')}.`, {});
    });
    on('bestiary.fact', (e) => {
      L.inc('bestiary.facts'); L.inc(`bestiary.fact.${e.creature}`); L.inc(`bestiary.fact.${e.creature}.${e.fact}`); if (e.battle) L.inc('bestiary.battle');
      const C = CREATURES[e.creature], b = g.veritome?.book.bestiary, u = b?.understanding(e.creature);
      if (u && u.tier > L.get(`bestiary.u.${e.creature}`)) L.inc(`bestiary.u.${e.creature}`, u.tier - L.get(`bestiary.u.${e.creature}`)); // (the understanding reached, 1-4)
      log.say(e.battle ? 'battle' : 'record', `Bestiary, ${C?.name || e.creature}: ${C?.facts.find((f) => f.id === e.fact)?.text || e.fact}`, {});
      if (u && u.tier >= 2 && L.first(`bestiary.${e.creature}.${u.tier}`)) log.say('ach', `You have ${u.name.toLowerCase()} the ${C.name.toLowerCase()}.`, {});
    });
    on('card.get', (e) => {
      L.inc('card.get'); L.inc(`card.got.${e.card}`);
      if (e.first) { L.inc('card.pages'); L.inc(`card.pages.${e.section}`); }
      log.say('gain', e.page ? `${CARD(e.card)} is bound into page ${VCARD[e.card]?.page} of the Book (rank ${e.rank}).` : `A copy of ${CARD(e.card)} goes into a free slot.`, { key: `cget.${e.card}`, throttle: 1 });
    });
    on('card.drift', (e) => { L.inc('card.drift'); log.say('info', e.from === 'time' ? `${CARD(e.card)} was never bound, and is gone.` : `Another ${CARD(e.card)}; the Book has no room for it, and it drifts away.`, { key: `cdrift.${e.card}`, throttle: 4 }); });
    // ---- the Pneuka Box: what she carries (src/pneuka/)
    const ITEM = (id) => itemOf(id)?.name || CARD(id);
    on('item.get', (e) => {
      L.inc('item.get'); L.inc(`item.from.${e.from}`); L.hi('pneuka.used.best', e.used);
      if (e.used >= 28) L.inc('pneuka.filled');
      if (e.from === 'ground') log.say('loot', `You pick up the ${ITEM(e.item)}.`, { tone: '#ffd98a' });
      else if (e.from === 'chest') log.say('loot', `The ${ITEM(e.item)} goes into your Pneuka Box. (P)`, { tone: '#ffd98a' });
      else if (e.from === 'catch') log.say('loot', `You keep the ${ITEM(e.item)} in your Pneuka Box. (Old Grog buys fish.)`, { key: 'fishkeep', fmt: (n) => `You keep ${n} fish in your Pneuka Box.` });
      first('pneuka', 'Logged: your first thing in the Pneuka Box. P opens it: left click uses, right click lists the rest.');
    });
    // the chat line and the emotes (chat.js, emotes.js): said in the CHAT tab, FFXI's way ("Name : words")
    on('chat.say', (e) => { L.inc('chat.say'); log.say('say', `Courier : ${e.text}`); });
    on('chat.emote', (e) => { L.inc('chat.emote'); log.say('emote', `The Courier ${e.text.replace(/[.!?]?$/, (m) => m || '.')}`); });
    // the clay folk (npc/): who was met, and every finished line of what they said (FFXI's "Name : words")
    on('npc.talk', (e) => {
      L.inc('npc.talk'); L.inc(`npc.talk.${e.npc}`);
      const n = this.game.folk?.byId[e.npc];
      if (e.first && n) log.say('explore', `You meet ${n.name}, ${n.def.title}.`);
    });
    on('npc.say', (e) => { L.inc('npc.lines'); L.inc(`npc.mood.${e.mood || 'calm'}`); const n = this.game.folk?.byId[e.npc]; log.say('npc', `${n?.name || 'Someone'} : ${e.line}`); });
    on('npc.choose', (e) => log.say('say', `Courier : ${e.text}`));
    // the slip jellies (jelly/slipjelly.js): what they do to her and what she does to them; a blow by anything else is said as what it was
    on('jelly.notice', () => { L.inc('jelly.noticed'); log.say('battle', 'A slip jelly turns toward you.', { key: 'jnot', throttle: 4 }); });
    on('jelly.hit', (e) => { if (e.by === 'courier') { L.inc('jelly.hit'); L.inc(`jelly.hit.${e.cause}`); } });
    on('jelly.strike', (e) => { L.inc('jelly.struck'); L.inc(`jelly.struck.${e.move}`); log.say('warn', e.move === 'lunge' ? 'The slip jelly throws itself at you.' : 'The slip jelly spits slip at you.', { key: `jstr.${e.move}`, throttle: 1.5 }); });
    on('jelly.cancel', (e) => { L.inc('jelly.cancelled'); L.inc(`jelly.cancelled.${e.why}`); if (e.why === 'staggered') log.say('battle', 'Your blow breaks the slip jelly\'s wind-up.', { key: 'jcan', throttle: 1 }); });
    on('jelly.burst', (e) => {
      if (e.by === 'courier' && e.cause === 'zandatsu') { L.inc('jelly.burst'); L.inc('jelly.burst.zandatsu'); return; } // (said by creature.zandatsu)
      if (e.by === 'courier') { L.inc('jelly.burst'); L.inc(`jelly.burst.${e.cause}`); log.say('battle', 'You burst the slip jelly.', { key: 'jbur', win: 1, fmt: (n) => `You burst ${plural(n, 'slip jelly').replace('jellys', 'jellies')}.` }); first('jelly', 'Logged: your first slip jelly. It forms again from its puddle in a while.'); }
      else log.say('other', 'The slip jelly bursts.', { key: 'jbur2', throttle: 1 });
    });
    // their lives, said when they are near enough to see (jelly/mind.js): what they eat, what they catch, what they bring, whom they fight
    const seen = () => { const P = this.game.player.pos; return this.game.jellies?.list.some((c) => c.alive && c.pos.distanceTo(P) < 30); };
    on('jelly.eat', (e) => { L.inc('jelly.ate'); if (seen()) log.say('other', e.what === 'cube' ? 'A slip jelly swallows a cube of Lachryma.' : 'A slip jelly swallows a bauble of Lachryma.', { key: 'jeat', throttle: 8 }); });
    on('jelly.fish', () => { L.inc('jelly.fished'); if (seen()) log.say('other', 'A slip jelly snatches a fish from the shallows.', { key: 'jfish', throttle: 10 }); });
    on('jelly.fetch', () => { L.inc('jelly.fetched'); log.say('battle', 'The slip jelly brings you Lachryma.', { key: 'jfetch', throttle: 2 }); });
    on('jelly.brawl', () => { L.inc('jelly.brawl'); if (seen()) log.say('other', 'Slip jellies fight among themselves.', { key: 'jbrawl', throttle: 6 }); });
    // the stun (stun.js) and the Veritome's flash (veritome/flash.js): a mind knocked out of itself
    const KIND = (k) => (k === 'slipjelly' ? 'slip jelly' : k === 'clapperjar' ? 'clapperjar' : 'creature');
    on('flash.fire', (e) => { L.inc('flash.fire'); L.inc('flash.hits', e.hits); if (e.lens) L.inc('flash.lens'); });
    on('stun.build', (e) => { if (e.by === 'courier') L.inc(`stun.build.${e.cause}`); });
    on('creature.stun', (e) => {
      if (e.by !== 'courier') return;
      L.inc('stun'); L.inc(`stun.${e.kind}`); L.inc(`stun.cause.${e.cause}`);
      log.say('battle', `The ${KIND(e.kind)} reels, stars wheeling round its head.`, { key: 'stun', throttle: 1 });
      first('stun', 'Logged: your first stun. A stunned mind is open: stand close and press the middle button to reprogram it, or cut it along its line with the Sondelass.');
    });
    // reprogramming (veritome/reprogram.js): a stunned mind opened, and the line typed into it
    on('reprogram.open', (e) => { L.inc('reprogram.open'); log.say('battle', `You open the ${KIND(e.kind)}'s mind.`, { key: 'rpo', throttle: 1 }); });
    on('reprogram.run', (e) => {
      L.inc('reprogram.run'); L.inc(`reprogram.macro.${e.macro}`); L.inc('reprogram.chars', e.chars); if (!e.misses) L.inc('reprogram.clean');
      for (const f of e.effects || []) L.inc(`reprogram.fn.${f}`);
      L.hi('reprogram.q', Math.round((e.q || 0) * 100));
      const did = (e.effects || []).filter((f) => !(e.refused || []).includes(f)).map((f) => FUNCTIONS[f]?.label.toLowerCase()).filter(Boolean);
      log.say('battle', `You say ${e.macro.replace(/-/g, ' ')} into the ${KIND(e.kind)}'s mind. It ${did.length ? `takes it: ${did.join(', ')}` : 'hears it, and has no way to do it'}.`, {});
      if ((e.refused || []).length) log.say('warn', `Its mind has nothing that answers to ${e.refused.map((f) => FUNCTIONS[f]?.word).join(', ')}.`, { key: 'rpref', throttle: 1 });
    });
    on('reprogram.reject', (e) => { L.inc('reprogram.reject'); log.say('warn', `The ${KIND(e.kind)}'s mind throws ${e.macro.replace(/-/g, ' ')} off, and wakes. (A better-made macro takes better hold.)`, {}); });
    // the Functions (mind/functions.js): learned by seeing them done
    on('mind.learn', (e) => { L.inc('mind.learn'); log.say('ach', `You have learned the neuralese ${FUNCTIONS[e.fn]?.word}: ${FUNCTIONS[e.fn]?.does.toLowerCase().replace(/\.$/, '')} (the Codex: VERITOME, THE MIND).`, {}); });
    on('mind.place', () => L.inc('mind.place'));
    on('reprogram.miss', () => L.inc('reprogram.miss'));
    on('reprogram.close', (e) => { if (e.why === 'time') { L.inc('reprogram.lost'); log.say('warn', `The ${KIND(e.kind)}'s mind snaps shut on you.`, {}); } });
    on('reprogram.wear', (e) => log.say('other', `What you wrote into the ${KIND(e.kind)} wears off.`, { key: 'rpw', throttle: 2 }));
    // the Sondelass against a mind (sondelass/blade.js)
    on('blade.resist', (e) => { L.inc('blade.resisted'); log.say('battle', `The ${KIND(e.kind)} turns your blade aside${e.why === 'uncuttable' ? ': it cannot be cut' : ': stun it first'}.`, { key: 'bres', throttle: 2 }); });
    on('creature.zandatsu', (e) => { L.inc('zandatsu.creature'); L.inc(`zandatsu.${e.kind}`); log.say('battle', `You take the ${KIND(e.kind)} apart. It comes undone into Lachryma.`, {}); });
    on('creature.status', (e) => { if (e.by === 'courier') { L.inc('status.applied'); L.inc(`status.${e.status}`); } });
    on('emote', (e) => { L.inc('emote.total'); L.inc(`emote.${e.emote}`); const E = EMOTES[e.emote]; if (E) log.say('emote', E.line); });
    on('item.full', (e) => { L.inc('pneuka.full'); log.say('warn', `Your Pneuka Box is full. The ${ITEM(e.item)} falls at your feet.`, {}); });
    on('item.drop', (e) => { L.inc('item.drop'); log.say('info', `You drop the ${ITEM(e.item)}.`, { key: 'idrop', fmt: (n) => `You drop ${n} things.` }); });
    on('item.examine', (e) => log.say('info', itemOf(e.item)?.examine || VCARD[e.item]?.lore || 'Nothing remarkable.', {}));
    on('item.store', (e) => { L.inc('item.store'); log.say('gain', `You store the ${ITEM(e.item)} in the Veritome.`, { key: 'istore', fmt: (n) => `You store ${n} things in the Veritome.` }); });
    on('item.withdraw', (e) => { L.inc('item.withdraw'); log.say('gain', `You take the ${ITEM(e.item)} out of the Veritome.`, { key: 'iwd', fmt: (n) => `You take ${n} things out of the Veritome.` }); });
    on('lure.untie', (e) => { L.inc('lure.untie'); log.say('info', `You untie the ${ITEM(e.lure)} and put it in your Pneuka Box.`, { key: 'luntie', throttle: 0.2 }); });
    // the tools: worn in their places, or carried (tools/belt.js)
    const TOOLNAME = (t) => ({ psygun: 'Psygun', sondelass: 'Sondelass', soulbrush: 'Soul Brush', veritome: 'Veritome', dreamvane: 'Dreamvane', crucibelle: 'Crucibelle', lockheart: 'Lockheart' }[t] || t);
    const WHERE = { psygun: 'across your back', sondelass: 'across your back', dreamvane: 'across your back', soulbrush: 'at your hip', veritome: 'at your hip', crucibelle: 'at your hip', lockheart: 'at your neck' };
    on('tool.wear', (e) => { L.inc('tool.wear'); L.inc(`tool.wear.${e.tool}`); log.say('info', `You wear the ${TOOLNAME(e.tool)} ${WHERE[e.tool] || ''}${e.off ? `, and put the ${TOOLNAME(e.off)} in your Pneuka Box` : ''}.`, { key: 'twear', throttle: 0.2 }); });
    on('tool.off', (e) => { L.inc('tool.off'); log.say('info', `You put the ${TOOLNAME(e.tool)} in your Pneuka Box.`, { key: 'toff', throttle: 0.2 }); });
    // the last three tools (moves/dreamvane.js, crucibelle.js, lockheart.js): what they find, sing and let out
    const KINDNAME = { crystal: 'crystal', chest: 'a chest', creature: 'something alive', clapper: 'a clapperjar', spirit: 'a spirit', bauble: 'loose Lachryma', liquid: 'liquid Lachryma', cube: 'a cube' };
    on('dowse.find', (e) => { L.inc('dowse.find'); L.inc(`dowse.find.${e.kind}`); log.say('find', `The Dreamvane leans hard toward ${e.kind === 'crystal' ? (e.veiled ? 'crystal under the sand' : 'crystal') : KINDNAME[e.kind] || 'something'}, ${e.dist} paces off.`, { key: 'dfind', throttle: 2 }); });
    on('dowse.attune', () => L.inc('dowse.attune'));
    on('dreamvane.swing', () => L.inc('dreamvane.swing'));
    on('dreamvane.unearth', (e) => { L.inc('crystal.unearth', e.n); });
    on('crystal.reveal', (e) => { if (e.by === 'courier') L.inc('crystal.reveal'); log.say('find', e.how === 'pick' ? 'Crystal rises out of the sand where the pick went in.' : 'Crystal rises out of the sand at the song.', { key: 'xrev', throttle: 1 }); first('crystal', 'Logged: your first crystal. Lachryma set hard: the Dreamvane\'s pick takes it a blow at a time, and its fork, rung into it first, doubles what it gives.'); });
    on('crystal.strike', (e) => { if (e.by === 'courier') L.inc('crystal.strike'); if (e.ringing) L.inc('crystal.strike.ringing'); });
    on('crystal.harvest', (e) => {
      if (e.by !== 'courier') return;
      L.inc('crystal.harvest'); if (e.ringing) L.inc('crystal.harvest.ringing'); if (e.shard) L.inc('crystal.shard'); if (e.key) L.inc('crystal.key');
      log.say('find', `The crystal breaks open${e.ringing ? ', ringing,' : ''} and gives up ${plural(e.worth, 'cube')}${e.shard ? ' and a shard of itself' : ''}${e.key ? `, and inside it, ${an(ITEM(e.key))}` : ''}.`, {});
    });
    on('fork.throw', () => L.inc('fork.throw'));
    on('fork.stick', (e) => { L.inc('fork.stick'); L.inc(`fork.stick.${e.what}`); if (e.what === 'creature') log.say('battle', 'Your tuning fork sinks into it, ringing.', { key: 'fstick', throttle: 2 }); });
    on('fork.drain', () => L.inc('fork.drain'));
    on('fork.catch', () => L.inc('fork.catch'));
    on('crucibelle.note', (e) => { L.inc('bell.note'); if (e.onBeat) L.inc('bell.onbeat'); });
    on('crucibelle.fever', () => { L.inc('bell.fever'); log.say('song', 'The Crucibelle burns with fever.', { key: 'fever', throttle: 6 }); });
    on('crucibelle.toll', (e) => { L.inc('bell.toll'); if (e.onBeat) L.inc('bell.toll.onbeat'); });
    on('song.play', (e) => {
      L.inc('song.play'); L.inc(`song.${e.song}`); if (e.fever >= 1) L.inc('song.fever'); L.hi('song.power', Math.round(e.power * 100));
      const S = { reveal: (n) => (n ? `What was hidden is shown: ${plural(n, 'thing')} light up.` : 'Nothing near is hidden.'), mirage: () => 'A Courier of smoke stands where you stood.', rally: (n) => (n ? `${n === 1 ? 'Your ally takes' : `${n} allies take`} heart.` : 'Your Lachryma quickens.'), lull: (n) => (n ? `${plural(n, 'thing')} fall${n === 1 ? 's' : ''} asleep.` : 'Nothing near is listening.'), summon: (n) => (n > 1 ? `${n} smoke spirits stand up out of the bell.` : 'A smoke spirit stands up out of the bell.') };
      log.say('song', `You play ${SONGS[e.song]?.name.toLowerCase().replace(/^the /, 'the ') || e.song}${e.fever >= 1 ? ' in fever' : ''}. ${S[e.song]?.(e.n) || ''}`, {});
    });
    on('mirage.raise', () => L.inc('mirage.raise'));
    on('spirit.summon', (e) => { L.inc('spirit.summon'); L.inc(`spirit.summon.${e.from}`); first('spirit', 'Logged: your first spirit. It is yours for a while: it follows you and fights what is against you, and your blows pass through it.'); });
    on('spirit.fade', (e) => { L.inc('spirit.fade'); if (e.cause !== 'faded') log.say('other', 'A smoke spirit is struck back into smoke.', { key: 'sfade', throttle: 2 }); });
    on('lockheart.feed', (e) => { L.inc('lockheart.fed', e.amount); L.inc(`lockheart.fed.${e.from}`, e.amount); if (e.from === 'shard') log.say('luck', 'The Lockheart drinks the shard whole.', {}); });
    on('lockheart.full', (e) => log.say('luck', `The ${ITEM(e.heart).replace(/^THE /, '').toLowerCase()} is full: a key will open it.`, { key: 'lhfull', throttle: 10 }));
    on('lockheart.drain', () => L.inc('lockheart.drain'));
    on('lockheart.open', (e) => {
      L.inc('lockheart.open'); L.inc(`lockheart.open.${e.heart}`); for (const k of e.keys) L.inc(`lockheart.key.${k}`); if (e.keys.length >= 3) L.inc('lockheart.three');
      log.say('luck', `You turn ${e.keys.map((k) => an(ITEM(k).toLowerCase())).join(', then ')} in the Lockheart${e.power >= 1.9 ? ', brimming,' : ''} and it opens.`, {});
    });
    on('lockheart.outcome', (e) => {
      L.inc(`lockheart.out.${e.outcome}`); L.hi('lockheart.rank', e.rank);
      const O = { dud: 'Nothing comes out of it but a moth.', bite: 'It bites back, and drinks from you.', spill: 'Lachryma spills out of it.', cubes: `${plural(e.n, 'cube')} pour out of it.`, mend: 'Your Lachryma comes flooding back.',
        daze: `A ring of light goes out of it${e.n ? `: ${plural(e.n, 'thing')} reel` : ''}.`, hush: `A hush goes out of it${e.n ? `: ${plural(e.n, 'thing')} fall asleep` : ''}.`, kin: `${e.n ? `${plural(e.n, 'creature')} take` : 'Nothing near takes'} you for kin.`,
        spirit: `${e.n > 1 ? `${e.n} smoke spirits climb` : 'A smoke spirit climbs'} out of it.`, chest: 'A chest falls out of the air.', nuke: `SLIP NUKE.${e.n ? ` ${plural(e.n, 'thing')} drown in it.` : ''}` };
      log.say(e.rank >= 4 ? 'ach' : 'luck', O[e.outcome] || e.outcome, { tone: e.rank >= 4 ? '#ff5ad0' : undefined });
    });
    // the title (title/): which game was chosen (the words are Espada's to set: docs/HANDOFFS.md)
    on('title.enter', (e) => { L.inc('title.enter'); L.inc(`title.enter.${e.mode}`); log.say('system', e.mode === 'story' ? 'STORY is not written yet: the island waits for it. The workshop is open in the meantime, and the arts are learned by doing.' : 'DEBUG: the sandbox. Every art is yours in the lab, every tool and every room.', {}); });
    on('item.fit', (e) => { L.inc('item.fit'); log.say('info', e.socket === 'keys' ? `You put ${an(ITEM(e.item).toLowerCase())} on the Lockheart's ring.` : e.socket === 'heart' ? `You hang ${ITEM(e.item).toLowerCase()} on the Lockheart's chain.` : `You fit the ${ITEM(e.item).toLowerCase()} to the Crucibelle.`, { key: `ifit.${e.item}`, throttle: 0.2 }); });
    on('item.unfit', (e) => log.say('info', `You take the ${ITEM(e.item).toLowerCase()} off, into your Pneuka Box.`, { key: 'iunfit', throttle: 0.2 }));
    on('lure.tie', (e) => { L.inc('lure.tie'); if (e.curio) L.inc('lure.tie.curio'); log.say('info', `You tie the ${e.curio ? ITEM(e.lure) : (LURES.find((l) => l.id === e.lure)?.name.toLowerCase() || e.lure)} onto the line.`, { key: 'ltie', throttle: 0.2 }); });
    on('card.condense', (e) => { L.inc('card.condense'); log.say('loot', `A spare ${CARD(e.card)} condenses into ${plural(e.cubes, 'Lachryma cube')}.`, { tone: '#ffd98a' }); });

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
    const hooked = (w) => (w === 'clapper' ? 'clapperjar' : w === 'breakable' ? 'pot' : w === 'slipjelly' ? 'slip jelly' : 'prop');
    on('hook.pull', (e) => { L.inc('hook.pull'); L.inc(`hook.pull.${e.what}`); L.hi('hook.pull.dist', e.dist); log.say('battle', `You bring the ${hooked(e.what)} to you.`, { key: 'hpull', win: 1.2 }); });
    on('hook.fling', (e) => { L.inc('hook.fling'); L.hi('hook.fling.speed', e.speed); log.say('battle', `You let go, and the ${hooked(e.what)} flies.`, { key: 'hfling', win: 1.2 }); });
    on('hook.creature', (e) => { L.inc('hook.creature'); L.inc(`hook.creature.${e.kind}`); log.say('battle', `The grapnel bites into the ${hooked(e.kind)}. It reels.`, { key: 'hcre', win: 1.2 }); });
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
      if (e.dupe) { L.inc('curio.dupe'); log.say('loot', `The Book can hold no more of the ${c.name}. It condenses into cubes.`, { tone: tone(c.tier) }); return; }
      L.inc('curio.total'); L.inc(`curio.tier.${t.id}`);
      log.say('loot', `You find the ${c.name}!`, { tone: tone(c.tier) });
      if (L.first(`curio.first.${e.id}`)) log.say('record', `Logged: the ${c.name}. ${c.blurb}`);
    });
    // the folk's counters (shop/): what is bought and sold is said; a haggle's words are Raku's own (npc.say), so it is only counted
    const SHOPNAME = (id) => ({ raku: 'Raku', grog: 'Old Grog' })[id] || 'The keeper';
    on('shop.open', (e) => { L.inc('shop.open'); L.inc(`shop.open.${e.shop}`); first('shop', 'Logged: a counter. Click a good to buy it, a thing in your box to sell it. Prices climb as a shelf empties and fall back in time.'); });
    on('shop.buy', (e) => {
      L.inc('shop.bought'); L.inc(`shop.bought.${e.shop}`); L.inc('shop.spent', e.price);
      if (e.haggled) { L.inc('haggle.won'); L.inc('haggle.saved', Math.max(0, Math.round(e.worth * 1.45) - e.price)); }
      log.say('loot', `You buy the ${ITEM(e.item)} from ${SHOPNAME(e.shop)} for ${plural(e.price, 'cube')}.`, { tone: '#ffd98a', key: `buy.${e.item}`, fmt: (n) => `You buy ${n} ${ITEM(e.item)} from ${SHOPNAME(e.shop)}.` });
    });
    on('shop.sell', (e) => {
      L.inc('shop.sold'); L.inc(`shop.sold.${e.shop}`); L.inc('shop.earned', e.price); if (itemOf(e.item)?.kind === 'fish') L.inc('fish.sold');
      log.say('loot', `${SHOPNAME(e.shop)} buys the ${ITEM(e.item)} for ${plural(e.price, 'cube')}.`, { tone: '#ffd98a', key: `sell.${e.shop}`, win: 1.5, fmt: (n) => `${SHOPNAME(e.shop)} buys ${n} things from you.` });
    });
    on('shop.haggle', (e) => { L.inc(`haggle.${e.step}`); if (e.step === 'open') L.inc('haggle.start'); });
    on('film.load', (e) => { L.inc('film.rolls'); log.say('info', `You load a fresh roll of film.${e.left ? ` (${e.left} more in your box)` : ' It is your last.'}`, {}); });
    on('econ.grant', (e) => log.say('system', `The System grants you ${plural(e.n, 'Lachryma cube')}.`));
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
