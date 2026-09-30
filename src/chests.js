// ---------------------------------------------------------------------------------------
// CHESTS: treasure chests in five tiers (common, fine, rare, epic, prismatic), the Tithe that summons a sealed one for cubes, and the
// technique (F) that opens them. This file is the world side: where chests are, how one is found, dropped, respawned; the opening
// itself, beat by beat, is ceremony.js, the models are chestmodel.js and curiomodel.js, the numbers are treasure.js, and the cubes
// that come out are cubes.js.
//
//   game.chests.spawn(tier, pos, { yaw, id, respawn, floor })     a chest standing there (`respawn` s after it has been opened, it shuts again)
//   game.chests.drop(tier, pos, { yaw })                            a chest that falls out of the air and lands (a legendary catch pays in these)
//   game.chests.setTithe({ pos, yaw, dais })                        the console and the dais of the Tithe (the room builds the stone; this brings it alive)
//
// The Tithe: pay 25 cubes at the console and a SEALED chest lands on the dais. It is a chest of no colour; its tier is rolled at that
// moment from published odds and three PITY counters (10 pulls without a rare or better guarantees one; 40 an epic; 100 a prismatic),
// kept in the ledger and shown on the console by rows of lamps, and it is revealed only when the sealed chest is opened. The ledger
// holds `tithe.pulls`, `tithe.tier.<id>` and `tithe.last.<rare|epic|prismatic>` (the pull each last came on).
//
// Prior art: the gacha pull (pay, summon, reveal as separate acts, which is where most of the tension comes from), pity systems as
// Fate/Grand Order, Genshin and Fire Emblem Heroes publish them, and Dark Souls' bonfire-lit shrines (the console is a machine you
// feed and wait on). The pips are lamps, not numbers: this game says nothing in the world.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from './physics.js';
import { Tech } from './moves/techs.js';
import { ChestRig, CHEST } from './chestmodel.js';
import { TIERS, TITHE, rollTier } from './treasure.js';
import { Beam } from './vfx/beam.js';
import { Ceremony } from './ceremony.js';
import { sfx } from './audio.js';

const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);

export class Chests {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.t = 0;
    this.cur = null;      // the ceremony in progress
    this.rave = null;     // (vfx/rave.js, when it is there)
    this.tithe = null;
    this.rings = [];
    this.ringGeo = new THREE.RingGeometry(0.88, 1, 64);
    // the light and the beam of a ceremony: one of each, made once (a light added mid-game makes every shader compile again)
    this.light = new THREE.PointLight(0xffffff, 0, 16, 1.3); this.light.userData.moodExempt = true;
    game.scene.add(this.light);
    this.beam = new Beam(game.scene, { radius: 0.5, height: 10, foot: 1.4 });
    // a legendary catch pays in an epic chest that falls out of the air
    game.events.on('angle.catch', (e) => { if (e.legend) this.owed = 3; });
    game.events.on('angle.landed', () => {
      if (this.owed == null) return;
      const P = game.player, tier = this.owed; this.owed = null;
      const at = _a.set(P.pos.x + Math.sin(P.yaw) * 2.8, P.pos.y, P.pos.z + Math.cos(P.yaw) * 2.8);
      this.drop(tier, at.clone(), { yaw: P.yaw + Math.PI, from: 'catch' });
    });
  }

  /** True while a ceremony wants the cubes to lie where they fell (they are drawn to her when it lets go). */
  get locking() { return !!this.cur?.holdCubes; }

  // ---------------------------------------------------------------- placing them
  spawn(tier, pos, { yaw = 0, id = null, respawn = 0, floor = null, sealed = false, fall = false, from = null } = {}) {
    const g = this.game, S = sealed ? 1.0 : CHEST.SCALE[tier];
    const rig = new ChestRig(sealed ? 0 : tier, { sky: g.sky.env, halo: g.fx.haloTexture, sealed });
    rig.root.position.copy(pos); rig.root.rotation.y = yaw;
    g.scene.add(rig.root);
    const c = { tier, sealed, rig, yaw, id, respawn, floor: floor ?? pos.y, baseY: pos.y, state: 'closed', busy: false, openedAt: 0, col: null, from };
    c.front = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    rig.onLand = (v) => { if (v > 2.5) { sfx.chestLand?.(S * 0.6); g.fx.impact?.(_a.copy(rig.root.position).setY(c.floor), _up, { sparks: 0, dust: 3 }); } };
    rig.onClack = (v, hinge) => { if (v > 2 && sfx.allow?.('chestclack', 12)) sfx.chestKnock?.(hinge ? 0.9 : 0.4); };
    if (fall) {
      c.state = 'falling'; c.fall = { y: pos.y + 9, v: -2 };
      rig.root.position.y = c.fall.y;
    } else this.collider(c);
    // one that was opened for good stays open
    if (id && !respawn && g.ledger.has(`chest.${id}`)) this.markOpen(c, true);
    this.list.push(c);
    return c;
  }

  /** A static collider the size of the closed chest (it stays when the lid is up: the chest is still there). */
  collider(c) {
    const g = this.game, S = c.rig.scale, w = g.physics.world;
    _q.setFromAxisAngle(_up, c.yaw);
    const p = c.rig.root.position;
    const cd = RAPIER.ColliderDesc.cuboid(CHEST.W * S / 2, 0.36 * S, CHEST.D * S / 2).setTranslation(p.x, c.baseY + 0.36 * S, p.z).setRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w }).setCollisionGroups(GROUPS.static).setFriction(0.9);
    c.col = w.createCollider(cd);
  }

  drop(tier, pos, opts = {}) {
    const c = this.spawn(tier, pos, { ...opts, fall: true });
    this.game.events.emit('chest.drop', { tier, from: opts.from || 'sky' });
    return c;
  }

  markOpen(c, quiet = false) {
    c.state = 'open';
    c.rig.setOpen(true); c.rig.mound.visible = false; c.rig.setGlow(quiet ? 0.18 : 0.22); c.rig.lidA = CHEST.OPEN; c.rig.sy = 1;
  }

  reopen(c) { // (a chest that comes back: shut, and full, with a little jump)
    c.state = 'closed'; c.busy = false;
    const rig = c.rig;
    rig.setOpen(false); rig.mound.visible = true; rig.setGlow(0); rig.setColor(rig.glowColor); rig.lidA = 0; rig.lidV = 0;
    rig.poke({ squash: 12, hop: 3.4, lid: 4 });
    this.ringBurst(_a.copy(rig.root.position).setY(c.floor + 0.05), TIERS[c.tier].rgb, 1.6, 0.5, true);
    sfx.chestLand?.(0.4);
  }

  /** A chest that has served: it shrinks away in a puff. */
  remove(c, poof = true) {
    const g = this.game, i = this.list.indexOf(c);
    if (i < 0) return;
    if (poof) {
      this.ringBurst(_a.copy(c.rig.root.position).setY(c.floor + 0.05), c.tier === 4 ? 0xffffff : TIERS[c.tier].rgb, 1.8, 0.45, true);
      g.fx.impact?.(_a.copy(c.rig.root.position).setY(c.floor + 0.2), _up, { sparks: 0, dust: 10 });
    }
    if (c.col) { g.physics.world.removeCollider(c.col, false); c.col = null; }
    c.rig.dispose(); this.list.splice(i, 1);
  }

  /** The chest that stands in the Tithe's dais now, if any (a sealed one waiting to be opened). */
  daisChest() { return this.list.find((c) => c.sealed && c.state !== 'open') || null; }

  /** After a sealed chest has revealed itself: the same place, the same chest, the true tier's dress. */
  swapRig(c, tier) {
    const g = this.game, old = c.rig, p = old.root.position.clone();
    const rig = new ChestRig(tier, { sky: g.sky.env, halo: g.fx.haloTexture });
    rig.root.position.copy(p); rig.root.rotation.y = c.yaw; g.scene.add(rig.root);
    rig.onLand = old.onLand; rig.onClack = old.onClack;
    rig.sy = old.sy; rig.sv = old.sv; rig.hy = old.hy; rig.hv = old.hv; rig.lidA = old.lidA; rig.lidV = old.lidV;
    rig.busy = true; old.dispose();
    c.rig = rig; c.tier = tier; c.sealed = false;
    // (its collider was sized to the sealed chest's scale: a rare chest is a little bigger)
    if (c.col) { g.physics.world.removeCollider(c.col, false); this.collider(c); }
  }

  // ---------------------------------------------------------------- what F would act on
  find() {
    const g = this.game, P = g.player;
    let best = null;
    for (const c of this.list) {
      if (c.state !== 'closed' || c.busy) continue;
      const S = c.rig.scale, root = c.rig.root.position;
      const mx = root.x + c.front.x * (0.8 * S + 0.55), mz = root.z + c.front.z * (0.8 * S + 0.55);
      const d = Math.hypot(P.pos.x - mx, P.pos.z - mz);
      if (d > 1.6 || Math.abs(P.pos.y - c.floor) > 0.9) continue;
      if ((P.pos.x - root.x) * c.front.x + (P.pos.z - root.z) * c.front.z < 0.35) continue; // (in front of it, not beside or behind)
      if (!best || d < best.d) best = { kind: 'chest', chest: c, d, pos: _b.set(root.x, root.y + 1.0 * S + 0.55, root.z).clone() };
    }
    const t = this.tithe;
    if (t) {
      const d = Math.hypot(P.pos.x - t.mark.x, P.pos.z - t.mark.z);
      if (d < 1.3 && Math.abs(P.pos.y - t.mark.y) < 0.9 && (!best || d < best.d)) best = { kind: 'tithe', d, pos: t.slot.clone().setY(t.slot.y + 0.75) };
    }
    return best;
  }

  begin(tgt) { return tgt.kind === 'tithe' ? new TitheAct(this.game, this) : new Ceremony(this.game, this, tgt.chest); }

  // ---------------------------------------------------------------- the Tithe
  setTithe({ pos, yaw, dais }) {
    const g = this.game;
    const front = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    this.tithe = { pos: pos.clone(), yaw, dais: dais.clone(), front, mark: pos.clone().addScaledVector(front, 1.0), slot: pos.clone().setY(pos.y + 1.06), lamps: [] };
    // the pity lamps: three rows of ten on the console's face (rare, epic, prismatic)
    const geo = new THREE.BoxGeometry(0.055, 0.045, 0.02);
    const side = new THREE.Vector3(front.z, 0, -front.x);
    [2, 3, 4].forEach((tier, row) => {
      for (let i = 0; i < 10; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1a1216, toneMapped: false }));
        m.position.copy(pos).addScaledVector(front, 0.315).addScaledVector(side, (i - 4.5) * 0.075); m.position.y = pos.y + 0.42 + row * 0.2;
        m.rotation.y = yaw; g.scene.add(m);
        this.tithe.lamps.push({ m, tier, i, on: false });
      }
    });
    this.tithe.slotMat = new THREE.MeshBasicMaterial({ color: 0x6a4cff, toneMapped: false });
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.05), this.tithe.slotMat);
    slot.position.copy(this.tithe.slot).addScaledVector(front, 0.05); slot.rotation.y = yaw; g.scene.add(slot);
    this.pips();
  }

  /** How many pulls since the last of each tier or better (what the pity counts). */
  since() {
    const L = this.game.ledger, n = L.get('tithe.pulls');
    return { rare: n - (L.best('tithe.last.rare') || 0), epic: n - (L.best('tithe.last.epic') || 0), prismatic: n - (L.best('tithe.last.prismatic') || 0) };
  }

  /** The lamps: each row is a counter toward its guarantee, lit in its tier's colour. */
  pips() {
    const t = this.tithe; if (!t) return;
    const s = this.since();
    for (const l of t.lamps) {
      const key = l.tier === 2 ? 'rare' : l.tier === 3 ? 'epic' : 'prismatic';
      const need = TITHE.pity[key], on = (l.i + 1) <= Math.floor((s[key] / need) * 10 + 1e-6) || (s[key] + 1 >= need);
      if (on !== l.on || l.fresh) { l.on = on; l.fresh = false; l.m.material.color.set(on ? TIERS[l.tier].rgb : 0x1a1216); }
    }
  }

  /** Pay (already taken) and roll: a sealed chest of a tier nobody can see falls onto the dais. */
  summon() {
    const g = this.game, L = g.ledger;
    const tier = rollTier(this.since());
    const n = L.get('tithe.pulls') + 1;
    L.inc('tithe.pulls'); L.inc(`tithe.tier.${TIERS[tier].id}`);
    if (tier >= 2) L.hi('tithe.last.rare', n);
    if (tier >= 3) L.hi('tithe.last.epic', n);
    if (tier >= 4) L.hi('tithe.last.prismatic', n);
    const d = this.tithe.dais;
    const c = this.spawn(tier, d.clone(), { yaw: Math.PI, sealed: true, fall: true, floor: d.y, from: 'tithe' });
    g.events.emit('tithe.pull', { tier, n });
    this.pips();
    return c;
  }

  // ---------------------------------------------------------------- rings of light
  ringBurst(pos, color, radius, life, flat) {
    const m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.position.copy(pos); m.renderOrder = 6;
    if (flat) m.rotation.x = -Math.PI / 2;
    this.game.scene.add(m);
    this.rings.push({ m, age: 0, life, radius, flat });
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.game, P = g.player;
    this.t += dt;
    if (this.cur) this.cur.frame(dt);
    this.rave?.update(); // (after the ceremony: the show has the last word on the light)
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i], rig = c.rig, root = rig.root.position;
      const near = Math.abs(root.x - P.pos.x) < 45 && Math.abs(root.z - P.pos.z) < 45 && Math.abs(root.y - P.pos.y) < 30;
      if (c.state === 'falling') {
        const f = c.fall; f.v -= 26 * dt; f.y += f.v * dt;
        if (f.y <= c.baseY) { f.y = c.baseY; c.state = 'closed'; c.fall = null; this.collider(c); this.land(c); }
        root.y = f.y;
      }
      if (near || c.busy) rig.update(dt, this.t, true, g.camera.position.distanceTo(root)); else rig.update(dt, this.t, false);
      if (c.state === 'open' && c.respawn && !c.busy && this.t - c.openedAt > c.respawn) this.reopen(c);
      else if (c.state === 'open' && !c.respawn && !c.busy && (c.from === 'tithe' ? 7 : c.from === 'catch' ? 90 : 0) && this.t - c.openedAt > (c.from === 'tithe' ? 7 : 90)) this.remove(c);
    }
    if (this.t - (this.pipT || 0) > 1) { this.pipT = this.t; this.pips(); }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.age += dt;
      const k = r.age / r.life;
      if (k >= 1) { g.scene.remove(r.m); r.m.material.dispose(); this.rings.splice(i, 1); continue; }
      r.m.scale.setScalar(Math.max(0.05, r.radius * easeOut(k)));
      r.m.material.opacity = Math.pow(1 - k, 1.4);
      if (!r.flat) r.m.quaternion.copy(g.camera.quaternion);
    }
    if (this.tithe) { const s = this.tithe.slotMat; s.color.setHex(this.tithe.pay > 0 ? 0xffffff : 0x6a4cff).multiplyScalar(0.7 + 0.3 * Math.sin(this.t * 2)); this.tithe.pay = Math.max(0, (this.tithe.pay || 0) - dt * 3); }
  }

  /** A chest lands: the thump, a ring, the dust, the room feels it. */
  land(c) {
    const g = this.game, rig = c.rig, S = rig.scale;
    rig.poke({ squash: -14, lid: 4 });
    sfx.chestLand?.(S);
    this.ringBurst(_a.copy(rig.root.position).setY(c.floor + 0.05), c.sealed ? 0xfff0e6 : TIERS[c.tier].rgb, 2.6, 0.6, true);
    g.fx.impact?.(_a.copy(rig.root.position).setY(c.floor), _up, { sparks: 8, dust: 14 });
    const d = g.player.pos.distanceTo(rig.root.position);
    g.player.shake = Math.max(g.player.shake, 0.4 / (1 + d * 0.25));
    g.events.emit('chest.land', { tier: c.tier, sealed: c.sealed });
  }

  /** Room reset (T): the chests that were dropped from the sky go; placed ones stay as they are. */
  reset() {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i];
      if ((c.from === 'catch' || c.from === 'tithe') && !c.busy) this.remove(c, false);
    }
  }
}

// =======================================================================================
// THE TITHE (an act): the Courier feeds the console; cubes go into the slot; a sealed chest falls onto the dais
// =======================================================================================
class TitheAct {
  constructor(game, chests) {
    this.g = game; this.chests = chests;
    const t = chests.tithe;
    this.t = 0; this.done = false; this.paid = false; this.summoned = false;
    this.mark = t.mark.clone(); this.yaw = Math.atan2(-t.front.x, -t.front.z);
    this.clip = 'interact'; this.clipT = 0;
    this.pos = t.pos.clone(); this.dais = t.dais.clone();
    this.cam = new THREE.Vector3(); this.look = new THREE.Vector3();
    chests.cur = this;
    this.holdCubes = false;
  }
  fixed(dt) {
    const P = this.g.player, m = this.mark;
    const dx = m.x - P.pos.x, dz = m.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.03) { const v = Math.min(5, d * 9); P.vel.set(dx / d * v, -2, dz / d * v); } else P.vel.set(0, -2, 0);
    P.move(dt);
    return !this.done;
  }
  pose(ch, base, w) { const C = ch.clips; C.blend(base, C.sample('interact', Math.min(this.clipT * 0.85, 1.05), ch.P.tmp, false), w); }
  frame(dt) {
    const g = this.g, chests = this.chests, t = chests.tithe;
    this.t += dt; this.clipT += dt;
    // the shot: from the side, at the console and the dais
    _a.copy(t.pos).lerp(this.dais, 0.5); _a.y = t.pos.y + 0.8;
    const side = _b.set(t.front.z, 0, -t.front.x);
    this.cam.copy(_a).addScaledVector(t.front, 4.6).addScaledVector(side, -3.2); this.cam.y = t.pos.y + 1.9;
    this.look.copy(_a); this.look.y = t.pos.y + 0.9;
    g.cinema.shot('tithe', { pos: this.cam, look: this.look, fov: -6, bars: 0.6, ease: 3 });
    if (this.t > 0.45 && !this.paid) {
      this.paid = true;
      g.cubes.spend(TITHE.cost, 'tithe');
      sfx.tithe();
      t.pay = 1;
      // the cubes go into the slot: a stream of dark specks with a film on them
      for (let i = 0; i < 30; i++) {
        const from = _a.copy(g.player.renderPos).setY(g.player.renderPos.y + 1.1 + Math.random() * 0.3);
        const dir = _b.copy(t.slot).sub(from);
        g.fx.add.emit({ pos: from, vel: dir.multiplyScalar(2.2 + Math.random()).add({ x: (Math.random() - 0.5) * 0.4, y: 0.6, z: (Math.random() - 0.5) * 0.4 }), life: 0.42, size: 0.05, sizeEnd: 0.01, color: new THREE.Color().setHSL(0.72 + Math.random() * 0.2, 0.9, 0.5), drag: 0.5, twinkle: 20, floor: -100 });
      }
    }
    if (this.t > 1.05 && !this.summoned) {
      this.summoned = true;
      chests.summon();
    }
    if (this.t > 2.6) this.done = true;
  }
  finish() { this.g.cinema.unshot('tithe'); if (this.chests.cur === this) this.chests.cur = null; }
  abort() { this.done = true; }
}

// =======================================================================================
// THE TECHNIQUE: F on a chest (or the console) hands the body to a script, and gives it back
// =======================================================================================
export class ChestTech extends Tech {
  constructor(mgr) {
    super(mgr, 'chests');
    this.cer = null;
    this.blendIn = 20;
  }
  get enabled() { return true; }
  usable() { return true; }
  get overrides() { return this.cer ? 1 : 0; }
  get handsBusy() { return true; }
  label() { return 'TREASURE'; }
  canStart() {
    const P = this.P, g = this.game;
    if (!g.chests || !P.peekLatch('KeyF') || !P.grounded || P.mantle || P.sliding || P.wallrun) return false;
    if (g.techs.get('carry')?.item || g.god?.controlling) return false;
    const tgt = g.chests.find();
    if (!tgt) return false;
    if (tgt.kind === 'tithe') {
      // (a refusal at the point of use: said once, by the log)
      if (g.cubes.balance < TITHE.cost) { P.latch('KeyF'); g.log.say('warn', `You need ${TITHE.cost} Lachryma cubes for the Tithe.`, { key: 'tithe.poor', throttle: 3 }); return false; }
      if (g.chests.daisChest()) { P.latch('KeyF'); g.log.say('warn', 'A sealed chest already waits on the dais.', { key: 'tithe.busy', throttle: 3 }); return false; }
    }
    this.tgt = tgt;
    return true;
  }
  start() {
    const P = this.P, g = this.game;
    P.latch('KeyF'); P.endCore(); P.vel.set(0, 0, 0);
    const so = g.techs.get('sondelass'); if (so && so.drawTarget) so.drawTarget = 0; // (the tool is put away for it)
    this.cer = g.chests.begin(this.tgt);
  }
  update(dt) {
    const c = this.cer; if (!c) return false;
    try { return c.fixed(dt); } catch (e) { console.error(e); c.abort(); return false; }
  }
  end() { const c = this.cer; this.cer = null; try { c?.finish(); } catch (e) { console.error(e); } }
  animate(ch, base) { this.cer?.pose(ch, base, this.w); }
  faceYaw() { return this.cer ? this.cer.yaw : null; }
}
