// ---------------------------------------------------------------------------------------
// LAMP'S LANTERN: the Hermit's lamp (Petra's runtime, courier/classarts/lasting.js `lamp`: a PointLight lent by the light budget, held over
// the Courier, the hidden things in its reach shown) given the lantern its light hangs from: a paper lantern of washi on bamboo ribs
// (a chōchin), its lacquered caps and handle, bobbing and swinging over the right shoulder as the Courier moves; round it a soft halo,
// moths flitting and motes falling (the library's `art.lantern.glow`), and on the ground under it its throw, a warm pool ribbed by its
// frame's shadows (`art.lantern.throw`). It adds no light: the light is Petra's, lent by the budget.
//
// Prior art: the chōchin (a paper lantern on a collapsing bamboo spiral, the ribs' shadows thrown on the ground round it), the Hermit's
// lantern of the Rider-Waite deck, Okami's and Ghost of Tsushima's lantern-lit nights (moths at the light), Dark Souls' Sunlight lamp.
//
//   const L = new LampLantern(game, ctx)   L.update(dt, on, shown) -> false once it has gone out   L.dispose()
//   ctx: the art's look context (suit, domain: classartlooks.js ctx)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { shapeMat, whiten, stoneMat, painted, groundY, envelope, smooth, zoneFree } from './kit.js';

/** Where it hangs (m, from the Courier's feet, their right and their back), how it bobs and swings, how fast it follows. */
export const LANTERN = { side: 0.4, back: 0.16, up: 2.02, bob: 0.035, swing: 0.16, follow: 8, size: 1 };
const H = 0.26, R = 0.115;
const prof = (y) => R * Math.sqrt(Math.max(0.04, 1 - Math.pow((y / (H / 2)) * 0.94, 2))); // (the paper's swell: a barrel, narrow at its caps)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3();
const lin = (hex) => new THREE.Color().setHex(hex);

let PAPER = null, FRAME = null;
/** The paper (a lathe: uv round it and up it, for the washi's scroll) and the frame (ribs, caps, handle, one geometry of colours). */
function geometries() {
  if (PAPER) return { paper: PAPER, frame: FRAME };
  const pts = []; for (let i = 0; i <= 12; i++) { const y = -H / 2 + (H * i) / 12; pts.push(new THREE.Vector2(prof(y), y)); }
  PAPER = whiten(new THREE.LatheGeometry(pts, 18));
  const parts = [], bamboo = lin(0x5a3a1e), lacquer = lin(0x24140e), brass = lin(0x8a6a2a);
  for (let i = 1; i < 8; i++) { const y = -H / 2 + (H * i) / 8, g = new THREE.TorusGeometry(prof(y) + 0.002, 0.004, 3, 22); g.rotateX(Math.PI / 2); g.translate(0, y, 0); parts.push(painted(g, () => bamboo)); }
  for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(R * 0.5, R * 0.56, 0.026, 14); g.translate(0, s * (H / 2 + 0.008), 0); parts.push(painted(g, () => lacquer)); }
  const handle = new THREE.TorusGeometry(0.05, 0.005, 4, 14, Math.PI); handle.translate(0, H / 2 + 0.02, 0); parts.push(painted(handle, () => lacquer));
  const hook = new THREE.TorusGeometry(0.014, 0.004, 4, 10); hook.translate(0, H / 2 + 0.082, 0); parts.push(painted(hook, () => brass));
  FRAME = mergeGeometries(parts);
  return { paper: PAPER, frame: FRAME };
}

export class LampLantern {
  constructor(game, ctx = {}) {
    this.game = game; this.ctx = ctx; this.k = 0; this.t = Math.random() * 10; this.swing = 0; this.swingV = 0; this.groundT = 0;
    const G = geometries();
    this.paper = shapeMat({ main: 'cells', mainK: 0.22, tile: [5, 3], scroll: [0.01, 0.04], mask: 'noise', maskK: 0.25, maskTile: [3, 2], maskScroll: [0.02, 0.1], ramp: 'pentacles',
      rim: -0.45, rimPow: 1.6, core: 0.5, coreAt: 0.82, glow: 1.9, add: 0.45, back: 0 }, ctx);
    this.group = new THREE.Group(); this.group.name = 'classart-lantern';
    this.pivot = new THREE.Group(); this.pivot.position.y = H / 2 + 0.082; this.group.add(this.pivot); // (it swings from its hook)
    const body = new THREE.Group(); body.position.y = -(H / 2 + 0.082); this.pivot.add(body);
    const paper = new THREE.Mesh(G.paper, this.paper.mat); paper.renderOrder = 7; paper.userData.moodExempt = true;
    const frame = new THREE.Mesh(G.frame, stoneMat()); frame.castShadow = false;
    body.add(frame, paper); this.group.scale.setScalar(0.01);
    game.scene.add(zoneFree(this.group));
    this.at = null; this.vel = new THREE.Vector3(); this.ground = 0;
    this.glow = game.vfx?.play?.('art.lantern.glow', { ...ctx, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), follow: (h) => this.place(h, 0) });
    this.throw = game.vfx?.play?.('art.lantern.throw', { ...ctx, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), follow: (h) => this.place(h, 1) });
  }
  /** Its held effects kept on it (the glow at the lantern, the throw on the ground under it), faded with it; false once it has gone. */
  place(h, onGround) {
    if (this.dead) return false;
    if (!this.at) { h.k = 0; return true; }
    h.pos.copy(this.at); if (onGround) h.pos.y = this.ground + 0.03; else h.pos.y += 0.1;
    h.k = this.k * (this.shown ? 1 : 0); return true;
  }
  /** Each frame: on while the lamp is lit; false once it has faded out. */
  update(dt, on, shown) {
    const g = this.game, P = g.player; if (!P) return false;
    this.t += dt; this.shown = shown; this.k = envelope(this.k, on, dt, 0.4, 0.5);
    const me = P.renderPos ?? P.pos, yaw = P.bodyYaw ?? P.yaw ?? 0;
    _f.set(Math.sin(yaw), 0, Math.cos(yaw)); _r.set(-_f.z, 0, _f.x);
    const want = _a.copy(me).addScaledVector(_r, LANTERN.side).addScaledVector(_f, -LANTERN.back); want.y += LANTERN.up + LANTERN.bob * Math.sin(this.t * 1.9);
    if (!this.at) this.at = want.clone();
    const before = _b.copy(this.at); this.at.lerp(want, 1 - Math.exp(-dt * LANTERN.follow));
    // the swing: a pendulum driven by how its hook was moved (Hooke's spring on the angle, damped), about the Courier's right axis
    const moved = before.sub(this.at).dot(_f) / Math.max(1e-3, dt);
    this.swingV += (moved * 0.08 - this.swing * 26) * dt; this.swingV *= Math.exp(-dt * 3.2); this.swing = THREE.MathUtils.clamp(this.swing + this.swingV * dt, -0.5, 0.5);
    this.group.position.copy(this.at); this.group.rotation.y = yaw + 0.4 * Math.sin(this.t * 0.37);
    this.pivot.rotation.set(this.swing + LANTERN.swing * 0.25 * Math.sin(this.t * 1.3), 0, 0.05 * Math.sin(this.t * 0.9));
    this.group.scale.setScalar(Math.max(0.01, LANTERN.size * (0.35 + 0.65 * smooth(this.k))));
    this.group.visible = shown && this.k > 0.01;
    this.paper.u.uK.value = this.k * (0.85 + 0.08 * Math.sin(this.t * 7.3) * Math.sin(this.t * 3.1)); // (a flame's breath through the paper, never a flicker)
    if ((this.groundT -= dt) <= 0) { this.groundT = 0.2; this.ground = groundY(g, this.at.x, this.at.z, me.y); }
    if (!on && this.k <= 0) { this.dispose(); return false; }
    return true;
  }
  dispose() {
    if (this.dead) return; this.dead = true;
    this.glow?.stop?.(); this.throw?.stop?.();
    this.group.parent?.remove(this.group); this.paper.mat.dispose(); // (its geometries are every lantern's, kept)
  }
}
