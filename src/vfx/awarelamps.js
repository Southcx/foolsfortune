// ---------------------------------------------------------------------------------------
// THE AWARENESS LAMPS (plain name; South, 2026-11-22: "emulating the feel of Ape Escape 2 strongly in the hunting down and capturing of
// Figments. Stealth is going to become a big part of the identity of the Dreamvane"): while the Dreamvane's net is out
// (tools/dreamvane/net.js), a small glass lamp hangs over the head of each Figment the net could take within 25 m, lit by what its mind
// knows of the Courier (creatures/ai/memory.js `fact(courier).aware`, its watch `c.vigil.up`): green, unaware and head down (the net
// takes it); amber, its head up and scanning, or half aware (go still, or go round); red and flashing, it knows you (it will dodge: stun
// it first). A stunned one's lamp is green again whatever it knows. A world mark: no words.
//
// Prior art: Ape Escape's siren lamp on a monkey's helmet (green calm, yellow wary, red alarmed and flashing), Metal Gear Solid's "!"
// over a guard (here a lamp, not a word), Hitman's awareness meter.
//
//   game.awareLamps = new AwareLamps(game)   .update(raw) (the `fx` phase: boot/rooms.js)   AWARE_LAMP
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const AWARE_LAMP = { range: 25, size: 0.11, above: 0.35, max: 16, colours: { calm: 0x6dff8a, wary: 0xffc24a, alarm: 0xff4a3a }, wary: 0.2, alarm: 0.5 };
const _p = new THREE.Vector3();

export class AwareLamps {
  constructor(game) {
    this.game = game; this.pool = []; this.t = 0;
    const geo = new THREE.SphereGeometry(AWARE_LAMP.size, 10, 8), cap = new THREE.CylinderGeometry(AWARE_LAMP.size * 0.55, AWARE_LAMP.size * 0.7, AWARE_LAMP.size * 0.5, 8);
    const brass = new THREE.MeshBasicMaterial({ color: 0x8a6a2a });
    for (let i = 0; i < AWARE_LAMP.max; i++) {
      const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
      const glass = new THREE.Mesh(geo, mat); g.add(glass);
      const top = new THREE.Mesh(cap, brass); top.position.y = AWARE_LAMP.size * 0.9; g.add(top);
      const halo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(1.9); g.add(halo);
      g.visible = false; game.scene.add(g); this.pool.push({ g, mat, halo: halo.material });
    }
  }
  update(raw) {
    const g = this.game, net = g.dreamvane?.net, on = !!net && net.w > 0.5;
    this.t += raw;
    let n = 0;
    if (on) {
      const P = g.player, B = g.bound, A = AWARE_LAMP;
      for (const c of g.creatures?.near?.(P.pos, A.range) || []) {
        if (n >= this.pool.length) break;
        if (B && !B.catchable(c)) continue;
        const aware = c.brain?.memory?.fact?.(P)?.aware ?? 0, stunned = !!g.stun?.vulnerable?.(c);
        const state = stunned ? 'calm' : aware >= A.alarm ? 'alarm' : aware >= A.wary || c.vigil?.up ? 'wary' : 'calm';
        const L = this.pool[n++], col = A.colours[state];
        const hd = c.head?.(); if (hd?.isVector3) _p.copy(hd); else _p.copy(c.pos).setY(c.pos.y + (c.height || 0.8));
        L.g.position.set(_p.x, _p.y + A.above + Math.sin(this.t * 2 + n) * 0.03, _p.z);
        const blink = state === 'alarm' ? (Math.sin(this.t * 14) > 0 ? 1 : 0.35) : 1;
        L.mat.color.setHex(col).multiplyScalar(blink); L.halo.color.setHex(col); L.halo.opacity = 0.22 * blink;
        L.g.visible = true;
      }
    }
    for (let i = n; i < this.pool.length; i++) this.pool[i].g.visible = false;
  }
}
