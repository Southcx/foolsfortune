// ---------------------------------------------------------------------------------------
// THE CHARGED SLASH'S WAVE (plain name; South, 2026-11-22: "the charged slash sends out a sword slash wave"; docs/plans/SONDELASS-FEEL.md
// 14): the cutlass's charged slash (cutlass.js MOVES.burst) throws a travelling crescent along its facing (toward the lock's target when
// locked), let go on the burst's strike. Its numbers are the burst row's `wave` (data), each a [none, full] pair read at the charge
// (tools/moveset.js `charge`, 0..1): speed m/s, reach m, width m, power a hit (creatures.strike's), dmg (x a pot's), push m/s, height m.
//
//   it flies    from the chest along the ground's plane at `speed`, its front sweeping a band `width` wide and `height` tall each frame
//               (swept from where its front was, so no fast frame skips a thing), until its reach is spent or a wall stands in its way
//               (a ray along its line against the static world: a cut through a wall is never a cut)
//   it strikes  each thing once, through the engine's own blow (tools/moveset.js blow(): pots, clapperjars, crystals, creatures, the
//               ledger's `cut.hit`), a light blow's feel; never what the blade itself struck on that swing, and nothing inside the
//               blade's reach while the burst's strike is live (the blade has it first: the charged hit is the blade's)
//   its look    the library's cut.wave.fly (held, following it), cut.wave.hit, cut.wave.end (vfx/library/cutlasscharges.js) in the
//               blow's damage type's colour, as the cutlass's trail is (DAMAGE_TINT)
//   events      cut.wave { beat: 'launch' | 'hit' | 'end', k (the charge), struck (at the end), why ('spent' | 'wall'), by: 'courier' }
//               (sounds: Wanda's, docs/handoffs/wanda/; sfx.slash and sfx.cutHit for now)
//
// Prior art: Zelda's sword beam (Link's blade throws its cut at full health), Monster Hunter's and Ragnarok Online's sword waves, Devil
// May Cry's Drive (Dante's charged slash sent along the ground as a wave of force, its power by how long it was held).
//
//   new SlashWave(cutlass)   .launch(c)  (the burst on its strike: cutlass.js onAt)   .update(dt)   .clear()   .active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { targets } from '../melee.js';
import { groups, G as GROUP } from '../../core/physics.js';
import { DAMAGE_TINT } from '../../vfx/library.js';
import { typeOf } from '../../progress/combat/types.js';

const STATIC = groups(0xffff, GROUP.STATIC), BLADE = 2.4; // (m: the blade's reach from the body, the tip and its forgiveness)
const lerp = (p, k) => (Array.isArray(p) ? p[0] + (p[1] - p[0]) * k : p);
const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3(), _e = new THREE.Vector3(), _o = new THREE.Vector3();

export class SlashWave {
  constructor(cutlass) { this.cut = cutlass; this.list = []; }
  get game() { return this.cut.game; }
  get active() { return this.list.length > 0; }

  /** The burst `c` on its strike: a wave from the chest along its facing (the lock's target's way when locked). */
  launch(c) {
    const row = c.def.wave; if (!row) return;
    const g = this.game, P = this.cut.tool.P, M = this.cut.moves, k = THREE.MathUtils.clamp(M.charge || 0, 0, 1);
    const dir = new THREE.Vector3(Math.sin(c.yaw ?? P.bodyYaw), 0, Math.cos(c.yaw ?? P.bodyYaw));
    if (g.lock?.active && g.lock.point(_e)) { _d.set(_e.x - P.pos.x, 0, _e.z - P.pos.z); if (_d.lengthSq() > 0.04) dir.copy(_d.normalize()); }
    const w = {
      c, k, dir, from: P.pos.clone().setY(P.pos.y + 0.05), s: 0.4, speed: lerp(row.speed, k), reach: lerp(row.reach, k), width: lerp(row.width, k),
      height: lerp(row.height, k), seen: new Set(), struck: 0,
      hit: { power: lerp(row.power, k), dmg: lerp(row.dmg, k), push: lerp(row.push, k), away: 1, cause: c.def.hit?.cause },
      blow: { id: 'burst.wave', kind: 'wave', def: { stats: { power: lerp(row.power, k) }, heat: 0 } }, // (its own blow: a light one's feel, apart from the string)
    };
    w.tint = DAMAGE_TINT[typeOf(w.hit.cause || M.S.cause || 'sliced')] ?? DAMAGE_TINT.impact;
    const front = (out) => out.copy(w.from).addScaledVector(w.dir, w.s);
    w.fx = g.vfx?.play('cut.wave.fly', { pos: front(new THREE.Vector3()), dir, tint: w.tint, scale: w.width / 1.73, power: 0.7 + 0.6 * k,
      follow: (h) => { if (w.done) return false; front(h.pos).addScaledVector(w.dir, -w.width / 1.73); h.dir.copy(w.dir); return true; } });
    this.list.push(w);
    sfx.slash?.(true); // (a placeholder: the wave's own sound is Wanda's)
    g.events?.emit('cut.wave', { beat: 'launch', k, by: 'courier' });
  }

  update(dt) {
    if (!this.list.length) return;
    for (const w of this.list) this.fly(w, dt);
    this.list = this.list.filter((w) => !w.done);
  }

  fly(w, dt) {
    const g = this.game, P = this.cut.tool.P, M = this.cut.moves, s0 = w.s;
    let s1 = Math.min(w.reach, s0 + w.speed * dt), why = s1 >= w.reach ? 'spent' : null;
    const ray = g.physics?.raycast(_o.copy(w.from).setY(w.from.y + 0.8).addScaledVector(w.dir, s0), w.dir, Math.max(0.01, s1 - s0), P.collider, STATIC, (col) => !col.isSensor());
    if (ray) { s1 = s0 + ray.distance; why = 'wall'; }
    w.s = s1;
    const live = M.cur === w.c && !M.spent?.(w.c); // (the burst's strike still running: the blade has what is in its reach)
    if (M.cur === w.c) for (const e of M.hit) w.seen.add(e); // (never what the blade struck on that swing)
    const mid = _p.copy(w.from).addScaledVector(w.dir, (s0 + s1) / 2), R = (s1 - s0) / 2 + w.width / 2 + 1;
    _r.set(w.dir.z, 0, -w.dir.x);
    for (const tg of targets(g, mid, R)) {
      if (w.seen.has(tg.ent)) continue;
      _d.subVectors(tg.pos, w.from);
      const along = _d.x * w.dir.x + _d.z * w.dir.z, side = Math.abs(_d.x * _r.x + _d.z * _r.z), dy = tg.pos.y - w.from.y;
      if (along < s0 - tg.r - 0.3 || along > s1 + tg.r || side > w.width / 2 + tg.r || dy + tg.r < -0.3 || dy - tg.r > w.height) continue;
      if (live && Math.hypot(tg.pos.x - P.pos.x, tg.pos.z - P.pos.z) < BLADE + tg.r) continue; // (inside the blade's reach while it cuts: the blade's)
      w.seen.add(tg.ent); w.struck++;
      if (M.cur === w.c) M.hit.add(tg.ent); // (and the blade, still cutting, never strikes it after)
      M.blow(tg.kind, tg.ent, tg.pos, w.dir.clone(), w.hit, w.blow);
      g.vfx?.play('cut.wave.hit', { pos: tg.pos, dir: w.dir, tint: w.tint, power: 0.8 + 0.5 * w.k });
      sfx.cutHit?.(w.hit.dmg);
      g.events?.emit('cut.wave', { beat: 'hit', k: w.k, by: 'courier' });
    }
    if (why) this.end(w, why);
  }

  end(w, why) {
    w.done = true;
    w.fx?.stop?.();
    this.game.vfx?.play('cut.wave.end', { pos: _p.copy(w.from).addScaledVector(w.dir, w.s - w.width / 1.73), dir: w.dir, tint: w.tint, scale: w.width / 1.73 });
    this.game.events?.emit('cut.wave', { beat: 'end', k: w.k, struck: w.struck, why, by: 'courier' });
  }

  /** Stowed, or the place changed: every wave let go where it is. */
  clear() { for (const w of this.list) if (!w.done) this.end(w, 'spent'); this.list = []; }
}
