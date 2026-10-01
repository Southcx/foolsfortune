// ---------------------------------------------------------------------------------------
// CEREMONY: what happens between pressing F on a chest and walking away from it. The opening is a script of beats, each one an idea
// from the loot-box and gacha canon, and every beat is louder than the tier below it:
//
//   APPROACH   the camera cuts to a low, close, three-quarter view and the bars come in; the chest notices you (a crouch, a knock).
//   CHARGE     the chest rattles harder and faster (knocks that tighten), light leaks from the seam, a beam of light stands on it
//              and the room dims; the riser climbs. A SEALED chest (the Tithe's) does not yet know what it is: its beam rolls
//              through the five colours, slowing, ticking, and sometimes climbing past what it will land on (the near miss) or
//              climbing to it in stumbles (the upgrade); it lands on its true colour and only then changes into that chest.
//   BURST      one frame of nothing (hit-stop), a last squash, and then the lid is thrown off its hinge, the body stretches, the light
//              flashes, a ring goes out, stars and confetti fly, the camera punches in and the world runs slow for a moment.
//   FOUNTAIN   the cubes come out a few at a time (each with a pop that climbs in pitch), bounce, and pile.
//   REVEAL     a curio (some of the time; always, at the top) rises out of the chest and is held up in a beam, spinning, in a close
//              shot. It goes to her as a card, loose until the Book is opened (veritome/book.js); one the Book cannot
//              hold is condensed into cubes in front of you.
//   SETTLE     the bars go, the camera comes back, and the cubes on the floor are drawn to you in a run whose pitch climbs.
//
// Prior art, from the loot-box and gacha canon:
//  - The colour tease and the near miss: the colour of the light or the orb before the reveal (Fire Emblem Heroes' summon orbs,
//    Genshin's meteor, Overwatch's box light), the slowing roulette (slot machines and pachinko, where the near miss is the most
//    studied device in the trade), and the pity counter (soft and hard guarantees, from Japanese mobile gacha).
//  - "Juice it or lose it" (Jonasson & Purho): squash and stretch, anticipation, a beat of held time on the hit, a shake, an
//    overshoot; nothing happens without a sound and a movement to go with it. Vlambeer's "the art of screenshake" for the hit-stop.
//  - Overwatch's loot boxes: the box opens and the items pop out in a fan, each with its own rarity beam; Diablo's gold and Borderlands'
//    cash: a fountain you then walk through, and the sound of taking them climbs.
//  - The camera language of a reveal: cut close, hold, push in on the pay-off, and pull back to show the size of the pile.
// None of it says a word: the light, the movement and the sound do it, and the log (tracking.js) writes the sentence.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from './physics.js';
import { sfx } from './audio.js';
import { TIERS, CURIOS, CURIO_BY_ID, curiosOf, cubesIn } from './treasure.js';
import { CHEST } from './chestmodel.js';
import { buildCurio } from './curiomodel.js';

const D = THREE.MathUtils.damp, lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const easeBack = (x) => { x = clamp(x, 0, 1); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _c2 = new THREE.Vector3();

// what each tier's opening asks for (seconds; game time unless noted)
const PLAN = [
  { charge: 0.8,  dim: 0,    hit: 0.05, fountain: 0.9, spark: 26,  rings: 1, stars: 1, slow: 0,   curio: 1.5, shake: 0.35, punch: 8 },
  { charge: 1.15, dim: 0.12, hit: 0.07, fountain: 1.2, spark: 52,  rings: 2, stars: 2, slow: 0.3, curio: 1.7, shake: 0.42, punch: 10 },
  { charge: 1.6,  dim: 0.3,  hit: 0.10, fountain: 1.5, spark: 92,  rings: 3, stars: 3, slow: 0.5, curio: 1.9, shake: 0.5,  punch: 12 },
  { charge: 2.2,  dim: 0.55, hit: 0.13, fountain: 1.9, spark: 150, rings: 4, stars: 5, slow: 0.7, curio: 2.2, shake: 0.6,  punch: 14 },
  { charge: 2.9,  dim: 0.6,  hit: 0.16, fountain: 2.6, spark: 230, rings: 5, stars: 7, slow: 0.2,  curio: 2.4, shake: 0.7, punch: 16 },
];
const DUPE_VALUE = [12, 35, 100, 280, 900];

/** The roulette's colours, in order, for a sealed chest that will turn out to be tier T (a list of tier indices). */
export function rouletteSeq(T, rnd = Math.random) {
  const kind = T >= 3 ? 'climb' : rnd() < 0.42 ? 'near' : 'plain';
  const peak = kind === 'near' ? Math.min(4, T + 1 + (rnd() < 0.25 ? 1 : 0)) : T;
  const seq = [0]; let cur = 0;
  while (cur < peak) { cur++; seq.push(cur); if (cur < peak && rnd() < 0.34) { cur--; seq.push(cur); } }
  if (kind === 'near') seq.push(T);
  return { seq, kind };
}

export class Ceremony {
  constructor(game, chests, chest) {
    this.g = game; this.chests = chests; this.chest = chest;
    this.T = chest.tier; this.plan = PLAN[this.T]; this.sealed = !!chest.sealed;
    const rig = chest.rig, s = rig.scale, y = chest.yaw;
    this.front = new THREE.Vector3(Math.sin(y), 0, Math.cos(y));
    this.side = new THREE.Vector3(this.front.z, 0, -this.front.x);
    this.c = new THREE.Vector3().copy(rig.root.position); this.c.y += 0.38 * s;                     // (the middle of the chest)
    this.base = rig.root.position.y;
    this.mark = new THREE.Vector3().copy(rig.root.position).addScaledVector(this.front, 0.8 * s + 0.28); this.mark.y = chest.floor;
    this.yaw = Math.atan2(-this.front.x, -this.front.z);
    this.t = 0; this.pt = 0; this.phase = 'approach'; this.done = false; this.skipped = false;
    this.clip = 'interact'; this.clipT = 0; this.burstT = -1;
    // what is inside is decided now (and only shown at the end)
    this.worth = cubesIn(this.T);
    this.count = clamp(Math.round(this.worth / 3.2), 6, 150);
    const owned = (id) => game.ledger.get(`curio.${id}`) > 0;
    this.curioId = null;
    if (Math.random() < TIERS[this.T].curioP) {
      const pool = curiosOf(this.T), fresh = pool.filter((c) => !owned(c.id));
      const list = fresh.length && Math.random() < 0.85 ? fresh : pool; // (a little help toward the ones you lack)
      this.curioId = list[Math.floor(Math.random() * list.length)].id;
    }
    // (a copy the Book cannot take, at its limit or with no free slot, is condensed into cubes on the spot)
    const book = game.veritome?.book;
    this.dupe = !!this.curioId && (book ? !book.canTake(`curio.${this.curioId}`) : owned(this.curioId));
    // the roulette (a sealed chest only)
    this.rl = this.sealed ? rouletteSeq(this.T) : null;
    if (this.rl) {
      let at = 0; this.steps = this.rl.seq.map((tier, i) => { const d = 0.19 + 0.052 * i; const st = { tier, t0: at, d }; at += d; return st; });
      this.steps[this.steps.length - 1].d = 0.85 + (this.T >= 3 ? 0.4 : 0); at = this.steps[this.steps.length - 1].t0 + this.steps[this.steps.length - 1].d;
      this.chargeLen = Math.max(1.5, at);
      this.stepI = -1;
    } else this.chargeLen = this.plan.charge;
    this.knockT = 0.3; this.starT = 0.2; this.sparkT = 0;
    this.camp = null; this.curio = null; this.holdT = 0;
    this.light = chests.light; this.beam = chests.beam;
    this.glowColor = new THREE.Color(rig.glowColor);
    this.lookY = 0.38; this.riseK = 0;
    // begin
    chests.cur = this; chest.busy = true; rig.busy = true;
    game.mood.free('chest');
    sfx.chestKnock(0);
    rig.poke({ squash: -5, lid: 1.5 });
    rig.setGlow(0.12);
    game.events.emit('chest.start', { tier: this.T, sealed: this.sealed });
    // the camera starts from where the player's is and settles into the shot
    this.cam = { dist: 3.8, h: 1.4, phi: 1.0, look: 0.4, fov: 0, roll: 0 };
    this.shot();
  }

  get holdCubes() { return this.phase !== 'settle' && this.phase !== 'end'; }

  // ---------------------------------------------------------------- the fixed step: the Courier holds her mark
  fixed(dt) {
    const P = this.g.player, m = this.mark;
    const dx = m.x - P.pos.x, dz = m.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.03) { const v = Math.min(5, d * 9); P.vel.set(dx / d * v, -2, dz / d * v); } else P.vel.set(0, -2, 0);
    P.move(dt);
    return !this.done;
  }
  /** The pose: which clip, and how far into it. */
  pose(ch, base, w) {
    const C = ch.clips;
    let name = this.clip, t = this.clipT;
    if (name === 'interact') t = Math.min(t * 0.85, 1.05);
    else if (name === 'hitChest') t = Math.min(t, 0.32);
    else if (name === 'idle') t = t % 2.5;
    C.blend(base, C.sample(name, t, ch.P.tmp, false), w);
  }

  // ---------------------------------------------------------------- the camera: a place, and a point to look at (eased in real seconds)
  shot(rate = 3) {
    const g = this.g, c = this.cam;
    _a.copy(this.c).addScaledVector(this.front, c.dist * Math.cos(c.phi)).addScaledVector(this.side, c.dist * Math.sin(c.phi)); _a.y = this.base + c.h;
    _b.copy(this.c); _b.y = this.base + c.look;
    // (never through a wall)
    const dir = _c2.subVectors(_a, _b), len = dir.length(); dir.divideScalar(len || 1);
    const hit = g.physics.raycast(_b, dir, len + 0.25, this.chest.col, GROUPS.controllerQuery);
    if (hit) _a.copy(_b).addScaledVector(dir, Math.max(0.7, hit.distance - 0.25));
    g.cinema.shot('chest', { pos: _a, look: _b, fov: c.fov, roll: c.roll, bars: 1, ease: rate });
  }
  aim(dist, h, phi, look, fov, rate = 3.5) {
    const c = this.cam, raw = this.g.rawDt || 0.016;
    c.dist = D(c.dist, dist, rate, raw); c.h = D(c.h, h, rate, raw); c.phi = D(c.phi, phi, rate, raw); c.look = D(c.look, look, rate, raw); c.fov = D(c.fov, fov, rate * 1.2, raw);
  }

  // ---------------------------------------------------------------- per frame
  frame(dt) {
    const g = this.g, raw = g.rawDt || dt;
    this.t += dt; this.pt += dt; this.clipT += dt;
    const rig = this.chest.rig;
    this.chest.rig.busy = true;
    // the skip: after the burst, F / space / click hurries the rest
    if (this.burstT >= 0 && this.t - this.burstT > 0.6 && !this.skipped) {
      const P = g.player;
      if (P.latch('KeyF') || P.latch('Space') || P.latch('Mouse0')) this.skip();
    }
    if (this.t > 40) { this.phase = 'settle'; this.pt = 0; }   // (a watchdog: nothing here should last)
    const at = this[`p_${this.phase}`];
    if (at) at.call(this, dt, raw);
    this.shot(this.phase === 'burst' || this.phase === 'fountain' ? 6 : 3);
    // the light of the ceremony
    this.light.position.copy(this.c); this.light.position.y += 0.8;
    this.beam.place(_a.copy(this.chest.rig.root.position));
  }

  // ---- APPROACH
  p_approach(dt) {
    this.aim(3.3, 1.2, 1.0, 0.45, -4, 3);
    const P = this.g.player;
    const near = Math.hypot(P.pos.x - this.mark.x, P.pos.z - this.mark.z) < 0.14;
    if (this.pt > 0.42 || (near && this.pt > 0.25)) this.enter('charge');
  }

  // ---- CHARGE: knocks that tighten, light that leaks, a beam that rises
  p_charge(dt) {
    const g = this.g, rig = this.chest.rig, T = this.sealed ? 1 : this.T, k = clamp(this.pt / this.chargeLen, 0, 1), kk = Math.pow(k, 1.4); // (a sealed chest tells nothing: the same light and the same dark whatever it is)
    const dim = this.sealed ? 0.36 : PLAN[T].dim;
    // colour: the tier's own, or (sealed) the roulette's colour of the moment
    let col = this.tierColor(T);
    if (this.sealed) {
      let i = this.steps.length - 1; while (i > 0 && this.pt < this.steps[i].t0) i--;
      if (i !== this.stepI) { this.stepI = i; const st = this.steps[i]; sfx.chestTick(st.tier); g.player.shake = Math.max(g.player.shake, 0.06); rig.poke({ squash: -3 - st.tier, lid: 2 }); this.stepColor = this.tierColor(st.tier); this.stepPulse = 1; }
      col = this.stepColor || col;
      this.stepPulse = Math.max(0, (this.stepPulse || 0) - dt * 4);
    }
    this.glowColor.lerp(col, 1 - Math.exp(-dt * 16));
    rig.setColor(this.glowColor);
    rig.setGlow(0.12 + 0.85 * kk);
    // the knocks
    this.knockT -= dt;
    if (this.knockT <= 0) {
      this.knockT = lerp(0.34, 0.07, kk);
      sfx.chestKnock(k); rig.poke({ squash: -2.5 - 4 * k, lid: 2.5 + 7 * k, hop: k > 0.55 && Math.random() < 0.5 ? 0.9 + 1.6 * k : 0 });
      g.player.shake = Math.max(g.player.shake, 0.03 + 0.1 * k);
    }
    // the beam, the light, the room
    const w = 0.5 + 0.9 * kk + (this.stepPulse || 0) * 0.25;
    this.beam.set(this.glowColor.getHex(), this.sealed ? 0.62 + 0.3 * kk : 0.22 + 0.5 * kk + (this.stepPulse || 0) * 0.15, w);
    this.light.color.copy(this.glowColor);
    this.light.intensity = (5 + 4 * T) * (0.15 + kk) * (1 + (this.stepPulse || 0) * 0.5);
    if (dim > 0) g.mood.set('chest', { dim: dim * kk, tint: this.glowColor.getHex(), tintK: 0.05 * kk, ease: 3 });
    // the camera closes in, and lowers
    this.aim(lerp(3.3, 2.5, easeOut(k)), lerp(1.2, 0.75, k), lerp(1.0, 0.92, k), 0.45, -4 - 9 * k, 3.2);
    this.cam.roll = D(this.cam.roll, Math.sin(this.pt * 27) * 0.006 * kk, 20, g.rawDt || dt);
    if (this.pt >= this.chargeLen) this.enter('burst');
  }

  tierColor(i) { return i === 4 ? _c.setHSL((this.t * 0.9) % 1, 0.9, 0.62).clone() : new THREE.Color(TIERS[i].rgb); }

  // ---- BURST: a beat of nothing, a last squash, and the lid goes
  p_burst(dt) {
    // (the freeze is `time.pulse`'s: game time barely moves, so these timers sit through it)
    this.aim(2.35, 0.8, 0.95, 0.55, -10, 8);
    if (this.pt >= 0.06 && !this.opened) this.openNow();
    if (this.opened && this.pt > 0.2 + 0.06) this.enter('fountain');
  }

  openNow() {
    const g = this.g, chests = this.chests, chest = this.chest, T = this.T, P = g.player, plan = this.plan;
    this.opened = true;
    if (this.sealed) chests.swapRig(chest, T);
    const rig = chest.rig; rig.busy = true;
    const S = rig.scale, top = _a.copy(this.c); top.y = rig.root.position.y + 0.62 * S;
    const topV = top.clone();
    chest.state = 'open';
    rig.setOpen(true); rig.mound.visible = false;
    rig.poke({ lid: 24, squash: 18, hop: 3.4 + T * 0.8 });
    rig.setGlow(1);
    this.glowColor.set(TIERS[T].rgb); rig.setColor(TIERS[T].glow);
    // light, ring, beam
    this.light.color.set(TIERS[T].rgb); this.light.intensity = 45 + 25 * T; this.flash = 1;
    this.beam.set(T === 4 ? null : TIERS[T].rgb, 0.85, 1.3);
    chests.ringBurst(topV, TIERS[T].rgb, 2.6 + T * 0.9, 0.55, true);
    for (let i = 1; i < plan.rings; i++) this.later(i * 0.11, () => chests.ringBurst(topV, T === 4 ? _c.setHSL(Math.random(), 0.9, 0.65).getHex() : TIERS[T].rgb, 2.2 + i * 1.3, 0.6, i % 2 === 0));
    g.glyphs.pop('star', topV.clone().addScaledVector(this.front, 0.2), { color: T === 4 ? 0xffffff : TIERS[T].rgb, size: 0.7 + 0.1 * T, burst: true, ring: true, life: T === 4 ? 0.8 : 1.1 });
    // confetti, sparks
    for (let i = 0; i < plan.spark; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random(), sp = 1.5 + Math.random() * (4 + T * 1.2);
      const v = new THREE.Vector3(Math.cos(a) * sp * 0.6, 3.5 + u * (5 + T), Math.sin(a) * sp * 0.6);
      const color = T === 4 ? new THREE.Color().setHSL(Math.random(), 0.9, 0.62) : new THREE.Color(TIERS[T].rgb).lerp(new THREE.Color(0xffffff), Math.random() * 0.5);
      g.fx.add.emit({ pos: topV, vel: v, life: 1.1 + Math.random() * 1.4, size: 0.05 + Math.random() * 0.06, sizeEnd: 0.012, color, alpha: 1, drag: 0.7, gravity: 7, twinkle: 12 + Math.random() * 14, floor: chest.floor });
    }
    // the cubes: a fountain that lasts as long as the tier deserves
    g.cubes.burst(topV, this.worth, { count: this.count, up: 5.2 + T * 0.5, spread: 1.05 + T * 0.14, stagger: plan.fountain * 0.7, from: 'chest' });
    // the world: sound, shake, lens, held breath
    sfx.chestBurst(T);
    P.shake = Math.max(P.shake, plan.shake); P.fovPunch = Math.max(P.fovPunch || 0, plan.punch);
    g.time.pulse('chest', 0.02, plan.hit, { release: 0.3 });
    this.cam.dist = 2.15; this.cam.fov = -14;
    this.clip = 'hitChest'; this.clipT = 0; this.burstT = this.t;
    g.events.emit('chest.open', { tier: T, sealed: this.sealed, cubes: this.worth, curio: this.curioId, dupe: this.dupe, kind: this.rl?.kind ?? null, id: chest.id });
    if (T === 4) chests.rave?.start(this);
  }

  // ---- FOUNTAIN
  p_fountain(dt, raw) {
    const g = this.g, T = this.T, plan = this.plan, rig = this.chest.rig, k = clamp(this.pt / plan.fountain, 0, 1);
    if (this.clip === 'hitChest' && this.clipT > 0.34) { this.clip = 'idle'; this.clipT = 0; }
    // slow motion for the first moments (a longer one for the better tiers)
    if (plan.slow > 0) { const s = 1 - plan.slow * 0.55 * (1 - clamp(this.pt / 0.9, 0, 1)); if (this.pt < 0.9) g.time.slow('chest', s); else g.time.free('chest'); }
    // the light dies back, the beam thins
    this.flash = Math.max(0, (this.flash ?? 0) - dt * 3.2);
    this.light.intensity = (45 + 25 * T) * this.flash * this.flash;
    this.beam.set(T === 4 ? null : TIERS[T].rgb, 0.7 * (1 - k) + 0.2, 1.6 - 0.9 * k);
    rig.setGlow(lerp(1, 0.4, k));
    if (this.plan.dim > 0 && !this.chests.rave?.active) g.mood.set('chest', { dim: plan.dim * lerp(1, 0.4, k), tint: TIERS[T].rgb, tintK: 0.04, ease: 2 });
    // stars, thrown up now and then
    this.starT -= dt;
    if (this.starT <= 0 && this.pt < plan.fountain * 0.85) {
      this.starT = plan.fountain / (plan.stars + 1) * (0.6 + Math.random() * 0.8);
      g.glyphs.pop('star', _a.copy(this.c).add(_b.set((Math.random() - 0.5) * 1.6, 0.9 + Math.random() * 0.9, (Math.random() - 0.5) * 1.6)), { color: T === 4 ? _c.setHSL(Math.random(), 0.9, 0.65).getHex() : TIERS[T].rgb, size: 0.25 + Math.random() * 0.2, burst: Math.random() < 0.5, life: 1.0 });
    }
    // the camera draws back to show the size of the pile, and turns a little
    if (!this.chests.rave?.active) this.aim(lerp(2.35, 3.9, easeOut(k)), lerp(0.8, 1.9, easeOut(k)), 0.95 + 0.1 * this.pt, 0.55, -3, 2.6);
    // the curio comes up while the cubes are still falling
    if (this.curioId && !this.curio && this.pt > 0.7) this.spawnCurio();
    if (this.pt >= plan.fountain) this.enter(this.curio ? 'reveal' : 'settle');
  }

  // ---- REVEAL: the curio, held up
  spawnCurio() {
    const g = this.g, T = this.T;
    this.curio = buildCurio(this.curioId, { sky: g.sky.env });
    g.scene.add(this.curio.group);
    this.curioK = 0; this.curioT = 0;
    this.curioHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: TIERS[T].rgb, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    this.curioHalo.renderOrder = 7; g.scene.add(this.curioHalo);
    sfx.curioReveal(T);
    g.glyphs.pop('star', _a.copy(this.c).add(_b.set(0, 1.5, 0)), { color: 0xffffff, size: 0.55, burst: true, ring: true, life: 1.0 });
    this.curioBase = new THREE.Vector3().copy(this.c).setY(this.chest.rig.root.position.y + 0.6);
    this.curioAt = new THREE.Vector3().copy(this.c).setY(this.chest.rig.root.position.y + 1.85);
    this.curio.group.position.copy(this.curioBase);
  }

  curioUpdate(dt) {
    if (!this.curio) return;
    const c = this.curio, T = this.T;
    this.curioT += dt;
    const u = clamp(this.curioT / 0.7, 0, 1);
    const p = c.group.position;
    if (this.phase === 'collect') {
      const P = this.g.player, to = _a.copy(P.renderPos).setY(P.renderPos.y + 1.1);
      this.collectT += dt; const k = clamp(this.collectT / 0.5, 0, 1), e = k * k;
      p.lerpVectors(this.collectFrom, to, e);
      const s = 1 - 0.85 * e; c.group.scale.setScalar(this.curioScale * s * (1 + 0.5 * Math.sin(k * Math.PI)));
    } else {
      p.lerpVectors(this.curioBase, this.curioAt, easeBack(u));
      p.y += Math.sin(this.curioT * 2) * 0.05 * u;
      // squash and stretch as it comes up: tall while rising, then a wobble as it settles
      const sq = 1 + 0.35 * Math.sin(u * Math.PI) * (1 - u * 0.4) + 0.08 * Math.sin(this.curioT * 16) * Math.max(0, 1 - this.curioT / 1.1);
      c.group.scale.set(this.curioScale / Math.sqrt(sq), this.curioScale * sq, this.curioScale / Math.sqrt(sq));
      c.group.scale.multiplyScalar(u < 1 ? easeBack(u) * 1.0 + 0.0 : 1);
    }
    c.group.rotation.y += dt * 2.3;
    c.update(this.curioT, dt);
    // its light: a halo behind it, and a thin beam under it
    const h = this.curioHalo; h.position.copy(p); h.scale.setScalar(1.4 + 0.15 * Math.sin(this.curioT * 3)); h.material.opacity = 0.55 * (this.phase === 'collect' ? 1 - this.collectT * 2 : easeOut(u));
    if (this.phase === 'reveal') {
      this.beam.set(T === 4 ? null : TIERS[T].rgb, 0.6, 0.55);
      if (Math.random() < dt * 30) {
        const a = Math.random() * Math.PI * 2, r = 0.32 + Math.random() * 0.1;
        this.g.fx.add.emit({ pos: _b.set(p.x + Math.cos(a) * r, p.y - 0.1 + Math.random() * 0.25, p.z + Math.sin(a) * r), vel: _a.set(-Math.sin(a) * 1.3, 0.5, Math.cos(a) * 1.3), life: 0.9, size: 0.03, sizeEnd: 0.006, color: T === 4 ? _c.setHSL(Math.random(), 0.9, 0.65).clone() : new THREE.Color(TIERS[T].rgb), drag: 0.4, twinkle: 20, floor: -100 });
      }
    }
  }
  get curioScale() { return 1.0; }

  p_reveal(dt, raw) {
    const g = this.g, T = this.T;
    if (!this.curio) { this.enter('settle'); return; }
    this.curioUpdate(dt);
    const p = this.curio.group.position;
    if (!this.chests.rave?.active) {
      // a close, slightly low shot on what it is holding
      const c = this.cam;
      c.look = D(c.look, p.y - this.chest.rig.root.position.y, 5, raw);
      this.aim(2.7, p.y - this.chest.rig.root.position.y - 0.25, 0.95, p.y - this.chest.rig.root.position.y, -9, 3.5);
    }
    this.light.intensity = D(this.light.intensity, 4 + 3 * T, 4, raw);
    this.holdT += dt;
    if (this.holdT > this.plan.curio || (this.skipped && this.holdT > 0.35)) this.enter('collect');
  }

  // ---- COLLECT: it goes to her as a card, loose until she opens the Book (or, if the Book cannot hold another, it is condensed into
  //      cubes on the spot)
  p_collect(dt) {
    const g = this.g;
    this.curioUpdate(dt);
    if (this.collectT >= 0.5 || this.dupe) {
      const at = this.curio.group.position.clone();
      g.fx.absorbSparkle?.(at);
      g.glyphs.pop('star', at, { color: TIERS[this.T].rgb, size: 0.4, burst: true, life: 0.8 });
      if (this.dupe) { g.cubes.burst(at, DUPE_VALUE[this.T], { count: Math.min(30, 6 + this.T * 6), stagger: 0.4, up: 3.5, from: 'dupe' }); sfx.chestBurst(0); }
      else sfx.cubeGet(9);
      if (!this.dupe) { g.ledger.inc(`curio.${this.curioId}`); g.veritome?.book.out(`curio.${this.curioId}`, 'chest'); } // (found: the ledger's; it comes as a loose card, for the Book)
      g.events.emit('curio.get', { id: this.curioId, tier: this.T, dupe: this.dupe, from: 'chest' });
      this.curio.dispose(); this.curio = null;
      this.curioHalo.parent?.remove(this.curioHalo); this.curioHalo.material.dispose(); this.curioHalo = null;
      this.enter('settle');
    }
  }

  // ---- SETTLE: the camera comes back, and the cubes come to her
  p_settle(dt, raw) {
    const g = this.g;
    if (!this.settled) { this.settled = true; g.cinema.unshot('chest'); if (!this.chests.rave?.active) g.mood.free('chest'); g.time.free('chest'); this.beam.set(null, 0, 1); }
    this.flash = 0; this.light.intensity = D(this.light.intensity, 0, 6, raw);
    this.chest.rig.setGlow(D(this.chest.rig.glow, 0.22, 3, raw));
    if (this.chests.rave?.active) return; // (the show is not over)
    const loose = g.cubes.list.length + g.cubes.queue.length;
    if (this.pt > 0.5 && (loose === 0 || this.pt > 3.2)) this.enter('end');
  }
  p_end() { this.done = true; }

  // ---------------------------------------------------------------- moving between beats
  enter(phase) {
    this.phase = phase; this.pt = 0;
    if (phase === 'charge') {
      this.knockT = 0.15;
      sfx.chestCharge(this.chargeLen, this.sealed ? Math.min(2, Math.max(...this.rl.seq)) : this.T);
      this.stepI = -1; this.stepColor = this.tierColor(this.sealed ? 0 : this.T);
    } else if (phase === 'burst') {
      this.g.time.pulse('chest', 0.02, this.plan.hit * 0.6, { release: 0.2 });
      this.chest.rig.poke({ squash: -16, lid: -3 });
      this.opened = false;
    } else if (phase === 'reveal') { this.holdT = 0; }
    else if (phase === 'collect') { this.collectT = 0; this.collectFrom = this.curio.group.position.clone(); if (this.dupe) this.collectT = 0.5; }
  }

  /** Hurry what is left. */
  skip() {
    if (this.skipped) return;
    this.skipped = true;
    const g = this.g, cubes = g.cubes;
    for (const q of cubes.queue.splice(0)) cubes.spawnOne(q.at, q.vel, q.v, q.spin);
    if (this.phase === 'fountain') this.pt = Math.max(this.pt, this.plan.fountain - 0.05);
    g.time.free('chest');
  }

  later(t, fn) { this.chest.rig.later.push({ t, fn }); }

  // ---------------------------------------------------------------- the end (or an abort): leave nothing behind
  finish() {
    const g = this.g, chest = this.chest;
    g.cinema.unshot('chest'); g.mood.free('chest'); g.time.free('chest');
    this.beam.set(null, 0, 1); this.light.intensity = 0;
    if (this.curio) { this.curio.dispose(); this.curio = null; }
    if (this.curioHalo) { this.curioHalo.parent?.remove(this.curioHalo); this.curioHalo.material.dispose(); this.curioHalo = null; }
    chest.busy = false; chest.rig.busy = false;
    if (this.opened) { chest.state = 'open'; chest.openedAt = this.chests.t; chest.rig.setGlow(0.22); }
    else { chest.state = 'closed'; chest.rig.setGlow(0); chest.rig.setColor(chest.rig.glowColor); }
    if (this.chests.cur === this) this.chests.cur = null;
    this.chests.rave?.stop?.();
  }
  abort() { this.done = true; }
}
