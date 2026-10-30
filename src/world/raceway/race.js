// ---------------------------------------------------------------------------------------
// THE RACE AT THE RACEWAY (docs/plans/SKIFF-RACING.md sections 5 and 10): F at a track's start pillar begins a time trial of three laps
// on that track (the park has several: world/raceway/park.js; each keeps its own best lap's ghost). The board is
// set on the grid and held for the countdown (3, 2, 1, GO: said in the log, the gate's lights Calissa's); the sail can be readied, and
// run up full in the quarter second after GO it is a SOLAR START, a push off the line (MK8's rocket start; up too soon, the pump is
// spent while held and it luffs). Then three laps through eight gates in order (a gate missed is gone back for: the line counts only
// after all eight), a split at the half lap against your best lap's, a lap's time at the line, and a ghost of your best lap riding beside
// you (kept in the save). R in a race goes back to the last gate passed (Trackmania's checkpoint respawn). A bail in a race is got up from and set back on the track where it happened (MK8's Lakitu). The time takes a medal; each medal
// pays once, ever (a test, not a farm: as the Solar Skiffing trial). Leaving the Raceway ends it. A race is run under the hour's and the
// weather's condition at its start (conditions.js: said then, and its time kept on that condition's board too, Trackmania's "the same
// track, another board"). The cavern's branch counts as the stretch of line it stands for (raceway.js maps it), its gate 8 with it.
// MODES (round 6: world/raceway/modes.js): a run is a race, a hot lap (a flying start), practice (rewound with Backspace held), a pot
// smash, an escape or a licence test; the mode's RULESET (pottrial.js, escape.js, licences.js) adds its rules through the same few hooks
// (begin, update, gate, result, stop). Backspace tapped RESTARTS the run where it began (Trackmania's Delete: no menu between tries);
// a race's grid opens on a camera's FLYOVER of the line (flyover.js), skipped with F or Space. The race board at the hub is
// world/raceway/raceboard.js.
// Events (each with `by`): race.start { track, mode, condition, light, aspect }, race.count { n }, race.go, race.solarstart, race.gate
// { gate, lap, split }, race.lap { lap, seconds, best }, race.finish { seconds, medal, laps, condition, track, mode, place, of },
// race.end { why }, race.restart { mode }.
// The ghost's look is a placeholder (Calissa's): a pale hull and sail.
//
// Prior art: MK8's time trials (the ghost, the rocket start, a medal as a test passed once), Gran Turismo's licence tests, Wave Race's and
// Pilotwings' gates in order, Trackmania's checkpoint splits.
//
//   game.race = new Race(game)   .offer() -> { pos, d } | null   .start(trackId, { mode, roster, solo, test, again })   .update(dt)
//   .running   .mode   .modeId   .T   .lap   .t   .end(why)   .finish()   RACE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ECON } from '../../progress/econ/table.js';
import { conditionAt, dayCondition } from './conditions.js';
import { today } from '../../core/calendar.js';
import { Rivals } from './rivals.js';
import { hauntOf } from '../../progress/trackdef.js';
import { MODES, FLY } from './modes.js';
import { Flyover } from './flyover.js';
import { Rewind } from './rewind.js';
import { PotTrial } from './pottrial.js';
import { Escape } from './escape.js';
import { Licences } from './licences.js';
import { RaceBoard } from './raceboard.js';
import { Cups } from './cups.js';
import { CityTrial } from './citytrial.js';
import { Wager } from '../../progress/econ/wager.js';

/** The numbers: laps; the countdown (real s); the solar start's window after GO and its push; the medals by total time (real s, three
 *  laps: drafts until Petra measures the line, and they move with it); each medal's pay once (minutes of play); the ghost's samples a
 *  second; real seconds after a bail before the board is set back on the track. */
export const RACE = {
  laps: 3, countdown: 3, solar: { window: 0.3, add: 12, dur: 1.3, kick: 4 },
  medals: { sun: { gold: 255, silver: 285, bronze: 330 }, gorge: { gold: 336, silver: 376, bronze: 435 }, coaster: { gold: 217, silver: 242, bronze: 280 } }, pay: { gold: 10, silver: 6, bronze: 4 }, ghostHz: 10, bailBack: 2.9, retire: 1.2, restart: 0.25, // (retire: real s R held; restart: Backspace let go within this (real s); held longer, practice rewinds)
};
// (the Gorge Run's and the Coaster's medals: the Sun Circuit's, scaled by each track's reference race against its own, the ruler's
// `node scripts/skifftune.mjs`, SKIFF-TUNING.md T3: the Sun's gold is 0.718 of its reference race, and so is every track's)
/** THE PHOTO FINISH (SKIFF-RACING.md 9, round six's): a rival within `gap` 0.3 real s of you at the line (about a board's length at the
 *  sun circuit's speed) takes a plate at the line: kept in the Veritome's memory as a plate of the race (Petra's runtime takes it, with
 *  no lens up), its stars by how close (`stars`: a hair 3, a nose 2, a length 1). It pays no cubes (the medal already does); it counts,
 *  and its closest is a record (`race.photo.gap`). A rival still running is read by its speed to the line; one already in, by its time. */
export const PHOTO = { gap: 0.3, stars: [[0.05, 3], [0.15, 2], [0.3, 1]] };
function photoOf(race, mine) {
  const Lt = race.T.length * (race.lapsTotal || 3); let best = null;
  for (const r of race.rivals.list) {
    const gap = r.done != null ? mine - r.done : (Lt - r.d) / Math.max(1, r.v || 0), won = r.done == null;
    if (gap >= 0 && gap <= PHOTO.gap && (!best || gap < best.gap)) best = { gap: +gap.toFixed(3), won, rival: r.i, who: r.name };
  }
  if (best) best.stars = PHOTO.stars.find(([g]) => best.gap <= g)?.[1] || 1;
  return best;
}
export const medalOfRace = (seconds, track = 'sun', table = RACE.medals[track]) => { const M = table; return !M ? null : seconds <= M.gold ? 'gold' : seconds <= M.silver ? 'silver' : seconds <= M.bronze ? 'bronze' : null; };

export class Race {
  constructor(game) {
    this.game = game; this.running = false; this.state = 'idle';
    this.bestLaps = {}; // { ['<track>.<class>' | '<track>.trim']: { seconds, splits: [s at each gate], frames: [[t, x, y, z, yaw]] } } (the ledger keeps the times)
    this.cls = 'stock'; this.trace = []; this.traces = { last: null, prev: null }; // (the run's class, STOCK or OPEN; the lap's telemetry: T7)
    this.T = null; // (the track raced)
    this.rivals = new Rivals(game); this.lapsTotal = RACE.laps; // (three clapperjars on mini skiffs: rivals.js)
    this.modeId = 'race'; this.mode = MODES.race; this.opts = {};
    this.flyover = new Flyover(game); this.rewind = new Rewind(game, this); this.board = new RaceBoard(game, this);
    this.rulesets = { pots: new PotTrial(game, this), escape: new Escape(game, this), licence: new Licences(game, this) };
    this.cups = new Cups(game, this); this.city = game.cityTrial = new CityTrial(game, this); game.wager = new Wager(game); // (the cups, the City Trial, the wager: their own modules)
    game.interact?.add('race', () => (game.dialogue?.open ? null : this.offer()));
    // the race board at the hub: F there, and pick a track (the owner, v198: "racetrack selection"); and the chat line's /race, /retire
    game.interact?.add('raceboard', () => { const R = this.R, P = game.player; if (!R?.built || !R.active || this.running || !R.board || game.dialogue?.open) return null; const d = Math.hypot(P.pos.x - R.board.x, P.pos.z - R.board.z); return d < 6 ? { pos: R.board.clone().setY(R.board.y + 3), d } : null; });
    game.events?.on('skiff.pump', () => { if (this.state === 'run' && this.goT != null && this.goT <= RACE.solar.window && !this.solarDone) { this.solarDone = true; this.skiff?.kick(RACE.solar.add, RACE.solar.dur, RACE.solar.kick); game.events.emit('race.solarstart', { by: 'courier' }); } });
    game.events?.on('skiff.bail', () => { if (this.running) this.bailT = 0; });
    // the best lap's ghost is kept (the save's `raceGhost`, player scope: a build's progress, reset with it); its frames to a tenth
    const pack = (B) => ({ seconds: B.seconds, splits: B.splits.map((v) => +v.toFixed(2)), frames: B.frames.map((f) => f.map((v) => +v.toFixed(1))) });
    game.save?.section('raceGhost', { scope: 'player', version: 3,
      dump: () => Object.fromEntries(Object.entries(this.bestLaps).map(([k, B]) => [k, pack(B)])),
      load: (d) => { this.bestLaps = {}; for (const [k, B] of Object.entries(d || {})) if (B?.frames?.length) this.bestLaps[k.includes('.') ? k : `${k}.stock`] = B; }, reset: () => { this.bestLaps = {}; } });
  }
  get R() { return this.game.raceway; }
  /** The chat line's /race and /retire (added once the chat line is made: it comes after the Raceway at boot). */
  commands() {
    const game = this.game; this.cmds = true;
    game.chat?.add('race', { help: 'race a track of the Raceway: /race sun, /race gorge, /race coaster; then a mode (race, hotlap, practice, pots), "solo" or "siblings"', run: (args) => {
      const no = (w) => game.log?.say('warn', w, { key: 'race.cmd', throttle: 1 }), [id, ...rest] = args;
      if (!this.R?.active) return no('You are not at the Raceway.'); if (this.running) return no('A race is under way: /retire first.'); if (id && !this.R.trackOf(id)) return no('No such track: sun, gorge or coaster.');
      const mode = rest.find((w) => MODES[w] && w !== 'licence' && w !== 'escape') || 'race';
      if (rest.includes('siblings') && !this.board.siblingsOpen) return no('The siblings race only those who have won a race.');
      this.start(id || 'sun', { mode, solo: rest.includes('solo'), roster: rest.includes('siblings') ? 'siblings' : 'clapperjars' });
    } });
    game.chat?.add('retire', { help: 'retire from the race under way', run: () => { if (!this.running) return game.log?.say('warn', 'No race under way.', { key: 'race.cmd', throttle: 1 }); this.end('retired'); } });
  }
  /** The race board's pages (raceboard.js). */
  openBoard() { this.board.open(); }
  /** The ghost raced against: the best lap of this class on this track, or in a test lap the last test lap (SKIFF-TUNING.md 2.4, 2.5). */
  get ownLap() { return this.T ? this.bestLaps[`${this.T.key || this.T.id}.${this.mode?.trim ? 'trim' : this.cls}`] || null : null; } // (a made track's by its geometry: T.key)
  /** The ghost raced against: your own best lap, or on a made track you have no lap on, its maker's (the validate lap the code carried). */
  get bestLap() { return this.ownLap || (this.T?.id === 'made' && !this.mode?.trim ? this.R?.made?.ghost || null : null); }
  get skiff() { return this.game.player?.techs?.get?.('skiff'); }

  offer() {
    const R = this.R, P = this.game.player; if (!R?.built || this.running || !R.active) return null;
    let best = null;
    for (const Pl of R.pillars) { const d = Math.hypot(P.pos.x - Pl.pos.x, P.pos.z - Pl.pos.z); if (d < 7 && (!best || d < best.d)) best = { pos: Pl.pos.clone().setY(Pl.pos.y + 3), d, track: Pl.track }; }
    this.offered = best?.track; return best;
  }

  /** A run on a track: `mode` (modes.js), `roster` of rivals, `solo`, `test` (a licence's), `again` (a restart: no flyover). */
  start(trackId = this.offered || 'sun', opts = {}) {
    if (this.running) return false;
    const g = this.game, R = this.R; if (!R?.active) return false;
    const modeId = MODES[opts.mode] ? opts.mode : 'race', M = MODES[modeId], ruleset = M.ruleset ? this.rulesets[M.ruleset] : null;
    this.modeId = modeId; this.mode = M; this.opts = { ...opts, mode: modeId }; this.ruleset = ruleset;
    const plan = ruleset?.plan?.(trackId, opts) || {}; // (a ruleset may choose the track, where the run begins and how many laps)
    const T = (this.T = R.trackOf(plan.track || trackId) || R.T), L = T.length;
    g.skiffParts?.wearPinned?.(T.id); this.cls = g.skiffParts?.recordClass?.() ?? 'stock'; this.trace = []; // (a setup pinned to the track is worn; the run's class read)
    this.lapsTotal = plan.laps ?? M.laps ?? RACE.laps;
    const from = plan.from ?? (M.flying ? T.line - FLY.back : T.line - 20); R.respawn(((from % L) + L) % L, T);
    this.running = true; this.state = plan.flying ?? M.flying ? 'flying' : 'grid'; this.t = 0; this.count = RACE.countdown; this.said = null; this.goT = null; this.solarDone = false;
    this.lap = 1; this.next = plan.gate ?? 0; this.lapT = 0; this.splits = []; this.frames = []; this.laps = []; this.prevS = R.s; this.back = 0; this.bailT = null; this.ghostT = 0; this.pushed = false; this.flyAt = plan.flyAt ?? T.line;
    this.forced = M.daily ? dayCondition(today()) : null; // (the game day's race: the game day's seeded condition, whatever the sky)
    const C = (this.condition = conditionAt(g, this.forced));
    this.rivals.start(T, opts.solo || this.solo || !M.rivals, opts.roster || 'clapperjars'); this.solo = false;
    this.pi = this.cls === 'open' ? g.skiffParts?.pi?.(T) ?? 100 : 100; // (OPEN: the rivals answer your build by half its edge, SKIFF-TUNING.md 2.4)
    if (this.pi !== 100) for (const r of this.rivals.list) r.skill *= Math.sqrt(this.pi / 100);
    if (T.id === 'made' || M.haunted) { // (a made track's traps always; a park track's only in the haunted race, where the siblings possess them: trapbot.js)
      const kept = M.haunted && T.id === 'made' ? hauntOf(R.made.def) : null; // (a made track's maker's haunt, if its code carried one: the maker haunts you)
      R.traps?.use(T); R.traps?.haunt(M.haunted ? (kept ? 'recorded' : 'bots') : null, kept);
    }
    this.rewind.clear(); ruleset?.begin?.(this, plan);
    if (M.flyover && !opts.again) this.flyover.begin(T, R);
    g.events?.emit('race.start', { track: T.id, mode: modeId, rivals: this.rivals.list.length, condition: C.key, light: C.key.split('.')[0], aspect: C.aspect, cup: !!opts.cup, city: !!opts.city, by: 'courier' });
    return true;
  }
  /** The run again from where it began, at once (Trackmania's restart: no menu, no flyover). */
  restart() {
    if (!this.running) return;
    const id = this.T.id, opts = { ...this.opts, again: true };
    this.stopRun(); this.game.events?.emit('race.restart', { mode: this.modeId, by: 'courier' });
    this.start(id, opts);
  }

  update(dt) {
    const g = this.game, R = this.R, PL = g.player, it = g.interact?.cur;
    if (!this.cmds && g.chat) this.commands();
    if (it?.id === 'race' && PL.peekLatch?.('KeyF') && !g.god?.controlling) { PL.latch('KeyF'); this.start(); }
    if (it?.id === 'raceboard' && PL.peekLatch?.('KeyF') && !g.god?.controlling) { PL.latch('KeyF'); this.openBoard(); }
    this.updateGhost(); this.cups.update(dt); this.city.update(dt);
    if (this.rivals.list.length && R?.active) this.rivals.update(dt, this); else if (this.rivals.list.length) this.rivals.stop();
    if (!this.running) return;
    if (!R?.active) { this.end('left'); return; }
    const S = this.skiff, riding = g.techs?.active?.id === 'skiff' && S?.phase === 'ride';
    // ---- Backspace: tapped, the run again from its start; held, in practice, the run rewound (rewind.js)
    const bk = g.input?.isDown?.('Backspace') && !g.log?.typing;
    if (bk) { this.bkT = (this.bkT || 0) + dt; if (this.mode.rewind && this.bkT > RACE.restart && this.state === 'run') { this.rewind.back(dt); return; } }
    else if (this.bkT) { const tap = this.bkT <= RACE.restart; this.bkT = 0; this.rewind.release(); if (tap) { this.restart(); return; } }
    // ---- the grid and the countdown: the board held on the line until GO (after the flyover, if there is one)
    if (this.state === 'grid') {
      if (!riding) return; // (mounting: the countdown waits for the board)
      S.hold = true;
      if (this.flyover.on) { this.flyover.update(dt); return; }
      this.count -= dt;
      const n = Math.ceil(this.count);
      if (n !== this.said && n > 0) { this.said = n; g.events?.emit('race.count', { n, by: 'courier' }); }
      if (this.count <= 0) { S.hold = false; this.state = 'run'; this.goT = 0; this.prevS = R.s; this.rivals.go(); g.events?.emit('race.go', { by: 'courier' }); }
      return;
    }
    // ---- a flying start: pushed off FLY.back before the line; the clock starts as the line is crossed
    if (this.state === 'flying') {
      if (!riding) return;
      if (!this.pushed) { this.pushed = true; S.v.set(Math.sin(S.heading), 0, Math.cos(S.heading)).multiplyScalar(FLY.push); }
      const L = this.T.length, d = ((R.s - this.prevS + L * 1.5) % L) - L / 2, u = ((this.flyAt - this.prevS) % L + L) % L;
      if (d > 0 && d < 60 && u > 0 && u <= d) { this.state = 'run'; this.goT = 9; this.solarDone = true; this.rivals.go(); g.events?.emit('race.go', { flying: true, by: 'courier' }); }
      this.prevS = R.s; if (this.state !== 'run') return;
    }
    // ---- the run
    this.t += dt; this.lapT += dt; this.goT += dt;
    if (this.mode.rewind) this.rewind.keep(dt);
    if (this.ruleset?.update?.(this, dt) === false) return; // (the ruleset ended the run)
    if (S) S.hold = false;
    if (this.bailT != null && (this.bailT += dt) > RACE.bailBack) { this.bailT = null; R.respawn(); } // (where they are: in the cavern, on its branch)
    // R: back to the last gate passed, mounted (Trackmania's respawn at a checkpoint): the lap goes on, the clock with it
    // R held: retire (the owner, v198: "a way to quick retire"); tapped: back to the last gate
    this.retireT = g.input?.isDown?.('KeyR') && !g.log?.typing ? (this.retireT || 0) + dt : 0;
    if (this.retireT > RACE.retire) { this.end('retired'); return; }
    if (g.input?.wasPressed?.('KeyR') && !g.log?.typing) { this.bailT = null; const T = this.T, gs = this.next > 0 ? T.gates[this.next - 1] : T.line; R.respawn(gs + 2, T); this.prevS = R.s; g.events?.emit('race.back', { gate: this.next, by: 'courier' }); }
    // the ghost's samples of this lap
    if ((this.ghostT += dt) >= 1 / RACE.ghostHz) {
      this.ghostT = 0; this.frames.push([+this.lapT.toFixed(2), PL.pos.x, PL.pos.y, PL.pos.z, S?.heading ?? PL.bodyYaw]);
      if (S?.v) { const h = S.heading, vf = S.v.x * Math.sin(h) + S.v.z * Math.cos(h), vl = -S.v.x * Math.cos(h) + S.v.z * Math.sin(h); this.trace.push([+R.s.toFixed(1), +Math.hypot(vf, vl).toFixed(2), +Math.atan2(vl, Math.max(0.5, Math.abs(vf))).toFixed(3), +(S.L ?? 0).toFixed(2), +(S.rules?.mult?.('grip') ?? 1).toFixed(2)]); } // (the telemetry: s, speed, slip, sail, grip)
    }
    // gates crossed: the place on the line moved forward past one, inside the track
    const T = this.T, L = T.length, d = ((R.s - this.prevS + L * 1.5) % L) - L / 2; // (how far along the line since the last step, signed)
    const within = R.d < T.frame(R.s).w + 10;
    if (d > 0 && d < 60 && within) {
      const crossed = (gs) => { const u = ((gs - this.prevS) % L + L) % L; return u > 0 && u <= d; };
      if (this.next < T.gates.length && crossed(T.gates[this.next])) this.gate();
      else if (this.next >= T.gates.length && crossed(T.line)) this.lapDone();
    }
    this.back = d < 0 && within ? this.back - d : Math.max(0, this.back - Math.max(0, d)); // (wrong way: running back along the line)
    if (this.back > 30) { g.log?.say('warn', 'Wrong way.', { key: 'race.wrong', throttle: 4 }); this.back = 0; }
    this.prevS = R.s;
  }

  gate() {
    const i = this.next++, best = (this.mode.record || this.mode.trim) && this.modeId !== 'licence' ? this.bestLap?.splits?.[i] : null;
    this.splits.push(this.lapT);
    this.game.events?.emit('race.gate', { gate: i + 1, lap: this.lap, split: best != null ? +(this.lapT - best).toFixed(2) : null, mode: this.modeId, by: 'courier' });
    if (this.ruleset?.gate?.(this, i)) this.finish(); // (a licence test ends at its gate)
  }
  lapDone() {
    const g = this.game, seconds = +this.lapT.toFixed(2), clean = this.mode.record && !this.ruleset, best = clean && (!this.ownLap || seconds < this.ownLap.seconds); // (a lap of practice or of a ruleset's is not the ghost's)
    if (this.mode.validate) this.validateLap = { seconds, frames: this.frames }; // (the author's lap: the editor keeps it with the track, its ghost for whoever loads the code)
    if (best || this.mode.trim) { this.bestLaps[`${this.T.key || this.T.id}.${this.mode.trim ? 'trim' : this.cls}`] = { seconds, splits: this.splits.slice(), frames: this.frames }; g.save?.dirty('raceGhost'); } // (a test lap's ghost is always the last one)
    this.traces = { prev: this.traces.last, last: { track: this.T.id, seconds, cls: this.cls, mode: this.modeId, samples: this.trace } }; this.trace = []; // (the run trace: this lap and the one before, for the GARAGE)
    this.laps.push(seconds);
    g.events?.emit('race.lap', { track: this.T.id, lap: this.lap, seconds, best, mode: this.modeId, recordClass: this.cls, place: this.rivals.on ? this.rivals.place : null, of: this.rivals.list.length + 1, by: 'courier' });
    if (this.lap >= this.lapsTotal) { this.finish(); return; }
    this.lap++; this.next = 0; this.lapT = 0; this.splits = []; this.frames = [];
  }
  finish() {
    const g = this.game, L = g.ledger, M = this.mode, raw = +(this.laps.length ? this.laps.reduce((a, b) => a + b, 0) : this.t).toFixed(2);
    const out = { seconds: raw, medal: null, laps: this.laps.slice(), condition: this.condition?.key || 'day.fair', track: this.T.id, mode: this.modeId, place: 1, of: 1, cup: !!this.opts.cup, city: !!this.opts.city, ...(this.forced ? { day: today() } : {}), by: 'courier' };
    out.recordClass = this.cls; out.pi = this.pi ?? 100;
    if (this.rivals.on) { out.of = this.rivals.list.length + 1; out.place = 1 + this.rivals.list.filter((r) => r.done != null).length; out.order = this.rivals.order(this); }
    const photo = this.rivals.on ? photoOf(this, raw) : null; if (photo) out.photo = photo; // (a rival within PHOTO.gap of you at the line: the photo finish)
    if (M.medals) out.medal = medalOfRace(raw, this.T.id, this.T.id === 'made' ? this.R.made.medals : undefined); // (every track's, from the ruler; a made track's from its own reference race)
    if (this.T.id === 'made') { out.made = this.T.key; out.validate = !!M.validate; }
    this.ruleset?.result?.(this, out); // (a ruleset's own reckoning: the pots' seconds off, a licence's medal)
    const first = M.medals && out.medal && this.T.id !== 'made' && !(L?.get?.(`race.track.${this.T.id}.${out.medal}`) > 0); // (a made track pays no cubes: the owner, 2026-10-24) // (each medal pays once a track, ever: the ledger counts it as the event lands)
    if (this.rivals.on) this.rivals.settle(out.place);
    this.stopRun();
    g.events?.emit('race.finish', out);
    if (photo) g.events?.emit('race.photo', { ...photo, track: this.T.id, mode: this.modeId, by: 'courier' }); // (Petra's: the plate taken at the line, kept in the Veritome's memory)
    if (first) g.cubes?.earn(Math.round(RACE.pay[out.medal] * ECON.perMinute), 'trial');
  }
  /** The run's own things put away (the rivals, the ruleset's props, the rewind): the race no longer running. */
  stopRun() {
    if (this.skiff) this.skiff.hold = false;
    this.flyover.stop(); this.rewind.clear(); this.ruleset?.stop?.(this);
    this.rivals.stop(); this.running = false; this.state = 'idle';
    if (this.R?.traps?.mode === 'bots' || this.R?.traps?.mode === 'recorded') this.R.traps.haunt(null); // (the haunted race's haunters let go of the traps)
    this.R?.traps?.use(null); // (a park track's traps taken down again: only the made track keeps its own)
  }
  /** Through a portal (world/raceway/traps.js): from s to s, on or back; the gates passed or given back with it, so a
   *  shortcut's lap still counts and a send-back's must be ridden again. */
  warp(from, to, back) {
    if (!this.running || this.state !== 'run') return;
    const T = this.T, L = T.length, gs = T.gates, ahead = (a, b) => ((b - a) % L + L) % L, span = back ? ahead(to, from) : ahead(from, to);
    if (!back) { while (this.next < gs.length && ahead(from, gs[this.next]) <= span) { this.splits.push(this.lapT); this.next++; } }
    else { while (this.next > 0 && ahead(gs[this.next - 1], from) <= span) { this.next--; this.splits.pop(); } }
    this.prevS = to; if (this.R) this.R.s = to;
  }
  end(why) {
    if (!this.running) return;
    this.stopRun();
    this.game.events?.emit('race.end', { why, mode: this.modeId, cup: !!this.opts.cup, city: !!this.opts.city, by: 'courier' });
  }

  /** The best lap, ridden again beside you as the lap's clock runs (a placeholder hull and sail: Calissa's look). */
  updateGhost() {
    const G = this.bestLap, on = this.running && this.state === 'run' && !this.ruleset && G?.frames?.length > 2; // (no ghost under a ruleset: its stretch is not a lap)
    if (!on) { if (this.ghost) this.ghost.visible = false; return; }
    if (!this.ghost) {
      const m = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.35, depthWrite: false });
      this.ghost = new THREE.Group(); this.ghost.userData.zone = 'raceway';
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 2.6), m); hull.position.y = -0.5;
      const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.3, 0.6), new THREE.Vector3(0, 2.6, 0.2), new THREE.Vector3(0, -0.3, -0.9)]), m); sail.material.side = THREE.DoubleSide;
      this.ghost.add(hull, sail); this.game.scene.add(this.ghost);
      this.game.racewayLooks?.dressGhost(this.ghost); // (Calissa's hologram of the skiff)
    }
    const F = G.frames, t = this.lapT; let i = 0; while (i < F.length - 2 && F[i + 1][0] < t) i++;
    const a = F[i], b = F[i + 1], u = Math.max(0, Math.min(1, (t - a[0]) / Math.max(1e-3, b[0] - a[0])));
    this.ghost.visible = t <= F[F.length - 1][0];
    this.ghost.position.set(a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u);
    this.ghost.rotation.y = a[4] + Math.atan2(Math.sin(b[4] - a[4]), Math.cos(b[4] - a[4])) * u;
  }
}
