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

export async function bootRenderer(made) {
  const { save } = made;
  const machine = detectMachine(), graphicsTier = applyBootTier(machine); // (the quality tier, read from the machine before anything is built: render/graphics.js)
  installTheme(save); // (the windows' look, the faces, the glove: ui/theme.js)
  installToon(T.visual.toon ?? 1); // (the soft cel ramp on every lit material, before anything compiles: render/toon.js)
  await fontsReady();
  const renderer = new THREE.WebGLRenderer({ antialias: T.visual.antialias !== false, powerPreference: 'high-performance' });
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
