// ---------------------------------------------------------------------------------------
// THE RINGS ON THE WATER: the toll's and the sonar's (the Crucibelle and the Dreamvane at sea: Dovina's SEA_MOUNTS, Petra's
// world/opensea/seamounts.js), a part of the mounts' look (vfx/opensea/seamounts.js).
//   THE TOLL      a gold shock ring and a bronze echo a beat behind it running out from the hull to the toll's reach (from the hull's
//                 footprint), each a flat band on the water and a low wall of light rising off it, rippling the sea as they pass; where
//                 the ring reaches a beast whose windup it broke (wound up the frame before, not now), its tell shatters at its head:
//                 gold shards, a flash ring facing the eye, chips.
//   SONAR         thin pale rings pinging out to the sonar's reach; where a beast under the water will come up (its breach's or ram's
//                 ring when it has one, else where it is), a pale mark appears as the ping reaches it and breathes on the surface,
//                 its rings closing in and motes rising, fading over a few real seconds; a beast wound up to break the water (Petra's
//                 `surface` and `eta`) is marked where it will, held until then, drawing in and breathing faster as it nears. A world
//                 mark: no words.
// Prior art: Subnautica's sonar (a ring out from the hull, what is under shown where it is), Metroid Prime's echo visor, Zelda's
// Ocarina shockwave over water; the toll's reach on foot (vfx/tollreach.js) for the bell's ring.
//
//   new SeaRings(M)   .toll(e, winding)   .sonar(e)   .update(dt)   .parked() -> [mesh]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SEA_MOUNTS } from '../../../progress/rail/mounts.js';

/** toll: its colours, run (real s), the wall's height (m); sonar: its colour, run, how many pings and their stagger (real s);
 *  mark: its life (real s), how long it outlives a timed one's breaking (`eta`), radius x the beast's head; cap: rings and marks at once. */
export const SEA_RINGS_LOOK = {
  toll: { gold: 0xffd36a, bronze: 0xc8843a, run: 0.8, wall: 4, echo: 0.14 },
  sonar: { color: 0x9fe8e0, run: 2.4, pings: 3, stagger: 0.22, alpha: 0.42 },
  mark: { life: 3.6, after: 1.0, r: 2.2, min: 7, color: 0xd8fff6 }, cap: { rings: 12, marks: 6 },
};
const RL = SEA_RINGS_LOOK;
const _v = new THREE.Vector3();

/** A vertical fade (1 at the foot, 0 at the top): the wall's alpha map. */
function fadeTexture() {
  const N = 32, d = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) { const v = Math.round(255 * Math.pow(1 - i / (N - 1), 2)); d.set([v, v, v, 255], i * 4); }
  const t = new THREE.DataTexture(d, 1, N); t.needsUpdate = true; return t;
}
const MARK_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uK, uTime; varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0; if (r > 1.0) discard;
  float rings = smoothstep(0.75, 1.0, sin((r * 3.0 + uTime * 1.6) * 6.2832) * 0.5 + 0.5) * (1.0 - r);
  float core = exp(-r * r * 5.0) * 0.7, edge = smoothstep(0.86, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r));
  gl_FragColor = vec4(uColor * (core + rings * 0.8 + edge), (core + rings * 0.7 + edge * 0.8) * uK);
  #include <colorspace_fragment>
}`;

export class SeaRings {
  constructor(M) {
    this.M = M; const sc = M.game.scene; this.rings = []; this.marks = []; this.bursts = [];
    const thick = new THREE.RingGeometry(0.93, 1, 128); thick.rotateX(-Math.PI / 2);
    const thin = new THREE.RingGeometry(0.988, 1, 160); thin.rotateX(-Math.PI / 2);
    const face = new THREE.RingGeometry(0.8, 1, 48);
    const wall = new THREE.CylinderGeometry(1, 1, 1, 128, 1, true); wall.translate(0, 0.5, 0);
    this.geo = { thick, thin, face, wall }; const fade = fadeTexture(), white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
    this.pool = Array.from({ length: RL.cap.rings }, () => {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, alphaMap: white, fog: false }); // (a white alpha map: the wall's own program, one fewer (Petra's census, 2026-10-27))
      const wm = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, alphaMap: fade, fog: false });
      const m = new THREE.Mesh(thick, mat), w = new THREE.Mesh(wall, wm);
      for (const x of [m, w]) { x.visible = false; x.frustumCulled = false; x.renderOrder = 4; x.userData.zone = 'opensea'; sc?.add(x); }
      return { m, w, busy: false };
    });
    this.markPool = Array.from({ length: RL.cap.marks }, () => {
      const mat = new THREE.ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: MARK_FRAG,
        uniforms: { uColor: { value: new THREE.Color(RL.mark.color) }, uK: { value: 0 }, uTime: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const g = new THREE.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, mat); m.visible = false; m.frustumCulled = false; m.renderOrder = 4; m.userData.zone = 'opensea'; sc?.add(m); return { m, mat, busy: false };
    });
  }
  parked() { return [this.pool[0].m, this.pool[0].w, this.markPool[0].m]; }

  /** A ring from `at` out to `R` (m) over `run` real s, `delay` s from now: kind 'flat' (a band and its wall) or 'face' (a flash facing the eye). */
  ring(o) {
    const P = this.pool.find((p) => !p.busy); if (!P) return null;
    P.busy = true; P.m.geometry = o.face ? this.geo.face : o.thin ? this.geo.thin : this.geo.thick; P.m.material.color.setHex(o.color); P.w.material.color.setHex(o.color);
    const r = { P, ...o, t: -(o.delay || 0), r0: o.r0 ?? 0, at: o.at.clone() }; this.rings.push(r); return r;
  }

  /** The bell's ring out over the water, and each windup it broke shattered at its beast's head as the ring reaches it. */
  toll(e, winding) {
    const M = this.M, H = M.helm; if (!H) return;
    const reach = (SEA_MOUNTS.crucibelle?.reach ?? 40) + M.L / 2, at = _v.copy(H.pos); at.y = M.surf(at.x, at.z) + 0.5;
    const T = RL.toll, base = { at, r0: M.L * 0.35, R: reach, run: T.run, wall: T.wall, ripple: true };
    this.ring({ ...base, color: T.gold, alpha: 1 }); this.ring({ ...base, color: T.bronze, alpha: 0.6, delay: T.echo, wall: T.wall * 0.5 });
    const kinds = Array.isArray(e.broke) ? e.broke : null; if (!(kinds ? kinds.length : e.broke > 0)) return; // (Petra's v315: the kinds it broke; a count before)
    for (const [c, head] of winding) {
      if (!c.alive || c.attack) continue;
      if (kinds && !kinds.includes(c.id) && !kinds.includes(c.kind)) continue;
      const d = H.hullDist?.(head) ?? head.distanceTo(H.pos); if (d > (SEA_MOUNTS.crucibelle?.reach ?? 40) + 2) continue;
      this.bursts.push({ c, head: head.clone(), t: -T.run * Math.min(1, (d + M.L / 2) / reach) });
    }
  }
  /** A windup's tell shattered at the head. */
  shatter(b) {
    const M = this.M, fx = M.fx, S = M.serpents, p = b.c.alive && S ? S.at(b.c, 0) : b.head, r = (S?.rOf?.(b.c, 0) ?? 4) * 1.6;
    this.ring({ at: p, face: true, r0: r * 0.3, R: r * 1.8, run: 0.35, color: 0xfff2c8, alpha: 1 });
    fx?.impact?.(p, _v.set(0, 1, 0), { color: RL.toll.gold, sparks: 10, dust: 4 });
    for (let i = 0; i < 22; i++) fx?.add?.emit({ pos: p.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 16, Math.random() * 10, (Math.random() - 0.5) * 16), life: 0.6 + Math.random() * 0.3, size: 0.35, sizeEnd: 0.05, color: RL.toll.gold, colorEnd: 0xff8a2a, alpha: 1, drag: 1.2, gravity: 9, floor: -1e9 });
  }

  /** sea.sonar { beasts }: the pings out from the hull, and a mark where each beast under will come up. */
  sonar(e) {
    const M = this.M, H = M.helm; if (!H) return;
    const S = RL.sonar, reach = (SEA_MOUNTS.dreamvane?.reach ?? 300) + M.L / 2, at = _v.copy(H.pos); at.y = M.surf(at.x, at.z) + 0.4;
    for (let i = 0; i < S.pings; i++) this.ring({ at, thin: true, r0: M.L * 0.5, R: reach, run: S.run, wall: 1.5, color: S.color, alpha: S.alpha * (1 - i * 0.25), delay: i * S.stagger });
    for (const b of e?.beasts || []) {
      const P = this.markPool.find((p) => !p.busy); if (!P || !b?.at) break;
      let c = null, bd = 6; for (const x of M.serpents?.list || []) { const d = Math.hypot(x.pos.x - b.at.x, x.pos.z - b.at.z); if (x.alive && d < bd) { bd = d; c = x; } }
      const p = b.surface ?? b.at, d = H.hullDist?.(p) ?? Math.hypot(p.x - H.pos.x, p.z - H.pos.z), t0 = -S.run * Math.min(1, (d + M.L / 2) / reach); // (where it breaks the water, Petra's `surface`, when it has wound up)
      const eta = b.eta ?? null, life = eta != null ? Math.max(RL.mark.life, eta + t0 + RL.mark.after) : RL.mark.life; // (held until it breaks, then a beat)
      P.busy = true; this.marks.push({ P, c, at: new THREE.Vector3(p.x, p.y, p.z), t: t0, eta: eta != null ? eta + t0 : null, life, r: Math.max(RL.mark.min, (M.serpents?.rOf?.(c, 0) ?? 4) * RL.mark.r), dropT: 0 });
    }
  }

  update(dt) {
    const M = this.M, W = M.game.water, cam = M.game.camera;
    for (const r of this.rings) {
      const P = r.P; r.t += dt;
      if (!M.live || r.t >= r.run) { P.busy = false; P.m.visible = P.w.visible = false; r.done = true; continue; }
      if (r.t < 0) { P.m.visible = P.w.visible = false; continue; }
      const u = r.t / r.run, k = 1 - (1 - u) * (1 - u) * (1 - u), rad = r.r0 + (r.R - r.r0) * k, a = r.alpha * (1 - u) * (1 - u * 0.4);
      P.m.visible = true; P.m.material.opacity = a; P.m.position.copy(r.at); P.m.scale.setScalar(rad);
      if (r.face) { P.m.quaternion.copy(cam.quaternion); P.w.visible = false; continue; }
      P.m.quaternion.identity();
      P.w.visible = !!r.wall; if (r.wall) { P.w.position.copy(r.at).y -= 0.3; P.w.scale.set(rad, r.wall * (1 - u * 0.7), rad); P.w.material.opacity = a * 0.55; }
      if (r.ripple && W?.disturb && Math.floor(u * 4) !== r.rip) { r.rip = Math.floor(u * 4); for (let i = 0; i < 10; i++) { const t = (i / 10 + r.rip * 0.05) * Math.PI * 2, x = r.at.x + Math.cos(t) * rad, z = r.at.z + Math.sin(t) * rad; W.disturb(x, z, 0.45, 'stroke', M.surf(x, z)); } }
    }
    this.rings = this.rings.filter((r) => !r.done);
    for (const b of this.bursts) { if ((b.t += dt) >= 0 && !b.done) { b.done = true; if (M.live) this.shatter(b); } }
    this.bursts = this.bursts.filter((b) => !b.done);
    const ML = RL.mark;
    for (const k of this.marks) {
      const P = k.P; k.t += dt;
      if (!M.live || k.t >= k.life) { P.busy = false; P.m.visible = false; k.done = true; continue; }
      if (k.t < 0) { P.m.visible = false; continue; }
      const A = k.c?.alive ? k.c.attack : null; if (A?.at && (A.move === 'ram' || A.move === 'rise' || A.move === 'breach')) k.at.copy(A.at); // (where it breaks the surface, when it has said)
      else if (k.c?.alive && (k.c.under ?? 0) > 0.5) k.at.set(k.c.pos.x, k.at.y, k.c.pos.z);
      const fin = Math.min(1, k.t / 0.3) * Math.min(1, (k.life - k.t) / 1.2), left = k.eta != null ? Math.max(0, k.eta - k.t) : null;
      const beat = left != null ? 4 + 14 / (1 + left) : 4; // (a timed mark's breath quickening as the breaking nears)
      P.m.visible = true; P.m.position.set(k.at.x, M.surf(k.at.x, k.at.z) + 0.3, k.at.z); P.m.scale.setScalar(k.r * (left != null ? 0.75 + 0.25 * Math.min(1, left / 2) : 1) * (0.9 + 0.1 * Math.sin(k.t * beat)));
      P.mat.uniforms.uK.value = fin * 0.85; P.mat.uniforms.uTime.value = k.t;
      if ((k.dropT -= dt) <= 0) {
        k.dropT = 0.45; W?.disturb?.(k.at.x, k.at.z, 0.3, 'drop', M.surf(k.at.x, k.at.z));
        for (let i = 0; i < 3; i++) M.fx?.add?.emit({ pos: new THREE.Vector3(k.at.x + (Math.random() - 0.5) * k.r, M.surf(k.at.x, k.at.z) + 0.3, k.at.z + (Math.random() - 0.5) * k.r), vel: new THREE.Vector3(0, 1.5 + Math.random() * 1.5, 0), life: 1.2, size: 0.25, sizeEnd: 0.05, color: ML.color, alpha: 0.7 * fin, drag: 0.5, gravity: 0, floor: -1e9 });
      }
    }
    this.marks = this.marks.filter((k) => !k.done);
  }
}
