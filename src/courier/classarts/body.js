// ---------------------------------------------------------------------------------------
// A CLASS'S ARTS IN PLAY (CLASS-ARTS.md; the rules Dovina's, progress/classarts.js): the runtime of the worn action and the worn
// reaction. The action is the input action `art` (G on foot; touch `art`), paid from the pool at its row's cost after its cooldown; the
// reaction fires itself at its moment. Every number is read from `game.classArts.numbers(slot)` at the moment of use, so the accent of
// the class read now (x1.25, cost x0.8) is always the one applied. Each art is a modifier with a source you can see (DESIGN.md 22):
// the pool's modifiers (a cost taken off), a multiplier handed to the one blow it changes, the body held by a tech while it runs; none
// changes a base rule, and with no art worn this module does nothing.
//
// Built in waves, four classes a wave (CLASS-ARTS.md 4). Wave 1: the Fool (Beginner's Luck, Running on Empty) and the four Knights (Onrush,
// Momentum; Water Walk, Gallant; Riposte Rush, Edge; Bulwark, Steadfast). Wave 2: the four Pages (Spark, First Strike; Offering, Kindness;
// Scout, Quick Study; Prospect, Thrift) and the four Queens (Stoke, Afterglow; Catch the Rain, Empath; Clear Sight, Cut Through; Harvest,
// Hearth). Wave 3: the four Kings (Roar, Rally; Still Waters, Steady; Mark for Death, Judge; Earth Wall, Dividend), the World
// (Completion, Wholeness) and the fire signs (Ram, Unshaken; Tame, Courage; Blink Mark, Spillover). The actions are acts.js's; the
// reactions that answer an event are wired here (wireReactions). An art not built yet is refused at the key in the log.
//
// Prior art: Final Fantasy Tactics' action and reaction abilities (one verb on a key, one passive that answers a moment), Hades' boons
// (each a small modifier on one thing the body already does), Dark Souls' "next attack" buffs (Momentum's one blow).
//
//   game.classArtsRun = techs.add(new ClassArtsBody(techs))   (a passive tech: its speedMult holds the body for Bulwark)
//   .onStrike(c, m) -> { dmg, build } | null   (creatures.strike asks, the Courier's blows only)
//   .takenMult() (the vessel's damage asks)   .ward() -> bool (Steadfast: the next blow cracks nothing)
//   .lucky() -> bool (Beginner's Luck spent on a roll of chance: the Lockheart's spins, a puzzle duel's flee)
//   .clearSight() -> bool (Figment telegraphs in full: creatures.js)   .cutThrough() -> bool (a resisted status hardens nothing: creatures.js)
//   .draughtFadeK() (Afterglow: courier/mind.js)   .drainK(c) (Empath: the Lockheart's drain)   .takeHarvestCubes() (Harvest: a crystal's break)
//   .noResist(c) (Mark for Death: creatures.js apply and build)   .mendK() (Steady: courier/vessel/damage.js)   .talliesK() (Wholeness:
//   progress/laidspread.js)   .unshaken() (Unshaken: courier/player.js impulse)
//   events: art.use { art, kind, accented, at?, target?, by }, art.fire { art, cubes?, pool?, by }, art.end { art, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { Tech } from '../moves/techs.js';
import { sfx } from '../../audio/sfx.js';
import { today } from '../../core/calendar.js';
import { yieldOf } from '../../progress/combat/emo.js';
import { CREATURES } from '../../tools/veritome/bestiary.js';
import { ACTS } from './acts.js';

/** Petra's, where the rows are silent: a fight is a blow landed either way within FIGHT real s (core/livemoment.js's own 6); a shove
 *  carried (Ram) runs CARRY real s; ground held
 *  is HOLD real s grounded and all but still (Unshaken: a windup's lead is longer); Earth Wall's slab is WALL_T m thick, sunk WALL_SINK m
 *  into the ground, and rises and sinks over WALL_RISE real s; Spillover says itself at most once in SPILL_SAY real s. */
const FIGHT = 6, HOLD = 0.5, WALL_T = 0.8, WALL_SINK = 0.3, WALL_RISE = 0.25, SPILL_SAY = 3, CARRY = 0.4;

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
let wallMat = null; // (one material for every Earth Wall: a placeholder slab of the ground's colour, Calissa's to dress on art.use)

/** How near a point lies to the segment a..b, on the ground's plane. */
function nearSegment(p, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z, L2 = abx * abx + abz * abz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / L2));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

export class ClassArtsBody extends Tech {
  constructor(mgr) {
    super(mgr, 'classarts');
    this.passive = true;
    this.now = 0; this.cool = {}; // (real seconds of play, and each art's cooldown end on that clock)
    this.luckUntil = -1; this.freeUntil = -1; this.braceUntil = -1; this.braceTaken = 1;
    this.sprintT = 0; this.momentum = false; this.stillT = 0; this.steady = false;
    this.parried = null; // ({ c, at }: the last blow parried, for Riposte Rush)
    this.lastBlow = -Infinity; this.stokeUntil = -1; this.clearUntil = -1; this.harvestCubes = 0; this.coolDay = {};
    this.mark = null; this.unresisting = new Map(); this.tamed = []; this.walls = []; this.carried = []; this.blinkMark = null; // (wave 3's: see acts.js)
    this.completeUntil = -1; this.completeCool = 1; this.heldT = 0; this.brave = false; this.judged = new WeakSet(); this.spillT = -Infinity;
    const g = this.game;
    wireReactions(this);
    g.events?.on?.('move.parry', (e) => {
      if (e.by !== 'courier') return;
      if (e.what === 'blow' && g.lastParried) this.parried = { c: g.lastParried, at: this.now };
      const R = this.reaction('gallant'); if (R) { g.lachryma?.gain?.(R.does.pool, 'art'); this.fire('gallant'); }
    });
  }
  usable() { return true; }
  get speedMult() { return this.now < this.braceUntil ? 0 : this.paintK(); }

  /** The worn row of a slot, if it is the art `id` (its numbers accented for the class read now). */
  worn(slot, id) { const n = this.game.classArts?.numbers?.(slot); return n && (!id || n.id === id) ? n : null; }
  reaction(id) { return this.worn('reaction', id); }
  ready(id) { return !(this.cool[id] > this.now) && this.coolDay[id] !== today(); } // (a game day's cooldown: once a game day)
  fire(id, extra = null) { this.game.events?.emit('art.fire', { art: id, ...(extra || {}), by: 'courier' }); }

  // ---- the hooks the game asks ------------------------------------------------
  /** A blow of the Courier's landing on `c` (`m`: the damage type's multiplier): Momentum's one blow, Edge on a weak point. */
  onStrike(c, m) {
    let dmg = 1, build = 1;
    if (this.now - this.lastBlow > FIGHT) { const R = this.reaction('eager'); if (R) { dmg *= R.does.first; this.fire('eager'); } } // (First Strike: a fight's first blow)
    this.lastBlow = this.now;
    if (this.now < this.stokeUntil) build *= this.stokeBuild || 1; // (Stoke)
    if (this.momentum) { const R = this.reaction('momentum'); if (R) { dmg *= R.does.mult; this.momentum = false; this.sprintT = 0; this.fire('momentum'); } }
    if (m?.dmg > 1) { const R = this.reaction('edge'); if (R) { build *= R.does.weakBuild; this.fire('edge'); } }
    if (this.mark?.c === c && this.now < this.mark.until) dmg *= this.mark.mult; // (Mark for Death)
    const J = this.reaction('judge'); // (Judge: a kind the Veritome has photographed; said on the first blow on each creature)
    if (J && this.game.veritome?.book?.photos?.[c.kind]) { dmg *= J.does.mult; if (!this.judged.has(c)) { this.judged.add(c); this.fire('judge'); } }
    if (this.brave) dmg *= this.reaction('courage')?.does.mult ?? 1; // (Courage: the pool under its line, armed in tick)
    return dmg === 1 && build === 1 ? null : { dmg, build };
  }
  /** What a blow on the vessel is worth while Bulwark braces. */
  takenMult() { this.lastBlow = this.now; return this.now < this.braceUntil ? this.braceTaken : 1; } // (a blow taken is a fight too: First Strike's clock)
  clearSight() { return this.now < this.clearUntil; }
  cutThrough() { return !!this.reaction('cutThrough'); }
  /** Afterglow: a feeling drunk fades at half the rate. */
  draughtFadeK() { const R = this.reaction('warmth'); return R ? 1 / R.does.draught : 1; }
  /** Empath: a drain in the creature's best band draws more. */
  drainK(c) { const R = this.reaction('empath'); return R && yieldOf(c?.emo || 0) >= 1 ? R.does.drain : 1; }
  /** Harvest's cubes waiting for the next crystal struck (taken once). */
  takeHarvestCubes() { const n = this.harvestCubes; this.harvestCubes = 0; return n; }
  /** A creature that cannot resist the Courier's statuses for `dur` real s (Mark for Death), and the ask (creatures.js). */
  open(c, dur) { this.unresisting.set(c, this.now + dur); }
  noResist(c) { const t = this.unresisting.get(c); if (t == null) return false; if (c.alive && this.now < t) return true; this.unresisting.delete(c); return false; }
  /** Steady: the cracks mend faster while the pool is over its line. */
  mendK() { const R = this.reaction('steady'); return R && (this.game.lachryma?.fraction ?? 0) > R.does.over ? R.does.mend : 1; }
  /** Wholeness: each of the laid spread's tallies counts for more. */
  talliesK() { return this.reaction('wholeness')?.does.tallies ?? 1; }
  /** Unshaken: ground held through a windup, its blow pushes nothing (the blow still lands). */
  unshaken() { return !!this.reaction('dominion') && this.heldT >= HOLD; }
  /** Creatures within `reach` in the facing cone of `cone` rad (Ram). */
  inCone(reach, cone) {
    const P = this.P, f = P.forward(_b), out = [];
    for (const c of this.game.creatures?.near?.(P.pos, reach) || []) {
      if (!c.alive || c.ally) continue;
      const d = _a.copy(c.pos).sub(P.pos).setY(0); if (d.lengthSq() > 0.25 && d.normalize().angleTo(f) > cone) continue;
      out.push(c);
    }
    return out;
  }
  /** A creature carried `dist` m along `dir` over CARRY real s (Ram): its velocity along the line set each step through its own `knock`
   *  (creatures.js's contract) to twice what is left over the time left (easing to nothing as it arrives, its drag and a landing made up),
   *  and stopped at the end, so it neither falls short nor coasts past. */
  carry(c, dir, dist) { if (c.knock) this.carried.push({ c, dir: dir.clone().setY(0).normalize(), dist, from: c.pos.clone(), until: this.now + CARRY }); }
  /** Earth Wall: a slab of ground stood up for `dur` real s, a fixed box in the static group (the Courier, creatures and shots meet it). */
  wall(at, yaw, w, h, dur) {
    const g = this.game, W = g.physics?.world; if (!W || !g.scene) return;
    const q = new THREE.Quaternion().setFromAxisAngle(_up, yaw), y = at.y + h / 2 - WALL_SINK;
    const body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(at.x, y, at.z).setRotation(q));
    W.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, h / 2, WALL_T / 2).setCollisionGroups(GROUPS.static), body);
    wallMat ||= new THREE.MeshStandardMaterial({ color: 0xb8925e, roughness: 0.95 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, WALL_T), wallMat);
    mesh.position.set(at.x, y - h, at.z); mesh.quaternion.copy(q); mesh.castShadow = mesh.receiveShadow = true; g.scene.add(mesh);
    this.walls.push({ body, mesh, y, h, born: this.now, until: this.now + dur });
  }
  /** Spillover: what the pool could not hold poured into the Lachrymato Bottle (the overflow, courier/lachryma.js). */
  spill(e) {
    const R = this.reaction('moderation'), L = this.game.techs?.get?.('soulbrush')?.load;
    if (!R || !L?.bottle || !(e?.amount > 0)) return;
    const took = L.fill?.(e.amount * R.does.overflowToBottle) || 0;
    if (took > 0 && this.now - this.spillT >= SPILL_SAY) { this.spillT = this.now; this.fire('moderation'); }
  }
  /** Steadfast held: the blow cracks nothing, and it is spent. */
  ward() {
    if (!this.steady || !this.reaction('steadfast')) return false;
    this.steady = false; this.stillT = 0; this.fire('steadfast'); return true;
  }
  /** Beginner's Luck armed: this roll of chance is thrown twice, and it is spent. */
  lucky() { if (this.now > this.luckUntil) return false; this.luckUntil = -1; this.fire('beginnersLuck'); return true; }

  // ---- the reactions' moments -------------------------------------------------
  /** The pool ran dry: Running on Empty takes every cost off for a while. */
  dry() {
    const R = this.reaction('zero'); if (!R || !this.ready('zero')) return;
    this.cool.zero = this.now + (R.cooldown ?? 45);
    this.freeUntil = this.now + R.does.free;
    this.game.lachryma?.addModifier?.('art.zero', { costMult: { '*': 0 } });
    this.fire('zero');
  }
  /** Water Walk's other half: paint under the feet runs faster while it lasts. */
  paintK() {
    const W = this.mgr.get?.('waterwalk'); if (!(W?.left > 0)) return 1;
    const R = this.wadeK, P = this.P, k = this.game.paintmap?.kAt?.(P.pos.x, P.pos.y, P.pos.z) || 0;
    return k > 0.1 ? R : 1;
  }

  // ---- the action on its key --------------------------------------------------
  press() {
    const g = this.game, R = this.worn('action');
    if (!R) { g.log?.say('warn', 'You wear no action art yet. /art lists the ones you have opened.', { key: 'art.none', throttle: 3 }); return; }
    const act = ACTS[R.id];
    if (act?.again?.(this, R)) return; // (a second press that is the art's own, inside its cooldown: Blink Mark's blink to its mark)
    if (!this.ready(R.id)) { g.log?.say('warn', `${R.label} is cooling down.`, { key: 'art.cool', throttle: 1.5 }); sfx.fizzle?.(); return; }
    if (!act) { g.log?.say('warn', `${R.label} is not in the game yet.`, { key: 'art.unbuilt', throttle: 3 }); return; }
    const why = act.can?.(this, R);
    if (why) { g.log?.say('warn', why, { key: `art.no.${R.id}`, throttle: 1.5 }); sfx.fizzle?.(); return; }
    if (R.cost && !g.lachryma?.spend(R.cost, 'art')) { g.log?.say('warn', `Your pool is too low for ${R.label}.`, { key: 'art.pay', throttle: 1.5 }); return; }
    if (R.cooldown === 'gameDay') this.coolDay[R.id] = today(); else this.cool[R.id] = this.now + (R.cooldown ?? 0); // (Completion runs them faster: tick)
    this.place = null; act.go(this, R); // (an art that acts away from the body says where: `at` a point, `target` a creature; Calissa's looks read them)
    g.events?.emit('art.use', { art: R.id, kind: 'action', accented: !!R.accented, ...(this.place || {}), by: 'courier' });
  }
  /** The blink's body forced along a line (Onrush, Riposte Rush): `done(from, to)` at its end. */
  rush(dir, dist, done) { const b = this.mgr.get?.('blink'); if (!b?.force) return false; b.force(dir, dist, done); return true; }
  /** Every creature within `width` of the line a..b struck once by the art. */
  sweep(a, b, width, power, id) {
    const g = this.game, mid = _a.copy(a).lerp(b, 0.5), r = a.distanceTo(b) / 2 + width;
    for (const c of g.creatures?.near?.(mid, r) || []) if (nearSegment(c.pos, a, b) <= width / 2 + (c.radius ?? 0.5)) {
      _d.copy(c.pos).sub(a).setY(0).normalize();
      g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.8), _d.clone(), power, 'art', 'courier');
    }
  }

  tick(dt) {
    const g = this.game, P = this.P;
    this.now += dt;
    if (!this.hooked && g.lachryma?.on) { this.hooked = true; g.lachryma.on('empty', () => this.dry()); } // (the pool is made after the techs: boot/pneuka.js)
    if (this.freeUntil >= 0 && this.now >= this.freeUntil) { this.freeUntil = -1; g.lachryma?.removeModifier?.('art.zero'); g.events?.emit('art.end', { art: 'zero', by: 'courier' }); }
    if (this.braceUntil >= 0 && this.now >= this.braceUntil) { this.braceUntil = -1; g.events?.emit('art.end', { art: 'bulwark', by: 'courier' }); }
    if (this.stokeUntil >= 0 && this.now >= this.stokeUntil) { this.stokeUntil = -1; g.lachryma?.removeModifier?.('art.stoke'); g.events?.emit('art.end', { art: 'kindleHeart', by: 'courier' }); }
    if (this.clearUntil >= 0 && this.now >= this.clearUntil) { this.clearUntil = -1; g.events?.emit('art.end', { art: 'clearSight', by: 'courier' }); }
    // Thrift: worn, the shells' cost is the pool's modifier (a source you can see: the art on the Box's page)
    const thrift = this.reaction('thrift');
    if (!!thrift !== !!this.thrifty) { this.thrifty = !!thrift; if (thrift) g.lachryma?.addModifier?.('art.thrift', { costMult: { shell: thrift.does.shellCost } }); else g.lachryma?.removeModifier?.('art.thrift'); }
    // Momentum: a sprint held long enough arms the next blow
    const mo = this.reaction('momentum');
    if (mo && P?.sprinting) { this.sprintT += dt; if (this.sprintT >= mo.does.after && !this.momentum) this.momentum = true; } else if (!this.momentum) this.sprintT = 0;
    // Steadfast: standing still long enough arms the next blow taken
    const sf = this.reaction('steadfast'), still = P && P.grounded && Math.hypot(P.vel.x, P.vel.z) < 0.2;
    if (sf && still) { this.stillT += dt; if (this.stillT >= sf.does.still) this.steady = true; } else { this.stillT = 0; this.steady = false; }
    // Unshaken's ground held: grounded, all but still, no move of the body's own running
    if (P?.grounded && Math.hypot(P.vel.x, P.vel.z) < 0.5 && !this.mgr.active) this.heldT += dt; else this.heldT = 0;
    // Courage: armed while the pool is under its line
    const co = this.reaction('courage'), brave = !!co && (g.lachryma?.fraction ?? 1) < co.does.under;
    if (brave !== this.brave) { this.brave = brave; if (brave) this.fire('courage'); else g.events?.emit('art.end', { art: 'courage', by: 'courier' }); }
    this.tickWave3(dt);
    // the action's key, on foot only (the duel, the god hand, the skiff and the helm keep their own keys: core/actions.js)
    if (g.input?.wasPressed?.('KeyG') && g.actions?.live?.().has('foot')) this.press();
  }
  /** Wave 3's times: Mark for Death's end, Completion's (its cooldowns run faster meanwhile), the tamed given back, the walls let down. */
  tickWave3(dt) {
    const g = this.game, end = (art) => g.events?.emit('art.end', { art, by: 'courier' });
    if (!this.spilling && g.lachryma?.on) { this.spilling = true; g.lachryma.on('overflow', (e) => this.spill(e)); } // (Spillover)
    if (this.mark && (this.now >= this.mark.until || !this.mark.c.alive)) { this.mark = null; end('verdict'); }
    if (this.completeUntil >= 0) {
      if (this.now >= this.completeUntil) { this.completeUntil = -1; g.lachryma?.removeModifier?.('art.completion'); end('completion'); }
      else for (const id in this.cool) if (id !== 'completion') this.cool[id] -= dt * (this.completeCool - 1);
    }
    for (let i = this.carried.length - 1; i >= 0; i--) {
      const s = this.carried[i], c = s.c, along = c.vel ? c.vel.x * s.dir.x + c.vel.z * s.dir.z : 0, left = s.until - this.now;
      if (!c.alive || left <= 0) { this.carried.splice(i, 1); if (c.alive && along > 0) c.knock(_d.copy(s.dir).multiplyScalar(-along)); continue; }
      const gone = (c.pos.x - s.from.x) * s.dir.x + (c.pos.z - s.from.z) * s.dir.z, want = Math.min(3 * s.dist / CARRY, (2 * Math.max(0, s.dist - gone)) / left);
      c.knock(_d.copy(s.dir).multiplyScalar(want - along));
    }
    for (let i = this.tamed.length - 1; i >= 0; i--) {
      const t = this.tamed[i]; if (t.c.alive && this.now < t.until) continue;
      this.tamed.splice(i, 1); t.c.ally = false; end('tame'); // (its relations wear off on the brain's own clock: acts.js tame)
    }
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const w = this.walls[i], up = Math.min(1, (this.now - w.born) / WALL_RISE), down = Math.max(0, (this.now - w.until) / WALL_RISE);
      w.mesh.position.y = w.y - w.h * (1 - up + down);
      if (this.now < w.until) continue;
      if (w.body) { g.physics?.removeBody?.(w.body); w.body = null; end('stronghold'); } // (the body goes at once; the slab sinks after it)
      if (down >= 1) { g.scene?.remove(w.mesh); w.mesh.geometry.dispose(); this.walls.splice(i, 1); }
    }
  }
}

/** The reactions that answer a moment of the game (the rest are asked by the systems they bend: see the hooks above). */
function wireReactions(run) {
  const g = run.game, on = (ev, fn) => g.events?.on?.(ev, (e) => { if ((e?.by ?? 'courier') === 'courier') fn(e); });
  const mend = (id, R) => { if (g.vesselDamage?.mendBy?.(R.does.mends, id)) run.fire(id); };
  // Kindness: a fish let go, a spirit's wish granted
  for (const ev of ['angle.release', 'spirit.wish.done']) on(ev, () => { const R = run.reaction('tender'); if (R) mend('tender', R); });
  // Hearth: a rest at a Shrine
  on('shrine.rest', () => { const R = run.reaction('hearth'); if (R) mend('hearth', R); });
  // Quick Study: each creature downed counts once more toward knowing its kind (progress/familiarity.js reads `creature.<kind>.read`)
  on('creature.struck', (e) => {
    const R = run.reaction('quickStudy'); if (!R || !e.kill || !CREATURES[e.kind]) return;
    for (let i = 1; i < R.does.familiarity; i++) g.ledger?.inc?.(`creature.${e.kind}.read`);
    run.fire('quickStudy');
  });
  // Rally: each creature downed gives back some of the pool
  on('creature.struck', (e) => { const R = run.reaction('rally'); if (R && e.kill && g.lachryma?.gain?.(R.does.pool, 'art') > 0) run.fire('rally', { pool: R.does.pool }); });
  // Dividend: the first of a thing today pays more (its share over the first-today pay, paid beside it: progress/firsttoday.js)
  on('firsttoday.paid', (e) => {
    const R = run.reaction('dividend'), n = R ? Math.round((e.cubes || 0) * (R.does.firstToday - 1)) : 0;
    if (n > 0) { g.cubes?.earn?.(n, 'art'); run.fire('dividend', { cubes: n }); }
  });
  // Wholeness worn or taken off: the laid spread recounted and told at once (its tallies read talliesK)
  on('art.wear', () => { if (g.laidSpread) g.laidSpread.act = true; });
}
