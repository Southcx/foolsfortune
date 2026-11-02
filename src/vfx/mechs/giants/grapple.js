// ---------------------------------------------------------------------------------------
// GIANT WRESTLING'S LOOK (plain name; docs/plans/MECHS.md 11.2; the runtime Dovina's, world/hangar/giantgrapple.js): what giant wrestling
// looks like on the frame and round it, read from her grapple's state and said on her events, looks only:
//   THE STRAIN   while a giant is held overhead (`mode` 'held'): an ember glow at the frame's shoulders and knees (sprites hung on the
//                parts body's own joints, swelling as the hold runs out and on each of her battery's shakes), embers spat from a joint,
//                dust pressed out from under its feet; nothing of the frame's own materials touched (its fade is its own), and a glow
//                the camera is inside is not drawn
//   THE LIFT     `giant.grab`: a ring of dust torn up where the giant stood
//   THE THROW    `mode` 'flight': the whoosh, streaks along its flight and sand torn off it; each building met on the way (her flight's
//                `struck` growing) and the landing (`giant.throw`) a burst of debris and dust
//   THE SLAM     `giant.slam`: the powerbomb at the frame's feet: the ground cracked, a shock ring, a wall of dust, clods thrown
//   THE SLIP     `giant.slip`: a frame too light (or a giant struggled free): sparks at the shoulders, a scuff of dust
// Prior art: wrestling's powerbomb and the gorilla press (a body held overhead, the arms shaking), The Incredible Hulk: Ultimate
// Destruction (a big foe thrown through a building), the kaiju films' throws, Pacific Rim's strain on a Jaeger's joints.
//
//   const W = new GrappleLook(game)   W.update(dt, t)   W.dispose()   GRAPPLE_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GRAPPLE } from '../../../progress/mechs/giants.js';

/** The glow's size (m) and colour, how often a joint spits embers and the feet scuff (real s), the throw's trail, the camera's clearance. */
export const GRAPPLE_LOOK = { r: 3.6, ember: 0xff7a2a, spark: 0.22, dust: 0.45, trail: 0.05, clear: 7, joints: ['shoulderL', 'shoulderR', 'kneeL', 'kneeR'] };
const GL = GRAPPLE_LOOK, _a = new THREE.Vector3(), _b = new THREE.Vector3();

function glowTex() {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,160,70,0.85)'); gr.addColorStop(0.6, 'rgba(220,70,20,0.3)'); gr.addColorStop(1, 'rgba(160,30,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class GrappleLook {
  constructor(game) {
    this.game = game; this.glows = []; this.body = null; this.k = 0; this.t = { spark: 0, dust: 0, trail: 0 }; this.struck = 0; this.wasShake = 0; this.kick = 0;
    this.mat = new THREE.SpriteMaterial({ map: glowTex(), color: GL.ember, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }); // (seen through the plates: the joint's heat, not its surface)
    const on = (n, f) => this.offs.push(game.events?.on?.(n, (e) => { try { f(e || {}); } catch (x) { console.warn('grapple look', x); } }));
    this.offs = [];
    on('giant.grab', () => { const G = this.giant; const p = G?.stashed || G?.pos; if (p) this.play('giant.grab.lift', { pos: _a.copy(p).setY(p.y + 0.5).clone(), scale: 1.2, floor: p.y }); });
    on('giant.slam', () => { const G = this.giant; if (G) this.play('giant.slam', { pos: G.pos.clone().setY(G.pos.y + 0.3), floor: G.pos.y }); });
    on('giant.throw', (e) => { const G = this.giant; if (G) this.play('giant.throw.impact', { pos: G.pos.clone().setY(G.pos.y + 3), scale: e.hit === 'building' ? 1.3 : 1, floor: G.pos.y }); });
    on('giant.slip', () => { this.kick = 1; this.sparkAll(); this.feet(true); });
  }
  get hangar() { return this.game.hangar; }
  get giant() { return this.hangar?.giant || null; }
  play(n, ctx) { try { this.game.vfx?.play(n, ctx); } catch { /* (headless) */ } }

  /** The glow sprites hung on the frame's joints (the parts body's; none on the placeholder body, which has no named joints). */
  hang(B) {
    this.unhang(); this.body = B;
    for (const id of GL.joints) {
      const j = B?.joints?.[id] || B?.joints?.[id.replace('knee', 'hip')]; if (!j) continue;
      const s = new THREE.Sprite(this.mat); s.name = 'mech.strain'; s.renderOrder = 4; s.visible = false; j.add(s); this.glows.push(s);
    }
  }
  unhang() { for (const s of this.glows) s.removeFromParent(); this.glows = []; this.body = null; }

  sparkAll() { for (const s of this.glows) if (s.parent) this.play('giant.strain.spark', { pos: s.getWorldPosition(_a).clone() }); }
  feet(hard = false) {
    const P = this.hangar?.pilot; if (!P?.pos) return;
    const r = _b.set(Math.cos(P.yaw ?? 0), 0, -Math.sin(P.yaw ?? 0));
    for (const s of [-1, 1]) this.play('giant.grab.dust', { pos: _a.copy(P.pos).addScaledVector(r, s * 2.4).setY(P.pos.y + 0.3).clone(), scale: hard ? 1.4 : 1, floor: P.pos.y });
  }

  update(dt, t) {
    const H = this.hangar, W = H?.pilot?.tech?.grapple, B = H?.pilot?.mech || null;
    if (B !== this.body || (B && this.glows.length && !this.glows[0].parent)) this.hang(B);
    for (const k in this.t) this.t[k] -= dt;
    const held = W?.mode === 'held';
    // the strain: the hold's share run, each battery shake a swell
    const want = held ? 0.35 + 0.65 * Math.min(1, (W.t || 0) / GRAPPLE.hold) : 0;
    this.k += (want - this.k) * Math.min(1, dt * (held ? 5 : 3));
    if (held && W.shakeT < this.wasShake) this.kick = 1; this.wasShake = held ? W.shakeT : 0;
    this.kick = Math.max(0, this.kick - dt * 3);
    const cam = this.game.camera;
    for (const [i, s] of this.glows.entries()) {
      const k = this.k * (0.85 + 0.15 * Math.sin(t * 23 + i * 1.7)) + 0.35 * this.kick;
      s.visible = k > 0.03; if (!s.visible) continue;
      const far = cam ? s.getWorldPosition(_a).distanceTo(cam.position) > GL.clear : true; s.visible = far;
      s.scale.setScalar(GL.r * (0.6 + 0.6 * k)); s.material.opacity = Math.min(1, k * 1.1);
    }
    if (held) {
      if (this.t.spark <= 0 && this.glows.length) { this.t.spark = GL.spark * (1.4 - this.k); const s = this.glows[(Math.random() * this.glows.length) | 0]; this.play('giant.strain.spark', { pos: s.getWorldPosition(_a).clone() }); }
      if (this.t.dust <= 0) { this.t.dust = GL.dust; this.feet(); }
    }
    // the throw's whoosh, and each building it went through on the way
    if (W?.mode === 'flight' && W.F) {
      const G = this.giant, c = G?.air?.ctr;
      if (c && this.t.trail <= 0) { this.t.trail = GL.trail; this.play('giant.throw.trail', { pos: c.clone(), dir: W.F.vel.clone().negate().normalize(), scale: 1 }); }
      const n = W.F.struck?.size || 0; if (n > this.struck && c) this.play('giant.throw.impact', { pos: c.clone(), scale: 1.2, floor: H.field?.group ? c.y - 6 : undefined });
      this.struck = n;
    } else this.struck = 0;
  }
  dispose() { this.unhang(); for (const o of this.offs) o?.(); this.offs = []; this.mat.map?.dispose(); this.mat.dispose(); }
}
