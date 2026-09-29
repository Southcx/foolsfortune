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

const fx = (v, d = 2) => Number(v).toFixed(d);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

const CLAP_LINE = {
  shot: 'The clapperjar is defeated.', sliced: 'The clapperjar is cleaved in two.', cooked: 'The clapperjar is baked to a crisp.',
  splat: 'The clapperjar splats.', well: 'The clapperjar is crushed.', explosion: 'The clapperjar is blown apart.',
  charged: 'The clapperjar is vaporised.', ricochet: 'The clapperjar is defeated by a banked shot.', homing: 'The clapperjar is hunted down.',
};
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
    on('shell.slice', (e) => { L.inc('shell.slice.cuts', e.cuts); L.hi('shell.slice.best', e.cuts); if (e.cuts >= 3) log.say('battle', `Your slicer shell cleaves through ${e.cuts} targets.`); });
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

    // ---- the Solar Surfer
    on('surf.start', () => { L.inc('surf.start'); log.say('surf', 'The Solar Surfer unfurls.', { key: 'sst', throttle: 3 }); });
    on('surf.pump', () => L.inc('surf.pump'));
    on('surf.hop', () => L.inc('surf.hop'));
    on('surf.tick', (e) => { const r = L.hi('speed.surf.max', e.speed, { at: this.where() }); this.note('speed.surf.max', r, `Your top surfing speed is now ${fx(e.speed, 1)} m/s.`, 14, e.speed); });
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
      if (sp > 5 && (s !== 'surfer' && !P.platform)) { const r = L.hi('speed.max', sp, { at: this.where() }); this.note('speed.max', r, `Your top speed is now ${fx(sp, 1)} m/s.`, 10, sp); }
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
