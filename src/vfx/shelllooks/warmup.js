// ---------------------------------------------------------------------------------------
// THE WARM-UP OF WHAT THE CASTER SHELLS SHOW IN PLAY (main.js's warm-up; Petra's gate: nothing compiles in play). Fired twice each near
// slip jellies, the shells still compiled programs late, and each was a material made, used once and disposed, so its program was
// released and built again the next time (the casebook's rules 17 and 18: a program lives while a material that uses it does):
//   - the effect meshes (vfx/meshfx.js: the shells' rings and pillars, `chest_shock`, `ult_pillar`): one copy of each baked mesh kept;
//   - a glyph pop (vfx/glyphs.js: Paranoia's question marks, Lullaby's notes): one sprite kept;
//   - a bauble's oxidised Lachryma (vfx/oxidation.js: Grief's weeping drops): one kept;
//   - a psychic pulse (vfx/pulse.js: Wonder's reveal, Twelve's, Calm's): one taken out of its list, so it is never dropped;
//   - the Portal's view (vfx/caster/portal.js): its pair's first look out drawn now, into its own target, so what that draw compiles
//     is compiled on the loading screen.
// Kept 50 m under the world, hidden after the prime and never disposed.
//
// Prior art: the warm-ups beside it in main.js (vfx/caster/warmups1tos5.js, crackPrewarm), the shader caches of every console engine.
//
//   const park = await prewarmShellLooks(game)   (before renderer.compileAsync)   park()   (after the prime draw)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { meshFx } from '../meshfx.js';
import { oxidationMaterial } from '../oxidation.js';
import { Portal } from '../caster/portal.js';
import { GROUND_Y } from '../caster/casterkit.js';

export async function prewarmShellLooks(game) {
  const { scene, renderer } = game, kept = [];
  await meshFx.load(); // (begun by the effects at boot: done by now, as a rule)
  const keep = (o) => { o.position.set(0, GROUND_Y, 0); o.frustumCulled = false; o.userData.zoneFree = true; o.visible = true; scene.add(o); kept.push(o); };
  for (const name of Object.keys(meshFx.src)) { const fx = meshFx.make(name); fx.set(0.01); fx.mesh.frustumCulled = false; keep(fx.group); }
  const dot = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 4, height: 4 }));
  keep(new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, transparent: true, depthWrite: false, fog: false })));
  keep(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), oxidationMaterial(0)));
  const pulse = game.pulse?.emit?.(new THREE.Vector3(0, GROUND_Y, 0), 1);
  if (pulse) { game.pulse.pulses.splice(game.pulse.pulses.indexOf(pulse), 1); keep(pulse.shell); keep(pulse.ring); }
  // the Portal pair: one look out of each, drawn now (the scene's programs as the portal's target draws them), then put away
  try {
    const a = new Portal({ mode: 'portal' }), b = new Portal({ mode: 'portal' });
    a.object.position.set(0, GROUND_Y, 0); b.object.position.set(2, GROUND_Y, 0); scene.add(a.object, b.object);
    a.link(b); if (renderer) { a.refresh(renderer, scene); b.refresh(renderer, scene); }
    a.dispose(); b.dispose();
  } catch (e) { console.warn('shell looks warm-up: portal', e); }
  return () => { for (const o of kept) o.visible = false; };
}
