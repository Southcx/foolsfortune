// ---------------------------------------------------------------------------------------
// A WEIR FISH'S BODY: one species' shape (fishbodies.js, merged on the fish kit, fishgeometry.js) in its feeling's colour, swum and posed.
// Refired for the catch (docs/plans/ANGLING.md section 3, "The fish, made worth holding up"): it holds up a metre from the camera, with a
// silhouette of a real family, a wet sheen, an eye with its highlight and fins that move; and its fatigue is its body (section 2): the
// tail beats at `0.5 + 0.5 x stamina` of its rate, under a third it rides higher and rolls, spent it lies on its flank. One mesh and one
// draw a fish, the swim done on the GPU (vfx/fishlook.js: one program for every species); the geometry is shared by every copy.
// Under the Weir it is a little see-through and haloed, as it always was (the water shows a shadow with a colour at its centre); held,
// it is solid.
//
// Prior art: Animal Crossing's catch held up in both hands (a wriggle in bursts, the body curling one way then the other, the tail
// slapping, the fins flared, then a still beat); Sega Bass Fishing's and Twilight Princess's tired fish rolling to show its flank; real
// fish, which beat slower as they tire and turn on their side when spent.
//   const m = buildFish(species, sizeCm)    m.group (nose toward +X, up +Y; the caller places and turns it)    m.length (metres)
//   m.swim(dt, speed, turn)                 the motion, every frame (speed in body lengths a second, roughly; turn: the bend into a turn)
//   m.glow(0..1)                            the halo and the skin's own light (aware, sounded, hooked)
//   m.setStamina(0..1)                      the fight's stamina: the beat's rate, and under a third the ride and the roll
//   m.setPose('swim' | 'flank' | 'held')    eased over about a quarter of a real second; 'held' wriggles in two hands (the catch)
//   m.pose  m.phase                         the pose asked for; the tail's beat (radians)        m.dispose()   (its material; the shared geometry stays)
//   prewarmFish()                           a parked body, so the one program is compiled at boot (main.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../../core/rng.js';
import { COLOR } from '../../../progress/weather.js';
import { ASPECTS } from './species.js';
import { fishBody, LEGEND_BANDS } from './fishbodies.js';
import { fishMaterial } from '../../../vfx/fishlook.js';
const simRand = stream('tools/sondelass/angling/fishmesh'); // (the simulation's chance: core/rng.js, the same twice)

let HALO = null;
/** The soft round sprite texture the halos use (fx.haloTexture); set once by the Weir. */
export const setHaloTexture = (t) => { HALO = t; };

/** A species' feeling: the aspect that draws it most (species.js aff, in ASPECTS' order); the legend answers to five, and has none. */
export function feelingOf(sp) {
  if (sp.legend) return null;
  let best = 0;
  for (let i = 1; i < sp.aff.length; i++) if (sp.aff[i] > sp.aff[best]) best = i;
  return ASPECTS[best].id;
}

const POSES = ['swim', 'flank', 'held'];
const ss = THREE.MathUtils.smoothstep;
const _p = new THREE.Vector3(), _c = new THREE.Vector3();
const WHITE = new THREE.Color(1, 1, 1);

export function buildFish(sp, cm) {
  const feeling = feelingOf(sp);
  const bands = feeling ? null : LEGEND_BANDS.map((id) => new THREE.Color(COLOR[id]));
  const feel = feeling ? new THREE.Color(COLOR[feeling]) : bands[0];
  const body = fishBody(sp.body, feel, bands), M = body.motion;
  const L = (cm / 100) * (M.len || 1); // metres
  const group = new THREE.Group(), pose = new THREE.Group();
  const mat = fishMaterial(feel.clone().lerp(WHITE, 0.3)), U = mat.userData.u;
  U.uWl.value = M.wl; U.uScaleN.value = M.scaleN || 30;
  const mesh = new THREE.Mesh(body.geo, mat);
  mesh.scale.setScalar(L);
  pose.add(mesh); group.add(pose);
  let crackBase = 0.9;
  if (body.crackW) { // (a crack fades as it gets thinner than a pixel where it is drawn: the main view's 480 lines, a portrait's own)
    mesh.onBeforeRender = (ren, sc, cam) => {
      mesh.getWorldPosition(_p); _c.setFromMatrixPosition(cam.matrixWorld);
      const H = ren.getRenderTarget()?.height || ren.domElement.height || 480;
      const px = (body.crackW * mesh.matrixWorld.getMaxScaleOnAxis() * H) / (2 * Math.max(0.05, _p.distanceTo(_c)) * Math.tan(THREE.MathUtils.degToRad((cam.fov || 50) / 2)));
      U.uCrack.value = crackBase * THREE.MathUtils.clamp((px - 0.6) / 1.2, 0, 1);
    };
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO, color: feel, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(Math.max(0.5, L * 1.6));
  group.add(halo);

  let phase = simRand() * 6.28, finPhase = phase, wrig = simRand() * 2, t = 0, stamina = 1, glowK = 0, asked = 'swim';
  const w = { swim: 1, flank: 0, held: 0 };
  const api = {
    group, length: L, halo, lantern: null, head: { position: new THREE.Vector3(L * 0.5, 0, 0) }, mesh,
    get pose() { return asked; },
    get phase() { return phase; }, // (the tail's beat, radians: the line's core pulses with it, angler.js)
    setPose(p) { if (POSES.includes(p)) asked = p; },
    setStamina(k) { stamina = THREE.MathUtils.clamp(k, 0, 1); },
    swim(dt, speed = 0.5, turn = 0) {
      t += dt;
      for (const p of POSES) w[p] = THREE.MathUtils.damp(w[p], p === asked ? 1 : 0, asked === 'held' ? 9 : 6, dt);
      const s = stamina, low = 1 - ss(s, 0, 1 / 3), beat = 0.5 + 0.5 * s; // (the stamina law: ANGLING.md section 2)
      // the swim: the old sweep's rate and reach, slowed by fatigue
      const rateSwim = M.freq * (0.35 + Math.min(2.2, speed * 0.7)) * beat, ampSwim = M.amp * (0.55 + Math.min(1, speed * 0.3)) * (1 - 0.35 * low);
      // on the flank: a slow, weak beat
      const rateFlank = M.freq * 0.3 * beat, ampFlank = M.amp * 0.35;
      // held up: a wriggle in bursts, curling one way then the other, then a still beat
      wrig += dt;
      const tb = wrig % 1.25, env = tb < 0.62 ? Math.sin((Math.PI * tb) / 0.62) ** 2 : 0;
      const rateHeld = M.freq * (0.8 + 1.8 * env), ampHeld = Math.min(0.16, M.amp * (0.5 + 2.4 * env)), curl = 0.12 * Math.sin(wrig * 5.2) * env;
      const rate = w.swim * rateSwim + w.flank * rateFlank + w.held * rateHeld;
      phase += dt * rate; finPhase += dt * rate * M.finRate;
      U.uPhase.value = phase; U.uFinPhase.value = finPhase;
      U.uAmp.value = w.swim * ampSwim + w.flank * ampFlank + w.held * ampHeld;
      U.uCurl.value = w.swim * turn * 0.05 + w.held * curl;
      U.uFinAmp.value = M.fin * (w.swim * (0.7 + 0.3 * Math.min(1, speed)) * (0.6 + 0.4 * s) + w.flank * 0.3 + w.held * (1.3 + env));
      // the body's carriage: tired, it rides higher and rolls; spent, on its side; held, a jolt with each burst
      pose.rotation.x = w.swim * low * (0.25 + 0.35 * Math.sin(t * 1.6)) + w.flank * Math.PI * 0.47 + w.held * 0.12 * Math.sin(wrig * 13) * env;
      pose.rotation.z = w.held * 0.14 * Math.sin(wrig * 9) * env;
      pose.position.y = w.swim * low * 0.12 * L;
      // its light: see-through and haloed in the water, solid in the hands
      U.uOpacity.value = Math.max(0.62 + 0.33 * glowK, w.held);
      U.uGlow.value = glowK * 0.6 * (1 - 0.6 * w.held);
      halo.material.opacity = (0.05 + 0.5 * glowK) * (1 - 0.85 * w.held);
    },
    glow(k) {
      glowK = k;
      crackBase = 0.7 + 0.3 * k; // (the cracks flare as it is roused)
    },
    dispose() { mat.dispose(); halo.material.dispose(); },
  };
  api.swim(0, 0.3, 0);
  return api;
}

/** A body parked for the boot's shader warm-up: the one program every fish is drawn with (main.js parks it 50 m down, never disposed). */
export function prewarmFish() {
  const sp = { body: 'minnow', aff: [0, 0, 0, 0, 1], legend: false };
  return buildFish(sp, 20).mesh;
}
