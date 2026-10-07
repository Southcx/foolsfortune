// ---------------------------------------------------------------------------------------
// THE CROSSING'S STAGE: a hop across the Emocean played as a rail shooter (docs/plans/RAIL.md; the owner, 2026-10-07: "a love letter
// to the genre"). This is the conductor: it keeps the STAGE CLOCK, moves the RAIL, lays the CRUDE SEA under it, holds the camera on the
// VIEW the score asks for (and SWINGS between them), lets the waves in, keeps the RUN (the score, the chain, the hits) and, at bar 100
// or when the ship can bear no more, hands the run to the voyage (`stageResult`) and sets the Courier down at the pier.
//
//   THE CLOCK   the cue is the clock (Rez): the stage's bar is read off the music as it is heard (music/emocean.js stageAt), and where
//               there is no cue (muted, or no audio) the stage keeps its own, in real seconds. The two are slewed together, never
//               snapped backward; after a pause (the cue plays on under the menu) the stage jumps forward to the cue.
//   THE RAIL    a straight line along +Z in a zone of its own (render/zonemap.js 'emocean', far west, at the dunes' layer so their sky,
//               sun and fog are the sea's too: world/dunes/dunes.js). Everything that fights is kept in the rail's frame and carried.
//   THE VIEWS   courier/ship/views.js: five rigs over the rail point, blended across each swing (a bar, eased; the plane turns at its
//               midpoint), through the cinema's shot (vfx/cinema.js), with trauma-squared shake (Eiserloh).
//   THE COURIER is aboard: held at the ship's place (so what asks where they are, the sun's shadow, the stimuli, gets the ship), and
//               not drawn; main.js does not run their own machinery while `stage.active` (as for the god hand).
//
// The set pieces past bar 62 are R2 to R4 (the shoal's flock, the pirates, the Leviathan): until they are built, every crossing plays
// the authored waves and views of the shoal's score, says no set piece's beat, and ends with `end: null`.
//
// Prior art: Rez (the stage and its cue one thing), Star Fox 64 (the two-minute stage on rails, the tally), Panzer Dragoon (the rail
// as a line the camera rides and looks round from), Squirrel Eiserloh's "Juicing Your Cameras With Math" (trauma squared).
//
//   game.emocean = new Emocean(game)   .build() (at boot)   .begin() (after voyage.board)   .update(dt)   .finish(passed)
//   .stage { active, seconds }   .bar   .run   .ship   .waves   .shots   .rail { Q, speed, toWorld(l, out), dirWorld(v, out) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { CrudeSea } from '../../vfx/crudesea.js';
import { stageAt } from '../../music/emocean.js';
import { BARS, BAR_S, viewAt, swings as swingsOf } from '../../progress/rail/crossing.js';
import { SCORE, chain, chainDown, volleyBonus, downScore } from '../../progress/rail/score.js';
import { STAGE, stagePlan } from '../../progress/econ/emocean.js';
import { blendRig, rig } from '../../courier/ship/views.js';
import { Ship } from '../../courier/ship/ship.js';
import { Shots } from '../../courier/ship/shots.js';
import { Waves } from './waves.js';

/** Where the crossing is sailed: the rail's first point (render/zonemap.js 'emocean' holds it), at the dunes' layer. */
export const SEA_AT = { x: -3000, y: -420, z: -2000 };
/** The set pieces built so far (R2: the shoal, R3: the pirates, R4: the Leviathan). */
const BUILT = new Set();
const _sh = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 };
/** Aboard, what is the Courier's on foot steps out of the picture (as in a shot: vfx/cinema.js); the log stays, it carries what is said. */
const CSS = 'body.aboard #compass, body.aboard #speed, body.aboard #course, body.aboard #locks, body.aboard #crosshair, body.aboard #toolstrip { opacity: 0 !important; }';

export class Emocean {
  constructor(game) {
    this.game = game;
    this.stage = { active: false, seconds: STAGE.seconds };
    const Q = new THREE.Vector3(SEA_AT.x, SEA_AT.y, SEA_AT.z);
    this.rail = {
      Q, speed: T.ship.speed,
      toWorld: (l, out) => out.set(Q.x - l.x, Q.y + l.y, Q.z + l.z), // (R is world -X: the chase view's screen right)
      dirWorld: (v, out) => out.set(-v.x, v.y, v.z),
    };
    this.ship = new Ship(game, this.rail); this.shots = new Shots(game, this.rail); this.waves = new Waves(game, this.rail);
    this.t = 0; this.bar = 0; this.run = null; this.plan = null; this.trauma = 0; this.volleys = [];
    this.wire();
    if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  }

  /** At boot: the sea, the ship, the pools, parked hidden (their programs compiled with the warm-up, casebook 17). */
  build() {
    const g = this.game, sc = g.scene;
    this.sea = new CrudeSea({ env: g.sky?.env || null, y: SEA_AT.y });
    this.sea.mesh.visible = false; this.sea.mesh.userData.zoneFree = true; sc.add(this.sea.mesh);
    this.ship.build(sc); this.shots.build(sc); this.waves.build(sc);
    this.built = true;
  }
  show(on) { this.sea.mesh.visible = on; this.ship.show(on); this.shots.show(on); }

  /** What the ship and the waves tell the run. */
  wire() {
    const S = this.ship, W = this.waves;
    W.onSpawn = (n) => { if (this.run) this.run.spawned += n; };
    W.onDown = (f, { returned, volley }) => this.down(f, returned, volley);
    S.onHit = () => {
      const r = this.run; if (!r || this.ending) return;
      r.hits++; this.trauma = Math.min(1, this.trauma + T.ship.trauma.hit);
      this.game.events?.emit('rail.hit', { hits: r.hits, bears: r.bears, by: 'creature' });
      if (r.hits >= r.bears) this.finish(false);
    };
    S.onAbsorb = () => { const r = this.run; if (!r) return; r.absorbed++; r.score += SCORE.absorb; this.game.lachryma?.gain(T.ship.absorb, 'absorb'); };
    S.onRoll = () => { if (this.run) this.run.rolls++; };
    S.onParry = (n) => {
      if (!this.run) return;
      this.run.parried += n; this.trauma = Math.min(1, this.trauma + 0.2);
      this.game.time?.pulse('parry', 0.05, 0.08, { release: 0.2 }); sfx.parry();
      this.game.events?.emit('move.parry', { tool: 'sloop', how: 'return', what: 'shot', by: 'courier' });
    };
    S.onVolley = (v) => this.volleys.push(v);
  }

  // ---------------------------------------------------------------- the crossing
  /** Cast off (the voyage has boarded): the plan read, the Courier taken aboard under a cover. */
  begin() {
    const g = this.game, V = g.voyage?.sailing, plan = g.voyage?.crossing();
    if (!V || !plan || this.stage.active) return false;
    if (!this.built) this.build();
    const piece = BUILT.has(plan.setPiece) ? plan.setPiece : 'shoal';
    // (until a set piece is built, the authored waves past bar 62 come as in the shoal's score)
    const waves = BUILT.has(plan.setPiece) ? plan.waves : (stagePlan(V.from, V.to, V.day, V.wx, (id) => g.voyage.isOpen(id)) || []).map((w) => ({ ...w, bar: Math.round(w.at * BARS) }));
    this.plan = { ...plan, piece, waves, swings: swingsOf(piece) };
    const aspect = g.weather?.at?.(V.from)?.aspect || 'mirth'; // (your draught when the stones keep one; until then the island's mood)
    const go = () => {
      this.stage.active = true; this.stage.seconds = STAGE.seconds;
      this.t = 0; this.bar = 0; this.ending = false; this.trauma = 0; this.volleys = []; this.beaten = new Set();
      this.run = { passed: true, hits: 0, bears: STAGE.bears, downed: 0, spawned: 0, score: 0, chainBest: 0, volleyBest: 0, parried: 0, absorbed: 0, rolls: 0, pointBlank: 0, end: null, won: 0, stolen: 0, chain: chain() };
      this.rail.Q.set(SEA_AT.x, SEA_AT.y, SEA_AT.z);
      this.ship.begin(aspect); this.shots.clear(); this.waves.begin(this.plan, aspect);
      this.show(true);
      g.character?.setHidden(true); document.body.classList.add('aboard');
      this.hold(); this.camera(0, true);
      g.events?.emit('rail.start', { setPiece: plan.setPiece, from: V.from, to: V.to, by: 'courier' });
    };
    this.boarding = true;
    if (g.seam) g.seam.cross(() => { this.boarding = false; go(); }, { kind: 'sea' }); else { this.boarding = false; go(); }
    return true;
  }

  /** A crossing the game was closed in the middle of (the voyage keeps `sailing` through a reload; the stage does not): it is
   *  settled as made, unscored (`score: null`: no tally, no rank, nothing counted), and the Courier is at the far island. */
  unfinished() {
    const V = this.game.voyage;
    if (this.boarding || !V?.sailing || this.game.seam?.busy) return;
    V.stageResult({ passed: true, score: null });
  }

  /** Once a frame (before the camera: main.js). */
  update(dt) {
    if (!this.stage.active) { this.unfinished(); return; }
    const g = this.game, raw = g.rawDt ?? dt;
    this.clock(raw);
    const bar = this.bar, sw = this.swingAt(bar), view = sw ? (sw.k < 0.5 ? sw.from : sw.to) : viewAt(bar, this.plan.piece);
    this.rail.Q.set(SEA_AT.x, SEA_AT.y, SEA_AT.z + this.rail.speed * this.t);
    this.ship.update(dt, { view, plane: view, sixteenth: Math.floor(bar * 16), shots: this.shots, waves: this.waves });
    if (!this.stage.active) return; // (the last hit ended it)
    this.waves.update(dt, { bar, ship: this.ship, shots: this.shots });
    this.shots.update(dt, { ship: this.ship, waves: this.waves });
    if (!this.stage.active) return;
    this.settle();
    this.hold();
    this.camera(raw);
    // the sea: the breather lays the swells down (bars 50 to 62)
    const calm = bar >= 50 && bar < 62 ? 1 : 0;
    this.calm = THREE.MathUtils.damp(this.calm ?? 0, calm, 1.2, raw);
    this.sea.set({ calm: this.calm }); this.sea.update(this.t, g.camera.position);
    // the set piece's beats (each once, on its bar), and the end
    for (const b of this.plan.beats || []) if (BUILT.has(this.plan.setPiece) && bar >= b.bar && !this.beaten.has(b.bar)) { this.beaten.add(b.bar); g.events?.emit('rail.beat', { beat: b.beat, by: 'environment' }); }
    if (this.t >= this.stage.seconds) this.finish(true);
  }

  /** The stage's seconds: its own clock in real time, slewed toward the cue as heard; forward to it when they are far apart. */
  clock(raw) {
    this.t += raw;
    const m = stageAt(this.game.music);
    if (m != null) {
      const heard = m * this.stage.seconds, d = heard - this.t;
      if (d > 3) this.t = heard; // (the cue played on under a pause: the stage catches up)
      else if (Math.abs(d) <= 3) this.t += d * Math.min(1, raw * 2); // (slewed, so nothing ever jumps)
    }
    this.bar = Math.max(0, this.t / BAR_S);
  }
  /** The swing under way at a bar, if any: { from, to, k } (it takes the bar before the act's first). */
  swingAt(bar) {
    for (const s of this.plan.swings) if (bar >= s.bar - 1 && bar < s.bar) return { from: s.from, to: s.to, k: bar - (s.bar - 1) };
    return null;
  }

  /** The Courier aboard: where the ship is (the sun's shadow and anything that asks where they are follow it). */
  hold() {
    const P = this.game.player; if (!P) return;
    this.rail.toWorld(this.ship.local, P.pos); P.prevPos.copy(P.pos); P.renderPos.copy(P.pos); P.vel.set(0, 0, 0);
    P.place?.();
  }

  /** The camera: the view's rig (or the swing's blend), shaken by trauma squared, through the cinema's shot. */
  camera(raw, cut = false) {
    const g = this.game, sw = this.swingAt(this.bar), S = this.ship.local;
    if (sw) blendRig(sw.from, sw.to, sw.k, this.rail.Q, S, _sh); else rig(viewAt(this.bar, this.plan.piece), this.rail.Q, S, _sh);
    this.trauma = Math.max(0, this.trauma - T.ship.trauma.decay * raw);
    const k = this.trauma * this.trauma, tt = this.t * 23;
    _sh.pos.x += k * 0.5 * Math.sin(tt * 1.7); _sh.pos.y += k * 0.5 * Math.sin(tt * 2.3 + 1);
    const roll = k * 0.06 * Math.sin(tt * 1.3 + 2);
    g.cinema?.shot('rail', { pos: _sh.pos, look: _sh.look, fov: _sh.fov, roll, bars: 0, ease: cut ? 60 : 40 });
  }

  /** The volleys whose lances have all flown: paid if every lock was downed (RayStorm). */
  settle() {
    const r = this.run;
    for (let i = this.volleys.length - 1; i >= 0; i--) {
      const v = this.volleys[i]; if (v.flown < v.n) continue;
      this.volleys.splice(i, 1);
      const bonus = volleyBonus(v.n, v.downs);
      if (bonus) { r.score += bonus; r.volleyBest = Math.max(r.volleyBest, bonus); }
      this.game.events?.emit('rail.volley', { locks: v.n, downs: v.downs, bonus, by: 'courier' });
    }
  }

  /** A foe downed: its pay (class, point blank, its own shot sent back), the chain, the volley's count, the weight of it. */
  down(f, returned, volley) {
    const r = this.run; if (!r || this.ending) return;
    const pointBlank = f.local.distanceTo(this.ship.local) < SCORE.pointBlank.within;
    const pay = downScore({ cls: f.cls, pointBlank, returned }), link = chainDown(r.chain, f.aspect);
    r.score += pay + link; r.downed++; if (pointBlank) r.pointBlank++; if (link) r.chainBest = Math.max(r.chainBest, link);
    if (volley) volley.downs++;
    const H = T.ship.hitstop, heavy = f.role === 'heavy';
    if (heavy || f.cls >= 2) { this.game.time?.pulse('rail.down', 0.05, heavy ? H.heavy : H.mid, { release: 0.1 }); }
    if (heavy) this.trauma = Math.min(1, this.trauma + T.ship.trauma.heavy);
    sfx.pop?.(heavy ? 2 : 6);
    this.game.events?.emit('rail.down', { kind: f.role, cls: f.cls, aspect: f.aspect, returned, pointBlank, pay, chain: link, by: 'courier' });
  }

  /** The crossing is over: the tally, the run to the voyage, and the Courier set down at the pier under a cover. Until R4 every
   *  pier is Anagami's jetty (the voyage still knows which island they made port at). */
  finish(passed) {
    if (!this.stage.active || this.ending) return;
    this.ending = true;
    const g = this.game, r = this.run;
    r.passed = passed && r.hits < r.bears;
    if (r.passed) r.score += (r.bears - r.hits) * SCORE.bears; // (Star Fox 64's tally: what the ship could still bear)
    const run = { ...r }; delete run.chain;
    g.voyage?.stageResult(run);
    const go = () => {
      this.stage.active = false; this.ending = false;
      this.waves.end(); this.shots.clear(); this.show(false);
      g.cinema?.cut('rail'); document.body.classList.remove('aboard');
      const j = g.dunes?.beach?.jetty;
      if (j) g.places?.stand(j.end.clone().setY(j.top + 0.05), -Math.PI / 2); // (facing the land: the jetty runs out east)
      else g.character?.setHidden(false);
    };
    if (g.seam) g.seam.cross(go, { kind: 'sea' }); else go();
  }
}
