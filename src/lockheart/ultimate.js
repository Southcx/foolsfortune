// ---------------------------------------------------------------------------------------
// THE OPENING: a Lockheart opened with a Possibilikey is the Courier's ULTIMATE, and the game stops for it. The world is held almost
// still and goes dark; a circle of light is drawn on the ground; the keys come off the charm and wheel round the coffin, and plunge
// into it one by one, each a note and a colour (music/tone.js); the coffin rises over the Courier's head, grows, and throws its lid
// open, a pillar of Lachryma spiralling up out of it; the wheel of its odds is put up in the sky, enormous; and when it lands, the world
// comes back all at once, flash and shockwave, and whatever it landed on happens, as hard as the coffin was full. Every beat has its
// own camera: in low and close on the invocation, a cut round for each key, a crane up and over as it ascends, from behind and below
// looking up at the wheel, and back. (One spin per key that asks for it: a TWIN key turns the wheel twice.)
//
// Prior art: Final Fantasy X's aeon summons (the circle, the sky going dark, the long dramatic arrival, each with its camera), Kingdom
// Hearts' summons and limit breaks (the world stopped, the party posed, the flourish), Persona's All-Out Attack and Overwatch's
// ultimates (the moment everyone watches), the gacha's own ceremony (the spin made a show), and Okami's brush gods arriving out of the
// light. The feedback blur (render/glow.js) and the mood dimmer (mood.js) are shared with the death and the chests.
//
// Its effects are the game's gold standard for a cinematic event (the owner: "until it is almost garish and overbearing"), played
// through the one VFX system (vfx/vfx.js) by name: 'ult.invoke' (the whirl and the motes, held), 'ult.key' (each key, in its colour),
// 'ult.ascend', 'ult.pillar' and 'ult.crown' (held), 'ult.land'. Their looks are tuned in vfx/library.js, not here.
//
//   game.ultimate = new Ultimate(game)   .begin(lockheart)   .update(rawDt)   .active
//   UltTech (moves/techs.js list): holds the body in the channel while it happens
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../moves/techs.js';
import { buildThing } from '../pneuka/thingmodels.js';
import { degreeColor } from '../music/tone.js';
import { sfx } from '../audio.js';
import { clearShot } from '../shotclear.js';

const INVOKE = 1.4, KEY_DT = 0.32, ASCEND = 1.4, LAND_HOLD = 1.6, BACK = 1.0; // (beats, real seconds)
const SLOW = 0.2; // (how fast the world runs meanwhile: nearly held)
const LACH = new THREE.Color(0xb49be6), GOLD = new THREE.Color(0xffd76a), BLUE = new THREE.Color(0x7fb2ff), WHITE = new THREE.Color(0xffffff);
const _v = new THREE.Vector3(), _l = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3();

/** The circle drawn on the ground: rings, a seven-pointed star (seven for luck), and ticks round it, gold on black, added light. */
function circleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), m = 256;
  g.translate(m, m); g.strokeStyle = '#fff'; g.lineCap = 'round';
  for (const [r, w] of [[250, 6], [236, 2], [170, 3], [158, 1.5], [70, 3]]) { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= 7; i++) { const a = (i * 3 * Math.PI * 2) / 7 - Math.PI / 2; const x = Math.cos(a) * 170, y = Math.sin(a) * 170; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke();
  for (let i = 0; i < 49; i++) { const a = (i / 49) * Math.PI * 2, r0 = i % 7 ? 240 : 222; g.lineWidth = i % 7 ? 2 : 4; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 250, Math.sin(a) * 250); g.stroke(); }
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(Math.cos(a) * 203, Math.sin(a) * 203, 14, 0, Math.PI * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export class Ultimate {
  constructor(game) {
    this.game = game; this.active = false; this.want = false; this.t = 0;
    const mat = new THREE.MeshBasicMaterial({ map: circleTexture(), color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.circle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.circle.rotation.x = -Math.PI / 2; this.circle.renderOrder = 4; this.circle.visible = false; this.circle.userData.moodExempt = true;
    this.circle2 = new THREE.Mesh(this.circle.geometry, mat.clone()); this.circle2.material.color.copy(LACH); this.circle2.rotation.x = -Math.PI / 2; this.circle2.renderOrder = 4; this.circle2.visible = false;
    game.scene.add(this.circle); game.scene.add(this.circle2);
    this.flash = Object.assign(document.createElement('div'), { id: 'ultflash' });
    this.flash.style.cssText = 'position:fixed;inset:0;background:#fff8e8;opacity:0;pointer-events:none;z-index:9';
    document.body.appendChild(this.flash);
    this.keys = [];
  }

  /** The Lockheart has used its keys and drawn its spins (lockheart.queue): the show begins. */
  begin(lh) {
    const g = this.game, P = g.player;
    if (this.active) return;
    this.lh = lh; this.active = true; this.want = true; this.t = 0; this.phase = 'invoke'; this.spins = 0; this.landT = -1;
    this.at = P.pos.clone(); this.yaw = P.yaw; this.flashK = 0; this.ceil = undefined;
    const keys = lh.queue[0]?.keys || [];
    this.nKeys = keys.length;
    // the keys, off the charm: they wheel round the coffin, then go into it
    this.keys = keys.map((id, i) => { const k = buildThing(id); if (!k) return null; k.group.scale.setScalar(2.4); g.scene.add(k.group); return { k, i, a: (i / Math.max(1, keys.length)) * Math.PI * 2, gone: false }; }).filter(Boolean);
    this.circle.visible = this.circle2.visible = !g.vfx; // (with the VFX system, the circles are the owner's wife's: 'ult.invoke')
    this.fx = { invoke: g.vfx?.play('ult.invoke', { pos: this.at }) };
    g.mood?.set('ult', { dim: 0.72, tint: 0x160a2e, tintK: 0.8, ease: 5 });
    g.music?.duck?.(12, 0.12);
    sfx.coffin?.(true);
    g.events?.emit('lockheart.ultimate', { heart: lh.heart, keys, spins: lh.queue.length });
  }

  frame(k) { return { f: _f.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)), r: _r.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)) }; }
  /** A point round the Courier: `a` the angle from the front (0) going round, `d` out, `h` up. */
  around(a, d, h, out = _v) { const y = this.yaw + a; return out.set(this.at.x + Math.sin(y) * d, this.at.y + h, this.at.z + Math.cos(y) * d); }

  update(raw) {
    if (!this.active) return;
    const g = this.game, lh = this.lh, fx = g.fx, t = (this.t += raw);
    const S = g.time?.scale || 1, comp = 1 / Math.max(0.05, S); // (particles live in world time: sped up to read in real time)
    const keysEnd = INVOKE + this.nKeys * KEY_DT + 0.2, ascendEnd = keysEnd + ASCEND;
    if (this.phase !== 'back') g.time?.slow('ult', SLOW);
    // ---- the circle on the ground: it opens, turns, and brightens as the coffin climbs
    const open = Math.min(1, t / 0.6), bright = this.phase === 'back' ? Math.max(0, 1 - (t - this.backT) / BACK) : 0.55 + 0.45 * Math.min(1, Math.max(0, (t - keysEnd) / ASCEND));
    const size = 6.4 * (1 - Math.pow(1 - open, 3));
    this.circle.position.set(this.at.x, this.at.y + 0.04, this.at.z); this.circle.scale.setScalar(Math.max(0.01, size)); this.circle.rotation.z = t * 0.35;
    this.circle2.position.set(this.at.x, this.at.y + 0.05, this.at.z); this.circle2.scale.setScalar(Math.max(0.01, size * 0.62)); this.circle2.rotation.z = -t * 0.8;
    this.circle.material.opacity = 0.9 * bright * open; this.circle2.material.opacity = 0.75 * bright * open;
    // ---- where the coffin is: floating in the O, then up over the Courier's head and growing
    const coffinUp = this.phase === 'back' ? 0 : Math.min(1, Math.max(0, (t - keysEnd) / ASCEND));
    const ease = coffinUp * coffinUp * (3 - 2 * coffinUp);
    const hold = this.around(0, 0.36, 1.5).clone(), high = this.around(0, 0.2, 4.2).clone();
    lh.cine = { pos: hold.lerp(high, ease), scale: 1 + 1.8 * ease, spin: t * (0.6 + 4 * ease) };
    lh.castW = this.phase === 'back' ? Math.max(0, 1 - (t - this.backT) / 0.5) : 1;
    const cof = lh.cine.pos.clone().setY(lh.cine.pos.y - 0.22 * lh.cine.scale);
    // ---- the keys: wheeling round the coffin, then each into it, a note and a colour
    for (const K of this.keys) {
      const plunge = INVOKE + K.i * KEY_DT;
      if (!K.gone && t >= plunge) {
        K.gone = true; g.scene.remove(K.k.group); K.k.dispose?.();
        const col = degreeColor(K.i);
        if (g.vfx) g.vfx.play('ult.key', { pos: cof, tint: col }); else fx?.toneBurst?.(cof.clone(), col, 1, 0.8 * comp);
        if (sfx.crystalStrike) sfx.crystalStrike(72 + [0, 3, 5, 7, 10][K.i % 5], 0, {}); else sfx.chime?.(0.8);
        this.cut = K.i; // (a cut for each key)
        g.player.shake = Math.max(g.player.shake || 0, 0.12);
        continue;
      }
      if (K.gone) continue;
      const a = K.a + t * (2 + t * 2.2), rr = 0.75 * Math.max(0.15, 1 - Math.max(0, t - (plunge - 0.35)) / 0.35);
      K.k.group.position.set(cof.x + Math.cos(a) * rr, cof.y + Math.sin(t * 3 + K.i) * 0.08, cof.z + Math.sin(a) * rr);
      K.k.group.rotation.set(t * 3, a, 0);
    }
    // ---- the held effects follow what they are about (vfx/library.js 'ult.*')
    // (while the wheel turns the pillar and the crown step back, so the wheel, which is what the player is reading, stands clear)
    const clear = this.phase === 'wheel' ? 0.22 : 1;
    if (this.fx?.crown) { this.fx.crown.pos.copy(cof); this.fx.crown.k = THREE.MathUtils.damp(this.fx.crown.k, clear, 5, raw); }
    if (this.fx?.pillar) { this.fx.pillar.pos.copy(this.at); this.fx.pillar.k = THREE.MathUtils.damp(this.fx.pillar.k, clear, 5, raw); }
    if (!g.vfx && fx?.add?.emit && this.phase !== 'back') { // (without the VFX system: the old stream)
      for (let s = 0; s < 2; s++) {
        const a = t * 7 + s * Math.PI, r = 0.7 + 0.25 * Math.sin(t * 2);
        _l.set(this.at.x + Math.cos(a) * r, this.at.y + 0.1, this.at.z + Math.sin(a) * r);
        fx.add.emit({ pos: _l, vel: new THREE.Vector3(-Math.sin(a) * 1.2 * comp, 8 * comp, Math.cos(a) * 1.2 * comp), life: 1.1 / comp, size: 0.09, sizeEnd: 0.02, color: s ? LACH : GOLD, alpha: 0.95, drag: 0, gravity: 0 });
      }
    }
    // ---- the beats
    if (this.phase === 'invoke' && t >= keysEnd) {
      this.phase = 'ascend'; sfx.geyser?.();
      if (g.vfx) { g.vfx.play('ult.ascend', { pos: cof }); this.fx.pillar = g.vfx.play('ult.pillar', { pos: this.at }); this.fx.crown = g.vfx.play('ult.crown', { pos: cof }); }
      else for (let i = 0; i < 4; i++) fx?.toneBurst?.(cof.clone().setY(cof.y + i * 0.6), i % 2 ? LACH : GOLD, 1, (1.2 + i * 0.4) * comp); // (rings of light stacked up the pillar)
    }
    if (this.phase === 'ascend' && t >= ascendEnd) { this.phase = 'wheel'; this.wheelT = t; this.spinNext(); }
    if (this.phase === 'landed' && t - this.landT >= LAND_HOLD) {
      if (lh.queue.length) { this.phase = 'wheel'; this.wheelT = t; this.spinNext(); } else { this.phase = 'back'; this.backT = t; g.time?.free('ult'); g.mood?.free('ult'); this.stopFx(); }
    }
    if (this.phase === 'back' && t - this.backT >= BACK) this.finish();
    // ---- the smear after a landing, easing off
    if (this.smearT > 0) { this.smearT -= raw; if (g.post?.accum && !g.death?.active) g.post.accum.amt = this.smearT > 0 ? 0.75 * Math.min(1, this.smearT / 0.5) : 0; }
    // ---- the flash, fading
    this.flashK = Math.max(0, this.flashK - raw * 2.2);
    this.flash.style.opacity = String(this.flashK);
    // ---- the camera, a shot per beat
    this.camera(t, keysEnd, ascendEnd, cof);
  }

  camera(t, keysEnd, ascendEnd, cof) {
    const g = this.game, P = this.at;
    let pos, look, fov = 0, roll = 0, ease = 4;
    if (this.phase === 'invoke' && this.cut === undefined) {
      // in low and close from the front, looking up past the joined hands at the coffin; a slow push in
      const d = 2.2 - t * 0.35;
      pos = this.around(0.5, d, 0.35); look = _l.copy(cof); fov = -6; roll = -0.06; ease = 6;
    } else if (this.phase === 'invoke') {
      // a cut for each key, round them a quarter at a time
      const a = 0.5 + (this.cut + 1) * 1.6, d = 1.9;
      pos = this.around(a, d, 0.9 + (this.cut % 2) * 0.8); look = _l.copy(cof); fov = -10; roll = (this.cut % 2 ? 0.08 : -0.08); ease = 40;
    } else if (this.phase === 'ascend') {
      // a crane: from low in front round and up over their shoulder as the coffin climbs
      const u = Math.min(1, (t - keysEnd) / ASCEND), k = u * u * (3 - 2 * u);
      pos = this.around(0.5 + k * 2.6, 4.4, 1.0 + k * 2.4).clone(); look = _l.copy(cof).lerp(this.around(0, 0, 1.2), 0.45); // (pos cloned: around() writes one shared vector, and the look's around() overwrote it, putting the crane inside the Courier) fov = 6 + 6 * k; roll = 0.05 * (1 - k); ease = 3;
    } else if (this.phase === 'wheel' || this.phase === 'landed') {
      // from behind and below, looking up past them at the wheel in the sky; drifting round
      const w = t - this.wheelT;
      pos = this.around(Math.PI + 0.35 + w * 0.08, 2.4, 0.6); look = _l.copy(this.wheelPos || cof); fov = 8; roll = -0.03; ease = 3;
      if (this.phase === 'landed' && t - this.landT < 0.5) { pos = this.around(0.9, 4.5, 2.4); look = _l.copy(this.around(0, 0, 1)); fov = 14; ease = 40; } // (the impact, wide)
    } else return g.cinema?.unshot('ult');
    // (under a low ceiling the crane stays below it: measured once, straight up from the Courier)
    if (this.ceil === undefined) { const hit = g.physics?.raycast(this.around(0, 0, 1.6, new THREE.Vector3()), { x: 0, y: 1, z: 0 }, 12, g.player?.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic()); this.ceil = hit ? this.at.y + 1.6 + hit.distance - 0.5 : Infinity; }
    if (pos.y > this.ceil) pos.y = this.ceil;
    pos = clearShot(g, this.around(0, 0, 1.2, new THREE.Vector3()), pos, new THREE.Vector3()); // (never inside a wall)
    g.cinema?.shot('ult', { pos, look, fov, roll, bars: 1, ease });
  }

  /** The next spin: the wheel put up in the sky above the coffin, enormous, facing the camera behind them. */
  spinNext() {
    const lh = this.lh, q = lh.queue[0];
    if (!q) return;
    this.wheelPos = this.around(0, 1.2, 6.2).clone();
    const cam = this.around(Math.PI + 0.35, 2.4, 0.6).clone();
    const face = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam, this.wheelPos, new THREE.Vector3(0, 1, 0)));
    lh.next({ pos: this.wheelPos, face, size: 4.2 });
    sfx.coffin?.(true);
  }

  /** The wheel has landed (lockheart.land): the world comes back all at once. */
  landed(q) {
    const g = this.game, fx = g.fx, c = this.around(0, 0, 1);
    this.phase = 'landed'; this.landT = this.t; this.spins++;
    g.time?.free('ult');
    if (g.vfx) g.vfx.play('ult.land', { pos: c }); // (flash, hitstop, shake, smear, lights, dome, shocks, sparks: vfx/library.js)
    else {
      this.flashK = 0.85; g.time?.pulse?.('ult', 0.02, 0.14);
      fx?.shockwave?.(c.clone(), 8);
      fx?.toneBurst?.(c.clone(), GOLD, 1, 3.5); fx?.toneBurst?.(c.clone().setY(c.y + 0.4), LACH, 1, 2.6); fx?.toneBurst?.(c.clone().setY(c.y + 0.8), WHITE, 1, 1.6);
      g.player.shake = Math.max(g.player.shake || 0, 0.7);
      if (g.post?.accum) Object.assign(g.post.accum, { amt: 0.75, zoom: 0.01, spin: 0.004 });
      this.smearT = 0.9; // (the smear eases off in update)
    }
    if (sfx.crystalSweet) sfx.crystalSweet(60); sfx.chestBurst?.(4);
  }

  stopFx() { for (const h of Object.values(this.fx || {})) h?.stop?.(); this.fx = {}; }

  finish() {
    const g = this.game;
    this.stopFx();
    this.active = false; this.want = false;
    this.circle.visible = this.circle2.visible = false;
    for (const K of this.keys) if (!K.gone) { g.scene.remove(K.k.group); K.k.dispose?.(); }
    this.keys = [];
    this.lh.cine = null; this.lh.castW = 0; this.smearT = 0;
    if (g.post?.accum && !g.death?.active) g.post.accum.amt = 0;
    g.cinema?.unshot('ult'); g.time?.free('ult'); g.mood?.free('ult');
    this.flash.style.opacity = '0';
    sfx.coffin?.(false);
    g.events?.emit('lockheart.ultimate.end', { spins: this.spins });
  }
}

/** Holds the body in the channel while the opening plays: no input, no movement. */
export class UltTech extends Tech {
  constructor(mgr) { super(mgr, 'ultimate'); this.blendIn = 14; }
  get enabled() { return true; }
  usable() { return true; }
  get overrides() { return 1; }
  label() { return 'OPENING'; }
  canStart() { return !!this.game.ultimate?.want; }
  start() { const P = this.P; P.endCore?.(); P.vel.set(0, 0, 0); }
  update(dt) { const P = this.P; P.vel.set(0, Math.min(P.vel.y, 0) - 9 * dt, 0); P.move(dt); return !!this.game.ultimate?.want; }
  animate(ch, base) {
    const C = ch.clips, n = C.clips['stance:lockheartChannel'] ? 'stance:lockheartChannel' : 'idle';
    C.blend(base, C.sample(n, 0.5, ch.P.tmp, false), this.w);
  }
  faceYaw() { return this.game.ultimate?.yaw ?? null; }
}
