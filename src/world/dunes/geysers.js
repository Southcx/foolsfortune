// ---------------------------------------------------------------------------------------
// SLIP GEYSERS: where Lachryma runs under the Dunes it erupts on a cycle you can learn, and the column throws whatever stands in it
// straight up (the owner, 2026-10-06: "keep the sandspouts on deck, those could be a really fun mechanic as slip geysers in the Dunes";
// docs/plans/DUNES.md). Ten across the sand, a few in pairs to be chained, out of phase, laid the same every game (the Dunes are not
// seeded by the day). The look and its cycle are Calissa's (vfx/slipgeyser.js: dormant, rumble, erupt, fall, on the sim clock); the
// launch is this: standing in the ring, or skiffing into it, while the column stands throws you up at 18 m/s (a sprint jump is 6.4: a
// jump pad, a shortcut over a ridge, a way onto a ledge), once an eruption. It is a launch, not a blow: nothing is cracked.
// Events: geyser.launch { by }.
//
// Prior art: Old Faithful (an eruption on a cycle you can learn), Super Mario Sunshine's and Sonic's geysers and springs as launch pads,
// Journey's sand that flows.
//
//   game.geysers = new Geysers(game)   .update(dt)   .list [{ look, pos }]   .parked() (for the warm-up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SlipGeyser } from '../../vfx/slipgeyser.js';
import { DUNE } from './dunes.js';
import { seeded } from '../../core/rng.js';

const LAUNCH = { up: 18, r: 4, over: 4 }; // (m/s up; the ring's radius; how far over the sand a body still counts as in it)
const PLACES = { n: 10, pairs: 3, r: [140, 420], gap: 26, clear: [{ x: -300, z: -270, r: 50 }] }; // (ten, three of them pairs 26 m apart; clear of the Gnomon's foot)

export class Geysers {
  constructor(game) {
    this.game = game; this.list = [];
    const D = game.dunes; if (!D) return;
    const r = seeded(0x9e3779b1), at = [];
    while (at.length < PLACES.n) {
      const a = r() * Math.PI * 2, d = PLACES.r[0] + r() * (PLACES.r[1] - PLACES.r[0]), x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (PLACES.clear.some((c) => Math.hypot(x - c.x, z - c.z) < c.r) || at.some((p) => Math.hypot(x - p.x, z - p.z) < 40)) continue;
      at.push({ x, z });
      if (at.length <= PLACES.pairs * 2 && at.length % 2 === 1) { const b = a + Math.PI / 2; at.push({ x: x + Math.cos(b) * PLACES.gap, z: z + Math.sin(b) * PLACES.gap }); } // (a pair, to be chained)
    }
    at.forEach((p, i) => {
      const x = DUNE.x + p.x, z = DUNE.z + p.z, pos = new THREE.Vector3(x, D.heightAt(x, z), z);
      const look = new SlipGeyser({ height: 22 + r() * 16, radius: LAUNCH.r, seed: i + 1 });
      look.group.position.copy(pos); look.group.userData.zone = 'dunes'; game.scene.add(look.group);
      this.list.push({ look, pos, thrown: false });
    });
  }

  /** One standing column, for the warm-up (the column, the skirt and the ring's shimmer compiled with the rest). */
  parked() {
    const G = new SlipGeyser({ height: 20, radius: LAUNCH.r, seed: 99, dormant: [0.5, 0.5] });
    for (let i = 0; i < 40 && G.state !== 'erupt'; i++) G.update(0.25);
    G.update(0.5); this.game.scene.add(G.group); return [G.group];
  }

  update(dt) {
    const g = this.game, D = g.dunes; if (!this.list.length || !D?.active) return;
    const P = g.player;
    for (const G of this.list) {
      G.look.update(dt);
      if (!G.look.launching) { G.thrown = false; continue; }
      if (G.thrown) continue;
      const near = Math.hypot(P.pos.x - G.pos.x, P.pos.z - G.pos.z) < LAUNCH.r, low = P.pos.y - G.pos.y < LAUNCH.over;
      if (!near || !low) continue;
      G.thrown = true;
      P.impulse(new THREE.Vector3(0, Math.max(0, LAUNCH.up - P.vel.y), 0), 'geyser');
      const T = g.techs?.active; if (T?.id === 'skiff') { T.air = true; T.spin = 0; T.airT = 0; } // (the skiff leaves its hover: skiff.js air)
      g.events?.emit('geyser.launch', { by: 'environment' });
    }
  }
}
