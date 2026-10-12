// ---------------------------------------------------------------------------------------
// THE WARM-UP OF THE CASTER SHADERS S1 TO S5 (docs/plans/CASTER-SHELLS.md): one copy of each, parked 50 m under the world while main.js
// compiles every program, so none of them compiles in play (Petra's gate: perf's "compiled late" stays 0). Six programs, each a look's
// one: heat haze, the bubble, lightning, frost and bisque (rigid, and skinned: a skinned body needs the skinning variant), the portal.
// Their materials are module-wide and never disposed, so the programs live on after the copies are put away (the casebook's rules 17
// and 18: a program lives while a material that uses it does).
//
// Prior art: the warm-ups beside it in main.js (game.figmentTelegraphs.prewarm, crackPrewarm), the shader caches of every console engine
// (compile at load, never at first sight).
//
//   const park = prewarmCasterShadersS1toS5(scene)   (before renderer.compileAsync)   park()   (after the prime draw)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { prewarm as hazeWarm } from './heathaze.js';
import { prewarm as bubbleWarm } from './bubble.js';
import { prewarm as lightningWarm } from './lightning.js';
import { prewarm as skinWarm, FrostBisque } from './frostbisque.js';
import { prewarm as portalWarm } from './portal.js';
import { GROUND_Y } from './casterkit.js';

/** A body of one bone, so the skinned frost and bisque is compiled too. */
function skinnedWarm(scene) {
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3), n = geo.attributes.position.count;
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4), 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, i) => (i % 4 === 0 ? 1 : 0)), 4));
  const bone = new THREE.Bone(), body = new THREE.SkinnedMesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
  body.add(bone); body.bind(new THREE.Skeleton([bone])); body.position.set(0, GROUND_Y, 0); body.frustumCulled = false; scene.add(body);
  const F = new FrostBisque({ target: body, grow: 0.5 }); F.update(0);
  return () => { F.dispose(); body.parent?.remove(body); geo.dispose(); body.skeleton.dispose(); };
}

export function prewarmCasterShadersS1toS5(scene) {
  const parks = [hazeWarm(scene), bubbleWarm(scene), lightningWarm(scene), skinWarm(scene), skinnedWarm(scene), portalWarm(scene)];
  return () => parks.forEach((p) => p());
}
