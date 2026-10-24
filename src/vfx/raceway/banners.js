// ---------------------------------------------------------------------------------------
// THE RACEWAY'S BANNERS (plain name): feather banners along each track's start straight and beside its gates, tall flags laced to a
// pole along one edge, their free edge flying downwind (the course wind, raceway.wind: the track's own) and rippling in waves that run
// out along the cloth, harder in a gust and in Desire's wanting wind. Each in one of the seven feelings' colours (progress/weather.js COLOR: the seat colours are Raku's tables' alone),
// in turn along a row. A look only: no collider, no rule.
// EIGHT DRAWS, a colour each: the cloth of every banner of one colour in one mesh, re-laid on the CPU (a travelling wave, its normals
// recomputed into the same buffers) a few dozen times a real second while the camera is within SEE metres of a row, and the poles in
// one more (shared with the lanterns: lanterns.js). Each an InstancedMesh of one instance in a plain flat standard (the clay chips'
// program, vfx/particles.js): no program added. Both faces are real triangles (no double-sided program).
//
// Prior art: the feather flags of every motorsport paddock and beach festival (laced to a curved pole, the fly flapping), the cloth of
// the sixth generation done on the CPU (Wind Waker's flags and sails: a grid moved by a wave, no simulation), Mario Kart's banners.
//
//   const B = new RacewayBanners(game, parent, poles)   B.build(raceway)   B.update(dt, raceway)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ASPECTS, COLOR } from '../../progress/weather.js';
import { sideOf } from '../../world/raceway/kit.js';

/** The numbers: a start straight's banners from `start[0]` to `start[1]` m along the line, `every` apart, `out` m past the track's
 *  edge; a gate's pair `gate` m past its pillars; the cloth's size (m) and grid; the pole's height; the wave (rad a metre, rad a real
 *  second, its amplitude at the fly, m) and how the wind and gust grow it; how near the camera must be (m) and the re-lay's rate (Hz). */
export const BANNER = {
  start: [-120, 150], every: 16, out: 4.2, gate: 3.5, w: 1.0, h: 3.0, nu: 5, nv: 6, pole: 4.2,
  wave: { k: 3.4, w: 6.5, amp: 0.16, sag: 0.18 }, wind: 8, see: 200, hz: 30,
};

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const at = (o0, u, v) => (o0 + u * (BANNER.nv + 1) + v) * 3; // (a grid point's place in a banner's buffer)

export class RacewayBanners {
  constructor(game, parent, poles) {
    this.game = game; this.parent = parent; this.poles = poles; this.t = 0; this.acc = 0; this.built = false;
    this.mats = ASPECTS.map((n) => new THREE.MeshStandardMaterial({ name: `raceway-banner-${n}`, color: new THREE.Color(COLOR[n]), roughness: 0.75, metalness: 0, flatShading: true })); // (the seven feelings' colours: the seat colours are Raku's tables' alone, the glossary)
  }

  build(R) {
    if (this.built || !R?.tracks?.length) return; this.built = true;
    const list = [];
    const at = (T, s, side) => { const ss = ((s % T.length) + T.length) % T.length, F = T.frame(ss); return sideOf(R, T, ss, side * (F.w + BANNER.out)); };
    for (const T of R.tracks) {
      let k = 0;
      for (let s = T.line + BANNER.start[0]; s <= T.line + BANNER.start[1]; s += BANNER.every) for (const sd of [-1, 1]) if (Math.abs(s - T.line) > 6) list.push({ p: at(T, s, sd), c: k++ % 8 });
      for (const gs of T.gates) for (const sd of [-1, 1]) list.push({ p: at(T, gs + BANNER.gate * 2, sd), c: k++ % 8 });
    }
    const nu = BANNER.nu, nv = BANNER.nv, per = (nu + 1) * (nv + 1);
    this.sets = this.mats.map((mat, c) => {
      const mine = list.filter((b) => b.c === c), n = mine.length, pos = new Float32Array(n * per * 2 * 3), idx = [];
      for (let b = 0; b < n; b++) for (const face of [0, 1]) { const o = (b * 2 + face) * per;
        for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) { const a = o + u * (nv + 1) + v, bb = a + nv + 1; if (face) idx.push(a, a + 1, bb, a + 1, bb + 1, bb); else idx.push(a, bb, a + 1, a + 1, bb, bb + 1); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length), 3)); geo.setIndex(idx);
      const mesh = new THREE.InstancedMesh(geo, mat, 1); mesh.setMatrixAt(0, new THREE.Matrix4()); mesh.name = 'raceway-banners'; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
      this.parent.add(mesh);
      for (const B of mine) { B.ph = (B.p.x * 0.37 + B.p.z * 0.23) % 6.28; this.poles.add(B.p.x, B.p.y, B.p.z, BANNER.pole, 0.06); }
      return { mesh, list: mine, cx: mine.reduce((a, b) => a + b.p.x, 0) / Math.max(1, n), cz: mine.reduce((a, b) => a + b.p.z, 0) / Math.max(1, n) };
    });
    this.lay(R, true);
  }

  update(dt, R) {
    if (!this.built) this.build(R); if (!this.built) return;
    this.t += dt;
    if ((this.acc += dt) < 1 / BANNER.hz) return; this.acc = 0;
    this.lay(R, false);
  }

  /** The cloth of every banner in sight laid on its wave: laced along the pole (u 0), its fly downwind (u 1), sagging a little. */
  lay(R, all) {
    const cam = this.game.camera.position, W = R.wind, wx = W?.dir?.x ?? 1, wz = W?.dir?.y ?? 0, gust = THREE.MathUtils.clamp((W?.speed ?? 8) / BANNER.wind * (W?.gust ?? 1), 0.4, 2.2);
    const nx = -wz, nz = wx, nu = BANNER.nu, nv = BANNER.nv, per = (nu + 1) * (nv + 1), Wv = BANNER.wave, t = this.t;
    for (const S of this.sets) {
      const P = S.mesh.geometry.attributes.position.array; let any = false;
      for (let b = 0; b < S.list.length; b++) { const B = S.list[b];
        if (!all && Math.hypot(B.p.x - cam.x, B.p.z - cam.z) > BANNER.see) continue; any = true;
        const top = B.p.y + BANNER.pole - 0.15;
        for (let u = 0; u <= nu; u++) { const fu = u / nu, x0 = fu * BANNER.w;
          for (let v = 0; v <= nv; v++) { const fv = v / nv, y = top - fv * BANNER.h * (0.92 + 0.08 * (1 - fu)); // (the feather's curve: its fly a little shorter at the foot)
            const wave = Math.sin(x0 * Wv.k - t * Wv.w * (0.7 + 0.3 * gust) + B.ph + fv * 0.8) * Wv.amp * gust * fu;
            const sag = Wv.sag * fu * fu * (1.4 - gust * 0.5);
            const px = B.p.x + wx * x0 * (1 - 0.06 * Math.abs(wave)) + nx * wave, pz = B.p.z + wz * x0 * (1 - 0.06 * Math.abs(wave)) + nz * wave, py = y - sag;
            for (let face = 0; face < 2; face++) { const o = ((b * 2 + face) * per + u * (nv + 1) + v) * 3; P[o] = px; P[o + 1] = py; P[o + 2] = pz; } } }
        this.normals(S.mesh.geometry.attributes.normal.array, P, (b * 2) * per);
      }
      if (any) { const G = S.mesh.geometry; G.attributes.position.needsUpdate = true; G.attributes.normal.needsUpdate = true; }
    }
  }

  /** A banner's normals from its grid (the cross of its two directions at each point), the back face's turned round: written in place. */
  normals(N, P, o0) {
    const nu = BANNER.nu, nv = BANNER.nv, per = (nu + 1) * (nv + 1);
    for (let u = 0; u <= nu; u++) for (let v = 0; v <= nv; v++) {
      const a = at(o0, Math.max(0, u - 1), v), b = at(o0, Math.min(nu, u + 1), v), c = at(o0, u, Math.max(0, v - 1)), d = at(o0, u, Math.min(nv, v + 1));
      _a.set(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]); _b.set(P[d] - P[c], P[d + 1] - P[c + 1], P[d + 2] - P[c + 2]);
      _a.cross(_b).normalize();
      const o = at(o0, u, v), q = o + per * 3; N[o] = _a.x; N[o + 1] = _a.y; N[o + 2] = _a.z; N[q] = -_a.x; N[q + 1] = -_a.y; N[q + 2] = -_a.z;
    }
  }
}
