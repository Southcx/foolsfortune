// ---------------------------------------------------------------------------------------
// A SHAPE LAYER: the library's procedural effect mesh (vfx/vfx.js's layer type 'shape'): an effect shape (vfx/shapes/forms.js) drawn in
// the one shape program (vfx/shapes/program.js) with a tiling pattern scrolled over it (vfx/shapes/textures.js), a mask and a flow,
// eroded through its pattern over its life and coloured from a ramp row (vfx/shapes/ramps.js) that cools as it dies. It is the hero of
// an effect where a sprite cannot be (a dome, a wall of light, a slash, a pillar), and its rings and trails beside the sprites. Its
// placement, scale, stretch, spin and fade (`k`) are vfx.js's, as for a mesh layer; this module makes it and moves its life.
//
// A layer's fields (all optional; a pattern or ramp name may be the caller's: 'motif' is ctx.feeling's paint motif, 'feeling', 'domain'
// and 'suit' are ctx's row, so one effect is skinned by whoever plays it):
//   form        an effect shape: ring band dome sphere cone disc quad beam spiral crescent pillar wave spikes ('ring')
//   ramp        a ramp row: a feeling, a domain, a suit, 'wild', film gold ember white ink tint, or 'feeling' / 'domain' / 'suit' ('tint')
//   main        the pattern scrolled over it: noise cells streaks ripple cracks dots marble frost curds rays stars script, 'motif', or
//               'none' (a solid shape: its edges, rim and ramp alone) ('noise')
//   tile [u, v] its repeats (whole numbers in u on a closed shape)   scroll [u, v] tiles a real second, + toward +u, +v ([0, 0.25])
//   mainK       how far the pattern cuts into the shape: 1 all of it, 0.5 a thin motif (cracks, streaks, frost) riding on a body (1)
//   mask        a second pattern multiplied in (none)   maskK as mainK (1)   maskTile [u, v] ([1, 1])   maskScroll [u, v] ([0, 0])
//   flow        a pattern that pushes the main's UVs about (none)   flowK its strength in tiles (0.08)   flowTile ([1, 1])   flowScroll ([0, 0.4])
//   erode       a curve over life ([[t, v], ...] or a number): 0 whole, 1 gone, rising through the pattern (a one-shot [[0, 0], [0.5, 0.06],
//               [1, 1]]; a held one 0)   soft  the cut's softness (0.12)
//   rampShift   a curve over life added to the read along the ramp: down to cool and clear as it dies (a one-shot [[0, 0.08], [1, -0.3]]; held 0)
//   rim, rimPow a fresnel: > 0 a shell lit at its edge, < 0 a volume soft there (the shape's own: a dome 0.6, a beam -0.7) (2.5)
//   edgeV, edgeU [a, b]  shares of v and u faded at each end (the shape's own)   core, coreAt  the hot heart (0.6, 0.8)
//   glow        the HDR lift the bloom catches (1.5)   add  1 additive (default) .. 0 alpha-over (smoke, ink, Dread)
//   tint        a colour multiplied in (vfx.js's colours): the caller's ('tint') on the tint ramp, white on every other (a feeling's
//               ramp is never stained by a tool's tint unless asked: tint: 'tint')
//   face        'ground' (stood as built, turned about the world's up), 'heading' (that, turned to the blow's heading on the ground),
//               'dir' (its axis stood along the blow, turned about it), 'camera' (a billboard) (the shape's own: a quad 'camera', a beam
//               and a crescent 'dir', a wave 'heading', the rest 'ground')
//   turn        'random' (a fresh yaw each play, so repeats never stamp) or radians (0)   seed [u, v] the patterns' offset (random each play)
//   order       renderOrder (6)
//   and vfx.js's: at, dur (Infinity held, with in, out and loop: a held layer's life runs 0..1 every `loop` real s), scale, stretch
//   ([x, y, z], each a number or a curve), offset (offsetScale: true puts it in ctx.scale, as a sprite's is: an aura's feet are its
//   creature's), rot, spin, k, kmul, powerScale
//
// Prior art: Riot's layering of a spell (League of Legends' VFX style guide: a primary shape that reads in silhouette, secondary
// support, tertiary ambience) and its "erode by a rising threshold"; FFXIV's .avfx (a model layer with its texture animation); Simon
// Trümpler's effect breakdowns (a mesh, a scrolling texture times a mask, a gradient map).
//
//   shapeLayer(game, L, ctx) -> { group, mesh, u, face, axis, turn, tintKey, k0, set(k), update(raw), life(t), dispose() }
//   shapeTintKey(L, ctx)  the colour vfx.js resolves for its tint     shapeWarmMesh()  one kept for the boot's warm-up (its program)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindTick } from '../labradorite.js';
import { shapeForm } from './forms.js';
import { patternPick } from './textures.js';
import { rampRow, rampV, RAMPS } from './ramps.js';
import { shapeUniforms, makeShapeMaterial } from './program.js';

/** A curve over life, as vfx.js reads one: [[t, v], ...] eased between its keys, or a number. */
function curve(c, t) {
  if (!Array.isArray(c)) return c ?? 0;
  if (t <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) if (t <= c[i][0]) { const [t0, v0] = c[i - 1], [t1, v1] = c[i], u = (t - t0) / Math.max(1e-6, t1 - t0); return v0 + (v1 - v0) * u * u * (3 - 2 * u); }
  return c[c.length - 1][1];
}
const ERODE = [[0, 0], [0.5, 0.06], [1, 1]], SHIFT = [[0, 0.08], [1, -0.3]];
const K_IN = [[0, 0.5], [0.06, 1], [1, 1]]; // (a one-shot's fade: in at once, out by its erosion; a held one's is vfx.js's in and out)
const set2 = (u, a, d) => u.value.set(...(a ?? d));

/** The colour a shape layer's tint resolves from (vfx.js color()): the caller's on the tint ramp, white on another, unless the layer
 *  names one. */
export function shapeTintKey(L, ctx = {}) { return L.tint ?? (rampRow(L.ramp ?? 'tint', ctx) === RAMPS.tint ? 'tint' : 'white'); }

export function shapeLayer(game, L = {}, ctx = {}) {
  const F = shapeForm(L.form), held = L.dur === Infinity;
  const main = L.main === undefined ? patternPick('noise') : patternPick(L.main, ctx), mask = L.mask ? patternPick(L.mask, ctx) : null, flow = L.flow ? patternPick(L.flow, ctx) : null;
  const u = shapeUniforms();
  if (main) { u.uMainMap.value = main.tex; u.uMainCh.value.copy(main.ch); u.uMainK.value = L.mainK ?? 1; } else u.uMainK.value = 0;
  if (mask) { u.uMaskMap.value = mask.tex; u.uMaskCh.value.copy(mask.ch); u.uMaskK.value = L.maskK ?? 1; }
  if (flow) { u.uFlowMap.value = flow.tex; u.uFlowCh.value.copy(flow.ch); u.uFlowK.value = L.flowK ?? 0.08; }
  set2(u.uTileMain, L.tile, [1, 1]); set2(u.uScrollMain, L.scroll, [0, 0.25]);
  set2(u.uTileMask, L.maskTile, [1, 1]); set2(u.uScrollMask, L.maskScroll, [0, 0]);
  set2(u.uTileFlow, L.flowTile, [1, 1]); set2(u.uScrollFlow, L.flowScroll, [0, 0.4]);
  set2(u.uSeed, L.seed, [Math.random(), Math.random()]); set2(u.uEdgeV, L.edgeV, F.edgeV); set2(u.uEdgeU, L.edgeU, F.edgeU);
  u.uRampRow.value = rampV(rampRow(L.ramp ?? 'tint', ctx));
  u.uRim.value = L.rim ?? F.rim; u.uRimPow.value = L.rimPow ?? 2.5; u.uSoft.value = L.soft ?? 0.12;
  u.uCore.value = L.core ?? 0.6; u.uCoreAt.value = L.coreAt ?? 0.8; u.uGlow.value = L.glow ?? 1.5; u.uAdd.value = L.add ?? 1;
  u.uTint.value.set(ctx.tint ?? 0xffffff);
  const erode = L.erode ?? (held ? 0 : ERODE), shift = L.rampShift ?? (held ? 0 : SHIFT);
  const mat = makeShapeMaterial(u);
  mat.depthTest = !ctx.throughWalls; // (a state, not a program: an effect seen through walls)
  const mesh = new THREE.Mesh(F.geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = L.order ?? 6; mesh.userData.moodExempt = true;
  const group = new THREE.Group(); group.add(mesh); group.visible = false; group.userData.moodExempt = true;
  game.scene?.add(group);
  const fx = {
    group, mesh, u, face: L.face ?? F.face, axis: F.axis, turn: L.turn === 'random' ? Math.random() * Math.PI * 2 : (L.turn ?? 0), tintKey: shapeTintKey(L, ctx), k0: held ? 1 : K_IN,
    set(k) { u.uK.value = Math.max(0, k); group.visible = k > 0.002; },
    update() { mindTick(); },
    life(t) { u.uErode.value = curve(erode, t); u.uRampShift.value = curve(shift, t); },
    dispose() { group.parent?.remove(group); mat.dispose(); }, // (the shape and the textures are shared: only the material is this layer's)
  };
  fx.life(0);
  return fx;
}

/** One shape kept for the boot's warm-up (boot/warmup.js), so the program is compiled on the loading screen and never released between
 *  two blows (the casebook's rules 17 and 18), and the patterns and the ramps are made there. It draws nothing (its k is 0). */
export function shapeWarmMesh() {
  const m = new THREE.Mesh(shapeForm('ring').geo, makeShapeMaterial(shapeUniforms()));
  m.renderOrder = 6; m.frustumCulled = false; m.userData.moodExempt = true;
  return m;
}
