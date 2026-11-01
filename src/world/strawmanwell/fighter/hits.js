// ---------------------------------------------------------------------------------------
// THE FIGHTERS' HITS (docs/plans/FIGHTER.md 4): each frame, after every fighter has moved, which active box meets which body. A box is
// a sphere off its fighter by the facing (fighter/moves.js BOXES, from the move's data, never the drawn pose); a body is its hurt capsule
// (a vertical segment and a radius); a shield covers the body it is held over. A move instance strikes a body once (a multi-hit's
// next hit clears it: kernel.js). A grab's box closes on a body that is not intangible, shields and all. The psygun's shot (the neutral
// special) is a projectile: it flies straight, a shield takes it, a powershield or the toll's reflect sends it back faster and harder.
// Only fighters of different teams meet (the Courier one side, the straw fighters the other).
//
// Prior art: Melee's hitbox-hurtbox test (spheres against capsules, the decomp's lbColl), its hit-once-per-instance rule and the
// reflector (Fox's: a reflected projectile's damage x1.5); Super Smash Bros. Ultimate's training mode's view of the boxes.
//
//   const H = new FighterHits({ struck(A, V, hit, res), shotLook })   H.resolve(fighters)   H.shoot(A)   H.shots   H.clear()
//   touches(capsule, sphere) -> bool
// ---------------------------------------------------------------------------------------
import { FRAME } from '../../../progress/platformfighter.js';
import { GRAB_BOX, KIT, BOXES } from './moves.js';
import { takeHit } from './kernelhurt.js';
import { connectGrab } from './kernelholds.js';
import { hitOf, noteStale, moveOf } from './fighterstate.js';

/** Does a sphere { x, y, r } meet a capsule { x, y0, y1, r }? */
export function touches(c, s) {
  const cy = Math.min(c.y1, Math.max(c.y0, s.y)), dx = s.x - c.x, dy = s.y - cy, R = s.r + c.r;
  return dx * dx + dy * dy <= R * R;
}

export class FighterHits {
  constructor({ struck, shotLook = null, bounds }) { this.struck = struck; this.shotLook = shotLook; this.bounds = bounds; this.shots = []; }

  /** Every active box against every body of the other side; grabs; then the shots in flight. */
  resolve(list) {
    for (const A of list) {
      if (!A.live || A.hl > 0) continue;
      if (A.st === 'grab' && A.grabbing) this.grab(A, list);
      if (!A.active) continue;
      for (const b of A.boxes()) for (const V of list) {
        if (V.team === A.team || A.hits.has(V.id) || !V.hittable || V.holder) continue;
        if (!touches(V.hurtbox(), b)) continue;
        A.hits.add(V.id);
        const hit = hitOf(A, A.m); if (!hit) continue;
        const res = takeHit(V, A, hit);
        if (res === 'miss') continue;
        noteStale(A, A.m);
        this.struck(A, V, hit, res);
        if (res === 'hit' && moveOf(A.m, A)?.snare && A.grounded && V.live && !V.holder && !A.victim) { // (a snare: the foe hauled in and held, its own grab: Scorpion's spear, the kusarigama's yank)
          V.x = A.x + A.face * 0.75 * A.scale; V.y = A.y; V.grounded = true; A.hl = 0; connectGrab(A, V); break;
        }
        if (A.hl > 0) break; // (frozen by its own hit: the rest wait)
      }
    }
    this.fly(list);
  }

  grab(A, list) {
    const [ox, oy, r] = GRAB_BOX, k = A.scale, s = { x: A.x + ox * k * A.face, y: A.y + oy * k, r: r * k };
    for (const V of list) {
      if (V.team === A.team || !V.live || V.intan > 0 || V.invin > 0 || V.holder || V.st === 'ledge' || V.st === 'respawn' || V.hl > 0 || !V.grounded) continue;
      if (!touches(V.hurtbox(), s)) continue;
      connectGrab(A, V); return;
    }
  }

  /** A shot special's shot, out of A's hand: the psygun's by KIT.shot, a move's own `shot` laid over it (fightertoolkits.js: its
   *  speed, lift `vy` and `grav`, size, life, `back` thrown behind). */
  shoot(A) {
    const id = A.m || 'nspecial', o = moveOf(id, A)?.shot || {}, S = { ...KIT.shot, ...o }, k = A.scale, hit = hitOf(A, id), dir = o.back ? -A.face : A.face;
    const s = { owner: A, team: A.team, move: id, x: A.x + dir * 0.6 * k, y: A.y + 1.1 * k, vx: dir * S.speed, vy: S.vy || 0, grav: S.grav || 0, life: S.life, r: S.r, hit, look: null };
    s.look = this.shotLook?.(s) ?? null;
    this.shots.push(s); return s;
  }
  fly(list) {
    const B = this.bounds;
    for (const s of this.shots) {
      s.x += s.vx * FRAME; if (s.grav || s.vy) { s.vy -= s.grav * FRAME; s.y += s.vy * FRAME; if (s.y < 0.1) s.life = 0; } s.life--; // (an arc: a lob falls)
      for (const V of list) {
        if (V.team === s.team || !V.live) continue;
        // the toll's reflect: sent back faster and harder, its side changed
        if (V.reflecting && Math.hypot(s.x - V.x, s.y - (V.y + V.h * 0.5)) < (BOXES.dspecial[0][2] * V.scale + s.r)) { this.reflect(s, V); continue; }
        if (!V.hittable || V.holder || !touches(V.hurtbox(), s)) continue;
        const res = takeHit(V, s.owner, { ...s.hit, shot: true });
        if (res === 'miss') continue;
        if (res === 'power') { this.reflect(s, V); continue; }
        if (res === 'hit') noteStale(s.owner, s.move || 'nspecial');
        this.struck(s.owner, V, s.hit, res, s);
        s.life = 0; break;
      }
      if (B && (s.x < B.x0 || s.x > B.x1)) s.life = 0;
    }
    for (const s of this.shots) if (s.life <= 0) s.look?.dispose?.();
    this.shots = this.shots.filter((s) => s.life > 0);
    for (const s of this.shots) s.look?.place?.(s);
  }
  reflect(s, V) {
    const S = KIT.shot;
    s.vx = -s.vx * S.reflectSpeed; s.team = V.team; s.owner = V; s.life = S.life;
    s.hit = { ...s.hit, damage: Math.round(s.hit.damage * S.reflectDamage * 10) / 10 };
    s.look?.reflected?.(s);
  }
  clear() { for (const s of this.shots) s.look?.dispose?.(); this.shots = []; }
}
