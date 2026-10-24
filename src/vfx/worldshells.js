// ---------------------------------------------------------------------------------------
// THE WORLD SHELLS' LOOKS (tier V: docs/plans/CASTER-SHELLS.md section 7; the runner part tools/psygun/shellworld.js, the draw
// tools/psygun/worlddraw.js). A World shell is paid by the place, so the first thing seen is the place giving it up: THE DRAW, motes
// pulled off every source it took (the paint's feeling, crude's oil film, a blot's dark, the weather's colour falling out of the sky)
// and swept along arcs into the aim point, where they gather into a bright knot as the round flies; then what it changes, each in the
// house's materials, each going back as it came:
//   the glass bridge   sand fused clear and pale green, tinted by the feeling drawn, edges catching the light; it slumps, clouds and
//                      sinks into a puff of sand over its last seconds
//   the spring         a Rift's hole as a pool of liquid Lachryma (the house liquid, vfx/water.js 'lachryma'), shrinking at its end
//   the thicket        stems and leaves of the drawn feeling's colour grown from the ground round Bloom's point, gilded tips, wilting
//   the lift           sand grains and drops of the drawn paint rising in Upfall's column
//   erosion            a puff of the matter Weather Away wore away
//   the fair           Calm's ring of clear gold on the ground (the weather's look thins itself: vfx/weather.js reads the draw)
// No words (world marks and effects only). Prior art: Okami's brush pulling ink from the world, Breath of the Wild's Magnesis lines
// (what is moved, shown by a stream), From Dust (matter that flows and is worn away), Ghibli's sudden gardens (Totoro's sprouting).
//
//   game.worldLooks = new WorldLooks(game)   .draw(w, row)   .glassBridge(W, L, world) -> mesh   .melt(mesh, m)   .sandAt(at, W, L)
//   .vent(top, dur, world)   .storm(at, dur, world)   .fair(at, r, dur)   .spring(s)   .lift(at, r, dur, world)   .erode(at, r)
//   .thicket(at, r, dur, world)   .update(dt)   .clear()   WORLD_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../progress/weather.js';
import { makeWaterMaterial, waterGeometry } from './water.js';

/** The numbers: the draw's motes (most at once, a source's share, flight real s, arc height m, size m), the knot at the aim point, the
 *  glass, the thicket (stems, height m, grow and wilt real s), the lift (grains a second), crude's colour and the gold. */
export const WORLD_LOOK = {
  motes: { max: 360, per: 24, fly: 0.75, arc: 2.2, size: 0.09 },
  knot: { life: 0.9, size: 0.6 },
  glass: { base: 0x9fd8bc, opacity: 0.62, edge: 0xe8fff4 },
  thicket: { stems: 26, h: 1.4, grow: 1.6, wilt: 6 },
  lift: { rate: 40, speed: 2.4 },
  crude: 0x2a2230, gold: 0xffd36a, sand: 0xd9c49a,
};
const L = WORLD_LOOK, _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
const colourOf = (src) => (src.feeling ? COLOR[src.feeling] : src.kind === 'weather' ? 0xffffff : src.kind === 'bauble' ? 0x8fe8ff : L.crude);

export class WorldLooks {
  constructor(game) {
    this.game = game; this.t = 0;
    this.motes = []; this.lives = []; // (motes in flight; looks with a clock: { t, dur, tick(k, dt), end() })
    const geo = new THREE.IcosahedronGeometry(1, 0), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, L.motes.max); this.mesh.name = 'world-draw-motes';
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(L.motes.max * 3), 3);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.userData.zoneFree = true; this.mesh.raycast = () => {};
    game.scene?.add(this.mesh);
  }

  // ---------------------------------------------------------------- the draw
  /** The place giving it up: motes off each source taken, swept into the aim point, and the knot where they meet. */
  draw(w, row) {
    const g = this.game, at = w.at; if (!at) return;
    for (const { i, amount } of w.take || []) {
      const s = w.src[i]; if (!s) continue;
      const share = Math.min(1, amount / Math.max(1e-3, s.amount)), n = Math.ceil(L.motes.per * (0.4 + 0.6 * share));
      for (let j = 0; j < n; j++) {
        const from = this.fromOf(s, at, j);
        this.motes.push({ from, to: at.clone().setY(at.y + 0.6), t: -j * 0.02, col: new THREE.Color(colourOf(s)), lift: L.motes.arc * (0.6 + Math.random() * 0.8) });
      }
    }
    if (w.src?.some((s) => s.kind === 'liquid')) for (let j = 0; j < L.motes.per; j++) { const a = (j / L.motes.per) * Math.PI * 2; this.motes.push({ from: at.clone().add(_p.set(Math.cos(a) * 2.5, -0.2, Math.sin(a) * 2.5)), to: at.clone().setY(at.y + 0.6), t: -j * 0.015, col: new THREE.Color(0x6fd0e8), lift: 1.2 }); }
    const col = w.feeling ? COLOR[w.feeling] : 0xbfe8ff;
    g.pulse?.emit?.(at, 1.2 + 1.4 * (w.k || 1), col, { life: L.knot.life });
    if (this.motes.length > L.motes.max) this.motes.splice(0, this.motes.length - L.motes.max);
  }
  /** Where a mote leaves a source: a blot's middle, a bauble, a point on the ground in reach for paint and crude, high in the sky for the weather. */
  fromOf(s, at, j) {
    const a = j * 2.399, r = 3 + (j % 7) * 1.2;
    if (s.kind === 'blot') return _p.set(s.ref.x, s.ref.y + 0.05, s.ref.z).clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(Math.random() * 1.6));
    if (s.kind === 'bauble') { const b = s.ref[j % s.ref.length]; return (b?.root?.position ?? at).clone(); }
    if (s.kind === 'weather') return at.clone().add(new THREE.Vector3(Math.cos(a) * r, 9 + (j % 5), Math.sin(a) * r));
    return at.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.05, Math.sin(a) * r));
  }

  // ---------------------------------------------------------------- the alterations
  /** The glass bridge's body: fused sand, clear and pale green, tinted toward the feeling drawn. */
  glassBridge(W, Lg, world) {
    const col = new THREE.Color(L.glass.base); if (world?.feeling) col.lerp(_c.set(COLOR[world.feeling]), 0.35);
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, 0.14, Lg, 1, 1, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.04, metalness: 0.15, transparent: true, opacity: L.glass.opacity, emissive: col, emissiveIntensity: 0.12 }));
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: L.glass.edge, transparent: true, opacity: 0.7 }));
    m.add(edge); m.name = 'world-glass-bridge';
    return m;
  }
  /** The glass melting back to sand: m 0..1 over its last seconds (clouding, sagging, sinking). */
  melt(mesh, m) {
    const mat = mesh.material; if (!mat) return;
    mat.opacity = L.glass.opacity * (1 - 0.85 * m); mat.roughness = 0.04 + 0.8 * m; mat.color.lerp(_c.set(L.sand), 0.08 * m);
    mesh.scale.y = 1 - 0.6 * m; mesh.children[0] && (mesh.children[0].material.opacity = 0.7 * (1 - m));
  }
  /** A puff of sand where the glass was. */
  sandAt(at, W, Lg) { this.game.fx?.shockwave?.(at, Math.max(W, Lg) * 0.4); this.game.pulse?.emit?.(at, Math.max(W, Lg) * 0.5, L.sand, { life: 0.8 }); }

  /** The cone's vent: an ember glow over its mouth while it erupts. */
  vent(top, dur, world) {
    const lamp = new THREE.PointLight(0xff7a2a, 0, 9, 2); lamp.position.copy(top); this.game.scene.add(lamp);
    this.live(dur, (k) => { lamp.intensity = 6 * Math.sin(Math.PI * Math.min(1, k * 1.2)) * (0.8 + 0.2 * Math.sin(this.t * 13)); }, () => lamp.removeFromParent());
  }
  /** Thunderhead's draw: the weather falling into its cloud (the draw's own motes carry it; a cool flash at the point). */
  storm(at, dur, world) { if (at) this.game.pulse?.emit?.(at.clone().setY(at.y + 7), 3, world?.feeling ? COLOR[world.feeling] : 0xcfe4ff, { life: 1.2 }); }
  /** Calm's fair: a ring of clear gold laid on the ground, the weather's look gone from within it (vfx/weather.js). */
  fair(at, r) { this.game.pulse?.emit?.(at, r, L.gold, { life: 2.4 }); }

  /** A Rift's spring: a pool of liquid Lachryma where the hole was, for its game hour, drying from the edge at the end. */
  spring(s) {
    const g = this.game, R = s.r, v = { x0: s.pos.x - R, x1: s.pos.x + R, z0: s.pos.z - R, z1: s.pos.z + R, surface: s.pos.y + 0.04, bottom: s.pos.y - 0.6 };
    const mat = makeWaterMaterial(g.water?.sky ?? null, 'lachryma'), mesh = new THREE.Mesh(waterGeometry(v), mat);
    mesh.position.set((v.x0 + v.x1) / 2, v.surface, (v.z0 + v.z1) / 2); mesh.name = 'world-spring'; mesh.userData.zoneFree = true; mesh.renderOrder = 2;
    g.scene.add(mesh);
    this.live(s.dur, (k, dt) => { mat.uniforms.uTime.value += dt; const left = 1 - k; mesh.scale.setScalar(Math.min(1, left * 6 + 0.05)); }, () => { mesh.removeFromParent(); mesh.geometry.dispose(); mat.dispose(); });
  }

  /** Upfall's lift: sand grains and drops of the drawn paint rising in the column for its time. */
  lift(at, r, dur, world) {
    const col = world?.feeling ? COLOR[world.feeling] : L.sand; let acc = 0;
    this.live(dur, (k, dt) => {
      acc += L.lift.rate * dt;
      for (; acc >= 1; acc--) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r, from = at.clone().add(_p.set(Math.cos(a) * d, 0.1, Math.sin(a) * d));
        this.motes.push({ from, to: from.clone().setY(from.y + 6 + Math.random() * 4), t: 0, col: new THREE.Color(Math.random() < 0.6 ? L.sand : col), lift: 0, fly: 2.4 });
      }
    });
  }

  /** Weather Away's wearing: a puff of the worn matter and a ring of dust where the ball was taken. */
  erode(at, r) { this.game.fx?.shockwave?.(at, r); this.game.pulse?.emit?.(at, r * 1.2, L.sand, { life: 1.1 }); }

  /** Bloom's thicket: stems in the drawn feeling's colour, gold at the tips, grown up round the point, wilting at its end. */
  thicket(at, r, dur, world) {
    const g = this.game, T = L.thicket, col = new THREE.Color(world?.feeling ? COLOR[world.feeling] : 0x7fbf6a).lerp(_c.set(0x5f9a4a), 0.4);
    const stem = new THREE.ConeGeometry(0.06, 1, 5).translate(0, 0.5, 0), leaf = new THREE.SphereGeometry(0.18, 6, 4).scale(1, 0.45, 0.6);
    const sm = new THREE.InstancedMesh(stem, new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }), T.stems);
    const lm = new THREE.InstancedMesh(leaf, new THREE.MeshStandardMaterial({ color: L.gold, emissive: L.gold, emissiveIntensity: 0.35, roughness: 0.5 }), T.stems);
    const grp = new THREE.Group(); grp.add(sm, lm); grp.name = 'world-thicket'; grp.userData.zoneFree = true; g.scene.add(grp);
    const seeds = Array.from({ length: T.stems }, (_, i) => { const a = i * 2.399, d = r * Math.sqrt((i + 0.5) / T.stems); return { x: at.x + Math.cos(a) * d, y: at.y, z: at.z + Math.sin(a) * d, h: T.h * (0.5 + Math.random() * 0.8), lean: (Math.random() - 0.5) * 0.5, yaw: Math.random() * 6.28, delay: Math.random() * 0.6 }; });
    let age = 0;
    this.live(dur, (k, dt) => {
      age += dt; const wilt = Math.min(1, Math.max(0, (dur - age) / T.wilt));
      seeds.forEach((s, i) => {
        const grow = Math.min(1, Math.max(0, (age - s.delay) / T.grow)), h = s.h * (1 - Math.pow(1 - grow, 3)) * wilt + 1e-3;
        _q.setFromEuler(new THREE.Euler(s.lean * (2 - wilt), s.yaw, 0)); _m.compose(_p.set(s.x, s.y, s.z), _q, _s.set(1, h, 1)); sm.setMatrixAt(i, _m);
        _p.set(0, h, 0).applyQuaternion(_q).add(_s.set(s.x, s.y, s.z)); _m.compose(_p, _q, _s.setScalar(Math.max(1e-3, grow * wilt))); lm.setMatrixAt(i, _m);
      });
      sm.instanceMatrix.needsUpdate = lm.instanceMatrix.needsUpdate = true;
    }, () => { grp.removeFromParent(); stem.dispose(); leaf.dispose(); sm.material.dispose(); lm.material.dispose(); });
  }

  // ---------------------------------------------------------------- the clock
  live(dur, tick, end) { this.lives.push({ t: 0, dur, tick, end }); }

  update(dt) {
    this.t += dt;
    for (let i = this.lives.length - 1; i >= 0; i--) {
      const e = this.lives[i]; e.t += dt; e.tick?.(Math.min(1, e.t / e.dur), dt);
      if (e.t >= e.dur) { e.end?.(); this.lives.splice(i, 1); }
    }
    let n = 0; const M = this.mesh;
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i]; m.t += dt; const fly = m.fly ?? L.motes.fly;
      if (m.t >= fly) { this.motes.splice(i, 1); continue; }
      if (m.t < 0 || n >= L.motes.max) continue;
      const u = m.t / fly, e = u * u * (3 - 2 * u);
      _p.lerpVectors(m.from, m.to, e); _p.y += Math.sin(Math.PI * u) * m.lift;
      const sz = L.motes.size * (m.fly ? 1 - u * 0.5 : 0.6 + 0.8 * u);
      _m.compose(_p, _q.identity(), _s.setScalar(sz)); M.setMatrixAt(n, _m); M.setColorAt(n, m.col); n++;
    }
    M.count = n; if (n) { M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true; }
  }

  clear() { for (const e of this.lives) e.end?.(); this.lives.length = 0; this.motes.length = 0; this.mesh.count = 0; }
}
