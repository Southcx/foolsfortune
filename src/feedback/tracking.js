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
// Keys (dotted, so they group; the Codex shows them: feedback/codex/ledger.js):
//   time.*      seconds        time.state.<sprint|slide|air|...>, time.tech.<id>, time.area.<workshop|basement|dunes>, time.god, time.skiff
//   dist.*      metres         dist.total, dist.state.<..>, dist.swim, dist.up, dist.down
//   move.*      counts         move.jump, move.airjump, move.walljump, move.dash, move.slide, move.wallrun, move.mantle, move.land, move.roll ...
//   break.*     counts         break.total, break.kind.<kind>, break.cause.<cause>
//   clapper.*   counts         clapper.down, clapper.cause.<cause>
//   shot.*      counts         shot.fired, shot.hit, shot.charged, shot.air, shell.fire.<id>
//   the arts' goals (B7)       land.drop12, land.drop20, chain.blink2, chain.stomp3, target.slam.moving50, roll.end, time.slip
//   lach.*      amounts        lach.spent, lach.spent.<tag>, lach.gain, lach.gain.<source>, lach.denied, lach.empty, lach.low (tracking/pool.js)
//   god.*       counts         god.enter, god.grab, god.throw, god.sunder, god.cuts, god.manifest, god.raid, god.wave
//   skiff.*     counts         skiff.start, skiff.pump, skiff.hop, skiff.trick, skiff.spins, skiff.wobble
//   circuit.<id>.*             runs, finish, clean, fall, gates, medal.<gold|silver|bronze>
//   records (hi/lo)            speed.max, speed.skiff.max, air.longest, fall.max, slam.height, chain.max, ...
// ---------------------------------------------------------------------------------------
import { areaRules } from './tracking/rules.js';
import { fx } from './tracking/lineformat.js';

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
    this.listen();
  }

  // ---------------------------------------------------------------- what is said about a record, once it settles
  note(key, res, text, min = 0, v = 0) {
    if (res === 'beat' && v >= min) this.pending.set(key, { text, t: 2.2 });
    else if (this.pending.has(key) && res) this.pending.get(key).text = text;
  }

  // ---------------------------------------------------------------- events
  // Every rule is a function in feedback/tracking/*.js, called in one place and one order (tracking/rules.js: the lead rules, each area's,
  // the trail). What they share from here: `on` (the bus, minus the Throwing Room), the ledger, the log, the game, where() and `track`
  // (this: the break chain, the pending record announcements, the room clock, `note`, the arts' chain counts).
  listen() {
    const g = this.game, ev = g.events, L = this.L, log = this.log;
    // (the Throwing Room measures and never counts: its pots and lock targets (`training`), Strawman and the status bench's roly-polies
    // never reach a rule here; its own rules, strawman.*, statusbench.* and drill.*, carry no mark: world/throwingroom/, feedback/tracking/throwingroom.js)
    const on = (n, f) => ev.on(n, (e) => { if (e?.training || e?.kind === 'strawman' || e?.kind === 'rolypoly' || e?.what === 'strawman') return; f(e); });
    areaRules({ on, L, log, g, where: () => this.where(), track: this });
  }

  // ---------------------------------------------------------------- helpers
  where() {
    const g = this.game;
    if (g.dunes?.active) return 'the Dunes';
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
    if (P.crouching) return P.prone ? 'prone' : 'crouch';
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
    L.inc(`time.area.${this.where().replace('the ', '').replace(/^a /, '').toLowerCase()}`, dt); // (the key in lower case, as its readers ask: 'Dunes' wrote time.area.Dunes and Reached the Dunes, the first path's sixth step, never came)
    if (g.god?.controlling) L.inc('time.god', dt);
    if (g.techs?.active?.id === 'skiff') L.inc('time.skiff', dt);
    if (g.circuits?.active) L.inc('time.circuit', dt);
    const so = g.techs?.get('sondelass');
    if (g.techs?.get('soulbrush')?.toolOut) L.inc('time.soulbrush', dt);
    if (g.techs?.get('veritome')?.toolOut) L.inc('time.veritome', dt);
    if (so?.toolOut) { L.inc('time.sondelass', dt); if (so.form === 'rod') L.inc('time.rod', dt); if (so.angler?.state && so.angler.state !== 'idle') L.inc('time.angling', dt); if (so.angler?.state === 'fight') L.inc('time.fight', dt); }
    if (s !== this.state) { if (this.state && s !== 'idle') L.inc(`enter.${s}`); this.state = s; }

    // distance and speed (a jump of more than a few metres in a frame is a teleport, not travel)
    const at = g.god?.controlling || g.realm?.active || g.rail?.stage?.active ? null : P.pos; // (in the garden P.pos is the Jar's, and the Jar is not the Courier: Dovina's ruling, GARDEN-SWEEP #7; aboard, the ship's rail is not walked: SWEEPS.md)
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
      if (sp > 5 && s !== 'skiff' && s !== 'grapple' && s !== 'launch' && !P.platform) { const r = L.hi('speed.max', sp, { at: this.where() }); this.note('speed.max', r, `Your top speed is now ${fx(sp, 1)} m/s.`, 10, sp); }
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
