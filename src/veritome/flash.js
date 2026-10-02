// ---------------------------------------------------------------------------------------
// THE FLASH: the Veritome's lens, fired as a light (1, with the book out; it is not the shutter, and takes no picture). A cone of white
// light leaps from the lens: everything with eyes in it is dazzled (it sees nothing for a moment, and a wind-up in progress breaks
// off), and its STUN meter fills (stun.js), more the nearer it is and the nearer the middle of the light; enough flashes and it goes
// down, stars round its head, and its mind lies open: walk up to it and press the middle button to REPROGRAM it (reprogram.js). With
// the lens raised (RMB) the light is a narrower, longer beam. It costs Lachryma, and the lens needs a moment between flashes.
//
// Prior art: the camera flash that stuns, from Fatal Frame's Camera Obscura (a full-charge shot that knocks a ghost back) and Luigi's
// Mansion's Strobulb (stun, then act), to the flashbang of the tactical shooter; and the "stun meter" of Monster Hunter's flash pods,
// which fill a monster's tolerance and knock it out of the sky.
//
//   game.flash.fire()   game.flash.ready   (main.js calls update every frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { hasTag } from '../tags.js';
import { sfx } from '../audio.js';

export const FLASH = { cost: 6, cool: 1.1, range: 10, half: 34, lensRange: 15, lensHalf: 17, stun: 0.75, dazzle: 1.4 };
const DEG = Math.PI / 180;
const _e = new THREE.Vector3(), _f = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();

export class Flash {
  constructor(game) {
    this.game = game;
    this.cool = 0;
    // the light itself: a cone of brightness from the lens that fades in a fifth of a second (one burst: no flicker)
    const geo = new THREE.ConeGeometry(1, 1, 24, 1, true); geo.translate(0, -0.5, 0); geo.rotateX(-Math.PI / 2);
    this.cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff4e6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    this.cone.visible = false; this.cone.renderOrder = 9; this.cone.frustumCulled = false;
    game.scene.add(this.cone);
    this.k = 0;
  }
  get ready() { return this.cool <= 0; }
  get tome() { return this.game.techs?.get?.('veritome'); }

  update(rawDt) {
    const g = this.game, V = this.tome, inp = g.input;
    this.cool = Math.max(0, this.cool - rawDt);
    if (this.k > 0) {
      this.k = Math.max(0, this.k - rawDt * 5);
      this.cone.material.opacity = 0.35 * this.k * this.k;
      this.cone.visible = this.k > 0.01;
    }
    if (V && V.drawT > 0.6 && inp?.enabled && inp.wasPressed('Digit1') && !g.reprogram?.open && !g.god?.controlling) this.fire();
  }

  fire() {
    const g = this.game, V = this.tome;
    if (!this.ready) return false;
    if (!g.lachryma.spend(FLASH.cost, 'flash')) {
      g.log?.say('warn', 'There is not enough Lachryma in you to light the lens.', { key: 'flashnone', throttle: 3 });
      sfx.fizzle?.();
      return false;
    }
    this.cool = FLASH.cool;
    const lens = !!V?.lens, range = lens ? FLASH.lensRange : FLASH.range, half = (lens ? FLASH.lensHalf : FLASH.half) * DEG;
    const cam = g.camera; cam.getWorldPosition(_e); cam.getWorldDirection(_f);
    // the light, from the lens (or the eye, in first person)
    const from = V?.model?.lensWorld ? V.model.lensWorld(new THREE.Vector3()) : _e.clone();
    if (!Number.isFinite(from.x) || from.distanceTo(_e) > 4) from.copy(_e);
    this.cone.position.copy(from);
    this.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), _f);
    this.cone.scale.set(Math.tan(half) * range, Math.tan(half) * range, range);
    this.k = 1; this.cone.visible = true;
    const L = g.fx?.flashLight; // (the muzzle's light, borrowed for a tenth of a second, white, and given back its colour)
    if (L) { L.position.copy(from); L.color.setHex(0xfff4e6); g.fx.flashT = 0.1; g.fx.after?.(0.2, () => L.color.setHex(0xffb27a)); }
    sfx.shutter?.(); sfx.lensUp?.();
    g.ai?.stimuli.emit('light', from, { radius: range * 1.4, strength: 1, by: 'courier', source: g.player });
    // who is in it
    let hits = 0, downs = 0;
    const targets = [...(g.creatures?.list || []), ...(g.clappers?.list || [])];
    for (const t of targets) {
      if (!t.alive || t.ally) continue;
      const p = t.type === 'creature' ? t.center(_p) : _p.copy(t.pos).setY(t.pos.y + 0.4);
      _d.copy(p).sub(_e); const d = _d.length();
      if (d > range || d < 0.3) continue;
      const ang = _d.angleTo(_f);
      if (ang > half) continue;
      const hit = g.physics.raycast(_e, _d.clone().normalize(), d - 0.4, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type);
      if (hit) continue;
      hits++;
      const amount = FLASH.stun * Math.sqrt(1 - d / range) * (1 - 0.5 * (ang / half)) * (lens ? 1.25 : 1);
      if (t.type === 'creature') {
        t.brain?.senses?.dazzle(FLASH.dazzle);
        t.mem?.see(g.player, 'courier', g.player.pos, 0.6); // (it saw where the light came from)
        if (t.attack?.phase === 'wind') t.cancel?.('dazzled');
      }
      if (hasTag(t, 'creature') || t.type === 'clapper') { if (g.stun?.add(t, amount, { by: 'courier', cause: 'flash' })) downs++; }
    }
    g.events?.emit('flash.fire', { hits, downs, lens });
    return true;
  }
}
