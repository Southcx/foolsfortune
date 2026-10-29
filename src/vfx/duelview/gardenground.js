// ---------------------------------------------------------------------------------------
// YOUR GARDEN AS YOUR GROUND (plain name; South, 2026-10-28: "the Courier/pneuka jar's Zone of Influence should be a representation of
// their Spirit Garden"; ABERRANTS.md 7): your half of a puzzle duel's backdrop drawn as the world inside your Pneuka Jar, against the
// aberrant's weather. Read once at the duel's open from Dovina's `game.gardenBackdrop()` (progress/gardenbackdrop.js); a bare garden
// (a new save) leaves the deep and the film as they were.
//   THE SKY AND THE GROUND   the domains' clash's Courier side in the garden's mood (the season's palette and the hour, bloom or briar:
//                            vfx/garden/gardenmood.js moodAt), its planetoids round the horizon, a meadow under the Jar (domains.js `setGarden`)
//   YOUR SPIRITS             up to four bound spirits as lights in their feelings over it, and as small glowing souls standing behind the Jar
//   YOUR PIECES              up to three of your most placed decor pieces stood at your side of the arena, in their own models and
//                            material (vfx/garden/decorpieces.js), lit by the hour's lamps
// A look only: no rule reads it. Programs: the clash's, the decor pieces' own (compiled here at the open, under the encounter's wipe),
// the juice's additive for the souls.
// Prior art: Persona's Velvet Room (a room that is a mind), the Domain Expansions of Jujutsu Kaisen (each fighter's own world unfolded),
// Animal Crossing's town flag and tune (your place carried as your sign), the garden's own looks (vfx/garden/).
//
//   const G = new GardenGround(view)   G.open(courierSpot, along)   G.update(dt)   G.close()   GARDEN_GROUND (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { moodAt } from '../garden/gardenmood.js';
import { decorGeometry, decorMaterial } from '../garden/decorpieces.js';
import { COLOR } from '../../progress/weather.js';

/** pieces: how many of your pieces stand at your side; spread: how far apart behind the Jar (m); back: how far behind it; scale: their
 *  size against the arena's; souls: their radius (m), height and bob. */
export const GARDEN_GROUND = { pieces: 3, spread: 1.6, back: 1.4, scale: 0.6, souls: { r: 0.09, up: 0.9, bob: 0.08 } };
const HOUR = { night: 1, dawn: 6.5, day: 13, daytime: 13, dusk: 18.5 };

export class GardenGround {
  constructor(view) {
    this.view = view; this.group = new THREE.Group(); this.group.name = 'duel-garden'; this.group.visible = false; view.root.add(this.group);
    this.mat = null; this.items = []; this.t = 0;
  }

  open(spot, along) {
    this.close(); const V = this.view, g = V.game, B = typeof g.gardenBackdrop === 'function' ? g.gardenBackdrop() : null;
    this.mood = null; if (!B || B.bare) { V.clash.setGarden(null); return; }
    const mood = (this.mood = moodAt({ hour: HOUR[B.phase] ?? 13, season: B.season, briarK: B.harmony?.briarK ?? 0.33 })); // (kept: the frame's dress reads it, framedress.js)
    const spirits = (B.spirits || []).map((s) => new THREE.Color(COLOR[s.feeling] ?? 0xfff2d0));
    V.clash.setGarden(mood, spirits);
    // the pieces and the souls, in the view's root (the duel's instance keeps it): behind the Jar, away from the board
    const G = GARDEN_GROUND, qi = V.root.quaternion.clone().invert(), al = along.clone().applyQuaternion(qi).setY(0).normalize(), sd = new THREE.Vector3(-al.z, 0, al.x);
    const base = V.root.worldToLocal(spot.clone()).addScaledVector(al, -G.back); base.y = 0; // (behind the Jar, away from the board, on the ground)
    const ids = (B.pieces || []).slice(0, G.pieces).map((p) => p.id);
    if (ids.length && !this.mat) { this.mat = new THREE.MeshStandardMaterial({ name: 'decor', roughness: 0.85 }); decorMaterial(this.mat, g); }
    ids.forEach((id, i) => { const m = new THREE.Mesh(decorGeometry(id), this.mat); m.position.copy(base).addScaledVector(sd, (i - (ids.length - 1) / 2) * G.spread);
      m.scale.setScalar(G.scale); m.rotation.y = Math.atan2(al.x, al.z) + (i - 1) * 0.3; this.group.add(m); this.items.push({ m }); });
    const soulGeo = new THREE.SphereGeometry(G.souls.r, 12, 8);
    spirits.forEach((c, i) => { const m = new THREE.Mesh(soulGeo, new THREE.MeshBasicMaterial({ name: 'duel-juice', color: c.clone().multiplyScalar(1.8), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); // (the juice's program)
      m.position.copy(base).addScaledVector(al, 0.5).addScaledVector(sd, (i - (spirits.length - 1) / 2) * G.spread * 0.6); m.position.y = G.souls.up;
      this.group.add(m); this.items.push({ m, soul: true, y: G.souls.up, ph: i * 1.7 }); });
    this.group.visible = this.items.length > 0;
  }

  update(dt) {
    if (!this.group.visible) return; this.t += dt; const b = GARDEN_GROUND.souls.bob;
    for (const it of this.items) if (it.soul) { it.m.position.y = it.y + Math.sin(this.t * 1.4 + it.ph) * b; it.m.material.opacity = 0.75 + 0.25 * Math.sin(this.t * 2.3 + it.ph); }
  }

  close() {
    for (const it of this.items) { this.group.remove(it.m); if (it.soul) it.m.material.dispose(); }
    this.items.length = 0; this.group.visible = false; this.view.clash.setGarden(null);
  }
}
