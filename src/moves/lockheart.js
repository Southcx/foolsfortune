import * as THREE from 'three';
import { HeldTool } from '../tools/heldtool.js';
import { buildCoffin, buildThing } from '../pneuka/thingmodels.js';
import { HEARTS, OUTCOMES, oddsOf, rates, spin } from '../lockheart/table.js';
import { OUTCOME_FX } from '../lockheart/outcomes.js';
import { Wheel } from '../lockheart/wheel.js';
import { addOutline } from '../outline.js';
import { sfx } from '../audio.js';

// ---------------------------------------------------------------------------------------
// THE LOCKHEART: the seventh of the Courier's psychic tools. A little coffin on a chain, worn at the neck (the one place there is: so
// she starts with it on). It is weaponised luck.
//
//  - IT DRINKS: worn, it takes the Lachryma she cannot hold (what she gains over the top of her pool: lachryma.js 'overflow'). Drawn
//    and held out, LMB held HOOVERS: loose Lachryma in front of her is drawn in (baubles; liquid ones, turned dark, count double: what
//    has been let go of is what it is for), and a mind laid low (stunned, asleep, melted: stun.js) has its Lachryma drawn out of it
//    (Luigi's Mansion's Poltergust). A crystal shard fed to it from the Pneuka Box fills it nearly half.
//  - IT OPENS: RMB, when it is FULL (each coffin its own measure) and there is a POSSIBILIKEY on its ring (the box: up to four, in
//    order). The keys are turned and used up; the coffin's table, changed by the keys (lockheart/table.js), is put up as a wheel over
//    it (lockheart/wheel.js) and spun; what it lands on comes out (lockheart/outcomes.js), as hard as the coffin was full (twice full:
//    twice as hard). A TWIN key spins it twice, an ECHO key has it happen again, a WIDE key reaches twice as far.
//  - WHICH COFFIN is on the chain is which wheel: the plain one gives back what was put in, the gambler's almost never anything but
//    a slip nuke one time in a hundred (and turned upside down by an inverted key, ninety-nine), the shepherd's what is for the flock.
//
//   I      draw / stow          LMB (hold)  hoover          RMB  open it (a key on the ring, and full)          (the box: P; the Codex: THE TOOLS)
//
// Prior art: the gacha (a table of rates, a pull, the spin before the reveal), Luigi's Mansion's Poltergust, Slay the Spire's and
// Balatro's stacking modifiers, the reliquary and the mourning locket (a coffin on a chain that holds what is left of something), and
// Persona's and Fire Emblem's "luck" as a number that is spent.
// ---------------------------------------------------------------------------------------
const CAP = 100, KEY = 'foolsfortune.pneuka.lockheart', HOOVER = { range: 7, cone: 0.7, pull: 9 }, ECHO_DELAY = 1.4;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();

export class Lockheart extends HeldTool {
  constructor(mgr) {
    super(mgr, 'lockheart', {
      key: 'KeyI',
      // on its chain at the breastbone (the chest bone: it moves with her breathing), hanging
      worn: { at: [0, 1.3, 0.14], along: [0, -1, 0.12], out: [0, 0, 1], bone: 'spine003' },
      draw: { twist: 4, lean: 4, via: [-0.25, 1.3, 0.4] },
      idle: 'stance:lockheart', idles: ['stance:lockheart', 'idle'], grip: 'torchIdle', // (its own stance: anim/stances.js)
    });
    this.model = { group: new THREE.Group() };
    this.chain = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), new THREE.MeshStandardMaterial({ color: 0xd9b048, metalness: 0.7, roughness: 0.3 }));
    this.chain.rotation.z = -Math.PI / 2; this.chain.position.x = 0.06; this.model.group.add(this.chain);
    this.mount();
    const g = mgr.game;
    g.lockheart = this;
    this.cap = CAP; this.charge = 0;
    try { this.charge = Math.min(CAP, +(localStorage.getItem(KEY) || 0) || 0); } catch { /* none kept */ }
    this.hoovering = false; this.hooverW = 0; this.drainT = 0; this.queue = []; this.lidK = 0; this.saveT = 0;
    this.wheel = new Wheel(g.scene);
  }
  get busy() { return this.wheel.busy || this.queue.length > 0; }
  get slow() { return this.toolOut && this.hoovering ? 0.65 : 1; }
  get heart() { return this.game.pneuka?.fitted('heart')[0] || null; }
  get fill() { return HEARTS[this.heart]?.fill ?? 40; }
  get full() { return !!this.heart && this.charge >= this.fill; }

  /** The coffin on the chain is the one fitted in the box: rebuilt when that changes. */
  coffin() {
    const id = this.heart || 'heart.plain';
    if (this.coffinId === id) return this.cof;
    if (this.cof) { this.model.group.remove(this.cof.group); this.cof.dispose(); }
    this.cof = buildCoffin(id, 1.5);
    // (the coffin hangs below the bail along the tool's +X: its head toward the hand)
    this.cof.group.rotation.z = -Math.PI / 2; this.cof.group.position.x = 0.17;
    this.cof.group.traverse((o) => { if (o.isMesh && o.geometry.boundingSphere?.radius > 0.02) addOutline(o); });
    this.model.group.add(this.cof.group);
    this.coffinId = id;
    this.rest?.wake();
    return this.cof;
  }

  /** The keys on the keyring, strung on the charm either side of the coffin (the owner's note), rebuilt when the ring changes. */
  charmKeys() {
    const ids = this.game.pneuka?.fitted('keys') || [], sig = ids.join(',');
    if (this.keySig === sig) return;
    for (const k of this.keyMeshes || []) { this.model.group.remove(k.group); k.dispose(); }
    this.keyMeshes = [];
    ids.forEach((id, i) => {
      const k = buildThing(id); if (!k) return;
      const side = i % 2 ? -1 : 1, row = Math.floor(i / 2);
      // (on the bail above the coffin, hanging down along the tool's +X, splayed out to either side)
      k.group.rotation.set(0, 0, -Math.PI / 2 + side * (0.35 + 0.12 * row));
      k.group.position.set(0.09 + 0.02 * row, 0, side * (0.035 + 0.022 * row));
      k.group.scale.setScalar(1.1);
      this.model.group.add(k.group); this.keyMeshes.push(k);
    });
    this.keySig = sig;
    this.rest?.wake();
  }

  /** Lachryma into the coffin (overflow, a hoovered bauble, a shard). */
  feed(n, from = 'overflow') {
    if (n <= 0 || !this.worn) return 0;
    const before = this.charge;
    this.charge = Math.min(CAP, this.charge + n);
    const took = this.charge - before;
    if (took > 0) {
      if (before < this.fill && this.charge >= this.fill && this.heart) this.game.events?.emit('lockheart.full', { heart: this.heart });
      if (from !== 'overflow' || took > 2) this.game.events?.emit('lockheart.feed', { amount: Math.round(took), from });
    }
    return took;
  }

  onStow() { this.hoovering = false; }

  // ---------------------------------------------------------------- input
  use(dt, raw, inp) {
    this.hoovering = inp.isDown('Mouse0') && !this.wheel.busy;
    if (inp.wasPressed('Mouse2') && !this.busy) this.open();
  }

  open() {
    const g = this.game, box = g.pneuka;
    if (!this.heart) { sfx.fizzle?.(); g.log?.say('warn', 'The Lockheart has no coffin (wear one from the Pneuka Box).', { key: 'lh.noheart', throttle: 3 }); return; }
    const keys = box.fitted('keys');
    if (!keys.length) { sfx.fizzle?.(); g.log?.say('warn', 'There is no Possibilikey on the ring (the Pneuka Box).', { key: 'lh.nokey', throttle: 3 }); return; }
    if (!this.full) { sfx.fizzle?.(); g.log?.say('warn', 'The Lockheart is not full enough to open.', { key: 'lh.empty', throttle: 3 }); return; }
    const used = [...keys]; for (let i = keys.length - 1; i >= 0; i--) box.useUp('keys', i);
    const { table, mods } = oddsOf(this.heart, used);
    const power = Math.min(2, this.charge / this.fill);
    this.charge = 0; this.save();
    const R = rates(table), draws = [];
    for (let s = 0; s < mods.spins; s++) draws.push(spin(table));
    this.queue = draws.map((id, i) => ({ id, R, power, mods, heart: this.heart, keys: used, i }));
    sfx.coffin?.(true);
    g.events?.emit('lockheart.open', { heart: this.heart, keys: used, power: +power.toFixed(2), spins: mods.spins });
    this.next();
  }
  /** The next spin in the queue: the wheel put up over the coffin, facing her. */
  next() {
    const q = this.queue[0];
    if (!q) return;
    const g = this.game, P = this.P, cam = g.camera;
    const at = this.cof ? this.cof.group.getWorldPosition(_a).clone() : P.pos.clone().setY(P.pos.y + 1.4);
    const f = _b.set(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    const right = _a.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw)).clone();
    const pos = P.pos.clone().addScaledVector(f, 1.8).addScaledVector(right, -0.55).setY(P.pos.y + 2.25); // (above and to the side of her head, from behind her)
    const face = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.getWorldPosition(new THREE.Vector3()), pos, new THREE.Vector3(0, 1, 0)));
    this.wheel.spin(q.R, q.id, pos, face, () => this.land(q, at));
  }
  land(q, at) {
    const g = this.game, P = this.P;
    const reach = 6 * q.mods.reach * (0.8 + 0.4 * q.power);
    const place = P.pos.clone().addScaledVector(_b.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)), 1.2);
    const n = OUTCOME_FX[q.id]?.(g, place, { power: q.power, reach, by: 'courier' }) ?? 0;
    g.events?.emit('lockheart.outcome', { outcome: q.id, rank: OUTCOMES[q.id]?.rank ?? 0, power: +q.power.toFixed(2), n, heart: q.heart, spin: q.i + 1 });
    for (let e = 0; e < q.mods.echo; e++) setTimeout(() => { if (!g.player) return; OUTCOME_FX[q.id]?.(g, g.player.pos.clone(), { power: q.power, reach, by: 'courier' }); g.events?.emit('lockheart.echo', { outcome: q.id }); }, ECHO_DELAY * 1000 * (e + 1));
    setTimeout(() => { this.queue.shift(); if (this.queue.length) this.next(); else sfx.coffin?.(false); }, 1100);
  }

  // ---------------------------------------------------------------- every frame
  always(dt, raw) {
    const g = this.game;
    this.coffin(); this.charmKeys();
    // (the overflow: hooked once the pool exists)
    if (!this.hooked && g.lachryma) { this.hooked = true; g.lachryma.on('overflow', (e) => { if (e.source !== 'lockheart') this.feed(e.amount * 0.8, 'overflow'); }); }
    this.hooverW = THREE.MathUtils.damp(this.hooverW, this.hoovering && this.held ? 1 : 0, 10, dt);
    if (this.hooverW > 0.05) this.hoover(dt);
    this.wheel.update(raw);
    // the coffin's light is its load: the lid's glow, and full, the lid ajar a crack (a line that glows with its load, not a gauge)
    const k = Math.min(1, this.charge / this.fill), C = this.cof;
    if (C) {
      C.inside.material.color.setRGB(0.3 + 0.7 * k, 0.2 + 0.7 * k, 0.15 + 0.6 * k);
      const lidOpen = this.wheel.busy || this.queue.length ? 1.6 : this.hooverW > 0.05 ? 0.5 * this.hooverW : this.full ? 0.12 : 0;
      this.lidK = THREE.MathUtils.damp(this.lidK, lidOpen, 8, raw);
      C.lid.rotation.x = -this.lidK;
    }
    if ((this.saveT -= dt) <= 0) { this.saveT = 3; this.save(); }
  }

  hoover(dt) {
    const g = this.game, P = this.P;
    const mouth = this.cof ? this.cof.group.getWorldPosition(_a).clone() : P.pos.clone().setY(P.pos.y + 1.2);
    const f = this.aimFlat(_b).clone();
    let took = 0;
    for (const b of g.baubles?.near(P.pos, HOOVER.range + 1) || []) {
      const to = mouth.clone().sub(b.root.position), d = to.length();
      const flat = to.clone().setY(0).negate(); if (flat.lengthSq() > 0.01 && flat.normalize().angleTo(f) > HOOVER.cone && d > 1.2) continue;
      if (d < 0.45) { if (g.baubles.steal(b)) { took += b.value * (b.ox > 0.6 ? 2 : 1) * 1.5; g.fx?.absorbSparkle?.(mouth.clone()); } continue; }
      const v = to.normalize().multiplyScalar(HOOVER.pull * this.hooverW * (1.2 - Math.min(1, d / HOOVER.range) * 0.6));
      b.body.setLinvel({ x: v.x, y: v.y + 1, z: v.z }, true);
    }
    if (took) { this.feed(took, 'hoover'); sfx.hoover?.(Math.min(1, took / 10)); }
    // a mind laid low has its Lachryma drawn out of it
    this.drainT -= dt;
    if (this.drainT <= 0) {
      this.drainT = 0.6;
      for (const c of g.creatures.near(P.pos, 3.6)) {
        if (c.ally || !g.stun?.vulnerable(c)) continue;
        const d = c.pos.clone().sub(P.pos).setY(0); if (d.lengthSq() > 0.2 && d.normalize().angleTo(f) > HOOVER.cone) continue;
        g.baubles?.spawn(c.center(new THREE.Vector3()), 1, { spread: 0.3, up: 1.5, ox: 0.8 });
        g.events?.emit('lockheart.drain', { kind: c.kind });
      }
    }
    // what it draws, seen going in: a cone of fine motes toward the coffin
    const fx = g.fx?.alpha;
    if (fx?.emit && Math.random() < dt * 40 * this.hooverW) {
      const a = (Math.random() - 0.5) * HOOVER.cone * 2, r = 2 + Math.random() * (HOOVER.range - 2);
      const p = P.pos.clone().add(f.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a).multiplyScalar(r)).setY(P.pos.y + 0.3 + Math.random() * 1.4);
      fx.emit({ pos: p, vel: mouth.clone().sub(p).multiplyScalar(1.4), life: 0.7, size: 0.05, sizeEnd: 0.02, color: new THREE.Color(0xe8d7b6), alpha: 0.6, drag: 0, gravity: 0 });
    }
  }

  save() { try { localStorage.setItem(KEY, String(Math.round(this.charge))); } catch { /* this session */ } }

  // ---------------------------------------------------------------- animation
  pose(C, out) {
    if (this.hooverW > 0.02) { C.sample('watering', 0.5, out, false); return { pose: out, w: this.hooverW * 0.8 }; }
    return null;
  }
  fpArc() { return { lift: this.wheel.busy ? 0.1 : 0 }; }
  restSig() { return `${this.coffinId}|${Math.round(this.lidK * 20)}|${Math.round(Math.min(1, this.charge / this.fill) * 20)}`; }
}
