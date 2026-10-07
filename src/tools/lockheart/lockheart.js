import * as THREE from 'three';
import { HeldTool } from '../heldtool.js';
import { buildCoffin, buildThing } from '../../pneuka/thingmodels.js';
import { HEARTS, OUTCOMES, oddsOf, rates, spin, keyBreaks, catchOdds } from './table.js';
import { catchFactor } from '../../progress/combat/emo.js';
import { deckDraw } from '../../progress/econ/deck.js';
import { OUTCOME_FX } from './outcomes.js';
import { Wheel } from './wheel.js';
import { addOutline } from '../../render/outline.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/lockheart/lockheart'); // (the simulation's chance: core/rng.js, the same twice)

// ---------------------------------------------------------------------------------------
// THE LOCKHEART: the seventh of the Courier's psychic tools. A little coffin on a chain, worn at the neck (the one place there is: so
// they start with it on). It is weaponised luck.
//
//  - IT DRINKS: worn, it takes the Lachryma they cannot hold (what they gain over the top of their pool: lachryma.js 'overflow'). Drawn
//    and held out, LMB held HOOVERS: loose Lachryma in front of them is drawn in (baubles; liquid ones, turned dark, count double: what
//    has been let go of is what it is for), and a mind laid low (stunned, asleep, melted: stun.js) has its Lachryma drawn out of it
//    (Luigi's Mansion's Poltergust). A crystal shard fed to it from the Pneuka Box fills it nearly half.
//  - IT OPENS: RMB, when it is FULL (each coffin its own measure) and there is a POSSIBILIKEY on its ring (the box: up to four, in
//    order). The keys are turned: brass is spent, any other breaks in time (keyBreaks: a chance rising with its uses); the coffin's table, changed by the keys (tools/lockheart/table.js), is put up as a wheel over
//    it (tools/lockheart/wheel.js) and spun; what it lands on comes out (tools/lockheart/outcomes.js), as hard as the coffin was full (twice full:
//    twice as hard). A TWIN key spins it twice, an ECHO key has it happen again, a WIDE key reaches twice as far.
//  - WHICH COFFIN is on the chain is which wheel: the plain one gives back what was put in, the gambler's almost never anything but
//    a slip nuke one time in a hundred (and turned upside down by an inverted key, ninety-nine), the shepherd's what is for the flock.
//    A SUMMONING coffin (its mode: table.js MODES) is the CATCH (docs/plans/SPIRIT-GARDEN.md, 5a): opened on a Figment laid low
//    (critically stunned, in front, within reach), its wheel is two sectors, caught and free, as wide as `catchOdds` (its class, how
//    long the stun has left to hold it, its EmO, the keys), drawn from a deck per kind (econ/deck.js: a 1-in-N catch within N tries). Caught,
//    it is BOUND (creatures/bound.js) and waits in the Jar; missed, the keys are spent all the same. Nothing laid low: the coffin stays shut.
//
//   I      draw / stow          LMB (hold)  hoover          RMB  open it (a key on the ring, and full)          (the box: P; the Codex: THE TOOLS)
//
// Prior art: the gacha (a table of rates, a pull, the spin before the reveal), Luigi's Mansion's Poltergust, Slay the Spire's and
// Balatro's stacking modifiers, the reliquary and the mourning locket (a coffin on a chain that holds what is left of something), and
// Persona's and Fire Emblem's "luck" as a number that is spent.
// ---------------------------------------------------------------------------------------
const MOTE = [new THREE.Color(0xb49be6), new THREE.Color(0xffd76a), new THREE.Color(0x7fb2ff)];
const CAP = 100, HOOVER = { range: 7, cone: 0.7, pull: 9 }, ECHO_DELAY = 1.4, CATCH_REACH = 8;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _s0 = new THREE.Vector3();
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _hm = new THREE.Matrix4(), _mb = new THREE.Matrix4();
const smoothK = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export class Lockheart extends HeldTool {
  constructor(mgr) {
    super(mgr, 'lockheart', {
      key: 'KeyI',
      // on its chain at the breastbone (the chest bone: it moves with their breathing), hanging
      worn: { at: [0, 1.3, 0.14], along: [0, -1, 0.12], out: [0, 0, 1], bone: 'spine003' },
      draw: { twist: 4, lean: 4, via: [-0.25, 1.3, 0.4] },
      idle: 'stance:lockheart', idles: ['stance:lockheart', 'idle'], grip: 'torchIdle', // (held gingerly in the LEFT hand, the right free: courier/anim/stances.js; hands() below)
    });
    this.model = { group: new THREE.Group() };
    this.chain = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), new THREE.MeshStandardMaterial({ color: 0xd9b048, metalness: 0.7, roughness: 0.3 }));
    this.chain.rotation.z = -Math.PI / 2; this.chain.position.x = 0.06; this.model.group.add(this.chain);
    this.mount();
    const g = mgr.game;
    g.lockheart = this;
    this.cap = CAP; this.charge = 0;
    g.save?.section('lockheart', { scope: 'player', version: 1, dump: () => Math.round(this.charge), load: (d) => { this.charge = Math.min(CAP, Math.max(0, +d || 0)); }, reset: () => { this.charge = 0; } }); // (core/save.js)
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
    this.cof = buildCoffin(id, 3.0); // (R40: twice the size it was)
    // (the coffin hangs below the bail along the tool's +X: its head toward the hand)
    this.cof.group.rotation.z = Math.PI / 2; this.cof.group.position.x = 0.22; // (+π/2: its head, +Y, turned to -X, up at the bail (R41: -π/2 hung it head down))
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
    if (HEARTS[this.heart]?.mode === 'summoning') { this.summon(); return; }
    const g = this.game, box = g.pneuka;
    if (!this.heart) { sfx.fizzle?.(); g.log?.say('warn', 'The Lockheart has no coffin (wear one from the Pneuka Box).', { key: 'lh.noheart', throttle: 3 }); return; }
    const keys = box.fitted('keys');
    if (!keys.length) { sfx.fizzle?.(); g.log?.say('warn', 'There is no Possibilikey on the ring (the Pneuka Box).', { key: 'lh.nokey', throttle: 3 }); return; }
    if (!this.full) { sfx.fizzle?.(); g.log?.say('warn', 'The Lockheart is not full enough to open.', { key: 'lh.empty', throttle: 3 }); return; }
    // each key turned once more; brass is spent, any other breaks by its uses (table.js keyBreaks: the owner's ruling, 2026-10-04)
    const used = [...keys], broke = [];
    for (let i = keys.length - 1; i >= 0; i--) if (keyBreaks(keys[i], box.turn('keys', i), simRand())) { box.useUp('keys', i); if (used[i] !== 'key.brass') broke.unshift(used[i]); }
    const { table, mods } = oddsOf(this.heart, used);
    const power = Math.min(2, this.charge / this.fill);
    this.charge = 0; this.save();
    const R = rates(table), draws = [];
    for (let s = 0; s < mods.spins; s++) draws.push(spin(table, simRand()));
    this.queue = draws.map((id, i) => ({ id, R, power, mods, heart: this.heart, keys: used, i }));
    sfx.coffin?.(true);
    g.events?.emit('lockheart.open', { heart: this.heart, keys: used, broke, power: +power.toFixed(2), spins: mods.spins });
    if (g.ultimate) g.ultimate.begin(this); else this.next(); // (R40: the Courier's ultimate, a show the game stops for: tools/lockheart/ultimate.js)
  }
  /** The mind laid low that a summoning coffin would open on: critically stunned, in front of them, within reach (8 m). */
  quarry() {
    const g = this.game, P = this.P, f = _b.set(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    let best = null, bd = CATCH_REACH;
    for (const c of g.creatures?.list || []) {
      if (!g.bound?.catchable(c) || !g.stun?.vulnerable(c)) continue;
      const d = _a.set(c.pos.x - P.pos.x, 0, c.pos.z - P.pos.z), n = d.length();
      if (n < bd && (n < 1.5 || d.divideScalar(n).dot(f) > 0.4)) { bd = n; best = c; }
    }
    return best;
  }
  /** The catch: the keys turned, the odds put up as a wheel of two (caught, free) and spun; caught, it is bound. */
  summon() {
    const g = this.game, box = g.pneuka, keys = box.fitted('keys');
    if (!keys.length) { sfx.fizzle?.(); g.log?.say('warn', 'There is no Possibilikey on the ring (the Pneuka Box).', { key: 'lh.nokey', throttle: 3 }); return; }
    if (!this.full) { sfx.fizzle?.(); g.log?.say('warn', 'The Lockheart is not full enough to open.', { key: 'lh.empty', throttle: 3 }); return; }
    const c = this.quarry();
    if (!c) { sfx.fizzle?.(); g.log?.say('warn', 'There is nothing laid low to catch.', { key: 'lh.nocatch', throttle: 3 }); return; }
    const used = [...keys];
    for (let i = keys.length - 1; i >= 0; i--) if (keyBreaks(keys[i], box.turn('keys', i), simRand())) box.useUp('keys', i);
    const s = c.status?.get('stun'), clean = s ? Math.min(1, s.t / Math.max(0.1, c.stunFor ?? 4.5)) : 0.6; // (asleep, held or melted: a fair hold)
    const p = catchOdds({ cls: c.cls || 0, clean, emoFactor: catchFactor(c.emo), keys: used });
    const caught = p > 0 && deckDraw(g.ledger, `catch.${c.kind}`, Math.max(1, Math.round(1 / p)), simRand());
    this.charge = 0; this.save();
    g.stun?.hold(c, 4); // (kept down while the wheel turns)
    sfx.coffin?.(true);
    g.events?.emit('lockheart.open', { heart: this.heart, keys: used, broke: [], power: 1, spins: 1 });
    const R = [{ id: 'free', p: 1 - p, color: 0x5a4a62 }, { id: 'caught', p, color: 0xb49be6 }];
    const pos = c.pos.clone().setY(c.pos.y + (c.height ?? 1.5) * (c.root?.scale.y ?? 1) + 1.2), cam = g.camera;
    const face = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.getWorldPosition(new THREE.Vector3()), pos, new THREE.Vector3(0, 1, 0)));
    this.queue = [{ id: 'catch' }];
    // (Calissa's catch look runs with the wheel: the tether from the open coffin to it, tightening as the wheel slows)
    const L = g.catchLook, mouth = () => (this.cof ? this.cof.group.getWorldPosition(new THREE.Vector3()) : this.P.pos.clone().setY(this.P.pos.y + 1.3));
    L?.begin(c.root, mouth); this.catching = L ? { L, t: 0 } : null;
    this.wheel.spin(R, caught ? 'caught' : 'free', pos, face, () => {
      this.queue = []; sfx.coffin?.(false); this.catching = null;
      if (caught && c.alive) {
        c.taking = true; const done = () => { c.taking = false; g.bound?.bind(c, 'lockheart'); };
        if (L?.state === 'hold') L.take(done); else done();
      } else {
        L?.free();
        g.events?.emit('catch.miss', { from: 'lockheart', kind: c.kind, cls: c.cls || 0, odds: +p.toFixed(2), by: 'courier' });
      }
    });
  }

  /** The next spin in the queue: the wheel put up over the coffin, facing them. */
  next(spec = null) {
    const q = this.queue[0];
    if (!q) return;
    if (spec) { const at = this.cof ? this.cof.group.getWorldPosition(_a).clone() : this.P.pos.clone(); this.wheel.spin(q.R, q.id, spec.pos, spec.face, () => this.land(q, at), spec.size); return; }
    const g = this.game, P = this.P, cam = g.camera;
    const at = this.cof ? this.cof.group.getWorldPosition(_a).clone() : P.pos.clone().setY(P.pos.y + 1.4);
    const f = _b.set(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    const right = _a.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw)).clone();
    const pos = P.pos.clone().addScaledVector(f, 1.8).addScaledVector(right, -0.55).setY(P.pos.y + 2.25); // (above and to the side of their head, from behind them)
    const face = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.getWorldPosition(new THREE.Vector3()), pos, new THREE.Vector3(0, 1, 0)));
    this.wheel.spin(q.R, q.id, pos, face, () => this.land(q, at));
  }
  land(q, at) {
    const g = this.game, P = this.P;
    const reach = 6 * q.mods.reach * (0.8 + 0.4 * q.power);
    const place = P.pos.clone().addScaledVector(_b.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)), 1.2);
    const n = OUTCOME_FX[q.id]?.(g, place, { power: q.power, reach, by: 'courier' }) ?? 0;
    g.events?.emit('lockheart.outcome', { outcome: q.id, rank: OUTCOMES[q.id]?.rank ?? 0, power: +q.power.toFixed(2), n, heart: q.heart, spin: q.i + 1 });
    if (g.ultimate?.active) { this.queue.shift(); g.ultimate.landed(q); for (let e = 0; e < q.mods.echo; e++) setTimeout(() => { if (!g.player) return; OUTCOME_FX[q.id]?.(g, g.player.pos.clone(), { power: q.power, reach, by: 'courier' }); g.events?.emit('lockheart.echo', { outcome: q.id }); }, ECHO_DELAY * 1000 * (e + 1)); return; }
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
    if (this.catching) { this.catching.t += raw; this.catching.L.set({ k: Math.min(0.9, this.catching.t / 2.1), tug: 0.5 + 0.5 * Math.sin(this.catching.t * 9) }); } // (the wheel's 2.1 s: wheel.js)
    // the coffin's light is its load: the lid's glow, and full, the lid ajar a crack (a line that glows with its load, not a gauge)
    const k = Math.min(1, this.charge / this.fill), C = this.cof;
    if (C) {
      C.inside.material.color.setRGB(0.3 + 0.7 * k, 0.2 + 0.7 * k, 0.15 + 0.6 * k);
      const lidOpen = this.cine && this.cine.scale > 1.5 ? 2.2 : this.wheel.busy || this.queue.length ? 1.6 : this.hooverW > 0.05 ? 0.5 * this.hooverW : this.full ? 0.12 : 0;
      this.lidK = THREE.MathUtils.damp(this.lidK, lidOpen, 8, raw);
      C.lid.rotation.x = -this.lidK;
    }
    // during the opening the coffin burns gold from within (tools/lockheart/ultimate.js): it is the light of the show, not a silhouette
    const glow = this.cine ? 0.35 + 0.65 * Math.min(1, (this.cine.scale - 1) / 1.8) : 0;
    if (C && (glow > 0 || this.glowWas)) {
      C.group.traverse((o) => { const m = o.material; if (!o.isMesh || !m?.emissive) return; m.userData.em0 ??= { c: m.emissive.getHex(), k: m.emissiveIntensity }; if (glow > 0) { m.emissive.setHex(0xffc65c); m.emissiveIntensity = glow; } else { m.emissive.setHex(m.userData.em0.c); m.emissiveIntensity = m.userData.em0.k; } });
      this.glowWas = glow > 0;
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
    // (R40: Lachryma-coloured, through the O of the joined hands: aimed at the ring first, then on into the coffin behind it)
    const fx = g.fx?.add, ring = P.pos.clone().addScaledVector(f, 0.62).setY(P.pos.y + 1.27);
    for (let n = 0; fx?.emit && n < 3; n++) {
      if (simRand() > dt * 30 * this.hooverW) continue;
      const a = (simRand() - 0.5) * HOOVER.cone * 2, r = 2 + simRand() * (HOOVER.range - 2);
      const p = P.pos.clone().add(f.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a).multiplyScalar(r)).setY(P.pos.y + 0.3 + simRand() * 1.6);
      const life = 0.55;
      fx.emit({ pos: p, vel: ring.clone().sub(p).multiplyScalar(1 / life), life, size: 0.06, sizeEnd: 0.015, color: MOTE[n % 3], alpha: 0.85, drag: 0, gravity: 0 });
    }
  }

  save() { this.game.save?.dirty('lockheart'); }

  // ---------------------------------------------------------------- animation
  pose(C, out) {
    // the channel (FFXI's black magic cast): the arms out and the hands joined in an O; the coffin floats behind it (hands())
    const w = Math.max(this.hooverW, this.castW || 0);
    if (w > 0.02) { C.sample(C.clips['stance:lockheartChannel'] ? 'stance:lockheartChannel' : 'watering', 0.5, out, false); return { pose: out, w }; }
    return null;
  }

  /** Where the coffin is (R40): on its chain at the chest when worn; drawn, dangling by its chain from the LEFT hand's fingers, held
   *  gingerly (the right hand is free); channelling, out of the hand and floating just behind the O of the joined hands, its lid
   *  toward them, so what it draws comes in through the O. (First person: the shared held placement.) */
  hands(ch) {
    const P = this.P;
    if ((P.fp && !this.cine) || !this.holsterBone) return super.hands(ch);
    ch.root.updateMatrixWorld(true);
    const g = this.model.group, yaw = P.bodyYaw ?? P.yaw, t = performance.now() / 1000;
    const f = _f.set(Math.sin(yaw), 0, Math.cos(yaw)), r = _r.set(-Math.cos(yaw), 0, Math.sin(yaw));
    _hm.multiplyMatrices(this.holsterBone.matrixWorld, this.holsterLocal).decompose(_p0, _q0, _s0);
    // tool +X down (it hangs from its bail), +Z forward
    _x.set(0, -1, 0); _y.crossVectors(f, _x); _mb.makeBasis(_x, _y, f); _q1.setFromRotationMatrix(_mb);
    ch.arm.L.hand.getWorldPosition(_p1).addScaledVector(f, 0.03).y -= 0.02;
    _p1.y += Math.sin(t * 2.1) * 0.004; // (it sways a little on its chain)
    // the channel's place: behind the O, at the chest
    _p2.copy(P.pos).addScaledVector(f, 0.36).setY(P.pos.y + 1.5 + Math.sin(t * 3) * 0.015); // (the bail: the coffin hangs 0.22 below it, level with the O)
    const k = smoothK(this.drawT), c = this.hooverW;
    _p1.lerp(_p2, c);
    g.position.copy(_p0).lerp(_p1, k); g.quaternion.copy(_q0).slerp(_q1, k); g.scale.copy(_s0);
    // the opening (tools/lockheart/ultimate.js) takes it: up over the head, growing, turning
    const U = this.cine;
    if (U) { g.position.copy(U.pos); g.scale.copy(_s0).multiplyScalar(U.scale); g.quaternion.multiplyQuaternions(_q.setFromAxisAngle(_x.set(0, 1, 0), U.spin), _q1); }
    g.updateMatrixWorld(true);
    this.placed?.(g.matrixWorld);
  }
  fpArc() { return { lift: this.wheel.busy ? 0.1 : 0 }; }
  restSig() { return `${this.coffinId}|${Math.round(this.lidK * 20)}|${Math.round(Math.min(1, this.charge / this.fill) * 20)}`; }
}
