// ---------------------------------------------------------------------------------------
// THE SENTINELS: rejection's antibody (GLOSSARY, "a sentinel"; Espada's note of 2026-10-30; GODHAND.md 10). At a high Dissonance Level the
// island sends one of its own Figments to find what is warping it and put it right: it walks to where the god hand worked the island
// (the warp marks rejection keeps), wears the hand's creations there back into the island's matter, and the island's dissonance falls
// with each mend. It guards; it never hunts for its own sake: it fights only what struck it, and once nothing is left to mend it sinks
// back into the island. Its mind is data (sentinel/mind.js) built from the AI parts; its body for now is the Lantern Wisp's
// (wisp/lanternwisp.js, `c.ev = 'sentinel'`: its events say sentinel.*), a placeholder until Calissa's clay body (her handoff).
//
//   game.sentinels = new Sentinels(game)   .send(at, level)   .update(dt)   .list   SENTINEL (its numbers)
//   events: sentinel.wake { level, by }, sentinel.seek { by }, sentinel.mend { volume, by }, and from its body sentinel.hit, .burst, .cast
//
// Prior art: the immune system's white blood cell (it seeks the damage, not you); Black & White's and Populous's land answering the god;
// Left 4 Dead's director for the pacing (rejection's own); the slip jelly's and the wisp's minds for the parts (docs/AI.md).
// ---------------------------------------------------------------------------------------
import { Reasoner } from '../ai/index.js';
import { sentinelMind } from './mind.js';

/** Its numbers. from: the Dissonance Level it is first sent at; one alive at a time; mend: the dissonance a mend takes off; wear: the
 *  radius (m) of the creation worn back at a mark; reach: how near (m) it mends from; marks: how many warp marks rejection keeps;
 *  settle: real s with nothing to mend before it sinks; gone: real s a sunk or burst body lingers before it is taken down. */
export const SENTINEL = { from: 4, alive: 1, mend: 18, wear: 2.6, reach: 2.2, marks: 12, settle: 10, gone: 6, hp: 9 };

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
    this.list.push(c);
    g.events?.emit('sentinel.wake', { level, by: 'environment' });
    if (c.brain.action) c.brain.end('swap');
    c.brain.reasoner = new Reasoner(this.mind.actions(W)); c.brain.decide();
    return c;
  }

  update(dt) {
    if (!this.list.length) return;
    const W = this.game.wisps;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i]; if (c.alive) continue;
      if (c.deadT < SENTINEL.gone) continue;
      this.list.splice(i, 1); this.takeDown(W, c);
    }
  }

  /** A body taken down for good (a wisp re-forms; a sentinel does not). */
  takeDown(W, c) {
    const g = this.game;
    const j = W.list.indexOf(c); if (j >= 0) W.list.splice(j, 1);
    g.scene.remove(c.root); g.creatures.remove?.(c); g.ai?.remove?.(c.brain);
    g.physics.byCollider?.delete(c.col.handle);
    try { g.physics.world.removeRigidBody(c.rb); } catch { /* gone */ } // (its collider goes with it)
    c.mixer?.stopAllAction?.();
  }
}
