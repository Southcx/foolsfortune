// ---------------------------------------------------------------------------------------
// THE SIPHONS' LOOK (Dovina's handoff of 2026-10-15, item 2; world/raceway/siphons.js, SIPHONS): her placeholder arch (two dark violet
// pillars and a lintel) dressed so it reads from far off as "this takes your Lachryma". A ruin arch of the Raceway's own kit (the
// Dunes' pillars: a plinth, a band, a capital) gone dark and tarnished: soot-black clay, its gold bands oxidised to bronze-green. On
// the lintel's middle a round keystone stands up with a MOUTH in each face: a tarnished ring, fangs of old glaze round it pointing in,
// and inside it a vortex, Lachryma's light wound into the dark, turning. Lachryma is drawn up off the sand under the arch in streams
// into the mouth, motes from all round it pulled in, a dark breath with them. When it drinks (skiff.siphon { took, left }) a pull of
// Lachryma off the board up into the mouth, a ring on the sand collapsing in under it, and the mouth gulps (a flash, its vortex spun up).
// No words, no numbers. Her pillars are hidden (`siphons.groups`, one a track; ours shown only for `siphons.on`, the track a licence test raises it on); the drink itself is hers.
//
// No program added: the stone is the kit's vertex-coloured flat standard (world/raceway/kit.js, the park's `vc`: its parameters), the
// vortex a mapped basic (the Raceway's glows' kind, its own canvas). Draw calls: 2 for every arch on every track (the stone, merged; the
// vortices, merged) and the stone's one in the sun's shadow pass, in place of her 9; the streams on the shared particle pools.
//
// Prior art: F-Zero's energy-draining zones and Wipeout's (a hazard read by its colour from far off), Zelda's Like Like and Kirby's
// inhale (a mouth that takes what you carry, the pull drawn as streaks toward it), Dementors' draining in Prisoner of Azkaban (the
// light pulled out of a body up into the dark), the oxidised bronze of temple gates (the tarnish); the house's own kit pillars, the
// antlion's maw (vfx/racewaypark.js) and the vein lanes' drink (vfx/racewayprops.js), which this is the reverse of.
//
//   game.racewaySiphons = new RacewaySiphons(game)   (main.js)   .update(dt)   (dresses the siphons once the Raceway has built them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SIPHONS, SIPHON } from '../world/raceway/siphons.js';
import { RW } from '../world/raceway/track.js';

/** The numbers: the stone's colours (the tarnish), the pillars' size (m), the keystone's radius, depth and lift above the lintel, the
 *  mouth's radius, its fangs, the vortex's turn (rad a real second, idle and gulping) and brightness, how far off the streams run (m). */
export const SIPHON_LOOK = {
  stone: { clay: 0x3a2428, dark: 0x22161a, band: 0x5a5a3c, cap: 0x2a1a24, fang: 0x9a8c7a, ring: 0x6e5a34 },
  pillar: 1.7, lintel: [1.8, 2.2], key: { r: 4.4, depth: 2.6, lift: 2.8 }, mouth: 2.7, fangs: 12,
  spin: [0.9, 6], glow: 1, gulp: 2.2, near: 320,
};
const C = SIPHON_LOOK, UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();

/** Position, normal and one colour, non-indexed (the kit's attributes), placed by `M`. */
const painted = (geo, color, M) => {
  const g = geo.index ? geo.toNonIndexed() : geo; geo !== g && geo.dispose();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  const n = g.attributes.position.count, a = new Float32Array(n * 3); _c.set(color); for (let i = 0; i < n; i++) _c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (M) g.applyMatrix4(M); return g;
};

let VORTEX = null;
/** The vortex: dark at its heart, Lachryma's light wound into it in four arms, a rim of violet; drawn once. */
function vortexTexture() {
  if (VORTEX) return VORTEX;
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N * 2 - 1, v = (y + 0.5) / N * 2 - 1, r = Math.hypot(u, v), a = Math.atan2(v, u);
    const arm = Math.pow(0.5 + 0.5 * Math.cos(a * 4 + Math.log(r + 0.04) * 7), 5) * Math.min(1, r * 1.6) * Math.max(0, 1 - r) * 2.2; // (log spiral arms, fading to the dark heart)
    const rim = Math.exp(-((r - 0.92) ** 2) * 220), base = Math.pow(Math.min(1, r), 2.2);
    const o = (y * N + x) * 4;
    img.data[o] = Math.min(255, 4 + base * 50 + arm * 70 + rim * 120);
    img.data[o + 1] = Math.min(255, 2 + base * 16 + arm * 190 + rim * 60);
    img.data[o + 2] = Math.min(255, 8 + base * 90 + arm * 255 + rim * 200);
    img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  VORTEX = new THREE.CanvasTexture(c); VORTEX.colorSpace = THREE.SRGBColorSpace; VORTEX.center.set(0.5, 0.5);
  return VORTEX;
}

/** One arch's stone and its two mouths' discs, in the arch's frame (x across, y up from the line's ground, z along the race). */
function archParts(w, H, dl, dr) {
  const S = C.stone, P = C.pillar, stone = [], disc = [], at = (x, y, z, ry = 0, rx = 0) => _m.compose(_v.set(x, y, z), _q.setFromEuler(new THREE.Euler(rx, ry, 0)), _s.set(1, 1, 1)).clone();
  for (const [side, dy] of [[-1, dl], [1, dr]]) {
    const x = side * w, foot = dy - 1.5, h = H - foot;
    stone.push(painted(new THREE.BoxGeometry(P, h, P), S.clay, at(x, foot + h / 2, 0, side * 0.04)));
    stone.push(painted(new THREE.BoxGeometry(P * 1.45, 1.1, P * 1.45), S.dark, at(x, dy + 0.1, 0, 0.2))); // (the plinth, a little turned)
    stone.push(painted(new THREE.BoxGeometry(P * 1.04, 0.3, P * 1.04), S.band, at(x, dy + h * 0.32 + 1, 0)));
    stone.push(painted(new THREE.BoxGeometry(P * 1.3, 0.6, P * 1.3), S.cap, at(x, H - 0.3, 0)));
    for (let k = 0; k < 3; k++) stone.push(painted(new THREE.DodecahedronGeometry(0.35 + 0.2 * k, 0), S.dark, at(x + side * (1.3 + 0.5 * k), dy + 0.1, (k - 1) * 1.1, k))); // (rubble at its foot)
  }
  const [lh, ld] = C.lintel, K = C.key, ky = H + lh + K.lift;
  stone.push(painted(new THREE.BoxGeometry(2 * w + P * 1.6, lh, ld), S.clay, at(0, H + lh / 2, 0)));
  stone.push(painted(new THREE.BoxGeometry(2 * w + P * 1.9, 0.35, ld * 1.1), S.band, at(0, H + lh, 0)));
  stone.push(painted(new THREE.CylinderGeometry(K.r, K.r, K.depth, 20, 1, true), S.cap, at(0, ky, 0, 0, Math.PI / 2))); // (the keystone's round, open: the mouths are its faces)
  for (const f of [-1, 1]) {
    const z = f * K.depth / 2, ry = f > 0 ? 0 : Math.PI;
    stone.push(painted(new THREE.RingGeometry(C.mouth + 0.5, K.r, 20, 1), S.cap, at(0, ky, z, ry)));
    stone.push(painted(new THREE.TorusGeometry(C.mouth + 0.25, 0.32, 6, 24), S.ring, at(0, ky, z + f * 0.1, ry)));
    for (let i = 0; i < C.fangs; i++) { // (fangs of old glaze round the mouth, pointing in)
      const a = (i / C.fangs) * Math.PI * 2, r = C.mouth - 0.05, len = 0.6 + 0.35 * ((i * 7) % 3);
      const M = _m.compose(_v.set(Math.cos(a) * r, ky + Math.sin(a) * r, z + f * 0.05), _q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a + Math.PI / 2), _s.set(1, 1, 1)).clone();
      stone.push(painted(new THREE.ConeGeometry(0.22, len, 4).translate(0, len / 2, 0), S.fang, M));
    }
    disc.push(new THREE.CircleGeometry(C.mouth + 0.1, 28).applyMatrix4(at(0, ky, z - f * 0.15, ry)));
  }
  return { stone, disc, mouthY: ky };
}

export class RacewaySiphons {
  constructor(game, o = {}) {
    this.game = game; this.parent = o.parent || null; this.vfxOf = () => o.vfx || game.vfx;
    this.t = 0; this.src = null; this.dressed = {}; this.arches = []; this.gulp = 0; this.angle = 0;
    (o.events || game.events)?.on('skiff.siphon', (e) => this.drink(e));
  }
  parentOf() { return this.parent || this.game.scene; }

  update(dt) {
    const R = this.game.raceway, S = R?.siphons;
    if (S?.groups && S.groups !== this.src && Object.keys(S.groups).length) { this.undress(); this.dress(R, S); }
    if (!this.src) return;
    // (the siphons stand only for a licence test that asks for one, on its track: siphons.js shows her group then, S.on; ours instead)
    for (const G of Object.values(this.src)) G.visible = false;
    for (const [id, D] of Object.entries(this.dressed)) D.visible = id === S.on;
    this.t += dt; this.gulp = Math.max(0, this.gulp - dt / 0.9);
    this.angle += dt * (C.spin[0] + (C.spin[1] - C.spin[0]) * this.gulp * this.gulp);
    this.vortex.material.map.rotation = this.angle; // (the map's own turn: its uv transform, no program)
    this.vortex.material.color.setScalar(C.glow * (0.9 + 0.1 * Math.sin(this.t * 2.1)) + C.gulp * this.gulp);
    // the streams, held at each arch near the camera while the Raceway is here
    const cam = this.game.camera?.position, here = R.active !== false;
    for (const A of this.arches) {
      const on = here && A.track === S.on && (!cam || cam.distanceTo(A.mouth) < C.near);
      A.on = on;
      if (on && !A.h?.alive) A.h = this.vfxOf()?.play('raceway.siphon.draw', { pos: A.mouth.clone(), dir: A.fwd, normal: UP, follow: () => !!this.src && A.on });
      if (!on && A.h) { A.h.stop?.(); A.h = null; }
    }
  }

  dress(R, S) {
    this.dressed = {};
    const mat = (this.stoneMat ||= new THREE.MeshStandardMaterial({ name: 'raceway-siphon-stone', color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true })); // (the kit's parameters: its program)
    const vm = (this.vortexMat ||= new THREE.MeshBasicMaterial({ name: 'raceway-siphon-vortex', map: vortexTexture() }));
    for (const id of Object.keys(S.groups)) {
      const T = R.trackOf(id), list = SIPHONS[id]; if (!T || !list?.length) continue;
      const stone = [], disc = [];
      for (const s of list) {
        const F = T.frame(s), yaw = Math.atan2(F.fx, F.fz), w = F.w + 1.5, H = SIPHON.height;
        const cx = RW.x + F.x, cz = RW.z + F.z, gy = R.heightAt(cx, cz);
        const side = (sd) => R.heightAt(RW.x + F.x - F.fz * w * sd, RW.z + F.z + F.fx * w * sd) - gy; // (x across is left here: yaw maps +x to (fz, -fx))
        const P = archParts(w, H, side(-1), side(1)), M = _m.compose(_v.set(cx, gy, cz), _q.setFromAxisAngle(UP, yaw), _s.set(1, 1, 1));
        for (const g of P.stone) stone.push(g.applyMatrix4(M)); for (const g of P.disc) disc.push(g.applyMatrix4(M));
        this.arches.push({ track: id, s, mouth: new THREE.Vector3(cx, gy + P.mouthY, cz), fwd: new THREE.Vector3(F.fx, 0, F.fz), ground: gy, h: null, on: false });
      }
      const D = (this.dressed[id] = new THREE.Group()); D.name = `raceway-siphon-${id}`; D.userData.zone = 'raceway'; D.visible = false;
      const sg = mergeGeometries(stone); stone.forEach((g) => g.dispose());
      const m = new THREE.Mesh(sg, mat); m.name = 'raceway-siphon-stone'; m.castShadow = m.receiveShadow = true;
      const dg = mergeGeometries(disc); disc.forEach((g) => g.dispose());
      const v = new THREE.Mesh(dg, vm); v.name = 'raceway-siphon-vortex';
      D.add(m, v); this.parentOf().add(D);
    }
    this.vortex = { material: vm }; // (one material for every track's mouths: the turn and the gulp are shared)
    this.src = S.groups; // (her pillars and lintels, one group a track: kept hidden while ours stand)
  }

  /** The pool drunk (skiff.siphon): Lachryma pulled off the board up into the nearest mouth, a ring collapsing in on the sand, the gulp. */
  drink(e) {
    const p = this.game.player?.pos; if (!this.src || !p) return;
    let A = null, best = Infinity; for (const a of this.arches) { const d = a.mouth.distanceToSquared(p); if (d < best) { best = d; A = a; } }
    if (!A || best > 60 * 60) return;
    const max = this.game.lachryma?.max || 100, power = Math.max(0.35, Math.min(1.6, ((e?.took || 0) / max) * 2.2)), dir = _v.subVectors(A.mouth, p).normalize().clone();
    const vfx = this.vfxOf(), floor = this.game.raceway?.heightAt?.(p.x, p.z) ?? p.y;
    vfx?.play('raceway.siphon.drink', { pos: p.clone().setY(p.y + 0.6), dir, normal: UP, power, floor });
    vfx?.play('raceway.siphon.ring', { pos: new THREE.Vector3(p.x, floor, p.z), normal: UP, power });
    vfx?.play('raceway.siphon.gulp', { pos: A.mouth.clone(), dir: A.fwd, normal: UP, power });
    this.gulp = Math.min(1.4, 0.6 + power * 0.5);
  }

  undress() {
    for (const A of this.arches) A.h?.stop?.();
    this.arches = [];
    for (const D of Object.values(this.dressed || {})) { D.removeFromParent(); D.traverse((o) => o.geometry?.dispose()); }
    this.dressed = {}; this.vortex = null; this.src = null; // (her groups' visibility is hers again: siphons.js shows the wanted track's)
  }
}
