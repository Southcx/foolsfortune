// ---------------------------------------------------------------------------------------
// THE SHADOW FRAME'S LOOK (plain name; ShadowFrameLook; docs/plans/MECHS.md 9.4; Dovina's secret rival `shadow`, "a frame with no
// colours"): the boxing ring's secret rival drawn as your own parts body (game.makeMechBody, vfx/mechs/partsbody.js) in your frame's
// assembly, unglazed and inverted: the blank frame's bisque turned to ink, matte black plates and trim, the core between them a void,
// one faint light in it and in the eyes, and a faint afterimage trailing it as it moves (dark ghosts of its last poses fading).
//   HOW      Dovina's rival placeholder (world/hangar/rival.js RivalFrame, posed by world/hangar/ringbout.js) is dressed over while its
//            id is 'shadow' (or its RIVAL_LOOK row says `shadow`): its boxes hidden, a parts body parented to its root (so the lunge, the
//            hops and the fall on its back carry it), and its pivots' turns laid on the body's joints each frame after the bout poses
//            it (the torso on the chest, the shoulders, the elbows, the neck, the legs on the hips); a limb its placeholder hides is
//            hidden on the body too. A frame with no colours: it wears your parts, never your glaze.
// Prior art: the shadow self (Jung's; Persona 4's Shadows, Dark Link in Ocarina of Time's Water Temple: your own form in black), Shadow
// the Hedgehog's palette swap, Evangelion's Unit 01 berserk silhouettes, Punch-Out!!'s secret boxer, the afterimage of a hasted body
// (vfx/mechs/speciallooks.js ghost).
//
//   new ShadowFrameLook(game)  .update(dt, t)  .dispose()   SHADOW_FRAME (its colours and the trail's rate and life)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RIVAL_LOOK } from '../../../world/hangar/rival.js';

/** The ink: plates, trim and core; the faint light (the eyes and the void's one point); the afterimage's rate, life and darkness. */
export const SHADOW_FRAME = { plate: 0x0d0c10, trim: 0x17151c, core: 0x030204, light: 0x8a7ab8, every: 0.1, life: 0.45, ghost: 0.32, move: 0.25 };
const K = SHADOW_FRAME;
const _p = new THREE.Vector3(), _last = new THREE.Vector3();

/** Is this rival the shadow (its id, or its look's row marked)? */
export const isShadow = (rival) => !!rival?.root && (rival.id === 'shadow' || !!RIVAL_LOOK[rival.id]?.shadow);

export class ShadowFrameLook {
  constructor(game) { this.game = game; this.rival = null; this.root = null; this.body = null; this.ghosts = []; this.nextGhost = 0; this.ghostMat = null; this.voidLight = null; }

  /** The rival frame, if the boxing ring has one built. */
  get frame() { return this.game.hangar?.bout?.rival || null; }

  dress(R) {
    const g = this.game, B = g.makeMechBody?.(g.hangar?.state?.stats ?? null); if (!B) return;
    if (!B.body) B.build(g.hangar?.state?.stats ?? {});
    const M = B.mats;
    for (const [m, c] of [[M.porcelain, K.plate], [M.trim, K.trim], [M.core, K.core]]) { if (!m) continue; m.color.setHex(c); m.roughness = 0.95; m.metalness = 0; m.vertexColors = false; m.needsUpdate = true; }
    M.gold?.color.setHex(0x1e1a14); if (M.gold) { M.gold.metalness = 0.2; M.gold.roughness = 0.8; M.gold.emissive?.setHex(0); M.gold.vertexColors = false; M.gold.needsUpdate = true; }
    if (M.labradorite) { M.labradorite.color.setHex(0x050407); M.labradorite.vertexColors = false; M.labradorite.needsUpdate = true; }
    this.voidLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: K.light, toneMapped: false }));
    this.voidLight.name = 'shadow.void';
    B.joints.chest?.add(this.voidLight); this.voidLight.position.set(0, 1.4, 1.2);
    for (const m of Object.values(R.mats || {})) m.visible = false; // (the placeholder's boxes hidden, kept for its own dispose)
    R.root.add(B.group); this.body = B; this.rival = R; this.root = R.root;
    this.ghostMat = new THREE.MeshBasicMaterial({ name: 'shadow.ghost', color: 0x0a0810, transparent: true, opacity: K.ghost, depthWrite: false });
  }
  undress() {
    if (this.body) { this.body.dispose(); this.body = null; }
    if (this.voidLight) { this.voidLight.geometry.dispose(); this.voidLight.material.dispose(); this.voidLight = null; }
    for (const G of this.ghosts) G.g.removeFromParent(); this.ghosts = [];
    this.ghostMat?.dispose(); this.ghostMat = null;
    if (this.rival?.mats) for (const m of Object.values(this.rival.mats)) m.visible = true;
    this.rival = null; this.root = null;
  }

  update(dt, t) {
    const R = this.frame, want = isShadow(R) ? R : null;
    if (want !== this.rival || (want && want.root !== this.root)) { this.undress(); if (want) { try { this.dress(want); } catch (e) { console.warn('shadow frame', e); this.undress(); } } }
    this.trail(dt);
    if (!this.body) return;
    const B = this.body, j = B.joints;
    B.pose({ pos: _p.set(0, 0, 0), yaw: 0, sealed: true, dt });
    const add = (o, src) => { if (o && src) { o.rotation.x += src.rotation.x; o.rotation.y += src.rotation.y; o.rotation.z += src.rotation.z; } };
    add(j.chest, R.torso); add(j.neck, R.neck);
    for (const k of ['L', 'R']) {
      const A = R.arms?.[k]; if (!A) continue;
      add(j[`shoulder${k}`], A.sh); add(j[`elbow${k}`], A.el);
      if (j[`shoulder${k}`]) j[`shoulder${k}`].visible = A.sh.visible !== false; if (j[`elbow${k}`]) j[`elbow${k}`].visible = A.el.visible !== false;
    }
    add(j.hipR, R.legs?.[0]); add(j.hipL, R.legs?.[1]);
    if (j.head && R.head) j.head.position.y += R.head.position.y; // (the neck snapped: the head up on its coil)
    if (R.mats?.eye) B.mats.glow?.color.setHex(K.light).multiplyScalar(R.mats.eye.emissiveIntensity > 2 ? 2.5 : 0.8); // (the blink's tell: the eyes flare)
    this.voidLight.scale.setScalar(0.85 + 0.15 * Math.sin(t * 2.3));
    B.group.updateMatrixWorld(true);
    // the afterimage: while it moves, a dark copy of where it stood left behind
    const moved = B.group.getWorldPosition(_p).distanceTo(_last); _last.copy(_p);
    this.nextGhost -= dt;
    if (this.nextGhost <= 0 && moved / Math.max(dt, 1e-3) > K.move) { this.nextGhost = K.every; this.ghost(); }
  }
  ghost() {
    const B = this.body, G = new THREE.Group(); G.name = 'shadow.afterimage'; G.matrixAutoUpdate = false;
    const mat = this.ghostMat.clone();
    B.body.traverse((o) => { if (!o.isMesh || !o.visible || !o.geometry) return; const m = new THREE.Mesh(o.geometry, mat); m.matrixAutoUpdate = false; m.matrix.copy(o.matrixWorld); m.frustumCulled = false; G.add(m); });
    this.game.scene.add(G); G.updateMatrixWorld(true);
    this.ghosts.push({ g: G, mat, t: 0 });
  }
  trail(dt) {
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const H = this.ghosts[i]; H.t += dt; H.mat.opacity = K.ghost * (1 - H.t / K.life) ** 1.6;
      if (H.t >= K.life || !this.body) { H.g.removeFromParent(); H.mat.dispose(); this.ghosts.splice(i, 1); }
    }
  }
  dispose() { this.undress(); }
}
