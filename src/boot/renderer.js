// ---------------------------------------------------------------------------------------
// BOOT RENDERER: the renderer and the presentation, in two stages. `bootRenderer` is the second stage of the boot: the graphics tier read
// from the machine, the window colour and the toon ramp, the fonts, then the WebGL renderer, the scene with its fog, hemisphere and
// ambient light, the camera and the sun with its one shadow. `bootPresentation` comes after the achievements are built: the light budget
// (every lamp in the world, lit eight at a time), the presentation (480 lines scaled up, smooth shading, one shadow) and the graphics
// tier's rates.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootRenderer(made) -> { machine, graphicsTier, renderer, scene, camera, hemi, amb, sun }
//   bootPresentation(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { LightBudget } from '../render/lightbudget.js';
import { Presentation } from '../render/present.js';
import { Graphics, detectMachine, applyBootTier, shadowTypeOf } from '../render/graphics.js';
import { installTheme, fontsReady } from '../ui/theme.js';
import { installToon } from '../render/toon.js';
import { installShadowKinds } from '../render/shadowkinds.js';

/** The ways a context is asked for, in order: the game's own, then plain (the owner's iPhone, 2026-10-25, handed back a context already
 *  lost, and three.js read a null precision from it); `wait` real ms for a lost one to be restored before the next way is tried. */
export const CONTEXT_TRIES = [
  { antialias: true, powerPreference: 'high-performance' },
  { antialias: false, powerPreference: 'default' },
  { antialias: false, powerPreference: 'low-power' },
];
const CONTEXT_WAIT = 1500;

/** A WebGL2 context that is alive, on a canvas of its own: each way tried, a lost one given `CONTEXT_WAIT` to be restored; refused by
 *  all, an error that says what each way gave, so a phone's screenshot names it. */
async function liveContext(aa) {
  const seen = [];
  for (const want of CONTEXT_TRIES) {
    if (want.antialias && !aa) continue;
    const canvas = document.createElement('canvas');
    let gl = null;
    try { gl = canvas.getContext('webgl2', { ...want, alpha: false, stencil: false, depth: true }); } catch (e) { seen.push(`${want.powerPreference}: threw ${e.message}`); continue; }
    if (!gl) { seen.push(`${want.powerPreference}${want.antialias ? '+aa' : ''}: none`); continue; }
    if (gl.isContextLost()) {
      const back = await new Promise((done) => { const t = setTimeout(() => done(false), CONTEXT_WAIT); canvas.addEventListener('webglcontextrestored', () => { clearTimeout(t); done(true); }, { once: true }); canvas.addEventListener('webglcontextlost', (e) => e.preventDefault(), { once: true }); });
      if (!back || gl.isContextLost()) { seen.push(`${want.powerPreference}${want.antialias ? '+aa' : ''}: lost`); continue; }
    }
    if (seen.length) console.warn('webgl: took', want, 'after', seen.join('; '));
    return { canvas, context: gl };
  }
  throw new Error(`no live WebGL2 context (${seen.join('; ')}); the browser may have turned WebGL off for this page after a crash: close the tab, open it again`);
}

export async function bootRenderer(made) {
  const { save } = made;
  const machine = detectMachine(), graphicsTier = applyBootTier(machine); // (the quality tier, read from the machine before anything is built: render/graphics.js)
  installTheme(save); // (the windows' look, the faces, the glove: ui/theme.js)
  installToon(T.visual.toon ?? 1); // (the soft cel ramp on every lit material, before anything compiles: render/toon.js)
  await fontsReady();
  const { canvas, context } = await liveContext(T.visual.antialias !== false);
  const renderer = new THREE.WebGLRenderer({ canvas, context });
  renderer.debug.checkShaderErrors = !import.meta.env.PROD; // (the published build does not wait on each program's link log: a stall per program on a slow driver; the dev server still checks)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = T.visual.shadows;
  renderer.shadowMap.type = shadowTypeOf(T.visual.shadowFilter); // (filtered, not softened: a console's one shadow, see render/present.js; the low tiers' unfiltered, render/graphics.js)
  installShadowKinds(); // (one depth material a kind of caster, so the shadow pass keeps its programs: render/shadowkinds.js)
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = T.visual.exposure;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.deep);
  scene.fog = new THREE.FogExp2(PALETTE.deep, T.visual.fog);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.03, 200);

  const hemi = new THREE.HemisphereLight(0xffe4cc, 0x6f3726, 2.3);
  const amb = new THREE.AmbientLight(0xffd0b0, 0.35);
  scene.add(hemi, amb);
  const sun = new THREE.DirectionalLight(0xffe8d2, T.visual.sun);
  // steep sun through the skylights: lights the upper floor and drops a shaft
  // down the atrium onto the ground floor
  sun.position.set(4, 30, -5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(T.visual.shadowRes || 1024, T.visual.shadowRes || 1024);
  const sc = sun.shadow.camera;
  sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 5; sc.far = 50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  return { machine, graphicsTier, renderer, scene, camera, hemi, amb, sun };
}

export function bootPresentation(game, made) {
  const { machine, graphicsTier, renderer, camera, sun } = made;
  game.lights = new LightBudget(game, { slots: T.visual.lightSlots ?? 8 }); // (every lamp in the world, lit eight at a time: render/lightbudget.js)
  game.present = new Presentation(game, { renderer, sun }); // (480 lines, scaled up; smooth shading; one shadow: render/present.js)
  game.graphics = new Graphics(game, { renderer, camera, tier: graphicsTier, machine }); // (the tier's shadow rate, dynamic resolution, the outline hulls' reach: render/graphics.js)
  game.present.apply();
}
