// ---------------------------------------------------------------------------------------
// AN ISLET'S LOOK (docs/plans/OPEN-SEA.md sections 2 and 6; the handoff from Dovina, 2026-10-20): the open sea's islets dressed over
// Dovina's placeholders (world/opensea/seaprops.js). Once the room has laid its things (`game.opensea.props`), each islet's placeholder
// mound is hidden (its collider kept) and its kit's look stands in its place: one merged geometry with its colour in the vertex
// (isletkits/kits.js), its walkable top exactly the collider's disc at the islet's `top`, its skirt sloping under the water; a turquoise
// shallows ring round the atolls and the sandbars; and its secret's placeholder restyled in place (isletkits/secrets.js: the same mesh,
// a new geometry, so the room still hides it when the secret is taken). Every tall thing standing on the walkable top (a sea stack, a
// tower, a column, an arch's legs, a palm, a boulder) gets a fixed collider of its own. Seeded from the feature's id: the same islet
// every time, as the sea is the save's.
//
// THE SANDBAR'S TIDE (OPEN-SEA.md 6, islets.js `tide: 'low'`): a sandbar is there only at low water, dawn and dusk. `sandbarTide(ms)` is the
// one clock of it (0 under, 1 up): low water centred on 06:00 and 19:00 game time, fully up a game hour either side, rising and sinking
// over the game hour beyond (eased), so it is up 05:00 to 07:00 and 18:00 to 20:00. Each frame the look follows it: the bank (and its
// secret's mesh) sunk `SANDBAR_TIDE.sink` metres under the crude at high water and hidden once there, the kit's own colliders (driftwood)
// off while it is more under than up, its shallows ring left faint (a pale patch on the water where the bar lies under: the tell). The
// placeholder's collider and the room's moor are Petra's (docs/handoffs/petra/2026-11-03-from-calissa-sandbar.md): read
// `game.seaLooks.sandbarUp()` (the same number) to follow it.
//
// Cost: two programs for every islet together (the islet program: Lambert with vertex colours and a per-vertex glow; the shallows':
// basic, vertex alpha, one pass), both compiled at boot by `prewarm()`; one draw an islet (two with its shallows); under 2,500
// triangles an islet (`tris`).
//
// Prior art: The Legend of Zelda: The Wind Waker's islets (a mound, a tree, one thing on it, under a big sky); the rail foes' kit
// (vfx/railfoes/kit.js: primitives baked to one geometry, colour in the vertex, one shared program); the vfx modules' prewarm
// (vfx/racewaysandfall.js: one copy under the world for main.js's compile, kept, never disposed).
//
//   game.seaLooks = new SeaLooks(game)   const park = game.seaLooks.prewarm() (before the compile)   park() (after the prime draw)
//   game.seaLooks.update(dt)   (each frame: dresses the islets the first frame a new set of the open sea's things exists)
//   game.seaLooks.sandbarUp(ms?) -> 0..1 (the sandbars' tide now)   sandbarTide(ms) (the same, pure)   SANDBAR_TIDE (its hours and depth)
//   game.seaLooks.teardown(game)   (areas stage 2, render/areas.js; called by opensea.teardown: the looks' meshes and geometry let go, the
//   fixed body and its colliders removed; the materials kept, so a build again compiles nothing; safe twice)
//   isletMaterial() (the islet program: every copy one program, its key "isletlook"; the puzzles and the Egregores draw with it too)
//   .dressed (the props object dressed, or null)   .tris { kit: [n, ...] }   isletLook({ kit, rad, id, away? }) -> { geo, colliders, shallows?, tris } (one islet, off-scene)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { seeded } from '../../core/rng.js';
import { SEA } from '../../world/opensea/seaprops.js';
import { DAY_MS, now } from '../../core/calendar.js';
import { ISLET_LOOKS } from './isletkits/kits.js';
import { secretGeometry } from './isletkits/secrets.js';

const PI = Math.PI;

/** The sandbars' tide: low water at `lows` (game hours), fully up `hold` game hours either side, `ease` more to rise or sink; `sink` metres
 *  the bank's top goes under the still crude at high water; `wet` the shallows ring's share of its alpha left while it is under. */
export const SANDBAR_TIDE = { lows: [6, 19], hold: 1, ease: 1, sink: SEA.top + 0.9, wet: 0.4 };
/** How far up the sandbars stand at a moment (0 under .. 1 up), smoothstepped over the game hour on either side of low water. */
export function sandbarTide(ms = now()) {
  const T = SANDBAR_TIDE, h = ((((ms % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS) * 24;
  let up = 0;
  for (const low of T.lows) {
    const d = Math.abs(((h - low + 36) % 24) - 12), k = THREE.MathUtils.clamp(1 - (d - T.hold) / T.ease, 0, 1);
    up = Math.max(up, k * k * (3 - 2 * k));
  }
  return up;
}
const hashId = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** The islet program: Lambert, its albedo in the vertex, and that albedo given off as light by the vertex's `glow` (a crystal, gold). */
export function isletMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * vGlow;');
  };
  m.customProgramCacheKey = () => 'isletlook';
  m.userData.shared = true; // (one for every islet: never disposed by a room taken down)
  return m;
}
/** The shallows' program: unlit, its colour and alpha in the vertex, drawn once (no back pass) over the crude. */
function shallowsMaterial() {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, forceSinglePass: true });
  m.userData.shared = true;
  return m;
}

/** The shallows: a ring on the water from just inside the waterline outward, its alpha falling to nothing at its outer edge; laid 0.35 m
 *  over the still surface, about the swells' height at the open sea's calm, so their crests cross it only now and then. */
function shallowsGeometry({ inner, outer, colour }) {
  const g = new THREE.RingGeometry(inner, outer, 48, 3).rotateX(-PI / 2).translate(0, -SEA.top + 0.35, 0);
  g.deleteAttribute('uv');
  const P = g.attributes.position.array, n = P.length / 3, col = new Float32Array(n * 4), c = new THREE.Color(colour), pale = new THREE.Color(0xe8f4ec);
  for (let i = 0; i < n; i++) {
    const t = THREE.MathUtils.clamp((Math.hypot(P[i * 3], P[i * 3 + 2]) - inner) / (outer - inner), 0, 1), k = c.clone().lerp(pale, Math.max(0, 0.35 - t));
    col[i * 4] = k.r; col[i * 4 + 1] = k.g; col[i * 4 + 2] = k.b; col[i * 4 + 3] = 0.6 * (1 - t) ** 1.6;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  return g;
}

/** One islet's look, off-scene: its geometry in its own frame (centre on its walkable top), its colliders there, its shallows. */
export function isletLook({ kit, rad, id, away = null }) {
  const rng = seeded(hashId(String(id))), build = ISLET_LOOKS[kit] || ISLET_LOOKS.rock;
  const { kit: k, shallows } = build({ rad, r: rad * 0.85, rng, away: away ?? rng() * PI * 2 });
  const b = k.build();
  return { geo: b.geo, colliders: b.colliders, shallows: shallows ? shallowsGeometry(shallows) : null, tris: b.tris + (shallows ? 48 * 3 * 2 : 0), rng };
}

export class SeaLooks {
  constructor(game) {
    this.game = game; this.dressed = null; this.tris = {}; this.looks = []; this.body = null; this.bars = []; this.tide = -1;
    this.mat = isletMaterial(); this.wet = shallowsMaterial(); this.wetBar = shallowsMaterial(); // (the sandbars' shallows on their own copy: their alpha follows the tide)
  }

  /** One copy of each program 50 m under the world for main.js's compile; returns what hides it again (kept, never disposed). */
  prewarm() {
    const a = isletLook({ kit: 'rock', rad: 2, id: 'prewarm' }), b = isletLook({ kit: 'atoll', rad: 2, id: 'prewarm' });
    const m = [new THREE.Mesh(a.geo, this.mat), new THREE.Mesh(b.shallows, this.wet)];
    m[0].castShadow = m[0].receiveShadow = true;
    for (const o of m) { o.position.set(0, -50, 0); o.userData.zoneFree = true; o.visible = true; this.game.scene.add(o); }
    const bottle = this.game.bottleLooks?.prewarm?.(); // (the drift bottle's glass: vfx/opensea/bottlelooks.js)
    const tells = this.game.seaTells?.prewarm?.(); // (the gulls' program: vfx/opensea/seatells.js)
    return () => { for (const o of m) o.visible = false; bottle?.(); tells?.(); };
  }

  update() {
    const P = this.game.opensea?.props;
    if (P && this.dressed !== P) {
      if (this.dressed) this.teardown(this.game); // (the room was built again: a new set of things)
      this.dress(P); this.dressed = P; this.tide = -1;
    }
    if (this.bars.length) this.tideStep();
  }

  /** The sandbars' tide now (0 under .. 1 up): what the room's moor and collider may follow. */
  sandbarUp(ms) { return sandbarTide(ms); }
  /** The sandbars set to the tide: the bank and its secret's mesh sunk, the kit's colliders off while under, the shallows faint. */
  tideStep() {
    const up = sandbarTide(), T = SANDBAR_TIDE;
    if (Math.abs(up - this.tide) < 1e-4) return;
    const was = this.tide; this.tide = up;
    const drop = (1 - up) * T.sink, under = up < 0.5;
    this.wetBar.opacity = T.wet + (1 - T.wet) * up;
    for (const B of this.bars) {
      B.mesh.position.y = B.y - drop; B.mesh.visible = up > 0.001;
      if (B.secret && B.secret.visible !== false) B.secret.position.y = B.secretY - drop; // (the room hides it when taken; it never shows it again)
      if (was < 0 || (was < 0.5) !== under) for (const c of B.colliders) c.setEnabled?.(!under);
    }
  }

  /** The looks taken down: meshes out of the scene, their geometry let go, the fixed body and its colliders removed. The secrets'
   *  meshes are the room's (its teardown lets them go). */
  teardown(game = this.game) {
    for (const m of this.looks) { game.scene.remove(m); m.geometry.dispose(); }
    this.looks.length = 0; this.tris = {}; this.bars = [];
    if (this.body) { game.physics?.world?.removeRigidBody(this.body); this.body = null; }
    this.dressed = null;
  }

  dress(P) {
    const g = this.game, W = g.physics?.world, body = this.body = W?.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0)) || null;
    const add = (mesh) => { mesh.userData.zone = 'opensea'; g.scene.add(mesh); this.looks.push(mesh); return mesh; };
    for (const isl of P.islets) {
      const mark = P.marks.find((m) => m.feature === isl.feature); if (mark) mark.mesh.visible = false;
      const s = isl.secret.pos, dx = isl.pos.x - s.x, dz = isl.pos.z - s.z, away = Math.hypot(dx, dz) > 0.3 ? Math.atan2(dz, dx) : null;
      const L = isletLook({ kit: isl.islet.kit, rad: isl.islet.across / 2, id: isl.feature.id, away });
      const mesh = add(new THREE.Mesh(L.geo, this.mat)); mesh.position.set(isl.pos.x, isl.top, isl.pos.z); mesh.castShadow = mesh.receiveShadow = true;
      const bar = isl.islet.kit === 'sandbar' ? { mesh, y: mesh.position.y, colliders: [], secret: isl.secret.mesh || null, secretY: isl.secret.mesh?.position.y ?? 0 } : null;
      if (bar) this.bars.push(bar);
      if (L.shallows) add(new THREE.Mesh(L.shallows, bar ? this.wetBar : this.wet)).position.copy(mesh.position);
      (this.tris[isl.islet.kit] ||= []).push(L.tris);
      if (W) for (const c of L.colliders) {
        const d = c.cyl ? RAPIER.ColliderDesc.cylinder(c.cyl[0], c.cyl[1]) : c.ball ? RAPIER.ColliderDesc.ball(c.ball) : RAPIER.ColliderDesc.cuboid(...c.box);
        d.setTranslation(isl.pos.x + c.at[0], isl.top + c.at[1], isl.pos.z + c.at[2]).setCollisionGroups(GROUPS.static);
        if (c.yaw) d.setRotation({ w: Math.cos(c.yaw / 2), x: 0, y: Math.sin(c.yaw / 2), z: 0 });
        const col = W.createCollider(d, body); if (bar) bar.colliders.push(col);
      }
      // the secret: its placeholder mesh kept (the room hides it when taken), its shape and program swapped
      const sm = isl.secret.mesh; if (!sm) continue;
      const lift = sm.position.y - isl.top, old = [sm.geometry, sm.material];
      sm.geometry = secretGeometry(isl.secret.kind, L.rng, lift); sm.material = this.mat; sm.rotation.y = L.rng() * PI * 2; sm.castShadow = true;
      old[0].dispose(); if (!old[1].userData?.shared) old[1].dispose();
    }
  }
}
