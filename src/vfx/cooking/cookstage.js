// ---------------------------------------------------------------------------------------
// THE COOKING STAGE (plain name; Spirit Cooking in 3D, South 2026-11-02: "a fully fleshed out minigame featuring the Godhand working the
// dough, in 3d. Use softbody physics for the doughy material"): while the hearth's window is open (Dovina's world/garden/kitchen.js: its
// steps, buttons, tells and rules), this kitchen is drawn in place of the world, the window set aside at the right, and the god hand
// works a soft dough (vfx/cooking/softdough.js) on the board with your pointer or finger. What the hand does is the window's own move:
//   KNEAD    press on the dough: the hand's heel pushes it away (the window's beat, judged on its pulse, which glows on the board), let go
//            and it folds back and turns a quarter; the dough itself tells how far the gluten has come: shaggy and floury, then satin
//            and springy, then tight. Hold still on it a moment, then draw up: the hand pinches a piece and stretches it; thin enough,
//            the light comes through (the windowpane); short of it, it tears and snaps back
//   PROOF    the dough sits in the celadon bowl and swells with the game clock; press on it: a fingertip pokes it, and the dent springs
//            back fast, slowly, or stays, because the dough is that elastic (the tell is the physics)
//   BAKE     the loaf on the oven's floor in the kamado's mouth, its crust browning with the bake, blistered if steamed; press on it: the
//            hand knocks it
//   TASTE, SERVED   the loaf brought out to the board, the camera close
// The dough's stuff follows the rules' values: gluten (the knead's value) stiffens it, lets it keep less and evens its lumps; the
// proof's rise grows its rest; the bake sets it. Looks and gestures only: every judgement is the window's (`beat`, `finish`, `tellAt`).
//
// Prior art: Cooking Mama (one gesture a step), Black & White's hand (the cursor as a hand that touches things), Müller's shape matching
// with plasticity (dough that keeps a fold), Ghibli's food, the poke test (Hamelman 2004), the oven spring and its ear.
//
//   game.cookStage = new CookStage(game)   .enter(kitchen)   .leave()   .active   .render()   (boot/frame.js draws it while active)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { SoftDough } from './softdough.js';
import { buildKitchenSet } from './kitchenset.js';
import { RigClips } from '../../courier/anim/rigclips.js';
import { HAND_MOVES } from '../../godhand/godhandclips.js';
import { MOVES, tellAt } from '../../progress/cooking/moves.js';
import { INGREDIENTS } from '../../progress/cooking/flavour.js';
import { COLOR } from '../../progress/weather.js';

/** The stage's numbers: the cameras by step (position, look), the hand's hover and press, the gestures' timing (real s, scene units). */
export const COOK_STAGE = {
  cams: {
    board: [[0, 2.5, 2.1], [0, 0.05, -0.3]], bowl: [[-1.75, 2.2, 1.6], [-1.75, 0.3, -0.55]],
    oven: [[3.4, 0.7, 1.4], [3.4, -0.2, -2.05]], served: [[0.3, 1.5, 1.7], [0, 0.15, -0.2]],
  },
  hover: 0.5, press: 0.24, pinchHold: 0.35, pull: 0.5, poke: 0.22, foldTime: 0.28,
  palm: 0.2, tip: 0.07,
};
const S0 = COOK_STAGE, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Vector3(), _ndc = new THREE.Vector2(), _ray = new THREE.Raycaster(), _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const CSS = `
#indexmenu.cooking{pointer-events:none}
#indexmenu.cooking .im{pointer-events:auto;max-height:calc(100% - 24px);overflow:auto}
#indexmenu.cooking .ck{width:auto}
#indexmenu.cooking .ck-main{flex-direction:column}
#indexmenu.cooking .ck-canvas{display:none}
`;

/** The dough's program: flour clinging (until the gluten takes it), the satin of a kneaded dough, an add-in's tint, the crust by the
 *  bake (blistered when steamed), and the windowpane's light through what is stretched thin. */
function doughMaterial() {
  const U = { uFlour: { value: 1 }, uSatin: { value: 0 }, uBake: { value: 0 }, uSteam: { value: 0 }, uTint: { value: new THREE.Color(0xf2e2c4) }, uTintK: { value: 0 } };
  const mat = new THREE.MeshStandardMaterial({ name: 'cook-dough', color: 0xf2e2c4, roughness: 0.9 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute float aThin;\nattribute vec3 aRest;\nvarying float vThin;\nvarying vec3 vRest;\nvarying vec3 vUp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vThin = aThin; vRest = aRest; vUp = normal;');
    sh.fragmentShader = 'uniform float uFlour, uSatin, uBake, uSteam, uTintK;\nuniform vec3 uTint;\nvarying float vThin;\nvarying vec3 vRest;\nvarying vec3 vUp;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 base = mix(diffuseColor.rgb, uTint, uTintK);
  float spk = smoothstep(0.55, 0.95, sin(vRest.x * 211.0) * sin(vRest.y * 197.0) * sin(vRest.z * 223.0)) * uFlour;
  base = mix(base, vec3(1.0, 0.99, 0.96), spk * 0.8 + uFlour * 0.1);
  float top = clamp(normalize(vUp).y * 0.5 + 0.55, 0.0, 1.0), b = uBake * (0.72 + 0.38 * top);
  vec3 c0 = vec3(0.94, 0.88, 0.76), c1 = vec3(0.86, 0.64, 0.34), c2 = vec3(0.6, 0.33, 0.13), c3 = vec3(0.3, 0.15, 0.06), c4 = vec3(0.06, 0.04, 0.03);
  vec3 crust = b < 0.4 ? mix(c0, c1, b / 0.4) : b < 0.62 ? mix(c1, c2, (b - 0.4) / 0.22) : b < 0.85 ? mix(c2, c3, (b - 0.62) / 0.23) : mix(c3, c4, clamp((b - 0.85) / 0.15, 0.0, 1.0));
  float blister = uSteam * smoothstep(0.35, 0.8, sin(vRest.x * 71.0) * sin(vRest.y * 67.0 + 1.3) * sin(vRest.z * 79.0 + 0.7)) * smoothstep(0.3, 0.6, uBake);
  base = mix(base, crust, smoothstep(0.02, 0.15, uBake)) + blister * vec3(0.16, 0.12, 0.06);
  float th = smoothstep(0.25, 0.9, vThin);
  base = mix(base, vec3(1.0, 0.95, 0.8), th * 0.55);
  diffuseColor.rgb = base;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(0.92, 0.4, uSatin) * (1.0 - 0.35 * smoothstep(0.3, 0.7, uBake));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.8, 0.5) * smoothstep(0.3, 0.9, vThin) * 0.4;');
  };
  return { mat, U };
}

export class CookStage {
  constructor(game) {
    this.game = game; this.active = false; this.k = null; this.step = null; this.t = 0;
    this.scene = null; this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    this.camPos = new THREE.Vector3(...S0.cams.board[0]); this.camLook = new THREE.Vector3(...S0.cams.board[1]);
    this.pointer = { x: 0, y: 0, down: false, t0: 0, x0: 0, y0: 0, on: false };
    this.handAt = new THREE.Vector3(0, S0.hover, 0.3); this.gesture = null;
    this.onDown = (e) => this.down(e); this.onMove = (e) => this.move(e); this.onUp = (e) => this.up(e);
  }

  build() {
    if (this.scene) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.scene = new THREE.Scene(); this.scene.name = 'cook-stage'; this.scene.background = new THREE.Color(0x2a1810);
    this.set = buildKitchenSet(); this.scene.add(this.set.group);
    this.dough = new SoftDough({ radius: 0.36, detail: 3 }); const D = doughMaterial(); this.dough.mesh.material = D.mat; this.U = D.U;
    this.dough.reset(this.set.spots.board); this.scene.add(this.dough.mesh);
    // the pulse on the board: the knead's beat, a ring of the hearth's ember round the dough
    this.pulse = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    this.pulse.position.y = 0.01; this.scene.add(this.pulse);
    this.buildHand();
  }

  /** The god hand, cloned from the world's (its painting shared), on its own clips. */
  buildHand() {
    const god = this.game.god; if (!god?.hand?.model) return;
    const model = cloneSkinned(god.hand.model), root = new THREE.Group(); root.name = 'cook-hand'; root.add(model);
    model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
    const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    this.hand = { root, model, bones, rig: new RigClips(model, [...god.handClips.R.clips.values()], HAND_MOVES) };
    this.hand.rig.start('idle');
    root.rotation.set(-1.0, Math.PI, 0); root.scale.setScalar(0.7); // (fingers away from the cook, the palm toward the board; a little smaller than the world's, so the dough reads)
    this.scene.add(root);
  }

  // ------------------------------------------------------------------ in and out
  enter(kitchen) {
    this.k = kitchen; this.build();
    if (!this.active) {
      this.active = true; this.t = 0;
      addEventListener('pointerdown', this.onDown, true); addEventListener('pointermove', this.onMove, true); addEventListener('pointerup', this.onUp, true);
      let last = performance.now(); const loop = (t) => { if (!this.active) return; this.update(Math.min(0.05, (t - last) / 1000)); last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    }
    document.getElementById('indexmenu')?.classList.add('cooking');
  }
  leave() {
    if (!this.active) return; this.active = false; this.step = null; this.gesture = null; this.dough?.drop();
    removeEventListener('pointerdown', this.onDown, true); removeEventListener('pointermove', this.onMove, true); removeEventListener('pointerup', this.onUp, true);
    document.getElementById('indexmenu')?.classList.remove('cooking');
  }
  render() { if (this.scene) { this.frame(); this.game.post.render(this.scene, this.camera); } }

  /** The camera's frame: the window set aside at the right, so the view's middle is moved left of it. */
  frame() {
    const W = innerWidth, H = innerHeight, im = document.querySelector('#indexmenu.cooking .im'), pw = im ? im.getBoundingClientRect().width + 24 : 0;
    this.camera.aspect = W / H; this.camera.setViewOffset(W, H, pw / 2, 0, W, H); this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ the step's place and the dough's stuff
  where(step) { return step === 'proof' ? 'bowl' : step === 'bake' ? 'oven' : step === 'taste' || step === 'served' ? 'served' : 'board'; }
  setStep(step) {
    const from = this.where(this.step), to = this.where(step), D = this.dough, sp = this.set.spots;
    if (step === 'choose' || (step === 'knead' && this.step !== 'knead' && this.step !== 'choose')) { D.reset(sp.board); D.bowl = null; D.floor = 0; this.U.uBake.value = 0; this.U.uSteam.value = 0; }
    if (to !== from) {
      const spot = to === 'bowl' ? sp.bowl : to === 'oven' ? sp.oven : sp.board; this.carry(spot);
      D.bowl = to === 'bowl' ? { c: new THREE.Vector3(sp.bowl.x, sp.bowl.y + 0.78, sp.bowl.z), r: 0.82 } : null;
      D.floor = to === 'bowl' ? -10 : spot.y;
    }
    this.step = step;
  }
  /** The dough lifted to `spot` whole (its floor under it), still. */
  carry(spot) {
    const D = this.dough, c = D.centre(_c); let minY = Infinity; for (let i = 0; i < D.n; i++) minY = Math.min(minY, D.x[i * 3 + 1]);
    const dx = spot.x - c.x, dy = spot.y + 0.01 - minY, dz = spot.z - c.z;
    for (let i = 0; i < D.n; i++) { D.x[i * 3] += dx; D.x[i * 3 + 1] += dy; D.x[i * 3 + 2] += dz; } D.v.fill(0);
  }
  stuff(dt) {
    const K = this.k, S = K.st || {}, D = this.dough, U = this.U, step = this.step;
    const tint = K.addin || S.addin, col = tint ? COLOR[INGREDIENTS[tint]?.from] : null;
    if (col != null) U.uTint.value.set(col); U.uTintK.value = col != null ? 0.18 : 0;
    if (step === 'choose' || step === 'knead') {
      const v = clamp(S.v || 0, 0, 1.05), over = v >= MOVES.knead.tells[3][0];
      D.set({ stiff: 0.06 + 0.3 * clamp(v), plastic: 2.4 - 1.9 * clamp(v), smooth: 0.9 * clamp(v - 0.2) });
      U.uFlour.value = clamp(1 - v * 1.3); U.uSatin.value = clamp((v - 0.45) / 0.3) * (over ? 0.5 : 1);
      const M = MOVES.knead, ph = ((S.beatT || 0) % M.beat) / M.beat, on = Math.pow(1 - Math.min(ph, 1 - ph) * 2, 4);
      this.pulse.position.set(D.centre(_c).x, 0.01, _c.z); this.pulse.material.opacity = step === 'knead' ? 0.15 + 0.6 * on + 0.4 * (S.flash || 0) : 0; this.pulse.scale.setScalar(1 + 0.1 * on);
    } else {
      this.pulse.material.opacity = 0;
      if (step === 'proof') { // (the rise grows the rest; the dough's elasticity is the poke's tell: quick, slow, or none, then the sigh)
        const v = K.lastProof ?? K.C?.proofValue?.() ?? 0, sink = v > 0.85 ? clamp((v - 0.85) / 0.15) : 0;
        D.scaleRest(1 + 0.27 * clamp(v / 0.5) - 0.18 * sink);
        D.set(v < 0.38 ? { stiff: 0.5, plastic: 0.2, smooth: 0.3 } : v < 0.62 ? { stiff: 0.06, plastic: 0.5, smooth: 0.3 } : { stiff: 0.02, plastic: 3, smooth: 0.1 });
        U.uFlour.value = 0.15; U.uSatin.value = 0.6;
      } else { // (the bake sets it; the crust browns)
        D.set({ stiff: 0.7, plastic: 0, smooth: 0 }); D.scaleRest(S.steamed ? 1.2 : 1.12);
        U.uBake.value = step === 'bake' ? clamp(S.v || 0, 0, 1.02) : clamp(S.lastBake ?? 0.7, 0, 1); U.uSteam.value = S.steamed ? 1 : 0; U.uFlour.value = 0.08;
      }
    }
  }

  // ------------------------------------------------------------------ the hand and the gestures
  ray(e) { const r = this.game.renderer.domElement.getBoundingClientRect(); _ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this.frame(); this.camera.updateMatrixWorld(); _ray.setFromCamera(_ndc, this.camera); return _ray; }
  /** Where the pointer meets the plane the dough stands on. */
  floorPoint(e, out) { const y = this.where(this.step) === 'oven' ? this.set.spots.oven.y : this.where(this.step) === 'bowl' ? this.set.spots.bowl.y + 0.2 : 0; _plane.constant = -y; return this.ray(e).ray.intersectPlane(_plane, out); }
  onWindow(e) { return !!e.target?.closest?.('#indexmenu .im'); }
  overDough(p) { const c = this.dough.centre(_c); return Math.hypot(p.x - c.x, p.z - c.z) < 0.6; }

  move(e) {
    if (!e || !this.active) return;
    this.pointer.x = e.clientX; this.pointer.y = e.clientY;
    if (this.onWindow(e) && !this.pointer.down) return;
    const p = this.floorPoint(e, _w); if (p) this.target = (this.target || new THREE.Vector3()).copy(p);
    const G = this.gesture; if (G?.kind === 'pinch') G.lift = clamp((this.pointer.y0 - e.clientY) / 160, 0, 1);
  }
  down(e) {
    if (!this.active || this.onWindow(e)) return;
    const p = this.floorPoint(e, _w); if (!p || !this.overDough(p)) return;
    e.preventDefault?.(); e.stopPropagation?.();
    Object.assign(this.pointer, { down: true, t0: performance.now(), x0: e.clientX, y0: e.clientY });
    this.target = (this.target || new THREE.Vector3()).copy(p);
    const step = this.step, R = this.hand?.rig;
    if (step === 'knead') { this.gesture = { kind: 'maybe', at: p.clone(), t: 0 }; }
    else if (step === 'proof') { this.gesture = { kind: 'poke', t: 0 }; R?.play('poke', { again: true }); }
    else if (step === 'bake') { this.gesture = { kind: 'knock', t: 0 }; R?.play('pat', { again: true }); this.k.tell?.(tellAt(MOVES.bake, this.k.st?.v ?? 0)); }
  }
  up(e) {
    if (!this.active || !this.pointer.down) return;
    this.pointer.down = false; const G = this.gesture, K = this.k, R = this.hand?.rig;
    if (!G) return;
    if (G.kind === 'push' || G.kind === 'maybe') { // (a push let go: the far side folds back over and the dough turns a quarter)
      if (G.kind === 'maybe') { this.beat(); }
      const c = this.dough.centre(_c), dir = G.dir || new THREE.Vector3(0, 0, -1);
      this.dough.impulse((i, x) => { const f = (x[0] - c.x) * dir.x + (x[2] - c.z) * dir.z; return f > 0.05 ? [-dir.x * 2.4 * f * 4, 2.6 * f * 3, -dir.z * 2.4 * f * 4] : null; });
      this.gesture = { kind: 'turn', t: 0, done: 0 }; R?.play('release', { again: true });
    } else if (G.kind === 'pinch') { // (let go of the stretched piece: the tell, by the gluten, said; it settles back)
      this.dough.drop(); K.stretched = 1.2; K.tell?.(tellAt(MOVES.knead, K.st?.v ?? 0)); this.gesture = null; R?.play('release', { again: true });
    } else if (G.kind !== 'turn') this.gesture = null;
  }
  /** The knead's press: judged by the window on its pulse (its `beat`), the hand's heel driven in. */
  beat() { const K = this.k; if (K.step === 'knead' && K.st) K.beat?.(); }

  updateHand(dt) {
    const H = this.hand, G = this.gesture, D = this.dough; if (!H) return;
    const tgt = this.target || this.handAt, c = D.centre(_c);
    let y = (this.where(this.step) === 'oven' ? this.set.spots.oven.y : this.where(this.step) === 'bowl' ? this.set.spots.bowl.y + 0.35 : 0) + S0.hover;
    let px = tgt.x, pz = tgt.z + 0.25;
    D.colliders.length = 0;
    if (G) {
      G.t += dt;
      if (G.kind === 'maybe') { // (a press: a quick one is a push; held still, a pinch)
        const moved = Math.hypot(this.pointer.x - this.pointer.x0, this.pointer.y - this.pointer.y0);
        if (moved > 14) { G.kind = 'push'; this.beat(); H.rig.play('press', { again: true }); }
        else if (G.t > S0.pinchHold) { const top = _v.set(c.x, c.y + 0.3, c.z); if (D.grab(top, 0.13)) { G.kind = 'pinch'; G.lift = 0; G.top = top.clone(); H.rig.play('pinch', { again: true }); } else { G.kind = 'push'; this.beat(); } }
      }
      if (G.kind === 'push') { // (the heel of the hand driven down and away through the dough)
        G.dir ||= new THREE.Vector3(tgt.x - c.x, 0, tgt.z - c.z).normalize(); if (!isFinite(G.dir.x)) G.dir.set(0, 0, -1);
        y = c.y + S0.press - 0.12; px = tgt.x; pz = tgt.z + 0.15;
        D.colliders.push({ c: new THREE.Vector3(px, y - 0.12, pz - 0.15), r: S0.palm + 0.08 });
      } else if (G.kind === 'pinch') { // (the piece drawn up between thumb and finger: the tear by the gluten)
        const lift = G.lift || 0, to = _v.copy(G.top).add(_w.set(0, lift * S0.pull, 0));
        D.drag(to); px = to.x; y = to.y + 0.12; pz = to.z + 0.2;
        const K = this.k, v = K.st?.v ?? 0, pane = MOVES.knead.tells[2][0];
        if (D.thinMax > (v < pane ? 0.45 + v : 1.6)) { D.drop(); this.gesture = null; H.rig.play('release', { again: true }); K.stretched = 1.2; K.tell?.(tellAt(MOVES.knead, v)); } // (torn: it snaps back)
      } else if (G.kind === 'poke') { // (a fingertip pressed in and drawn out: the dent left to the dough)
        const k = G.t < S0.poke ? G.t / S0.poke : Math.max(0, 1 - (G.t - S0.poke) / 0.15);
        const top = c.y + 0.32 * D.restScale; y = top + 0.32 - k * 0.2; px = c.x; pz = c.z + 0.18;
        D.colliders.push({ c: new THREE.Vector3(c.x, top + 0.04 - k * 0.14, c.z), r: S0.tip });
        if (G.t > S0.poke && !G.said) { G.said = true; this.k.poked = 1.2; this.k.tell?.(tellAt(MOVES.proof, this.k.lastProof ?? this.k.C?.proofValue?.() ?? 0)); }
        if (G.t > S0.poke + 0.3) this.gesture = null;
      } else if (G.kind === 'knock') { if (G.t > 0.4) this.gesture = null; y = c.y + 0.45; px = c.x; pz = c.z + 0.2; }
      else if (G.kind === 'turn') { const a = (Math.PI / 2) * Math.min(1, G.t / S0.foldTime), d = a - G.done; if (d > 0) { D.turn(d); G.done = a; } if (G.t > S0.foldTime) this.gesture = null; }
    }
    this.handAt.lerp(_v.set(px, y, pz), 1 - Math.exp(-14 * dt));
    H.root.position.copy(this.handAt);
    if (!G && H.rig.move !== 'idle' && H.rig.done !== false) H.rig.play('idle');
    H.rig.update(dt);
  }

  update(dt) {
    const K = this.k; if (!K?.step || !this.game.indexMenu?.open) { this.leave(); return; }
    if (K.step !== this.step) this.setStep(K.step);
    this.t += dt;
    this.stuff(dt); this.updateHand(dt); this.dough.step(dt); this.set.update(this.t);
    const cam = S0.cams[this.where(this.step)], kc = 1 - Math.exp(-4 * dt);
    this.camPos.lerp(_v.set(...cam[0]), kc); this.camLook.lerp(_w.set(...cam[1]), kc);
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
  }
}

export function installCookStage(game) { return (game.cookStage = new CookStage(game)); }
