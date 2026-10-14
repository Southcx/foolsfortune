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
// Events (each with `by`): race.start { condition, light, aspect }, race.count { n }, race.go, race.solarstart, race.gate { gate, lap, split }, race.lap { lap,
// seconds, best }, race.finish { seconds, medal, laps, condition, track }, race.end { why }.
// The ghost's look is a placeholder (Calissa's): a pale hull and sail.
//
// Prior art: MK8's time trials (the ghost, the rocket start, a medal as a test passed once), Gran Turismo's licence tests, Wave Race's and
// Pilotwings' gates in order, Trackmania's checkpoint splits.
//
//   game.race = new Race(game)   .offer() -> { pos, d } | null   .start()   .update(dt)   .running   RACE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ECON } from '../../progress/econ/table.js';
import { conditionAt } from './conditions.js';

/** The numbers: laps; the countdown (real s); the solar start's window after GO and its push; the medals by total time (real s, three
 *  laps: drafts until Petra measures the line, and they move with it); each medal's pay once (minutes of play); the ghost's samples a
 *  second; real seconds after a bail before the board is set back on the track. */
export const RACE = {
  laps: 3, countdown: 3, solar: { window: 0.3, add: 12, dur: 1.3, kick: 4 },
  medals: { gold: 255, silver: 285, bronze: 330 }, pay: { gold: 10, silver: 6, bronze: 4 }, ghostHz: 10, bailBack: 2.9,
};
export const medalOfRace = (seconds) => (seconds <= RACE.medals.gold ? 'gold' : seconds <= RACE.medals.silver ? 'silver' : seconds <= RACE.medals.bronze ? 'bronze' : null);

export class Race {
  constructor(game) {
    this.game = game; this.running = false; this.state = 'idle';
    this.bestLaps = {}; // { [track]: { seconds, splits: [s at each gate], frames: [[t, x, y, z, yaw]] } } (the ledger keeps the times)
    this.T = null; // (the track raced)
    game.interact?.add('race', () => (game.dialogue?.open ? null : this.offer()));
    game.events?.on('skiff.pump', () => { if (this.state === 'run' && this.goT != null && this.goT <= RACE.solar.window && !this.solarDone) { this.solarDone = true; this.skiff?.kick(RACE.solar.add, RACE.solar.dur, RACE.solar.kick); game.events.emit('race.solarstart', { by: 'courier' }); } });
    game.events?.on('skiff.bail', () => { if (this.running) this.bailT = 0; });
    // the best lap's ghost is kept (the save's `raceGhost`, player scope: a build's progress, reset with it); its frames to a tenth
    const pack = (B) => ({ seconds: B.seconds, splits: B.splits.map((v) => +v.toFixed(2)), frames: B.frames.map((f) => f.map((v) => +v.toFixed(1))) });
    game.save?.section('raceGhost', { scope: 'player', version: 2,
      dump: () => Object.fromEntries(Object.entries(this.bestLaps).map(([k, B]) => [k, pack(B)])),
      load: (d) => { this.bestLaps = {}; for (const [k, B] of Object.entries(d || {})) if (B?.frames?.length) this.bestLaps[k] = B; }, reset: () => { this.bestLaps = {}; } });
  }
  get R() { return this.game.raceway; }
  get bestLap() { return this.T ? this.bestLaps[this.T.id] || null : null; }
  get skiff() { return this.game.player?.techs?.get?.('skiff'); }

  offer() {
    const R = this.R, P = this.game.player; if (!R?.built || this.running || !R.active) return null;
    let best = null;
    for (const Pl of R.pillars) { const d = Math.hypot(P.pos.x - Pl.pos.x, P.pos.z - Pl.pos.z); if (d < 7 && (!best || d < best.d)) best = { pos: Pl.pos.clone().setY(Pl.pos.y + 3), d, track: Pl.track }; }
    this.offered = best?.track; return best;
  }

  start(trackId = this.offered || 'sun') {
    if (this.running) return false;
    const g = this.game, R = this.R; if (!R?.active) return false;
    const T = (this.T = R.trackOf(trackId) || R.T), grid = T.line - 20; R.respawn((grid + T.length) % T.length, T);
    this.running = true; this.state = 'grid'; this.t = 0; this.count = RACE.countdown; this.said = null; this.goT = null; this.solarDone = false;
    this.lap = 1; this.next = 0; this.lapT = 0; this.splits = []; this.frames = []; this.laps = []; this.prevS = R.s; this.back = 0; this.bailT = null; this.ghostT = 0;
    const C = (this.condition = conditionAt(g));
    g.events?.emit('race.start', { track: T.id, condition: C.key, light: C.key.split('.')[0], aspect: C.aspect, by: 'courier' });
    return true;
  }

  update(dt) {
    const g = this.game, R = this.R, PL = g.player, it = g.interact?.cur;
    if (it?.id === 'race' && PL.peekLatch?.('KeyF') && !g.god?.controlling) { PL.latch('KeyF'); this.start(); }
    this.updateGhost();
    if (!this.running) return;
    if (!R?.active) { this.end('left'); return; }
    const S = this.skiff, riding = g.techs?.active?.id === 'skiff' && S?.phase === 'ride';
    // ---- the grid and the countdown: the board held on the line until GO
    if (this.state === 'grid') {
      if (!riding) return; // (mounting: the countdown waits for the board)
      S.hold = true; this.count -= dt;
      const n = Math.ceil(this.count);
      if (n !== this.said && n > 0) { this.said = n; g.events?.emit('race.count', { n, by: 'courier' }); }
      if (this.count <= 0) { S.hold = false; this.state = 'run'; this.goT = 0; this.prevS = R.s; g.events?.emit('race.go', { by: 'courier' }); }
      return;
    }
    // ---- the run
    this.t += dt; this.lapT += dt; this.goT += dt;
    if (S) S.hold = false;
    if (this.bailT != null && (this.bailT += dt) > RACE.bailBack) { this.bailT = null; R.respawn(); } // (where they are: in the cavern, on its branch)
    // R: back to the last gate passed, mounted (Trackmania's respawn at a checkpoint): the lap goes on, the clock with it
    if (g.input?.wasPressed?.('KeyR') && !g.log?.typing) { this.bailT = null; const T = this.T, gs = this.next > 0 ? T.gates[this.next - 1] : T.line; R.respawn(gs + 2, T); this.prevS = R.s; g.events?.emit('race.back', { gate: this.next, by: 'courier' }); }
    // the ghost's samples of this lap
    if ((this.ghostT += dt) >= 1 / RACE.ghostHz) { this.ghostT = 0; this.frames.push([+this.lapT.toFixed(2), PL.pos.x, PL.pos.y, PL.pos.z, S?.heading ?? PL.bodyYaw]); }
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
    const i = this.next++, best = this.bestLap?.splits?.[i];
    this.splits.push(this.lapT);
    this.game.events?.emit('race.gate', { gate: i + 1, lap: this.lap, split: best != null ? +(this.lapT - best).toFixed(2) : null, by: 'courier' });
  }
  lapDone() {
    const g = this.game, seconds = +this.lapT.toFixed(2), best = !this.bestLap || seconds < this.bestLap.seconds;
    if (best) { this.bestLaps[this.T.id] = { seconds, splits: this.splits.slice(), frames: this.frames }; g.save?.dirty('raceGhost'); }
    this.laps.push(seconds);
    g.events?.emit('race.lap', { track: this.T.id, lap: this.lap, seconds, best, by: 'courier' });
    if (this.lap >= RACE.laps) { this.finish(); return; }
    this.lap++; this.next = 0; this.lapT = 0; this.splits = []; this.frames = [];
  }
  finish() {
    const g = this.game, L = g.ledger, seconds = +this.laps.reduce((a, b) => a + b, 0).toFixed(2), medal = this.T.id === 'sun' ? medalOfRace(seconds) : null; // (medals are the Sun Circuit's for now: the others' times are not yet measured)
    const first = medal && !(L?.get?.(`race.raceway.${medal}`) > 0); // (each medal pays once, ever: the ledger counts it as the event lands)
    g.events?.emit('race.finish', { seconds, medal, laps: this.laps.slice(), condition: this.condition?.key || 'day.fair', track: this.T.id, by: 'courier' });
    if (first) g.cubes?.earn(Math.round(RACE.pay[medal] * ECON.perMinute), 'trial');
    this.running = false; this.state = 'idle';
  }
  end(why) {
    if (this.skiff) this.skiff.hold = false;
    this.running = false; this.state = 'idle';
    this.game.events?.emit('race.end', { why, by: 'courier' });
  }

  /** The best lap, ridden again beside you as the lap's clock runs (a placeholder hull and sail: Calissa's look). */
  updateGhost() {
    const G = this.bestLap, on = this.running && this.state === 'run' && G?.frames?.length > 2;
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
