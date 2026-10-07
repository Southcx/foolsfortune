// ---------------------------------------------------------------------------------------
// THE CROSSING'S STAGE: a hop across the Emocean played as a rail shooter (docs/plans/RAIL.md; the owner, 2026-10-07: "a love letter
// to the genre"). This is the conductor: it keeps the STAGE CLOCK, moves the RAIL, lays the CRUDE SEA under it, holds the camera on the
// VIEW the score asks for (and SWINGS between them), lets the waves in, runs each SET PIECE in its leg, keeps the RUN (the score, the
// chain, the hits), offers the CONTINUE when the ship can bear no more, and at the last bar hands the run to the voyage (`stageResult`)
// and sets the Courier down at the far island's pier (or, broken, at their last Shrine).
//
//   THE CLOCK      the cue is the clock (Rez): the bar is read off the music as heard (music/emocean.js stageAt, Wanda's cue chained to
//                  the crossing's set pieces: 100, 146 or 192 bars), and where there is no cue the stage keeps its own, in real seconds.
//                  The two are slewed together, never snapped backward; after a pause (the cue plays on) the stage jumps forward to it.
//   THE RAIL       a straight line along +Z in a zone of its own (render/zonemap.js 'emocean', at the dunes' layer, their sky the sea's).
//                  Everything that fights is kept in the rail's frame and carried.
//   THE VIEWS      courier/ship/views.js: five rigs over the rail point, blended across each swing (a bar, eased; the plane turns at its
//                  midpoint), the swing's smear and breath of the lens Calissa's (vfx/rail.js swingLook), trauma-squared shake.
//   THE LEGS       a crossing of one to three set pieces (progress/rail/crossing.js script: Dovina's), each run by its director: the shoal
//                  (shoal.js), the pirates (pirates.js), Old Nobody (leviathan.js); a breather between two mends the ship by three; the
//                  .hack glitch at each set piece's first beat (the moments that earn it).
//   THE CONTINUE   the ship's last hit opens the arcade's coin (voyage.continueCost / continueRun): paid, it is mended whole and flies
//                  on; declined, it breaks up and you are made whole at your last Shrine (the voyage moves you to its island).
//   THE COURIER    is aboard: held at the ship's place, not drawn; main.js does not run their own machinery while `stage.active`.
//
// Prior art: Rez (the stage and its cue one thing), Star Fox 64 (the two-minute stage on rails, the tally), Panzer Dragoon (the rail
// as a line the camera rides and looks round from), the arcade's CONTINUE? screen, Squirrel Eiserloh's "Juicing Your Cameras With Math".
//
//   game.emocean = new Emocean(game)   .build() (at boot)   .begin() (after voyage.board)   .update(dt)   .finish(passed)
//   .stage { active, seconds, setPieces }   .bar   .run   .ship   .waves   .shots   .mounts   .piece   .rail { Q, speed, toWorld, dirWorld }
//   .blow(n, { by, what, rollable })   .endPay(end)   (the set pieces')
//   /crossing shoal,pirates,leviathan   (the chat line: the next crossing's set pieces, for testing them on demand; the dice and the deck otherwise)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { CrudeSea } from '../../vfx/crudesea.js';
import { ShipWake, swingLook } from '../../vfx/rail.js';
import { COLOR } from '../../progress/weather.js';
import { stageAt } from '../../music/emocean.js';
import { BAR_S, viewAt, script } from '../../progress/rail/crossing.js';
import { SCORE, chain, chainDown, volleyBonus, downScore } from '../../progress/rail/score.js';
import { STAGE } from '../../progress/econ/emocean.js';
import { blendRig, rig } from '../../courier/ship/views.js';
import { Ship } from '../../courier/ship/ship.js';
import { Shots } from '../../courier/ship/shots.js';
import { Mounts } from '../../courier/ship/mounts.js';
import { Waves } from './waves.js';
import { ShoalPiece } from './shoal.js';
import { PiratesPiece } from './pirates.js';
import { LeviathanPiece } from './leviathan.js';
import { openSea } from '../../render/zonemap.js';

/** Where the crossing is sailed: the rail's first point (render/zonemap.js 'emocean' holds it), at the dunes' layer. */
export const SEA_AT = { x: -3000, y: -420, z: -2000 };
const _sh = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 };
/** Aboard, what is the Courier's on foot steps out of the picture (as in a shot: vfx/cinema.js); the log stays, it carries what is said. */
const CSS = 'body.aboard #compass, body.aboard #speed, body.aboard #course, body.aboard #locks, body.aboard #crosshair, body.aboard #toolstrip { opacity: 0 !important; }';

export class Emocean {
  constructor(game) {
    this.game = game;
    this.stage = { active: false, seconds: STAGE.seconds, setPieces: ['shoal'], setPiece: 'shoal' };
    const Q = new THREE.Vector3(SEA_AT.x, SEA_AT.y, SEA_AT.z);
    this.rail = {
      Q, speed: T.ship.speed,
      toWorld: (l, out) => out.set(Q.x - l.x, Q.y + l.y, Q.z + l.z), // (R is world -X: the chase view's screen right)
      dirWorld: (v, out) => out.set(-v.x, v.y, v.z),
    };
    this.ship = new Ship(game, this.rail); this.shots = new Shots(game, this.rail); this.waves = new Waves(game, this.rail);
    this.mounts = new Mounts(game, this);
    this.pieces = { shoal: new ShoalPiece(this), pirates: new PiratesPiece(this), leviathan: new LeviathanPiece(this) };
    this.t = 0; this.bar = 0; this.run = null; this.plan = null; this.trauma = 0; this.volleys = []; this.piece = null;
    this.wire();
    game.events?.on?.('rail.warn', () => this.mounts.warn());
    if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  }

  /** At boot: the sea, the ship, the pools, the set pieces' looks, parked hidden (programs compiled with the warm-up, casebook 17). */
  build() {
    const g = this.game, sc = g.scene;
    this.sea = new CrudeSea({ env: g.sky?.env || null, y: SEA_AT.y });
    this.sea.mesh.visible = false; this.sea.mesh.userData.zoneFree = true; sc.add(this.sea.mesh);
    this.ship.build(sc); this.shots.build(sc); this.waves.build(sc);
    for (const p of Object.values(this.pieces)) p.build(sc);
    this.wake = new ShipWake(g); for (const ln of this.wake.lines) { ln.m.visible = false; ln.m.userData.zoneFree = true; }
    this.built = true;
  }
  /** What is parked for the warm-up's compile (main.js shows them for one draw, then hides them again). */
  parked() { return [this.sea.mesh, this.waves.parked, this.ship.sloop.group, this.pieces.shoal.look.group, this.pieces.pirates.look.group, this.pieces.leviathan.look.group, ...this.pieces.pirates.boarders.map((b) => b.group), ...this.wake.lines.map((l) => l.m)]; }
  show(on) { this.sea.mesh.visible = on; this.ship.show(on); this.shots.show(on); for (const ln of this.wake?.lines || []) ln.m.visible = on; }

  /** What the ship and the waves tell the run. */
  wire() {
    const S = this.ship, W = this.waves;
    W.onSpawn = (n) => { if (this.run) this.run.spawned += n; };
    W.onDown = (f, { returned, volley }) => this.down(f, returned, volley);
    S.onHit = () => this.wound(1, { by: 'creature', what: 'shot' });
    S.onAbsorb = () => { const r = this.run; if (!r || this.ending) return; r.absorbed++; r.score += SCORE.absorb; this.game.lachryma?.gain(T.ship.absorb, 'absorb'); };
    S.onRoll = () => { if (this.run) this.run.rolls++; };
    S.onParry = (n) => {
      if (!this.run) return;
      this.run.parried += n; this.trauma = Math.min(1, this.trauma + 0.2);
      this.game.time?.pulse('parry', 0.05, 0.08, { release: 0.2 }); sfx.parry();
      this.game.events?.emit('move.parry', { tool: 'sloop', how: 'return', what: 'shot', by: 'courier' });
    };
    S.onVolley = (v) => this.volleys.push(v);
    S.onLock = (n) => this.game.events?.emit('rail.lock', { n, by: 'courier' }); // (its tone on the music's sixteenth: audio/cues.js, Wanda's)
  }

  // ---------------------------------------------------------------- the crossing
  /** Cast off (the voyage has boarded): the plan read, the Courier taken aboard under a cover. */
  begin() {
    const g = this.game, V = g.voyage?.sailing;
    const plan = this.force && V ? script(V.from, V.to, V.day, { casks: V.casks, wx: V.wx, open: (id) => g.voyage.isOpen(id), pieces: this.force }) : g.voyage?.crossing();
    if (this.force && V && plan) { V.setPieces = plan.setPieces; V.setPiece = plan.setPiece; this.force = null; } // (a tester's choice: the voyage ranks and pays the set pieces sailed)
    if (!V || !plan || this.stage.active) return false;
    if (!this.built) this.build();
    this.plan = plan; this.to = V.to;
    const aspect = g.weather?.at?.(V.from)?.aspect || 'mirth'; // (your draught when the stones keep one; until then the island's mood)
    const go = () => {
      Object.assign(this.stage, { setPieces: plan.setPieces, setPiece: plan.setPiece, seconds: plan.seconds || plan.bars * BAR_S }); // (the cue chained to them: music/choose.js)
      this.stage.active = true;
      this.t = 0; this.bar = 0; this.ending = false; this.trauma = 0; this.volleys = []; this.beaten = new Set(); this.mended = new Set(); this.piece = null; this.offering = false;
      this.run = { passed: true, hits: 0, bears: STAGE.bears, downed: 0, spawned: 0, score: 0, chainBest: 0, volleyBest: 0, parried: 0, absorbed: 0, rolls: 0, pointBlank: 0, end: null, won: 0, stolen: 0, chain: chain() };
      this.rail.Q.set(SEA_AT.x, SEA_AT.y, SEA_AT.z);
      this.ship.begin(aspect); this.ship.sloop?.polarity?.(COLOR[aspect] ?? 0xffc65c);
      this.shots.clear(); this.waves.begin(plan, aspect); this.mounts.begin(V.mounts || []);
      this.show(true);
      g.character?.setHidden(true); document.body.classList.add('aboard');
      this.hold(); this.camera(0, true);
      g.events?.emit('rail.start', { setPiece: plan.setPiece, setPieces: plan.setPieces, legs: plan.legs, from: V.from, to: V.to, by: 'courier' });
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
    const g = this.game, raw = g.rawDt ?? dt;
    if (!this.chatted && g.chat?.add) { this.chatted = true; g.chat.add('crossing', { help: 'the next crossing\'s set pieces, one to three of shoal, pirates, leviathan: /crossing pirates,leviathan', run: (_, arg) => { const L = String(arg || '').split(/[ ,]+/).filter((x) => this.pieces[x]).slice(0, 3); this.force = L.length ? L : null; g.events?.emit('rail.force', { setPieces: L, by: 'courier' }); } }); }
    if (!this.stage.active) { this.unfinished(); this.ashore(raw); return; }
    if (this.offering) { if (!g.indexMenu?.open) this.decline(); return; } // (the coin's page closed unanswered: the ship breaks up)
    this.clock(raw);
    const bar = this.bar, sw = this.swingAt(bar), view = sw ? (sw.k < 0.5 ? sw.from : sw.to) : viewAt(bar, this.plan);
    this.rail.Q.set(SEA_AT.x, SEA_AT.y, SEA_AT.z + this.rail.speed * this.t);
    this.legs(bar);
    const rel = this.piece ? bar - this.piece.leg.from : 0;
    this.ship.update(dt, { view, plane: view, sixteenth: Math.floor(bar * 16), shots: this.shots, waves: this.waves, abeam: !!this.piece?.abeam?.(rel) });
    if (!this.stage.active || this.offering) return;
    const ctx = { bar, ship: this.ship, shots: this.shots, waves: this.waves };
    this.piece?.update(dt, rel, ctx);
    this.waves.update(dt, ctx);
    this.shots.update(dt, ctx);
    this.mounts.update(dt, ctx);
    if (!this.stage.active || this.offering) return;
    this.settle();
    this.hold();
    this.camera(raw);
    this.look(raw, bar);
    for (const b of this.plan.beats || []) if (bar >= b.bar && !this.beaten.has(b.bar)) { this.beaten.add(b.bar); g.events?.emit('rail.beat', { beat: b.beat, setPiece: b.setPiece, leg: b.leg, by: 'environment' }); }
    if (this.t >= this.stage.seconds) this.finish(true);
  }

  /** The legs: a set piece's director from its first bar to its last; a breather between two mends the ship. */
  legs(bar) {
    const act = this.plan.acts.find((a) => bar >= a.from && bar < a.to);
    if (this.piece && bar >= this.piece.leg.to) this.close();
    if (act?.id === 'setpiece' && !this.piece && !this.beaten.has(`leg${act.leg}`)) {
      this.beaten.add(`leg${act.leg}`);
      this.pieceId = act.setPiece; this.piece = this.pieces[act.setPiece];
      this.piece.leg = { k: act.leg, from: act.from, to: act.to, setPiece: act.setPiece };
      this.piece.begin(this.piece.leg);
      this.game.glitch?.pulse({ split: 0.7, tear: 0.5, mosh: 0.25, crush: 0.5, dur: 0.7 }); // (the .hack tear at a set piece's first beat: the moments that earn it)
    }
    if (act?.id === 'breather' && act.mends && !this.mended.has(act.leg)) {
      this.mended.add(act.leg);
      const r = this.run, m = Math.min(r.hits, act.mends); r.hits -= m;
      this.game.events?.emit('rail.mend', { mend: m, hits: r.hits, bears: r.bears, by: 'environment' });
    }
  }
  /** A set piece's last bar: its director's end said and paid (if it has not been already). */
  close() {
    const end = this.piece.finish();
    if (end) this.run.end = end;
    this.piece = null;
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

  /** The camera: the view's rig (or the swing's blend, with its smear and breath), shaken by trauma squared, through the cinema's shot. */
  camera(raw, cut = false) {
    const g = this.game, sw = this.swingAt(this.bar), S = this.ship.local;
    if (sw) { blendRig(sw.from, sw.to, sw.k, this.rail.Q, S, _sh); swingLook(g, sw.k, sw.from, sw.to); _sh.fov += 6 * Math.sin(Math.PI * sw.k); this.swinging = true; }
    else { rig(viewAt(this.bar, this.plan), this.rail.Q, S, _sh); if (this.swinging) { swingLook(g, 1); this.swinging = false; } }
    this.trauma = Math.max(0, this.trauma - T.ship.trauma.decay * raw);
    const k = this.trauma * this.trauma, tt = this.t * 23;
    _sh.pos.x += k * 0.5 * Math.sin(tt * 1.7); _sh.pos.y += k * 0.5 * Math.sin(tt * 2.3 + 1);
    const roll = k * 0.06 * Math.sin(tt * 1.3 + 2);
    g.cinema?.shot('rail', { pos: _sh.pos, look: _sh.look, fov: _sh.fov, roll, bars: 0, ease: cut ? 60 : 40 });
  }

  /** The sea and the ship's looks: the breathers lay the swells down; the wake at speed; the hull's steady glow after a hit; polarity. */
  look(raw, bar) {
    const g = this.game, act = this.plan.acts.find((a) => bar >= a.from && bar < a.to), S = this.ship;
    this.calm = THREE.MathUtils.damp(this.calm ?? 0, act?.id === 'breather' ? 1 : 0, 1.2, raw);
    this.sea.set({ calm: this.calm }); this.sea.update(this.t, g.camera.position);
    const sl = S.sloop;
    if (sl) {
      sl.hurt?.(Math.min(1, S.mercy / T.ship.mercy));
      if (this.aspectWas !== S.aspect) { this.aspectWas = S.aspect; sl.polarity?.(COLOR[S.aspect] ?? 0xffc65c); }
      this.wake?.update(raw, { group: sl.group, speed: this.rail.speed + S.boostZ, length: 7 * sl.group.scale.x, beam: 2.4 * sl.group.scale.x }, this.sea);
    }
  }

  /** Off the rail: a far dock's sea (Margarite's) lies round the Courier while they are on it. */
  ashore(raw) {
    if (!this.built) return;
    const here = openSea(this.game.camera.position);
    if (here !== this.seaAshore) { this.seaAshore = here; this.sea.mesh.visible = here; }
    if (here) { this.seaT = (this.seaT || 0) + raw; this.sea.set({ calm: 0.6 }); this.sea.update(this.seaT, this.game.camera.position); }
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

  /** A foe downed: its pay (its own, a part's; else its class), twice at point blank, three times by its own shot sent back; the chain
   *  (unless it stands outside it: a glint, a part), the medal's count, the volley's count, the weight of it. */
  down(f, returned, volley) {
    const r = this.run; if (!r || this.ending) return;
    const pointBlank = f.local.distanceTo(this.ship.local) < SCORE.pointBlank.within;
    const pay = f.pay != null ? f.pay * (pointBlank ? SCORE.pointBlank.mult : 1) * (returned ? SCORE.returned : 1) : downScore({ cls: f.cls, pointBlank, returned });
    const link = f.chain === false ? 0 : chainDown(r.chain, f.aspect);
    r.score += pay + link; if (f.count !== false) r.downed++; if (pointBlank) r.pointBlank++; if (link) r.chainBest = Math.max(r.chainBest, link);
    if (volley) volley.downs++;
    const H = T.ship.hitstop, heavy = f.role === 'heavy' || f.role === 'brig' || f.role === 'gill', fish = f.role === 'glint';
    if (!fish && (heavy || f.cls >= 2)) this.game.time?.pulse('rail.down', 0.05, heavy ? H.heavy : H.mid, { release: 0.1 });
    if (heavy) this.trauma = Math.min(1, this.trauma + T.ship.trauma.heavy);
    this.game.events?.emit('rail.down', { kind: f.role, cls: f.cls, aspect: f.aspect, returned, pointBlank, pay, chain: link, by: 'courier' }); // (its sound on the sixteenth: audio/cues.js)
  }
  /** A set piece's end paid (the brig sunk, the shoal scattered, Old Nobody driven or felled). */
  endPay(end) { const r = this.run; if (!r || this.ending) return; r.score += SCORE.end[end] || 0; r.end = end; }

  // ---------------------------------------------------------------- what the ship bears
  /** A set piece's big blow (the ram, the breach, a fin, five bites): unless untouchable or rolled through. */
  blow(n = 1, { by = 'creature', what = 'blow', rollable = false } = {}) {
    const S = this.ship;
    if (!this.run || this.ending || this.offering) return false;
    if (S.mercy > 0) return false;
    if (rollable && S.rollT > 0) { this.game.events?.emit('rail.dodge', { what, by: 'courier' }); return false; }
    S.mercy = T.ship.mercy; sfx.impact?.(1);
    this.wound(n, { by, what });
    return true;
  }
  wound(n, { by = 'creature', what = 'shot' } = {}) {
    const r = this.run; if (!r || this.ending || this.offering) return;
    r.hits = Math.min(r.bears, r.hits + n); this.trauma = Math.min(1, this.trauma + T.ship.trauma.hit);
    this.game.events?.emit('rail.hit', { hits: r.hits, bears: r.bears, what, by });
    if (r.hits >= r.bears) this.broken();
  }

  /** The ship can bear no more: the CONTINUE (an arcade's coin), on the index's window; no window, it breaks up. */
  broken() {
    const g = this.game, V = g.voyage, M = g.indexMenu;
    if (!M || !V?.continueCost) { this.finish(false); return; }
    const share = Math.min(1, this.t / this.stage.seconds), cost = V.continueCost(share);
    this.offering = true;
    M.showPage('continue', (im, el) => {
      const box = el('div', 'rooms');
      const yes = el('div', 'room', `<span class="n">◇</span><span><b>Continue</b><s>${cost} cubes: the ship mended whole, and on</s></span>`);
      yes.onclick = () => {
        const r = V.continueRun(share);
        if (!r.ok) { g.log?.say('warn', r.why, { key: 'continue', throttle: 1 }); return; }
        this.offering = false; this.run.hits = 0; this.ship.mercy = 2 * T.ship.mercy; M.close();
      };
      const no = el('div', 'room', '<span class="n">·</span><span><b>Let it break</b><s>you are made whole at your last Shrine; a quarter of the cargo is lost</s></span>');
      no.onclick = () => this.decline();
      box.appendChild(yes); box.appendChild(no);
      for (const e of [el('div', 'grp', 'THE SHIP CAN BEAR NO MORE'), box]) im.appendChild(e);
    }, { title: 'CONTINUE?', sub: `you have ${g.cubes?.balance ?? 0} cubes` });
  }
  decline() { this.offering = false; this.game.indexMenu?.open && this.game.indexMenu.close(); this.finish(false); }

  /** The crossing is over: the tally, the run to the voyage, and the Courier set down under a cover: at the far island's pier, or
   *  (the ship broken) made whole at their last Shrine, as a shatter does. */
  finish(passed) {
    if (!this.stage.active || this.ending) return;
    this.ending = true;
    const g = this.game, r = this.run;
    if (this.piece) { const end = this.piece.finish(); if (end) r.end = end; this.piece = null; }
    r.passed = passed && r.hits < r.bears;
    if (r.passed) r.score += (r.bears - r.hits) * SCORE.bears; // (Star Fox 64's tally: what the ship could still bear)
    const run = { ...r }; delete run.chain;
    g.voyage?.stageResult(run);
    const to = this.to;
    const go = () => {
      this.stage.active = false; this.ending = false;
      this.waves.end(); this.shots.clear(); this.show(false); for (const p of Object.values(this.pieces)) p.show(false);
      swingLook(g, 1);
      g.cinema?.cut('rail'); document.body.classList.remove('aboard');
      const at = passed ? g.pier?.landing(to) : g.shrines?.reformAt?.();
      if (!passed) { g.vesselDamage?.mendAll?.(true); g.lachryma?.reset?.(); }
      if (at) g.places?.stand(at.pos, at.yaw); else g.character?.setHidden(false);
      g.character?.setHidden(false);
    };
    if (g.seam) g.seam.cross(go, { kind: 'sea' }); else go();
  }
}
