// ---------------------------------------------------------------------------------------
// THE SENTINELS: rejection's antibody (GLOSSARY, "a sentinel"; Espada's note of 2026-10-30; GODHAND.md 10). At a high Dissonance Level the
// island sends one of its own Figments to find what is warping it and put it right: it walks to where the god hand worked the island
// (the warp marks rejection keeps), wears the hand's creations there back into the island's matter, and the island's dissonance falls
// with each mend. It guards; it never hunts for its own sake: it fights only what struck it, and once nothing is left to mend it sinks
// back into the island. Its mind is data (sentinel/mind.js) built from the AI parts. It runs on the Lantern Wisp's runtime (wisp/
// lanternwisp.js: the capsule, the moves, the cast; `c.ev = 'sentinel'`: its events say sentinel.*), the wisp's model hidden and
// Calissa's clay body worn in its place (vfx/sentinelbody.js, `game.makeSentinelBody`), driven here: its pose, its windup, rising out of
// the sand, a blow's cracks, crumbling down.
//
//   game.sentinels = new Sentinels(game)   .send(at, level)   .update(dt)   .list   SENTINEL (its numbers)
//   events: sentinel.wake { level, ground, by }, sentinel.seek { by }, sentinel.mend { volume, last, ground, by }, and from its body sentinel.hit,
//   .burst { cause: 'settled' (sunk after mending) | 'driven' (sunk with nothing mended) | a blow's }, .cast (its slam let go); the body's
//   moments for the ear (Wanda's): sentinel.step { at }, .windup { at }, .crack { hp, at }, .fall { at }, all by 'environment'
//
// Prior art: the immune system's white blood cell (it seeks the damage, not you); Black & White's and Populous's land answering the god;
// Left 4 Dead's director for the pacing (rejection's own); the slip jelly's and the wisp's minds for the parts (docs/AI.md).
// ---------------------------------------------------------------------------------------
import { Reasoner } from '../ai/index.js';
import { sentinelMind } from './mind.js';
import { groundOf } from '../../godhand/matter.js';
import { WISP } from '../wisp/lanternwisp.js';

const POSE = { fight: 'watch', watch: 'watch', drift: 'walk', flee: 'walk', stun: 'stun', sleep: 'stun', melt: 'stun' };

/** Its numbers. from: the Dissonance Level it is first sent at; one alive at a time; mend: the dissonance a mend takes off; wear: the
 *  radius (m) of the creation worn back at a mark; reach: how near (m) it mends from; marks: how many warp marks rejection keeps;
 *  settle: real s with nothing to mend before it sinks; stride: m between footfalls; gone: real s a sunk or burst body lingers before it is taken down. */
export const SENTINEL = { from: 4, alive: 1, mend: 18, wear: 2.6, reach: 2.2, marks: 12, settle: 10, gone: 6, hp: 9, stride: 1.1, ground: () => groundOf().firm.name }; // (`ground`: the island's firm layer, its word in the log)

export class Sentinels {
  constructor(game) {
    this.game = game; this.list = [];
    this.mind = sentinelMind(game, SENTINEL);
  }

  /** One sent up out of the island at `at` (rejection's origin), at Dissonance Level `level`. Null while one walks already. */
  send(at, level) {
    const g = this.game, W = g.wisps;
    if (!W || this.list.filter((c) => c.alive).length >= SENTINEL.alive) return null;
    const c = W.spawn(at);
    c.kind = 'sentinel'; c.name = 'sentinel'; c.ev = 'sentinel'; c.once1 = true; c.sentinel = true; c.hp = c.maxHp = SENTINEL.hp;
    const B = g.makeSentinelBody?.({ scale: 1 });
    if (B) { c.body = B; c.model.visible = false; c.root.add(B.root); c.rise = 0; c.seenHp = c.hp; }
    this.list.push(c);
    g.events?.emit('sentinel.wake', { level, ground: SENTINEL.ground(), by: 'environment' });
    if (c.brain.action) c.brain.end('swap');
    c.brain.reasoner = new Reasoner(this.mind.actions(W)); c.brain.decide();
    return c;
  }

  update(dt) {
    if (!this.list.length) return;
    const W = this.game.wisps;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i];
      this.drive(c, dt);
      if (c.alive) continue;
      if (c.deadT < SENTINEL.gone) continue;
      this.list.splice(i, 1); this.takeDown(W, c);
    }
  }

  /** Calissa's body driven from the runtime's state: on the ground (the wisp's hover taken off), its pose, its windup, a blow. */
  drive(c, dt) {
    const B = c.body; if (!B) return;
    B.root.position.y = c.pos.y - c.root.position.y;
    if (c.alive) {
      c.rise = Math.min(1, c.rise + dt / 1.2);
      const A = c.attack;
      B.drive({ pose: POSE[c.pose] || 'idle', move: A ? 'slam' : null, k: A ? Math.max(0, Math.min(1, 1 - A.t / WISP.cast.wind)) : 0, rise: c.rise });
      if (A && !c.wound) this.say(c, 'windup');
      c.wound = !!A;
      if (c.hp < c.seenHp) { B.hit(1 - c.hp / (c.maxHp || SENTINEL.hp)); this.say(c, 'crack', { hp: Math.max(0, c.hp) }); }
      c.seenHp = c.hp;
      const sp = Math.hypot(c.vel.x, c.vel.z); // (a footfall a stride, the stride by its pace)
      if (sp > 0.3 && (c.stride = (c.stride || 0) + dt * sp) > SENTINEL.stride) { c.stride = 0; this.say(c, 'step'); }
    } else if (!c.downed) { c.downed = true; B.down(); this.say(c, 'fall'); }
    if (!c.alive) c.root.visible = !B.done; // (it crumbles where it stood: a vanish or a scatter would hide it at once)
    B.update(dt);
  }

  say(c, what, extra = {}) { this.game.events?.emit(`sentinel.${what}`, { ...extra, at: [+c.pos.x.toFixed(2), +c.pos.y.toFixed(2), +c.pos.z.toFixed(2)], by: 'environment' }); }

  /** A body taken down for good (a wisp re-forms; a sentinel does not). */
  takeDown(W, c) {
    const g = this.game;
    const j = W.list.indexOf(c); if (j >= 0) W.list.splice(j, 1);
    g.scene.remove(c.root); g.creatures.remove?.(c); g.ai?.remove?.(c.brain);
    g.physics.byCollider?.delete(c.col.handle);
    try { g.physics.world.removeRigidBody(c.rb); } catch { /* gone */ } // (its collider goes with it)
    c.mixer?.stopAllAction?.(); c.body?.dispose(); c.body = null;
  }
}
