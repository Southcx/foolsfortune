// ---------------------------------------------------------------------------------------
// THE MIRAGE: a Courier of smoke, put up where they stood by the Crucibelle's SONG OF SEEMING. It is a DECOY (creatures/ai/index.js `decoys`, read
// by every mind's watch list: creatures/ai/brain.js): a creature that sees it takes it for them, and hunts it; struck, it comes apart into smoke.
// It is drawn as smoke would be in their shape: a column, a head, shoulders, all of one violet that breathes, and smoke rising off it.
//
// Prior art: the decoys of the stealth game (Metal Gear's, Dishonored's Shadow Walk), the illusions of the bard and the enchanter
// (Mirror Image, Silent Image), and Patapon's and Pikmin's lesson that a thing seen is what a mind goes to.
//
//   game.mirage.raise(pos, secs, power) -> decoy      .update(dt)      decoy.struck() (a blow lands on it: it is gone)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/crucibelle/mirage'); // (the simulation's chance: core/rng.js, the same twice)

export class Mirages {
  constructor(game) {
    this.game = game; this.list = [];
    this.mat = new THREE.MeshStandardMaterial({ color: 0x8f7fc0, emissive: 0x3a2a6a, emissiveIntensity: 0.8, transparent: true, opacity: 0.5, depthWrite: false, roughness: 1, flatShading: true });
    const body = new THREE.CylinderGeometry(0.22, 0.3, 1.1, 8).translate(0, 0.75, 0);
    const chest = new THREE.CylinderGeometry(0.3, 0.22, 0.35, 8).translate(0, 1.4, 0);
    const head = new THREE.IcosahedronGeometry(0.17, 1).translate(0, 1.72, 0);
    this.parts = [body, chest, head];
  }
  raise(pos, secs = 8, power = 1) {
    const g = this.game, grp = new THREE.Group();
    for (const p of this.parts) grp.add(new THREE.Mesh(p, this.mat));
    grp.position.copy(pos);
    g.scene.add(grp);
    const d = { type: 'player', kind: 'courier', decoy: true, pos: grp.position, vel: new THREE.Vector3(), alive: true, loud: 1.6 + 0.4 * power, height: 1.7, t: secs, max: secs, grp, beat: 0,
      struck: () => { d.t = Math.min(d.t, 0.01); } };
    this.list.push(d);
    g.ai?.decoys.push(d);
    g.events?.emit('mirage.raise', { secs: Math.round(secs) });
    return d;
  }
  update(dt) {
    const g = this.game;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const d = this.list[i];
      d.t -= dt; d.beat -= dt;
      const k = Math.min(1, d.t / 0.6, (d.max - d.t) / 0.4);
      d.grp.scale.set(1, Math.max(0.01, k), 1);
      d.grp.rotation.y += dt * 0.6;
      // it calls attention to itself, as they would (a footstep, a breath)
      if (d.beat <= 0) { d.beat = 0.9; g.ai?.stimuli.emit('noise', d.pos, { radius: 16, strength: 0.6, by: 'courier', source: d, ttl: 1 }); }
      if (g.fx?.alpha?.emit && simRand() < dt * 14) g.fx.alpha.emit({ pos: d.pos.clone().add(new THREE.Vector3((simRand() - 0.5) * 0.5, 0.3 + simRand() * 1.5, (simRand() - 0.5) * 0.5)), vel: new THREE.Vector3(0, 0.6 + simRand(), 0), life: 1.2, size: 0.15, sizeEnd: 0.5, color: new THREE.Color(0x8f7fc0), alpha: 0.35, drag: 1, gravity: -0.3 });
      if (d.t <= 0) {
        d.alive = false; g.scene.remove(d.grp);
        const j = g.ai?.decoys.indexOf(d); if (j >= 0) g.ai.decoys.splice(j, 1);
        this.list.splice(i, 1);
        if (g.fx?.alpha?.emit) for (let n = 0; n < 24; n++) g.fx.alpha.emit({ pos: d.pos.clone().setY(d.pos.y + 0.4 + simRand() * 1.3), vel: new THREE.Vector3((simRand() - 0.5) * 2, simRand() * 1.5, (simRand() - 0.5) * 2), life: 1.4, size: 0.2, sizeEnd: 0.7, color: new THREE.Color(0x8f7fc0), alpha: 0.4, drag: 1.3, gravity: -0.4 });
        g.events?.emit('mirage.fade', {});
      }
    }
  }
}
