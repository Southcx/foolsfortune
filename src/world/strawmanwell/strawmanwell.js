// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL (South, 2026-10-31: "design another Well within the WORKSHOP that is our test environment for the ultimate distillations
// of the 2d platformer genre. Use the Strawman as your muse"; Dovina's plan and rules, docs/plans/STRAWMANS-WELL.md, progress/strawmanwell.js):
// the 2D platformer's test bench, the inside of Strawman's head, a toy theatre seen from the front. Its own zone (`strawmanwell`), indoors
// and far from everything (layout.js), and its own area (render/areas.js stage 2, as the Sandbox's): built on arrival, torn down whole
// after leaving. Wave 1 (the plan's section 4):
//   the frame        the plane, the keys and the side-on camera laid over the Courier in the Well and taken off on leaving (wellframe.js)
//   the wings        the hub: a door a stage (W or F at it) with its best stars, Strawman centre stage, the way back to the hub
//   the stages       The Run, The Climb, The Stomp (stages.js), The Brawl and The Machine (stagesmachine.js), The Flood (flood.js); each a
//                    lane with a start, checkpoints, a goal flag and a door back to the wings; a fall off the bottom puts you back at the
//                    last checkpoint in PIT.retry real s, never a shatter
//   the mechanics    thin platforms, springs, ice and goo, the wall kick, ? spools, stomp dummies (mechanics.js); the Machine's parts
//                    (machine.js); the Brawl's straw dummies, creatures with the percent (dummy.js, dummymind.js)
// What happened is said by events only (the tracking is Dovina's, feedback/tracking/strawmanwell.js): well.stage.enter { stage },
// well.stage.clear { stage, t, hits, string, rank, stars }, well.dummy.ko, well.dummy.trophy, well.flood.fill, well.verb { verb } (each
// verb's first use here), every one with `by`. The look is a placeholder: Calissa dresses the theatre; the words are Espada's.
//
// Prior art: the Sandbox's and the Touchstone's rooms (world/sandbox/, world/touchstone/: the area, the arrival, F wiring, the teardown);
// Super Mario Bros. 3's world map of short stages off a hub, Psychonauts' minds entered from a head, Elsword's dungeon rank.
//
//   game.strawmanWell = new StrawmansWell(game)   .here   .arrive()   .leave()   .go(stageId)   .build()   .teardown()   .built   .update(dt)
//   .light()   .frame (WellFrame)   .stage (the one you are in: { id, t0, hits, string, cleared })   .verb(id)   .hit()   .noteString(n)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf } from '../../render/zonemap.js';
import { STAGES, PIT, stageOf, rankOf, starsOf, VERB } from '../../progress/strawmanwell.js';
import { AT, LANES, laneOf, laneAt } from './layout.js';
import { WellFrame } from './wellframe.js';
import { StageKit } from './stagekit.js';
import { WellMechanics } from './mechanics.js';
import { WellMachine } from './machine.js';
import { StrawDummies } from './dummy.js';
import { FloodStage } from './flood.js';
import { buildWings, buildRun, buildClimb, buildStomp, clearClimb, stageDoor } from './stages.js';
import { buildBrawl, buildMachine, BRAWL } from './stagesmachine.js';

/** The theatre's air: a warm haze under the stage lights. */
export const AIR = { fog: 0x3a2618, density: 0.006 };
const BUILDERS = { run: buildRun, climb: buildClimb, stomp: buildStomp, brawl: buildBrawl, machine: buildMachine };

export class StrawmansWell {
  constructor(game) {
    this.game = game; this.built = false; this.frame = new WellFrame(game);
    this.mech = new WellMechanics(this); this.machine = new WellMachine(this); this.dummies = new StrawDummies(this); this.flood = new FloodStage(this);
    this.frame.pre((dt) => { if (this.built) { this.mech.pre(dt); this.flood.pre(dt); } });
    this.frame.post((dt) => { if (this.built) this.mech.post(dt); });
    this.stage = null; this.stages = {}; this.seen = new Set(); this.offs = []; this.retryT = 0;
  }

  // ---------------------------------------------------------------- the room, built and taken down
  build() {
    if (this.built) return;
    const g = this.game;
    const room = this.room = new THREE.Group(); room.name = 'strawmanwell'; room.userData.zone = 'strawmanwell';
    const K = this.kit = new StageKit(g, room);
    this.mech.clear();
    this.wings = buildWings(this, K.lane(LANES.wings));
    for (const [id, fn] of Object.entries(BUILDERS)) this.stages[id] = fn(this, K.lane(LANES[id]));
    this.stages.flood = this.flood.build(K.lane(LANES.flood));
    for (const [id, S] of Object.entries(this.stages)) S.exit = stageDoor(K.lane(LANES[id]), S.door[0], S.door[1], 'THE WINGS', 'W');
    for (const x of BRAWL.spawns) this.dummies.spawn(new THREE.Vector3(AT.x + x, AT.y, LANES.brawl.z), this.stages.brawl.arena);
    K.finish();
    g.scene.add(room);
    this.plates();
    this.built = true;
  }
  teardown() {
    if (!this.built) return;
    this.frame.remove(); this.listen(false);
    this.dummies.clear(); this.machine.clear(); this.mech.clear(); this.flood.clear(); clearClimb(this);
    this.wings?.strawman?.dispose?.();
    this.kit.dispose();
    this.room = null; this.kit = null; this.wings = null; this.stages = {}; this.stage = null; this.built = false;
  }

  /** The wings' plates over the doors: each stage's best stars from the ledger (well.stage.stars.<id>), drawn again on each return. */
  plates() {
    const g = this.game, S = this.kit.lane(LANES.wings);
    for (const st of STAGES.filter((s) => s.wave === 1)) {
      const D = this.wings.doors[st.id]; if (!D) continue;
      const n = Math.max(0, Math.min(3, g.ledger?.get?.(`well.stage.stars.${st.id}`) || 0)), stars = '★'.repeat(n) + '☆'.repeat(3 - n);
      if (D.stars === stars) continue;
      D.plate?.removeFromParent(); D.plate?.material?.dispose?.(); D.plate?.geometry?.dispose?.();
      D.plate = S.label(st.family.toUpperCase(), D.x, 3.15, { dz: -2.2 + 0.42, width: 2.2, sub: stars }); D.stars = stars;
    }
  }

  // ---------------------------------------------------------------- arriving, leaving, a stage
  get here() { return zoneOf(this.game.player.pos) === 'strawmanwell'; }
  /** Set down in the wings (the Index's row, the sparring circle's lectern, a place's travel). */
  arrive() {
    const g = this.game, L = LANES.wings;
    g.player.killY = AT.y - 60;
    g.course?.teleport(new THREE.Vector3(AT.x + L.start, AT.y + 0.05, L.z), Math.PI / 2);
    this.enterLane('wings');
  }
  /** Back out to the workshop's hub, everything the frame laid taken off. */
  leave() {
    const g = this.game, C = g.course;
    const home = () => { this.frame.remove(); this.listen(false); this.stage = null; C?.teleport(C.hubSpawn.v, C.hubSpawn.yaw); };
    g.seam?.cross(home) || home();
  }
  /** A stage entered (from its door in the wings), or the wings again (from a stage's door). */
  go(id) {
    const g = this.game, L = laneOf(id); if (!L) return;
    const to = () => { g.course?.teleport(new THREE.Vector3(AT.x + L.start, AT.y + 0.05, L.z), Math.PI / 2); this.enterLane(id); };
    g.seam?.cross(to) || to();
  }
  enterLane(id) {
    const g = this.game, L = laneOf(id);
    this.frame.apply({ z: L.z, x0: AT.x - 2, x1: AT.x + L.len + 2, band: [AT.y + L.band[0], AT.y + L.band[1]], face: 1 });
    this.kit?.show(id); this.listen(true);
    if (id === 'wings') { this.stage = { id: 'wings' }; if (this.kit) this.plates(); return; }
    this.stage = { id, t0: g.events?.time ?? 0, hits: 0, string: 0, cleared: false, check: 0, kos: 0 };
    if (id === 'brawl') { const F = this.stages.brawl.flag; F.post.visible = F.flag.visible = false; }
    g.events?.emit('well.stage.enter', { stage: id, by: 'courier' });
  }

  /** The Courier's own moves heard while in the Well (the bench's checklist: well.verb), and nothing kept once out. */
  listen(on) {
    const ev = this.game.events; if (!ev) return;
    if (!on) { for (const off of this.offs) off(); this.offs = []; return; }
    if (this.offs.length) return;
    const add = (n, fn) => this.offs.push(ev.on(n, fn));
    add('move.jump', (e) => this.verb(e.kind === 'air' ? 'doubleJump' : e.kind === 'wall' ? 'wallJump' : 'jump'));
    add('move.dash', () => this.verb('dash'));
    add('slide.start', () => this.verb('slide'));
    add('wallrun.start', () => this.verb('wallRun'));
  }
  /** A verb of VERB used in the Well: said once a visit here (the tracking keeps the first ever). */
  verb(id) { if (!VERB[id] || this.seen.has(id) || !this.here) return; this.seen.add(id); this.game.events?.emit('well.verb', { verb: id, by: 'courier' }); }
  /** The Courier struck in a stage (a dummy's swipe or shove, a cannon's ball): the clear's rank counts them. */
  hit() { if (this.stage?.t0 != null && !this.stage.cleared) this.stage.hits++; }
  noteString(n) { if (this.stage?.t0 != null) this.stage.string = Math.max(this.stage.string, n); }
  onKO(by) {
    const S = this.stage; if (S?.id !== 'brawl' || by !== 'courier') return;
    S.kos++;
    if (S.kos >= BRAWL.kos) { const F = this.stages.brawl.flag; F.post.visible = F.flag.visible = true; }
  }

  /** The goal reached: the clear said with its time, hits, string, rank and stars. */
  clear() {
    const g = this.game, S = this.stage, st = stageOf(S.id); if (!st || S.cleared) return;
    S.cleared = true;
    const t = Math.round(((g.events?.time ?? 0) - S.t0) * 10) / 10, rank = rankOf({ t, par: st.par, hits: S.hits, string: S.string });
    g.events?.emit('well.stage.clear', { stage: S.id, t, hits: S.hits, string: S.string, rank, stars: starsOf(rank), by: 'courier' });
  }

  // ---------------------------------------------------------------- F and W, the interact chevron
  /** What F (or W at a door) would act on: a door in the wings, a stage's door back, a lectern in the Flood. */
  spots() {
    const S = this.stage, P = this.game.player, out = [];
    if (!S) return out;
    if (S.id === 'wings') for (const [id, D] of Object.entries(this.wings.doors)) out.push({ ref: id, pos: new THREE.Vector3(AT.x + D.x, AT.y + 2.9, LANES.wings.z - 1.6), x: AT.x + D.x });
    else {
      const St = this.stages[S.id]; if (St) out.push({ ref: 'wings', pos: new THREE.Vector3(AT.x + St.door[0], AT.y + St.door[1] + 2.9, laneOf(S.id).z - 1.6), x: AT.x + St.door[0], y: AT.y + St.door[1] });
      if (S.id === 'flood') for (const L of this.flood.spots) out.push({ ref: L.ref, pos: L.pos, x: L.pos.x, y: AT.y });
    }
    return out.filter((o) => Math.abs(P.pos.x - o.x) < 1.1 && (o.y == null || Math.abs(P.pos.y - o.y) < 1.6));
  }
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('strawmanwell', () => {
      if (!this.built || !this.here || g.dialogue?.open) return null;
      const s = this.spots()[0]; return s ? { pos: s.pos, d: Math.abs(g.player.pos.x - s.x), ref: s.ref } : null;
    });
  }
  use(ref) {
    if (ref === 'hub') return this.leave();
    if (ref === 'wings') return this.go('wings');
    if (laneOf(ref)) return this.go(ref);
    this.flood.use(ref);
  }

  // ---------------------------------------------------------------- each frame
  update(dt) {
    this.wire();
    if (!this.built) return;
    const g = this.game, P = g.player, here = this.here;
    if (!here) { if (this.frame.on) { this.frame.remove(); this.listen(false); this.stage = null; } return; }
    if (!this.frame.on && !g.god?.controlling) { const L = laneAt(P.pos.z); if (L) this.enterLane(L.id); } // (set down here some other way: a place's travel)
    const S = this.stage, inp = g.input;
    // F at what the chevron is on; W at a door; F held at the Flood's POUR
    const it = g.interact?.cur;
    if (it?.id === 'strawmanwell' && P.peekLatch?.('KeyF')) { P.latch('KeyF'); this.use(it.ref); }
    if (inp.wasPressed('KeyW') && !g.god?.controlling) { const d = this.spots().find((o) => o.ref === 'hub' || o.ref === 'wings' || laneOf(o.ref)); if (d) this.use(d.ref); }
    this.flood.hold(it?.id === 'strawmanwell' ? it.ref : null, inp.isDown('KeyF'));
    if (S && S.id !== 'wings') this.watch(S, dt);
    this.mech.update(dt); this.machine.update(dt); this.dummies.update(dt); if (this.flood.grid) this.flood.update(dt);
    this.wings?.strawman?.update?.(dt);
    this.frame.camera(g.rawDt ?? dt);
  }

  /** In a stage: the goal, the checkpoints, a fall's retry, and the verbs read from the body. */
  watch(S, dt) {
    const g = this.game, P = g.player, St = this.stages[S.id], ax = P.pos.x - AT.x, ay = P.pos.y - AT.y;
    if (!St) return;
    if (!S.cleared && Math.abs(ax - St.goal[0]) < 0.9 && Math.abs(ay - St.goal[1]) < 2.4 && (S.id !== 'brawl' || S.kos >= BRAWL.kos)) this.clear();
    if (P.grounded) St.checks.forEach(([x, y], i) => { if (i > S.check && ax >= x - 0.5 && Math.abs(ay - y) < 1.5) S.check = i; });
    if (ay < -6 && this.retryT <= 0) this.retryT = PIT.retry;
    if (this.retryT > 0 && (this.retryT -= g.rawDt ?? dt) <= 0) {
      const [x, y] = St.checks[S.check] || St.checks[0];
      P.moveTo(new THREE.Vector3(AT.x + x, AT.y + y + 0.05, laneOf(S.id).z), new THREE.Vector3()); this.frame.face = 1; this.retryT = 0;
    }
    const tech = this.frame.tech, sp = Math.abs(P.vel.x);
    if (P.grounded && sp > 3) this.verb('run');
    if (P.prone && sp > 0.3) this.verb('crawl');
    if (P.mantle) this.verb('mantle');
    if (P.sliding && P.groundNormal().y < 0.97) this.verb('slope');
    if (tech === 'ladder') this.verb(P.techs.active.l === this.vine ? 'vine' : 'ladder');
    else if (tech === 'hang') this.verb('hang');
    else if (tech === 'balance') this.verb('beam');
    else if (tech === 'pole') this.verb(P.techs.active.pole?.rope ? 'swingRope' : 'pole');
    else if (tech === 'slam') this.verb('groundPound');
    else if (tech === 'push') this.verb('push');
  }

  /** Its own air (after the room's fog is graded each frame, as the Sandbox's). */
  light() {
    const g = this.game, F = g.scene.fog; if (!F || zoneOf(g.camera.position) !== 'strawmanwell') return;
    F.color.setHex(AIR.fog); F.density = AIR.density;
  }
}
