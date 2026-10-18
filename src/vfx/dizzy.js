// ---------------------------------------------------------------------------------------
// DIZZY: the stars that circle a head. Two uses, one look; each star a puffy five-pointed 3D star (the owner, 2026-10-18: "swap out the
// diamonds ... with 3d star meshes"), its geometry shared as `starGeometry` so the clapperjars' own stars (clappers.js) can wear it too:
//   the BUILD     while a stun meter fills (stun.js), a ring of small pale stars gathers over the head, one more for each quarter of
//                 the way, turning slowly and brightening: you can see how near a thing is to going down without a number
//   the STUN      once it is down, five gold stars wheel fast round its head until it comes to
// A mark in the world, not text (CLAUDE.md): it sits on the thing it is about.
//
// Prior art: the cartoon "seeing stars" of every brawler and platformer since Super Mario Bros. (the stars of a dazed Bowser, of a
// stunned Monster Hunter monster's head, of Zelda's Deku-nut-stunned enemies), and the stagger and poise meters of the action games,
// shown on the body (Sekiro's posture breaks with a flash; here it is gathered stars).
//
// The star: a five-pointed outline extruded thin with a round bevel (Super Mario's Power Star, Kirby's Warp Star), lit just enough
// that its facets read as it turns.
//
//   starGeometry(r = 0.05) -> a shared BufferGeometry (r: tip radius, metres)
//   const d = new Dizzy(scene)   d.set(key, headPos, { build: 0..1, stunned: bool, size })   (each frame it is shown)   d.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const N = 5;
const STARS = new Map(); // r -> geometry (shared; never disposed)

/** A puffy five-pointed star, tip radius `r` metres, centred, facing +z. One geometry per size, shared. */
export function starGeometry(r = 0.05) {
  let g = STARS.get(r);
  if (g) return g;
  const sh = new THREE.Shape(), inner = r * 0.48;
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? inner : r;
    i ? sh.lineTo(Math.cos(a) * k, Math.sin(a) * k) : sh.moveTo(Math.cos(a) * k, Math.sin(a) * k);
  }
  sh.closePath();
  g = new THREE.ExtrudeGeometry(sh, { depth: r * 0.28, bevelEnabled: true, bevelThickness: r * 0.22, bevelSize: r * 0.16, bevelSegments: 2, curveSegments: 1 });
  g.center(); g.computeVertexNormals();
  STARS.set(r, g);
  return g;
}

export class Dizzy {
  constructor(scene) {
    this.scene = scene;
    this.geo = starGeometry(0.05);
    this.pale = new THREE.MeshLambertMaterial({ color: 0x8a7f70, emissive: 0xd8cbb6, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false });
    this.gold = new THREE.MeshLambertMaterial({ color: 0x8a5a0c, emissive: 0xd99a22, toneMapped: false }); // (lit facets over a glow, so the star reads as it turns)
    this.rings = new Map(); // key -> { g, stars, seen, t, k }
  }

  ring(key) {
    let r = this.rings.get(key);
    if (r) return r;
    const g = new THREE.Group(); g.renderOrder = 8;
    const stars = [];
    for (let i = 0; i < N; i++) { const m = new THREE.Mesh(this.geo, this.pale); m.userData.a = (i / N) * Math.PI * 2; g.add(m); stars.push(m); }
    this.scene.add(g);
    r = { g, stars, seen: false, t: Math.random() * 6, k: 0 };
    this.rings.set(key, r);
    return r;
  }

  /** Show the ring over `head` this frame: `build` how full the meter is, or `stunned`. */
  set(key, head, { build = 0, stunned = false, size = 1 } = {}) {
    const r = this.ring(key);
    r.seen = true; r.head = head; r.build = build; r.stunned = stunned; r.size = size;
  }

  update(dt) {
    for (const [key, r] of this.rings) {
      if (!r.seen) { r.k = Math.max(0, r.k - dt * 4); if (r.k <= 0) { this.scene.remove(r.g); this.rings.delete(key); continue; } }
      else r.k = Math.min(1, r.k + dt * 6);
      r.seen = false;
      r.t += dt * (r.stunned ? 5.5 : 1.4);
      if (r.head) r.g.position.copy(r.head);
      const shown = r.stunned ? N : Math.min(N, Math.ceil(r.build * 4 - 1e-3));
      const R = (r.stunned ? 0.32 : 0.26) * r.size;
      r.stars.forEach((m, i) => {
        m.visible = i < shown && r.k > 0.01;
        m.material = r.stunned ? this.gold : this.pale;
        const a = m.userData.a + r.t;
        m.position.set(Math.cos(a) * R, Math.sin(r.t * 1.7 + i * 1.3) * 0.04 * r.size, Math.sin(a) * R);
        m.rotation.y += dt * (r.stunned ? 9 : 3);
        m.scale.setScalar(r.size * r.k * (r.stunned ? 1.25 : 0.7 + 0.5 * r.build));
      });
      this.pale.opacity = 0.55 + 0.35 * Math.sin(performance.now() * 0.004) ** 2;
    }
  }
}
