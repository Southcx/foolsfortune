// ---------------------------------------------------------------------------------------
// RIDE'S REINS: the Chariot's ridden creature (Petra's runtime, courier/classarts/lasting.js `ride`: a staggered creature's body steered
// by the Courier's movement keys, its mind stood aside, the Courier held where they stand) given the tack of light that says who drives
// it: a bridle on it (a collar at its neck, a headstall over its crown, a ring at each cheek), reins of light from the Courier's two
// hands to those rings, sagging as they slacken and running with light toward it, its eyes closed calm in your colour (the window
// colour: ui/theme.js, as a cradle sealed is lit, vfx/cradlelook.js), and dust from its feet as it goes (`art.ride.dust`).
//
// Prior art: the Chariot of the Rider-Waite deck (the driver's reins on two beasts), Shadow of the Colossus's grip, Ape Escape's and
// Pokemon's ridden creatures, Okami's brushstroke tethers, the house's tethers (Possession's grammar: vfx/library/classarts/kit.js).
//
//   const R = new RideReins(game, creature, ctx)   R.update(dt, on, shown) -> false once it has faded   R.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THEMES, theme } from '../../ui/theme.js';
import { shapeMat, whiten, lightLine, envelope, zoneFree } from './kit.js';

/** The tack's numbers: the reins' width (m) and sag (m at their slackest), the light's strength, and the dust's pace (m/s to raise it,
 *  real s between puffs). */
export const REINS = { width: 0.045, sag: 0.32, light: 0.9, dustAt: 0.9, dustEvery: 0.16, segs: 16 };
const _h = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Vector3(), _p = new THREE.Vector3();

/** The bridle, in the creature's own frame (its foot at 0, its face on +Z), sized to it: collar, headstall and the two cheek rings. */
function bridleGeometry(rad, neck) {
  const parts = [];
  const collar = new THREE.TorusGeometry(rad * 1.02, 0.03, 6, 32); collar.rotateX(Math.PI / 2); collar.translate(0, neck, 0); parts.push(collar);
  const crown = new THREE.TorusGeometry(rad * 0.86, 0.022, 6, 24, Math.PI); crown.translate(0, neck, 0); parts.push(crown);
  const brow = new THREE.TorusGeometry(rad * 0.7, 0.02, 6, 20, Math.PI); brow.rotateX(-Math.PI / 2 + 0.35); brow.translate(0, neck + rad * 0.25, 0); parts.push(brow);
  for (const s of [-1, 1]) { const ring = new THREE.TorusGeometry(0.075, 0.016, 6, 16); ring.rotateY(Math.PI / 2); ring.translate(s * rad * 1.04, neck, rad * 0.12); parts.push(ring); }
  for (const p of parts) { p.deleteAttribute('uv'); }
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  const n = g.attributes.position.count, uv = new Float32Array(n * 2), P = g.attributes.position;
  for (let i = 0; i < n; i++) { uv[i * 2] = Math.atan2(P.getX(i), P.getZ(i)) / (Math.PI * 2) + 0.5; uv[i * 2 + 1] = P.getY(i) - neck; } // (u round the creature: the light runs round the tack)
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return whiten(g);
}
/** Its eyes closed calm: two soft arcs, curved as a sleeper's lids (◡ ◡), set on its face. */
function eyesGeometry(rad, eye) {
  const parts = [];
  for (const s of [-1, 1]) { const g = new THREE.TorusGeometry(0.06, 0.013, 5, 12, Math.PI); g.rotateZ(Math.PI); g.translate(s * rad * 0.34, eye, rad * 0.93); parts.push(g.toNonIndexed()); }
  return whiten(mergeGeometries(parts));
}

export class RideReins {
  constructor(game, c, ctx = {}) {
    this.game = game; this.c = c; this.ctx = ctx; this.k = 0; this.dustT = 0; this.last = c.pos.clone();
    const rad = Math.max(0.3, c.radius ?? 0.5), hgt = c.height ?? 1.5;
    this.neck = hgt * 0.6; this.rad = rad;
    this.tack = shapeMat({ main: 'streaks', tile: [10, 1], scroll: [0.9, 0], mask: 'noise', maskK: 0.4, maskTile: [4, 1], maskScroll: [0.2, 0], ramp: 'suit', rim: -0.3, core: 0.3, glow: 2, back: 0.3 }, ctx);
    const ink = THEMES[theme.id] || THEMES.kiln;
    this.eyeMat = shapeMat({ main: 'none', ramp: 'tint', tint: new THREE.Color(`rgb(${ink.sel})`).getHex(), glow: 2.4, core: 0.4, coreAt: 0.6, back: 0 }, ctx);
    this.group = new THREE.Group(); this.group.name = 'classart-reins';
    const bridle = new THREE.Mesh(bridleGeometry(rad, this.neck), this.tack.mat), eyes = new THREE.Mesh(eyesGeometry(rad, hgt * 0.72), this.eyeMat.mat);
    for (const m of [bridle, eyes]) { m.frustumCulled = false; m.renderOrder = 7; m.userData.moodExempt = true; this.group.add(m); }
    this.parts = [bridle, eyes];
    this.lines = [-1, 1].map(() => lightLine(REINS.segs, { main: 'streaks', tile: [1, 6], scroll: [0, 1.6], mask: 'noise', maskK: 0.35, maskTile: [1, 3], maskScroll: [0, 0.7], ramp: 'suit',
      core: 0.4, glow: 2.2, back: 0.3 }, ctx));
    for (const L of this.lines) game.scene.add(zoneFree(L.mesh));
    this.pts = [-1, 1].map(() => Array.from({ length: REINS.segs + 1 }, () => new THREE.Vector3()));
    game.scene.add(zoneFree(this.group));
  }
  update(dt, on, shown) {
    const g = this.game, c = this.c, ch = g.character, cam = g.camera;
    this.k = envelope(this.k, on && c.alive, dt, 0.25, 0.35);
    const base = c.root?.position ?? c.pos;
    this.group.position.copy(base); this.group.rotation.y = c.yaw ?? c.root?.rotation?.y ?? 0;
    this.group.visible = shown && this.k > 0.01;
    this.tack.u.uK.value = REINS.light * this.k; this.eyeMat.u.uK.value = this.k * (0.85 + 0.15 * Math.sin(performance.now() / 700));
    this.group.updateMatrixWorld(true);
    ['L', 'R'].forEach((side, i) => {
      const L = this.lines[i], pts = this.pts[i]; L.mesh.visible = this.group.visible && !!ch;
      if (!ch?.bones || !cam) return;
      ch.bones[side === 'L' ? 'handL' : 'handR']?.getWorldPosition(_h);
      _c.set((side === 'L' ? 1 : -1) * this.rad * 1.04, this.neck, this.rad * 0.12); this.group.localToWorld(_c); // (its cheek ring: the Courier's left hand holds its left rein, its +X side as it faces +Z)
      const d = _h.distanceTo(_c), sag = REINS.sag * Math.max(0.15, 1 - d / 7);
      _m.lerpVectors(_h, _c, 0.5); _m.y -= sag * 2;
      for (let j = 0; j <= REINS.segs; j++) { const u = j / REINS.segs, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), e = u * u; pts[j].set(a * _h.x + b * _m.x + e * _c.x, a * _h.y + b * _m.y + e * _c.y, a * _h.z + b * _m.z + e * _c.z); }
      L.set(pts, REINS.width, cam.position); L.u.uK.value = this.k;
    });
    // dust from its feet as it is driven along
    const moved = _p.copy(c.pos).sub(this.last).setY(0).length() / Math.max(1e-3, dt); this.last.copy(c.pos);
    if (on && shown && moved > REINS.dustAt && (this.dustT -= dt) <= 0) { this.dustT = REINS.dustEvery; g.vfx?.play?.('art.ride.dust', { ...this.ctx, pos: c.pos.clone(), dir: new THREE.Vector3(0, 1, 0), tint: 0xcbb8a4, scale: this.rad / 0.5, floor: c.pos.y }); }
    if (!(on && c.alive) && this.k <= 0) { this.dispose(); return false; }
    return true;
  }
  dispose() {
    if (this.dead) return; this.dead = true;
    this.group.parent?.remove(this.group); for (const m of this.parts) m.geometry.dispose(); this.tack.mat.dispose(); this.eyeMat.mat.dispose();
    for (const L of this.lines) L.dispose();
  }
}
