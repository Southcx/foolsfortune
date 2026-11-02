// ---------------------------------------------------------------------------------------
// THE FLOCK'S BODIES (Dovina's herd family: progress/mimicryherd.js, MIMICRY.md 7, GAPS G141): the clapperjars a herd puzzle sets out on
// its patch, walked by the god hand's Herd as any creature with a mind is (godhand/powers.js `walk` drives `c.want`; here it is turned
// into steps on the ground). They are the puzzle's, never the world's: pinned (no mind of their own, no wander, no fall: clappers.js
// steps them as it steps a held one, so where this module sets `pos` the body follows), warded (a blow on one is turned aside as an
// unmended aberrant's is), never counted (no drops, no ledger: their outcome, the sink, is the environment's), and sunk into the sand
// when the puzzle closes. A body whose walk ends in the pen stays there: nothing of its own moves it.
//
// Prior art: Pikmin's whistle (a herd walked by a gesture), the house's god hand Herd (godhand/powers/will.js), Islands of Insight's
// enclave puzzles (pieces set out for the puzzle alone, gone with it).
//
// The pen is drawn as a placeholder line on the sand (a loop a hand above it); its look is Calissa's (`flock.penLine`, a THREE.Line).
//   const F = new MimicFlock(game)   .spawn(points, at, pen?)   .demo(step)   .reset()   .local(at) -> [[x, z]]   .update(dt)   .clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { herdSpots } from '../../progress/mimicryherd.js';
import { MIMIC_TOOL } from '../../progress/mimicry.js';

const MIND = { update() {}, end() {} }; // (a mind that does nothing: Herd sets it aside while it walks and gives it back after)
const WALK = { secs: 20, step: 3 }, ARRIVE = 0.6; // (ARRIVE: metres from its spot a walked body counts as there, Herd's own stop: godhand/powers.js step) // (real s a demonstration's walk may take, as the runner's; m/s a herded body walks, Herd's own)
const _v = new THREE.Vector3();

export class MimicFlock {
  constructor(game) { this.game = game; this.bodies = []; }
  /** The top of the ground: the puzzle's patch of the island's matter where it lies (its bed stands over the sand), else the sand. */
  ground(x, z) { const y = this.F?.groundAt?.(x, z); if (Number.isFinite(y)) return y; const D = this.game.dunes; return D?.heightAt?.(x, z) ?? 0; }

  /** Set out a clapperjar at each patch-local point, on the ground. */
  spawn(points, at, pen = null, F = null) {
    const g = this.game, C = g.clappers; if (!C) return;
    this.clear(); this.F = F;
    if (pen?.length) { // (the pen's polygon, patch-local, laid on the sand a hand above it)
      const pts = []; for (let i = 0; i <= pen.length * 4; i++) { const n = pen.length, a = pen[Math.floor(i / 4) % n], b = pen[(Math.floor(i / 4) + 1) % n], u = (i % 4) / 4, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, wx = at.x + x, wz = at.z + z; pts.push(new THREE.Vector3(wx, this.ground(wx, wz) + 0.12, wz)); }
      this.penLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffd36a })); this.penLine.name = 'mimicPen'; this.penLine.userData.zoneFree = true; g.scene.add(this.penLine); // (its own, wherever the patch lies: render/zones.js never hides it)
    }
    for (const [x, z] of points) {
      const wx = at.x + x, wz = at.z + z, c = C.spawn(new THREE.Vector3(wx, this.ground(wx, wz), wz), false, 0);
      if (!c) continue;
      Object.assign(c, { puzzle: true, pinned: true, brain: { ...MIND }, want: new THREE.Vector3(), home: [x, z], hp: 1 });
      g.creatures?.add(c);
      this.bodies.push(c);
    }
  }
  /** The System's Herd drag: the nearest bodies walked to their spots round its end (Dovina's herdSpots, as WILL.herd lays them). */
  demo(step, at) {
    const P = this.game.god?.arts?.powers; if (!P) return;
    const spots = herdSpots(this.local(at), step, MIMIC_TOOL.herd);
    this.bodies.forEach((c, i) => { const [x, z] = spots[i]; if (Math.hypot(x - (c.pos.x - at.x), z - (c.pos.z - at.z)) > 0.05) P.walk(c, _v.set(at.x + x, 0, at.z + z), WALK.secs); });
  }
  /** Every body set back at its own point under a puff of sand, its walk cleared. */
  reset(at) {
    const g = this.game, P = g.god?.arts?.powers;
    for (const c of this.bodies) {
      P?.release?.(c); c.want.set(0, 0, 0);
      const x = at.x + c.home[0], z = at.z + c.home[1]; c.pos.set(x, this.ground(x, z), z); c.prevPos.copy(c.pos);
      g.fx?.impact?.(c.pos.clone(), new THREE.Vector3(0, 1, 0), { sparks: 0, dust: 6 });
    }
  }
  /** The bodies' places, patch-local [x, z] (the score's `bodies`). */
  local(at) { return this.bodies.filter((c) => c.alive).map((c) => [c.pos.x - at.x, c.pos.z - at.z]); }

  /** Herd's walk turned into steps on the ground (the hand's powers step `want`; a pinned clapperjar never moves itself). */
  update(dt) {
    const P = this.game.god?.arts?.powers;
    for (const c of this.bodies) {
      if (!c.alive || !c.want) continue;
      const W = c.godWalk; if (W && Math.hypot(W.to.x - c.pos.x, W.to.z - c.pos.z) < ARRIVE) { P?.release?.(c); c.want.set(0, 0, 0); } // (there: let go, so a demonstration hands over and a copy is scored as it stands)
      const sp = c.want.length(); if (sp < 0.01) { c.speed = 0; continue; }
      c.pos.addScaledVector(c.want, Math.min(1, WALK.step / sp) * dt); c.pos.y = this.ground(c.pos.x, c.pos.z);
      c.heading = Math.atan2(c.want.x, c.want.z); c.speed = Math.min(sp, WALK.step);
    }
  }
  /** Sunk into the sand, quietly: out of the registry, the world and the list; nothing counted. */
  clear() {
    const g = this.game, C = g.clappers, P = g.god?.arts?.powers;
    for (const c of this.bodies) {
      P?.release?.(c);
      if (c.alive) { c.alive = false; g.fx?.impact?.(c.pos.clone(), new THREE.Vector3(0, 1, 0), { sparks: 0, dust: 8 }); g.physics?.removeBody(c.body); g.scene.remove(c.root); c.mixer?.stopAllAction(); }
      g.creatures?.remove(c);
      if (C) C.list = C.list.filter((x) => x !== c);
    }
    this.bodies = []; this.F = null;
    if (this.penLine) { g.scene.remove(this.penLine); this.penLine.geometry.dispose(); this.penLine.material.dispose(); this.penLine = null; }
  }
}
