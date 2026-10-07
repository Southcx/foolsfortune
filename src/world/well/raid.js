// ---------------------------------------------------------------------------------------
// THE RAID: the Great Slip Jelly fought as an extreme trial (docs/plans/DUNEMAW-EXTREME.md; the owner, 2026-10-07: "like a raid boss,
// on the level of an FFXIV extreme trial"). The great cavern (world/well/cavern.js) holds one; it runs the fight's TIMELINE
// (creatures/ai/timeline.js over progress/combat/greatjelly.js: the casts at their times, the phases at their shares of health, the
// second Blowout at 15%, the enrage at 9:30) from the PULL (the FOE wakes), and does what the casts need of the place:
//   the log names each cast as it begins (`foe.cast`); the body plays it (creatures/jelly/jellycasts.js);
//   a blow on the Courier costs a share of the pool (the healer check), doubled when Sodden, halved for a raidwide guarded at the flash;
//   the transition (Unstopped): it sinks crowned into W0 and comes up bare, the brood making for it (each that reaches it heals it and
//   grows a plate back); the Sherds: four calves sharing its health, all down in 30 s or they mend and heal it; the Overflow: the whole
//   floor slides, every clutch hatches; the enrage: the Dunemaw Swallows.
// A wipe (shattered, or swallowed) costs the attempt, not the run: the Dunemaw makes the Courier whole at the Lip Stone and the cavern
// is laid again with the clutches broken still broken (world/well/dunemaw.js `wipe`). The run's record (hits by cast, clutches left at
// the pull, the time, gazes turned) rides on `foe.end`, and the cosmetics its achievements guarantee drop from it (greatjelly.js DROPS).
// Events: foe.cast { cast, windup }, foe.moment { what } (crack, mirror, sink, feed, sherds, mend, sodden, dry, swallowed), each `by`.
//
// Prior art: FFXIV's extreme trials (the timeline learned by wiping, the cast bar, the tankbuster and the raidwide against the healer's
// pool, the adds, the split damage check, the hard enrage, the checkpoint at the arena's door), Monster Hunter's tells, Dark Souls'
// fog gate and its short way back.
//
//   const R = new Raid(game, { cavern })   R.update(dt)   R.pulled   R.phaseName   R.record()   R.dispose()
//   (the casts' needs) R.hit(cast, effect, { from, raidwide, gaze })   R.struck(move)   R.after(s, fn)   R.lob(from, to, s, onLand)
//   R.looking() -> 'lens' | 'eye' | 'away'   R.slideFor(s, speed)   R.brood(n, heal)   R.calve(area)   R.swallow()   R.moment(what)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Timeline } from '../../creatures/ai/timeline.js';
import { DO } from '../../creatures/jelly/jellycasts.js';
import { PHASES, CASTS, NOVA_AT, ENRAGE, phaseOf, timeline } from '../../progress/combat/greatjelly.js';
import { bearingXZ, dishY, BOWL_AT } from './bowl.js';
import { ARENA } from '../../progress/combat/dunemaw.js';
import { FoeLook } from '../../vfx/foelook.js';

const SHIELD = 35; // (Lachryma a full blow costs the pool: courier/vessel/damage.js's; a share of the pool is a blow of share * max / SHIELD)
const HIDDEN_OK = new Set(['slipNova', 'broodCall', 'swallow', 'overflow']); // (cast from under the slip: the transition's own)
const CALF_HP = 12; // (a sherd's health in plain blows: four in 30 s is about 1.6 blows a real second; Dovina's to set as CASTS.calving.area.hp)
const BROOD_SPEED = 3; // (m/s: from the rim to W0 in about 8 real seconds, the add's window)
const _v = new THREE.Vector3();

export class Raid {
  constructor(game, { cavern }) {
    this.g = game; this.C = cavern; this.F = cavern.foe; this.B = cavern.bowl; this.N = cavern.nursery;
    this.F.scripted = true; this.F.raid = this;
    this.T = new Timeline({
      phases: PHASES, casts: CASTS, schedule: timeline,
      pick: (share, done) => phaseOf(share, done.has('clutch')),
      marks: [{ below: NOVA_AT, cast: 'slipNova' }],
      at: [{ t: ENRAGE - CASTS.swallow.windup, cast: 'swallow' }],
      on: { phase: (p, prev) => this.onPhase(p, prev), cast: (id, d) => this.onCast(id, d), blow: (id, d) => this.onBlow(id, d) },
    });
    this.rec = { hitBy: {}, mirrored: 0, clutchesLeft: null };
    // Calissa's: each cast's windup read from the body, the sherds' split and threads, the flood (vfx/foelook.js)
    this.look = new FoeLook({ root: this.F.c.root, crown: this.F.crown, fx: game.fx, floor: { center: this.B.world(0, 0.05, 0), radius: ARENA.radius - 1, depth: 0.6 } });
    this.timers = []; this.lobs = []; this.sherds = null; this.feeding = [];
    this.sodden = 0; this.slowed = 0; this.held = 0; this.slideT = 0; this.slideV = 0; this.overflow = false; this.skip = null;
  }

  get P() { return this.g.player; }
  get pulled() { return this.T.running || !!this.over; }
  /** The fight's phase as the music reads it (game.well.fight.phase). */
  get phaseName() {
    if (this.F.ended) return 'won';
    if (this.T.casting?.id === 'swallow') return 'swallow';
    return this.T.running ? this.T.phase.id : 'crown';
  }
  /** Something about to happen: its slam waits (the body asks between casts). */
  get busy() { const n = this.T.upcoming(1)[0]; return !!this.T.casting || (n && n.t - this.T.t < 1.5); }
  ground(x, z) { return BOWL_AT.y + dishY(Math.hypot(x - BOWL_AT.x, z - BOWL_AT.z)); }
  moment(what) { this.g.events?.emit('foe.moment', { what, by: 'creature' }); }

  /** The pull: the clock starts; what the nursery has left is counted (a clutch broken before it is two brood it cannot call). */
  pull() {
    this.rec.clutchesLeft = this.N?.whole ?? 0;
    this.T.start(this.F.share);
  }
  record() { return { hitBy: { ...this.rec.hitBy }, clutchesLeft: this.rec.clutchesLeft ?? 0, seconds: Math.round(this.T.t), mirrored: this.rec.mirrored }; }

  // ------------------------------------------------------------------ the timeline's three calls
  down() { const F = this.F, c = F.c; return !!(this.g.stun?.stunned?.(c) || c.status?.sleep > 0); }
  onPhase(p, prev) {
    const F = this.F;
    if (p.id === 'clutch') { F.forceBare(); F.sinkInto(0); this.moment('sink'); }
    if (prev?.id === 'clutch' && F.state === 'hidden') F.show(0); // (Unstopped over: up out of W0, bare)
  }
  onCast(id, d) {
    const F = this.F, hidden = F.state === 'hidden' || F.state === 'sinkHold';
    if ((hidden && !HIDDEN_OK.has(id)) || (this.down() && id !== 'swallow')) { this.skip = id; return; } // (under, or stunned: it does not begin)
    this.skip = null;
    this.g.events?.emit('foe.cast', { cast: id, windup: d.windup, by: 'creature' });
    DO[id]?.begin?.(this, d);
    if (!d.windup) this.look.blow(id);
  }
  onBlow(id, d) {
    if (this.skip === id) { this.skip = null; return; }
    this.look.blow(id);
    if (this.down() && id !== 'swallow') return; // (stunned in its windup: the cast is broken)
    DO[id]?.blow?.(this, d);
  }

  // ------------------------------------------------------------------ what its blows cost
  /** A cast's blow on the Courier: the pool's share (Sodden doubles it; a raidwide guarded at the flash, V held, halves it), or `hits`
   *  as its own blows; then Sodden, the slow, the gaze's hold. Rolled through (the dodge's i-frames), it misses, but not a raidwide. */
  hit(cast, eff = {}, { from = null, raidwide = false, gaze = false } = {}) {
    const g = this.g, P = this.P;
    if (!raidwide && P.invuln > 0) return false;
    if (gaze) { this.held = eff.stunned || 3; this.count(cast); return true; }
    let mult = this.sodden > 0 ? 2 : 1;
    if (this.sodden > 0) { this.sodden = 0; this.moment('dry'); }
    if (raidwide && g.input?.isDown?.('KeyV')) mult *= 0.5;
    const pool = g.lachryma, k = eff.pool ? (eff.pool * (pool?.max ?? 100) / SHIELD) * mult : 0.55 * (eff.hits || 1) * mult;
    if (from && !raidwide) {
      const v = _v.set(P.pos.x - from.x, 0, P.pos.z - from.z); if (v.lengthSq() < 1e-4) v.set(0, 0, 1); v.normalize();
      P.impulse(v.clone().multiplyScalar(9).setY(5), 'foe');
    }
    P.shake = Math.max(P.shake || 0, 0.5);
    g.vesselDamage?.hit({ from: from ? from.clone() : null, k, why: 'foe', by: 'creature' });
    if (eff.soaked) { this.sodden = eff.soaked; this.moment('sodden'); }
    if (eff.slow) this.slowed = eff.slow;
    this.count(cast);
    g.events?.emit('foe.strike', { move: cast, from: from ? [from.x, from.y, from.z] : null, by: 'creature' });
    return true;
  }
  count(cast) { this.rec.hitBy[cast] = (this.rec.hitBy[cast] || 0) + 1; }
  /** The body's own blow landed (greatjelly.js strike): which cast it was. */
  struck(move) {
    const F = this.F, from = F.c.pos.clone();
    if (move === 'crownBash') return this.hit('crownBash', CASTS.crownBash.effect, { from });
    if (move === 'ram') return this.hit('brineLine', CASTS.brineLine.effect, { from });
    return this.hit(this.T.casting?.id === 'surfaceSlam' || F.state === 'idle' && F.t < 0.1 ? 'surfaceSlam' : 'slam', { hits: 1 }, { from });
  }

  // ------------------------------------------------------------------ the casts' needs
  after(s, fn) { this.timers.push({ at: this.T.t + s, fn }); }
  /** A drop of slip lobbed from `from` to land at `to` in `s` real seconds. */
  lob(from, to, s, onLand) {
    let L = this.lobs.find((l) => !l.on);
    if (!L) {
      L = { mesh: new THREE.Mesh(this.dropGeo ||= new THREE.SphereGeometry(0.32, 10, 8), this.B.slipMat), on: false };
      L.mesh.name = 'raid-drop'; this.g.scene.add(L.mesh); this.lobs.push(L);
    }
    to.y = this.ground(to.x, to.z);
    Object.assign(L, { on: true, from, to, s, k: 0, onLand }); L.mesh.visible = true;
  }
  /** Is the Courier looking at it: through the Veritome's lens ('lens': the gaze turns back), with their own eyes ('eye'), or not. */
  looking() {
    const g = this.g, cam = g.camera, F = this.F, at = F.c.pos.clone().setY(F.c.pos.y + 1.4);
    cam.updateMatrixWorld(); // (the camera as it is this step, not as it was last drawn)
    const eye = cam.getWorldPosition(new THREE.Vector3()), fwd = cam.getWorldDirection(new THREE.Vector3()), to = at.clone().sub(eye);
    if (to.length() > 50) return 'away';
    const facing = to.normalize().dot(fwd) > Math.cos(35 * Math.PI / 180);
    if (!facing) return 'away';
    return g.veritome?.lens ? 'lens' : 'eye';
  }
  /** The floor slides toward it (or W0, while it is under) for `s` real seconds at `speed` m/s. */
  slideFor(s, speed) { this.slideT = s; this.slideV = speed; }
  /** Brood out of the clutches still whole, making for it: `n` (Infinity: every egg left, the Overflow), each healing `heal` on arrival. */
  brood(n, heal) {
    const N = this.N; if (!N) return;
    const before = N.brood.length;
    if (n === Infinity) for (const k of N.clutches) { let e = 0; while (k.alive && k.look.alive > 0 && e++ < 8) N.hatch(k, true); }
    else if (n > 0) N.call(n, this.F.c.pos);
    for (const c of N.brood.slice(before)) { c.feeds = heal; c.driven = (dt) => this.broodDrive(c, dt); this.feeding.push(c); }
  }
  broodDrive(c, dt) {
    const F = this.F, to = _v.set(F.c.pos.x - c.pos.x, 0, F.c.pos.z - c.pos.z), d = to.length();
    c.face = F.c.pos; c.want.copy(to).setLength(BROOD_SPEED);
    if (d < 2.2) { c.reached = true; c.want.set(0, 0, 0); } // (fed in update, never inside the jellies' own loop: casebook 26)
  }
  /** A brood reached it: it heals, grows a plate back (bare), and the brood is gone into it. */
  feed(c) {
    const F = this.F, N = this.N;
    F.heal(c.feeds || 0.02); if (F.phase === 'bare') F.plates = Math.min(3, F.plates + 1);
    this.moment('feed');
    c.alive = false; const i = N.brood.indexOf(c); if (i >= 0) N.brood.splice(i, 1);
    c.undress?.(); this.g.jellies.dispose(c);
  }
  /** The Sherds: it breaks into four calves, one a quadrant, its health theirs to lose. */
  calve(area) {
    const F = this.F, J = this.g.jellies, hp = area.hp ?? CALF_HP;
    F.hide();
    this.sherds = [45, 135, 225, 315].map((b) => {
      const p = bearingXZ(b, 12), c = J.spawn(this.B.world(p.x, dishY(12) + 0.05, p.z), { once: true, cls: 1 });
      c.hp = c.maxHp = hp; c.sherd = true; c.name = 'Sherd';
      const hurt = c.hurt; c.hurt = (...a) => { const was = Math.max(0, c.hp); hurt(...a); F.c.hp = Math.max(1, F.c.hp - (was - Math.max(0, c.hp))); };
      c.deform?.kick(8, null, 0.3);
      return c;
    });
    this.look.calve(this.sherds.map((c) => c.root));
    this.sherdT = area.within; this.sherdHeal = area.heal;
    this.moment('sherds');
  }
  /** The enrage landed: the Dunemaw Swallows; the attempt ends as a shatter does (the Lip Stone: dunemaw.js wipe). */
  swallow() {
    this.moment('swallowed'); this.T.stop(); this.over = true; // (the attempt is over: the wipe lays the cavern again)
    this.g.death?.begin({ why: 'swallowed', by: 'creature' });
  }

  // ------------------------------------------------------------------ every frame
  update(dt) {
    const F = this.F, P = this.P, B = this.B;
    if (F.ended) { if (this.T.running) { this.T.stop(); B.slide(0, 0, 0); this.look.windup(null, 0); } this.look.update(this.g.rawDt ?? dt); return; }
    if (this.over) return;
    if (!this.T.running && F.state !== 'asleep') this.pull();
    this.T.update(dt, F.share);
    // the windup on the body (a gaze's or a ring's order told by it: Throwing Rings are out, then in)
    const C = this.T.casting;
    if (C && this.skip !== C.id) this.look.windup(C.id, C.def.windup ? 1 - C.left / C.def.windup : 1, { order: 'out' });
    if (this.overflow) this.flood = Math.min(1, (this.flood || 0) + dt / 3);
    this.look.overflow(this.flood || 0);
    this.look.update(this.g.rawDt ?? dt);
    // the casts' follow-ups and drops
    for (let i = this.timers.length - 1; i >= 0; i--) if (this.T.t >= this.timers[i].at) { const t = this.timers.splice(i, 1)[0]; t.fn(); }
    for (const L of this.lobs) {
      if (!L.on) continue;
      L.k = Math.min(1, L.k + dt / L.s);
      L.mesh.position.lerpVectors(L.from, L.to, L.k); L.mesh.position.y += Math.sin(L.k * Math.PI) * 5;
      if (L.k >= 1) { L.on = false; L.mesh.visible = false; L.onLand(L.to); }
    }
    // what its blows left on the Courier
    if (this.sodden > 0 && (this.sodden -= dt) <= 0) this.moment('dry');
    if (this.slowed > 0) { this.slowed -= dt; P.wade *= 0.5; }
    if (this.held > 0) { this.held -= dt; P.wade = 0; }
    // the floor's slide
    if (this.slideT > 0) {
      this.slideT -= dt;
      const L = this.B.local(F.state === 'hidden' ? B.pools[0].pos : F.c.pos);
      B.slide(L.x, L.z, this.slideT > 0 || this.overflow ? this.slideV : 0);
    }
    // the brood that make for it: one that reached it feeds it
    for (const c of this.feeding) if (c.alive && c.reached) this.feed(c);
    this.feeding = this.feeding.filter((c) => c.alive);
    // the sherds: all down, it comes back whole; the time out, they mend and heal it
    if (this.sherds) {
      const up = this.sherds.filter((c) => c.alive);
      this.sherdT -= dt; this.look.mend(1 - this.sherdT / (CASTS.calving.area.within || 30));
      if (!up.length || this.sherdT <= 0) {
        if (up.length) { for (const c of up) { c.alive = false; this.g.jellies.dispose(c); } F.heal(this.sherdHeal); this.moment('mend'); }
        this.sherds = null; this.look.mend(0); F.show(0);
      }
    }
  }

  dispose() {
    this.look.dispose();
    for (const L of this.lobs) this.g.scene.remove(L.mesh);
    this.dropGeo?.dispose();
    for (const c of this.sherds || []) if (c.alive) this.g.jellies?.dispose(c);
    this.sherds = null; this.T.stop();
  }
}
