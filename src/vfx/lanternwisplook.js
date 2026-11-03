// ---------------------------------------------------------------------------------------
// THE LANTERN WISP'S LOOK: how the Lantern Wisp (creatures/wisp/lanternwisp.js, the owner's model) shows what its body does. One job:
// the lantern's light, and what the cast, a blow taken and being put out look like. The body module carries them out; this only dresses.
//
//   THE LANTERN    its flame and glow (the model's LW_Flame and LW_Glow, cloned a wisp) flicker on their emissive whatever the light
//                  budget does; a plain PointLight on the lantern bone is lent by the budget (adopted at once, so it never counts as a
//                  light of its own: render/lightbudget.js). How it feels tints the flame: Angry hot and red, Scared pale and quick,
//                  Curious warm white, Sad low and blue (the pose the mind asks for: fight, flee, watch, rest / sleep).
//   THE CAST       the ball of its flame is an ember: a small white-gold core (the one mesh, so the parry mark's ink hull rings it and
//                  nothing else, as the slip jelly's spit and the lobber's do), a short hot tail, a halo and sparks shed behind it
//                  (`wisp.cast.flight`, held, following the ember until the body takes it out of the scene); `wisp.cast` at the lantern.
//   A BLOW TAKEN   the body's own flash: its clay's emissive washed warm white and gone in a fifth of a real second, the flame flaring
//                  with it (the slip jelly's `c.flash`, slipjelly.js; there is no shared helper, so the same number is read the same way).
//   PUT OUT        through the Death clip (1.6 s) the flame gutters, sputtering lower, and its light with it; as the clip ends and the
//                  model goes, `wisp.snuff`: the wick's smoke, its last embers and its Lachryma rising as motes.
//
//   ITS WATCH      its head up or down (`c.vigil.up`, progress/stealth.js; STEALTH.md 5): up, the lantern lifted (the body rising and
//                  tipping back with it), the flame flaring, the whole of it turning slowly side to side as it scans; down, it sinks a
//                  little and bows over the sand, its flame low. Only while it is about its own business (VIGIL_TELL.wisp.calm,
//                  vfx/stealthmarks.js); laid over the pose the body set this frame (`layered`), never built up.
//   AN AGATE       two feelings at once (G326; vfx/agatelook.js reads them): the flame stretched by the strength, its core in the
//                  strongest feeling's colour and its skin in the second's, the glass and the lamp warmed toward the strongest.
//   THE FUEL       `c.look.dim` (0..1, its share left) and `c.look.gutter` (0..1, how hard it sputters): set by a puzzle duel's secret drawing
//                  the lantern down (vfx/duelview/aberrants/wisp.js); 1 and 0 as made.
//
//   const look = new LanternWispLook(game)   look.dress(c) (at spawn)   look.bolt(from) -> the ember mesh (at release)   look.update(dt)
//
// Prior art: the guttering candle of every horror game (Amnesia's lantern oil running down: the light sputters before it goes), Dark
// Souls' Wisp and Zelda's Wizzrobe fireball (a bright core and a short tail, readable at range), Hollow Knight's hit flash (the body
// washed white for a few frames), the slip jelly's struck flash (creatures/jelly/slipjelly.js), and the light budget's proxies
// (render/lightbudget.js: the sixth generation's lent lamps). No new program: the ember is a MeshStandardMaterial (parked for the
// warm-up below), every other piece is the VFX library's sprites (vfx/library.js) or a uniform on the model's own materials.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { matteFrom } from './matte.js';
import { VIGIL_TELL, layered } from './stealthmarks.js';
import { agateFlameShader, AGATE_LOOK } from './agatelook.js';

/** Its numbers. light: colour, intensity, reach (m), decay; flicker: amounts of three slow sines; flash: how fast a blow's fades (/s);
 *  mood: per pose, the flame's tint and brightness, and how quick its flicker; ember: radius (m), colour. */
export const WISP_LOOK = {
  light: { color: 0xffa050, intensity: 5, distance: 7, decay: 1.6, up: 0.05 },
  flicker: [0.1, 0.06, 0.04],
  flash: 5, gutter: 1.6,
  mood: {
    idle: { tint: 0xffffff, k: 1, quick: 1 }, drift: { tint: 0xffffff, k: 1, quick: 1 },
    fight: { tint: 0xff7a50, k: 1.35, quick: 1.4 }, flee: { tint: 0xc8dcff, k: 0.85, quick: 2.2 },
    watch: { tint: 0xfff0c8, k: 1.1, quick: 0.8 }, rest: { tint: 0x8ca0ff, k: 0.6, quick: 0.6 }, sleep: { tint: 0x8ca0ff, k: 0.5, quick: 0.5 },
  },
  ember: { r: 0.1, color: 0xfff0c8, emissive: 0xffc070, emissiveIntensity: 4 },
};

const _c = new THREE.Color(), _p = new THREE.Vector3(), WHITE = new THREE.Color(1, 1, 1);

export class LanternWispLook {
  constructor(game) {
    this.game = game; this.t = 0; this.dressed = [];
    const E = WISP_LOOK.ember;
    this.emberGeo = new THREE.IcosahedronGeometry(E.r, 2);
    this.emberMat = new THREE.MeshStandardMaterial({ color: E.color, emissive: E.emissive, emissiveIntensity: E.emissiveIntensity, roughness: 0.5 });
    // one ember parked 50 m down for the boot's warm-up (main.js compiles every shown thing; a first cast must not compile it), hidden
    // at the first tick after (the casebook's rules 17 and 18)
    this.parked = this.ember(); this.parked.position.set(0, -50, 0); game.scene.add(this.parked);
  }

  /** One ember, as a mesh the body flies; the parry mark is put on it by the body. */
  ember() { const m = new THREE.Mesh(this.emberGeo, this.emberMat); m.userData.zoneFree = true; m.castShadow = false; return m; }

  /** A wisp's own materials and its lent light (at spawn). */
  dress(c) {
    const L = WISP_LOOK.light, mats = { body: [], flame: [], glow: [] };
    c.model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = matteFrom(o.material); // (its own, so one wisp's flash is not every wisp's; the same program. Lambert: the model's Physical has specular 0 and roughness 1, so it showed no gloss to pay for: vfx/matte.js)
      const n = o.material.name || '';
      const into = /Flame/i.test(n) ? mats.flame : /Glow/i.test(n) ? mats.glow : mats.body;
      into.push({ m: o.material, base: o.material.emissiveIntensity ?? 1, col: o.material.emissive.clone(), ag: into === mats.flame ? agateFlameShader(o.material) : null }); // (the flame cards' core and skin take an agate: vfx/agatelook.js)
    });
    const light = new THREE.PointLight(L.color, L.intensity, L.distance, L.decay);
    light.position.set(0, L.up, 0); c.lantern.add(light);
    this.game.lights?.adopt?.(light); // (lent by the budget at once: never counted by three.js as a light of its own)
    c.look = { mats, light, tint: new THREE.Color(1, 1, 1), k: 1, quick: 1, phase: c.id * 1.7, ph: 0, dying: false, flare: 0, flame: c.model.getObjectByName('flame_1'), fs: {} };
    this.dressed.push(c);
  }

  /** The cast leaving the lantern: its ember (the body flies it) and what follows it. */
  bolt(from) {
    const g = this.game, m = this.ember(); m.position.copy(from); g.scene.add(m);
    g.vfx?.play('wisp.cast', { pos: from });
    g.vfx?.play('wisp.cast.flight', { pos: from, follow: (h) => !!m.parent && (h.pos.copy(m.position), true) });
    return m;
  }

  update(dt) {
    if (this.parked) { this.parked.parent?.remove(this.parked); this.parked = null; }
    this.t += dt;
    for (const c of this.dressed) this.tick(c, dt);
  }

  tick(c, dt) {
    const S = c.look, W = WISP_LOOK, g = this.game;
    S.ag = g.agateLook?.state(c) ?? null; // (two feelings at once: the flame's height, its core and its skin, vfx/agatelook.js)
    this.agateFlame(c);
    // put out: the flame gutters through the clip, then the snuff as the model goes
    if (!c.alive) {
      if (c.dying != null) S.dying = true;
      else if (S.dying) { S.dying = false; c.lantern.getWorldPosition(_p); g.vfx?.play('wisp.snuff', { pos: _p.clone() }); }
      const left = c.dying != null ? Math.max(0, c.dying / W.gutter) : 0;
      const sputter = left > 0 ? 0.55 + 0.45 * Math.max(0, Math.sin(this.t * 11 + S.phase) * Math.sin(this.t * 4.3)) : 0;
      this.paint(c, left * left * sputter, 0);
      return;
    }
    // how it feels: the tint and the flicker's pace ease toward the pose's
    const M = W.mood[c.pose] || W.mood.idle, e = Math.min(1, dt * 3);
    S.tint.lerp(_c.set(M.tint), e); S.k += (M.k - S.k) * e; S.quick += (M.quick - S.quick) * e;
    S.ph += dt * S.quick * (1 + 1.5 * (S.gutter || 0));
    const f = W.flicker, t = S.ph + S.phase;
    const flick = 1 + f[0] * Math.sin(t * 7.3) + f[1] * Math.sin(t * 13.1 + 1.3) + f[2] * Math.sin(t * 23.7 + 2.1);
    // the lantern's fuel (a duel's secret drawing it down, vfx/duelview/aberrants/wisp.js): `dim` its share left, `gutter` how hard it sputters
    const gut = S.gutter || 0, sputter = 1 - gut * 0.6 * Math.max(0, Math.sin(this.t * 9 + S.phase) * Math.sin(this.t * 3.7 + S.phase * 2));
    // a blow taken: the body module sets c.flash to 1; it fades here
    c.flash = Math.max(0, (c.flash || 0) - dt * W.flash);
    this.paint(c, S.k * flick * (S.dim ?? 1) * sputter * (1 + c.flash * 0.8) * this.vigil(c, dt), c.flash);
  }

  /** Its watch on the body (STEALTH.md 5): the lift, the tip and the scan laid over the root the body placed this frame; returns the
   *  flame's share (flaring up, low down). */
  vigil(c, dt) {
    const V = VIGIL_TELL.wisp, S = c.look; if (!c.vigil || c.taking || c.stashed || c.dueling) return 1;
    const T = S.vig || (S.vig = { k: 0, up: 0 }), calm = V.calm.includes(c.pose) && !c.attack && !(c.once > 0), e = Math.min(1, dt * V.ease);
    T.k += ((calm ? 1 : 0) - T.k) * e; T.up += ((c.vigil.up ? 1 : 0) - T.up) * e;
    if (T.k < 0.01) return 1;
    const up = T.up * T.k, down = (1 - T.up) * T.k, t = this.t + S.phase;
    c.root.position.y = layered(T, 'y', c.root.position.y, V.up.lift * up - V.down.sink * down);
    c.root.rotation.x = layered(T, 'x', c.root.rotation.x, V.up.tip * up + V.down.bow * down);
    c.root.rotation.y = layered(T, 'yaw', c.root.rotation.y, Math.sin(t * V.up.scanHz * Math.PI * 2) * V.up.scan * up);
    return 1 + V.up.flare * up - (1 - V.down.dim) * down;
  }

  /** The agate's flame (G326, WHEEL.md 3): its bones stretched by the strength, laid over the pose the mixer set this frame (`layered`
   *  on the scale's own value, so a frame the mixer skipped is never stretched twice). */
  agateFlame(c) {
    const S = c.look, b = S.flame; if (!b) return;
    const A = S.ag, F = AGATE_LOOK.flame, w = A ? A.w : 0;
    const hy = 1 + ((A ? A.h : 1) - 1) * w, wx = 1 + ((F.w[0] + (F.w[1] - F.w[0]) * (A?.k ?? 0)) - 1) * w;
    for (const [ax, m] of [['x', wx], ['y', hy], ['z', wx]]) {
      const st = S.fs[ax] || (S.fs[ax] = { out: NaN, base: 1 }), cur = b.scale[ax], base = cur === st.out ? st.base : cur;
      st.base = base; st.out = base * m; b.scale[ax] = st.out;
    }
  }

  /** The flame and glow at `k` (1 its own), the light with them, and the clay's flash at `flash` (0..1); an agate's core and skin over
   *  the flame cards, its strongest feeling warming the glass and the lamp. */
  paint(c, k, flash) {
    const S = c.look, L = WISP_LOOK.light, A = S.ag, w = A ? A.w : 0;
    const tint = w > 0 ? _c.copy(S.tint).lerp(WHITE, w) : S.tint; // (an agate's colours are its own: the pose's tint stood aside)
    for (const x of S.mats.flame) {
      x.m.emissiveIntensity = x.base * k; x.m.emissive.copy(x.col).multiply(tint);
      if (x.ag) { x.ag.uAgW.value = w; if (A) { x.ag.uAgCore.value.copy(A.core); x.ag.uAgSkin.value.copy(A.skin); } }
    }
    for (const x of S.mats.glow) { x.m.emissiveIntensity = x.base * (0.4 + 0.6 * k); x.m.emissive.copy(x.col).multiply(tint); if (A) x.m.emissive.lerp(A.core, 0.6 * w); }
    for (const x of S.mats.body) x.m.emissive.setRGB(flash * 0.8, flash * 0.62, flash * 0.42);
    S.light.intensity = L.intensity * k; S.light.color.set(L.color).multiply(tint); if (A) S.light.color.lerp(A.core, AGATE_LOOK.flame.light * w);
  }
}
